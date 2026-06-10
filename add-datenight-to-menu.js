#!/usr/bin/env node
// Add Date Night link to the Do mega menu browse section, after the Parks link
const fs = require('fs');
const path = require('path');

const INSERT_AFTER = `<a href="parks.html" class="nav__mega__link nav__mega__link--parks"><span class="material-symbols-rounded">park</span> Parks &amp; Green Spaces</a>`;
const NEW_LINK = `
              <a href="date-night.html" class="nav__mega__link nav__mega__link--datenight"><span class="material-symbols-rounded">favorite</span> Date Night Planner</a>`;

const files = fs.readdirSync(__dirname)
  .filter(f => f.endsWith('.html') && f !== 'date-night.html')
  .map(f => path.join(__dirname, f));

let count = 0;
for (const file of files) {
  let html = fs.readFileSync(file, 'utf8');
  if (html.includes(INSERT_AFTER) && !html.includes('date-night.html')) {
    html = html.replace(INSERT_AFTER, INSERT_AFTER + NEW_LINK);
    fs.writeFileSync(file, html, 'utf8');
    console.log(`✅ ${path.basename(file)}`);
    count++;
  }
}
console.log(`\n✨ Updated ${count} files`);
