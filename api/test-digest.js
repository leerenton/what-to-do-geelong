// GET/POST /api/test-digest?email=foo@bar.com
// Admin-only: sends a digest preview to any email, bypassing subscription check.
// Protected by CRON_SECRET.

const https = require('https');

const RESEND_KEY   = process.env.RESEND_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://duhxszqyyzrbzrhwneey.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const CRON_SECRET  = process.env.CRON_SECRET;
const SITE_URL     = 'https://whattodogeelong.com.au';
const FROM_NAME    = 'What To Do Geelong (Test)';
const ADMIN_EMAILS = ['lee.renton81@gmail.com', 'adele@whattodogeelong.com.au'];
// Use verified domain when available; fall back to Resend sandbox for testing
const FROM_EMAIL   = process.env.RESEND_DOMAIN_VERIFIED === 'true'
  ? 'hello@whattodogeelong.com.au'
  : 'onboarding@resend.dev';

function httpsRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        let json; try { json = JSON.parse(d); } catch { json = { raw: d }; }
        resolve({ status: res.statusCode, body: json });
      });
    });
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

function supabase(path) {
  const url = new URL(SUPABASE_URL);
  return httpsRequest({
    hostname: url.hostname, port: 443,
    path: `/rest/v1/${path}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'apikey': SUPABASE_KEY,
      'Accept': 'application/json',
    },
  });
}

function eventCard(ev) {
  const url = `${SITE_URL}/events/${ev.slug}`;
  const img = ev.img
    ? `<img src="${ev.img}" alt="${ev.title}" width="100%" style="display:block;border-radius:8px 8px 0 0;object-fit:cover;max-height:180px;width:100%" />`
    : `<div style="background:#e8f4ff;border-radius:8px 8px 0 0;height:100px;display:flex;align-items:center;justify-content:center;font-size:2.5rem">${ev.emoji || '📅'}</div>`;

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;background:#fff">
      <tr><td>${img}</td></tr>
      <tr><td style="padding:14px 16px">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#0ea5e9">${ev.category || ''}</p>
        <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#1e293b;line-height:1.3">${ev.title}</p>
        <p style="margin:0 0 10px;font-size:12px;color:#64748b">
          ${ev.date ? `📅 ${ev.date}` : ''} ${ev.location ? `&nbsp;·&nbsp; 📍 ${ev.location}` : ''}
        </p>
        ${ev.description ? `<p style="margin:0 0 12px;font-size:13px;color:#475569;line-height:1.55">${ev.description.slice(0,120)}${ev.description.length > 120 ? '…' : ''}</p>` : ''}
        <a href="${url}" style="display:inline-block;background:#0ea5e9;color:#fff;padding:8px 18px;border-radius:6px;font-size:13px;font-weight:600;text-decoration:none">
          ${ev.price === 'Free' ? '📍 View event' : '🎟️ Get tickets'}
        </a>
      </td></tr>
    </table>`;
}

function buildEmail(events) {
  const weekend = new Date();
  const sat = new Date(weekend); sat.setDate(sat.getDate() + (6 - sat.getDay()));
  const sun = new Date(sat); sun.setDate(sat.getDate() + 1);
  const fmt = d => d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
  const weekendLabel = `${fmt(sat)} – ${fmt(sun)}`;
  const unsubUrl = `${SITE_URL}/api/unsubscribe?uid=test`;

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>WTDG Digest Preview</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 0">
    <tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
      <tr><td style="background:#7c3aed;border-radius:12px 12px 0 0;padding:10px 20px;text-align:center">
        <p style="margin:0;font-size:11px;font-weight:700;color:#ede9fe">⚠️ TEST EMAIL — not sent to subscribers</p>
      </td></tr>
      <tr><td style="background:#0f2240;padding:28px 32px;text-align:center">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#7dd3fc">What To Do Geelong</p>
        <h1 style="margin:0;font-size:24px;font-weight:800;color:#fff;line-height:1.2">What's On This Weekend</h1>
        <p style="margin:8px 0 0;font-size:14px;color:#bfdbfe">${weekendLabel}</p>
      </td></tr>
      <tr><td style="background:#fff;padding:28px 32px 20px">
        <p style="margin:0 0 16px;font-size:16px;color:#1e293b;line-height:1.6">Hey there! 👋</p>
        <p style="margin:0;font-size:15px;color:#475569;line-height:1.65">Here's what's happening around Geelong this weekend. Get out and explore the best of our city.</p>
      </td></tr>
      <tr><td style="background:#fff;padding:4px 32px 28px">
        ${events.map(eventCard).join('')}
      </td></tr>
      <tr><td style="background:#e8f4ff;padding:24px 32px;text-align:center">
        <a href="${SITE_URL}" style="display:inline-block;background:#0f2240;color:#fff;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:700;text-decoration:none;margin-right:8px">Browse events →</a>
      </td></tr>
      <tr><td style="background:#0f2240;border-radius:0 0 12px 12px;padding:20px 32px;text-align:center">
        <p style="margin:0;font-size:11px;color:#475569">
          <a href="${unsubUrl}" style="color:#64748b">Unsubscribe</a>
        </p>
      </td></tr>
    </table></td></tr>
  </table>
</body></html>`;
}

module.exports = async function handler(req, res) {
  const authHeader = req.headers['authorization'];
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorised' });
  }

  if (!RESEND_KEY || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Missing environment variables' });
  }

  try {
    // Fetch a sample of recent events
    const evRes = await supabase(
      'events?is_recurring=eq.false&select=id,title,category,emoji,date,location,price,img,slug,description&order=created_at.desc&limit=4'
    );
    const events = evRes.body || [];
    const html = buildEmail(events);

    let sent = 0, errors = 0;
    for (const email of ADMIN_EMAILS) {
      const bodyStr = JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [email],
        subject: `[TEST] What's on in Geelong this weekend 🏙️`,
        html,
      });
      const result = await httpsRequest({
        hostname: 'api.resend.com', port: 443,
        path: '/emails', method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_KEY}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(bodyStr),
        },
      }, bodyStr);
      if (result.status >= 200 && result.status < 300) sent++;
      else errors++;
    }

    return res.status(200).json({ ok: true, sent, errors, to: ADMIN_EMAILS });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
