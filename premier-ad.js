'use strict';
// ── PREMIER AD / ADSENSE BOTTOM SHEET (site-wide) ────────────
// Self-contained: injects HTML, loads active premier ads, handles
// page-view counting and session dedup. Include after supabase.js.

(function () {
  // Skip admin and dashboard pages
  const path = window.location.pathname;
  if (path.includes('wtdgadmin') || path.includes('business-dashboard') ||
      path.includes('login') || path.includes('signup') ||
      path.includes('business-signup') || path.includes('onboarding') ||
      path.includes('promote') || path.includes('seed')) return;

  // ── Inject sheet HTML ──────────────────────────────────────
  const sheetHTML = `
    <div class="premier-sheet-backdrop" id="js-premier-backdrop" aria-hidden="true"></div>
    <div class="premier-sheet" id="js-premier-sheet" role="dialog" aria-label="Advertisement" aria-hidden="true">
      <div class="premier-sheet__header">
        <span class="premier-sheet__label">ADVERTISEMENT</span>
        <button class="premier-sheet__close" id="js-premier-close" aria-label="Close advertisement">
          <span class="premier-sheet__x material-symbols-rounded">close</span>
        </button>
      </div>
      <div class="premier-sheet__content" id="js-premier-content"></div>
      <div class="premier-sheet__progress">
        <div class="premier-sheet__progress-bar" id="js-premier-progress"></div>
      </div>
    </div>`;
  const wrap = document.createElement('div');
  wrap.innerHTML = sheetHTML;
  document.body.appendChild(wrap.children[0]); // backdrop
  document.body.appendChild(wrap.children[0]); // sheet

  const sheet    = document.getElementById('js-premier-sheet');
  const backdrop = document.getElementById('js-premier-backdrop');
  const closeBtn = document.getElementById('js-premier-close');
  const content  = document.getElementById('js-premier-content');
  const progress = document.getElementById('js-premier-progress');

  // ── Track page views ───────────────────────────────────────
  let views = parseInt(localStorage.getItem('wtdg_page_views') || '0', 10) + 1;
  localStorage.setItem('wtdg_page_views', views);

  function showSheet(withCountdown) {
    backdrop.style.display = 'block';
    requestAnimationFrame(() => {
      backdrop.classList.add('premier-sheet-backdrop--visible');
      sheet.classList.add('premier-sheet--visible');
      sheet.setAttribute('aria-hidden', 'false');
    });

    function dismiss() {
      sheet.classList.remove('premier-sheet--visible');
      backdrop.classList.remove('premier-sheet-backdrop--visible');
      sheet.setAttribute('aria-hidden', 'true');
      setTimeout(() => { backdrop.style.display = 'none'; }, 400);
    }
    closeBtn.addEventListener('click', dismiss);
    backdrop.addEventListener('click', dismiss);

    if (withCountdown) {
      // Disable close for 5s
      closeBtn.disabled = true;
      const xIcon = closeBtn.querySelector('.premier-sheet__x');
      const countdown = document.createElement('span');
      countdown.className = 'premier-sheet__countdown';
      countdown.setAttribute('aria-live', 'polite');
      countdown.textContent = '5';
      closeBtn.insertBefore(countdown, xIcon);
      xIcon.style.display = 'none';

      requestAnimationFrame(() => progress.classList.add('premier-sheet__progress-bar--running'));

      let remaining = 5;
      const tick = setInterval(() => {
        remaining--;
        if (remaining > 0) {
          countdown.textContent = remaining;
        } else {
          clearInterval(tick);
          countdown.remove();
          xIcon.style.display = '';
          closeBtn.disabled = false;
        }
      }, 1000);
    }
  }

  // ── Try to load active premier ads ────────────────────────
  async function init() {
    try {
      // db is the global Supabase client from supabase.js
      const { data: ads } = await db
        .from('promotions')
        .select('package, ad_image_url, ad_link_url, ad_headline, ad_body')
        .eq('package', 'premier')
        .eq('ad_live', true)
        .gt('ends_at', new Date().toISOString())
        .limit(5);

      const premiers = (ads || []).filter(a => a.ad_image_url || a.ad_headline);

      if (premiers.length) {
        // ── Show premier ad (once per session) ──────────────
        if (sessionStorage.getItem('wtdg_premier_shown')) return;
        sessionStorage.setItem('wtdg_premier_shown', '1');

        const ad = premiers[Math.floor(Math.random() * premiers.length)];
        const url = ad.ad_link_url || '#';

        content.innerHTML = `
          <a href="${url}" target="_blank" rel="noopener sponsored" class="ad-card ad-card--premier" style="display:block;text-decoration:none">
            <div class="ad-card__bg" style="background-image:url('${ad.ad_image_url || ''}')"></div>
            <div class="ad-card__overlay"></div>
            <div class="ad-card__body">
              ${ad.ad_headline ? `<div class="ad-card__title">${ad.ad_headline}</div>` : ''}
              ${ad.ad_body    ? `<div class="ad-card__desc">${ad.ad_body}</div>`       : ''}
              <div class="ad-card__cta">Learn more →</div>
            </div>
          </a>`;

        setTimeout(() => showSheet(true), 2000);

      } else {
        // ── AdSense fallback (every 5 page views, once per session) ──
        if (sessionStorage.getItem('wtdg_adsense_shown')) return;
        if (views % 5 !== 0) return;
        sessionStorage.setItem('wtdg_adsense_shown', '1');

        content.innerHTML = `
          <div style="padding:.75rem">
            <ins class="adsbygoogle"
                 style="display:block;width:100%;min-height:160px"
                 data-ad-client="ca-pub-7991778555943890"
                 data-ad-slot="PREMIER_SLOT_ID"
                 data-ad-format="auto"
                 data-full-width-responsive="true"></ins>
            <script>(adsbygoogle = window.adsbygoogle || []).push({});<\/script>
            <p style="text-align:center;font-size:.75rem;color:#999;margin:.5rem 0 0">This ad supports free local content.</p>
          </div>`;

        setTimeout(() => showSheet(false), 2000);
      }
    } catch (e) {
      console.warn('premier-ad init error:', e);
    }
  }

  // Wait for db to be available (supabase.js sets it up synchronously but page may still be loading)
  if (typeof db !== 'undefined') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      if (typeof db !== 'undefined') init();
    });
  }
})();
