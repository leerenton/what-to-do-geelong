'use strict';

// ── STATE ─────────────────────────────────────────────────────────────────────
const ob = {
  path: null,          // 'business' | 'promoter' | 'user'
  // Business
  bizMode: null,       // 'claim' | 'create'
  claimedBiz: null,
  bizType: null,
  bizDetails: {},
  bizPrefs: { cats: [], sections: [], interest: [], suit: [], vibe: [] },
  bizImages: [],
  bizPlan: 'gold',
  bizBilling: 'annual',
  bizId: null,
  // Promoter
  event: {},
  boostPackage: 'none',
  promoterGold: false,
  promoterBilling: 'annual',
  eventId: null,
  // User
  userGroup: null,
  userKids: [],
  userInterests: [],
};

const SCREENS = [
  'ob-s0',
  'ob-b1','ob-b1b','ob-b2','ob-b3','ob-b4','ob-b5','ob-b6','ob-b7',
  'ob-p1','ob-p2','ob-p3','ob-p4',
  'ob-u1','ob-u2','ob-u3','ob-u4','ob-u5',
];

// Progress percentages per screen
const PROGRESS = {
  'ob-s0': 5,
  'ob-b1': 15, 'ob-b1b': 20, 'ob-b2': 33, 'ob-b3': 50, 'ob-b4': 65, 'ob-b5': 80, 'ob-b6': 92, 'ob-b7': 100,
  'ob-p1': 25, 'ob-p2': 55, 'ob-p3': 80, 'ob-p4': 100,
  'ob-u1': 20, 'ob-u2': 35, 'ob-u3': 55, 'ob-u4': 80, 'ob-u5': 100,
};

// Back navigation map
const BACK = {
  'ob-b1': 'ob-s0', 'ob-b1b': 'ob-b1', 'ob-b2': null /* dynamic */, 'ob-b3': 'ob-b2',
  'ob-b4': 'ob-b3', 'ob-b5': 'ob-b4', 'ob-b6': 'ob-b5',
  'ob-p1': 'ob-s0', 'ob-p2': 'ob-p1', 'ob-p3': 'ob-p2',
  'ob-u1': 'ob-s0', 'ob-u2': 'ob-u1', 'ob-u3': null /* dynamic */, 'ob-u4': 'ob-u3',
};

let currentScreen = 'ob-s0';

function goto(id) {
  SCREENS.forEach(s => document.getElementById(s)?.classList.toggle('active', s === id));
  document.getElementById('js-ob-progress').style.width = (PROGRESS[id] || 5) + '%';
  const isDone = id.endsWith('7') || id.endsWith('4') && ['ob-b7','ob-p4','ob-u5'].includes(id) || ['ob-b7','ob-p4','ob-u5'].includes(id);
  const hasBack = BACK[id] !== undefined && !isDone;
  document.getElementById('js-ob-back').style.display = hasBack ? 'flex' : 'none';
  currentScreen = id;
  window.scrollTo(0, 0);
}

document.getElementById('js-ob-back').addEventListener('click', () => {
  if (currentScreen === 'ob-b2') {
    goto(ob.bizMode === 'claim' ? 'ob-b1b' : 'ob-b1');
    return;
  }
  if (currentScreen === 'ob-u3') {
    goto(ob.userGroup === 'family' ? 'ob-u2' : 'ob-u1');
    return;
  }
  const prev = BACK[currentScreen];
  if (prev) goto(prev);
});

// ── SCREEN 0: Role selection ───────────────────────────────────────────────────
document.querySelectorAll('.ob-role-card[data-role]').forEach(card => {
  card.addEventListener('click', () => {
    ob.path = card.dataset.role;
    if (ob.path === 'business') {
      // Check for ?claim= param — skip to B2 with claim pre-set
      const claimSlug = new URLSearchParams(location.search).get('claim');
      if (claimSlug) {
        ob.bizMode = 'claim';
        goto('ob-b2');
      } else {
        goto('ob-b1');
      }
    } else if (ob.path === 'promoter') {
      goto('ob-p1');
    } else {
      goto('ob-u1');
    }
  });
});

// ── INIT: handle ?path= and ?claim= query params ───────────────────────────────
(function initFromUrl() {
  const params = new URLSearchParams(location.search);
  const path = params.get('path');
  const claim = params.get('claim');

  if (claim) {
    ob.path = 'business';
    ob.bizMode = 'claim';
    goto('ob-b2');
    return;
  }
  if (path === 'business') { ob.path = 'business'; goto('ob-b1'); }
  else if (path === 'promoter') { ob.path = 'promoter'; goto('ob-p1'); }
  else if (path === 'user') { ob.path = 'user'; goto('ob-u1'); }
})();

