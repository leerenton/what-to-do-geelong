'use strict';

// ── SUPABASE CLIENT ───────────────────────────────────────
const SUPABASE_URL = 'https://duhxszqyyzrbzrhwneey.supabase.co';
const SUPABASE_KEY = 'sb_publishable_hQC1qopXEWqlHPACU30OQA_LoeW5sw2';

// window.supabase is the UMD global exposed by the CDN script
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
window.db = db;

// ── snake_case → camelCase ────────────────────────────────
function camelize(data) {
  if (Array.isArray(data)) return data.map(camelize);
  if (data && typeof data === 'object' && !(data instanceof Date)) {
    return Object.fromEntries(
      Object.entries(data).map(([k, v]) => [
        k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()),
        camelize(v)
      ])
    );
  }
  return data;
}

// ── LOAD ALL DATA FROM SUPABASE ───────────────────────────
// Returns { businesses, events, stays, promos, articles }
// Returns null if fetch fails (app.js falls back to static data)
async function loadAllData() {
  try {
    // Ensure site config is resolved before filtering by city
    const site = await window._siteConfigPromise;
    const city = site.slug;

    const [bizRes, evRes, stayRes, promoRes, artRes] = await Promise.all([
      db.from('businesses').select('*').or('status.eq.approved,status.is.null').eq('city', city).order('admin_priority', { ascending: false }).order('name'),
      db.from('events').select('*').or('status.eq.approved,status.is.null').eq('city', city).order('admin_priority', { ascending: false }).order('id'),
      db.from('stays').select('*').eq('city', city).order('id'),
      db.from('promos').select('*').or('status.eq.approved,status.is.null').eq('city', city).order('id'),
      db.from('articles').select('*').eq('city', city).order('published_at', { ascending: false }).limit(20),
    ]);

    if (bizRes.error) throw bizRes.error;

    return {
      businesses: camelize(bizRes.data  || []),
      events:     camelize(evRes.data   || []),
      stays:      camelize(stayRes.data || []),
      promos:     camelize(promoRes.data|| []),
      articles:   camelize(artRes.data  || []),
    };
  } catch (e) {
    console.warn('[WTDG] Supabase unavailable, using local fallback data', e.message);
    return null;
  }
}
window.loadAllData = loadAllData;

// ── ENVIRONMENT ──────────────────────────────────────────
const IS_LOCAL = ['localhost', '127.0.0.1'].includes(window.location.hostname);
window.IS_LOCAL = IS_LOCAL;

// ── SITE CONFIG (multi-city) ─────────────────────────────
// Detects current domain → loads matching row from sites table
// Falls back to Geelong if no match (covers localhost + unknown domains)
const SITE_FALLBACK = {
  slug:        'geelong',
  name:        'Geelong',
  fullName:    'What To Do Geelong',
  domain:      'whattodogeelong.com.au',
  primaryColor:'#0d9488',
  mapLat:      -38.1499,
  mapLng:      144.3617,
  mapZoom:     13,
  heroTagline: 'Your guide to Geelong',
  logoUrl:     null,
};
window.SITE = SITE_FALLBACK; // available immediately; replaced async below

async function loadSiteConfig() {
  try {
    const hostname = window.location.hostname.replace(/^www\./, '');
    const { data, error } = await db
      .from('sites')
      .select('*')
      .or(`domain.eq.${hostname},domain_www.eq.${window.location.hostname}`)
      .single();
    if (error || !data) return SITE_FALLBACK;
    const site = camelize(data);
    window.SITE = site;
    return site;
  } catch {
    return SITE_FALLBACK;
  }
}
window.loadSiteConfig = loadSiteConfig;

// Kick off immediately so it's ready before DOMContentLoaded fires
window._siteConfigPromise = loadSiteConfig().then(site => {
  // Update <title> and meta description to replace 'Geelong' with actual city name
  if (site.slug !== 'geelong' && site.name) {
    const titleEl = document.querySelector('title');
    const descEl  = document.querySelector('meta[name="description"]');
    if (titleEl) titleEl.textContent = titleEl.textContent.replace(/Geelong/g, site.name);
    if (descEl)  descEl.setAttribute('content', descEl.getAttribute('content').replace(/Geelong/g, site.name));
  }

  // Inject site-specific analytics tags
  injectAnalytics(site);

  return site;
});

