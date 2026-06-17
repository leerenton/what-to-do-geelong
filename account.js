'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await db.auth.getSession();
  let acct = getAccount();

  // If localStorage is missing but Supabase session exists, rebuild acct from session
  if (!acct && session) {
    const u = session.user;
    acct = { id: u.id, name: u.user_metadata?.name || u.email.split('@')[0], email: u.email };
    setAccount(acct);
  }

  if (!session && !acct) { window.location.href = 'login.html?next=account.html'; return; }

  let profiles = [];
  let digestEnabled = false;
  let citySubscriptions = {}; // slug → boolean
  let allSites = [];
  if (session) {
    try {
      const { data } = await db.from('businesses').select('*').eq('owner_id', session.user.id);
      profiles = data || [];
    } catch (_) {}
    try {
      const { data } = await db.from('email_preferences').select('weekly_digest').eq('user_id', session.user.id).maybeSingle();
      digestEnabled = data?.weekly_digest === true;
    } catch (_) {}
    try {
      const [subsRes, sitesRes] = await Promise.all([
        db.from('user_city_subscriptions').select('city, subscribed').eq('user_id', session.user.id),
        db.from('sites').select('slug, name, domain, site_mode').order('name'),
      ]);
      (subsRes.data || []).forEach(r => { citySubscriptions[r.city] = r.subscribed; });
      allSites = (sitesRes.data || []).filter(s => s.site_mode === 'active' || citySubscriptions[s.slug] !== undefined);
    } catch (_) {}
  }
  const saved     = JSON.parse(localStorage.getItem('wtdg_saved') || '[]');
  const prefs     = JSON.parse(localStorage.getItem('wtdg_prefs') || '{}');
  const entered   = JSON.parse(localStorage.getItem('wtdg_entered') || '[]');
  const initials  = (acct.name || 'A').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const joined    = acct.createdAt ? new Date(acct.createdAt).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' }) : 'Recently';
  const interestLabels = {
    music:'Music', food:'Food & Drink', arts:'Arts', outdoors:'Outdoors',
    fitness:'Fitness', family:'Kids & Family', theatre:'Theatre',
    markets:'Markets', pets:'Pet-friendly', free:'Free events', nightlife:'Nightlife', sport:'Sport',
  };

  const root = document.getElementById('js-account-root');
  root.innerHTML = `
    <!-- HERO -->
    <div class="acct-hero">
      <div class="container acct-hero__inner">
        <div class="acct-avatar-lg">${initials}</div>
        <div>
          <div class="acct-hero__name">${acct.name || 'Geelong Explorer'}</div>
          <div class="acct-hero__email">${acct.email}</div>
          <div class="acct-hero__since">Member since ${joined}</div>
        </div>
      </div>
    </div>

    <div class="container">

      <!-- STATS -->
      <div class="acct-section">
        <div class="acct-stat-row">
          <div class="acct-stat">
            <div class="acct-stat__num">${saved.length}</div>
            <div class="acct-stat__label">Saved items</div>
          </div>
          <div class="acct-stat">
            <div class="acct-stat__num">${entered.length}</div>
            <div class="acct-stat__label">Competitions</div>
          </div>
          <div class="acct-stat">
            <div class="acct-stat__num">${profiles.length}</div>
            <div class="acct-stat__label">Businesses</div>
          </div>
        </div>
      </div>

      <!-- MY BUSINESSES -->
      <div class="acct-section">
        <div class="acct-section-title"><span class="material-symbols-rounded">store</span> My Businesses</div>
        ${profiles.length ? `
          <div class="acct-biz-list" id="js-biz-list">
            ${profiles.map(b => `
              <a href="business-dashboard.html?biz=${b.id}" class="acct-biz-card">
                <div class="acct-biz-card__icon" style="background:${b.color || 'var(--cream)'}22">${b.emoji || '🏪'}</div>
                <div>
                  <div class="acct-biz-card__name">${b.name}</div>
                  <div class="acct-biz-card__meta">${b.type || ''} · ${b.suburb || ''}</div>
                </div>
                <span class="acct-biz-card__plan acct-biz-card__plan--${b.is_gold ? 'gold' : (b.plan || 'free')}">${b.is_gold ? '⭐ Gold' : (b.plan === 'featured' ? '⭐ Featured' : 'Free')}</span>
              </a>
            `).join('')}
          </div>
          <a href="business-signup.html" class="btn btn--outline btn--full" style="margin-top:.85rem">
            <span class="material-symbols-rounded" style="font-size:1rem">add</span> Add another business
          </a>
        ` : `
          <p style="color:var(--mid);font-size:.9rem;margin-bottom:.85rem">No businesses yet. List your venue, café, or event on WTDG.</p>
          <a href="business-signup.html" class="btn btn--teal btn--full">List a business →</a>
        `}
      </div>

      <!-- MY INTERESTS -->
      ${prefs.interests?.length ? `
        <div class="acct-section">
          <div class="acct-section-title"><span class="material-symbols-rounded">favorite</span> My Interests</div>
          <div class="acct-prefs">
            ${prefs.interests.map(i => `<span class="acct-pref-chip">${interestLabels[i] || i}</span>`).join('')}
          </div>
          <a href="onboarding.html" style="display:block;margin-top:.75rem;font-size:.82rem;color:var(--teal);font-weight:600">Update preferences →</a>
        </div>
      ` : ''}

      <!-- EMAIL SUBSCRIPTIONS -->
      ${session ? `
        <div class="acct-section" id="js-digest-section">
          <div class="acct-section-title"><span class="material-symbols-rounded">mail</span> Email Subscriptions</div>
          <p style="font-size:.88rem;color:var(--mid);margin:0 0 1rem;line-height:1.55">Choose which cities you'd like to receive weekly emails for.</p>
          <div id="js-city-subs">
            ${allSites.length ? allSites.map(site => {
              const subbed = citySubscriptions[site.slug] === true;
              const isCurrent = site.slug === (window.SITE?.slug || 'geelong');
              return `
              <div class="digest-toggle-row" style="margin-bottom:.65rem;justify-content:space-between">
                <span style="font-size:.9rem;font-weight:600;display:flex;align-items:center;gap:.4rem">
                  ${site.name}
                  ${isCurrent ? '<span style="font-size:.68rem;background:#e0f2fe;color:#0369a1;padding:.1rem .4rem;border-radius:4px;font-weight:700">This city</span>' : ''}
                </span>
                <label class="digest-toggle-wrap" style="cursor:pointer" title="Toggle ${site.name} emails">
                  <input type="checkbox" class="js-city-sub-check" data-city="${site.slug}" ${subbed ? 'checked' : ''} style="position:absolute;opacity:0;width:0;height:0" />
                  <span class="digest-toggle-track"><span class="digest-toggle-thumb"></span></span>
                </label>
              </div>`;
            }).join('') : '<p style="font-size:.85rem;color:var(--mid)">No cities available yet.</p>'}
          </div>
          <p id="js-digest-status" style="font-size:.8rem;color:var(--teal);margin:.5rem 0 0;min-height:1.2em"></p>
        </div>
      ` : ''}

      <!-- QUICK LINKS -->
      <div class="acct-section">
        <div class="acct-section-title"><span class="material-symbols-rounded">settings</span> Account</div>
        <div class="acct-menu-list">
          <a href="guides.html" class="acct-menu-item">
            <span class="material-symbols-rounded">star</span> My itinerary
            <span class="material-symbols-rounded acct-menu-item__arrow">chevron_right</span>
          </a>
          <a href="onboarding.html" class="acct-menu-item">
            <span class="material-symbols-rounded">tune</span> My preferences
            <span class="material-symbols-rounded acct-menu-item__arrow">chevron_right</span>
          </a>
          <button class="acct-menu-item acct-menu-item--danger" id="js-logout-btn">
            <span class="material-symbols-rounded">logout</span> Log out
          </button>
        </div>
      </div>

    </div>
  `;

  document.getElementById('js-logout-btn')?.addEventListener('click', logout);

  // ── City email subscription toggles ─────────────────────
  const digestStatus = document.getElementById('js-digest-status');

  if (session) {
    document.querySelectorAll('.js-city-sub-check').forEach(checkbox => {
      checkbox.addEventListener('change', async () => {
        const city    = checkbox.dataset.city;
        const enabled = checkbox.checked;
        checkbox.disabled = true;
        if (digestStatus) digestStatus.textContent = 'Saving…';

        const { error } = await db.from('user_city_subscriptions').upsert(
          { user_id: session.user.id, city, subscribed: enabled },
          { onConflict: 'user_id,city' }
        );

        checkbox.disabled = false;
        if (error) {
          checkbox.checked = !enabled; // revert
          if (digestStatus) digestStatus.textContent = 'Something went wrong. Please try again.';
        } else {
          if (digestStatus) digestStatus.textContent = enabled
            ? `Subscribed to ${allSites.find(s => s.slug === city)?.name || city} emails ✅`
            : `Unsubscribed from ${allSites.find(s => s.slug === city)?.name || city} emails`;
          setTimeout(() => { if (digestStatus) digestStatus.textContent = ''; }, 3000);
        }
      });
    });
  }
});
