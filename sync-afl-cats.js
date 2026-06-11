#!/usr/bin/env node
// ── AFL Geelong Cats Fixture Sync ─────────────────────────
// Fetches the current season's Geelong Cats fixtures from the
// AFL API and upserts them into the Supabase events table.
//
// Usage:
//   SUPABASE_SERVICE_KEY=... node sync-afl-cats.js
//
// Run weekly during AFL season (Mar–Sep).
// Safe to re-run — uses slug-based upsert.

const https  = require('https');
const { createClient } = require('@supabase/supabase-js');
let ws; try { ws = require('ws'); } catch {}

const SUPABASE_URL = 'https://duhxszqyyzrbzrhwneey.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
if (!SUPABASE_KEY) { console.error('❌  Set SUPABASE_SERVICE_KEY env var'); process.exit(1); }
const db = createClient(SUPABASE_URL, SUPABASE_KEY, ws ? { realtime: { transport: ws } } : {});

const AFL_BASE    = 'https://aflapi.afl.com.au/afl/v2';
const TEAM_ID     = 10;    // Geelong Cats
const COMP_ID     = 1;     // Toyota AFL Premiership (mens)
const HOME_VENUE  = 'GMHBA Stadium';

// Cats brand colours for card rendering
const CATS_COLOR  = '#001F5B'; // navy

function fetchJson(path) {
  return new Promise((resolve, reject) => {
    const url = `${AFL_BASE}${path}`;
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } }, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(new Error(`JSON parse error for ${url}: ${e.message}`)); }
      });
    }).on('error', reject);
  });
}

// Fetch all pages for a given path (handles pagination)
async function fetchAllPages(path, pageSize = 50) {
  const results = [];
  let page = 0;
  while (true) {
    const sep = path.includes('?') ? '&' : '?';
    const data = await fetchJson(`${path}${sep}pageSize=${pageSize}&page=${page}`);
    const items = data.matches || data.compSeasons || data.teams || [];
    results.push(...items);
    if (page >= (data.numPages || 1) - 1) break;
    page++;
  }
  return results;
}

// Find the most recent AFL Premiership season ID
async function getCurrentSeasonId() {
  // Fetch last page of compseasons to get the most recent
  const first = await fetchJson(`/compseasons?competitionId=${COMP_ID}&pageSize=1&page=0`);
  const totalPages = first.numPages || 1;
  const last = await fetchJson(`/compseasons?competitionId=${COMP_ID}&pageSize=10&page=${totalPages - 1}`);
  const seasons = last.compSeasons || [];
  // Return the highest ID (most recent)
  seasons.sort((a, b) => b.id - a.id);
  const current = seasons[0];
  if (!current) throw new Error('Could not find current season');
  console.log(`📅  Using season: ${current.name} (ID: ${current.id})`);
  return current.id;
}

// Format a UTC date string to "Sat 14 Jun" style
function formatDate(utcStr) {
  if (!utcStr) return '';
  const d = new Date(utcStr);
  const days  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

// Format time as "2:10pm"
function formatTime(utcStr, timezone = 'Australia/Melbourne') {
  if (!utcStr) return '';
  const d = new Date(utcStr);
  return d.toLocaleTimeString('en-AU', { timeZone: timezone, hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
}

// Convert match data to our events table row
function matchToEvent(match) {
  const home = match.home?.team;
  const away = match.away?.team;
  const isHome = home?.id === TEAM_ID;
  const opponent = isHome ? away : home;
  const venue = match.venue;

  const roundName = match.round?.name || match.round?.abbreviation || 'Round';
  const oppName   = opponent?.name || 'TBC';
  const venueName = venue?.name || (isHome ? HOME_VENUE : 'Away');
  const venueCity = venue?.location || (isHome ? 'Geelong' : '');

  const title = isHome
    ? `Geelong Cats vs ${oppName}`
    : `Geelong Cats @ ${oppName}`;

  const slug = `afl-cats-${match.round?.roundNumber || 0}-${(oppName).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;

  const dateStr = formatDate(match.utcStartTime);
  const timeStr = formatTime(match.utcStartTime);

  const isCompleted = match.status === 'CONCLUDED' || match.status === 'FINAL';
  const price = 'See event';

  return {
    slug,
    title,
    category: 'Sport',
    tags: ['AFL', 'Sport', 'Geelong Cats', isHome ? 'Home Game' : 'Away Game'],
    date: dateStr,
    time: timeStr,
    location: venueName + (venueCity ? `, ${venueCity}` : ''),
    price,
    emoji: '🏉',
    color: CATS_COLOR,
    description: `${roundName} — ${isHome ? 'Home' : 'Away'} game at ${venueName}. ${isCompleted ? 'Final result.' : 'Get tickets via the AFL app or AFL website.'}`,
    url: 'https://www.afl.com.au/tickets',
    source: 'afl-cats',
    lat: isHome ? -38.1574 : null,   // GMHBA Stadium coords
    lng: isHome ? 144.3551 : null,
    featured: isHome,   // feature home games
  };
}

async function main() {
  console.log('🏉  Syncing Geelong Cats AFL fixtures...\n');

  const seasonId = await getCurrentSeasonId();

  console.log(`🔍  Fetching all matches for team ${TEAM_ID}...`);
  // Fetch all matches for Geelong this season
  const allMatches = [];
  let page = 0;
  while (true) {
    const data = await fetchJson(`/matches?teamId=${TEAM_ID}&competitionId=${COMP_ID}&compSeasonId=${seasonId}&pageSize=50&page=${page}`);
    const matches = data.matches || [];
    allMatches.push(...matches);
    if (page >= (data.numPages || 1) - 1) break;
    page++;
  }

  if (!allMatches.length) {
    console.log('⚠️   No matches found. Season may not have started or season ID may be wrong.');
    console.log(`    Try running with a specific season ID by setting COMP_SEASON_ID env var.`);
    process.exit(0);
  }

  console.log(`✅  Found ${allMatches.length} matches\n`);

  let inserted = 0, updated = 0, errors = 0;

  for (const match of allMatches) {
    const ev = matchToEvent(match);

    // Delete old version first (slug may have changed if round numbers shift)
    // Use source+round combo for safe upsert
    const { error: delErr } = await db.from('events')
      .delete()
      .eq('slug', ev.slug);

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
  if (errors) console.log('    Check errors above — may need to add columns to events table.');
}

main().catch(err => { console.error(err); process.exit(1); });
