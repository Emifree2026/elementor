#!/usr/bin/env node
'use strict';
/*
 * Rebuild the Technology section in Elementor post 72 -- the "one strong visual
 * per technology" redesign.
 *
 * WHAT THIS REPLACES
 * ------------------
 * The v1 section (Elementor element 75fefefa, 76 nodes) was: a big section
 * h2 + lead + hint, two selector cards (logo, badge, subtitle, 4 bullets,
 * "Learn How It Works"), two process panels (title, subtitle, one image,
 * one step title/desc, "Learn more"), and a bottom "Not sure which
 * filtration technology fits your application?" CTA card with two more
 * buttons. Five CTAs, three blocks of text per product, and no strong
 * image-to-text relationship.
 *
 * The redesign is two alternating media-and-text rows:
 *
 *   Row 1   [ ECO AIR visual ]  [ h2 / paragraph / 3 numbered steps / CTA ]
 *   Row 2   [ EARIA text     ]  [ EARIA visual ]
 *
 * with the DOM order inside each block fixed as head -> media -> tail so the
 * mobile stack can use CSS grid auto-placement to reach the required order
 * (heading/text -> image -> steps -> CTA) without any JavaScript.
 *
 * LAYOUT MECHANICS (why the media frame is built the way it is)
 * -----------------------------------------------------------
 * The media cell spans both grid rows so the visual can sit opposite the
 * whole text column. A grid item whose content contributes to intrinsic
 * sizing inflates the rows and opens a gap between the head and the tail.
 * Measured in the browser (grid-test.html), with a 567px column:
 *
 *   A  image in normal flow, media stretches -> media 567, head 265, tail 302
 *      (the square image's natural height grew the tracks: +92px dead space)
 *   B  align-self:start + fixed height        -> head 221, media 480, tail 259
 *   C  image absolutely positioned           -> head 173, media 383, tail 210
 *   D  align-self:start + contained image     -> head 221, media 480, tail 259
 *
 * Variant C is the only one with no gap: the absolute image contributes
 * nothing to track sizing, so the rows are sized purely by the text column
 * and the media frame simply stretches to match. It also keeps the image
 * uncropped -- `cover` would cut the orange coalescers and the gold nozzles
 * out of the ECO AIR render, and the right-edge labels out of the EARIA
 * schematic. Hence `object-fit: contain` on both.
 *
 * On mobile the frame is absolutely sized by `aspect-ratio` (1/1 for the
 * square ECO AIR render, 43/24 for the wide EARIA schematic) so it neither
 * collapses to zero height nor letterboxes.
 *
 * Usage:
 *   node build-technology-v2.js             # dry run only (validate the tree)
 *   node build-technology-v2.js --apply     # stage the new section, promote it, verify
 *   node build-technology-v2.js --verify    # rebuild the atomic CSS + run render checks
 *   node build-technology-v2.js --promote   # elementor/publish-document
 *
 * `--apply` is idempotent end-to-end: if the target document already carries the
 * new Technology section it skips the delete+build and goes straight to the
 * promote, then regenerates the atomic CSS and runs the render checks. Running
 * it twice cannot produce two Technology sections.
 */

const fs = require('fs');
const path = require('path');
const { init, callTool } = require('./mcpcall.js');

const POST_ID = 72;
/* The id of the Technology section that is currently in the LIVE post. It was
   75fefefa for the v1 section; the v2 build replaced it and was promoted, so
   the live section is now 7c5ed86b. Re-read it from
   `/?emifree_dump_autosave=1` before using this script to delete anything. */
const OLD_SECTION_ID = '7c5ed86b';
const PUBLIC_DIR = 'C:/Users/vpedr/Local Sites/landingwptest/app/public';
const SITE = 'http://landingwptest.local';

/* Media attachment ids. Both were renamed in place (file + metadata + alt
   text) by the one-shot mu-plugin emifree-tech-media.php, so the library
   holds exactly one copy of each diagram and the ids never changed.
     98  eco-air-self-cleaning-oil-mist-separator-diagram.webp  (1024x1024)
     99  earia-electrostatic-air-filtration-diagram.webp       (1376x768)  */
