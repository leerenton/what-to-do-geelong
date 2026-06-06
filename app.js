'use strict';

/* global db, loadAllData */

// ── BUSINESSES ────────────────────────────────────────────
let BUSINESSES = [
  // ── CAFES ──────────────────────────────────────────────
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
  },
];

// ── STAYS ─────────────────────────────────────────────────
let STAYS = [
  {
    id: 's1',
    name: 'Novotel Geelong',
    type: 'Hotel',
    location: 'Cnr Gheringhap & Myers St, Geelong VIC 3220',
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
    slug: 'top-5-cafes-geelong',
    type: 'guide',
    title: 'Top 5 Cafes in Geelong You Need to Visit',
    excerpt: 'From specialty single-origin pour-overs to legendary all-day brunch, Geelong\'s cafe scene has levelled up — here are our five favourites.',
    heroImg: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=80',
    publishedAt: '2026-06-02',
    author: 'WTDG Editorial',
    businessIds: ['pistol-pete', 'eastern-beach'],
    eventIds: [],
    tags: ['food', 'cafes', 'guide'],
    content: `<p>Geelong's coffee culture has quietly become one of the best in regional Victoria. Whether you're after a meticulously crafted single-origin pour-over or a sun-soaked brunch with bay views, the city delivers. Here are five cafes we keep returning to.</p><h2>1. Pistol Pete's Coffee</h2><p>The benchmark for specialty espresso on Pakington Street. Pete's rotating seasonal menu showcases beans from acclaimed roasters. The all-day brunch menu is equally considered — smashed avo gets a Thai chilli makeover, and the house granola with seasonal fruit is quietly legendary.</p><p><strong>Find it:</strong> Pakington St, Geelong West · <strong>Best for:</strong> Serious coffee nerds and brunch with friends</p><h2>2. Eastern Beach Kiosk</h2><p>There's nowhere in Geelong better for a morning flat white in hand, feet on the grass, watching the bay. Unpretentious, friendly, and exactly right for a lazy weekend morning.</p><p><strong>Find it:</strong> Eastern Beach Reserve · <strong>Best for:</strong> Takeaway coffee and views</p><h2>3. Moose Cafe</h2><p>A local institution on Little Malop Street — wood panels, sourdough you could eat daily, and staff who remember your order. Busy on weekends, worth the wait.</p><h2>4. Baba Ganoush</h2><p>Not just your neighbourhood cafe — Baba's does a full Middle-Eastern inspired brunch that's become something of a Geelong cult. The shakshuka with house-made flatbread is exceptional.</p><h2>5. The Shed</h2><p>Tucked into a laneway off Ryrie Street, this is Geelong's best-kept secret. Natural light, exposed brick, locally roasted beans. Go early on a Saturday.</p>`,
  },
  {
    id: 'waterfront-guide',
    slug: 'geelong-waterfront-guide',
    type: 'guide',
    title: 'The Ultimate Geelong Waterfront Guide',
    excerpt: 'Stretching 6km from Rippleside to St Helens, the Geelong waterfront is the city\'s beating heart. Here\'s everything you need to know.',
    heroImg: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80',
    publishedAt: '2026-05-28',
    author: 'WTDG Editorial',
    businessIds: ['eastern-beach', 'the-wharf'],
    eventIds: [1, 2],
    tags: ['waterfront', 'guide', 'outdoors'],
    content: `<p>Geelong's waterfront is one of the most enjoyable urban waterfronts in Victoria — and most visitors only scratch the surface. Here's how to do it properly, from dawn to after dark.</p><h2>Morning: Eastern Beach</h2><p>Start at Eastern Beach Reserve, where the 1930s swimming enclosure and art deco change rooms create one of the prettiest beach settings in regional Victoria. Grab a coffee from the Eastern Beach Kiosk and watch the bay wake up.</p><h2>Midday: Cunningham Pier</h2><p>Walk north along the promenade to Cunningham Pier, home to the Wharf Shed Café — fresh local seafood, craft beer on tap, and sweeping views across Corio Bay. The pier itself is one of the oldest surviving timber piers in Victoria.</p><h2>Afternoon: Little Creatures & The Boom</h2><p>Continue to the Yarra Street Pier precinct, where Little Creatures Geelong has established itself as one of the best brewery venues in the state. Order the Rogers' and sit outside as the afternoon light turns gold.</p><h2>Evening: Sunset at St Helens</h2><p>The western end of the waterfront offers uninterrupted views of the Bellarine Peninsula at sunset. Pack a bottle of wine and find a spot on the grass. This is what Geelong is for.</p>`,
  },
  {
    id: 'weekend-itinerary',
    slug: 'perfect-48-hours-in-geelong',
    type: 'guide',
    title: 'The Perfect 48 Hours in Geelong',
    excerpt: 'First time visiting? Here\'s our definitive two-day itinerary — markets, brunch, bay views, live music, and a day trip to the Surf Coast.',
    heroImg: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=80',
    publishedAt: '2026-06-01',
    author: 'WTDG Editorial',
    businessIds: ['pistol-pete', 'eastern-beach', 'the-wharf', 'boom-gallery'],
    eventIds: [1, 2, 3],
    tags: ['guide', 'itinerary', 'weekend'],
    content: `<p>Geelong is two hours from Melbourne by train and has more than earned its status as a destination in its own right. Here's how to spend 48 hours doing it justice.</p><h2>Saturday Morning</h2><p>Start with coffee at Pistol Pete's on Pakington Street, then walk down to the Geelong Farmers Market at Johnstone Park. Load up on local produce, street food, and the best sourdough in the region — the market is the social heart of Geelong on a Sunday morning.</p><h2>Saturday Afternoon</h2><p>Walk or ride the waterfront from Eastern Beach to Cunningham Pier. Stop at the Wharf Shed for lunch — local seafood, bay views, cold beer. Head to Boom Gallery in Newtown in the afternoon to see what regional Australian contemporary art looks like at its best.</p><h2>Saturday Evening</h2><p>Catch whatever's on at Jazz on the Waterfront or check the GPAC program for a show. Dinner on Pakington Street — try Tulip for modern Australian or The Fishwife for something more relaxed.</p><h2>Sunday</h2><p>Day trip to the Surf Coast. It's 30 minutes to Torquay and 45 to Lorne. The Great Ocean Road starts here — even a short drive is worth it for the views. The Bellarine Peninsula wine region is equally accessible: Oakdene Vineyard does a great long lunch.</p>`,
  },
  {
    id: 'pistol-pete-expansion',
    slug: 'pistol-petes-coffee-opens-cbd-flagship-geelong',
    type: 'news',
    title: 'Pistol Pete\'s Opens a CBD Flagship on Malop Street',
    excerpt: 'Geelong West\'s beloved specialty coffee institution has expanded to the CBD with a larger all-day venue and a dedicated events room.',
    heroImg: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&q=80',
    publishedAt: '2026-06-04',
    author: 'Business News',
    businessIds: ['pistol-pete'],
    eventIds: [],
    tags: ['news', 'food', 'business'],
    content: `<p>Pistol Pete's Coffee — the specialty espresso bar that's been a fixture of Pakington Street in Geelong West for the past seven years — has opened a second location in the Geelong CBD, taking over a heritage shopfront on Malop Street.</p><p>The new space seats 40 inside with a street-side terrace, plus a dedicated events room the team will use for cupping sessions, latte art competitions, and live music evenings.</p><blockquote>"We've always been a Geelong West business and that doesn't change — the original is still our home," said founder Pete Andreou. "But we've had so many people from the CBD side asking us to open closer to them, and this space was too good to pass up."</blockquote><p>The CBD menu mirrors the Geelong West original, with an expanded brunch offering developed with local produce from the Geelong Farmers Market. Open from 7am daily.</p>`,
  },
  {
    id: 'gpac-2026-season',
    slug: 'gpac-2026-season-geelong-performing-arts',
    type: 'news',
    title: 'GPAC Announces a Big 2026 Season — Including Two Australian Premieres',
    excerpt: 'The Geelong Performing Arts Centre has unveiled its 2026 program, featuring two Australian premiere productions and a major new commission.',
    heroImg: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=1200&q=80',
    publishedAt: '2026-06-03',
    author: 'Business News',
    businessIds: ['gpac'],
    eventIds: [7],
    tags: ['news', 'arts', 'theatre'],
    content: `<p>Geelong Performing Arts Centre has released its 2026 season program — the most ambitious in the venue's history. The year kicks off with an Australian premiere of a critically acclaimed West End drama, followed by a season spanning contemporary theatre, opera, dance, and comedy.</p><p>"We wanted to put Geelong audiences in the same position as Melbourne and Sydney audiences when it comes to access to the best new work from the UK and Europe," said Artistic Director Sarah Chen.</p><p>The headline event is a commissioned work from Geelong-born composer Marcus Webb, whose immersive piece <em>Waterline</em> will transform the GPAC main stage into an audio-visual environment exploring the city's relationship with Corio Bay. World premiere at GPAC in August before a national tour. Subscriptions on sale now.</p>`,
  },
  {
    id: 'foreshore-history',
    slug: 'geelong-foreshore-history-city-and-bay',
    type: 'history',
    title: 'The Geelong Foreshore: A City\'s Relationship With Its Bay',
    excerpt: 'For most of its European history, Geelong\'s waterfront was industrial — a working port, not a promenade. The transformation took decades.',
    heroImg: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80',
    beforeImg: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80',
    afterImg: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    publishedAt: '2026-05-20',
    author: 'What Was Geelong',
    businessIds: ['eastern-beach', 'the-wharf'],
    eventIds: [],
    tags: ['history', 'waterfront', 'heritage'],
    content: `<p>Today's Geelong waterfront — six kilometres from Rippleside to St Helens — is one of the most popular public spaces in regional Victoria. On a summer weekend, thousands walk, cycle, swim, and dine along its length. It's hard to imagine it any other way.</p><p>But for most of Geelong's European history, the waterfront was industrial. The bay was the engine of the city's economy: wool and wheat went out, goods and immigrants came in. The waterfront meant wharves, warehouses, and the constant movement of ships.</p><h2>Eastern Beach: A Rare Exception</h2><p>The Eastern Beach swimming enclosure, built in 1931, was one of the earliest deliberate investments in the waterfront as a leisure space. The art deco change rooms and circular enclosure were a statement of civic ambition — a gift to the public at the height of the Depression. They remain today, essentially unchanged, among the best examples of interwar public architecture in Victoria.</p><h2>The Shift</h2><p>The shift from working port to public promenade happened gradually across the second half of the 20th century, as port facilities consolidated and the city began to think differently about its relationship with the water. The Cunningham Pier redevelopment in the 1990s was a turning point, replacing derelict infrastructure with restaurants and public space. The Waterfront Geelong project in the 2000s completed the transformation — a waterfront that now belongs to everyone.</p>`,
  },
  {
    id: 'geelong-jail-history',
    slug: 'old-geelong-jail-bluestone-heritage',
    type: 'history',
    title: 'The Old Geelong Jail: From Bluestone Prison to Heritage Icon',
    excerpt: 'Built in the 1850s from local bluestone, the Old Geelong Jail is one of the finest examples of colonial penal architecture in Australia.',
    heroImg: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=1200&q=80',
    beforeImg: 'https://images.unsplash.com/photo-1580136579312-94651dfd596d?w=800&q=80',
    afterImg: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&q=80',
    publishedAt: '2026-05-10',
    author: 'What Was Geelong',
    businessIds: [],
    eventIds: [],
    tags: ['history', 'heritage', 'architecture'],
    content: `<p>When the Old Geelong Jail opened in 1853, it was designed to impose. The bluestone walls — quarried locally from the Barwon River — were three feet thick, the cell blocks arranged in a radial panopticon design that allowed a single guard to watch multiple wings simultaneously. It was architecture as a statement of power.</p><p>Over the following century, the jail housed some of Victoria's most notorious criminals, as well as hundreds of ordinary people whose offences ranged from murder to debt. Conditions were harsh; the accounts of those who served time here, particularly in the early colonial period, are often brutal.</p><h2>Closure and Transformation</h2><p>The jail closed as an operational prison in the 1990s, sitting dormant for years — too expensive to maintain, too historically significant to demolish. Its eventual transformation into a heritage tourism site preserved the building's integrity while giving it new purpose.</p><p>What's remarkable is how much the building still communicates its original intent. The bluestone is heavy and cold. The doors are very thick. The cells are very small. Whatever visitor layers have been added, the place still feels like what it was.</p>`,
  },
  {
    id: 'paper-mill-history',
    slug: 'geelong-paper-mill-fyansford-history',
    type: 'history',
    title: 'The Paper Mill: Geelong\'s Industrial Heart',
    excerpt: 'For over a century, the Australian Paper Mills at Fyansford was one of Geelong\'s largest employers. Its transformation tells the story of a city changing its economic identity.',
    heroImg: 'https://images.unsplash.com/photo-1513828583688-c52646db42da?w=1200&q=80',
    beforeImg: 'https://images.unsplash.com/photo-1574400434939-8ee53b0f80d5?w=800&q=80',
    afterImg: 'https://images.unsplash.com/photo-1544510808-91bc950c2398?w=800&q=80',
    publishedAt: '2026-04-30',
    author: 'What Was Geelong',
    businessIds: [],
    eventIds: [],
    tags: ['history', 'industry', 'heritage'],
    content: `<p>The Australian Paper Mills at Fyansford — established in 1876 on the banks of the Barwon River — was for decades one of the dominant features of Geelong's industrial geography. At its peak, the mill employed hundreds of workers and produced paper for newspapers across Victoria and New South Wales. The smell of the mill — a particular sulphurous, industrial musk — was part of the sensory experience of living in Geelong.</p><p>The mill's closure in 1996 left a gap — physical, economic, and psychological. The site covered over 40 hectares and included dozens of heritage-listed structures.</p><h2>What Came Next</h2><p>The Fyansford site has been subject to various redevelopment proposals over the years, with portions incorporated into residential and commercial development. Some original bluestone and brick structures have been retained and adapted. For many older Geelong residents, the mill represents something more than a building — it's a marker of a particular version of Geelong that no longer exists. The Barwon River heritage walk passes the old site; several structures are still visible from the bank.</p>`,
  },
  {
    id: 'the-gretchen',
    slug: 'the-gretchen-hotel-geelong-history',
    type: 'history',
    title: 'The Gretchen: Geelong\'s Most Storied Corner Hotel',
    excerpt: 'Built in 1854, the Gretchen Hotel is one of the oldest surviving hotel buildings in Geelong — and it has had many lives.',
    heroImg: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80',
    beforeImg: 'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=800&q=80',
    afterImg: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
    publishedAt: '2026-05-15',
    author: 'What Was Geelong',
    businessIds: [],
    eventIds: [],
    tags: ['history', 'heritage', 'pubs'],
    content: `<p>Corner hotels are a particular feature of Australian colonial streetscapes — two-storey brick buildings on prominent intersections, bar on the ground floor, accommodation above, designed to catch trade from every direction. Geelong has many. None has more stories than the Gretchen.</p><p>The building at the corner of Moorabool and Malop Streets has operated under a succession of names since it was first licensed in 1854, but Geelong locals have known it as the Gretchen for most of living memory. It's been a workers' pub, a live music venue, a backpackers' hostel, and more than once has looked genuinely close to closure.</p><h2>The Music Years</h2><p>In the 1980s and 1990s, the Gretchen's front bar was one of the most important venues on the Geelong live music circuit. A generation of local bands — and several that went on to larger things nationally — played on the small stage in the corner. The walls of the back bar still carry some of the old gig posters.</p><h2>The Architecture</h2><p>The building is a handsome example of Victorian commercial architecture — bluestone base, brick upper floor, original cast-iron verandah on both street frontages. The interior retains its pressed tin ceilings in the main bar. Heritage-listed since the 1980s, it's been protected from the aggressive renovations that stripped character from comparable buildings elsewhere. The building itself remains magnificent.</p>`,
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
const IS_LOCAL = ['localhost', '127.0.0.1'].includes(window.location.hostname);

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
function renderFeatured(events) {
  const el = document.getElementById('js-featured-event');
  if (!el) return;

  const ev = events.find(e => e.featured) || events[0];
  if (!ev) { el.innerHTML = ''; return; }

  const biz = ev.businessId ? getBusinessById(ev.businessId) : null;

  el.innerHTML = `
    <a href="${evLink(ev)}" class="featured-card">
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
    const isFree = ev.price === 'Free';
    const tagPills = (ev.tags || []).slice(0, 2).map(t =>
      `<span class="ev-tag ${t === 'Free' ? 'ev-tag--free' : ''}">${t}</span>`
    ).join('');
    return `
      <a href="${evLink(ev)}" class="event-card">
        <div class="event-card__thumb" style="background:${ev.color}22">${ev.emoji}</div>
        <div class="event-card__body">
          <span class="event-card__cat">${ev.category}</span>
          <h3 class="event-card__title">${ev.title}</h3>
          <div class="event-card__meta">📍 ${ev.location}</div>
          <div class="event-card__meta">🕐 ${ev.time}</div>
          ${tagPills ? `<div class="ev-tags">${tagPills}</div>` : ''}
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
      <a href="${bizLink(biz)}" class="biz-card">
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
          ${biz ? `<a href="${bizLink(biz)}" class="offer-card__biz">${biz.emoji} ${biz.name}</a>` : ''}
          <span class="offer-card__expires">⏳ ${pr.expires}</span>
        </div>
      </div>
    `;
  }).join('');
}

// ── CHIP FILTERS ──────────────────────────────────────────
function initChips() {
  const chipRow = document.getElementById('js-chip-row');
  const filterToggle = document.getElementById('js-filter-toggle');
  const filterPanel = document.getElementById('js-filter-panel');
  const filterCount = document.getElementById('js-filter-count');
  const filterClear = document.getElementById('js-filter-clear');
  if (!chipRow) return;

  let activeCat = 'All';
  const activeTags = new Set();

  function applyFilters() {
    let filtered = EVENTS;
    if (activeCat !== 'All') {
      filtered = filtered.filter(e => e.category === activeCat);
    }
    activeTags.forEach(tag => {
      filtered = filtered.filter(e => e.tags && e.tags.includes(tag));
    });
    renderFeatured(filtered);
    renderEvents(filtered);

    // Update filter button badge
    if (filterCount) {
      const n = activeTags.size;
      filterCount.textContent = n;
      filterCount.hidden = n === 0;
      filterToggle && filterToggle.classList.toggle('filter-btn--active', n > 0);
    }
    if (filterClear) filterClear.hidden = activeTags.size === 0;
  }

  // Category chips
  chipRow.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      chipRow.querySelectorAll('.chip').forEach(c => c.classList.remove('chip--active'));
      chip.classList.add('chip--active');
      activeCat = chip.dataset.cat || 'All';
      applyFilters();
    });
  });

  // Filter panel toggle
  if (filterToggle && filterPanel) {
    filterToggle.addEventListener('click', e => {
      e.stopPropagation();
      const open = filterPanel.classList.toggle('filter-panel--open');
      filterPanel.hidden = !open;
    });
    document.addEventListener('click', e => {
      if (filterPanel && !filterPanel.contains(e.target) && e.target !== filterToggle) {
        filterPanel.classList.remove('filter-panel--open');
        filterPanel.hidden = true;
      }
    });
  }

  // Tag chips inside filter panel
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const tag = chip.dataset.tag;
      if (activeTags.has(tag)) {
        activeTags.delete(tag);
        chip.classList.remove('filter-chip--active');
      } else {
        activeTags.add(tag);
        chip.classList.add('filter-chip--active');
      }
      applyFilters();
    });
  });

  // Clear filters
  filterClear && filterClear.addEventListener('click', () => {
    activeTags.clear();
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('filter-chip--active'));
    applyFilters();
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
      window.location.href = 'onboarding.html';
    });
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
async function initListingPage() {
  const params    = new URLSearchParams(window.location.search);
  // On Vercel, URL stays clean (/biz-slug) so read path; locally use ?s= or ?id=
  const pathSlug  = window.location.pathname.replace(/^\//, '').split('/')[0] || null;
  const slugParam = params.get('s') || (!params.get('id') && pathSlug && pathSlug !== 'listing.html' ? pathSlug : null);
  const idParam   = params.get('id');

  let biz = slugParam ? getBusinessBySlug(slugParam) : idParam ? getBusinessById(idParam) : null;

  // Fallback: fetch from Supabase by slug if not in local data
  if (!biz && slugParam && typeof db !== 'undefined') {
    const { data } = await db.from('businesses').select('*').eq('slug', slugParam).single();
    if (data) {
      biz = data;
      if (biz.business_id) biz.businessId = biz.business_id;
    }
  }

  if (!biz) {
    document.getElementById('js-listing-root').innerHTML =
      '<p style="padding:2rem">Business not found. <a href="index.html">Go home</a></p>';
    return;
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

  // Inquiry form (all listings)
  document.getElementById('js-listing-root').insertAdjacentHTML('beforeend', `
    <div class="container listing-body">
      <div class="listing-inq-card">
        <h3 class="listing-inq-title"><span class="material-symbols-rounded">mail</span> Send an inquiry</h3>
        <p class="listing-inq-sub">Ask ${biz.name} a question — they'll get back to you directly.</p>
        <div class="listing-inq-form">
          <div class="listing-inq-row">
            <input type="text"  class="ob-input" id="inq-name"  placeholder="Your name" />
            <input type="email" class="ob-input" id="inq-email" placeholder="Your email" />
          </div>
          <textarea class="ob-input" id="inq-msg" rows="3" placeholder="Your message…" style="resize:vertical"></textarea>
          <button class="btn btn--teal" id="js-inq-send">Send inquiry</button>
        </div>
        <div id="js-inq-success" hidden style="color:var(--teal);font-weight:700;padding:.5rem 0">
          ✓ Inquiry sent! ${biz.name} will be in touch.
        </div>
      </div>
    </div>
  `);

  document.getElementById('js-inq-send')?.addEventListener('click', () => {
    const name  = document.getElementById('inq-name').value.trim();
    const email = document.getElementById('inq-email').value.trim();
    const msg   = document.getElementById('inq-msg').value.trim();
    if (!email || !msg) return;

    // Save inquiry to the business profile if claimed
    const { getBusinessProfiles, setBusinessProfiles } = window;
    const inq = { name, email, message: msg, date: new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }), unread: true };
    try {
      const profiles = JSON.parse(localStorage.getItem('wtdg_biz_profiles') || '[]');
      const idx = profiles.findIndex(p => p.id === biz.id);
      if (idx >= 0) {
        if (!profiles[idx].inquiries) profiles[idx].inquiries = [];
        profiles[idx].inquiries.unshift(inq);
        localStorage.setItem('wtdg_biz_profiles', JSON.stringify(profiles));
      }
    } catch(e) {}

    document.getElementById('js-inq-send').hidden = true;
    document.getElementById('js-inq-success').hidden = false;
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

// ── STARRING / ITINERARY ─────────────────────────────────
function getSaved() {
  try { return JSON.parse(localStorage.getItem('wtdg_saved') || '[]'); } catch { return []; }
}

function toggleSave(item) {
  const saved = getSaved();
  const idx = saved.findIndex(s => s.id === item.id);
  if (idx >= 0) { saved.splice(idx, 1); } else { saved.push(item); }
  localStorage.setItem('wtdg_saved', JSON.stringify(saved));
  updateItinBadge();
  return idx < 0; // true = now saved
}

function isSaved(id) { return getSaved().some(s => s.id === id); }

function updateItinBadge() {
  const count = getSaved().length;
  const badge = document.getElementById('js-itin-badge');
  const countEl = document.getElementById('js-itin-count');
  if (!badge) return;
  badge.hidden = count === 0;
  if (countEl) countEl.textContent = count;
}

function addStarBtn(el, item) {
  const btn = document.createElement('button');
  btn.className = 'star-btn' + (isSaved(item.id) ? ' starred' : '');
  btn.setAttribute('aria-label', 'Save to itinerary');
  btn.textContent = isSaved(item.id) ? '⭐' : '☆';
  btn.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    const nowSaved = toggleSave(item);
    btn.classList.toggle('starred', nowSaved);
    btn.textContent = nowSaved ? '⭐' : '☆';
  });
  el.style.position = 'relative';
  el.appendChild(btn);
}

// ── NAV MOBILE TOGGLE ─────────────────────────────────────
function initNav() {
  const hamburger = document.querySelector('.nav__hamburger');
  const links = document.querySelector('.nav__links');
  if (!hamburger || !links) return;

  hamburger.addEventListener('click', () => {
    const isOpen = links.classList.toggle('nav--open');
    hamburger.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close when clicking a plain link (not a dropdown toggle)
  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      links.classList.remove('nav--open');
      document.body.style.overflow = '';
    });
  });

  // Dropdown toggle — click-based (works on desktop hover AND mobile tap)
  document.querySelectorAll('.nav__drop-toggle').forEach(toggle => {
    toggle.addEventListener('click', e => {
      e.stopPropagation();
      const drop = toggle.closest('.nav__drop');
      const isOpen = drop.classList.toggle('open');
      // Close other dropdowns
      document.querySelectorAll('.nav__drop').forEach(d => {
        if (d !== drop) d.classList.remove('open');
      });
      // Rotate chevron
      const icon = toggle.querySelector('.material-symbols-rounded');
      if (icon) icon.style.transform = isOpen ? 'rotate(180deg)' : '';
    });
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', () => {
    document.querySelectorAll('.nav__drop').forEach(d => d.classList.remove('open'));
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

  root.innerHTML = `
    <div class="ev-hero" style="background:${ev.color}18;border-bottom:3px solid ${ev.color}">
      <div class="container ev-hero__inner">
        <a href="index.html" class="listing-back">← Back to What To Do Geelong</a>
        <div class="ev-hero__emoji">${ev.emoji}</div>
        <span class="ev-hero__cat">${ev.category}</span>
        <h1 class="ev-hero__title">${ev.title}</h1>
        <div class="ev-hero__meta">
          <span><span class="material-symbols-rounded">calendar_month</span> ${ev.date}</span>
          <span><span class="material-symbols-rounded">schedule</span> ${ev.time}</span>
          <span><span class="material-symbols-rounded">location_on</span> ${ev.location}</span>
        </div>
        <div class="ev-hero__price-row">
          <span class="ev-price ${ev.price === 'Free' ? 'ev-price--free' : ''}">${ev.price}</span>
          ${ev.price !== 'Free' ? `<a href="#" class="btn btn--teal">Get Tickets →</a>` : `<span class="btn btn--teal">Free Entry</span>`}
        </div>
      </div>
    </div>

    <div class="container ev-body">
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
          ${biz.website ? `<a href="https://${biz.website}" target="_blank" rel="noopener" class="btn btn--outline btn--sm" style="margin-top:.5rem">🌐 Visit ${biz.website}</a>` : ''}
        </div>
      ` : ''}

      <div class="ev-also">
        <h2 class="ev-also__title">More this weekend</h2>
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

  // Render other events in the strip
  const others = EVENTS.filter(e => e.id !== ev.id).slice(0, 6);
  const strip = document.getElementById('js-ev-also-scroll');
  if (strip) {
    strip.innerHTML = others.map(e => `
      <a href="${evLink(e)}" class="event-card">
        <div class="event-card__thumb" style="background:${e.color}22">${e.emoji}</div>
        <div class="event-card__body">
          <span class="event-card__cat">${e.category}</span>
          <h3 class="event-card__title">${e.title}</h3>
          <div class="event-card__meta">📍 ${e.location}</div>
          <div class="event-card__meta">🕐 ${e.time}</div>
          <button class="event-card__cta ${e.price === 'Free' ? 'event-card__cta--free' : ''}">${e.price === 'Free' ? 'Free Entry' : 'Get Tickets →'}</button>
        </div>
      </a>
    `).join('');
  }
}

// ── EVENTS SEE-ALL PAGE ───────────────────────────────────
function initEventsPage() {
  const root = document.getElementById('js-events-root');
  if (!root) return;

  root.innerHTML = EVENTS.map(ev => {
    const biz = ev.businessId ? getBusinessById(ev.businessId) : null;
    return `
      <a href="${evLink(ev)}" class="upcoming-item">
        <div class="upcoming-item__date" style="background:${ev.color}22;color:${ev.color}">
          <span class="upcoming-item__day">${ev.date.split(' ')[1]}</span>
          <span class="upcoming-item__mon">${ev.date.split(' ')[0]}</span>
        </div>
        <div class="upcoming-item__body">
          <span class="upcoming-item__cat">${ev.category}</span>
          <span class="upcoming-item__title">${ev.title}</span>
          <span class="upcoming-item__sub">📍 ${ev.location} · 🕐 ${ev.time}</span>
          <span class="upcoming-item__ticket">🎟 ${ev.price}${biz ? ` · ${biz.name}` : ''}</span>
        </div>
        <span class="material-symbols-rounded" style="color:var(--teal);flex-shrink:0;align-self:center">chevron_right</span>
      </a>
    `;
  }).join('');
}

// ── EAT SEE-ALL PAGE ──────────────────────────────────────
function initEatPage() {
  const root = document.getElementById('js-eat-root');
  if (!root) return;

  const eatBiz = BUSINESSES.filter(b => b.section === 'eat');
  root.innerHTML = eatBiz.map(biz => {
    const hasEvent = businessHasUpcoming(biz.id);
    const hasPromo = businessHasPromo(biz.id);
    return `
      <a href="${bizLink(biz)}" class="biz-list-card">
        ${biz.img ? `<img src="${biz.img}" alt="${biz.name}" class="biz-list-card__img" loading="lazy" />` : `<div class="biz-list-card__img" style="background:${biz.color}22;display:flex;align-items:center;justify-content:center;font-size:2.5rem">${biz.emoji}</div>`}
        <div class="biz-list-card__body">
          <div class="biz-list-card__top">
            <div>
              <span class="biz-list-card__type">${biz.type} · ${biz.suburb}</span>
              <h3 class="biz-list-card__name">${biz.name}</h3>
              <p class="biz-list-card__desc">${biz.description}</p>
            </div>
          </div>
          <div class="biz-list-card__foot">
            <span class="biz-list-card__loc">📍 ${biz.location}</span>
            <div class="biz-list-card__badges">
              ${hasEvent ? '<span class="biz-badge biz-badge--event">Event</span>' : ''}
              ${hasPromo ? '<span class="biz-badge biz-badge--promo">Offer</span>' : ''}
            </div>
          </div>
        </div>
        <span class="material-symbols-rounded" style="color:var(--teal);flex-shrink:0;align-self:center;padding:.5rem">chevron_right</span>
      </a>
    `;
  }).join('');
}

// ── STAY SEE-ALL PAGE ─────────────────────────────────────
function initStayPage() {
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

// ── ADSENSE POPUP (every 5 page loads) ───────────────────
function initAdPopup() {
  try {
    let views = parseInt(localStorage.getItem('wtdg_page_views') || '0', 10) + 1;
    localStorage.setItem('wtdg_page_views', views);
    if (views % 5 !== 0) return;

    const overlay = document.createElement('div');
    overlay.className = 'ad-popup-overlay';
    overlay.innerHTML = `
      <div class="ad-popup">
        <button class="ad-popup__close" aria-label="Close ad">
          <span class="material-symbols-rounded">close</span>
        </button>
        <p class="ad-popup__label">Advertisement</p>
        <!-- AdSense Popup Ad — replace data-ad-slot with your slot ID from AdSense console -->
        <ins class="adsbygoogle ad-popup__unit"
             style="display:block"
             data-ad-client="ca-pub-7991778555943890"
             data-ad-slot="POPUP_SLOT_ID"
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
        <script>(adsbygoogle = window.adsbygoogle || []).push({});<\/script>
        <p class="ad-popup__skip">This ad supports free local content.</p>
      </div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('ad-popup-overlay--visible'));

    overlay.querySelector('.ad-popup__close').addEventListener('click', () => {
      overlay.classList.remove('ad-popup-overlay--visible');
      setTimeout(() => overlay.remove(), 300);
    });
    overlay.addEventListener('click', e => {
      if (e.target === overlay) {
        overlay.classList.remove('ad-popup-overlay--visible');
        setTimeout(() => overlay.remove(), 300);
      }
    });
  } catch(e) {}
}

