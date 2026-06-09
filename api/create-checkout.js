// ── WTDG Stripe Checkout Session Creator ─────────────────
// POST /api/create-checkout
// Body: { type, bizId, eventId, userId, successUrl, cancelUrl }
//
// type values:
//   'gold_annual'    → Gold membership $249/yr
//   'gold_monthly'   → Gold membership $25/mo
//   'event_boost'    → Promoted event Boost $49
//   'event_spotlight'→ Promoted event Spotlight $99
//   'event_premier'  → Promoted event Premier $199
//
// Environment variables required:
//   STRIPE_SECRET_KEY       — sk_test_... or sk_live_...
//   STRIPE_PRICE_GOLD_ANNUAL
//   STRIPE_PRICE_GOLD_MONTHLY
//   STRIPE_PRICE_BOOST
//   STRIPE_PRICE_SPOTLIGHT
//   STRIPE_PRICE_PREMIER
//   SITE_URL                — https://whattodogeelong.com.au

const https = require('https');

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
const SITE_URL   = process.env.SITE_URL || 'https://whattodogeelong.com.au';

const PRICE_IDS = {
  gold_annual:     process.env.STRIPE_PRICE_GOLD_ANNUAL,
  gold_monthly:    process.env.STRIPE_PRICE_GOLD_MONTHLY,
  event_boost:     process.env.STRIPE_PRICE_BOOST,
  event_spotlight: process.env.STRIPE_PRICE_SPOTLIGHT,
  event_premier:   process.env.STRIPE_PRICE_PREMIER,
};

const SUBSCRIPTION_TYPES = new Set(['gold_annual', 'gold_monthly']);

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

module.exports = async function handler(req, res) {
  // Allow CORS from the site
  res.setHeader('Access-Control-Allow-Origin', SITE_URL);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!STRIPE_KEY) return res.status(500).json({ error: 'Stripe not configured' });

  let body = '';
  await new Promise(resolve => { req.on('data', c => body += c); req.on('end', resolve); });
  let data;
  try { data = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid JSON' }); }

  const { type, bizId, eventId, userId } = data;

  if (!type || !PRICE_IDS[type]) {
    return res.status(400).json({ error: `Unknown checkout type: ${type}` });
  }

  const priceId       = PRICE_IDS[type];
  const isSubscription = SUBSCRIPTION_TYPES.has(type);

  // Build success / cancel URLs with context
  const successBase = data.successUrl || `${SITE_URL}/upgrade.html`;
  const cancelBase  = data.cancelUrl  || `${SITE_URL}/upgrade.html`;
  const successUrl  = `${successBase}${successBase.includes('?') ? '&' : '?'}success=1&type=${type}`;
  const cancelUrl   = `${cancelBase}${cancelBase.includes('?') ? '&' : '?'}cancelled=1`;

  // Stripe Checkout params (using URLSearchParams-compatible flat format)
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
  if (bizId)   params['metadata[biz_id]']   = bizId;
  if (eventId) params['metadata[event_id]'] = eventId;
  if (userId)  params['metadata[user_id]']  = userId;
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
