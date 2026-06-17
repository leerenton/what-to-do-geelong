'use strict';
/* ── City Switcher ────────────────────────────────────────────────────────────
   Renders a modal/panel listing all active cities.
   Each city shows:
     - Name + current site badge if active
     - Link to visit
     - Email subscription toggle (requires logged-in user)

   Usage: call openCitySwitcher() from a nav button.
   ─────────────────────────────────────────────────────────────────────────── */

(function () {

  let _sites    = null;
  let _userSubs = null; // Set of city slugs the user is subscribed to
  let _userId   = null;

  // ── Load data ─────────────────────────────────────────────
  async function loadData() {
    // Load all active sites
    const { data: sites } = await db.from('sites').select('slug, name, domain, site_mode').order('name');
    _sites = (sites || []).filter(s => s.site_mode === 'active' || s.slug === (window.SITE?.slug));

    // Load user subscriptions if logged in
    const { data: { session } } = await db.auth.getSession();
    if (session?.user) {
      _userId = session.user.id;
      const { data: subs } = await db
        .from('user_city_subscriptions')
        .select('city, subscribed')
        .eq('user_id', _userId);
      _userSubs = new Set((subs || []).filter(s => s.subscribed).map(s => s.city));
    }
  }

  // ── Toggle subscription for a city ────────────────────────
  async function toggleSubscription(city, btn) {
    if (!_userId) {
      window.location.href = '/login.html?next=' + encodeURIComponent(window.location.pathname);
      return;
    }

    const nowSubscribed = _userSubs?.has(city);
    const newState = !nowSubscribed;

    btn.disabled = true;
    btn.textContent = '…';

    const { error } = await db.from('user_city_subscriptions').upsert(
      { user_id: _userId, city, subscribed: newState },
      { onConflict: 'user_id,city' }
    );

    if (error) {
      btn.disabled = false;
      btn.textContent = nowSubscribed ? '✅' : '○';
      return;
    }

    if (newState) { _userSubs.add(city); } else { _userSubs.delete(city); }
    renderBtn(btn, city, newState);
  }

  function renderBtn(btn, city, subscribed) {
    btn.disabled = false;
    if (subscribed) {
      btn.textContent = '✅ Subscribed';
      btn.style.cssText = 'background:#d1fae5;color:#065f46;border:1px solid #6ee7b7;border-radius:6px;padding:.25rem .65rem;font-size:.75rem;font-weight:600;cursor:pointer;';
    } else {
      btn.textContent = '+ Subscribe';
      btn.style.cssText = 'background:#f1f5f9;color:#475569;border:1px solid #cbd5e1;border-radius:6px;padding:.25rem .65rem;font-size:.75rem;font-weight:600;cursor:pointer;';
    }
    btn.onclick = () => toggleSubscription(city, btn);
  }

  // ── Render modal ───────────────────────────────────────────
  function renderModal() {
    const currentCity = window.SITE?.slug || 'geelong';

    const items = _sites.map(site => {
      const isCurrent = site.slug === currentCity;
      const isSubbed  = _userSubs?.has(site.slug) ?? false;
      const domain    = site.domain || `whattodo${site.slug}.com.au`;

      return `
        <div class="cs-city" data-city="${site.slug}" style="
          display:flex; align-items:center; gap:1rem;
          padding:.9rem 1rem; border-bottom:1px solid #f1f5f9;
        ">
          <div style="flex:1; min-width:0">
            <div style="font-weight:600; font-size:.9rem; display:flex; align-items:center; gap:.5rem">
              ${site.name}
              ${isCurrent ? '<span style="background:#e0f2fe;color:#0369a1;font-size:.68rem;font-weight:700;padding:.1rem .4rem;border-radius:4px;">YOU\'RE HERE</span>' : ''}
            </div>
            <a href="https://${domain}" style="font-size:.78rem;color:#64748b;text-decoration:none;" target="${isCurrent ? '_self' : '_blank'}">
              ${domain}
            </a>
          </div>
          <button class="cs-sub-btn" data-city="${site.slug}" data-subbed="${isSubbed}"></button>
        </div>`;
    }).join('');

    const loggedIn = !!_userId;

    return `
      <div id="cs-overlay" style="
        position:fixed;inset:0;z-index:100000;
        background:rgba(0,0,0,.45);backdrop-filter:blur(2px);
        display:flex;align-items:flex-end;justify-content:center;
      ">
        <div id="cs-panel" style="
          background:#fff;border-radius:1rem 1rem 0 0;
          width:100%;max-width:480px;
          max-height:80vh;overflow-y:auto;
          box-shadow:0 -4px 32px rgba(0,0,0,.15);
          font-family:-apple-system,BlinkMacSystemFont,'DM Sans',sans-serif;
        ">
          <div style="padding:1rem 1rem .5rem;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #f1f5f9;">
            <div>
              <div style="font-weight:700;font-size:1rem">Switch City</div>
              ${loggedIn
                ? '<div style="font-size:.75rem;color:#64748b;margin-top:.15rem">Toggle to get weekly emails for each city</div>'
                : '<div style="font-size:.75rem;color:#64748b;margin-top:.15rem"><a href="/login.html" style="color:#0d9488">Sign in</a> to manage email subscriptions</div>'
              }
            </div>
            <button id="cs-close" style="background:none;border:none;font-size:1.2rem;cursor:pointer;color:#64748b;padding:.25rem;">✕</button>
          </div>
          <div id="cs-cities">${items}</div>
        </div>
      </div>`;
  }

  // ── Open the switcher ──────────────────────────────────────
  async function openCitySwitcher() {
    // Show loading overlay immediately
    const loading = document.createElement('div');
    loading.id = 'cs-loading';
    loading.style.cssText = 'position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;';
    loading.innerHTML = '<div style="background:#fff;border-radius:.75rem;padding:1.5rem 2rem;font-size:.9rem;font-weight:600;">Loading cities…</div>';
    document.body.appendChild(loading);

    await loadData();
    loading.remove();

    const wrapper = document.createElement('div');
    wrapper.innerHTML = renderModal();
    document.body.appendChild(wrapper);

    // Wire up subscription buttons
    wrapper.querySelectorAll('.cs-sub-btn').forEach(btn => {
      const city    = btn.dataset.city;
      const subbed  = btn.dataset.subbed === 'true';
      renderBtn(btn, city, subbed);
    });

    // Close handlers
    const close = () => wrapper.remove();
    document.getElementById('cs-close').addEventListener('click', close);
    document.getElementById('cs-overlay').addEventListener('click', e => {
      if (e.target.id === 'cs-overlay') close();
    });
  }

  window.openCitySwitcher = openCitySwitcher;

})();
