'use strict';
/* ── Super-admin floating edit button ───────────────────────────────────────
   Shown only when the logged-in Supabase user is in ADMIN_EMAILS.
   Injects a fixed pencil FAB bottom-right; on click opens a contextual drawer
   with links to edit the current page's record in the admin panel.
   ──────────────────────────────────────────────────────────────────────────── */

const FAB_ADMIN_EMAILS = ['lee.renton81@gmail.com', 'adele@whattodogeelong.com.au'];

async function initEditFab() {
  // Wait for Supabase to be available
  if (typeof db === 'undefined') return;

  let session;
  try {
    const { data } = await db.auth.getSession();
    session = data?.session;
  } catch (_) { return; }

  if (!session) return;
  const email = session.user?.email;
  if (!FAB_ADMIN_EMAILS.includes(email)) return;

  // ── Work out context from current URL ────────────────────────────────────
  const path = window.location.pathname; // e.g. /venue-name, /events/venue-event
  const params = new URLSearchParams(window.location.search);
  const slugFromPath = path.replace(/^\/+|\/+$/g, ''); // strip leading/trailing slashes

  // Detect page type
  let context = null;

  // Event page: /events/:slug or /:biz/:item  (Vercel rewrites → event.html)
  const eventSlugMatch = path.match(/^\/events\/(.+)$/) || path.match(/^\/([^/]+)\/([^/]+)$/);
  const isEventHtml = window.location.pathname === '/event.html' || document.getElementById('js-event-root') !== null;
  // listing page: /:slug → listing.html (single segment, no subpath)
  const isListingHtml = window.location.pathname === '/listing.html' || document.getElementById('js-listing-root') !== null;

  if (isEventHtml || (eventSlugMatch && document.getElementById('js-event-root'))) {
    // Try to get event ID from page state (app.js sets window._currentEvent)
    context = { type: 'event' };
  } else if (isListingHtml || (slugFromPath && !slugFromPath.includes('/') && document.querySelector('.listing-hero, #js-listing-root'))) {
    context = { type: 'business' };
  }

  // ── Inject FAB ───────────────────────────────────────────────────────────
  const fab = document.createElement('button');
  fab.id = 'js-edit-fab';
  fab.setAttribute('aria-label', 'Admin edit');
  fab.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
  fab.style.cssText = `
    position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 9990;
    width: 48px; height: 48px; border-radius: 50%;
    background: #2ab4a0; color: #fff; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 20px rgba(42,180,160,.5);
    transition: transform .15s, box-shadow .15s;
  `;
  fab.addEventListener('mouseenter', () => { fab.style.transform = 'scale(1.08)'; fab.style.boxShadow = '0 6px 28px rgba(42,180,160,.65)'; });
  fab.addEventListener('mouseleave', () => { fab.style.transform = ''; fab.style.boxShadow = '0 4px 20px rgba(42,180,160,.5)'; });
  document.body.appendChild(fab);

  // ── Inject Drawer + Overlay ───────────────────────────────────────────────
  const overlay = document.createElement('div');
  overlay.id = 'js-edit-fab-overlay';
  overlay.style.cssText = `
    position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 9991;
    opacity: 0; pointer-events: none; transition: opacity .22s;
  `;

  const drawer = document.createElement('div');
  drawer.id = 'js-edit-fab-drawer';
  drawer.style.cssText = `
    position: fixed; top: 0; right: -110%; width: min(360px, 100vw);
    height: 100vh; background: #0f172a; border-left: 1px solid #334155;
    z-index: 9992; overflow-y: auto; transition: right .25s cubic-bezier(.4,0,.2,1);
    display: flex; flex-direction: column; font-family: 'DM Sans', sans-serif; color: #f1f5f9;
  `;

  drawer.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:1.1rem 1.5rem;border-bottom:1px solid #334155;background:#1e293b;position:sticky;top:0;z-index:2">
      <div style="font-size:1rem;font-weight:700">Admin Tools</div>
      <button id="js-edit-fab-close" style="background:#263144;border:none;color:#94a3b8;border-radius:.4rem;padding:.35rem .55rem;cursor:pointer;font-size:.85rem;line-height:1">✕</button>
    </div>
    <div style="padding:1.25rem 1.5rem;flex:1" id="js-edit-fab-body">
      <div style="font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:.75rem">Signed in as admin</div>
      <div style="font-size:.83rem;color:#2ab4a0;margin-bottom:1.5rem">${email}</div>
      <div id="js-edit-fab-links"></div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(drawer);

  function openDrawer() {
    overlay.style.opacity = '1'; overlay.style.pointerEvents = 'all';
    drawer.style.right = '0';
    // Populate contextual links
    populateDrawer(context);
  }
  function closeDrawer() {
    overlay.style.opacity = '0'; overlay.style.pointerEvents = 'none';
    drawer.style.right = '-110%';
  }

  fab.addEventListener('click', openDrawer);
  overlay.addEventListener('click', closeDrawer);
  drawer.querySelector('#js-edit-fab-close').addEventListener('click', closeDrawer);

  function linkBtn(href, label, sub) {
    return `<a href="${href}" style="display:flex;flex-direction:column;gap:.2rem;padding:.85rem 1rem;background:#1e293b;border:1px solid #334155;border-radius:.6rem;text-decoration:none;color:#f1f5f9;margin-bottom:.65rem;transition:border-color .15s" onmouseenter="this.style.borderColor='#2ab4a0'" onmouseleave="this.style.borderColor='#334155'">
      <span style="font-weight:600;font-size:.9rem">${label}</span>
      ${sub ? `<span style="font-size:.75rem;color:#94a3b8">${sub}</span>` : ''}
    </a>`;
  }

  function populateDrawer(ctx) {
    const linksEl = document.getElementById('js-edit-fab-links');
    if (!linksEl) return;

    let html = '';

    // Always show dashboard link
    html += linkBtn('/wtdgadmin-dash.html', '🏠 Admin Dashboard', 'Overview & stats');

    if (ctx?.type === 'event') {
      const ev = window._currentEvent;
      if (ev?.id) {
        html += linkBtn(`/wtdgadmin-events.html?edit=${ev.id}`, '✏️ Edit This Event', ev.name || ev.title || slugFromPath);
      } else {
        html += linkBtn(`/wtdgadmin-events.html`, '✏️ Events Admin', 'Find and edit events');
      }
    } else if (ctx?.type === 'business') {
      const biz = window._currentBiz;
      if (biz?.id) {
        html += linkBtn(`/wtdgadmin-businesses.html?edit=${biz.id}`, '✏️ Edit This Listing', biz.name || slugFromPath);
      } else {
        html += linkBtn(`/wtdgadmin-businesses.html`, '✏️ Businesses Admin', 'Find and edit listings');
      }
    } else {
      html += linkBtn(`/wtdgadmin-businesses.html`, '🏪 Businesses', 'Manage listings');
      html += linkBtn(`/wtdgadmin-events.html`, '📅 Events', 'Manage events');
    }

    html += linkBtn(`/wtdgadmin-approvals.html`, '✅ Approvals', 'Review pending submissions');

    linksEl.innerHTML = html;
  }
}

// Run after DOM + Supabase are ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEditFab);
} else {
  // Delay slightly to let supabase.js initialise db
  setTimeout(initEditFab, 200);
}
