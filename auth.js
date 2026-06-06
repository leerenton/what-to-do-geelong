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
  const hamburger = document.querySelector('.nav__hamburger');
  if (!hamburger) return;

  const acct = getAccount();

  // Load businesses from Supabase if logged in
  let profiles = [];
  if (acct && typeof db !== 'undefined') {
    const { data: { session } } = await db.auth.getSession();
    if (session) {
      const { data } = await db.from('businesses').select('id, name, emoji, color').eq('owner_id', session.user.id);
      profiles = data || [];
      // Clear stale localStorage biz data
      localStorage.removeItem('wtdg_biz_profiles');
    }
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
          <a href="itinerary.html" class="nav__acct-item"><span class="material-symbols-rounded">star</span> My Itinerary</a>
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

  hamburger.insertAdjacentElement('beforebegin', wrap);

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
