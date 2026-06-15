'use strict';

/* global db, loadAllData */

// ── ADMIN CHECK ───────────────────────────────────────────
const SITE_ADMIN_EMAILS = ['lee.renton81@gmail.com', 'adele@whattodogeelong.com.au'];
function isAdminUser() {
  try {
    const acct = JSON.parse(localStorage.getItem('wtdg_account') || 'null');
    return SITE_ADMIN_EMAILS.includes(acct?.email);
  } catch { return false; }
}

// ── ADMIN PRIORITY CONTROLS ───────────────────────────────
// Inject up/down priority arrows on listing cards. Admin-only, invisible to users.
async function injectPriorityControls(tableKey) {
  if (!isAdminUser()) return;
  const cards = document.querySelectorAll(`[data-id][data-type="${tableKey}"]`);
  if (!cards.length) return;

  // Load current priorities from DB (graceful — works even if column not yet migrated)
  const ids = [...cards].map(c => c.dataset.id);
  let prioMap = {};
  try {
    const { data: rows } = await db.from(tableKey === 'business' ? 'businesses' : 'events')
      .select('id, admin_priority').in('id', ids);
    prioMap = Object.fromEntries((rows || []).map(r => [r.id, r.admin_priority || 0]));
  } catch (_) { /* column may not exist yet — controls still render at 0 */ }

  cards.forEach(card => {
    const id = card.dataset.id;
    const prio = prioMap[id] ?? 0;
    if (card.querySelector('.admin-prio')) return; // already injected

    const badge = document.createElement('div');
    badge.className = 'admin-prio';
    badge.innerHTML = `
      <button class="admin-prio__btn" data-dir="up" title="Boost priority">▲</button>
      <span class="admin-prio__val">${prio > 0 ? `+${prio}` : prio < 0 ? `${prio}` : '–'}</span>
      <button class="admin-prio__btn" data-dir="down" title="Lower priority">▼</button>`;

    badge.addEventListener('click', async e => {
      e.preventDefault(); e.stopPropagation();
      const dir = e.target.closest('[data-dir]')?.dataset.dir;
      if (!dir) return;
      const table = tableKey === 'business' ? 'businesses' : 'events';
      const current = parseInt(badge.querySelector('.admin-prio__val').textContent) || 0;
      const next = dir === 'up' ? current + 1 : current - 1;
      const { error } = await db.from(table).update({ admin_priority: next }).eq('id', id);
      if (error) {
        console.error('[priority] update failed:', error.message, { table, id, next });
        badge.style.outline = '2px solid #dc2626';
        setTimeout(() => badge.style.outline = '', 800);
        return;
      }
      // Update in-memory data so re-renders reflect the new priority immediately
      const memArr = tableKey === 'business' ? BUSINESSES : EVENTS;
      const memItem = memArr.find(x => String(x.id) === String(id));
      if (memItem) memItem.adminPriority = next;

      const valEl = badge.querySelector('.admin-prio__val');
      valEl.textContent = next > 0 ? `+${next}` : next < 0 ? `${next}` : '–';
      valEl.style.color = next > 0 ? '#16a34a' : next < 0 ? '#dc2626' : '#6b7280';
      // Flash confirmation
      badge.style.outline = '2px solid #4ac8d0';
      setTimeout(() => badge.style.outline = '', 600);
      // Re-render the relevant section so order updates instantly
      if (tableKey === 'event') {
        // Re-render hero first (updates _heroEventId), then featured pair (excludes hero)
        renderMasonryHero(window._allEvents || EVENTS, ARTICLES, window._hpSettings || {}, window._trendingScores || new Map());
        if (window._currentWeekendEvs) renderFeatured(window._currentWeekendEvs);
        renderUpcoming(window._allEvents || EVENTS);
      }
      if (tableKey === 'business' && typeof renderEatStrip === 'function') {
        renderEatStrip();
      }
    });

    // Colour the initial value
    const valEl = badge.querySelector('.admin-prio__val');
    if (prio > 0) valEl.style.color = '#16a34a';
    else if (prio < 0) valEl.style.color = '#dc2626';

    // Position relative on card so badge can sit top-left
    card.style.position = 'relative';
    card.appendChild(badge);
  });
}

// ── BUSINESSES ────────────────────────────────────────────
let BUSINESSES = [
  // ── CAFES ─────────────────────────────────────────────
  {
    id: 'pistol-pete',
    slug: 'pistol-petes-coffee-geelong-west',
    name: "Pistol Pete's Coffee",
    type: 'Café',
    section: 'eat',
    description: 'Specialty espresso bar and all-day brunch on Pakington Street. Rotating single-origin pour-overs and a seasonal brunch menu that draws a serious coffee crowd.',
    emoji: '☕',
    color: '#f4a261',
    location: '116 Pakington St, Geelong West VIC 3218',
    suburb: 'Geelong West',
    website: 'pistolpetes.com.au',
    lat: -38.1452, lng: 144.3438,
    img: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'dr-morse',
    slug: 'dr-morse-geelong',
    name: 'Dr Morse',
    type: 'Café',
    section: 'eat',
    description: 'Much-loved inner-city café on Little Malop Street. Great espresso, exceptional sourdough toast, and a loyal regular crowd.',
    emoji: '☕',
    color: '#8d6e63',
    location: '77 Little Malop St, Geelong VIC 3220',
    suburb: 'Geelong CBD',
    website: 'drmorse.com.au',
    lat: -38.1464, lng: 144.3588,
    img: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'baba-ganoush',
    slug: 'baba-ganoush-geelong',
    name: 'Baba Ganoush',
    type: 'Café',
    section: 'eat',
    description: 'Middle-Eastern inspired all-day café on Little Ryrie Street. The shakshuka with house-made flatbread has become something of a Geelong institution.',
    emoji: '🫙',
    color: '#ff8f00',
    location: '83 Little Ryrie St, Geelong VIC 3220',
    suburb: 'Geelong CBD',
    website: 'babaganoush.com.au',
    lat: -38.1472, lng: 144.3608,
    img: 'https://images.unsplash.com/photo-1484980859-ea25e15becea?auto=format&fit=crop&w=800&q=80',
  },
  // ── RESTAURANTS ────────────────────────────────────────
  {
    id: 'igni',
    slug: 'igni-restaurant-geelong',
    name: 'Igni',
    type: 'Restaurant',
    section: 'eat',
    description: "Aaron Turner's acclaimed farm-to-fire restaurant in the Geelong CBD. Seasonal Australian produce cooked over open flame — one of the most celebrated dining rooms in regional Victoria.",
    emoji: '🔥',
    color: '#6d4c41',
    location: '53 Little Ryrie St, Geelong VIC 3220',
    suburb: 'Geelong CBD',
    website: 'restaurantigni.com',
    lat: -38.1471, lng: 144.3607,
    img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'the-wharf',
    slug: 'the-wharf-shed-geelong',
    name: 'The Wharf Shed',
    type: 'Restaurant',
    section: 'eat',
    description: 'Waterfront dining on Cunningham Pier. Fresh local seafood, craft beer on tap, and sweeping views across Corio Bay — a Geelong classic.',
    emoji: '⚓',
    color: '#3a86ff',
    location: 'Cunningham Pier, Geelong VIC 3220',
    suburb: 'Geelong CBD',
    website: 'wharfshed.com.au',
    lat: -38.1452, lng: 144.3560,
    img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'humble-rays',
    slug: 'humble-rays-geelong-west',
    name: 'Humble Rays',
    type: 'Restaurant',
    section: 'eat',
    description: 'Neighbourhood restaurant on Pakington Street. Honest, seasonal cooking with a short menu, excellent natural wines, and a room that always feels full of the right energy.',
    emoji: '🍽️',
    color: '#e57373',
    location: '98 Pakington St, Geelong West VIC 3218',
    suburb: 'Geelong West',
    website: 'humblerays.com.au',
    lat: -38.1451, lng: 144.3440,
    img: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'eastern-beach',
    slug: 'eastern-beach-kiosk-geelong',
    name: 'Eastern Beach Kiosk',
    type: 'Café & Kiosk',
    section: 'eat',
    description: 'Iconic waterfront kiosk at Eastern Beach Reserve. Takeaway coffee, fish and chips, soft-serve, and the best bay views in the city. A Geelong institution.',
    emoji: '🌊',
    color: '#4ac8d0',
    location: 'Eastern Beach Reserve, Geelong VIC 3220',
    suburb: 'Geelong',
    website: '',
    lat: -38.1511, lng: 144.3791,
    img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  },
  // ── BARS & PUBS ────────────────────────────────────────
  {
    id: 'little-creatures',
    slug: 'little-creatures-brewing-geelong',
    name: 'Little Creatures Brewing',
    type: 'Bar & Restaurant',
    section: 'eat',
    description: 'Craft brewery and restaurant on the Geelong waterfront. Pale ales brewed on-site, wood-fired pizza, and a sprawling waterfront space that comes alive on a warm afternoon.',
    emoji: '🍺',
    color: '#f59e0b',
    location: '1 Yarra St, Geelong VIC 3220',
    suburb: 'Geelong CBD',
    website: 'littlecreatures.com.au',
    lat: -38.1446, lng: 144.3553,
    img: 'https://images.unsplash.com/photo-1559839914-17aae19cec71?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'barwon-club',
    slug: 'barwon-club-hotel-newtown',
    name: 'The Barwon Club Hotel',
    type: 'Pub',
    section: 'eat',
    description: 'Beloved Pakington Street institution in Newtown. Great front bar, live music most weekends, proper pub food, and a loyal Sunday session crowd that\'s been coming for decades.',
    emoji: '🍻',
    color: '#5c6bc0',
    location: '110 Pakington St, Newtown VIC 3220',
    suburb: 'Newtown',
    website: 'barwonclub.com.au',
    lat: -38.1553, lng: 144.3447,
    img: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&w=800&q=80',
  },
  // ── MARKETS ────────────────────────────────────────────
  {
    id: 'farmers-market',
    slug: 'geelong-farmers-market',
    name: 'Geelong Farmers Market',
    type: 'Market',
    section: 'eat',
    description: 'Every Sunday at Johnstone Park. Connecting Geelong locals with the best regional produce, artisan food, and street vendors from across the Surf Coast and Bellarine.',
    emoji: '🥦',
    color: '#52b788',
    location: 'Johnstone Park, Geelong VIC 3220',
    suburb: 'Geelong CBD',
    website: 'geelongfarmersmarket.com.au',
    lat: -38.1455, lng: 144.3578,
    img: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=800&q=80',
  },
  // ── ARTS & CULTURE ─────────────────────────────────────
  {
    id: 'gpac',
    slug: 'geelong-performing-arts-centre',
    name: 'GPAC',
    type: 'Arts & Culture',
    section: 'do',
    description: "Geelong Performing Arts Centre — the region's premier venue for theatre, dance, opera, comedy, and live performance. World-class programming in the heart of the CBD.",
    emoji: '🎭',
    color: '#e76f51',
    location: '50 Little Malop St, Geelong VIC 3220',
    suburb: 'Geelong CBD',
    website: 'gpac.org.au',
    lat: -38.1463, lng: 144.3591,
    img: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'geelong-art-gallery',
    slug: 'geelong-art-gallery',
    name: 'Geelong Art Gallery',
    type: 'Gallery',
    section: 'do',
    description: "One of Australia's most significant regional galleries with an outstanding collection spanning 140 years. Free entry, excellent touring exhibitions, and a stunning heritage building.",
    emoji: '🖼️',
    color: '#9c27b0',
    location: '55 Little Malop St, Geelong VIC 3220',
    suburb: 'Geelong CBD',
    website: 'geelongartgallery.org.au',
    lat: -38.1464, lng: 144.3592,
    img: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'boom-gallery',
    slug: 'boom-gallery-newtown',
    name: 'Boom Gallery',
    type: 'Gallery',
    section: 'do',
    description: 'Contemporary art gallery on Pakington Street championing regional and emerging Australian artists. Open studios, exhibitions, workshops, and a ceramics studio.',
    emoji: '🏺',
    color: '#9b5de5',
    location: '240 Pakington St, Newtown VIC 3220',
    suburb: 'Newtown',
    website: 'boomgallery.com.au',
    lat: -38.1600, lng: 144.3450,
    img: 'https://images.unsplash.com/photo-1580138955393-e26e89b56a3c?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'national-wool-museum',
    slug: 'national-wool-museum-geelong',
    name: 'National Wool Museum',
    type: 'Museum',
    section: 'do',
    description: "Australia's only dedicated wool museum, housed in a stunning heritage bluestone building. Fascinating exhibits on the industry that built Geelong, plus interactive experiences for families.",
    emoji: '🐑',
    color: '#78909c',
    location: '26 Moorabool St, Geelong VIC 3220',
    suburb: 'Geelong CBD',
    website: 'nwm.vic.gov.au',
    lat: -38.1480, lng: 144.3596,
    img: 'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?auto=format&fit=crop&w=800&q=80',
  },
];

// ── EVENTS ────────────────────────────────────────────────
let EVENTS = [
  {
    id: 1,
    slug: 'geelong-farmers-market',
    businessId: 'farmers-market',
    title: 'Geelong Farmers Market',
    category: 'Markets',
    tags: ['Free', 'Outdoors', 'All Ages', 'Family Friendly'],
    date: 'Sun 8 Jun',
    time: '8am – 1pm',
    location: 'Johnstone Park, Geelong',
    price: 'Free',
    emoji: '🥦',
    color: '#52b788',
    lat: -38.1455, lng: 144.3578,
    featured: true,
  },
  {
    id: 2,
    slug: 'sunday-session-little-creatures-geelong',
    businessId: 'little-creatures',
    title: 'Sunday Session at Little Creatures',
    category: 'Music',
    tags: ['Outdoors', 'All Ages', 'Free'],
    date: 'Sun 8 Jun',
    time: '2pm – 6pm',
    location: 'Little Creatures Brewing, Geelong Waterfront',
    price: 'Free',
    emoji: '🍺',
    color: '#f59e0b',
    lat: -38.1446, lng: 144.3553,
  },
  {
    id: 3,
    slug: 'importance-of-being-earnest-gpac-geelong',
    businessId: 'gpac',
    title: 'Opening Night: The Importance of Being Earnest',
    category: 'Theatre',
    tags: ['Under $50', 'Accessible'],
    date: 'Fri 13 Jun',
    time: '7:30pm',
    location: 'GPAC, 50 Little Malop St, Geelong',
    price: '$45',
    emoji: '🎭',
    color: '#e76f51',
    lat: -38.1463, lng: 144.3591,
  },
  {
    id: 4,
    slug: 'open-studio-ceramic-art-weekend-boom-gallery',
    businessId: 'boom-gallery',
    title: 'Open Studio — Ceramic Art Weekend',
    category: 'Arts & Culture',
    tags: ['Free', 'All Ages', 'Accessible', 'Family Friendly'],
    date: 'Sat 7 Jun',
    time: '11am – 5pm',
    location: 'Boom Gallery, 240 Pakington St, Newtown',
    price: 'Free',
    emoji: '🏺',
    color: '#9b5de5',
    lat: -38.1600, lng: 144.3450,
  },
  {
    id: 5,
    slug: 'latte-art-masterclass-pistol-petes-geelong',
    businessId: 'pistol-pete',
    title: 'Latte Art Masterclass',
    category: 'Food & Drink',
    tags: ['Under $50', 'Bookings Required'],
    date: 'Sat 14 Jun',
    time: '9am – 11am',
    location: "Pistol Pete's Coffee, 116 Pakington St, Geelong West",
    price: '$40',
    emoji: '☕',
    color: '#f4a261',
    lat: -38.1452, lng: 144.3438,
  },
  {
    id: 6,
    slug: 'surf-coast-trail-run-geelong',
    businessId: null,
    title: 'Surf Coast Trail Run',
    category: 'Sport',
    tags: ['Outdoors', 'Under $50'],
    date: 'Sat 7 Jun',
    time: '7am start',
    location: 'Anglesea Heathlands',
    price: '$35',
    emoji: '🏃',
    color: '#3a86ff',
    lat: -38.4065, lng: 144.1891,
  },
  {
    id: 7,
    slug: 'free-family-sunday-geelong-art-gallery',
    businessId: 'geelong-art-gallery',
    title: 'Free Family Sunday — Geelong Art Gallery',
    category: 'Arts & Culture',
    tags: ['Free', 'Family Friendly', 'Accessible', 'All Ages'],
    date: 'Sun 8 Jun',
    time: '10am – 5pm',
    location: 'Geelong Art Gallery, 55 Little Malop St',
    price: 'Free',
    emoji: '🖼️',
    color: '#9c27b0',
    lat: -38.1464, lng: 144.3592,
  },
  {
    id: 8,
    slug: 'wool-tales-school-holiday-program-geelong',
    businessId: 'national-wool-museum',
    title: 'Wool Tales: School Holiday Program',
    category: 'Education',
    tags: ['Family Friendly', 'Under $20', 'Accessible'],
    date: 'Sat 7 Jun',
    time: '10am – 3pm',
    location: 'National Wool Museum, 26 Moorabool St, Geelong',
    price: '$8',
    emoji: '🐑',
    color: '#78909c',
    lat: -38.1480, lng: 144.3596,
  },
  {
    id: 9,
    slug: 'live-music-barwon-ramblers-newtown',
    businessId: 'barwon-club',
    title: 'Live Music: The Barwon Ramblers',
    category: 'Music',
    tags: ['Outdoors', 'All Ages', 'Under $20'],
    date: 'Sat 7 Jun',
    time: '7pm – 10pm',
    location: 'The Barwon Club Hotel, 110 Pakington St, Newtown',
    price: '$10',
    emoji: '🎸',
    color: '#5c6bc0',
    lat: -38.1553, lng: 144.3447,
  },
];

// ── STAYS ─────────────────────────────────────────────────
let STAYS = [
  {
    id: 's1',
    name: 'Novotel Geelong',
    type: 'Hotel',
    location: 'Cnr Gheringhap & Myers St, Geelong VIC 3220',
    lat: -38.1463, lng: 144.3622, suburb: 'Geelong CBD',
    price: '$199',
    stars: '★★★★',
    emoji: '🏨',
    color: '#4ac8d0',
    img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 's2',
    name: 'Quest Geelong Central',
    type: 'Apartment Hotel',
    location: '15 Myers St, Geelong VIC 3220',
    lat: -38.1465, lng: 144.3620, suburb: 'Geelong CBD',
    price: '$159',
    stars: '★★★★',
    emoji: '🏢',
    color: '#9b5de5',
    img: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 's3',
    name: 'Mercure Geelong',
    type: 'Hotel',
    location: '91 Myers St, Geelong VIC 3220',
    lat: -38.1468, lng: 144.3618, suburb: 'Geelong CBD',
    price: '$135',
    stars: '★★★',
    emoji: '🏩',
    color: '#3a86ff',
    img: 'https://images.unsplash.com/photo-1551882547-ff40c599fb3f?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 's4',
    name: 'Surf Coast Retreat',
    type: 'Holiday House',
    location: 'Great Ocean Rd, Torquay VIC 3228',
    lat: -38.3308, lng: 144.3248, suburb: 'Torquay',
    price: '$285',
    stars: '★★★★★',
    emoji: '🏡',
    color: '#52b788',
    img: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 's5',
    name: 'The Bellarine Farmhouse',
    type: 'Holiday House',
    location: 'Drysdale VIC 3222',
    lat: -38.1757, lng: 144.5661, suburb: 'Bellarine',
    price: '$320',
    stars: '★★★★★',
    emoji: '🌿',
    color: '#84a98c',
    img: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 's6',
    name: 'Mantra Southbank Geelong',
    type: 'Apartment Hotel',
    location: '11 Eastern Beach Rd, Geelong VIC 3220',
    lat: -38.1473, lng: 144.3720, suburb: 'Geelong CBD',
    price: '$175',
    stars: '★★★★',
    emoji: '🌊',
    color: '#0077b6',
    img: 'https://images.unsplash.com/photo-1582719508461-905c673536f6?auto=format&fit=crop&w=800&q=80',
  },
];

// ── PROMOS ────────────────────────────────────────────────
let PROMOS = [
  {
    id: 'p1',
    businessId: 'pistol-pete',
    title: 'Buy 4 Coffees, Get 1 Free',
    description: "Every 4th coffee is on us at Pistol Pete's. Show your loyalty card at the counter. Valid Mon–Fri.",
    expires: 'Ongoing',
    emoji: '☕',
    tag: 'Loyalty Deal',
  },
  {
    id: 'p2',
    businessId: 'gpac',
    title: '20% Off Matinee Tickets',
    description: 'Use code MATINEE20 at checkout for any June matinee performance. Valid on selected shows.',
    expires: 'Valid all of June',
    emoji: '🎟️',
    tag: 'Discount',
  },
  {
    id: 'p3',
    businessId: 'little-creatures',
    title: 'Jugs for $22 — Happy Hour Daily',
    description: '$22 jugs of Rogers’ Beer and Pale Ale every day 3pm–5pm. Waterfront views included.',
    expires: 'Ongoing',
    emoji: '🍺',
    tag: 'Happy Hour',
  },
  {
    id: 'p4',
    businessId: 'boom-gallery',
    title: 'Free A3 Print with Any Artwork Purchase',
    description: "Buy any original artwork from Boom Gallery in June and take home a complimentary A3 artist print.",
    expires: 'June only',
    emoji: '🖼️',
    tag: 'Gift with Purchase',
  },
  {
    id: 'p5',
    businessId: 'the-wharf',
    title: 'Half-Price Oysters — Friday Afternoons',
    description: 'Local Portarlington oysters at half price every Friday from 3pm. While stocks last.',
    expires: 'Every Friday',
    emoji: '🦪',
    tag: 'Weekly Special',
  },
  {
    id: 'p6',
    businessId: 'igni',
    title: 'Lunch Tasting Menu — $75pp',
    description: 'The full Igni experience at lunch, five courses for $75 per person. Wednesday to Friday only. Bookings essential.',
    expires: 'Ongoing',
    emoji: '🔥',
    tag: 'Special Menu',
  },
  {
    id: 'p7',
    businessId: 'barwon-club',
    title: '$15 Parma & Pot — Wednesday Nights',
    description: 'The classic done right. Chicken parma and a pot of Vic Bitter every Wednesday from 5pm.',
    expires: 'Every Wednesday',
    emoji: '🍗',
    tag: 'Weekly Special',
  },
];

