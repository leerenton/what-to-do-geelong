'use strict';
/* ── Guide Planner ────────────────────────────────────────────────
   Adds to guide.html:
   - Leaflet map with numbered pins (show/hide toggle)
   - Dwell time per item (editable, defaults by venue type)
   - Travel time between consecutive items (walking estimate)
   - Day total summary
   Requires: guide-page.js to call window.initGuidePlanner(guide, items, isOwner)
   ──────────────────────────────────────────────────────────────── */

// ── DWELL DEFAULTS (minutes) ──────────────────────────────
const DWELL_DEFAULTS = {
  'Café': 45, 'Café & Kiosk': 30,
  'Restaurant': 90, 'Bar & Restaurant': 90,
  'Pub': 60, 'Bar': 60,
  'Market': 60, 'Markets': 60,
  'Gallery': 60, 'Museum': 75,
  'Arts & Culture': 90, 'Theatre': 120,
  'Music': 120, 'Festival': 180,
  'Food & Drink': 60, 'Sport': 90,
  'Activity': 60, 'Tour': 90,
  'Hotel': 0, 'Apartment Hotel': 0, 'Holiday House': 0,
  'Retail / Shop': 40,
};

const DEFAULT_DWELL = 60; // fallback mins

function getDwellDefault(item) {
  const d = item.item_data || {};
  const type = d.type || d.category || '';
  return DWELL_DEFAULTS[type] ?? DEFAULT_DWELL;
}

