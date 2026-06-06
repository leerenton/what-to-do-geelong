'use strict';

/* ── WTDG ICON SET ───────────────────────────────────────────
   Outlined · Friendly · On Brand
   Each icon returns an SVG string at 24×24 viewBox.
   Usage: wtdgIcon('calendar')  or  wtdgIcon('calendar', 20, '#2ab4a0')
─────────────────────────────────────────────────────────────── */

const _icons = {
  // ── CATEGORIES ──────────────────────────────────────────
  markets: `<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path d="M9 22V12h6v10"/>`,

  music: `<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>`,

  'food-drink': `<path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>`,

  arts: `<circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 000 20c1.1 0 2-.9 2-2v-.5c0-.8.7-1.5 1.5-1.5H17a2 2 0 002-2 7 7 0 00-7-7"/><circle cx="8.5" cy="10.5" r="1.5" fill="currentColor"/><circle cx="15.5" cy="9" r="1.5" fill="currentColor"/>`,

  outdoors: `<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>`,

  family: `<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>`,

  events: `<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M12 14l1.5 1.5L16 13" stroke-linecap="round" stroke-linejoin="round"/>`,

  community: `<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>`,

  workshops: `<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>`,

  pets: `<path d="M11 4.5C11 5.88 9.88 7 8.5 7S6 5.88 6 4.5 7.12 2 8.5 2 11 3.12 11 4.5z" fill="currentColor" stroke="none"/><path d="M18 4.5C18 5.88 16.88 7 15.5 7S13 5.88 13 4.5 14.12 2 15.5 2 18 3.12 18 4.5z" fill="currentColor" stroke="none"/><path d="M5.5 10C5.5 11.38 4.38 12.5 3 12.5S.5 11.38.5 10 1.62 7.5 3 7.5 5.5 8.62 5.5 10z" fill="currentColor" stroke="none"/><path d="M23.5 10c0 1.38-1.12 2.5-2.5 2.5s-2.5-1.12-2.5-2.5 1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5z" fill="currentColor" stroke="none"/><path d="M12 13c-3 0-7 2-7 6s3 3 7 3 7 1 7-3-4-6-7-6z"/>`,

  // ── ACTIONS ─────────────────────────────────────────────
  guide: `<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>`,

  share: `<path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>`,

  calendar: `<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>`,

  ticket: `<path d="M15 5H3a1 1 0 00-1 1v4a2 2 0 010 4v4a1 1 0 001 1h12"/><path d="M9 5h12a1 1 0 011 1v4a2 2 0 000 4v4a1 1 0 01-1 1H9"/><line x1="9" y1="5" x2="9" y2="19" stroke-dasharray="2 2"/>`,

  map: `<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>`,

  directions: `<path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>`,

  globe: `<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>`,

  phone: `<path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.87 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012.77 1h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.91 8.7a16 16 0 006.39 6.39l1.06-1.06a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>`,

  email: `<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>`,

  more: `<circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none"/>`,

  // ── INFO & DETAILS ───────────────────────────────────────
  clock: `<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>`,

  location: `<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>`,

  price: `<path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>`,

  dollar: `<circle cx="12" cy="12" r="10"/><path d="M14.31 8a4 4 0 00-7 2c0 3 4 4 4 6a2 2 0 01-4 0m3.5-10v12"/>`,

  attendees: `<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>`,

  views: `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`,

  star: `<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>`,

  bookmark: `<path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z"/>`,

  offer: `<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>`,

  // ── INTERFACE ────────────────────────────────────────────
  back: `<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>`,

  forward: `<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>`,

  search: `<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>`,

  filter: `<line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/><circle cx="8" cy="6" r="2" fill="white"/><circle cx="16" cy="12" r="2" fill="white"/><circle cx="10" cy="18" r="2" fill="white"/>`,

  sort: `<path d="M3 6h18M6 12h12M9 18h6"/>`,

  grid: `<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>`,

  list: `<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>`,

  info: `<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="8" stroke-width="2.5" stroke-linecap="round"/><line x1="12" y1="12" x2="12" y2="16"/>`,

  check: `<polyline points="20 6 9 17 4 12"/>`,

  close: `<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>`,

  heart: `<path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>`,

  'chevron-right': `<polyline points="9 18 15 12 9 6"/>`,
  'chevron-left':  `<polyline points="15 18 9 12 15 6"/>`,
  'chevron-down':  `<polyline points="6 9 12 15 18 9"/>`,

  weekend: `<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M9 15l2 2 4-4"/>`,
};

/**
 * Returns an SVG icon element string.
 * @param {string} name - icon name
 * @param {number} size - px size (default 20)
 * @param {string} color - stroke color (default 'currentColor')
 * @param {object} opts - { fill, strokeWidth, class }
 */
function wtdgIcon(name, size = 20, color = 'currentColor', opts = {}) {
  const paths = _icons[name];
  if (!paths) return '';
  const sw = opts.strokeWidth || 1.75;
  const fill = opts.fill !== undefined ? opts.fill : 'none';
  const cls = opts.class ? ` class="${opts.class}"` : '';
  return `<svg${cls} xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
}
window.wtdgIcon = wtdgIcon;

/**
 * Returns a category icon with teal circle background.
 * @param {string} name - icon name
 * @param {number} size - icon size
 */
function wtdgCatIcon(name, size = 22) {
  return `<span class="wtdg-cat-icon">${wtdgIcon(name, size, 'var(--teal)')}</span>`;
}
window.wtdgCatIcon = wtdgCatIcon;
