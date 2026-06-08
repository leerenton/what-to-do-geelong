#!/usr/bin/env node
// ── WTDG Google Places Sync ─────────────────────────────────
// Usage: node scripts/sync-google-places.js
//
// SAFETY CONTROLS:
//   MAX_REQUESTS — hard stop on Google API calls per run
//   DELAY_MS     — pause between requests (avoid bursting)
//   DRY_RUN      — set true to print without writing to Supabase
//   CLEAR_FIRST  — set true to wipe unclaimed before run (full refresh)
//   MAX_PHOTOS   — max photos to download & store per place
//
// Images are downloaded from Google and stored in Supabase Storage
// (bucket: business-images) so URLs are permanent and free to serve.
// ──────────────────────────────────────────────────────────────

const https = require('https');
const url   = require('url');

// ── CONFIG ────────────────────────────────────────────────────
const GOOGLE_KEY    = 'AIzaSyDHUrQ0uu0j0VDjigRhxoS44h-9Y4p1PZY';
const SUPABASE_URL  = 'https://duhxszqyyzrbzrhwneey.supabase.co';
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1aHhzenF5eXpyYnpyaHduZWV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDcyNTc1OCwiZXhwIjoyMDk2MzAxNzU4fQ.iXhO6IWYgZl-58thx2ZUySg5Dt0-s9QXYS98j4fvRQ8';
const STORAGE_BUCKET = 'business-images';

const MAX_REQUESTS = 9;    // ← hard cap on Google API calls this run
const DELAY_MS     = 400;  // ← ms between requests
const DRY_RUN      = false; // ← set true to preview without saving
const CLEAR_FIRST  = true;  // ← wipe unclaimed before full refresh
const MAX_PHOTOS   = 4;     // ← photos to store per place

let requestCount = 0;

// ── SEARCH QUERIES ────────────────────────────────────────────
// Each query = 1 API request, returns up to maxResultCount places
const SEARCHES = [
  // ── Drink ─────────────────────────────────────────────────
  {
    query: 'wineries cellar door Bellarine Peninsula Victoria',
    type: 'Winery', emoji: '🍷', color: '#6B2737',
    maxResults: 10, bias: { lat: -38.1499, lng: 144.3617, radius: 40000 },
  },
  {
    query: 'brewery craft beer distillery Geelong Bellarine Victoria',
    type: 'Brewery', emoji: '🍺', color: '#C47F17',
    maxResults: 10, bias: { lat: -38.1499, lng: 144.3617, radius: 40000 },
  },

  // ── Eat ──────────────────────────────────────────────────
  {
    query: 'best cafes coffee Geelong Victoria',
    type: 'Café', emoji: '☕', color: '#8B5E3C',
    maxResults: 10, bias: { lat: -38.1499, lng: 144.3617, radius: 15000 },
  },
  {
    query: 'best restaurants dining Geelong Victoria',
    type: 'Restaurant', emoji: '🍽️', color: '#E76F51',
    maxResults: 10, bias: { lat: -38.1499, lng: 144.3617, radius: 15000 },
  },
  {
    query: 'bars pubs craft beer Geelong Victoria',
    type: 'Bar', emoji: '🍺', color: '#F4A261',
    maxResults: 10, bias: { lat: -38.1499, lng: 144.3617, radius: 20000 },
  },

  // ── Do / Activities ───────────────────────────────────────
  {
    query: 'things to do attractions Geelong Victoria',
    type: 'Attraction', emoji: '⭐', color: '#2A9D8F',
    maxResults: 10, bias: { lat: -38.1499, lng: 144.3617, radius: 25000 },
  },
  {
    query: 'adventure activities outdoor experiences Geelong Surf Coast Bellarine',
    type: 'Activity', emoji: '🧗', color: '#264653',
    maxResults: 10, bias: { lat: -38.1499, lng: 144.3617, radius: 60000 },
  },
  {
    query: 'art gallery museum cultural Geelong Victoria',
    type: 'Arts & Culture', emoji: '🎨', color: '#8338EC',
    maxResults: 10, bias: { lat: -38.1499, lng: 144.3617, radius: 20000 },
  },
  {
    query: 'family kids activities fun Geelong Victoria',
    type: 'Family', emoji: '👨‍👩‍👧', color: '#FB8500',
    maxResults: 10, bias: { lat: -38.1499, lng: 144.3617, radius: 30000 },
  },
];

// ── TYPE → EMOJI MAP (override per Google place type) ─────────
const TYPE_EMOJI = {
  cafe:                    '☕',
  restaurant:              '🍽️',
  bar:                     '🍺',
  bakery:                  '🥐',
  art_gallery:             '🎨',
  museum:                  '🏛️',
  park:                    '🌿',
  tourist_attraction:      '⭐',
  amusement_center:        '🎮',
  adventure_sports_center: '🧗',
  bowling_alley:           '🎳',
  movie_theater:           '🎬',
  night_club:              '🎵',
  shopping_mall:           '🛍️',
  spa:                     '💆',
  gym:                     '💪',
  botanical_garden:        '🌸',
};

