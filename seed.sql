-- ── WHAT TO DO GEELONG — Seed Data ───────────────────────────
-- Paste this into your Supabase SQL Editor and click Run
-- Safe to re-run (uses INSERT ... ON CONFLICT DO UPDATE)

-- ── BUSINESSES ────────────────────────────────────────────────
INSERT INTO businesses (id, name, type, section, description, emoji, color, location, suburb, website, img) VALUES
  ('pistol-pete',         'Pistol Pete''s Coffee',   'Café',            'eat', 'Specialty espresso bar and all-day brunch on Pakington Street. Rotating single-origin pour-overs and a seasonal brunch menu that draws a serious coffee crowd.', '☕', '#f4a261', '116 Pakington St, Geelong West VIC 3218',      'Geelong West',  'pistolpetes.com.au',           'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80'),
  ('dr-morse',            'Dr Morse',                'Café',            'eat', 'Much-loved inner-city café on Little Malop Street. Great espresso, exceptional sourdough toast, and a loyal regular crowd.',                                      '☕', '#8d6e63', '77 Little Malop St, Geelong VIC 3220',          'Geelong CBD',   'drmorse.com.au',               'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80'),
  ('baba-ganoush',        'Baba Ganoush',            'Café',            'eat', 'Middle-Eastern inspired all-day café on Little Ryrie Street. The shakshuka with house-made flatbread has become something of a Geelong institution.',              '🫙', '#ff8f00', '83 Little Ryrie St, Geelong VIC 3220',          'Geelong CBD',   'babaganoush.com.au',           'https://images.unsplash.com/photo-1484980859-ea25e15becea?auto=format&fit=crop&w=800&q=80'),
  ('igni',                'Igni',                    'Restaurant',      'eat', 'Aaron Turner''s acclaimed farm-to-fire restaurant in the Geelong CBD. Seasonal Australian produce cooked over open flame — one of the most celebrated dining rooms in regional Victoria.', '🔥', '#6d4c41', '53 Little Ryrie St, Geelong VIC 3220', 'Geelong CBD', 'restaurantigni.com', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80'),
  ('the-wharf',           'The Wharf Shed',          'Restaurant',      'eat', 'Waterfront dining on Cunningham Pier. Fresh local seafood, craft beer on tap, and sweeping views across Corio Bay — a Geelong classic.',                          '⚓', '#3a86ff', 'Cunningham Pier, Geelong VIC 3220',             'Geelong CBD',   'wharfshed.com.au',             'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'),
  ('humble-rays',         'Humble Rays',             'Restaurant',      'eat', 'Neighbourhood restaurant on Pakington Street. Honest, seasonal cooking with a short menu, excellent natural wines, and a room that always feels full of the right energy.', '🍽️', '#e57373', '98 Pakington St, Geelong West VIC 3218', 'Geelong West', 'humblerays.com.au', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'),
  ('eastern-beach',       'Eastern Beach Kiosk',     'Café & Kiosk',    'eat', 'Iconic waterfront kiosk at Eastern Beach Reserve. Takeaway coffee, fish and chips, soft-serve, and the best bay views in the city. A Geelong institution.',        '🌊', '#4ac8d0', 'Eastern Beach Reserve, Geelong VIC 3220',       'Geelong',       '',                             'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'),
  ('little-creatures',    'Little Creatures Brewing','Bar & Restaurant', 'eat', 'Craft brewery and restaurant on the Geelong waterfront. Pale ales brewed on-site, wood-fired pizza, and a sprawling waterfront space that comes alive on a warm afternoon.', '🍺', '#f59e0b', '1 Yarra St, Geelong VIC 3220', 'Geelong CBD', 'littlecreatures.com.au', 'https://images.unsplash.com/photo-1559839914-17aae19cec71?auto=format&fit=crop&w=800&q=80'),
  ('barwon-club',         'The Barwon Club Hotel',   'Pub',             'eat', 'Beloved Pakington Street institution in Newtown. Great front bar, live music most weekends, proper pub food, and a loyal Sunday session crowd.',                   '🍻', '#5c6bc0', '110 Pakington St, Newtown VIC 3220',            'Newtown',       'barwonclub.com.au',            'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&w=800&q=80'),
  ('farmers-market',      'Geelong Farmers Market',  'Market',          'eat', 'Every Sunday at Johnstone Park. Connecting Geelong locals with the best regional produce, artisan food, and street vendors from across the Surf Coast and Bellarine.', '🥦', '#52b788', 'Johnstone Park, Geelong VIC 3220', 'Geelong CBD', 'geelongfarmersmarket.com.au', 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=800&q=80'),
  ('gpac',                'GPAC',                    'Arts & Culture',  'do',  'Geelong Performing Arts Centre — the region''s premier venue for theatre, dance, opera, comedy, and live performance. World-class programming in the heart of the CBD.', '🎭', '#e76f51', '50 Little Malop St, Geelong VIC 3220', 'Geelong CBD', 'gpac.org.au', 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=800&q=80'),
  ('geelong-art-gallery', 'Geelong Art Gallery',     'Gallery',         'do',  'One of Australia''s most significant regional galleries with an outstanding collection spanning 140 years. Free entry, excellent touring exhibitions, and a stunning heritage building.', '🖼️', '#9c27b0', '55 Little Malop St, Geelong VIC 3220', 'Geelong CBD', 'geelongartgallery.org.au', 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=800&q=80'),
  ('boom-gallery',        'Boom Gallery',            'Gallery',         'do',  'Contemporary art gallery on Pakington Street championing regional and emerging Australian artists. Open studios, exhibitions, workshops, and a ceramics studio.',  '🏺', '#9b5de5', '240 Pakington St, Newtown VIC 3220',            'Newtown',       'boomgallery.com.au',           'https://images.unsplash.com/photo-1580138955393-e26e89b56a3c?auto=format&fit=crop&w=800&q=80'),
  ('national-wool-museum','National Wool Museum',    'Museum',          'do',  'Australia''s only dedicated wool museum, housed in a stunning heritage bluestone building. Fascinating exhibits on the industry that built Geelong, plus interactive experiences for families.', '🐑', '#78909c', '26 Moorabool St, Geelong VIC 3220', 'Geelong CBD', 'nwm.vic.gov.au', 'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?auto=format&fit=crop&w=800&q=80')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type = EXCLUDED.type, section = EXCLUDED.section,
  description = EXCLUDED.description, emoji = EXCLUDED.emoji, color = EXCLUDED.color,
  location = EXCLUDED.location, suburb = EXCLUDED.suburb, website = EXCLUDED.website, img = EXCLUDED.img;

-- ── STAYS ─────────────────────────────────────────────────────
INSERT INTO stays (id, name, type, location, price, stars, emoji, color, img) VALUES
  ('s1', 'Novotel Geelong',          'Hotel',          'Cnr Gheringhap & Myers St, Geelong VIC 3220', '$199', '★★★★',  '🏨', '#4ac8d0', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'),
  ('s2', 'Quest Geelong Central',    'Apartment Hotel','15 Myers St, Geelong VIC 3220',               '$159', '★★★★',  '🏢', '#9b5de5', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'),
  ('s3', 'Mercure Geelong',          'Hotel',          '91 Myers St, Geelong VIC 3220',               '$135', '★★★',   '🏩', '#3a86ff', 'https://images.unsplash.com/photo-1551882547-ff40c599fb3f?auto=format&fit=crop&w=800&q=80'),
  ('s4', 'Surf Coast Retreat',       'Holiday House',  'Great Ocean Rd, Torquay VIC 3228',            '$285', '★★★★★', '🏡', '#52b788', 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=80'),
  ('s5', 'The Bellarine Farmhouse',  'Holiday House',  'Drysdale VIC 3222',                           '$320', '★★★★★', '🌿', '#84a98c', 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80'),
  ('s6', 'Mantra Southbank Geelong', 'Apartment Hotel','11 Eastern Beach Rd, Geelong VIC 3220',       '$175', '★★★★',  '🌊', '#0077b6', 'https://images.unsplash.com/photo-1582719508461-905c673536f6?auto=format&fit=crop&w=800&q=80')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, type = EXCLUDED.type, location = EXCLUDED.location,
  price = EXCLUDED.price, stars = EXCLUDED.stars, emoji = EXCLUDED.emoji,
  color = EXCLUDED.color, img = EXCLUDED.img;

-- ── EVENTS ────────────────────────────────────────────────────
INSERT INTO events (id, business_id, title, category, tags, date, time, location, price, emoji, color, featured) VALUES
  (1, 'farmers-market',      'Geelong Farmers Market',                       'Markets',       ARRAY['Free','Outdoors','All Ages','Family Friendly'], 'Sun 8 Jun',  '8am – 1pm',   'Johnstone Park, Geelong',                         'Free', '🥦', '#52b788', true),
  (2, 'little-creatures',    'Sunday Session at Little Creatures',           'Music',         ARRAY['Outdoors','All Ages','Free'],                    'Sun 8 Jun',  '2pm – 6pm',   'Little Creatures Brewing, Geelong Waterfront',    'Free', '🍺', '#f59e0b', false),
  (3, 'gpac',                'Opening Night: The Importance of Being Earnest','Theatre',      ARRAY['Under $50','Accessible'],                       'Fri 13 Jun', '7:30pm',      'GPAC, 50 Little Malop St, Geelong',               '$45',  '🎭', '#e76f51', false),
  (4, 'boom-gallery',        'Open Studio — Ceramic Art Weekend',            'Arts & Culture',ARRAY['Free','All Ages','Accessible','Family Friendly'],'Sat 7 Jun',  '11am – 5pm',  'Boom Gallery, 240 Pakington St, Newtown',         'Free', '🏺', '#9b5de5', false),
  (5, 'pistol-pete',         'Latte Art Masterclass',                        'Food & Drink',  ARRAY['Under $50','Bookings Required'],                 'Sat 14 Jun', '9am – 11am',  'Pistol Pete''s Coffee, 116 Pakington St, Geelong West', '$40', '☕', '#f4a261', false),
  (6, NULL,                  'Surf Coast Trail Run',                         'Sport',         ARRAY['Outdoors','Under $50'],                          'Sat 7 Jun',  '7am start',   'Anglesea Heathlands',                             '$35',  '🏃', '#3a86ff', false),
  (7, 'geelong-art-gallery', 'Free Family Sunday — Geelong Art Gallery',     'Arts & Culture',ARRAY['Free','Family Friendly','Accessible','All Ages'],'Sun 8 Jun',  '10am – 5pm',  'Geelong Art Gallery, 55 Little Malop St',         'Free', '🖼️', '#9c27b0', false),
  (8, 'national-wool-museum','Wool Tales: School Holiday Program',           'Education',     ARRAY['Family Friendly','Under $20','Accessible'],      'Sat 7 Jun',  '10am – 3pm',  'National Wool Museum, 26 Moorabool St, Geelong',  '$8',   '🐑', '#78909c', false),
  (9, 'barwon-club',         'Live Music: The Barwon Ramblers',              'Music',         ARRAY['Outdoors','All Ages','Under $20'],                'Sat 7 Jun',  '7pm – 10pm',  'The Barwon Club Hotel, 110 Pakington St, Newtown', '$10', '🎸', '#5c6bc0', false)
ON CONFLICT (id) DO UPDATE SET
  business_id = EXCLUDED.business_id, title = EXCLUDED.title, category = EXCLUDED.category,
  tags = EXCLUDED.tags, date = EXCLUDED.date, time = EXCLUDED.time,
  location = EXCLUDED.location, price = EXCLUDED.price, emoji = EXCLUDED.emoji,
  color = EXCLUDED.color, featured = EXCLUDED.featured;

-- ── PROMOS ────────────────────────────────────────────────────
INSERT INTO promos (id, business_id, title, description, expires, emoji, tag) VALUES
  ('p1', 'pistol-pete',    'Buy 4 Coffees, Get 1 Free',        'Every 4th coffee is on us at Pistol Pete''s. Show your loyalty card at the counter. Valid Mon–Fri.',              'Ongoing',       '☕', 'Loyalty Deal'),
  ('p2', 'gpac',           '20% Off Matinee Tickets',          'Use code MATINEE20 at checkout for any June matinee performance. Valid on selected shows.',                      'Valid all of June','🎟️','Discount'),
  ('p3', 'little-creatures','Jugs for $22 — Happy Hour Daily', '$22 jugs of Rogers'' Beer and Pale Ale every day 3pm–5pm. Waterfront views included.',                         'Ongoing',       '🍺', 'Happy Hour'),
  ('p4', 'boom-gallery',   'Free A3 Print with Any Artwork Purchase', 'Buy any original artwork from Boom Gallery in June and take home a complimentary A3 artist print.',     'June only',     '🖼️','Gift with Purchase'),
  ('p5', 'the-wharf',      'Half-Price Oysters — Friday Afternoons', 'Local Portarlington oysters at half price every Friday from 3pm. While stocks last.',                   'Every Friday',  '🦪', 'Weekly Special'),
  ('p6', 'igni',           'Lunch Tasting Menu — $75pp',       'The full Igni experience at lunch, five courses for $75 per person. Wednesday to Friday only. Bookings essential.','Ongoing',   '🔥', 'Special Menu'),
  ('p7', 'barwon-club',    '$15 Parma & Pot — Wednesday Nights','The classic done right. Chicken parma and a pot of Vic Bitter every Wednesday from 5pm.',                    'Every Wednesday','🍗','Weekly Special')
ON CONFLICT (id) DO UPDATE SET
  business_id = EXCLUDED.business_id, title = EXCLUDED.title, description = EXCLUDED.description,
  expires = EXCLUDED.expires, emoji = EXCLUDED.emoji, tag = EXCLUDED.tag;

-- ── ARTICLES ──────────────────────────────────────────────────
INSERT INTO articles (id, type, title, excerpt, hero_img, before_img, after_img, published_at, author, business_ids, event_ids, tags, content) VALUES
  ('top-5-cafes', 'guide', 'Top 5 Cafes in Geelong You Need to Visit',
    'From specialty single-origin pour-overs to legendary all-day brunch, Geelong''s cafe scene has levelled up — here are our five favourites.',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=80', NULL, NULL,
    '2026-06-02', 'WTDG Editorial', ARRAY['pistol-pete','eastern-beach'], ARRAY[]::integer[], ARRAY['food','cafes','guide'],
    '<p>Geelong''s coffee culture has quietly become one of the best in regional Victoria.</p><p>Whether you''re after a meticulously crafted single-origin pour-over or a sun-soaked brunch with bay views, the city delivers. Here are five cafes we keep returning to.</p><h2>1. Pistol Pete''s Coffee</h2><p>The benchmark for specialty espresso on Pakington Street. Rotating seasonal menu, considered brunch, and the best pour-over in the region.</p><h2>2. Eastern Beach Kiosk</h2><p>Nowhere in Geelong is better for a morning flat white with bay views. Unpretentious and exactly right for a lazy weekend morning.</p><h2>3. Moose Cafe</h2><p>A local institution on Little Malop Street — sourdough you could eat daily, and staff who remember your order.</p><h2>4. Baba Ganoush</h2><p>A full Middle-Eastern inspired brunch that has become something of a Geelong cult. The shakshuka with house-made flatbread is exceptional.</p><h2>5. The Shed</h2><p>Tucked into a laneway off Ryrie Street. Natural light, exposed brick, locally roasted beans. Go early on a Saturday.</p>'
  ),
  ('waterfront-guide', 'guide', 'The Ultimate Geelong Waterfront Guide',
    'Stretching 6km from Rippleside to St Helens, the Geelong waterfront is the city''s beating heart. Here''s everything you need to know.',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80', NULL, NULL,
    '2026-05-28', 'WTDG Editorial', ARRAY['eastern-beach','the-wharf'], ARRAY[1,2], ARRAY['waterfront','guide','outdoors'],
    '<p>Geelong''s waterfront is one of the most enjoyable urban waterfronts in Victoria — most visitors only scratch the surface. Here''s how to do it properly, from dawn to after dark.</p><h2>Morning: Eastern Beach</h2><p>Start at Eastern Beach Reserve, where the 1930s swimming enclosure and art deco change rooms create one of the prettiest beach settings in regional Victoria.</p><h2>Midday: Cunningham Pier</h2><p>Walk north along the promenade to Cunningham Pier, home to the Wharf Shed Café — fresh local seafood, craft beer on tap, and sweeping views across Corio Bay.</p><h2>Afternoon: Little Creatures</h2><p>Continue to the Yarra Street Pier precinct, where Little Creatures has established itself as one of the best brewery venues in the state.</p><h2>Evening: Sunset at St Helens</h2><p>The western end of the waterfront offers uninterrupted views of the Bellarine Peninsula at sunset.</p>'
  ),
  ('weekend-itinerary', 'guide', 'The Perfect 48 Hours in Geelong',
    'First time visiting? Here''s our definitive two-day itinerary — markets, brunch, bay views, live music, and a day trip to the Surf Coast.',
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=80', NULL, NULL,
    '2026-06-01', 'WTDG Editorial', ARRAY['pistol-pete','eastern-beach','the-wharf','boom-gallery'], ARRAY[1,2,3], ARRAY['guide','itinerary','weekend'],
    '<p>Geelong is two hours from Melbourne by train and has more than earned its status as a destination in its own right.</p><h2>Saturday Morning</h2><p>Start with coffee at Pistol Pete''s on Pakington Street, then walk down to the Geelong Farmers Market at Johnstone Park.</p><h2>Saturday Afternoon</h2><p>Walk or ride the waterfront from Eastern Beach to Cunningham Pier. Stop at the Wharf Shed for lunch. Head to Boom Gallery in Newtown in the afternoon.</p><h2>Saturday Evening</h2><p>Catch whatever''s on at GPAC. Dinner on Pakington Street.</p><h2>Sunday</h2><p>Day trip to the Surf Coast. 30 minutes to Torquay and 45 to Lorne. The Bellarine Peninsula wine region is equally accessible.</p>'
  ),
  ('pistol-pete-expansion', 'news', 'Pistol Pete''s Opens a CBD Flagship on Malop Street',
    'Geelong West''s beloved specialty coffee institution has expanded to the CBD with a larger all-day venue and a dedicated events room.',
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&q=80', NULL, NULL,
    '2026-06-04', 'Business News', ARRAY['pistol-pete'], ARRAY[]::integer[], ARRAY['news','food','business'],
    '<p>Pistol Pete''s Coffee — the specialty espresso bar that has been a fixture of Pakington Street for seven years — has opened a second location in the Geelong CBD, taking over a heritage shopfront on Malop Street.</p><p>The new space seats 40 inside with a street-side terrace, plus a dedicated events room for cupping sessions, latte art competitions, and live music evenings.</p><blockquote>"We''ve always been a Geelong West business and that doesn''t change," said founder Pete Andreou. "But we''ve had so many people from the CBD side asking us to open closer to them."</blockquote><p>The CBD menu mirrors the original, with an expanded brunch offering developed with local produce from the Geelong Farmers Market. Open from 7am daily.</p>'
  ),
  ('gpac-2026-season', 'news', 'GPAC Announces a Big 2026 Season — Including Two Australian Premieres',
    'The Geelong Performing Arts Centre has unveiled its 2026 program, featuring two Australian premiere productions and a major new commission.',
    'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=1200&q=80', NULL, NULL,
    '2026-06-03', 'Business News', ARRAY['gpac'], ARRAY[7], ARRAY['news','arts','theatre'],
    '<p>Geelong Performing Arts Centre has released its 2026 season program — the most ambitious in the venue''s history.</p><p>"We wanted to put Geelong audiences in the same position as Melbourne and Sydney audiences," said Artistic Director Sarah Chen.</p><p>The headline event is a commissioned work from Geelong-born composer Marcus Webb, whose immersive piece <em>Waterline</em> will transform the GPAC main stage. World premiere at GPAC in August before a national tour.</p>'
  ),
  ('foreshore-history', 'history', 'The Geelong Foreshore: A City''s Relationship With Its Bay',
    'For most of its European history, Geelong''s waterfront was industrial — a working port, not a promenade. The transformation took decades.',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    '2026-05-20', 'What Was Geelong', ARRAY['eastern-beach','the-wharf'], ARRAY[]::integer[], ARRAY['history','waterfront','heritage'],
    '<p>Today''s Geelong waterfront is one of the most popular public spaces in regional Victoria. But for most of Geelong''s European history, the waterfront was industrial — the bay was the engine of the city''s economy.</p><h2>Eastern Beach: A Rare Exception</h2><p>The Eastern Beach swimming enclosure, built in 1931, was one of the earliest deliberate investments in the waterfront as a leisure space. The art deco change rooms and circular enclosure remain today, essentially unchanged.</p><h2>The Shift</h2><p>The shift from working port to public promenade happened gradually across the second half of the 20th century. The Cunningham Pier redevelopment in the 1990s was a turning point. The Waterfront Geelong project in the 2000s completed the transformation.</p>'
  ),
  ('geelong-jail-history', 'history', 'The Old Geelong Jail: From Bluestone Prison to Heritage Icon',
    'Built in the 1850s from local bluestone, the Old Geelong Jail is one of the finest examples of colonial penal architecture in Australia.',
    'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=1200&q=80',
    'https://images.unsplash.com/photo-1580136579312-94651dfd596d?w=800&q=80',
    'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&q=80',
    '2026-05-10', 'What Was Geelong', ARRAY[]::text[], ARRAY[]::integer[], ARRAY['history','heritage','architecture'],
    '<p>When the Old Geelong Jail opened in 1853, it was designed to impose. The bluestone walls were three feet thick, the cell blocks arranged in a radial panopticon design.</p><h2>Closure and Transformation</h2><p>The jail closed as an operational prison in the 1990s. Its eventual transformation into a heritage tourism site preserved the building''s integrity while giving it new purpose. The place still feels like what it was.</p>'
  ),
  ('paper-mill-history', 'history', 'The Paper Mill: Geelong''s Industrial Heart',
    'For over a century, the Australian Paper Mills at Fyansford was one of Geelong''s largest employers. Its transformation tells the story of a city changing its economic identity.',
    'https://images.unsplash.com/photo-1513828583688-c52646db42da?w=1200&q=80',
    'https://images.unsplash.com/photo-1574400434939-8ee53b0f80d5?w=800&q=80',
    'https://images.unsplash.com/photo-1544510808-91bc950c2398?w=800&q=80',
    '2026-04-30', 'What Was Geelong', ARRAY[]::text[], ARRAY[]::integer[], ARRAY['history','industry','heritage'],
    '<p>The Australian Paper Mills at Fyansford — established in 1876 on the banks of the Barwon River — was for decades one of the dominant features of Geelong''s industrial geography. At its peak, the mill employed hundreds of workers.</p><p>The mill''s closure in 1996 left a gap — physical, economic, and psychological. The Fyansford site covered over 40 hectares and included dozens of heritage-listed structures.</p>'
  ),
  ('the-gretchen', 'history', 'The Gretchen: Geelong''s Most Storied Corner Hotel',
    'Built in 1854, the Gretchen Hotel is one of the oldest surviving hotel buildings in Geelong — and it has had many lives.',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80',
    'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=800&q=80',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
    '2026-05-15', 'What Was Geelong', ARRAY[]::text[], ARRAY[]::integer[], ARRAY['history','heritage','pubs'],
    '<p>Corner hotels are a particular feature of Australian colonial streetscapes. The building at the corner of Moorabool and Malop Streets has operated since it was first licensed in 1854.</p><h2>The Music Years</h2><p>In the 1980s and 1990s, the Gretchen''s front bar was one of the most important venues on the Geelong live music circuit. A generation of local bands played on the small stage in the corner.</p><h2>The Architecture</h2><p>The building is a handsome example of Victorian commercial architecture — bluestone base, brick upper floor, original cast-iron verandah. Heritage-listed since the 1980s, it''s been protected from the aggressive renovations that stripped character from comparable buildings elsewhere.</p>'
  )
ON CONFLICT (id) DO UPDATE SET
  type = EXCLUDED.type, title = EXCLUDED.title, excerpt = EXCLUDED.excerpt,
  hero_img = EXCLUDED.hero_img, before_img = EXCLUDED.before_img, after_img = EXCLUDED.after_img,
  published_at = EXCLUDED.published_at, author = EXCLUDED.author,
  business_ids = EXCLUDED.business_ids, event_ids = EXCLUDED.event_ids,
  tags = EXCLUDED.tags, content = EXCLUDED.content;
