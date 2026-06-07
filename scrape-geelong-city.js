// City of Greater Geelong Events Scraper
// Scrapes all events from geelongcity.vic.gov.au and inserts into Supabase.
//
// Usage:
//   node scrape-geelong-city.js
//
// The service role key is embedded below — get it from:
//   Supabase dashboard → Project Settings → API → service_role (secret) key
//
// Options (edit below):
//   MAX_PAGES   – how many listing pages to scrape (each has ~15 events). 25 = all ~375 events.
//   DETAIL_FETCH – fetch each event's detail page for full description + time (slower but richer)

const https   = require('https');
const SUPABASE_URL = 'https://duhxszqyyzrbzrhwneey.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'sb_publishable_hQC1qopXEWqlHPACU30OQA_LoeW5sw2';

// ── Direct REST helpers using https module (avoids Node 18 experimental fetch) ──
const { URL: NodeURL } = require('url');
const REST_HOST = `${new NodeURL(SUPABASE_URL).host}`;

function restRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const options = {
      hostname: REST_HOST,
      port:     443,
      path:     `/rest/v1/${path}`,
      method,
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey':        SUPABASE_KEY,
        'Content-Type':  'application/json',
        'Accept':        'application/json',
        ...(method === 'POST' ? { 'Prefer': 'return=representation' } : {}),
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
      },
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        let json;
        try { json = data ? JSON.parse(data) : null; } catch { json = { raw: data }; }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ data: json, error: null, status: res.statusCode });
        } else {
          resolve({ data: null, error: json, status: res.statusCode });
        }
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function dbSelect(table, query = '') {
  return restRequest('GET', `${table}${query ? '?' + query : ''}`);
}

async function dbInsert(table, payload) {
  const { data, error } = await restRequest('POST', table, payload);
  return { data: Array.isArray(data) ? data[0] : data, error };
}

async function dbDelete(table, column, value) {
  return restRequest('DELETE', `${table}?${column}=eq.${encodeURIComponent(value)}`);
}

// ── Supabase Storage image upload ─────────────────────────
const STORAGE_HOST = REST_HOST;

function downloadImageBuffer(url) {
  return new Promise((resolve, reject) => {
    const opts = { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'image/*' } };
    const doGet = (u) => {
      https.get(u, opts, res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const next = res.headers.location.startsWith('http')
            ? res.headers.location
            : `https://${new NodeURL(u).host}${res.headers.location}`;
          return doGet(next);
        }
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => resolve({ buffer: Buffer.concat(chunks), contentType: res.headers['content-type'] || 'image/jpeg' }));
      }).on('error', reject);
    };
    doGet(url);
  });
}

async function uploadImageToStorage(imageUrl, slug) {
  if (!imageUrl) return null;
  try {
    const { buffer, contentType } = await downloadImageBuffer(imageUrl);
    // Derive extension from content-type or URL
    const ext = contentType.includes('webp') ? 'webp'
              : contentType.includes('png')  ? 'png'
              : contentType.includes('gif')  ? 'gif'
              : 'jpg';
    const storagePath = `events/${slug}.${ext}`;

    await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: STORAGE_HOST,
        port:     443,
        path:     `/storage/v1/object/media/${storagePath}`,
        method:   'POST',
        headers:  {
          'Authorization':  `Bearer ${SUPABASE_KEY}`,
          'apikey':         SUPABASE_KEY,
          'Content-Type':   contentType,
          'Content-Length': buffer.length,
          'x-upsert':       'true',
        },
      }, res => {
        let d = ''; res.on('data', c => d += c);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) resolve();
          else reject(new Error(`Storage upload ${res.statusCode}: ${d.slice(0,100)}`));
        });
      });
      req.on('error', reject);
      req.write(buffer);
      req.end();
    });

    return `${SUPABASE_URL}/storage/v1/object/public/media/${storagePath}`;
  } catch (e) {
    process.stdout.write(`(img upload failed: ${e.message}) `);
    return imageUrl; // fall back to external URL rather than losing the image entirely
  }
}

const BASE       = 'https://www.geelongcity.vic.gov.au';
const MAX_PAGES  = 25;    // 25 pages × ~12 events = ~289 events total
const DETAIL_FETCH = true; // set false for faster run (listing-only data)
const DELAY_MS   = 400;   // polite delay between requests

