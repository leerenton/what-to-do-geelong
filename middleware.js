import { NextResponse } from 'next/server';

// Map of hostname → file to serve at the root path
// Add new cities here as they launch
const CITY_ROOTS = {
  'whattodovictoria.com.au':     '/victoria.html',
  'www.whattodovictoria.com.au': '/victoria.html',
  // 'whattodoballarat.com.au':     '/ballarat.html',
  // 'whattodobendigo.com.au':      '/bendigo.html',
  // 'whattodomelbourne.com.au':    '/melbourne.html',
};

export function middleware(request) {
  const host = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;

  // Only intercept root path requests
  if (pathname === '/' && CITY_ROOTS[host]) {
    const url = request.nextUrl.clone();
    url.pathname = CITY_ROOTS[host];
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/',
};
