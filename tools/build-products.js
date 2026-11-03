#!/usr/bin/env node
'use strict';
/*
 * Build the Products section into Elementor post 72.
 *
 * Source of truth: wp-content/themes/emifree-landing/template-parts/section-products.php
 * Attachment ids come from wp-content/emifree-import-products-media.json (written by
 * the one-shot mu-plugin emifree-import-products-media.php).
 *
 * Usage:
 *   node build-products.js            # dry run only (validate, print warnings)
 *   node build-products.js --apply    # dry run, then persist
 *   node build-products.js --verify   # after apply: rebuild atomic CSS + dump render
 */

const fs = require('fs');
const path = require('path');
const { init, callTool } = require('./mcpcall.js');

const POST_ID = 72;
const PUBLIC_DIR = 'C:/Users/vpedr/Local Sites/landingwptest/app/public';
const MEDIA_REPORT = path.join(PUBLIC_DIR, 'wp-content/emifree-import-products-media.json');
const SITE = 'http://landingwptest.local';

const CARDS = [
  {
    key: 'mechanical',
    title: 'Mechanical Filtration',
    url: '/en/products/mechanical/',
    img: 'fotom1.webp',
  },
  {
    key: 'electrostatic',
    title: 'Electrostatic Filtration',
    // The live EN template links to home_url('/products/electrostatic/') — no /en/ prefix.
    // That is a live-theme bug (it leaves the English section); the Elementor build
    // uses the correct /en/ path. Flagged to the user; the theme still needs the fix.
    url: '/en/products/electrostatic/',
    img: 'fotoe2.webp',
  },
  {
    key: 'dust',
    title: 'Dust Filtration',
    url: '/en/products/dust/',
    img: 'dust_filter-emi.png',
  },
];

const ARROW_FILE = 'arrow-right.svg';

/* ------------------------------------------------------------------ XML --- */

function cardXml(c) {
  return [
    `<e-flexbox configuration-id="card-${c.key}">`,
    `  <e-div-block configuration-id="card-${c.key}-media">`,
    `    <e-image configuration-id="card-${c.key}-image"></e-image>`,
    `  </e-div-block>`,
    `  <e-div-block configuration-id="card-${c.key}-footer">`,
    `    <e-heading configuration-id="card-${c.key}-title"></e-heading>`,
    `    <e-flexbox configuration-id="card-${c.key}-cta">`,
    `      <e-paragraph configuration-id="card-${c.key}-cta-label"></e-paragraph>`,
    `      <e-svg configuration-id="card-${c.key}-arrow"></e-svg>`,
    `    </e-flexbox>`,
    `  </e-div-block>`,
    `</e-flexbox>`,
  ].join('\n');
}

function buildXml() {
  const cards = CARDS.map(cardXml).join('\n');
  return [
    `<e-flexbox configuration-id="products-section">`,
    `  <e-flexbox configuration-id="products-inner">`,
    `    <e-flexbox configuration-id="products-header">`,
    `      <e-heading configuration-id="products-title"></e-heading>`,
    `      <e-paragraph configuration-id="products-subtitle"></e-paragraph>`,
    `    </e-flexbox>`,
    `    <e-grid configuration-id="products-grid">`,
    cards,
    `    </e-grid>`,
    `  </e-flexbox>`,
    `</e-flexbox>`,
  ].join('\n');
}

/* ------------------------------------------------------------- CONFIG ---- */

/*
 * NOTE on `attributes` (aria-label): it CANNOT be used here.
 * `Attributes_Transformer::transform()` (props-resolver/transformers/settings/
 * attributes-transformer.php) returns null, so the `attributes` array is dropped
 * at render time; the plain resolver also rejects a raw string for that
 * array-typed prop. The card <a> therefore gets its accessible name from its
 * own text content ("Mechanical Filtration" + "Learn more"), which is why the
 * product images keep alt="" (decorative) — see the alt meta note below.
 */
function buildConfig(ids) {
  const cfg = {
    'products-section': { tag: 'section', _cssid: 'products' },
    'products-title': {
      tag: 'h2',
      title: 'Industrial Air Filtration Product Range',
    },
    'products-subtitle': {
      tag: 'p',
      paragraph:
        'Professional-grade filtration systems designed for CNC workshops, metalworking shops, and industrial manufacturing environments.',
    },
  };

  for (const c of CARDS) {
    const card = {
      tag: 'a',
      link: { destination: c.url, isTargetBlank: false, tag: 'a' },
    };
    cfg[`card-${c.key}`] = card;
    cfg[`card-${c.key}-title`] = { tag: 'h3', title: c.title };
    cfg[`card-${c.key}-cta-label`] = { tag: 'span', paragraph: 'Learn more' };
    cfg[`card-${c.key}-image`] = {
      image: { src: { id: ids[c.img] }, size: 'full' },
    };
    cfg[`card-${c.key}-arrow`] = { svg: { id: ids[ARROW_FILE] } };
  }

  return cfg;
}

