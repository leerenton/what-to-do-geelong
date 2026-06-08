'use strict';
/* ── WTDG ADMIN DASHBOARD ────────────────────────────────────*/

let currentPeriod = '30d';
let customFrom = '', customTo = '';

// ── INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const admin = await requireAdminAuth();
  if (!admin) return;

  initAdminShell('Dashboard');
  setupDateFilter();
  await loadDashboard();
  setupDigestTools();
});

// ── EMAIL DIGEST TOOLS ────────────────────────────────────────
function setupDigestTools() {
  async function callDigest(url, label, status) {
    status.textContent = `${label}…`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer wtdg-cron-2026' },
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        status.textContent = json.sent !== undefined
          ? `✅ Sent to ${json.sent} subscriber${json.sent !== 1 ? 's' : ''}${json.errors ? ` (${json.errors} errors)` : ''}`
          : '✅ Done';
      } else {
        status.textContent = `❌ Error: ${json.error || res.status}`;
      }
    } catch (e) {
      status.textContent = `❌ Network error: ${e.message}`;
    }
  }

  const status = document.getElementById('js-digest-admin-status');

  // Test send to all admin emails
  document.getElementById('js-test-digest-btn')?.addEventListener('click', async () => {
    await callDigest('/api/test-digest', 'Sending test to admin accounts', status);
  });

  // Send to all subscribers
  document.getElementById('js-send-digest-all-btn')?.addEventListener('click', async () => {
    if (!confirm('Send the weekly digest to ALL subscribed users now?')) return;
    await callDigest('/api/send-digest', 'Sending digest to all subscribers', status);
  });
}

// ── DATE FILTER ───────────────────────────────────────────────
function setupDateFilter() {
  const btns = document.querySelectorAll('.adm-date-btn');
  const customRow = document.getElementById('js-custom-date-row');

  btns.forEach(btn => {
    btn.addEventListener('click', async () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPeriod = btn.dataset.period;

      if (currentPeriod === 'custom') {
        customRow.style.display = 'flex';
      } else {
        customRow.style.display = 'none';
        await loadDashboard();
      }
    });
  });

  document.getElementById('js-custom-apply')?.addEventListener('click', async () => {
    customFrom = document.getElementById('js-date-from').value;
    customTo   = document.getElementById('js-date-to').value;
    await loadDashboard();
  });
}