const TECH = [
  {
    key: 'eco',
    headCol: 2,
    mediaCol: 1,
    ratio: '1/1',
    anchor: 'technology-eco-air',
    imageId: 98,
    title: 'Self-cleaning filtration that keeps performance stable',
    lead:
      'ECO AIR captures oil mist and emulsions directly at the source, separates them mechanically, and recycles collected oil—without disposable filter mats.',
    steps: [
      { n: 1, title: 'Capture', desc: 'Contaminated air is drawn directly from the machine.' },
      {
        n: 2,
        title: 'Separate',
        desc: 'Mechanical filtration and coalescence remove oil mist and droplets.',
      },
      {
        n: 3,
        title: 'Recycle',
        desc: 'Integrated nozzles clean the system automatically and return collected oil for reuse.',
      },
    ],
    ctaText: 'See ECO AIR specifications',
    ctaUrl: '/en/products/mechanical/',
  },
  {
    key: 'earia',
    headCol: 1,
    mediaCol: 2,
    ratio: '43/24',
    anchor: 'technology-earia',
    imageId: 99,
    title: 'Electrostatic filtration for smoke and fine aerosols',
    lead:
      'EARIA captures smoke and fine aerosols using electrostatic filtration, then cleans the collector cells automatically to maintain consistent airflow.',
    steps: [
      { n: 1, title: 'Capture', desc: 'Contaminated air enters the filtration unit.' },
      { n: 2, title: 'Charge and collect', desc: 'Electrostatic cells charge and capture fine particles.' },
      {
        n: 3,
        title: 'Clean',
        desc: 'The system automatically cleans the collector cells to maintain performance.',
      },
    ],
    ctaText: 'See EARIA specifications',
    ctaUrl: '/en/products/electrostatic/',
  },
];

/* ------------------------------------------------------------------ XML --- */

function stepXml(t, st) {
  const k = t.key;
  const n = st.n;
  return [
    `          <e-flexbox configuration-id="technology-${k}-step-${n}">`,
    `            <e-flexbox configuration-id="technology-${k}-step-${n}-num">`,
    `              <e-paragraph configuration-id="technology-${k}-step-${n}-num-text"></e-paragraph>`,
    `            </e-flexbox>`,
    `            <e-flexbox configuration-id="technology-${k}-step-${n}-body">`,
    `              <e-heading configuration-id="technology-${k}-step-${n}-title"></e-heading>`,
    `              <e-paragraph configuration-id="technology-${k}-step-${n}-desc"></e-paragraph>`,
    `            </e-flexbox>`,
    `          </e-flexbox>`,
  ].join('\n');
}

function blockXml(t) {
  const k = t.key;
  return [
    `    <e-flexbox configuration-id="technology-block-${k}">`,
    `      <e-flexbox configuration-id="technology-${k}-head">`,
    `        <e-heading configuration-id="technology-${k}-title"></e-heading>`,
    `        <e-paragraph configuration-id="technology-${k}-lead"></e-paragraph>`,
    `      </e-flexbox>`,
    `      <e-flexbox configuration-id="technology-${k}-media">`,
    `        <e-image configuration-id="technology-${k}-image"></e-image>`,
    `      </e-flexbox>`,
    `      <e-flexbox configuration-id="technology-${k}-tail">`,
    `        <e-flexbox configuration-id="technology-${k}-steps">`,
    t.steps.map((st) => stepXml(t, st)).join('\n'),
    `        </e-flexbox>`,
    `        <e-button configuration-id="technology-${k}-cta"></e-button>`,
    `      </e-flexbox>`,
    `    </e-flexbox>`,
  ].join('\n');
}

function buildXml() {
  return [
    `<e-flexbox configuration-id="technology-section">`,
    `  <e-flexbox configuration-id="technology-inner">`,
    `    <e-paragraph configuration-id="technology-label"></e-paragraph>`,
    TECH.map(blockXml).join('\n'),
    `  </e-flexbox>`,
    `</e-flexbox>`,
  ].join('\n');
}

/* ------------------------------------------------------------- CONFIG ---- */

/*
 * `attributes` is deliberately not used: Attributes_Transformer::transform()
 * returns null, so the attributes prop is dropped at render time and no
 * data-* / aria-* / loading attribute can reach the DOM.
 */
