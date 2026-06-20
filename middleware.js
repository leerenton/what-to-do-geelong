'use strict';
/* ── Vercel Edge Middleware ───────────────────────────────────────────────────
   1. Admin subdomain → wtdgadmin HTML files
   2. City domains → check page cache, serve enhanced HTML if fresh
   3. On cache miss → check site mode, enhance HTML with SEO data, cache & serve
   ─────────────────────────────────────────────────────────────────────────── */

const SUPABASE_URL = 'https://duhxszqyyzrbzrhwneey.supabase.co';
const SUPABASE_KEY = 'sb_publishable_hQC1qopXEWqlHPACU30OQA_LoeW5sw2';
const ADMIN_HOSTNAME = 'wtdadmin.whattodovictoria.com.au';
const CACHE_TTL_MS  = 24 * 60 * 60 * 1000; // 24 hours

// Known city domains
const CITY_MAP = {
  'whattodogeelong.com.au':      { slug: 'geelong',  name: 'Geelong' },
  'www.whattodogeelong.com.au':  { slug: 'geelong',  name: 'Geelong' },
  'whattodoballarat.com.au':     { slug: 'ballarat', name: 'Ballarat' },
  'www.whattodoballarat.com.au': { slug: 'ballarat', name: 'Ballarat' },
};

// City domains that need a different root HTML file
const CITY_ROOTS = {
  'whattodovictoria.com.au':     '/victoria.html',
  'www.whattodovictoria.com.au': '/victoria.html',
  'whattodoballarat.com.au':     '/index.html',
  'www.whattodoballarat.com.au': '/index.html',
};

// File extensions that are never HTML — skip all middleware logic
const ASSET_RE = /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|webp|map|json|txt|xml)$/i;

// Paths that should always pass through untouched
const PASSTHROUGH_RE = /^\/(api|_next|_vercel|wtdgadmin|assets)\//;

// ── Page type detection ───────────────────────────────────────────────────────
function getPageType(pathname) {
  // .html extension = a known page file, never a business slug
  if (pathname.endsWith('.html')) return 'other';

  const p = pathname.replace(/\/$/, '') || '/';
  if (p === '/' || p === '/index') return 'home';
  if (p.startsWith('/eat'))      return 'eat';
  if (p.startsWith('/drink'))    return 'drink';
  if (p.startsWith('/do'))       return 'do';
  if (p.startsWith('/events'))   return 'events';
  if (p.startsWith('/news'))     return 'other';
  if (p.startsWith('/guide'))    return 'other';
  if (p.startsWith('/giveaway')) return 'other';
  if (p.startsWith('/promote'))  return 'other';
  if (p.startsWith('/account'))  return 'other';
  if (p.startsWith('/login'))    return 'other';
  if (p.startsWith('/signup'))   return 'other';
  if (p.startsWith('/onboard'))  return 'other';
  if (p.startsWith('/support'))  return 'other';
  if (p.startsWith('/contact'))  return 'other';
  if (p.startsWith('/victoria')) return 'other';
  if (p.startsWith('/advertise'))return 'other';
  if (p.startsWith('/upgrade'))  return 'other';
  // Single-segment clean path with no known prefix = business listing slug
  const seg = p.replace(/^\//, '');
  if (seg && !seg.includes('/')) return 'listing';
  return 'other';
}

// ── Supabase helpers ──────────────────────────────────────────────────────────
async function sbGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.json();
}

async function getCachedPage(key) {
  try {
    const rows = await sbGet(`page_cache?url=eq.${encodeURIComponent(key)}&select=html,cached_at&limit=1`);
    if (!rows?.length) return null;
    const age = Date.now() - new Date(rows[0].cached_at).getTime();
    return age < CACHE_TTL_MS ? rows[0].html : null;
  } catch { return null; }
}

