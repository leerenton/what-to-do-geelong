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
      ${goldUpgradeBanner()}

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
            ? `<button class="btn btn--gold btn--xs js-ev-promote" data-evid="${ev.id}" title="Promote this event">⭐ Promote</button>`
            : !isGold()
              ? `<a href="upgrade.html?biz=${encodeURIComponent(currentBiz.slug || currentBiz.id)}&promote=${ev.id}" class="btn btn--outline btn--xs" title="Promote via Gold or one-off $99">Promote $99</a>`
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
  return `
    <div class="dash-panel active" id="panel-gallery">
      <div class="dash-section-title" style="margin-bottom:.85rem"><span class="material-symbols-rounded">photo_library</span> Photo Gallery</div>
      ${!isGold() ? `
        <div class="dash-upgrade-banner" style="margin-bottom:1rem">
          <div class="dash-upgrade-banner__text">
            <h3>Photo gallery is a Gold feature</h3>
            <p>Upgrade to add up to 20 photos to your listing and showcase your venue.</p>
          </div>
          <a href="upgrade.html?biz=${encodeURIComponent(currentBiz.slug || currentBiz.id)}" class="btn btn--gold btn--sm">Upgrade →</a>
        </div>
      ` : ''}
      <p style="font-size:.82rem;color:var(--mid);margin-bottom:.85rem">Photo uploads coming soon — drop us an email at <a href="mailto:hello@whattodogeelong.com.au">hello@whattodogeelong.com.au</a> to add photos now.</p>
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
const tabPanels = { overview: renderOverview, events: renderEvents, offers: renderOffers, gallery: renderGallery, inquiries: renderInquiries, settings: renderSettings };

function switchTab(id) {
  document.querySelectorAll('.dash-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === id));
  document.getElementById('js-dash-root').innerHTML = tabPanels[id]();
  bindPanelEvents(id);
}
window.switchTab = switchTab;

function bindPanelEvents(tab) {
  if (tab === 'events') {
    const selectedTags = new Set();

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
        is_promoted: false,
      }).select().single();

      btn.disabled = false; btn.textContent = 'Save event';
      if (error) { alert('Could not save event: ' + error.message); return; }
      bizEvents.push(data);
      document.getElementById('js-events-list').innerHTML = renderEventItems();
      document.getElementById('js-ev-form').style.display = 'none';
      bindEventActions();
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

    document.getElementById('js-of-add')?.addEventListener('click', async () => {
      const title = document.getElementById('of-title').value.trim();
      if (!title) { alert('Please enter an offer title.'); return; }
      const btn = document.getElementById('js-of-add');
      btn.disabled = true; btn.textContent = 'Saving…';

      const { data, error } = await db.from('promos').insert({
        id:          'p-' + Date.now().toString(36),
        business_id: currentBiz.id,
        title,
        description: document.getElementById('of-desc').value || '',
        expires:     document.getElementById('of-expires').value || 'Ongoing',
        emoji:       document.getElementById('of-emoji').value || '🎉',
        tag:         document.getElementById('of-tag').value || 'Offer',
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
  const savedId  = localStorage.getItem('wtdg_dash_biz');
  currentBiz     = allBizProfiles.find(b => b.id === savedId) || allBizProfiles[0];
  localStorage.setItem('wtdg_dash_biz', currentBiz.id);

  await loadBizData();

  renderSwitcher();
  switchTab('overview');

  document.querySelectorAll('.dash-tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });
});
