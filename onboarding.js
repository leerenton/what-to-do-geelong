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

// ── SCREEN 4: Dates ───────────────────────────────────────
(function initDates() {
  const today = new Date();
  const sat = new Date(today);
  sat.setDate(today.getDate() + ((6 - today.getDay() + 7) % 7 || 7));
  const sun = new Date(sat); sun.setDate(sat.getDate() + 1);
  const nextSat = new Date(sat); nextSat.setDate(sat.getDate() + 7);
  const nextSun = new Date(nextSat); nextSun.setDate(nextSat.getDate() + 1);
  const endOfWeek = new Date(today); endOfWeek.setDate(today.getDate() + (7 - today.getDay()));

  function fmt(d) { return d.toISOString().split('T')[0]; }

  document.getElementById('js-qd-weekend').addEventListener('click', () => {
    document.getElementById('ob-from').value = fmt(sat);
    document.getElementById('ob-to').value = fmt(sun);
    document.querySelectorAll('.ob-quick-dates .ob-chip').forEach(c => c.classList.remove('selected'));
    document.getElementById('js-qd-weekend').classList.add('selected');
  });

  document.getElementById('js-qd-next').addEventListener('click', () => {
    document.getElementById('ob-from').value = fmt(nextSat);
    document.getElementById('ob-to').value = fmt(nextSun);
    document.querySelectorAll('.ob-quick-dates .ob-chip').forEach(c => c.classList.remove('selected'));
    document.getElementById('js-qd-next').classList.add('selected');
  });

  document.getElementById('js-qd-week').addEventListener('click', () => {
    document.getElementById('ob-from').value = fmt(today);
    document.getElementById('ob-to').value = fmt(endOfWeek);
    document.querySelectorAll('.ob-quick-dates .ob-chip').forEach(c => c.classList.remove('selected'));
    document.getElementById('js-qd-week').classList.add('selected');
  });
})();

// ── SCREEN 5: Save ────────────────────────────────────────
function saveAndFinish() {
  prefs.name  = document.getElementById('ob-name').value.trim();
  prefs.email = document.getElementById('ob-email').value.trim();
  prefs.from  = document.getElementById('ob-from')?.value || document.getElementById('ob-from')?.value;
  prefs.to    = document.getElementById('ob-to')?.value;

  if (!prefs.email) {
    document.getElementById('ob-email').focus();
    document.getElementById('ob-email').style.borderColor = '#e76f51';
    return;
  }

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