async function storeCachedPage(key, html, city) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/page_cache`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({ url: key, html, city, cached_at: new Date().toISOString() }),
    });
  } catch (_) {}
}

// ── HTML enhancement ──────────────────────────────────────────────────────────
function enhanceHtml(html, { cityName, citySlug, pageType, biz, businesses, eventsData }) {
  let out = html;

  // 1. Replace Geelong → actual city name in title + meta
  if (cityName !== 'Geelong') {
    out = out.replace(/(<title>[^<]*)Geelong([^<]*<\/title>)/g, `$1${cityName}$2`);
    out = out.replace(/(meta[^>]+name="description"[^>]+content=")([^"]*)"/,
      (_, pre, content) => `${pre}${content.replace(/Geelong/g, cityName)}"`);
    out = out.replace(/(meta[^>]+property="og:title"[^>]+content=")([^"]*)"/,
      (_, pre, c) => `${pre}${c.replace(/Geelong/g, cityName)}"`);
    out = out.replace(/(meta[^>]+property="og:description"[^>]+content=")([^"]*)"/,
      (_, pre, c) => `${pre}${c.replace(/Geelong/g, cityName)}"`);
  }

  let jsonLd = null;
  let ssrBlock = '';

  // 2. Business listing page — full LocalBusiness schema + pre-rendered content
  if (pageType === 'listing' && biz) {
    const bizTitle = `${biz.name} — ${biz.suburb || cityName} | What To Do ${cityName}`;
    const bizDesc  = (biz.description || `${biz.name} in ${biz.suburb || cityName}. Discover more on What To Do ${cityName}.`).slice(0, 155);

    const bizUrl = `https://whattodo${citySlug}.com.au/${biz.slug}`;
    out = out.replace(/<title>[^<]*<\/title>/, `<title>${bizTitle}</title>`);
    out = out.replace(/(meta[^>]+name="description"[^>]+content=")[^"]*"/, `$1${bizDesc}"`);
    out = out.replace(/(meta[^>]+property="og:title"[^>]+content=")[^"]*"/, `$1${bizTitle}"`);
    out = out.replace(/(meta[^>]+property="og:description"[^>]+content=")[^"]*"/, `$1${bizDesc}"`);
    out = out.replace(/(meta[^>]+property="og:url"[^>]+content=")[^"]*"/, `$1${bizUrl}"`);
    out = out.replace(/(link[^>]+rel="canonical"[^>]+href=")[^"]*"/, `$1${bizUrl}"`);
    if (biz.img) {
      out = out.replace(/(meta[^>]+property="og:image"[^>]+content=")[^"]*"/, `$1${biz.img}"`);
    }

    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: biz.name,
      ...(biz.description && { description: biz.description }),
      ...(biz.img         && { image: biz.img }),
      url: `https://whattodo${citySlug}.com.au/${biz.slug}`,
      address: {
        '@type': 'PostalAddress',
        ...(biz.location && { streetAddress: biz.location }),
        addressLocality: biz.suburb || cityName,
        addressRegion: 'VIC',
        addressCountry: 'AU',
      },
      ...(biz.phone   && { telephone: biz.phone }),
      ...(biz.website && { sameAs: biz.website }),
    };

    // Crawlable SSR block — visually hidden, read by bots
    ssrBlock = `<div id="js-ssr-biz" style="position:absolute;left:-9999px;top:0;width:1px;height:1px;overflow:hidden" aria-hidden="true">
  <h1>${escHtml(biz.name)}</h1>
  ${biz.type        ? `<p>${escHtml(biz.type)}</p>` : ''}
  ${biz.suburb      ? `<p>Located in ${escHtml(biz.suburb)}, ${escHtml(cityName)}, Victoria.</p>` : ''}
  ${biz.description ? `<p>${escHtml(biz.description)}</p>` : ''}
  ${biz.location    ? `<address>${escHtml(biz.location)}</address>` : ''}
  ${biz.phone       ? `<p>Phone: ${escHtml(biz.phone)}</p>` : ''}
  ${biz.website     ? `<p><a href="${escAttr(biz.website)}" rel="noopener">Visit website</a></p>` : ''}
</div>`;

  // 3. Category pages — ItemList schema + crawlable business links
  // 4. Events page — ItemList of Events schema + crawlable SSR list
  } else if (pageType === 'events' && eventsData?.length) {
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `Upcoming Events in ${cityName}`,
      description: `Discover upcoming events in ${cityName}, Victoria. Festivals, markets, live music, arts and more.`,
      itemListElement: eventsData.slice(0, 30).map((e, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@context': 'https://schema.org',
          '@type': 'Event',
          name: e.title,
          startDate: e.date,
          eventStatus: 'https://schema.org/EventScheduled',
          eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
          url: `https://whattodo${citySlug}.com.au/events/${e.slug || ''}`,
          location: { '@type': 'Place', name: e.location || cityName, address: { '@type': 'PostalAddress', addressLocality: cityName, addressRegion: 'VIC', addressCountry: 'AU' } },
          ...(e.img ? { image: e.img } : {}),
          ...(e.description ? { description: e.description.slice(0, 150) } : {}),
        },
      })),
    };

    const evLinks = eventsData.slice(0, 50).map(e =>
      `<li><a href="/events/${escAttr(e.slug || '')}">${escHtml(e.title)}${e.date ? ` — ${escHtml(e.date)}` : ''}${e.location ? ` at ${escHtml(e.location)}` : ''}</a></li>`
    ).join('');
    ssrBlock = `<ul id="js-ssr-events" style="position:absolute;left:-9999px;top:0;width:1px;height:1px;overflow:hidden" aria-hidden="true">${evLinks}</ul>`;

  } else if ((pageType === 'eat' || pageType === 'drink' || pageType === 'do') && businesses?.length) {
    const pageLabel = pageType === 'eat' ? 'Restaurants & Cafes'
                    : pageType === 'drink' ? 'Bars, Pubs & Breweries'
                    : 'Things To Do & Attractions';
    const bizType   = pageType === 'eat' ? 'FoodEstablishment'
                    : pageType === 'drink' ? 'BarOrPub'
                    : 'TouristAttraction';

    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `${pageLabel} in ${cityName}`,
      description: `Discover the best ${pageLabel.toLowerCase()} in ${cityName}, Victoria.`,
      itemListElement: businesses.slice(0, 30).map((b, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': bizType,
          name: b.name,
          url: `https://whattodo${citySlug}.com.au/${b.slug}`,
          ...(b.description && { description: b.description.slice(0, 100) }),
          ...(b.suburb && { address: { '@type': 'PostalAddress', addressLocality: b.suburb, addressRegion: 'VIC', addressCountry: 'AU' } }),
        },
      })),
    };

    // Hidden crawlable list so bots can follow links to individual pages
    const links = businesses.slice(0, 50).map(b =>
      `<li><a href="/${escAttr(b.slug)}">${escHtml(b.name)}${b.suburb ? ` — ${escHtml(b.suburb)}` : ''}</a></li>`
    ).join('');
    ssrBlock = `<ul id="js-ssr-list" style="position:absolute;left:-9999px;top:0;width:1px;height:1px;overflow:hidden" aria-hidden="true">${links}</ul>`;
  }

  // Inject JSON-LD into <head>
  if (jsonLd) {
    const tag = `\n<script type="application/ld+json">${JSON.stringify(jsonLd, null, 0)}</script>`;
    out = out.replace('</head>', tag + '\n</head>');
  }

  // Inject SSR block right after <body>
  if (ssrBlock) {
    out = out.replace(/<body[^>]*>/, m => m + '\n' + ssrBlock);
  }

  return out;
}

