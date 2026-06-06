'use strict';

// ── SESSION ID (anonymous guide ownership) ────────────────
function getSessionId() {
  let sid = localStorage.getItem('wtdg_sid');
  if (!sid) {
    sid = Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 8);
    localStorage.setItem('wtdg_sid', sid);
  }
  return sid;
}
window.getSessionId = getSessionId;

function genGuideId() {
  return Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 8);
}

async function guideOwnerFilter() {
  try {
    const { data: { session } } = await db.auth.getSession();
    if (session?.user?.id) return { col: 'user_id', val: session.user.id };
  } catch (_) { /* stale token — fall through to session_id */ }
  return { col: 'session_id', val: getSessionId() };
}

// ── GUIDE CRUD ────────────────────────────────────────────
async function loadGuides() {
  const { col, val } = await guideOwnerFilter();
  const { data } = await db.from('guides')
    .select('*, guide_items(*)')
    .eq(col, val)
    .order('created_at', { ascending: false });
  return data || [];
}
window.loadGuides = loadGuides;

async function createGuide({ name, dateFrom, dateTo } = {}) {
  const id = genGuideId();
  let userId = null;
  try { const { data: { session } } = await db.auth.getSession(); userId = session?.user?.id || null; } catch (_) {}
  const { data, error } = await db.from('guides').insert({
    id,
    name:       name || 'My Geelong Guide',
    user_id:    userId,
    session_id: getSessionId(),
    date_from:  dateFrom || null,
    date_to:    dateTo   || null,
  }).select().single();
  if (error) { console.error('createGuide:', error.message); return null; }
  return data;
}
window.createGuide = createGuide;

async function updateGuide(id, { name, dateFrom, dateTo }) {
  const { error } = await db.from('guides').update({
    name,
    date_from: dateFrom || null,
    date_to:   dateTo   || null,
  }).eq('id', id);
  return !error;
}
window.updateGuide = updateGuide;

async function deleteGuide(id) {
  await db.from('guides').delete().eq('id', id);
}
window.deleteGuide = deleteGuide;

async function addItemToGuide(guideId, item) {
  const { error } = await db.from('guide_items').insert({
    guide_id:  guideId,
    item_id:   String(item.id),
    item_type: item.type || 'other',
    item_data: item,
  });
  return !error;
}
window.addItemToGuide = addItemToGuide;

async function removeGuideItem(dbId) {
  await db.from('guide_items').delete().eq('id', dbId);
}
window.removeGuideItem = removeGuideItem;

async function updateGuideItemDate(dbId, plannedDate) {
  await db.from('guide_items').update({ planned_date: plannedDate }).eq('id', dbId);
}
window.updateGuideItemDate = updateGuideItemDate;

// On login: claim any session guides that have no user_id
async function linkSessionGuidesToUser(userId) {
  const sid = localStorage.getItem('wtdg_sid');
  if (!sid || !userId) return;
  await db.from('guides')
    .update({ user_id: userId })
    .eq('session_id', sid)
    .is('user_id', null);
}
window.linkSessionGuidesToUser = linkSessionGuidesToUser;

// ── GUIDE PICKER MODAL ────────────────────────────────────
// Inject once into DOM
function ensureGuidePickerModal() {
  if (document.getElementById('js-guide-picker')) return;
  const el = document.createElement('div');
  el.id = 'js-guide-picker';
  el.className = 'guide-picker-overlay';
  el.hidden = true;
  el.innerHTML = `
    <div class="guide-picker">
      <div class="guide-picker__title">Add to a WTDGuide</div>
      <div class="guide-picker__list" id="js-gp-list"></div>
      <div class="guide-picker__new" id="js-gp-new-wrap">
        <button class="btn btn--outline btn--sm btn--full" id="js-gp-new-btn">+ New guide</button>
        <div id="js-gp-new-form" style="display:none">
          <input class="dash-input" id="js-gp-name" placeholder="Guide name e.g. June Weekend" />
          <div class="guide-picker__row">
            <input class="dash-input" type="date" id="js-gp-from" />
            <input class="dash-input" type="date" id="js-gp-to" />
          </div>
          <button class="btn btn--teal btn--sm btn--full" id="js-gp-create">Create &amp; add</button>
        </div>
      </div>
      <button class="guide-picker__close" id="js-gp-close">✕</button>
    </div>
  `;
  document.body.appendChild(el);

  document.getElementById('js-gp-close').addEventListener('click', closeGuidePicker);
  el.addEventListener('click', e => { if (e.target === el) closeGuidePicker(); });
  document.getElementById('js-gp-new-btn').addEventListener('click', () => {
    document.getElementById('js-gp-new-form').style.display = 'block';
    document.getElementById('js-gp-new-btn').style.display = 'none';
    document.getElementById('js-gp-name').focus();
  });
}

