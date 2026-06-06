'use strict';

// ── STATE ─────────────────────────────────────────────────
const bsState = {
  mode: null,
  claimedBiz: null,
  type: null,
  plan: 'featured',
  details: {},
};

const SCREENS = ['bs-s1', 'bs-s1b', 'bs-s2', 'bs-s3', 'bs-s4', 'bs-s5'];
const PROGRESS = { 'bs-s1': 20, 'bs-s1b': 20, 'bs-s2': 40, 'bs-s3': 60, 'bs-s4': 80, 'bs-s5': 100 };

function bsignGoto(id) {
  SCREENS.forEach(s => {
    document.getElementById(s)?.classList.toggle('active', s === id);
  });
  document.getElementById('js-bsign-progress').style.width = (PROGRESS[id] || 20) + '%';
  document.getElementById('js-bsign-back').style.display = id === 'bs-s1' ? 'none' : 'flex';
  window.scrollTo(0, 0);
}

// ── SCREEN 1: Claim or Create ─────────────────────────────
document.querySelectorAll('.bsign-choice').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.bsign-choice').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    bsState.mode = btn.dataset.value;
    document.getElementById('js-s1-next').disabled = false;
  });
});

document.getElementById('js-s1-next').addEventListener('click', () => {
  bsignGoto(bsState.mode === 'claim' ? 'bs-s1b' : 'bs-s2');
});

// ── SCREEN 1b: Claim search ───────────────────────────────
document.getElementById('js-claim-search').addEventListener('input', function () {
  const q = this.value.toLowerCase().trim();
  const results = document.getElementById('js-claim-results');
  if (!q) { results.innerHTML = ''; return; }

  const matches = (typeof BUSINESSES !== 'undefined' ? BUSINESSES : []).filter(b =>
    b.name.toLowerCase().includes(q) || b.suburb?.toLowerCase().includes(q)
  );

  results.innerHTML = matches.length
    ? matches.map(b => `
        <button class="bsign-result-item" data-id="${b.id}">
          <span class="bsign-result-item__emoji">${b.emoji}</span>
          <div>
            <div class="bsign-result-item__name">${b.name}</div>
            <div class="bsign-result-item__type">${b.type} · ${b.suburb}</div>
          </div>
        </button>
      `).join('')
    : '<p style="color:var(--mid);font-size:.85rem;padding:.5rem 0">No matches found. Try creating a new listing instead.</p>';

  results.querySelectorAll('.bsign-result-item').forEach(btn => {
    btn.addEventListener('click', () => {
      results.querySelectorAll('.bsign-result-item').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      bsState.claimedBiz = BUSINESSES.find(b => b.id === btn.dataset.id);
      document.getElementById('js-s1b-next').disabled = false;
    });
  });
});

document.getElementById('js-s1b-next').addEventListener('click', () => {
  if (bsState.claimedBiz) {
    document.getElementById('bd-name').value    = bsState.claimedBiz.name || '';
    document.getElementById('bd-suburb').value  = bsState.claimedBiz.suburb || '';
    document.getElementById('bd-address').value = bsState.claimedBiz.location || '';
    document.getElementById('bd-website').value = bsState.claimedBiz.website || '';
    document.getElementById('bd-desc').value    = bsState.claimedBiz.description || '';
    bsState.type = bsState.claimedBiz.type;
    document.querySelectorAll('.bsign-type-chip').forEach(c => {
      c.classList.toggle('selected', c.dataset.value === bsState.claimedBiz.type);
    });
  }
  bsignGoto('bs-s2');
});

// ── SCREEN 2: Type chips + details ───────────────────────
document.querySelectorAll('.bsign-type-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.bsign-type-chip').forEach(c => c.classList.remove('selected'));
    chip.classList.add('selected');
    bsState.type = chip.dataset.value;
  });
});

