'use strict';
/* ── SITE MODE CHECK ─────────────────────────────────────────
   Loaded on every public page. Checks Supabase for site_mode:
     'live'        → normal, do nothing
     'maintenance' → redirect to maintenance.html
     'coming_soon' → redirect to comingsoon.html

   ADMIN BYPASS: if logged-in user's email is in ADMIN_EMAILS,
   they always see the live site regardless of mode.

   Caches result in sessionStorage for 2 min to avoid hammering
   Supabase on every page navigation.
──────────────────────────────────────────────────────────────*/

(async function checkSiteMode() {
  // Never intercept admin pages or the mode pages themselves
  const page = window.location.pathname.split('/').pop() || '';
  const exempt = ['maintenance.html', 'comingsoon.html', 'wtdgadmin.html',
                  'wtdgadmin-dash.html', 'wtdgadmin-users.html', 'wtdgadmin-businesses.html',
                  'wtdgadmin-events.html', 'wtdgadmin-offers.html', 'wtdgadmin-revenue.html',
                  'wtdgadmin-settings.html', 'login.html'];
  if (exempt.some(e => page.includes(e))) return;

  // ── Admin bypass (cookie or logged-in admin) ────────────────────────────
  if (document.cookie.includes('wtdg_admin_bypass=1')) return;
  const ADMIN_EMAILS = ['lee.renton81@gmail.com', 'adele@whattodogeelong.com.au'];
  try {
    const acct = JSON.parse(localStorage.getItem('wtdg_account') || 'null');
    if (acct?.email && ADMIN_EMAILS.includes(acct.email)) return;
  } catch (_) {}

  // ── Cache check (2 min TTL) ─────────────────────────────
  const CACHE_KEY = 'wtdg_site_mode_cache';
  try {
    const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY));
    if (cached && (Date.now() - cached.at < 2 * 60 * 1000)) {
      applyMode(cached.mode);
      return;
    }
  } catch (_) {}

  // ── Fetch from Supabase ─────────────────────────────────
  if (typeof db === 'undefined') return;
  try {
    const timeout = new Promise(r => setTimeout(() => r(null), 2500));
    const result  = await Promise.race([
      db.from('site_settings').select('value').eq('key', 'site_mode').single(),
      timeout,
    ]);
    const mode = result?.data?.value || 'live';
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ mode, at: Date.now() }));
    applyMode(mode);
  } catch (_) {
    // On error, default to live — don't block users
  }

  function applyMode(mode) {
    if (mode === 'maintenance') {
      window.location.replace('maintenance.html');
    } else if (mode === 'coming_soon') {
      window.location.replace('comingsoon.html');
    }
  }
})();
