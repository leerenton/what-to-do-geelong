'use strict';
/* ── WTDG ANALYTICS ──────────────────────────────────────────
   Wrapper around dataLayer.push for GA4 via GTM.
   All tracking calls go through wtdgTrack() so they're easy
   to find, disable, or swap out in one place.

   GTM container: GTM-M8CX39H7
──────────────────────────────────────────────────────────────*/

window.dataLayer = window.dataLayer || [];

/**
 * Push a GA4-compatible event to the dataLayer.
 * @param {string} eventName  - snake_case GA4 event name
 * @param {object} params     - event parameters
 */
function wtdgTrack(eventName, params = {}) {
  try {
    window.dataLayer.push({
      event: eventName,
      ...params,
    });
  } catch (_) {}
}
window.wtdgTrack = wtdgTrack;

// ── AUTO-TRACK ON DOM READY ───────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // ── Page view (enhanced, with page type) ─────────────────
  const page = window.location.pathname.split('/').pop() || 'index.html';
  const pageType = getPageType(page);
  wtdgTrack('page_view_wtdg', {
    page_type:     pageType,
    page_path:     window.location.pathname,
    page_title:    document.title,
  });

  // ── Delegate: CTA button clicks ───────────────────────────
  document.body.addEventListener('click', (e) => {
    const el = e.target.closest('[data-track], .event-card__cta, .btn--teal, .featured-card, .event-card, .upcoming-item, .ed-card, .biz-card, .offer-card');
    if (!el) return;

    // ── Explicit data-track attribute (highest priority) ────
    if (el.dataset.track) {
      wtdgTrack(el.dataset.track, safeJson(el.dataset.trackParams));
      return;
    }

    // ── Event card CTA button ────────────────────────────────
    if (el.classList.contains('event-card__cta')) {
      const card = el.closest('.event-card, a');
      wtdgTrack('select_event_cta', {
        cta_text:      el.textContent.trim(),
        cta_type:      el.classList.contains('event-card__cta--free') ? 'free_entry' :
                       el.textContent.includes('Tickets') ? 'get_tickets' :
                       el.textContent.includes('Book') ? 'book_now' :
                       el.textContent.includes('RSVP') ? 'rsvp' : 'other',
        event_title:   card?.querySelector('.event-card__title')?.textContent.trim() || '',
        event_category:card?.querySelector('.event-card__cat')?.textContent.trim() || '',
        location:      window.location.pathname,
      });
      return;
    }

    // ── Featured card click ──────────────────────────────────
    if (el.classList.contains('featured-card')) {
      wtdgTrack('select_featured_event', {
        event_title:    el.querySelector('.featured-card__title')?.textContent.trim() || '',
        event_category: el.querySelector('.featured-card__cat')?.textContent.trim() || '',
        event_price:    el.querySelector('.featured-card__price')?.textContent.trim() || '',
      });
      return;
    }

    // ── Event card click (the whole card) ────────────────────
    if (el.classList.contains('event-card')) {
      wtdgTrack('select_event', {
        event_title:    el.querySelector('.event-card__title')?.textContent.trim() || '',
        event_category: el.querySelector('.event-card__cat')?.textContent.trim() || '',
        source:         'card_scroll',
      });
      return;
    }

    // ── Upcoming item click ───────────────────────────────────
    if (el.classList.contains('upcoming-item')) {
      wtdgTrack('select_upcoming_event', {
        event_title: el.querySelector('.upcoming-item__title')?.textContent.trim() || '',
        event_cat:   el.querySelector('.upcoming-item__cat')?.textContent.trim() || '',
      });
      return;
    }

    // ── Business / listing card ───────────────────────────────
    if (el.classList.contains('biz-card') || el.classList.contains('eat-card') || el.classList.contains('stay-card')) {
      wtdgTrack('select_listing', {
        listing_name: el.querySelector('h3, .biz-card__name, .eat-card__name')?.textContent.trim() || '',
        listing_type: el.dataset.type || 'business',
        source:       pageType,
      });
      return;
    }

    // ── Offer card click ──────────────────────────────────────
    if (el.classList.contains('offer-card') || el.classList.contains('offer-tile')) {
      wtdgTrack('select_offer', {
        offer_title: el.querySelector('h3, .offer-card__title')?.textContent.trim() || '',
      });
      return;
    }

    // ── Teal CTA buttons (Get Tickets, Book Now etc on event detail) ──
    if (el.classList.contains('btn--teal') && !el.closest('.nav')) {
      wtdgTrack('cta_click', {
        cta_text: el.textContent.trim(),
        page_type: pageType,
        page_path: window.location.pathname,
      });
      return;
    }

    // ── Editorial / article card ─────────────────────────────
    if (el.classList.contains('ed-card') || el.classList.contains('ed-mini-card')) {
      wtdgTrack('select_article', {
        article_title: el.querySelector('h3, h4')?.textContent.trim() || '',
      });
    }
  });

  // ── Nav links ─────────────────────────────────────────────
  document.querySelectorAll('.nav__links a, .nav__drop-menu a').forEach(a => {
    a.addEventListener('click', () => {
      wtdgTrack('nav_click', {
        nav_label: a.textContent.trim(),
        nav_href:  a.getAttribute('href') || '',
      });
    });
  });

  // ── Search interactions ───────────────────────────────────
  let searchTimer;
  document.querySelectorAll('input[type="search"], input[placeholder*="Search"], input[placeholder*="search"]').forEach(inp => {
    inp.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        if (inp.value.length > 2) {
          wtdgTrack('search', {
            search_term: inp.value.trim(),
            page_type:   pageType,
          });
        }
      }, 800);
    });
  });

  // ── Filter / category selection ───────────────────────────
  document.querySelectorAll('.filter-pill, .cat-pill, [data-cat]').forEach(btn => {
    btn.addEventListener('click', () => {
      wtdgTrack('filter_applied', {
        filter_value: btn.textContent.trim() || btn.dataset.cat || '',
        page_type:    pageType,
      });
    });
  });

  // ── Onboarding steps ──────────────────────────────────────
  document.querySelectorAll('.onboarding-step, [data-step]').forEach(btn => {
    btn.addEventListener('click', () => {
      wtdgTrack('onboarding_step', {
        step: btn.dataset.step || btn.textContent.trim(),
      });
    });
  });

});

