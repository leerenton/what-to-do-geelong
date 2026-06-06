'use strict';

// ── LOAD STATE ────────────────────────────────────────────
function getSaved() {
  try { return JSON.parse(localStorage.getItem('wtdg_saved') || '[]'); } catch { return []; }
}
function getUser() {
  try { return JSON.parse(localStorage.getItem('wtdg_user') || '{}'); } catch { return {}; }
}
function removeSaved(id) {
  const items = getSaved().filter(i => i.id !== id);
  localStorage.setItem('wtdg_saved', JSON.stringify(items));
  renderItinerary();
}

// ── RENDER ────────────────────────────────────────────────
function renderItinerary() {
  const items = getSaved();
  const user  = getUser();
  const headerEl  = document.getElementById('js-itin-header');
  const actionsEl = document.getElementById('js-itin-actions');
  const listEl    = document.getElementById('js-itin-list');

  // Header
  const greeting = user.name ? `Hey ${user.name}! 👋` : 'Your itinerary';
  headerEl.innerHTML = `
    <div class="container">
      <div class="itin-header__greeting">${greeting}</div>
      <h1 class="itin-header__title">My Geelong Plan ⭐</h1>
      <div class="itin-header__meta">Starred events, eats, and stays</div>
      <div class="itin-header__count">${items.length} item${items.length !== 1 ? 's' : ''} saved</div>
    </div>
  `;

  if (items.length === 0) {
    actionsEl.hidden = true;
    listEl.innerHTML = `
      <div class="itin-empty">
        <div class="itin-empty__emoji">⭐</div>
        <h2 class="itin-empty__title">Nothing saved yet</h2>
        <p class="itin-empty__sub">Head back to the guide and tap the ⭐ on anything that catches your eye — events, restaurants, places to stay.</p>
        <a href="index.html" class="btn btn--teal">Explore Geelong →</a>
      </div>
    `;
    return;
  }

  actionsEl.hidden = false;

  // Group by type
  const groups = { event: [], eat: [], stay: [], other: [] };
  items.forEach(item => {
    const g = groups[item.type] || groups.other;
    g.push(item);
  });

  const sectionMeta = {
    event: { label: 'Events & Activities', emoji: '🎯' },
    eat:   { label: 'Where to Eat',        emoji: '🍽️' },
    stay:  { label: 'Where to Stay',       emoji: '🛏️' },
    other: { label: 'Saved',               emoji: '⭐' },
  };

  listEl.innerHTML = Object.entries(groups)
    .filter(([, arr]) => arr.length > 0)
    .map(([type, arr]) => {
      const { label, emoji } = sectionMeta[type];
      return `
        <div class="itin-section">
          <div class="itin-section__title">${emoji} ${label}</div>
          ${arr.map(item => `
            <div class="itin-item">
              <div class="itin-item__icon" style="background:${item.color || '#e8faf8'}">${item.emoji || '📍'}</div>
              <div class="itin-item__body">
                <div class="itin-item__cat">${item.category || item.type}</div>
                <div class="itin-item__title">${item.title || item.name}</div>
                <div class="itin-item__meta">${[item.date, item.time, item.location].filter(Boolean).join(' · ')}</div>
              </div>
              ${item.price ? `<div class="itin-item__price ${item.price === 'Free' ? 'itin-item__price--free' : ''}">${item.price}</div>` : ''}
              <button class="itin-item__remove" onclick="removeSaved('${item.id}')" aria-label="Remove">✕</button>
            </div>
          `).join('')}
        </div>
      `;
    }).join('');
}

// ── CLEAR ALL ─────────────────────────────────────────────
document.getElementById('js-clear-itin')?.addEventListener('click', () => {
  if (confirm('Remove all saved items?')) {
    localStorage.removeItem('wtdg_saved');
    renderItinerary();
  }
});

// ── EMAIL MODAL ───────────────────────────────────────────
const modal    = document.getElementById('js-modal');
const modalClose = document.getElementById('js-modal-close');

document.getElementById('js-email-itin')?.addEventListener('click', () => {
  const user = getUser();
  if (user.email) document.getElementById('modal-email').value = user.email;
  if (user.name)  document.getElementById('modal-name').value  = user.name;
  modal.hidden = false;
});

modalClose?.addEventListener('click', () => { modal.hidden = true; });
modal?.addEventListener('click', e => { if (e.target === modal) modal.hidden = true; });

document.getElementById('js-modal-send')?.addEventListener('click', () => {
  const email = document.getElementById('modal-email').value.trim();
  if (!email) { document.getElementById('modal-email').focus(); return; }
  // Save email to user state
  const user = getUser();
  user.email = email;
  user.name  = document.getElementById('modal-name').value.trim() || user.name;
  localStorage.setItem('wtdg_user', JSON.stringify(user));
  modal.hidden = true;
  showToast('✉️ Itinerary sent! Check your inbox.');
  // TODO: wire to Supabase edge function / email service
});

// ── SHARE ─────────────────────────────────────────────────
document.getElementById('js-share-itin')?.addEventListener('click', () => {
  const url = window.location.href;
  if (navigator.share) {
    navigator.share({ title: 'My Geelong Itinerary', url });
  } else {
    navigator.clipboard.writeText(url).then(() => showToast('🔗 Link copied to clipboard!'));
  }
});

// ── TOAST ─────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('js-share-toast');
  t.textContent = msg;
  t.hidden = false;
  setTimeout(() => { t.hidden = true; }, 3000);
}

// ── INIT ──────────────────────────────────────────────────
renderItinerary();
