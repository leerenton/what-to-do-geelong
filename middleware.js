'use strict';
/* ── Vercel Edge Middleware (non-Next.js static site) ────────────────────── */

const SUPABASE_URL = 'https://duhxszqyyzrbzrhwneey.supabase.co';
const SUPABASE_KEY = 'sb_publishable_hQC1qopXEWqlHPACU30OQA_LoeW5sw2';

// Admin subdomain — all paths rewritten to /wtdgadmin/...
const ADMIN_HOSTNAME = 'wtdadmin.whattodovictoria.com.au';

// Map of hostname → file to serve at the root path
const CITY_ROOTS = {
  'whattodovictoria.com.au':     '/victoria.html',
  'www.whattodovictoria.com.au': '/victoria.html',
  'whattodoballarat.com.au':     '/index.html',
  'www.whattodoballarat.com.au': '/index.html',
  // 'whattodobendigo.com.au':   '/index.html',
};

export default async function middleware(request) {
  const url      = new URL(request.url);
  const hostname = url.hostname;
  const pathname = url.pathname;

  // ── Admin subdomain: rewrite all paths to /wtdgadmin/* ────────────────────
  if (hostname === ADMIN_HOSTNAME) {
    // / or /dash → /wtdgadmin/dash
    // /sites      → /wtdgadmin/sites
    // /login      → /login (pass through for login page)
    const clean = pathname === '/' ? '/dash' : pathname;
    if (clean === '/login') return; // pass through to login.html via vercel.json
    return fetch(new URL(`/wtdgadmin${clean}`, request.url));
  }

  if (pathname !== '/') return; // only intercept root for other domains

  const isCityDomain = hostname in CITY_ROOTS;

  // ── 1. Admin bypass cookie — skip mode check, pass through to index.html ──
  const cookies = request.headers.get('cookie') || '';
  if (cookies.includes('wtdg_admin_bypass=1')) {
    // Return undefined — Vercel serves index.html for / on all domains by default
    return;
  }

  // ── 2. Check site mode from Supabase ──────────────────────────────────────
  if (isCityDomain) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/sites?or=(domain.eq.${hostname},domain_www.eq.${hostname})&select=site_mode&limit=1`,
        {
          headers: {
            apikey:        SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
          cache: 'no-store',
        }
      );
      if (res.ok) {
        const rows = await res.json();
        const mode = rows?.[0]?.site_mode;
        if (mode === 'maintenance') {
          return fetch(new URL('/maintenance.html', request.url));
        }
        if (mode === 'coming_soon') {
          return fetch(new URL('/comingsoon.html', request.url));
        }
      }
    } catch (_) {
      // Fail open — serve normally if Supabase unreachable
    }
  }

  // ── 3. City homepage routing ───────────────────────────────────────────────
  if (CITY_ROOTS[hostname]) {
    return fetch(new URL(CITY_ROOTS[hostname], request.url));
  }
}

export const config = {
  // Run on all paths so the admin subdomain can intercept any route
  matcher: '/(.*)',
};
