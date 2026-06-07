'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const root = document.getElementById('js-guides-root');

  const guides = await loadGuides();

  function guideUrl(g) {
    return window.IS_LOCAL ? `guide.html?id=${g.id}` : `/guide/${g.id}`;
  }

  function render() {
    if (!guides.length) {
      root.innerHTML = `
        <div class="guides-hero">
          <div class="container">
            <h1 class="guides-hero__title">My WTDGuides</h1>
            <p class="guides-hero__sub">Plan your Geelong adventures. Star events, restaurants, and stays — then organise them into shareable guides with dates.</p>
          </div>
        </div>
        <div class="container guides-body">
          <div class="guides-empty">
            <div class="guides-empty__emoji">🗺️</div>
            <h2>No guides yet</h2>
            <p>Head back to the guide and tap ⭐ on anything you'd like to do — we'll help you organise it into a plan.</p>
            <a href="index.html" class="btn btn--teal">Explore Geelong →</a>
            <div style="margin-top:1rem">
              <button class="btn btn--outline" id="js-create-first">+ Create a blank guide</button>
            </div>
          </div>
        </div>
      `;
      document.getElementById('js-create-first')?.addEventListener('click', openCreateForm);
      renderCommunityGuides();
      return;
    }

    root.innerHTML = `
      <div class="guides-hero">
        <div class="container">
          <h1 class="guides-hero__title">My WTDGuides</h1>
          <p class="guides-hero__sub">Your Geelong plans, all in one place.</p>
        </div>
      </div>
      <div class="container guides-body">
        <div class="guides-toolbar">
          <button class="btn btn--teal btn--sm" id="js-new-guide-btn">+ New guide</button>
        </div>

        <div class="guides-create-form" id="js-create-form" style="display:none">
          <div class="guides-create-form__title">New WTDGuide</div>
          <input class="dash-input" id="js-gf-name" placeholder="Give your guide a name e.g. June Long Weekend" />
          <div class="guides-create-form__row">
            <div>
              <label class="dash-label">From</label>
              <input class="dash-input" type="date" id="js-gf-from" />
            </div>
            <div>
              <label class="dash-label">To</label>
              <input class="dash-input" type="date" id="js-gf-to" />
            </div>
          </div>
          <div class="guides-create-form__actions">
            <button class="btn btn--teal btn--sm" id="js-gf-save">Create guide</button>
            <button class="btn btn--outline btn--sm" id="js-gf-cancel">Cancel</button>
          </div>
        </div>

        <div class="guides-list" id="js-guides-list">
          ${guides.map(g => renderGuideCard(g)).join('')}
        </div>
      </div>

      <div id="js-community-guides-section"></div>
    `;

    document.getElementById('js-new-guide-btn')?.addEventListener('click', openCreateForm);
    bindGuideActions();
    renderCommunityGuides();
  }

  function renderGuideCard(g, isCommunity = false) {
    const itemCount = (g.guide_items || []).length;
    let dateStr = '';
    if (g.is_anyday) {
      dateStr = 'Any day';
    } else if (g.date_from) {
      dateStr = `${formatGuideDate(g.date_from)}${g.date_to ? ' – ' + formatGuideDate(g.date_to) : ''}`;
    } else {
      dateStr = 'No dates set';
    }

    const publicBadge = g.is_public
      ? `<span class="guide-card__public-badge"><span class="material-symbols-rounded">public</span> Public</span>`
      : '';
    const anydayBadge = g.is_anyday
      ? `<span class="guide-card__anyday-badge"><span class="material-symbols-rounded">explore</span> Any day</span>`
      : '';

    return `
      <div class="guide-card${isCommunity ? ' guide-card--community' : ''}" data-id="${g.id}">
        <a href="${guideUrl(g)}" class="guide-card__body">
          <div class="guide-card__name-row">
            <div class="guide-card__name">${g.name}</div>
            <div class="guide-card__badges">${publicBadge}${anydayBadge}</div>
          </div>
          ${g.description ? `<div class="guide-card__desc">${g.description}</div>` : ''}
          <div class="guide-card__meta">
            ${!g.is_anyday ? `<span><span class="material-symbols-rounded">calendar_month</span>${dateStr}</span>` : ''}
            <span><span class="material-symbols-rounded">star</span>${itemCount} item${itemCount !== 1 ? 's' : ''}</span>
          </div>
        </a>
        ${!isCommunity ? `
        <div class="guide-card__actions">
          <button class="guide-card__btn js-copy-link" data-url="${window.location.origin}/${window.IS_LOCAL ? 'guide.html?id=' : 'guide/'}${g.id}" title="Copy shareable link">
            <span class="material-symbols-rounded">link</span>
          </button>
          <button class="guide-card__btn js-delete-guide" data-id="${g.id}" title="Delete guide">
            <span class="material-symbols-rounded">delete</span>
          </button>
        </div>` : `
        <div class="guide-card__actions">
          <button class="guide-card__btn js-copy-link" data-url="${window.location.origin}/${window.IS_LOCAL ? 'guide.html?id=' : 'guide/'}${g.id}" title="Copy link">
            <span class="material-symbols-rounded">link</span>
          </button>
        </div>`}
      </div>
    `;
  }

  async function renderCommunityGuides() {
    // Find or create the community section container
    let section = document.getElementById('js-community-guides-section');
    if (!section) {
      section = document.createElement('div');
      section.id = 'js-community-guides-section';
      root.appendChild(section);
    }

    // Load public guides
    const publicGuides = await loadPublicGuides();

    // Exclude user's own guides (already shown above)
    const myIds = new Set(guides.map(g => g.id));
    const community = publicGuides.filter(g => !myIds.has(g.id));

    if (!community.length) return; // nothing to show

    // Sort by trending views (7d) if view-tracker is available
    if (window.wtdgViews) {
      const scores = await wtdgViews.getAllTrendingScores('7d');
      community.sort((a, b) => {
        const sa = scores.get(`guide:${a.id}`)?.score || 0;
        const sb = scores.get(`guide:${b.id}`)?.score || 0;
        return sb - sa;
      });
    }

    section.innerHTML = `
      <div class="container">
        <div class="guides-community">
          <div class="guides-community__header">
            <span class="material-symbols-rounded">public</span>
            <h2 class="guides-community__title">Community Guides</h2>
            <span class="guides-community__sub">Shared by Geelong locals — free to explore</span>
          </div>
          <div class="guides-list guides-list--community">
            ${community.map(g => renderGuideCard(g, true)).join('')}
          </div>
        </div>
      </div>
    `;

    // Wire copy-link buttons in community section
    section.querySelectorAll('.js-copy-link').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        navigator.clipboard.writeText(btn.dataset.url).then(() => {
          btn.innerHTML = '<span class="material-symbols-rounded">check</span>';
          setTimeout(() => { btn.innerHTML = '<span class="material-symbols-rounded">link</span>'; }, 2000);
        });
      });
    });
  }

  function openCreateForm() {
    const form = document.getElementById('js-create-form');
    if (!form) return;
    form.style.display = 'block';
    document.getElementById('js-new-guide-btn').style.display = 'none';
    document.getElementById('js-gf-name')?.focus();

    document.getElementById('js-gf-save').onclick = async () => {
      const name     = document.getElementById('js-gf-name').value.trim() || 'My Geelong Guide';
      const dateFrom = document.getElementById('js-gf-from').value || null;
      const dateTo   = document.getElementById('js-gf-to').value   || null;
      const g = await createGuide({ name, dateFrom, dateTo });
      if (g) window.location.href = guideUrl(g);
    };

    document.getElementById('js-gf-cancel').onclick = () => {
      form.style.display = 'none';
      document.getElementById('js-new-guide-btn').style.display = '';
    };
  }

  function bindGuideActions() {
    document.querySelectorAll('.js-copy-link').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        navigator.clipboard.writeText(btn.dataset.url).then(() => {
          btn.innerHTML = '<span class="material-symbols-rounded">check</span>';
          setTimeout(() => { btn.innerHTML = '<span class="material-symbols-rounded">link</span>'; }, 2000);
        });
      });
    });

    document.querySelectorAll('.js-delete-guide').forEach(btn => {
      btn.addEventListener('click', async e => {
        e.stopPropagation();
        if (!confirm('Delete this guide and all its items?')) return;
        await deleteGuide(btn.dataset.id);
        const card = btn.closest('.guide-card');
        card?.remove();
        const idx = guides.findIndex(g => g.id === btn.dataset.id);
        if (idx >= 0) guides.splice(idx, 1);
        if (!guides.length) render();
      });
    });
  }

  render();
});
