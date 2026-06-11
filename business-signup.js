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
let claimSearchTimer;
let claimSearchCache = []; // businesses fetched from Supabase

document.getElementById('js-claim-search').addEventListener('input', function () {
  const q = this.value.toLowerCase().trim();
  const results = document.getElementById('js-claim-results');
  if (!q) { results.innerHTML = ''; return; }

  results.innerHTML = '<p style="color:var(--mid);font-size:.85rem;padding:.5rem 0">Searching…</p>';

  clearTimeout(claimSearchTimer);
  claimSearchTimer = setTimeout(async () => {
    // Search Supabase first (unclaimed businesses only)
    let supabaseMatches = [];
    try {
      const { data } = await db.from('businesses')
        .select('id, name, type, suburb, emoji, color, location, website, description, owner_id, is_claimed')
        .or(`name.ilike.%${q}%,suburb.ilike.%${q}%`)
        .is('owner_id', null)
        .limit(10);
      supabaseMatches = data || [];
    } catch (_) {}

    // Also search local BUSINESSES array (unclaimed = no owner_id)
    const localMatches = (typeof BUSINESSES !== 'undefined' ? BUSINESSES : []).filter(b =>
      (b.name.toLowerCase().includes(q) || b.suburb?.toLowerCase().includes(q))
    );

    // Merge — Supabase takes priority, add local ones not already in results
    const supabaseIds = new Set(supabaseMatches.map(b => b.id));
    const merged = [
      ...supabaseMatches,
      ...localMatches.filter(b => !supabaseIds.has(b.id))
    ];

    claimSearchCache = merged;

    results.innerHTML = merged.length
      ? merged.map(b => `
          <button class="bsign-result-item" data-id="${b.id}">
            <span class="bsign-result-item__emoji">${b.emoji || '🏪'}</span>
            <div>
              <div class="bsign-result-item__name">${b.name}</div>
              <div class="bsign-result-item__type">${b.type || 'Business'} · ${b.suburb || ''}</div>
            </div>
          </button>`).join('')
      : '<p style="color:var(--mid);font-size:.85rem;padding:.5rem 0">No unclaimed listings found. Try creating a new listing instead.</p>';

    results.querySelectorAll('.bsign-result-item').forEach(btn => {
      btn.addEventListener('click', () => {
        results.querySelectorAll('.bsign-result-item').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        bsState.claimedBiz = claimSearchCache.find(b => b.id === btn.dataset.id)
          || (typeof BUSINESSES !== 'undefined' ? BUSINESSES : []).find(b => b.id === btn.dataset.id);
        document.getElementById('js-s1b-next').disabled = false;
      });
    });
  }, 350);
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

// ── Google Places Autocomplete ────────────────────────────
function initPlacesAutocomplete() {
  const input = document.getElementById('bd-address');
  if (!input || !window.google?.maps?.places) return;

  const ac = new google.maps.places.Autocomplete(input, {
    componentRestrictions: { country: 'au' },
    fields: ['formatted_address', 'geometry', 'address_components'],
    types: ['establishment', 'geocode'],
  });

  ac.addListener('place_changed', () => {
    const place = ac.getPlace();
    if (!place.geometry) return;

    // Store lat/lng in hidden fields
    document.getElementById('bd-lat').value = place.geometry.location.lat();
    document.getElementById('bd-lng').value = place.geometry.location.lng();

    // Auto-populate suburb from address components
    const suburbEl = document.getElementById('bd-suburb');
    const locality = place.address_components?.find(c => c.types.includes('locality'))
                  || place.address_components?.find(c => c.types.includes('sublocality'));
    if (locality) suburbEl.value = locality.long_name;

    // Use the formatted address as the display value
    input.value = place.formatted_address || input.value;
  });
}
window.initPlacesAutocomplete = initPlacesAutocomplete;

document.getElementById('js-s2-next').addEventListener('click', () => {
  const name = document.getElementById('bd-name').value.trim();
  const desc = document.getElementById('bd-desc').value.trim();
  if (!name || !desc) {
    alert('Please fill in your business name and description.');
    return;
  }
  bsState.details = {
    name,
    suburb:  document.getElementById('bd-suburb').value.trim(),
    address: document.getElementById('bd-address').value.trim(),
    lat:     parseFloat(document.getElementById('bd-lat').value) || null,
    lng:     parseFloat(document.getElementById('bd-lng').value) || null,
    phone:   document.getElementById('bd-phone').value.trim(),
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
  const errEl = document.getElementById('js-s4-error');
  btn.disabled = true;
  btn.textContent = 'Saving…';
  if (errEl) errEl.style.display = 'none';

  // Get session with timeout to avoid hanging on stale tokens
  let userId = null;
  try {
    const timeout = new Promise(r => setTimeout(() => r(null), 3000));
    const session = await Promise.race([
      db.auth.getSession().then(r => r.data?.session ?? null),
      timeout,
    ]);
    userId = session?.user?.id || null;
  } catch (_) {}

  if (!userId) {
    const msg = 'You need to be logged in to claim or create a business. Please log in first.';
    if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }
    else alert(msg);
    btn.disabled = false;
    btn.textContent = 'Submit';
    return;
  }

  let bizId, error;

  if (bsState.mode === 'claim' && bsState.claimedBiz) {
    // Claim an existing business — update owner_id
    bizId = bsState.claimedBiz.id;
    const { error: upErr } = await db.from('businesses').update({
      owner_id:    userId,
      is_claimed:  true,
      status:      'pending',
      plan:         bsState.plan,
      name:         bsState.details.name,
      suburb:       bsState.details.suburb,
      location:     bsState.details.address,
      lat:          bsState.details.lat,
      lng:          bsState.details.lng,
      website:      bsState.details.website,
      description:  bsState.details.description,
      type:         bsState.type || bsState.claimedBiz.type,
      claim_notes:  bsState.details.claimNotes || null,
    }).eq('id', bizId);
    error = upErr;
  } else {
    // Create a new business
    bizId = 'biz-' + Date.now().toString(36);
    const { error: insErr } = await db.from('businesses').insert({
      id:          bizId,
      owner_id:    userId,
      is_claimed:  true,
      status:      'pending',
      plan:        bsState.plan,
      name:        bsState.details.name,
      type:        bsState.type || 'Business',
      suburb:      bsState.details.suburb,
      location:    bsState.details.address,
      lat:         bsState.details.lat,
      lng:         bsState.details.lng,
      website:     bsState.details.website,
      description: bsState.details.description,
      emoji:       '🏪',
      color:       '#4ac8d0',
      section:     'eat',
    });
    error = insErr;
  }

  if (error) {
    const msg = error.code === '42501'
      ? 'Permission denied — the business may already be claimed by another user. Contact us if you believe this is an error.'
      : 'Could not save: ' + error.message;
    if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }
    else alert(msg);
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
  try {
    const timeout = new Promise(r => setTimeout(() => r(null), 3000));
    const session = await Promise.race([
      db.auth.getSession().then(r => r.data?.session ?? null),
      timeout,
    ]);
    if (!session) {
      window.location.href = 'login.html?next=business-signup.html';
    }
  } catch (_) {
    window.location.href = 'login.html?next=business-signup.html';
  }
});
