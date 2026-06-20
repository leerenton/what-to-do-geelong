'use strict';
// ── Shared business portal header ─────────────────────────────────────────────
// Renders the topbar (logo · biz switcher · plan badge) and tab nav into
// #js-dash-header on any page that includes this script.
//
// Configure before the script runs:
//   window.DASH_CONFIG = {
//     activeTab:  'promote',          // which tab is highlighted
//     bizId:      'abc123',           // pre-select this biz (falls back to localStorage)
//   }
//
// Tab clicks navigate to the correct page with ?biz= preserved.
// Biz switcher updates localStorage and reloads with the new biz.
// ─────────────────────────────────────────────────────────────────────────────

(async function initDashHeader() {
  const root = document.getElementById('js-dash-header');
  if (!root) return;

  const cfg       = window.DASH_CONFIG || {};
  const activeTab = cfg.activeTab || 'overview';

  // ── Load user's businesses ─────────────────────────────────────────────────
  let businesses = [];
  let currentBiz = null;

  try {
    const { data: { session } } = await db.auth.getSession();
    if (!session) {
      root.innerHTML = '';
      return;
    }

    const { data } = await db
      .from('businesses')
      .select('id, name, emoji, color, plan, is_gold, credit_balance, city')
      .eq('owner_id', session.user.id)
      .limit(20);

    businesses = data || [];
  } catch (_) {}

  if (!businesses.length) {
    root.innerHTML = '';
    return;
  }

  // Resolve active business — URL param → config → localStorage → first
  const urlBiz = new URLSearchParams(window.location.search).get('biz');
  const lsBiz  = localStorage.getItem('wtdg_dash_biz');
  currentBiz   = businesses.find(b => b.id === (urlBiz || cfg.bizId)) ||
                 businesses.find(b => b.id === lsBiz) ||
                 businesses[0];
  localStorage.setItem('wtdg_dash_biz', currentBiz.id);

  const isGold = !!(currentBiz.is_gold || currentBiz.plan === 'gold');

  // ── Tab definitions ────────────────────────────────────────────────────────
  // Each tab links to its own page (or business-dashboard.html?tab=X)
  const TABS = [
    { id: 'overview',   icon: 'dashboard',      label: 'Overview',   href: () => `business-dashboard.html?biz=${currentBiz.id}&tab=overview`   },
    { id: 'events',     icon: 'event',           label: 'Events',     href: () => `business-dashboard.html?biz=${currentBiz.id}&tab=events`     },
    { id: 'offers',     icon: 'local_offer',     label: 'Offers',     href: () => `business-dashboard.html?biz=${currentBiz.id}&tab=offers`     },
    { id: 'gallery',    icon: 'photo_library',   label: 'Gallery',    href: () => `business-dashboard.html?biz=${currentBiz.id}&tab=gallery`    },
    { id: 'inquiries',  icon: 'mail',            label: 'Inquiries',  href: () => `business-dashboard.html?biz=${currentBiz.id}&tab=inquiries`  },
    { id: 'promote',    icon: 'campaign',        label: 'Promote',    href: () => `promote.html?biz=${currentBiz.id}`                           },
    { id: 'settings',   icon: 'settings',        label: 'Settings',   href: () => `business-dashboard.html?biz=${currentBiz.id}&tab=settings`   },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  const planBadgeClass = isGold ? 'dash-topbar__plan dash-topbar__plan--gold' : 'dash-topbar__plan';
  const planBadgeText  = isGold ? '⭐ Gold' : 'Free';

  const switcherItems = businesses.map(b => `
    <button class="dash-switcher-menu__item${b.id === currentBiz.id ? ' dash-switcher-menu__item--active' : ''}" data-biz="${b.id}">
      ${b.emoji || '🏪'} ${b.name}
      ${b.id === currentBiz.id ? '<span class="material-symbols-rounded" style="margin-left:auto;font-size:1rem;color:var(--teal)">check</span>' : ''}
    </button>`).join('') + `
    <div class="dash-switcher-menu__divider"></div>
    <a href="onboard.html?path=business" class="dash-switcher-menu__item dash-switcher-menu__add">
      <span class="material-symbols-rounded" style="font-size:1rem">add</span> Add a listing
    </a>`;

  const tabsHtml = TABS.map(t => {
    const isActive = t.id === activeTab;
    // On business-dashboard.html the tabs that point there switch inline;
    // the Promote tab (and any external page tab) navigates.
    const isDashboardTab = t.href().startsWith('business-dashboard');
    return `<a class="dash-tab${isActive ? ' active' : ''}"
               href="${t.href()}"
               data-tab="${t.id}"
               ${isDashboardTab && !isActive ? '' : ''}
             ><span class="material-symbols-rounded">${t.icon}</span> ${t.label}</a>`;
  }).join('');

  root.innerHTML = `
    <div class="dash-topbar">
      <a href="index.html" class="dash-topbar__logo"><img src="/assets/logo.jpg" alt="WTDG" /></a>
      <span class="dash-topbar__sep">/</span>
      <div style="position:relative">
        <button class="dash-biz-switcher" id="js-dh-switcher">
          <span class="dash-biz-switcher__emoji">${currentBiz.emoji || '🏪'}</span>
          <span class="dash-biz-switcher__name">${currentBiz.name}</span>
          <span class="material-symbols-rounded dash-biz-switcher__chevron">expand_more</span>
        </button>
        <div class="dash-switcher-menu" id="js-dh-switcher-menu">${switcherItems}</div>
      </div>
      <span class="${planBadgeClass}" id="js-dh-plan-badge">${planBadgeText}</span>
    </div>
    <div class="dash-tabs" id="js-dh-tabs">${tabsHtml}</div>
  `;

  // ── Biz switcher toggle ────────────────────────────────────────────────────
  const menu = document.getElementById('js-dh-switcher-menu');
  document.getElementById('js-dh-switcher').addEventListener('click', e => {
    e.stopPropagation();
    menu.classList.toggle('open');
  });
  document.addEventListener('click', () => menu.classList.remove('open'));

  menu.querySelectorAll('[data-biz]').forEach(btn => {
    btn.addEventListener('click', () => {
      localStorage.setItem('wtdg_dash_biz', btn.dataset.biz);
      // Navigate to same page with new biz param
      const url = new URL(window.location.href);
      url.searchParams.set('biz', btn.dataset.biz);
      window.location.href = url.toString();
    });
  });

  // ── Tab clicks on business-dashboard.html — switch panel inline ────────────
  // On other pages, tabs are plain <a> links so navigation is automatic.
  if (window.location.pathname.includes('business-dashboard')) {
    document.querySelectorAll('#js-dh-tabs .dash-tab').forEach(tab => {
      if (!tab.dataset.tab || tab.dataset.tab === 'promote') return;
      tab.addEventListener('click', e => {
        e.preventDefault();
        if (typeof window.switchTab === 'function') window.switchTab(tab.dataset.tab);
        document.querySelectorAll('#js-dh-tabs .dash-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
      });
    });
  }

  // Expose current biz so business-dashboard.js can still read it
  window.DASH_CURRENT_BIZ_ID = currentBiz.id;
})();
