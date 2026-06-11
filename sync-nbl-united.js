#!/usr/bin/env node
// ── Geelong United NBL1 Fixture Sync ─────────────────────
// Scrapes the NBL1 fixtures page for Geelong United and upserts
// into Supabase events table.
//
// NOTE: Geelong United plays in NBL1 South (state-level competition),
// NOT the national NBL. They are a separate entity from any national NBL team.
//
// Usage:
//   SUPABASE_SERVICE_KEY=... node sync-nbl-united.js
//
// Run weekly during NBL1 season (Apr–Aug roughly).
// Safe to re-run — slug-based delete/insert.

const https  = require('https');
const { createClient } = require('@supabase/supabase-js');
let ws; try { ws = require('ws'); } catch {}

const SUPABASE_URL = 'https://duhxszqyyzrbzrhwneey.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
if (!SUPABASE_KEY) { console.error('❌  Set SUPABASE_SERVICE_KEY env var'); process.exit(1); }
const db = createClient(SUPABASE_URL, SUPABASE_KEY, ws ? { realtime: { transport: ws } } : {});

const FIXTURES_URL = 'https://www.nbl1.com.au/club/geelong-united/fixtures';
const TOTAL_ROUNDS = 15;

// Geelong United brand colours
const UNITED_COLOR = '#002B5C'; // dark blue (home kit colour)

function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible)', 'Accept': 'text/html' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirect = res.headers.location.startsWith('http')
          ? res.headers.location
          : 'https://www.nbl1.com.au' + res.headers.location;
        return fetchHtml(redirect).then(resolve).catch(reject);
      }
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve(body));
    }).on('error', reject);
  });
}

