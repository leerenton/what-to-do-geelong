#!/usr/bin/env node
// ── WTDG Event Description Scraper ───────────────────────────
// Fetches og:description / meta description from event URLs
// and updates events in Supabase that currently have no description.
//
// Usage: node scripts/scrape-event-descriptions.js
//        node scripts/scrape-event-descriptions.js --dry-run
// ──────────────────────────────────────────────────────────────

const https = require('https');
const http  = require('http');
const url   = require('url');

const SUPABASE_URL = 'https://duhxszqyyzrbzrhwneey.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1aHhzenF5eXpyYnpyaHduZWV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDcyNTc1OCwiZXhwIjoyMDk2MzAxNzU4fQ.iXhO6IWYgZl-58thx2ZUySg5Dt0-s9QXYS98j4fvRQ8';

const DRY_RUN    = process.argv.includes('--dry-run');
const DELAY_MS   = 600;
const MAX_REDIRECTS = 4;

// Sources we won't scrape (login walls / useless)
const SKIP_DOMAINS = ['facebook.com', 'instagram.com', 'twitter.com', 'x.com', 'google.com'];

// Sources we also skip where we know there's no useful description
const SKIP_CONTAINS = ['geelongcity.vic.gov.au'];

// ── HTTP fetch with redirect following ───────────────────────
function fetchUrl(rawUrl, redirectsLeft = MAX_REDIRECTS) {
  return new Promise((resolve, reject) => {
    if (redirectsLeft <= 0) return reject(new Error('Too many redirects'));
    let parsed;
    try { parsed = new URL(rawUrl); } catch(e) { return reject(e); }
    const lib = parsed.protocol === 'https:' ? https : http;
    const req = lib.get(rawUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      timeout: 10000,
    }, res => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        const next = new URL(res.headers.location, rawUrl).toString();
        res.destroy();
        return resolve(fetchUrl(next, redirectsLeft - 1));
      }
      if (res.statusCode !== 200) {
        res.destroy();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      let body = '';
      res.setEncoding('utf8');
      res.on('data', c => { body += c; if (body.length > 150000) res.destroy(); });
      res.on('end', () => resolve(body));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// ── Extract best description from HTML ───────────────────────
function extractDescription(html, title) {
  // og:description — most reliable
  let m = html.match(/property\s*=\s*["']og:description["'][^>]*content\s*=\s*["']([^"']{20,})["']/i)
           || html.match(/content\s*=\s*["']([^"']{20,})["'][^>]*property\s*=\s*["']og:description["']/i);
  if (m) return cleanDesc(m[1]);

  // meta name=description
  m = html.match(/name\s*=\s*["']description["'][^>]*content\s*=\s*["']([^"']{20,})["']/i)
    || html.match(/content\s*=\s*["']([^"']{20,})["'][^>]*name\s*=\s*["']description["']/i);
  if (m) return cleanDesc(m[1]);

  // Twitter description
  m = html.match(/name\s*=\s*["']twitter:description["'][^>]*content\s*=\s*["']([^"']{20,})["']/i)
    || html.match(/content\s*=\s*["']([^"']{20,})["'][^>]*name\s*=\s*["']twitter:description["']/i);
  if (m) return cleanDesc(m[1]);

  return null;
}

function cleanDesc(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function isGenericDesc(desc) {
  if (!desc) return true;
  const lower = desc.toLowerCase();
  return lower.includes('wide range of services')
    || lower.includes('support life in geelong')
    || lower.includes('city of greater geelong')
    || lower.includes('what to do geelong')
    || lower.includes('tickets for')   // ticket system boilerplate prefix
    && lower.includes('from geelong australia'); // geelongaustralia prefix
}

// Strip "Tickets for X in Y from Geelong Australia. " prefix if present
function stripTicketPrefix(desc, title) {
  // "Tickets for Little Red Riding Hood in Drysdale from Geelong Australia. Little Red..."
  let d = desc.replace(/^tickets for .+? from geelong australia\.\s*/i, '').trim();
  // Also strip "[Title] [Title] " doubled prefix (some pages repeat title twice)
  if (title) {
    const esc = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    d = d.replace(new RegExp('^' + esc + '\\s+' + esc + '\\s+', 'i'), '').trim();
    d = d.replace(new RegExp('^' + esc + '\\s+', 'i'), '').trim();
  }
  return d;
}

// ── Supabase helpers ──────────────────────────────────────────
function sbRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(SUPABASE_URL + path);
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(d ? JSON.parse(d) : {}); }
        catch { resolve(d); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Main ──────────────────────────────────────────────────────
async function main() {
  console.log(DRY_RUN ? '🧪 DRY RUN — no DB writes' : '🚀 Live run — will update Supabase');
  console.log('');

  // Fetch all events without a description (or with generic one) that have a URL
  const rows = await sbRequest('GET', '/rest/v1/events?select=id,title,slug,url,description&order=id.asc&limit=500');
  if (!Array.isArray(rows)) { console.error('Bad response:', rows); process.exit(1); }

  const targets = rows.filter(r => {
    const noDesc = !r.description || isGenericDesc(r.description);
    const hasUrl = r.url && r.url.trim();
    const notSkipped = !SKIP_DOMAINS.some(d => (r.url || '').includes(d))
                    && !SKIP_CONTAINS.some(d => (r.url || '').includes(d));
    return noDesc && hasUrl && notSkipped;
  });

  const skippedFb = rows.filter(r => {
    const noDesc = !r.description || isGenericDesc(r.description);
    const skipDom = SKIP_DOMAINS.some(d => (r.url || '').includes(d));
    return noDesc && skipDom;
  });

  const noUrl = rows.filter(r => (!r.description || isGenericDesc(r.description)) && !r.url);

  console.log(`Total events: ${rows.length}`);
  console.log(`Need descriptions + have scrapeable URL: ${targets.length}`);
  console.log(`Social media (skipping — login walls): ${skippedFb.length}`);
  console.log(`No URL at all (skipping): ${noUrl.length}`);
  console.log('');

  let updated = 0, failed = 0, skipped = 0;

  for (const ev of targets) {
    process.stdout.write(`[${ev.id}] ${ev.title.substring(0, 50).padEnd(50)} → `);
    try {
      const html = await fetchUrl(ev.url);
      let desc = extractDescription(html, ev.title);
      if (desc) {
        desc = stripTicketPrefix(desc, ev.title);
        // Truncate at 500 chars (clean word boundary)
        if (desc.length > 500) {
          desc = desc.substring(0, 497).replace(/\s\S+$/, '') + '…';
        }
        if (desc.length < 20) throw new Error('Too short');
        process.stdout.write(`✅ ${desc.substring(0, 80)}…\n`);
        if (!DRY_RUN) {
          await sbRequest('PATCH', `/rest/v1/events?id=eq.${ev.id}`, { description: desc });
        }
        updated++;
      } else {
        process.stdout.write(`⚠️  No description found in page\n`);
        skipped++;
      }
    } catch (err) {
      process.stdout.write(`❌ ${err.message}\n`);
      failed++;
    }
    await sleep(DELAY_MS);
  }

  console.log('');
  console.log(`Done — updated: ${updated}, failed: ${failed}, no-desc-found: ${skipped}`);

  if (skippedFb.length) {
    console.log('');
    console.log('Facebook/social events that still need descriptions (manual):');
    skippedFb.forEach(r => console.log(`  [${r.id}] ${r.title} → ${r.url}`));
  }
  if (noUrl.length) {
    console.log('');
    console.log('Events with no URL (need manual descriptions):');
    noUrl.forEach(r => console.log(`  [${r.id}] ${r.title}`));
  }
}

main().catch(e => { console.error(e); process.exit(1); });