// ══════════════════════════════════════════════════════════════════════════════
// BUSINESS PATH
// ══════════════════════════════════════════════════════════════════════════════

// B1: Claim or Create
document.querySelectorAll('#ob-b1 .bsign-choice').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#ob-b1 .bsign-choice').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    ob.bizMode = btn.dataset.value;
    document.getElementById('js-b1-next').disabled = false;
  });
});

document.getElementById('js-b1-next').addEventListener('click', () => {
  goto(ob.bizMode === 'claim' ? 'ob-b1b' : 'ob-b2');
});

// B1b: Claim search
let claimTimer;
let claimCache = [];

document.getElementById('js-b-claim-search').addEventListener('input', function () {
  const q = this.value.toLowerCase().trim();
  const results = document.getElementById('js-b-claim-results');
  if (!q) { results.innerHTML = ''; return; }
  results.innerHTML = '<p style="color:var(--mid);font-size:.85rem;padding:.5rem 0">Searching…</p>';
  clearTimeout(claimTimer);
  claimTimer = setTimeout(async () => {
    const citySlug = window.SITE?.slug || 'geelong';
    let rows = [];
    try {
      const { data } = await db.from('businesses')
        .select('id,name,type,suburb,emoji,location,website,description,owner_id')
        .or(`name.ilike.%${q}%,suburb.ilike.%${q}%`)
        .eq('city', citySlug)
        .is('owner_id', null)
        .limit(10);
      rows = data || [];
    } catch (_) {}
    claimCache = rows;
    results.innerHTML = rows.length
      ? rows.map(b => `<button class="bsign-result-item" data-id="${b.id}">
          <span class="bsign-result-item__emoji">${b.emoji || '🏪'}</span>
          <div>
            <div class="bsign-result-item__name">${b.name}</div>
            <div class="bsign-result-item__type">${b.type || 'Business'} · ${b.suburb || ''}</div>
          </div></button>`).join('')
      : '<p style="color:var(--mid);font-size:.85rem;padding:.5rem 0">No unclaimed listings found. <button class="bsign-skip" onclick="ob.bizMode=\'create\';goto(\'ob-b2\')">Create a new listing instead →</button></p>';

    results.querySelectorAll('.bsign-result-item').forEach(btn => {
      btn.addEventListener('click', () => {
        results.querySelectorAll('.bsign-result-item').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        ob.claimedBiz = claimCache.find(b => b.id === btn.dataset.id);
        document.getElementById('js-b1b-next').disabled = false;
      });
    });
  }, 350);
});

document.getElementById('js-b1b-next').addEventListener('click', () => {
  if (ob.claimedBiz) {
    document.getElementById('bd-name').value    = ob.claimedBiz.name || '';
    document.getElementById('bd-address').value = ob.claimedBiz.location || '';
    document.getElementById('bd-website').value = ob.claimedBiz.website || '';
    document.getElementById('bd-desc').value    = ob.claimedBiz.description || '';
    ob.bizType = ob.claimedBiz.type;
    document.querySelectorAll('#js-b-type-grid .bsign-type-chip').forEach(c => {
      c.classList.toggle('selected', c.dataset.value === ob.claimedBiz.type);
    });
  }
  goto('ob-b2');
});

// B2: Business details chips
document.querySelectorAll('#js-b-type-grid .bsign-type-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('#js-b-type-grid .bsign-type-chip').forEach(c => c.classList.remove('selected'));
    chip.classList.add('selected');
    ob.bizType = chip.dataset.value;
  });
});

document.getElementById('js-b2-next').addEventListener('click', () => {
  const name = document.getElementById('bd-name').value.trim();
  const desc = document.getElementById('bd-desc').value.trim();
  if (!name || !desc) { alert('Please fill in your business name and description.'); return; }
  ob.bizDetails = {
    name,
    suburb:      document.getElementById('bd-suburb').value.trim(),
    address:     document.getElementById('bd-address').value.trim(),
    lat:         parseFloat(document.getElementById('bd-lat').value) || null,
    lng:         parseFloat(document.getElementById('bd-lng').value) || null,
    phone:       document.getElementById('bd-phone').value.trim(),
    website:     document.getElementById('bd-website').value.trim(),
    description: desc,
  };
  goto('ob-b3');
});

// B3: Preferences — multi-select tags per group
document.querySelectorAll('#ob-b3 .ob-tag').forEach(tag => {
  tag.addEventListener('click', () => {
    tag.classList.toggle('selected');
    const group = tag.dataset.group;
    const val   = tag.dataset.value;
    if (!group) return;
    const arr = ob.bizPrefs[group];
    const idx = arr.indexOf(val);
    if (idx === -1) arr.push(val); else arr.splice(idx, 1);
  });
});

