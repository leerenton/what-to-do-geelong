'use strict';

// ── BUSINESSES ────────────────────────────────────────────
const BUSINESSES = [
  {
    id: 'gpac',
    name: 'GPAC',
    type: 'Arts & Culture',
    section: 'do',
    description: 'Geelong Performing Arts Centre — the region\'s premier venue for theatre, dance, opera, and live performance.',
    emoji: '🎭',
    color: '#e76f51',
    location: 'Little Malop St, Geelong',
    suburb: 'Geelong CBD',
    website: 'gpac.org.au',
    img: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'pistol-pete',
    name: 'Pistol Pete\'s Coffee',
    type: 'Café',
    section: 'eat',
    description: 'Specialty espresso bar and all-day brunch spot in the heart of Geelong West. Rotating single-origin pour-overs.',
    emoji: '☕',
    color: '#f4a261',
    location: 'Pakington St, Geelong West',
    suburb: 'Geelong West',
    website: 'pistolpetes.com.au',
    img: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'boom-gallery',
    name: 'Boom Gallery',
    type: 'Gallery',
    section: 'do',
    description: 'Contemporary art gallery championing regional and emerging Australian artists. Open studios, exhibitions, and workshops year-round.',
    emoji: '🏺',
    color: '#9b5de5',
    location: 'Pakington St, Newtown',
    suburb: 'Newtown',
    website: 'boomgallery.com.au',
    img: 'https://images.unsplash.com/photo-1580138955393-e26e89b56a3c?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'eastern-beach',
    name: 'Eastern Beach Kiosk',
    type: 'Food & Drink',
    section: 'eat',
    description: 'Iconic waterfront kiosk serving fish & chips, ice cream, and cold drinks with views of Corio Bay.',
    emoji: '🌊',
    color: '#4ac8d0',
    location: 'Eastern Beach Reserve',
    suburb: 'Geelong',
    website: '',
    img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'farmers-market',
    name: 'Geelong Farmers Market',
    type: 'Market',
    section: 'eat',
    description: 'Weekly market connecting Geelong locals with the best regional produce, artisan goods, and street food.',
    emoji: '🥦',
    color: '#52b788',
    location: 'Johnstone Park',
    suburb: 'Geelong CBD',
    website: 'geelongfarmersmarket.com.au',
    img: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'the-wharf',
    name: 'The Wharf Shed Café',
    type: 'Restaurant',
    section: 'eat',
    description: 'Waterfront dining with fresh local seafood, craft beer on tap, and sweeping views across the bay.',
    emoji: '⚓',
    color: '#3a86ff',
    location: 'Cunningham Pier, Geelong',
    suburb: 'Geelong CBD',
    website: 'wharfshed.com.au',
    img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
  },
];

// ── EVENTS ────────────────────────────────────────────────
const EVENTS = [
  {
    id: 1,
    businessId: 'farmers-market',
    title: 'Torquay Twilight Market',
    category: 'Markets',
    date: 'Sat 7 Jun',
    time: '4pm – 9pm',
    location: 'Torquay Foreshore',
    price: 'Free',
    emoji: '🛍️',
    color: '#f72585',
    featured: true,
  },
  {
    id: 2,
    businessId: 'eastern-beach',
    title: 'Jazz on the Waterfront',
    category: 'Music',
    date: 'Sat 7 Jun',
    time: '6pm – 10pm',
    location: 'Eastern Beach Reserve',
    price: '$15',
    emoji: '🎷',
    color: '#4ac8d0',
  },
  {
    id: 3,
    businessId: 'farmers-market',
    title: 'Farmers Market Geelong',
    category: 'Food & Drink',
    date: 'Sun 8 Jun',
    time: '8am – 1pm',
    location: 'Johnstone Park',
    price: 'Free',
    emoji: '🥦',
    color: '#52b788',
  },
  {
    id: 4,
    businessId: 'gpac',
    title: 'Kids Science Spectacular',
    category: 'Family',
    date: 'Sun 8 Jun',
    time: '10am – 4pm',
    location: 'Geelong Library & Heritage Centre',
    price: '$10',
    emoji: '🔭',
    color: '#9b5de5',
  },
  {
    id: 5,
    businessId: null,
    title: 'Surf Coast Trail Run',
    category: 'Outdoors',
    date: 'Sat 7 Jun',
    time: '7am start',
    location: 'Anglesea Heathlands',
    price: '$35',
    emoji: '🏃',
    color: '#3a86ff',
  },
  {
    id: 6,
    businessId: 'boom-gallery',
    title: 'Open Studio — Ceramic Art',
    category: 'Arts',
    date: 'Sun 8 Jun',
    time: '11am – 5pm',
    location: 'Boom Gallery, Geelong',
    price: 'Free',
    emoji: '🏺',
    color: '#e76f51',
  },
  {
    id: 7,
    businessId: 'gpac',
    title: 'Opening Night: The Importance of Being Earnest',
    category: 'Theatre',
    date: 'Fri 13 Jun',
    time: '7:30pm',
    location: 'GPAC, Geelong',
    price: '$45',
    emoji: '🎭',
    color: '#e76f51',
  },
  {
    id: 8,
    businessId: 'pistol-pete',
    title: 'Latte Art Masterclass',
    category: 'Food & Drink',
    date: 'Sat 14 Jun',
    time: '9am – 11am',
    location: 'Pistol Pete\'s Coffee, Geelong West',
    price: '$40',
    emoji: '☕',
    color: '#f4a261',
  },
];

