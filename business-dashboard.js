'use strict';

let dashAcct, currentBiz, allBizProfiles, bizEvents, bizOffers;

// ── MOCK STATS ────────────────────────────────────────────
function mockStat(bizId, seed, min, max) {
  const hash = [...bizId].reduce((a, c) => a + c.charCodeAt(0), seed);
  return min + (hash % (max - min));
}

// ── LOAD DATA FROM SUPABASE ───────────────────────────────
async function loadBizData() {
  const [evRes, promoRes] = await Promise.all([
    db.from('events').select('*').eq('business_id', currentBiz.id).order('id'),
    db.from('promos').select('*').eq('business_id', currentBiz.id).order('id'),
  ]);
  bizEvents = evRes.data || [];
  bizOffers = promoRes.data || [];
}

async function saveBizSettings() {
  const { error } = await db.from('businesses').update({
    name:        currentBiz.name,
    type:        currentBiz.type,
    suburb:      currentBiz.suburb,
    location:    currentBiz.location,
    website:     currentBiz.website,
    description: currentBiz.description,
    plan:        currentBiz.plan,
  }).eq('id', currentBiz.id);
  return !error;
}

// ── RENDER SWITCHER ───────────────────────────────────────
function renderSwitcher() {
  document.getElementById('js-dash-emoji').textContent   = currentBiz.emoji || '🏪';
  document.getElementById('js-dash-bizname').textContent = currentBiz.name;
  const badge = document.getElementById('js-dash-plan-badge');
  badge.textContent = currentBiz.plan === 'featured' ? '⭐ Featured' : 'Free';
  badge.className = `dash-topbar__plan dash-topbar__plan--${currentBiz.plan}`;

  const menu = document.getElementById('js-switcher-menu');
  menu.innerHTML = allBizProfiles.map(b => `
    <button class="dash-switcher-menu__item${b.id === currentBiz.id ? ' dash-switcher-menu__item--active' : ''}" data-biz="${b.id}">
      ${b.emoji || '🏪'} ${b.name}
      ${b.id === currentBiz.id ? '<span class="material-symbols-rounded" style="margin-left:auto;font-size:1rem;color:var(--teal)">check</span>' : ''}
    </button>
  `).join('') + `
    <div class="dash-switcher-menu__divider"></div>
    <a href="business-signup.html" class="dash-switcher-menu__item dash-switcher-menu__add">
      <span class="material-symbols-rounded" style="font-size:1rem">add</span> Add a business
    </a>
  `;

  menu.querySelectorAll('[data-biz]').forEach(btn => {
    btn.addEventListener('click', () => {
      setCurrentBizId(btn.dataset.biz);
      window.location.reload();
    });
  });

  document.getElementById('js-dash-switcher').addEventListener('click', e => {
    e.stopPropagation();
    menu.classList.toggle('open');
  });
  document.addEventListener('click', () => menu.classList.remove('open'));
}

// ── OVERVIEW ──────────────────────────────────────────────
function renderOverview() {
  const views    = mockStat(currentBiz.id, 1, 120, 980);
  const clicks   = mockStat(currentBiz.id, 2, 18, 140);
  const saves    = mockStat(currentBiz.id, 4, 5, 60);

  return `
    <div class="dash-panel active" id="panel-overview">
      ${currentBiz.plan === 'free' ? `
        <div class="dash-upgrade-banner">
          <div class="dash-upgrade-banner__text">
            <h3>Upgrade to Featured</h3>
            <p>Get unlimited events, a photo gallery, full inquiry details, and priority placement for $49/mo.</p>
          </div>
          <a href="business-signup.html" class="btn btn--teal btn--sm">Upgrade →</a>
        </div>
      ` : ''}

      <div class="dash-stats">
        <div class="dash-stat">
          <div class="dash-stat__num">${views}</div>
          <div class="dash-stat__label">Page views</div>
          <div class="dash-stat__trend">↑ this month</div>
        </div>
        <div class="dash-stat">
          <div class="dash-stat__num">${clicks}</div>
          <div class="dash-stat__label">Link clicks</div>
        </div>
        <div class="dash-stat">
          <div class="dash-stat__num">${bizEvents.length}</div>
          <div class="dash-stat__label">Active events</div>
        </div>
        <div class="dash-stat">
          <div class="dash-stat__num">${saves}</div>
          <div class="dash-stat__label">Saves ⭐</div>
        </div>
      </div>

      <div class="dash-section-header">
        <div class="dash-section-title"><span class="material-symbols-rounded">event</span> Active Events</div>
        <button class="btn btn--outline btn--sm" onclick="switchTab('events')">Manage</button>
      </div>
      ${bizEvents.length ? renderItemsMini(bizEvents.slice(0,2).map(e => ({...e, date: e.date, meta: e.time}))) : emptyState('No events yet', 'events')}

      <div class="dash-section-header" style="margin-top:1.25rem">
        <div class="dash-section-title"><span class="material-symbols-rounded">local_offer</span> Active Offers</div>
        <button class="btn btn--outline btn--sm" onclick="switchTab('offers')">Manage</button>
      </div>
      ${bizOffers.length ? renderItemsMini(bizOffers.slice(0,2).map(o => ({...o, date: o.expires}))) : emptyState('No offers yet', 'offers')}
    </div>
  `;
}

