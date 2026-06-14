// ── WTDG Unified Promote Page ─────────────────────────────
// promote.js  —  loaded by promote.html
//
// Flow: pick item → pick package → pick payment → confirm
// ─────────────────────────────────────────────────────────

(async function () {
  // ── State ─────────────────────────────────────────────
  let _step        = 1;
  let _selectedItem = null;  // { id, type, name, bizId }
  let _selectedPkg  = null;  // 'boost' | 'spotlight' | 'premier'
  let _payMethod    = 'card'; // 'card' | 'credits'
  let _bizId        = null;
  let _credits      = 0;
  let _bizCredits   = {};     // map of bizId → credit_balance

  const CREDIT_COST = { boost: 1, spotlight: 2, premier: 4 };
  const PKG_PRICE   = { boost: '$49', spotlight: '$99', premier: '$199' };
  const PKG_DAYS    = { boost: '7 days', spotlight: '14 days', premier: '30 days' };

  // ── Helpers ───────────────────────────────────────────
  function setProgress(pct) {
    document.getElementById('js-promo-progress').style.width = pct + '%';
  }

  function showScreen(id) {
    document.querySelectorAll('.promo-screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.getElementById('js-promo-back').style.display = _step > 1 ? '' : 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goBack() {
    if (_step <= 1) return;
    _step--;
    setProgress(_step * 25);
    showScreen(`ps-s${_step}`);
    if (_step === 1) document.getElementById('js-promo-back').style.display = 'none';
  }

  // ── Auth check ────────────────────────────────────────
  const session = await db.auth.getSession();
  const user    = session?.data?.session?.user;

  if (!user) {
    document.getElementById('js-promo-loading').style.display   = 'none';
    document.getElementById('js-promo-auth-gate').style.display = '';
    document.getElementById('js-s1-next').style.display         = 'none';
    return;
  }

  // ── Load business + content ───────────────────────────
  async function loadContent() {
    const loading  = document.getElementById('js-promo-loading');
    const sections = document.getElementById('js-promo-sections');
    const empty    = document.getElementById('js-promo-empty');

    try {
      // Find business owned by user
      const { data: bizRows } = await db
        .from('businesses')
        .select('id, name, img, status, credit_balance')
        .eq('owner_id', user.id)
        .limit(10);

      if (!bizRows || bizRows.length === 0) {
        loading.style.display  = 'none';
        empty.style.display    = '';
        return;
      }

      // Store credits per biz
      bizRows.forEach(b => { _bizCredits[b.id] = b.credit_balance || 0; });

      // Default to URL param biz, localStorage biz, or first row
      const urlBiz    = new URLSearchParams(window.location.search).get('biz');
      const lsBiz     = localStorage.getItem('wtdg_dash_biz');
      const preferred  = bizRows.find(b => b.id === urlBiz) ||
                         bizRows.find(b => b.id === lsBiz)  ||
                         bizRows[0];

      _bizId   = preferred.id;
      _credits = preferred.credit_balance || 0;


      // Load events + offers for all businesses owned by user
      const bizIds = bizRows.map(b => b.id);

      // Events
      const { data: evRows } = await db
        .from('events')
        .select('id, name, img, date, business_id')
        .in('business_id', bizIds)
        .order('id', { ascending: false });

      // Offers / promos
      const { data: promoRows } = await db
        .from('promos')
        .select('id, title, img, discount, business_id')
        .in('business_id', bizIds)
        .order('id', { ascending: false });

      loading.style.display  = 'none';
      sections.style.display = '';

      // Render business listing
      const bizItems = document.getElementById('js-promo-biz-items');
      bizRows.filter(b => b.id === _bizId).forEach(b => {
        bizItems.appendChild(makeItemCard({
          id: b.id, type: 'business', name: b.name,
          img: b.img, meta: 'Business listing', bizId: b.id,
        }));
      });

      // Events — only for the active biz
      const bizEvRows = evRows?.filter(e => e.business_id === _bizId) || [];
      if (bizEvRows.length) {
        document.getElementById('js-promo-events-section').style.display = '';
        const cont = document.getElementById('js-promo-event-items');
        bizEvRows.forEach(e => {
          cont.appendChild(makeItemCard({
            id: e.id, type: 'event', name: e.name,
            img: e.img, meta: e.date ? `Event · ${e.date}` : 'Event',
            bizId: e.business_id,
          }));
        });
      }

      // Offers — only for the active biz
      const bizPromoRows = promoRows?.filter(p => p.business_id === _bizId) || [];
      if (bizPromoRows.length) {
        document.getElementById('js-promo-offers-section').style.display = '';
        const cont = document.getElementById('js-promo-offer-items');
        bizPromoRows.forEach(p => {
          cont.appendChild(makeItemCard({
            id: p.id, type: 'offer', name: p.title || 'Untitled offer',
            img: p.img, meta: p.discount || 'Offer',
            bizId: p.business_id,
          }));
        });
      }

      const hasContent = bizItems.children.length || bizEvRows.length || bizPromoRows.length;
      if (!hasContent) {
        sections.style.display = 'none';
        empty.style.display    = '';
        return;
      }

      // Auto-select the biz listing and skip straight to step 2
      const firstCard = document.querySelector('.promo-item');
      if (firstCard) firstCard.click();
      // Jump directly to package selection — no need to show step 1
      _step = 2;
      setProgress(50);
      document.getElementById('js-s2-item-label').textContent = _selectedItem?.name || '';
      showScreen('ps-s2');

    } catch (err) {
      loading.textContent = 'Failed to load content: ' + err.message;
    }
  }

  function makeItemCard({ id, type, name, img, meta, bizId }) {
    const div = document.createElement('div');
    div.className = 'promo-item';
    div.dataset.id    = id;
    div.dataset.type  = type;
    div.dataset.name  = name;
    div.dataset.bizId = bizId || '';

    const thumb = img
      ? `<img class="promo-item__thumb" src="${img}" alt="" />`
      : `<div class="promo-item__thumb--placeholder">${typeEmoji(type)}</div>`;

    div.innerHTML = `
      ${thumb}
      <div class="promo-item__body">
        <div class="promo-item__name">${name}</div>
        <div class="promo-item__meta">${meta}</div>
      </div>
      <div class="promo-item__radio"></div>
    `;

    div.addEventListener('click', () => {
      document.querySelectorAll('.promo-item').forEach(i => i.classList.remove('selected'));
      div.classList.add('selected');
      // Update active biz + credits based on the selected item
      _bizId   = bizId || _bizId;
      _credits = _bizCredits[_bizId] || 0;
      _selectedItem = { id, type, name, bizId: _bizId };
      document.getElementById('js-s1-next').disabled = false;
      // Update credit bar visibility
      const bar = document.getElementById('js-promo-credit-bar');
      if (_credits > 0) {
        bar.style.display = '';
        document.getElementById('js-credit-count').textContent  = _credits;
        document.getElementById('js-credit-plural').textContent = _credits !== 1 ? 's' : '';
      } else {
        bar.style.display = 'none';
      }
    });

    return div;
  }

  function typeEmoji(type) {
    return { business: '🏢', event: '🎟️', offer: '🎁', article: '📰' }[type] || '📌';
  }

  // ── Step 1 → 2 ────────────────────────────────────────
  document.getElementById('js-s1-next').addEventListener('click', () => {
    if (!_selectedItem) return;
    _step = 2;
    setProgress(50);
    document.getElementById('js-s2-item-label').textContent = _selectedItem.name;
    showScreen('ps-s2');
  });

  // Package selection
  document.querySelectorAll('.promo-pkg').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.promo-pkg').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      _selectedPkg = card.dataset.pkg;
      document.getElementById('js-s2-next').disabled = false;
    });
  });

  // ── Step 2 → 3 ────────────────────────────────────────
  document.getElementById('js-s2-next').addEventListener('click', async () => {
    if (!_selectedPkg) return;
    _step = 3;
    setProgress(75);

    // Populate payment screen
    document.getElementById('js-s3-item-label').textContent  = _selectedItem.name;
    document.getElementById('js-s3-pkg-label').textContent   = cap(_selectedPkg) + ` · ${PKG_PRICE[_selectedPkg]}`;
    document.getElementById('js-pay-card-amount').textContent = PKG_PRICE[_selectedPkg] + ' AUD';

    // Fresh credit lookup — don't rely on cached value
    try {
      const { data: bizRow } = await db
        .from('businesses')
        .select('id, credit_balance')
        .eq('id', _bizId)
        .single();
      _credits = bizRow?.credit_balance || 0;
    } catch (e) { _credits = 0; }

    const cost    = CREDIT_COST[_selectedPkg];
    const credOpt = document.getElementById('js-pay-credits');

    if (_credits >= cost) {
      credOpt.style.display = '';
      document.getElementById('js-pay-credits-label').textContent =
        `Use ${cost} credit${cost !== 1 ? 's' : ''} (${_credits} available)`;
    } else {
      credOpt.style.display = 'none';
    }

    // Reset payment selection to card
    selectPayMethod('card');

    showScreen('ps-s3');
  });

  // Payment option selection
  document.querySelectorAll('.promo-pay-opt').forEach(opt => {
    opt.addEventListener('click', () => selectPayMethod(opt.dataset.pay));
  });

  function selectPayMethod(method) {
    _payMethod = method;
    document.querySelectorAll('.promo-pay-opt').forEach(o => {
      const isSelected = o.dataset.pay === method;
      o.classList.toggle('selected', isSelected);
      const radio = o.querySelector('.promo-pay-opt__radio');
      if (radio) radio.classList.toggle('promo-pay-opt__radio--checked', isSelected);
    });
  }

  // ── Step 3 → 4 ────────────────────────────────────────
  document.getElementById('js-s3-next').addEventListener('click', () => {
    _step = 4;
    setProgress(100);

    const cost = CREDIT_COST[_selectedPkg];

    document.getElementById('js-sum-item').textContent     = _selectedItem.name;
    document.getElementById('js-sum-pkg').textContent      = cap(_selectedPkg);
    document.getElementById('js-sum-duration').textContent = PKG_DAYS[_selectedPkg];
    document.getElementById('js-sum-pay').textContent      = _payMethod === 'credits'
      ? `${cost} credit${cost !== 1 ? 's' : ''}`
      : 'Card payment';
    document.getElementById('js-sum-total').textContent    = _payMethod === 'credits'
      ? `${cost} credit${cost !== 1 ? 's' : ''}`
      : PKG_PRICE[_selectedPkg] + ' AUD';

    const confirmLabel = document.getElementById('js-s4-confirm-label');
    confirmLabel.textContent = _payMethod === 'credits' ? 'Confirm & use credits →' : 'Confirm & pay →';

    showScreen('ps-s4');
  });

  // ── Confirm ───────────────────────────────────────────
  document.getElementById('js-s4-confirm').addEventListener('click', async () => {
    const btn = document.getElementById('js-s4-confirm');
    const err = document.getElementById('js-s4-error');
    btn.disabled = true;
    btn.textContent = 'Processing…';
    err.style.display = 'none';

    try {
      if (_payMethod === 'credits') {
        await payWithCredits();
      } else {
        await payWithCard();
      }
    } catch (e) {
      err.textContent   = e.message || 'Something went wrong, please try again.';
      err.style.display = '';
      btn.disabled      = false;
      document.getElementById('js-s4-confirm-label').textContent =
        _payMethod === 'credits' ? 'Confirm & use credits →' : 'Confirm & pay →';
    }
  });

  async function payWithCard() {
    const { data: { session: coSess } } = await db.auth.getSession();
    const res = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${coSess?.access_token}`,
      },
      body: JSON.stringify({
        type:       _selectedPkg,
        bizId:      _bizId,
        userId:     user.id,
        itemType:   _selectedItem.type,
        itemId:     String(_selectedItem.id),
        successUrl: window.location.origin + '/business-dashboard.html?promoted=1',
        cancelUrl:  window.location.origin + '/promote.html?cancelled=1',
      }),
    });
    const data = await res.json();
    if (!data.url) throw new Error(data.error || 'Checkout creation failed');
    window.location.href = data.url;
  }

  async function payWithCredits() {
    const cost = CREDIT_COST[_selectedPkg];
    if (_credits < cost) throw new Error('Not enough credits');

    // Insert promotion row
    const { error: promoErr } = await db.from('promotions').insert({
      business_id:  _bizId,
      item_type:    _selectedItem.type,
      item_id:      String(_selectedItem.id),
      package:      _selectedPkg,
      status:       'pending',
      paid_amount:  0,
      credits_used: cost,
    });
    if (promoErr) throw new Error(promoErr.message);

    // Deduct credits from balance
    const newBalance = _credits - cost;
    const { error: bizErr } = await db
      .from('businesses')
      .update({ credit_balance: newBalance })
      .eq('id', _bizId);
    if (bizErr) throw new Error(bizErr.message);

    // Log to credit ledger
    await db.from('credit_ledger').insert({
      business_id: _bizId,
      amount:      -cost,
      reason:      `${_selectedPkg}_redeemed`,
    });

    // Redirect to dashboard to set up ad creative
    window.location.href = '/business-dashboard.html?promoted=1';
  }

  // ── Handle ?success=1 from Stripe redirect ────────────
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('success') === '1') {
    setProgress(100);
    showScreen('ps-done');
  }

  // ── Back button ───────────────────────────────────────
  document.getElementById('js-promo-back').addEventListener('click', goBack);

  // ── Init ──────────────────────────────────────────────
  await loadContent();

  function cap(str) { return str ? str[0].toUpperCase() + str.slice(1) : str; }
})();
