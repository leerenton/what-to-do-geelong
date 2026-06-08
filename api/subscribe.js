// POST /api/subscribe — upserts email_preferences for a user
// Called from the front-end after login / from profile settings

const https = require('https');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://duhxszqyyzrbzrhwneey.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

function supabaseUpsert(body) {
  const url = new URL(SUPABASE_URL);
  const bodyStr = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: url.hostname, port: 443,
      path: '/rest/v1/email_preferences',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
        'Prefer': 'resolution=merge-duplicates,return=minimal',
      },
    }, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => resolve({ status: res.statusCode, body: d })); });
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { user_id, email, weekly_digest = true } = req.body || {};
  if (!user_id || !email) return res.status(400).json({ error: 'Missing user_id or email' });

  try {
    const result = await supabaseUpsert({ user_id, email, weekly_digest });
    if (result.status >= 200 && result.status < 300) {
      return res.status(200).json({ ok: true });
    }
    return res.status(500).json({ error: result.body });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
