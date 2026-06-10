#!/usr/bin/env node
// Scrape meta/og descriptions from business websites and update Supabase
const https = require('https');
const http  = require('http');

const SUPABASE_URL = 'https://duhxszqyyzrbzrhwneey.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1aHhzenF5eXpyYnpyaHduZWV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDcyNTc1OCwiZXhwIjoyMDk2MzAxNzU4fQ.iXhO6IWYgZl-58thx2ZUySg5Dt0-s9QXYS98j4fvRQ8';
const DELAY_MS     = 600;
const TIMEOUT_MS   = 8000;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Fetch a URL, follow redirects, return HTML ─────────────
function fetchPage(rawUrl, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 4) return reject(new Error('Too many redirects'));

    let url = rawUrl;
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

    let parsed;
    try { parsed = new URL(url); } catch { return reject(new Error(`Bad URL: ${url}`)); }

    const lib = parsed.protocol === 'http:' ? http : https;
    const timer = setTimeout(() => { req.destroy(); reject(new Error('Timeout')); }, TIMEOUT_MS);

    const req = lib.request({
      hostname: parsed.hostname,
      port:     parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path:     parsed.pathname + parsed.search,
      method:   'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WTDGBot/1.0)',
        'Accept': 'text/html',
      },
    }, res => {
      clearTimeout(timer);
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        const next = new URL(res.headers.location, url).href;
        return resolve(fetchPage(next, redirects + 1));
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      // Only read first 30kb — enough for <head>
      let html = '';
      res.setEncoding('utf8');
      res.on('data', chunk => {
        html += chunk;
        if (html.length > 30000) { req.destroy(); resolve(html); }
      });
      res.on('end', () => resolve(html));
    });

    req.on('error', err => { clearTimeout(timer); reject(err); });
    req.end();
  });
}

// ── Extract best description from HTML ─────────────────────
function extractDescription(html) {
  if (!html) return null;

  // Try in order of preference:
  const patterns = [
    // og:description
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']{30,300})["']/i,
    /<meta[^>]+content=["']([^"']{30,300})["'][^>]+property=["']og:description["']/i,
    // twitter:description
    /<meta[^>]+name=["']twitter:description["'][^>]+content=["']([^"']{30,300})["']/i,
    /<meta[^>]+content=["']([^"']{30,300})["'][^>]+name=["']twitter:description["']/i,
    // standard meta description
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']{30,300})["']/i,
    /<meta[^>]+content=["']([^"']{30,300})["'][^>]+name=["']description["']/i,
  ];

  for (const pattern of patterns) {
    const m = html.match(pattern);
    if (m) {
      const text = m[1]
        .replace(/\s+/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();
      if (text.length >= 30) return text;
    }
  }
  return null;
}

// ── Supabase helpers ────────────────────────────────────────
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

// ── Main ────────────────────────────────────────────────────
async function main() {
  const businesses = await sbGet(
    'businesses?select=id,name,website&website=not.is.null&limit=200'
  );

  console.log(`🌐 Scraping ${businesses.length} business websites\n`);

  let updated = 0, failed = 0, noDesc = 0;

  for (let i = 0; i < businesses.length; i++) {
    const biz = businesses[i];
    process.stdout.write(`[${i + 1}/${businesses.length}] ${biz.name.slice(0, 40).padEnd(40)} `);

    try {
      const html = await fetchPage(biz.website);
      const description = extractDescription(html);

      if (!description) {
        process.stdout.write(`— no meta description found\n`);
        noDesc++;
      } else {
        await sbPatch(biz.id, { description });
        process.stdout.write(`✅ "${description.slice(0, 65)}…"\n`);
        updated++;
      }
    } catch (err) {
      process.stdout.write(`❌ ${err.message}\n`);
      failed++;
    }

    await sleep(DELAY_MS);
  }

  console.log(`\n✅ Updated: ${updated}  — No meta desc: ${noDesc}  ❌ Failed: ${failed}`);
}

main().catch(console.error);