document.getElementById('js-b3-next').addEventListener('click', () => goto('ob-b4'));
document.getElementById('js-b3-skip').addEventListener('click', () => goto('ob-b4'));

// B4: Images
const bImgInput  = document.getElementById('js-b-img-input');
const bUploadArea = document.getElementById('js-b-upload-area');
const bPreviews  = document.getElementById('js-b-img-previews');

bUploadArea.addEventListener('click', () => bImgInput.click());
bUploadArea.addEventListener('dragover', e => { e.preventDefault(); bUploadArea.classList.add('ob-upload-area--hover'); });
bUploadArea.addEventListener('dragleave', () => bUploadArea.classList.remove('ob-upload-area--hover'));
bUploadArea.addEventListener('drop', e => { e.preventDefault(); bUploadArea.classList.remove('ob-upload-area--hover'); addBizImages(e.dataTransfer.files); });
bImgInput.addEventListener('change', () => addBizImages(bImgInput.files));

function addBizImages(files) {
  Array.from(files).forEach(file => {
    if (ob.bizImages.length >= 10) return;
    ob.bizImages.push(file);
    const url = URL.createObjectURL(file);
    const wrap = document.createElement('div');
    wrap.className = 'ob-img-thumb';
    wrap.innerHTML = `<img src="${url}" alt="" /><button class="ob-img-remove" title="Remove">✕</button>`;
    wrap.querySelector('.ob-img-remove').addEventListener('click', () => {
      const i = ob.bizImages.indexOf(file);
      if (i !== -1) ob.bizImages.splice(i, 1);
      wrap.remove();
    });
    bPreviews.appendChild(wrap);
  });
}

document.getElementById('js-b4-next').addEventListener('click', () => goto('ob-b5'));
document.getElementById('js-b4-skip').addEventListener('click', () => goto('ob-b5'));

// B5: Plan selection
const B_BILLING = {
  annual:  { display: '$20.75', per: '/ mo', note: 'Billed $249/yr · cancel anytime', stripeType: 'gold_annual' },
  monthly: { display: '$25',    per: '/ mo', note: 'Billed monthly · cancel anytime',  stripeType: 'gold_monthly' },
};

document.getElementById('js-b-billing-toggle').addEventListener('click', e => {
  const btn = e.target.closest('.bsign-billing-btn');
  if (!btn) return;
  ob.bizBilling = btn.dataset.billing;
  document.querySelectorAll('#js-b-billing-toggle .bsign-billing-btn').forEach(b => b.classList.toggle('active', b === btn));
  const cfg = B_BILLING[ob.bizBilling];
  document.getElementById('js-b-gold-price').innerHTML = `${cfg.display} <span>${cfg.per}</span>`;
  document.getElementById('js-b-gold-note').textContent = cfg.note;
});

document.querySelectorAll('#ob-b5 .bsign-plan').forEach(plan => {
  plan.addEventListener('click', () => {
    document.querySelectorAll('#ob-b5 .bsign-plan').forEach(p => { p.classList.remove('selected'); p.querySelector('.bsign-plan__radio')?.classList.remove('bsign-plan__radio--checked'); });
    plan.classList.add('selected');
    plan.querySelector('.bsign-plan__radio')?.classList.add('bsign-plan__radio--checked');
    ob.bizPlan = plan.dataset.plan;
    const toggle = document.getElementById('js-b-billing-toggle');
    if (toggle) toggle.style.opacity = ob.bizPlan === 'gold' ? '1' : '0.4';
  });
});

document.getElementById('js-b5-next').addEventListener('click', async () => {
  // Check session before showing B6
  const session = await Promise.race([
    db.auth.getSession().then(r => r.data?.session ?? null),
    new Promise(r => setTimeout(() => r(null), 3000)),
  ]);
  populateB6Auth(session);
  goto('ob-b6');
});

function populateB6Auth(session) {
  if (session?.user) {
    const u = session.user;
    const name = u.user_metadata?.name || u.user_metadata?.full_name || u.email;
    document.getElementById('ob-b6-loggedin').style.display  = 'block';
    document.getElementById('ob-b6-loggedout').style.display = 'none';
    document.getElementById('js-b6-account-card').innerHTML  = accountCard(name, u.email);
    document.getElementById('js-b6-signout')?.addEventListener('click', async e => {
      e.preventDefault();
      await db.auth.signOut();
      document.getElementById('ob-b6-loggedin').style.display  = 'none';
      document.getElementById('ob-b6-loggedout').style.display = 'block';
    });
  } else {
    document.getElementById('ob-b6-loggedin').style.display  = 'none';
    document.getElementById('ob-b6-loggedout').style.display = 'block';
  }
}

