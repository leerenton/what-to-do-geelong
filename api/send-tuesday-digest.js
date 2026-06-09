// ── WTDG Tuesday "What's Happening" Email ───────────────────
// Vercel serverless function — sent every Tuesday morning (10am AEST)
// Mid-week roundup of upcoming events for the week ahead.
//
// Environment variables required:
//   RESEND_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY, CRON_SECRET

const https = require('https');

const RESEND_KEY   = process.env.RESEND_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://duhxszqyyzrbzrhwneey.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const CRON_SECRET  = process.env.CRON_SECRET;
const FROM_EMAIL   = 'hello@whattodogeelong.com.au';
const FROM_NAME    = 'What To Do Geelong';
const SITE_URL     = 'https://whattodogeelong.com.au';

function httpsRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { let j; try { j = JSON.parse(d); } catch { j = { raw: d }; } resolve({ status: res.statusCode, body: j }); });
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

// ── Fetch upcoming events for the week ahead ──────────────
async function getUpcomingEvents() {
  const now  = new Date();
  const end  = new Date(now);
  end.setDate(now.getDate() + 7);
  const res  = await supabase(
    `events?is_recurring=eq.false&select=id,title,category,emoji,date,location,price,img,slug,description&order=created_at.desc&limit=6`
  );
  return res.body || [];
}

// ── Fetch this week's sponsor for Tuesday ────────────────
async function getSponsor(slot) {
  const today = new Date().toISOString().split('T')[0];
  const res   = await supabase(
    `email_sponsorships?send_type=eq.tuesday&send_date=eq.${today}&slot=eq.${slot}&status=eq.confirmed&select=business_name,message,link_url,image_url&limit=1`
  );
  const rows = res.body || [];
  return rows[0] || null;
}

// ── Build sponsor block HTML ──────────────────────────────
function sponsorBlock(sponsor, position) {
  if (!sponsor) return '';
  const label = position === 'top' ? 'Presented by' : 'Also worth checking out';
  return `
    <tr><td style="padding:0 32px 20px">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1.5px solid #f59e0b;border-radius:10px;overflow:hidden">
        <tr><td style="padding:14px 16px">
          <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#d97706">📢 ${label}</p>
          <p style="margin:0 0 8px;font-size:15px;font-weight:800;color:#1e293b">${sponsor.business_name}</p>
          ${sponsor.message ? `<p style="margin:0 0 10px;font-size:13px;color:#475569;line-height:1.5">${sponsor.message}</p>` : ''}
          ${sponsor.link_url ? `<a href="${sponsor.link_url}" style="display:inline-block;background:#f59e0b;color:#fff;padding:8px 18px;border-radius:6px;font-size:13px;font-weight:700;text-decoration:none">Find out more →</a>` : ''}
        </td></tr>
      </table>
    </td></tr>`;
}