function buildConfig() {
  const cfg = {
    'technology-section': { tag: 'section', _cssid: 'technology' },
    'technology-label': { tag: 'p', paragraph: 'HOW IT WORKS' },
  };

  for (const t of TECH) {
    const k = t.key;

    cfg[`technology-block-${k}`] = { tag: 'article', _cssid: t.anchor };
    cfg[`technology-${k}-title`] = { tag: 'h2', title: t.title };
    cfg[`technology-${k}-lead`] = { tag: 'p', paragraph: t.lead };
    cfg[`technology-${k}-image`] = { image: { src: { id: t.imageId }, size: 'full' } };

    for (const st of t.steps) {
      const n = st.n;
      cfg[`technology-${k}-step-${n}-num-text`] = { tag: 'p', paragraph: String(n) };
      cfg[`technology-${k}-step-${n}-title`] = { tag: 'h3', title: st.title };
      cfg[`technology-${k}-step-${n}-desc`] = { tag: 'p', paragraph: st.desc };
    }

    cfg[`technology-${k}-cta`] = {
      tag: 'a',
      text: t.ctaText,
      link: { destination: t.ctaUrl, isTargetBlank: false, tag: 'a' },
    };
  }

  return cfg;
}

/* -------------------------------------------------------------- STYLES --- */

/*
 * Tailwind values, spelled out:
 *   slate-50 #f8fafc  slate-200 #e2e8f0  slate-500 #64748b
 *   slate-600 #475569  slate-900 #0f172a
 *   blue-50 #eff6ff    blue-700 #1d4ed8    blue-800 #1e40af
 *   cyan-500 #06b6d4   cyan-700 #0891b2
 *
 * Elementor's atomic breakpoints are max-width queries:
 *   --mobile  <= 767px      --tablet  <= 1024px      (desktop = the default)
 * The stylesheets are enqueued desktop -> tablet -> mobile, so the mobile
 * variant wins at equal specificity.
 *
 * `background-image` has no atomic converter (the atomic `background` prop is
 * a shape, not a plain CSS value), so the CTA gradient is written through
 * the custom_css fallback -- the same mechanism the hero gradient uses.
 */
