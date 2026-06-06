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
    const [bizRes, evRes, stayRes, promoRes, artRes] = await Promise.all([
      db.from('businesses').select('*').order('name'),
      db.from('events').select('*').order('id'),
      db.from('stays').select('*').order('id'),
      db.from('promos').select('*').order('id'),
      db.from('articles').select('*').order('published_at', { ascending: false }),
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
