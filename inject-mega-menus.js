#!/usr/bin/env node
// Inject Eat, Drink, Do mega menus across all HTML pages
const fs = require('fs');
const path = require('path');

const HTML_DIR = __dirname;

// ── Mega menu HTML blocks ────────────────────────────────────

const EAT_MEGA = `<div class="nav__drop nav__drop--mega">
          <button class="nav__drop-toggle">Eat <span class="material-symbols-rounded">expand_more</span></button>
          <div class="nav__drop-menu nav__mega">
            <div class="nav__mega__left">
              <p class="nav__mega__label">Browse</p>
              <a href="eat.html" class="nav__mega__link"><span class="material-symbols-rounded">restaurant</span> All Food &amp; Drink</a>
              <a href="eat.html?filter=caf%C3%A9" class="nav__mega__link"><span class="material-symbols-rounded">coffee</span> Cafés</a>
              <a href="eat.html?filter=restaurant" class="nav__mega__link"><span class="material-symbols-rounded">dinner_dining</span> Restaurants</a>
              <a href="eat.html?filter=brunch" class="nav__mega__link"><span class="material-symbols-rounded">egg_alt</span> Brunch</a>
              <a href="eat.html?filter=bakery" class="nav__mega__link"><span class="material-symbols-rounded">bakery_dining</span> Bakeries</a>
              <a href="eat.html?filter=asian" class="nav__mega__link"><span class="material-symbols-rounded">ramen_dining</span> Asian</a>
              <a href="eat.html?filter=pizza" class="nav__mega__link"><span class="material-symbols-rounded">local_pizza</span> Pizza</a>
            </div>
            <div class="nav__mega__right">
              <p class="nav__mega__label">Featured</p>
              <div class="nav__mega__cards">
                <a href="eat.html?filter=restaurant" class="nav__mega__card">
                  <div class="nav__mega__card-img" style="background-color:#0d9488"></div>
                  <div class="nav__mega__card-body">
                    <span class="nav__mega__card-name">Waterfront Dining</span>
                    <span class="nav__mega__card-date">City &amp; Waterfront</span>
                  </div>
                </a>
                <a href="eat.html?filter=caf%C3%A9" class="nav__mega__card">
                  <div class="nav__mega__card-img" style="background-color:#d97706"></div>
                  <div class="nav__mega__card-body">
                    <span class="nav__mega__card-name">Best Cafés</span>
                    <span class="nav__mega__card-date">Coffee &amp; All-Day Dining</span>
                  </div>
                </a>
                <a href="eat.html?filter=brunch" class="nav__mega__card">
                  <div class="nav__mega__card-img" style="background-color:#7c3aed"></div>
                  <div class="nav__mega__card-body">
                    <span class="nav__mega__card-name">Sunday Brunch</span>
                    <span class="nav__mega__card-date">Weekend Favourites</span>
                  </div>
                </a>
                <a href="eat.html?filter=bakery" class="nav__mega__card">
                  <div class="nav__mega__card-img" style="background-color:#e11d48"></div>
                  <div class="nav__mega__card-body">
                    <span class="nav__mega__card-name">Bakeries &amp; Sweets</span>
                    <span class="nav__mega__card-date">Fresh &amp; Local</span>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>`;

const DRINK_MEGA = `<div class="nav__drop nav__drop--mega">
          <button class="nav__drop-toggle">Drink <span class="material-symbols-rounded">expand_more</span></button>
          <div class="nav__drop-menu nav__mega">
            <div class="nav__mega__left">
              <p class="nav__mega__label">Browse</p>
              <a href="drink.html" class="nav__mega__link"><span class="material-symbols-rounded">local_bar</span> All Bars &amp; Drinks</a>
              <a href="drink.html?filter=brewery" class="nav__mega__link"><span class="material-symbols-rounded">sports_bar</span> Breweries</a>
              <a href="drink.html?filter=winery" class="nav__mega__link"><span class="material-symbols-rounded">wine_bar</span> Wineries &amp; Cellar Doors</a>
              <a href="drink.html?filter=bar" class="nav__mega__link"><span class="material-symbols-rounded">nightlife</span> Bars</a>
              <a href="drink.html?filter=pub" class="nav__mega__link"><span class="material-symbols-rounded">emoji_food_beverage</span> Pubs</a>
              <a href="drink.html?filter=cocktail" class="nav__mega__link"><span class="material-symbols-rounded">local_cafe</span> Cocktails</a>
            </div>
            <div class="nav__mega__right">
              <p class="nav__mega__label">Featured</p>
              <div class="nav__mega__cards">
                <a href="drink.html?filter=brewery" class="nav__mega__card">
                  <div class="nav__mega__card-img" style="background-color:#1d4ed8"></div>
                  <div class="nav__mega__card-body">
                    <span class="nav__mega__card-name">Craft Beer Trail</span>
                    <span class="nav__mega__card-date">Geelong Breweries</span>
                  </div>
                </a>
                <a href="drink.html?filter=winery" class="nav__mega__card">
                  <div class="nav__mega__card-img" style="background-color:#7c2d12"></div>
                  <div class="nav__mega__card-body">
                    <span class="nav__mega__card-name">Bellarine Wineries</span>
                    <span class="nav__mega__card-date">Cellar Door Tastings</span>
                  </div>
                </a>
                <a href="drink.html?filter=bar" class="nav__mega__card">
                  <div class="nav__mega__card-img" style="background-color:#4338ca"></div>
                  <div class="nav__mega__card-body">
                    <span class="nav__mega__card-name">Best Bars</span>
                    <span class="nav__mega__card-date">Cocktails &amp; Good Vibes</span>
                  </div>
                </a>
                <a href="drink.html?filter=pub" class="nav__mega__card">
                  <div class="nav__mega__card-img" style="background-color:#166534"></div>
                  <div class="nav__mega__card-body">
                    <span class="nav__mega__card-name">Local Pubs</span>
                    <span class="nav__mega__card-date">Geelong Favourites</span>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>`;