function buildStyles() {
  const s = {};

  s['technology-section'] =
    `background-color: #f8fafc; ` +
    `padding: 96px 0px; ` +
    `display: flex; ` +
    `flex-direction: column; ` +
    `width: 100%; ` +
    `scroll-margin-top: 80px; ` +
    `@media(--tablet) { padding: 72px 0px; } ` +
    `@media(--mobile) { padding: 56px 0px; }`;

  // Matches the products / applications containers exactly (1280 + 32 gutter),
  // so the three sections share one left edge.
  s['technology-inner'] =
    `max-width: 1280px; ` +
    `padding: 0px 32px; ` +
    `margin: 0px auto; ` +
    `display: flex; ` +
    `flex-direction: column; ` +
    `@media(--tablet) { padding: 0px 24px; } ` +
    `@media(--mobile) { padding: 0px 16px; }`;

  s['technology-label'] =
    `font-size: 13px; ` +
    `font-weight: 700; ` +
    `line-height: 1.2; ` +
    `letter-spacing: 0.14em; ` +
    `text-transform: uppercase; ` +
    `color: #1d4ed8; ` +
    `margin: 0px 0px 56px 0px; ` +
    `padding: 0px; ` +
    `@media(--mobile) { margin: 0px 0px 36px 0px; }`;

  TECH.forEach((t, ti) => {
    const k = t.key;
    const isLast = ti === TECH.length - 1;

    // The block is a two-column grid. The media cell spans both rows; the
    // head and the tail share the other column, head in row 1 and tail in
    // row 2. `column-gap` is the horizontal gutter (row-gap is not a
    // supported atomic property -- the vertical gap is the tail's margin).
    s[`technology-block-${k}`] =
      `display: grid; ` +
      `grid-template-columns: 1fr 1fr; ` +
      `column-gap: 64px; ` +
      `align-items: stretch; ` +
      `margin: 0px 0px ${isLast ? '0px' : '96px'} 0px; ` +
      `padding: 0px; ` +
      `@media(--tablet) { column-gap: 40px; margin: 0px 0px ${isLast ? '0px' : '72px'} 0px; } ` +
      `@media(--mobile) { grid-template-columns: 1fr; margin: 0px 0px ${isLast ? '0px' : '56px'} 0px; }`;

    s[`technology-${k}-head`] =
      `grid-column: ${t.headCol}; ` +
      `grid-row: 1; ` +
      `display: flex; ` +
      `flex-direction: column; ` +
      `align-items: flex-start; ` +
      `padding: 0px; ` +
      `@media(--mobile) { grid-column: auto; grid-row: auto; }`;

    // The frame stretches to the height of the two rows it spans. The image
    // inside is absolutely positioned so it contributes nothing to the track
    // sizing -- that is what keeps the head and the tail flush.
    //
    // Desktop keeps the stretch, so the two columns share one grid and the
    // cards line up with the text. Below 1025px the text column is much
    // taller relative to its width, and a stretched frame would leave a large
    // empty band above and below the diagram (at 768px the square ECO AIR
    // render sat in a 340x640 card with ~150px of white above and below it).
    // There the frame takes its height from the image's own aspect ratio and
    // is centred against the text column instead.
    s[`technology-${k}-media`] =
      `grid-column: ${t.mediaCol}; ` +
      `grid-row: 1 / 3; ` +
      `position: relative; ` +
      `overflow: hidden; ` +
      `background-color: #ffffff; ` +
      `border-width: 1px; ` +
      `border-style: solid; ` +
      `border-color: #e2e8f0; ` +
      `border-radius: 20px; ` +
      `padding: 0px; ` +
      `@media(--tablet) { ` +
      `  align-self: center; ` +
      `  aspect-ratio: ${t.ratio}; ` +
      `}` +
      `@media(--mobile) { ` +
      `  grid-column: auto; ` +
      `  grid-row: auto; ` +
      `  align-self: start; ` +
      `  aspect-ratio: ${t.ratio}; ` +
      `}`;

    s[`technology-${k}-image`] =
      `position: absolute; ` +
      `inset-block-start: 0px; ` +
      `inset-inline-start: 0px; ` +
      `inset-block-end: 0px; ` +
      `inset-inline-end: 0px; ` +
      `width: 100%; ` +
      `height: 100%; ` +
      `object-fit: contain;`;

    s[`technology-${k}-tail`] =
      `grid-column: ${t.headCol}; ` +
      `grid-row: 2; ` +
      `display: flex; ` +
      `flex-direction: column; ` +
      `align-items: stretch; ` +
      `margin: 40px 0px 0px 0px; ` +
      `padding: 0px; ` +
      `@media(--mobile) { grid-column: auto; grid-row: auto; margin: 32px 0px 0px 0px; }`;

    s[`technology-${k}-title`] =
      `font-size: 34px; ` +
      `font-weight: 700; ` +
      `line-height: 1.2; ` +
      `color: #0f172a; ` +
      `margin: 0px 0px 16px 0px; ` +
      `padding: 0px; ` +
      `@media(--tablet) { font-size: 30px; } ` +
      `@media(--mobile) { font-size: 26px; line-height: 1.25; }`;

    s[`technology-${k}-lead`] =
      `font-size: 17px; ` +
      `line-height: 1.65; ` +
      `color: #475569; ` +
      `margin: 0px; ` +
      `padding: 0px; ` +
      `@media(--mobile) { font-size: 16px; line-height: 1.6; }`;

    s[`technology-${k}-steps`] =
      `display: flex; ` +
      `flex-direction: column; ` +
      `gap: 20px; ` +
      `padding: 0px;`;

    for (const st of t.steps) {
      const n = st.n;

      s[`technology-${k}-step-${n}`] =
        `display: flex; ` +
        `flex-direction: row; ` +
        `align-items: flex-start; ` +
        `gap: 14px; ` +
        `padding: 0px;`;

      s[`technology-${k}-step-${n}-num`] =
        `flex: 0 0 auto; ` +
        `width: 30px; ` +
        `height: 30px; ` +
        `display: inline-flex; ` +
        `align-items: center; ` +
        `justify-content: center; ` +
        `border-radius: 9999px; ` +
        `background-color: #eff6ff; ` +
        `padding: 0px;`;

      s[`technology-${k}-step-${n}-num-text`] =
        `font-size: 13px; ` +
        `font-weight: 700; ` +
        `line-height: 1; ` +
        `color: #1d4ed8; ` +
        `margin: 0px; ` +
        `padding: 0px;`;

      s[`technology-${k}-step-${n}-body`] =
        `display: flex; ` +
        `flex-direction: column; ` +
        `gap: 3px; ` +
        `flex: 1 1 auto; ` +
        `min-width: 0px; ` +
        `padding: 0px;`;

      s[`technology-${k}-step-${n}-title`] =
        `font-size: 16px; ` +
        `font-weight: 600; ` +
        `line-height: 1.4; ` +
        `color: #0f172a; ` +
        `margin: 0px; ` +
        `padding: 0px;`;

      s[`technology-${k}-step-${n}-desc`] =
        `font-size: 15px; ` +
        `line-height: 1.6; ` +
        `color: #475569; ` +
        `padding: 0px;`;
    }

    s[`technology-${k}-cta`] =
      `display: inline-flex; ` +
      `align-items: center; ` +
      `justify-content: center; ` +
      `align-self: flex-start; ` +
      `background-color: #1d4ed8; ` +
      `background-image: linear-gradient(90deg, #1d4ed8 0%, #06b6d4 100%); ` +
      `border-width: 0px; ` +
      `border-style: solid; ` +
      `border-color: transparent; ` +
      `border-radius: 9999px; ` +
      `box-shadow: none; ` +
      `padding: 14px 28px; ` +
      `margin: 36px 0px 0px 0px; ` +
      `min-height: 48px; ` +
      `font-size: 16px; ` +
      `font-weight: 600; ` +
      `line-height: 1.5; ` +
      `color: #ffffff; ` +
      `text-decoration: none; ` +
      `&:hover { background-image: linear-gradient(90deg, #1e40af 0%, #0891b2 100%); } ` +
      `&:focus { ` +
      `  outline-width: 2px; ` +
      `  outline-style: solid; ` +
      `  outline-color: #3b82f6; ` +
      `  outline-offset: 2px; ` +
      `}`;
  });

  return s;
}

