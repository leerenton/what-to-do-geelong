'use strict';

// ── STATE ─────────────────────────────────────────────────
const prefs = {
  group: null,
  kids: [],
  interests: [],
  from: null,
  to: null,
  name: '',
  email: '',
};

// ── SCREEN NAVIGATION ─────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.ob-screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
  if (id === 'ob-s5') initSaveScreen();
}

// ── SCREEN 1: Group type ──────────────────────────────────
document.querySelectorAll('#js-group-grid .ob-option').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#js-group-grid .ob-option').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    prefs.group = btn.dataset.value;
    document.getElementById('js-s1-next').disabled = false;
  });
});

document.getElementById('js-s1-next').addEventListener('click', () => {
  showScreen(prefs.group === 'family' ? 'ob-s2' : 'ob-s3');
});

document.getElementById('js-s1-skip').addEventListener('click', () => {
  skipAndFinish();
});

// Screen 3 back — skip kids screen if not family
document.getElementById('js-s3-back').addEventListener('click', () => {
  showScreen(prefs.group === 'family' ? 'ob-s2' : 'ob-s1');
});

// ── SCREEN 2: Kids ages ───────────────────────────────────
document.querySelectorAll('#js-kids-chips .ob-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    chip.classList.toggle('selected');
    const val = chip.dataset.value;
    if (chip.classList.contains('selected')) {
      prefs.kids.push(val);
    } else {
      prefs.kids = prefs.kids.filter(v => v !== val);
    }
  });
});

// ── SCREEN 3: Interests ───────────────────────────────────
document.querySelectorAll('#js-interest-tags .ob-tag').forEach(tag => {
  tag.addEventListener('click', () => {
    tag.classList.toggle('selected');
    const val = tag.dataset.value;
    if (tag.classList.contains('selected')) {
      prefs.interests.push(val);
    } else {
      prefs.interests = prefs.interests.filter(v => v !== val);
    }
  });
});

// ── SCREEN 4 (save): Auth-aware ───────────────────────────
// Called when screen 5 becomes active — check login state and show correct UI
async function initSaveScreen() {
  let loggedIn = false;
  let userName = '';

  // Check Supabase session
  if (typeof db !== 'undefined') {
    try {
      const { data } = await db.auth.getSession();
      if (data?.session) {
        loggedIn = true;
        userName = data.session.user?.user_metadata?.name
          || data.session.user?.email?.split('@')[0]
          || '';
      }
    } catch (_) {}
  }

  // Fallback: check localStorage account
  if (!loggedIn) {
    try {
      const acct = JSON.parse(localStorage.getItem('wtdg_account') || 'null');
      if (acct?.email) { loggedIn = true; userName = acct.name || acct.email.split('@')[0]; }
    } catch (_) {}
  }

  if (loggedIn) {
    // Save prefs now and show confirmation
    prefs.name = userName;
    persistPrefs();
    // Update greeting
    const greeting = document.getElementById('ob-s5-greeting');
    if (greeting) greeting.textContent = userName
      ? `Hey ${userName}! Your personalised Geelong guide is ready.`
      : 'Your personalised Geelong guide is ready.';
    document.getElementById('ob-s5-loggedin').style.display = '';
    document.getElementById('ob-s5-loggedout').style.display = 'none';
  } else {
    // Persist locally so prefs survive the login redirect
    persistPrefs();
    document.getElementById('ob-s5-loggedin').style.display = 'none';
    document.getElementById('ob-s5-loggedout').style.display = '';
  }
}

function loggedInFinish() {
  buildResultScreen();
  showScreen('ob-s6');
}

// ── SCREEN 5: Save (legacy logged-out path) ───────────────
function saveAndFinish() {
  persistPrefs();
  buildResultScreen();
  showScreen('ob-s6');
}

function skipAndFinish() {
  persistPrefs();
  window.location.href = 'index.html';
}

function persistPrefs() {
  localStorage.setItem('wtdg_prefs', JSON.stringify(prefs));
  localStorage.setItem('wtdg_user', JSON.stringify({
    name: prefs.name,
    email: prefs.email,
    savedAt: new Date().toISOString(),
  }));
}

// ── RESULT SCREEN ─────────────────────────────────────────
function buildResultScreen() {
  const groupLabels = { solo: 'Solo explorer', couple: 'Couple', family: 'Family', friends: 'Group of friends' };
  const groupEmojis = { solo: '🧍', couple: '👫', family: '👨‍👩‍👧‍👦', friends: '🎉' };
  const group = prefs.group || 'explorer';

  // Header
  const header = document.getElementById('js-result-header');
  const greeting = prefs.name ? `Hey ${prefs.name}! 👋` : 'Your personalised feed';
  const headline = `Geelong, curated for your ${groupLabels[group] || 'trip'}`;
  const pills = [
    prefs.group ? `${groupEmojis[group] || '🗺️'} ${groupLabels[group]}` : null,
    ...prefs.interests.slice(0, 3).map(i => `${interestEmoji(i)} ${cap(i)}`),
  ].filter(Boolean);

  header.innerHTML = `
    <div class="ob-result-header__greeting">${greeting}</div>
    <div class="ob-result-header__headline">${headline} ✨</div>
    <div class="ob-profile-pills">
      ${pills.map(p => `<span class="ob-profile-pill">${p}</span>`).join('')}
    </div>
  `;

  // Profile card
  const profile = document.getElementById('js-result-profile');
  const displayName = prefs.name || prefs.email || 'Your profile';
  profile.innerHTML = `
    <div class="ob-result-profile__left">
      <div class="ob-result-profile__avatar">${groupEmojis[group] || '🗺️'}</div>
      <div>
        <div class="ob-result-profile__label">Saved as</div>
        <div class="ob-result-profile__name">${displayName}</div>
      </div>
    </div>
    <button class="ob-result-profile__edit" onclick="showScreen('ob-s1')">Edit</button>
  `;
}

function interestEmoji(val) {
  const map = { music:'🎵', food:'🍷', arts:'🎨', outdoors:'🌿', fitness:'🏃', family:'👶', theatre:'🎭', markets:'🛍️', pets:'🐾', free:'🍦', nightlife:'🌙', sport:'🏅' };
  return map[val] || '✨';
}

function cap(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

// ── RETURN FROM LOGIN ─────────────────────────────────────
// If user was sent to login mid-onboarding and came back, jump to save screen
if (new URLSearchParams(window.location.search).get('ob_prefs') === '1') {
  showScreen('ob-s5');
}

// ── LOAD EXISTING PREFS ───────────────────────────────────
(function loadExisting() {
  const saved = localStorage.getItem('wtdg_prefs');
  if (!saved) return;
  try {
    const p = JSON.parse(saved);
    if (p.group) {
      const btn = document.querySelector(`[data-value="${p.group}"]`);
      if (btn) { btn.classList.add('selected'); prefs.group = p.group; document.getElementById('js-s1-next').disabled = false; }
    }
    if (p.interests?.length) {
      p.interests.forEach(val => {
        const tag = document.querySelector(`#js-interest-tags [data-value="${val}"]`);
        if (tag) { tag.classList.add('selected'); prefs.interests.push(val); }
      });
    }
    if (p.name) document.getElementById('ob-name').value = p.name;
    if (p.email) document.getElementById('ob-email').value = p.email;
  } catch(e) {}
})();
