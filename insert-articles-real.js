// Update WTDG articles with real Geelong content based on actual Supabase listings
const { createClient } = require('@supabase/supabase-js');
let ws; try { ws = require('ws'); } catch {}

const SUPABASE_URL = 'https://duhxszqyyzrbzrhwneey.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1aHhzenF5eXpyYnpyaHduZWV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDcyNTc1OCwiZXhwIjoyMDk2MzAxNzU4fQ.iXhO6IWYgZl-58thx2ZUySg5Dt0-s9QXYS98j4fvRQ8';

const db = createClient(SUPABASE_URL, SUPABASE_KEY, ws ? { realtime: { transport: ws } } : {});

// IDs to delete (old dummy articles — history articles are kept)
const DELETE_IDS = [
  'top-5-cafes',
  'waterfront-guide',
  'weekend-itinerary',
  'pistol-pete-expansion',
  'gpac-2026-season',
];

const ARTICLES = [
  {
    id: 'best-cafes-geelong',
    slug: 'best-cafes-geelong',
    type: 'guide',
    title: 'The Best Cafes in Geelong',
    excerpt: "From a Japanese cat café on the waterfront to a specialty roaster in the Botanic Gardens — Geelong's café scene is quietly one of regional Victoria's best.",
    hero_img: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=80',
    published_at: '2026-06-02',
    author: 'WTDG Editorial',
    business_ids: [
      'cat-themed-japanese-cafe-neko-geelong-geelong',
      'funk-by-botanical-brew-geelong-west',
      'southamerica-coffee-co-geelong',
      'wym-geelong-botanic-gardens-east-geelong',
      'native-circles-geelong',
    ],
    event_ids: [],
    tags: ['food', 'cafes', 'guide'],
    content: `<p>Geelong's café scene has grown into something genuinely worth seeking out. Independent, character-filled spaces are scattered across the CBD, Geelong West, and out to the waterfront — here are five that stand out.</p>

<h2>1. Neko Geelong — CBD Waterfront</h2>
<p>A Japanese-themed cat café right in the heart of Geelong — friendly resident cats, matcha lattes, Japanese-inspired food, and a vibe unlike anything else in the region. A genuine experience as much as a café. Book ahead online as spots fill quickly, especially on weekends.</p>
<p><a href="/cat-themed-japanese-cafe-neko-geelong-geelong">View listing →</a></p>

<h2>2. Funk by Botanical Brew — Geelong West</h2>
<p>Kombucha, cold brew, and an all-day menu built around wholefoods and seasonal produce. Funk has carved out a loyal following in Geelong West — the space is relaxed and bright, and the food genuinely holds up beyond the health-café category. Great for a long brunch.</p>
<p><a href="/funk-by-botanical-brew-geelong-west">View listing →</a></p>

<h2>3. SouthAmerica Coffee Co — CBD</h2>
<p>Latin-inspired specialty coffee in the Geelong CBD. Single-origin beans, excellent espresso, and a food menu that goes its own direction — empanadas alongside the smashed avo. A welcome point of difference in the city centre.</p>
<p><a href="/southamerica-coffee-co-geelong">View listing →</a></p>

<h2>4. WYM | Geelong Botanic Gardens — East Geelong</h2>
<p>Tucked inside the grounds of the Geelong Botanic Gardens, WYM is one of the most quietly pleasant café settings in the city. Good coffee, simple food, and access to one of the best public gardens in regional Victoria — make a morning of it.</p>
<p><a href="/wym-geelong-botanic-gardens-east-geelong">View listing →</a></p>

<h2>5. Native Circles — CBD</h2>
<p>A café with an Indigenous-Australian lens — native ingredients woven throughout the menu, from wattleseed lattes to lemon myrtle baked goods. A distinctive and thoughtful offering that reflects a side of Geelong culture not often seen in a café context.</p>
<p><a href="/native-circles-geelong">View listing →</a></p>`,
  },
  {
    id: 'best-breweries-geelong',
    slug: 'best-breweries-geelong',
    type: 'guide',
    title: 'The Best Breweries in Geelong',
    excerpt: "Geelong and the Bellarine Peninsula have become one of Victoria's best craft beer destinations. Here are five breweries worth the visit.",
    hero_img: 'https://images.unsplash.com/photo-1559839914-17aae19cec71?w=1200&q=80',
    published_at: '2026-06-05',
    author: 'WTDG Editorial',
    business_ids: [
      'bellarine-brewing-company-south-geelong',
      'great-ocean-road-brewing-south-geelong',
      'white-rabbit-brewery-barrel-hall-geelong-geelong',
      'blackmans-brewery-geelong-grovedale',
      'mt-pleasant-rd-brewers-taproom-bar-belmont',
    ],
    event_ids: [],
    tags: ['drink', 'breweries', 'guide'],
    content: `<p>Geelong's craft beer scene has grown steadily over the past decade. From established names on the waterfront to newer suburban taprooms, there's a genuine brewery trail to explore — here are five to start with.</p>

<h2>1. Bellarine Brewing Company — South Geelong</h2>
<p>A Geelong staple and one of the region's most well-regarded breweries. Bellarine Brewing produces a broad, well-made range — easy-drinking lagers to hoppy IPAs — and the taproom is a great spot to settle in for an afternoon. Regularly updated seasonal releases keep things interesting.</p>
<p><a href="/bellarine-brewing-company-south-geelong">View listing →</a></p>

<h2>2. Great Ocean Road Brewing — South Geelong</h2>
<p>Named for one of the world's great coastal drives that begins just down the road, Great Ocean Road Brewing brings serious craft credentials to the Geelong scene. Their hazy and session ales have built a strong local following, and the taproom is one of the more relaxed drinking spaces in the city.</p>
<p><a href="/great-ocean-road-brewing-south-geelong">View listing →</a></p>

<h2>3. White Rabbit Brewery & Barrel Hall — Geelong</h2>
<p>The White Rabbit Barrel Hall is a remarkable space — rows of wooden barrels ageing mixed-fermentation ales in a beautifully converted industrial building. Come for the White Ale, stay to explore the barrel-aged range. One of the best brewery experiences in Victoria, full stop.</p>
<p><a href="/white-rabbit-brewery-barrel-hall-geelong-geelong">View listing →</a></p>

<h2>4. Blackmans Brewery — Grovedale</h2>
<p>Blackmans has been a fixture of the Geelong craft beer scene for years. The Grovedale venue offers the full range in a spacious taproom with a great beer garden. The Pale Ale and Hazy IPA are crowd favourites; seasonal and limited releases are worth keeping an eye on.</p>
<p><a href="/blackmans-brewery-geelong-grovedale">View listing →</a></p>

<h2>5. Mt Pleasant Rd Brewers Taproom + Bar — Belmont</h2>
<p>A neighbourhood taproom in Belmont that punches well above its size. Small-batch brewing with a focus on quality and variety — the kind of local you want in your suburb. Friendly staff, rotating taps, and a genuinely welcoming atmosphere.</p>
<p><a href="/mt-pleasant-rd-brewers-taproom-bar-belmont">View listing →</a></p>`,
  },
  {
    id: 'best-bellarine-wineries',
    slug: 'best-bellarine-wineries',
    type: 'guide',
    title: 'The Best Wineries on the Bellarine Peninsula',
    excerpt: "Pinot Noir, Chardonnay, and sweeping bay views — the Bellarine Peninsula is one of Victoria's most exciting cool-climate wine regions.",
    hero_img: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1200&q=80',
    published_at: '2026-05-28',
    author: 'WTDG Editorial',
    business_ids: [
      'oakdene-vineyards-cellar-door-wallington',
      'scotchmans-hill-winery-drysdale',
      'terindah-estate-bellarine',
      'bellarine-estate-bellarine',
      'kilgour-wines-bellarine',
    ],
    event_ids: [],
    tags: ['drink', 'wineries', 'bellarine', 'guide'],
    content: `<p>The Bellarine Peninsula wine region produces cool-climate Pinot Noir and Chardonnay that regularly rival the Yarra Valley and Mornington Peninsula. A 30-minute drive from Geelong CBD opens up a full day of cellar doors, long lunches, and bay views. Here are five to build your visit around.</p>

<h2>1. Oakdene Vineyards — Wallington</h2>
<p>One of the Bellarine's most celebrated estates. Oakdene produces elegant, terroir-driven wines — the Chardonnay and Pinot Noir are consistently excellent — and the cellar door restaurant is one of the best long-lunch destinations in the region. Book well ahead for weekend dining.</p>
<p><a href="/oakdene-vineyards-cellar-door-wallington">View listing →</a></p>

<h2>2. Scotchmans Hill Winery — Drysdale</h2>
<p>A pioneer of the Geelong wine region, established in 1982. Scotchmans Hill makes benchmark Bellarine Pinot Noir and Chardonnay, and the cellar door sits on a beautiful elevated site with views over Swan Bay. The Swan Bay range offers excellent value; the reserve tier wines are among the finest in the region.</p>
<p><a href="/scotchmans-hill-winery-drysdale">View listing →</a></p>

<h2>3. Terindah Estate — Bellarine</h2>
<p>Perched on a ridge with some of the most dramatic bay views on the peninsula, Terindah Estate combines well-made estate wines with a stunning cellar door setting. The Chardonnay and rosé are popular choices on a sunny afternoon. Check ahead on weekends as the venue is also a popular events space.</p>
<p><a href="/terindah-estate-bellarine">View listing →</a></p>

<h2>4. Bellarine Estate — Bellarine</h2>
<p>A relaxed, family-friendly cellar door in the heart of the Bellarine. Bellarine Estate keeps things approachable — the wines are easy-drinking and well-priced, and the property is a lovely place to spend a couple of hours. A good option if you want somewhere laid-back and unhurried.</p>
<p><a href="/bellarine-estate-bellarine">View listing →</a></p>

<h2>5. Kilgour Wines — Bellarine</h2>
<p>A boutique producer making small-batch wines from estate-grown fruit on the Bellarine. The range is tight and focused — this is a winery that knows what it does well and does it carefully. A quieter, more intimate cellar door experience compared to the larger estates.</p>
<p><a href="/kilgour-wines-bellarine">View listing →</a></p>`,
  },
  {
    id: 'best-parks-geelong',
    slug: 'best-parks-outdoor-spaces-geelong',
    type: 'guide',
    title: "Geelong's Best Parks and Outdoor Spaces",
    excerpt: 'Eastern Beach, Balyang Sanctuary, Buckley Falls and more — the green spaces that make Geelong one of Victoria\'s most liveable cities.',
    hero_img: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1200&q=80',
    published_at: '2026-05-20',
    author: 'WTDG Editorial',
    business_ids: [
      'eastern-beach-reserve-geelong',
      'balyang-sanctuary-newtown',
      'buckley-falls-park-highton',
      'eastern-park-east-geelong',
      'steampacket-gardens-geelong',
    ],
    event_ids: [],
    tags: ['outdoors', 'parks', 'nature', 'guide'],
    content: `<p>Geelong is unusually well-served with accessible green space — parks, reserves, and waterfront gardens spread right across the city. Here are five of the best, whether you're after a morning walk, a family afternoon, or somewhere to watch the sunset.</p>

<h2>1. Eastern Beach Reserve — Geelong Waterfront</h2>
<p>The city's most-loved public space. The 1931 art deco swimming enclosure, grassy foreshore, waterfront promenade, and iconic bollard sculptures make Eastern Beach the natural starting point for any Geelong visit. Walk east to the Botanic Gardens or west toward Steampacket Gardens.</p>
<p><a href="/eastern-beach-reserve-geelong">View listing →</a></p>

<h2>2. Balyang Sanctuary — Newtown</h2>
<p>A hidden gem on the banks of the Barwon River in Newtown. Balyang is a small wildlife sanctuary with free-roaming peacocks, waterfowl, and beautiful river walks. The kind of place Geelong locals have known about for years and visitors consistently love. Free entry, dogs on lead welcome.</p>
<p><a href="/balyang-sanctuary-newtown">View listing →</a></p>

<h2>3. Buckley Falls Park — Highton</h2>
<p>Follows the Barwon River through one of Geelong's most scenic natural corridors. The falls themselves are dramatic after rain, and the surrounding park offers excellent walking tracks through native bush. A genuine slice of natural Geelong just minutes from the CBD.</p>
<p><a href="/buckley-falls-park-highton">View listing →</a></p>

<h2>4. Eastern Park — East Geelong</h2>
<p>Adjacent to the Botanic Gardens and one of Geelong's oldest parklands. Eastern Park is a broad, relaxed space — perfect for a picnic, a morning run, or just sitting in the sun. The rose garden and heritage plantings are worth a slow walk through.</p>
<p><a href="/eastern-park-east-geelong">View listing →</a></p>

<h2>5. Steampacket Gardens — Geelong Waterfront</h2>
<p>A beautifully maintained waterfront park in the heart of Geelong. Steampacket Gardens hosts many of the city's major outdoor events — concerts, markets, festivals — but on an ordinary day it's simply a great place to sit by the water. The lawns slope gently toward Corio Bay; bring a rug and something cold to drink.</p>
<p><a href="/steampacket-gardens-geelong">View listing →</a></p>`,
  },
  {
    id: 'geelong-waterfront-guide',
    slug: 'geelong-waterfront-guide',
    type: 'guide',
    title: 'The Ultimate Geelong Waterfront Guide',
    excerpt: "Stretching from Rippleside to St Helens, the Geelong waterfront is the city's beating heart — here's how to do it from dawn to after dark.",
    hero_img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80',
    published_at: '2026-05-28',
    author: 'WTDG Editorial',
    business_ids: [
      'eastern-beach-reserve-geelong',
      'steampacket-gardens-geelong',
      'little-creatures-brewery-geelong-geelong',
      'geelong-waterfront-geelong',
    ],
    event_ids: [],
    tags: ['waterfront', 'guide', 'outdoors'],
    content: `<p>Geelong's waterfront is one of the most enjoyable urban waterfronts in Victoria — and most visitors only scratch the surface. Here's how to do it properly, from morning coffee to sunset.</p>

<h2>Morning: Eastern Beach</h2>
<p>Start at <a href="/eastern-beach-reserve-geelong">Eastern Beach Reserve</a>, where the 1930s art deco swimming enclosure creates one of the prettiest beach settings in regional Victoria. Take a swim if the weather's right, grab a coffee from the kiosk, and walk the promenade east toward the Botanic Gardens.</p>

<h2>Midday: Steampacket Gardens & the Pier</h2>
<p>Head toward <a href="/steampacket-gardens-geelong">Steampacket Gardens</a> and the Cunningham Pier precinct. This stretch of the waterfront has restaurants, cafés, and some of the best water views in the city — grab lunch here and watch the ferry traffic on the bay.</p>

<h2>Afternoon: Little Creatures</h2>
<p>Walk or ride north to Yarra Street Pier, home to <a href="/little-creatures-brewery-geelong-geelong">Little Creatures Brewery</a> — one of the best brewery settings in the state. The copper brewing tanks, wood-fired pizza, and waterfront terrace make it an easy place to spend an afternoon.</p>

<h2>Evening: Sunset on the <a href="/geelong-waterfront-geelong">Western Waterfront</a></h2>
<p>The western end of the waterfront faces directly into the sunset over the Bellarine Peninsula. Find a spot on the grass, watch the light change across Corio Bay, and consider that there are far worse ways to spend an evening.</p>`,
  },
  {
    id: 'perfect-48-hours-geelong',
    slug: 'perfect-48-hours-in-geelong',
    type: 'guide',
    title: 'The Perfect 48 Hours in Geelong',
    excerpt: "First time visiting? Our two-day itinerary covers the waterfront, a Bellarine winery, Geelong's best galleries, and a morning on the Surf Coast.",
    hero_img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=80',
    published_at: '2026-06-01',
    author: 'WTDG Editorial',
    business_ids: [
      'eastern-beach-reserve-geelong',
      'little-creatures-brewery-geelong-geelong',
      'geelong-gallery-geelong',
      'oakdene-vineyards-cellar-door-wallington',
    ],
    event_ids: [],
    tags: ['guide', 'itinerary', 'weekend'],
    content: `<p>Geelong is 75 minutes from Melbourne by train and has more than earned its status as a destination in its own right. Here's how to spend 48 hours well.</p>

<h2>Saturday Morning</h2>
<p>Start at <a href="/eastern-beach-reserve-geelong">Eastern Beach Reserve</a> — take a morning swim in the art deco enclosure if conditions allow, then walk the promenade toward the CBD. Grab breakfast or coffee along the waterfront before heading into town.</p>

<h2>Saturday Afternoon</h2>
<p>Visit the <a href="/geelong-gallery-geelong">Geelong Gallery</a> — the permanent collection includes significant Australian art and there's almost always a strong temporary exhibition on. Then head to Yarra Street Pier for an afternoon session at <a href="/little-creatures-brewery-geelong-geelong">Little Creatures Brewery</a>.</p>

<h2>Saturday Evening</h2>
<p>Dinner in the CBD or on Pakington Street in Geelong West — check the WTDG eat listings for what's current. Check the Geelong Arts Centre program for evening shows.</p>

<h2>Sunday: Bellarine Day Trip</h2>
<p>Drive out to the Bellarine Peninsula — 30 minutes from the CBD. <a href="/oakdene-vineyards-cellar-door-wallington">Oakdene Vineyards</a> is one of the best long-lunch destinations in the region; book ahead. On the way back, stop at one of the Bellarine's smaller cellar doors or drive down to Queenscliff for views over the bay.</p>`,
  },
];

async function run() {
  // Delete old dummy articles (keep history articles)
  console.log('🗑  Deleting old dummy articles...');
  const { error: delError } = await db.from('articles').delete().in('id', [
    'top-5-cafes',
    'waterfront-guide',
    'weekend-itinerary',
    'pistol-pete-expansion',
    'gpac-2026-season',
  ]);
  if (delError) {
    console.error('Delete failed:', delError.message);
    process.exit(1);
  }
  console.log('✅ Old articles deleted');

  // Insert new articles
  console.log('📝 Inserting new articles...');
  for (const article of ARTICLES) {
    const { error } = await db.from('articles').upsert(article, { onConflict: 'id' });
    if (error) {
      console.error(`❌ Failed to insert "${article.title}":`, error.message);
    } else {
      console.log(`✅ ${article.title}`);
    }
  }

  console.log('\n🎉 Done! Articles updated in Supabase.');
}

run();
