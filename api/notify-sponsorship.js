// POST /api/notify-sponsorship
// Notifies the WTDG team when a sponsorship booking request is submitted.

const https = require('https');

const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = 'hello@whattodogeelong.com.au';
const FROM_NAME  = 'What To Do Geelong';
const TEAM_EMAIL = 'hello@whattodogeelong.com.au';
const SITE_URL   = 'https://whattodogeelong.com.au';

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

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!RESEND_KEY) return res.status(200).json({ ok: true }); // silent skip

  const { name, email, biz, msg, url, slot } = req.body || {};

  const sendName = slot?.send === 'tuesday' ? "What's Happening in Geelong (Tuesday)" : 'Your Weekend in Geelong (Thursday)';
  const price    = slot?.slot === 'top' ? '$49' : '$29';

  const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:24px;background:#f1f5f9">
    <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:28px">
      <h2 style="margin:0 0 16px;color:#0f2240">📧 New Sponsorship Booking Request</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:6px 0;color:#64748b;width:130px">Business</td><td style="font-weight:700">${biz}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b">Contact</td><td>${name} &lt;${email}&gt;</td></tr>
        <tr><td style="padding:6px 0;color:#64748b">Send</td><td>${sendName}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b">Date</td><td>${slot?.day} ${slot?.label}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b">Slot</td><td>${slot?.slot === 'top' ? 'Top Sponsor' : 'Bottom Sponsor'} — ${price}</td></tr>
        ${msg ? `<tr><td style="padding:6px 0;color:#64748b">Message</td><td>${msg}</td></tr>` : ''}
        ${url ? `<tr><td style="padding:6px 0;color:#64748b">Link</td><td><a href="${url}">${url}</a></td></tr>` : ''}
      </table>
      <div style="margin-top:20px;padding:14px;background:#f0fffe;border-radius:8px;border-left:3px solid #4ac8d0;font-size:13px;color:#0f2240">
        Reply to <a href="mailto:${email}">${email}</a> to confirm the booking and send a payment link.
        Slot is held for 48 hours pending payment.
      </div>
    </div>
  </body></html>`;

  const bodyStr = JSON.stringify({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: [TEAM_EMAIL],
    reply_to: email,
    subject: `New sponsorship request: ${biz} — ${slot?.day} ${slot?.label} (${slot?.slot === 'top' ? 'Top' : 'Bottom'} ${price})`,
    html,
  });

  try {
    await httpsRequest({
      hostname: 'api.resend.com', port: 443,
      path: '/emails', method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
      },
    }, bodyStr);
  } catch (_) {}

  return res.status(200).json({ ok: true });
};
