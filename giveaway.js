'use strict';
/* ── Giveaway page — dynamic, driven by giveaways table ──────────────────── */

(async function initGiveawayPage() {
  const root = document.getElementById('js-giveaway-root');
  if (!root) return;

  // ── Resolve slug from URL ──────────────────────────────────────────────────
  const path   = window.location.pathname; // /giveaway/slug
  const params = new URLSearchParams(window.location.search);
  const slug   = path.split('/').filter(Boolean).pop() ||
                 params.get('s') ||
                 params.get('id');

  if (!slug || slug === 'giveaway.html') {
    root.innerHTML = '<p style="padding:3rem 1rem;text-align:center">Giveaway not found.</p>';
    return;
  }

  // ── Fetch giveaway from DB ─────────────────────────────────────────────────
  let gw;
  try {
    const { data } = await db.from('giveaways')
      .select('*')
      .or(`slug.eq.${slug},id.eq.${slug}`)
      .eq('published', true)
      .single();
    gw = data;
  } catch (_) {}

  if (!gw) {
    root.innerHTML = '<p style="padding:3rem 1rem;text-align:center">Giveaway not found.</p>';
    return;
  }

  document.title = `${gw.title} — What To Do Geelong`;

  const isCompleted = gw.status === 'completed';
  const entryKey    = `wtdg_entered_${gw.id}`;
  const hasEntered  = !!localStorage.getItem(entryKey);

  function fmtDate(d) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-AU', { weekday:'short', day:'numeric', month:'short' });
  }

  // ── Fetch linked event ─────────────────────────────────────────────────────
  let linkedEvent = null;
  if (gw.linked_event_id) {
    try {
      const { data } = await db.from('events').select('id,title,slug,start_date,venue').eq('id', gw.linked_event_id).single();
      linkedEvent = data;
    } catch (_) {}
  }

  // ── RENDER ─────────────────────────────────────────────────────────────────
  root.innerHTML = `
    <div class="gw-hero${isCompleted ? ' gw-hero--completed' : ''}">
      ${gw.img ? `<div class="gw-hero__img-wrap"><img src="${gw.img}" class="gw-hero__img" alt="${gw.title}" /></div>` : ''}
      <div class="container">
        <div class="gw-hero__badge">${isCompleted ? '🏆 Competition Closed' : '🎁 Giveaway'}</div>
        <h1 class="gw-hero__title">${gw.title}</h1>
        ${gw.prize ? `<p class="gw-hero__sub"><strong>Prize:</strong> ${gw.prize}</p>` : ''}
        <div class="gw-hero__meta">
          ${linkedEvent ? `<span>🎟️ ${linkedEvent.title}</span>` : ''}
          ${linkedEvent?.start_date ? `<span>📅 ${fmtDate(linkedEvent.start_date)}</span>` : ''}
          ${linkedEvent?.venue ? `<span>📍 ${linkedEvent.venue}</span>` : ''}
          ${gw.age_restriction ? `<span>🔞 ${gw.age_restriction}</span>` : ''}
        </div>
        ${!isCompleted && gw.ends_at ? `<div class="gw-hero__closes">Entries close ${fmtDate(gw.ends_at)}</div>` : ''}
      </div>
    </div>

    <div class="container gw-main">

      ${gw.description ? `<div class="gw-description">${gw.description}</div>` : ''}

      ${isCompleted ? `
        <div class="gw-panel gw-panel--winners">
          <div class="gw-panel__icon">🏆</div>
          <h2 class="gw-panel__title">Competition Complete!</h2>
          <p class="gw-panel__sub">Thanks to everyone who entered. The winner${(gw.winner_names||'').includes(',') ? 's are' : ' is'}:</p>
          <div class="gw-winners-names">${gw.winner_names || 'To be announced'}</div>
          ${gw.winner_img ? `<img src="${gw.winner_img}" class="gw-winner-img" alt="Winners" />` : ''}
        </div>
      ` : hasEntered ? `
        <div class="gw-panel gw-panel--success" id="js-gw-entered">
          <div class="gw-panel__icon">🎉</div>
          <h2 class="gw-panel__title">You're already entered!</h2>
          <p class="gw-panel__sub">${gw.ends_at ? `We'll contact the winner after ${fmtDate(gw.ends_at)}.` : "We'll be in touch if you win."} Good luck!</p>
          <div class="gw-share-btns" style="margin-top:1rem">
            <button class="btn btn--teal" id="js-gw-share">🔗 Share this giveaway</button>
          </div>
        </div>
      ` : `
        <div class="gw-panel" id="js-gw-entry">
          ${gw.how_to_enter ? `
            <div class="gw-how-to-enter">
              <h3 class="gw-how-title"><span class="material-symbols-rounded">info</span> How to enter</h3>
              <div class="gw-how-body">${gw.how_to_enter}</div>
            </div>
          ` : ''}
          <div class="gw-panel__icon">🎟️</div>
          <h2 class="gw-panel__title">Register your interest</h2>
          <p class="gw-panel__sub">Enter your details below and we'll notify you of the winner.</p>
          <div class="gw-form">
            <input type="text"  id="gw-name"  placeholder="Your first name"   class="ob-input" />
            <input type="email" id="gw-email" placeholder="Your email address" class="ob-input" />
            <div class="gw-bonus">
              <input type="checkbox" id="gw-alerts" checked />
              <label for="gw-alerts">Send me event alerts and offers from WTDG</label>
            </div>
            <button class="ob-next" id="js-enter-btn">Enter the giveaway 🤞</button>
            <p class="ob-legal">Free to enter. One entry per person.${gw.age_restriction ? ' ' + gw.age_restriction + '.' : ''}</p>
          </div>
        </div>
      `}

      <!-- STAY IN THE LOOP -->
      <div class="gw-loop-section" id="js-gw-loop">
        <div class="gw-loop-inner">
          <h3 class="gw-loop-title">🔔 Never miss a giveaway</h3>
          <p class="gw-loop-sub">Join What To Do Geelong for early access to giveaways, local event alerts and members-only offers — it's free.</p>
          <div id="js-loop-form">
            <input type="email" id="loop-email" placeholder="Your email address" class="ob-input" style="margin-bottom:.6rem" />
            <button class="btn btn--teal btn--full" id="js-loop-submit">Join WTDG — it's free</button>
          </div>
          <div id="js-loop-password" hidden>
            <p style="margin:.5rem 0 .75rem;font-size:.9rem;color:#475569">Almost there — set a password to create your account.</p>
            <input type="password" id="loop-password" placeholder="Choose a password (8+ characters)" class="ob-input" style="margin-bottom:.6rem" />
            <button class="btn btn--teal btn--full" id="js-loop-create">Create my account</button>
          </div>
          <div id="js-loop-success" hidden style="text-align:center;padding:1.5rem 0">
            <div style="font-size:2.5rem;margin-bottom:.5rem">🎉</div>
            <strong style="font-size:1.1rem">You're in!</strong>
            <p style="margin:.4rem 0 0;color:#64748b;font-size:.9rem">Check your inbox to confirm your email.</p>
          </div>
        </div>
      </div>

    </div>

    <!-- MORE GIVEAWAYS -->
    <section class="page-section container" id="js-more-giveaways" style="display:none">
      <div class="section-header">
        <h2 class="section-title">More giveaways 🎁</h2>
      </div>
      <div class="offers-scroll" id="js-more-gw-strip"></div>
    </section>

    <div class="share-toast" id="js-gw-toast" hidden></div>
  `;

  // ── Entry form ─────────────────────────────────────────────────────────────
  if (!isCompleted && !hasEntered) {
    document.getElementById('js-enter-btn')?.addEventListener('click', async () => {
      const name   = document.getElementById('gw-name').value.trim();
      const email  = document.getElementById('gw-email').value.trim();
      const alerts = document.getElementById('gw-alerts').checked;
      if (!email) { styleError('gw-email'); return; }

      const btn = document.getElementById('js-enter-btn');
      btn.disabled = true; btn.textContent = 'Entering…';

      try {
        await db.from('giveaway_entries').insert({ giveaway_id: gw.id, name: name || null, email, wants_alerts: alerts });
      } catch (_) {}

      localStorage.setItem(entryKey, '1');

      // Pre-fill loop email
      const loopEl = document.getElementById('loop-email');
      if (loopEl && !loopEl.value) loopEl.value = email;

      document.getElementById('js-gw-entry').innerHTML = `
        <div class="gw-panel gw-panel--success">
          <div class="gw-panel__icon">🎉</div>
          <h2 class="gw-panel__title">You're entered!</h2>
          <p class="gw-panel__sub">${gw.ends_at ? `We'll contact the winner after ${fmtDate(gw.ends_at)}.` : "We'll be in touch if you win."} Good luck!</p>
          <div class="gw-share-btns" style="margin-top:1rem">
            <button class="btn btn--teal" id="js-gw-share">🔗 Share this giveaway</button>
          </div>
        </div>`;
      wireShare();
    });
  }

  // ── Share ──────────────────────────────────────────────────────────────────
  function wireShare() {
    document.getElementById('js-gw-share')?.addEventListener('click', () => {
      const url = window.location.href;
      if (navigator.share) {
        navigator.share({ title: gw.title, url });
      } else {
        navigator.clipboard.writeText(url).then(() => showToast('🔗 Link copied!'));
      }
    });
  }
  wireShare();

  // ── Loop signup ────────────────────────────────────────────────────────────
  let loopEmail = '';

  document.getElementById('js-loop-submit')?.addEventListener('click', async () => {
    const el = document.getElementById('loop-email');
    loopEmail = el.value.trim();
    if (!loopEmail) { styleError('loop-email'); return; }

    const btn = document.getElementById('js-loop-submit');
    btn.disabled = true; btn.textContent = 'Just a sec…';

    // Try magic link first (works if user exists already)
    try {
      const { error } = await db.auth.signInWithOtp({
        email: loopEmail,
        options: { shouldCreateUser: false }
      });
      if (!error) {
        document.getElementById('js-loop-form').hidden = true;
        document.getElementById('js-loop-success').hidden = false;
        document.getElementById('js-loop-success').innerHTML = `
          <div style="font-size:2.5rem;margin-bottom:.5rem">📬</div>
          <strong style="font-size:1.1rem">Check your inbox!</strong>
          <p style="margin:.4rem 0 0;color:#64748b;font-size:.9rem">We sent a sign-in link to ${loopEmail}.</p>`;
        return;
      }
    } catch (_) {}

    // New user — show password step
    btn.disabled = false;
    document.getElementById('js-loop-form').hidden = true;
    document.getElementById('js-loop-password').hidden = false;
    document.getElementById('loop-password').focus();
  });

  document.getElementById('js-loop-create')?.addEventListener('click', async () => {
    const pw  = document.getElementById('loop-password').value;
    if (pw.length < 8) { styleError('loop-password'); return; }

    const btn = document.getElementById('js-loop-create');
    btn.disabled = true; btn.textContent = 'Creating account…';

    try {
      const { error } = await db.auth.signUp({ email: loopEmail, password: pw });
      if (error) throw error;
      document.getElementById('js-loop-password').hidden = true;
      document.getElementById('js-loop-success').hidden  = false;
    } catch (err) {
      btn.disabled = false; btn.textContent = 'Create my account';
      alert(err.message || 'Something went wrong — please try again.');
    }
  });

  // ── More giveaways ─────────────────────────────────────────────────────────
  try {
    const { data: others } = await db.from('giveaways')
      .select('id,title,slug,prize,status,ends_at,img')
      .eq('published', true)
      .neq('id', gw.id)
      .order('created_at', { ascending: false })
      .limit(6);

    if (others?.length) {
      const gwUrl = g => window.IS_LOCAL ? `giveaway.html?s=${g.slug}` : `/giveaway/${g.slug}`;
      document.getElementById('js-more-gw-strip').innerHTML = others.map(g => {
        const closed = g.status === 'completed';
        return `<a href="${gwUrl(g)}" class="offer-card offer-card--giveaway${closed ? ' offer-card--closed' : ''}">
          <div class="offer-card__icon">${g.img ? `<img src="${g.img}" style="width:44px;height:44px;object-fit:cover;border-radius:.4rem">` : '🎁'}</div>
          <div class="offer-card__body">
            <span class="offer-card__tag offer-card__tag--giveaway">${closed ? '🏆 Completed' : '🎁 Giveaway'}</span>
            <span class="offer-card__title">${g.title}</span>
            ${g.prize ? `<span class="offer-card__sub">${g.prize}</span>` : ''}
          </div>
        </a>`;
      }).join('');
      document.getElementById('js-more-giveaways').style.display = '';
    }
  } catch (_) {}

  // ── Hide loop if already signed in ────────────────────────────────────────
  try {
    const { data: { session } } = await db.auth.getSession();
    if (session) document.getElementById('js-gw-loop').style.display = 'none';
  } catch (_) {}

  // ── Helpers ────────────────────────────────────────────────────────────────
  function styleError(id) {
    const el = document.getElementById(id);
    if (el) { el.style.borderColor = '#e76f51'; el.focus(); }
  }
  function showToast(msg) {
    const t = document.getElementById('js-gw-toast');
    if (!t) return;
    t.textContent = msg; t.hidden = false;
    setTimeout(() => { t.hidden = true; }, 3000);
  }
})();