// ── Build event card ──────────────────────────────────────
function eventCard(ev) {
  const url = `${SITE_URL}/events/${ev.slug}`;
  const img = ev.img
    ? `<img src="${ev.img}" alt="${ev.title}" width="100%" style="display:block;border-radius:8px 8px 0 0;object-fit:cover;max-height:160px;width:100%" />`
    : `<div style="background:#e8f4ff;border-radius:8px 8px 0 0;height:80px;display:flex;align-items:center;justify-content:center;font-size:2rem">${ev.emoji || '📅'}</div>`;

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;background:#fff">
      <tr><td>${img}</td></tr>
      <tr><td style="padding:12px 14px">
        <p style="margin:0 0 3px;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#0ea5e9">${ev.category || ''}</p>
        <p style="margin:0 0 5px;font-size:14px;font-weight:700;color:#1e293b;line-height:1.3">${ev.title}</p>
        <p style="margin:0 0 8px;font-size:12px;color:#64748b">
          ${ev.date ? `📅 ${ev.date}` : ''} ${ev.location ? `&nbsp;·&nbsp; 📍 ${ev.location}` : ''}
        </p>
        <a href="${url}" style="display:inline-block;background:#0f2240;color:#fff;padding:7px 16px;border-radius:6px;font-size:12px;font-weight:600;text-decoration:none">See details →</a>
      </td></tr>
    </table>`;
}

// ── Build full email ──────────────────────────────────────
function buildEmail({ events, topSponsor, bottomSponsor, unsubUrl }) {
  const now  = new Date();
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const dateLabel = `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]}`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>What's Happening in Geelong</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

        <!-- Header -->
        <tr><td style="background:#0f2240;border-radius:12px 12px 0 0;padding:28px 32px;text-align:center">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#7dd3fc">What To Do Geelong</p>
          <h1 style="margin:0;font-size:22px;font-weight:800;color:#fff;line-height:1.2">What's Happening This Week 🗓️</h1>
          <p style="margin:8px 0 0;font-size:13px;color:#bfdbfe">${dateLabel} · Your mid-week guide to Geelong</p>
        </td></tr>

        <!-- Intro -->
        <tr><td style="background:#fff;padding:24px 32px 16px">
          <p style="margin:0;font-size:15px;color:#475569;line-height:1.65">
            Here's what's coming up in Geelong this week. Plan ahead and make the most of your city.
          </p>
        </td></tr>

        <!-- Top sponsor -->
        ${sponsorBlock(topSponsor, 'top')}

        <!-- Events -->
        <tr><td style="background:#fff;padding:4px 32px 20px">
          ${events.map(eventCard).join('') || '<p style="color:#94a3b8;text-align:center;padding:1rem">Check back soon for upcoming events.</p>'}
        </td></tr>

        <!-- Bottom sponsor -->
        ${sponsorBlock(bottomSponsor, 'bottom')}

        <!-- CTA -->
        <tr><td style="background:#e8f4ff;padding:20px 32px;text-align:center">
          <p style="margin:0 0 10px;font-size:14px;color:#1e40af;font-weight:600">See everything happening in Geelong</p>
          <a href="${SITE_URL}/events" style="display:inline-block;background:#0f2240;color:#fff;padding:11px 26px;border-radius:8px;font-size:14px;font-weight:700;text-decoration:none">Browse all events →</a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#0f2240;border-radius:0 0 12px 12px;padding:18px 32px;text-align:center">
          <p style="margin:0 0 4px;font-size:12px;color:#7dd3fc">
            © ${now.getFullYear()} What To Do Geelong &nbsp;·&nbsp;
            <a href="${SITE_URL}" style="color:#7dd3fc">Visit site</a>
          </p>
          <p style="margin:0;font-size:11px;color:#475569">
            You're receiving this because you signed up for the WTDG weekly digest.
            &nbsp;<a href="${unsubUrl}" style="color:#64748b">Unsubscribe</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
}

// ── Main handler ──────────────────────────────────────────
module.exports = async function handler(req, res) {
  const secret = req.headers['authorization'];
  if (CRON_SECRET && secret !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorised' });
  }
  if (!RESEND_KEY || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Missing env vars' });
  }

  try {
    const [events, topSponsor, bottomSponsor, prefsRes] = await Promise.all([
      getUpcomingEvents(),
      getSponsor('top'),
      getSponsor('bottom'),
      supabase('email_preferences?weekly_digest=eq.true&select=user_id,email'),
    ]);

    const prefs = prefsRes.body || [];
    if (!prefs.length) return res.status(200).json({ message: 'No subscribers', sent: 0 });

    let sent = 0, errors = 0;

    for (const pref of prefs) {
      try {
        const unsubUrl = `${SITE_URL}/api/unsubscribe?uid=${pref.user_id}`;
        const html     = buildEmail({ events, topSponsor, bottomSponsor, unsubUrl });
        const bodyStr  = JSON.stringify({
          from:    `${FROM_NAME} <${FROM_EMAIL}>`,
          to:      [pref.email],
          subject: `What's happening in Geelong this week 🗓️`,
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

        await new Promise(r => setTimeout(r, 200));
      } catch { errors++; }
    }

    return res.status(200).json({ sent, errors, total: prefs.length });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