// ── NAMED TRACKING HELPERS (called from other JS files) ──────

/** Track when a user saves/stars an item to a guide */
function trackSaveToGuide(item) {
  wtdgTrack('save_to_guide', {
    item_type:  item?.type || 'event',
    item_title: item?.title || '',
    item_id:    item?.id || '',
  });
}
window.trackSaveToGuide = trackSaveToGuide;

/** Track guide creation */
function trackGuideCreated(guideName) {
  wtdgTrack('guide_created', {
    guide_name: guideName || '',
  });
}
window.trackGuideCreated = trackGuideCreated;

/** Track share */
function trackShare(method, contentTitle) {
  wtdgTrack('share', {
    method:        method || 'unknown',
    content_title: contentTitle || document.title,
    content_type:  getPageType(window.location.pathname.split('/').pop()),
  });
}
window.trackShare = trackShare;

/** Track sign up */
function trackSignUp(method) {
  wtdgTrack('sign_up', { method: method || 'email' });
}
window.trackSignUp = trackSignUp;

/** Track login */
function trackLogin(method) {
  wtdgTrack('login', { method: method || 'email' });
}
window.trackLogin = trackLogin;

/** Track business claim / signup start */
function trackBusinessSignup(step, bizType) {
  wtdgTrack('business_signup', { step, biz_type: bizType || '' });
}
window.trackBusinessSignup = trackBusinessSignup;

/** Track ticket / booking link click (outbound) */
function trackTicketClick(eventTitle, ticketUrl, price) {
  wtdgTrack('ticket_link_click', {
    event_title: eventTitle || '',
    ticket_url:  ticketUrl || '',
    price:       price || '',
  });
}
window.trackTicketClick = trackTicketClick;

/** Track guide item viewed */
function trackGuideView(guideId) {
  wtdgTrack('guide_view', { guide_id: guideId || '' });
}
window.trackGuideView = trackGuideView;

// ── UTILS ──────────────────────────────────────────────────────
function getPageType(page) {
  if (!page || page === 'index.html' || page === '') return 'home';
  if (page.includes('event.html') || page.includes('event?'))  return 'event_detail';
  if (page.includes('events.html'))  return 'events_listing';
  if (page.includes('listing.html')) return 'business_detail';
  if (page.includes('eat.html'))     return 'eat';
  if (page.includes('stay.html'))    return 'stay';
  if (page.includes('guide'))        return 'guide';
  if (page.includes('editorial') || page.includes('article')) return 'editorial';
  if (page.includes('login'))        return 'login';
  if (page.includes('signup'))       return 'signup';
  if (page.includes('onboarding'))   return 'onboarding';
  if (page.includes('business'))     return 'business_dashboard';
  return page.replace('.html', '');
}

function safeJson(str) {
  try { return str ? JSON.parse(str) : {}; } catch { return {}; }
}
