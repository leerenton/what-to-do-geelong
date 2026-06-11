#!/usr/bin/env node
// ── AFL Geelong Cats Fixture Sync ─────────────────────────
// Fetches the current season's Geelong Cats fixtures from the
// Squiggle API (free, unofficial, always up to date).
// https://api.squiggle.com.au/
//
// Usage:
//   SUPABASE_SERVICE_KEY=... node sync-afl-cats.js
//
// Run weekly during AFL season (Mar–Sep).
// Safe to re-run — clears and re-inserts by source tag.

const https  = require('https');
const { createClient } = require('@supabase/supabase-js');
let ws; try { ws = require('ws'); } catch {}

const SUPABASE_URL = 'https://duhxszqyyzrbzrhwneey.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
if (!SUPABASE_KEY) { console.error('❌  Set SUPABASE_SERVICE_KEY env var'); process.exit(1); }
const db = createClient(SUPABASE_URL, SUPABASE_KEY, ws ? { realtime: { transport: ws } } : {});

const SQUIGGLE   = 'https://api.squiggle.com.au';
const TEAM_ID    = 7;        // Geelong Cats in Squiggle
const TEAM_NAME  = 'Geelong';
const YEAR       = new Date().getFullYear();
const CATS_COLOR = '#001F5B'; // navy

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'wtdg-geelong-site/1.0',
        'Accept': 'application/json',
      }
    }, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(new Error(`JSON parse for ${url}: ${e.message}`)); }
      });
    }).on('error', reject);
  });
}

// "2026-06-14 19:25:00" → "Sat 14 Jun"
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr.replace(' ', 'T') + '+10:00');
  const days   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

// "2026-06-14 19:25:00" → "7:25pm"
function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr.replace(' ', 'T') + '+10:00');
  return d.toLocaleTimeString('en-AU', {
    timeZone: 'Australia/Melbourne',
    hour: 'numeric', minute: '2-digit', hour12: true
  }).toLowerCase();
}

function gameToEvent(game) {
  const isHome    = (game.hteam || '').includes(TEAM_NAME);
  const opponent  = isHome ? game.ateam : game.hteam;
  // Squiggle uses "Kardinia Park" — map to official name
  const rawVenue  = game.venue || '';
  const venueName = rawVenue.replace('Kardinia Park', 'GMHBA Stadium') || (isHome ? 'GMHBA Stadium' : 'Away');
  const roundNum  = game.round || 0;
  const roundName = game.roundname || `Round ${roundNum}`;
  const isPlayed  = game.complete === 100;

  const title = isHome
    ? `Geelong Cats vs ${opponent}`
    : `Geelong Cats @ ${opponent}`;

  const opSlug = (opponent || 'tbc').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const slug   = `afl-cats-${YEAR}-r${roundNum}-${opSlug}`;

  const scoreLine = isPlayed && game.hscore != null
    ? ` (${isHome ? game.hscore : game.ascore}–${isHome ? game.ascore : game.hscore})`
    : '';

  return {
    slug,
    title: title + scoreLine,
    category: 'Sport',
    tags: ['AFL', 'Sport', 'Geelong Cats', isHome ? 'Home Game' : 'Away Game'],
    date: formatDate(game.date),
    time: formatTime(game.date),
    location: venueName + (isHome && !venueName.includes('Geelong') ? ', Geelong' : ''),
    price: isPlayed ? 'Completed' : 'See event',
    emoji: '🏉',
    color: CATS_COLOR,
    description: `${roundName} ${YEAR} — Geelong Cats ${isHome ? 'host' : 'visit'} ${opponent} at ${venueName}.${!isPlayed ? ' Get tickets via the AFL app or Ticketek.' : ''}`,
    url: 'https://www.afl.com.au/tickets',
    source: 'afl-cats',
    lat: isHome ? -38.1574 : null,
    lng: isHome ? 144.3551 : null,
    featured: isHome && !isPlayed,
  };
}

async function main() {
  console.log(`🏉  Syncing Geelong Cats AFL ${YEAR} fixtures via Squiggle...\n`);

  const url  = `${SQUIGGLE}/?q=games;year=${YEAR};team=${TEAM_ID}`;
  console.log(`📡  Fetching: ${url}\n`);
  const data = await fetchJson(url);
  const games = data.games || [];

  if (!games.length) {
    console.log('⚠️   No games returned. Season may not have started yet.');
    process.exit(0);
  }

  console.log(`✅  Found ${games.length} games\n`);

  // Clear all existing AFL Cats events before re-inserting
  const { error: delErr } = await db.from('events').delete().eq('source', 'afl-cats');
  if (delErr) console.warn('  ⚠️  Clear error:', delErr.message);

  let inserted = 0, errors = 0;

  for (const game of games) {
    const ev = gameToEvent(game);
    const { error } = await db.from('events').insert(ev);
    if (error) {
      console.error(`  ❌  ${ev.title}: ${error.message}`);
      errors++;
    } else {
      console.log(`  ✅  ${ev.title} — ${ev.date}${ev.time ? ' ' + ev.time : ''}`);
      inserted++;
    }
  }

  console.log(`\n🏁  Done — ${inserted} inserted, ${errors} errors`);
}

main().catch(err => { console.error(err); process.exit(1); });