// ── ARTICLES ──────────────────────────────────────────────
let ARTICLES = [
  {
    id: 'top-5-cafes',
    slug: 'best-cafes-geelong',
    type: 'guide',
    title: 'The Best Cafes in Geelong',
    excerpt: 'From a Japanese cat café on the waterfront to a specialty roaster in the Botanic Gardens — Geelong\'s café scene is quietly one of regional Victoria\'s best.',
    heroImg: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=80',
    publishedAt: '2026-06-02',
    author: 'WTDG Editorial',
    businessIds: [
      'cat-themed-japanese-cafe-neko-geelong-geelong',
      'funk-by-botanical-brew-geelong-west',
      'southamerica-coffee-co-geelong',
      'wym-geelong-botanic-gardens-east-geelong',
      'native-circles-geelong',
    ],
    eventIds: [],
    tags: ['food', 'cafes', 'guide'],
    content: `<p>Geelong's café scene has grown into something genuinely worth seeking out. Independent, character-filled spaces are scattered across the CBD, Geelong West, and out to the waterfront — here are five that stand out.</p>

<h2>1. Neko Geelong — CBD Waterfront</h2>
<p>A Japanese-themed cat café right in the heart of Geelong — friendly resident cats, matcha lattes, Japanese-inspired food, and a vibe unlike anything else in the region. A genuine experience as much as a café. Book ahead online as spots fill quickly, especially on weekends.</p>
<p><a href="/cat-themed-japanese-cafe-neko-geelong-geelong">View listing →</a></p>

<h2>2. Funk by Botanical Brew — Geelong West</h2>
<p>Kombucha, cold brew, and an all-day menu built around wholefoods and seasonal produce — Funk has carved out a loyal following in Geelong West. The space is relaxed and bright, and the food genuinely holds up beyond the health-café category. Great for a long brunch.</p>
<p><a href="/funk-by-botanical-brew-geelong-west">View listing →</a></p>

<h2>3. SouthAmerica Coffee Co — CBD</h2>
<p>Latin-inspired specialty coffee café in the Geelong CBD. Single-origin beans, excellent espresso, and a food menu that goes its own direction — empanadas alongside the smashed avo. A welcome point of difference in the city centre.</p>
<p><a href="/southamerica-coffee-co-geelong">View listing →</a></p>

<h2>4. WYM | Geelong Botanic Gardens — East Geelong</h2>
<p>Tucked inside the grounds of the Geelong Botanic Gardens, WYM is one of the most quietly pleasant café settings in the city. Good coffee, simple food, and access to one of the best public gardens in regional Victoria — make a morning of it.</p>
<p><a href="/wym-geelong-botanic-gardens-east-geelong">View listing →</a></p>

<h2>5. Native Circles — CBD</h2>
<p>A café with an Indigenous-Australian lens — native ingredients woven into the menu, from wattleseed lattes to lemon myrtle baked goods. An interesting and distinctive offering that reflects a side of Geelong culture not often seen in a café context.</p>
<p><a href="/native-circles-geelong">View listing →</a></p>`,
  },
  {
    id: 'top-5-breweries',
    slug: 'best-breweries-geelong',
    type: 'guide',
    title: 'The Best Breweries in Geelong',
    excerpt: 'Geelong and the Bellarine Peninsula have become one of Victoria\'s best craft beer destinations. Here are five breweries worth the visit.',
    heroImg: 'https://images.unsplash.com/photo-1559839914-17aae19cec71?w=1200&q=80',
    publishedAt: '2026-06-05',
    author: 'WTDG Editorial',
    businessIds: [
      'bellarine-brewing-company-south-geelong',
      'great-ocean-road-brewing-south-geelong',
      'white-rabbit-brewery-barrel-hall-geelong-geelong',
      'blackmans-brewery-geelong-grovedale',
      'mt-pleasant-rd-brewers-taproom-bar-belmont',
    ],
    eventIds: [],
    tags: ['drink', 'breweries', 'guide'],
    content: `<p>Geelong's craft beer scene has grown steadily over the past decade. From established names on the waterfront to newer suburban taprooms, there's a genuine brewery trail to explore — here are five to start with.</p>

<h2>1. Bellarine Brewing Company — South Geelong</h2>
<p>A Geelong staple and one of the region's most well-regarded breweries. Bellarine Brewing produces a broad, well-made range — easy-drinking lagers to hoppy IPAs — and the taproom is a great spot to settle in for an afternoon. Regularly updated seasonal releases keep things interesting.</p>
<p><a href="/bellarine-brewing-company-south-geelong">View listing →</a></p>

<h2>2. Great Ocean Road Brewing — South Geelong</h2>
<p>Named for one of the world's great coastal drives that begins just down the road, Great Ocean Road Brewing brings serious craft credentials to the Geelong scene. Their hazy and session ales have built a strong local following, and the taproom is one of the more relaxed drinking spaces in the city.</p>
<p><a href="/great-ocean-road-brewing-south-geelong">View listing →</a></p>

<h2>3. White Rabbit Brewery & Barrel Hall — Geelong</h2>
<p>The iconic White Rabbit Brewery is now at home in Geelong — the Barrel Hall is a remarkable space, with rows of wooden barrels ageing mixed-fermentation ales in a beautifully converted industrial building. Come for the White Ale, stay to explore the barrel-aged range. One of the best brewery experiences in Victoria.</p>
<p><a href="/white-rabbit-brewery-barrel-hall-geelong-geelong">View listing →</a></p>

<h2>4. Blackmans Brewery — Grovedale</h2>
<p>Blackmans started in Torquay and has been a fixture of the Geelong craft beer scene for years. The Grovedale venue offers the full range in a spacious taproom with a great beer garden. The Pale Ale and Hazy IPA are crowd favourites; the seasonal and limited releases are worth keeping an eye on.</p>
<p><a href="/blackmans-brewery-geelong-grovedale">View listing →</a></p>

<h2>5. Mt Pleasant Rd Brewers Taproom + Bar — Belmont</h2>
<p>A neighbourhood taproom in Belmont that punches well above its size. Small-batch brewing with a focus on quality and variety — the kind of local you want in your suburb. Friendly staff, rotating taps, and a genuinely welcoming atmosphere.</p>
<p><a href="/mt-pleasant-rd-brewers-taproom-bar-belmont">View listing →</a></p>`,
  },
  {
    id: 'top-5-wineries',
    slug: 'best-bellarine-wineries',
    type: 'guide',
    title: 'The Best Wineries on the Bellarine Peninsula',
    excerpt: 'Pinot Noir, Chardonnay, and sweeping bay views — the Bellarine Peninsula is one of Victoria\'s most exciting cool-climate wine regions.',
    heroImg: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1200&q=80',
    publishedAt: '2026-05-28',
    author: 'WTDG Editorial',
    businessIds: [
      'oakdene-vineyards-cellar-door-wallington',
      'scotchmans-hill-winery-drysdale',
      'terindah-estate-bellarine',
      'bellarine-estate-bellarine',
      'kilgour-wines-bellarine',
    ],
    eventIds: [],
    tags: ['drink', 'wineries', 'bellarine', 'guide'],
    content: `<p>The Bellarine Peninsula wine region produces cool-climate Pinot Noir and Chardonnay that regularly rival the Yarra Valley and Mornington Peninsula. A 30-minute drive from Geelong CBD opens up a full day of cellar doors, long lunches, and bay views. Here are five to build your visit around.</p>

<h2>1. Oakdene Vineyards — Wallington</h2>
<p>One of the Bellarine's most celebrated estates. Oakdene produces elegant, terroir-driven wines — the Chardonnay and Pinot Noir are consistently excellent — and the cellar door restaurant is one of the best long-lunch destinations in the region. Book well ahead for weekend dining.</p>
<p><a href="/oakdene-vineyards-cellar-door-wallington">View listing →</a></p>

<h2>2. Scotchmans Hill Winery — Drysdale</h2>
<p>A pioneer of the Geelong wine region, established in 1982. Scotchmans Hill makes benchmark Bellarine Pinot Noir and Chardonnay, and the cellar door sits on a beautiful elevated site with views over Swan Bay. The Swan Bay range offers excellent value; the reserve tier wines are among the best in the region.</p>
<p><a href="/scotchmans-hill-winery-drysdale">View listing →</a></p>

<h2>3. Terindah Estate — Bellarine</h2>
<p>Perched on a ridge with some of the most dramatic bay views on the peninsula, Terindah Estate combines well-made estate wines with a stunning cellar door setting. The Chardonnay and rosé are popular choices on a sunny afternoon. Check ahead on weekends as the venue is a popular event and wedding space.</p>
<p><a href="/terindah-estate-bellarine">View listing →</a></p>

<h2>4. Bellarine Estate — Bellarine</h2>
<p>A relaxed, family-friendly cellar door in the heart of the Bellarine. Bellarine Estate keeps things approachable — the wines are easy-drinking and well-priced, and the property is a lovely place to spend a couple of hours. Good option if you're bringing the whole group and want somewhere laid-back.</p>
<p><a href="/bellarine-estate-bellarine">View listing →</a></p>

<h2>5. Kilgour Wines — Bellarine</h2>
<p>A boutique producer making small-batch wines from estate-grown fruit on the Bellarine. The range is tight and focused — this is a winery that knows what it does well and does it carefully. A quieter, more intimate cellar door experience compared to the bigger estates.</p>
<p><a href="/kilgour-wines-bellarine">View listing →</a></p>`,
  },
  {
    id: 'top-5-parks',
    slug: 'best-parks-outdoor-spaces-geelong',
    type: 'guide',
    title: 'Geelong\'s Best Parks and Outdoor Spaces',
    excerpt: 'Eastern Beach, Balyang Sanctuary, Buckley Falls and more — the green spaces that make Geelong one of Victoria\'s most liveable cities.',
    heroImg: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1200&q=80',
    publishedAt: '2026-05-20',
    author: 'WTDG Editorial',
    businessIds: [
      'eastern-beach-reserve-geelong',
      'balyang-sanctuary-newtown',
      'buckley-falls-park-highton',
      'eastern-park-east-geelong',
      'steampacket-gardens-geelong',
    ],
    eventIds: [],
    tags: ['outdoors', 'parks', 'nature', 'guide'],
    content: `<p>Geelong is unusually well-served with accessible green space — parks, reserves, and waterfront gardens spread right across the city. Here are five of the best, whether you're after a morning walk, a family afternoon, or somewhere to watch the sunset.</p>

<h2>1. Eastern Beach Reserve — Geelong Waterfront</h2>
<p>The city's most-loved public space. The 1931 art deco swimming enclosure, grassy foreshore, waterfront promenade, and iconic bollard sculptures make Eastern Beach the natural starting point for any Geelong visit. Walk east to the Botanic Gardens or west toward Steampacket Gardens — it's all good.</p>
<p><a href="/eastern-beach-reserve-geelong">View listing →</a></p>

<h2>2. Balyang Sanctuary — Newtown</h2>
<p>A hidden gem on the banks of the Barwon River in Newtown. Balyang is a small wildlife sanctuary with free-roaming peacocks, waterfowl, and beautiful river walks. It's the kind of place Geelong locals have known about for years and visitors consistently discover and love. Free entry, dogs on lead welcome.</p>
<p><a href="/balyang-sanctuary-newtown">View listing →</a></p>

<h2>3. Buckley Falls Park — Highton</h2>
<p>Follows the Barwon River through one of Geelong's most scenic natural corridors. The falls themselves are a dramatic sight after rain, and the surrounding park offers excellent walking tracks through native bush. A genuine slice of natural Geelong just minutes from the CBD.</p>
<p><a href="/buckley-falls-park-highton">View listing →</a></p>

<h2>4. Eastern Park — East Geelong</h2>
<p>Adjacent to the Botanic Gardens and one of Geelong's oldest parklands. Eastern Park is a broad, relaxed space — perfect for a picnic, a morning run, or just sitting in the sun. The rose garden and heritage plantings are worth a slow walk through.</p>
<p><a href="/eastern-park-east-geelong">View listing →</a></p>

<h2>5. Steampacket Gardens — Geelong Waterfront</h2>
<p>A beautifully maintained waterfront park right in the heart of Geelong. Steampacket Gardens hosts many of the city's major outdoor events — concerts, markets, festivals — but on an ordinary day it's simply a great place to sit by the water. The lawns slope gently toward Corio Bay; bring a rug and a bottle of something cold.</p>
<p><a href="/steampacket-gardens-geelong">View listing →</a></p>`,
  },
  {
    id: 'waterfront-guide',
    slug: 'geelong-waterfront-guide',
    type: 'guide',
    title: 'The Ultimate Geelong Waterfront Guide',
    excerpt: 'Stretching from Rippleside to St Helens, the Geelong waterfront is the city\'s beating heart — here\'s how to do it from dawn to after dark.',
    heroImg: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80',
    publishedAt: '2026-05-28',
    author: 'WTDG Editorial',
    businessIds: [
      'eastern-beach-reserve-geelong',
      'steampacket-gardens-geelong',
      'little-creatures-brewery-geelong-geelong',
      'geelong-waterfront-geelong',
    ],
    eventIds: [],
    tags: ['waterfront', 'guide', 'outdoors'],
    content: `<p>Geelong's waterfront is one of the most enjoyable urban waterfronts in Victoria — and most visitors only scratch the surface. Here's how to do it properly, from morning coffee to sunset.</p>

<h2>Morning: Eastern Beach</h2>
<p>Start at <a href="/eastern-beach-reserve-geelong">Eastern Beach Reserve</a>, where the 1930s art deco swimming enclosure creates one of the prettiest beach settings in regional Victoria. Watch the bay wake up, take a swim if the weather's right, and walk the promenade east toward the Botanic Gardens.</p>

<h2>Midday: Steampacket Gardens & the Pier</h2>
<p>Head toward <a href="/steampacket-gardens-geelong">Steampacket Gardens</a> and the Cunningham Pier precinct. This stretch of the waterfront has restaurants, cafes, and some of the best water views in the city — grab lunch here and watch the ferry traffic on the bay.</p>

<h2>Afternoon: Little Creatures</h2>
<p>Walk or ride north to Yarra Street Pier, home to <a href="/little-creatures-brewery-geelong-geelong">Little Creatures Brewery</a> — one of the best brewery settings in the state. The copper brewing tanks, wood-fired pizza, and waterfront terrace make it an easy place to spend an afternoon.</p>

<h2>Evening: Sunset at the Western Waterfront</h2>
<p>The western end of the <a href="/geelong-waterfront-geelong">Geelong Waterfront</a> faces directly into the sunset over the Bellarine Peninsula. Find a spot on the grass, watch the light change across Corio Bay, and consider that there are far worse ways to spend an evening.</p>`,
  },
  {
    id: 'weekend-itinerary',
    slug: 'perfect-48-hours-in-geelong',
    type: 'guide',
    title: 'The Perfect 48 Hours in Geelong',
    excerpt: 'First time visiting? Our two-day itinerary covers the waterfront, a Bellarine winery, Geelong\'s best galleries, and a morning on the Surf Coast.',
    heroImg: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=80',
    publishedAt: '2026-06-01',
    author: 'WTDG Editorial',
    businessIds: [
      'eastern-beach-reserve-geelong',
      'little-creatures-brewery-geelong-geelong',
      'geelong-gallery-geelong',
      'oakdene-vineyards-cellar-door-wallington',
    ],
    eventIds: [],
    tags: ['guide', 'itinerary', 'weekend'],
    content: `<p>Geelong is 75 minutes from Melbourne by train and has more than earned its status as a destination in its own right. Here's how to spend 48 hours well.</p>

<h2>Saturday Morning</h2>
<p>Start at <a href="/eastern-beach-reserve-geelong">Eastern Beach Reserve</a> — take a morning swim in the art deco enclosure if conditions allow, then walk the promenade toward the CBD. Grab breakfast or coffee along the waterfront before heading into town.</p>

<h2>Saturday Afternoon</h2>
<p>Visit the <a href="/geelong-gallery-geelong">Geelong Gallery</a> — the permanent collection includes significant works of Australian art and there's almost always a strong temporary exhibition. Then head to Yarra Street Pier for an afternoon session at <a href="/little-creatures-brewery-geelong-geelong">Little Creatures Brewery</a>.</p>

<h2>Saturday Evening</h2>
<p>Dinner in the CBD or on Pakington Street in Geelong West — check the WTDG eat listings for what's current. Check the Geelong Arts Centre program for evening shows.</p>

<h2>Sunday: Bellarine Day Trip</h2>
<p>Drive out to the Bellarine Peninsula — 30 minutes from the CBD. <a href="/oakdene-vineyards-cellar-door-wallington">Oakdene Vineyards</a> is one of the best long-lunch destinations in the region; book ahead. On the way back, stop at one of the Bellarine's smaller cellar doors or drive down to Queenscliff for a look at the bay from the other side.</p>`,
  },
];

// ── HELPERS ───────────────────────────────────────────────
function getBusinessById(id) {
  return BUSINESSES.find(b => b.id === id) || null;
}
function getBusinessBySlug(slug) {
  return BUSINESSES.find(b => b.slug === slug) || null;
}
function getEventBySlug(slug) {
  return EVENTS.find(e => e.slug === slug) || null;
}
function getArticleBySlug(slug) {
  return ARTICLES.find(a => a.slug === slug || a.id === slug) || null;
}

// ── LINK BUILDERS (slug-based URLs) ───────────────────────
function bizLink(biz) {
  const s = biz.slug || slugify(biz.name + '-' + (biz.suburb || ''));
  return IS_LOCAL ? `listing.html?s=${s}` : `/${s}`;
}
function evLink(ev) {
  const eSlug = ev.slug || slugify(ev.title);
  if (ev.businessId) {
    const biz = getBusinessById(ev.businessId);
    const bSlug = biz ? (biz.slug || slugify(biz.name + '-' + (biz.suburb || ''))) : '';
    if (bSlug) return IS_LOCAL ? `event.html?b=${bSlug}&s=${eSlug}` : `/${bSlug}/${eSlug}`;
  }
  return IS_LOCAL ? `event.html?s=${eSlug}` : `/events/${eSlug}`;
}
function artLink(art) {
  const s = art.slug || art.id;
  return IS_LOCAL ? `article.html?s=${s}` : `/news/${s}`;
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

function getArticleById(id) {
  return ARTICLES.find(a => a.id === id) || null;
}

function getArticlesForBusiness(bizId) {
  return ARTICLES.filter(a => a.businessIds && a.businessIds.includes(bizId));
}

function getArticlesForEvent(eventId) {
  return ARTICLES.filter(a => a.eventIds && a.eventIds.includes(eventId));
}

function formatArticleDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return iso; }
}

function articleTypeBadge(type) {
  const map = { guide: { label: 'Guide', icon: 'menu_book', color: '#4ac8d0' }, news: { label: 'News', icon: 'newspaper', color: '#f4a261' }, history: { label: 'What Was Geelong', icon: 'history_edu', color: '#9b5de5' } };
  const t = map[type] || map.guide;
  return `<span class="art-badge" style="--badge-color:${t.color}"><span class="material-symbols-rounded">${t.icon}</span>${t.label}</span>`;
}

// ── RENDER FEATURED EVENT ─────────────────────────────────
// ── MASONRY HERO ──────────────────────────────────────────
function renderMasonryHero(events, articles, settings, trendingScores) {
  const section = document.getElementById('js-masonry-hero');
  if (!section) return;

  // Hide if admin toggled off
  if (settings.showMasonry === false) { section.style.display = 'none'; return; }

  // Pick top event (with image): admin_priority first, trending score as fallback
  function topTrendingEvent(exclude) {
    const scored = events
      .filter(e => e.img && !exclude.includes(e.id))
      .map(e => ({ e, prio: e.adminPriority || 0, score: (trendingScores.get ? (trendingScores.get(`event:${e.id}`) || {}).score || 0 : 0) }))
      .sort((a, b) => b.prio - a.prio || b.score - a.score);
    return scored[0]?.e || null;
  }

  // Pick top trending article (with image)
  function topTrendingArticle() {
    const scored = articles
      .filter(a => a.heroImg)
      .map(a => ({ a, score: (trendingScores.get ? (trendingScores.get(`article:${a.id}`) || {}).score || 0 : 0) }))
      .sort((a, b) => b.score - a.score);
    return scored[0]?.a || articles.find(a => a.heroImg) || null;
  }

  const mainEv  = topTrendingEvent([]);
  const article = topTrendingArticle();
  const btmEv   = topTrendingEvent(mainEv ? [mainEv.id] : []);

  // Track hero event so featured pair can exclude it
  window._heroEventId = mainEv?.id ?? null;

  // Need at least the main event with an image
  if (!mainEv) { section.style.display = 'none'; return; }

  // Populate main (left)
  const mainEl  = document.getElementById('js-mh-main');
  const mainImg = document.getElementById('js-mh-main-img');
  mainEl.href = evLink(mainEv);
  mainImg.src = mainEv.img;
  mainImg.alt = mainEv.title;
  document.getElementById('js-mh-main-badge').textContent = mainEv.category || 'Event';
  document.getElementById('js-mh-main-title').textContent = mainEv.title;
  document.getElementById('js-mh-main-sub').textContent =
    [mainEv.date, mainEv.location].filter(Boolean).join(' · ');

  // Populate top-right (article or fallback event)
  const topEl  = document.getElementById('js-mh-top');
  const topImg = document.getElementById('js-mh-top-img');
  if (article) {
    topEl.href = artLink(article);
    topImg.src = article.heroImg;
    topImg.alt = article.title;
    document.getElementById('js-mh-top-badge').textContent = article.type || 'Article';
    document.getElementById('js-mh-top-badge').classList.add('masonry-hero__badge--article');
    document.getElementById('js-mh-top-title').textContent = article.title;
  } else if (btmEv) {
    topEl.href = evLink(btmEv);
    topImg.src = btmEv.img;
    topImg.alt = btmEv.title;
    document.getElementById('js-mh-top-badge').textContent = btmEv.category || 'Event';
    document.getElementById('js-mh-top-title').textContent = btmEv.title;
  }

  // Populate bottom-right — random business, sticky for 1 hour
  // (pref-matched if prefs set, otherwise any business with image)
  const btmEl  = document.getElementById('js-mh-btm');
  const btmImg = document.getElementById('js-mh-btm-img');
  const prefs  = getPrefs();
  const bizPool = BUSINESSES.filter(b => b.img);
  const prefMatched = prefs.interests?.length
    ? bizPool.filter(b => prefsMatchCard(b, prefs))
    : [];
  const btmBizPool = prefMatched.length ? prefMatched : bizPool;

  // Sticky: reuse cached pick for 1 hour
  const HERO_BIZ_TTL = 60 * 60 * 1000; // 1 hour
  let btmBiz = null;
  try {
    const cached = JSON.parse(localStorage.getItem('wtdg_hero_biz') || 'null');
    if (cached && (Date.now() - cached.ts) < HERO_BIZ_TTL) {
      btmBiz = btmBizPool.find(b => b.id === cached.id) || null;
    }
  } catch (_) {}
  if (!btmBiz) {
    btmBiz = btmBizPool[Math.floor(Math.random() * btmBizPool.length)] || null;
    try { localStorage.setItem('wtdg_hero_biz', JSON.stringify({ id: btmBiz?.id, ts: Date.now() })); } catch (_) {}
  }

  if (btmBiz) {
    btmEl.href = bizLink(btmBiz);
    btmImg.src = btmBiz.img;
    btmImg.alt = btmBiz.name;
    document.getElementById('js-mh-btm-badge').textContent = btmBiz.type || 'Place';
    document.getElementById('js-mh-btm-title').textContent = btmBiz.name;
  }

  // Cache hero image for instant display on next visit
  try {
    const heroCache = { img: mainEv.img, title: mainEv.title, ts: Date.now() };
    localStorage.setItem('wtdg_hero_cache', JSON.stringify(heroCache));
  } catch(e) {}

  // Hide skeleton, reveal real hero
  const skel = document.getElementById('js-hero-skeleton');
  if (skel) skel.style.display = 'none';
  section.style.display = 'block';
}