let _pickerResolve = null;

function closeGuidePicker() {
  const el = document.getElementById('js-guide-picker');
  if (el) el.hidden = true;
  if (_pickerResolve) { _pickerResolve(null); _pickerResolve = null; }
}

// Opens picker, resolves with chosen guide object or null if cancelled
async function openGuidePicker(item) {
  ensureGuidePickerModal();
  const el     = document.getElementById('js-guide-picker');
  const list   = document.getElementById('js-gp-list');
  const guides = await loadGuides();

  list.innerHTML = guides.map(g => `
    <button class="guide-picker__item" data-id="${g.id}">
      <span class="guide-picker__item-name">${g.name}</span>
      <span class="guide-picker__item-meta">${(g.guide_items || []).length} items${g.date_from ? ' · ' + formatGuideDate(g.date_from) : ''}</span>
    </button>
  `).join('') || '';

  el.hidden = false;

  return new Promise(resolve => {
    _pickerResolve = resolve;

    list.querySelectorAll('.guide-picker__item').forEach(btn => {
      btn.addEventListener('click', async () => {
        const guide = guides.find(g => g.id === btn.dataset.id);
        await addItemToGuide(guide.id, item);
        closeGuidePicker();
        resolve(guide);
      }, { once: true });
    });

    document.getElementById('js-gp-create').onclick = async () => {
      const name = document.getElementById('js-gp-name').value.trim() || 'My Geelong Guide';
      const dateFrom = document.getElementById('js-gp-from').value || null;
      const dateTo   = document.getElementById('js-gp-to').value   || null;
      const guide = await createGuide({ name, dateFrom, dateTo });
      if (guide) {
        await addItemToGuide(guide.id, item);
        closeGuidePicker();
        resolve(guide);
      }
    };
  });
}

// ── STAR ITEM → GUIDE FLOW ────────────────────────────────
async function starItemToGuide(item, btn) {
  const guides = await loadGuides();

  let guide;
  if (guides.length === 0) {
    // First ever — show new-guide form directly
    ensureGuidePickerModal();
    const el = document.getElementById('js-guide-picker');
    document.getElementById('js-gp-list').innerHTML = '<p class="guide-picker__empty">You don\'t have any WTDGuides yet.</p>';
    document.getElementById('js-gp-new-form').style.display = 'block';
    document.getElementById('js-gp-new-btn').style.display  = 'none';
    document.getElementById('js-gp-name').value = '';
    document.getElementById('js-gp-from').value = '';
    document.getElementById('js-gp-to').value   = '';
    el.hidden = false;
    guide = await new Promise(resolve => {
      _pickerResolve = resolve;
      document.getElementById('js-gp-create').onclick = async () => {
        const name = document.getElementById('js-gp-name').value.trim() || 'My Geelong Guide';
        const dateFrom = document.getElementById('js-gp-from').value || null;
        const dateTo   = document.getElementById('js-gp-to').value   || null;
        const g = await createGuide({ name, dateFrom, dateTo });
        if (g) { await addItemToGuide(g.id, item); closeGuidePicker(); resolve(g); }
      };
    });
  } else if (guides.length === 1) {
    guide = guides[0];
    await addItemToGuide(guide.id, item);
  } else {
    guide = await openGuidePicker(item);
  }

  if (guide) {
    btn.classList.add('starred');
    btn.textContent = '⭐';
    showGuideToast(`Added to "${guide.name}" <a href="guide.html?id=${guide.id}">View →</a>`);
  }
}
window.starItemToGuide = starItemToGuide;

// ── TOAST ─────────────────────────────────────────────────
function showGuideToast(html) {
  let t = document.getElementById('js-guide-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'js-guide-toast';
    t.className = 'guide-toast';
    document.body.appendChild(t);
  }
  t.innerHTML = html;
  t.classList.add('guide-toast--show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('guide-toast--show'), 3500);
}

function formatGuideDate(iso) {
  if (!iso) return '';
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}
window.formatGuideDate = formatGuideDate;