// ── STAYS ─────────────────────────────────────────────────
const STAYS = [
  {
    id: 's1',
    name: 'The Pier Hotel',
    type: 'Hotel',
    location: 'Eastern Beach, Geelong',
    price: '$189',
    stars: '★★★★',
    emoji: '🏨',
    color: '#4ac8d0',
    img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 's2',
    name: 'Pakington Suites',
    type: 'Boutique Apartment',
    location: 'Pakington St, Geelong West',
    price: '$145',
    stars: '★★★★',
    emoji: '🏠',
    color: '#9b5de5',
    img: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 's3',
    name: 'Waterfront BnB',
    type: 'Bed & Breakfast',
    location: 'Cunningham Pier precinct',
    price: '$120',
    stars: '★★★',
    emoji: '⚓',
    color: '#3a86ff',
    img: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 's4',
    name: 'Surf Coast Retreat',
    type: 'Holiday House',
    location: 'Torquay',
    price: '$260',
    stars: '★★★★★',
    emoji: '🏡',
    color: '#52b788',
    img: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=600&q=80',
  },
];

// ── PROMOS ────────────────────────────────────────────────
const PROMOS = [
  {
    id: 'p1',
    businessId: 'pistol-pete',
    title: 'Buy 4, Get 1 Free',
    description: 'Every 4th coffee is on us. Valid Mon–Fri only.',
    expires: 'Ends Sun 8 Jun',
    emoji: '🎉',
    tag: 'Loyalty Deal',
  },
  {
    id: 'p2',
    businessId: 'gpac',
    title: '20% off Matinee Tickets',
    description: 'Use code MATINEE20 at checkout on any matinee this month.',
    expires: 'Valid all of June',
    emoji: '🎟️',
    tag: 'Discount',
  },
  {
    id: 'p3',
    businessId: 'eastern-beach',
    title: 'Weekend Soft-Serve Special',
    description: 'Double scoop for the price of a single every Sat & Sun morning.',
    expires: 'Every Sat & Sun',
    emoji: '🍦',
    tag: 'Weekend Deal',
  },
  {
    id: 'p4',
    businessId: 'boom-gallery',
    title: 'Free Print with Any Purchase',
    description: 'Buy any original artwork and take home a complimentary A3 artist print.',
    expires: 'June only',
    emoji: '🖼️',
    tag: 'Gift with Purchase',
  },
  {
    id: 'p5',
    businessId: 'the-wharf',
    title: 'Happy Hour 3–5pm Daily',
    description: '$5 schooners and half-price oysters every afternoon at the Wharf Shed.',
    expires: 'Ongoing',
    emoji: '🍺',
    tag: 'Happy Hour',
  },
];

// ── HELPERS ───────────────────────────────────────────────
function getBusinessById(id) {
  return BUSINESSES.find(b => b.id === id) || null;
}

function getEventsForBusiness(businessId) {
  return EVENTS.filter(e => e.businessId === businessId);
}

function getPromosForBusiness(businessId) {
  return PROMOS.filter(p => p.businessId === businessId);
}

function businessHasUpcoming(id) {
  return EVENTS.some(e => e.businessId === id);
}

function businessHasPromo(id) {
  return PROMOS.some(p => p.businessId === id);
}

