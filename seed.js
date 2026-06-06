'use strict';

// Converts camelCase keys to snake_case for Supabase inserts
function snakify(data) {
  if (Array.isArray(data)) return data.map(snakify);
  if (data && typeof data === 'object') {
    return Object.fromEntries(
      Object.entries(data).map(([k, v]) => [
        k.replace(/([A-Z])/g, '_$1').toLowerCase(),
        snakify(v)
      ])
    );
  }
  return data;
}

const log = document.getElementById('js-log');
const btn = document.getElementById('js-seed-btn');

function write(msg, type = 'info') {
  if (!log) return;
  log.classList.add('visible');
  const line = document.createElement('div');
  line.className = type;
  line.textContent = msg;
  log.appendChild(line);
  log.scrollTop = log.scrollHeight;
}

async function seedTable(tableName, rows, label) {
  write(`Seeding ${label}...`);
  const snaked = rows.map(snakify);
  const { error, count } = await db.from(tableName).upsert(snaked, { onConflict: 'id' });
  if (error) {
    write(`✗ ${label}: ${error.message}`, 'err');
    return false;
  }
  write(`✓ ${label}: ${rows.length} rows inserted`, 'ok');
  return true;
}

async function runSeed() {
  btn.disabled = true;
  btn.textContent = 'Seeding…';
  write('Starting seed…');

  let ok = true;
  ok = await seedTable('businesses', BUSINESSES, 'Businesses') && ok;
  ok = await seedTable('stays', STAYS, 'Stays') && ok;

  // Events: strip 'featured' field default, ensure business_id not camelCased issue
  ok = await seedTable('events', EVENTS, 'Events') && ok;
  ok = await seedTable('promos', PROMOS, 'Promos') && ok;
  ok = await seedTable('articles', ARTICLES, 'Articles') && ok;

  if (ok) {
    write('✓ All done! You can close this page.', 'ok');
    btn.textContent = '✓ Seeded';
  } else {
    write('Some tables had errors — check above.', 'err');
    btn.disabled = false;
    btn.textContent = 'Retry';
  }
}

btn && btn.addEventListener('click', runSeed);