/* --------------------------------------------------------------- TOOL ---- */

function toolText(r) {
  const content = r?.result?.content ?? [];
  const texts = content.filter((b) => b.type === 'text').map((b) => b.text);
  if (texts.length) return texts.join('\n');
  return JSON.stringify(r, null, 1);
}

function isError(r) {
  if (r?.result?.isError) return true;
  const t = toolText(r);
  return /"error"|errors?\s*:/i.test(t) && /prop_not_supported|invalid|failed|empty_composition/i.test(t);
}

async function httpGet(url) {
  const res = await fetch(url, { redirect: 'manual' });
  return { status: res.status, body: await res.text() };
}

/* Where did the last write land -- the post itself or an autosave revision? */
async function diag() {
  const r = await httpGet(`${SITE}/?emifree_diag_revs=1`);
  try {
    return JSON.parse(r.body);
  } catch (e) {
    return { raw: r.body.slice(0, 400) };
  }
}

/* The staged document tree, so a run can tell what is already in place.
   elementor/get-page-structure reads the LIVE post, not the autosave, so the
   one-shot mu-plugin emifree-dump-autosave.php dumps the resolved target. */
async function stagedTree() {
  const r = await httpGet(`${SITE}/?emifree_dump_autosave=1`);
  try {
    return JSON.parse(r.body);
  } catch (e) {
    return null;
  }
}

function treeHasText(tree, text) {
  const walk = (nodes) =>
    (nodes || []).some(
      (n) => n.text === text || (n.children && n.children.length ? walk(n.children) : false)
    );
  return walk(tree);
}

function printDiag(d) {
  console.log('  post meta bytes :', d.post_meta_bytes);
  const autos = (d.revisions || []).filter((r) => String(r.post_name).includes('autosave'));
  console.log('  autosave revs   :', autos.length ? JSON.stringify(autos) : 'none');
  for (const res of d.resolution || []) {
    console.log(
      `  resolution       : id=${res.id} is_autosave=${res.is_autosave} autosave_id=${res.autosave_id}`
    );
  }
}