document.getElementById('js-s2-next').addEventListener('click', () => {
  const name = document.getElementById('bd-name').value.trim();
  const suburb = document.getElementById('bd-suburb').value.trim();
  const desc = document.getElementById('bd-desc').value.trim();
  if (!name || !suburb || !desc) {
    alert('Please fill in business name, suburb, and description.');
    return;
  }
  bsState.details = {
    name,
    suburb,
    address: document.getElementById('bd-address').value.trim(),
    phone: document.getElementById('bd-phone').value.trim(),
    website: document.getElementById('bd-website').value.trim(),
    description: desc,
  };
  bsignGoto('bs-s3');
});

// ── SCREEN 3: Plan ────────────────────────────────────────
document.querySelectorAll('.bsign-plan').forEach(plan => {
  plan.addEventListener('click', () => {
    document.querySelectorAll('.bsign-plan').forEach(p => p.classList.remove('selected'));
    plan.classList.add('selected');
    bsState.plan = plan.dataset.plan;
  });
});

document.getElementById('js-s3-next').addEventListener('click', () => {
  const acct = getAccount();
  if (acct) {
    document.getElementById('bc-name').value  = acct.name || '';
    document.getElementById('bc-email').value = acct.email || '';
  }
  bsignGoto('bs-s4');
});

// ── SCREEN 4: Submit ──────────────────────────────────────
document.getElementById('js-s4-next').addEventListener('click', async () => {
  const contactName  = document.getElementById('bc-name').value.trim();
  const contactEmail = document.getElementById('bc-email').value.trim();
  if (!contactName || !contactEmail) {
    alert('Please enter your name and email.');
    return;
  }

  const btn = document.getElementById('js-s4-next');
  btn.disabled = true;
  btn.textContent = 'Saving…';

  const { data: { session } } = await db.auth.getSession();
  const userId = session?.user?.id || null;

  let bizId, error;

  if (bsState.mode === 'claim' && bsState.claimedBiz) {
    // Claim an existing business — update owner_id
    bizId = bsState.claimedBiz.id;
    const { error: upErr } = await db.from('businesses').update({
      owner_id: userId,
      claimed: true,
      plan: bsState.plan,
      name: bsState.details.name,
      suburb: bsState.details.suburb,
      location: bsState.details.address,
      website: bsState.details.website,
      description: bsState.details.description,
      type: bsState.type || bsState.claimedBiz.type,
    }).eq('id', bizId);
    error = upErr;
  } else {
    // Create a new business
    bizId = 'biz-' + Date.now().toString(36);
    const { error: insErr } = await db.from('businesses').insert({
      id: bizId,
      owner_id: userId,
      claimed: false,
      plan: bsState.plan,
      name: bsState.details.name,
      type: bsState.type || 'Business',
      suburb: bsState.details.suburb,
      location: bsState.details.address,
      website: bsState.details.website,
      description: bsState.details.description,
      emoji: '🏪',
      color: '#4ac8d0',
      section: 'eat',
    });
    error = insErr;
  }

  if (error) {
    alert('Could not save your business: ' + error.message);
    btn.disabled = false;
    btn.textContent = 'Submit';
    return;
  }

  setCurrentBizId(bizId);

  document.getElementById('js-bsign-done-sub').textContent =
    `${bsState.details.name} is now live on What To Do Geelong${bsState.plan === 'featured' ? ' as a Featured listing' : ''}. Head to your dashboard to add events, offers, and photos.`;

  bsignGoto('bs-s5');
});

// ── BACK BUTTON ───────────────────────────────────────────
document.getElementById('js-bsign-back').addEventListener('click', () => {
  const current = SCREENS.find(s => document.getElementById(s)?.classList.contains('active'));
  const idx = SCREENS.indexOf(current);
  if (idx > 0) {
    const prev = current === 'bs-s2' && bsState.mode === 'claim' ? 'bs-s1b' : SCREENS[idx - 1];
    bsignGoto(prev);
  }
});

// ── INIT ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await db.auth.getSession();
  if (!session) {
    window.location.href = 'signup.html?next=business-signup.html';
  }
});
