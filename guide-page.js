'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const root   = document.getElementById('js-guide-root');
  const params = new URLSearchParams(window.location.search);
  // Read id from ?id= (local) or /guide/:id path (Vercel)
  const pathParts = window.location.pathname.replace(/^\//, '').split('/').filter(Boolean);
  const guideId   = params.get('id') || (pathParts[0] === 'guide' && pathParts[1] ? pathParts[1] : null);

  if (!guideId) {
    root.innerHTML = '<p style="padding:2rem">Guide not found. <a href="guides.html">Back to my guides</a></p>';
    return;
  }

  // Load guide by id (public — anyone with the link can view)
  const { data: guide, error } = await db.from('guides')
    .select('*, guide_items(*)')
    .eq('id', guideId)
    .single();

  if (error || !guide) {
    root.innerHTML = '<p style="padding:2rem">Guide not found. <a href="guides.html">Back to my guides</a></p>';
    return;
  }

  // Check if viewer owns this guide
  const { data: { session } } = await db.auth.getSession();
  const sid = localStorage.getItem('wtdg_sid') || '';
  const isOwner = (session?.user?.id && guide.user_id === session.user.id) || guide.session_id === sid;

  const items = guide.guide_items || [];
  const shareUrl = IS_LOCAL
    ? `${window.location.origin}/guide.html?id=${guide.id}`
    : `${window.location.origin}/guide/${guide.id}`;

  document.title = `${guide.name} — What To Do Geelong`;

  function dateRange() {
    if (!guide.date_from) return '';
    return `${formatGuideDate(guide.date_from)}${guide.date_to ? ' – ' + formatGuideDate(guide.date_to) : ''}`;
  }

  function renderItems() {
    if (!items.length) {
      return `<div class="guide-empty">
        <div class="guide-empty__emoji">⭐</div>
        <p>No items in this guide yet.</p>
        <a href="index.html" class="btn btn--teal">Explore Geelong →</a>
      </div>`;
    }

    // Group by planned_date, then unsorted
    const dated   = items.filter(i => i.planned_date).sort((a, b) => a.planned_date.localeCompare(b.planned_date));
    const undated = items.filter(i => !i.planned_date);

    const groupedDates = {};
    dated.forEach(i => {
      const d = i.planned_date;
      if (!groupedDates[d]) groupedDates[d] = [];
      groupedDates[d].push(i);
    });

    const sections = Object.entries(groupedDates).map(([date, itms]) => `
      <div class="guide-section">
        <div class="guide-section__date">${new Date(date + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        ${itms.map(i => renderItem(i)).join('')}
      </div>
    `).join('');

    const undatedSection = undated.length ? `
      <div class="guide-section">
        ${dated.length ? '<div class="guide-section__date guide-section__date--undated">Not yet scheduled</div>' : ''}
        ${undated.map(i => renderItem(i)).join('')}
      </div>
    ` : '';

    return sections + undatedSection;
  }

  function renderItem(i) {
    const d = i.item_data || {};
    const title    = d.title || d.name || 'Item';
    const emoji    = d.emoji || '📍';
    const color    = d.color || '#e8faf8';
    const meta     = [d.date, d.time, d.location].filter(Boolean).join(' · ');
    const price    = d.price || '';
    const dateVal  = i.planned_date || '';

    return `
      <div class="guide-item" data-dbid="${i.id}">
        <div class="guide-item__icon" style="background:${color}22">${emoji}</div>
        <div class="guide-item__body">
          <div class="guide-item__title">${title}</div>
          ${meta ? `<div class="guide-item__meta">${meta}</div>` : ''}
          ${price ? `<div class="guide-item__price ${price === 'Free' ? 'guide-item__price--free' : ''}">${price}</div>` : ''}
          ${isOwner ? `
            <input type="date" class="guide-item__date-input" value="${dateVal}" title="Set planned date" />
          ` : (dateVal ? `<div class="guide-item__meta">Planned: ${formatGuideDate(dateVal)}</div>` : '')}
        </div>
        ${isOwner ? `<button class="guide-item__remove js-remove-item" data-dbid="${i.id}" title="Remove">
          <span class="material-symbols-rounded">close</span>
        </button>` : ''}
      </div>
    `;
  }

  function render() {
    root.innerHTML = `
      <div class="guide-hero">
        <div class="container guide-hero__inner">
          ${isOwner ? `
            <div class="guide-hero__edit-wrap">
              <input class="guide-hero__name-input" id="js-guide-name" value="${guide.name}" />
              <div class="guide-hero__dates-row">
                <input type="date" class="guide-hero__date-input" id="js-guide-from" value="${guide.date_from || ''}" />
                <span>–</span>
                <input type="date" class="guide-hero__date-input" id="js-guide-to"   value="${guide.date_to   || ''}" />
                <button class="btn btn--teal btn--sm" id="js-guide-save">Save</button>
              </div>
            </div>
          ` : `
            <h1 class="guide-hero__name">${guide.name}</h1>
            ${dateRange() ? `<div class="guide-hero__datestr">${dateRange()}</div>` : ''}
          `}
          <div class="guide-hero__share">
            <div class="guide-share-url" id="js-share-url">${shareUrl}</div>
            <button class="btn btn--outline btn--sm" id="js-copy-share">
              <span class="material-symbols-rounded">link</span> Copy link
            </button>
          </div>
          <div class="guide-hero__meta">${items.length} item${items.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      <div class="container guide-body">
        <div id="js-guide-items">${renderItems()}</div>
      </div>
    `;

    // Save name/dates
    document.getElementById('js-guide-save')?.addEventListener('click', async () => {
      guide.name      = document.getElementById('js-guide-name').value.trim() || guide.name;
      guide.date_from = document.getElementById('js-guide-from').value || null;
      guide.date_to   = document.getElementById('js-guide-to').value   || null;
      await updateGuide(guide.id, { name: guide.name, dateFrom: guide.date_from, dateTo: guide.date_to });
      document.title = `${guide.name} — What To Do Geelong`;
    });

    // Copy share link
    document.getElementById('js-copy-share')?.addEventListener('click', () => {
      navigator.clipboard.writeText(shareUrl).then(() => {
        const btn = document.getElementById('js-copy-share');
        btn.innerHTML = '<span class="material-symbols-rounded">check</span> Copied!';
        setTimeout(() => { btn.innerHTML = '<span class="material-symbols-rounded">link</span> Copy link'; }, 2000);
      });
    });

    // Remove items
    document.querySelectorAll('.js-remove-item').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Remove this item from the guide?')) return;
        await removeGuideItem(parseInt(btn.dataset.dbid));
        const el = btn.closest('.guide-item');
        el?.remove();
        const idx = items.findIndex(i => i.id === parseInt(btn.dataset.dbid));
        if (idx >= 0) items.splice(idx, 1);
      });
    });

    // Update planned date
    document.querySelectorAll('.guide-item__date-input').forEach(input => {
      input.addEventListener('change', async () => {
        const dbId = parseInt(input.closest('.guide-item').dataset.dbid);
        await updateGuideItemDate(dbId, input.value || null);
      });
    });
  }

  render();
});
