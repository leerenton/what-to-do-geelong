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

// ── Event handlers ────────────────────────────────────────

async function handleCheckoutComplete(session) {
  const meta   = session.metadata || {};
  const type   = meta.type || '';
  const bizId  = meta.biz_id;
  const evId   = meta.event_id;

  console.log('checkout.session.completed', { type, bizId, evId });

  // Gold subscription purchased
  if (type === 'gold_annual' || type === 'gold_monthly') {
    if (!bizId) { console.warn('No biz_id in metadata'); return; }

    const expiresAt = new Date();
    if (type === 'gold_annual') expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    else expiresAt.setMonth(expiresAt.getMonth() + 1);

    // Store Stripe customer + subscription IDs for future portal access
    const stripeCustomerId    = session.customer;
    const stripeSubscriptionId = session.subscription;

    await sbPatch('businesses', `id=eq.${encodeURIComponent(bizId)}`, {
      is_gold:                 true,
      gold_expires_at:         expiresAt.toISOString(),
      stripe_customer_id:      stripeCustomerId,
      stripe_subscription_id:  stripeSubscriptionId,
    });
    console.log(`✅ Gold activated for biz ${bizId}`);
  }

  // One-off promoted event purchased
  if (type === 'event_boost' || type === 'event_spotlight' || type === 'event_premier') {
    const daysMap = { event_boost: 7, event_spotlight: 14, event_premier: 30 };
    const days    = daysMap[type];

    if (!evId) { console.warn('No event_id in metadata'); return; }

    const promotedUntil = new Date();
    promotedUntil.setDate(promotedUntil.getDate() + days);

    await sbPatch('events', `id=eq.${encodeURIComponent(evId)}`, {
      is_promoted:     true,
      promoted_until:  promotedUntil.toISOString(),
      promoted_package: type.replace('event_', ''), // 'boost' | 'spotlight' | 'premier'
    });
    console.log(`✅ Event ${evId} promoted (${type}) until ${promotedUntil.toDateString()}`);
  }
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