// ── RENDER FEATURED EVENT ─────────────────────────────────
function renderFeatured(events) {
  const el = document.getElementById('js-featured-event');
  if (!el) return;

  const ev = events.find(e => e.featured) || events[0];
  if (!ev) { el.innerHTML = ''; return; }

  const biz = ev.businessId ? getBusinessById(ev.businessId) : null;
  const link = biz ? `listing.html?id=${biz.id}` : '#';

  el.innerHTML = `
    <a href="${link}" class="featured-card">
      <div class="featured-card__img" style="background:${ev.color}22">${ev.emoji}</div>
      <div class="featured-card__body">
        <span class="featured-card__badge">⭐ Featured</span>
        <span class="featured-card__cat">${ev.category}</span>
        <h3 class="featured-card__title">${ev.title}</h3>
        <div class="featured-card__meta">
          <span>📅 ${ev.date}</span>
          <span>🕐 ${ev.time}</span>
          <span>📍 ${ev.location}</span>
        </div>
        <div class="featured-card__footer">
          <span class="featured-card__price ${ev.price === 'Free' ? 'featured-card__price--free' : ''}">${ev.price}</span>
          ${biz ? `<span class="featured-card__biz">${biz.emoji} ${biz.name}</span>` : ''}
          <span class="btn btn--teal btn--sm" style="margin-left:auto">View →</span>
        </div>
      </div>
    </a>
  `;
}

// ── RENDER EVENT SCROLL STRIP ─────────────────────────────
function renderEvents(events) {
  const scroll = document.getElementById('js-event-scroll');
  if (!scroll) return;

  const featuredId = (events.find(e => e.featured) || events[0])?.id;
  const rest = events.filter(e => e.id !== featuredId);

  scroll.innerHTML = rest.map(ev => {
    const biz = ev.businessId ? getBusinessById(ev.businessId) : null;
    const link = biz ? `listing.html?id=${biz.id}` : '#';
    const isFree = ev.price === 'Free';
    return `
      <a href="${link}" class="event-card">
        <div class="event-card__thumb" style="background:${ev.color}22">${ev.emoji}</div>
        <div class="event-card__body">
          <span class="event-card__cat">${ev.category}</span>
          <h3 class="event-card__title">${ev.title}</h3>
          <div class="event-card__meta">📍 ${ev.location}</div>
          <div class="event-card__meta">🕐 ${ev.time}</div>
          <button class="event-card__cta ${isFree ? 'event-card__cta--free' : ''}">${isFree ? 'Free Entry' : 'Get Tickets →'}</button>
        </div>
      </a>
    `;
  }).join('');
}

// ── RENDER UPCOMING LIST ──────────────────────────────────
function renderUpcoming() {
  const list = document.getElementById('js-upcoming-list');
  if (!list) return;

  const upcoming = [
    { day: '21', mon: 'Jun', cat: 'Food & Drink', title: 'Winter Solstice Degustation', loc: 'Igni Restaurant', price: 'From $95', teal: false },
    { day: '28', mon: 'Jun', cat: 'Music', title: 'Surf Coast Country Music Festival', loc: 'Torquay Beach', price: 'From $35', teal: false },
    { day: '5',  mon: 'Jul', cat: 'Arts', title: 'MELT Street Art Geelong', loc: 'CBD Laneways', price: 'Free', teal: true },
    { day: '12', mon: 'Jul', cat: 'Family', title: 'School Holiday Circus Spectacular', loc: 'Johnstone Park', price: 'From $18', teal: false },
  ];

  list.innerHTML = upcoming.map(u => `
    <a href="#" class="upcoming-item">
      <div class="upcoming-item__date ${u.teal ? 'upcoming-item__date--teal' : ''}">
        <span class="upcoming-item__day">${u.day}</span>
        <span class="upcoming-item__mon">${u.mon}</span>
      </div>
      <div class="upcoming-item__body">
        <span class="upcoming-item__cat">${u.cat}</span>
        <span class="upcoming-item__title">${u.title}</span>
        <span class="upcoming-item__sub">📍 ${u.loc}</span>
        <span class="upcoming-item__ticket">🎟 ${u.price}</span>
      </div>
    </a>
  `).join('');
}