// IDs of the 2 weekend featured events — used by renderUpcoming to exclude them
let _weekendFeaturedIds = [];

function renderFeatured(events) {
  const el = document.getElementById('js-featured-event');
  if (!el) return;

  // Pick up to 2 events: admin_priority first, then featured flag as tiebreaker
  // Exclude whatever is already shown in the masonry hero
  const picks = [...events]
    .filter(e => e.id !== window._heroEventId)
    .sort((a, b) => {
      const ap = (b.adminPriority || 0) - (a.adminPriority || 0);
      if (ap !== 0) return ap;
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    })
    .slice(0, 2);

  if (!picks.length) { el.innerHTML = ''; _weekendFeaturedIds = []; return; }

  _weekendFeaturedIds = picks.map(e => e.id);

  function featCard(ev) {
    const biz     = ev.businessId ? getBusinessById(ev.businessId) : null;
    const featImg = ev.heroImg || ev.img || biz?.img || null;
    const brand   = ev.source ? ({ 'afl-cats': { bg: '#001F5B', accent: '#C49A2B', logo: '🏉' }, 'nbl-united': { bg: '#002B5C', accent: '#63B3ED', logo: '🏀' } })[ev.source] : null;

    const imgEl = brand
      ? `<div class="featured-card__img featured-card__img--sport" style="background:${brand.bg}">
           <span style="font-size:2.8rem">${brand.logo}</span>
         </div>`
      : featImg
        ? `<div class="featured-card__img featured-card__img--photo" style="background-image:url('${featImg}')"></div>`
        : `<div class="featured-card__img" style="background:${ev.color}22">${ev.emoji}</div>`;

    const borderStyle = brand ? `border-top:3px solid ${brand.accent}` : '';

    return `
      <a href="${evLink(ev)}" class="featured-card" style="${borderStyle}" data-id="${ev.id}" data-type="event">
        ${imgEl}
        <div class="featured-card__body">
          <span class="featured-card__cat">${ev.category}</span>
          <h3 class="featured-card__title">${ev.title}</h3>
          <div class="featured-card__meta">
            <span>📅 ${ev.date}</span>
            ${ev.time ? `<span>🕐 ${ev.time}</span>` : ''}
            <span>📍 ${ev.location}</span>
          </div>
          <div class="featured-card__footer">
            <span class="featured-card__price ${ev.price === 'Free' ? 'featured-card__price--free' : ''}">${(ev.price || '').replace(/[,\s]+$/, '') || 'See event'}</span>
            <span class="btn btn--teal btn--sm" style="margin-left:auto">View →</span>
          </div>
        </div>
      </a>`;
  }

  // Remove skeleton, inject real cards
  const skel = document.getElementById('js-featured-skeleton');
  if (skel) skel.remove();

  el.innerHTML = picks.length === 1
    ? featCard(picks[0])
    : `<div class="featured-pair">${picks.map(featCard).join('')}</div>`;
  injectPriorityControls('event');
}

// ── RENDER EVENT SCROLL STRIP ─────────────────────────────
function renderEvents(events) {
  const scroll = document.getElementById('js-event-scroll');
  if (!scroll) return;

  const featuredId = (events.find(e => e.featured) || events[0])?.id;
  const rest = events.filter(e => e.id !== featuredId);

  const _prefs = getPrefs();
  scroll.innerHTML = rest.map(ev => {
    const isFree    = ev.price === 'Free';
    const isMatch   = prefsMatchCard(ev, _prefs);
    const tagPills  = (ev.tags || []).slice(0, 2).map(t =>
      `<span class="ev-tag ${t === 'Free' ? 'ev-tag--free' : ''}">${t}</span>`
    ).join('');
    const thumb = ev.img
      ? `<img class="event-card__thumb-img" src="${ev.img}" alt="${ev.title}" loading="lazy" />`
      : `<div class="event-card__thumb" style="background:${ev.color||'#e8f4ff'}22">${ev.emoji||'📅'}</div>`;
    const latAttr = (ev.lat && ev.lng) ? ` data-lat="${ev.lat}" data-lng="${ev.lng}"` : '';
    return `
      <a href="${evLink(ev)}" class="event-card${isMatch ? ' event-card--match' : ''}"${latAttr}>
        ${thumb}
        <div class="event-card__body">
          <div class="ev-card__cat-row">
            <span class="event-card__cat">${ev.category}</span>
            ${isMatch ? `<span class="ev-card__match">✦ Your vibe</span>` : ''}
          </div>
          <h3 class="event-card__title">${ev.title}</h3>
          <div class="event-card__meta">📍 ${ev.location}</div>
          <div class="event-card__meta">🕐 ${ev.time || 'See event'}</div>
          ${tagPills ? `<div class="ev-tags">${tagPills}</div>` : ''}
          <button class="event-card__cta ${isFree ? 'event-card__cta--free' : ''}">${isFree ? 'Free Entry' : 'Get Tickets →'}</button>
        </div>
      </a>
    `;
  }).join('');
  if (window.wtdgLocation) window.wtdgLocation.refreshDistanceBadges();
}

// ── RENDER UPCOMING LIST ──────────────────────────────────
// Parse a freeform event date string → Date object (or null if unparseable)
// Handles: "Sun 15 Jun", "Sat 28 – Sun 29 Jun", "Daily Jun 14–22", "Daily until Jul 6"
function parseEventDate(str) {
  if (!str) return null;
  // Strip leading day-of-week prefix e.g. "Fri 12 Jun", "Friday 12 June"
  str = str.replace(/^(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Mon|Tue|Wed|Thu|Fri|Sat|Sun)[,\s]+/i, '');
  const MONTHS = { jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11,
    january:0,february:1,march:2,april:3,june:5,july:6,august:7,september:8,october:9,november:10,december:11 };
  // Try ISO date first: YYYY-MM-DD
  const iso = str.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(parseInt(iso[1]), parseInt(iso[2])-1, parseInt(iso[3]));
  // Try "day month [year]" or "month day [year]" — handles full and short month names
  const m = str.match(/(\d{1,2})\s+([A-Za-z]+)(?:\s+(\d{4}))?|([A-Za-z]+)\s+(\d{1,2})(?:[,\s]+(\d{4}))?/);
  if (!m) return null;
  const day    = parseInt(m[1] || m[5]);
  const monStr = (m[2] || m[4]).toLowerCase();
  const month  = MONTHS[monStr] ?? MONTHS[monStr.slice(0,3)];
  if (month === undefined) return null;
  const now  = new Date();
  const year = m[3] ? parseInt(m[3]) : m[6] ? parseInt(m[6]) : now.getFullYear();
  const d    = new Date(year, month, day);
  // If no year specified and date is more than 2 weeks in the past, assume next year
  if (!m[3] && !m[6] && d < new Date(now - 14 * 864e5)) d.setFullYear(year + 1);
  return d;
}

// ── EVENT URGENCY ─────────────────────────────────────────
function getEventUrgency(ev) {
  const d = parseEventDate(ev.date);
  if (!d) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const diff = Math.round((d - today) / 86400000);
  if (diff < 0)  return 'past';
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  if (diff === 2) return 'soon';
  return null;
}

// ── EVENT GRID CARD (events page + sections) ───────────────
// Sport source → branding map
const SPORT_BRANDS = {
  'afl-cats':   { label: 'Geelong Cats',   bg: '#001F5B', text: '#fff',    accent: '#C49A2B', logo: '🏉' },
  'nbl-united': { label: 'Geelong United', bg: '#002B5C', text: '#fff',    accent: '#63B3ED', logo: '🏀' },
};

function eventGridCard(ev, opts = {}) {
  const urgency   = getEventUrgency(ev);
  const isPast    = urgency === 'past';
  if (isPast && !opts.showPast) return '';

  const urgencyBadge = {
    today:    `<span class="ev-urgency ev-urgency--today"><span class="ev-urgency__dot"></span>Today</span>`,
    tomorrow: `<span class="ev-urgency ev-urgency--tomorrow">Tomorrow</span>`,
    soon:     `<span class="ev-urgency ev-urgency--soon">In 2 days</span>`,
    past:     `<span class="ev-urgency ev-urgency--past">Past</span>`,
  }[urgency] || '';

  const brand = ev.source ? SPORT_BRANDS[ev.source] : null;

  const thumb = brand
    ? `<div class="ev-card__img ev-card__img--sport" style="background:${brand.bg}">
         <span class="ev-card__sport-logo">${brand.logo}</span>
         <span class="ev-card__sport-label" style="color:${brand.accent}">${brand.label}</span>
       </div>`
    : ev.img
      ? `<div class="ev-card__img" style="background-image:url('${ev.img}')"></div>`
      : `<div class="ev-card__img ev-card__img--emoji" style="background:${ev.color || '#e8f4ff'}22">${ev.emoji || '📅'}</div>`;

  const cardStyle = brand
    ? `border-top:3px solid ${brand.accent}`
    : opts.accentColor ? `border-left:3px solid ${opts.accentColor}` : '';
  const latAttr = (ev.lat && ev.lng) ? ` data-lat="${ev.lat}" data-lng="${ev.lng}"` : '';

  const prefs   = getPrefs();
  const isMatch = !isPast && prefsMatchCard(ev, prefs);
  const matchBadge = isMatch ? `<span class="ev-card__match">✦ Your vibe</span>` : '';

  const homeTag = brand && ev.tags?.includes('Home Game')
    ? `<span class="ev-card__tag ev-card__tag--home">🏠 Home</span>`
    : '';

  return `
    <a href="${evLink(ev)}" class="ev-card${isPast ? ' ev-card--past' : ''}${opts.compact ? ' ev-card--compact' : ''}${isMatch ? ' ev-card--match' : ''}${brand ? ' ev-card--sport' : ''}" style="${cardStyle}"${latAttr} data-id="${ev.id}" data-type="event">
      ${urgencyBadge}
      ${thumb}
      <div class="ev-card__body">
        <div class="ev-card__cat-row">
          <span class="ev-card__cat">${ev.category}</span>
          ${matchBadge}
          ${homeTag}
        </div>
        <h3 class="ev-card__title">${ev.title}</h3>
        <div class="ev-card__meta"><span class="material-symbols-rounded">location_on</span>${ev.location}</div>
        <div class="ev-card__meta"><span class="material-symbols-rounded">schedule</span>${ev.date}${ev.time ? ' · ' + ev.time : ''}</div>
        <div class="ev-card__foot">
          <span class="ev-card__price${ev.price === 'Free' ? ' ev-card__price--free' : ''}">${ev.price || 'See event'}</span>
          ${!brand && ev.tags?.length ? ev.tags.slice(0, 2).map(t => `<span class="ev-card__tag">${t}</span>`).join('') : ''}
        </div>
      </div>
    </a>`;
}

// ── HAPPENING TODAY STRIP ──────────────────────────────────
function renderHappeningToday() {
  const el = document.getElementById('js-happening-today');
  if (!el) return;
  const today = new Date(); today.setHours(0,0,0,0);
  const todayEvs = EVENTS.filter(ev => {
    const d = parseEventDate(ev.date);
    return d && d.getTime() === today.getTime();
  });
  if (!todayEvs.length) { el.hidden = true; return; }
  el.hidden = false;
  el.innerHTML = `
    <div class="happening-today">
      <div class="container">
        <div class="happening-today__hdr">
          <span class="happening-today__dot"></span>
          <h2 class="happening-today__title">Happening Today</h2>
          <span class="happening-today__count">${todayEvs.length} event${todayEvs.length > 1 ? 's' : ''}</span>
        </div>
        <div class="happening-today__scroll">
          ${todayEvs.map(ev => `
            <a href="${evLink(ev)}" class="today-card">
              <div class="today-card__img${ev.img ? '' : ' today-card__img--emoji'}" style="${ev.img ? `background-image:url('${ev.img}')` : `background:${ev.color || '#4ac8d0'}22`}">${ev.img ? '' : (ev.emoji || '📅')}</div>
              <div class="today-card__body">
                <span class="today-card__cat">${ev.category}</span>
                <h4 class="today-card__title">${ev.title}</h4>
                <p class="today-card__time">${ev.time || 'All day'}</p>
                <p class="today-card__loc">${ev.location}</p>
              </div>
            </a>
          `).join('')}
        </div>
      </div>
    </div>`;
}

// ── EVENTS MINI CALENDAR (range picker) ───────────────────
function initEventCalendar(onRangeSelect, initialRange = null) {
  const el = document.getElementById('js-events-calendar');
  if (!el) return;

  const now = new Date();
  let viewYear  = initialRange ? initialRange.start.getFullYear() : now.getFullYear();
  let viewMonth = initialRange ? initialRange.start.getMonth()    : now.getMonth();
  let rangeStart = initialRange ? initialRange.start : null;
  let rangeEnd   = initialRange ? initialRange.end   : null;
  let pickingEnd = false;

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const DAYS = ['Mo','Tu','We','Th','Fr','Sa','Su'];

  // Build a Set of "YYYY-M-D" strings that have events
  const eventDays = new Set(EVENTS.map(ev => {
    const d = parseEventDate(ev.date);
    return d ? `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` : null;
  }).filter(Boolean));

  function rangeLabel() {
    if (!rangeStart) return null;
    const sM = MONTHS_SHORT[rangeStart.getMonth()];
    if (!rangeEnd || rangeEnd.getTime() === rangeStart.getTime())
      return `${rangeStart.getDate()} ${sM}`;
    const eM = MONTHS_SHORT[rangeEnd.getMonth()];
    return sM === eM
      ? `${rangeStart.getDate()}–${rangeEnd.getDate()} ${sM}`
      : `${rangeStart.getDate()} ${sM} – ${rangeEnd.getDate()} ${eM}`;
  }

  function fireCallback() {
    if (!rangeStart) { onRangeSelect(null); return; }
    const end = rangeEnd || rangeStart;
    onRangeSelect({ start: rangeStart, end });
  }

  function render() {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay  = new Date(viewYear, viewMonth + 1, 0);
    const startDow = (firstDay.getDay() + 6) % 7;
    const today = new Date(); today.setHours(0,0,0,0);

    const startMs = rangeStart ? rangeStart.getTime() : null;
    const endMs   = rangeEnd   ? rangeEnd.getTime()   : startMs; // treat single as zero-width range

    let cells = '';
    for (let i = 0; i < startDow; i++) cells += `<div class="ecal__cell ecal__cell--empty"></div>`;
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const key  = `${viewYear}-${viewMonth}-${d}`;
      const dt   = new Date(viewYear, viewMonth, d);
      const ms   = dt.getTime();
      const isToday   = ms === today.getTime();
      const isStart   = startMs !== null && ms === startMs;
      const isEnd     = endMs   !== null && ms === endMs && rangeEnd !== null;
      const inRange   = startMs !== null && endMs !== null && ms > startMs && ms < endMs;
      const hasEvs    = eventDays.has(key);

      let cls = 'ecal__cell';
      if (isStart && isEnd)  cls += ' ecal__cell--range-start ecal__cell--range-end ecal__cell--single';
      else if (isStart)      cls += ' ecal__cell--range-start';
      else if (isEnd)        cls += ' ecal__cell--range-end';
      else if (inRange)      cls += ' ecal__cell--in-range';
      else if (isToday)      cls += ' ecal__cell--today';
      if (hasEvs)            cls += ' ecal__cell--has-events';

      cells += `<button class="${cls}" data-date="${viewYear}-${viewMonth + 1}-${d}">${d}${hasEvs ? '<span class="ecal__dot"></span>' : ''}</button>`;
    }

    const label = rangeLabel();
    el.innerHTML = `
      <div class="ecal">
        <div class="ecal__nav">
          <button class="ecal__nav-btn" id="js-ecal-prev"><span class="material-symbols-rounded">chevron_left</span></button>
          <span class="ecal__month">${MONTHS[viewMonth]} ${viewYear}</span>
          <button class="ecal__nav-btn" id="js-ecal-next"><span class="material-symbols-rounded">chevron_right</span></button>
          ${label ? `<button class="ecal__clear" id="js-ecal-clear">Clear</button>` : ''}
        </div>
        <div class="ecal__grid">
          ${DAYS.map(d => `<div class="ecal__dow">${d}</div>`).join('')}
          ${cells}
        </div>
        ${pickingEnd ? '<p class="ecal__hint">Tap an end date</p>' : ''}
      </div>`;

    el.querySelector('#js-ecal-prev')?.addEventListener('click', () => {
      viewMonth--; if (viewMonth < 0) { viewMonth = 11; viewYear--; } render();
    });
    el.querySelector('#js-ecal-next')?.addEventListener('click', () => {
      viewMonth++; if (viewMonth > 11) { viewMonth = 0; viewYear++; } render();
    });
    el.querySelector('#js-ecal-clear')?.addEventListener('click', () => {
      rangeStart = null; rangeEnd = null; pickingEnd = false;
      render(); onRangeSelect(null);
    });
    el.querySelectorAll('.ecal__cell[data-date]').forEach(btn => {
      btn.addEventListener('click', () => {
        const [y, m, d] = btn.dataset.date.split('-').map(Number);
        const clicked = new Date(y, m - 1, d);
        clicked.setHours(0,0,0,0);

        if (!pickingEnd) {
          // First tap — set start, wait for end
          rangeStart = clicked;
          rangeEnd   = null;
          pickingEnd = true;
        } else {
          // Second tap — set end (swap if before start)
          if (clicked.getTime() < rangeStart.getTime()) {
            rangeEnd   = rangeStart;
            rangeStart = clicked;
          } else {
            rangeEnd = clicked;
          }
          pickingEnd = false;
        }
        render();
        fireCallback();
      });
    });
  }

  render();
}

function renderUpcoming(events) {
  const list = document.getElementById('js-upcoming-list');
  if (!list) return;

  const source = events || EVENTS;
  const now    = new Date(); now.setHours(0,0,0,0);
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // Exclude the 2 weekend featured events already shown above
  const excludeIds = new Set(_weekendFeaturedIds.map(String));

  // All upcoming events, sorted chronologically, excluding the featured pair
  const parsed = source
    .map(ev => ({ ev, d: parseEventDate(ev.date) }))
    .filter(({ ev, d }) => d && d >= now && !excludeIds.has(String(ev.id)))
    .sort((a, b) => a.d - b.d)
    .slice(0, 5);

  if (!parsed.length) {
    list.innerHTML = '<p style="color:#999;padding:.5rem 0;font-size:.9rem">No upcoming events found.</p>';
    return;
  }

  list.innerHTML = parsed.map(({ ev, d }) => {
    const isFree = ev.price === 'Free';
    const teal   = isFree; // teal date block for free events (matches original design)
    return `
      <a href="${evLink(ev)}" class="upcoming-item" data-id="${ev.id}" data-type="event">
        <div class="upcoming-item__date ${teal ? 'upcoming-item__date--teal' : ''}">
          <span class="upcoming-item__day">${d.getDate()}</span>
          <span class="upcoming-item__mon">${MONTHS[d.getMonth()]}</span>
        </div>
        <div class="upcoming-item__body">
          <span class="upcoming-item__cat">${ev.category}</span>
          <span class="upcoming-item__title">${ev.title}</span>
          <span class="upcoming-item__sub">📍 ${ev.location}</span>
          <span class="upcoming-item__ticket">🎟 ${ev.price}</span>
        </div>
      </a>
    `;
  }).join('');
  injectPriorityControls('event');
}

// ── RENDER PROMOTED EVENTS STRIP ─────────────────────────
function renderPromotedEvents(events) {
  const strip   = document.getElementById('js-promoted-strip');
  const section = document.getElementById('js-promoted-section');
  if (!strip || !section) return;

  const promoted = events.filter(e => e.isPromoted || e.is_promoted);
  if (!promoted.length) return;

  section.style.display = '';
  strip.innerHTML = promoted.map(ev => {
    const biz     = window._allBiz?.find(b => b.id === ev.businessId);
    const evLink  = biz ? `/${biz.slug}/${ev.slug || slugify(ev.title)}` : `/events/${ev.slug || slugify(ev.title)}`;
    const featImg = ev.heroImg || ev.img || biz?.img || null;
    const latAttr = (ev.lat && ev.lng) ? ` data-lat="${ev.lat}" data-lng="${ev.lng}"` : '';
    return `
      <a href="${evLink}" class="ev-card ev-card--promoted"${latAttr}>
        <div class="ev-card__img${featImg ? ' ev-card__img--photo' : ''}" style="${featImg ? `background-image:url('${featImg}')` : `background:${ev.color || '#4ac8d0'}22`}">
          ${featImg ? '' : `<span>${ev.emoji || '📅'}</span>`}
          <span class="ev-card__promoted-badge">⭐ Featured</span>
        </div>
        <div class="ev-card__body">
          <span class="ev-card__cat">${ev.category || 'Event'}</span>
          <h3 class="ev-card__title">${ev.title}</h3>
          <div class="ev-card__meta">
            ${ev.date  ? `<span><span class="material-symbols-rounded">calendar_today</span>${ev.date}</span>` : ''}
            ${ev.price ? `<span><span class="material-symbols-rounded">confirmation_number</span>${ev.price}</span>` : ''}
          </div>
        </div>
      </a>`;
  }).join('');
  if (window.wtdgLocation) window.wtdgLocation.refreshDistanceBadges();
}