// ── HELPERS ───────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function slugify(str) {
  return str.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function extractSuburb(address) {
  // "123 Foo St, Geelong West VIC 3218, Australia" → "Geelong West"
  const m = address?.match(/,\s*([^,]+)\s+VIC\s+\d{4}/);
  return m ? m[1].trim() : 'Geelong';
}

function guessEmoji(types = []) {
  for (const t of types) {
    if (TYPE_EMOJI[t]) return TYPE_EMOJI[t];
  }
  return '📍';
}

function httpsRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, body: d }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ── IMAGE DOWNLOAD (follows redirects) ───────────────────────
function downloadImage(imageUrl) {
  return new Promise((resolve, reject) => {
    function fetch(fetchUrl, redirects = 0) {
      if (redirects > 5) return reject(new Error('Too many redirects'));
      const parsed = new URL(fetchUrl);
      const opts = {
        hostname: parsed.hostname,
        path:     parsed.pathname + parsed.search,
        method:   'GET',
        headers:  { 'User-Agent': 'WTDG-Scraper/1.0' },
      };
      const req = https.request(opts, res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return fetch(res.headers.location, redirects + 1);
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode} for ${fetchUrl}`));
        }
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => resolve({
          buffer:      Buffer.concat(chunks),
          contentType: res.headers['content-type'] || 'image/jpeg',
        }));
      });
      req.on('error', reject);
      req.end();
    }
    fetch(imageUrl);
  });
}

// ── SUPABASE STORAGE UPLOAD ───────────────────────────────────
async function uploadImage(buffer, contentType, storagePath) {
  const parsed  = new URL(SUPABASE_URL);
  const apiPath = `/storage/v1/object/${STORAGE_BUCKET}/${storagePath}`;
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: parsed.hostname,
      port:     443,
      path:     apiPath,
      method:   'POST',
      headers: {
        'Authorization':  `Bearer ${SUPABASE_KEY}`,
        'apikey':         SUPABASE_KEY,
        'Content-Type':   contentType,
        'Content-Length': buffer.length,
        'x-upsert':       'true',   // overwrite if re-running
      },
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${storagePath}`;
          resolve(publicUrl);
        } else {
          reject(new Error(`Storage upload failed (${res.statusCode}): ${d.slice(0,200)}`));
        }
      });
    });
    req.on('error', reject);
    req.write(buffer);
    req.end();
  });
}

// ── DOWNLOAD + STORE PHOTOS FOR A PLACE ──────────────────────
async function storePhotos(placeId, googlePhotoUrls) {
  const stored = [];
  for (let i = 0; i < googlePhotoUrls.length; i++) {
    const googleUrl = googlePhotoUrls[i];
    try {
      process.stdout.write(`      📸 Photo ${i + 1}/${googlePhotoUrls.length} downloading…`);
      const { buffer, contentType } = await downloadImage(googleUrl);
      const ext  = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
      const path = `${placeId}/${i}.${ext}`;
      const publicUrl = await uploadImage(buffer, contentType, path);
      stored.push(publicUrl);
      process.stdout.write(` ✓ (${Math.round(buffer.length / 1024)}kb)\n`);
    } catch (err) {
      process.stdout.write(` ✗ ${err.message}\n`);
    }
    await sleep(150);
  }
  return stored;
}

// ── GOOGLE PLACES SEARCH ──────────────────────────────────────
async function searchPlaces({ query, bias, maxResults }) {
  if (requestCount >= MAX_REQUESTS) {
    console.log(`⛔ MAX_REQUESTS (${MAX_REQUESTS}) reached — stopping.`);
    return [];
  }
  requestCount++;
  console.log(`\n🔍 [${requestCount}/${MAX_REQUESTS}] Searching: "${query}"`);

  const payload = {
    textQuery:       query,
    maxResultCount:  Math.min(maxResults, 20),
    locationBias: {
      circle: {
        center: { latitude: bias.lat, longitude: bias.lng },
        radius: bias.radius,
      },
    },
  };

  const res = await httpsRequest({
    hostname: 'places.googleapis.com',
    port:     443,
    path:     '/v1/places:searchText',
    method:   'POST',
    headers: {
      'Content-Type':      'application/json',
      'X-Goog-Api-Key':    GOOGLE_KEY,
      'X-Goog-FieldMask':  [
        'places.id',
        'places.displayName',
        'places.formattedAddress',
        'places.location',
        'places.rating',
        'places.nationalPhoneNumber',
        'places.websiteUri',
        'places.types',
        'places.photos',
        'places.editorialSummary',
        'places.regularOpeningHours',
        'places.priceLevel',
      ].join(','),
    },
  }, payload);

  return res.body?.places || [];
}

// ── SUPABASE HELPERS ──────────────────────────────────────────
async function sbRequest(path, method, body = null) {
  const url = new URL(SUPABASE_URL);
  const bodyStr = body ? JSON.stringify(body) : null;
  return httpsRequest({
    hostname: url.hostname,
    port:     443,
    path:     `/rest/v1/${path}`,
    method,
    headers: {
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'apikey':        SUPABASE_KEY,
      'Content-Type':  'application/json',
      'Accept':        'application/json',
      'Prefer':        method === 'POST' ? 'resolution=merge-duplicates,return=minimal' : '',
      ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
    },
  }, body);
}

