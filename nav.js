'use strict';

// ── GLOBAL NAV ────────────────────────────────────────────
// Single source of truth for the site header.
// Each page just needs: <div id="js-nav-root"></div>
// and a <script src="/nav.js"></script> before other scripts.
// ──────────────────────────────────────────────────────────

(function () {
  const GUIDE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="18.5" y1="5.5" x2="21" y2="3" stroke="#48c7d4"/><line x1="20" y1="9" x2="23" y2="8" stroke="#48c7d4"/><line x1="16" y1="4" x2="16.5" y2="1.5" stroke="#48c7d4"/></svg>`;

  const site     = window.SITE || {};
  const siteName = site.fullName || 'What To Do Geelong';
  const logoSrc  = site.logoUrl  || '/assets/logo.jpg';

  const NAV_HTML = `
  <header class="nav">
    <div class="nav__inner container">
      <a href="/index.html" class="nav__logo-link">
        <img src="${logoSrc}" alt="${siteName}" class="nav__logo-img" />
      </a>
      <nav class="nav__links">

        <!-- Eat -->
        <div class="nav__drop nav__drop--mega">
          <button class="nav__drop-toggle">Eat <span class="material-symbols-rounded">expand_more</span></button>
          <div class="nav__drop-menu nav__mega">
            <div class="nav__mega__left">
              <p class="nav__mega__label">Browse</p>
              <a href="/eat.html" class="nav__mega__link"><span class="material-symbols-rounded">restaurant</span> All Food &amp; Drink</a>
              <a href="/eat.html?filter=caf%C3%A9" class="nav__mega__link"><span class="material-symbols-rounded">coffee</span> Cafés</a>
              <a href="/eat.html?filter=restaurant" class="nav__mega__link"><span class="material-symbols-rounded">dinner_dining</span> Restaurants</a>
              <a href="/eat.html?filter=brunch" class="nav__mega__link"><span class="material-symbols-rounded">egg_alt</span> Brunch</a>
              <a href="/eat.html?filter=bakery" class="nav__mega__link"><span class="material-symbols-rounded">bakery_dining</span> Bakeries</a>
              <a href="/eat.html?filter=asian" class="nav__mega__link"><span class="material-symbols-rounded">ramen_dining</span> Asian</a>
              <a href="/eat.html?filter=pizza" class="nav__mega__link"><span class="material-symbols-rounded">local_pizza</span> Pizza</a>
            </div>
            <div class="nav__mega__right">
              <p class="nav__mega__label">Featured</p>
              <div class="nav__mega__cards">
                <a href="/eat.html?filter=restaurant" class="nav__mega__card">
                  <div class="nav__mega__card-img" style="background-color:#0d9488"></div>
                  <div class="nav__mega__card-body"><span class="nav__mega__card-name">Waterfront Dining</span><span class="nav__mega__card-date">City &amp; Waterfront</span></div>
                </a>
                <a href="/eat.html?filter=caf%C3%A9" class="nav__mega__card">
                  <div class="nav__mega__card-img" style="background-color:#d97706"></div>
                  <div class="nav__mega__card-body"><span class="nav__mega__card-name">Best Cafés</span><span class="nav__mega__card-date">Coffee &amp; All-Day Dining</span></div>
                </a>
                <a href="/eat.html?filter=brunch" class="nav__mega__card">
                  <div class="nav__mega__card-img" style="background-color:#7c3aed"></div>
                  <div class="nav__mega__card-body"><span class="nav__mega__card-name">Sunday Brunch</span><span class="nav__mega__card-date">Weekend Favourites</span></div>
                </a>
                <a href="/eat.html?filter=bakery" class="nav__mega__card">
                  <div class="nav__mega__card-img" style="background-color:#e11d48"></div>
                  <div class="nav__mega__card-body"><span class="nav__mega__card-name">Bakeries &amp; Sweets</span><span class="nav__mega__card-date">Fresh &amp; Local</span></div>
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- Drink -->
        <div class="nav__drop nav__drop--mega">
          <button class="nav__drop-toggle">Drink <span class="material-symbols-rounded">expand_more</span></button>
          <div class="nav__drop-menu nav__mega">
            <div class="nav__mega__left">
              <p class="nav__mega__label">Browse</p>
              <a href="/drink.html" class="nav__mega__link"><span class="material-symbols-rounded">local_bar</span> All Bars &amp; Drinks</a>
              <a href="/drink.html?filter=brewery" class="nav__mega__link"><span class="material-symbols-rounded">sports_bar</span> Breweries</a>
              <a href="/drink.html?filter=winery" class="nav__mega__link"><span class="material-symbols-rounded">wine_bar</span> Wineries &amp; Cellar Doors</a>
              <a href="/drink.html?filter=bar" class="nav__mega__link"><span class="material-symbols-rounded">nightlife</span> Bars</a>
              <a href="/drink.html?filter=pub" class="nav__mega__link"><span class="material-symbols-rounded">emoji_food_beverage</span> Pubs</a>
              <a href="/drink.html?filter=cocktail" class="nav__mega__link"><span class="material-symbols-rounded">local_cafe</span> Cocktails</a>
            </div>
            <div class="nav__mega__right">
              <p class="nav__mega__label">Featured</p>
              <div class="nav__mega__cards">
                <a href="/drink.html?filter=brewery" class="nav__mega__card">
                  <div class="nav__mega__card-img" style="background-color:#1d4ed8"></div>
                  <div class="nav__mega__card-body"><span class="nav__mega__card-name">Craft Beer Trail</span><span class="nav__mega__card-date">Geelong Breweries</span></div>
                </a>
                <a href="/drink.html?filter=winery" class="nav__mega__card">
                  <div class="nav__mega__card-img" style="background-color:#7c2d12"></div>
                  <div class="nav__mega__card-body"><span class="nav__mega__card-name">Bellarine Wineries</span><span class="nav__mega__card-date">Cellar Door Tastings</span></div>
                </a>
                <a href="/drink.html?filter=bar" class="nav__mega__card">
                  <div class="nav__mega__card-img" style="background-color:#4338ca"></div>
                  <div class="nav__mega__card-body"><span class="nav__mega__card-name">Best Bars</span><span class="nav__mega__card-date">Cocktails &amp; Good Vibes</span></div>
                </a>
                <a href="/drink.html?filter=pub" class="nav__mega__card">
                  <div class="nav__mega__card-img" style="background-color:#166534"></div>
                  <div class="nav__mega__card-body"><span class="nav__mega__card-name">Local Pubs</span><span class="nav__mega__card-date">Geelong Favourites</span></div>
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- Do -->
        <div class="nav__drop nav__drop--mega">
          <button class="nav__drop-toggle">Do <span class="material-symbols-rounded">expand_more</span></button>
          <div class="nav__drop-menu nav__mega">
            <div class="nav__mega__left">
              <p class="nav__mega__label">Browse</p>
              <a href="/do.html" class="nav__mega__link"><span class="material-symbols-rounded">explore</span> All Things To Do</a>
              <a href="/do.html?filter=activity" class="nav__mega__link"><span class="material-symbols-rounded">sports_tennis</span> Activities</a>
              <a href="/do.html?filter=attraction" class="nav__mega__link"><span class="material-symbols-rounded">account_balance</span> Attractions</a>
              <a href="/do.html?filter=art" class="nav__mega__link"><span class="material-symbols-rounded">palette</span> Arts &amp; Culture</a>
              <a href="/do.html?filter=adventure" class="nav__mega__link"><span class="material-symbols-rounded">hiking</span> Adventure</a>
              <a href="/do.html?filter=nature" class="nav__mega__link"><span class="material-symbols-rounded">forest</span> Nature &amp; Outdoors</a>
              <a href="/do.html?filter=wellness" class="nav__mega__link"><span class="material-symbols-rounded">spa</span> Wellness</a>
              <a href="/do.html?filter=sport" class="nav__mega__link"><span class="material-symbols-rounded">stadium</span> Sport</a>
              <div class="nav__drop-divider" style="margin:.6rem 0"></div>
              <a href="/parks.html" class="nav__mega__link nav__mega__link--parks"><span class="material-symbols-rounded">park</span> Parks &amp; Green Spaces</a>
              <a href="/date-night.html" class="nav__mega__link nav__mega__link--datenight"><span class="material-symbols-rounded">favorite</span> Date Night Planner</a>
            </div>
            <div class="nav__mega__right">
              <p class="nav__mega__label">Featured</p>
              <div class="nav__mega__cards">
                <a href="/do.html?filter=family" class="nav__mega__card">
                  <div class="nav__mega__card-img" style="background-color:#0891b2"></div>
                  <div class="nav__mega__card-body"><span class="nav__mega__card-name">Family Activities</span><span class="nav__mega__card-date">Kids &amp; All Ages</span></div>
                </a>
                <a href="/parks.html" class="nav__mega__card">
                  <div class="nav__mega__card-img" style="background-color:#15803d"></div>
                  <div class="nav__mega__card-body"><span class="nav__mega__card-name">Parks &amp; Green Spaces</span><span class="nav__mega__card-date">Geelong's Great Outdoors</span></div>
                </a>
                <a href="/do.html?filter=art" class="nav__mega__card">
                  <div class="nav__mega__card-img" style="background-color:#7e22ce"></div>
                  <div class="nav__mega__card-body"><span class="nav__mega__card-name">Arts &amp; Culture</span><span class="nav__mega__card-date">Galleries &amp; Museums</span></div>
                </a>
                <a href="/do.html?filter=adventure" class="nav__mega__card">
                  <div class="nav__mega__card-img" style="background-color:#c2410c"></div>
                  <div class="nav__mega__card-body"><span class="nav__mega__card-name">Adventure &amp; Outdoors</span><span class="nav__mega__card-date">Get Active in Geelong</span></div>
                </a>
              </div>
            </div>
          </div>
        </div>

        <a href="#offers">Offers</a>

        <!-- Events -->
        <div class="nav__drop nav__drop--mega">
          <button class="nav__drop-toggle">Events <span class="material-symbols-rounded">expand_more</span></button>
          <div class="nav__drop-menu nav__mega">
            <div class="nav__mega__left">
              <p class="nav__mega__label">Browse</p>
              <a href="/events.html" class="nav__mega__link"><span class="material-symbols-rounded">event</span> All Events</a>
              <a href="/events.html#today" class="nav__mega__link nav__mega__link--today"><span class="nav__mega__live-dot"></span> Happening Today</a>
              <a href="/events.html#tomorrow" class="nav__mega__link"><span class="material-symbols-rounded">wb_sunny</span> Tomorrow</a>
              <a href="/events.html#weekend" class="nav__mega__link"><span class="material-symbols-rounded">weekend</span> This Weekend</a>
              <div class="nav__drop-divider" style="margin:.6rem 0"></div>
              <a href="#" class="nav__mega__link nav__mega__link--submit"><span class="material-symbols-rounded">add_circle</span> Submit an Event</a>
            </div>
            <div class="nav__mega__right">
              <p class="nav__mega__label">Major Events</p>
              <div class="nav__mega__cards">
                <a href="/festival-of-sails.html" class="nav__mega__card">
                  <div class="nav__mega__card-img" style="background-image:url('assets/events/festival-of-sails.jpg');background-color:#0e4a7a"></div>
                  <div class="nav__mega__card-body"><span class="nav__mega__card-name">Festival of Sails</span><span class="nav__mega__card-date">Jan 2026</span></div>
                </a>
                <a href="/cadel-evans.html" class="nav__mega__card">
                  <div class="nav__mega__card-img" style="background-image:url('assets/events/cadel-evans.jpg');background-color:#c0392b"></div>
                  <div class="nav__mega__card-body"><span class="nav__mega__card-name">Cadel Evans Race</span><span class="nav__mega__card-date">Feb 2026</span></div>
                </a>
                <a href="#" class="nav__mega__card">
                  <div class="nav__mega__card-img" style="background-color:#6B2737"></div>
                  <div class="nav__mega__card-body"><span class="nav__mega__card-name">Pako Festa</span><span class="nav__mega__card-date">Mar 2026</span></div>
                </a>
                <a href="#" class="nav__mega__card">
                  <div class="nav__mega__card-img" style="background-color:#2c7a4b"></div>
                  <div class="nav__mega__card-body"><span class="nav__mega__card-name">Geelong Show</span><span class="nav__mega__card-date">Oct 2026</span></div>
                </a>
              </div>
            </div>
          </div>
        </div>

        <a href="/cats.html" class="nav__cats-link"><span class="nav__cats-dot"></span> Cats</a>
        <a href="/editorial.html">Read</a>
        <a href="/onboarding.html" class="btn btn--teal btn--sm">Personalise</a>

        <!-- Mobile drawer close + secondary links -->
        <button class="nav__mobile-close" id="js-nav-close" aria-label="Close menu">✕ Close</button>
      </nav>

      <div class="nav__end">
        <a href="/guides.html" class="itin-badge" id="js-itin-badge" hidden>
          ${GUIDE_ICON}
          <span id="js-itin-count">0</span>
        </a>
        <button class="nav__hamburger" aria-label="Open menu">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
  </header>`;

  // Network bar — sits at the very bottom of the footer, only on city sites
  const NETWORK_BAR = site.slug !== 'victoria' ? `
    <div class="wtdv-network-bar">
      <div class="container wtdv-network-bar__inner">
        <span class="wtdv-network-bar__text">Part of the What To Do Victoria network</span>
        <a href="https://whattodovictoria.com.au" class="wtdv-network-bar__link" target="_blank" rel="noopener">
          <img src="/assets/wtd_victoria_inverted.png" alt="What To Do Victoria" class="wtdv-network-bar__logo" />
          <span class="wtdv-network-bar__cta">Explore all cities →</span>
        </a>
      </div>
    </div>` : '';

  const FOOTER_HTML = `
  <footer class="footer">
    <div class="container footer__grid">
      <div class="footer__brand">
        <div class="footer__logo">${siteName.toUpperCase()}!</div>
        <p class="footer__tagline">${site.heroTagline || 'Your local guide to events, food, drink and things to do.'}</p>
        <p class="footer__copy">© ${new Date().getFullYear()} ${siteName}</p>
      </div>
      <div class="footer__col">
        <h4 class="footer__heading">Things To Do</h4>
        <a href="/do.html">Things to do in Geelong</a>
        <a href="/do.html?filter=family">Family activities Geelong</a>
        <a href="/do.html?filter=nature">Outdoor activities Geelong</a>
        <a href="/do.html?filter=art">Arts &amp; culture Geelong</a>
        <a href="/do.html?filter=wellness">Day spas Geelong</a>
        <a href="/do.html?filter=sport">Sport &amp; leisure Geelong</a>
      </div>
      <div class="footer__col">
        <h4 class="footer__heading">Food &amp; Drink</h4>
        <a href="/eat.html">Restaurants in Geelong</a>
        <a href="/eat.html?filter=caf%C3%A9">Cafes in Geelong</a>
        <a href="/drink.html">Bars &amp; pubs Geelong</a>
        <a href="/drink.html?filter=winery">Bellarine wineries</a>
        <a href="/drink.html?filter=brewery">Geelong breweries</a>
        <a href="/eat.html?filter=brunch">Brunch Geelong</a>
      </div>
      <div class="footer__col">
        <h4 class="footer__heading">Events</h4>
        <a href="/events.html">What's on in Geelong</a>
        <a href="/events.html#today">Events today Geelong</a>
        <a href="/events.html#weekend">This weekend Geelong</a>
        <a href="/festival-of-sails.html">Festival of Sails</a>
        <a href="/cadel-evans.html">Cadel Evans Road Race</a>
        <a href="#">Submit an event</a>
      </div>
      <div class="footer__col">
        <h4 class="footer__heading">Explore</h4>
        <a href="/editorial.html">Geelong travel guides</a>
        <a href="/editorial.html">Best of Geelong</a>
        <a href="/editorial.html">Bellarine Peninsula guide</a>
        <a href="/advertise.html">Advertise with us</a>
        <a href="/email-sponsorship.html">Sponsor our emails</a>
        <a href="#">About WTDG</a>
        <a href="#">Contact us</a>
      </div>
    </div>
    ${NETWORK_BAR}
  </footer>`;

  // ── INJECT + INIT ─────────────────────────────────────────
  function run() {
    const root = document.getElementById('js-nav-root');
    if (root) root.outerHTML = NAV_HTML;
    else document.body.insertAdjacentHTML('afterbegin', NAV_HTML);

    const footerRoot = document.getElementById('js-footer-root');
    if (footerRoot) footerRoot.outerHTML = FOOTER_HTML;

    initNav();

    // Lazy-load the super-admin edit FAB (no-op for non-admins)
    // Skip on admin pages — they have their own tooling
    if (!window.location.pathname.includes('wtdgadmin')) {
      const fabScript = document.createElement('script');
      fabScript.src = '/wtdg-edit-fab.js';
      document.body.appendChild(fabScript);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

  function initNav() {
    const hamburger = document.querySelector('.nav__hamburger');
    const links     = document.querySelector('.nav__links');
    if (!hamburger || !links) return;

    const backdrop = document.createElement('div');
    backdrop.className = 'nav__backdrop';
    document.body.appendChild(backdrop);

    const header = document.createElement('div');
    header.className = 'nav__mobile-header';
    header.innerHTML = `
      <img src="${logoSrc}" alt="${siteName}" class="nav__mobile-logo" />
      <button class="nav__mobile-close" aria-label="Close menu">
        <span class="material-symbols-rounded">close</span>
      </button>`;
    links.prepend(header);

    const scrollWrap = document.createElement('div');
    scrollWrap.className = 'nav__mobile-scroll';
    while (links.children.length > 1) scrollWrap.appendChild(links.children[1]);
    links.appendChild(scrollWrap);

    const closeBtn = header.querySelector('.nav__mobile-close');

    function closeMenu() {
      links.classList.remove('nav--open');
      backdrop.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
    function openMenu() {
      links.classList.add('nav--open');
      backdrop.classList.add('active');
      hamburger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }

    closeBtn.addEventListener('click', closeMenu);
    backdrop.addEventListener('click', closeMenu);
    hamburger.addEventListener('click', () => links.classList.contains('nav--open') ? closeMenu() : openMenu());
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setTimeout(closeMenu, 80)));

    // Desktop hover dropdowns
    const CLOSE_DELAY = 120;
    const isMobile = () => window.innerWidth <= 640;

    document.querySelectorAll('.nav__drop').forEach(drop => {
      let closeTimer = null;
      drop.addEventListener('mouseenter', () => {
        if (isMobile()) return;
        clearTimeout(closeTimer);
        document.querySelectorAll('.nav__drop').forEach(d => { if (d !== drop) { d.classList.remove('open'); clearTimeout(d._closeTimer); } });
        drop.classList.add('open');
      });
      drop.addEventListener('mouseleave', () => {
        if (isMobile()) return;
        closeTimer = setTimeout(() => drop.classList.remove('open'), CLOSE_DELAY);
        drop._closeTimer = closeTimer;
      });
    });

    // Click toggle (mobile accordion + keyboard fallback)
    document.querySelectorAll('.nav__drop-toggle').forEach(toggle => {
      toggle.addEventListener('click', e => {
        e.stopPropagation();
        const drop = toggle.closest('.nav__drop');
        drop.classList.toggle('open');
        if (!isMobile()) document.querySelectorAll('.nav__drop').forEach(d => { if (d !== drop) d.classList.remove('open'); });
      });
    });

    document.addEventListener('click', e => {
      if (!e.target.closest('.nav__drop')) document.querySelectorAll('.nav__drop').forEach(d => d.classList.remove('open'));
    });
  }

})();
