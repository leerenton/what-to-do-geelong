'use strict';

// ── AUTH UTILITIES ────────────────────────────────────────
function getAccount() {
  try { return JSON.parse(localStorage.getItem('wtdg_account') || 'null'); } catch { return null; }
}
function setAccount(acct) { localStorage.setItem('wtdg_account', JSON.stringify(acct)); }

function getBusinessProfiles() {
  try { return JSON.parse(localStorage.getItem('wtdg_biz_profiles') || '[]'); } catch { return []; }
}
function setBusinessProfiles(profiles) { localStorage.setItem('wtdg_biz_profiles', JSON.stringify(profiles)); }

function getCurrentBizId() { return localStorage.getItem('wtdg_current_biz') || null; }
function setCurrentBizId(id) {
  if (id) localStorage.setItem('wtdg_current_biz', id);
  else localStorage.removeItem('wtdg_current_biz');
}

async function logout() {
  localStorage.removeItem('wtdg_account');
  localStorage.removeItem('wtdg_current_biz');
  if (typeof db !== 'undefined') await db.auth.signOut();
  window.location.href = 'index.html';
}

function genId() {
  return 'id_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function requireAuth(redirectTo) {
  if (!getAccount()) {
    window.location.href = `login.html?next=${encodeURIComponent(redirectTo || window.location.pathname)}`;
    return false;
  }
  return true;
}

// ── NAV ACCOUNT BUTTON INJECTION ──────────────────────────
async function initAccountNav() {
  // Wait for nav.js to inject the header (it may run after auth.js on some pages)
  let hamburger = document.querySelector('.nav__hamburger');
  if (!hamburger) {
    await new Promise(resolve => {
      const obs = new MutationObserver(() => {
        if (document.querySelector('.nav__hamburger')) { obs.disconnect(); resolve(); }
      });
      obs.observe(document.body, { childList: true, subtree: true });
      setTimeout(resolve, 2000); // fallback
    });
  }
  hamburger = document.querySelector('.nav__hamburger');
  if (!hamburger) return;
  // Insert account button inside nav__end (before hamburger), or fall back to before hamburger
  const navEnd = document.querySelector('.nav__end');

  // ── Impersonation override ────────────────────────────────
  // If admin is viewing as a user, show THAT user's nav identity
  let impersonatedUser = null;
  try {
    const imp = JSON.parse(sessionStorage.getItem('wtdg_admin_impersonating'));
    if (imp?.targetUser) impersonatedUser = imp.targetUser;
  } catch (_) {}

  // Use impersonated user data OR real account
  let acct = impersonatedUser
    ? { name: impersonatedUser.name || impersonatedUser.email, email: impersonatedUser.email }
    : getAccount();

  // Load businesses from Supabase if logged in (skip for impersonation — we don't have their session)
  let profiles = [];
  if (acct && !impersonatedUser && typeof db !== 'undefined') {
    try {
      const { data: { session } } = await db.auth.getSession();
      if (session) {
        const citySlug = window.SITE?.slug || 'geelong';
        const { data } = await db.from('businesses').select('id, name, emoji, color').eq('owner_id', session.user.id).eq('city', citySlug);
        profiles = data || [];
        localStorage.removeItem('wtdg_biz_profiles');
      }
    } catch (_) {}
  }

  const wrap = document.createElement('div');
  wrap.className = 'nav__account';

  if (!acct) {
    wrap.innerHTML = `<a href="login.html" class="nav__login-btn">Login</a>`;
  } else {
    const currentBizId = getCurrentBizId();
    const currentBiz = profiles.find(b => b.id === currentBizId);
    const firstName = (acct.name || 'Account').split(' ')[0];
    const initials = (acct.name || 'A').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    const contextLabel = currentBiz ? currentBiz.name : firstName;

    wrap.innerHTML = `
      <div class="nav__acct-wrap">
        <button class="nav__acct-btn" id="js-acct-btn" aria-expanded="false">
          <span class="nav__acct-avatar">${initials}</span>
          <span class="nav__acct-name">${contextLabel}</span>
          <span class="material-symbols-rounded nav__acct-chevron">expand_more</span>
        </button>
        <div class="nav__acct-menu" id="js-acct-menu" hidden>
          <div class="nav__acct-header">
            <div class="nav__acct-avatar nav__acct-avatar--lg">${initials}</div>
            <div>
              <div class="nav__acct-fullname">${acct.name || ''}</div>
              <div class="nav__acct-email">${acct.email}</div>
            </div>
          </div>
          <div class="nav__acct-divider"></div>
          <a href="account.html" class="nav__acct-item"><span class="material-symbols-rounded">person</span> My Account</a>
          <a href="guides.html" class="nav__acct-item"><span class="material-symbols-rounded">star</span> My WTDGuides</a>
          <a href="onboarding.html" class="nav__acct-item"><span class="material-symbols-rounded">tune</span> Personalise my feed</a>
          ${['lee.renton81@gmail.com', 'adele@whattodogeelong.com.au'].includes(acct.email) ? `
            <div class="nav__acct-divider"></div>
            <a href="wtdgadmin-dash.html" class="nav__acct-item" style="color:var(--teal);font-weight:600">
              <span class="material-symbols-rounded">admin_panel_settings</span> Admin Panel
            </a>` : ''}
          ${profiles.length ? `
            <div class="nav__acct-divider"></div>
            <div class="nav__acct-section-label">My Businesses</div>
            ${profiles.map(b => `
              <button class="nav__acct-item nav__acct-biz-btn${b.id === currentBizId ? ' nav__acct-biz-btn--active' : ''}" data-biz="${b.id}">
                <span class="material-symbols-rounded">store</span>
                <span>${b.name}</span>
                ${b.id === currentBizId ? '<span class="material-symbols-rounded" style="margin-left:auto;color:var(--teal);font-size:1.1rem">check_circle</span>' : ''}
              </button>
            `).join('')}
          ` : ''}
          <div class="nav__acct-divider"></div>
          <a href="business-signup.html" class="nav__acct-item">
            <span class="material-symbols-rounded">add_business</span>
            ${profiles.length ? 'Add a business' : 'List your business'}
          </a>
          <button class="nav__acct-item nav__acct-logout" id="js-acct-logout">
            <span class="material-symbols-rounded">logout</span> Log out
          </button>
        </div>
      </div>
    `;
  }

  // Insert inside nav__end before the hamburger so all right icons are grouped
  if (navEnd) navEnd.insertBefore(wrap, hamburger);
  else hamburger.insertAdjacentElement('beforebegin', wrap);

  // Dropdown toggle
  const btn  = document.getElementById('js-acct-btn');
  const menu = document.getElementById('js-acct-menu');
  const chev = wrap.querySelector('.nav__acct-chevron');

  btn?.addEventListener('click', e => {
    e.stopPropagation();
    const open = menu.hidden;
    menu.hidden = !open;
    btn.setAttribute('aria-expanded', open);
    if (chev) chev.style.transform = open ? 'rotate(180deg)' : '';
  });

  document.addEventListener('click', () => {
    if (menu) menu.hidden = true;
    if (chev) chev.style.transform = '';
  });

  // Business switcher
  wrap.querySelectorAll('.nav__acct-biz-btn').forEach(b => {
    b.addEventListener('click', e => {
      e.stopPropagation();
      setCurrentBizId(b.dataset.biz);
      window.location.href = 'business-dashboard.html';
    });
  });

  // Logout
  document.getElementById('js-acct-logout')?.addEventListener('click', logout);
}