const DO_MEGA = `<div class="nav__drop nav__drop--mega">
          <button class="nav__drop-toggle">Do <span class="material-symbols-rounded">expand_more</span></button>
          <div class="nav__drop-menu nav__mega">
            <div class="nav__mega__left">
              <p class="nav__mega__label">Browse</p>
              <a href="do.html" class="nav__mega__link"><span class="material-symbols-rounded">explore</span> All Things To Do</a>
              <a href="do.html?filter=activity" class="nav__mega__link"><span class="material-symbols-rounded">sports_tennis</span> Activities</a>
              <a href="do.html?filter=attraction" class="nav__mega__link"><span class="material-symbols-rounded">account_balance</span> Attractions</a>
              <a href="do.html?filter=art" class="nav__mega__link"><span class="material-symbols-rounded">palette</span> Arts &amp; Culture</a>
              <a href="do.html?filter=adventure" class="nav__mega__link"><span class="material-symbols-rounded">hiking</span> Adventure</a>
              <a href="do.html?filter=nature" class="nav__mega__link"><span class="material-symbols-rounded">forest</span> Nature &amp; Outdoors</a>
              <a href="do.html?filter=wellness" class="nav__mega__link"><span class="material-symbols-rounded">spa</span> Wellness</a>
              <a href="do.html?filter=sport" class="nav__mega__link"><span class="material-symbols-rounded">stadium</span> Sport</a>
              <div class="nav__drop-divider" style="margin:.6rem 0"></div>
              <a href="parks.html" class="nav__mega__link nav__mega__link--parks"><span class="material-symbols-rounded">park</span> Parks &amp; Green Spaces</a>
            </div>
            <div class="nav__mega__right">
              <p class="nav__mega__label">Featured</p>
              <div class="nav__mega__cards">
                <a href="do.html?filter=family" class="nav__mega__card">
                  <div class="nav__mega__card-img" style="background-color:#0891b2"></div>
                  <div class="nav__mega__card-body">
                    <span class="nav__mega__card-name">Family Activities</span>
                    <span class="nav__mega__card-date">Kids &amp; All Ages</span>
                  </div>
                </a>
                <a href="parks.html" class="nav__mega__card">
                  <div class="nav__mega__card-img" style="background-color:#15803d"></div>
                  <div class="nav__mega__card-body">
                    <span class="nav__mega__card-name">Parks &amp; Green Spaces</span>
                    <span class="nav__mega__card-date">Geelong's Great Outdoors</span>
                  </div>
                </a>
                <a href="do.html?filter=art" class="nav__mega__card">
                  <div class="nav__mega__card-img" style="background-color:#7e22ce"></div>
                  <div class="nav__mega__card-body">
                    <span class="nav__mega__card-name">Arts &amp; Culture</span>
                    <span class="nav__mega__card-date">Galleries &amp; Museums</span>
                  </div>
                </a>
                <a href="do.html?filter=adventure" class="nav__mega__card">
                  <div class="nav__mega__card-img" style="background-color:#c2410c"></div>
                  <div class="nav__mega__card-body">
                    <span class="nav__mega__card-name">Adventure &amp; Outdoors</span>
                    <span class="nav__mega__card-date">Get Active in Geelong</span>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>`;

// ── Process each HTML file ────────────────────────────────────

const files = fs.readdirSync(HTML_DIR)
  .filter(f => f.endsWith('.html'))
  .map(f => path.join(HTML_DIR, f));

let totalUpdated = 0;

for (const file of files) {
  let html = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Replace Eat link (with or without nav__active class)
  const eatPatterns = [
    '<a href="eat.html" class="nav__active">Eat</a>',
    '<a href="eat.html">Eat</a>',
  ];
  for (const pattern of eatPatterns) {
    if (html.includes(pattern)) {
      html = html.replace(pattern, EAT_MEGA);
      changed = true;
      break;
    }
  }

  // Replace Drink link
  const drinkPatterns = [
    '<a href="drink.html" class="nav__active">Drink</a>',
    '<a href="drink.html">Drink</a>',
  ];
  for (const pattern of drinkPatterns) {
    if (html.includes(pattern)) {
      html = html.replace(pattern, DRINK_MEGA);
      changed = true;
      break;
    }
  }

  // Replace Do link
  const doPatterns = [
    '<a href="do.html" class="nav__active">Do</a>',
    '<a href="do.html">Do</a>',
  ];
  for (const pattern of doPatterns) {
    if (html.includes(pattern)) {
      html = html.replace(pattern, DO_MEGA);
      changed = true;
      break;
    }
  }

  if (changed) {
    fs.writeFileSync(file, html, 'utf8');
    totalUpdated++;
    console.log(`✅ ${path.basename(file)}`);
  }
}

console.log(`\n🎉 Updated ${totalUpdated} files`);
