// POST /api/send-inquiry
// Emails the business owner when a customer submits an inquiry via a claimed listing.

const https = require('https');

const RESEND_KEY   = process.env.RESEND_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://duhxszqyyzrbzrhwneey.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SITE_URL     = 'https://whattodogeelong.com.au';
const FROM_NAME    = 'What To Do Geelong';
const FROM_EMAIL   = 'hello@whattodogeelong.com.au';
const FROM_EMAIL_FALLBACK = 'onboarding@resend.dev';

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

function buildEmail({ senderName, senderEmail, message, businessName, businessSlug, adminUrl }) {
  const displayName = senderName || senderEmail;
  const listingUrl  = `${SITE_URL}/${businessSlug}`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>New inquiry for ${businessName}</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">

        <!-- Header -->
        <tr><td style="background:#0f2240;border-radius:12px 12px 0 0;padding:24px 28px">
          <p style="margin:0 0 2px;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#7dd3fc">What To Do Geelong</p>
          <h1 style="margin:0;font-size:20px;font-weight:800;color:#fff">New inquiry for ${businessName}</h1>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#fff;padding:28px">
          <p style="margin:0 0 6px;font-size:14px;color:#64748b">From</p>
          <p style="margin:0 0 20px;font-size:16px;font-weight:700;color:#1e293b">${displayName}
            ${senderName ? `<span style="font-size:13px;font-weight:400;color:#64748b">&lt;${senderEmail}&gt;</span>` : ''}
          </p>

          <p style="margin:0 0 6px;font-size:14px;color:#64748b">Message</p>
          <div style="background:#f8fafc;border-left:3px solid #0ea5e9;border-radius:0 6px 6px 0;padding:14px 16px;margin-bottom:24px">
            <p style="margin:0;font-size:15px;color:#334155;line-height:1.65;white-space:pre-wrap">${message.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>
          </div>

          <p style="margin:0 0 16px;font-size:13px;color:#64748b">
            Reply directly to <a href="mailto:${senderEmail}" style="color:#0ea5e9">${senderEmail}</a> to continue the conversation.
          </p>

          <a href="mailto:${senderEmail}?subject=Re: Your inquiry about ${encodeURIComponent(businessName)}"
            style="display:inline-block;background:#0ea5e9;color:#fff;padding:10px 22px;border-radius:7px;font-size:14px;font-weight:700;text-decoration:none;margin-right:8px">
            Reply to ${senderName || 'sender'} →
          </a>
          <a href="${listingUrl}"
            style="display:inline-block;background:#f1f5f9;color:#334155;padding:10px 22px;border-radius:7px;font-size:14px;font-weight:600;text-decoration:none">
            View listing
          </a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#0f2240;border-radius:0 0 12px 12px;padding:16px 28px;text-align:center">
          <p style="margin:0;font-size:11px;color:#475569">
            This inquiry was submitted via your listing on
            <a href="${SITE_URL}" style="color:#7dd3fc">whattodogeelong.com.au</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { business_id, business_name, business_slug, owner_id, sender_name, sender_email, message } = req.body || {};
  if (!owner_id || !sender_email || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!RESEND_KEY || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Missing environment variables' });
  }

  try {
    // Look up the owner's email from auth.users via admin API
    const userRes = await httpsRequest({
      hostname: new URL(SUPABASE_URL).hostname, port: 443,
      path: `/auth/v1/admin/users/${owner_id}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
      },
    });

    const ownerEmail = userRes.body?.email;
    if (!ownerEmail) {
      return res.status(404).json({ error: 'Owner email not found' });
    }

    const fromEmail = process.env.RESEND_DOMAIN_VERIFIED === 'true' ? FROM_EMAIL : FROM_EMAIL_FALLBACK;

    const html = buildEmail({
      senderName:   sender_name,
      senderEmail:  sender_email,
      message,
      businessName: business_name,
      businessSlug: business_slug,
    });

    const bodyStr = JSON.stringify({
      from:    `${FROM_NAME} <${fromEmail}>`,
      to:      [ownerEmail],
      replyTo: sender_email,
      subject: `New inquiry for ${business_name} via What To Do Geelong`,
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

    if (result.status >= 200 && result.status < 300) {
      return res.status(200).json({ ok: true });
    }
    return res.status(500).json({ error: result.body });

  } catch (e) {
    console.error('send-inquiry error:', e);
    return res.status(500).json({ error: e.message });
  }
};