// B6: auth toggle
document.getElementById('js-b6-auth-toggle').addEventListener('click', e => {
  const tab = e.target.closest('.bsign-auth-tab');
  if (!tab) return;
  const mode = tab.dataset.mode;
  document.querySelectorAll('#js-b6-auth-toggle .bsign-auth-tab').forEach(t => t.classList.toggle('active', t === tab));
  document.getElementById('ob-b6-signup-form').style.display = mode === 'signup' ? 'block' : 'none';
  document.getElementById('ob-b6-login-form').style.display  = mode === 'login'  ? 'block' : 'none';
});

// B6: submit
async function handleB6Submit(e) {
  const btn   = e.currentTarget;
  const errEl = document.getElementById('js-b6-error');
  btn.disabled = true; btn.textContent = 'Saving…';
  if (errEl) errEl.style.display = 'none';

  let userId = await resolveUserId();
  if (!userId) {
    const isLogin = document.getElementById('ob-b6-login-form')?.style.display !== 'none';
    const result = await doAuth(isLogin, {
      name:     document.getElementById('b6-name')?.value.trim(),
      email:    isLogin ? document.getElementById('b6-login-email')?.value.trim() : document.getElementById('b6-email')?.value.trim(),
      password: isLogin ? document.getElementById('b6-login-password')?.value     : document.getElementById('b6-password')?.value,
    }, 'business');
    if (result.error) { showError(errEl, result.error, btn, 'Submit listing →'); return; }
    userId = result.userId;
  }
  if (!userId) { showError(errEl, 'Could not authenticate. Please try again.', btn, 'Submit listing →'); return; }

  if (window._siteConfigPromise) await window._siteConfigPromise;
  const bizCity = window.SITE?.slug || 'geelong';

  let bizId, error;

  if (ob.bizMode === 'claim' && ob.claimedBiz) {
    bizId = ob.claimedBiz.id;
    const slug = bsSlugify(`${ob.bizDetails.name}-${ob.bizDetails.suburb || bizCity}`);
    const { error: e } = await db.from('businesses').update({
      owner_id:    userId, is_claimed: true, status: 'pending',
      slug, plan: ob.bizPlan,
      name:        ob.bizDetails.name,
      suburb:      ob.bizDetails.suburb,
      location:    ob.bizDetails.address,
      lat:         ob.bizDetails.lat,
      lng:         ob.bizDetails.lng,
      website:     ob.bizDetails.website,
      description: ob.bizDetails.description,
      type:        ob.bizType || ob.claimedBiz.type,
      categories:  ob.bizPrefs.cats,
      section:     ob.bizPrefs.sections[0] || 'do',
      tags:        [...ob.bizPrefs.interest, ...ob.bizPrefs.suit, ...ob.bizPrefs.vibe],
    }).eq('id', bizId);
    error = e;
  } else {
    bizId = 'biz-' + Date.now().toString(36);
    const slug = bsSlugify(`${ob.bizDetails.name}-${ob.bizDetails.suburb || bizCity}`);
    const { error: e } = await db.from('businesses').insert({
      id:          bizId, owner_id: userId, city: bizCity,
      is_claimed:  true, status: 'pending',
      slug, plan: ob.bizPlan,
      name:        ob.bizDetails.name,
      type:        ob.bizType || 'Business',
      suburb:      ob.bizDetails.suburb,
      location:    ob.bizDetails.address,
      lat:         ob.bizDetails.lat,
      lng:         ob.bizDetails.lng,
      website:     ob.bizDetails.website,
      description: ob.bizDetails.description,
      emoji:       '🏪', color: '#4ac8d0',
      section:     ob.bizPrefs.sections[0] || 'do',
      categories:  ob.bizPrefs.cats,
      tags:        [...ob.bizPrefs.interest, ...ob.bizPrefs.suit, ...ob.bizPrefs.vibe],
    });
    error = e;
  }

  if (error) {
    const msg = error.code === '42501'
      ? 'Permission denied — this listing may already be claimed. Contact us if you believe this is an error.'
      : 'Could not save: ' + error.message;
    showError(errEl, msg, btn, 'Submit listing →'); return;
  }

  // Upload images
  if (ob.bizImages.length) await uploadBizImages(bizId, ob.bizImages);

  ob.bizId = bizId;
  localStorage.setItem('wtdg_dash_biz', bizId);

  if (ob.bizPlan === 'gold') {
    btn.textContent = 'Redirecting to checkout…';
    try {
      const sess = await db.auth.getSession();
      const uid  = sess?.data?.session?.user?.id;
      const stripeType = B_BILLING[ob.bizBilling]?.stripeType || 'gold_annual';
      const res  = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: stripeType, bizId, userId: uid,
          successUrl: `${location.origin}/business-dashboard.html?biz=${bizId}&gold=1`,
          cancelUrl:  `${location.origin}/onboard.html?path=business`,
        }),
      });
      const json = await res.json();
      if (json.url) { window.location.href = json.url; return; }
      throw new Error(json.error || 'No checkout URL');
    } catch (err) {
      showError(errEl, 'Could not start checkout: ' + err.message, btn, 'Submit listing →'); return;
    }
  }

  document.getElementById('js-b7-sub').textContent =
    `${ob.bizDetails.name} has been submitted for review. Head to your dashboard to add events, offers, and photos.`;
  const dashLink = document.getElementById('js-b7-dash-link');
  if (dashLink) dashLink.href = `business-dashboard.html?biz=${bizId}`;
  goto('ob-b7');
}

