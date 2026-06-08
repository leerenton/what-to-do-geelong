// One-click unsubscribe — linked from email footer
// GET /api/unsubscribe?uid=<user_id>

const https = require('https');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://duhxszqyyzrbzrhwneey.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

function supabasePatch(path, body) {
  const url = new URL(SUPABASE_URL);
  const bodyStr = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: url.hostname, port: 443, path: `/rest/v1/${path}`,
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
      },
    }, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(res.statusCode)); });
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

module.exports = async function handler(req, res) {
  const uid = req.query?.uid;
  if (!uid) return res.status(400).send('Missing uid');

  try {
    await supabasePatch(
      `email_preferences?user_id=eq.${uid}`,
      { weekly_digest: false }
    );
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Unsubscribed</title>
      <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f1f5f9}
      .card{background:#fff;border-radius:12px;padding:2.5rem;text-align:center;max-width:400px;box-shadow:0 4px 20px rgba(0,0,0,.08)}
      h1{color:#0f2240;margin:0 0 .75rem}p{color:#64748b;margin:0 0 1.25rem}a{color:#0ea5e9}</style></head>
      <body><div class="card">
        <div style="font-size:2.5rem;margin-bottom:1rem">✅</div>
        <h1>Unsubscribed</h1>
        <p>You've been removed from the WTDG weekly digest. You won't hear from us again.</p>
        <a href="https://whattodogeelong.com.au">← Back to What To Do Geelong</a>
      </div></body></html>`);
  } catch (e) {
    res.status(500).send('Something went wrong. Please try again.');
  }
};