// ── Category mapping ──────────────────────────────────────
function guessCategory(title, tags) {
  const t = (title + ' ' + (tags||'')).toLowerCase();
  if (/music|concert|band|jazz|gig|choir|orchestra/.test(t))   return 'Music';
  if (/theatre|theater|play|musical|performance|stage/.test(t)) return 'Theatre';
  if (/market|farmers|artisan|craft fair/.test(t))              return 'Markets';
  if (/art|gallery|exhibition|painting|sculpture|ceramic/.test(t)) return 'Arts';
  if (/food|drink|wine|beer|tasting|dining|chef/.test(t))       return 'Food & Drink';
  if (/family|kids|children|junior|youth/.test(t))              return 'Family';
  if (/sport|football|afl|soccer|netball|cricket|swim|run|race|marathon/.test(t)) return 'Sports';
  if (/festival|expo|fair|show/.test(t))                        return 'Festival';
  if (/workshop|class|course|learn|session|skill/.test(t))      return 'Workshops';
  if (/walk|hike|tour|outdoor|nature|garden/.test(t))           return 'Outdoors';
  if (/comedy|stand.?up|improv|laugh/.test(t))                  return 'Comedy';
  if (/community|meeting|council|volunteer/.test(t))            return 'Community';
  return 'Community';
}

function guessEmoji(category) {
  return {
    'Music':'🎵','Theatre':'🎭','Markets':'🛒','Arts':'🎨',
    'Food & Drink':'🍴','Family':'👨‍👩‍👧','Sports':'⚽','Festival':'🎉',
    'Workshops':'🛠️','Outdoors':'🌿','Comedy':'😂','Community':'🤝',
  }[category] || '📅';
}