// ── LOAD DASHBOARD ────────────────────────────────────────────
async function loadDashboard() {
  const content = document.getElementById('js-adm-content');
  content.innerHTML = '<div style="color:var(--adm-mid);padding:1rem 0">Fetching data…</div>';

  const { from, to } = getDateRange(currentPeriod, customFrom, customTo);

  // Fire all queries in parallel
  const [
    bizData,
    eventsData,
    guidesData,
    profilesData,
    promosData,
  ] = await Promise.all([
    db.from('businesses').select('id,name,subscription_tier,is_claimed,created_at').throwOnError().then(r => r.data || []).catch(() => []),
    db.from('events').select('id,title,created_at').throwOnError().then(r => r.data || []).catch(() => []),
    db.from('guides').select('id,created_at,user_id').throwOnError().then(r => r.data || []).catch(() => []),
    db.from('profiles').select('id,email,name,created_at').throwOnError().then(r => r.data || []).catch(() => []),
    db.from('promos').select('id,created_at').throwOnError().then(r => r.data || []).catch(() => []),
  ]);

  // ── Compute metrics ───────────────────────────────────────
  const fromDate = new Date(from);
  const toDate   = new Date(to);
  const inRange  = d => { const dt = new Date(d); return dt >= fromDate && dt <= toDate; };

  // Users
  const totalUsers     = profilesData.length;
  const newUsers       = profilesData.filter(u => inRange(u.created_at)).length;

  // Businesses
  const totalBiz       = bizData.length;
  const newBiz         = bizData.filter(b => inRange(b.created_at)).length;
  const claimedBiz     = bizData.filter(b => b.is_claimed).length;
  const claimedInRange = bizData.filter(b => b.is_claimed && inRange(b.created_at)).length;
  const paidBiz        = bizData.filter(b => b.subscription_tier && b.subscription_tier !== 'free' && b.subscription_tier !== null && b.subscription_tier !== '').length;
  const freeBiz        = totalBiz - paidBiz;

  // Events
  const totalEvents = eventsData.length;
  const newEvents   = eventsData.filter(e => inRange(e.created_at)).length;

  // Guides
  const totalGuides = guidesData.length;
  const newGuides   = guidesData.filter(g => inRange(g.created_at)).length;

  // Revenue (MRR based on tier × businesses)
  const { PRICING } = window.wtdgAdminAuth;
  let mrr = 0;
  bizData.forEach(b => { mrr += PRICING[b.subscription_tier] || 0; });
  const arr = mrr * 12;

  // Offers
  const newPromos = promosData.filter(p => inRange(p.created_at)).length;

  // ── Weekly chart data (last 8 weeks) ──────────────────────
  const weeklyUsers  = buildWeeklyBuckets(profilesData, 8);
  const weeklyEvents = buildWeeklyBuckets(eventsData, 8);
  const weeklyGuides = buildWeeklyBuckets(guidesData, 8);

  // ── Render ────────────────────────────────────────────────
  content.innerHTML = `
    <!-- Period label -->
    <p style="font-size:.78rem;color:var(--adm-mid);margin-bottom:1.25rem">
      Showing data for <strong style="color:var(--adm-text)">${periodLabel()}</strong>
      &nbsp;·&nbsp; Last updated ${new Date().toLocaleTimeString('en-AU', {hour:'2-digit',minute:'2-digit'})}
    </p>

    <!-- Stats row 1: Users -->
    <p class="adm-section__title" style="margin-bottom:.75rem;font-size:.72rem;text-transform:uppercase;letter-spacing:.06em;color:var(--adm-mid)">Users</p>
    <div class="adm-stats" style="margin-bottom:1.5rem">
      ${statCard('Total Users',  totalUsers,  '',         `+${newUsers} this period`)}
      ${statCard('New Users',    newUsers,    '',         'Registered in period', 'teal')}
    </div>

    <!-- Stats row 2: Businesses -->
    <p class="adm-section__title" style="margin-bottom:.75rem;font-size:.72rem;text-transform:uppercase;letter-spacing:.06em;color:var(--adm-mid)">Businesses</p>
    <div class="adm-stats" style="margin-bottom:1.5rem">
      ${statCard('Total Listings', totalBiz,        '', `+${newBiz} this period`)}
      ${statCard('Claimed',        claimedBiz,      '', `+${claimedInRange} claimed this period`, 'teal')}
      ${statCard('Free Plan',      freeBiz,         '', `${Math.round(freeBiz/Math.max(totalBiz,1)*100)}% of listings`)}
      ${statCard('Paid Plan',      paidBiz,         '', `${Math.round(paidBiz/Math.max(totalBiz,1)*100)}% of listings`, 'green')}
    </div>

    <!-- Stats row 3: Revenue -->
    <p class="adm-section__title" style="margin-bottom:.75rem;font-size:.72rem;text-transform:uppercase;letter-spacing:.06em;color:var(--adm-mid)">Revenue</p>
    <div class="adm-stats" style="margin-bottom:1.5rem">
      ${statCard('MRR',  '$'+mrr.toLocaleString(),  '', 'Monthly Recurring Revenue', 'green')}
      ${statCard('ARR',  '$'+arr.toLocaleString(),  '', 'Annual run rate')}
      ${statCard('Paid Accounts', paidBiz, '', 'Active paid subscriptions', 'teal')}
      ${statCard('Expected (Period)', '$'+Math.round(mrr*(periodDays()/30)).toLocaleString(), '', `Based on ${periodDays()} days`)}
    </div>

    <!-- Stats row 4: Content -->
    <p class="adm-section__title" style="margin-bottom:.75rem;font-size:.72rem;text-transform:uppercase;letter-spacing:.06em;color:var(--adm-mid)">Content</p>
    <div class="adm-stats" style="margin-bottom:2rem">
      ${statCard('Total Events', totalEvents, '', `+${newEvents} this period`)}
      ${statCard('New Events',   newEvents,   '', 'Added in period', 'teal')}
      ${statCard('Total Guides', totalGuides, '', `+${newGuides} this period`)}
      ${statCard('New Guides',   newGuides,   '', 'Created in period', 'teal')}
      ${statCard('New Offers',   newPromos,   '', 'Promos added in period')}
    </div>

    <!-- Charts -->
    <div class="adm-charts-grid">
      ${miniBarChart('New Users (weekly)', weeklyUsers)}
      ${miniBarChart('New Events (weekly)', weeklyEvents)}
      ${miniBarChart('New Guides (weekly)', weeklyGuides)}
    </div>

    <!-- Quick links -->
    <div style="display:flex;gap:.75rem;flex-wrap:wrap;margin-top:1rem">
      <a href="wtdgadmin-users.html" class="adm-btn adm-btn--outline adm-btn--sm" style="width:auto">View All Users</a>
      <a href="wtdgadmin-businesses.html" class="adm-btn adm-btn--outline adm-btn--sm" style="width:auto">View Businesses</a>
      <a href="wtdgadmin-events.html" class="adm-btn adm-btn--outline adm-btn--sm" style="width:auto">View Events</a>
      <a href="wtdgadmin-revenue.html" class="adm-btn adm-btn--outline adm-btn--sm" style="width:auto">Revenue Dashboard →</a>
    </div>

    <!-- Email tools -->
    <div style="margin-top:1.5rem;padding:1.25rem;background:var(--adm-surface);border:1px solid var(--adm-border);border-radius:10px">
      <div style="font-size:.8rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--adm-mid);margin-bottom:.85rem">📧 Email Digest</div>
      <div style="display:flex;align-items:center;gap:.75rem;flex-wrap:wrap">
        <div>
          <label style="font-size:.8rem;color:var(--adm-mid);display:block;margin-bottom:.3rem">Send preview to admin accounts</label>
          <button class="adm-btn adm-btn--sm" id="js-test-digest-btn">Send test email</button>
        </div>
        <div style="border-left:1px solid var(--adm-border);padding-left:.75rem">
          <label style="font-size:.8rem;color:var(--adm-mid);display:block;margin-bottom:.3rem">Send to all subscribers</label>
          <button class="adm-btn adm-btn--sm adm-btn--outline" id="js-send-digest-all-btn">Send digest now</button>
        </div>
      </div>
      <p id="js-digest-admin-status" style="margin:.65rem 0 0;font-size:.82rem;color:var(--adm-teal);min-height:1.2em"></p>
    </div>`;
}

