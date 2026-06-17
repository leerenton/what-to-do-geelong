'use strict';
/* ── Site mode guard ─────────────────────────────────────────────────────────
   Runs on every page. Checks the sites table for the current domain's
   site_mode and redirects to /maintenance or /coming-soon if needed.
   Skipped if already on those pages, or on admin pages.
   ─────────────────────────────────────────────────────────────────────────── */
(async function siteGuard() {
  const path = window.location.pathname;

  // Don't guard admin, maintenance, coming-soon pages, or admin preview bypass
  if (
    path.includes('wtdgadmin') ||
    path.includes('maintenance') ||
    path.includes('comingsoon') ||
    path.includes('coming-soon') ||
    document.cookie.includes('wtdg_admin_bypass=1')
  ) return;

  try {
    const host = window.location.hostname;
    const { data } = await db
      .from('sites')
      .select('site_mode')
      .or(`domain.eq.${host},domain_www.eq.${host}`)
      .maybeSingle();

    if (!data) return; // unknown domain — let it render normally

    if (data.site_mode === 'maintenance') {
      window.location.replace('/maintenance');
    } else if (data.site_mode === 'coming_soon') {
      window.location.replace('/comingsoon.html');
    }
  } catch (_) {
    // Fail open — never break a live site due to a guard error
  }
})();