// ── HTTP fetch with redirect follow ──────────────────────
function get(url) {
  return new Promise((resolve, reject) => {
    const opts = { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 'Accept': 'text/html' } };
    https.get(url, opts, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const next = res.headers.location.startsWith('http') ? res.headers.location : BASE + res.headers.location;
        return get(next).then(resolve).catch(reject);
      }
      let body = ''; res.setEncoding('utf8');
      res.on('data', d => body += d);
      res.on('end', () => resolve(body));
    }).on('error', reject);
  });
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
function esc(s) { return (s||'').replace(/&amp;/g,'&').replace(/&#039;/g,"'").replace(/&quot;/g,'"').replace(/&#8211;/g,'–').replace(/&#8217;/g,"'").replace(/<[^>]+>/g,'').trim(); }

// ── Scrape listing page → array of { title, slug, dateStr, location, img } ──
function parseListingPage(html) {
  const events = [];
  const seen = new Set();

  // The site uses a Tailwind overlay pattern:
  //   <a href="/whats-happening/events/slug" class="absolute inset-0 z-10 block"> </a>
  //   <div ...><img .../><h3>Title Here</h3></div>
  // The <a> tag has empty content — we must match href and then look ahead for the <h3>.

  // Pass 1: collect all event hrefs and their position in the HTML
  const hrefRe = /href="((?:https:\/\/www\.geelongcity\.vic\.gov\.au)?\/whats-happening\/events\/([^/"?#]+))"/g;
  let m;
  while ((m = hrefRe.exec(html)) !== null) {
    const fullPath = m[1].startsWith('http') ? new URL(m[1]).pathname : m[1];
    const slug = m[2];
    const SKIP_SLUGS = ['events','list-your-event','event-planning-and-support','contact','about','faqs'];
    if (!slug || seen.has(slug) || SKIP_SLUGS.includes(slug)) continue;
    seen.add(slug);

    // Look ahead up to 2000 chars for the nearest heading.
    // Two card layouts exist on this site:
    //   Layout A: <a href="..." class="card-item"> wraps everything, title in <h4>
    //   Layout B: <a href="..." class="absolute inset-0"> (empty), title in <span> inside sibling div
    const ahead = html.slice(m.index, m.index + 2000);
    const h4M = ahead.match(/<h(?:3|4)[^>]*>([\s\S]+?)<\/h(?:3|4)>/);
    const spanM = ahead.match(/class="[^"]*font-semibold[^"]*"[^>]*>\s*<span[^>]*>([\s\S]+?)<\/span>/);
    const titleRaw = h4M ? h4M[1] : (spanM ? spanM[1] : null);
    if (!titleRaw) continue;
    const title = esc(titleRaw);
    if (!title) continue;

    // Grab nearby context for date/location/image (wider window)
    const nearby = html.slice(Math.max(0, m.index - 100), m.index + 1000);

    const dateM = nearby.match(/(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*(?:\s+\d{4})?)/i) ||
                  nearby.match(/((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})/i);
    const dateStr = dateM ? dateM[1].trim() : '';

    // Location on listing cards: look for suburb/city names in the card text
    const locM = nearby.match(/(?:Geelong|Portarlington|Bellarine|Torquay|Ocean Grove|Lara|Barwon|Clifton Springs|Drysdale|Leopold|Corio|Norlane|Newcomb|Highton|Waurn Ponds|Grovedale|Belmont|Hamlyn Heights|Manifold Heights|Newtown|Herne Hill|North Geelong|South Geelong|East Geelong)[^<"]{0,40}/i);
    const location = locM ? locM[0].replace(/[,\s]+$/,'').trim() : 'Greater Geelong';

    const imgM = nearby.match(/src="([^"]+\/public\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i);
    const img  = imgM ? (imgM[1].startsWith('http') ? imgM[1] : BASE + imgM[1].replace(/\?.*$/,'')) : '';

    events.push({ title, slug, path: fullPath, dateStr, location, img });
  }
  return events;
}

// ── Scrape detail page → enriched data ───────────────────
function parseDetailPage(html, base) {
  // Title
  const titleM = html.match(/<h1[^>]*>([\s\S]+?)<\/h1>/);
  const title   = titleM ? esc(titleM[1]) : base.title;

  // Date + time — pull from the structured ml-2 div after calendar icon
  // Format seen: "Every Thursday from 15 January - 17 December 2026"
  //              "Saturday, 14 June 2026  10:00 AM – 4:00 PM"
  const ml2Blocks = [...html.matchAll(/<div class="ml-2">\s*<p>([\s\S]+?)<\/p>\s*<\/div>|<div class="ml-2">\s*([^<]{4,120})\s*<\/div>/g)]
    .map(m => (m[1]||m[2]||'').replace(/<[^>]+>/g,'').trim())
    .filter(Boolean);

  // First ml-2 block is usually the date, second the location
  const rawDate = ml2Blocks[0] || base.dateStr || '';
  const rawLoc  = ml2Blocks[1] || '';

  // Detect recurring: "Every", "Weekly", "Daily", "Monthly", "Each", "Fortnightly"
  const isRecurring = /\b(every|weekly|daily|monthly|fortnightly|each\s+\w+day|starting from)\b/i.test(rawDate);

  // Extract a clean display date
  const date = rawDate.replace(/<[^>]+>/g,'').trim() || base.dateStr || '';

  // Time from date string or standalone
  const timeM = rawDate.match(/(\d{1,2}:\d{2}\s*[AP]M(?:\s*[–-]\s*\d{1,2}:\d{2}\s*[AP]M)?)/i) ||
                html.match(/(\d{1,2}:\d{2}\s*[AP]M(?:\s*[–-]\s*\d{1,2}:\d{2}\s*[AP]M)?)/i);
  const time  = timeM ? timeM[1] : '';

  // Price
  const priceM = html.match(/\bFree\b/i) ? ['Free'] : html.match(/\$[\d,]+/);
  const price  = priceM ? (priceM[0] === 'Free' ? 'Free' : priceM[0]) : '';

  // Location — from second ml-2 block (after the pin icon), fallback to listing page
  const location = (rawLoc && rawLoc.length > 1 && rawLoc.length < 80 && !/border-\[|class=/.test(rawLoc))
    ? rawLoc
    : (base.location && !/border-\[|px-\d|class=/.test(base.location) ? base.location : 'Greater Geelong');

  // Description — first substantial paragraph, skip council boilerplate
  const descMatches = [...html.matchAll(/<p[^>]*>([\s\S]{40,600}?)<\/p>/g)];
  let description = '';
  for (const dm of descMatches) {
    const clean = esc(dm[1]);
    if (clean.length > 40 && !/copyright|cookie|privacy|subscribe|council is elected|local government/i.test(clean)) {
      description = clean; break;
    }
  }

  // Best image — og:image first
  const ogImgM = html.match(/property="og:image"\s+content="([^"]+)"/) ||
                 html.match(/content="([^"]+\.(?:jpg|jpeg|png|webp))"\s+property="og:image"/);
  const largeImgM = html.match(/\/styles\/scale_large\/public\/[^\s"']+\.(?:jpg|jpeg|png|webp)/i);
  const img = ogImgM ? ogImgM[1]
            : largeImgM ? BASE + largeImgM[0].replace(/\?.*$/,'')
            : base.img;

  // Tags
  const tagMatches = [...html.matchAll(/field--name-field-event-category[^>]*>[\s\S]{0,200}?<a[^>]*>([^<]+)<\/a>/g)];
  const tags = tagMatches.map(t => esc(t[1])).filter(Boolean);

  // Ticket/booking URL
  const bookM = html.match(/href="([^"]+(?:book|ticket|register|buy)[^"]*)"[^>]*>(?:[^<]*(?:Book|Ticket|Register|Buy)[^<]*)</i);
  const ticketUrl = bookM ? (bookM[1].startsWith('http') ? bookM[1] : BASE + bookM[1]) : null;

  return { title, date, time, price, location, description, img, tags, ticketUrl, isRecurring };
}

// ── Business matching / creation ─────────────────────────
// Cache of existing businesses (name → id) loaded once at start
let bizCache = {};

async function loadBizCache() {
  const { data, error } = await dbSelect('businesses', 'select=id,name,slug');
  if (error) { console.log('⚠️  Could not load businesses:', JSON.stringify(error)); return; }
  for (const b of (data || [])) {
    bizCache[b.name.toLowerCase()] = b.id;
    bizCache[b.slug.toLowerCase()]  = b.id;
  }
  console.log(`Loaded ${(data||[]).length} businesses into cache.`);
}

// Try to match a venue/organiser name to an existing business.
// If no match, create a minimal business record and return its id.
async function resolveOrCreateBiz(venueName, location) {
  if (!venueName) return null;
  const key = venueName.toLowerCase().trim();

  // Try exact or partial match
  if (bizCache[key]) return bizCache[key];
  const partialKey = Object.keys(bizCache).find(k => k.includes(key) || key.includes(k));
  if (partialKey) return bizCache[partialKey];

  // Create a new business stub
  const slug = venueName.toLowerCase()
    .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0, 80);
  const payload = {
    name:       venueName,
    slug,
    type:       'Venue',
    emoji:      '📍',
    location:   location || 'Greater Geelong',
    suburb:     'Geelong',
    plan:       'free',
    is_claimed: false,
  };
  const { data, error } = await dbInsert('businesses', payload);
  if (error) {
    console.log(`  (could not create business "${venueName}": ${JSON.stringify(error)})`);
    return null;
  }
  // Cache it so we don't create duplicates
  bizCache[key]  = data.id;
  bizCache[slug] = data.id;
  console.log(`  ➕ Created business: ${venueName}`);
  return data.id;
}

// Extract the most likely venue name from a location string or detail page.
// Returns null if we can only find an address (no real venue name to create a business for).
function extractVenueName(location, detailHtml) {
  // Only accept something that looks like a proper venue name:
  //  - Doesn't start with a number (not a street address)
  //  - Isn't just "Geelong" or a suburb name alone
  //  - Isn't a full street address (contains "Street", "Road", "Ave" etc with a number)
  function isVenueLike(s) {
    if (!s || s.length < 4 || s.length > 80) return false;
    if (/^\d/.test(s)) return false;           // starts with street number
    if (/^greater\s+geelong$/i.test(s)) return false;
    if (/^geelong[\s,]*$/i.test(s)) return false;
    if (/-\d{4}$/.test(s)) return false;       // ends with year — likely an event slug
    if (/^[a-z0-9-]+$/.test(s)) return false;  // all lowercase+hyphens = a slug not a name
    if (/\d+\s+\w+\s+(?:street|st|road|rd|avenue|ave|drive|dr|lane|ln|way|blvd|parade|pde)\b/i.test(s)) return false;
    if (/\bVIC\b|\bNSW\b|\bQLD\b/.test(s)) return false;
    if (/border-\[|px-\d|class=/.test(s)) return false;   // CSS garbage
    return true;
  }

  // 1. Try named venue field in detail page
  if (detailHtml) {
    const venueM = detailHtml.match(/(?:field--name-field-venue|class="[^"]*venue[^"]*")[^>]*>[\s\S]{0,200}?<[^>]+>([^<]{4,80})</i);
    if (venueM) {
      const v = venueM[1].replace(/<[^>]+>/g,'').trim();
      if (isVenueLike(v)) return v;
    }
  }

  // 2. Fall back to the part before the first comma in the location string
  if (!location) return null;
  const beforeComma = location.split(',')[0].trim();
  if (isVenueLike(beforeComma)) return beforeComma;

  return null;
}

// ── Main ──────────────────────────────────────────────────
async function run() {
  let totalInserted = 0, totalSkipped = 0;
  const allEvents = [];

  // 0. Verify auth works before doing anything
  process.stdout.write('Testing Supabase connection… ');
  const testRes = await restRequest('GET', 'events?select=id&limit=1');
  if (testRes.error) {
    console.log(`\n❌ Auth test failed: ${JSON.stringify(testRes.error)}`);
    console.log('   Check your SUPABASE_SERVICE_KEY is correct.');
    process.exit(1);
  }
  console.log('✓ Connected.\n');

  // 1. Load existing businesses
  await loadBizCache();

  // 1. Scrape all listing pages
  console.log(`\nScraping up to ${MAX_PAGES} listing pages…\n`);
  for (let page = 0; page < MAX_PAGES; page++) {
    const url = `${BASE}/whats-happening/events?page=${page}`;
    process.stdout.write(`Page ${page + 1}/${MAX_PAGES} … `);
    try {
      const html = await get(url);
      const events = parseListingPage(html);
      if (!events.length) { console.log('no events, stopping.'); break; }
      console.log(`${events.length} events found`);
      allEvents.push(...events);
    } catch (e) {
      console.log(`ERROR: ${e.message}`);
    }
    await delay(DELAY_MS);
  }

  console.log(`\nTotal events found on listing pages: ${allEvents.length}`);
  console.log(DETAIL_FETCH ? 'Fetching detail pages for full data…\n' : 'Skipping detail pages (DETAIL_FETCH=false)\n');

  // 2. For each event, optionally enrich with detail page
  for (let i = 0; i < allEvents.length; i++) {
    const base = allEvents[i];
    process.stdout.write(`[${i+1}/${allEvents.length}] ${base.title.slice(0,50).padEnd(50)} … `);

    let detail = null;
    let detailHtml = null;
    if (DETAIL_FETCH) {
      try {
        detailHtml = await get(BASE + base.path);
        detail = parseDetailPage(detailHtml, base);
        await delay(DELAY_MS);
      } catch (e) {
        console.log(`detail fetch failed: ${e.message}`);
      }
    }

    const title    = detail?.title    || base.title;
    const date     = detail?.date     || base.dateStr || '';
    const time     = detail?.time     || '';
    const price    = detail?.price    || '';
    const location = detail?.location || base.location || 'Geelong';
    const desc     = detail?.description || '';
    const rawImg   = detail?.img      || base.img || null;
    const tags       = detail?.tags       || [];
    const ticketUrl  = detail?.ticketUrl  || null;
    const isRecurring = detail?.isRecurring || false;
    const category   = guessCategory(title, tags.join(' '));
    const emoji     = guessEmoji(category);

    // Upload image to Supabase Storage
    const img = await uploadImageToStorage(rawImg, base.slug);

    // Business linking — match to existing businesses only (no auto-create from scraper)
    const venueName = extractVenueName(location, detailHtml);
    const bizId = venueName ? (() => {
      const key = venueName.toLowerCase().trim();
      if (bizCache[key]) return bizCache[key];
      const partialKey = Object.keys(bizCache).find(k => k.includes(key) || key.includes(k));
      return partialKey ? bizCache[partialKey] : null;
    })() : null;

    const payload = {
      title,
      slug:         base.slug,
      category,
      emoji,
      date,
      time:         time || null,
      price:        price || null,
      location,
      description:  desc || null,
      img:          img || null,
      url:          ticketUrl || (BASE + base.path),
      business_id:  bizId || null,
      is_recurring: isRecurring,
    };

    // Upsert by slug (delete then insert)
    await dbDelete('events', 'slug', base.slug);
    const { error } = await dbInsert('events', payload);

    if (error) {
      console.log(`✗ ${JSON.stringify(error)}`);
      totalSkipped++;
    } else {
      console.log(`✓ ${category}${bizId ? ' [biz linked]' : ''}`);
      totalInserted++;
    }
  }

  console.log(`\n✅ Done — ${totalInserted} inserted, ${totalSkipped} skipped.`);
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
