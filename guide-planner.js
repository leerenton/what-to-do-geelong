'use strict';
/* ── Guide Planner v3 ────────────────────────────────────────────
   Day-by-day itinerary with:
   - Stops grouped by planned_date, undated in "Unscheduled"
   - "Any day" mode — no date pickers, all stops in one section
   - Date picker per stop (updates Supabase + re-renders planner)
   - Dwell time per stop (editable, defaults by venue type)
   - Walking time + distance between consecutive stops on same day
   - Per-day summary pills (no redundant grand total header)
   - Full map with all pins + dashed route lines per day (Leaflet)
   ──────────────────────────────────────────────────────────────── */

// ── DWELL DEFAULTS (minutes by venue type) ────────────────
const DWELL = {
  'Café': 45, 'Café & Kiosk': 30, 'Coffee': 30,
  'Restaurant': 90, 'Bar & Restaurant': 90, 'Seafood': 90,
  'Pub': 60, 'Bar': 60,
  'Market': 60, 'Markets': 60,
  'Gallery': 60, 'Museum': 75,
  'Arts & Culture': 90, 'Theatre': 120,
  'Music': 120, 'Festival': 180, 'Concert': 150,
  'Food & Drink': 60, 'Sport': 90, 'Activity': 60,
  'Tour': 90, 'Waterfront': 45,
  'Hotel': 0, 'Apartment Hotel': 0, 'Holiday House': 0, 'Motel': 0,
  'Retail / Shop': 40,
};
const DEFAULT_DWELL = 60;

function dwellDefault(item) {
  const d = item.item_data || {};
  const t = d.type || d.category || '';
  return DWELL[t] ?? DEFAULT_DWELL;
}