// ── RENDER GOLD BUSINESSES STRIP ─────────────────────────
function renderGoldStrip(businesses) {
  const strip   = document.getElementById('js-gold-strip');
  const section = document.getElementById('js-gold-section');
  if (!strip || !section) return;

  const gold = businesses.filter(b => b.isGold || b.is_gold);
  if (!gold.length) return;

  // Rotate — show up to 8, shuffled so order varies each visit
  const shuffled = [...gold].sort(() => Math.random() - 0.5).slice(0, 8);

  section.style.display = '';
  strip.innerHTML = shuffled.map(biz => {
    const latAttr = (biz.lat && biz.lng) ? ` data-lat="${biz.lat}" data-lng="${biz.lng}"` : '';
    return `
      <a href="/${biz.slug}" class="biz-card biz-card--gold"${latAttr}>
        <div class="biz-card__img${biz.img ? ' biz-card__img--photo' : ''}" style="${biz.img ? `background-image:url('${biz.img}')` : `background:${biz.color || '#4ac8d0'}22`}">
          ${biz.img ? '' : `<span>${biz.emoji || '🏪'}</span>`}
          <span class="biz-card__gold-badge">⭐</span>
        </div>
        <div class="biz-card__body">
          <span class="biz-card__type">${biz.type || ''}</span>
          <h3 class="biz-card__name">${biz.name}</h3>
          <span class="biz-card__suburb">${biz.suburb || biz.location || 'Geelong'}</span>
        </div>
      </a>`;
  }).join('');
  if (window.wtdgLocation) window.wtdgLocation.refreshDistanceBadges();
}

// ── PAID AD SYSTEM ────────────────────────────────────────
// Fetches active promotions with uploaded ad creatives from Supabase
// and renders them into the appropriate slots on the homepage.

async function loadActiveAds() {
  if (!window.db) return [];
  try {
    const now = new Date().toISOString();
    const { data, error } = await window.db
      .from('promotions')
      .select('id, business_id, package, ad_image_url, ad_link_url, ad_headline, ad_body, ends_at')
      .eq('ad_live', true)
      .gt('ends_at', now)
      .in('package', ['boost', 'spotlight', 'premier']);
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.warn('loadActiveAds:', e.message);
    return [];
  }
}

// Build a single editorial ad card HTML for use in each slot
function buildAdCard(ad, variant) {
  // variant: 'boost' | 'spotlight' | 'premier'
  const img  = ad.ad_image_url || '';
  const href = ad.ad_link_url  || '#';
  const noLink = !ad.ad_link_url;
  return `
    <a class="ad-card ad-card--${variant}" href="${href}" ${noLink ? 'style="pointer-events:none"' : 'target="_blank" rel="noopener sponsored"'}>
      <div class="ad-card__bg" style="${img ? `background-image:url('${img}')` : 'background:#1e293b'}"></div>
      <div class="ad-card__overlay"></div>
      <div class="ad-card__body">
        <span class="ad-card__eyebrow">Advertisement</span>
        ${ad.ad_headline ? `<h3 class="ad-card__title">${ad.ad_headline}</h3>` : ''}
        ${ad.ad_body     ? `<p  class="ad-card__desc">${ad.ad_body}</p>` : ''}
        ${ad.ad_link_url ? `<span class="ad-card__cta">Find out more →</span>` : ''}
      </div>
    </a>`;
}

// ── BOOST INLINE BANNER ──────────────────────────────────
function renderBoostBanner(ads) {
  const wrap = document.getElementById('js-boost-banner');
  if (!wrap) return;
  // Boost shows any ad with a headline OR image
  const boosters = ads.filter(a => a.package === 'boost' && (a.ad_image_url || a.ad_headline));
  if (!boosters.length) { wrap.style.display = 'none'; return; }

  let idx = Math.floor(Math.random() * boosters.length);
  const inner = wrap.querySelector('.container');

  function setBoostAd(ad) {
    // Replace the old img/link with editorial card
    const existing = inner.querySelector('.ad-card');
    if (existing) existing.remove();
    inner.insertAdjacentHTML('beforeend', buildAdCard(ad, 'boost'));
  }

  // Remove static img/link placeholders
  inner.querySelector('.boost-banner-link')?.remove();
  setBoostAd(boosters[idx]);
  wrap.style.display = '';

  if (boosters.length > 1) {
    setInterval(() => {
      idx = (idx + 1) % boosters.length;
      const card = inner.querySelector('.ad-card');
      if (card) { card.style.opacity = '0'; card.style.transition = 'opacity .25s ease'; }
      setTimeout(() => setBoostAd(boosters[idx]), 260);
    }, 8000);
  }
}

// ── SPOTLIGHT STICKY REVEAL ───────────────────────────────
function renderSpotlightAd(ads) {
  const outer   = document.getElementById('js-spotlight-outer');
  const inner   = document.getElementById('js-spotlight-inner');
  const adsense = document.getElementById('js-spotlight-adsense');
  if (!outer && !adsense) return;

  const spotlights = ads.filter(a => a.package === 'spotlight' && (a.ad_image_url || a.ad_headline));

  if (spotlights.length) {
    let idx = Math.floor(Math.random() * spotlights.length);

    function setSpotlight(ad) {
      if (!inner) return;
      // Remove old ad card and static placeholders
      inner.querySelector('.ad-card')?.remove();
      inner.querySelector('.spotlight-reveal-link')?.remove();
      inner.querySelector('.spotlight-reveal-eyebrow')?.remove();
      inner.insertAdjacentHTML('beforeend', buildAdCard(ad, 'spotlight'));
    }

    setSpotlight(spotlights[idx]);
    if (outer) outer.style.display = '';
    if (adsense) adsense.style.display = 'none';

    if (spotlights.length > 1) {
      setInterval(() => {
        idx = (idx + 1) % spotlights.length;
        const card = inner?.querySelector('.ad-card');
        if (card) { card.style.opacity = '0'; card.style.transition = 'opacity .3s ease'; }
        setTimeout(() => setSpotlight(spotlights[idx]), 310);
      }, 12000);
    }
  } else {
    if (outer) outer.style.display = 'none';
    if (adsense) {
      adsense.style.display = '';
      if (window.adsbygoogle && !adsense.dataset.adPushed) {
        try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch(e) {}
        adsense.dataset.adPushed = '1';
      }
    }
  }
}

// ── PREMIER BOTTOM SHEET ──────────────────────────────────
// ── INIT ADS (called from DOMContentLoaded after data load) ──
// Premier sheet is handled site-wide by premier-ad.js
async function initAds() {
  const ads = await loadActiveAds();
  renderBoostBanner(ads);
  renderSpotlightAd(ads);
}

// ── RENDER EAT STRIP ──────────────────────────────────────
function renderEatStrip(eatBiz) {
  const strip = document.getElementById('js-eat-strip');
  if (!strip) return;

  if (!eatBiz) eatBiz = BUSINESSES.filter(b => (b.sections?.length ? b.sections.includes('eat') : b.section === 'eat'));
  strip.innerHTML = eatBiz.map(biz => {
    const hasEvent = businessHasUpcoming(biz.id);
    const hasPromo = businessHasPromo(biz.id);
    const badges = [];
    if (hasEvent) badges.push('<span class="biz-badge biz-badge--event">Event</span>');
    if (hasPromo) badges.push('<span class="biz-badge biz-badge--promo">Offer</span>');

    const latAttr = (biz.lat && biz.lng) ? ` data-lat="${biz.lat}" data-lng="${biz.lng}"` : '';
    return `
      <a href="${bizLink(biz)}" class="biz-card${biz.isGold ? ' biz-card--gold' : ''}"${latAttr} data-id="${biz.id}" data-type="business">
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
  if (window.wtdgLocation) window.wtdgLocation.refreshDistanceBadges();
  injectPriorityControls('business');
}

// ── RENDER STAYS ──────────────────────────────────────────
function renderStays(stays) {
  const scroll = document.getElementById('js-stay-grid');
  if (!scroll) return;

  if (!stays) stays = STAYS;
  scroll.innerHTML = stays.map(s => {
    const latAttr = (s.lat && s.lng) ? ` data-lat="${s.lat}" data-lng="${s.lng}"` : '';
    return `
    <a href="#" class="stay-card"${latAttr}>
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
  `;}).join('');
  if (window.wtdgLocation) window.wtdgLocation.refreshDistanceBadges();
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
          ${biz ? `<a href="${bizLink(biz)}" class="offer-card__biz">${biz.emoji} ${biz.name}</a>` : ''}
          <span class="offer-card__expires">⏳ ${pr.expires}</span>
        </div>
      </div>
    `;
  }).join('');
}

// ── COMMUNITY GUIDES STRIP ────────────────────────────────
async function renderCommunityGuidesStrip() {
  const strip = document.getElementById('js-community-guides-strip');
  if (!strip) return;

  let guides = [];
  try {
    if (typeof loadPublicGuides === 'function') {
      guides = await loadPublicGuides();
    }
  } catch {}

  if (!guides.length) {
    document.getElementById('community-guides')?.style.setProperty('display', 'none');
    return;
  }

  // Sort by trending (7d views) if tracker available
  if (window.wtdgViews) {
    const scores = await wtdgViews.getAllTrendingScores('7d');
    guides.sort((a, b) => {
      const sa = scores.get(`guide:${a.id}`)?.score || 0;
      const sb = scores.get(`guide:${b.id}`)?.score || 0;
      return sb - sa;
    });
  }

  const guideUrl = g => window.IS_LOCAL ? `guide.html?id=${g.id}` : `/guide/${g.id}`;
  const top = guides.slice(0, 6);

  strip.innerHTML = top.map(g => {
    const count = (g.guide_items || []).length;
    const tag   = g.is_anyday ? 'Any day' : (g.date_from ? formatGuideDate(g.date_from) : null);
    // Pick an emoji from the first item, fall back to map
    const firstEmoji = g.guide_items?.[0]?.item_data?.emoji || '🗺️';
    return `
      <a href="${guideUrl(g)}" class="cg-card">
        <div class="cg-card__icon">${firstEmoji}</div>
        <div class="cg-card__body">
          <div class="cg-card__name">${g.name}</div>
          ${g.description ? `<div class="cg-card__desc">${g.description}</div>` : ''}
          <div class="cg-card__meta">
            <span><span class="material-symbols-rounded">star</span>${count} stop${count !== 1 ? 's' : ''}</span>
            ${tag ? `<span><span class="material-symbols-rounded">calendar_month</span>${tag}</span>` : ''}
          </div>
        </div>
        <span class="material-symbols-rounded cg-card__arrow">chevron_right</span>
      </a>`;
  }).join('');
}

// ── PERSONALISATION HELPERS ───────────────────────────────
function getPrefs() {
  try { return JSON.parse(localStorage.getItem('wtdg_prefs') || 'null') || {}; }
  catch { return {}; }
}

// Map prefs.interests values → tags/types that appear on cards
const PREF_TAG_MAP = {
  music:     ['music', 'live music', 'concert', 'gig'],
  food:      ['food & drink', 'markets', 'food', 'restaurant', 'café', 'cafe', 'brunch'],
  arts:      ['arts & culture', 'art', 'theatre', 'gallery', 'culture'],
  outdoors:  ['outdoors', 'nature', 'outdoor', 'adventure', 'hiking', 'family friendly', 'pet friendly'],
  fitness:   ['fitness', 'sport', 'run', 'gym', 'wellness'],
  family:    ['family friendly', 'all ages', 'kids', 'family', 'accessible'],
  theatre:   ['theatre', 'arts & culture', 'comedy'],
  markets:   ['markets', 'market'],
  pets:      ['pet friendly'],
  free:      ['free'],
  nightlife: ['nightlife', 'bar', 'pub', 'cocktail'],
  sport:     ['sport', 'fitness'],
};

// Group → auto-suggest filter on collection pages
const GROUP_FILTER_HINT = {
  family: { do: 'family', eat: 'café' },
};

function prefsMatchCard(ev, prefs) {
  if (!prefs?.interests?.length) return false;
  const haystack = [
    ...(ev.tags || []),
    ev.category, ev.type,
    ev.price === 'Free' ? 'free' : null,
  ].filter(Boolean).map(s => s.toLowerCase());

  return prefs.interests.some(interest => {
    const matchTerms = PREF_TAG_MAP[interest] || [interest];
    return matchTerms.some(t => haystack.some(h => h.includes(t)));
  });
}

// ── PERSONALISED SORT ────────────────────────────────────
// Bubbles matching events/items to the top. Matched items keep their
// relative order; unmatched items keep their relative order below.
function personaliseSort(items, prefs) {
  if (!prefs?.interests?.length && !prefs?.group) return items;
  const matched   = items.filter(item => prefsMatchCard(item, prefs));
  const unmatched = items.filter(item => !prefsMatchCard(item, prefs));
  // family group: also float family-friendly unmatched items higher
  if (prefs.group === 'family') {
    const familyTags = PREF_TAG_MAP.family;
    const famUnmatched = unmatched.filter(item => {
      const h = [...(item.tags||[]), item.category, item.type].filter(Boolean).map(s=>s.toLowerCase());
      return familyTags.some(t => h.some(hh => hh.includes(t)));
    });
    const rest = unmatched.filter(item => !famUnmatched.includes(item));
    return [...matched, ...famUnmatched, ...rest];
  }
  return [...matched, ...unmatched];
}

// Interest → filter pill value on collection pages
const INTEREST_TO_FILTER = {
  music:     { events: 'music' },
  food:      { eat: 'café', drink: 'bar' },
  arts:      { do: 'art' },
  outdoors:  { do: 'nature' },
  fitness:   { do: 'sport' },
  family:    { do: 'family' },
  theatre:   { do: 'art' },
  markets:   { events: 'markets' },
  nightlife: { drink: 'bar' },
  sport:     { do: 'sport' },
};

function showPrefsHint(filterEl, prefs, pageKey, onAccept) {
  if (!filterEl || !prefs.interests?.length) return;

  // Find the best suggested filter for this page from user's interests
  let suggested = null;
  for (const interest of prefs.interests) {
    const map = INTEREST_TO_FILTER[interest] || {};
    if (map[pageKey]) { suggested = map[pageKey]; break; }
  }
  // Group hint
  if (!suggested && prefs.group === 'family' && pageKey === 'do') suggested = 'family';

  if (!suggested) return;
  const pill = filterEl.querySelector(`.coll-filter-pill[data-filter="${suggested}"]`);
  if (!pill) return;

  // Show a soft hint bar above the grid
  const hintId = 'js-prefs-hint';
  if (document.getElementById(hintId)) return;
  const hint = document.createElement('div');
  hint.id = hintId;
  hint.className = 'prefs-hint';
  hint.innerHTML = `
    <span class="prefs-hint__icon">✦</span>
    <span class="prefs-hint__text">Based on your preferences — showing <strong>${pill.textContent}</strong></span>
    <button class="prefs-hint__btn" id="js-prefs-hint-apply">Apply filter</button>
    <button class="prefs-hint__dismiss" id="js-prefs-hint-dismiss">✕</button>
  `;
  filterEl.closest('.coll-topbar')?.insertAdjacentElement('afterend', hint);
  document.getElementById('js-prefs-hint-apply')?.addEventListener('click', () => {
    hint.remove(); onAccept(suggested);
  });
  document.getElementById('js-prefs-hint-dismiss')?.addEventListener('click', () => hint.remove());
}

// ── WEEKEND HELPERS ───────────────────────────────────────
// Format a local Date as YYYY-MM-DD (avoids toISOString UTC shift)
function localISODate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getWeekendDates(offset = 0) {
  // offset=0 → this weekend, offset=1 → next weekend
  // Weekend = Fri–Sun
  // If today is Fri/Sat/Sun we're already in the weekend — anchor to this Friday
  // If today is Mon–Thu the weekend starts on the upcoming Friday
  const today = new Date(); today.setHours(0,0,0,0);
  const dow = today.getDay(); // 0=Sun,1=Mon...6=Sat
  let daysToFri;
  if      (dow === 5) daysToFri =  0;  // today IS Friday
  else if (dow === 6) daysToFri = -1;  // Saturday — Friday was yesterday
  else if (dow === 0) daysToFri = -2;  // Sunday   — Friday was 2 days ago
  else                daysToFri = 5 - dow; // Mon=4, Tue=3, Wed=2, Thu=1
  const fri = new Date(today); fri.setDate(today.getDate() + daysToFri + offset * 7);
  const sat = new Date(fri);   sat.setDate(fri.getDate() + 1);
  const sun = new Date(fri);   sun.setDate(fri.getDate() + 2);
  return { fri, sat, sun };
}

function filterToWeekend(events, { fri, sat, sun }) {
  return events.filter(ev => {
    const d = parseEventDate(ev.date);
    if (!d) return false;
    const t = d.getTime();
    return t === fri.getTime() || t === sat.getTime() || t === sun.getTime();
  });
}