/* -------------------------------------------------------------- STYLES --- */

function buildStyles() {
  const s = {};

  s['products-section'] =
    `background-color: #f8fafc; ` +
    `padding: 96px 0px; ` +
    `display: flex; ` +
    `flex-direction: column; ` +
    `@media(--mobile) { padding: 48px 0px; }`;

  s['products-inner'] =
    `max-width: 1280px; ` +
    `margin: 0px auto; ` +
    `padding: 0px 32px; ` +
    `display: flex; ` +
    `flex-direction: column; ` +
    `@media(--tablet) { padding: 0px 24px; } ` +
    `@media(--mobile) { padding: 0px 16px; }`;

  s['products-header'] =
    `display: flex; ` +
    `flex-direction: column; ` +
    `align-items: center; ` +
    `text-align: center; ` +
    `margin: 0px 0px 48px 0px; ` +
    `padding: 0px;`;

  // text-4xl / md:text-5xl -> 36px/40px, 48px/48px
  s['products-title'] =
    `font-size: 48px; ` +
    `font-weight: 700; ` +
    `line-height: 1; ` +
    `color: #18181b; ` +
    `margin: 0px 0px 24px 0px; ` +
    `@media(--mobile) { font-size: 36px; line-height: 1.11; }`;

  s['products-subtitle'] =
    `font-size: 20px; ` +
    `line-height: 1.4; ` +
    `color: #52525b; ` +
    `max-width: 768px; ` +
    `margin: 0px auto; ` +
    `padding: 0px;`;

  s['products-grid'] =
    `display: grid; ` +
    `grid-template-columns: repeat(3, 1fr); ` +
    `grid-template-rows: auto; ` +
    `gap: 24px; ` +
    `align-items: start; ` +
    `padding: 0px; ` +
    `@media(--tablet) { grid-template-columns: repeat(2, 1fr); } ` +
    `@media(--mobile) { grid-template-columns: 1fr; }`;

  for (const c of CARDS) {
    const k = c.key;

    s[`card-${k}`] =
      `position: relative; ` +
      `display: flex; ` +
      `flex-direction: column; ` +
      `aspect-ratio: 4/5; ` +
      `overflow: hidden; ` +
      `border-radius: 16px; ` +
      `background-color: #ffffff; ` +
      `color: #18181b; ` +
      `text-decoration: none; ` +
      `padding: 0px; ` +
      `box-shadow: 0px 4px 6px -1px rgba(0,0,0,0.1), 0px 2px 4px -2px rgba(0,0,0,0.1); ` +
      `transition: transform 0.3s ease, box-shadow 0.3s ease; ` +
      `&:hover { ` +
      `  transform: translateY(-8px); ` +
      `  box-shadow: 0px 25px 50px -12px rgba(0,0,0,0.25); ` +
      `} ` +
      `&:focus { ` +
      `  outline-width: 2px; ` +
      `  outline-style: solid; ` +
      `  outline-color: #3b82f6; ` +
      `  outline-offset: 2px; ` +
      `}`;

    s[`card-${k}-media`] =
      `position: relative; ` +
      `flex: 1 1 0%; ` +
      `overflow: hidden; ` +
      `min-height: 0px; ` +
      `padding: 0px;`;

    // `inset` is not a Style_Schema property (it would fall back to custom_css,
    // which the Pro license filter strips). The four logical longhands are real
    // atomic props and render identically.
    s[`card-${k}-image`] =
      `position: absolute; ` +
      `inset-block-start: 0px; ` +
      `inset-inline-end: 0px; ` +
      `inset-block-end: 0px; ` +
      `inset-inline-start: 0px; ` +
      `width: 100%; ` +
      `height: 100%; ` +
      `padding: 24px; ` +
      `object-fit: contain; ` +
      `transition: transform 0.5s ease; ` +
      `&:hover { transform: scale(1.05); }`;

    s[`card-${k}-footer`] =
      `background-image: linear-gradient(180deg, #2563eb 0%, #1e40af 100%); ` +
      `padding: 24px; ` +
      `color: #ffffff; ` +
      `flex: 0 0 auto; ` +
      `&:hover { background-image: linear-gradient(180deg, #1d4ed8 0%, #1e3a8a 100%); }`;

    s[`card-${k}-title`] =
      `font-size: 24px; ` +
      `font-weight: 700; ` +
      `line-height: 1.33; ` +
      `color: #ffffff; ` +
      `margin: 0px 0px 8px 0px; ` +
      // Tailwind's drop-shadow-md = 0 1px 1px rgb(0 0 0 / 0.1) + 0 1px 2px rgb(0 0 0 / 0.1)
      `filter: drop-shadow(0px 1px 1px rgba(0,0,0,0.1)) drop-shadow(0px 1px 2px rgba(0,0,0,0.1));`;

    s[`card-${k}-cta`] =
      `display: inline-flex; ` +
      `align-items: center; ` +
      `gap: 8px; ` +
      `padding: 0px; ` +
      `color: #ffffff;`;

    s[`card-${k}-cta-label`] =
      `font-size: 14px; ` +
      `font-weight: 600; ` +
      `line-height: 1.43; ` +
      `color: #ffffff; ` +
      `margin: 0px; ` +
      `padding: 0px;`;

    s[`card-${k}-arrow`] =
      `width: 16px; ` +
      `height: 16px; ` +
      `display: inline-block; ` +
      `flex: 0 0 auto; ` +
      `transition: transform 0.3s ease; ` +
      `&:hover { transform: translateX(4px); }`;
  }

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

/* --------------------------------------------------------------- MAIN ---- */

async function httpGet(url) {
  const res = await fetch(url, { redirect: 'manual' });
  return { status: res.status, body: await res.text() };
}

async function main() {
  const apply = process.argv.includes('--apply');
  const verify = process.argv.includes('--verify');

  if (!fs.existsSync(MEDIA_REPORT)) {
    console.error('FATAL: media report missing:', MEDIA_REPORT);
    console.error('Run: curl "http://landingwptest.local/?emifree_import_products_media=1"');
    process.exit(1);
  }
  const report = JSON.parse(fs.readFileSync(MEDIA_REPORT, 'utf8'));
  const ids = {};
  for (const [file, info] of Object.entries(report)) {
    if (!info.id) {
      console.error('FATAL: no attachment id for', file, JSON.stringify(info));
      process.exit(1);
    }
    ids[file] = info.id;
  }
  console.log('attachment ids:', ids);

  const xml = buildXml();
  const style = buildStyles();
  const config = buildConfig(ids);

  const info = await init();
  console.log('mcp session:', info.sessionId);

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

  if (!apply) {
    console.log('\nDry run OK. Re-run with --apply to persist.');
    return;
  }

  console.log('\n=== APPLY ===');
  const saved = await callTool('elementor-build-composition', { ...base, dry_run: false });
  console.log(toolText(saved));
  if (isError(saved)) {
    console.error('\nApply failed.');
    process.exit(1);
  }

  if (verify) {
    console.log('\n=== REGENERATE ATOMIC CSS + RENDER ===');
    // mu-plugin emifree-rebuild-72-css.php fires the real front-end CSS pipeline
    // (elementor/post/render + elementor/frontend/after_enqueue_post_styles),
    // which is the only way the atomic stylesheets get rewritten.
    const bust = await httpGet(`${SITE}/?emifree_rebuild_72=1`);
    console.log('rebuild status:', bust.status, bust.body.slice(0, 300));

    const reportPath = path.join(PUBLIC_DIR, 'wp-content/emifree-rebuild-72.json');
    if (fs.existsSync(reportPath)) {
      const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      console.log('\n--- rebuild log ---');
      report.log.forEach((l) => console.log(' ', l));
      for (const f of report.css_files) {
        console.log(`\n--- ${f.name} (${f.bytes} bytes) ---`);
        console.log(f.css);
      }
    } else {
      console.error('rebuild report missing:', reportPath);
    }

    const html = path.join(PUBLIC_DIR, 'wp-content/emifree-live-72.html');
    if (fs.existsSync(html)) {
      const h = fs.readFileSync(html, 'utf8');
      console.log('\n=== RENDER CHECKS ===');
      const checks = {
        'products section id': h.includes('id="products"'),
        'h2 title': h.includes('Industrial Air Filtration Product Range'),
        'subtitle': h.includes('Professional-grade filtration systems'),
        'card 1 link': h.includes('/en/products/mechanical/'),
        'card 2 link': h.includes('/en/products/electrostatic/'),
        'card 3 link': h.includes('/en/products/dust/'),
        'h3 mechanical': h.includes('Mechanical Filtration'),
        'h3 electrostatic': h.includes('Electrostatic Filtration'),
        'h3 dust': h.includes('Dust Filtration'),
        'learn more': h.includes('Learn more'),
        'arrow svg inlined': h.includes('m12 5 7 7-7 7'),
        'fotom1 image': h.includes('fotom1'),
        'fotoe2 image': h.includes('fotoe2'),
        'dust image': h.includes('dust_filter-emi'),
        'no stray aria-label prop': !h.includes('aria-label'),
      };
      for (const [k, v] of Object.entries(checks)) {
        console.log(`${v ? 'OK  ' : 'FAIL'} ${k}`);
      }
      console.log('render bytes:', h.length);
      fs.writeFileSync(
        'C:/Users/vpedr/AppData/Local/Temp/novamira-svg/render-72.html',
        h
      );
    } else {
      console.error('render file missing:', html);
    }
  }
}

main().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