// ── HELPERS ───────────────────────────────────────────────────
function statCard(label, value, sub, trend = '', variant = '') {
  return `<div class="adm-stat${variant ? ' adm-stat--'+variant : ''}">
    <div class="adm-stat__label">${label}</div>
    <div class="adm-stat__value">${value}</div>
    ${sub   ? `<div class="adm-stat__sub">${sub}</div>` : ''}
    ${trend ? `<div class="adm-stat__trend">${trend}</div>` : ''}
  </div>`;
}

function buildWeeklyBuckets(rows, weeks) {
  const buckets = [];
  const now = new Date();
  for (let i = weeks - 1; i >= 0; i--) {
    const start = new Date(now - (i + 1) * 7 * 864e5);
    const end   = new Date(now - i * 7 * 864e5);
    const count = rows.filter(r => {
      const d = new Date(r.created_at);
      return d >= start && d < end;
    }).length;
    const label = start.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });
    buckets.push({ label, count });
  }
  return buckets;
}

function miniBarChart(title, buckets) {
  const max = Math.max(...buckets.map(b => b.count), 1);
  const bars = buckets.map(b => {
    const h = Math.max(Math.round((b.count / max) * 72), 2);
    return `<div class="adm-bar-col">
      <div class="adm-bar" style="height:${h}px" title="${b.label}: ${b.count}"></div>
      <span class="adm-bar-label">${b.label.split(' ')[0]}</span>
    </div>`;
  }).join('');
  return `<div class="adm-chart-wrap">
    <div class="adm-chart-title">${title}</div>
    <div class="adm-bars">${bars}</div>
  </div>`;
}

function periodLabel() {
  if (currentPeriod === '30d')   return 'Last 30 days';
  if (currentPeriod === '90d')   return 'Last 90 days';
  if (currentPeriod === 'ytd')   return 'Year to date';
  if (currentPeriod === 'custom' && customFrom) return `${customFrom} → ${customTo || 'today'}`;
  return 'Last 30 days';
}

function periodDays() {
  const { from, to } = getDateRange(currentPeriod, customFrom, customTo);
  return Math.max(1, Math.round((new Date(to) - new Date(from)) / 864e5));
}
