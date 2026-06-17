// ── WTDG Weekly Email Digest ────────────────────────────────
// Vercel serverless function — called weekly by Vercel Cron (Sunday 8am AEST)
// Reads user interests from page_views, matches trending events, sends via Resend.
//
// Environment variables required (set in Vercel dashboard):
//   RESEND_API_KEY        – re_...
//   SUPABASE_URL          – https://xxxx.supabase.co
//   SUPABASE_SERVICE_KEY  – service_role JWT
//   CRON_SECRET           – random string to verify cron calls (set in Vercel too)

const https = require('https');

const RESEND_KEY     = process.env.RESEND_API_KEY;
const SUPABASE_URL   = process.env.SUPABASE_URL   || 'https://duhxszqyyzrbzrhwneey.supabase.co';
const SUPABASE_KEY   = process.env.SUPABASE_SERVICE_KEY;
const CRON_SECRET    = process.env.CRON_SECRET;
const FROM_EMAIL     = 'hello@whattodogeelong.com.au';
const FROM_NAME      = 'What To Do Geelong';
const SITE_URL       = 'https://whattodogeelong.com.au';

// ── Simple HTTPS helpers ───────────────────────────────────
function httpsRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        let json;
        try { json = JSON.parse(d); } catch { json = { raw: d }; }
        resolve({ status: res.statusCode, body: json });
      });
    });
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

function supabase(path, method = 'GET', body = null) {
  const url = new URL(SUPABASE_URL);
  return httpsRequest({
    hostname: url.hostname,
    port: 443,
    path: `/rest/v1/${path}`,
    method,
    headers: {
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'apikey': SUPABASE_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(method === 'POST' ? { 'Prefer': 'return=representation' } : {}),
      ...(body ? { 'Content-Length': Buffer.byteLength(JSON.stringify(body)) } : {}),
    },
  }, body);
}

// ── Build interest profile for a user ─────────────────────
// Returns { Sports: 5, Music: 3, ... } sorted by score desc
async function getUserInterests(userId) {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const res = await supabase(
    `page_views?user_id=eq.${userId}&viewed_at=gte.${since}&category=not.is.null&select=category`
  );
  const views = res.body || [];
  const scores = {};
  for (const v of views) {
    if (v.category) scores[v.category] = (scores[v.category] || 0) + 1;
  }
  return Object.entries(scores).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([cat]) => cat);
}

// ── Fetch trending events for given categories ─────────────
async function getTrendingEventsForCategories(categories, city = 'geelong') {
  if (!categories.length) return [];
  const catFilter = categories.map(c => `"${c}"`).join(',');
  const res = await supabase(
    `events?category=in.(${catFilter})&city=eq.${city}&is_recurring=eq.false&select=id,title,category,emoji,date,location,price,img,slug,description&order=created_at.desc&limit=6`
  );
  return res.body || [];
}

// ── Fetch general trending events (fallback) ───────────────
async function getFallbackEvents(city = 'geelong') {
  const res = await supabase(
    `events?city=eq.${city}&is_recurring=eq.false&select=id,title,category,emoji,date,location,price,img,slug,description&order=created_at.desc&limit=4`
  );
  return res.body || [];
}