function injectAnalytics(site) {
  const head = document.head;

  // Google Tag Manager
  if (site.gtmId) {
    // GTM noscript iframe — append to body when ready
    const noscript = document.createElement('noscript');
    noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${site.gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
    if (document.body) document.body.prepend(noscript);
    else document.addEventListener('DOMContentLoaded', () => document.body.prepend(noscript));

    // GTM script tag
    const s = document.createElement('script');
    s.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${site.gtmId}');`;
    head.appendChild(s);
  }

  // Google Analytics (GA4)
  if (site.gaId) {
    const s1 = document.createElement('script');
    s1.async = true;
    s1.src = `https://www.googletagmanager.com/gtag/js?id=${site.gaId}`;
    head.appendChild(s1);

    const s2 = document.createElement('script');
    s2.innerHTML = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${site.gaId}');`;
    head.appendChild(s2);
  }

  // Google AdSense
  if (site.adsenseId) {
    const s = document.createElement('script');
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${site.adsenseId}`;
    head.appendChild(s);
  }

  // Meta (Facebook) Pixel
  if (site.metaPixelId) {
    const s = document.createElement('script');
    s.innerHTML = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${site.metaPixelId}');fbq('track','PageView');`;
    head.appendChild(s);
  }
}

// ── SLUG UTILITY ─────────────────────────────────────────
function slugify(str) {
  return String(str)
    .toLowerCase()
    .replace(/[''`]/g, '')          // strip apostrophes
    .replace(/[^a-z0-9]+/g, '-')   // non-alphanumeric → hyphen
    .replace(/^-+|-+$/g, '');       // trim leading/trailing hyphens
}
window.slugify = slugify;

// Build the canonical URL path for a business listing
function bizUrl(biz) {
  return '/' + (biz.slug || slugify(biz.name + '-' + biz.suburb));
}
// Build URL for an event (optionally scoped to a business)
function eventUrl(ev, biz) {
  const eSlug = ev.slug || slugify(ev.title);
  if (biz) return '/' + (biz.slug || slugify(biz.name + '-' + biz.suburb)) + '/' + eSlug;
  return '/events/' + eSlug;
}
// Build URL for an article
function articleUrl(art) {
  return '/news/' + (art.slug || slugify(art.title));
}
window.bizUrl = bizUrl;
window.eventUrl = eventUrl;
window.articleUrl = articleUrl;

// ── HOMEPAGE SETTINGS ────────────────────────────────────
// Returns { sort: 'latest'|'trending', period: '24h'|'7d'|'30d' }
async function loadHomepageSettings() {
  try {
    const { data } = await db
      .from('site_settings')
      .select('key, value')
      .in('key', ['homepage_sort', 'trending_period', 'show_masonry']);
    const map = {};
    (data || []).forEach(r => {
      try { map[r.key] = JSON.parse(r.value); } catch { map[r.key] = r.value; }
    });
    return {
      sort:        map['homepage_sort']   || 'latest',
      period:      map['trending_period'] || '7d',
      showMasonry: map['show_masonry'] !== false, // default on
    };
  } catch {
    return { sort: 'latest', period: '7d' };
  }
}

async function saveHomepageSetting(key, value) {
  try {
    await db.from('site_settings')
      .upsert({ key, value: JSON.stringify(value) }, { onConflict: 'key' });
    return true;
  } catch { return false; }
}

window.loadHomepageSettings  = loadHomepageSettings;
window.saveHomepageSetting   = saveHomepageSetting;

// ── AUTH HELPERS ──────────────────────────────────────────
async function getSupabaseUser() {
  const { data: { user } } = await db.auth.getUser();
  return user;
}

async function supabaseSignOut() {
  await db.auth.signOut();
}

window.getSupabaseUser = getSupabaseUser;
window.supabaseSignOut = supabaseSignOut;