// ── RENDER EAT STRIP ──────────────────────────────────────
function renderEatStrip() {
  const strip = document.getElementById('js-eat-strip');
  if (!strip) return;

  const eatBiz = BUSINESSES.filter(b => b.section === 'eat');
  strip.innerHTML = eatBiz.map(biz => {
    const hasEvent = businessHasUpcoming(biz.id);
    const hasPromo = businessHasPromo(biz.id);
    const badges = [];
    if (hasEvent) badges.push('<span class="biz-badge biz-badge--event">Event</span>');
    if (hasPromo) badges.push('<span class="biz-badge biz-badge--promo">Offer</span>');

    return `
      <a href="listing.html?id=${biz.id}" class="biz-card">
        ${biz.img
          ? `<img src="${biz.img}" alt="${biz.name}" class="biz-card__img" loading="lazy" />`
          : `<div class="biz-card__img-placeholder" style="background:${biz.color}22">${biz.emoji}</div>`
        }
        <div class="biz-card__body">
          <span class="biz-card__name">${biz.name}</span>
          <span class="biz-card__type">${biz.type} · ${biz.suburb}</span>
          ${badges.length ? `<div class="biz-card__badges">${badges.join('')}</div>` : ''}
        </div>
      </a>
    `;
  }).join('');
}

// ── RENDER STAYS ──────────────────────────────────────────
function renderStays() {
  const scroll = document.getElementById('js-stay-grid');
  if (!scroll) return;

  scroll.innerHTML = STAYS.map(s => `
    <a href="#" class="stay-card">
      ${s.img
        ? `<img src="${s.img}" alt="${s.name}" class="stay-card__img" loading="lazy" />`
        : `<div class="stay-card__img-placeholder" style="background:${s.color}22">${s.emoji}</div>`
      }
      <div class="stay-card__body">
        <span class="stay-card__type">${s.type}</span>
        <span class="stay-card__name">${s.name}</span>
        <span class="stay-card__loc">📍 ${s.location}</span>
        <span class="stay-card__stars">${s.stars}</span>
        <div class="stay-card__price"><strong>${s.price}</strong>/night</div>
        <span class="stay-card__partner">✓ Partner</span>
        <button class="stay-card__book">Book Now →</button>
      </div>
    </a>
  `).join('');
}

// ── RENDER OFFERS STRIP ───────────────────────────────────
function renderOffers() {
  const strip = document.getElementById('js-offers-strip');
  if (!strip) return;

  strip.innerHTML = PROMOS.map(pr => {
    const biz = getBusinessById(pr.businessId);
    return `
      <div class="offer-card">
        <div class="offer-card__icon">${pr.emoji}</div>
        <div class="offer-card__body">
          <span class="offer-card__tag">${pr.tag}</span>
          <span class="offer-card__title">${pr.title}</span>
          ${biz ? `<a href="listing.html?id=${biz.id}" class="offer-card__biz">${biz.emoji} ${biz.name}</a>` : ''}
          <span class="offer-card__expires">⏳ ${pr.expires}</span>
        </div>
      </div>
    `;
  }).join('');
}

// ── CHIP FILTERS ──────────────────────────────────────────
function initChips() {
  const chips = document.querySelectorAll('#js-chip-row .chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('chip--active'));
      chip.classList.add('chip--active');

      const label = chip.textContent.trim();
      let filtered;
      if (label === 'All' || label === 'This weekend') {
        filtered = EVENTS;
      } else if (label === 'Free') {
        filtered = EVENTS.filter(e => e.price === 'Free');
      } else {
        filtered = EVENTS.filter(e => e.category.toLowerCase().includes(label.toLowerCase()));
      }

      renderFeatured(filtered);
      renderEvents(filtered);
    });
  });
}

// ── DATE BAR TOGGLE ───────────────────────────────────────
function initDateBar() {
  const toggle = document.getElementById('js-datebar-toggle');
  const drawer = document.getElementById('js-date-drawer');
  if (!toggle || !drawer) return;

  // Default dates (this weekend)
  const today = new Date();
  const sat = new Date(today);
  sat.setDate(today.getDate() + ((6 - today.getDay() + 7) % 7 || 7));
  const sun = new Date(sat); sun.setDate(sat.getDate() + 1);

  ['dp-from', 'dp-from-2'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.valueAsDate = sat;
  });
  ['dp-to', 'dp-to-2'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.valueAsDate = sun;
  });

  toggle.addEventListener('click', () => {
    const isHidden = drawer.hidden;
    drawer.hidden = !isHidden;
    toggle.textContent = isHidden ? '✕ Close' : '🗓 Planning a visit?';
  });

  document.getElementById('js-dp-apply')?.addEventListener('click', () => {
    drawer.hidden = true;
    toggle.textContent = '🗓 Planning a visit?';
    document.getElementById('do')?.scrollIntoView({ behavior: 'smooth' });
  });
}

