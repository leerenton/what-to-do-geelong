// ── WTDG Stripe Billing Portal ────────────────────────────
// POST /api/stripe-portal
// Body: { customerId }
// Returns: { url } — redirect to Stripe portal for manage/cancel
//
// Environment variables required:
//   STRIPE_SECRET_KEY
//   SITE_URL

const https  = require('https');

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
const SITE_URL   = process.env.SITE_URL || 'https://whattodogeelong.com.au';

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

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', SITE_URL);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });
  if (!STRIPE_KEY)             return res.status(500).json({ error: 'Stripe not configured' });

  let body = '';
  await new Promise(resolve => { req.on('data', c => body += c); req.on('end', resolve); });
  let data;
  try { data = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid JSON' }); }

  const { customerId } = data;
  if (!customerId) return res.status(400).json({ error: 'customerId required' });

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
