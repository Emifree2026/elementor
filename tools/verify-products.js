/**
 * Standalone render verification for post 72 (Hero + Products).
 *
 * Reads the HTML the rebuild mu-plugin dumped and runs the same checks the
 * build script's --verify block runs, without re-applying the composition.
 */
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = 'C:/Users/vpedr/Local Sites/landingwptest/app/public';

const htmlPath = path.join(PUBLIC_DIR, 'wp-content/emifree-live-72.html');
const cssDir = path.join(PUBLIC_DIR, 'wp-content/uploads/elementor/css');

const h = fs.readFileSync(htmlPath, 'utf8');

// Scope the products checks to the products section only. The hero's ticker
// shortcode legitimately emits role="region" aria-label="Trusted by industry
// leaders" — a whole-page aria-label check would flag it as a stray prop.
const productsStart = h.indexOf('<section class="elementor-element elementor-element-2691800c');
const productsEnd = productsStart >= 0 ? h.indexOf('</section>', productsStart) : -1;
const p = productsStart >= 0 && productsEnd > productsStart ? h.slice(productsStart, productsEnd) : '';

const checks = {
  'products section id': h.includes('id="products"'),
  'h2 title': p.includes('Industrial Air Filtration Product Range'),
  'subtitle': p.includes('Professional-grade filtration systems'),
  'card 1 link': p.includes('/en/products/mechanical/'),
  'card 2 link': p.includes('/en/products/electrostatic/'),
  'card 3 link': p.includes('/en/products/dust/'),
  'h3 mechanical': p.includes('Mechanical Filtration'),
  'h3 electrostatic': p.includes('Electrostatic Filtration'),
  'h3 dust': p.includes('Dust Filtration'),
  'learn more': p.includes('Learn more'),
  'arrow svg inlined': p.includes('m12 5 7 7-7 7'),
  'fotom1 image': p.includes('fotom1'),
  'fotoe2 image': p.includes('fotoe2'),
  'dust image': p.includes('dust_filter-emi'),
  'no stray aria-label in products': !p.includes('aria-label'),
  'products section found': productsStart >= 0 && productsEnd > productsStart,
};

for (const [k, v] of Object.entries(checks)) {
  console.log(`${v ? 'OK  ' : 'FAIL'} ${k}`);
}

console.log('\nrender bytes:', h.length);

// Which section elements are present, and in what order?
const ids = [...h.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
console.log('element ids in render:', ids.join(', ') || '(none)');

const tags = [...h.matchAll(/<(h1|h2|h3|p|a|section|article)\b[^>]*>/g)].map((m) => m[1]);
console.log('heading/link tag sequence:', tags.join(' '));

// CSS sanity: the Products rules must be present in the desktop sheet.
const desktop = fs.readFileSync(path.join(cssDir, 'local-72-frontend-desktop.css'), 'utf8');
const mobile = fs.readFileSync(path.join(cssDir, 'local-72-frontend-mobile.css'), 'utf8');
const tablet = fs.readFileSync(path.join(cssDir, 'local-72-frontend-tablet.css'), 'utf8');

console.log('\n--- CSS rules that must exist ---');
const cssChecks = {
  'desktop: products bg #f8fafc': desktop.includes('background-color:#f8fafc'),
  'desktop: 3-col grid': desktop.includes('grid-template-columns:repeat(3, 1fr)'),
  'desktop: card radius 16px': desktop.includes('border-radius:16px'),
  'desktop: card hover lift': desktop.includes('translate3d(0px, -8px, 0px)'),
  'desktop: image hover scale': desktop.includes('scale3d(1.05, 1.05, 1)'),
  'desktop: card aspect 4/5': desktop.includes('aspect-ratio:4/5'),
  'desktop: focus outline': desktop.includes('outline-color:#3b82f6'),
  'desktop: h3 drop-shadow': desktop.includes('filter:drop-shadow(0px 1px 1px rgba(0,0,0,0.1))'),
  'mobile: grid 1 col': mobile.includes('grid-template-columns:1fr'),
  'tablet: grid 2 col': tablet.includes('grid-template-columns:repeat(2, 1fr)'),
};
for (const [k, v] of Object.entries(cssChecks)) {
  console.log(`${v ? 'OK  ' : 'FAIL'} ${k}`);
}

console.log('\ndesktop css bytes:', desktop.length, '| mobile:', mobile.length, '| tablet:', tablet.length);