document.querySelectorAll('#ob-b6 .ob-auth-submit').forEach(btn => btn.addEventListener('click', e => handleB6Submit(e)));

async function uploadBizImages(bizId, files) {
  for (const file of files) {
    try {
      const ext  = file.name.split('.').pop().toLowerCase();
      const path = `${bizId}/${Date.now()}.${ext}`;
      await db.storage.from('business-images').upload(path, file, { upsert: true });
    } catch (_) {}
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// PROMOTER PATH
// ══════════════════════════════════════════════════════════════════════════════

// P1: Event details
const pImgInput   = document.getElementById('js-p-img-input');
const pUploadArea = document.getElementById('js-p-upload-area');
let   pImgFile    = null;

pUploadArea.addEventListener('click', () => pImgInput.click());
pImgInput.addEventListener('change', () => {
  pImgFile = pImgInput.files[0] || null;
  const preview = document.getElementById('js-p-img-preview');
  if (pImgFile) {
    preview.innerHTML = `<div class="ob-img-thumb ob-img-thumb--single"><img src="${URL.createObjectURL(pImgFile)}" alt="" /><button class="ob-img-remove" onclick="pImgFile=null;this.parentNode.remove()">✕</button></div>`;
  }
});

document.getElementById('js-p1-next').addEventListener('click', () => {
  const title = document.getElementById('pe-title').value.trim();
  const date  = document.getElementById('pe-date').value.trim();
  const loc   = document.getElementById('pe-location').value.trim();
  const desc  = document.getElementById('pe-desc').value.trim();
  if (!title || !date || !loc || !desc) { alert('Please fill in event name, date, location, and description.'); return; }
  ob.event = {
    title, date,
    time:        document.getElementById('pe-time').value.trim() || null,
    location:    loc,
    category:    document.getElementById('pe-cat').value,
    url:         document.getElementById('pe-url').value.trim() || null,
    description: desc,
  };
  goto('ob-p2');
});

// P2: Boost selection
document.querySelectorAll('.ob-boost-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.ob-boost-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    ob.boostPackage = card.dataset.package;
  });
});

// Promoter Gold toggle
const P_BILLING = {
  annual:  { note: '$500/yr — includes promotional credits · cancel anytime',  stripeType: 'promoter_annual' },
  monthly: { note: '$50/mo — includes promotional credits · cancel anytime',   stripeType: 'promoter_monthly' },
};

document.getElementById('js-p-gold-toggle').addEventListener('click', () => {
  ob.promoterGold = true;
  document.getElementById('js-promoter-gold-cta').style.display  = 'none';
  document.getElementById('js-p-gold-detail').style.display       = 'block';
});

document.getElementById('js-p-gold-remove').addEventListener('click', () => {
  ob.promoterGold = false;
  document.getElementById('js-promoter-gold-cta').style.display  = 'flex';
  document.getElementById('js-p-gold-detail').style.display       = 'none';
});

document.getElementById('js-p-billing-toggle').addEventListener('click', e => {
  const btn = e.target.closest('.bsign-billing-btn');
  if (!btn) return;
  ob.promoterBilling = btn.dataset.billing;
  document.querySelectorAll('#js-p-billing-toggle .bsign-billing-btn').forEach(b => b.classList.toggle('active', b === btn));
  document.getElementById('js-p-gold-note').textContent = P_BILLING[ob.promoterBilling].note;
});

