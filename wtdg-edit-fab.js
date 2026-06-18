'use strict';
/* ── Super-admin floating edit button ───────────────────────────────────────
   Single click → navigates directly to the admin edit form for this record.
   Shown when:
     a) logged-in Supabase user is in ADMIN_EMAILS, OR
     b) wtdg_admin_bypass=1 cookie is set (preview mode)
   ──────────────────────────────────────────────────────────────────────────── */

const FAB_ADMIN_EMAILS = ['lee.renton81@gmail.com', 'adele@whattodogeelong.com.au'];
const ADMIN_ROOT = 'https://wtdadmin.whattodovictoria.com.au';

async function initEditFab() {
  if (typeof db === 'undefined') return;

  const isPreview = document.cookie.includes('wtdg_admin_bypass=1');

  if (!isPreview) {
    // Only check session when not in preview mode
    let session;
    try {
      const { data } = await db.auth.getSession();
      session = data?.session;
    } catch (_) { return; }

    if (!session) return;
    const email = session.user?.email;
    if (!FAB_ADMIN_EMAILS.includes(email)) return;
  }

  // ── Determine page type + slug from URL ──────────────────────────────────
  const path = window.location.pathname; // e.g. /venue-name  or  /events/slug

  let adminUrl = `${ADMIN_ROOT}/`;
  let fabTitle = 'Admin';

  const eventMatch = path.match(/^\/events\/(.+)$/) || path.match(/^\/([^/]+)\/([^/]+)$/);
  const isArticlePage = path.startsWith('/news/') || !!document.getElementById('js-article-root');
  const isEventPage = !isArticlePage && (!!eventMatch || !!document.getElementById('js-event-root'));
  const isListingPage = !isArticlePage && !isEventPage && path.split('/').filter(Boolean).length === 1 && path !== '/';

  if (isArticlePage) {
    const slug = path.replace('/news/', '').split('/')[0];
    if (slug) {
      try {
        const { data } = await db.from('articles').select('id').or(`slug.eq.${slug},id.eq.${slug}`).limit(1);
        if (data?.[0]) {
          adminUrl = `${ADMIN_ROOT}/content?edit=${data[0].id}`;
          fabTitle = 'Edit Article';
        } else {
          adminUrl = `${ADMIN_ROOT}/content`;
          fabTitle = 'Content Admin';
        }
      } catch (_) {
        adminUrl = `${ADMIN_ROOT}/content`;
        fabTitle = 'Content Admin';
      }
    }
  } else if (isEventPage) {
    const slug = path.split('/').filter(Boolean).pop();
    if (slug) {
      try {
        const { data } = await db.from('events').select('id').or(`slug.eq.${slug},id.eq.${slug}`).limit(1);
        if (data?.[0]) {
          adminUrl = `${ADMIN_ROOT}/events?edit=${data[0].id}`;
          fabTitle = 'Edit Event';
        } else {
          adminUrl = `${ADMIN_ROOT}/events`;
          fabTitle = 'Events Admin';
        }
      } catch (_) {
        adminUrl = `${ADMIN_ROOT}/events`;
        fabTitle = 'Events Admin';
      }
    }
  } else if (isListingPage) {
    const slug = path.split('/').filter(Boolean)[0];
    if (slug) {
      try {
        const { data } = await db.from('businesses').select('id').or(`slug.eq.${slug},id.eq.${slug}`).limit(1);
        if (data?.[0]) {
          adminUrl = `${ADMIN_ROOT}/businesses?edit=${data[0].id}`;
          fabTitle = 'Edit Listing';
        } else {
          adminUrl = `${ADMIN_ROOT}/businesses`;
          fabTitle = 'Businesses Admin';
        }
      } catch (_) {
        adminUrl = `${ADMIN_ROOT}/businesses`;
        fabTitle = 'Businesses Admin';
      }
    }
  }

  // ── Inject FAB ───────────────────────────────────────────────────────────
  const fab = document.createElement('a');
  fab.id = 'js-edit-fab';
  fab.href = adminUrl;
  fab.setAttribute('aria-label', fabTitle);
  fab.title = fabTitle;
  fab.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
  fab.style.cssText = `
    position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 9990;
    width: 48px; height: 48px; border-radius: 50%;
    background: #2ab4a0; color: #fff; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 20px rgba(42,180,160,.5);
    transition: transform .15s, box-shadow .15s;
    text-decoration: none;
  `;
  fab.addEventListener('mouseenter', () => { fab.style.transform = 'scale(1.08)'; fab.style.boxShadow = '0 6px 28px rgba(42,180,160,.65)'; });
  fab.addEventListener('mouseleave', () => { fab.style.transform = ''; fab.style.boxShadow = '0 4px 20px rgba(42,180,160,.5)'; });
  document.body.appendChild(fab);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEditFab);
} else {
  setTimeout(initEditFab, 300);
}
