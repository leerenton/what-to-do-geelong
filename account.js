'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await db.auth.getSession();
  const acct = getAccount();
  if (!session && !acct) { window.location.href = 'login.html?next=account.html'; return; }

  let profiles = [];
  let digestEnabled = false;
  if (session) {
    try {
      const { data } = await db.from('businesses').select('*').eq('owner_id', session.user.id);
      profiles = data || [];
    } catch (_) {}
    try {
      const { data } = await db.from('email_preferences').select('weekly_digest').eq('user_id', session.user.id).maybeSingle();
      digestEnabled = data?.weekly_digest === true;
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
              <a href="business-dashboard.html" class="acct-biz-card" onclick="setCurrentBizId('${b.id}')">
                <div class="acct-biz-card__icon" style="background:${b.color || 'var(--cream)'}22">${b.emoji || '🏪'}</div>
                <div>
                  <div class="acct-biz-card__name">${b.name}</div>
                  <div class="acct-biz-card__meta">${b.type || ''} · ${b.suburb || ''}</div>
                </div>
                <span class="acct-biz-card__plan acct-biz-card__plan--${b.plan}">${b.plan === 'featured' ? '⭐ Featured' : 'Free'}</span>
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

      <!-- EMAIL DIGEST -->
      ${session ? `
        <div class="acct-section" id="js-digest-section">
          <div class="acct-section-title"><span class="material-symbols-rounded">mail</span> Weekly Digest</div>
          <p style="font-size:.88rem;color:var(--mid);margin:0 0 1rem;line-height:1.55">Get a personalised roundup of what's on in Geelong every Sunday morning — tailored to what you've been exploring.</p>
          <label class="digest-toggle-row" id="js-digest-label">
            <span class="digest-toggle-wrap">
              <input type="checkbox" id="js-digest-check" ${digestEnabled ? 'checked' : ''} />
              <span class="digest-toggle-track"><span class="digest-toggle-thumb"></span></span>
            </span>
            <span class="digest-toggle-text">${digestEnabled ? 'Weekly digest enabled ✅' : 'Subscribe to weekly digest'}</span>
          </label>
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

  // ── Email digest toggle ───────────────────────────────────
  const digestCheck = document.getElementById('js-digest-check');
  const digestStatus = document.getElementById('js-digest-status');
  const digestLabel = document.getElementById('js-digest-label');

  if (digestCheck && session) {
    digestCheck.addEventListener('change', async () => {
      const enabled = digestCheck.checked;
      digestLabel.style.pointerEvents = 'none';
      digestStatus.textContent = 'Saving…';

      try {
        const res = await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: session.user.id,
            email: session.user.email,
            weekly_digest: enabled,
          }),
        });
        if (res.ok) {
          digestStatus.textContent = enabled ? 'You\'re subscribed! Look out for Sundays. ✅' : 'Unsubscribed. You won\'t receive the digest.';
          digestCheck.closest('label').querySelector('.digest-toggle-text').textContent =
            enabled ? 'Weekly digest enabled ✅' : 'Subscribe to weekly digest';
        } else {
          const err = await res.json().catch(() => ({}));
          digestStatus.textContent = 'Something went wrong. Please try again.';
          digestCheck.checked = !enabled; // revert
          console.error('Digest toggle error:', err);
        }
      } catch (e) {
        digestStatus.textContent = 'Network error. Please try again.';
        digestCheck.checked = !enabled;
      }

      digestLabel.style.pointerEvents = '';
      setTimeout(() => { if (digestStatus) digestStatus.textContent = ''; }, 4000);
    });
  }
});