document.addEventListener('DOMContentLoaded', initAccountNav);

// ── ADMIN IMPERSONATION BANNER ────────────────────────────────
// Shows a persistent banner on public pages when admin is viewing as a user.
document.addEventListener('DOMContentLoaded', () => {
  try {
    const imp = JSON.parse(sessionStorage.getItem('wtdg_admin_impersonating'));
    if (!imp) return;

    document.body.style.paddingBottom = '56px';

    const bar = document.createElement('div');
    bar.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:99999;background:#7c3aed;color:#fff;display:flex;align-items:center;justify-content:space-between;padding:.6rem 1.25rem;font-size:.82rem;font-weight:600;font-family:inherit;box-shadow:0 -4px 24px rgba(124,58,237,.4)';
    bar.innerHTML = `
      <div style="display:flex;align-items:center;gap:.6rem">
        <span style="background:rgba(255,255,255,.2);border-radius:.35rem;padding:.15rem .5rem;font-size:.7rem;font-weight:800;letter-spacing:.06em">ADMIN MODE</span>
        Viewing as <strong style="margin-left:.3rem">${imp.targetUser.name || imp.targetUser.email}</strong>
        <span style="opacity:.7;font-size:.75rem">(${imp.targetUser.email || ''})</span>
      </div>
      <button id="js-adm-exit-imp" style="background:rgba(255,255,255,.2);border:none;color:#fff;border-radius:.4rem;padding:.3rem .85rem;font-size:.78rem;font-weight:700;cursor:pointer;font-family:inherit">Exit &amp; Return to Admin</button>`;
    document.body.appendChild(bar);

    document.getElementById('js-adm-exit-imp')?.addEventListener('click', () => {
      sessionStorage.removeItem('wtdg_admin_impersonating');
      window.location.href = 'wtdgadmin-users.html';
    });
  } catch (_) {}
});
