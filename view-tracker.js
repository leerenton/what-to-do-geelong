'use strict';

// ── WTDG View Tracker ─────────────────────────────────────────
// Tracks actual page reads — only fires when a user opens a detail
// page (listing, event). Card grids never trigger tracking.
//
// Session-debounced: one DB write per item per browser session.
// Fire-and-forget: never blocks rendering.
//
// Usage:
//   window.wtdgViews.track('igni', 'business')   // on listing page load
//   window.wtdgViews.getCount('igni', 'business', '7d')   → Promise<number>
//   window.wtdgViews.injectViewBadges('business') // display only, no tracking
// ─────────────────────────────────────────────────────────────

(function () {
  // Items logged this session — avoids duplicate writes on re-render
  const SESSION_KEY = 'wtdg_views_session';

  function getLogged() {
    try { return new Set(JSON.parse(sessionStorage.getItem(SESSION_KEY) || '[]')); }
    catch { return new Set(); }
  }

  function markLogged(key) {
    const s = getLogged();
    s.add(key);
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify([...s])); } catch {}
  }

  // ── Track a single view ──────────────────────────────────────
  // itemId       – the record id (string or number)
  // itemType     – 'business' | 'event' | 'stay' | 'guide'
  // itemCategory – e.g. 'Sports', 'Music' (optional, used for email personalisation)
  async function track(itemId, itemType, itemCategory) {
    if (!itemId || !itemType) return;
    const key = `${itemType}:${itemId}`;
    if (getLogged().has(key)) return;   // already tracked this session

    markLogged(key);

    // Defer slightly so it never blocks rendering
    setTimeout(async () => {
      try {
        if (typeof window.db === 'undefined') return;
        // Attach logged-in user + category for personalised email digest
        let userId = null;
        let category = itemCategory || null;
        try {
          const { data: { user } } = await window.db.auth.getUser();
          if (user) userId = user.id;
        } catch {}
        await window.db.from('page_views').insert({
          item_id:   String(itemId),
          item_type: itemType,
          viewed_at: new Date().toISOString(),
          user_id:   userId,
          category:  category,
        });
      } catch (e) {
        // Silently ignore — tracking should never break the app
        console.debug('[views] insert failed:', e?.message);
      }
    }, 800);
  }

  // ── Bulk track multiple items (e.g. a rendered grid) ────────
  // items = [{ id, type }, ...]  — deduped against session log
  function trackMany(items) {
    items.forEach(({ id, type }) => track(id, type));
  }

  // ── Fetch view count for one item ───────────────────────────
  // period: '24h' | '7d' | '30d' | 'all'
  async function getCount(itemId, itemType, period = '7d') {
    try {
      if (typeof window.db === 'undefined') return 0;
      const col = period === '24h' ? 'views_24h'
                : period === '30d' ? 'views_30d'
                : period === 'all' ? 'views_all'
                : 'views_7d';
      const { data } = await window.db
        .from('trending_scores')
        .select(col)
        .eq('item_id', String(itemId))
        .eq('item_type', itemType)
        .single();
      return data?.[col] || 0;
    } catch { return 0; }
  }

  // ── Fetch trending scores for a list of items ───────────────
  // Returns a Map keyed by `${type}:${id}` → { views_24h, views_7d, views_30d, views_all }
  async function getTrendingScores(itemType, period = '7d') {
    try {
      if (typeof window.db === 'undefined') return new Map();
      const col = period === '24h' ? 'views_24h'
                : period === '30d' ? 'views_30d'
                : period === 'all' ? 'views_all'
                : 'views_7d';
      const { data } = await window.db
        .from('trending_scores')
        .select(`item_id,item_type,${col}`)
        .eq('item_type', itemType);
      const map = new Map();
      (data || []).forEach(row => {
        map.set(`${row.item_type}:${row.item_id}`, row[col] || 0);
      });
      return map;
    } catch { return new Map(); }
  }

  // ── Get all trending scores across all types ─────────────────
  async function getAllTrendingScores(period = '7d') {
    try {
      if (typeof window.db === 'undefined') return new Map();
      const col = period === '24h' ? 'views_24h'
                : period === '30d' ? 'views_30d'
                : period === 'all' ? 'views_all'
                : 'views_7d';
      const { data } = await window.db
        .from('trending_scores')
        .select(`item_id,item_type,views_24h,views_7d,views_30d,views_all`);
      const map = new Map();
      (data || []).forEach(row => {
        map.set(`${row.item_type}:${row.item_id}`, {
          views_24h: row.views_24h || 0,
          views_7d:  row.views_7d  || 0,
          views_30d: row.views_30d || 0,
          views_all: row.views_all || 0,
          score:     row[col] || 0,   // the active period column
        });
      });
      return map;
    } catch { return new Map(); }
  }

  // ── Format view count for display ───────────────────────────
  function formatViews(n) {
    if (!n || n < 1) return null;
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return String(n);
  }

  // ── Inject view badges into existing card elements ──────────
  // Works on .coll-card and .ed-card — any element with data-id + data-type
  async function injectViewBadges(itemType, period = '7d') {
    const cards = document.querySelectorAll(`[data-id][data-type="${itemType}"]`);
    if (!cards.length) return;
    const scores = await getTrendingScores(itemType, period);
    cards.forEach(card => {
      const id    = card.dataset.id;
      const score = scores.get(`${itemType}:${id}`) || 0;
      const label = formatViews(score);
      if (!label) return;
      // Remove any existing badge
      card.querySelector('.view-badge')?.remove();
      const badge = document.createElement('span');
      badge.className = 'view-badge';
      badge.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> ${label}`;
      card.appendChild(badge);
    });
  }

  window.wtdgViews = {
    track,
    trackMany,
    getCount,
    getTrendingScores,
    getAllTrendingScores,
    formatViews,
    injectViewBadges,
  };
})();
