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
  let promoterEvents = [];
  let digestEnabled = false;
  let citySubscriptions = {}; // slug → boolean
  let allSites = [];
  if (session) {
    try {
      if (window._siteConfigPromise) await window._siteConfigPromise;
      const citySlug = window.SITE?.slug || 'geelong';
      const [bizRes, evRes] = await Promise.all([
        db.from('businesses').select('*').eq('owner_id', session.user.id).eq('city', citySlug),
        db.from('events').select('id,title,date,time,start_date,status,category').eq('promoter_id', session.user.id).order('start_date', { ascending: true }),
      ]);
      profiles       = bizRes.data || [];
      promoterEvents = evRes.data  || [];
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

      <!-- MY EVENTS (promoters) -->
      ${promoterEvents.length ? `
        <div class="acct-section">
          <div class="acct-section-title"><span class="material-symbols-rounded">confirmation_number</span> My Events</div>
          <div class="acct-biz-list" id="js-promoter-event-list">
            ${promoterEvents.map(ev => {
              const statusBadge = ev.status === 'approved'
                ? `<span class="acct-biz-card__plan acct-biz-card__plan--gold">✓ Live</span>`
                : `<span class="acct-biz-card__plan acct-biz-card__plan--free">Pending review</span>`;
              const dateStr = ev.start_date
                ? new Date(ev.start_date).toLocaleDateString('en-AU', { weekday:'short', day:'numeric', month:'short', year:'numeric' })
                : (ev.date || '');
              return `
                <div class="acct-biz-card" style="flex-wrap:wrap;gap:.5rem">
                  <div class="acct-biz-card__icon" style="background:var(--teal-lt)">🎪</div>
                  <div style="flex:1;min-width:0">
                    <div class="acct-biz-card__name">${ev.title}</div>
                    <div class="acct-biz-card__meta">${ev.category || ''} · ${dateStr}</div>
                  </div>
                  ${statusBadge}
                  <div style="display:flex;gap:.4rem;width:100%;margin-top:.1rem">
                    <button class="btn btn--outline btn--sm js-ev-edit-btn" data-id="${ev.id}" style="font-size:.75rem;padding:.25rem .65rem">
                      <span class="material-symbols-rounded" style="font-size:.9rem">edit</span> Edit
                    </button>
                    <a href="promote-event.html?ev=${ev.id}" class="btn btn--teal btn--sm" style="font-size:.75rem;padding:.25rem .65rem">
                      <span class="material-symbols-rounded" style="font-size:.9rem">rocket_launch</span> Boost
                    </a>
                  </div>
                </div>`;
            }).join('')}
          </div>
          <a href="onboard.html?path=promoter" class="btn btn--outline btn--full" style="margin-top:.85rem">
            <span class="material-symbols-rounded" style="font-size:1rem">add</span> Submit another event
          </a>
        </div>

        <!-- Event edit drawer -->
        <div id="js-ev-edit-drawer" style="display:none;position:fixed;inset:0;z-index:900;background:rgba(0,0,0,.55);align-items:flex-end;justify-content:center">
          <div style="background:#fff;width:100%;max-width:540px;border-radius:16px 16px 0 0;padding:1.5rem 1.25rem 2rem;max-height:90vh;overflow-y:auto">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem">
              <h2 style="font-family:var(--font-head);font-size:1.1rem;font-weight:900;margin:0">Edit event</h2>
              <button id="js-ev-edit-close" style="background:none;border:none;font-size:1.4rem;cursor:pointer;color:var(--mid)">✕</button>
            </div>
            <input type="hidden" id="js-eef-id" />
            <div style="display:flex;flex-direction:column;gap:.85rem">
              <div>
                <label style="font-size:.8rem;font-weight:700;display:block;margin-bottom:.3rem">Event name *</label>
                <input id="js-eef-title" type="text" style="width:100%;border:1.5px solid var(--border);border-radius:10px;padding:.6rem .85rem;font-size:.95rem;font-family:var(--font-body)" />
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:.65rem">
                <div>
                  <label style="font-size:.8rem;font-weight:700;display:block;margin-bottom:.3rem">Start date &amp; time *</label>
                  <input id="js-eef-start" type="datetime-local" style="width:100%;border:1.5px solid var(--border);border-radius:10px;padding:.6rem .85rem;font-size:.9rem;font-family:var(--font-body)" />
                </div>
                <div>
                  <label style="font-size:.8rem;font-weight:700;display:block;margin-bottom:.3rem">End (optional)</label>
                  <input id="js-eef-end" type="datetime-local" style="width:100%;border:1.5px solid var(--border);border-radius:10px;padding:.6rem .85rem;font-size:.9rem;font-family:var(--font-body)" />
                </div>
              </div>
              <div>
                <label style="font-size:.8rem;font-weight:700;display:block;margin-bottom:.3rem">Venue / location *</label>
                <input id="js-eef-location" type="text" style="width:100%;border:1.5px solid var(--border);border-radius:10px;padding:.6rem .85rem;font-size:.95rem;font-family:var(--font-body)" />
              </div>
              <div>
                <label style="font-size:.8rem;font-weight:700;display:block;margin-bottom:.3rem">Tickets / event URL</label>
                <input id="js-eef-url" type="url" style="width:100%;border:1.5px solid var(--border);border-radius:10px;padding:.6rem .85rem;font-size:.95rem;font-family:var(--font-body)" placeholder="https://…" />
              </div>
              <div>
                <label style="font-size:.8rem;font-weight:700;display:block;margin-bottom:.3rem">Description</label>
                <textarea id="js-eef-desc" rows="3" style="width:100%;border:1.5px solid var(--border);border-radius:10px;padding:.6rem .85rem;font-size:.9rem;font-family:var(--font-body);resize:vertical"></textarea>
              </div>
            </div>
            <div id="js-eef-error" style="color:#e76f51;font-size:.82rem;margin-top:.75rem;display:none"></div>
            <div style="display:flex;gap:.65rem;margin-top:1.25rem">
              <button id="js-eef-save" class="btn btn--teal" style="flex:1">Save changes</button>
              <button id="js-eef-delete" class="btn btn--outline" style="color:#e76f51;border-color:#e76f51">Delete</button>
            </div>
          </div>
        </div>
      ` : ''}

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
          <div style="display:flex;gap:.65rem;margin-top:.85rem;flex-wrap:wrap">
            <a href="onboard.html?path=business" class="btn btn--outline btn--sm">
              <span class="material-symbols-rounded" style="font-size:1rem">add</span> Add another listing
            </a>
            <a href="onboard.html?path=promoter" class="btn btn--outline btn--sm">
              <span class="material-symbols-rounded" style="font-size:1rem">confirmation_number</span> Promote an event
            </a>
          </div>
        ` : `
          <p style="color:var(--mid);font-size:.9rem;margin-bottom:.85rem">No businesses yet. List your venue, café, or community group on WTDG.</p>
          <div style="display:flex;flex-direction:column;gap:.5rem">
            <a href="onboard.html?path=business" class="btn btn--teal btn--full">List a business →</a>
            <a href="onboard.html?path=promoter" class="btn btn--outline btn--full">Promote an event →</a>
            <a href="onboard.html?path=community" class="btn btn--outline btn--full">List a community group →</a>
          </div>
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
          <button class="acct-menu-item" id="js-reset-pw-btn">
            <span class="material-symbols-rounded">lock_reset</span> Change password
            <span class="material-symbols-rounded acct-menu-item__arrow">chevron_right</span>
          </button>
          <button class="acct-menu-item acct-menu-item--danger" id="js-logout-btn">
            <span class="material-symbols-rounded">logout</span> Log out
          </button>
        </div>
      </div>

    </div>
  `;

  document.getElementById('js-logout-btn')?.addEventListener('click', logout);

  // ── Promoter event edit drawer ────────────────────────────
  const editDrawer = document.getElementById('js-ev-edit-drawer');
  if (editDrawer) {
    // Open drawer when Edit button clicked
    document.querySelectorAll('.js-ev-edit-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const evId = btn.dataset.id;
        const { data: ev } = await db.from('events').select('*').eq('id', evId).single();
        if (!ev) return;
        document.getElementById('js-eef-id').value       = ev.id;
        document.getElementById('js-eef-title').value    = ev.title || '';
        document.getElementById('js-eef-location').value = ev.location || '';
        document.getElementById('js-eef-url').value      = ev.url || '';
        document.getElementById('js-eef-desc').value     = ev.description || '';
        // Format ISO dates back to datetime-local value (YYYY-MM-DDTHH:MM)
        const toLocal = iso => iso ? iso.slice(0, 16) : '';
        document.getElementById('js-eef-start').value = toLocal(ev.start_date);
        document.getElementById('js-eef-end').value   = toLocal(ev.end_date);
        document.getElementById('js-eef-error').style.display = 'none';
        editDrawer.style.display = 'flex';
      });
    });

    // Close
    document.getElementById('js-ev-edit-close').addEventListener('click', () => {
      editDrawer.style.display = 'none';
    });
    editDrawer.addEventListener('click', e => {
      if (e.target === editDrawer) editDrawer.style.display = 'none';
    });

    // Save
    document.getElementById('js-eef-save').addEventListener('click', async () => {
      const evId    = document.getElementById('js-eef-id').value;
      const title   = document.getElementById('js-eef-title').value.trim();
      const startRaw = document.getElementById('js-eef-start').value;
      const endRaw   = document.getElementById('js-eef-end').value;
      const errEl   = document.getElementById('js-eef-error');
      if (!title || !startRaw) { errEl.textContent = 'Title and start date are required.'; errEl.style.display = 'block'; return; }

      const startDt = new Date(startRaw);
      const endDt   = endRaw ? new Date(endRaw) : null;
      const fmtDate = dt => dt.toLocaleDateString('en-AU', { weekday:'short', day:'numeric', month:'short', year:'numeric' });
      const fmtTime = dt => dt.toLocaleTimeString('en-AU', { hour:'numeric', minute:'2-digit', hour12:true });
      const dateDisplay = endDt && fmtDate(endDt) !== fmtDate(startDt)
        ? `${fmtDate(startDt)} – ${fmtDate(endDt)}`
        : fmtDate(startDt);

      const saveBtn = document.getElementById('js-eef-save');
      saveBtn.disabled = true; saveBtn.textContent = 'Saving…';

      const { error } = await db.from('events').update({
        title,
        start_date:  startDt.toISOString(),
        end_date:    endDt ? endDt.toISOString() : null,
        date:        dateDisplay,
        time:        fmtTime(startDt),
        location:    document.getElementById('js-eef-location').value.trim() || null,
        url:         document.getElementById('js-eef-url').value.trim() || null,
        description: document.getElementById('js-eef-desc').value.trim() || null,
      }).eq('id', evId);

      saveBtn.disabled = false; saveBtn.textContent = 'Save changes';

      if (error) { errEl.textContent = error.message; errEl.style.display = 'block'; return; }
      editDrawer.style.display = 'none';
      // Refresh the page so the list reflects any title/date change
      window.location.reload();
    });

    // Delete
    document.getElementById('js-eef-delete').addEventListener('click', async () => {
      if (!confirm('Delete this event? This cannot be undone.')) return;
      const evId = document.getElementById('js-eef-id').value;
      const deleteBtn = document.getElementById('js-eef-delete');
      deleteBtn.disabled = true; deleteBtn.textContent = 'Deleting…';
      const { error } = await db.from('events').delete().eq('id', evId);
      if (error) { deleteBtn.disabled = false; deleteBtn.textContent = 'Delete'; alert(error.message); return; }
      editDrawer.style.display = 'none';
      window.location.reload();
    });
  }

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

  // ── Change password ───────────────────────────────────────
  document.getElementById('js-reset-pw-btn')?.addEventListener('click', () => {
    // Build modal
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.45);display:flex;align-items:flex-end;justify-content:center;';
    overlay.innerHTML = `
      <div style="background:#fff;border-radius:1rem 1rem 0 0;width:100%;max-width:440px;padding:1.5rem;font-family:-apple-system,BlinkMacSystemFont,'DM Sans',sans-serif;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem">
          <h3 style="margin:0;font-size:1rem;font-weight:700">Change password</h3>
          <button id="js-pw-modal-close" style="background:none;border:none;font-size:1.2rem;cursor:pointer;color:#64748b">✕</button>
        </div>
        <div style="margin-bottom:1rem">
          <label style="font-size:.8rem;font-weight:600;color:#475569;display:block;margin-bottom:.35rem">New password</label>
          <input id="js-pw-new" type="password" placeholder="At least 8 characters" style="width:100%;box-sizing:border-box;padding:.65rem .75rem;border:1px solid #e2e8f0;border-radius:.5rem;font-size:.9rem;" />
        </div>
        <div style="margin-bottom:1.25rem">
          <label style="font-size:.8rem;font-weight:600;color:#475569;display:block;margin-bottom:.35rem">Confirm password</label>
          <input id="js-pw-confirm" type="password" placeholder="Repeat new password" style="width:100%;box-sizing:border-box;padding:.65rem .75rem;border:1px solid #e2e8f0;border-radius:.5rem;font-size:.9rem;" />
        </div>
        <p id="js-pw-error" style="font-size:.8rem;color:#ef4444;margin:0 0 .75rem;min-height:1.1em"></p>
        <button id="js-pw-save" style="width:100%;padding:.75rem;background:var(--teal,#0d9488);color:#fff;border:none;border-radius:.5rem;font-size:.95rem;font-weight:700;cursor:pointer;">Update password</button>
      </div>`;
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    document.getElementById('js-pw-modal-close').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    document.getElementById('js-pw-save').addEventListener('click', async () => {
      const newPw  = document.getElementById('js-pw-new').value;
      const confPw = document.getElementById('js-pw-confirm').value;
      const errEl  = document.getElementById('js-pw-error');
      const saveBtn = document.getElementById('js-pw-save');

      errEl.textContent = '';
      if (newPw.length < 8)       { errEl.textContent = 'Password must be at least 8 characters.'; return; }
      if (newPw !== confPw)        { errEl.textContent = 'Passwords don\'t match.'; return; }

      saveBtn.disabled = true;
      saveBtn.textContent = 'Updating…';

      const { error } = await db.auth.updateUser({ password: newPw });

      if (error) {
        errEl.textContent = error.message || 'Something went wrong. Please try again.';
        saveBtn.disabled = false;
        saveBtn.textContent = 'Update password';
      } else {
        overlay.innerHTML = `
          <div style="background:#fff;border-radius:1rem 1rem 0 0;width:100%;max-width:440px;padding:2rem 1.5rem;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'DM Sans',sans-serif;">
            <div style="font-size:2.5rem;margin-bottom:.75rem">✅</div>
            <h3 style="margin:0 0 .5rem;font-size:1rem;font-weight:700">Password updated</h3>
            <p style="font-size:.85rem;color:#64748b;margin:0 0 1.25rem">You're all set. Use your new password next time you log in.</p>
            <button id="js-pw-done" style="padding:.65rem 1.5rem;background:var(--teal,#0d9488);color:#fff;border:none;border-radius:.5rem;font-size:.9rem;font-weight:700;cursor:pointer;">Done</button>
          </div>`;
        document.getElementById('js-pw-done').addEventListener('click', close);
      }
    });
  });
});
