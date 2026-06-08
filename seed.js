// ── WTDG Database Seeder ──────────────────────────────────
// Run: node seed.js
// Requires: npm install @supabase/supabase-js
//
// Set your service role key:
//   export SUPABASE_SERVICE_KEY=your_key_here
//   node seed.js
//
// Or create a .env file:
//   SUPABASE_SERVICE_KEY=your_key_here
// ──────────────────────────────────────────────────────────

const { createClient } = require('@supabase/supabase-js');
let ws; try { ws = require('ws'); } catch {}

// Load .env if present
try { require('dotenv').config(); } catch {}

const SUPABASE_URL = 'https://duhxszqyyzrbzrhwneey.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_KEY) {
  console.error('\n❌  Missing SUPABASE_SERVICE_KEY environment variable.');
  console.error('   Get it from: Supabase Dashboard → Settings → API → service_role\n');
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
  ...(ws ? { realtime: { transport: ws } } : {}),
});

const img = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`;

// ── BUSINESSES ────────────────────────────────────────────
const BUSINESSES = [

  // ── CAFÉS ──────────────────────────────────────────────
  {
    id: 'pistol-petes-coffee',
    slug: 'pistol-petes-coffee-geelong-west',
    name: "Pistol Pete's Coffee",
    type: 'Café', section: 'eat', emoji: '☕', color: '#f4a261',
    description: 'Specialty espresso bar and all-day brunch on Pakington Street. Rotating single-origin pour-overs, seasonal brunch menu and one of the most serious coffee programs in regional Victoria.',
    location: '116 Pakington St, Geelong West VIC 3218',
    suburb: 'Geelong West', website: 'pistolpetes.com.au',
    lat: -38.1452, lng: 144.3438,
    img: img('1495474472287-4d71bcdd2085'),
  },
  {
    id: 'dr-morse',
    slug: 'dr-morse-geelong',
    name: 'Dr Morse',
    type: 'Café', section: 'eat', emoji: '☕', color: '#8d6e63',
    description: 'Much-loved inner-city café on Little Malop Street. Great espresso, exceptional sourdough toast, and a loyal regular crowd that has been coming for years.',
    location: '77 Little Malop St, Geelong VIC 3220',
    suburb: 'Geelong CBD', website: 'drmorse.com.au',
    lat: -38.1464, lng: 144.3588,
    img: img('1501339847302-ac426a4a7cbb'),
  },
  {
    id: 'baba-ganoush',
    slug: 'baba-ganoush-geelong',
    name: 'Baba Ganoush',
    type: 'Café', section: 'eat', emoji: '🫙', color: '#ff8f00',
    description: 'Middle-Eastern inspired all-day café on Little Ryrie Street. The shakshuka with house-made flatbread has become something of a Geelong institution.',
    location: '83 Little Ryrie St, Geelong VIC 3220',
    suburb: 'Geelong CBD', website: 'babaganoush.com.au',
    lat: -38.1472, lng: 144.3608,
    img: img('1484980859-ea25e15becea'),
  },
  {
    id: 'hunta-st',
    slug: 'hunta-st-south-geelong',
    name: 'Hunta St',
    type: 'Café', section: 'eat', emoji: '🌿', color: '#52b788',
    description: 'Relaxed neighbourhood café in South Geelong with a focus on wholesome food and great filter coffee. Garden seating, friendly staff and a menu that changes with the seasons.',
    location: '1 Hunta St, South Geelong VIC 3220',
    suburb: 'South Geelong', website: '',
    lat: -38.1590, lng: 144.3580,
    img: img('1509042239860-f550ce710b93'),
  },
  {
    id: 'moose-cafe',
    slug: 'moose-cafe-geelong',
    name: 'Moose Cafe',
    type: 'Café', section: 'eat', emoji: '🫐', color: '#6d4c41',
    description: 'A Geelong institution on Little Malop Street. Wood panels, sourdough you could eat daily, and staff who remember your order. Busy on weekends — worth the wait.',
    location: '96 Little Malop St, Geelong VIC 3220',
    suburb: 'Geelong CBD', website: '',
    lat: -38.1461, lng: 144.3585,
    img: img('1442975631115-374f96c6e7d5'),
  },

  // ── RESTAURANTS ────────────────────────────────────────
  {
    id: 'igni',
    slug: 'igni-restaurant-geelong',
    name: 'Igni',
    type: 'Restaurant', section: 'eat', emoji: '🔥', color: '#6d4c41',
    description: "Aaron Turner's acclaimed farm-to-fire restaurant. Seasonal Australian produce cooked over open flame — one of the most celebrated dining rooms in regional Victoria. Bookings essential.",
    location: '53 Little Ryrie St, Geelong VIC 3220',
    suburb: 'Geelong CBD', website: 'restaurantigni.com',
    lat: -38.1471, lng: 144.3607,
    img: img('1414235077428-338989a2e8c0'),
  },
  {
    id: 'the-wharf-shed',
    slug: 'the-wharf-shed-geelong',
    name: 'The Wharf Shed',
    type: 'Restaurant', section: 'eat', emoji: '⚓', color: '#3a86ff',
    description: 'Waterfront dining on Cunningham Pier. Fresh local seafood, craft beer on tap, and sweeping views across Corio Bay. A Geelong classic that delivers every time.',
    location: 'Cunningham Pier, Geelong VIC 3220',
    suburb: 'Geelong CBD', website: 'wharfshed.com.au',
    lat: -38.1452, lng: 144.3560,
    img: img('1517248135467-4c7edcad34c4'),
  },
  {
    id: 'humble-rays',
    slug: 'humble-rays-geelong-west',
    name: 'Humble Rays',
    type: 'Restaurant', section: 'eat', emoji: '🍽️', color: '#e57373',
    description: 'Neighbourhood restaurant on Pakington Street. Honest, seasonal cooking with a short menu, excellent natural wines and a room that always feels full of the right energy.',
    location: '98 Pakington St, Geelong West VIC 3218',
    suburb: 'Geelong West', website: 'humblerays.com.au',
    lat: -38.1451, lng: 144.3440,
    img: img('1555396273-367ea4eb4db5'),
  },
  {
    id: 'baveras',
    slug: 'baveras-geelong',
    name: 'Baveras',
    type: 'Restaurant', section: 'eat', emoji: '🥘', color: '#e76f51',
    description: 'Spanish-inspired share plates and an excellent wine list in a warm, laneway setting. The paella is the stuff of Geelong legend — order it a day ahead.',
    location: '15 Moorabool St, Geelong VIC 3220',
    suburb: 'Geelong CBD', website: 'baveras.com.au',
    lat: -38.1476, lng: 144.3598,
    img: img('1424847651672-bf20a4b0982b'),
  },
  {
    id: 'spaghetti-bar',
    slug: 'spaghetti-bar-geelong',
    name: 'Spaghetti Bar',
    type: 'Restaurant', section: 'eat', emoji: '🍝', color: '#c0392b',
    description: 'Geelong\'s beloved Italian institution, open since 1983. No-frills, generous portions and the kind of pasta that keeps locals coming back for decades.',
    location: '27 Yarra St, Geelong VIC 3220',
    suburb: 'Geelong CBD', website: '',
    lat: -38.1458, lng: 144.3562,
    img: img('1621996346565-ead4d596f39b'),
  },
  {
    id: 'quail-and-son',
    slug: 'quail-and-son-geelong-west',
    name: 'Quail & Son',
    type: 'Restaurant', section: 'eat', emoji: '🍷', color: '#7b3f00',
    description: 'Modern Australian dining with a strong emphasis on local produce. Intimate room, thoughtful wine list and a menu that changes with what\'s best from regional suppliers.',
    location: '150 Pakington St, Geelong West VIC 3218',
    suburb: 'Geelong West', website: 'quilandsons.com.au',
    lat: -38.1453, lng: 144.3435,
    img: img('1529042355636-9b60a5862b84'),
  },

  // ── BARS & PUBS ────────────────────────────────────────
  {
    id: 'little-creatures',
    slug: 'little-creatures-brewing-geelong',
    name: 'Little Creatures Brewing',
    type: 'Bar & Restaurant', section: 'eat', emoji: '🍺', color: '#f59e0b',
    description: 'Craft brewery and restaurant on the Geelong waterfront. Pale ales brewed on-site, wood-fired pizza and a sprawling space that comes alive on a warm afternoon.',
    location: '1 Yarra St, Geelong VIC 3220',
    suburb: 'Geelong CBD', website: 'littlecreatures.com.au',
    lat: -38.1446, lng: 144.3553,
    img: img('1559839914-17aae19cec71'),
  },
  {
    id: 'the-barwon-club',
    slug: 'barwon-club-hotel-newtown',
    name: 'The Barwon Club Hotel',
    type: 'Pub', section: 'eat', emoji: '🍻', color: '#5c6bc0',
    description: 'Beloved Pakington Street institution in Newtown. Great front bar, live music most weekends, proper pub food and a loyal Sunday session crowd that has been coming for decades.',
    location: '110 Pakington St, Newtown VIC 3220',
    suburb: 'Newtown', website: 'barwonclub.com.au',
    lat: -38.1553, lng: 144.3447,
    img: img('1572116469696-31de0f17cc34'),
  },
  {
    id: 'the-tulip',
    slug: 'the-tulip-bar-geelong',
    name: 'The Tulip',
    type: 'Bar', section: 'eat', emoji: '🌷', color: '#f472b6',
    description: 'Small bar with a big reputation for natural wine and interesting cocktails. Low-lit, friendly and reliably good — the kind of place you stay longer than you planned.',
    location: 'Little Malop St, Geelong VIC 3220',
    suburb: 'Geelong CBD', website: '',
    lat: -38.1463, lng: 144.3590,
    img: img('1575367439958-5c5e7b6e9069'),
  },

  // ── MARKETS ────────────────────────────────────────────
  {
    id: 'geelong-farmers-market',
    slug: 'geelong-farmers-market',
    name: 'Geelong Farmers Market',
    type: 'Market', section: 'eat', emoji: '🥦', color: '#52b788',
    description: 'Every Sunday at Johnstone Park. Connecting Geelong locals with the best regional produce, artisan food and street food vendors from across the Surf Coast and Bellarine Peninsula.',
    location: 'Johnstone Park, Geelong VIC 3220',
    suburb: 'Geelong CBD', website: 'geelongfarmersmarket.com.au',
    lat: -38.1455, lng: 144.3578,
    img: img('1488459716781-31db52582fe9'),
  },
  {
    id: 'eastern-beach-kiosk',
    slug: 'eastern-beach-kiosk-geelong',
    name: 'Eastern Beach Kiosk',
    type: 'Café & Kiosk', section: 'eat', emoji: '🌊', color: '#4ac8d0',
    description: 'Iconic waterfront kiosk at Eastern Beach Reserve. Takeaway coffee, fish and chips, soft-serve and the best bay views in the city. A Geelong summer institution.',
    location: 'Eastern Beach Reserve, Geelong VIC 3220',
    suburb: 'Geelong', website: '',
    lat: -38.1511, lng: 144.3791,
    img: img('1507525428034-b723cf961d3e'),
  },

  // ── ARTS & DO ──────────────────────────────────────────
  {
    id: 'gpac',
    slug: 'geelong-performing-arts-centre',
    name: 'GPAC',
    type: 'Arts & Culture', section: 'do', emoji: '🎭', color: '#e76f51',
    description: "Geelong Performing Arts Centre — the region's premier venue for theatre, dance, opera, comedy and live performance. World-class programming in the heart of the CBD.",
    location: '50 Little Malop St, Geelong VIC 3220',
    suburb: 'Geelong CBD', website: 'gpac.org.au',
    lat: -38.1463, lng: 144.3591,
    img: img('1507676184212-d03ab07a01bf'),
  },
  {
    id: 'geelong-art-gallery',
    slug: 'geelong-art-gallery',
    name: 'Geelong Art Gallery',
    type: 'Gallery', section: 'do', emoji: '🖼️', color: '#9c27b0',
    description: "One of Australia's most significant regional galleries. Outstanding collection spanning 140 years, free entry, excellent touring exhibitions and a stunning heritage building.",
    location: '55 Little Malop St, Geelong VIC 3220',
    suburb: 'Geelong CBD', website: 'geelongartgallery.org.au',
    lat: -38.1464, lng: 144.3592,
    img: img('1518998053901-5348d3961a04'),
  },
  {
    id: 'boom-gallery',
    slug: 'boom-gallery-newtown',
    name: 'Boom Gallery',
    type: 'Gallery', section: 'do', emoji: '🏺', color: '#9b5de5',
    description: 'Contemporary art gallery on Pakington Street championing regional and emerging Australian artists. Open studios, exhibitions, workshops and a beloved ceramics studio.',
    location: '240 Pakington St, Newtown VIC 3220',
    suburb: 'Newtown', website: 'boomgallery.com.au',
    lat: -38.1600, lng: 144.3450,
    img: img('1580138955393-e26e89b56a3c'),
  },
  {
    id: 'national-wool-museum',
    slug: 'national-wool-museum-geelong',
    name: 'National Wool Museum',
    type: 'Museum', section: 'do', emoji: '🐑', color: '#78909c',
    description: "Australia's only dedicated wool museum in a stunning heritage bluestone building. Fascinating exhibits on the industry that built Geelong, with interactive experiences for all ages.",
    location: '26 Moorabool St, Geelong VIC 3220',
    suburb: 'Geelong CBD', website: 'nwm.vic.gov.au',
    lat: -38.1480, lng: 144.3596,
    img: img('1566127444979-b3d2b654e3d7'),
  },
];

// ── STAYS ─────────────────────────────────────────────────
const STAYS = [
  {
    id: 'novotel-geelong',
    slug: 'novotel-geelong',
    name: 'Novotel Geelong',
    type: 'Hotel', emoji: '🏨', color: '#4ac8d0',
    description: 'Four-star hotel in the heart of the CBD, steps from the waterfront and major attractions. Indoor pool, gym, restaurant and bar. The go-to choice for business and leisure travellers.',
    location: 'Cnr Gheringhap & Myers St, Geelong VIC 3220',
    suburb: 'Geelong CBD', website: 'novotelgeelong.com.au',
    price: '$199', stars: '★★★★',
    lat: -38.1463, lng: 144.3622,
    img: img('1566073771259-6a8506099945'),
  },
  {
    id: 'quest-geelong-central',
    slug: 'quest-geelong-central',
    name: 'Quest Geelong Central',
    type: 'Apartment Hotel', emoji: '🏢', color: '#9b5de5',
    description: 'Spacious studio and one-bedroom apartments in central Geelong. Full kitchen, laundry and all the comforts of home — ideal for extended stays or family trips.',
    location: '15 Myers St, Geelong VIC 3220',
    suburb: 'Geelong CBD', website: 'questgeelongcentral.com.au',
    price: '$159', stars: '★★★★',
    lat: -38.1465, lng: 144.3620,
    img: img('1522708323590-d24dbb6b0267'),
  },
  {
    id: 'mercure-geelong',
    slug: 'mercure-geelong',
    name: 'Mercure Geelong',
    type: 'Hotel', emoji: '🏩', color: '#3a86ff',
    description: 'Well-located three-star hotel on Myers Street with comfortable rooms, a restaurant and easy access to the waterfront and city centre. Great value in the CBD.',
    location: '91 Myers St, Geelong VIC 3220',
    suburb: 'Geelong CBD', website: 'mercuregeelong.com.au',
    price: '$135', stars: '★★★',
    lat: -38.1468, lng: 144.3618,
    img: img('1551882547-ff40c599fb3f'),
  },
  {
    id: 'mantra-southbank-geelong',
    slug: 'mantra-southbank-geelong',
    name: 'Mantra Southbank Geelong',
    type: 'Apartment Hotel', emoji: '🌊', color: '#0077b6',
    description: 'Modern apartments on Eastern Beach Road with stunning bay views. Rooftop pool, gym and serviced apartments perfect for a waterfront Geelong stay.',
    location: '11 Eastern Beach Rd, Geelong VIC 3220',
    suburb: 'Geelong CBD', website: 'mantra.com.au',
    price: '$175', stars: '★★★★',
    lat: -38.1473, lng: 144.3720,
    img: img('1582719508461-905c673536f6'),
  },
  {
    id: 'surf-coast-retreat',
    slug: 'surf-coast-retreat-torquay',
    name: 'Surf Coast Retreat',
    type: 'Holiday House', emoji: '🏡', color: '#52b788',
    description: 'Stunning five-bedroom beach house on the Great Ocean Road in Torquay. Sleeps 10, fully equipped kitchen, outdoor entertaining and a short walk to Torquay surf beach.',
    location: 'Torquay VIC 3228',
    suburb: 'Torquay', website: '',
    price: '$285', stars: '★★★★★',
    lat: -38.3308, lng: 144.3248,
    img: img('1568605114967-8130f3a36994'),
  },
  {
    id: 'bellarine-farmhouse',
    slug: 'bellarine-farmhouse-drysdale',
    name: 'The Bellarine Farmhouse',
    type: 'Holiday House', emoji: '🌿', color: '#84a98c',
    description: 'Beautifully restored heritage farmhouse on the Bellarine Peninsula. Four bedrooms, open fireplace, orchard garden and sweeping paddock views — a genuine escape from the city.',
    location: 'Drysdale VIC 3222',
    suburb: 'Bellarine Peninsula', website: '',
    price: '$320', stars: '★★★★★',
    lat: -38.1757, lng: 144.5661,
    img: img('1510798831971-661eb04b3739'),
  },
  {
    id: 'geelong-manor',
    slug: 'geelong-manor-newtown',
    name: 'Geelong Manor',
    type: 'B&B', emoji: '🏠', color: '#d4a373',
    description: 'Elegant heritage B&B in Newtown, steps from Pakington Street. Four beautifully appointed rooms, gourmet breakfast included and hosts who genuinely know Geelong.',
    location: '28 Noble St, Newtown VIC 3220',
    suburb: 'Newtown', website: '',
    price: '$195', stars: '★★★★',
    lat: -38.1558, lng: 144.3452,
    img: img('1564013799919-ab600027ffc6'),
  },
  {
    id: 'cunningham-pier-apartments',
    slug: 'cunningham-pier-apartments-geelong',
    name: 'Cunningham Pier Apartments',
    type: 'Apartment Hotel', emoji: '⚓', color: '#023e8a',
    description: 'Premium waterfront apartments right on Cunningham Pier. Wake up to bay views, walk to restaurants and the CBD. Self-contained with everything you need for a perfect Geelong stay.',
    location: 'Cunningham Pier, Geelong VIC 3220',
    suburb: 'Geelong CBD', website: '',
    price: '$245', stars: '★★★★★',
    lat: -38.1450, lng: 144.3558,
    img: img('1571003123894-1ead584fbbb4'),
  },
];

// ── EVENTS ────────────────────────────────────────────────
const EVENTS = [
  {
    id: 'geelong-farmers-market-weekly',
    slug: 'geelong-farmers-market-sunday',
    business_id: 'farmers-market',
    title: 'Geelong Farmers Market',
    category: 'Markets',
    tags: ['Free', 'Outdoors', 'Family Friendly', 'All Ages'],
    date: 'Sun 15 Jun', time: '8am – 1pm',
    location: 'Johnstone Park, Geelong',
    price: 'Free', emoji: '🥦', color: '#52b788',
    lat: -38.1455, lng: 144.3578, featured: true,
    img: img('1488459716781-31db52582fe9'),
  },
  {
    id: 'sunday-session-little-creatures',
    slug: 'sunday-session-little-creatures-geelong',
    business_id: 'little-creatures',
    title: 'Sunday Session at Little Creatures',
    category: 'Music',
    tags: ['Free', 'Outdoors', 'All Ages'],
    date: 'Sun 15 Jun', time: '2pm – 6pm',
    location: 'Little Creatures Brewing, Geelong Waterfront',
    price: 'Free', emoji: '🍺', color: '#f59e0b',
    lat: -38.1446, lng: 144.3553,
    img: img('1559839914-17aae19cec71'),
  },
  {
    id: 'gpac-importance-earnest',
    slug: 'importance-of-being-earnest-gpac',
    business_id: 'gpac',
    title: 'The Importance of Being Earnest',
    category: 'Theatre',
    tags: ['Under $50', 'Accessible', 'Bookings Required'],
    date: 'Fri 20 Jun', time: '7:30pm',
    location: 'GPAC, 50 Little Malop St, Geelong',
    price: '$45', emoji: '🎭', color: '#e76f51',
    lat: -38.1463, lng: 144.3591, featured: true,
    img: img('1507676184212-d03ab07a01bf'),
  },
  {
    id: 'boom-gallery-open-studio',
    slug: 'open-studio-ceramics-boom-gallery',
    business_id: 'boom-gallery',
    title: 'Open Studio — Ceramic Art Weekend',
    category: 'Arts & Culture',
    tags: ['Free', 'Family Friendly', 'All Ages', 'Accessible'],
    date: 'Sat 14 Jun', time: '11am – 5pm',
    location: 'Boom Gallery, 240 Pakington St, Newtown',
    price: 'Free', emoji: '🏺', color: '#9b5de5',
    lat: -38.1600, lng: 144.3450,
    img: img('1580138955393-e26e89b56a3c'),
  },
  {
    id: 'latte-art-masterclass',
    slug: 'latte-art-masterclass-pistol-petes',
    business_id: 'pistol-pete',
    title: 'Latte Art Masterclass',
    category: 'Food & Drink',
    tags: ['Under $50', 'Bookings Required'],
    date: 'Sat 21 Jun', time: '9am – 11am',
    location: "Pistol Pete's Coffee, 116 Pakington St, Geelong West",
    price: '$40', emoji: '☕', color: '#f4a261',
    lat: -38.1452, lng: 144.3438,
    img: img('1495474472287-4d71bcdd2085'),
  },
  {
    id: 'geelong-art-gallery-free-sunday',
    slug: 'free-family-sunday-geelong-art-gallery',
    business_id: 'geelong-art-gallery',
    title: 'Free Family Sunday — Geelong Art Gallery',
    category: 'Arts & Culture',
    tags: ['Free', 'Family Friendly', 'Accessible', 'All Ages'],
    date: 'Sun 15 Jun', time: '10am – 5pm',
    location: 'Geelong Art Gallery, 55 Little Malop St',
    price: 'Free', emoji: '🖼️', color: '#9c27b0',
    lat: -38.1464, lng: 144.3592,
    img: img('1518998053901-5348d3961a04'),
  },
  {
    id: 'barwon-ramblers-live',
    slug: 'live-music-barwon-ramblers',
    business_id: 'barwon-club',
    title: 'Live Music: The Barwon Ramblers',
    category: 'Music',
    tags: ['Under $20', 'All Ages'],
    date: 'Sat 14 Jun', time: '7pm – 10pm',
    location: 'The Barwon Club Hotel, 110 Pakington St, Newtown',
    price: '$10', emoji: '🎸', color: '#5c6bc0',
    lat: -38.1553, lng: 144.3447,
    img: img('1516450360452-9312f5e86fc7'),
  },
  {
    id: 'wool-tales-school-holidays',
    slug: 'wool-tales-school-holiday-program',
    business_id: 'national-wool-museum',
    title: 'Wool Tales: School Holiday Program',
    category: 'Family',
    tags: ['Family Friendly', 'Under $20', 'Accessible', 'All Ages'],
    date: 'Daily Jun 14–22', time: '10am – 3pm',
    location: 'National Wool Museum, 26 Moorabool St, Geelong',
    price: '$8', emoji: '🐑', color: '#78909c',
    lat: -38.1480, lng: 144.3596,
    img: img('1566127444979-b3d2b654e3d7'),
  },
  {
    id: 'geelong-night-markets',
    slug: 'geelong-night-markets-june',
    business_id: null,
    title: 'Geelong Night Markets',
    category: 'Markets',
    tags: ['Free', 'Family Friendly', 'Outdoors', 'All Ages'],
    date: 'Fri 20 Jun', time: '5pm – 10pm',
    location: 'Eastern Beach Promenade, Geelong',
    price: 'Free', emoji: '🏮', color: '#f97316',
    lat: -38.1490, lng: 144.3700, featured: true,
    img: img('1533900786375-8a42e0c2e8ef'),
  },
  {
    id: 'surf-coast-trail-run',
    slug: 'surf-coast-trail-run-geelong',
    business_id: null,
    title: 'Surf Coast Trail Run',
    category: 'Sport',
    tags: ['Outdoors', 'Under $50', 'Registrations Required'],
    date: 'Sat 28 Jun', time: '7am start',
    location: 'Anglesea Heathlands',
    price: '$35', emoji: '🏃', color: '#3a86ff',
    lat: -38.4065, lng: 144.1891,
    img: img('1571019614242-c5c5dee9f50b'),
  },
  {
    id: 'gpac-comedy-night',
    slug: 'gpac-comedy-night-june',
    business_id: 'gpac',
    title: 'Comedy Night: Best of Australian Stand-Up',
    category: 'Music',
    tags: ['Under $50', '18+', 'Bookings Required'],
    date: 'Sat 21 Jun', time: '8pm',
    location: 'GPAC Studio, 50 Little Malop St, Geelong',
    price: '$38', emoji: '😂', color: '#f59e0b',
    lat: -38.1463, lng: 144.3591,
    img: img('1585699324551-f6b6d4a4d4ea'),
  },
  {
    id: 'bellarine-wine-trail',
    slug: 'bellarine-wine-trail-weekend',
    business_id: null,
    title: 'Bellarine Wine Trail Weekend',
    category: 'Food & Drink',
    tags: ['18+', 'Outdoors', 'Under $50'],
    date: 'Sat 28 – Sun 29 Jun', time: 'All day',
    location: 'Bellarine Peninsula, VIC',
    price: '$30', emoji: '🍷', color: '#722f37',
    lat: -38.2200, lng: 144.5200, featured: true,
    img: img('1474722883778-792e7d353d60'),
  },
  {
    id: 'geelong-big-wheel',
    slug: 'geelong-big-wheel-rides',
    business_id: null,
    title: 'Geelong Big Wheel',
    category: 'Family',
    tags: ['Family Friendly', 'All Ages', 'Under $20'],
    date: 'Daily until Jul 6', time: '11am – 9pm',
    location: 'Geelong Waterfront, Eastern Beach Rd',
    price: '$15', emoji: '🎡', color: '#ec4899',
    lat: -38.1478, lng: 144.3710,
    img: img('1513224526504-e6a9f79f8e94'),
  },
  {
    id: 'pakington-street-festival',
    slug: 'pakington-street-festival-2026',
    business_id: null,
    title: 'Pakington Street Festival',
    category: 'Festival',
    tags: ['Free', 'Family Friendly', 'All Ages', 'Outdoors'],
    date: 'Sun 29 Jun', time: '10am – 5pm',
    location: 'Pakington St, Geelong West',
    price: 'Free', emoji: '🎪', color: '#14b8a6',
    lat: -38.1452, lng: 144.3438, featured: true,
    img: img('1533900786375-8a42e0c2e8ef'),
  },
  {
    id: 'waterfront-geelong-carousel',
    slug: 'geelong-waterfront-carousel',
    business_id: null,
    title: 'Historic Waterfront Carousel',
    category: 'Family',
    tags: ['Family Friendly', 'All Ages', 'Under $10'],
    date: 'Daily', time: '10am – 6pm weekdays, 10am – 8pm weekends',
    location: 'Geelong Waterfront, Eastern Beach Rd',
    price: '$4', emoji: '🎠', color: '#f472b6',
    lat: -38.1476, lng: 144.3706,
    img: img('1513224526504-e6a9f79f8e94'),
  },
];

// ── SEED FUNCTION ─────────────────────────────────────────
async function seed() {
  console.log('\n🌱  WTDG Database Seeder');
  console.log('─'.repeat(40));

  // ── Businesses ──────────────────────────────────────────
  // Strategy: try upsert on slug; if FK constraint blocks it (old row has
  // linked events/promos), fall back to UPDATE by slug — keeps the existing
  // id intact so FK references don't break, but patches all other fields.
  console.log(`\n📍  Seeding ${BUSINESSES.length} businesses...`);
  for (const biz of BUSINESSES) {
    const { error } = await db.from('businesses').upsert(biz, { onConflict: 'slug' });
    if (error) {
      if (error.message.includes('foreign key')) {
        // Keep the existing id, update everything else in-place
        const { id: _dropId, ...patch } = biz;
        const { error: e2 } = await db.from('businesses').update(patch).eq('slug', biz.slug);
        if (e2) {
          console.error(`   ❌  ${biz.name} (update): ${e2.message}`);
        } else {
          console.log(`   ✅  ${biz.name} (updated existing)`);
        }
      } else {
        console.error(`   ❌  ${biz.name}: ${error.message}`);
      }
    } else {
      console.log(`   ✅  ${biz.name}`);
    }
  }

  // ── Stays ───────────────────────────────────────────────
  console.log(`\n🛏️   Seeding ${STAYS.length} stays...`);
  for (const stay of STAYS) {
    const { error } = await db.from('stays').upsert(stay, { onConflict: 'id' });
    if (error) {
      console.error(`   ❌  ${stay.name}: ${error.message}`);
    } else {
      console.log(`   ✅  ${stay.name}`);
    }
  }

  // ── Events ──────────────────────────────────────────────
  // events.slug has no unique constraint in DB → plain insert.
  // We wipe existing seeded events first so re-runs don't duplicate.
  // (Only deletes rows whose slug matches our seed list.)
  console.log(`\n📅  Seeding ${EVENTS.length} events...`);
  const eventSlugs = EVENTS.map(e => e.slug);
  await db.from('events').delete().in('slug', eventSlugs);

  for (const ev of EVENTS) {
    const { id, ...evData } = ev;   // drop string id — DB auto-assigns integer PK
    const { error } = await db.from('events').insert(evData);
    if (error) {
      console.error(`   ❌  ${ev.title}: ${error.message}`);
    } else {
      console.log(`   ✅  ${ev.title}`);
    }
  }

  console.log('\n✨  Done! Check your Supabase dashboard to verify.\n');
}

seed().catch(err => {
  console.error('\n❌  Seed failed:', err.message);
  process.exit(1);
});