// ── TIME FORMATTING ───────────────────────────────────────
function fmtMins(mins) {
  if (mins === 0) return 'Overnight';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function fmtTravel(km) {
  if (km < 0.05) return null; // same location
  const mins = Math.round((km / 4.5) * 60);
  if (mins < 1) return '< 1 min walk';
  return `${mins} min walk · ${km < 1 ? Math.round(km * 1000) + 'm' : km.toFixed(1) + 'km'}`;
}

// ── HAVERSINE ─────────────────────────────────────────────
function hav(lat1, lng1, lat2, lng2) {
  const R = 6371, dLat = (lat2-lat1)*Math.PI/180, dLng = (lng2-lng1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ── DWELL STORE (per-guide in localStorage) ───────────────
function dwellKey(guideId) { return `wtdg_dwell_${guideId}`; }

function loadDwellTimes(guideId) {
  try { return JSON.parse(localStorage.getItem(dwellKey(guideId))) || {}; } catch { return {}; }
}

function saveDwellTimes(guideId, map) {
  localStorage.setItem(dwellKey(guideId), JSON.stringify(map));
}

// ── MAIN INIT ─────────────────────────────────────────────
function initGuidePlanner(guide, items, isOwner) {
  if (!items.length) return;

  const guideId = guide.id;
  let dwellMap = loadDwellTimes(guideId);
  let mapVisible = false;
  let leafletMap = null;

  // Ensure each item has a dwell time
  items.forEach(item => {
    if (dwellMap[item.id] === undefined) {
      dwellMap[item.id] = getDwellDefault(item);
    }
  });
  saveDwellTimes(guideId, dwellMap);

  // Ordered items (dated first, then undated)
  function getOrderedItems() {
    const dated   = items.filter(i => i.planned_date).sort((a,b) => a.planned_date.localeCompare(b.planned_date));
    const undated = items.filter(i => !i.planned_date);
    return [...dated, ...undated];
  }

  // ── PLANNER PANEL ──────────────────────────────────────
  function buildPlannerPanel() {
    const ordered = getOrderedItems();
    const totalDwell = ordered.reduce((s, i) => s + (dwellMap[i.id] || 0), 0);

    // Travel times between consecutive items
    let totalTravel = 0;
    const travelLegs = [];
    for (let i = 0; i < ordered.length - 1; i++) {
      const a = ordered[i].item_data || {}, b = ordered[i+1].item_data || {};
      if (a.lat && a.lng && b.lat && b.lng) {
        const km = hav(a.lat, a.lng, b.lat, b.lng);
        const mins = Math.round((km / 4.5) * 60);
        totalTravel += mins;
        travelLegs.push({ km, mins });
      } else {
        travelLegs.push(null);
      }
    }

    const grandTotal = totalDwell + totalTravel;

    const rows = ordered.map((item, idx) => {
      const d = item.item_data || {};
      const dwell = dwellMap[item.id] ?? getDwellDefault(item);
      const travelLeg = travelLegs[idx];
      const title = d.title || d.name || 'Stop';
      const emoji = d.emoji || '📍';
      const color = d.color || '#4ac8d0';

      const travelRow = travelLeg && idx < ordered.length - 1 ? `
        <div class="gp-travel">
          <div class="gp-travel__line"></div>
          <div class="gp-travel__label">
            <span class="material-symbols-rounded">directions_walk</span>
            ${fmtTravel(travelLeg.km) || ''}
          </div>
        </div>` : '';

      return `
        <div class="gp-stop" data-dbid="${item.id}">
          <div class="gp-stop__num" style="background:${color}22;color:${color}">${idx + 1}</div>
          <div class="gp-stop__body">
            <div class="gp-stop__header">
              <span class="gp-stop__emoji">${emoji}</span>
              <div class="gp-stop__title">${title}</div>
              ${d.location ? `<div class="gp-stop__loc">${d.location}</div>` : ''}
            </div>
            <div class="gp-stop__dwell-row">
              <span class="material-symbols-rounded" style="font-size:.9rem;color:var(--mid)">schedule</span>
              ${isOwner ? `
                <input type="number" class="gp-dwell-input js-dwell-input" 
                  min="0" max="480" step="5"
                  value="${dwell}" data-dbid="${item.id}" />
                <span class="gp-dwell-unit">mins</span>
              ` : `<span class="gp-dwell-val">${fmtMins(dwell)}</span>`}
            </div>
          </div>
        </div>
        ${travelRow}`;
    }).join('');

    return `
      <div class="gp-summary">
        <div class="gp-summary__stat">
          <span class="material-symbols-rounded">place</span>
          <strong>${ordered.length}</strong> stop${ordered.length !== 1 ? 's' : ''}
        </div>
        <div class="gp-summary__stat">
          <span class="material-symbols-rounded">schedule</span>
          <strong>${fmtMins(totalDwell)}</strong> at venues
        </div>
        ${totalTravel ? `<div class="gp-summary__stat">
          <span class="material-symbols-rounded">directions_walk</span>
          <strong>${fmtMins(totalTravel)}</strong> walking
        </div>` : ''}
        <div class="gp-summary__stat gp-summary__stat--total">
          <span class="material-symbols-rounded">wb_sunny</span>
          <strong>${fmtMins(grandTotal)}</strong> total day
        </div>
      </div>
      <div class="gp-stops">${rows}</div>`;
  }

  // ── MAP ────────────────────────────────────────────────
  function initMap() {
    if (leafletMap) return;
    if (!window.L) return;

    const ordered = getOrderedItems();
    const pinItems = ordered.filter(i => i.item_data?.lat && i.item_data?.lng);
    if (!pinItems.length) return;

    const mapEl = document.getElementById('js-gp-map');
    if (!mapEl) return;

    leafletMap = L.map(mapEl, { zoomControl: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(leafletMap);

    const bounds = [];
    pinItems.forEach((item, i) => {
      const d = item.item_data;
      const idx = ordered.indexOf(item) + 1;
      const color = d.color || '#2ab4a0';
      const icon = L.divIcon({
        className: '',
        html: `<div class="gp-map-pin" style="background:${color}">${idx}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      const marker = L.marker([d.lat, d.lng], { icon }).addTo(leafletMap);
      marker.bindPopup(`<strong>${d.emoji || '📍'} ${d.title || d.name}</strong>${d.location ? '<br><small>' + d.location + '</small>' : ''}`);
      bounds.push([d.lat, d.lng]);
    });

    if (bounds.length === 1) {
      leafletMap.setView(bounds[0], 15);
    } else {
      leafletMap.fitBounds(bounds, { padding: [32, 32] });
    }
  }

  function toggleMap(show) {
    mapVisible = show;
    const mapWrap = document.getElementById('js-gp-map-wrap');
    const listWrap = document.getElementById('js-gp-list-wrap');
    const mapBtn  = document.getElementById('js-gp-map-btn');
    const listBtn = document.getElementById('js-gp-list-btn');

    if (mapWrap)  mapWrap.style.display  = show ? 'block' : 'none';
    if (listWrap) listWrap.style.display = show ? 'none'  : 'block';
    if (mapBtn)  { mapBtn.classList.toggle('active', show); }
    if (listBtn) { listBtn.classList.toggle('active', !show); }

    if (show) {
      initMap();
      // Leaflet needs a resize trigger after display:none → block
      setTimeout(() => leafletMap?.invalidateSize(), 50);
    }
  }

  // ── RENDER INTO DOM ────────────────────────────────────
  function render() {
    let container = document.getElementById('js-guide-planner');
    if (!container) {
      container = document.createElement('div');
      container.id = 'js-guide-planner';
      container.className = 'guide-planner';
      // Insert after guide-body or at end of root
      const body = document.querySelector('.guide-body') || document.getElementById('js-guide-root');
      if (body) body.appendChild(container);
    }

    const hasCoords = items.some(i => i.item_data?.lat && i.item_data?.lng);

    container.innerHTML = `
      <div class="gp-header">
        <h2 class="gp-title">
          <span class="material-symbols-rounded">map</span> Day Planner
        </h2>
        <div class="gp-view-toggle">
          <button class="gp-toggle-btn active" id="js-gp-list-btn">
            <span class="material-symbols-rounded">format_list_bulleted</span> List
          </button>
          ${hasCoords ? `<button class="gp-toggle-btn" id="js-gp-map-btn">
            <span class="material-symbols-rounded">map</span> Map
          </button>` : ''}
        </div>
      </div>

      <div id="js-gp-list-wrap">
        ${buildPlannerPanel()}
      </div>

      ${hasCoords ? `<div id="js-gp-map-wrap" style="display:none">
        <div id="js-gp-map" class="gp-map"></div>
      </div>` : ''}
    `;

    // Toggle buttons
    document.getElementById('js-gp-list-btn')?.addEventListener('click', () => toggleMap(false));
    document.getElementById('js-gp-map-btn')?.addEventListener('click',  () => toggleMap(true));

    // Dwell time inputs
    if (isOwner) {
      container.querySelectorAll('.js-dwell-input').forEach(inp => {
        inp.addEventListener('change', () => {
          const dbId = parseInt(inp.dataset.dbid);
          const val  = Math.max(0, Math.min(480, parseInt(inp.value) || 0));
          inp.value = val;
          dwellMap[dbId] = val;
          saveDwellTimes(guideId, dwellMap);
          // Re-render summary
          const listWrap = document.getElementById('js-gp-list-wrap');
          if (listWrap) listWrap.innerHTML = buildPlannerPanel();
          rebindDwellInputs();
        });
      });
    }
  }

  function rebindDwellInputs() {
    document.querySelectorAll('.js-dwell-input').forEach(inp => {
      inp.addEventListener('change', () => {
        const dbId = parseInt(inp.dataset.dbid);
        const val  = Math.max(0, Math.min(480, parseInt(inp.value) || 0));
        inp.value = val;
        dwellMap[dbId] = val;
        saveDwellTimes(guideId, dwellMap);
        const listWrap = document.getElementById('js-gp-list-wrap');
        if (listWrap) listWrap.innerHTML = buildPlannerPanel();
        rebindDwellInputs();
      });
    });
  }

  render();
}

window.initGuidePlanner = initGuidePlanner;
