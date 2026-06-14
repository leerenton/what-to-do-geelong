// ── WTDG Stripe Billing Portal ────────────────────────────
// POST /api/stripe-portal
// Headers: Authorization: Bearer <supabase-jwt>
// Body: { customerId }
// Returns: { url } — redirect to Stripe portal for manage/cancel
//
// Environment variables required:
//   STRIPE_SECRET_KEY
//   SUPABASE_URL
//   SUPABASE_SERVICE_KEY
//   SITE_URL

const https  = require('https');

const STRIPE_KEY    = process.env.STRIPE_SECRET_KEY;
const SUPABASE_URL  = process.env.SUPABASE_URL || 'https://duhxszqyyzrbzrhwneey.supabase.co';
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_KEY;
const SITE_URL      = process.env.SITE_URL || 'https://whattodogeelong.com.au';

function stripePost(path, params) {
  const body = new URLSearchParams(params).toString();
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.stripe.com', port: 443,
      path, method: 'POST',
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
        catch { resolve({ status: res.statusCode, body: {} }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Verify Supabase JWT and return the user_id, or null if invalid
async function getSupabaseUserId(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const jwt = authHeader.slice(7);
  return new Promise((resolve) => {
    const url = new URL(`${SUPABASE_URL}/auth/v1/user`);
    const req = https.request({
      hostname: url.hostname, port: 443,
      path: url.pathname, method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'apikey': SUPABASE_KEY,
      },
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(d);
          resolve(res.statusCode === 200 ? parsed.id : null);
        } catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.end();
  });
}

// Confirm customerId belongs to a business owned by userId
async function verifyCustomerOwnership(customerId, userId) {
  return new Promise((resolve) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/businesses`);
    url.searchParams.set('stripe_customer_id', `eq.${customerId}`);
    url.searchParams.set('owner_id', `eq.${userId}`);
    url.searchParams.set('select', 'id');
    url.searchParams.set('limit', '1');
    const req = https.request({
      hostname: url.hostname, port: 443,
      path: `${url.pathname}${url.search}`, method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
        'Accept': 'application/json',
      },
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d).length > 0); }
        catch { resolve(false); }
      });
    });
    req.on('error', () => resolve(false));
    req.end();
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', SITE_URL);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });
  if (!STRIPE_KEY)             return res.status(500).json({ error: 'Stripe not configured' });

  // Verify caller is authenticated
  const userId = await getSupabaseUserId(req.headers['authorization']);
  if (!userId) return res.status(401).json({ error: 'Unauthorised' });

  let body = '';
  await new Promise(resolve => { req.on('data', c => body += c); req.on('end', resolve); });
  let data;
  try { data = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid JSON' }); }

  const { customerId } = data;
  if (!customerId) return res.status(400).json({ error: 'customerId required' });

  // Verify caller owns this Stripe customer
  const owns = await verifyCustomerOwnership(customerId, userId);
  if (!owns) return res.status(403).json({ error: 'Forbidden' });

  try {
    const result = await stripePost('/v1/billing_portal/sessions', {
      customer:   customerId,
      return_url: `${SITE_URL}/business-dashboard.html`,
    });
    if (result.status !== 200) {
      return res.status(502).json({ error: result.body?.error?.message || 'Stripe error' });
    }
    return res.status(200).json({ url: result.body.url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