// ── EDITORIAL HUB PAGE ────────────────────────────────────
function initEditorialPage() {
  const root = document.getElementById('js-editorial-root');
  if (!root) return;

  const filterBtns = document.querySelectorAll('[data-filter]');
  let activeFilter = 'all';

  function render(filter) {
    const filtered = filter === 'all' ? ARTICLES : ARTICLES.filter(a => a.type === filter);
    root.innerHTML = filtered.map(a => `
      <a href="${artLink(a)}" class="ed-card">
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
  initNav();

  // Try Supabase first; fall back silently to local static data if unavailable
  if (typeof loadAllData === 'function') {
    const remote = await loadAllData();
    if (remote) {
      if (remote.businesses.length) BUSINESSES = remote.businesses;
      if (remote.events.length)     EVENTS     = remote.events;
      if (remote.stays.length)      STAYS      = remote.stays;
      if (remote.promos.length)     PROMOS     = remote.promos;
      if (remote.articles.length)   ARTICLES   = remote.articles;
    }
  }

  initAdPopup();

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
    initRotatingBanner();
    updateItinBadge();

    // Editorial preview strip on homepage
    const editPreview = document.getElementById('js-editorial-preview');
    if (editPreview) {
      editPreview.innerHTML = ARTICLES.slice(0, 5).map(a => `
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
  if (document.getElementById('js-stay-root'))      initStayPage();
  if (document.getElementById('js-editorial-root')) initEditorialPage();
  if (document.getElementById('js-article-root'))   initArticlePage();
  if (document.getElementById('js-wwg-root'))       initWhatWasGeelongPage();
});