function fmtWeekendLabel(fri, sun) {
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${fri.getDate()}–${sun.getDate()} ${MONTHS[sun.getMonth()]}`;
}

// ── WEEKEND TOGGLE ────────────────────────────────────────
function initWeekendToggle(allEvents) {
  const toggleEl  = document.getElementById('js-weekend-toggle');
  const labelEl   = document.getElementById('js-weekend-label');
  const nextBtn   = document.getElementById('js-week-next');
  const seeAllEl  = document.getElementById('js-weekend-see-all-link');
  if (!toggleEl) return;

  function showWeekend(offset) {
    const { fri, sat, sun } = getWeekendDates(offset);
    const label = fmtWeekendLabel(fri, sun);
    if (labelEl) labelEl.textContent = label;

    // "Next weekend →" link
    if (nextBtn && offset === 0) {
      const { fri: nf, sun: nu } = getWeekendDates(1);
      nextBtn.href = `events.html?from=${localISODate(nf)}&to=${localISODate(nu)}`;
    }

    // See-all link
    if (seeAllEl) {
      seeAllEl.href = `events.html?from=${localISODate(fri)}&to=${localISODate(sun)}`;
      seeAllEl.textContent = offset === 0 ? 'See all this weekend →' : 'See full next weekend →';
    }

    // Filter and render events
    const weekendEvs = filterToWeekend(allEvents, { fri, sat, sun });
    window._currentWeekendEvs = weekendEvs; // store for priority re-renders
    renderFeatured(weekendEvs);    // sets _weekendFeaturedIds
    renderUpcoming(allEvents); // upcoming excludes the featured pair
  }

  // Personalised section subtitle
  const prefs = getPrefs();
  if (prefs.interests?.length || prefs.group) {
    const groupLabel = { family: 'families', couple: 'couples', friends: 'groups', solo: 'solo explorers' }[prefs.group] || null;
    const interestLabels = (prefs.interests || []).slice(0, 2).map(i => i.replace('_', ' '));
    const parts = [...(groupLabel ? [groupLabel] : []), ...interestLabels];
    const matchCount = allEvents.filter(ev => prefsMatchCard(ev, prefs) && getEventUrgency(ev) !== 'past').length;
    const subtitle = document.createElement('p');
    subtitle.className = 'weekend-personalised-sub';
    subtitle.innerHTML = `
      <span class="wps__row">
        <span class="wps__spark">✦</span>
        <span class="wps__label">Sorted for <strong>${parts.join(' · ')}</strong></span>
        <a href="onboarding.html" class="wps__edit">edit</a>
      </span>
      ${matchCount ? `<span class="wps__count">${matchCount} matching event${matchCount !== 1 ? 's' : ''} up first</span>` : ''}
    `;
    toggleEl.insertAdjacentElement('beforebegin', subtitle);
  }

  // Default: this weekend
  showWeekend(0);

  // This weekend btn (no-op link, just for styling)
  document.getElementById('js-week-this')?.addEventListener('click', () => {
    document.getElementById('js-week-this').classList.add('weekend-toggle__btn--active');
    showWeekend(0);
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

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    drawer.hidden = !drawer.hidden;
  });

  // Close popout when clicking outside
  document.addEventListener('click', (e) => {
    if (!drawer.hidden && !drawer.contains(e.target) && e.target !== toggle) {
      drawer.hidden = true;
    }
  });

  document.getElementById('js-dp-apply')?.addEventListener('click', () => {
    const from = document.getElementById('dp-from')?.value;
    const to   = document.getElementById('dp-to')?.value;
    if (!from) { document.getElementById('dp-from')?.focus(); return; }
    const toParam = to ? `&to=${to}` : '';
    window.location.href = `events.html?from=${from}${toParam}`;
  });
}

// ── PERSONALISE ───────────────────────────────────────────
function initPersonaliseCTAs() {
  document.querySelectorAll('#js-personalise, #js-personalise-2').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      window.location.href = 'onboarding.html';
    });
  });
}

// ── PLANNER CARD ─────────────────────────────────────────
function initPlannerCard() {
  const fromEl    = document.getElementById('dp-from-2');
  const toEl      = document.getElementById('dp-to-2');
  const goBtn     = document.getElementById('js-planner-go');
  const previewEl = document.getElementById('js-planner-preview');
  if (!goBtn || !fromEl || !toEl) return;

  // Pre-fill with this weekend
  const { sat, sun } = getWeekendDates(0);
  fromEl.valueAsDate = sat;
  toEl.valueAsDate   = sun;

  function filterByDateRange(from, to) {
    const events = window._allEvents || [];
    const fromD = from ? new Date(from + 'T00:00:00') : null;
    const toD   = to   ? new Date(to   + 'T23:59:59') : null;
    return events.filter(ev => {
      const d = parseEventDate(ev.date);
      if (!d) return false;
      if (fromD && d < fromD) return false;
      if (toD   && d > toD)   return false;
      return true;
    });
  }

  function updatePreview() {
    if (!previewEl) return;
    const from = fromEl.value;
    const to   = toEl.value;
    if (!from) { previewEl.style.display = 'none'; return; }
    const filtered = filterByDateRange(from, to);
    const n = filtered.length;
    if (n === 0) {
      previewEl.textContent = 'No events found for those dates';
      previewEl.style.color = '#888';
    } else {
      const fromDate = new Date(from + 'T00:00:00');
      const toDate   = to ? new Date(to + 'T00:00:00') : null;
      const fmt = d => d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
      const range = toDate && to !== from ? `${fmt(fromDate)} – ${fmt(toDate)}` : fmt(fromDate);
      previewEl.textContent = `${n} event${n !== 1 ? 's' : ''} found for ${range}`;
      previewEl.style.color = 'var(--teal)';
    }
    previewEl.style.display = 'block';
  }

  fromEl.addEventListener('change', updatePreview);
  toEl.addEventListener('change', updatePreview);
  // Run once on load to show weekend count
  // Wait for _allEvents to be populated
  const tryPreview = () => {
    if (window._allEvents) updatePreview();
    else setTimeout(tryPreview, 300);
  };
  tryPreview();

  goBtn.addEventListener('click', () => {
    const from = fromEl.value;
    const to   = toEl.value;
    if (!from) { fromEl.focus(); return; }
    const toParam = to ? `&to=${to}` : '';
    window.location.href = `events.html?from=${from}${toParam}`;
  });
}

// ── SEO META INJECTION ────────────────────────────────────
function injectSEOMeta({ title, description, canonical, ogImage, type, extra }) {
  const set = (sel, attr, val) => {
    let el = document.querySelector(sel);
    if (!el) { el = document.createElement('meta'); document.head.appendChild(el); }
    el.setAttribute(attr, val);
  };
  document.title = title;
  set('meta[name="description"]',          'content', description);
  set('meta[property="og:title"]',         'content', title);
  set('meta[property="og:description"]',   'content', description);
  set('meta[property="og:type"]',          'content', type === 'article' ? 'article' : 'website');
  set('meta[property="og:url"]',           'content', canonical);
  if (ogImage) set('meta[property="og:image"]', 'content', ogImage);
  set('meta[name="twitter:card"]',         'content', 'summary_large_image');
  set('meta[name="twitter:title"]',        'content', title);
  set('meta[name="twitter:description"]',  'content', description);
  // Canonical link
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link); }
  link.href = canonical;
  // JSON-LD or extra tags
  if (extra) {
    const div = document.createElement('div');
    div.innerHTML = extra;
    [...div.children].forEach(el => document.head.appendChild(el));
  }
}

// ── LISTING PAGE ──────────────────────────────────────────
const BIZ_TAG_ICONS = {
  // interests
  'music': '🎵', 'food': '🍴', 'arts': '🎨', 'outdoors': '🌿',
  'fitness': '💪', 'wellness': '🧘', 'sport': '⚽', 'nightlife': '🌙',
  'markets': '🛍', 'theatre': '🎭', 'nature': '🌳', 'shopping': '🛒',
  // suitability
  'family-friendly': '👨‍👩‍👧', 'kids': '🧒', 'teens': '🧑',
  'adults-only': '🔞', 'dog-friendly': '🐶', 'accessible': '♿',
  'free': '🆓', 'all-ages': '🌟',
  // vibe
  'indoor': '🏠', 'outdoor': '☀️', 'date-night': '💑',
  'group': '👥', 'solo': '🧍', 'romantic': '🌹',
  'live music': '🎸', 'pet-friendly': '🐾',
};

function normLabel(s) {
  // "family-friendly" → "Family-Friendly", "date-night" → "Date Night"
  return s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function getBizTags(biz) {
  const seen = new Set();
  const tags = [];

  function add(key, label, icon) {
    const k = key.toLowerCase();
    if (seen.has(k)) return;
    seen.add(k);
    tags.push({ label: label || normLabel(key), icon: icon || BIZ_TAG_ICONS[k] || '✦' });
  }

  // ── 1. Structured tags from DB (new system) ──────────────
  const SUITABILITY = new Set(['family-friendly','kids','teens','adults-only','dog-friendly','accessible','free','all-ages','indoor','outdoor','date-night','group','solo','romantic','live-music','pet-friendly']);
  for (const tag of (biz.tags || [])) {
    const k = tag.toLowerCase().replace(/[\s]+/g, '-');
    const isSuit = SUITABILITY.has(k);
    const entry = { label: normLabel(tag), icon: BIZ_TAG_ICONS[k] || BIZ_TAG_ICONS[tag.toLowerCase()] || '✦' };
    if (isSuit) entry.teal = true;
    if (seen.has(k)) continue;
    seen.add(k);
    tags.push(entry);
  }

  // ── 2. Categories array (new system) ────────────────────
  const catIconMap = {
    'café': '☕', 'restaurant': '🍽️', 'bar': '🍸', 'pub': '🍺',
    'bakery': '🥐', 'brunch': '🍳', 'winery': '🍷', 'brewery': '🍻',
    'gallery': '🖼', 'museum': '🏛', 'theatre': '🎭', 'cinema': '🎬',
    'activity': '🎯', 'adventure': '🧗', 'wellness': '🧘', 'sport': '⚽',
    'hotel': '🏨', 'market': '🛍',
  };
  for (const cat of (biz.categories || [])) {
    add(cat.toLowerCase(), cat, catIconMap[cat.toLowerCase()]);
  }

  // ── 3. Legacy keyword fallback for older records ─────────
  const t = (biz.type || biz.category || '').toLowerCase();
  const name = (biz.name || '').toLowerCase();
  if (!tags.length) {
    if (['family','kids','child','play','aquatic','bowling','cinema'].some(k => t.includes(k) || name.includes(k))) add('family-friendly', 'Family Friendly');
    if (['bar','pub','brewery','winery','cocktail','nightclub'].some(k => t.includes(k))) add('licensed', 'Licensed Venue', '🍺');
    if (['café','cafe','coffee','bakery','brunch'].some(k => t.includes(k))) add('café', 'Café & Coffee', '☕');
    if (['restaurant','dining','bistro'].some(k => t.includes(k))) add('restaurant', 'Dine In', '🍽️');
    if (['park','garden','outdoor','nature','beach','adventure','surf'].some(k => t.includes(k) || name.includes(k))) add('outdoors', 'Outdoors');
    if (['gallery','museum','art','culture','theatre','theater'].some(k => t.includes(k))) add('arts', 'Arts & Culture');
    if (['hotel','motel','accommodation','bnb','hostel'].some(k => t.includes(k))) add('accommodation', 'Accommodation', '🏨');
  }

  // ── 4. Rating / plan badges (always shown if applicable) ─
  if (biz.rating && biz.rating >= 4.5) add('highly-rated', 'Highly Rated', '⭐');
  if (biz.plan === 'premium') add('partner', 'WTDG Partner', '✓');

  return tags;
}

function getTodayHours(openingHours) {
  if (!openingHours?.weekdayDescriptions?.length) return 'See hours';
  // weekdayDescriptions is Mon–Sun (index 0=Mon, 6=Sun); JS getDay() is 0=Sun
  const jsDay  = new Date().getDay();
  const idx    = jsDay === 0 ? 6 : jsDay - 1;
  const line   = openingHours.weekdayDescriptions[idx] || '';
  // "Monday: 7:00 AM – 4:00 PM" → strip day name
  const hours  = line.replace(/^[^:]+:\s*/, '');
  return hours ? `Today: ${hours}` : 'See hours';
}

async function initListingPage() {
  const params    = new URLSearchParams(window.location.search);
  // On Vercel, URL stays clean (/biz-slug) so read path; locally use ?s= or ?id=
  const pathSlug  = window.location.pathname.replace(/^\//, '').split('/')[0] || null;
  const slugParam = params.get('s') || (!params.get('id') && pathSlug && pathSlug !== 'listing.html' ? pathSlug : null);
  const idParam   = params.get('id');

  let biz = slugParam ? getBusinessBySlug(slugParam) : idParam ? getBusinessById(idParam) : null;

  // Fallback: fetch from Supabase by slug, id, or name-derived slug
  if (!biz && typeof db !== 'undefined') {
    let data = null;
    if (idParam) {
      ({ data } = await db.from('businesses').select('*').eq('id', idParam).single());
    }
    if (!data && slugParam) {
      // Try exact slug match first
      ({ data } = await db.from('businesses').select('*').eq('slug', slugParam).single());
    }
    if (!data && slugParam) {
      // Try matching name: slug "test-cafe-geelong" → name ilike "test cafe%"
      const nameHint = slugParam.replace(/-/g, ' ').replace(/\s+(geelong|cbd|north|south|east|west|newtown|belmont|torquay|lara|leopold|drysdale|barwon heads)$/i, '').trim();
      const { data: rows } = await db.from('businesses').select('*').ilike('name', `${nameHint}%`).limit(1);
      data = rows?.[0] || null;
    }
    if (data) {
      biz = camelize(data);
    }
  }

  if (!biz) {
    document.getElementById('js-listing-root').innerHTML =
      '<p style="padding:2rem">Business not found. <a href="index.html">Go home</a></p>';
    return;
  }

  // Show pending notice to the owner
  if (biz.status === 'pending') {
    const session = await db.auth.getSession();
    const userId = session?.data?.session?.user?.id;
    if (userId !== (biz.ownerId ?? biz.owner_id)) {
      document.getElementById('js-listing-root').innerHTML =
        '<p style="padding:2rem">This listing is not yet published. <a href="index.html">Go home</a></p>';
      return;
    }
    // Owner can preview — prepend a notice
    const notice = document.createElement('div');
    notice.style.cssText = 'background:#fef9c3;border-bottom:2px solid #fde047;padding:.75rem 1.25rem;font-size:.85rem;color:#713f12;text-align:center';
    notice.innerHTML = '⏳ <strong>Preview only</strong> — this listing is pending approval and is not visible to the public yet.';
    document.body.prepend(notice);
  }

  const bizSlug  = biz.slug || slugify(biz.name + '-' + (biz.suburb || ''));
  const canonUrl = `https://whattodogeelong.com.au/${bizSlug}`;
  const metaDesc = `${biz.name} in ${biz.suburb || 'Geelong'} — ${biz.description ? biz.description.slice(0, 140) + '…' : 'What To Do Geelong'}`;
  document.title = `${biz.name} ${biz.suburb ? '· ' + biz.suburb : ''} — What To Do Geelong`;
  injectSEOMeta({
    title:       `${biz.name} — ${biz.type} in Geelong`,
    description: metaDesc,
    canonical:   canonUrl,
    ogImage:     biz.img || '',
    type:        'place',
    extra: `
      <script type="application/ld+json">${JSON.stringify({
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": biz.name,
        "description": biz.description || '',
        "address": { "@type": "PostalAddress", "addressLocality": biz.suburb || 'Geelong', "addressRegion": "VIC", "addressCountry": "AU" },
        "url": biz.website ? 'https://' + biz.website.replace(/^https?:\/\//, '') : canonUrl,
        "image": biz.img || '',
      })}<\/script>`,
  });

  const events = getEventsForBusiness(biz.id);
  const promos = getPromosForBusiness(biz.id);

  // Build gallery images — use biz.img + biz.gallery if available, else fallback emoji slides
  const galleryImgs = [
    biz.img,
    ...(biz.gallery || []),
  ].filter(Boolean).slice(0, 5);

  const heroSlides = galleryImgs.length
    ? galleryImgs.map((src, i) => `<div class="lhero__slide${i === 0 ? ' active' : ''}" style="background-image:url('${src}')"></div>`).join('')
    : `<div class="lhero__slide active" style="background:${biz.color}22;display:flex;align-items:center;justify-content:center;font-size:6rem">${biz.emoji}</div>`;

  const dotsHtml = galleryImgs.length > 1
    ? `<div class="lhero__dots">${galleryImgs.map((_,i) => `<button class="lhero__dot${i===0?' active':''}" data-idx="${i}"></button>`).join('')}</div>`
    : '';

  const prevNextHtml = galleryImgs.length > 1
    ? `<button class="lhero__arrow lhero__arrow--prev" aria-label="Previous">‹</button>
       <button class="lhero__arrow lhero__arrow--next" aria-label="Next">›</button>`
    : '';

  const bizTags = getBizTags(biz);
  const mapsQuery = encodeURIComponent(biz.name + ' ' + (biz.location || biz.suburb || 'Geelong'));
  const mapsUrl = biz.lat && biz.lng
    ? `https://www.google.com/maps/dir/?api=1&destination=${biz.lat},${biz.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
  const mapEmbedUrl = biz.lat && biz.lng
    ? `https://maps.google.com/maps?q=${biz.lat},${biz.lng}&z=15&output=embed`
    : `https://maps.google.com/maps?q=${mapsQuery}&z=15&output=embed`;

  const openingHoursHtml = biz.openingHours?.weekdayDescriptions?.length ? `
    <div class="linfo-card">
      <div class="linfo-card__header">
        <span class="material-symbols-rounded">schedule</span>
        <h3>Opening Hours</h3>
      </div>
      <p class="linfo-card__today" id="js-hours-today">${getTodayHours(biz.openingHours)}</p>
      <button class="linfo-card__toggle" id="js-hours-toggle">
        Show all hours <span class="material-symbols-rounded lident__hours-chev">expand_more</span>
      </button>
      <ul class="linfo-card__hours-list" id="js-hours-list" hidden>
        ${biz.openingHours.weekdayDescriptions.map(d => {
          const isToday = d.startsWith(new Date().toLocaleDateString('en-AU',{weekday:'long'}));
          return `<li class="${isToday ? 'linfo-today' : ''}">${d}</li>`;
        }).join('')}
      </ul>
    </div>` : '';

  document.getElementById('js-listing-root').innerHTML = `
    <!-- HERO CAROUSEL — full width -->
    <div class="lhero lhero--full">
      <div class="lhero__track">${heroSlides}</div>
      ${prevNextHtml}
      ${dotsHtml}
      <div class="lhero__badge-wrap">
        <span class="lhero__type-badge">${biz.type}</span>
      </div>
      <div class="lhero__actions">
        <button class="ev-hero2__action-btn star-btn" id="js-biz-save-btn" aria-label="Add to Guide">
          ${typeof wtdgIcon === 'function' ? wtdgIcon('heart', 20) : '♡'}
        </button>
        <button class="ev-hero2__action-btn" id="js-biz-share-btn" aria-label="Share">
          ${typeof wtdgIcon === 'function' ? wtdgIcon('share', 20) : '↑'}
        </button>
      </div>
    </div>

    <!-- BUSINESS HEADER -->
    <div class="container">
      <div class="lheader">
        <div class="lheader__left">
          <div class="lident__avatar" style="background:${biz.color}22">${biz.emoji}</div>
          <div class="lheader__info">
            <h1 class="lident__name">${biz.name}</h1>
            <p class="lident__loc">
              <span class="material-symbols-rounded" style="font-size:.9rem;vertical-align:middle;color:var(--teal)">location_on</span>
              ${biz.suburb || biz.location || 'Geelong'}${biz.rating ? ` <span class="lident__rating">★ ${biz.rating}</span>` : ''}<span class="lident__dist" id="js-listing-dist"></span>
            </p>
            <p class="lident__views" id="js-biz-view-count" style="display:none"></p>
            ${bizTags.length ? `<div class="listing-tags">${bizTags.map(t => `<span class="listing-tag${t.teal ? ' listing-tag--teal' : ''}">${t.icon} ${t.label}</span>`).join('')}</div>` : ''}
          </div>
        </div>
        <div class="lheader__actions">
          ${biz.website ? `<a href="https://${biz.website}" target="_blank" rel="noopener" class="btn btn--outline btn--sm"><span class="material-symbols-rounded">language</span> Website</a>` : ''}
          ${biz.phone   ? `<a href="tel:${biz.phone}" class="btn btn--outline btn--sm"><span class="material-symbols-rounded">call</span> Call</a>` : ''}
          <a href="${mapsUrl}" target="_blank" rel="noopener" class="btn btn--teal btn--sm"><span class="material-symbols-rounded">directions</span> Directions</a>
        </div>
      </div>
    </div>

    <!-- TWO-COLUMN BODY -->
    <div class="container listing-layout">

      <!-- MAIN COLUMN -->
      <div class="listing-main">
        ${biz.description ? `<p class="lident__desc">${biz.description}</p>` : ''}

        <!-- TABS -->
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

      <!-- SIDEBAR -->
      <aside class="listing-sidebar">
        ${openingHoursHtml}

        <!-- Map & Directions -->
        <div class="linfo-card linfo-card--map">
          <iframe
            src="${mapEmbedUrl}"
            width="100%" height="200" style="border:0;border-radius:8px;display:block"
            allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"
          ></iframe>
          <a href="${mapsUrl}" target="_blank" rel="noopener" class="linfo-directions-btn">
            <span class="material-symbols-rounded">directions</span> Get Directions
          </a>
          ${biz.location ? `<p class="linfo-address">${biz.location}</p>` : ''}
        </div>

        <!-- Contact details -->
        ${biz.phone || biz.website ? `
        <div class="linfo-card">
          ${biz.phone ? `
            <a href="tel:${biz.phone}" class="linfo-row">
              <span class="material-symbols-rounded">call</span>
              <span>${biz.phone}</span>
            </a>` : ''}
          ${biz.website ? `
            <a href="https://${biz.website}" target="_blank" rel="noopener" class="linfo-row">
              <span class="material-symbols-rounded">language</span>
              <span>Visit website</span>
            </a>` : ''}
        </div>` : ''}
      </aside>

    </div>
  `;

  // Related articles
  const relatedToListing = getArticlesForBusiness(biz.id);
  if (relatedToListing.length) {
    document.getElementById('js-listing-root').insertAdjacentHTML('beforeend', `
      <div class="container listing-body">
        <h2 class="section-title" style="margin-bottom:1rem"><span class="material-symbols-rounded">auto_stories</span> From the Edit</h2>
        <div class="ed-scroll">
          ${relatedToListing.map(a => `<a href="${artLink(a)}" class="ed-mini-card"><div class="ed-mini-card__img" style="background-image:url('${a.heroImg}')"></div><div class="ed-mini-card__body">${articleTypeBadge(a.type)}<h4 class="ed-mini-card__title">${a.title}</h4></div></a>`).join('')}
        </div>
      </div>
    `);
  }

  // ── Inquiry / claim section ────────────────────────────────
  // Logic:
  //   unclaimed              → claim CTA (everyone)
  //   claimed + visitor      → Gold listing: live form  |  Free: website link only
  //   claimed + owner + free → Gold gate upsell (owner only sees this)
  //   claimed + owner + gold → "Your enquiry form is live" confirmation
  const isClaimed = !!(biz.isClaimed ?? biz.is_claimed);
  const isGold    = !!(biz.isGold    ?? biz.is_gold);

  // Get logged-in user async, then render the right state
  (async () => {
    const user      = await getSupabaseUser();
    const isOwner   = user && biz.ownerId && user.id === biz.ownerId;

    let inqHTML = '';

    if (!isClaimed) {
      // ── Unclaimed: blurred ghost form + claim CTA overlay ──
      inqHTML = `
        <div class="listing-inq-card listing-inq-card--locked">
          <h3 class="listing-inq-title"><span class="material-symbols-rounded">mail</span> Send an enquiry</h3>
          <p class="listing-inq-sub">Ask ${biz.name} a question — they'll get back to you directly.</p>
          <div class="listing-inq-form" style="filter:blur(4px);pointer-events:none;user-select:none">
            <div class="listing-inq-row">
              <input type="text"  class="ob-input" placeholder="Your name" />
              <input type="email" class="ob-input" placeholder="Your email" />
            </div>
            <textarea class="ob-input" rows="3" placeholder="Your message…" style="resize:vertical"></textarea>
            <button class="btn btn--teal">Send enquiry</button>
          </div>
          <div class="inq-claim-overlay">
            <span class="inq-claim-icon">🏪</span>
            <p class="inq-claim-title">Is this your business?</p>
            <p class="inq-claim-sub">Claim your listing to start receiving customer enquiries and unlock Gold features.</p>
            <a href="business-signup.html?claim=${encodeURIComponent(biz.slug)}" class="btn btn--teal inq-claim-btn">Claim &amp; activate →</a>
          </div>
        </div>`;

    } else if (isOwner && !isGold) {
      // ── Owner, free listing: show Gold gate upsell ─────────
      inqHTML = `
        <div class="listing-inq-card listing-inq-card--gold-gate">
          <div class="inq-gold-gate">
            <span class="inq-gold-icon">⭐</span>
            <p class="inq-gold-title">Unlock your enquiry form</p>
            <p class="inq-gold-sub">Your listing has no way for customers to contact you directly. Gold members get a live enquiry form, homepage rotation, promoted events and more.</p>
            <div class="inq-gold-features">
              <span><span class="material-symbols-rounded">mail</span> Enquiry form live on your listing</span>
              <span><span class="material-symbols-rounded">home</span> Rotated on the homepage</span>
              <span><span class="material-symbols-rounded">campaign</span> 3 promoted events per year</span>
              <span><span class="material-symbols-rounded">email</span> Featured in weekly email</span>
            </div>
            <a href="upgrade.html?biz=${encodeURIComponent(biz.slug)}" class="btn btn--gold">Upgrade to Gold — $249/yr →</a>
            <p class="inq-gold-note">or <a href="upgrade.html?biz=${encodeURIComponent(biz.slug)}&plan=monthly">$25/month</a></p>
          </div>
        </div>`;

    } else if (isGold) {
      // ── Gold listing: live enquiry form (owners see it too) ─
      inqHTML = `
        <div class="listing-inq-card">
          ${isOwner ? `<div style="margin-bottom:.75rem;padding:.5rem .75rem;background:#f0fdf4;border-radius:.5rem;font-size:.8rem;color:#166534;border:1px solid #bbf7d0">⭐ <strong>Your enquiry form is live.</strong> This is how customers will see it. <a href="/business-dashboard.html" style="color:#166534">View enquiries →</a></div>` : ''}
          <h3 class="listing-inq-title"><span class="material-symbols-rounded">mail</span> Send an enquiry</h3>
          <p class="listing-inq-sub">Ask ${biz.name} a question — they'll get back to you directly.</p>
          <div class="listing-inq-form">
            <div class="listing-inq-row">
              <input type="text"  class="ob-input" id="inq-name"  placeholder="Your name" />
              <input type="email" class="ob-input" id="inq-email" placeholder="Your email" />
            </div>
            <textarea class="ob-input" id="inq-msg" rows="3" placeholder="Your message…" style="resize:vertical"></textarea>
            <button class="btn btn--teal" id="js-inq-send">Send enquiry</button>
          </div>
          <div id="js-inq-success" hidden style="color:var(--teal);font-weight:700;padding:.5rem 0">
            ✓ Enquiry sent! ${biz.name} will be in touch.
          </div>
        </div>`;

    } else {
      // ── Visitor, free listing: website link only ───────────
      if (biz.website) {
        inqHTML = `
          <div class="listing-inq-card listing-inq-card--website">
            <span class="material-symbols-rounded" style="font-size:1.8rem;color:var(--teal)">language</span>
            <p class="listing-inq-sub" style="margin:.4rem 0 1rem">Visit the ${biz.name} website for bookings and enquiries.</p>
            <a href="${biz.website}" target="_blank" rel="noopener" class="btn btn--outline">Visit website →</a>
          </div>`;
      }
      // If no website either, render nothing
    }

    if (inqHTML) {
      document.getElementById('js-listing-root').insertAdjacentHTML('beforeend', `
        <div class="container listing-body">${inqHTML}</div>
      `);
    }

    // ── Related businesses (after enquiry block) ─────────────
    try {
      const SUPABASE_KEY = 'sb_publishable_hQC1qopXEWqlHPACU30OQA_LoeW5sw2';
      const res = await fetch(
        `https://duhxszqyyzrbzrhwneey.supabase.co/rest/v1/businesses?select=id,name,type,slug,suburb,img,emoji,color,rating&type=eq.${encodeURIComponent(biz.type)}&id=neq.${encodeURIComponent(biz.id)}&limit=8`,
        { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
      );
      const related = await res.json();
      if (Array.isArray(related) && related.length) {
        const picks = related.sort(() => Math.random() - 0.5).slice(0, 4);
        document.getElementById('js-listing-root').insertAdjacentHTML('beforeend', `
          <div class="container listing-body">
            <div class="listing-related">
              <h2 class="listing-related__title">
                <span class="material-symbols-rounded">storefront</span>
                More ${biz.type} in Geelong
              </h2>
              <div class="listing-related__grid">
                ${picks.map(r => {
                  const img = r.img || '';
                  const rating = r.rating ? `<span class="listing-related__rating">★ ${r.rating}</span>` : '';
                  return `
                    <a href="/${r.slug}" class="listing-related__card">
                      <div class="listing-related__img" style="${img ? `background-image:url('${img}')` : `background:${r.color || '#e5e7eb'}`}">
                        ${!img ? `<span style="font-size:1.8rem">${r.emoji || ''}</span>` : ''}
                      </div>
                      <div class="listing-related__body">
                        <div class="listing-related__name">${r.name}</div>
                        <div class="listing-related__sub">${r.suburb || 'Geelong'}${rating}</div>
                      </div>
                    </a>`;
                }).join('')}
              </div>
            </div>
          </div>`);
      }
    } catch (_) {}

    // Wire up send button for Gold listing enquiry form
    if (isGold) {
      document.getElementById('js-inq-send')?.addEventListener('click', async () => {
        const name  = document.getElementById('inq-name').value.trim();
        const email = document.getElementById('inq-email').value.trim();
        const msg   = document.getElementById('inq-msg').value.trim();
        if (!email || !msg) { alert('Please enter your email and message.'); return; }
        const btn = document.getElementById('js-inq-send');
        btn.disabled = true;
        btn.textContent = 'Sending…';

        try {
          await db.from('inquiries').insert({
            business_id: biz.id,
            name:        name || null,
            email:       email,
            message:     msg,
            unread:      true,
          });
        } catch (_) {}

        try {
          await fetch('/api/send-inquiry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              business_id:   biz.id,
              business_name: biz.name,
              business_slug: biz.slug,
              owner_id:      biz.ownerId,
              sender_name:   name || null,
              sender_email:  email,
              message:       msg,
            }),
          });
        } catch (_) {}

        if (typeof wtdgTrack === 'function') wtdgTrack('inquiry_sent', { business_name: biz.name });
        btn.hidden = true;
        document.getElementById('js-inq-success').hidden = false;
      });
    }
  })();

  // ── Opening hours toggle ────────────────────────────────────
  document.getElementById('js-hours-toggle')?.addEventListener('click', () => {
    const list = document.getElementById('js-hours-list');
    const chev = document.querySelector('.lident__hours-chev');
    if (!list) return;
    list.hidden = !list.hidden;
    if (chev) chev.style.transform = list.hidden ? '' : 'rotate(180deg)';
  });

  // ── Distance display on listing page ───────────────────────
  if (window.wtdgLocation && biz.lat && biz.lng) {
    const distEl = document.getElementById('js-listing-dist');
    const updateDist = () => {
      const d = window.wtdgLocation.distFromUser(biz.lat, biz.lng);
      if (distEl) distEl.textContent = d ? ` · ${window.wtdgLocation.formatDist(d)} away` : '';
    };
    updateDist();
    // Re-check after a short delay in case geolocation is still loading
    setTimeout(updateDist, 2000);
  }

  // ── View tracking + view_count increment ────────────────────
  if (window.wtdgViews) {
    window.wtdgViews.track(biz.id, 'business', biz.type);
    // Increment view_count on businesses table (used for 100-view nudge email)
    setTimeout(async () => {
      try {
        await db.rpc('increment_business_views', { biz_id: biz.id });
      } catch (_) {}
    }, 1000);
    // Show view count after a short delay so it doesn't block page paint
    window.wtdgViews.getCount(biz.id, 'business', '7d').then(count => {
      if (count > 0 && isAdminUser()) {
        const el = document.getElementById('js-biz-view-count');
        if (el) {
          el.textContent = `👁 ${window.wtdgViews.formatViews(count)} views this week`;
          el.style.display = '';
        }
      }
    });
  }

  // ── Carousel init ──────────────────────────────────────────
  const track = document.querySelector('.lhero__track');
  if (track && track.children.length > 1) {
    let current = 0;
    const slides = Array.from(track.children);
    const dots   = Array.from(document.querySelectorAll('.lhero__dot'));

    function goSlide(n) {
      slides[current].classList.remove('active');
      dots[current]?.classList.remove('active');
      current = (n + slides.length) % slides.length;
      slides[current].classList.add('active');
      dots[current]?.classList.add('active');
    }

    document.querySelector('.lhero__arrow--prev')?.addEventListener('click', () => goSlide(current - 1));
    document.querySelector('.lhero__arrow--next')?.addEventListener('click', () => goSlide(current + 1));
    dots.forEach(d => d.addEventListener('click', () => goSlide(+d.dataset.idx)));

    // Auto-advance every 5s
    const autoTimer = setInterval(() => goSlide(current + 1), 5000);

    // ── Touch / swipe support ────────────────────────────────
    let touchStartX = 0;
    let touchStartY = 0;
    track.addEventListener('touchstart', e => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    track.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      // Only trigger if horizontal swipe is dominant and > 40px
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        clearInterval(autoTimer);
        goSlide(dx < 0 ? current + 1 : current - 1);
      }
    }, { passive: true });
  }

  // ── Save / share buttons ───────────────────────────────────
  document.getElementById('js-biz-save-btn')?.addEventListener('click', async e => {
    e.preventDefault();
    if (typeof starItemToGuide === 'function') {
      await starItemToGuide({ id: biz.id, type: 'business', title: biz.name, emoji: biz.emoji, color: biz.color, location: biz.location, slug: bizSlug, lat: biz.lat, lng: biz.lng }, e.currentTarget);
      if (typeof updateItinBadge === 'function') updateItinBadge();
      if (typeof trackSaveToGuide === 'function') trackSaveToGuide({ type: 'business', title: biz.name });
    }
  });
  document.getElementById('js-biz-share-btn')?.addEventListener('click', () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: biz.name, url });
      if (typeof trackShare === 'function') trackShare('native_share', biz.name);
    } else {
      navigator.clipboard.writeText(url).then(() => alert('Link copied!'));
      if (typeof trackShare === 'function') trackShare('copy_link', biz.name);
    }
  });

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