document.getElementById('js-p2-next').addEventListener('click', async () => {
  const session = await Promise.race([
    db.auth.getSession().then(r => r.data?.session ?? null),
    new Promise(r => setTimeout(() => r(null), 3000)),
  ]);
  populateP3Auth(session);
  goto('ob-p3');
});

function populateP3Auth(session) {
  if (session?.user) {
    const u    = session.user;
    const name = u.user_metadata?.name || u.user_metadata?.full_name || u.email;
    document.getElementById('ob-p3-loggedin').style.display  = 'block';
    document.getElementById('ob-p3-loggedout').style.display = 'none';
    document.getElementById('js-p3-account-card').innerHTML  = accountCard(name, u.email);
    document.getElementById('js-p3-signout')?.addEventListener('click', async e => {
      e.preventDefault();
      await db.auth.signOut();
      document.getElementById('ob-p3-loggedin').style.display  = 'none';
      document.getElementById('ob-p3-loggedout').style.display = 'block';
    });
  } else {
    document.getElementById('ob-p3-loggedin').style.display  = 'none';
    document.getElementById('ob-p3-loggedout').style.display = 'block';
  }
}

document.getElementById('js-p3-auth-toggle').addEventListener('click', e => {
  const tab = e.target.closest('.bsign-auth-tab');
  if (!tab) return;
  const mode = tab.dataset.mode;
  document.querySelectorAll('#js-p3-auth-toggle .bsign-auth-tab').forEach(t => t.classList.toggle('active', t === tab));
  document.getElementById('ob-p3-signup-form').style.display = mode === 'signup' ? 'block' : 'none';
  document.getElementById('ob-p3-login-form').style.display  = mode === 'login'  ? 'block' : 'none';
});

async function handleP3Submit(e) {
  const btn   = e.currentTarget;
  const errEl = document.getElementById('js-p3-error');
  btn.disabled = true; btn.textContent = 'Saving…';
  if (errEl) errEl.style.display = 'none';

  let userId = await resolveUserId();
  if (!userId) {
    const isLogin = document.getElementById('ob-p3-login-form')?.style.display !== 'none';
    const result = await doAuth(isLogin, {
      name:     document.getElementById('p3-name')?.value.trim(),
      email:    isLogin ? document.getElementById('p3-login-email')?.value.trim() : document.getElementById('p3-email')?.value.trim(),
      password: isLogin ? document.getElementById('p3-login-password')?.value     : document.getElementById('p3-password')?.value,
    }, 'promoter');
    if (result.error) { showError(errEl, result.error, btn, 'Submit event →'); return; }
    userId = result.userId;
  }
  if (!userId) { showError(errEl, 'Could not authenticate. Please try again.', btn, 'Submit event →'); return; }

  if (window._siteConfigPromise) await window._siteConfigPromise;
  const city = window.SITE?.slug || 'geelong';

  // Insert event
  const eventId = 'ev-' + Date.now().toString(36);
  const { error: evErr } = await db.from('events').insert({
    id:          eventId,
    title:       ob.event.title,
    date:        ob.event.date,
    time:        ob.event.time,
    location:    ob.event.location,
    category:    ob.event.category,
    url:         ob.event.url,
    description: ob.event.description,
    city,
    status:      'pending',
    promoter_id: userId,
  });
  if (evErr) { showError(errEl, 'Could not save event: ' + evErr.message, btn, 'Submit event →'); return; }

  // Upload event image
  if (pImgFile) {
    try {
      const ext  = pImgFile.name.split('.').pop().toLowerCase();
      await db.storage.from('event-images').upload(`${eventId}.${ext}`, pImgFile, { upsert: true });
    } catch (_) {}
  }

  ob.eventId = eventId;

  // Checkout for boost or promoter gold
  const needsPayment = ob.boostPackage !== 'none' || ob.promoterGold;
  if (needsPayment) {
    btn.textContent = 'Redirecting to checkout…';
    try {
      const sess = await db.auth.getSession();
      const uid  = sess?.data?.session?.user?.id;
      // If both boost + gold, prioritise gold (covers boosts via credits)
      const type = ob.promoterGold
        ? P_BILLING[ob.promoterBilling].stripeType
        : ob.boostPackage;
      const res  = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type, eventId, userId: uid,
          successUrl: `${location.origin}/account.html?tab=events&new=${eventId}`,
          cancelUrl:  `${location.origin}/onboard.html?path=promoter`,
        }),
      });
      const json = await res.json();
      if (json.url) { window.location.href = json.url; return; }
      throw new Error(json.error || 'No checkout URL');
    } catch (err) {
      showError(errEl, 'Could not start checkout: ' + err.message, btn, 'Submit event →'); return;
    }
  }

  document.getElementById('js-p4-sub').textContent =
    `${ob.event.title} has been submitted for review and will be live shortly.`;
  goto('ob-p4');
}