// ── Build event card HTML ──────────────────────────────────
function eventCard(ev) {
  const url = `${SITE_URL}/events/${ev.slug}`;
  const img = ev.img
    ? `<img src="${ev.img}" alt="${ev.title}" width="100%" style="display:block;border-radius:8px 8px 0 0;object-fit:cover;max-height:180px;width:100%" />`
    : `<div style="background:#e8f4ff;border-radius:8px 8px 0 0;height:100px;display:flex;align-items:center;justify-content:center;font-size:2.5rem">${ev.emoji || '📅'}</div>`;
  const price = ev.price === 'Free'
    ? `<span style="color:#0ea5e9;font-weight:700">Free</span>`
    : `<span style="color:#334155">${ev.price || ''}</span>`;

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;background:#fff">
      <tr><td>${img}</td></tr>
      <tr><td style="padding:14px 16px">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#0ea5e9">${ev.category || ''}</p>
        <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#1e293b;line-height:1.3">${ev.title}</p>
        <p style="margin:0 0 10px;font-size:12px;color:#64748b">
          ${ev.date ? `📅 ${ev.date}` : ''} ${ev.location ? `&nbsp;·&nbsp; 📍 ${ev.location}` : ''}
        </p>
        ${ev.description ? `<p style="margin:0 0 12px;font-size:13px;color:#475569;line-height:1.55">${ev.description.slice(0, 120)}${ev.description.length > 120 ? '…' : ''}</p>` : ''}
        <a href="${url}" style="display:inline-block;background:#0ea5e9;color:#fff;padding:8px 18px;border-radius:6px;font-size:13px;font-weight:600;text-decoration:none">
          ${ev.price === 'Free' ? '📍 View event' : '🎟️ Get tickets'}
        </a>
        &nbsp; ${price}
      </td></tr>
    </table>`;
}

// ── Fetch Gold businesses (rotated) ───────────────────────
async function getGoldBusinesses(limit = 3) {
  const res = await supabase(
    `businesses?is_gold=eq.true&select=id,name,slug,type,suburb,emoji,img,description&order=name`
  );
  const all = res.body || [];
  if (!all.length) return [];
  // Rotate based on week number so different businesses feature each week
  const weekNum = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  const offset  = weekNum % all.length;
  const rotated = [...all.slice(offset), ...all.slice(0, offset)];
  return rotated.slice(0, limit);
}

// ── Build Gold business card HTML ─────────────────────────
function goldBizCard(biz) {
  const url = `${SITE_URL}/${biz.slug}`;
  const img = biz.img
    ? `<img src="${biz.img}" alt="${biz.name}" width="160" height="100" style="display:block;object-fit:cover;border-radius:8px;width:160px;height:100px" />`
    : `<div style="width:160px;height:100px;background:#fef3c7;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:2.5rem;flex-shrink:0">${biz.emoji || '🏪'}</div>`;

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;border-radius:10px;border:1.5px solid #f59e0b;background:#fffbeb;overflow:hidden">
      <tr><td style="padding:14px 16px">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:160px;vertical-align:top;padding-right:14px">${img}</td>
            <td style="vertical-align:top">
              <p style="margin:0 0 2px;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#d97706">⭐ Gold Member · ${biz.type || 'Local Business'}</p>
              <p style="margin:0 0 4px;font-size:15px;font-weight:800;color:#1e293b;line-height:1.3">${biz.name}</p>
              <p style="margin:0 0 10px;font-size:12px;color:#92400e">📍 ${biz.suburb || 'Geelong'}</p>
              ${biz.description ? `<p style="margin:0 0 12px;font-size:13px;color:#475569;line-height:1.5">${biz.description.slice(0, 100)}${biz.description.length > 100 ? '…' : ''}</p>` : ''}
              <a href="${url}" style="display:inline-block;background:#f59e0b;color:#fff;padding:7px 16px;border-radius:6px;font-size:12px;font-weight:700;text-decoration:none">Visit listing →</a>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>`;
}

// ── Build full email HTML ──────────────────────────────────
function buildEmail({ userName, categories, events, goldBiz, unsubUrl }) {
  const greeting = userName ? `Hi ${userName.split(' ')[0]}` : 'Hey there';
  const isPersonalised = categories.length > 0;
  const intro = isPersonalised
    ? `Based on what you've been exploring — <strong>${categories.join(', ')}</strong> — here's what's on in Geelong this weekend and beyond that we think you'll love.`
    : `Your Friday roundup of what's happening around Geelong this weekend and into the coming week. Get out and explore the best of our city.`;

  const eventCards = events.map(eventCard).join('');
  const now = new Date();
  const sat = new Date(now); sat.setDate(now.getDate() + ((6 - now.getDay() + 7) % 7 || 7));
  const sun = new Date(sat); sun.setDate(sat.getDate() + 1);
  const fmt = d => d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
  const weekendLabel = `${fmt(sat)} – ${fmt(sun)}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>What's on in Geelong this weekend</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

        <!-- Header -->
        <tr><td style="background:#0f2240;border-radius:12px 12px 0 0;padding:28px 32px;text-align:center">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#7dd3fc">What To Do Geelong</p>
          <h1 style="margin:0;font-size:24px;font-weight:800;color:#fff;line-height:1.2">Your Weekend in Geelong 🎉</h1>
          <p style="margin:8px 0 0;font-size:14px;color:#bfdbfe">${weekendLabel}</p>
        </td></tr>

        <!-- Intro -->
        <tr><td style="background:#fff;padding:28px 32px 20px">
          <p style="margin:0 0 16px;font-size:16px;color:#1e293b;line-height:1.6">
            ${greeting}! 👋
          </p>
          <p style="margin:0;font-size:15px;color:#475569;line-height:1.65">${intro}</p>
        </td></tr>

        <!-- Events -->
        <tr><td style="background:#fff;padding:4px 32px 28px">
          ${eventCards || '<p style="color:#94a3b8;text-align:center;padding:2rem">No events found for this weekend.</p>'}
        </td></tr>

        ${goldBiz && goldBiz.length ? `
        <!-- Gold businesses -->
        <tr><td style="background:#fffbeb;padding:24px 32px 16px;border-top:2px solid #f59e0b">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#d97706">⭐ Featured Businesses</p>
          <p style="margin:0 0 16px;font-size:13px;color:#92400e">Geelong's Gold members — worth a visit</p>
          ${goldBiz.map(goldBizCard).join('')}
        </td></tr>
        ` : ''}

        <!-- CTA banner -->
        <tr><td style="background:#e8f4ff;padding:24px 32px;text-align:center">
          <p style="margin:0 0 12px;font-size:14px;color:#1e40af;font-weight:600">Discover more in Geelong</p>
          <a href="${SITE_URL}" style="display:inline-block;background:#0f2240;color:#fff;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:700;text-decoration:none;margin-right:8px">Browse events →</a>
          <a href="${SITE_URL}/guides" style="display:inline-block;background:#0ea5e9;color:#fff;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:700;text-decoration:none">Guides →</a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#0f2240;border-radius:0 0 12px 12px;padding:20px 32px;text-align:center">
          <p style="margin:0 0 6px;font-size:12px;color:#7dd3fc">
            © ${new Date().getFullYear()} What To Do Geelong &nbsp;·&nbsp;
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
</body>
</html>`;
}