/* Regenerate the atomic CSS and run the render checks. */
async function runVerify() {
  console.log('=== REGENERATE ATOMIC CSS ===');
  const bust = await httpGet(`${SITE}/?emifree_rebuild_72=1`);
  console.log('rebuild status:', bust.status);

  const reportPath = path.join(PUBLIC_DIR, 'wp-content/emifree-rebuild-72.json');
  if (fs.existsSync(reportPath)) {
    const rep = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    console.log('\n--- rebuild log ---');
    rep.log.forEach((l) => console.log(' ', l));
    for (const f of rep.css_files) {
      console.log(`\n--- ${f.name} (${f.bytes} bytes) ---`);
      console.log(f.css);
    }
  } else {
    console.error('rebuild report missing:', reportPath);
  }

  const html = path.join(PUBLIC_DIR, 'wp-content/emifree-live-72.html');
  if (!fs.existsSync(html)) {
    console.error('render file missing:', html);
    return;
  }
  const h = fs.readFileSync(html, 'utf8');
  const techStart = h.indexOf('id="technology"');
  const techEnd = h.indexOf('id="knowledge"');
  const tech = techStart >= 0 ? h.slice(techStart, techEnd > techStart ? techEnd : h.length) : '';

  console.log('\n=== RENDER CHECKS ===');
  const count = (needle, hay) => (hay.match(new RegExp(needle, 'g')) || []).length;
  const checks = {
    'section id #technology': h.includes('id="technology"'),
    'exactly one #technology section': count('id="technology"', h) === 1,
    'exactly 2 article blocks': count('<article', tech) === 2,
    'section label HOW IT WORKS': h.includes('HOW IT WORKS'),
    'eco anchor id': h.includes('id="technology-eco-air"'),
    'earia anchor id': h.includes('id="technology-earia"'),
    'eco h2': h.includes('Self-cleaning filtration that keeps performance stable'),
    'earia h2': h.includes('Electrostatic filtration for smoke and fine aerosols'),
    'eco lead': h.includes('ECO AIR captures oil mist and emulsions directly at the source'),
    'earia lead': h.includes('EARIA captures smoke and fine aerosols using electrostatic filtration'),
    'eco step 1': h.includes('Contaminated air is drawn directly from the machine.'),
    'eco step 2': h.includes('Mechanical filtration and coalescence remove oil mist and droplets.'),
    'eco step 3': h.includes('Integrated nozzles clean the system automatically and return collected oil for reuse.'),
    'earia step 1': h.includes('Contaminated air enters the filtration unit.'),
    'earia step 2': h.includes('Electrostatic cells charge and capture fine particles.'),
    'earia step 3': h.includes('The system automatically cleans the collector cells to maintain performance.'),
    'charge and collect title': h.includes('Charge and collect'),
    'eco cta text': h.includes('See ECO AIR specifications'),
    'earia cta text': h.includes('See EARIA specifications'),
    'eco cta url': h.includes('href="/en/products/mechanical/"'),
    'earia cta url': h.includes('href="/en/products/electrostatic/"'),
    'exactly 2 ctas in section': count('See (ECO AIR|EARIA) specifications', tech) === 2,
    'exactly 2 images in section': count('<img', tech) === 2,
    'eco image file': tech.includes('eco-air-self-cleaning-oil-mist-separator-diagram'),
    'earia image file': tech.includes('earia-electrostatic-air-filtration-diagram'),
    'eco alt text': tech.includes(
      'Cutaway diagram of the ECO AIR oil mist separator showing mechanical filtration, self-cleaning nozzles, and oil recycling.'
    ),
    'earia alt text': tech.includes(
      'Diagram of the EARIA electrostatic air filtration system showing particle charging, collection, and automatic cleaning.'
    ),
    'no old section h2': !h.includes('Choose the Right Filtration Technology'),
    'no old badges': !h.includes('Best for Oil Mist') && !h.includes('Best for Smoke'),
    'no Learn How It Works': !h.includes('Learn How It Works'),
    'no old bottom cta': !h.includes('Not sure which filtration technology'),
    'no eco_air logo': !h.includes('eco_air_final'),
    'no old bullets': !h.includes('Self-cleaning system') && !h.includes('No filter mats'),
    /* The hero root is element 49847864 and carries no _cssid, so it has no
       id="hero" -- match the h1 text and the root element id instead. */
    'hero still present':
      h.includes('Low maintenance air filtration solutions') && h.includes('data-id="49847864"'),
    'hero video still present': h.includes('e-background-video__media'),
    'products still present': h.includes('id="products"'),
    'applications still present': h.includes('id="applications"'),
  };
  let fails = 0;
  for (const [k, v] of Object.entries(checks)) {
    if (!v) fails++;
    console.log(`${v ? 'OK  ' : 'FAIL'} ${k}`);
  }
  console.log('render bytes:', h.length, '| tech slice bytes:', tech.length, '| failures:', fails);
  fs.writeFileSync('C:/Users/vpedr/AppData/Local/Temp/novamira-svg/render-72.html', h);
  process.exitCode = fails ? 1 : 0;
}

