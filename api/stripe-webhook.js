// ── WTDG Stripe Webhook Handler ───────────────────────────
// POST /api/stripe-webhook
// Handles: checkout.session.completed, customer.subscription.deleted
//
// Environment variables required:
//   STRIPE_SECRET_KEY
//   STRIPE_WEBHOOK_SECRET   — whsec_... from Stripe Dashboard
//   SUPABASE_URL
//   SUPABASE_SERVICE_KEY

const https  = require('https');
const crypto = require('crypto');

const STRIPE_KEY      = process.env.STRIPE_SECRET_KEY;
const WEBHOOK_SECRET  = process.env.STRIPE_WEBHOOK_SECRET;
const SUPABASE_URL    = process.env.SUPABASE_URL || 'https://duhxszqyyzrbzrhwneey.supabase.co';
const SUPABASE_KEY    = process.env.SUPABASE_SERVICE_KEY;

// ── Stripe signature verification ────────────────────────
function verifyStripeSignature(payload, sigHeader, secret) {
  const parts     = sigHeader.split(',').reduce((acc, part) => {
    const [k, v] = part.split('=');
    acc[k] = v;
    return acc;
  }, {});
  const timestamp = parts.t;
  const sig       = parts.v1;
  if (!timestamp || !sig) return false;

  const signed   = `${timestamp}.${payload}`;
  const expected = crypto.createHmac('sha256', secret).update(signed, 'utf8').digest('hex');
  // Constant-time compare
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(sig,      'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// ── Supabase REST helpers ─────────────────────────────────
function sbPatch(table, filter, data) {
  const body = JSON.stringify(data);
  const url  = new URL(SUPABASE_URL);
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: url.hostname, port: 443,
      path: `/rest/v1/${table}?${filter}`,
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'Prefer': 'return=minimal',
      },
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function sbGet(table, filter) {
  const url = new URL(SUPABASE_URL);
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: url.hostname, port: 443,
      path: `/rest/v1/${table}?${filter}&limit=1`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
        'Accept': 'application/json',
      },
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, body: [] }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// ── Stripe API helper (for expanding subscription metadata) ─
function stripeGet(path) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.stripe.com', port: 443,
      path,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${STRIPE_KEY}` },
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, body: {} }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// ── Supabase POST helper (for inserts) ───────────────────
function sbPost(table, data) {
  const body = JSON.stringify(data);
  const url  = new URL(SUPABASE_URL);
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: url.hostname, port: 443,
      path: `/rest/v1/${table}`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'Prefer': 'return=minimal',
      },
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

const PACKAGE_DAYS = { boost: 7, spotlight: 14, premier: 30 };
const PROMO_TYPES  = new Set(['boost','spotlight','premier','event_boost','event_spotlight','event_premier']);

// ── Event handlers ────────────────────────────────────────

async function handleCheckoutComplete(session) {
  const meta     = session.metadata || {};
  const type     = meta.type     || '';
  const bizId    = meta.biz_id;
  const userId   = meta.user_id;
  const itemType = meta.item_type || (meta.event_id ? 'event' : null);
  const itemId   = meta.item_id   || meta.event_id;

  console.log('checkout.session.completed', { type, bizId, itemType, itemId });

  // ── Gold subscription purchased ───────────────────────
  if (type === 'gold_annual' || type === 'gold_monthly') {
    if (!bizId) { console.warn('No biz_id in metadata'); return; }

    const expiresAt = new Date();
    if (type === 'gold_annual') expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    else expiresAt.setMonth(expiresAt.getMonth() + 1);

    const credits = type === 'gold_annual' ? 14 : 1;

    await sbPatch('businesses', `id=eq.${encodeURIComponent(bizId)}`, {
      is_gold:                true,
      gold_expires_at:        expiresAt.toISOString(),
      stripe_customer_id:     session.customer,
      stripe_subscription_id: session.subscription,
      credit_balance:         credits, // raw set on first purchase; renew uses increment below
    });

    // Log credits to ledger
    await sbPost('credit_ledger', {
      business_id: bizId,
      amount:      credits,
      reason:      type === 'gold_annual' ? 'gold_annual_signup' : 'gold_monthly_signup',
      ref_id:      session.id,
    });

    console.log(`✅ Gold activated for biz ${bizId}, ${credits} credits granted`);
  }

  // ── Promotion purchased (boost / spotlight / premier) ─
  const baseType = type.replace('event_', ''); // normalise legacy 'event_boost' → 'boost'
  if (PROMO_TYPES.has(type) && bizId) {
    const days      = PACKAGE_DAYS[baseType] || 7;
    const startsAt  = new Date();
    const endsAt    = new Date();
    endsAt.setDate(endsAt.getDate() + days);

    const amountTotal = session.amount_total || 0; // cents

    await sbPost('promotions', {
      business_id:       bizId,
      item_type:         itemType || 'event',
      item_id:           String(itemId || ''),
      package:           baseType,
      status:            'pending',
      starts_at:         startsAt.toISOString(),
      ends_at:           endsAt.toISOString(),
      paid_amount:       amountTotal,
      credits_used:      0,
      stripe_session_id: session.id,
    });

    console.log(`✅ Promotion created (${baseType}) for ${itemType} ${itemId} — pending approval`);
  }
}

// Called when a Gold subscription renews (invoice.payment_succeeded for subscription)
async function handleInvoicePaid(invoice) {
  // Only handle subscription renewals (not the initial signup — that's checkout.session.completed)
  if (!invoice.subscription || invoice.billing_reason !== 'subscription_cycle') return;

  // Find the business by subscription id
  const res = await sbGet('businesses', `stripe_subscription_id=eq.${encodeURIComponent(invoice.subscription)}&select=id,credit_balance`);
  const rows = res.body;
  if (!rows || !rows.length) { console.warn('No biz for subscription', invoice.subscription); return; }
  const biz = rows[0];

  const newBalance = (biz.credit_balance || 0) + 1;
  await sbPatch('businesses', `id=eq.${encodeURIComponent(biz.id)}`, {
    credit_balance: newBalance,
  });
  await sbPost('credit_ledger', {
    business_id: biz.id,
    amount:      1,
    reason:      'gold_monthly_renew',
    ref_id:      invoice.id,
  });
  console.log(`✅ 1 credit granted to biz ${biz.id} on subscription renewal`);
}

async function handleSubscriptionDeleted(subscription) {
  const meta  = subscription.metadata || {};
  const bizId = meta.biz_id;

  if (!bizId) {
    // Try to find biz by stripe_subscription_id
    const res = await sbGet('businesses', `stripe_subscription_id=eq.${subscription.id}&select=id`);
    const biz = (res.body || [])[0];
    if (!biz) { console.warn('No biz found for subscription', subscription.id); return; }
    await sbPatch('businesses', `id=eq.${encodeURIComponent(biz.id)}`, {
      is_gold: false, gold_expires_at: null, stripe_subscription_id: null,
    });
    console.log(`Gold cancelled for biz ${biz.id}`);
    return;
  }

  await sbPatch('businesses', `id=eq.${encodeURIComponent(bizId)}`, {
    is_gold: false, gold_expires_at: null, stripe_subscription_id: null,
  });
  console.log(`Gold cancelled for biz ${bizId}`);
}

// ── Main handler ──────────────────────────────────────────
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // Read raw body for signature verification
  const chunks = [];
  await new Promise(resolve => { req.on('data', c => chunks.push(c)); req.on('end', resolve); });
  const rawBody = Buffer.concat(chunks).toString('utf8');

  // Verify signature
  const sigHeader = req.headers['stripe-signature'];
  if (WEBHOOK_SECRET) {
    if (!sigHeader || !verifyStripeSignature(rawBody, sigHeader, WEBHOOK_SECRET)) {
      console.warn('Invalid Stripe signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }
  }

  let event;
  try { event = JSON.parse(rawBody); }
  catch { return res.status(400).json({ error: 'Invalid JSON' }); }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaid(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      default:
        // Unhandled event type — just acknowledge
        break;
    }
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    return res.status(500).json({ error: err.message });
  }
};