// Parse NBL1 fixture page HTML to extract game data
// The page uses server-rendered HTML with game cards
function parseFixtures(html, roundNum) {
  const games = [];

  // Look for game blocks — NBL1 renders game links as /game?id=UUID
  // Each game has team names, date/time, venue
  const gameBlockRe = /game\?id=([a-f0-9-]{36})[^]*?class="[^"]*(?:fixture|game|match)[^"]*"[^]*?(?:<\/[a-z]+>){1,20}/gi;

  // Simpler: extract all text around game IDs
  // Pattern: /game?id=UUID appears in anchor hrefs
  const idRe = /\/game\?id=([a-f0-9-]{36})/g;
  const allIds = [...html.matchAll(idRe)].map(m => m[1]);
  const uniqueIds = [...new Set(allIds)];

  if (!uniqueIds.length) {
    // Fallback: try to extract game info from structured text patterns
    // NBL1 pages typically show: "TeamA vs TeamB", date, venue
    const vsRe = /([A-Z][A-Za-z\s]+)\s+(?:vs\.?|v\.?)\s+([A-Z][A-Za-z\s]+)/g;
    const dateRe = /(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/gi;
    const timeRe = /(\d{1,2}:\d{2}\s*[ap]m)/gi;

    const vsMatches   = [...html.matchAll(vsRe)];
    const dateMatches = [...html.matchAll(dateRe)];
    const timeMatches = [...html.matchAll(timeRe)];

    vsMatches.forEach((m, i) => {
      const teamA = m[1].trim();
      const teamB = m[2].trim();
      if (!teamA.includes('Geelong') && !teamB.includes('Geelong')) return;

      const isHome = teamA.includes('Geelong');
      const opponent = isHome ? teamB : teamA;
      const dateStr = dateMatches[i]?.[1] || '';
      const timeStr = timeMatches[i]?.[1] || '';

      games.push({ opponent, isHome, dateStr, timeStr, venue: '', roundNum, gameId: null });
    });

    return games;
  }

  // Extract structured data around each game ID
  uniqueIds.forEach(gameId => {
    // Get a chunk of HTML around each game link
    const idx = html.indexOf(gameId);
    if (idx === -1) return;
    const chunk = html.slice(Math.max(0, idx - 2000), idx + 2000);

    // Extract team names (look for "Geelong United" and opponent)
    const teamRe = /(?:class="[^"]*team[^"]*"[^>]*>|<(?:span|div|p|h\d)[^>]*>)\s*([A-Z][A-Za-z\s&'-]+?)(?:\s*<|$)/g;
    const teamNames = [...chunk.matchAll(teamRe)]
      .map(m => m[1].trim())
      .filter(t => t.length > 3 && t.length < 40 && /[a-z]/.test(t));

    const geelongEntry = teamNames.find(t => t.toLowerCase().includes('geelong'));
    const opponent = teamNames.find(t => !t.toLowerCase().includes('geelong') && t.length > 3);

    if (!opponent) return;
    const isHome = geelongEntry && chunk.indexOf(geelongEntry) < chunk.indexOf(opponent);

    // Extract date
    const dateM = chunk.match(/(\d{1,2}\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4})/i);
    const dateStr = dateM ? dateM[1] : '';

    // Extract time
    const timeM = chunk.match(/(\d{1,2}:\d{2}\s*[ap]m)/i);
    const timeStr = timeM ? timeM[1].toLowerCase() : '';

    // Extract venue
    const venueM = chunk.match(/(?:venue|at|@)\s*[:\-]?\s*([A-Z][A-Za-z\s&']+(?:Centre|Arena|Stadium|Park|Hall|Gym|Complex))/i);
    const venue = venueM ? venueM[1].trim() : '';

    games.push({ opponent, isHome, dateStr, timeStr, venue, roundNum, gameId });
  });

  return games;
}

// Format a raw date string like "14 June 2026" to "Sat 14 Jun"
function normaliseDate(raw) {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d)) return raw;
  const days   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

function gameToEvent(game) {
  const { opponent, isHome, dateStr, timeStr, venue, roundNum, gameId } = game;

  const title = isHome
    ? `Geelong United vs ${opponent}`
    : `Geelong United @ ${opponent}`;

  const opSlug = opponent.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const slug = `nbl1-united-r${roundNum}-${opSlug}`;

  const location = venue || (isHome ? 'Geelong Arena, Geelong' : opponent + ' Home Court');
  const normalDate = normaliseDate(dateStr) || dateStr;

  return {
    slug,
    title,
    category: 'Sport',
    tags: ['Basketball', 'NBL1', 'Geelong United', 'Sport', isHome ? 'Home Game' : 'Away Game'],
    date: normalDate,
    time: timeStr,
    location,
    price: 'See event',
    emoji: '🏀',
    color: UNITED_COLOR,
    description: `NBL1 South Round ${roundNum} — Geelong United ${isHome ? 'host' : 'take on'} ${opponent}. Tickets via NBL1.`,
    url: gameId
      ? `https://www.nbl1.com.au/game?id=${gameId}`
      : 'https://www.nbl1.com.au/club/geelong-united',
    source: 'nbl-united',
    lat: isHome ? -38.1496 : null,   // Geelong Arena (The Geelong Arena / GMHBA area)
    lng: isHome ? 144.3542 : null,
    featured: isHome,
  };
}

async function main() {
  console.log('🏀  Syncing Geelong United NBL1 fixtures...\n');

  const allGames = [];

  // Fetch the main fixtures page (shows current round)
  console.log(`📄  Fetching ${FIXTURES_URL}`);
  const mainHtml = await fetchHtml(FIXTURES_URL);
  const mainGames = parseFixtures(mainHtml, 0);
  allGames.push(...mainGames);

  // Also try to fetch round-by-round via query params
  // NBL1 site uses ?round=N pattern on the fixtures page
  for (let round = 1; round <= TOTAL_ROUNDS; round++) {
    const url = `${FIXTURES_URL}?round=${round}`;
    console.log(`   Round ${round}...`);
    try {
      const html = await fetchHtml(url);
      const games = parseFixtures(html, round);
      // Only add Geelong games not already found
      for (const g of games) {
        const exists = allGames.find(existing =>
          existing.opponent === g.opponent && existing.roundNum === round
        );
        if (!exists) allGames.push(g);
      }
    } catch (e) {
      console.warn(`   ⚠️  Round ${round} fetch failed: ${e.message}`);
    }

    // Polite delay to avoid hammering the server
    await new Promise(r => setTimeout(r, 400));
  }

  const geelongGames = allGames.filter(g => g.opponent && g.opponent.length > 2);
  console.log(`\n✅  Found ${geelongGames.length} Geelong United games\n`);

  if (!geelongGames.length) {
    console.log('⚠️   No games parsed — the NBL1 page structure may have changed.');
    console.log('    Check https://www.nbl1.com.au/club/geelong-united/fixtures manually');
    console.log('    and update the parseFixtures() function if needed.');
    process.exit(0);
  }

  let inserted = 0, errors = 0;

  for (const game of geelongGames) {
    const ev = gameToEvent(game);

    // Remove old version first
    await db.from('events').delete().eq('slug', ev.slug);

    const { error } = await db.from('events').insert(ev);
    if (error) {
      console.error(`  ❌  ${ev.title}: ${error.message}`);
      errors++;
    } else {
      console.log(`  ✅  ${ev.title} — ${ev.date} ${ev.time}`);
      inserted++;
    }
  }

  console.log(`\n🏁  Done — ${inserted} inserted, ${errors} errors`);
}

main().catch(err => { console.error(err); process.exit(1); });
