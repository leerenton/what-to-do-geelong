// ── WTDG Upgrade Nudge Email ────────────────────────────────
// Vercel serverless function — called daily by Vercel Cron
// Finds free business listings that just crossed 100 views,
// emails the owner with an upgrade CTA. Fires once per listing.
//
// Environment variables required:
//   RESEND_API_KEY
//   SUPABASE_URL
//   SUPABASE_SERVICE_KEY
//   CRON_SECRET

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

function supabaseGet(path) {
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

function supabasePatch(path, body) {
  const url     = new URL(SUPABASE_URL);
  const bodyStr = JSON.stringify(body);
  return httpsRequest({
    hostname: url.hostname, port: 443,
    path: `/rest/v1/${path}`,
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'apikey': SUPABASE_KEY,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(bodyStr),
      'Prefer': 'return=minimal',
    },
  }, bodyStr);
}

function buildNudgeEmail({ ownerName, bizName, bizSlug, viewCount }) {
  const listingUrl = `${SITE_URL}/${bizSlug}`;
  const upgradeUrl = `${SITE_URL}/upgrade?biz=${encodeURIComponent(bizSlug)}`;
  const name = ownerName || 'there';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Your listing is getting noticed</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">

        <!-- Header -->
        <tr><td style="background:#0f2240;border-radius:12px 12px 0 0;padding:24px 28px">
          <p style="margin:0 0 2px;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#7dd3fc">What To Do Geelong</p>
          <h1 style="margin:0;font-size:22px;font-weight:800;color:#fff">Your listing is getting noticed 👀</h1>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#fff;padding:28px">

          <p style="margin:0 0 16px;font-size:15px;color:#1e293b;line-height:1.6">
            Hi ${name}, your listing for <strong>${bizName}</strong> has just hit <strong>${viewCount}+ views</strong> on What To Do Geelong.
          </p>

          <p style="margin:0 0 20px;font-size:15px;color:#64748b;line-height:1.6">
            Right now, visitors can't contact you directly — you're missing leads every time someone lands on your page.
          </p>

          <!-- Stats highlight -->
          <div style="background:#f8fafc;border-radius:10px;padding:16px 20px;margin-bottom:24px;border-left:4px solid #4ac8d0">
            <p style="margin:0;font-size:13px;font-weight:700;color:#0f2240;text-transform:uppercase;letter-spacing:.06em">Your listing</p>
            <p style="margin:4px 0 0;font-size:28px;font-weight:900;color:#0f2240;font-family:Georgia,serif">${viewCount}+ views</p>
            <p style="margin:2px 0 0;font-size:13px;color:#64748b">and counting — with no way for customers to reach you</p>
          </div>

          <!-- Gold features -->
          <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#0f2240">Upgrade to Gold ($249/yr) to:</p>
          <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;width:100%">
            ${[
              ['📬', 'Add a live enquiry form — customers contact you directly'],
              ['🏠', 'Get rotated on the WTDG homepage'],
              ['⭐', '3 promoted events per year (pushed to socials)'],
              ['📧', 'Feature in our weekly email to 3,200+ subscribers'],
              ['🎁', 'Unlimited offers and deals'],
            ].map(([icon, text]) => `
            <tr><td style="padding:5px 0;font-size:14px;color:#334155">
              <span style="margin-right:8px">${icon}</span>${text}
            </td></tr>`).join('')}
          </table>

          <a href="${upgradeUrl}"
            style="display:block;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;padding:14px 28px;border-radius:10px;font-size:15px;font-weight:800;text-decoration:none;text-align:center;margin-bottom:12px">
            Upgrade to Gold — $249/yr →
          </a>
          <p style="text-align:center;margin:0 0 24px;font-size:12px;color:#94a3b8">or <a href="${upgradeUrl}?plan=monthly" style="color:#4ac8d0">$25/month</a> · cancel anytime · 30-day money-back guarantee</p>

          <p style="margin:0;font-size:13px;color:#94a3b8">
            <a href="${listingUrl}" style="color:#4ac8d0">View your listing →</a>
          </p>

        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#0f2240;border-radius:0 0 12px 12px;padding:16px 28px;text-align:center">
          <p style="margin:0 0 4px;font-size:11px;color:#475569">
            You're receiving this because you have a listing on
            <a href="${SITE_URL}" style="color:#7dd3fc">whattodogeelong.com.au</a>
          </p>
          <p style="margin:0;font-size:11px;color:#334155">
            Questions? Reply to this email and we'll get back to you.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
}

module.exports = async function handler(req, res) {
  // Verify cron secret
  const secret = req.headers['x-cron-secret'] || req.query.secret;
  if (CRON_SECRET && secret !== CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorised' });
  }

  if (!RESEND_KEY || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Missing environment variables' });
  }

  try {
    // Find free businesses with 100+ views that haven't been nudged yet
    const bizRes = await supabaseGet(
      `businesses?is_gold=eq.false&view_count=gte.100&nudge_sent_at=is.null&owner_id=not.is.null&select=id,name,slug,owner_id,view_count`
    );

    const businesses = bizRes.body;
    if (!Array.isArray(businesses) || !businesses.length) {
      return res.status(200).json({ ok: true, sent: 0, message: 'No businesses to nudge' });
    }

    let sent = 0;
    const errors = [];

    for (const biz of businesses) {
      try {
        // Get owner email from auth.users
        const userRes = await httpsRequest({
          hostname: new URL(SUPABASE_URL).hostname, port: 443,
          path: `/auth/v1/admin/users/${biz.owner_id}`,
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'apikey': SUPABASE_KEY,
          },
        });

        const ownerEmail = userRes.body?.email;
        const ownerName  = userRes.body?.user_metadata?.name || null;

        if (!ownerEmail) {
          errors.push({ biz: biz.name, reason: 'no owner email' });
          continue;
        }

        // Send email
        const html    = buildNudgeEmail({ ownerName, bizName: biz.name, bizSlug: biz.slug, viewCount: biz.view_count });
        const bodyStr = JSON.stringify({
          from:    `${FROM_NAME} <${FROM_EMAIL}>`,
          to:      [ownerEmail],
          subject: `Your ${biz.name} listing has hit ${biz.view_count}+ views on WTDG 👀`,
          html,
        });

        const emailRes = await httpsRequest({
          hostname: 'api.resend.com', port: 443,
          path: '/emails', method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_KEY}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(bodyStr),
          },
        }, bodyStr);

        if (emailRes.status >= 200 && emailRes.status < 300) {
          // Mark nudge sent
          await supabasePatch(
            `businesses?id=eq.${biz.id}`,
            { nudge_sent_at: new Date().toISOString() }
          );
          sent++;
        } else {
          errors.push({ biz: biz.name, reason: emailRes.body });
        }

      } catch (e) {
        errors.push({ biz: biz.name, reason: e.message });
      }
    }

    return res.status(200).json({ ok: true, sent, errors: errors.length ? errors : undefined });

  } catch (e) {
    console.error('send-upgrade-nudge error:', e);
    return res.status(500).json({ error: e.message });
  }
};
