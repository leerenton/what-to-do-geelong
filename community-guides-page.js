'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const grid    = document.getElementById('js-cg-grid');
  const empty   = document.getElementById('js-cg-empty');
  const countEl = document.getElementById('js-cg-count');
  const search  = document.getElementById('js-cg-search');
  const chips   = document.getElementById('js-cg-chips');

  let allGuides  = [];
  let scores     = new Map();
  let activeSort = 'trending';
  let query      = '';

  function guideUrl(g) {
    return window.IS_LOCAL ? `guide.html?id=${g.id}` : `/guide/${g.id}`;
  }

  // ── Load data ─────────────────────────────────────────────
  allGuides = await loadPublicGuides();

  if (window.wtdgViews) {
    scores = await wtdgViews.getAllTrendingScores('7d');
  }

  // ── Sort ──────────────────────────────────────────────────
  function sortGuides(guides) {
    if (activeSort === 'trending') {
      return [...guides].sort((a, b) => {
        const sa = scores.get(`guide:${a.id}`)?.score || 0;
        const sb = scores.get(`guide:${b.id}`)?.score || 0;
        return sb - sa;
      });
    }
    if (activeSort === 'newest') {
      return [...guides].sort((a, b) =>
        (b.created_at || '').localeCompare(a.created_at || '')
      );
    }
    if (activeSort === 'anyday') {
      return guides.filter(g => g.is_anyday);
    }
    return guides;
  }

  // ── Filter by search query ────────────────────────────────
  function filterGuides(guides) {
    if (!query) return guides;
    const q = query.toLowerCase();
    return guides.filter(g => {
      const haystack = [
        g.name,
        g.description || '',
        ...(g.guide_items || []).map(i => i.item_data?.title || i.item_data?.name || ''),
        ...(g.guide_items || []).map(i => i.item_data?.location || ''),
      ].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }

  // ── Render card ───────────────────────────────────────────
  function renderCard(g) {
    const count = (g.guide_items || []).length;
    const tag   = g.is_anyday ? 'Any day' : (g.date_from ? formatGuideDate(g.date_from) : null);
    const viewScore = scores.get(`guide:${g.id}`)?.score || 0;
    const firstEmoji = g.guide_items?.[0]?.item_data?.emoji || '🗺️';

    // Build a mini preview of stops
    const stops = (g.guide_items || []).slice(0, 4).map(i => {
      const d = i.item_data || {};
      return `<span class="cgp-card__stop">${d.emoji || '📍'} ${d.title || d.name || ''}</span>`;
    }).join('');

    return `
      <a href="${guideUrl(g)}" class="cgp-card">
        <div class="cgp-card__top">
          <div class="cgp-card__icon-wrap">
            <span class="cgp-card__big-icon">${firstEmoji}</span>
          </div>
          <div class="cgp-card__head">
            <h3 class="cgp-card__name">${g.name}</h3>
            ${g.description ? `<p class="cgp-card__desc">${g.description}</p>` : ''}
          </div>
          ${viewScore > 0 ? `
            <div class="cgp-card__views">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              ${viewScore >= 1000 ? (viewScore/1000).toFixed(1)+'k' : viewScore}
            </div>` : ''}
        </div>
        ${stops ? `<div class="cgp-card__stops">${stops}${count > 4 ? `<span class="cgp-card__stop cgp-card__stop--more">+${count - 4} more</span>` : ''}</div>` : ''}
        <div class="cgp-card__footer">
          <span class="cgp-card__pill"><span class="material-symbols-rounded">place</span>${count} stop${count !== 1 ? 's' : ''}</span>
          ${tag ? `<span class="cgp-card__pill"><span class="material-symbols-rounded">calendar_month</span>${tag}</span>` : ''}
          ${g.is_anyday ? `<span class="cgp-card__pill cgp-card__pill--anyday"><span class="material-symbols-rounded">explore</span>Any day</span>` : ''}
        </div>
      </a>`;
  }

  // ── Render grid ───────────────────────────────────────────
  function renderGrid() {
    let visible = filterGuides(sortGuides(allGuides));

    countEl.textContent = visible.length
      ? `${visible.length} guide${visible.length !== 1 ? 's' : ''}${query ? ` matching "${query}"` : ''}`
      : '';

    if (!visible.length) {
      grid.innerHTML = '';
      empty.style.display = 'flex';
      return;
    }
    empty.style.display = 'none';
    grid.innerHTML = visible.map(renderCard).join('');
  }

  // ── Search debounce ───────────────────────────────────────
  let _searchTimer;
  search?.addEventListener('input', () => {
    clearTimeout(_searchTimer);
    _searchTimer = setTimeout(() => {
      query = search.value.trim();
      renderGrid();
    }, 250);
  });

  // ── Sort chips ────────────────────────────────────────────
  chips?.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      chips.querySelectorAll('.chip').forEach(c => c.classList.remove('chip--active'));
      chip.classList.add('chip--active');
      activeSort = chip.dataset.filter;
      renderGrid();
    });
  });

  // ── Initial render ────────────────────────────────────────
  if (!allGuides.length) {
    grid.innerHTML = '';
    countEl.textContent = '';
    empty.style.display = 'flex';
  } else {
    renderGrid();
  }
});
