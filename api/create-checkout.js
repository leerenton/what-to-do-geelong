// ── WTDG Stripe Checkout Session Creator ─────────────────
// POST /api/create-checkout
// Headers: Authorization: Bearer <supabase-jwt>
// Body: { type, bizId, userId, itemType, itemId, successUrl, cancelUrl }
//
// type values:
//   'gold_annual'    → Gold membership $249/yr
//   'gold_monthly'   → Gold membership $25/mo
//   'boost'          → Promotion Boost $49  (7 days)
//   'spotlight'      → Promotion Spotlight $99 (14 days)
//   'premier'        → Promotion Premier $199 (30 days)
//   (legacy: 'event_boost' | 'event_spotlight' | 'event_premier' still supported)
//
// For promotion types also pass: itemType, itemId
//
// Environment variables required:
//   STRIPE_SECRET_KEY
//   SUPABASE_URL
//   SUPABASE_SERVICE_KEY
//   STRIPE_PRICE_GOLD_ANNUAL
//   STRIPE_PRICE_GOLD_MONTHLY
//   STRIPE_PRICE_PROMOTER_ANNUAL
//   STRIPE_PRICE_PROMOTER_MONTHLY
//   STRIPE_PRICE_BOOST
//   STRIPE_PRICE_SPOTLIGHT
//   STRIPE_PRICE_PREMIER
//   SITE_URL

const https = require('https');

const STRIPE_KEY   = process.env.STRIPE_SECRET_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://duhxszqyyzrbzrhwneey.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SITE_URL     = process.env.SITE_URL || 'https://whattodogeelong.com.au';

const PRICE_IDS = {
  gold_annual:       process.env.STRIPE_PRICE_GOLD_ANNUAL,
  gold_monthly:      process.env.STRIPE_PRICE_GOLD_MONTHLY,
  promoter_annual:   process.env.STRIPE_PRICE_PROMOTER_ANNUAL,
  promoter_monthly:  process.env.STRIPE_PRICE_PROMOTER_MONTHLY,
  boost:             process.env.STRIPE_PRICE_BOOST,
  spotlight:         process.env.STRIPE_PRICE_SPOTLIGHT,
  premier:           process.env.STRIPE_PRICE_PREMIER,
  // Legacy aliases
  event_boost:       process.env.STRIPE_PRICE_BOOST,
  event_spotlight:   process.env.STRIPE_PRICE_SPOTLIGHT,
  event_premier:     process.env.STRIPE_PRICE_PREMIER,
};

const PROMOTION_TYPES    = new Set(['boost','spotlight','premier','event_boost','event_spotlight','event_premier']);
const SUBSCRIPTION_TYPES = new Set(['gold_annual', 'gold_monthly', 'promoter_annual', 'promoter_monthly']);

function stripePost(path, params) {
  const body = new URLSearchParams(params).toString();
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.stripe.com',
      port: 443,
      path,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, body: { raw: d } }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Verify Supabase JWT and return user_id, or null
async function getSupabaseUserId(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const jwt = authHeader.slice(7);
  return new Promise((resolve) => {
    const url = new URL(`${SUPABASE_URL}/auth/v1/user`);
    const req = https.request({
      hostname: url.hostname, port: 443,
      path: url.pathname, method: 'GET',
      headers: { 'Authorization': `Bearer ${jwt}`, 'apikey': SUPABASE_KEY },
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { const p = JSON.parse(d); resolve(res.statusCode === 200 ? p.id : null); }
        catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.end();
  });
}

// Confirm bizId is owned by userId
async function verifyBizOwnership(bizId, userId) {
  return new Promise((resolve) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/businesses`);
    url.searchParams.set('id', `eq.${bizId}`);
    url.searchParams.set('owner_id', `eq.${userId}`);
    url.searchParams.set('select', 'id');
    url.searchParams.set('limit', '1');
    const req = https.request({
      hostname: url.hostname, port: 443,
      path: `${url.pathname}${url.search}`, method: 'GET',
      headers: { 'Authorization': `Bearer ${SUPABASE_KEY}`, 'apikey': SUPABASE_KEY, 'Accept': 'application/json' },
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d).length > 0); } catch { resolve(false); }
      });
    });
    req.on('error', () => resolve(false));
    req.end();
  });
}

module.exports = async function handler(req, res) {
  // Allow CORS from the site
  res.setHeader('Access-Control-Allow-Origin', SITE_URL);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!STRIPE_KEY) return res.status(500).json({ error: 'Stripe not configured' });

  // Verify the caller is authenticated
  const callerId = await getSupabaseUserId(req.headers['authorization']);
  if (!callerId) return res.status(401).json({ error: 'Unauthorised' });

  let body = '';
  await new Promise(resolve => { req.on('data', c => body += c); req.on('end', resolve); });
  let data;
  try { data = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid JSON' }); }

  const { type, bizId, eventId, userId, itemType, itemId } = data;

  // Verify caller owns the business they're creating a checkout for
  if (bizId) {
    const owns = await verifyBizOwnership(bizId, callerId);
    if (!owns) return res.status(403).json({ error: 'Forbidden' });
  }

  if (!type || !PRICE_IDS[type]) {
    return res.status(400).json({ error: `Unknown checkout type: ${type}` });
  }

  const priceId        = PRICE_IDS[type];
  const isSubscription = SUBSCRIPTION_TYPES.has(type);
  const isPromotion    = PROMOTION_TYPES.has(type);

  // Build success / cancel URLs with context
  const successBase = data.successUrl || `${SITE_URL}/business-dashboard.html`;
  const cancelBase  = data.cancelUrl  || `${SITE_URL}/promote.html`;
  const successUrl  = `${successBase}${successBase.includes('?') ? '&' : '?'}success=1&type=${type}`;
  const cancelUrl   = `${cancelBase}${cancelBase.includes('?') ? '&' : '?'}cancelled=1`;

  // Stripe Checkout params
  const params = {
    'payment_method_types[0]': 'card',
    'line_items[0][price]':    priceId,
    'line_items[0][quantity]': '1',
    'mode':                    isSubscription ? 'subscription' : 'payment',
    'success_url':             successUrl,
    'cancel_url':              cancelUrl,
    'currency':                'aud',
  };

  // Embed context in metadata so webhook can act on it
  if (bizId)    params['metadata[biz_id]']    = bizId;
  if (eventId)  params['metadata[event_id]']  = eventId;  // legacy
  if (userId)   params['metadata[user_id]']   = userId;
  if (itemType) params['metadata[item_type]'] = itemType;
  if (itemId)   params['metadata[item_id]']   = itemId;
  params['metadata[type]'] = type;

  // For subscriptions, also store metadata on subscription_data
  if (isSubscription) {
    if (bizId)  params['subscription_data[metadata][biz_id]']  = bizId;
    if (userId) params['subscription_data[metadata][user_id]'] = userId;
    params['subscription_data[metadata][type]'] = type;
  }

  try {
    const result = await stripePost('/v1/checkout/sessions', params);
    if (result.status !== 200) {
      console.error('Stripe error:', result.body);
      return res.status(502).json({ error: result.body?.error?.message || 'Stripe error' });
    }
    return res.status(200).json({ url: result.body.url });
  } catch (err) {
    console.error('create-checkout error:', err);
    return res.status(500).json({ error: err.message });
  }
};