function escHtml(s)  { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function escAttr(s)  { return String(s).replace(/"/g,'&quot;'); }

// ── Main middleware ───────────────────────────────────────────────────────────
export default async function middleware(request) {
  const url      = new URL(request.url);
  const hostname = url.hostname;
  const pathname = url.pathname;
  const cookies  = request.headers.get('cookie') || '';
  const bypass   = cookies.includes('wtdg_admin_bypass=1');

  // ── Admin subdomain ────────────────────────────────────────────────────────
  if (hostname === ADMIN_HOSTNAME) {
    const ADMIN_PAGES = {
      '/':            '/wtdgadmin-dash.html',
      '/dash':        '/wtdgadmin-dash.html',
      '/sites':       '/wtdgadmin-sites.html',
      '/businesses':  '/wtdgadmin-businesses.html',
      '/events':      '/wtdgadmin-events.html',
      '/offers':      '/wtdgadmin-offers.html',
      '/promotions':  '/wtdgadmin-promotions.html',
      '/revenue':     '/wtdgadmin-revenue.html',
      '/users':       '/wtdgadmin-users.html',
      '/content':     '/wtdgadmin-content.html',
      '/homepage':    '/wtdgadmin-homepage.html',
      '/inquiries':   '/wtdgadmin-inquiries.html',
    };
    const target = ADMIN_PAGES[pathname];
    if (target) return fetch(new URL(target, request.url));
    return;
  }

  // ── Skip assets and passthrough paths ─────────────────────────────────────
  if (ASSET_RE.test(pathname) || PASSTHROUGH_RE.test(pathname)) {
    return; // Vercel handles it directly
  }

  // ── Old signup/onboarding paths — 301 to unified flow ──────────────────────
  if (pathname === '/signup.html' || pathname === '/signup') {
    const dest = new URL('/onboard.html', request.url);
    dest.searchParams.set('path', 'user');
    return new Response(null, { status: 301, headers: { 'Location': dest.toString() } });
  }
  if (pathname === '/onboarding.html' || pathname === '/onboarding') {
    const dest = new URL('/onboard.html', request.url);
    dest.searchParams.set('path', 'user');
    return new Response(null, { status: 301, headers: { 'Location': dest.toString() } });
  }

  // ── Admin preview entry point — set bypass cookie and redirect to homepage ──
  if (pathname === '/admin-preview') {
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/',
        'Set-Cookie': 'wtdg_admin_bypass=1; Path=/; Max-Age=86400; SameSite=Lax',
      },
    });
  }

  const city     = CITY_MAP[hostname];
  const pageType = getPageType(pathname);

  // ── Non-city domains (Victoria homepage etc.) — no caching, just routing ──
  if (!city) {
    if (CITY_ROOTS[hostname] && pathname === '/') {
      return fetch(new URL(CITY_ROOTS[hostname], request.url));
    }
    return;
  }

  // ── Admin bypass: skip cache entirely, still do city root routing ─────────
  if (bypass) {
    if (CITY_ROOTS[hostname] && pathname === '/') {
      return fetch(new URL(CITY_ROOTS[hostname], request.url));
    }
    return;
  }

  // ── Cache key = hostname + pathname (clean, no query string) ─────────────
  const cacheKey = `${hostname}${pathname === '/' ? '/' : pathname.replace(/\.html$/, '')}`;

  // ── Cache HIT — serve immediately ─────────────────────────────────────────
  const cached = await getCachedPage(cacheKey);
  if (cached) {
    return new Response(cached, {
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Cache': 'HIT' },
    });
  }

  // ── Cache MISS ─────────────────────────────────────────────────────────────

  // 1. Check site mode
  try {
    const rows = await sbGet(
      `sites?or=(domain.eq.${hostname},domain_www.eq.${hostname})&select=site_mode&limit=1`
    );
    const mode = rows?.[0]?.site_mode;
    if (mode === 'maintenance') return fetch(new URL('/maintenance.html', request.url));
    if (mode === 'coming_soon') return fetch(new URL('/comingsoon.html', request.url));
  } catch (_) {}

  // 2. Determine which HTML file to fetch
  let htmlPath = pathname;
  if (pathname === '/' || pathname === '') {
    htmlPath = CITY_ROOTS[hostname] || '/index.html';
  } else if (pageType === 'listing') {
    htmlPath = '/listing.html';
  } else if (!pathname.endsWith('.html')) {
    // Clean URL → try .html version
    htmlPath = pathname + '.html';
  }

  // 3. Fetch base HTML
  let baseHtml;
  try {
    const r = await fetch(new URL(htmlPath, request.url));
    if (!r.ok) return; // pass through to Vercel's 404 handler
    baseHtml = await r.text();
  } catch { return; }

  // 4. Fetch page-specific SEO data from Supabase
  let biz = null;
  let businesses = [];
  let eventsData = [];

  if (pageType === 'listing') {
    const slug = pathname.replace(/^\//, '').replace(/\.html$/, '');
    try {
      const rows = await sbGet(
        `businesses?slug=eq.${encodeURIComponent(slug)}&city=eq.${city.slug}&select=name,slug,description,location,suburb,phone,website,img,type&limit=1`
      );
      biz = rows?.[0] || null;
    } catch (_) {}

  } else if (pageType === 'eat' || pageType === 'drink' || pageType === 'do') {
    try {
      const rows = await sbGet(
        `businesses?city=eq.${city.slug}&or=(status.eq.approved,status.is.null)&select=name,slug,description,suburb,type&order=admin_priority.desc.nullslast,name.asc&limit=60`
      );
      businesses = rows || [];
    } catch (_) {}
  } else if (pageType === 'events') {
    try {
      const rows = await sbGet(
        `events?city=eq.${city.slug}&or=(status.eq.approved,status.is.null)&select=title,slug,date,location,description,img&order=admin_priority.desc.nullslast,date.asc&limit=50`
      );
      eventsData = rows || [];
    } catch (_) {}
  }

  // 5. Enhance HTML
  const enhanced = enhanceHtml(baseHtml, {
    cityName: city.name,
    citySlug: city.slug,
    pageType,
    biz,
    businesses,
    eventsData,
  });

  // 6. Store in cache (awaited — ensures cache is warm for next visitor)
  await storeCachedPage(cacheKey, enhanced, city.slug);

  // 7. Serve
  return new Response(enhanced, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Cache': 'MISS' },
  });
}

export const config = {
  matcher: '/(.*)',
};