async function getExistingPlaceIds() {
  const res = await sbRequest('businesses?select=google_place_id&google_place_id=not.is.null', 'GET');
  return new Set((res.body || []).map(b => b.google_place_id).filter(Boolean));
}

async function deleteAllUnclaimed() {
  console.log('\n🗑️  Clearing unclaimed businesses…');
  const res = await sbRequest('businesses?is_claimed=eq.false', 'DELETE');
  console.log(`   Done (status ${res.status})`);
}

async function upsertBusiness(biz) {
  const res = await sbRequest('businesses', 'POST', biz);
  if (res.status >= 200 && res.status < 300) {
    console.log(`   ✓ Saved: ${biz.name} (${biz.suburb})`);
  } else {
    console.log(`   ✗ Error saving ${biz.name}:`, JSON.stringify(res.body).slice(0, 120));
  }
}

// ── PHOTO URLs ────────────────────────────────────────────────
function getPhotoUrls(place, max = 5) {
  const photos = place.photos || [];
  return photos.slice(0, max).map(p =>
    `https://places.googleapis.com/v1/${p.name}/media?maxHeightPx=800&maxWidthPx=1200&key=${GOOGLE_KEY}`
  );
}

// ── MAIN ──────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════');
  console.log(' WTDG Google Places Sync');
  console.log(`  MAX_REQUESTS : ${MAX_REQUESTS}`);
  console.log(`  DRY_RUN      : ${DRY_RUN}`);
  console.log(`  CLEAR_FIRST  : ${CLEAR_FIRST}`);
  console.log('═══════════════════════════════════════');

  // 1. Optionally clear unclaimed businesses (skip for incremental runs)
  if (!DRY_RUN && CLEAR_FIRST) await deleteAllUnclaimed();

  // 2. Get existing place IDs to avoid duplicates on incremental runs
  const existingIds = DRY_RUN ? new Set() : await getExistingPlaceIds();

  let totalSaved = 0;

  for (const search of SEARCHES) {
    if (requestCount >= MAX_REQUESTS) break;

    const places = await searchPlaces(search);
    console.log(`   Found ${places.length} places`);

    for (const place of places) {
      if (existingIds.has(place.id)) {
        console.log(`   ⏭  Skip (already synced): ${place.displayName?.text}`);
        continue;
      }

      const suburb      = extractSuburb(place.formattedAddress);
      const emoji       = guessEmoji(place.types);
      const googlePhotos = getPhotoUrls(place, MAX_PHOTOS);
      const website = place.websiteUri
        ? place.websiteUri.replace(/^https?:\/\//, '').replace(/\/$/, '')
        : null;

      const name        = place.displayName?.text || 'Unknown';
      const description = place.editorialSummary?.text || null;
      const hours       = place.regularOpeningHours
        ? {
            periods:      place.regularOpeningHours.periods || [],
            weekdayDescriptions: place.regularOpeningHours.weekdayDescriptions || [],
          }
        : null;

      const biz  = {
        id:              slugify(name + '-' + suburb),
        google_place_id: place.id,
        name,
        slug:            slugify(name + '-' + suburb),
        type:            search.type,
        emoji,
        color:           search.color,
        suburb,
        location:        place.formattedAddress || suburb,
        lat:             place.location?.latitude  || null,
        lng:             place.location?.longitude || null,
        phone:           place.nationalPhoneNumber || null,
        website,
        rating:          place.rating || null,
        img:             null,   // set after photo upload below
        gallery:         null,   // set after photo upload below
        description,
        opening_hours:   hours,
        is_claimed:      false,
        plan:            'free',
        created_at:      new Date().toISOString(),
      };

      console.log('\n   📍', name);
      console.log('      Type   :', search.type);
      console.log('      Suburb :', suburb);
      console.log('      Rating :', place.rating || '—');
      console.log('      Phone  :', place.nationalPhoneNumber || '—');
      console.log('      Website:', website || '—');
      console.log('      Desc   :', description || '—');
      console.log('      Hours  :', hours ? hours.weekdayDescriptions[0] + '…' : '—');
      console.log('      Photos :', googlePhotos.length ? `${googlePhotos.length} available` : '—');
      console.log('      LatLng :', place.location?.latitude, place.location?.longitude);

      if (!DRY_RUN) {
        // Download & store photos in Supabase Storage
        let storedPhotos = [];
        if (googlePhotos.length) {
          storedPhotos = await storePhotos(place.id, googlePhotos);
        }
        biz.img     = storedPhotos[0]  || null;
        biz.gallery = storedPhotos.length > 1 ? storedPhotos.slice(1) : null;

        await upsertBusiness(biz);
        totalSaved++;
      }

      await sleep(100);
    }

    if (SEARCHES.indexOf(search) < SEARCHES.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log('\n═══════════════════════════════════════');
  console.log(` ✅ Done — ${requestCount} Google API requests used`);
  if (!DRY_RUN) console.log(` 💾 ${totalSaved} businesses saved to Supabase`);
  console.log('═══════════════════════════════════════\n');
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