document.querySelectorAll('#ob-p3 .ob-auth-submit').forEach(btn => btn.addEventListener('click', e => handleP3Submit(e)));

// ══════════════════════════════════════════════════════════════════════════════
// USER PATH
// ══════════════════════════════════════════════════════════════════════════════

// U1: Group type
document.querySelectorAll('#ob-u1 .ob-role-card[data-group]').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('#ob-u1 .ob-role-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    ob.userGroup = card.dataset.group;
    document.getElementById('js-u1-next').disabled = false;
  });
});

document.getElementById('js-u1-next').addEventListener('click', () => {
  goto(ob.userGroup === 'family' ? 'ob-u2' : 'ob-u3');
});

document.getElementById('js-u1-skip').addEventListener('click', () => {
  saveUserPrefsLocally();
  window.location.href = 'index.html';
});

// U2: Kids ages
document.querySelectorAll('#js-u-kids-chips .ob-tag').forEach(tag => {
  tag.addEventListener('click', () => {
    tag.classList.toggle('selected');
    const val = tag.dataset.value;
    const idx = ob.userKids.indexOf(val);
    if (idx === -1) ob.userKids.push(val); else ob.userKids.splice(idx, 1);
  });
});

document.getElementById('js-u2-next').addEventListener('click', () => goto('ob-u3'));
document.getElementById('js-u2-skip').addEventListener('click', () => goto('ob-u3'));

// U3: Interests
document.querySelectorAll('#js-u-interest-tags .ob-tag').forEach(tag => {
  tag.addEventListener('click', () => {
    tag.classList.toggle('selected');
    const val = tag.dataset.value;
    const idx = ob.userInterests.indexOf(val);
    if (idx === -1) ob.userInterests.push(val); else ob.userInterests.splice(idx, 1);
  });
});

document.getElementById('js-u3-next').addEventListener('click', async () => {
  saveUserPrefsLocally();
  const session = await Promise.race([
    db.auth.getSession().then(r => r.data?.session ?? null),
    new Promise(r => setTimeout(() => r(null), 3000)),
  ]);
  populateU4Auth(session);
  goto('ob-u4');
});

function saveUserPrefsLocally() {
  localStorage.setItem('wtdg_prefs', JSON.stringify({
    group:     ob.userGroup,
    kids:      ob.userKids,
    interests: ob.userInterests,
  }));
}

function populateU4Auth(session) {
  if (session?.user) {
    // Save prefs to account
    const user = session.user;
    db.from('profiles').upsert({
      id:        user.id,
      interests: ob.userInterests,
      group:     ob.userGroup,
      kids:      ob.userKids,
    }, { onConflict: 'id' }).then(() => {});
    document.getElementById('ob-u4-loggedin').style.display = 'block';
    document.getElementById('ob-u4-loggedout').style.display = 'none';
  } else {
    document.getElementById('ob-u4-loggedin').style.display = 'none';
    document.getElementById('ob-u4-loggedout').style.display = 'block';
  }
}

document.getElementById('js-u4-go').addEventListener('click', () => {
  window.location.href = 'index.html';
});

document.getElementById('js-u4-skip').addEventListener('click', () => {
  window.location.href = 'index.html';
});

// U4: Auth toggle
document.getElementById('js-u4-auth-toggle').addEventListener('click', e => {
  const tab = e.target.closest('.bsign-auth-tab');
  if (!tab) return;
  const mode = tab.dataset.mode;
  document.querySelectorAll('#js-u4-auth-toggle .bsign-auth-tab').forEach(t => t.classList.toggle('active', t === tab));
  document.getElementById('ob-u4-signup-form').style.display = mode === 'signup' ? 'block' : 'none';
  document.getElementById('ob-u4-login-form').style.display  = mode === 'login'  ? 'block' : 'none';
});

document.getElementById('js-u4-next').addEventListener('click', async e => {
  const btn   = e.currentTarget;
  const errEl = document.getElementById('js-u4-error');
  btn.disabled = true; btn.textContent = 'Saving…';
  if (errEl) errEl.style.display = 'none';

  const isLogin = document.getElementById('ob-u4-login-form')?.style.display !== 'none';
  const result = await doAuth(isLogin, {
    name:     document.getElementById('u4-name')?.value.trim(),
    email:    isLogin ? document.getElementById('u4-login-email')?.value.trim() : document.getElementById('u4-email')?.value.trim(),
    password: isLogin ? document.getElementById('u4-login-password')?.value     : document.getElementById('u4-password')?.value,
  }, 'user');
  if (result.error) { showError(errEl, result.error, btn, 'Save my guide →'); return; }

  // Save preferences to profile
  if (result.userId) {
    try {
      await db.from('profiles').upsert({
        id:        result.userId,
        interests: ob.userInterests,
        group:     ob.userGroup,
        kids:      ob.userKids,
      }, { onConflict: 'id' });
    } catch (_) {}
  }

  goto('ob-u5');
});

