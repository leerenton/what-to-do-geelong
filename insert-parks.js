// Insert additional park listings into Supabase
const { createClient } = require('@supabase/supabase-js');
let ws; try { ws = require('ws'); } catch {}

const SUPABASE_URL = 'https://duhxszqyyzrbzrhwneey.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1aHhzenF5eXpyYnpyaHduZWV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDcyNTc1OCwiZXhwIjoyMDk2MzAxNzU4fQ.iXhO6IWYgZl-58thx2ZUySg5Dt0-s9QXYS98j4fvRQ8';
const db = createClient(SUPABASE_URL, SUPABASE_KEY, ws ? { realtime: { transport: ws } } : {});

const PARKS = [
  {
    id: 'you-yangs-regional-park',
    slug: 'you-yangs-regional-park',
    name: 'You Yangs Regional Park',
    type: 'Parks & Nature',
    section: 'do',
    description: 'A dramatic granite outcrop rising from the Werribee plains, visible from across Geelong on a clear day. The You Yangs offer excellent walking and mountain biking — the summit track to Flinders Peak takes about 45 minutes and rewards you with sweeping views over Port Phillip Bay, the Geelong skyline and beyond. Koalas are reliably spotted in the gum trees near the carpark. Entry fee via Parks Victoria.',
    emoji: '🏔️',
    color: '#4a7c59',
    location: '55 Geelong-Bacchus Marsh Rd, Little River VIC 3211',
    suburb: 'Little River',
    website: 'parks.vic.gov.au',
    lat: -37.9167,
    lng: 144.3333,
    img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
  },
  {
    id: 'geelong-botanic-gardens',
    slug: 'geelong-botanic-gardens',
    name: 'Geelong Botanic Gardens',
    type: 'Parks & Nature',
    section: 'do',
    description: 'Established in 1851, the Geelong Botanic Gardens is one of the finest regional botanic gardens in Australia. The collection of Southern Hemisphere flora is nationally significant, and the garden design — a rolling Victorian landscape with magnificent specimen trees — is a joy to walk through. The 21st Century Garden is a contemporary addition worth seeking out. Free entry.',
    emoji: '🌿',
    color: '#2d6a4f',
    location: 'Garden St, East Geelong VIC 3219',
    suburb: 'East Geelong',
    website: 'geelongbotanicgardens.com.au',
    lat: -38.1508,
    lng: 144.3775,
    img: 'https://images.unsplash.com/photo-1585320806297-9794b3e4abb5?w=800&q=80',
  },
  {
    id: 'rippleside-park-geelong',
    slug: 'rippleside-park-geelong',
    name: 'Rippleside Park',
    type: 'Parks & Nature',
    section: 'do',
    description: 'A beloved foreshore park at the northern end of the Geelong waterfront. Rippleside Park has beautiful bay views, a children\'s adventure playground, barbecue facilities, and a relaxed grassy foreshore perfect for picnics. One of the best spots in Geelong to watch the sun set over Corio Bay. Easy walk or ride along the waterfront from the CBD.',
    emoji: '🌅',
    color: '#0077b6',
    location: 'Melbourne Rd, Rippleside VIC 3215',
    suburb: 'Rippleside',
    website: null,
    lat: -38.1268,
    lng: 144.3548,
    img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
  },
  {
    id: 'serendip-sanctuary-lara',
    slug: 'serendip-sanctuary-lara',
    name: 'Serendip Sanctuary',
    type: 'Parks & Nature',
    section: 'do',
    description: 'A Parks Victoria wildlife sanctuary on the Bellarine Highway near Lara. Home to eastern grey kangaroos, emus, brolgas, and a range of native waterbirds on the wetlands. The walking tracks wind through grassland and woodland habitats — one of the best places near Geelong to see native wildlife in a natural setting. Free entry.',
    emoji: '🦘',
    color: '#6b4226',
    location: 'Windermere Rd, Lara VIC 3212',
    suburb: 'Lara',
    website: 'parks.vic.gov.au',
    lat: -38.0280,
    lng: 144.4030,
    img: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&q=80',
  },
  {
    id: 'queens-park-geelong',
    slug: 'queens-park-geelong',
    name: 'Queens Park',
    type: 'Parks & Nature',
    section: 'do',
    description: 'A large heritage parkland on the banks of the Barwon River in South Geelong, featuring the famous Barwon River Trail. Beautiful river views, towering River Red Gums, a rose garden, and a heritage rotunda make this one of Geelong\'s most picturesque parks. The Barwon River Trail passes through here — ideal for walking, running or cycling.',
    emoji: '🌳',
    color: '#40916c',
    location: 'Barwon River, South Geelong VIC 3220',
    suburb: 'South Geelong',
    website: null,
    lat: -38.1530,
    lng: 144.3460,
    img: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80',
  },
  {
    id: 'point-lonsdale-lighthouse-reserve',
    slug: 'point-lonsdale-lighthouse-reserve',
    name: 'Point Lonsdale Lighthouse Reserve',
    type: 'Parks & Nature',
    section: 'do',
    description: 'The Point Lonsdale Lighthouse has stood guard over "The Rip" — the notoriously treacherous entrance to Port Phillip Bay — since 1902. The reserve around it offers dramatic coastal scenery, rock pools, whale watching in season, and views across to Point Nepean. Walk down to the surf beach below or explore the clifftop path to Queenscliff.',
    emoji: '🏠',
    color: '#023e8a',
    location: 'Point Lonsdale VIC 3225',
    suburb: 'Point Lonsdale',
    website: null,
    lat: -38.2756,
    lng: 144.6140,
    img: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80',
  },
  {
    id: 'barwon-heads-bluff-reserve',
    slug: 'barwon-heads-bluff-reserve',
    name: 'Barwon Heads Bluff Reserve',
    type: 'Parks & Nature',
    section: 'do',
    description: 'A dramatic coastal reserve at the mouth of the Barwon River, immortalised as the setting for the TV series Sea Change. The Bluff lookout offers panoramic views over Bass Strait and the Bellarine coast. Walk down to the main beach, explore the estuary, or catch the famous Barwon Heads sunset from the clifftop. A 45-minute drive from Geelong CBD.',
    emoji: '🌊',
    color: '#0096c7',
    location: 'The Bluff, Barwon Heads VIC 3227',
    suburb: 'Barwon Heads',
    website: null,
    lat: -38.2689,
    lng: 144.4993,
    img: 'https://images.unsplash.com/photo-1509233725247-49e657c54213?w=800&q=80',
  },
  {
    id: 'thomson-reservoir-park',
    slug: 'thomson-reservoir-park',
    name: 'Barwon Valley Activity Centre',
    type: 'Parks & Nature',
    section: 'do',
    description: 'A popular recreational hub on the Barwon River in Newtown, with walking and cycling tracks, barbecue areas, a children\'s playground, and excellent river views. The Barwon River Trail begins here, running through Queens Park toward Buckley Falls. One of Geelong\'s most used recreational spaces — busy with walkers, cyclists and families on weekends.',
    emoji: '🚴',
    color: '#52b788',
    location: 'Barwon Valley, Newtown VIC 3220',
    suburb: 'Newtown',
    website: null,
    lat: -38.1560,
    lng: 144.3380,
    img: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80',
  },
  {
    id: 'limeburners-point-reserve',
    slug: 'limeburners-point-reserve',
    name: "Limeburners Point Reserve",
    type: 'Parks & Nature',
    section: 'do',
    description: 'A quiet, underrated foreshore reserve at the western end of the Geelong waterfront, popular with birdwatchers, fishers and those seeking a more peaceful stretch of bay. The wetlands at Limeburners attract a wide variety of shorebirds. A hidden gem for those who find Eastern Beach too busy — the views over Corio Bay are equally good.',
    emoji: '🦅',
    color: '#457b9d',
    location: 'Limeburners Point Reserve, North Shore VIC',
    suburb: 'North Shore',
    website: null,
    lat: -38.1180,
    lng: 144.3360,
    img: 'https://images.unsplash.com/photo-1504208434309-cb69f4fe52b0?w=800&q=80',
  },
];

async function run() {
  console.log(`📍 Inserting ${PARKS.length} park listings...`);
  for (const park of PARKS) {
    const { error } = await db.from('businesses').upsert(park, { onConflict: 'id' });
    if (error) {
      console.error(`❌ ${park.name}:`, error.message);
    } else {
      console.log(`✅ ${park.name}`);
    }
  }
  console.log('\n🌿 Done!');
}

run();