// ── STARRING → WTDGUIDES ─────────────────────────────────
function updateItinBadge() {
  // Badge now links to guides page; count updated async
  const badge   = document.getElementById('js-itin-badge');
  const countEl = document.getElementById('js-itin-count');
  if (!badge) return;
  if (typeof loadGuides === 'function') {
    loadGuides().then(guides => {
      const total = guides.reduce((n, g) => n + (g.guide_items?.length || 0), 0);
      badge.hidden = total === 0;
      if (countEl) countEl.textContent = total;
    }).catch(() => {});
  }
}

function addStarBtn(el, item) {
  const btn = document.createElement('button');
  btn.className = 'star-btn';
  btn.setAttribute('aria-label', 'Add to Guide');
  btn.textContent = '☆';
  btn.addEventListener('click', async e => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof starItemToGuide === 'function') {
      await starItemToGuide(item, btn);
      updateItinBadge();
    }
  });
  el.style.position = 'relative';
  el.appendChild(btn);
}

// ── NAV MOBILE TOGGLE ─────────────────────────────────────
function initNav() {
  const hamburger = document.querySelector('.nav__hamburger');
  const links = document.querySelector('.nav__links');
  if (!hamburger || !links) return;

  // ── Backdrop ─────────────────────────────────────────────
  const backdrop = document.createElement('div');
  backdrop.className = 'nav__backdrop';
  document.body.appendChild(backdrop);

  // ── Drawer header (logo + close button) ──────────────────
  const header = document.createElement('div');
  header.className = 'nav__mobile-header';
  header.innerHTML = `
    <img src="assets/logo.jpg" alt="What To Do Geelong" class="nav__mobile-logo" />
    <button class="nav__mobile-close" aria-label="Close menu">
      <span class="material-symbols-rounded">close</span>
    </button>`;
  links.prepend(header);

  // ── Scrollable inner wrapper ──────────────────────────────
  // Wrap all non-header children in a scroll container so overflow-x:hidden
  // and overflow-y:auto live on *different* elements — iOS Safari requires this
  const scrollWrap = document.createElement('div');
  scrollWrap.className = 'nav__mobile-scroll';
  // Move everything after the header into the scroll wrapper
  while (links.children.length > 1) {
    scrollWrap.appendChild(links.children[1]);
  }
  links.appendChild(scrollWrap);

  const closeBtn = header.querySelector('.nav__mobile-close');

  function closeMenu() {
    links.classList.remove('nav--open');
    backdrop.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  function openMenu() {
    links.classList.add('nav--open');
    backdrop.classList.add('active');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  closeBtn.addEventListener('click', closeMenu);
  backdrop.addEventListener('click', closeMenu);

  hamburger.addEventListener('click', () => {
    links.classList.contains('nav--open') ? closeMenu() : openMenu();
  });

  // Close when navigating (plain links inside drawer)
  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      // Small delay so any page transition can start first
      setTimeout(closeMenu, 80);
    });
  });

  // ── Hover-intent (desktop only) ───────────────────────────
  // Skip on touch/mobile — click-based accordion handles those
  const CLOSE_DELAY = 120;
  const isMobile = () => window.innerWidth <= 640;

  document.querySelectorAll('.nav__drop').forEach(drop => {
    let closeTimer = null;

    const openDrop = () => {
      if (isMobile()) return;
      clearTimeout(closeTimer);
      document.querySelectorAll('.nav__drop').forEach(d => {
        if (d !== drop) { d.classList.remove('open'); clearTimeout(d._closeTimer); }
      });
      drop.classList.add('open');
    };

    const closeDrop = () => {
      if (isMobile()) return;
      closeTimer = setTimeout(() => drop.classList.remove('open'), CLOSE_DELAY);
      drop._closeTimer = closeTimer;
    };

    drop.addEventListener('mouseenter', openDrop);
    drop.addEventListener('mouseleave', closeDrop);
  });

  // ── Click toggle (mobile accordion + keyboard fallback) ───
  document.querySelectorAll('.nav__drop-toggle').forEach(toggle => {
    toggle.addEventListener('click', e => {
      e.stopPropagation();
      const drop = toggle.closest('.nav__drop');
      const isOpen = drop.classList.toggle('open');
      // On desktop close siblings; on mobile keep accordion independent
      if (!isMobile()) {
        document.querySelectorAll('.nav__drop').forEach(d => {
          if (d !== drop) d.classList.remove('open');
        });
      }
    });
  });

  // Close desktop dropdowns when clicking outside
  document.addEventListener('click', e => {
    if (!e.target.closest('.nav__drop')) {
      document.querySelectorAll('.nav__drop').forEach(d => d.classList.remove('open'));
    }
  });
}

// ── EVENT DETAIL PAGE ─────────────────────────────────────
async function initEventPage() {
  const root = document.getElementById('js-event-root');
  if (!root) return;

  const params    = new URLSearchParams(window.location.search);
  const pathParts = window.location.pathname.replace(/^\//, '').split('/').filter(Boolean);
  // /biz-slug/event-slug  OR  /events/event-slug  OR  local ?b=&s=
  const isEventsPath = pathParts[0] === 'events';
  const sParam  = params.get('s')  || (pathParts.length >= 2 ? pathParts[pathParts.length - 1] : null);
  const bParam  = params.get('b')  || (pathParts.length >= 2 && !isEventsPath ? pathParts[0] : null);
  const idParam = params.get('id');

  let ev = sParam ? getEventBySlug(sParam) : idParam ? EVENTS.find(e => e.id === parseInt(idParam, 10)) : null;

  // Supabase fallback by slug
  if (!ev && sParam && typeof db !== 'undefined') {
    const { data } = await db.from('events').select('*').eq('slug', sParam).single();
    if (data) ev = data;
  }

  if (!ev) {
    root.innerHTML = '<p style="padding:2rem">Event not found. <a href="index.html">Go home</a></p>';
    return;
  }

  const biz = ev.businessId ? getBusinessById(ev.businessId) : (ev.business_id ? getBusinessById(ev.business_id) : null);
  const evSlug  = ev.slug || slugify(ev.title);
  const bizSlug = biz ? (biz.slug || slugify(biz.name + '-' + (biz.suburb || ''))) : null;
  const canonUrl = bizSlug ? `https://whattodogeelong.com.au/${bizSlug}/${evSlug}` : `https://whattodogeelong.com.au/events/${evSlug}`;

  document.title = `${ev.title} — What To Do Geelong`;
  injectSEOMeta({
    title:       `${ev.title} | ${ev.date} — ${ev.location}`,
    description: `${ev.title} on ${ev.date} at ${ev.location}. ${ev.price === 'Free' ? 'Free entry.' : ev.price + ' entry.'} Geelong events guide.`,
    canonical:   canonUrl,
    ogImage:     biz?.img || '',
    type:        'event',
    extra: `
      <script type="application/ld+json">${JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Event",
        "name": ev.title,
        "startDate": ev.date,
        "location": { "@type": "Place", "name": ev.location, "address": { "@type": "PostalAddress", "addressLocality": "Geelong", "addressRegion": "VIC", "addressCountry": "AU" } },
        "offers": { "@type": "Offer", "price": ev.price === 'Free' ? '0' : ev.price?.replace(/[^0-9.]/g, '') || '0', "priceCurrency": "AUD", "availability": "https://schema.org/InStock" },
        "organizer": biz ? { "@type": "Organization", "name": biz.name, "url": biz.website ? 'https://' + biz.website.replace(/^https?:\/\//, '') : '' } : undefined,
      })}<\/script>`,
  });

  const heroImg = biz?.img || ev.img || '';
  const urgency = getEventUrgency(ev);
  const isPast  = urgency === 'past';
  const isThisWeekend = urgency === 'today' || urgency === 'tomorrow' || urgency === 'soon' || (() => {
    // rough "this weekend" check
    const now = new Date();
    const day = now.getDay(); // 0=Sun,6=Sat
    const daysToFri = (5 - day + 7) % 7;
    const fri = new Date(now); fri.setDate(now.getDate() + daysToFri);
    const sun = new Date(fri);  sun.setDate(fri.getDate() + 2);
    const evDate = new Date(ev.date);
    return evDate >= fri && evDate <= sun;
  })();

  // Strip external source URLs (geelongcity.vic.gov.au etc.) — we don't link out to scraped sources
  const evUrl = ev.url && !ev.url.includes('geelongcity.vic.gov.au') ? ev.url : null;
  // Strip generic council descriptions
  const evDesc = ev.description && !ev.description.toLowerCase().includes('wide range of services to support life') ? ev.description : null;

  root.innerHTML = `
    <div class="ev-hero2${isPast ? ' ev-hero2--past' : ''}">
      <!-- Hero image / emoji background -->
      <div class="ev-hero2__img-wrap">
        ${heroImg
          ? `<img src="${heroImg}" alt="${ev.title}" class="ev-hero2__img" />`
          : `<div class="ev-hero2__img ev-hero2__img--emoji" style="background:${ev.color}22"><span>${ev.emoji}</span></div>`
        }
        ${isPast ? `<div class="ev-past-overlay"><span class="ev-past-badge">Past event</span></div>` : ''}

        <!-- Top-left: category badge -->
        <div class="ev-hero2__cat-badge">
          <span class="ev-hero2__cat-emoji">${ev.emoji}</span>
          <span>${ev.category}</span>
        </div>

        <!-- Top-right: actions -->
        <div class="ev-hero2__actions">
          ${!isPast ? `<button class="ev-hero2__action-btn star-btn" id="js-ev-save-btn" aria-label="Add to Guide">${wtdgIcon('heart', 20)}</button>` : ''}
          <button class="ev-hero2__action-btn" id="js-ev-share-btn" aria-label="Share">
            ${wtdgIcon('share', 20)}
          </button>
        </div>

      </div>

      <!-- Info card -->
      <div class="ev-hero2__card">
        <h1 class="ev-hero2__title">${ev.title}</h1>
        <div class="ev-hero2__meta">
          <span>${wtdgIcon('calendar', 16, 'var(--teal)')} ${ev.date}</span>
          ${ev.time ? `<span>${wtdgIcon('clock', 16, 'var(--teal)')} ${ev.time}</span>` : ''}
          <span>${wtdgIcon('location', 16, 'var(--teal)')} ${ev.location}</span>
        </div>
        ${!isPast ? `
        <div class="ev-hero2__price-row">
          <span class="ev-price ${ev.price === 'Free' ? 'ev-price--free' : ''}">${ev.price}</span>
          ${ev.price !== 'Free'
            ? `<a href="#" class="btn btn--teal btn--sm js-ticket-btn" data-event-title="${ev.title}" data-price="${ev.price}">${wtdgIcon('ticket', 16, '#fff')} Get Tickets</a>`
            : `<span class="btn btn--teal btn--sm">Free Entry</span>`}
          ${isThisWeekend ? `<span class="ev-hero2__weekend-pill">${wtdgIcon('weekend', 14, 'var(--teal)')} This weekend</span>` : ''}
        </div>` : `
        <div class="ev-hero2__price-row">
          <span class="ev-price ev-price--past">${ev.price}</span>
        </div>`}
      </div>
    </div>

    ${isPast ? `<div class="ev-past-banner"><span class="material-symbols-rounded">history</span> This event has already taken place</div>` : ''}

    <div class="container ev-body">
      ${evDesc ? `
        <div class="ev-description">
          <p>${evDesc}</p>
        </div>
      ` : ''}

      ${!isPast && evUrl ? `
        <div class="ev-cta-row">
          <a href="${evUrl}" target="_blank" rel="noopener" class="btn btn--teal">
            ${ev.price === 'Free' ? '📍 More info' : '🎟️ Get Tickets'}
          </a>
        </div>
      ` : ''}

      ${biz ? `
        <div class="ev-biz-card">
          <div class="ev-biz-card__label">Presented by</div>
          <a href="${bizLink(biz)}" class="ev-biz-link">
            <div class="ev-biz-link__avatar" style="background:${biz.color}22">${biz.emoji}</div>
            <div class="ev-biz-link__info">
              <span class="ev-biz-link__name">${biz.name}</span>
              <span class="ev-biz-link__type">${biz.type} · ${biz.suburb}</span>
            </div>
            <span class="material-symbols-rounded" style="color:var(--teal);margin-left:auto">chevron_right</span>
          </a>
          ${!isPast && biz.website ? `<a href="https://${biz.website}" target="_blank" rel="noopener" class="btn btn--outline btn--sm" style="margin-top:.5rem">🌐 Visit ${biz.website}</a>` : ''}
        </div>
      ` : ''}

      <div class="ev-also">
        <h2 class="ev-also__title">${isPast ? 'Coming up next' : 'More this weekend'}</h2>
        <div class="event-scroll" id="js-ev-also-scroll"></div>
      </div>

      ${getArticlesForEvent(ev.id).length ? `
        <div class="ev-also" style="margin-top:2rem">
          <h2 class="ev-also__title">From the Edit</h2>
          <div class="ed-scroll">
            ${getArticlesForEvent(ev.id).map(a => `<a href="${artLink(a)}" class="ed-mini-card"><div class="ed-mini-card__img" style="background-image:url('${a.heroImg}')"></div><div class="ed-mini-card__body">${articleTypeBadge(a.type)}<h4 class="ed-mini-card__title">${a.title}</h4></div></a>`).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;

  // Track this as a real page view (user has opened and is reading the event)
  if (window.wtdgViews) {
    window.wtdgViews.track(String(ev.id), 'event', ev.category);
  }

  // Wire save button
  const saveBtn = document.getElementById('js-ev-save-btn');
  if (saveBtn && typeof starItemToGuide === 'function') {
    const item = { id: String(ev.id), type: 'event', title: ev.title, emoji: ev.emoji, color: ev.color,
      date: ev.date, time: ev.time, location: ev.location, price: ev.price, slug: evSlug, lat: ev.lat, lng: ev.lng };
    saveBtn.addEventListener('click', async e => {
      e.preventDefault();
      await starItemToGuide(item, saveBtn);
      updateItinBadge();
      if (typeof trackSaveToGuide === 'function') trackSaveToGuide(item);
    });
  }

  // Wire ticket button tracking
  document.querySelector('.js-ticket-btn')?.addEventListener('click', function() {
    if (typeof trackTicketClick === 'function') {
      trackTicketClick(this.dataset.eventTitle, this.href, this.dataset.price);
    }
  });

  // Wire share button
  document.getElementById('js-ev-share-btn')?.addEventListener('click', () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: ev.title, url });
      if (typeof trackShare === 'function') trackShare('native_share', ev.title);
    } else {
      navigator.clipboard.writeText(url).then(() => alert('Link copied!'));
      if (typeof trackShare === 'function') trackShare('copy_link', ev.title);
    }
  });

  // Render other events in the strip — upcoming only, no past events
  const others = EVENTS.filter(e => e.id !== ev.id && getEventUrgency(e) !== 'past').slice(0, 6);
  const strip = document.getElementById('js-ev-also-scroll');
  if (strip) {
    strip.innerHTML = others.map(e => {
      const eIsFree = e.price === 'Free';
      return `
      <a href="${evLink(e)}" class="event-card">
        <div class="event-card__thumb" style="background:${e.color}22">${e.emoji}</div>
        <div class="event-card__body">
          <span class="event-card__cat">${e.category}</span>
          <h3 class="event-card__title">${e.title}</h3>
          <div class="event-card__meta">📍 ${e.location}</div>
          <div class="event-card__meta">🕐 ${e.time}</div>
          <button class="event-card__cta ${eIsFree ? 'event-card__cta--free' : ''}">${eIsFree ? 'Free Entry' : 'Get Tickets →'}</button>
        </div>
      </a>`;
    }).join('');
  }
}

