'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const root   = document.getElementById('js-guide-root');
  const params = new URLSearchParams(window.location.search);
  const pathParts = window.location.pathname.replace(/^\//, '').split('/').filter(Boolean);
  const guideId   = params.get('id') || (pathParts[0] === 'guide' && pathParts[1] ? pathParts[1] : null);

  if (!guideId) {
    root.innerHTML = '<p style="padding:2rem">Guide not found. <a href="guides.html">Back to my guides</a></p>';
    return;
  }

  const { data: guide, error } = await db.from('guides')
    .select('*, guide_items(*)')
    .eq('id', guideId)
    .single();

  if (error || !guide) {
    root.innerHTML = '<p style="padding:2rem">Guide not found. <a href="guides.html">Back to my guides</a></p>';
    return;
  }

  // Ownership check
  const { data: { session } } = await db.auth.getSession();
  const sid = localStorage.getItem('wtdg_sid') || '';
  const isOwner = (session?.user?.id && guide.user_id === session.user.id) || guide.session_id === sid;
  const isLoggedIn = !!session?.user?.id;

  const items = guide.guide_items || [];

  // ── Enrich item coords from Supabase (for items saved before lat/lng was added) ──
  const needsCoords = items.filter(i => {
    const d = i.item_data || {};
    return !d.lat && (i.item_type === 'business' || i.item_type === 'event' || i.item_type === 'stay');
  });
  if (needsCoords.length) {
    const bizIds   = needsCoords.filter(i => i.item_type === 'business').map(i => i.item_id);
    const evIds    = needsCoords.filter(i => i.item_type === 'event').map(i => i.item_id);
    const stayIds  = needsCoords.filter(i => i.item_type === 'stay').map(i => i.item_id);
    const coordMap = {};
    const fetches = [];
    if (bizIds.length)  fetches.push(db.from('businesses').select('id,lat,lng,slug').in('slug', bizIds).then(r => (r.data||[]).forEach(b => { coordMap[b.slug] = b; coordMap[String(b.id)] = b; })));
    if (evIds.length)   fetches.push(db.from('events').select('id,lat,lng').in('id', evIds.map(Number)).then(r => (r.data||[]).forEach(e => { coordMap[String(e.id)] = e; })));
    if (stayIds.length) fetches.push(db.from('stays').select('id,lat,lng,slug').in('slug', stayIds).then(r => (r.data||[]).forEach(s => { coordMap[s.slug] = s; coordMap[String(s.id)] = s; })));
    await Promise.all(fetches);
    needsCoords.forEach(item => {
      const src = coordMap[item.item_id] || coordMap[String(item.item_id)];
      if (src?.lat) { (item.item_data = item.item_data || {}).lat = src.lat; item.item_data.lng = src.lng; }
    });
  }

  const shareUrl = window.IS_LOCAL
    ? `${window.location.origin}/guide.html?id=${guide.id}`
    : `${window.location.origin}/guide/${guide.id}`;

  document.title = `${guide.name} — What To Do Geelong`;

  function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function dateRange() {
    if (guide.is_anyday) return 'Anytime guide';
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

    const dated   = items.filter(i => i.planned_date && !guide.is_anyday).sort((a, b) => a.planned_date.localeCompare(b.planned_date));
    const undated = guide.is_anyday ? items : items.filter(i => !i.planned_date);

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
        ${dated.length && !guide.is_anyday ? '<div class="guide-section__date guide-section__date--undated">Not yet scheduled</div>' : ''}
        ${undated.map(i => renderItem(i)).join('')}
      </div>
    ` : '';

    return sections + undatedSection;
  }

  function renderItem(i) {
    const d = i.item_data || {};
    const title   = d.title || d.name || 'Item';
    const emoji   = d.emoji || '📍';
    const color   = d.color || '#e8faf8';
    const meta    = [d.date, d.time, d.location].filter(Boolean).join(' · ');
    const price   = d.price || '';
    const dateVal = i.planned_date || '';
    const showDatePicker = isOwner && !guide.is_anyday;

    return `
      <div class="guide-item" data-dbid="${i.id}">
        <div class="guide-item__icon" style="background:${color}22">${emoji}</div>
        <div class="guide-item__body">
          <div class="guide-item__title">${esc(title)}</div>
          ${meta ? `<div class="guide-item__meta">${esc(meta)}</div>` : ''}
          ${price ? `<div class="guide-item__price ${price === 'Free' ? 'guide-item__price--free' : ''}">${esc(price)}</div>` : ''}
          ${showDatePicker ? `
            <input type="date" class="guide-item__date-input" value="${dateVal}" title="Set planned date" />
          ` : (dateVal && !guide.is_anyday ? `<div class="guide-item__meta">Planned: ${formatGuideDate(dateVal)}</div>` : '')}
        </div>
        ${isOwner && !guide.is_public ? `<button class="guide-item__remove js-remove-item" data-dbid="${i.id}" title="Remove">
          <span class="material-symbols-rounded">close</span>
        </button>` : ''}
      </div>
    `;
  }

  function render() {
    const lockedByPublic = guide.is_public && !isOwner;
    const ownerAndNotPublicLocked = isOwner; // owners can edit unless... actually owners can always edit

    root.innerHTML = `
      <div class="guide-hero">
        <div class="container guide-hero__inner">
          ${isOwner ? `
            <div class="guide-hero__edit-wrap">
              <input class="guide-hero__name-input" id="js-guide-name" value="${esc(guide.name)}" />
              <input class="guide-hero__desc-input" id="js-guide-desc"
                placeholder="Add a description e.g. The great weekend wine tour…"
                value="${esc(guide.description || '')}" />
              <div class="guide-hero__toggles-row">
                <label class="guide-toggle" title="When on, stops have no specific date — great for reusable guides">
                  <input type="checkbox" id="js-guide-anyday" ${guide.is_anyday ? 'checked' : ''} />
                  <span class="guide-toggle__track"></span>
                  <span class="guide-toggle__label">Any day</span>
                </label>
                ${isLoggedIn ? `
                  <label class="guide-toggle ${guide.is_public ? 'guide-toggle--public' : ''}" title="Public guides appear in the community list and earn trending rank">
                    <input type="checkbox" id="js-guide-public" ${guide.is_public ? 'checked' : ''} />
                    <span class="guide-toggle__track"></span>
                    <span class="guide-toggle__label">
                      ${guide.is_public
                        ? '<span class="material-symbols-rounded" style="font-size:.9rem;vertical-align:-.15em">public</span> Public'
                        : '<span class="material-symbols-rounded" style="font-size:.9rem;vertical-align:-.15em">lock</span> Private'}
                    </span>
                  </label>
                ` : `<span class="guide-toggle__hint">
                    <span class="material-symbols-rounded" style="font-size:.85rem;vertical-align:-.1em">lock</span>
                    <a href="login.html" style="color:var(--teal)">Sign in</a> to make this guide public
                  </span>`}
              </div>
              ${!guide.is_anyday ? `
              <div class="guide-hero__dates-row">
                <input type="date" class="guide-hero__date-input" id="js-guide-from" value="${guide.date_from || ''}" />
                <span>–</span>
                <input type="date" class="guide-hero__date-input" id="js-guide-to"   value="${guide.date_to   || ''}" />
              </div>` : ''}
              <div class="guide-hero__actions-row">
                <button class="btn btn--teal btn--sm" id="js-guide-save">Save changes</button>
              </div>
            </div>
          ` : `
            <h1 class="guide-hero__name">${esc(guide.name)}</h1>
            ${guide.description ? `<p class="guide-hero__desc">${esc(guide.description)}</p>` : ''}
            ${dateRange() ? `<div class="guide-hero__datestr">${dateRange()}</div>` : ''}
            ${guide.is_public ? `<div class="guide-hero__public-badge"><span class="material-symbols-rounded">public</span> Community guide</div>` : ''}
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

      <div class="container guide-body"></div>
    `;

    // Save guide settings
    document.getElementById('js-guide-save')?.addEventListener('click', async () => {
      const newAnyday = document.getElementById('js-guide-anyday')?.checked ?? guide.is_anyday;
      const newPublic = document.getElementById('js-guide-public')?.checked ?? guide.is_public;
      guide.name        = document.getElementById('js-guide-name').value.trim() || guide.name;
      guide.description = document.getElementById('js-guide-desc')?.value.trim() || null;
      guide.is_anyday   = newAnyday;
      guide.is_public   = newPublic;
      if (!newAnyday) {
        guide.date_from = document.getElementById('js-guide-from')?.value || null;
        guide.date_to   = document.getElementById('js-guide-to')?.value   || null;
      } else {
        guide.date_from = null;
        guide.date_to   = null;
      }
      await updateGuide(guide.id, {
        name:        guide.name,
        description: guide.description,
        dateFrom:    guide.date_from,
        dateTo:      guide.date_to,
        isPublic:    guide.is_public,
        isAnyday:    guide.is_anyday,
      });
      document.title = `${guide.name} — What To Do Geelong`;
      // Re-render so date section toggles, public badge etc update
      render();
      if (items.length && window.initGuidePlanner) {
        window.initGuidePlanner(guide, items, isOwner);
      }
    });

    // Public toggle label live-update
    document.getElementById('js-guide-public')?.addEventListener('change', function() {
      const lbl = this.closest('.guide-toggle').querySelector('.guide-toggle__label');
      lbl.innerHTML = this.checked
        ? '<span class="material-symbols-rounded" style="font-size:.9rem;vertical-align:-.15em">public</span> Public'
        : '<span class="material-symbols-rounded" style="font-size:.9rem;vertical-align:-.15em">lock</span> Private';
      this.closest('.guide-toggle').classList.toggle('guide-toggle--public', this.checked);
    });

    // Copy share link
    document.getElementById('js-copy-share')?.addEventListener('click', () => {
      navigator.clipboard.writeText(shareUrl).then(() => {
        const btn = document.getElementById('js-copy-share');
        btn.innerHTML = '<span class="material-symbols-rounded">check</span> Copied!';
        setTimeout(() => { btn.innerHTML = '<span class="material-symbols-rounded">link</span> Copy link'; }, 2000);
      });
    });

    // Remove items (only when guide is not public)
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

    // Update planned dates
    document.querySelectorAll('.guide-item__date-input').forEach(input => {
      input.addEventListener('change', async () => {
        const dbId = parseInt(input.closest('.guide-item').dataset.dbid);
        await updateGuideItemDate(dbId, input.value || null);
      });
    });
  }

  render();

  // Track view on public guides
  if (guide.is_public && window.wtdgViews) {
    wtdgViews.track(guide.id, 'guide');
  }

  // Init day planner after guide renders
  if (items.length && window.initGuidePlanner) {
    window.initGuidePlanner(guide, items, isOwner);
  }
});