// ── HAVERSINE ─────────────────────────────────────────────
function hav(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
    * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── FORMAT ────────────────────────────────────────────────
function fmtMins(m) {
  if (m === 0) return '0m';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h}h ${r}m` : `${h}h`;
}
function fmtDist(km) {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}
function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-AU', {
    weekday: 'long', day: 'numeric', month: 'long'
  });
}

// ── COORD ENRICHMENT ──────────────────────────────────────
// Fallback: look up coords from global data arrays if item_data is missing them.
// (Supabase coord fetch now happens in guide-page.js before planner init.)
function enrichCoords(item) {
  const d = item.item_data || {};
  if (d.lat && d.lng) return;
  const id = item.item_id || String(d.id || '');
  if (!id) return;
  const sources = [
    ...(window.BUSINESSES || []),
    ...(window.EVENTS || []),
    ...(window.STAYS || []),
  ];
  const src = sources.find(s => String(s.id) === id || s.slug === id);
  if (src?.lat) { d.lat = src.lat; d.lng = src.lng; }
}

// ── DWELL STORE ───────────────────────────────────────────
function dwellKey(guideId) { return `wtdg_dwell_${guideId}`; }
function loadDwell(guideId) {
  try { return JSON.parse(localStorage.getItem(dwellKey(guideId))) || {}; } catch { return {}; }
}
function saveDwell(guideId, map) {
  localStorage.setItem(dwellKey(guideId), JSON.stringify(map));
}

function esc(str) {
  return String(str || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── MAIN ──────────────────────────────────────────────────
function initGuidePlanner(guide, items, isOwner) {
  if (!items.length) return;

  const guideId  = guide.id;
  const isAnyday = !!guide.is_anyday;

  // Enrich all items with coords from global data arrays
  items.forEach(enrichCoords);

  // Dwell map — init defaults
  let dwellMap = loadDwell(guideId);
  items.forEach(item => {
    if (dwellMap[item.id] === undefined) dwellMap[item.id] = dwellDefault(item);
  });
  saveDwell(guideId, dwellMap);

  // ── DAY GROUPING ────────────────────────────────────────
  function groupByDay() {
    if (isAnyday) {
      // All stops in one "any day" group
      return [{ date: 'anyday', items: [...items] }];
    }
    const dated = items
      .filter(i => i.planned_date)
      .sort((a, b) => a.planned_date.localeCompare(b.planned_date));
    const undated = items.filter(i => !i.planned_date);

    const dayMap = {};
    dated.forEach(i => {
      if (!dayMap[i.planned_date]) dayMap[i.planned_date] = [];
      dayMap[i.planned_date].push(i);
    });

    const days = Object.entries(dayMap).map(([date, itms]) => ({ date, items: itms }));
    if (undated.length) days.push({ date: null, items: undated });
    return days;
  }

  // ── TRAVEL LEG BETWEEN TWO STOPS ───────────────────────
  function travelLeg(a, b) {
    const da = a.item_data || {}, db = b.item_data || {};
    if (!da.lat || !da.lng || !db.lat || !db.lng) return null;
    const km = hav(da.lat, da.lng, db.lat, db.lng);
    if (km < 0.03) return null;
    const mins = Math.max(1, Math.round((km / 4.5) * 60));
    return { km, mins };
  }

  // ── BUILD PLANNER HTML ───────────────────────────────────
  function buildPlanner() {
    const days = groupByDay();

    const daySections = days.map((day) => {
      const { date, items: dayItems } = day;
      let dayDwell = 0, dayTravel = 0;

      const stopRows = dayItems.map((item, idx) => {
        const d = item.item_data || {};
        const title = d.title || d.name || 'Stop';
        const emoji = d.emoji || '📍';
        const color = d.color || '#2ab4a0';
        const dwell = dwellMap[item.id] ?? dwellDefault(item);
        dayDwell += dwell;

        const leg = idx < dayItems.length - 1 ? travelLeg(item, dayItems[idx + 1]) : null;
        if (leg) dayTravel += leg.mins;

        const globalIdx = items.indexOf(item) + 1;

        return `
          <div class="gp-stop" data-dbid="${item.id}">
            <div class="gp-stop__num" style="background:${color}22;border:2px solid ${color};color:${color}">${globalIdx}</div>
            <div class="gp-stop__body">
              <div class="gp-stop__name">
                <span>${emoji}</span> <strong>${esc(title)}</strong>
              </div>
              ${d.location ? `<div class="gp-stop__loc">
                <span class="material-symbols-rounded" style="font-size:.8rem;vertical-align:-.15em">location_on</span>
                ${esc(d.location)}
              </div>` : ''}
              <div class="gp-stop__controls">
                <label class="gp-dwell-row" title="How long will you spend here?">
                  <span class="material-symbols-rounded">schedule</span>
                  ${isOwner ? `
                    <input type="number" class="gp-dwell-input js-dwell" min="0" max="480" step="5"
                      value="${dwell}" data-dbid="${item.id}" />
                    <span class="gp-dwell-unit">mins</span>
                  ` : `<span class="gp-dwell-val">${fmtMins(dwell)}</span>`}
                </label>
                ${isOwner && !isAnyday ? `
                  <label class="gp-date-row" title="Which day?">
                    <span class="material-symbols-rounded">calendar_today</span>
                    <input type="date" class="gp-date-input js-stop-date"
                      value="${item.planned_date || ''}" data-dbid="${item.id}" />
                  </label>
                ` : ''}
              </div>
            </div>
          </div>
          ${leg ? `
            <div class="gp-leg">
              <div class="gp-leg__line"></div>
              <div class="gp-leg__info">
                <span class="material-symbols-rounded">directions_walk</span>
                ${leg.mins} min walk · ${fmtDist(leg.km)}
              </div>
            </div>` : ''}`;
      }).join('');

      const dayTotal = dayDwell + dayTravel;

      // Header label
      let headerLabel;
      if (date === 'anyday') {
        headerLabel = `<span class="material-symbols-rounded">explore</span> Any day`;
      } else if (date) {
        headerLabel = `<span class="material-symbols-rounded">calendar_month</span> ${fmtDate(date)}`;
      } else {
        headerLabel = `<span class="material-symbols-rounded">schedule_send</span> Not yet scheduled`;
      }

      return `
        <div class="gp-day">
          <div class="gp-day__header">
            <div class="gp-day__label">${headerLabel}</div>
            <div class="gp-day__pills">
              <span class="gp-day__pill">${dayItems.length} stop${dayItems.length !== 1 ? 's' : ''}</span>
              ${dayDwell  ? `<span class="gp-day__pill">${fmtMins(dayDwell)} venues</span>` : ''}
              ${dayTravel ? `<span class="gp-day__pill gp-day__pill--walk">${fmtMins(dayTravel)} walking</span>` : ''}
              ${dayTotal  ? `<span class="gp-day__pill gp-day__pill--total">${fmtMins(dayTotal)} total</span>` : ''}
            </div>
          </div>
          <div class="gp-day__stops">${stopRows}</div>
        </div>`;
    }).join('');

    return daySections;
  }

  // ── MAP ───────────────────────────────────────────────────
  let leafletMap = null;

  function initMap() {
    const mapEl = document.getElementById('js-gp-map');
    if (!mapEl || !window.L) return;
    if (leafletMap) { leafletMap.remove(); leafletMap = null; }

    const pinItems = items.filter(i => i.item_data?.lat && i.item_data?.lng);
    if (!pinItems.length) {
      mapEl.innerHTML = `<div class="gp-map-empty">
        <span class="material-symbols-rounded">map</span>
        <p>No location data yet.<br>Newly saved guide items will appear here.</p>
      </div>`;
      return;
    }

    leafletMap = L.map(mapEl, { zoomControl: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      maxZoom: 19,
    }).addTo(leafletMap);

    const dayColors = ['#2ab4a0','#3a86ff','#e76f51','#9b5de5','#f59e0b','#52b788'];
    const bounds = [];

    // Route polylines per day (or single route for anyday)
    groupByDay().forEach((day, dIdx) => {
      const coords = day.items
        .filter(i => i.item_data?.lat)
        .map(i => [i.item_data.lat, i.item_data.lng]);
      if (coords.length > 1) {
        L.polyline(coords, {
          color: dayColors[dIdx % dayColors.length],
          weight: 3, opacity: 0.55, dashArray: '8 5',
        }).addTo(leafletMap);
      }
    });

    // Pins
    pinItems.forEach(item => {
      const d = item.item_data;
      const idx = items.indexOf(item) + 1;
      const color = d.color || '#2ab4a0';
      const icon = L.divIcon({
        className: '',
        html: `<div class="gp-map-pin" style="background:${color}">${idx}</div>`,
        iconSize: [30, 30], iconAnchor: [15, 15],
      });
      const marker = L.marker([d.lat, d.lng], { icon }).addTo(leafletMap);
      marker.bindPopup(`<strong>${d.emoji || '📍'} ${esc(d.title || d.name || '')}</strong>
        ${d.location ? `<br><small>${esc(d.location)}</small>` : ''}
        ${item.planned_date && !isAnyday ? `<br><small style="color:#2ab4a0">${fmtDate(item.planned_date)}</small>` : ''}`);
      bounds.push([d.lat, d.lng]);
    });

    bounds.length === 1
      ? leafletMap.setView(bounds[0], 15)
      : leafletMap.fitBounds(bounds, { padding: [40, 40] });
  }

  // ── BIND INPUTS ──────────────────────────────────────────
  function bindEvents() {
    const panel = document.getElementById('js-gp-panel');
    if (!panel) return;

    panel.querySelectorAll('.js-dwell').forEach(inp => {
      inp.addEventListener('change', () => {
        const id  = parseInt(inp.dataset.dbid);
        const val = Math.max(0, Math.min(480, parseInt(inp.value) || 0));
        inp.value = val;
        dwellMap[id] = val;
        saveDwell(guideId, dwellMap);
        panel.innerHTML = buildPlanner();
        bindEvents();
        if (leafletMap) { leafletMap.remove(); leafletMap = null; initMap(); }
      });
    });

    panel.querySelectorAll('.js-stop-date').forEach(inp => {
      inp.addEventListener('change', async () => {
        const id  = parseInt(inp.dataset.dbid);
        const val = inp.value || null;
        const item = items.find(i => i.id === id);
        if (item) item.planned_date = val;
        if (window.updateGuideItemDate) await updateGuideItemDate(id, val);
        panel.innerHTML = buildPlanner();
        bindEvents();
        if (leafletMap) { leafletMap.remove(); leafletMap = null; initMap(); }
      });
    });
  }

  // ── MOUNT ────────────────────────────────────────────────
  document.getElementById('js-guide-planner')?.remove();

  const container = document.createElement('div');
  container.id = 'js-guide-planner';
  container.className = 'guide-planner';

  container.innerHTML = `
    <div class="gp-header">
      <h2 class="gp-title">
        <span class="material-symbols-rounded">calendar_month</span> ${isAnyday ? 'Guide Itinerary' : 'Day Planner'}
      </h2>
      ${isOwner && !isAnyday ? `<p class="gp-hint">Set dates on each stop to organise your itinerary by day. Edit the minutes field to adjust time at each venue.</p>` : ''}
      ${isOwner && isAnyday ? `<p class="gp-hint">This is an any-day guide — stops are not tied to a specific date. Edit the minutes field to adjust time at each venue.</p>` : ''}
    </div>
    <div id="js-gp-panel">${buildPlanner()}</div>
    <div class="gp-map-section">
      <div class="gp-map-header">
        <span class="material-symbols-rounded">map</span> Guide Map
      </div>
      <div id="js-gp-map" class="gp-map"></div>
    </div>`;

  const guideBody = document.querySelector('.guide-body') || document.getElementById('js-guide-root');
  guideBody?.appendChild(container);

  bindEvents();
  setTimeout(initMap, 150);
}

window.initGuidePlanner = initGuidePlanner;
