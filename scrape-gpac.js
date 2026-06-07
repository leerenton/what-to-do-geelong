// GPAC Event Scraper
// Fetches event detail pages from Geelong Arts Centre and inserts into Supabase.
//
// Usage:
//   SUPABASE_SERVICE_KEY=... node scrape-gpac.js
//
// Add more URLs to the EVENT_URLS array below as you find them on geelongartscentre.org.au/whats-on/

const https  = require('https');
const { createClient } = require('@supabase/supabase-js');
let ws; try { ws = require('ws'); } catch {}

const SUPABASE_URL = 'https://duhxszqyyzrbzrhwneey.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
if (!SUPABASE_KEY) { console.error('Set SUPABASE_SERVICE_KEY'); process.exit(1); }
const db = createClient(SUPABASE_URL, SUPABASE_KEY, ws ? { realtime: { transport: ws } } : {});

// ── ADD EVENT URLS HERE ───────────────────────────────────────
const GPAC_BASE = 'https://geelongartscentre.org.au';
const EVENT_URLS = [
  '/whats-on/all-events/seussical-the-musical-gsoda/',
  // Paste more paths here, e.g.:
  // '/whats-on/all-events/some-other-show/',
  // '/whats-on/all-events/another-event/',
];
// ─────────────────────────────────────────────────────────────

function fetch(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = res.headers.location.startsWith('http')
          ? res.headers.location
          : GPAC_BASE + res.headers.location;
        return fetch(redirectUrl).then(resolve).catch(reject);
      }
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve(body));
    });
    req.on('error', reject);
  });
}

function extract(html, url) {
  // Title
  const titleM = html.match(/<h1[^>]*>([^<]+)<\/h1>/) ||
                 html.match(/<title>([^|<]+)/);
  const title = titleM ? titleM[1].trim().replace(/&amp;/g,'&').replace(/&#039;/g,"'") : 'Untitled';

  // Slug from URL
  const slug = url.replace(/\/$/, '').split('/').pop();

  // Dates — grab first date-like string
  const dateM = html.match(/(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i) ||
                html.match(/((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})/i) ||
                html.match(/(\w+day,\s+\w+\s+\d{1,2},\s+\d{4})/i);
  const date = dateM ? dateM[1].trim() : '';

  // Time
  const timeM = html.match(/(\d{1,2}:\d{2}\s*[AP]M)/i);
  const time = timeM ? timeM[1] : '';

  // Price — look for dollar amounts
  const priceM = html.match(/Adult[^$]*\$(\d+)/i) || html.match(/from\s+\$(\d+)/i) || html.match(/Tickets?\s+from\s+\$(\d+)/i);
  const price = priceM ? `From $${priceM[1]}` : '';

  // Description — grab first <p> with real text
  const descMatches = [...html.matchAll(/<p[^>]*>([\s\S]{40,400}?)<\/p>/g)];
  let description = '';
  for (const m of descMatches) {
    const clean = m[1].replace(/<[^>]+>/g,'').trim();
    if (clean.length > 40 && !clean.includes('©') && !clean.toLowerCase().includes('cookie')) {
      description = clean;
      break;
    }
  }

  // Image — look for og:image or first big image
  const imgM = html.match(/property="og:image"\s+content="([^"]+)"/) ||
               html.match(/content="([^"]+\.(?:jpg|jpeg|png|webp))"\s+property="og:image"/) ||
               html.match(/static\.geelongartscentre\.org\.au\/[^"'\s]+\.(?:jpg|jpeg|png|webp)/i);
  const img = imgM ? (imgM[1] || 'https://' + imgM[0]) : '';

  // Location
  const locM = html.match(/(?:The Play House|Deakin Studio|The Playhouse|The Space)[^<,]*/i) ||
               html.match(/(\d+\s+\w[\w\s]+(?:Street|St|Road|Rd),\s*Geelong)/i);
  const location = locM ? locM[0].trim() : 'Geelong Arts Centre, Geelong';

  // Ticket URL
  const ticketM = html.match(/href="([^"]+(?:buy|ticket|book)[^"]*)"/i);
  const ticketUrl = ticketM ? (ticketM[1].startsWith('http') ? ticketM[1] : GPAC_BASE + ticketM[1]) : (GPAC_BASE + url);

  return { title, slug, date, time, price, description, img, location, ticketUrl };
}

async function run() {
  let inserted = 0, skipped = 0;

  for (const path of EVENT_URLS) {
    const url = GPAC_BASE + path;
    process.stdout.write(`Fetching ${path} … `);

    let html;
    try { html = await fetch(url); }
    catch (e) { console.log(`SKIP (fetch error: ${e.message})`); skipped++; continue; }

    const ev = extract(html, path);
    if (!ev.title || ev.title === 'Untitled') { console.log('SKIP (no title)'); skipped++; continue; }

    const payload = {
      title:       ev.title,
      slug:        ev.slug,
      category:    'Theatre',
      emoji:       '🎭',
      date:        ev.date,
      time:        ev.time,
      price:       ev.price || null,
      location:    ev.location,
      description: ev.description || null,
      img:         ev.img || null,
      url:         ev.ticketUrl,
    };

    // Delete existing by slug then insert fresh
    await db.from('events').delete().eq('slug', ev.slug);
    const { error } = await db.from('events').insert(payload);

    if (error) { console.log(`ERROR: ${error.message}`); skipped++; }
    else { console.log(`✓ ${ev.title}`); inserted++; }

    // Polite delay between requests
    await new Promise(r => setTimeout(r, 600));
  }

  console.log(`\nDone — ${inserted} inserted, ${skipped} skipped.`);
  process.exit(0);
}

run();
