'use strict';

let dashAcct, currentBiz, allBizProfiles, bizEvents, bizOffers, bizInquiries;

const FREE_EVENT_LIMIT  = 3;
const FREE_OFFER_LIMIT  = 3;
const GOLD_PROMO_EVENTS = 3; // included promoted events per year

// ── HELPERS ───────────────────────────────────────────────
function isGold() { return !!(currentBiz.is_gold); }
function promotedUsed() { return parseInt(currentBiz.promoted_events_used) || 0; }
function promotedLeft() { return Math.max(0, GOLD_PROMO_EVENTS - promotedUsed()); }

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── IMAGE UPLOAD HELPER ───────────────────────────────────
// Uploads a file to Supabase Storage (business-media bucket)
// Returns the public URL or null on error.
async function uploadImage(file, pathPrefix, statusEl) {
  const BUCKET = 'business-media';
  const MAX_MB = 5;
  if (!file) return null;
  if (file.size > MAX_MB * 1024 * 1024) {
    if (statusEl) { statusEl.textContent = `File too large (max ${MAX_MB}MB)`; statusEl.style.color = 'var(--error,#dc2626)'; }
    return null;
  }
  const ext  = file.name.split('.').pop().toLowerCase();
  const path = `${pathPrefix}/${Date.now()}.${ext}`;
  if (statusEl) { statusEl.textContent = 'Uploading…'; statusEl.style.color = 'var(--mid)'; }
  const { error } = await db.storage.from(BUCKET).upload(path, file, { upsert: true, contentType: file.type });
  if (error) {
    if (statusEl) { statusEl.textContent = 'Upload failed: ' + error.message; statusEl.style.color = 'var(--error,#dc2626)'; }
    return null;
  }
  const { data } = db.storage.from(BUCKET).getPublicUrl(path);
  if (statusEl) { statusEl.textContent = '✓ Uploaded'; statusEl.style.color = 'var(--success,#16a34a)'; }
  return data.publicUrl;
}

// Wire a file input to preview + upload, storing result in a hidden input
function bindImageUpload(fileInputId, previewId, statusId, hiddenInputId, pathPrefix) {
  const fileEl   = document.getElementById(fileInputId);
  const preview  = document.getElementById(previewId);
  const statusEl = document.getElementById(statusId);
  const hiddenEl = document.getElementById(hiddenInputId);
  if (!fileEl) return;
  fileEl.addEventListener('change', async () => {
    const file = fileEl.files[0];
    if (!file) return;
    // Show local preview immediately
    if (preview) { preview.src = URL.createObjectURL(file); preview.style.display = 'block'; }
    const url = await uploadImage(file, pathPrefix, statusEl);
    if (url && hiddenEl) hiddenEl.value = url;
  });
}

// ── LOAD DATA FROM SUPABASE ───────────────────────────────
async function loadBizData() {
  const [evRes, promoRes, inqRes] = await Promise.all([
    db.from('events').select('*').eq('business_id', currentBiz.id).order('id'),
    db.from('promos').select('*').eq('business_id', currentBiz.id).order('id'),
    db.from('inquiries').select('*').eq('business_id', currentBiz.id).order('created_at', { ascending: false }),
  ]);
  bizEvents    = evRes.data    || [];
  bizOffers    = promoRes.data || [];
  bizInquiries = inqRes.data   || [];

  // Badge unread count
  const unread = bizInquiries.filter(i => i.status === 'unread').length;
  const badge  = document.getElementById('js-inq-badge');
  if (badge) { badge.textContent = unread; badge.style.display = unread ? 'inline' : 'none'; }
}

async function saveBizSettings() {
  const { error } = await db.from('businesses').update({
    name:        currentBiz.name,
    type:        currentBiz.type,
    suburb:      currentBiz.suburb,
    location:    currentBiz.location,
    website:     currentBiz.website,
    description: currentBiz.description,
  }).eq('id', currentBiz.id);
  return !error;
}

// ── RENDER SWITCHER ───────────────────────────────────────
function renderSwitcher() {
  document.getElementById('js-dash-emoji').textContent   = currentBiz.emoji || '🏪';
  document.getElementById('js-dash-bizname').textContent = currentBiz.name;
  const badge = document.getElementById('js-dash-plan-badge');
  if (isGold()) {
    badge.textContent = '⭐ Gold';
    badge.className = 'dash-topbar__plan dash-topbar__plan--gold';
  } else {
    badge.textContent = 'Free';
    badge.className = 'dash-topbar__plan';
  }

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
      localStorage.setItem('wtdg_dash_biz', btn.dataset.biz);
      window.location.href = `business-dashboard.html?biz=${btn.dataset.biz}`;
    });
  });

  document.getElementById('js-dash-switcher').addEventListener('click', e => {
    e.stopPropagation();
    menu.classList.toggle('open');
  });
  document.addEventListener('click', () => menu.classList.remove('open'));
}

// ── PENDING APPROVAL BANNER ───────────────────────────────
function pendingBanner() {
  if (currentBiz.status !== 'pending') return '';
  return `
    <div class="dash-pending-banner">
      <div class="dash-pending-banner__icon">⏳</div>
      <div class="dash-pending-banner__body">
        <div class="dash-pending-banner__title">Pending approval</div>
        <div class="dash-pending-banner__sub">Your listing is under review and won't appear publicly until approved. We typically approve within 24 hours. You can still set up your events and offers in the meantime.</div>
      </div>
    </div>
  `;
}

// ── GOLD UPGRADE BANNER ───────────────────────────────────
function goldUpgradeBanner() {
  if (isGold()) return '';
  return `
    <div class="dash-upgrade-banner">
      <div class="dash-upgrade-banner__text">
        <h3>⭐ Upgrade to Gold</h3>
        <p>Unlock your enquiry form, homepage rotation, 3 promoted events per year, unlimited offers, and featured placement in our weekly email to ${(3200).toLocaleString()}+ subscribers.</p>
      </div>
      <a href="upgrade.html?biz=${encodeURIComponent(currentBiz.slug || currentBiz.id)}" class="btn btn--gold btn--sm">$249/yr →</a>
    </div>
  `;
}