function emptyState(msg, tab) {
  return `<p style="color:var(--mid);font-size:.85rem;margin-bottom:.5rem">${msg}. <button class="gw-link" onclick="switchTab('${tab}')">Add one →</button></p>`;
}

function renderItemsMini(items) {
  return `<div class="dash-item-list">${items.map(it => `
    <div class="dash-item">
      <span class="dash-item__emoji">${it.emoji || '📌'}</span>
      <div class="dash-item__body">
        <div class="dash-item__title">${it.title}</div>
        <div class="dash-item__meta">${it.date || it.expires || ''}</div>
      </div>
    </div>
  `).join('')}</div>`;
}

// ── EVENTS TAB ────────────────────────────────────────────
function renderEvents() {
  const canAdd = currentBiz.plan === 'featured' || bizEvents.length < 1;
  const limitMsg = currentBiz.plan === 'free' && bizEvents.length >= 1
    ? '<p style="font-size:.82rem;color:var(--mid);margin-bottom:.75rem">Free plan: 1 active event. <button class="gw-link" onclick="switchTab(\'settings\')">Upgrade to Featured</button> for unlimited.</p>'
    : '';

  return `
    <div class="dash-panel" id="panel-events">
      ${limitMsg}
      <div class="dash-section-header">
        <div class="dash-section-title"><span class="material-symbols-rounded">event</span> Your Events</div>
      </div>
      <div class="dash-item-list" id="js-events-list">${renderEventItems()}</div>
      ${canAdd ? `
        <div class="dash-add-card">
          <div class="dash-add-card__title">+ Add an event</div>
          <div class="dash-form">
            <div class="dash-row">
              <div class="dash-field"><label class="dash-label">Event name *</label>
                <input class="dash-input" id="ev-title" placeholder="e.g. Jazz Night" /></div>
              <div class="dash-field"><label class="dash-label">Category</label>
                <select class="dash-input" id="ev-cat">
                  <option>Music</option><option>Food & Drink</option><option>Arts & Culture</option>
                  <option>Family</option><option>Markets</option><option>Theatre</option><option>Sport</option><option>Education</option><option>Other</option>
                </select></div>
            </div>
            <div class="dash-row">
              <div class="dash-field"><label class="dash-label">Date *</label>
                <input class="dash-input" type="date" id="ev-date" /></div>
              <div class="dash-field"><label class="dash-label">Time</label>
                <input class="dash-input" type="text" id="ev-time" placeholder="e.g. 6pm – 9pm" /></div>
            </div>
            <div class="dash-row">
              <div class="dash-field"><label class="dash-label">Price</label>
                <input class="dash-input" id="ev-price" placeholder="e.g. $25 or Free" /></div>
              <div class="dash-field"><label class="dash-label">Emoji</label>
                <input class="dash-input" id="ev-emoji" placeholder="🎵" maxlength="2" /></div>
            </div>
            <div class="dash-form-btns">
              <button class="btn btn--teal btn--sm" id="js-ev-add">Add event</button>
            </div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

function renderEventItems() {
  if (!bizEvents.length) return '<p style="color:var(--mid);font-size:.85rem;margin-bottom:.75rem">No events added yet.</p>';
  return bizEvents.map(ev => `
    <div class="dash-item" data-evid="${ev.id}">
      <span class="dash-item__emoji">${ev.emoji || '📅'}</span>
      <div class="dash-item__body">
        <div class="dash-item__title">${ev.title}</div>
        <div class="dash-item__meta">${ev.date || ''} · ${ev.time || ''} · ${ev.price || ''}</div>
      </div>
      <div class="dash-item__actions">
        <button class="dash-item__btn dash-item__btn--danger js-ev-del" data-evid="${ev.id}">
          <span class="material-symbols-rounded">delete</span>
        </button>
      </div>
    </div>
  `).join('');
}

// ── OFFERS TAB ────────────────────────────────────────────
function renderOffers() {
  const canAdd = currentBiz.plan === 'featured' || bizOffers.length < 1;
  const limitMsg = currentBiz.plan === 'free' && bizOffers.length >= 1
    ? '<p style="font-size:.82rem;color:var(--mid);margin-bottom:.75rem">Free plan: 1 active offer. <button class="gw-link" onclick="switchTab(\'settings\')">Upgrade to Featured</button> for unlimited.</p>'
    : '';

  return `
    <div class="dash-panel" id="panel-offers">
      ${limitMsg}
      <div class="dash-section-header">
        <div class="dash-section-title"><span class="material-symbols-rounded">local_offer</span> Your Offers</div>
      </div>
      <div class="dash-item-list" id="js-offers-list">${renderOfferItems()}</div>
      ${canAdd ? `
        <div class="dash-add-card">
          <div class="dash-add-card__title">+ Add an offer</div>
          <div class="dash-form">
            <div class="dash-field"><label class="dash-label">Offer title *</label>
              <input class="dash-input" id="of-title" placeholder="e.g. 20% off Tuesday lunch" /></div>
            <div class="dash-field"><label class="dash-label">Description</label>
              <input class="dash-input" id="of-desc" placeholder="Details of the deal…" /></div>
            <div class="dash-row">
              <div class="dash-field"><label class="dash-label">Expires</label>
                <input class="dash-input" id="of-expires" placeholder="e.g. Ends 30 Jun" /></div>
              <div class="dash-field"><label class="dash-label">Emoji</label>
                <input class="dash-input" id="of-emoji" placeholder="🎉" maxlength="2" /></div>
            </div>
            <div class="dash-form-btns">
              <button class="btn btn--teal btn--sm" id="js-of-add">Add offer</button>
            </div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

function renderOfferItems() {
  if (!bizOffers.length) return '<p style="color:var(--mid);font-size:.85rem;margin-bottom:.75rem">No offers added yet.</p>';
  return bizOffers.map(of => `
    <div class="dash-item" data-ofid="${of.id}">
      <span class="dash-item__emoji">${of.emoji || '🎉'}</span>
      <div class="dash-item__body">
        <div class="dash-item__title">${of.title}</div>
        <div class="dash-item__meta">${of.description || ''} · ${of.expires || ''}</div>
      </div>
      <div class="dash-item__actions">
        <button class="dash-item__btn dash-item__btn--danger js-of-del" data-ofid="${of.id}">
          <span class="material-symbols-rounded">delete</span>
        </button>
      </div>
    </div>
  `).join('');
}

// ── GALLERY TAB ───────────────────────────────────────────
function renderGallery() {
  const isFeatured = currentBiz.plan === 'featured';
  return `
    <div class="dash-panel" id="panel-gallery">
      ${!isFeatured ? `
        <div class="dash-upgrade-banner">
          <div class="dash-upgrade-banner__text">
            <h3>Photo gallery is a Featured feature</h3>
            <p>Upgrade to add up to 20 photos to your listing.</p>
          </div>
          <a href="#" class="btn btn--teal btn--sm" onclick="switchTab('settings')">Upgrade →</a>
        </div>
      ` : ''}
      <div class="dash-section-title" style="margin-bottom:.85rem"><span class="material-symbols-rounded">photo_library</span> Photo Gallery</div>
      <p style="font-size:.82rem;color:var(--mid);margin-bottom:.85rem">Coming soon — photo uploads via Supabase Storage.</p>
    </div>
  `;
}

// ── INQUIRIES TAB ─────────────────────────────────────────
function renderInquiries() {
  return `
    <div class="dash-panel" id="panel-inquiries">
      <div class="dash-section-title" style="margin-bottom:.85rem"><span class="material-symbols-rounded">mail</span> Inquiries</div>
      <p style="color:var(--mid);font-size:.85rem">Inquiries submitted via your listing will appear here.</p>
    </div>
  `;
}

// ── SETTINGS TAB ─────────────────────────────────────────
function renderSettings() {
  return `
    <div class="dash-panel" id="panel-settings">
      <div class="dash-section-title" style="margin-bottom:1rem"><span class="material-symbols-rounded">store</span> Business Details</div>
      <div class="dash-settings-form">
        <div class="dash-field"><label class="dash-label">Business name</label>
          <input class="dash-input" id="set-name" value="${currentBiz.name || ''}" /></div>
        <div class="dash-field"><label class="dash-label">Type</label>
          <input class="dash-input" id="set-type" value="${currentBiz.type || ''}" /></div>
        <div class="dash-row">
          <div class="dash-field"><label class="dash-label">Suburb</label>
            <input class="dash-input" id="set-suburb" value="${currentBiz.suburb || ''}" /></div>
          <div class="dash-field"><label class="dash-label">Website</label>
            <input class="dash-input" id="set-website" value="${currentBiz.website || ''}" /></div>
        </div>
        <div class="dash-field"><label class="dash-label">Address</label>
          <input class="dash-input" id="set-address" value="${currentBiz.location || ''}" /></div>
        <div class="dash-field"><label class="dash-label">Description</label>
          <textarea class="dash-input" id="set-desc" rows="3">${currentBiz.description || ''}</textarea></div>
        <button class="btn btn--teal" id="js-settings-save">Save changes</button>
        <span class="dash-save-msg" id="js-save-msg" style="display:none;margin-left:.75rem;color:var(--teal);font-size:.85rem">Saved ✓</span>
      </div>

      <div class="dash-section-title" style="margin-top:2rem;margin-bottom:.85rem"><span class="material-symbols-rounded">credit_card</span> Plan</div>
      <div style="background:var(--white);border:1px solid var(--border);border-radius:var(--radius-lg);padding:1.1rem">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.5rem">
          <strong style="font-family:var(--font-head)">${currentBiz.plan === 'featured' ? '⭐ Featured' : 'Free'} Plan</strong>
          <span style="font-size:.85rem;color:var(--mid)">${currentBiz.plan === 'featured' ? '$49 / month' : '$0 / month'}</span>
        </div>
        ${currentBiz.plan === 'free' ? `
          <p style="font-size:.82rem;color:var(--mid);margin-bottom:.75rem">Upgrade to Featured for unlimited events, photo gallery, full inquiry details, and priority placement.</p>
          <button class="btn btn--teal btn--sm" id="js-upgrade-btn">Upgrade to Featured — $49/mo</button>
        ` : `
          <p style="font-size:.82rem;color:var(--mid)">Your Featured listing is active. Thank you for supporting WTDG!</p>
        `}
      </div>

      <div class="dash-section-title" style="margin-top:2rem;margin-bottom:.85rem"><span class="material-symbols-rounded">person</span> Account</div>
      <div style="display:flex;flex-direction:column;gap:.5rem">
        <a href="account.html" class="btn btn--outline btn--sm" style="width:fit-content">My account settings</a>
        <button class="btn btn--outline btn--sm" style="width:fit-content;color:#e76f51;border-color:#e76f51" id="js-dash-logout">Log out</button>
      </div>
    </div>
  `;
}

// ── TAB SWITCHING ─────────────────────────────────────────
const tabPanels = { overview: renderOverview, events: renderEvents, offers: renderOffers, gallery: renderGallery, inquiries: renderInquiries, settings: renderSettings };

function switchTab(id) {
  document.querySelectorAll('.dash-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === id));
  document.getElementById('js-dash-root').innerHTML = tabPanels[id]();
  bindPanelEvents(id);
}

function bindPanelEvents(tab) {
  if (tab === 'events') {
    document.getElementById('js-ev-add')?.addEventListener('click', async () => {
      const title = document.getElementById('ev-title').value.trim();
      if (!title) return;

      const rawDate = document.getElementById('ev-date').value;
      const formattedDate = rawDate
        ? new Date(rawDate).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })
        : 'TBC';

      const { data, error } = await db.from('events').insert({
        business_id: currentBiz.id,
        title,
        category:   document.getElementById('ev-cat').value,
        date:       formattedDate,
        time:       document.getElementById('ev-time').value || '',
        price:      document.getElementById('ev-price').value || 'TBC',
        emoji:      document.getElementById('ev-emoji').value || '📅',
        color:      currentBiz.color || '#4ac8d0',
        tags:       [],
        location:   currentBiz.location || currentBiz.suburb || '',
      }).select().single();

      if (!error && data) {
        bizEvents.push(data);
        document.getElementById('js-events-list').innerHTML = renderEventItems();
        ['ev-title','ev-time','ev-price','ev-emoji'].forEach(id => { document.getElementById(id).value = ''; });
        document.getElementById('ev-date').value = '';
        bindEventDeleteHandlers();
      }
    });
    bindEventDeleteHandlers();
  }

  if (tab === 'offers') {
    document.getElementById('js-of-add')?.addEventListener('click', async () => {
      const title = document.getElementById('of-title').value.trim();
      if (!title) return;

      const { data, error } = await db.from('promos').insert({
        id:          'p-' + Date.now().toString(36),
        business_id: currentBiz.id,
        title,
        description: document.getElementById('of-desc').value || '',
        expires:     document.getElementById('of-expires').value || 'Ongoing',
        emoji:       document.getElementById('of-emoji').value || '🎉',
        tag:         'Offer',
      }).select().single();

      if (!error && data) {
        bizOffers.push(data);
        document.getElementById('js-offers-list').innerHTML = renderOfferItems();
        ['of-title','of-desc','of-expires','of-emoji'].forEach(id => { document.getElementById(id).value = ''; });
        bindOfferDeleteHandlers();
      }
    });
    bindOfferDeleteHandlers();
  }

  if (tab === 'settings') {
    document.getElementById('js-settings-save')?.addEventListener('click', async () => {
      currentBiz.name        = document.getElementById('set-name').value.trim();
      currentBiz.type        = document.getElementById('set-type').value.trim();
      currentBiz.suburb      = document.getElementById('set-suburb').value.trim();
      currentBiz.location    = document.getElementById('set-address').value.trim();
      currentBiz.website     = document.getElementById('set-website').value.trim();
      currentBiz.description = document.getElementById('set-desc').value.trim();

      const ok = await saveBizSettings();
      if (ok) {
        renderSwitcher();
        const msg = document.getElementById('js-save-msg');
        if (msg) { msg.style.display = 'inline'; setTimeout(() => msg.style.display = 'none', 2500); }
      }
    });

    document.getElementById('js-upgrade-btn')?.addEventListener('click', async () => {
      currentBiz.plan = 'featured';
      await saveBizSettings();
      renderSwitcher();
      switchTab('settings');
    });

    document.getElementById('js-dash-logout')?.addEventListener('click', logout);
  }
}

function bindEventDeleteHandlers() {
  document.querySelectorAll('.js-ev-del').forEach(btn => {
    btn.addEventListener('click', async () => {
      const evId = parseInt(btn.dataset.evid);
      const { error } = await db.from('events').delete().eq('id', evId);
      if (!error) {
        bizEvents = bizEvents.filter(e => e.id !== evId);
        document.getElementById('js-events-list').innerHTML = renderEventItems();
        bindEventDeleteHandlers();
      }
    });
  });
}

function bindOfferDeleteHandlers() {
  document.querySelectorAll('.js-of-del').forEach(btn => {
    btn.addEventListener('click', async () => {
      const ofId = btn.dataset.ofid;
      const { error } = await db.from('promos').delete().eq('id', ofId);
      if (!error) {
        bizOffers = bizOffers.filter(o => o.id !== ofId);
        document.getElementById('js-offers-list').innerHTML = renderOfferItems();
        bindOfferDeleteHandlers();
      }
    });
  });
}

// ── INIT ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await db.auth.getSession();
  if (!session) {
    window.location.href = 'login.html?next=business-dashboard.html';
    return;
  }

  dashAcct = getAccount() || { id: session.user.id, email: session.user.email, name: session.user.user_metadata?.name };

  const { data: businesses, error } = await db.from('businesses')
    .select('*')
    .eq('owner_id', session.user.id)
    .order('name');

  if (error || !businesses?.length) {
    window.location.href = 'business-signup.html';
    return;
  }

  allBizProfiles = businesses;
  const savedId = getCurrentBizId();
  currentBiz = allBizProfiles.find(b => b.id === savedId) || allBizProfiles[0];
  setCurrentBizId(currentBiz.id);

  await loadBizData();

  renderSwitcher();
  switchTab('overview');

  document.querySelectorAll('.dash-tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });
});
