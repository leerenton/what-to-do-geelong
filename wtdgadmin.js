'use strict';
/* ── WTDG SUPER ADMIN SHARED ─────────────────────────────────
   Loaded on every admin page.
   Handles: auth guard, nav active state, impersonation API.
──────────────────────────────────────────────────────────────*/

// ── CONFIG ────────────────────────────────────────────────────
const ADMIN_EMAILS = [
  'lee.renton81@gmail.com',
  // add more super admin emails here
];
window.ADMIN_EMAILS = ADMIN_EMAILS;

const PRICING = {
  free:     0,
  starter:  29,
  growth:   79,
  premium:  149,
};

// ── IMPERSONATION HELPERS ─────────────────────────────────────
const IMP_KEY = 'wtdg_admin_impersonating';

function isImpersonating() {
  try { return !!JSON.parse(sessionStorage.getItem(IMP_KEY)); } catch { return false; }
}
function getImpersonation() {
  try { return JSON.parse(sessionStorage.getItem(IMP_KEY)); } catch { return null; }
}
function startImpersonation(targetUser, adminInfo) {
  sessionStorage.setItem(IMP_KEY, JSON.stringify({ targetUser, adminInfo, startedAt: Date.now() }));
}
function stopImpersonation() {
  sessionStorage.removeItem(IMP_KEY);
}
window.wtdgAdminImp = { isImpersonating, getImpersonation, startImpersonation, stopImpersonation };

// ── IMPERSONATION BANNER (injected on PUBLIC pages) ───────────
function maybeShowImpersonationBanner() {
  if (!isImpersonating()) return;
  const imp = getImpersonation();
  if (!imp) return;

  // Add body padding so content isn't hidden behind banner
  document.body.style.paddingBottom = '56px';

  const bar = document.createElement('div');
  bar.className = 'adm-impersonate-bar';
  bar.innerHTML = `
    <div class="adm-impersonate-bar__left">
      <span class="adm-impersonate-bar__badge">ADMIN MODE</span>
      Viewing as <strong style="margin-left:.3rem">${imp.targetUser.name || imp.targetUser.email}</strong>
      <span style="opacity:.7;font-size:.75rem">(${imp.targetUser.email})</span>
    </div>
    <button class="adm-impersonate-bar__exit" id="js-adm-exit-imp">Exit &amp; Return to Admin</button>`;
  document.body.appendChild(bar);

  // Inject CSS if not already on page
  if (!document.getElementById('adm-imp-css')) {
    const link = document.createElement('link');
    link.id = 'adm-imp-css';
    link.rel = 'stylesheet';
    link.href = 'wtdgadmin.css';
    document.head.appendChild(link);
  }

  document.getElementById('js-adm-exit-imp').addEventListener('click', () => {
    stopImpersonation();
    window.location.href = 'wtdgadmin-users.html';
  });
}

// ── ADMIN AUTH GUARD ──────────────────────────────────────────
const ADM_SESSION_KEY = 'wtdg_admin_session';

function getAdminSession() {
  try { return JSON.parse(sessionStorage.getItem(ADM_SESSION_KEY)); } catch { return null; }
}
function setAdminSession(email, userId) {
  sessionStorage.setItem(ADM_SESSION_KEY, JSON.stringify({ email, userId, at: Date.now() }));
}
function clearAdminSession() {
  sessionStorage.removeItem(ADM_SESSION_KEY);
}
window.wtdgAdminAuth = { getAdminSession, setAdminSession, clearAdminSession, PRICING };
// Also expose individually for inline scripts
window.setAdminSession = setAdminSession;
window.getAdminSession = getAdminSession;
window.clearAdminSession = clearAdminSession;

/**
 * Call this at the top of every admin dashboard page.
 * Redirects to login if not authenticated as a super admin.
 */
async function requireAdminAuth() {
  // Check cached session first (valid for 4 hours)
  const cached = getAdminSession();
  if (cached && (Date.now() - cached.at < 4 * 60 * 60 * 1000)) {
    if (ADMIN_EMAILS.includes(cached.email)) return cached;
  }

  // Re-check Supabase session
  try {
    const timeout = new Promise(r => setTimeout(() => r(null), 3000));
    const session = await Promise.race([
      db.auth.getSession().then(r => r.data?.session ?? null),
      timeout,
    ]);
    if (session?.user && ADMIN_EMAILS.includes(session.user.email)) {
      setAdminSession(session.user.email, session.user.id);
      return { email: session.user.email, userId: session.user.id };
    }
  } catch (_) {}

  window.location.href = 'wtdgadmin.html';
  return null;
}
window.requireAdminAuth = requireAdminAuth;

// ── DATE FILTER HELPERS ───────────────────────────────────────
function getDateRange(period, customFrom, customTo) {
  const now = new Date();
  let from, to = now.toISOString();
  if (period === '30d') {
    from = new Date(now - 30 * 864e5).toISOString();
  } else if (period === '90d') {
    from = new Date(now - 90 * 864e5).toISOString();
  } else if (period === 'ytd') {
    from = new Date(now.getFullYear(), 0, 1).toISOString();
  } else if (period === 'custom') {
    from = customFrom ? new Date(customFrom).toISOString() : new Date(now - 30 * 864e5).toISOString();
    to   = customTo   ? new Date(customTo + 'T23:59:59').toISOString() : to;
  }
  return { from, to };
}
window.getDateRange = getDateRange;

// ── SIDEBAR ACTIVE STATE ──────────────────────────────────────
function setAdminNavActive() {
  const page = window.location.pathname.split('/').pop() || '';
  document.querySelectorAll('.adm-nav__item').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === page);
  });
}

// ── LOGOUT ────────────────────────────────────────────────────
async function adminLogout() {
  clearAdminSession();
  try { await db.auth.signOut(); } catch (_) {}
  window.location.href = 'wtdgadmin.html';
}
window.adminLogout = adminLogout;

// ── INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setAdminNavActive();

  const logoutBtn = document.getElementById('js-adm-logout');
  if (logoutBtn) logoutBtn.addEventListener('click', adminLogout);
});

// Expose on every public page (loaded via auth.js check)
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', maybeShowImpersonationBanner);
}
