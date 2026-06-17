#!/usr/bin/env node
// ── Enrich Ballarat businesses with Google Places data ──────────
// Looks up each pre-inserted Ballarat business by name,
// downloads photos → Supabase Storage, patches the DB row.
// ──────────────────────────────────────────────────────────────

const https = require('https');

const GOOGLE_KEY     = 'AIzaSyDHUrQ0uu0j0VDjigRhxoS44h-9Y4p1PZY';
const SUPABASE_URL   = 'https://duhxszqyyzrbzrhwneey.supabase.co';
const SUPABASE_KEY   = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1aHhzenF5eXpyYnpyaHduZWV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDcyNTc1OCwiZXhwIjoyMDk2MzAxNzU4fQ.iXhO6IWYgZl-58thx2ZUySg5Dt0-s9QXYS98j4fvRQ8';
const STORAGE_BUCKET = 'business-images';
const MAX_PHOTOS     = 4;

const BALLARAT_BUSINESSES = [
  { id: 'lespresso-ballarat',        name: "L'Espresso",          address: '417 Sturt St Ballarat' },
  { id: 'eureka-bistro-ballarat',    name: 'Eureka Bistro',        address: '314 Sturt St Ballarat' },
  { id: 'forge-pizzeria-ballarat',   name: 'The Forge Pizzeria',   address: '14 Armstrong St North Ballarat' },
  { id: 'hop-temple-ballarat',       name: 'Hop Temple',           address: '24 Armstrong St North Ballarat' },
  { id: 'fika-coffee-ballarat',      name: 'FIKA Coffee Brewers',  address: '36A Doveton St North Ballarat' },
  { id: 'cafe-lekker-ballarat',      name: 'Cafe Lekker',          address: '11 Doveton St North Ballarat' },
  { id: 'moon-and-mountain-ballarat',name: 'Moon & Mountain',      address: '220 Mair St Ballarat' },
  { id: 'boatshed-restaurant-ballarat', name: 'Boatshed Restaurant', address: 'Lake Wendouree Ballarat' },
  { id: 'underbar-ballarat',         name: 'Underbar',             address: '3 Doveton St North Ballarat' },
  { id: 'babae-ballarat',            name: 'Babae',                address: '710 Sturt St Ballarat' },
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function httpsRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString();
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
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
        headers: { 'User-Agent': 'WTDG-Scraper/1.0' },
      }, res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return fetch(res.headers.location, redirects + 1);
        }
        if (res.statusCode !== 200) { res.resume(); return reject(new Error(`HTTP ${res.statusCode}`)); }
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
  const parsed = new URL(SUPABASE_URL);
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: parsed.hostname, port: 443,
      path: `/storage/v1/object/${STORAGE_BUCKET}/${storagePath}`,
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
          resolve(`${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${storagePath}`);
        } else {
          reject(new Error(`Upload failed (${res.statusCode}): ${d.slice(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    req.write(buffer);
    req.end();
  });
}

async function storePhotos(placeId, photoUrls) {
  const stored = [];
  for (let i = 0; i < photoUrls.length; i++) {
    try {
      process.stdout.write(`      📸 Photo ${i + 1}/${photoUrls.length}…`);
      const { buffer, contentType } = await downloadImage(photoUrls[i]);
      const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
      const url = await uploadImage(buffer, contentType, `${placeId}/${i}.${ext}`);
      stored.push(url);
      process.stdout.write(` ✓ (${Math.round(buffer.length / 1024)}kb)\n`);
    } catch (e) {
      process.stdout.write(` ✗ ${e.message}\n`);
    }
    await sleep(150);
  }
  return stored;
}

async function searchPlace(name, address) {
  const query = `${name} ${address}`;
  console.log(`\n🔍 Searching: "${query}"`);
  const res = await httpsRequest({
    hostname: 'places.googleapis.com', port: 443,
    path: '/v1/places:searchText',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_KEY,
      'X-Goog-FieldMask': [
        'places.id', 'places.displayName', 'places.formattedAddress',
        'places.location', 'places.rating', 'places.nationalPhoneNumber',
        'places.websiteUri', 'places.photos', 'places.regularOpeningHours',
      ].join(','),
    },
  }, {
    textQuery: query,
    maxResultCount: 1,
    locationBias: {
      circle: { center: { latitude: -37.5622, longitude: 143.8503 }, radius: 5000 },
    },
  });
  return res.body?.places?.[0] || null;
}

async function updateBusiness(id, patch) {
  const parsed = new URL(SUPABASE_URL);
  const bodyStr = JSON.stringify(patch);
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: parsed.hostname, port: 443,
      path: `/rest/v1/businesses?id=eq.${encodeURIComponent(id)}`,
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
        'Prefer': 'return=minimal',
      },
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.status || res.statusCode, body: d }));
    });
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

async function main() {
  console.log('═══════════════════════════════════════');
  console.log(' Ballarat Business Enrichment');
  console.log('═══════════════════════════════════════');

  for (const biz of BALLARAT_BUSINESSES) {
    const place = await searchPlace(biz.name, biz.address);

    if (!place) {
      console.log(`   ⚠️  Not found: ${biz.name}`);
      continue;
    }

    console.log(`   ✅ Found: ${place.displayName?.text}`);
    console.log(`      Rating : ${place.rating || '—'}`);
    console.log(`      Phone  : ${place.nationalPhoneNumber || '—'}`);
    console.log(`      Website: ${place.websiteUri || '—'}`);
    console.log(`      LatLng : ${place.location?.latitude}, ${place.location?.longitude}`);
    console.log(`      Photos : ${place.photos?.length || 0} available`);

    // Download & store photos
    const photoUrls = (place.photos || []).slice(0, MAX_PHOTOS).map(p =>
      `https://places.googleapis.com/v1/${p.name}/media?maxHeightPx=800&maxWidthPx=1200&key=${GOOGLE_KEY}`
    );
    let storedPhotos = [];
    if (photoUrls.length) {
      storedPhotos = await storePhotos(place.id, photoUrls);
    }

    const hours = place.regularOpeningHours ? {
      periods: place.regularOpeningHours.periods || [],
      weekdayDescriptions: place.regularOpeningHours.weekdayDescriptions || [],
    } : null;

    const patch = {
      google_place_id: place.id,
      lat:             place.location?.latitude  || null,
      lng:             place.location?.longitude || null,
      rating:          place.rating || null,
      phone:           place.nationalPhoneNumber || null,
      website:         place.websiteUri ? place.websiteUri.replace(/^https?:\/\//, '').replace(/\/$/, '') : null,
      img:             storedPhotos[0] || null,
      gallery:         storedPhotos.length > 1 ? storedPhotos.slice(1) : null,
      opening_hours:   hours,
    };

    const res = await updateBusiness(biz.id, patch);
    if (res.status >= 200 && res.status < 300) {
      console.log(`   💾 Patched: ${biz.name} (${storedPhotos.length} photos stored)`);
    } else {
      console.log(`   ✗ Patch failed (${res.status}): ${res.body?.slice(0, 120)}`);
    }

    await sleep(400);
  }

  console.log('\n═══════════════════════════════════════');
  console.log(' ✅ Enrichment complete');
  console.log('═══════════════════════════════════════\n');
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
