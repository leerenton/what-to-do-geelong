'use strict';

function bsSlugify(str) {
  return str.toLowerCase().trim()
    .replace(/[àáâãäå]/g,'a').replace(/[èéêë]/g,'e').replace(/[ìíîï]/g,'i')
    .replace(/[òóôõö]/g,'o').replace(/[ùúûü]/g,'u').replace(/[ñ]/g,'n')
    .replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-');
}

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
    const citySlug = window.SITE?.slug || 'geelong';

    // Search Supabase first (unclaimed businesses in current city only)
    let supabaseMatches = [];
    try {
      const { data } = await db.from('businesses')
        .select('id, name, type, suburb, emoji, color, location, website, description, owner_id, is_claimed')
        .or(`name.ilike.%${q}%,suburb.ilike.%${q}%`)
        .eq('city', citySlug)
        .is('owner_id', null)
        .limit(10);
      supabaseMatches = data || [];
    } catch (_) {}

    // Also search local BUSINESSES array (unclaimed, current city only)
    const localMatches = (typeof BUSINESSES !== 'undefined' ? BUSINESSES : []).filter(b =>
      (b.name.toLowerCase().includes(q) || b.suburb?.toLowerCase().includes(q)) &&
      (b.city || 'geelong') === citySlug
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
// ── SCREEN 3: Plan selection + billing toggle ─────────────
let _billing = 'annual'; // 'annual' | 'monthly'

const BILLING_CONFIG = {
  annual:  { display: '$20.75', per: '/ mo', note: 'Billed $249/yr · cancel anytime',  stripeType: 'gold_annual' },
  monthly: { display: '$25',    per: '/ mo', note: 'Billed monthly · cancel anytime',  stripeType: 'gold_monthly' },
};

function updateGoldPrice() {
  const cfg = BILLING_CONFIG[_billing];
  const priceEl = document.getElementById('js-gold-price');
  const noteEl  = document.getElementById('js-gold-note');
  if (priceEl) priceEl.innerHTML = `${cfg.display} <span>${cfg.per}</span>`;
  if (noteEl)  noteEl.textContent = cfg.note;
}

document.getElementById('js-billing-toggle')?.addEventListener('click', e => {
  const btn = e.target.closest('.bsign-billing-btn');
  if (!btn) return;
  _billing = btn.dataset.billing;
  document.querySelectorAll('.bsign-billing-btn').forEach(b => b.classList.toggle('active', b === btn));
  updateGoldPrice();
});

document.querySelectorAll('.bsign-plan').forEach(plan => {
  plan.addEventListener('click', () => {
    document.querySelectorAll('.bsign-plan').forEach(p => p.classList.remove('selected'));
    plan.classList.add('selected');
    bsState.plan = plan.dataset.plan;
    // Show/hide billing toggle based on plan
    const toggle = document.getElementById('js-billing-toggle');
    if (toggle) toggle.style.opacity = bsState.plan === 'gold' ? '1' : '0.4';
  });
});

// ── SCREEN 3 → 4: Check auth state ───────────────────────
document.getElementById('js-s3-next').addEventListener('click', async () => {
  bsignGoto('bs-s4');

  const timeout = new Promise(r => setTimeout(() => r(null), 3000));
  const session = await Promise.race([
    db.auth.getSession().then(r => r.data?.session ?? null),
    timeout,
  ]);

  if (session?.user) {
    // Already logged in — skip the form, show account card
    const user = session.user;
    const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email;
    document.getElementById('bs-s4-loggedin').style.display = 'block';
    document.getElementById('bs-s4-loggedout').style.display = 'none';
    document.getElementById('js-s4-account-card').innerHTML = `
      <div style="display:flex;align-items:center;gap:.85rem;padding:.85rem 1rem;background:var(--teal-pale,#e8f9f9);border-radius:12px;border:1.5px solid var(--teal)">
        <span style="font-size:1.8rem">👤</span>
        <div>
          <div style="font-weight:700;font-size:.95rem">${name}</div>
          <div style="font-size:.82rem;color:var(--mid)">${user.email}</div>
        </div>
      </div>`;
    // Sign out link
    document.getElementById('js-s4-signout')?.addEventListener('click', async e => {
      e.preventDefault();
      await db.auth.signOut();
      document.getElementById('bs-s4-loggedin').style.display = 'none';
      document.getElementById('bs-s4-loggedout').style.display = 'block';
    });
  } else {
    // Not logged in — show login/signup form
    document.getElementById('bs-s4-loggedin').style.display = 'none';
    document.getElementById('bs-s4-loggedout').style.display = 'block';
  }
});

// Auth mode toggle (new account ↔ login)
document.getElementById('js-auth-toggle')?.addEventListener('click', e => {
  const tab = e.target.closest('.bsign-auth-tab');
  if (!tab) return;
  const mode = tab.dataset.mode;
  document.querySelectorAll('.bsign-auth-tab').forEach(t => t.classList.toggle('active', t === tab));
  document.getElementById('bs-s4-signup-form').style.display = mode === 'signup' ? 'block' : 'none';
  document.getElementById('bs-s4-login-form').style.display  = mode === 'login'  ? 'block' : 'none';
});

// ── SCREEN 4: Submit ──────────────────────────────────────
async function handleS4Submit(e) {
  const btn   = e.currentTarget;
  const errEl = document.getElementById('js-s4-error');
  btn.disabled = true; btn.textContent = 'Saving…';
  if (errEl) errEl.style.display = 'none';

  // Determine current auth state
  const timeout = new Promise(r => setTimeout(() => r(null), 3000));
  const session = await Promise.race([
    db.auth.getSession().then(r => r.data?.session ?? null),
    timeout,
  ]);

  let userId = session?.user?.id || null;

  // If not logged in, sign up or log in first
  if (!userId) {
    const isLogin = document.getElementById('bs-s4-login-form')?.style.display !== 'none';

    if (isLogin) {
      const email    = document.getElementById('bc-login-email').value.trim();
      const password = document.getElementById('bc-login-password').value;
      if (!email || !password) {
        showS4Error('Please enter your email and password.');
        return;
      }
      const { data, error } = await db.auth.signInWithPassword({ email, password });
      if (error) { showS4Error(error.message); return; }
      userId = data.user?.id;
    } else {
      const name     = document.getElementById('bc-name').value.trim();
      const email    = document.getElementById('bc-email').value.trim();
      const password = document.getElementById('bc-password').value;
      if (!name || !email || !password) {
        showS4Error('Please fill in your name, email, and password.');
        return;
      }
      if (password.length < 8) {
        showS4Error('Password must be at least 8 characters.');
        return;
      }
      if (window._siteConfigPromise) await window._siteConfigPromise;
      const signupCity = window.SITE?.slug || 'geelong';
      const { data, error } = await db.auth.signUp({ email, password, options: { data: { name, city: signupCity } } });
      if (error) { showS4Error(error.message); return; }
      userId = data.user?.id;
    }
  }

  if (!userId) {
    showS4Error('Could not authenticate. Please try again.');
    return;
  }

  function showS4Error(msg) {
    if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }
    else alert(msg);
    btn.disabled = false; btn.textContent = 'Submit listing →';
  }

  if (window._siteConfigPromise) await window._siteConfigPromise;
  const bizCity = window.SITE?.slug || 'geelong';

  let bizId, error;

  if (bsState.mode === 'claim' && bsState.claimedBiz) {
    // Claim an existing business — update owner_id
    bizId = bsState.claimedBiz.id;
    const claimSlug = bsSlugify(`${bsState.details.name}-${bsState.details.suburb || bizCity}`);
    const { error: upErr } = await db.from('businesses').update({
      owner_id:    userId,
      is_claimed:  true,
      status:      'pending',
      slug:         claimSlug,
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
    const newSlug = bsSlugify(`${bsState.details.name}-${bsState.details.suburb || bizCity}`);
    const { error: insErr } = await db.from('businesses').insert({
      id:          bizId,
      owner_id:    userId,
      city:        bizCity,
      is_claimed:  true,
      status:      'pending',
      slug:        newSlug,
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

  // Save new bizId so dashboard opens on it directly
  localStorage.setItem('wtdg_dash_biz', bizId);

  // If Gold selected, redirect to Stripe checkout
  if (bsState.plan === 'gold') {
    btn.textContent = 'Redirecting to checkout…';
    try {
      const stripeType = BILLING_CONFIG[_billing]?.stripeType || 'gold_annual';
      const session = await db.auth.getSession();
      const userId  = session?.data?.session?.user?.id;
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type:       stripeType,
          bizId,
          userId,
          successUrl: `${location.origin}/business-dashboard.html?biz=${bizId}&gold=1`,
          cancelUrl:  `${location.origin}/business-signup.html`,
        }),
      });
      const json = await res.json();
      if (json.url) { window.location.href = json.url; return; }
      throw new Error(json.error || 'No checkout URL');
    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'Submit listing →';
      const errEl = document.getElementById('js-s4-error');
      if (errEl) { errEl.textContent = 'Could not start checkout: ' + err.message; errEl.style.display = 'block'; }
      return;
    }
  }

  // Free plan — go straight to success screen
  const dashLink = document.querySelector('a[href="business-dashboard.html"]');
  if (dashLink) dashLink.href = `business-dashboard.html?biz=${bizId}`;

  document.getElementById('js-bsign-done-sub').textContent =
    `${bsState.details.name} has been submitted for review. Head to your dashboard to start setting up events, offers, and photos.`;

  bsignGoto('bs-s5');
}

document.querySelectorAll('.js-s4-submit').forEach(btn => btn.addEventListener('click', e => handleS4Submit(e)));

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
// No forced redirect — auth is handled at step 4
