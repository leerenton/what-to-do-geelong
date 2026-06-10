#!/usr/bin/env node
// Fetch editorial summaries + review snippets from Google Places for businesses missing descriptions
const https = require('https');

const GOOGLE_KEY   = 'AIzaSyDHUrQ0uu0j0VDjigRhxoS44h-9Y4p1PZY';
const SUPABASE_URL = 'https://duhxszqyyzrbzrhwneey.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1aHhzenF5eXpyYnpyaHduZWV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDcyNTc1OCwiZXhwIjoyMDk2MzAxNzU4fQ.iXhO6IWYgZl-58thx2ZUySg5Dt0-s9QXYS98j4fvRQ8';
const DELAY_MS     = 120; // stay well under quota

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Supabase REST ──────────────────────────────────────────
function sbGet(path) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'duhxszqyyzrbzrhwneey.supabase.co',
      port: 443,
      path: `/rest/v1/${path}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
        'Accept': 'application/json',
      },
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve([]); } });
    });
    req.on('error', reject);
    req.end();
  });
}

function sbPatch(id, body) {
  const str = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'duhxszqyyzrbzrhwneey.supabase.co',
      port: 443,
      path: `/rest/v1/businesses?id=eq.${encodeURIComponent(id)}`,
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(str),
        'Prefer': 'return=minimal',
      },
    }, res => { res.resume(); res.on('end', () => resolve(res.statusCode)); });
    req.on('error', reject);
    req.write(str);
    req.end();
  });
}

// ── Google Places Details ──────────────────────────────────
function getPlaceDetails(placeId) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'places.googleapis.com',
      port: 443,
      path: `/v1/places/${placeId}`,
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': GOOGLE_KEY,
        'X-Goog-FieldMask': 'editorialSummary,reviews,displayName',
      },
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(null); } });
    });
    req.on('error', reject);
    req.end();
  });
}

function buildDescription(place, bizName) {
  // 1. Use editorialSummary if available
  const editorial = place?.editorialSummary?.text;
  if (editorial && editorial.length > 20) return editorial;

  // 2. Fall back to first useful Google review snippet (≥40 chars, not just ratings)
  const reviews = place?.reviews || [];
  for (const r of reviews) {
    const text = r.text?.text || '';
    if (text.length >= 40 && text.length <= 400) {
      // Clean it up — strip newlines, trim
      return text.replace(/\n+/g, ' ').trim();
    }
  }

  return null;
}

async function main() {
  // Fetch all businesses missing descriptions that have a google_place_id
  const businesses = await sbGet(
    'businesses?select=id,name,google_place_id&description=is.null&google_place_id=not.is.null&limit=200'
  );

  console.log(`🔍 ${businesses.length} businesses need descriptions\n`);

  let updated = 0, skipped = 0, failed = 0;

  for (let i = 0; i < businesses.length; i++) {
    const biz = businesses[i];
    process.stdout.write(`[${i + 1}/${businesses.length}] ${biz.name.slice(0, 45).padEnd(45)} `);

    try {
      const place = await getPlaceDetails(biz.google_place_id);
      const description = buildDescription(place, biz.name);

      if (!description) {
        process.stdout.write('— no description available\n');
        skipped++;
      } else {
        const status = await sbPatch(biz.id, { description });
        if (status < 300) {
          process.stdout.write(`✅ "${description.slice(0, 60)}…"\n`);
          updated++;
        } else {
          process.stdout.write(`❌ Supabase ${status}\n`);
          failed++;
        }
      }
    } catch (err) {
      process.stdout.write(`❌ ${err.message}\n`);
      failed++;
    }

    await sleep(DELAY_MS);
  }

  console.log(`\n✅ Updated: ${updated}  ⏭ Skipped: ${skipped}  ❌ Failed: ${failed}`);
}

main().catch(console.error);
