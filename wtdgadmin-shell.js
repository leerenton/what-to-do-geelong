'use strict';
/* Injects the shared admin sidebar + topbar into #js-adm-sidebar and #js-adm-topbar */

function buildAdminSidebar(adminEmail) {
  return `
    <div class="adm-sidebar__logo">
      <div>
        <span class="adm-sidebar__logo-name">WTDG</span>
        <span class="adm-sidebar__logo-badge">ADMIN</span>
      </div>
    </div>
    <nav class="adm-nav">
      <div class="adm-nav__section">Overview</div>
      <a href="wtdgadmin-dash.html" class="adm-nav__item">
        ${navIcon('grid')} Dashboard
      </a>
      <a href="wtdgadmin-revenue.html" class="adm-nav__item">
        ${navIcon('dollar')} Revenue
      </a>
      <div class="adm-nav__section">Data</div>
      <a href="wtdgadmin-users.html" class="adm-nav__item">
        ${navIcon('users')} Users
      </a>
      <a href="wtdgadmin-businesses.html" class="adm-nav__item">
        ${navIcon('business')} Businesses
      </a>
      <a href="wtdgadmin-events.html" class="adm-nav__item">
        ${navIcon('calendar')} Events
      </a>
      <a href="wtdgadmin-offers.html" class="adm-nav__item">
        ${navIcon('offer')} Offers
      </a>
      <div class="adm-nav__section">Content</div>
      <a href="wtdgadmin-content.html" class="adm-nav__item">
        ${navIcon('article')} Articles &amp; News
      </a>
      <a href="wtdgadmin-promotions.html" class="adm-nav__item">
        ${navIcon('promote')} Promotions
      </a>
      <div class="adm-nav__section">Config</div>
      <a href="wtdgadmin-settings.html" class="adm-nav__item">
        ${navIcon('settings')} Site Settings
      </a>
    </nav>
    <div class="adm-sidebar__footer">
      <div class="adm-sidebar__user">Signed in as</div>
      <div class="adm-sidebar__email">${adminEmail || ''}</div>
      <button class="adm-btn adm-btn--outline adm-btn--sm" id="js-adm-logout" style="margin-top:.75rem">Sign out</button>
    </div>`;
}

function navIcon(name) {
  const icons = {
    grid: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
    dollar: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>`,
    users: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>`,
    business: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    offer: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7" stroke-width="3"/></svg>`,
    settings: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`,
    article: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
    promote: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>`,
  };
  return icons[name] || '';
}

function initAdminShell(pageTitle) {
  // Sidebar
  const sidebarEl = document.getElementById('js-adm-sidebar');
  const session = window.wtdgAdminAuth?.getAdminSession?.() || {};
  if (sidebarEl) sidebarEl.innerHTML = buildAdminSidebar(session.email);

  // Topbar title
  const titleEl = document.getElementById('js-adm-page-title');
  if (titleEl) titleEl.textContent = pageTitle || '';

  // Logout
  const logoutBtn = document.getElementById('js-adm-logout');
  if (logoutBtn) logoutBtn.addEventListener('click', () => window.adminLogout?.());

  // Active nav
  const page = window.location.pathname.split('/').pop();
  document.querySelectorAll('.adm-nav__item').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === page);
  });
}

window.initAdminShell = initAdminShell;