// ── OVERVIEW ──────────────────────────────────────────────
function renderOverview() {
  const views     = currentBiz.view_count || 0;
  const unread    = bizInquiries.filter(i => i.status === 'unread').length;
  const totalInq  = bizInquiries.length;

  const goldExpiry = currentBiz.gold_expires_at
    ? `<p class="dash-plan-expiry">Renews ${fmtDate(currentBiz.gold_expires_at)}</p>` : '';

  return `
    <div class="dash-panel active" id="panel-overview">
      ${pendingBanner()}
      ${goldUpgradeBanner()}
      <div style="margin-bottom:1rem">
        <a href="listing.html?id=${encodeURIComponent(currentBiz.id)}" target="_blank" class="btn btn--outline btn--sm">👁 Preview your listing →</a>
      </div>

      ${isGold() ? `
        <div class="dash-gold-status">
          <span class="dash-gold-status__badge">⭐ Gold Member</span>
          <div class="dash-gold-status__detail">
            <span><span class="material-symbols-rounded">confirmation_number</span> ${promotedLeft()} promoted event${promotedLeft() !== 1 ? 's' : ''} remaining this year</span>
            ${goldExpiry}
          </div>
        </div>
      ` : ''}

      <div class="dash-stats">
        <div class="dash-stat">
          <div class="dash-stat__num">${views.toLocaleString()}</div>
          <div class="dash-stat__label">Listing views</div>
        </div>
        <div class="dash-stat">
          <div class="dash-stat__num">${bizEvents.length}</div>
          <div class="dash-stat__label">Active events</div>
          ${!isGold() ? `<div class="dash-stat__limit">${bizEvents.length}/${FREE_EVENT_LIMIT}</div>` : ''}
        </div>
        <div class="dash-stat">
          <div class="dash-stat__num">${bizOffers.length}</div>
          <div class="dash-stat__label">Active offers</div>
          ${!isGold() ? `<div class="dash-stat__limit">${bizOffers.length}/${FREE_OFFER_LIMIT}</div>` : ''}
        </div>
        <div class="dash-stat ${unread ? 'dash-stat--alert' : ''}">
          <div class="dash-stat__num">${totalInq}</div>
          <div class="dash-stat__label">Enquiries${unread ? ` <span class="dash-stat__unread">${unread} new</span>` : ''}</div>
        </div>
      </div>

      <div class="dash-section-header">
        <div class="dash-section-title"><span class="material-symbols-rounded">event</span> Recent Events</div>
        <button class="btn btn--outline btn--sm" onclick="switchTab('events')">Manage</button>
      </div>
      ${bizEvents.length ? renderItemsMini(bizEvents.slice(0,2)) : emptyState('No events yet', 'events')}

      <div class="dash-section-header" style="margin-top:1.25rem">
        <div class="dash-section-title"><span class="material-symbols-rounded">local_offer</span> Active Offers</div>
        <button class="btn btn--outline btn--sm" onclick="switchTab('offers')">Manage</button>
      </div>
      ${bizOffers.length ? renderItemsMini(bizOffers.slice(0,2)) : emptyState('No offers yet', 'offers')}

      ${totalInq ? `
        <div class="dash-section-header" style="margin-top:1.25rem">
          <div class="dash-section-title"><span class="material-symbols-rounded">mail</span> Recent Enquiries ${unread ? `<span class="dash-inq-unread-pill">${unread} unread</span>` : ''}</div>
          <button class="btn btn--outline btn--sm" onclick="switchTab('inquiries')">View all</button>
        </div>
        ${renderInquiryMini()}
      ` : ''}
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
      ${it.is_promoted ? '<span class="dash-item__promoted-pill">⭐ Promoted</span>' : ''}
    </div>
  `).join('')}</div>`;
}

function renderInquiryMini() {
  return `<div class="dash-item-list">${bizInquiries.slice(0,3).map(inq => `
    <div class="dash-item ${inq.status === 'unread' ? 'dash-item--unread' : ''}">
      <span class="dash-item__emoji">✉️</span>
      <div class="dash-item__body">
        <div class="dash-item__title">${inq.sender_name || inq.sender_email}</div>
        <div class="dash-item__meta">${(inq.message || '').substring(0, 60)}${inq.message?.length > 60 ? '…' : ''}</div>
      </div>
      ${inq.status === 'unread' ? '<span class="dash-item__unread-dot"></span>' : ''}
    </div>
  `).join('')}</div>`;
}

// ── EVENTS TAB ────────────────────────────────────────────
function renderEvents() {
  const atLimit = !isGold() && bizEvents.length >= FREE_EVENT_LIMIT;
  const canAdd  = !atLimit;
  const promoted = bizEvents.filter(e => e.is_promoted).length;

  return `
    <div class="dash-panel active" id="panel-events">
      <div class="dash-section-header">
        <div class="dash-section-title">
          <span class="material-symbols-rounded">event</span> Your Events
          <span class="dash-count">${bizEvents.length}${!isGold() ? `/${FREE_EVENT_LIMIT}` : ''}</span>
        </div>
        ${canAdd ? `<button class="btn btn--teal btn--sm" id="js-ev-open-form">+ Add event</button>` : ''}
      </div>

      ${atLimit ? `
        <div class="dash-limit-bar">
          You've reached the free limit of ${FREE_EVENT_LIMIT} active events.
          <a href="upgrade.html?biz=${encodeURIComponent(currentBiz.slug || currentBiz.id)}" class="gw-link">Upgrade to Gold</a> for unlimited events.
        </div>
      ` : ''}

      ${isGold() ? `
        <div class="dash-promoted-bar">
          <span class="material-symbols-rounded">campaign</span>
          <span><strong>${promotedLeft()}</strong> promoted event${promotedLeft() !== 1 ? 's' : ''} remaining this year</span>
          ${promotedLeft() > 0 ? `<span class="dash-promoted-bar__hint">Promote an event below to feature it on the homepage and push to socials.</span>` : ''}
        </div>
      ` : ''}

      <!-- ADD FORM -->
      ${canAdd ? `
        <div class="dash-add-card" id="js-ev-form" style="display:none">
          <div class="dash-add-card__title">New Event</div>
          <div class="dash-form">
            <div class="dash-field"><label class="dash-label">Event name *</label>
              <input class="dash-input" id="ev-title" placeholder="e.g. Jazz Night at the Bar" /></div>
            <div class="dash-row">
              <div class="dash-field"><label class="dash-label">Category</label>
                <select class="dash-input" id="ev-cat">
                  <option>Music</option><option>Food &amp; Drink</option><option>Arts &amp; Culture</option>
                  <option>Theatre</option><option>Markets</option><option>Sport</option>
                  <option>Education</option><option>Festivals</option><option>Nightlife</option><option>Other</option>
                </select></div>
              <div class="dash-field"><label class="dash-label">Emoji</label>
                <input class="dash-input" id="ev-emoji" placeholder="🎵" maxlength="2" /></div>
            </div>
            <div class="dash-row">
              <div class="dash-field"><label class="dash-label">Date *</label>
                <input class="dash-input" type="date" id="ev-date" /></div>
              <div class="dash-field"><label class="dash-label">Time</label>
                <input class="dash-input" type="text" id="ev-time" placeholder="e.g. 7pm – 10pm" /></div>
            </div>
            <div class="dash-row">
              <div class="dash-field"><label class="dash-label">Price</label>
                <input class="dash-input" id="ev-price" placeholder="e.g. $25 or Free" /></div>
              <div class="dash-field"><label class="dash-label">Location override</label>
                <input class="dash-input" id="ev-location" placeholder="Leave blank to use business address" /></div>
            </div>
            <div class="dash-field"><label class="dash-label">Tags</label>
              <div class="dash-tag-row">
                ${['Free','Family Friendly','Outdoors','All Ages','Accessible','Bookings Required','Under $20','Under $50'].map(t =>
                  `<button type="button" class="dash-tag-chip" data-tag="${t}">${t}</button>`
                ).join('')}
              </div>
            </div>
            <div class="dash-field">
              <label class="dash-label">Event image <span style="font-weight:400;color:var(--mid)">(optional, max 5MB)</span></label>
              <div class="dash-upload-row">
                <label class="dash-upload-btn" for="ev-img-file">📷 Upload photo</label>
                <input type="file" id="ev-img-file" accept="image/*" style="display:none" />
                <span class="dash-upload-status" id="ev-img-status"></span>
              </div>
              <img id="ev-img-preview" style="display:none;max-height:100px;border-radius:8px;margin-top:.5rem" alt="" />
              <input type="hidden" id="ev-img-url" />
            </div>
            <div class="dash-form-btns">
              <button class="btn btn--teal btn--sm" id="js-ev-add">Save event</button>
              <button class="btn btn--outline btn--sm" id="js-ev-cancel">Cancel</button>
            </div>
          </div>
        </div>
      ` : ''}

      <div id="js-events-list">${renderEventItems()}</div>
    </div>
  `;
}

function renderEventItems() {
  if (!bizEvents.length) return `
    <div class="dash-empty">
      <span class="material-symbols-rounded">event_available</span>
      <p>No events yet. Add your first event to get it listed on the site.</p>
    </div>`;

  return `<div class="dash-event-cards">${bizEvents.map(ev => `
    <div class="dash-event-card${ev.is_promoted ? ' dash-event-card--promoted' : ''}" data-evid="${ev.id}">
      <div class="dash-event-card__left">
        <span class="dash-event-card__emoji">${ev.emoji || '📅'}</span>
        <div>
          <div class="dash-event-card__title">
            ${ev.title}
            ${ev.is_promoted ? '<span class="dash-promoted-pill">⭐ Featured</span>' : ''}
          </div>
          <div class="dash-event-card__meta">
            ${ev.date  ? `<span><span class="material-symbols-rounded">calendar_today</span>${ev.date}</span>` : ''}
            ${ev.time  ? `<span><span class="material-symbols-rounded">schedule</span>${ev.time}</span>` : ''}
            ${ev.price ? `<span><span class="material-symbols-rounded">confirmation_number</span>${ev.price}</span>` : ''}
          </div>
          ${ev.category ? `<span class="dash-event-card__cat">${ev.category}</span>` : ''}
        </div>
      </div>
      <div class="dash-event-card__actions">
        ${!ev.is_promoted ? `
          ${isGold() && promotedLeft() > 0
            ? `<a href="promote-event.html?ev=${ev.id}&biz=${encodeURIComponent(currentBiz.slug || currentBiz.id)}&gold=1" class="btn btn--gold btn--xs">⭐ Promote</a>`
            : !isGold()
              ? `<a href="promote-event.html?ev=${ev.id}&biz=${encodeURIComponent(currentBiz.slug || currentBiz.id)}" class="btn btn--outline btn--xs" title="Promote this event">⭐ Promote</a>`
              : ''
          }
        ` : `<span class="dash-promoted-active">⭐ Live</span>`}
        <button class="dash-item__btn js-ev-del" data-evid="${ev.id}" title="Delete">
          <span class="material-symbols-rounded">delete</span>
        </button>
      </div>
    </div>
  `).join('')}</div>`;
}

// ── OFFERS TAB ────────────────────────────────────────────
function renderOffers() {
  const atLimit = !isGold() && bizOffers.length >= FREE_OFFER_LIMIT;
  const canAdd  = !atLimit;

  return `
    <div class="dash-panel active" id="panel-offers">
      <div class="dash-section-header">
        <div class="dash-section-title">
          <span class="material-symbols-rounded">local_offer</span> Your Offers
          <span class="dash-count">${bizOffers.length}${!isGold() ? `/${FREE_OFFER_LIMIT}` : ''}</span>
        </div>
        ${canAdd ? `<button class="btn btn--teal btn--sm" id="js-of-open-form">+ Add offer</button>` : ''}
      </div>

      ${atLimit ? `
        <div class="dash-limit-bar">
          You've reached the free limit of ${FREE_OFFER_LIMIT} active offers.
          <a href="upgrade.html?biz=${encodeURIComponent(currentBiz.slug || currentBiz.id)}" class="gw-link">Upgrade to Gold</a> for unlimited offers.
        </div>
      ` : ''}

      ${canAdd ? `
        <div class="dash-add-card" id="js-of-form" style="display:none">
          <div class="dash-add-card__title">New Offer</div>
          <div class="dash-form">
            <div class="dash-field"><label class="dash-label">Offer title *</label>
              <input class="dash-input" id="of-title" placeholder="e.g. 20% off Tuesday lunch" /></div>
            <div class="dash-field"><label class="dash-label">Description</label>
              <textarea class="dash-input" id="of-desc" rows="2" placeholder="Terms, details, or how to redeem…"></textarea></div>
            <div class="dash-row">
              <div class="dash-field"><label class="dash-label">Offer type</label>
                <select class="dash-input" id="of-tag">
                  <option>Discount</option><option>Happy Hour</option><option>Weekly Special</option>
                  <option>Loyalty Deal</option><option>Gift with Purchase</option><option>Special Menu</option><option>Other</option>
                </select></div>
              <div class="dash-field"><label class="dash-label">Emoji</label>
                <input class="dash-input" id="of-emoji" placeholder="🎉" maxlength="2" /></div>
            </div>
            <div class="dash-field"><label class="dash-label">Expires / When valid</label>
              <input class="dash-input" id="of-expires" placeholder="e.g. Every Friday · Ends 30 Jun · Ongoing" /></div>
            <div class="dash-field">
              <label class="dash-label">Offer image <span style="font-weight:400;color:var(--mid)">(optional)</span></label>
              <div class="dash-upload-row">
                <label class="dash-upload-btn" for="of-img-file">📷 Upload photo</label>
                <input type="file" id="of-img-file" accept="image/*" style="display:none" />
                <span class="dash-upload-status" id="of-img-status"></span>
              </div>
              <img id="of-img-preview" style="display:none;max-height:80px;border-radius:8px;margin-top:.5rem" alt="" />
              <input type="hidden" id="of-img-url" />
            </div>
            <div class="dash-form-btns">
              <button class="btn btn--teal btn--sm" id="js-of-add">Save offer</button>
              <button class="btn btn--outline btn--sm" id="js-of-cancel">Cancel</button>
            </div>
          </div>
        </div>
      ` : ''}

      <div id="js-offers-list">${renderOfferItems()}</div>
    </div>
  `;
}

function renderOfferItems() {
  if (!bizOffers.length) return `
    <div class="dash-empty">
      <span class="material-symbols-rounded">redeem</span>
      <p>No offers yet. Add a deal or special to attract customers.</p>
    </div>`;

  return `<div class="dash-event-cards">${bizOffers.map(of => `
    <div class="dash-event-card" data-ofid="${of.id}">
      <div class="dash-event-card__left">
        <span class="dash-event-card__emoji">${of.emoji || '🎉'}</span>
        <div>
          <div class="dash-event-card__title">${of.title}</div>
          <div class="dash-event-card__meta">
            ${of.expires ? `<span><span class="material-symbols-rounded">schedule</span>${of.expires}</span>` : ''}
          </div>
          ${of.tag ? `<span class="dash-event-card__cat">${of.tag}</span>` : ''}
          ${of.description ? `<p class="dash-event-card__desc">${of.description}</p>` : ''}
        </div>
      </div>
      <div class="dash-event-card__actions">
        <button class="dash-item__btn js-of-del" data-ofid="${of.id}" title="Delete">
          <span class="material-symbols-rounded">delete</span>
        </button>
      </div>
    </div>
  `).join('')}</div>`;
}

// ── INQUIRIES TAB ─────────────────────────────────────────
function renderInquiries() {
  if (!isGold()) {
    return `
      <div class="dash-panel active" id="panel-inquiries">
        <div class="dash-inq-gate">
          <span class="dash-inq-gate__icon">📬</span>
          <h3>Enquiries are a Gold feature</h3>
          <p>When customers send you a message via your listing, it appears here and gets emailed to you directly.</p>
          <a href="upgrade.html?biz=${encodeURIComponent(currentBiz.slug || currentBiz.id)}" class="btn btn--gold">Upgrade to Gold — $249/yr →</a>
        </div>
      </div>
    `;
  }

  return `
    <div class="dash-panel active" id="panel-inquiries">
      <div class="dash-section-header">
        <div class="dash-section-title"><span class="material-symbols-rounded">mail</span> Enquiries <span class="dash-count">${bizInquiries.length}</span></div>
      </div>

      ${!bizInquiries.length ? `
        <div class="dash-empty">
          <span class="material-symbols-rounded">mark_email_unread</span>
          <p>No enquiries yet. Customers who contact you via your listing will appear here.</p>
        </div>
      ` : `
        <div class="dash-inq-list" id="js-inq-list">
          ${bizInquiries.map(inq => `
            <div class="dash-inq-item${inq.status === 'unread' ? ' dash-inq-item--unread' : ''}" data-inqid="${inq.id}">
              <div class="dash-inq-item__header">
                <span class="dash-inq-item__name">${inq.sender_name || 'Anonymous'}</span>
                <span class="dash-inq-item__email">${inq.sender_email}</span>
                <span class="dash-inq-item__date">${fmtDate(inq.created_at)}</span>
                ${inq.status === 'unread' ? '<span class="dash-inq-item__badge">New</span>' : ''}
              </div>
              <p class="dash-inq-item__msg">${(inq.message || '').replace(/</g,'&lt;')}</p>
              <div class="dash-inq-item__actions">
                <a href="mailto:${inq.sender_email}?subject=Re: Your enquiry about ${encodeURIComponent(currentBiz.name)}" class="btn btn--teal btn--xs">Reply →</a>
                ${inq.status === 'unread' ? `<button class="btn btn--outline btn--xs js-inq-read" data-inqid="${inq.id}">Mark read</button>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;
}

// ── GALLERY TAB ───────────────────────────────────────────
function renderGallery() {
  const currentImg = currentBiz.img || '';
  return `
    <div class="dash-panel active" id="panel-gallery">
      <div class="dash-section-title" style="margin-bottom:.85rem"><span class="material-symbols-rounded">photo_library</span> Photos</div>

      <div class="dash-add-card" style="margin-bottom:1.25rem">
        <div class="dash-add-card__title">Cover photo</div>
        <p style="font-size:.82rem;color:var(--mid);margin-bottom:.85rem">This image appears on your listing card and at the top of your business page.</p>
        ${currentImg ? `<img src="${currentImg}" style="max-height:140px;border-radius:10px;margin-bottom:.85rem;object-fit:cover" alt="Current cover" />` : ''}
        <div class="dash-upload-row">
          <label class="dash-upload-btn" for="cover-img-file">📷 ${currentImg ? 'Replace photo' : 'Upload cover photo'}</label>
          <input type="file" id="cover-img-file" accept="image/*" style="display:none" />
          <span class="dash-upload-status" id="cover-img-status"></span>
        </div>
        <img id="cover-img-preview" style="display:none;max-height:120px;border-radius:8px;margin-top:.75rem" alt="" />
      </div>

      ${!isGold() ? `
        <div class="dash-upgrade-banner">
          <div class="dash-upgrade-banner__text">
            <h3>Gallery is a Gold feature</h3>
            <p>Upgrade to add up to 20 photos and a full photo gallery to your listing.</p>
          </div>
          <a href="upgrade.html?biz=${encodeURIComponent(currentBiz.slug || currentBiz.id)}" class="btn btn--gold btn--sm">Upgrade →</a>
        </div>
      ` : `
        <div style="color:var(--mid);font-size:.85rem;margin-top:.5rem">Gallery (multiple photos) — coming soon for Gold members.</div>
      `}
    </div>
  `;
}

// ── PROMOTE TAB — calendar helpers ────────────────────────
let _dashCalSlots = null;
let _dashCalFilter = 'all';
let _dashCalPending = null; // { week, dayLabel, slot, price }

async function loadDashCalSlots() {
  const grid    = document.getElementById('js-dash-cal-grid');
  const loading = document.getElementById('js-dash-cal-loading');
  if (!grid) return;

  try {
    // Build 8 weeks of Tue/Thu dates from today
    const dates = [];
    const today = new Date();
    for (let w = 0; w < 8; w++) {
      for (const dayOffset of [2, 4]) { // Tuesday=2, Thursday=4
        const d = new Date(today);
        const diff = ((dayOffset - today.getDay() + 7) % 7) + w * 7;
        d.setDate(today.getDate() + diff);
        dates.push(d.toISOString().split('T')[0]);
      }
    }
    const uniqueDates = [...new Set(dates)].sort().filter(d => d >= today.toISOString().split('T')[0]).slice(0, 16);

    // Fetch existing bookings
    const { data: booked } = await db
      .from('email_sponsorships')
      .select('send_date,slot,status')
      .in('send_date', uniqueDates)
      .in('status', ['pending', 'confirmed']);

    const bookedSet = new Set((booked || []).map(b => `${b.send_date}:${b.slot}`));
    _dashCalSlots = uniqueDates.map(date => {
      const d     = new Date(date + 'T00:00:00');
      const day   = d.getDay();
      const label = d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
      const type  = day === 2 ? 'tuesday' : 'thursday';
      const name  = day === 2 ? "What's Happening" : 'Your Weekend';
      return {
        date, label, type, name,
        topFree:    !bookedSet.has(`${date}:top`),
        bottomFree: !bookedSet.has(`${date}:bottom`),
      };
    });

    loading.style.display = 'none';
    grid.style.display    = 'grid';
    renderDashCalGrid('all');
  } catch (e) {
    if (loading) loading.innerHTML = '<span style="color:var(--mid);font-size:.8rem">Could not load availability.</span>';
  }
}

function renderDashCalGrid(filter) {
  _dashCalFilter = filter;
  const grid = document.getElementById('js-dash-cal-grid');
  if (!grid || !_dashCalSlots) return;

  const weeks = {};
  _dashCalSlots
    .filter(s => filter === 'all' || s.type === filter)
    .forEach(s => {
      const d   = new Date(s.date + 'T00:00:00');
      const wk  = `Week of ${new Date(d.setDate(d.getDate() - d.getDay())).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}`;
      if (!weeks[wk]) weeks[wk] = [];
      weeks[wk].push(s);
    });

  grid.innerHTML = Object.entries(weeks).map(([wk, sends]) => `
    <div class="dash-cal-week">
      <div class="dash-cal-week__label">${wk}</div>
      ${sends.map(s => `
        <div class="dash-cal-send">
          <div class="dash-cal-send__day">${s.label} · <em>${s.name}</em></div>
          <div class="dash-cal-send__slots">
            ${slotBtn(s, 'top')}
            ${slotBtn(s, 'bottom')}
          </div>
        </div>`).join('')}
    </div>
  `).join('') || '<p style="color:var(--mid);font-size:.83rem;grid-column:1/-1">No sends match this filter.</p>';

  // Bind slot buttons
  grid.querySelectorAll('.dash-cal-slot-btn[data-available="true"]').forEach(btn => {
    btn.addEventListener('click', () => {
      _dashCalPending = {
        date:  btn.dataset.date,
        label: btn.dataset.label,
        slot:  btn.dataset.slot,
        price: btn.dataset.price,
      };
      document.getElementById('js-dash-sponsor-summary').innerHTML =
        `<strong>${btn.dataset.label}</strong> · ${btn.dataset.slot === 'top' ? '⭐ Top' : 'Bottom'} slot · <strong>$${btn.dataset.price}</strong>`;
      document.getElementById('js-dash-sponsor-form').style.display = 'block';
      document.getElementById('js-dash-sponsor-success').style.display = 'none';
      document.getElementById('ds-msg').value = '';
      document.getElementById('ds-url').value = currentBiz.website || '';
      document.getElementById('js-dash-sponsor-modal').style.display = 'flex';

      // Bind submit inside modal context
      const submitBtn = document.getElementById('js-dash-sponsor-submit');
      submitBtn.onclick = async () => {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending…';
        try {
          await db.from('email_sponsorships').insert({
            send_date:     _dashCalPending.date,
            send_type:     _dashCalPending.date ? (new Date(_dashCalPending.date + 'T00:00:00').getDay() === 2 ? 'tuesday' : 'thursday') : 'thursday',
            slot:          _dashCalPending.slot,
            business_name: currentBiz.name,
            contact_name:  currentBiz.owner_name || '',
            contact_email: currentBiz.owner_email || '',
            message:       document.getElementById('ds-msg').value || '',
            link_url:      document.getElementById('ds-url').value || '',
            status:        'pending',
          });

          // Notify team
          fetch('/api/notify-sponsorship', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              businessName: currentBiz.name,
              sendDate: _dashCalPending.label,
              slot: _dashCalPending.slot,
              price: _dashCalPending.price,
            }),
          }).catch(() => {});

          document.getElementById('js-dash-sponsor-form').style.display = 'none';
          document.getElementById('js-dash-sponsor-success').style.display = 'block';

          // Mark slot as booked in local data
          const s = _dashCalSlots.find(x => x.date === _dashCalPending.date);
          if (s) { if (_dashCalPending.slot === 'top') s.topFree = false; else s.bottomFree = false; }
          renderDashCalGrid(_dashCalFilter);
        } catch (err) {
          alert('Could not submit booking. Please try again.');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Request booking →';
        }
      };
    });
  });
}

function slotBtn(s, slot) {
  const free  = slot === 'top' ? s.topFree : s.bottomFree;
  const price = slot === 'top' ? 49 : 29;
  const label = slot === 'top' ? '⭐ Top $49' : 'Bottom $29';
  if (free) {
    return `<button class="dash-cal-slot-btn" data-available="true"
              data-date="${s.date}" data-label="${s.label}" data-slot="${slot}" data-price="${price}"
            >${label}</button>`;
  }
  return `<button class="dash-cal-slot-btn dash-cal-slot-btn--booked" disabled>${label} — Booked</button>`;
}

// ── PROMOTE TAB ───────────────────────────────────────────
function renderPromote() {
  const credits      = currentBiz.credit_balance || 0;
  const creditBadge  = isGold()
    ? `<div class="dash-credit-badge">
        <span class="material-symbols-rounded">stars</span>
        <span><strong>${credits}</strong> promotion credit${credits !== 1 ? 's' : ''} available</span>
        ${credits > 0 ? `<span class="dash-credit-hint">Redeem on the promote page</span>` : ''}
       </div>`
    : '';

  return `
    <div class="dash-panel active" id="panel-promote">

      ${creditBadge}

      <!-- Unified promote CTA -->
      <div class="dash-section-header">
        <div class="dash-section-title"><span class="material-symbols-rounded">campaign</span> Promote Your Business</div>
      </div>
      <p style="font-size:.875rem;color:var(--mid);margin:0 0 1rem;line-height:1.55">
        Boost your listing, events, offers or articles across the homepage, events page and our social channels. Choose a package below — pay by card or use your credits.
      </p>
      <a href="promote.html?biz=${encodeURIComponent(currentBiz.id)}" class="dash-promo-cta-card">
        <span class="dash-promo-cta-card__icon">🚀</span>
        <div>
          <div class="dash-promo-cta-card__title">Promote anything →</div>
          <div class="dash-promo-cta-card__sub">Boost · Spotlight · Premier — from $49 or use credits</div>
        </div>
        <span class="material-symbols-rounded dash-promo-cta-card__arrow">arrow_forward</span>
      </a>

      <!-- Active promotions -->
      <div class="dash-section-header" style="margin-top:1.75rem">
        <div class="dash-section-title"><span class="material-symbols-rounded">trending_up</span> Active &amp; Pending Promotions</div>
      </div>
      <div id="js-active-promotions"><div style="font-size:.85rem;color:var(--mid)">Loading…</div></div>

      <div class="dash-section-divider"></div>

      <!-- Email sponsorship -->
      <div class="dash-section-header" style="margin-top:0">
        <div class="dash-section-title"><span class="material-symbols-rounded">email</span> Sponsor Our Emails</div>
      </div>
      <p style="font-size:.875rem;color:var(--mid);margin:0 0 1rem;line-height:1.55">
        Reach <strong>3,200+ Geelong locals</strong> in their inbox. Two sends per week — Tuesday and Thursday. Top and bottom slots available each send.
      </p>

      <!-- Slot summary cards -->
      <div class="dash-email-slots">
        <div class="dash-email-slot dash-email-slot--top">
          <div class="dash-email-slot__day">Tuesday</div>
          <div class="dash-email-slot__name">What's Happening</div>
          <div class="dash-email-slot__prices">
            <span class="dash-email-slot__price dash-email-slot__price--top">Top $49</span>
            <span class="dash-email-slot__price">Bottom $29</span>
          </div>
        </div>
        <div class="dash-email-slot dash-email-slot--top">
          <div class="dash-email-slot__day">Thursday</div>
          <div class="dash-email-slot__name">Your Weekend</div>
          <div class="dash-email-slot__prices">
            <span class="dash-email-slot__price dash-email-slot__price--top">Top $49</span>
            <span class="dash-email-slot__price">Bottom $29</span>
          </div>
        </div>
      </div>

      <!-- Inline availability calendar -->
      <div class="dash-sponsor-cal">
        <div class="dash-sponsor-cal__header">
          <span class="dash-sponsor-cal__title">Available slots</span>
          <div class="dash-sponsor-cal__tabs" id="js-dash-cal-tabs">
            <button class="dash-sponsor-cal__tab active" data-filter="all">All</button>
            <button class="dash-sponsor-cal__tab" data-filter="tuesday">Tue</button>
            <button class="dash-sponsor-cal__tab" data-filter="thursday">Thu</button>
          </div>
        </div>
        <div class="dash-sponsor-cal__loading" id="js-dash-cal-loading">
          <span class="material-symbols-rounded" style="animation:spin 1s linear infinite;font-size:1rem">sync</span> Loading…
        </div>
        <div class="dash-sponsor-cal__grid" id="js-dash-cal-grid" style="display:none"></div>
      </div>

      <!-- Booking modal -->
      <div class="dash-sponsor-modal-backdrop" id="js-dash-sponsor-modal" style="display:none">
        <div class="dash-sponsor-modal">
          <button class="dash-sponsor-modal__close" id="js-dash-sponsor-close">×</button>
          <h3 class="dash-sponsor-modal__title">Book email slot</h3>
          <div class="dash-sponsor-modal__summary" id="js-dash-sponsor-summary"></div>
          <div class="dash-sponsor-modal__form" id="js-dash-sponsor-form">
            <div class="dash-field">
              <label class="dash-label">Your message / offer <span style="font-weight:400;color:var(--mid)">(optional)</span></label>
              <textarea class="dash-input" id="ds-msg" rows="2" placeholder="e.g. 20% off this weekend, new menu launch…"></textarea>
            </div>
            <div class="dash-field">
              <label class="dash-label">Link URL <span style="font-weight:400;color:var(--mid)">(optional)</span></label>
              <input class="dash-input" id="ds-url" type="url" placeholder="https://yourbusiness.com.au" />
            </div>
            <p style="font-size:.75rem;color:var(--mid);line-height:1.5;margin:.25rem 0 .75rem">
              <span class="material-symbols-rounded" style="font-size:.85rem;vertical-align:middle;color:var(--teal)">info</span>
              We'll confirm and send a payment link within 24 hours. Slot held 48hrs pending payment.
            </p>
            <button class="btn btn--teal" id="js-dash-sponsor-submit" style="width:100%">Request booking →</button>
          </div>
          <div id="js-dash-sponsor-success" style="display:none;text-align:center;padding:1rem 0">
            <div style="font-size:2rem;margin-bottom:.4rem">🎉</div>
            <p style="font-weight:700;margin:0 0 .25rem">Booking request sent!</p>
            <p style="font-size:.82rem;color:var(--mid)">We'll confirm within 24 hours.</p>
          </div>
        </div>
      </div>

    </div>
  `;
}

// ── SETTINGS TAB ─────────────────────────────────────────
function renderSettings() {
  const planExpiry = currentBiz.gold_expires_at
    ? `<p style="font-size:.82rem;color:var(--mid);margin-top:.25rem">Renews ${fmtDate(currentBiz.gold_expires_at)}</p>` : '';

  return `
    <div class="dash-panel active" id="panel-settings">
      <div class="dash-section-title" style="margin-bottom:1rem"><span class="material-symbols-rounded">store</span> Business Details</div>
      <div class="dash-settings-form">
        <div class="dash-field"><label class="dash-label">Business name</label>
          <input class="dash-input" id="set-name" value="${currentBiz.name || ''}" /></div>
        <div class="dash-field"><label class="dash-label">Type / Category</label>
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

      <div class="dash-section-title" style="margin-top:2rem;margin-bottom:.85rem"><span class="material-symbols-rounded">workspace_premium</span> Membership</div>
      <div class="dash-plan-card${isGold() ? ' dash-plan-card--gold' : ''}">
        <div class="dash-plan-card__header">
          <strong>${isGold() ? '⭐ Gold Member' : 'Free Listing'}</strong>
          <span class="dash-plan-card__price">${isGold() ? '$249 / year' : '$0'}</span>
        </div>
        ${isGold() ? `
          ${planExpiry}
          <ul class="dash-plan-features">
            <li>✓ Enquiry form live on your listing</li>
            <li>✓ Homepage rotation</li>
            <li>✓ ${GOLD_PROMO_EVENTS} promoted events/year (${promotedLeft()} remaining)</li>
            <li>✓ Unlimited offers</li>
            <li>✓ Featured in weekly email</li>
          </ul>
          ${currentBiz.stripe_customer_id ? `
            <button class="btn btn--outline btn--sm" id="js-manage-billing" style="margin-top:.85rem">
              <span class="material-symbols-rounded" style="font-size:.9rem;vertical-align:middle">credit_card</span>
              Manage billing / cancel
            </button>` : ''}
        ` : `
          <p style="font-size:.82rem;color:var(--mid);margin:.5rem 0 1rem">Upgrade to Gold to unlock enquiries, homepage rotation, promoted events, and more.</p>
          <a href="upgrade.html?biz=${encodeURIComponent(currentBiz.slug || currentBiz.id)}" class="btn btn--gold">Upgrade to Gold — $249/yr</a>
          <p style="font-size:.78rem;color:var(--mid);margin-top:.4rem">or <a href="upgrade.html?biz=${encodeURIComponent(currentBiz.slug || currentBiz.id)}&plan=monthly" style="color:var(--teal)">$25/month</a></p>
        `}
      </div>

      <div class="dash-section-title" style="margin-top:2rem;margin-bottom:.85rem"><span class="material-symbols-rounded">person</span> Account</div>
      <div style="display:flex;flex-direction:column;gap:.5rem">
        <p style="font-size:.82rem;color:var(--mid)">${dashAcct?.email || ''}</p>
        <a href="account.html" class="btn btn--outline btn--sm" style="width:fit-content">Account settings</a>
        <button class="btn btn--outline btn--sm" style="width:fit-content;color:#e76f51;border-color:#e76f51" id="js-dash-logout">Log out</button>
      </div>
    </div>
  `;
}

// ── TAB SWITCHING ─────────────────────────────────────────
const tabPanels = { overview: renderOverview, events: renderEvents, offers: renderOffers, gallery: renderGallery, inquiries: renderInquiries, promote: renderPromote, settings: renderSettings };

function switchTab(id) {
  document.querySelectorAll('.dash-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === id));
  document.getElementById('js-dash-root').innerHTML = tabPanels[id]();
  bindPanelEvents(id);
}
window.switchTab = switchTab;

function bindPanelEvents(tab) {
  if (tab === 'events') {
    const selectedTags = new Set();
    // Wire image upload for event form
    bindImageUpload('ev-img-file', 'ev-img-preview', 'ev-img-status', 'ev-img-url', `biz/${currentBiz.id}/events`);

    document.getElementById('js-ev-open-form')?.addEventListener('click', () => {
      const form = document.getElementById('js-ev-form');
      const opening = form.style.display === 'none';
      form.style.display = opening ? 'block' : 'none';
      if (opening) {
        ['ev-title','ev-time','ev-price','ev-emoji','ev-location'].forEach(id => {
          const el = document.getElementById(id); if (el) el.value = '';
        });
        document.getElementById('ev-date').value = '';
        document.getElementById('ev-cat').selectedIndex = 0;
        selectedTags.clear();
        document.querySelectorAll('.dash-tag-chip').forEach(c => c.classList.remove('active'));
      }
    });

    document.getElementById('js-ev-cancel')?.addEventListener('click', () => {
      document.getElementById('js-ev-form').style.display = 'none';
    });

    document.querySelectorAll('.dash-tag-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const tag = chip.dataset.tag;
        if (selectedTags.has(tag)) { selectedTags.delete(tag); chip.classList.remove('active'); }
        else { selectedTags.add(tag); chip.classList.add('active'); }
      });
    });

    document.getElementById('js-ev-add')?.addEventListener('click', async () => {
      const title   = document.getElementById('ev-title').value.trim();
      const rawDate = document.getElementById('ev-date').value;
      if (!title || !rawDate) { alert('Please enter an event name and date.'); return; }

      const btn = document.getElementById('js-ev-add');
      btn.disabled = true; btn.textContent = 'Saving…';

      const formattedDate = new Date(rawDate + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
      const locationVal   = document.getElementById('ev-location').value.trim() || currentBiz.location || currentBiz.suburb || '';

      const evImgUrl = document.getElementById('ev-img-url')?.value || null;
      const { data, error } = await db.from('events').insert({
        business_id: currentBiz.id,
        title,
        category:    document.getElementById('ev-cat').value,
        date:        formattedDate,
        time:        document.getElementById('ev-time').value || '',
        price:       document.getElementById('ev-price').value || 'Free',
        emoji:       document.getElementById('ev-emoji').value || '📅',
        color:       currentBiz.color || '#4ac8d0',
        tags:        [...selectedTags],
        location:    locationVal,
        img:         evImgUrl,
        is_promoted: false,
        status:      'pending',
      }).select().single();

      btn.disabled = false; btn.textContent = 'Save event';
      if (error) { alert('Could not save event: ' + error.message); return; }
      bizEvents.push(data);
      document.getElementById('js-events-list').innerHTML = renderEventItems();
      document.getElementById('js-ev-form').style.display = 'none';
      bindEventActions();
      // Notify user it's pending review
      const notice = document.createElement('div');
      notice.style.cssText = 'background:#fef9c3;border:1.5px solid #fde047;border-radius:10px;padding:.85rem 1rem;font-size:.85rem;margin-top:.75rem;color:#713f12';
      notice.textContent = '⏳ Your event has been submitted and is pending review. It will appear on the site once approved.';
      document.getElementById('js-events-list').prepend(notice);
      setTimeout(() => notice.remove(), 8000);
    });

    bindEventActions();
  }

  if (tab === 'offers') {
    document.getElementById('js-of-open-form')?.addEventListener('click', () => {
      const form = document.getElementById('js-of-form');
      form.style.display = form.style.display === 'none' ? 'block' : 'none';
    });
    document.getElementById('js-of-cancel')?.addEventListener('click', () => {
      document.getElementById('js-of-form').style.display = 'none';
    });

    // Wire image upload for offer form
    bindImageUpload('of-img-file', 'of-img-preview', 'of-img-status', 'of-img-url', `biz/${currentBiz.id}/promos`);

    document.getElementById('js-of-add')?.addEventListener('click', async () => {
      const title = document.getElementById('of-title').value.trim();
      if (!title) { alert('Please enter an offer title.'); return; }
      const btn = document.getElementById('js-of-add');
      btn.disabled = true; btn.textContent = 'Saving…';

      const ofImgUrl = document.getElementById('of-img-url')?.value || null;
      const { data, error } = await db.from('promos').insert({
        id:          'p-' + Date.now().toString(36),
        business_id: currentBiz.id,
        title,
        description: document.getElementById('of-desc').value || '',
        expires:     document.getElementById('of-expires').value || 'Ongoing',
        emoji:       document.getElementById('of-emoji').value || '🎉',
        tag:         document.getElementById('of-tag').value || 'Offer',
        img:         ofImgUrl,
        status:      'pending',
      }).select().single();

      btn.disabled = false; btn.textContent = 'Save offer';
      if (error) { alert('Could not save offer: ' + error.message); return; }
      bizOffers.push(data);
      document.getElementById('js-offers-list').innerHTML = renderOfferItems();
      document.getElementById('js-of-form').style.display = 'none';
      bindOfferDeleteHandlers();
    });

    bindOfferDeleteHandlers();
  }

  if (tab === 'gallery') {
    // Cover photo upload — saves directly to the businesses table
    const fileEl   = document.getElementById('cover-img-file');
    const statusEl = document.getElementById('cover-img-status');
    if (fileEl) {
      fileEl.addEventListener('change', async () => {
        const file = fileEl.files[0];
        if (!file) return;
        // Local preview
        const preview = document.getElementById('cover-img-preview');
        if (preview) { preview.src = URL.createObjectURL(file); preview.style.display = 'block'; }
        // Upload
        const url = await uploadImage(file, `biz/${currentBiz.id}/cover`, statusEl);
        if (!url) return;
        // Persist to business record
        const { error } = await db.from('businesses').update({ img: url }).eq('id', currentBiz.id);
        if (error) { if (statusEl) { statusEl.textContent = 'Saved upload but failed to update listing: ' + error.message; statusEl.style.color = 'var(--error,#dc2626)'; } return; }
        currentBiz.img = url;
        if (statusEl) { statusEl.textContent = '✓ Cover photo updated'; statusEl.style.color = 'var(--success,#16a34a)'; }
      });
    }
  }

  if (tab === 'inquiries') {
    document.querySelectorAll('.js-inq-read').forEach(btn => {
      btn.addEventListener('click', async () => {
        const inqId = btn.dataset.inqid;
        await db.from('inquiries').update({ status: 'read' }).eq('id', inqId);
        const inq = bizInquiries.find(i => i.id == inqId);
        if (inq) inq.status = 'read';
        // Re-render just the badge and list
        const unread = bizInquiries.filter(i => i.status === 'unread').length;
        const badge = document.getElementById('js-inq-badge');
        if (badge) { badge.textContent = unread; badge.style.display = unread ? 'inline' : 'none'; }
        document.getElementById('js-inq-list').innerHTML = bizInquiries.map(inq => `
          <div class="dash-inq-item${inq.status === 'unread' ? ' dash-inq-item--unread' : ''}" data-inqid="${inq.id}">
            <div class="dash-inq-item__header">
              <span class="dash-inq-item__name">${inq.sender_name || 'Anonymous'}</span>
              <span class="dash-inq-item__email">${inq.sender_email}</span>
              <span class="dash-inq-item__date">${fmtDate(inq.created_at)}</span>
              ${inq.status === 'unread' ? '<span class="dash-inq-item__badge">New</span>' : ''}
            </div>
            <p class="dash-inq-item__msg">${(inq.message || '').replace(/</g,'&lt;')}</p>
            <div class="dash-inq-item__actions">
              <a href="mailto:${inq.sender_email}?subject=Re: Your enquiry about ${encodeURIComponent(currentBiz.name)}" class="btn btn--teal btn--xs">Reply →</a>
              ${inq.status === 'unread' ? `<button class="btn btn--outline btn--xs js-inq-read" data-inqid="${inq.id}">Mark read</button>` : ''}
            </div>
          </div>
        `).join('');
        bindPanelEvents('inquiries');
      });
    });
  }

  if (tab === 'promote') {
    // Load active/pending promotions list
    loadActivePromotions();

    // Email sponsorship calendar (still present in the panel)
    document.querySelectorAll('#js-dash-cal-tabs .dash-sponsor-cal__tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#js-dash-cal-tabs .dash-sponsor-cal__tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderDashCalGrid(btn.dataset.filter);
      });
    });
    document.getElementById('js-dash-sponsor-close')?.addEventListener('click', () => {
      document.getElementById('js-dash-sponsor-modal').style.display = 'none';
    });
    loadDashCalSlots();
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

    document.getElementById('js-manage-billing')?.addEventListener('click', async () => {
      const btn = document.getElementById('js-manage-billing');
      btn.disabled = true; btn.textContent = 'Opening billing portal…';
      try {
        const res  = await fetch('/api/stripe-portal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerId: currentBiz.stripe_customer_id }),
        });
        const json = await res.json();
        if (json.url) { window.location.href = json.url; }
        else throw new Error(json.error);
      } catch (e) {
        alert('Could not open billing portal. Please email hello@whattodogeelong.com.au');
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-rounded" style="font-size:.9rem;vertical-align:middle">credit_card</span> Manage billing / cancel';
      }
    });

    document.getElementById('js-dash-logout')?.addEventListener('click', async () => {
      await db.auth.signOut();
      window.location.href = 'login.html';
    });
  }
}

function bindEventActions() {
  // Delete
  document.querySelectorAll('.js-ev-del').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this event?')) return;
      const evId = parseInt(btn.dataset.evid);
      const { error } = await db.from('events').delete().eq('id', evId);
      if (!error) {
        bizEvents = bizEvents.filter(e => e.id !== evId);
        document.getElementById('js-events-list').innerHTML = renderEventItems();
        bindEventActions();
      }
    });
  });

  // Promote (Gold, using included allocation)
  document.querySelectorAll('.js-ev-promote').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Use one of your included promoted events to feature this on the homepage and push to socials?')) return;
      const evId = parseInt(btn.dataset.evid);
      btn.disabled = true; btn.textContent = 'Promoting…';

      const { error: evErr } = await db.from('events').update({ is_promoted: true }).eq('id', evId);
      if (evErr) { alert('Could not promote event.'); btn.disabled = false; return; }

      // Increment used count
      const newCount = promotedUsed() + 1;
      await db.from('businesses').update({ promoted_events_used: newCount }).eq('id', currentBiz.id);
      currentBiz.promoted_events_used = newCount;

      const ev = bizEvents.find(e => e.id === evId);
      if (ev) ev.is_promoted = true;
      document.getElementById('js-events-list').innerHTML = renderEventItems();
      bindEventActions();

      // Refresh promoted bar count
      const pBar = document.querySelector('.dash-promoted-bar strong');
      if (pBar) pBar.textContent = promotedLeft();
    });
  });
}

// Ad creative specs per package
const AD_SPECS = {
  boost:     { label: 'Boost',     size: '1200 × 300 px', ratio: '4:1',   hint: 'Leaderboard banner shown between homepage sections.' },
  spotlight: { label: 'Spotlight', size: '1400 × 350 px', ratio: '4:1',   hint: 'Full-width sticky strip that reveals behind scrolling content.' },
  premier:   { label: 'Premier',   size: '800 × 600 px',  ratio: '4:3',   hint: 'Half-screen slide-up on mobile with a 5-second countdown.' },
};

async function loadActivePromotions() {
  const container = document.getElementById('js-active-promotions');
  if (!container) return;
  try {
    const { data, error } = await db
      .from('promotions')
      .select('*')
      .eq('business_id', currentBiz.id)
      .in('status', ['pending','approved','live'])
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    if (!data || !data.length) {
      container.innerHTML = `<p style="font-size:.85rem;color:var(--mid)">No active promotions yet. Use the button above to create one.</p>`;
      return;
    }

    const statusColor = { pending: '#b45309', approved: '#0d9488', live: '#16a34a' };
    const statusBg    = { pending: '#fef9c3', approved: '#ccfbf1', live: '#dcfce7' };

    container.innerHTML = data.map(p => {
      const col   = statusColor[p.status] || '#64748b';
      const bg    = statusBg[p.status]    || '#f1f5f9';
      const pkg   = p.package ? p.package[0].toUpperCase() + p.package.slice(1) : '—';
      const type  = p.item_type ? p.item_type[0].toUpperCase() + p.item_type.slice(1) : '—';
      const paid  = p.paid_amount ? `$${(p.paid_amount/100).toFixed(0)} AUD` : p.credits_used ? `${p.credits_used} credit${p.credits_used !== 1 ? 's' : ''}` : '—';
      const ends  = p.ends_at ? `Ends ${new Date(p.ends_at).toLocaleDateString('en-AU', { day:'numeric', month:'short' })}` : '';
      const spec  = AD_SPECS[p.package];
      const needsCreative = ['boost','spotlight','premier'].includes(p.package);
      const hasCreative   = !!p.ad_image_url;
      const adLive        = p.ad_live;

      return `
      <div class="dash-promo-row dash-promo-row--expandable" data-promoid="${p.id}">
        <div class="dash-promo-row__top">
          <div class="dash-promo-row__icon">${{ business:'🏢', event:'📅', offer:'🎁', article:'📰' }[p.item_type] || '📣'}</div>
          <div class="dash-promo-row__body">
            <div class="dash-promo-row__title">${pkg} · ${type}</div>
            <div class="dash-promo-row__meta">${paid}${ends ? ' · ' + ends : ''}</div>
            ${needsCreative && !hasCreative ? `<div class="dash-promo-row__action-hint">⚠️ Upload your ad creative to go live</div>` : ''}
            ${hasCreative && adLive ? `<div class="dash-promo-row__action-hint dash-promo-row__action-hint--live">✅ Ad live — <a class="dash-link" href="#" data-promoid="${p.id}" data-action="edit-creative">Update creative</a></div>` : ''}
            ${hasCreative && !adLive ? `<div class="dash-promo-row__action-hint">⏳ Creative uploaded, pending review</div>` : ''}
          </div>
          <span style="background:${bg};color:${col};font-size:.72rem;font-weight:700;padding:.2rem .55rem;border-radius:1rem;flex-shrink:0">${p.status}</span>
        </div>

        ${needsCreative ? `
        <div class="dash-promo-creative" id="js-creative-${p.id}" style="${hasCreative ? 'display:none' : ''}">
          <div class="dash-creative-spec">
            <strong>${spec?.label || pkg} ad creative</strong>
            <span>Recommended: ${spec?.size || '1200 × 300 px'}</span>
            <span class="dash-creative-spec__hint">${spec?.hint || ''}</span>
          </div>
          ${hasCreative ? `<img class="dash-creative-preview" src="${p.ad_image_url}" alt="Current creative" />` : ''}
          <div class="dash-upload-row" style="margin-top:.75rem">
            <label class="dash-upload-btn" for="ad-img-${p.id}">🖼 ${hasCreative ? 'Replace image' : 'Upload ad image'}</label>
            <input type="file" id="ad-img-${p.id}" accept="image/jpeg,image/png,image/webp" style="display:none" data-promoid="${p.id}" class="js-ad-img-input" />
            <span class="dash-upload-status" id="ad-img-status-${p.id}"></span>
          </div>
          <div style="margin-top:.65rem">
            <label class="dash-field-label">Click-through URL (optional)</label>
            <input type="url" class="dash-input js-ad-link-input" data-promoid="${p.id}"
              placeholder="https://yourwebsite.com.au" value="${p.ad_link_url || ''}"
              style="margin-top:.3rem;width:100%;box-sizing:border-box" />
          </div>
          <button class="btn btn--teal btn--sm dash-creative-save" data-promoid="${p.id}" style="margin-top:.75rem">
            Save &amp; go live
          </button>
          <div class="dash-creative-error" id="ad-err-${p.id}" style="display:none;color:#dc2626;font-size:.8rem;margin-top:.4rem"></div>
        </div>` : ''}
      </div>`;
    }).join('');

    // Bind image upload + save handlers for each promotion
    data.filter(p => ['boost','spotlight','premier'].includes(p.package)).forEach(p => {
      const fileInput = document.getElementById(`ad-img-${p.id}`);
      const saveBtn   = container.querySelector(`.dash-creative-save[data-promoid="${p.id}"]`);
      const linkInput = container.querySelector(`.js-ad-link-input[data-promoid="${p.id}"]`);
      if (!fileInput || !saveBtn) return;

      let uploadedUrl = p.ad_image_url || null;

      fileInput.addEventListener('change', async () => {
        const file = fileInput.files[0];
        if (!file) return;
        const statusEl = document.getElementById(`ad-img-status-${p.id}`);
        uploadedUrl = await uploadImage(file, `ad-creatives/${currentBiz.id}`, statusEl);
      });

      // Toggle creative panel via "Update creative" link
      container.querySelector(`[data-promoid="${p.id}"][data-action="edit-creative"]`)?.addEventListener('click', e => {
        e.preventDefault();
        const panel = document.getElementById(`js-creative-${p.id}`);
        if (panel) panel.style.display = panel.style.display === 'none' ? '' : 'none';
      });

      saveBtn.addEventListener('click', async () => {
        const errEl  = document.getElementById(`ad-err-${p.id}`);
        errEl.style.display = 'none';
        if (!uploadedUrl && !p.ad_image_url) {
          errEl.textContent = 'Please upload an image first.';
          errEl.style.display = '';
          return;
        }
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving…';
        const { error } = await db.from('promotions').update({
          ad_image_url: uploadedUrl || p.ad_image_url,
          ad_link_url:  linkInput?.value?.trim() || null,
          ad_live:      true,
        }).eq('id', p.id);

        if (error) {
          errEl.textContent = 'Save failed: ' + error.message;
          errEl.style.display = '';
          saveBtn.disabled = false;
          saveBtn.textContent = 'Save & go live';
        } else {
          await loadActivePromotions(); // re-render
        }
      });
    });

  } catch (e) {
    container.innerHTML = `<p style="font-size:.82rem;color:var(--mid)">Could not load promotions.</p>`;
  }
}

function bindOfferDeleteHandlers() {
  document.querySelectorAll('.js-of-del').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this offer?')) return;
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

  dashAcct = { id: session.user.id, email: session.user.email, name: session.user.user_metadata?.name };

  const { data: businesses, error } = await db.from('businesses')
    .select('*')
    .eq('owner_id', session.user.id)
    .order('name');

  if (error || !businesses?.length) {
    window.location.href = 'business-signup.html';
    return;
  }

  allBizProfiles = businesses;
  // Priority: URL param (from signup redirect) → localStorage → first in list
  const urlBizId = new URLSearchParams(window.location.search).get('biz');
  const savedId  = urlBizId || localStorage.getItem('wtdg_dash_biz');
  currentBiz     = allBizProfiles.find(b => b.id === savedId) || allBizProfiles[0];
  localStorage.setItem('wtdg_dash_biz', currentBiz.id);

  await loadBizData();

  renderSwitcher();
  switchTab('overview');

  document.querySelectorAll('.dash-tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });
});