// ── Send one email via Resend ──────────────────────────────
async function sendEmail({ to, subject, html, fromName, fromEmail }) {
  const body = JSON.stringify({
    from: `${fromName || FROM_NAME} <${fromEmail || FROM_EMAIL}>`,
    to:   [to],
    subject,
    html,
  });
  return httpsRequest({
    hostname: 'api.resend.com',
    port: 443,
    path: '/emails',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_KEY}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
  }, body);
}

// ── Main handler ───────────────────────────────────────────
module.exports = async function handler(req, res) {
  // Verify cron secret to prevent unauthorised triggers
  const authHeader = req.headers['authorization'];
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorised' });
  }

  if (!RESEND_KEY || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Missing environment variables' });
  }

  try {
    // 1. Load subscribers grouped by city from user_city_subscriptions
    //    Join email_preferences to ensure they have weekly_digest=true
    const subsRes = await supabase(
      'user_city_subscriptions?subscribed=eq.true&select=user_id,city,email_preferences!inner(email,weekly_digest)&email_preferences.weekly_digest=eq.true'
    );
    // Fallback: if join syntax not supported, use simple query
    let prefs = [];
    if (Array.isArray(subsRes.body) && subsRes.body.length) {
      prefs = subsRes.body.map(r => ({
        user_id: r.user_id,
        city:    r.city,
        email:   r.email_preferences?.email,
      })).filter(r => r.email);
    } else {
      // Fallback to legacy email_preferences (all geelong)
      const legacyRes = await supabase('email_preferences?weekly_digest=eq.true&select=user_id,email');
      prefs = (legacyRes.body || []).map(r => ({ ...r, city: 'geelong' }));
    }

    if (!prefs.length) {
      return res.status(200).json({ message: 'No subscribers', sent: 0 });
    }

    // 2. Load sites to get city names and from-addresses
    const sitesRes = await supabase('sites?select=slug,name,domain,full_name');
    const sitesMap = {};
    (sitesRes.body || []).forEach(s => { sitesMap[s.slug] = s; });

    // 3. Load Gold businesses once per run
    const goldBiz = await getGoldBusinesses(3);

    let sent = 0, errors = 0;

    for (const pref of prefs) {
      try {
        const citySlug = pref.city || 'geelong';
        const cityInfo = sitesMap[citySlug] || { name: 'Geelong', domain: 'whattodogeelong.com.au', full_name: 'What To Do Geelong' };
        const cityName = cityInfo.name || 'Geelong';
        const cityDomain = cityInfo.domain || 'whattodogeelong.com.au';

        // Get their top interests from last 30 days
        const categories = await getUserInterests(pref.user_id);

        // Fetch matching events for this city
        let events = categories.length
          ? await getTrendingEventsForCategories(categories, citySlug)
          : [];
        if (events.length < 3) {
          const fallback = await getFallbackEvents(citySlug);
          const ids = new Set(events.map(e => e.id));
          events = [...events, ...fallback.filter(e => !ids.has(e.id))].slice(0, 4);
        }

        // Build unsubscribe URL
        const unsubUrl = `https://${cityDomain}/api/unsubscribe?uid=${pref.user_id}&city=${citySlug}`;

        const html = buildEmail({
          userName:   '',
          categories,
          events,
          goldBiz,
          unsubUrl,
          cityName,
          cityDomain,
        });

        const subjectLine = categories.length
          ? `Your ${categories[0]} picks for this weekend in ${cityName} 🏙️`
          : `What's on in ${cityName} this weekend & beyond 🏙️`;

        const result = await sendEmail({
          to:       pref.email,
          subject:  subjectLine,
          html,
          fromName: cityInfo.full_name || `What To Do ${cityName}`,
          fromEmail: `hello@${cityDomain}`,
        });

        if (result.status >= 200 && result.status < 300) {
          sent++;
        } else {
          console.error('Send failed for', pref.email, result.body);
          errors++;
        }

        await new Promise(r => setTimeout(r, 200));

      } catch (e) {
        console.error('Error for user', pref.user_id, e.message);
        errors++;
      }
    }

    return res.status(200).json({ sent, errors, total: prefs.length });

  } catch (e) {
    console.error('Digest error:', e);
    return res.status(500).json({ error: e.message });
  }
};
