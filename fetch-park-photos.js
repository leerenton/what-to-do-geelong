#!/usr/bin/env node
// Fetch real Google Places photos for park listings and save to Supabase Storage
const https = require('https');

const GOOGLE_KEY     = 'AIzaSyDHUrQ0uu0j0VDjigRhxoS44h-9Y4p1PZY';
const SUPABASE_URL   = 'https://duhxszqyyzrbzrhwneey.supabase.co';
const SUPABASE_KEY   = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1aHhzenF5eXpyYnpyaHduZWV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDcyNTc1OCwiZXhwIjoyMDk2MzAxNzU4fQ.iXhO6IWYgZl-58thx2ZUySg5Dt0-s9QXYS98j4fvRQ8';
const BUCKET         = 'business-images';
const MAX_PHOTOS     = 4;
const DELAY_MS       = 500;

// Parks to fetch — id matches Supabase, query is what we send to Google
const PARKS = [
  { id: 'eastern-beach-reserve-geelong',        query: 'Eastern Beach Reserve Geelong VIC' },
  { id: 'balyang-sanctuary-newtown',            query: 'Balyang Sanctuary Newtown Geelong VIC' },
  { id: 'buckley-falls-park-highton',           query: 'Buckley Falls Park Highton Geelong VIC' },
  { id: 'eastern-park-east-geelong',            query: 'Eastern Park Geelong Botanic Gardens VIC' },
  { id: 'steampacket-gardens-geelong',          query: 'Steampacket Gardens Geelong waterfront VIC' },
  { id: 'warralily-conservation-area-armstrong-creek', query: 'Warralily Conservation Area Armstrong Creek Geelong' },
  { id: 'ocean-grove-nature-reserve-geelong',   query: 'Ocean Grove Nature Reserve Bellarine VIC' },
  { id: 'buckley-falls-lookout-geelong',        query: 'Buckley Falls Lookout Geelong VIC' },
  { id: 'wangim-walk-geelong',                  query: 'Wangim Walk Geelong waterfront VIC' },
  { id: 'you-yangs-regional-park',              query: 'You Yangs Regional Park Little River VIC' },
  { id: 'geelong-botanic-gardens',              query: 'Geelong Botanic Gardens East Geelong VIC' },
  { id: 'rippleside-park-geelong',              query: 'Rippleside Park Geelong VIC' },
  { id: 'serendip-sanctuary-lara',              query: 'Serendip Sanctuary Lara VIC Parks Victoria' },
  { id: 'queens-park-geelong',                  query: 'Queens Park Barwon River South Geelong VIC' },
  { id: 'point-lonsdale-lighthouse-reserve',    query: 'Point Lonsdale Lighthouse Reserve VIC' },
  { id: 'barwon-heads-bluff-reserve',           query: 'Barwon Heads Bluff Reserve VIC' },
  { id: 'thomson-reservoir-park',               query: 'Barwon Valley Activity Centre Newtown Geelong VIC' },
  { id: 'limeburners-point-reserve',            query: 'Limeburners Point Reserve North Shore Geelong VIC' },
  { id: 'griggs-creek-reserve-curlewis',        query: 'Griggs Creek Reserve Curlewis Bellarine VIC' },
  { id: 'moorabool-river-reserve-batesford',    query: 'Moorabool River Reserve Batesford VIC' },
  { id: 'kevin-hoffman-walk-lara',              query: 'Kevin Hoffman Walk Lara VIC' },
  { id: 'friends-of-geelong-botanic-gardens-east-geelong', query: 'Geelong Botanic Gardens VIC' },
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function httpsRequest(options, body) {
  return new Promise((resolve, reject) => {
    const opts = { port: 443, ...options };
    if (body) opts.headers = { ...opts.headers, 'Content-Length': Buffer.byteLength(body) };
    const req = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, body: d }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function downloadImage(imageUrl) {
  return new Promise((resolve, reject) => {
    function fetch(fetchUrl, redirects = 0) {
      if (redirects > 5) return reject(new Error('Too many redirects'));
      const parsed = new URL(fetchUrl);
      const req = https.request({
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: 'GET',
        headers: { 'User-Agent': 'WTDG/1.0' },
      }, res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return fetch(res.headers.location, redirects + 1);
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => resolve({ buffer: Buffer.concat(chunks), contentType: res.headers['content-type'] || 'image/jpeg' }));
      });
      req.on('error', reject);
      req.end();
    }
    fetch(imageUrl);
  });
}

async function uploadImage(buffer, contentType, storagePath) {
  const url = new URL(SUPABASE_URL);
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: url.hostname,
      port: 443,
      path: `/storage/v1/object/${BUCKET}/${storagePath}`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
        'Content-Type': contentType,
        'Content-Length': buffer.length,
        'x-upsert': 'true',
      },
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(`${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`);
        } else {
          reject(new Error(`Upload failed (${res.statusCode}): ${d.slice(0, 100)}`));
        }
      });
    });
    req.on('error', reject);
    req.write(buffer);
    req.end();
  });
}

function searchGooglePlaces(query) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ textQuery: query, maxResultCount: 1 });
    const req = https.request({
      hostname: 'places.googleapis.com',
      port: 443,
      path: '/v1/places:searchText',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'X-Goog-Api-Key': GOOGLE_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.photos',
      },
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)?.places?.[0] || null); }
        catch { resolve(null); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function updateBusiness(id, img, gallery) {
  const url = new URL(SUPABASE_URL);
  const body = JSON.stringify({ img, gallery });
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: url.hostname,
      port: 443,
      path: `/rest/v1/businesses?id=eq.${encodeURIComponent(id)}`,
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'Prefer': 'return=minimal',
      },
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(res.statusCode));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function processpark(park) {
  console.log(`\n🌿 ${park.id}`);
  console.log(`   Searching: "${park.query}"`);

  const place = await searchGooglePlaces(park.query);
  if (!place) { console.log('   ✗ Not found on Google Places'); return; }

  console.log(`   ✓ Found: ${place.displayName?.text} (${place.id})`);

  const photos = (place.photos || []).slice(0, MAX_PHOTOS);
  if (!photos.length) { console.log('   ✗ No photos available'); return; }

  const storedUrls = [];
  for (let i = 0; i < photos.length; i++) {
    const photoUrl = `https://places.googleapis.com/v1/${photos[i].name}/media?maxHeightPx=900&maxWidthPx=1400&key=${GOOGLE_KEY}`;
    process.stdout.write(`   📸 Photo ${i + 1}/${photos.length}…`);
    try {
      const { buffer, contentType } = await downloadImage(photoUrl);
      const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
      const url = await uploadImage(buffer, contentType, `${place.id}/${i}.${ext}`);
      storedUrls.push(url);
      process.stdout.write(` ✓ ${Math.round(buffer.length / 1024)}kb\n`);
    } catch (err) {
      process.stdout.write(` ✗ ${err.message}\n`);
    }
    await sleep(200);
  }

  if (!storedUrls.length) { console.log('   ✗ No photos stored'); return; }

  const status = await updateBusiness(park.id, storedUrls[0], storedUrls);
  console.log(`   ${status < 300 ? '✅' : '❌'} Updated Supabase (${status})`);
}

async function main() {
  console.log('🗺️  Fetching Google Places photos for parks');
  console.log(`   ${PARKS.length} parks · max ${MAX_PHOTOS} photos each\n`);

  for (const park of PARKS) {
    await processpark(park);
    await sleep(DELAY_MS);
  }

  console.log('\n\n✅ All done!');
}

main().catch(console.error);