// ══════════════════════════════════════════════════════════════════════════════
// SHARED HELPERS
// ══════════════════════════════════════════════════════════════════════════════

async function resolveUserId() {
  const r = await Promise.race([
    db.auth.getSession().then(r => r.data?.session?.user?.id ?? null),
    new Promise(r => setTimeout(() => r(null), 3000)),
  ]);
  return r;
}

async function doAuth(isLogin, { name, email, password }, userType) {
  if (!email || !password) return { error: 'Please fill in your email and password.' };
  if (!isLogin && !name)   return { error: 'Please enter your name.' };
  if (!isLogin && password.length < 8) return { error: 'Password must be at least 8 characters.' };

  if (window._siteConfigPromise) await window._siteConfigPromise;
  const city = window.SITE?.slug || 'geelong';

  if (isLogin) {
    const { data, error } = await db.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { userId: data.user?.id };
  } else {
    const { data, error } = await db.auth.signUp({
      email, password,
      options: { data: { name, city, user_type: userType } },
    });
    if (error) return { error: error.message };
    return { userId: data.user?.id };
  }
}

function showError(errEl, msg, btn, btnLabel) {
  if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }
  else alert(msg);
  if (btn) { btn.disabled = false; btn.textContent = btnLabel; }
}

function accountCard(name, email) {
  return `<div style="display:flex;align-items:center;gap:.85rem;padding:.85rem 1rem;background:var(--teal-pale,#e8f9f9);border-radius:12px;border:1.5px solid var(--teal)">
    <span style="font-size:1.8rem">👤</span>
    <div>
      <div style="font-weight:700;font-size:.95rem">${name}</div>
      <div style="font-size:.82rem;color:var(--mid)">${email}</div>
    </div>
  </div>`;
}

function bsSlugify(str) {
  return String(str).toLowerCase().trim()
    .replace(/[àáâãäå]/g,'a').replace(/[èéêë]/g,'e').replace(/[ìíîï]/g,'i')
    .replace(/[òóôõö]/g,'o').replace(/[ùúûü]/g,'u')
    .replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-');
}

// ══════════════════════════════════════════════════════════════════════════════
// GOOGLE MAPS — draggable marker for B2
// ══════════════════════════════════════════════════════════════════════════════

let _obMap = null;
let _obMarker = null;
let _obAutocomplete = null;

function initOnboardMap() {
  const input = document.getElementById('bd-address');
  if (!input || !window.google?.maps?.places) return;

  _obAutocomplete = new google.maps.places.Autocomplete(input, {
    componentRestrictions: { country: 'au' },
    fields: ['formatted_address', 'geometry', 'address_components'],
    types: ['establishment', 'geocode'],
  });

  _obAutocomplete.addListener('place_changed', () => {
    const place = _obAutocomplete.getPlace();
    if (!place.geometry) return;

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    document.getElementById('bd-lat').value = lat;
    document.getElementById('bd-lng').value = lng;

    // Auto-populate suburb
    const locality = place.address_components?.find(c => c.types.includes('locality'))
                  || place.address_components?.find(c => c.types.includes('sublocality'));
    if (locality) document.getElementById('bd-suburb').value = locality.long_name;

    input.value = place.formatted_address || input.value;

    // Show and update map
    const mapWrap = document.getElementById('js-b-map-wrap');
    mapWrap.style.display = 'block';

    if (!_obMap) {
      _obMap = new google.maps.Map(document.getElementById('js-b-map'), {
        zoom: 16,
        center: { lat, lng },
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: 'cooperative',
      });
      _obMarker = new google.maps.Marker({
        position: { lat, lng },
        map: _obMap,
        draggable: true,
        title: 'Drag to fine-tune location',
      });
      _obMarker.addListener('dragend', () => {
        const pos = _obMarker.getPosition();
        document.getElementById('bd-lat').value = pos.lat();
        document.getElementById('bd-lng').value = pos.lng();
      });
    } else {
      _obMap.setCenter({ lat, lng });
      _obMarker.setPosition({ lat, lng });
    }
  });
}

window.initOnboardMap = initOnboardMap;