// ── PERSONALISE ───────────────────────────────────────────
function initPersonaliseCTAs() {
  document.querySelectorAll('#js-personalise, #js-personalise-2').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      alert('Personalisation coming soon!');
    });
  });
}

// ── LISTING PAGE ──────────────────────────────────────────
function initListingPage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const biz = id ? getBusinessById(id) : null;

  if (!biz) {
    document.getElementById('js-listing-root').innerHTML =
      '<p style="padding:2rem">Business not found. <a href="index.html">Go home</a></p>';
    return;
  }

  document.title = `${biz.name} — WTDG`;

  const events = getEventsForBusiness(biz.id);
  const promos = getPromosForBusiness(biz.id);

  document.getElementById('js-listing-root').innerHTML = `
    <div class="listing-hero">
      <div class="container listing-hero__inner">
        <a href="index.html" class="listing-back">← Back to What To Do Geelong</a>
        <div class="listing-identity">
          <div class="listing-avatar" style="background:${biz.color}22">${biz.emoji}</div>
          <div>
            <p class="listing-type">${biz.type}</p>
            <h1 class="listing-name">${biz.name}</h1>
            <p class="listing-location">📍 ${biz.location}</p>
          </div>
        </div>
        <p class="listing-desc">${biz.description}</p>
        ${biz.website ? `<a href="https://${biz.website}" target="_blank" rel="noopener" class="btn btn--outline btn--sm listing-web">🌐 ${biz.website}</a>` : ''}
      </div>
    </div>

    <div class="container listing-body">
      <div class="listing-tabs" role="tablist">
        <button class="listing-tab listing-tab--active" role="tab" data-tab="events">
          Events <span class="tab-count">${events.length}</span>
        </button>
        <button class="listing-tab" role="tab" data-tab="promos">
          Offers <span class="tab-count">${promos.length}</span>
        </button>
      </div>

      <div id="js-tab-events" class="tab-panel">
        ${events.length ? `
          <div class="event-grid event-grid--stagger">
            ${events.map(ev => `
              <div class="event-card">
                <div class="event-card__img-placeholder" style="background:${ev.color}22">${ev.emoji}</div>
                <div class="event-card__body">
                  <span class="event-card__tag">${ev.category}</span>
                  <h3 class="event-card__title">${ev.title}</h3>
                  <div class="event-card__meta">📅 ${ev.date} &nbsp;🕐 ${ev.time}</div>
                  <div class="event-card__meta">📍 ${ev.location}</div>
                  <div class="event-card__footer">
                    <span class="event-card__price ${ev.price === 'Free' ? 'event-card__price--free' : ''}">${ev.price}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : '<p class="listing-empty">No upcoming events right now. Check back soon.</p>'}
      </div>

      <div id="js-tab-promos" class="tab-panel tab-panel--hidden">
        ${promos.length ? `
          <div class="promo-list">
            ${promos.map(pr => `
              <div class="promo-card">
                <div class="promo-card__icon">${pr.emoji}</div>
                <div class="promo-card__body">
                  <span class="promo-card__tag">${pr.tag}</span>
                  <h3 class="promo-card__title">${pr.title}</h3>
                  <p class="promo-card__desc">${pr.description}</p>
                  <p class="promo-card__expires">⏳ ${pr.expires}</p>
                </div>
              </div>
            `).join('')}
          </div>
        ` : '<p class="listing-empty">No active offers right now.</p>'}
      </div>
    </div>
  `;

  document.querySelectorAll('.listing-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.listing-tab').forEach(t => t.classList.remove('listing-tab--active'));
      tab.classList.add('listing-tab--active');
      const target = tab.dataset.tab;
      document.getElementById('js-tab-events').classList.toggle('tab-panel--hidden', target !== 'events');
      document.getElementById('js-tab-promos').classList.toggle('tab-panel--hidden', target !== 'promos');
    });
  });
}

// ── INIT ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('js-event-scroll')) {
    renderFeatured(EVENTS);
    renderEvents(EVENTS);
    renderUpcoming();
    renderEatStrip();
    renderStays();
    renderOffers();
    initChips();
    initDateBar();
    initPersonaliseCTAs();
  }
  if (document.getElementById('js-listing-root')) {
    initListingPage();
  }
});
