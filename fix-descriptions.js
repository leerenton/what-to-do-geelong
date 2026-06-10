#!/usr/bin/env node
// Replace review-text descriptions with proper editorial summaries from Google Places
// Falls back to a generated description if no editorial summary exists
const https = require('https');

const GOOGLE_KEY   = 'AIzaSyDHUrQ0uu0j0VDjigRhxoS44h-9Y4p1PZY';
const SUPABASE_URL = 'https://duhxszqyyzrbzrhwneey.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1aHhzenF5eXpyYnpyaHduZWV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDcyNTc1OCwiZXhwIjoyMDk2MzAxNzU4fQ.iXhO6IWYgZl-58thx2ZUySg5Dt0-s9QXYS98j4fvRQ8';
const DELAY_MS = 150;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function sbGet(path) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'duhxszqyyzrbzrhwneey.supabase.co', port: 443,
      path: `/rest/v1/${path}`, method: 'GET',
      headers: { 'Authorization': `Bearer ${SUPABASE_KEY}`, 'apikey': SUPABASE_KEY, 'Accept': 'application/json' },
    }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve([]); } });
    });
    req.on('error', reject); req.end();
  });
}

function sbPatch(id, body) {
  const str = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'duhxszqyyzrbzrhwneey.supabase.co', port: 443,
      path: `/rest/v1/businesses?id=eq.${encodeURIComponent(id)}`, method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`, 'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(str), 'Prefer': 'return=minimal',
      },
    }, res => { res.resume(); res.on('end', () => resolve(res.statusCode)); });
    req.on('error', reject); req.write(str); req.end();
  });
}

function getPlaceDetails(placeId) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'places.googleapis.com', port: 443,
      path: `/v1/places/${placeId}`, method: 'GET',
      headers: {
        'X-Goog-Api-Key': GOOGLE_KEY,
        'X-Goog-FieldMask': 'editorialSummary,displayName,types,formattedAddress',
      },
    }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(null); } });
    });
    req.on('error', reject); req.end();
  });
}

// Generate a clean description from available data when Google has no editorial summary
function generateDescription(biz, place) {
  const suburb = biz.suburb || 'Geelong';
  const type = biz.type || '';
  const name = biz.name;
  const rating = biz.rating ? ` Rated ${biz.rating} stars on Google.` : '';

  const templates = {
    'Café':            `${name} is a café in ${suburb}, serving coffee and food to the local community.${rating}`,
    'Restaurant':      `${name} is a restaurant in ${suburb} offering dining in the Geelong region.${rating}`,
    'Bar':             `${name} is a bar in ${suburb}, part of Geelong's vibrant hospitality scene.${rating}`,
    'Pub':             `${name} is a pub in ${suburb} — a local favourite for drinks and good times.${rating}`,
    'Brewery':         `${name} is a craft brewery in ${suburb}, producing quality beers in the Geelong region.${rating}`,
    'Winery':          `${name} is a winery in ${suburb} on the Bellarine Peninsula, offering cellar door tastings.${rating}`,
    'Attraction':      `${name} is a popular attraction in ${suburb}, worth adding to your Geelong itinerary.${rating}`,
    'Parks & Nature':  `${name} is a green space in ${suburb}, offering walking tracks and natural scenery.${rating}`,
    'Family':          `${name} is a family-friendly venue in ${suburb} — great for kids and adults alike.${rating}`,
    'Arts & Culture':  `${name} is an arts and culture venue in ${suburb}, showcasing creative work in the Geelong region.${rating}`,
    'Wellness':        `${name} is a wellness and day spa in ${suburb}, offering relaxation and rejuvenation.${rating}`,
    'Sport & Leisure': `${name} is a sport and leisure venue in ${suburb} — great for active days out.${rating}`,
    'Entertainment':   `${name} is an entertainment venue in ${suburb}, offering fun for groups and families.${rating}`,
    'Tour & Experience': `${name} offers tours and experiences in the ${suburb} area and wider Geelong region.${rating}`,
  };

  return templates[type] || `${name} is located in ${suburb} and is part of the Geelong region's growing list of things to see and do.${rating}`;
}

async function main() {
  // Fetch all businesses — we'll re-fetch editorial summaries and replace any that are review text
  const businesses = await sbGet(
    'businesses?select=id,name,type,suburb,rating,google_place_id,description&google_place_id=not.is.null&limit=300'
  );

  console.log(`📋 ${businesses.length} businesses to check\n`);

  let updated = 0, kept = 0, generated = 0;

  for (let i = 0; i < businesses.length; i++) {
    const biz = businesses[i];
    process.stdout.write(`[${i + 1}/${businesses.length}] ${biz.name.slice(0, 45).padEnd(45)} `);

    try {
      const place = await getPlaceDetails(biz.google_place_id);
      const editorial = place?.editorialSummary?.text;

      if (editorial && editorial.length > 20) {
        // Has a proper editorial summary — use it (replaces review text too)
        if (biz.description !== editorial) {
          await sbPatch(biz.id, { description: editorial });
          process.stdout.write(`✅ editorial: "${editorial.slice(0, 55)}…"\n`);
          updated++;
        } else {
          process.stdout.write(`— already correct\n`);
          kept++;
        }
      } else if (!biz.description || biz.description.length < 30) {
        // No description at all — generate one
        const desc = generateDescription(biz, place);
        await sbPatch(biz.id, { description: desc });
        process.stdout.write(`🔧 generated: "${desc.slice(0, 55)}…"\n`);
        generated++;
      } else {
        // Has a description (might be review text) but no editorial — generate a clean one
        const desc = generateDescription(biz, place);
        await sbPatch(biz.id, { description: desc });
        process.stdout.write(`🔧 replaced review text: "${desc.slice(0, 45)}…"\n`);
        generated++;
      }
    } catch (err) {
      process.stdout.write(`❌ ${err.message}\n`);
    }

    await sleep(DELAY_MS);
  }

  console.log(`\n✅ Editorial: ${updated}  🔧 Generated: ${generated}  — Kept: ${kept}`);
}

main().catch(console.error);