async function main() {
  const apply = process.argv.includes('--apply');
  const verify = process.argv.includes('--verify');
  const promote = process.argv.includes('--promote');
  /* --rebuild forces the delete + build even when the target already carries
     the section -- that is how the section is replaced by a newer revision of
     itself. --apply alone stays idempotent. */
  const rebuild = process.argv.includes('--rebuild');

  const xml = buildXml();
  const style = buildStyles();
  const config = buildConfig();

  await init();

  if (promote) {
    console.log('=== PROMOTE (elementor/publish-document) ===');
    const r = await callTool('elementor-publish-document', { post_id: POST_ID });
    console.log(toolText(r));
    const d = await diag();
    console.log('\n--- after promote ---');
    printDiag(d);
    return;
  }

  if (verify) {
    await runVerify();
    return;
  }

  /* ---- apply ---------------------------------------------------------- */

  if (apply) {
    console.log('=== BEFORE ===');
    printDiag(await diag());

    const staged = await stagedTree();
    const alreadyStaged = staged && treeHasText(staged.tree, 'HOW IT WORKS');
    console.log(
      '  staged target    :',
      staged ? `id=${staged.target_id} is_autosave=${staged.target_is_auto} bytes=${staged.target_bytes}` : 'n/a'
    );

    if (alreadyStaged && !rebuild) {
      console.log('\n=== NEW TECHNOLOGY SECTION ALREADY STAGED -- skipping delete + build ===');
    } else {
      console.log(`\n=== DELETE OLD TECHNOLOGY SECTION (${OLD_SECTION_ID}) ===`);
      const del = await callTool('elementor-manage-elements', {
        post_id: POST_ID,
        operations: [{ action: 'delete', element_id: OLD_SECTION_ID }],
      });
      console.log(toolText(del));
      if (isError(del)) {
        console.error('\nDelete failed.');
        process.exit(1);
      }

      console.log('\n=== AFTER DELETE ===');
      const d = await diag();
      printDiag(d);
      const resolved = (d.resolution || []).find((r) => r.is_autosave);
      if (!resolved) {
        console.error('\nThe delete did NOT land in an autosave -- aborting before the build.');
        process.exit(1);
      }

      const base = {
        post_id: POST_ID,
        xml_structure: xml,
        element_config: config,
        style,
        parent_id: 'document',
        mode: 'append',
      };

      console.log('\n=== DRY RUN ===');
      const dry = await callTool('elementor-build-composition', { ...base, dry_run: true });
      console.log(toolText(dry));
      if (isError(dry)) {
        console.error('\nDry run failed. Aborting.');
        process.exit(1);
      }

      console.log('\n=== APPLY ===');
      const saved = await callTool('elementor-build-composition', { ...base, dry_run: false });
      console.log(toolText(saved));
      if (isError(saved)) {
        console.error('\nApply failed.');
        process.exit(1);
      }

      console.log('\n=== AFTER BUILD ===');
      printDiag(await diag());
    }

    console.log('\n=== PROMOTE (elementor/publish-document) ===');
    const pr = await callTool('elementor-publish-document', { post_id: POST_ID });
    console.log(toolText(pr));
    console.log('\n--- after promote ---');
    printDiag(await diag());

    await runVerify();
    return;
  }

  /* ---- dry run only --------------------------------------------------- */

  const base = {
    post_id: POST_ID,
    xml_structure: xml,
    element_config: config,
    style,
    parent_id: 'document',
    mode: 'append',
  };

  console.log('\n=== DRY RUN ===');
  const dry = await callTool('elementor-build-composition', { ...base, dry_run: true });
  console.log(toolText(dry));
  if (isError(dry)) {
    console.error('\nDry run failed. Aborting.');
    process.exit(1);
  }

  console.log('\nDry run OK. Re-run with --apply to persist.');
}

main().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
