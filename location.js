'use strict';
/* ── WTDG Location & Distance helper ──────────────────────────────
   - Haversine distance calculation
   - Geolocation request with localStorage caching
   - Distance badges on collection cards
   - Location pill in nav (mobile)
   ──────────────────────────────────────────────────────────────── */

const LOC_KEY = 'wtdg_user_location';
const LOC_TTL = 30 * 60 * 1000; // 30 min

// ── MATH ──────────────────────────────────────────────────
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
    * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDist(km) {
  if (km < 0.1)  return 'Here';
  if (km < 1)    return Math.round(km * 1000) + 'm';
  if (km < 10)   return km.toFixed(1) + 'km';
  return Math.round(km) + 'km';
}

// Walking ~4.5 km/h; driving ~25 km/h in urban
function travelMins(km, mode = 'walk') {
  const speed = mode === 'drive' ? 25 : 4.5;
  return Math.round((km / speed) * 60);
}

function formatTravelTime(mins) {
  if (mins < 2)  return '< 1 min walk';
  if (mins < 60) return `${mins} min walk`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m walk`;
}

// ── STORAGE ───────────────────────────────────────────────
function getUserLocation() {
  try {
    const raw = localStorage.getItem(LOC_KEY);
    if (!raw) return null;
    const loc = JSON.parse(raw);
    if (Date.now() - loc.ts > LOC_TTL) { localStorage.removeItem(LOC_KEY); return null; }
    return loc;
  } catch { return null; }
}

function setUserLocation(lat, lng, label) {
  localStorage.setItem(LOC_KEY, JSON.stringify({ lat, lng, label: label || 'Your location', ts: Date.now() }));
}

function clearUserLocation() {
  localStorage.removeItem(LOC_KEY);
}

// ── REQUEST ───────────────────────────────────────────────
function requestUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('Geolocation not supported')); return; }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserLocation(lat, lng, 'Current location');
        resolve({ lat, lng });
      },
      err => reject(err),
      { timeout: 8000, enableHighAccuracy: true }
    );
  });
}

// ── DISTANCE FROM USER TO A POINT ────────────────────────
function distFromUser(lat, lng) {
  const loc = getUserLocation();
  if (!loc || !lat || !lng) return null;
  return haversineKm(loc.lat, loc.lng, lat, lng);
}

// ── LOCATION BUTTON (injected into collection pages) ─────
function injectLocationButton(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const loc = getUserLocation();
  const btn = document.createElement('button');
  btn.className = 'loc-btn' + (loc ? ' loc-btn--set' : '');
  btn.id = 'js-loc-btn';
  btn.innerHTML = loc
    ? `<span class="material-symbols-rounded">my_location</span> ${loc.label} <span class="loc-btn__clear">✕</span>`
    : `<span class="material-symbols-rounded">location_searching</span> Near me`;
  container.appendChild(btn);

  btn.addEventListener('click', async e => {
    // Clear if clicking X
    if (e.target.classList.contains('loc-btn__clear')) {
      clearUserLocation();
      btn.className = 'loc-btn';
      btn.innerHTML = `<span class="material-symbols-rounded">location_searching</span> Near me`;
      refreshDistanceBadges();
      return;
    }
    if (getUserLocation()) return; // already set

    btn.innerHTML = `<span class="material-symbols-rounded">sync</span> Locating…`;
    btn.disabled = true;

    try {
      const { lat, lng } = await requestUserLocation();
      btn.className = 'loc-btn loc-btn--set';
      btn.disabled = false;
      btn.innerHTML = `<span class="material-symbols-rounded">my_location</span> Current location <span class="loc-btn__clear">✕</span>`;
      refreshDistanceBadges();
    } catch (err) {
      btn.disabled = false;
      btn.innerHTML = `<span class="material-symbols-rounded">location_off</span> Location unavailable`;
      setTimeout(() => {
        btn.innerHTML = `<span class="material-symbols-rounded">location_searching</span> Near me`;
      }, 3000);
    }
  });
}

// ── BADGE REFRESH ─────────────────────────────────────────
// Call this after cards are rendered or location changes
function refreshDistanceBadges() {
  const loc = getUserLocation();
  document.querySelectorAll('[data-lat]').forEach(el => {
    const lat = parseFloat(el.dataset.lat);
    const lng = parseFloat(el.dataset.lng);
    let badge = el.querySelector('.dist-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'dist-badge';
      el.appendChild(badge);
    }
    if (!loc || !lat || !lng) { badge.style.display = 'none'; return; }
    const km = haversineKm(loc.lat, loc.lng, lat, lng);
    badge.textContent = formatDist(km);
    badge.style.display = '';
  });
}

// Expose on window
window.wtdgLocation = {
  haversineKm,
  formatDist,
  travelMins,
  formatTravelTime,
  getUserLocation,
  setUserLocation,
  clearUserLocation,
  requestUserLocation,
  distFromUser,
  injectLocationButton,
  refreshDistanceBadges,
};
