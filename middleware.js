import { NextResponse } from 'next/server';

const SUPABASE_URL = 'https://duhxszqyyzrbzrhwneey.supabase.co';
const SUPABASE_KEY = 'sb_publishable_hQC1qopXEWqlHPACU30OQA_LoeW5sw2';

// Map of hostname → file to serve at the root path
// Add new cities here as they launch
const CITY_ROOTS = {
  'whattodovictoria.com.au':     '/victoria.html',
  'www.whattodovictoria.com.au': '/victoria.html',
  'whattodoballarat.com.au':     '/index.html',
  'www.whattodoballarat.com.au': '/index.html',
  // 'whattodobendigo.com.au':   '/index.html',
};

export async function middleware(request) {
  const host     = request.headers.get('host') || '';
  const hostname = host.replace(/:\d+$/, ''); // strip port if present
  const { pathname } = request.nextUrl;

  // ── 1. Check site mode (coming_soon / maintenance) ──────────────────────────
  // Only check on root path for known city domains — skip admin, assets, api
  const isCityDomain = hostname in CITY_ROOTS;
  const isRootPath   = pathname === '/';

  if (isCityDomain && isRootPath) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/sites?or=(domain.eq.${hostname},domain_www.eq.${host})&select=site_mode&limit=1`,
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
          const url = request.nextUrl.clone();
          url.pathname = '/maintenance.html';
          return NextResponse.rewrite(url);
        }
        if (mode === 'coming_soon') {
          const url = request.nextUrl.clone();
          url.pathname = '/comingsoon.html';
          return NextResponse.rewrite(url);
        }
      }
    } catch (_) {
      // Fail open — serve normally if Supabase is unreachable
    }
  }

  // ── 2. City homepage routing ─────────────────────────────────────────────────
  if (isRootPath && CITY_ROOTS[hostname]) {
    const url = request.nextUrl.clone();
    url.pathname = CITY_ROOTS[hostname];
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/',
};
