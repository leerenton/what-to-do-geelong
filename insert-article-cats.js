// Insert: Cats pre-game drinks article
// Run: SUPABASE_SERVICE_KEY=... node insert-article-cats.js

const { createClient } = require('@supabase/supabase-js');
let ws; try { ws = require('ws'); } catch {}

const SUPABASE_URL = 'https://duhxszqyyzrbzrhwneey.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
if (!SUPABASE_KEY) { console.error('Set SUPABASE_SERVICE_KEY'); process.exit(1); }

const db = createClient(SUPABASE_URL, SUPABASE_KEY, ws ? { realtime: { transport: ws } } : {});

const article = {
  id:           'cats-home-pre-game-drinks',
  slug:         'where-to-drink-before-geelong-cats-home-game',
  type:         'news',
  title:        'The Cats Are Home — Here\'s Where to Drink Before the Game',
  excerpt:      'GMHBA Stadium is the destination this weekend. These are the pubs worth stopping at before you take your seat.',
  hero_img:     'https://images.unsplash.com/photo-1575037614876-c38a4d44f5b8?w=1200&q=80',
  published_at: '2026-06-07',
  author:       'WTDG Editorial',
  business_ids: ['the-barwon-club'],
  event_ids:    [],
  tags:         ['cats', 'afl', 'pubs', 'geelong', 'news'],
  content: `<p>The Cats are home at GMHBA Stadium this weekend — and if you're planning to make a day of it, the area around South Geelong and Newtown has a solid collection of pubs worth settling into before the bounce.</p>

<h2>The Bowen Hotel — South Geelong</h2>
<p>The Bowen is the closest proper pub to the stadium and gets absolutely packed on game days for a reason. Cold beer on tap, a front bar that fills up fast, and the kind of pre-game atmosphere that reminds you why AFL is a whole-day thing. Get here early — by the time you're one beer in you'll hear the noise from the stadium drifting across. <strong>38 Moorabool St, South Geelong.</strong></p>

<h2>The Barwon Club Hotel — Newtown</h2>
<p>A short ride from GMHBA, the Barwon Club is one of Geelong's most loved local pubs. The front bar is unpretentious and welcoming, there's live music on most weekends, and the kitchen puts out proper pub food. If you're heading in from the north side of town, make this your pit stop.</p>
<p><a href="/listing/barwon-club-hotel-newtown">View The Barwon Club Hotel →</a></p>

<h2>The Shannon Hotel — Shannon Ave, Newtown</h2>
<p>Another Newtown staple with a solid beer garden and a relaxed crowd on match days. Less hectic than the Bowen if you prefer your pre-game at a slower pace. <strong>Shannon Ave, Newtown.</strong></p>

<h2>Little Creatures — The Waterfront</h2>
<p>If you're heading in from the waterfront precinct, Little Creatures on Yarra Street Pier makes for a great starting point. The Roger's Lager on tap is hard to argue with, and the venue has the room to absorb a match-day crowd without feeling too squeezed.</p>

<h2>Getting to the Game</h2>
<p>GMHBA Stadium is an easy walk from South Geelong station or a short rideshare from the CBD. Gates open around 90 minutes before bounce — give yourself time to enjoy the pre-game without the scramble.</p>

<p><em>Go Cats. 🐱</em></p>`,
};

async function run() {
  // Upsert by id
  const { error } = await db.from('articles').upsert(article, { onConflict: 'id' });
  if (error) {
    console.error('Insert failed:', error.message);
    process.exit(1);
  }
  console.log('✅ Article inserted:', article.slug);
}

run();