// ── EVENTS SEE-ALL PAGE ───────────────────────────────────
// ── COLLECTION CARD BUILDER ───────────────────────────────
// collCard(href, bg, emoji, img, type, name, desc, loc, badge1, badge2, lat, lng, itemId, itemType)
// itemId + itemType are used for view tracking and view-count badges
function collCard(href, bg, emoji, img, type, name, desc, loc, badge1, badge2, lat, lng, itemId, itemType, itemTags) {
  const prefs    = getPrefs();
  const fakeItem = { type, category: type, tags: itemTags || [] };
  const isMatch  = prefsMatchCard(fakeItem, prefs);
  const isGold   = itemType === 'business' && !!(BUSINESSES.find(b => b.id === itemId)?.isGold);
  const thumb = img
    ? `<img src="${img}" alt="${name}" class="coll-card__img" loading="lazy" />`
    : `<div class="coll-card__img-placeholder" style="background:${bg}22">${emoji}</div>`;
  const latAttr  = (lat  && lng)      ? ` data-lat="${lat}" data-lng="${lng}"` : '';
  const trackAttr = (itemId && itemType) ? ` data-id="${itemId}" data-type="${itemType}"` : '';
  const goldBadge = isGold ? `<span class="coll-card__gold-badge">⭐ Gold</span>` : '';
  return `
    <a href="${href}" class="coll-card${isMatch ? ' coll-card--match' : ''}${isGold ? ' coll-card--gold' : ''}"${latAttr}${trackAttr}>
      ${thumb}
      <div class="coll-card__body">
        <div class="coll-card__type-row">
          <div class="coll-card__type">${type}</div>
          ${isMatch ? `<span class="ev-card__match">✦ Your vibe</span>` : ''}
          ${goldBadge}
        </div>
        <div class="coll-card__name">${name}</div>
        <div class="coll-card__desc">${desc || ''}</div>
        <div class="coll-card__foot">
          <span class="coll-card__loc"><span class="material-symbols-rounded" style="font-size:.85rem;vertical-align:-.1em">location_on</span> ${loc || ''}</span>
          <div class="coll-card__badges">
            ${badge1 ? `<span class="biz-badge biz-badge--event">${badge1}</span>` : ''}
            ${badge2 ? `<span class="biz-badge biz-badge--promo">${badge2}</span>` : ''}
          </div>
        </div>
      </div>
    </a>`;
}

// ── FILTER ALIASES ────────────────────────────────────────
// Maps URL param values → pill data-filter values
// Handles accents, plurals, legacy slugs, and clean-URL slugs
const FILTER_ALIASES = {
  // eat
  'cafe': 'café', 'cafes': 'café', 'coffee': 'café',
  'restaurants': 'restaurant',
  'bars': 'bar',
  'bakeries': 'bakery',
  'brunch': 'brunch',
  'asian': 'asian',
  // drink
  'breweries': 'brewery', 'brewery': 'brewery',
  'wineries': 'winery', 'winery': 'winery',
  'pubs': 'pub',
  'cocktails': 'cocktail',
  // do
  'activities': 'activity',
  'attractions': 'attraction',
  'arts': 'art', 'culture': 'art',
  'outdoors': 'nature', 'outdoor': 'nature',
  'sport': 'sport', 'sports': 'sport',
  'adventure': 'adventure',
  'family': 'family',
  'wellness': 'wellness', 'spas': 'wellness', 'spa': 'wellness',
};

function normaliseFilter(raw) {
  if (!raw || raw === 'all') return 'all';
  const lower = raw.toLowerCase().trim();
  return FILTER_ALIASES[lower] || lower;
}

// ── SEO META PER FILTER ───────────────────────────────────
const FILTER_SEO = {
  'eat': {
    all:        { title: 'Where to Eat in Geelong | What To Do Geelong', desc: 'The best restaurants, cafes, bakeries and bars in Geelong. Browse our curated guide to eating out in Geelong.' },
    'café':     { title: 'Best Cafes in Geelong | What To Do Geelong', desc: 'Find the best cafes in Geelong for great coffee, brunch and all-day dining. Local favourites and hidden gems.' },
    brunch:     { title: 'Best Brunch in Geelong | What To Do Geelong', desc: 'The top spots for brunch in Geelong — from big breakfast to eggs benny and weekend specials.' },
    restaurant: { title: 'Best Restaurants in Geelong | What To Do Geelong', desc: 'Geelong\'s best restaurants for dinner and lunch. Fine dining to casual, all locally reviewed.' },
    bar:        { title: 'Best Bars in Geelong | What To Do Geelong', desc: 'Top bars in Geelong for a great drink. Cocktail bars, wine bars, and great pub vibes.' },
    bakery:     { title: 'Best Bakeries in Geelong | What To Do Geelong', desc: 'Fresh bread, pastries and coffee — the best bakeries in Geelong.' },
    pizza:      { title: 'Best Pizza in Geelong | What To Do Geelong', desc: 'Wood-fired, sourdough, and classic — the best pizza restaurants in Geelong.' },
    asian:      { title: 'Best Asian Restaurants Geelong | What To Do Geelong', desc: 'Japanese, Thai, Chinese, Korean and more — the best Asian restaurants in Geelong.' },
  },
  'drink': {
    all:      { title: 'Bars, Pubs & Breweries in Geelong | What To Do Geelong', desc: 'Your guide to drinking in Geelong — bars, pubs, breweries, wineries and more.' },
    brewery:  { title: 'Geelong Breweries | What To Do Geelong', desc: 'The best craft breweries in Geelong and the Bellarine Peninsula. Local beers, tasting paddles and brewery tours.' },
    winery:   { title: 'Bellarine Peninsula Wineries | What To Do Geelong', desc: 'Discover the best wineries on the Bellarine Peninsula near Geelong. Cellar doors, tastings and vineyard dining.' },
    bar:      { title: 'Best Bars in Geelong | What To Do Geelong', desc: 'Cocktail bars, wine bars and great evenings out in Geelong.' },
    pub:      { title: 'Best Pubs in Geelong | What To Do Geelong', desc: 'The best pubs in Geelong for a cold beer, parma and Sunday session.' },
    cocktail: { title: 'Best Cocktail Bars Geelong | What To Do Geelong', desc: 'Geelong\'s best cocktail bars — from low-key to late night.' },
  },
  'do': {
    all:        { title: 'Things to Do in Geelong | What To Do Geelong', desc: 'The best things to do in Geelong and the Surf Coast. Activities, attractions, arts and outdoor adventures.' },
    activity:   { title: 'Activities in Geelong | What To Do Geelong', desc: 'Fun activities in Geelong for all ages — indoors and outdoors.' },
    attraction: { title: 'Geelong Attractions | What To Do Geelong', desc: 'Top tourist attractions in Geelong. Waterfront, galleries, museums and day-trip destinations.' },
    adventure:  { title: 'Adventure Activities Geelong | What To Do Geelong', desc: 'Adventure and outdoor activities in and around Geelong — surfing, kayaking, climbing and more.' },
    art:        { title: 'Arts & Culture Geelong | What To Do Geelong', desc: 'Geelong\'s arts and culture scene — galleries, theatres, live music venues and cultural landmarks.' },
    sport:      { title: 'Sport & Leisure in Geelong | What To Do Geelong', desc: 'Sporting activities and spectator sport in Geelong. Gyms, pools, golf and the Cats.' },
    nature:     { title: 'Outdoor Activities Geelong | What To Do Geelong', desc: 'Nature and outdoor activities near Geelong — walks, parks, beaches and the You Yangs.' },
    wellness:   { title: 'Day Spas & Wellness in Geelong | What To Do Geelong', desc: 'Day spas, wellness retreats and relaxation in Geelong. Massages, yoga and health studios.' },
    family:     { title: 'Family Activities in Geelong | What To Do Geelong', desc: 'The best family-friendly activities in Geelong for kids and adults. Fun for all ages.' },
  },
  'stay': {
    all: { title: 'Where to Stay in Geelong | What To Do Geelong', desc: 'Find the best accommodation in Geelong — hotels, holiday rentals, boutique stays and B&Bs.' },
  },
};

const SITE_URL = 'https://whattodogeelong.com.au';

// ── CLEAN URL MAP ─────────────────────────────────────────
// Maps page+filter → clean canonical path
const CLEAN_URL_MAP = {
  'eat-café':       '/eat/cafes',
  'eat-brunch':     '/eat/brunch',
  'eat-restaurant': '/eat/restaurants',
  'eat-bar':        '/eat/bars',
  'eat-bakery':     '/eat/bakeries',
  'eat-pizza':      '/eat/pizza',
  'eat-asian':      '/eat/asian',
  'drink-brewery':  '/drink/breweries',
  'drink-winery':   '/drink/wineries',
  'drink-bar':      '/drink/bars',
  'drink-pub':      '/drink/pubs',
  'drink-cocktail': '/drink/cocktails',
  'do-activity':    '/do/activities',
  'do-attraction':  '/do/attractions',
  'do-adventure':   '/do/adventure',
  'do-art':         '/do/arts',
  'do-sport':       '/do/sport',
  'do-nature':      '/do/outdoors',
  'do-wellness':    '/do/wellness',
  'do-family':      '/do/family',
};

function applyFilterSEO(page, filter) {
  const pageMeta  = FILTER_SEO[page] || {};
  const meta      = pageMeta[filter] || pageMeta['all'] || null;
  if (!meta) return;

  document.title = meta.title;
  const setMeta = (sel, attr, val) => {
    let el = document.querySelector(sel);
    if (!el) { el = document.createElement('meta'); document.head.appendChild(el); }
    el.setAttribute(attr, val);
  };
  setMeta('meta[name="description"]',        'content', meta.desc);
  setMeta('meta[property="og:title"]',       'content', meta.title);
  setMeta('meta[property="og:description"]', 'content', meta.desc);

  // Canonical — prefer clean URL
  const cleanPath = filter === 'all' ? `/${page}` : (CLEAN_URL_MAP[`${page}-${filter}`] || `/${page}?filter=${encodeURIComponent(filter)}`);
  const canonical = `${SITE_URL}${cleanPath}`;
  let linkEl = document.querySelector('link[rel="canonical"]');
  if (!linkEl) { linkEl = document.createElement('link'); linkEl.rel = 'canonical'; document.head.appendChild(linkEl); }
  linkEl.href = canonical;
  setMeta('meta[property="og:url"]', 'content', canonical);
}

function collFilter(items, filterEl, searchEl, countEl, renderFn, pageKey) {
  // Read filter from URL — check pathname slug first (/drink/breweries),
  // then fall back to ?filter= query param (legacy links / direct navigation)
  function filterFromUrl() {
    const parts = window.location.pathname.replace(/\/$/, '').split('/').filter(Boolean);
    // e.g. ['drink', 'breweries'] → slug = 'breweries'
    if (parts.length >= 2) {
      const slug = normaliseFilter(parts[parts.length - 1]);
      if (slug && slug !== 'all') return slug;
    }
    const qp = new URLSearchParams(window.location.search).get('filter');
    return normaliseFilter(qp) || 'all';
  }

  let activeFilter = filterFromUrl();
  let searchQ        = '';

  function render() {
    const prefs = getPrefs();
    let filtered = items.filter(item => {
      // Match filter pill against type/category/categories[] AND tags[]
      const typeHay = (item.type || item.category || '').toLowerCase();
      const catsHay = (item.categories || []).map(c => c.toLowerCase());
      const tagsHay = (item.tags || []).map(t => t.toLowerCase());
      const matchFilter = activeFilter === 'all'
        || typeHay.includes(activeFilter)
        || catsHay.some(c => c.includes(activeFilter))
        || tagsHay.some(t => t.includes(activeFilter));
      const matchSearch = !searchQ ||
        (item.name  || item.title || '').toLowerCase().includes(searchQ) ||
        (item.description || item.subtitle || '').toLowerCase().includes(searchQ) ||
        (item.suburb || item.location || '').toLowerCase().includes(searchQ) ||
        (item.tags || []).some(t => t.toLowerCase().includes(searchQ));
      return matchFilter && matchSearch;
    });
    // Sort: admin priority first, then pref-matched
    filtered.sort((a, b) => (b.adminPriority || 0) - (a.adminPriority || 0));
    if (prefs.interests?.length) {
      filtered = [
        ...filtered.filter(i => prefsMatchCard(i, prefs)),
        ...filtered.filter(i => !prefsMatchCard(i, prefs)),
      ];
    }
    if (countEl) countEl.textContent = `${filtered.length} result${filtered.length !== 1 ? 's' : ''}`;
    return filtered;
  }

  function setActive(filter) {
    activeFilter = filter;

    // Update pill active state
    if (filterEl) {
      filterEl.querySelectorAll('.coll-filter-pill').forEach(p => {
        p.classList.toggle('active', p.dataset.filter === filter);
      });
    }

    // Push clean URL to history (no page reload)
    if (pageKey) {
      const cleanPath = filter === 'all'
        ? `/${pageKey}`
        : (CLEAN_URL_MAP[`${pageKey}-${filter}`] || `/${pageKey}?filter=${encodeURIComponent(filter)}`);
      history.pushState({ filter }, '', cleanPath);
      applyFilterSEO(pageKey, filter);
    }

    renderFn(render());
  }

  // Apply initial filter from URL param — activate matching pill
  if (activeFilter !== 'all' && filterEl) {
    const matchPill = filterEl.querySelector(`.coll-filter-pill[data-filter="${activeFilter}"]`);
    if (matchPill) {
      filterEl.querySelectorAll('.coll-filter-pill').forEach(p => p.classList.remove('active'));
      matchPill.classList.add('active');
    } else {
      activeFilter = 'all';
    }
  }

  // Personalisation subtitle + optional filter suggestion
  const _prefs = getPrefs();
  if ((_prefs.interests?.length || _prefs.group) && filterEl) {
    const groupLabel = { family: 'families', couple: 'couples', friends: 'groups', solo: 'solo' }[_prefs.group] || null;
    const interestLabels = (_prefs.interests || []).slice(0, 3).map(i => i.replace('_', ' '));
    const parts = [...(groupLabel ? [groupLabel] : []), ...interestLabels];
    const matchCount = items.filter(i => prefsMatchCard(i, _prefs)).length;

    const sub = document.createElement('p');
    sub.className = 'weekend-personalised-sub';
    sub.innerHTML = `
      <span class="wps__row">
        <span class="wps__spark">✦</span>
        <span class="wps__label">Sorted for <strong>${parts.join(' · ')}</strong></span>
        <a href="onboarding.html" class="wps__edit">edit</a>
      </span>
      ${matchCount ? `<span class="wps__count">${matchCount} match${matchCount !== 1 ? 'es' : ''} up first</span>` : ''}
    `;
    filterEl.closest('.coll-topbar')?.insertAdjacentElement('afterend', sub);

    // Also suggest a specific filter if one maps to their interests
    if (activeFilter === 'all' && pageKey) {
      showPrefsHint(filterEl, _prefs, pageKey, (f) => { setActive(f); });
    }
  }

  // Apply initial SEO meta
  if (pageKey) applyFilterSEO(pageKey, activeFilter);

  if (filterEl) {
    filterEl.querySelectorAll('.coll-filter-pill').forEach(pill => {
      pill.addEventListener('click', () => setActive(pill.dataset.filter));
    });
  }
  if (searchEl) {
    searchEl.addEventListener('input', () => {
      searchQ = searchEl.value.toLowerCase().trim();
      renderFn(render());
    });
  }

  // Handle browser back/forward
  window.addEventListener('popstate', e => {
    const f = filterFromUrl();
    activeFilter = f;
    if (filterEl) {
      filterEl.querySelectorAll('.coll-filter-pill').forEach(p => p.classList.toggle('active', p.dataset.filter === f));
    }
    if (pageKey) applyFilterSEO(pageKey, f);
    renderFn(render());
  });

  renderFn(render());
}

function initEventsPage() {
  const root = document.getElementById('js-events-root');
  if (!root) return;

  // Happening today strip
  renderHappeningToday();

  let showPast      = false;
  let calFilterRange = null; // { start: Date, end: Date } | null

  // ── Past events toggle ─────────────────────────────────
  const pastToggle = document.getElementById('js-past-toggle');
  if (pastToggle) {
    pastToggle.addEventListener('click', () => {
      showPast = !showPast;
      pastToggle.textContent = showPast ? 'Hide past events' : 'Show past events';
      pastToggle.classList.toggle('active', showPast);
      doRender();
    });
  }

  // ── Parse URL date params early so calendar can pre-select ──
  const _urlP    = new URLSearchParams(window.location.search);
  const _urlFrom = _urlP.get('from');
  const _urlTo   = _urlP.get('to');
  if (_urlFrom) {
    const fromDate = new Date(_urlFrom + 'T00:00:00');
    const toDate   = _urlTo ? new Date(_urlTo + 'T00:00:00') : new Date(fromDate);
    calFilterRange = { start: fromDate, end: toDate };
  }

  // ── Calendar init — pass initial range so it pre-selects visually ──
  initEventCalendar(range => {
    calFilterRange = range;
    doRender();
  }, calFilterRange);

  // ── Category filter pills + search ─────────────────────
  const filterEl = document.getElementById('js-events-filters');
  const searchEl = document.getElementById('js-events-search');
  let activeFilter = 'all', searchQ = '';

  if (filterEl) {
    filterEl.querySelectorAll('.coll-filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        filterEl.querySelectorAll('.coll-filter-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        activeFilter = pill.dataset.filter;
        doRender();
      });
    });
  }
  if (searchEl) {
    searchEl.addEventListener('input', () => { searchQ = searchEl.value.trim().toLowerCase(); doRender(); });
  }

  // ── Single unified doRender — always reads fresh from EVENTS ──
  // Category filter, date range filter, and search all applied here
  // so they compose correctly regardless of the order they're changed.
  function doRender() {
    let items = [...EVENTS];

    // 1. Category + search filter
    if (activeFilter !== 'all' || searchQ) {
      items = items.filter(ev => {
        const matchCat = activeFilter === 'all' ||
          (ev.category || '').toLowerCase().includes(activeFilter);
        const matchQ = !searchQ || [ev.title, ev.location, ev.category]
          .some(f => (f || '').toLowerCase().includes(searchQ));
        return matchCat && matchQ;
      });
    }

    // 2. Calendar range filter
    if (calFilterRange) {
      const { start, end } = calFilterRange;
      const endDay = new Date(end); endDay.setHours(23,59,59,999);
      items = items.filter(ev => {
        const d = parseEventDate(ev.date);
        return d && d >= start && d <= endDay;
      });
    }

    // 3. Sort — upcoming first, past at bottom
    const today = new Date(); today.setHours(0,0,0,0);
    items.sort((a, b) => {
      const da = parseEventDate(a.date) || new Date(9999,0,1);
      const db = parseEventDate(b.date) || new Date(9999,0,1);
      const pastA = da < today, pastB = db < today;
      if (pastA !== pastB) return pastA ? 1 : -1;
      return da - db;
    });

    const upcoming = items.filter(ev => getEventUrgency(ev) !== 'past');
    const past     = items.filter(ev => getEventUrgency(ev) === 'past');
    const count    = upcoming.length + (showPast ? past.length : 0);

    const countEl = document.getElementById('js-events-count');
    if (countEl) countEl.textContent = `${count} result${count !== 1 ? 's' : ''}`;

    root.innerHTML = upcoming.length || (showPast && past.length)
      ? `<div class="ev-grid">
          ${upcoming.map(ev => eventGridCard(ev, {})).join('')}
          ${showPast && past.length ? `
            <div class="ev-grid__past-divider">Past events</div>
            ${past.map(ev => eventGridCard(ev, { showPast: true })).join('')}
          ` : ''}
        </div>`
      : `<div class="coll-empty"><span class="material-symbols-rounded" style="font-size:2.5rem">search_off</span><p>No events match your filters.</p></div>`;

    if (window.wtdgLocation) window.wtdgLocation.refreshDistanceBadges();
    if (window.wtdgViews && isAdminUser()) window.wtdgViews.injectViewBadges('event');
    injectPriorityControls('event');
  }

  // ── URL date banner (range already set above) ──────────
  if (_urlFrom && calFilterRange) {
    const { start, end } = calFilterRange;
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const label  = start.toDateString() === end.toDateString()
      ? `${start.getDate()} ${MONTHS[start.getMonth()]}`
      : `${start.getDate()}–${end.getDate()} ${MONTHS[end.getMonth()]}`;

    const bannerEl = document.getElementById('js-events-date-banner');
    if (bannerEl) {
      bannerEl.innerHTML = `<span class="date-pill" style="font-size:.85rem">📅 ${label}</span> <button class="gw-link" id="js-events-clear-date" style="font-size:.8rem">Clear</button>`;
      bannerEl.hidden = false;
      document.getElementById('js-events-clear-date')?.addEventListener('click', () => {
        bannerEl.hidden = true;
        calFilterRange = null;
        doRender();
        history.replaceState(null, '', window.location.pathname);
      });
    }
  }

  if (window.wtdgLocation) window.wtdgLocation.injectLocationButton('js-events-loc');

  // ── Initial render ──────────────────────────────────────
  doRender();
}

// ── EVENTS IN COLLECTION SECTION ──────────────────────────
const SECTION_CATEGORIES = {
  eat:   ['food & drink', 'markets', 'festival'],
  drink: ['music', 'food & drink', 'nightlife', 'festival'],
  do:    ['arts & culture', 'sport', 'theatre', 'family', 'education', 'markets', 'festival'],
  stay:  ['festival', 'markets', 'sport'],
};

function renderSectionEvents(sectionKey) {
  const el = document.getElementById(`js-${sectionKey}-events`);
  if (!el) return;
  const cats = SECTION_CATEGORIES[sectionKey] || [];
  const today = new Date(); today.setHours(0,0,0,0);
  const matching = EVENTS.filter(ev => {
    const d = parseEventDate(ev.date);
    if (!d || d < today) return false;
    return cats.some(c => (ev.category || '').toLowerCase().includes(c));
  }).sort((a, b) => (parseEventDate(a.date) || 0) - (parseEventDate(b.date) || 0)).slice(0, 6);

  if (!matching.length) { el.hidden = true; return; }
  el.hidden = false;
  el.innerHTML = `
    <div class="section-events">
      <div class="section-events__hdr">
        <h2 class="section-events__title"><span class="material-symbols-rounded">event</span> What's On</h2>
        <a href="events.html" class="section-events__more">All events →</a>
      </div>
      <div class="section-events__grid">
        ${matching.map(ev => eventGridCard(ev, { compact: true, accentColor: ev.color || '#4ac8d0' })).join('')}
      </div>
    </div>`;
}

