'use strict';

const GIVEAWAY_ID = 'disney-on-ice-jul-2025';

function getUser() {
  try { return JSON.parse(localStorage.getItem('wtdg_user') || '{}'); } catch { return {}; }
}

function hasEntered() {
  const entered = JSON.parse(localStorage.getItem('wtdg_entered') || '[]');
  return entered.includes(GIVEAWAY_ID);
}

function recordEntry(name, email) {
  const user = getUser();
  user.name  = name || user.name;
  user.email = email || user.email;
  localStorage.setItem('wtdg_user', JSON.stringify(user));

  const entered = JSON.parse(localStorage.getItem('wtdg_entered') || '[]');
  if (!entered.includes(GIVEAWAY_ID)) entered.push(GIVEAWAY_ID);
  localStorage.setItem('wtdg_entered', JSON.stringify(entered));
}

function showEntered() {
  document.getElementById('js-gw-known').hidden = true;
  document.getElementById('js-gw-new').hidden   = true;
  document.getElementById('js-gw-entered').hidden = false;
}

function showToast(msg) {
  const t = document.getElementById('js-gw-toast');
  t.textContent = msg;
  t.hidden = false;
  setTimeout(() => { t.hidden = true; }, 3000);
}

// ── INIT ──────────────────────────────────────────────────
(function init() {
  const user = getUser();

  if (hasEntered()) {
    showEntered();
    return;
  }

  if (user.email) {
    // Known user — show one-click panel
    document.getElementById('js-gw-new').hidden   = true;
    document.getElementById('js-gw-known').hidden = false;
    document.getElementById('js-known-email').textContent = user.email;

    document.getElementById('js-one-click-enter').addEventListener('click', () => {
      recordEntry(user.name, user.email);
      showEntered();
      // TODO: POST to Supabase entries table
    });

    document.getElementById('js-not-me').addEventListener('click', () => {
      document.getElementById('js-gw-known').hidden = true;
      document.getElementById('js-gw-new').hidden   = false;
    });
  }
  // else: new user panel is shown by default (no hidden attr in HTML)

  // New user entry
  document.getElementById('js-enter-btn').addEventListener('click', () => {
    const name  = document.getElementById('gw-name').value.trim();
    const email = document.getElementById('gw-email').value.trim();
    if (!email) {
      document.getElementById('gw-email').focus();
      document.getElementById('gw-email').style.borderColor = '#e76f51';
      return;
    }
    recordEntry(name, email);
    showEntered();
    // TODO: POST to Supabase entries table
  });
})();

// ── SHARE ─────────────────────────────────────────────────
document.getElementById('js-gw-share')?.addEventListener('click', () => {
  const url = window.location.href;
  if (navigator.share) {
    navigator.share({ title: 'Win Disney On Ice tickets — What To Do Geelong!', url });
  } else {
    navigator.clipboard.writeText(url).then(() => showToast('🔗 Link copied!'));
  }
});