// ── EAT COLLECTION PAGE ───────────────────────────────────
function initEatPage() {
  const root = document.getElementById('js-eat-root');
  if (!root) return;

  const eatBiz = BUSINESSES.filter(b => (b.sections?.length ? b.sections.includes('eat') : b.section === 'eat'));

  function renderEat(items) {
    root.innerHTML = items.length ? items.map(biz => {
      return collCard(
        bizLink(biz), biz.color || '#4ac8d0', biz.emoji || '🍽️',
        biz.img || null,
        biz.type,
        biz.name,
        biz.description,
        biz.suburb || biz.location,
        businessHasUpcoming(biz.id) ? 'Event' : null,
        businessHasPromo(biz.id) ? 'Offer' : null,
        biz.lat, biz.lng,
        biz.id, 'business', biz.tags
      );
    }).join('') : `<div class="coll-empty"><span class="material-symbols-rounded" style="font-size:2.5rem">search_off</span><p>No results match your search.</p></div>`;
    if (window.wtdgLocation) window.wtdgLocation.refreshDistanceBadges();
    if (window.wtdgViews && isAdminUser()) window.wtdgViews.injectViewBadges('business');
    injectPriorityControls('business');
  }

  collFilter(
    eatBiz,
    document.getElementById('js-eat-filters'),
    document.getElementById('js-eat-search'),
    document.getElementById('js-eat-count'),
    renderEat,
    'eat'
  );
  if (window.wtdgLocation) window.wtdgLocation.injectLocationButton('js-eat-loc');
  renderSectionEvents('eat');
}

// ── DRINK COLLECTION PAGE ─────────────────────────────────
function initDrinkPage() {
  const root = document.getElementById('js-drink-root');
  if (!root) return;

  const drinkBiz = BUSINESSES.filter(b => (b.sections?.length ? b.sections.includes('drink') : b.section === 'drink'));

  function renderDrink(items) {
    root.innerHTML = items.length ? items.map(biz => {
      return collCard(
        bizLink(biz), biz.color || '#f4a261', biz.emoji || '🍺',
        biz.img || null,
        biz.type,
        biz.name,
        biz.description,
        biz.suburb || biz.location,
        businessHasUpcoming(biz.id) ? 'Event' : null,
        businessHasPromo(biz.id) ? 'Offer' : null,
        biz.lat, biz.lng,
        biz.id, 'business', biz.tags
      );
    }).join('') : `<div class="coll-empty"><span class="material-symbols-rounded" style="font-size:2.5rem">search_off</span><p>No results match your search.</p></div>`;
    if (window.wtdgLocation) window.wtdgLocation.refreshDistanceBadges();
    if (window.wtdgViews && isAdminUser()) window.wtdgViews.injectViewBadges('business');
    injectPriorityControls('business');
  }

  collFilter(
    drinkBiz,
    document.getElementById('js-drink-filters'),
    document.getElementById('js-drink-search'),
    document.getElementById('js-drink-count'),
    renderDrink,
    'drink'
  );
  if (window.wtdgLocation) window.wtdgLocation.injectLocationButton('js-drink-loc');
  renderSectionEvents('drink');
}

// ── DO / ACTIVITIES COLLECTION PAGE ───────────────────────
function initDoPage() {
  const root = document.getElementById('js-do-root');
  if (!root) return;

  const doBiz = BUSINESSES.filter(b => (b.sections?.length ? b.sections.includes('do') : b.section === 'do'));

  function renderDo(items) {
    root.innerHTML = items.length ? items.map(biz => {
      return collCard(
        bizLink(biz), biz.color || '#2a9d8f', biz.emoji || '🎯',
        biz.img || null,
        biz.type,
        biz.name,
        biz.description,
        biz.suburb || biz.location,
        businessHasUpcoming(biz.id) ? 'Event' : null,
        businessHasPromo(biz.id) ? 'Offer' : null,
        biz.lat, biz.lng,
        biz.id, 'business', biz.tags
      );
    }).join('') : `<div class="coll-empty"><span class="material-symbols-rounded" style="font-size:2.5rem">search_off</span><p>No results match your search.</p></div>`;
    if (window.wtdgLocation) window.wtdgLocation.refreshDistanceBadges();
    if (window.wtdgViews && isAdminUser()) window.wtdgViews.injectViewBadges('business');
    injectPriorityControls('business');
  }

  collFilter(
    doBiz,
    document.getElementById('js-do-filters'),
    document.getElementById('js-do-search'),
    document.getElementById('js-do-count'),
    renderDo,
    'do'
  );
  if (window.wtdgLocation) window.wtdgLocation.injectLocationButton('js-do-loc');
  renderSectionEvents('do');
}

// ── STAY COLLECTION PAGE ──────────────────────────────────
function initStayPage() {
  const root = document.getElementById('js-stay-root');
  if (!root) return;

  function renderStay(items) {
    root.innerHTML = items.length ? items.map(s => {
      return collCard(
        bizLink(s), s.color || '#4ac8d0', s.emoji || '🛏️',
        s.img || null,
        s.type,
        s.name,
        s.description || `${s.stars || ''} · ${s.price || ''}`.trim().replace(/^· |· $/, ''),
        s.suburb || s.location,
        null, null,
        s.lat, s.lng,
        s.id, 'stay'
      );
    }).join('') : `<div class="coll-empty"><span class="material-symbols-rounded" style="font-size:2.5rem">search_off</span><p>No results match your search.</p></div>`;
    if (window.wtdgLocation) window.wtdgLocation.refreshDistanceBadges();
    if (window.wtdgViews && isAdminUser()) window.wtdgViews.injectViewBadges('stay');
  }

  collFilter(
    STAYS,
    document.getElementById('js-stay-filters'),
    document.getElementById('js-stay-search'),
    document.getElementById('js-stay-count'),
    renderStay
  );
  if (window.wtdgLocation) window.wtdgLocation.injectLocationButton('js-stay-loc');
  renderSectionEvents('stay');
}

// ── STAY SEE-ALL PAGE (legacy stub) ──────────────────────
function _initStayPage_old() {
  const root = document.getElementById('js-stay-root');
  if (!root) return;

  root.innerHTML = STAYS.map(s => `
    <div class="stay-list-card">
      ${s.img ? `<img src="${s.img}" alt="${s.name}" class="stay-list-card__img" loading="lazy" />` : `<div class="stay-list-card__img" style="background:${s.color}22;display:flex;align-items:center;justify-content:center;font-size:2.5rem">${s.emoji}</div>`}
      <div class="stay-list-card__body">
        <span class="stay-list-card__type">${s.type}</span>
        <h3 class="stay-list-card__name">${s.name}</h3>
        <span class="stay-list-card__loc">📍 ${s.location}</span>
        <span class="stay-list-card__stars">${s.stars}</span>
        <div class="stay-list-card__price"><strong>${s.price}</strong> / night</div>
        <a href="#" class="btn btn--teal btn--sm" style="margin-top:.5rem">Book Now →</a>
      </div>
    </div>
  `).join('');
}

// ── ROTATING BANNER (datebar) ─────────────────────────────
function initRotatingBanner() {
  const ticker = document.getElementById('js-datebar-ticker');
  if (!ticker) return;

  const items = ARTICLES.slice(0, 6);
  let current = 0;

  const typeIcon = { guide: 'menu_book', news: 'newspaper', history: 'history_edu' };

  function buildItems() {
    ticker.innerHTML = items.map((a, i) => `
      <a href="${artLink(a)}" class="ticker-item${i === 0 ? ' ticker-item--active' : ''}">
        <span class="material-symbols-rounded ticker-item__icon">${typeIcon[a.type] || 'article'}</span>
        <span class="ticker-item__text">${a.title}</span>
        <span class="ticker-item__cta">Read →</span>
      </a>
    `).join('');
  }

  buildItems();

  setInterval(() => {
    const els = ticker.querySelectorAll('.ticker-item');
    els[current].classList.remove('ticker-item--active');
    current = (current + 1) % items.length;
    els[current].classList.add('ticker-item--active');
  }, 4000);
}

// ── ADSENSE POPUP — replaced by Premier sheet fallback ───

// ── EDITORIAL HUB PAGE ────────────────────────────────────
function initEditorialPage() {
  const root = document.getElementById('js-editorial-root');
  if (!root) return;

  const filterBtns = document.querySelectorAll('[data-filter]');
  let activeFilter = 'all';

  function render(filter) {
    const filtered = filter === 'all' ? ARTICLES : ARTICLES.filter(a => a.type === filter);
    root.innerHTML = filtered.map(a => `
      <a href="${artLink(a)}" class="ed-card" data-id="${a.id}" data-type="article">
        <div class="ed-card__img" style="background-image:url('${a.heroImg}')"></div>
        <div class="ed-card__body">
          ${articleTypeBadge(a.type)}
          <h3 class="ed-card__title">${a.title}</h3>
          <p class="ed-card__excerpt">${a.excerpt}</p>
          <div class="ed-card__foot">
            <span class="ed-card__author">${a.author}</span>
            <span class="ed-card__date">${formatArticleDate(a.publishedAt)}</span>
          </div>
        </div>
      </a>
    `).join('');
    // Show view counts on article cards after render
    if (window.wtdgViews && isAdminUser()) window.wtdgViews.injectViewBadges('article');
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('chip--active'));
      btn.classList.add('chip--active');
      activeFilter = btn.dataset.filter;
      render(activeFilter);
    });
  });

  render(activeFilter);
}

// ── ARTICLE DETAIL PAGE ───────────────────────────────────
function initArticlePage() {
  const root = document.getElementById('js-article-root');
  if (!root) return;

  const params    = new URLSearchParams(window.location.search);
  const pathParts = window.location.pathname.replace(/^\//, '').split('/').filter(Boolean);
  // /news/article-slug  OR  local ?s=
  const sParam  = params.get('s') || (pathParts[0] === 'news' && pathParts[1] ? pathParts[1] : null);
  const idParam = params.get('id');
  const article = sParam ? getArticleBySlug(sParam) : getArticleById(idParam);

  if (!article) {
    root.innerHTML = '<p style="padding:3rem 1rem">Article not found. <a href="editorial.html">Back to editorial</a></p>';
    return;
  }

  const artSlug  = article.slug || article.id;
  const canonUrl = `https://whattodogeelong.com.au/news/${artSlug}`;
  document.title = `${article.title} — What To Do Geelong`;
  injectSEOMeta({
    title:       article.title,
    description: article.excerpt || article.title,
    canonical:   canonUrl,
    ogImage:     article.heroImg || '',
    type:        'article',
  });

  const relBiz = (article.businessIds || []).map(getBusinessById).filter(Boolean);
  const relEvents = (article.eventIds || []).map(id => EVENTS.find(e => e.id === id)).filter(Boolean);

  // Split content at ~halfway to inject an inline ad
  const contentHtml = article.content || '';
  const splitPoint = contentHtml.indexOf('</p>', contentHtml.indexOf('</p>') + 1) + 4;
  const part1 = splitPoint > 4 ? contentHtml.slice(0, splitPoint) : contentHtml;
  const part2 = splitPoint > 4 ? contentHtml.slice(splitPoint) : '';

  const inlineAd = `
    <div class="art-ad-unit">
      <p class="art-ad-label">Advertisement</p>
      <!-- AdSense Inline Ad — replace data-ad-slot with your slot ID from AdSense console -->
      <ins class="adsbygoogle"
           style="display:block;text-align:center"
           data-ad-layout="in-article"
           data-ad-format="fluid"
           data-ad-client="ca-pub-7991778555943890"
           data-ad-slot="INLINE_SLOT_ID"></ins>
      <script>(adsbygoogle = window.adsbygoogle || []).push({});<\/script>
    </div>
  `;

  root.innerHTML = `
    <div class="art-hero" style="background-image:url('${article.heroImg}')">
      <div class="art-hero__overlay"></div>
      <div class="container art-hero__content">
        <a href="editorial.html" class="art-back">← Editorial</a>
        ${articleTypeBadge(article.type)}
        <h1 class="art-hero__title">${article.title}</h1>
        <div class="art-hero__meta">
          <span>${article.author}</span>
          <span>·</span>
          <span>${formatArticleDate(article.publishedAt)}</span>
        </div>
      </div>
    </div>

    ${article.type === 'history' && article.beforeImg ? `
    <div class="container art-before-after">
      <div class="baf-grid">
        <div class="baf-item">
          <img src="${article.beforeImg}" alt="Then" class="baf-item__img" loading="lazy" />
          <span class="baf-item__label">Then</span>
        </div>
        <div class="baf-item">
          <img src="${article.afterImg}" alt="Now" class="baf-item__img" loading="lazy" />
          <span class="baf-item__label">Now</span>
        </div>
      </div>
    </div>
    ` : ''}

    <div class="container art-body">
      <div class="art-content">
        ${part1}
        ${inlineAd}
        ${part2}
      </div>

      ${relBiz.length ? `
        <div class="art-related">
          <h2 class="art-related__title"><span class="material-symbols-rounded">storefront</span> Related Businesses</h2>
          <div class="art-related__grid">
            ${relBiz.map(biz => `
              <a href="${bizLink(biz)}" class="art-biz-chip">
                <div class="art-biz-chip__avatar" style="background:${biz.color}22">${biz.emoji}</div>
                <div>
                  <span class="art-biz-chip__name">${biz.name}</span>
                  <span class="art-biz-chip__type">${biz.type}</span>
                </div>
                <span class="material-symbols-rounded" style="margin-left:auto;color:var(--teal)">chevron_right</span>
              </a>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${relEvents.length ? `
        <div class="art-related">
          <h2 class="art-related__title"><span class="material-symbols-rounded">event</span> Related Events</h2>
          <div class="art-related__grid">
            ${relEvents.map(ev => `
              <a href="${evLink(ev)}" class="art-biz-chip">
                <div class="art-biz-chip__avatar" style="background:${ev.color}22">${ev.emoji}</div>
                <div>
                  <span class="art-biz-chip__name">${ev.title}</span>
                  <span class="art-biz-chip__type">${ev.date} · ${ev.location}</span>
                </div>
                <span class="material-symbols-rounded" style="margin-left:auto;color:var(--teal)">chevron_right</span>
              </a>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>

    <div class="art-more-section">
      <div class="container">
        <h2 class="section-title" style="margin-bottom:1rem"><span class="material-symbols-rounded">auto_stories</span> More from the Edit</h2>
        <div class="ed-scroll" id="js-art-more"></div>
      </div>
    </div>
  `;

  // Track this as a real article read
  if (window.wtdgViews) {
    window.wtdgViews.track(article.id, 'article', article.type);
  }

  const moreStrip = document.getElementById('js-art-more');
  if (moreStrip) {
    const others = ARTICLES.filter(a => a.id !== article.id).slice(0, 5);
    moreStrip.innerHTML = others.map(a => `
      <a href="${artLink(a)}" class="ed-mini-card">
        <div class="ed-mini-card__img" style="background-image:url('${a.heroImg}')"></div>
        <div class="ed-mini-card__body">
          ${articleTypeBadge(a.type)}
          <h4 class="ed-mini-card__title">${a.title}</h4>
        </div>
      </a>
    `).join('');
  }
}

// ── WHAT WAS GEELONG PAGE ─────────────────────────────────
function initWhatWasGeelongPage() {
  const root = document.getElementById('js-wwg-root');
  if (!root) return;

  const historyArticles = ARTICLES.filter(a => a.type === 'history');
  root.innerHTML = historyArticles.map(a => `
    <a href="${artLink(a)}" class="wwg-card">
      <div class="wwg-card__imgs">
        <img src="${a.beforeImg || a.heroImg}" alt="Then" class="wwg-card__img" loading="lazy" />
        <div class="wwg-card__divider"><span class="material-symbols-rounded">swap_horiz</span></div>
        <img src="${a.afterImg || a.heroImg}" alt="Now" class="wwg-card__img" loading="lazy" />
      </div>
      <div class="wwg-card__body">
        <span class="wwg-card__label">Then &amp; Now</span>
        <h3 class="wwg-card__title">${a.title}</h3>
        <p class="wwg-card__excerpt">${a.excerpt}</p>
        <span class="wwg-card__cta">Read the story →</span>
      </div>
    </a>
  `).join('');
}

// ── INIT ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // initNav() is now handled by nav.js so it works on all pages, not just app.js pages

  // Location nudge — mobile only, shown when location not yet granted
  if (window.wtdgLocation) window.wtdgLocation.injectLocationNudge();

  // Try Supabase first; fall back silently to local static data if unavailable
  if (typeof loadAllData === 'function') {
    const remote = await loadAllData();
    if (remote) {
      if (remote.businesses.length) BUSINESSES = remote.businesses.map(b => ({
        ...b,
        // Ensure categories[] is populated from whichever field exists
        categories: b.categories?.length ? b.categories
          : (b.category ? [b.category] : (b.type ? [b.type] : [])),
        section: (() => {
          const t = b.type || '';
          // Type-based detection takes priority over the stored section value
          // to catch mislabelled records in the DB
          if (['Bar','Pub','Winery','Brewery','Distillery','Cocktail','Nightclub'].some(k => t.includes(k))) return 'drink';
          if (['Activity','Adventure','Attraction','Museum','Gallery','Garden','Park','Nature','Theatre','Cinema','Sport','Leisure','Golf','Bowling','Escape','Fun'].some(k => t.includes(k))) return 'do';
          if (['Hotel','Motel','Accommodation','BnB','Hostel','Resort'].some(k => t.includes(k))) return 'stay';
          if (['Café','Cafe','Restaurant','Bakery','Food','Brunch','Pizza','Asian','Diner','Bistro','Eatery'].some(k => t.includes(k))) return 'eat';
          // Fall back to stored section only if type gives no clear signal
          return b.section || 'do';
        })()
      }));
      if (remote.events.length)     EVENTS     = remote.events.filter(e => !e.isRecurring);
      if (remote.stays.length)      STAYS      = remote.stays;
      if (remote.promos.length)     PROMOS     = remote.promos;
      if (remote.articles.length)   ARTICLES   = remote.articles;
    }
  }

  // Expose globally for search (available on every page, not just homepage)
  window.BUSINESSES = BUSINESSES;
  window.EVENTS     = EVENTS;
  window.ARTICLES   = ARTICLES;

  if (document.getElementById('js-event-scroll')) {
    // Load homepage sort settings and trending scores, then render
    let _hpSettings = { sort: 'latest', period: '7d' };
    if (typeof loadHomepageSettings === 'function') {
      _hpSettings = await loadHomepageSettings();
    }

    let _trendingScores = new Map();
    if (_hpSettings.sort === 'trending' && window.wtdgViews) {
      _trendingScores = await window.wtdgViews.getAllTrendingScores(_hpSettings.period);
    }
    // Expose for re-renders triggered by priority changes
    window._hpSettings     = _hpSettings;
    window._trendingScores = _trendingScores;

    // Sort helper — Featured → admin_priority → trending score → original order
    function applyHomepageSort(items, type) {
      return [...items].sort((a, b) => {
        // 1. Featured first
        const af = a.featured ? 1 : 0, bf = b.featured ? 1 : 0;
        if (bf !== af) return bf - af;
        // 2. Admin priority (higher = earlier)
        const ap = (b.adminPriority || 0) - (a.adminPriority || 0);
        if (ap !== 0) return ap;
        // 3. Trending score if enabled
        if (_hpSettings.sort === 'trending' && _trendingScores.size) {
          const aScore = (_trendingScores.get(`${type}:${a.id}`) || {}).score || 0;
          const bScore = (_trendingScores.get(`${type}:${b.id}`) || {}).score || 0;
          return bScore - aScore;
        }
        return 0;
      });
    }

    // Strip past events before any homepage rendering
    const upcomingEvents = EVENTS.filter(ev => getEventUrgency(ev) !== 'past');
    const sortedEvents   = applyHomepageSort(upcomingEvents, 'event');
    const sortedBiz      = applyHomepageSort(BUSINESSES.filter(b => (b.sections?.length ? b.sections.includes('eat') : b.section === 'eat')), 'business');
    const sortedStays    = applyHomepageSort(STAYS, 'stay');
    const sortedArticles = applyHomepageSort(ARTICLES, 'article');

    // Apply personalisation sort on top of trending/latest sort
    const _prefs = getPrefs();
    const personalisedEvents  = personaliseSort(sortedEvents, _prefs);
    const personalisedBiz     = personaliseSort(sortedBiz, _prefs);
    const personalisedStays   = personaliseSort(sortedStays, _prefs);

    // Store all businesses globally for cross-function lookups
    window._allBiz = BUSINESSES;
    // Store all events globally for planner preview
    window._allEvents = personalisedEvents;

    renderMasonryHero(personalisedEvents, sortedArticles, _hpSettings, _trendingScores);
    renderPromotedEvents(personalisedEvents);
    // Gold strip removed — gold members are highlighted inline on collection pages instead
    initAds();
    renderEatStrip(personalisedBiz);
    renderStays(personalisedStays);
    renderOffers();
    renderCommunityGuidesStrip();
    initWeekendToggle(personalisedEvents);
    initDateBar();
    initPlannerCard();
    initPersonaliseCTAs();
    initRotatingBanner();
    updateItinBadge();

    // Note: views are only tracked on actual detail page visits (listing.html, event.html)
    // — not on card grid renders. This keeps trending scores meaningful.

    // Editorial preview strip on homepage — sorted by trending if enabled
    const editPreview = document.getElementById('js-editorial-preview');
    if (editPreview) {
      editPreview.innerHTML = sortedArticles.slice(0, 5).map(a => `
        <a href="${artLink(a)}" class="ed-mini-card">
          <div class="ed-mini-card__img" style="background-image:url('${a.heroImg}')"></div>
          <div class="ed-mini-card__body">
            ${articleTypeBadge(a.type)}
            <h4 class="ed-mini-card__title">${a.title}</h4>
          </div>
        </a>
      `).join('');
    }

    setTimeout(() => {
      document.querySelectorAll('.event-card').forEach(card => {
        const title = card.querySelector('.event-card__title')?.textContent;
        const ev = EVENTS.find(e => e.title === title);
        if (ev) addStarBtn(card, { ...ev, type: 'event' });
      });
      document.querySelectorAll('.stay-card').forEach((card, i) => {
        const s = STAYS[i];
        if (s) addStarBtn(card, { id: s.id, title: s.name, name: s.name, type: 'stay', emoji: s.emoji, color: s.color, price: s.price, location: s.location });
      });
    }, 0);
  }

  if (document.getElementById('js-listing-root'))   initListingPage();
  if (document.getElementById('js-event-root'))     initEventPage();
  if (document.getElementById('js-events-root'))    initEventsPage();
  if (document.getElementById('js-eat-root'))       initEatPage();
  if (document.getElementById('js-drink-root'))     initDrinkPage();
  if (document.getElementById('js-do-root'))        initDoPage();
  if (document.getElementById('js-stay-root'))      initStayPage();
  if (document.getElementById('js-editorial-root')) initEditorialPage();
  if (document.getElementById('js-article-root'))   initArticlePage();
  if (document.getElementById('js-wwg-root'))       initWhatWasGeelongPage();
});
