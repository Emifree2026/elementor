#!/usr/bin/env node
'use strict';
/*
 * Build the Applications section into Elementor post 72, using the Accordion widget.
 *
 * Source of truth:
 *   - markup : wp-content/themes/emifree-landing/template-parts/section-applications.php
 *   - data   : wp-content/themes/emifree-landing/inc/applications.php
 *   - icons  : wp-content/themes/emifree-landing/assets/icons/app-*.svg
 *
 * Attachment ids come from wp-content/emifree-app-media.json (written by the
 * one-shot mu-plugin emifree-import-app-media.php, which deletes itself).
 *
 * Why an accordion: the live cards expand on group-hover / group-focus-within.
 * That works with a mouse and partially with a keyboard, but on touch a tap
 * focuses the card, expands it, and leaves it open until you tap elsewhere.
 * The Accordion widget renders native <details>/<summary>, so expansion is
 * explicit and identical on every device, and the collapsed text stays in the
 * DOM for crawlers and screen readers.
 *
 * Usage:
 *   node build-applications.js            # dry run only (validate, print warnings)
 *   node build-applications.js --apply    # dry run, then persist
 *   node build-applications.js --verify   # after apply: rebuild atomic CSS + dump render
 */

const fs = require('fs');
const path = require('path');
const { init, callTool } = require('./mcpcall.js');

const POST_ID = 72;
const PUBLIC_DIR = 'C:/Users/vpedr/Local Sites/landingwptest/app/public';
const MEDIA_REPORT = path.join(PUBLIC_DIR, 'wp-content/emifree-app-media.json');
const SITE = 'http://landingwptest.local';

/* The six applications, verbatim from emifree_applications() in inc/applications.php. */
const APPS = [
  {
    key: 'cnc',
    icon: 'app-cnc.svg',
    title: 'CNC Machining & Tool Shops',
    description:
      'Remove oil mist and coolant fumes from CNC lathes, mills, and routers without stopping production. Keep your machines clean and operators healthy.',
    question: 'How do I remove oil mist from my CNC machine without stopping production?',
  },
  {
    key: 'metal',
    icon: 'app-metal.svg',
    title: 'Metalworking & Welding',
    description:
      'Capture welding fumes, metal dust, and grinding particles at the source. Protect your workforce from harmful particulates and meet EU safety standards.',
    question: 'What is the best way to filter welding fumes in a small workshop?',
  },
  {
    key: 'grinding',
    icon: 'app-grinding.svg',
    title: 'Grinding & Polishing',
    description:
      'Extract abrasive dust from surface grinding, cylindrical grinding, and polishing operations. Extend equipment lifespan and improve surface finish quality.',
    question: 'How to control dust from surface grinding machines?',
  },
  {
    key: 'bearing',
    icon: 'app-bearing.svg',
    title: 'Bearing & Precision Parts Manufacturing',
    description:
      'Maintain clean air in bearing production, gear manufacturing, and precision engineering. Protect sensitive components from contamination.',
    question: 'Best air filtration for bearing manufacturing clean rooms',
  },
  {
    key: 'heavy',
    icon: 'app-heavy.svg',
    title: 'Heavy Industry & Metal Fabrication',
    description:
      'Handle high-volume dust and mist generation in fabrication shops, press rooms, and assembly lines. Industrial-grade filtration for demanding environments.',
    question: 'Industrial dust extraction system for metal fabrication shop',
  },
  {
    key: 'auto',
    icon: 'app-auto.svg',
    title: 'Automotive',
    description:
      'Capture oil mist, coolant aerosol, and welding fumes from automotive production lines. Keep paint booths particle-free and EV battery assembly clean room compliant.',
    question:
      'Best air filtration system for automotive manufacturing plant oil mist and welding fume extraction',
  },
];

const CHEVRON_FILE = 'chevron-down.svg';

/* ------------------------------------------------------------------ XML --- */

function itemXml(a) {
  return [
    `<e-accordion-item configuration-id="app-${a.key}">`,
    `  <e-accordion-item-header configuration-id="app-${a.key}-header">`,
    `    <e-accordion-item-title configuration-id="app-${a.key}-title">`,
    `      <e-svg configuration-id="app-${a.key}-icon"></e-svg>`,
    `      <e-heading configuration-id="app-${a.key}-label"></e-heading>`,
    `    </e-accordion-item-title>`,
    `    <e-accordion-item-icon configuration-id="app-${a.key}-chevron">`,
    `      <e-svg configuration-id="app-${a.key}-chevron-svg"></e-svg>`,
    `    </e-accordion-item-icon>`,
    `  </e-accordion-item-header>`,
    `  <e-accordion-item-content configuration-id="app-${a.key}-content">`,
    `    <e-paragraph configuration-id="app-${a.key}-description"></e-paragraph>`,
    `    <e-paragraph configuration-id="app-${a.key}-question"></e-paragraph>`,
    `  </e-accordion-item-content>`,
    `</e-accordion-item>`,
  ].join('\n');
}

function buildXml() {
  const items = APPS.map(itemXml).join('\n');
  return [
    `<e-flexbox configuration-id="applications-section">`,
    `  <e-flexbox configuration-id="applications-inner">`,
    `    <e-flexbox configuration-id="applications-header">`,
    `      <e-heading configuration-id="applications-title"></e-heading>`,
    `      <e-paragraph configuration-id="applications-subtitle"></e-paragraph>`,
    `    </e-flexbox>`,
    `    <e-accordion configuration-id="applications-accordion">`,
    items,
    `    </e-accordion>`,
    `    <e-flexbox configuration-id="applications-cta">`,
    `      <e-button configuration-id="applications-cta-button"></e-button>`,
    `    </e-flexbox>`,
    `  </e-flexbox>`,
    `</e-flexbox>`,
  ].join('\n');
}

/* ------------------------------------------------------------- CONFIG ---- */

/*
 * `attributes` (aria-label) is NOT used: Attributes_Transformer::transform()
 * returns null, so the attributes prop is dropped at render time. The
 * accordion's own <summary> already carries the item title as its text, so the
 * accessible name comes from the visible heading.
 */
function buildConfig(ids) {
  const cfg = {
    'applications-section': { tag: 'section', _cssid: 'applications' },
    'applications-title': {
      tag: 'h2',
      title: 'Industrial Air Filtration for Every Application',
    },
    'applications-subtitle': {
      tag: 'p',
      paragraph:
        'From small tool shops to large manufacturing facilities, Emifree systems capture oil mist, welding fumes, and dust at the source.',
    },
    // All closed at rest (matches the live collapsed cards), and more than one
    // may be open at a time (the live cards could each be opened independently).
    'applications-accordion': {
      default_state: 'all_collapsed',
      max_expanded: 'multiple',
      show_icon: true,
      faq_schema: false,
    },
    'applications-cta-button': {
      tag: 'a',
      text: 'Find Your Solution',
      link: { destination: '#products', isTargetBlank: false, tag: 'a' },
    },
  };

  for (const a of APPS) {
    const k = a.key;
    cfg[`app-${k}-header`] = { show_icon: true };
    // The title slot is a fixed <span> wrapper (Elementor renders the visible
    // tag from the inner element), so the h3 lives inside it.
    cfg[`app-${k}-label`] = { tag: 'h3', title: a.title };
    cfg[`app-${k}-icon`] = { svg: { id: ids[a.icon] } };
    cfg[`app-${k}-chevron-svg`] = { svg: { id: ids[CHEVRON_FILE] } };
    cfg[`app-${k}-description`] = { tag: 'p', paragraph: a.description };
    cfg[`app-${k}-question`] = {
      tag: 'p',
      paragraph: `“${a.question}”`,
    };
  }

  return cfg;
}

/* -------------------------------------------------------------- STYLES --- */

function buildStyles() {
  const s = {};

  s['applications-section'] =
    `background-color: #ffffff; ` +
    `padding: 96px 0px; ` +
    `display: flex; ` +
    `flex-direction: column; ` +
    `@media(--mobile) { padding: 48px 0px; }`;

  s['applications-inner'] =
    `max-width: 1280px; ` +
    `margin: 0px auto; ` +
    `padding: 0px 32px; ` +
    `display: flex; ` +
    `flex-direction: column; ` +
    `@media(--tablet) { padding: 0px 24px; } ` +
    `@media(--mobile) { padding: 0px 16px; }`;

  s['applications-header'] =
    `display: flex; ` +
    `flex-direction: column; ` +
    `align-items: center; ` +
    `text-align: center; ` +
    `margin: 0px 0px 80px 0px; ` +
    `padding: 0px;`;

  // The live heading is a blue->cyan gradient clipped to the glyphs.
  // `background-clip: text` IS an atomic property (it fills the `clip` field
  // of the background aggregate); the -webkit- prefixed companions are not in
  // the style schema, so they fall through to custom CSS - which this install
  // keeps (Pro atomic-custom-css). `color: transparent` is atomic; the
  // -webkit-text-fill-color fallback is custom CSS.
  s['applications-title'] =
    `font-size: 48px; ` +
    `font-weight: 700; ` +
    `line-height: 1; ` +
    `color: transparent; ` +
    `margin: 0px 0px 24px 0px; ` +
    `background-image: linear-gradient(90deg, #1d4ed8 0%, #06b6d4 100%); ` +
    `background-color: transparent; ` +
    `background-clip: text; ` +
    `-webkit-background-clip: text; ` +
    `-webkit-text-fill-color: transparent; ` +
    `@media(--mobile) { font-size: 36px; line-height: 1.11; }`;

  s['applications-subtitle'] =
    `font-size: 20px; ` +
    `line-height: 1.4; ` +
    `color: #52525b; ` +
    `max-width: 768px; ` +
    `margin: 0px auto; ` +
    `padding: 0px;`;

  s['applications-accordion'] =
    `display: flex; ` +
    `flex-direction: column; ` +
    `gap: 12px; ` +
    `padding: 0px;`;

  for (const a of APPS) {
    const k = a.key;

    // <details>
    s[`app-${k}`] =
      `background-color: #ffffff; ` +
      `border-width: 1px; ` +
      `border-style: solid; ` +
      `border-color: #f1f5f9; ` +
      `border-radius: 16px; ` +
      `box-shadow: 0px 4px 6px -1px rgba(0,0,0,0.1), 0px 2px 4px -2px rgba(0,0,0,0.1); ` +
      `margin: 0px; ` +
      `padding: 0px; ` +
      `transition: box-shadow 0.3s ease, border-color 0.3s ease; ` +
      `&:hover { ` +
      `  border-color: #e2e8f0; ` +
      `  box-shadow: 0px 25px 50px -12px rgba(0,0,0,0.25); ` +
      `}`;

    // <summary>
    s[`app-${k}-header`] =
      `padding: 24px; ` +
      `display: flex; ` +
      `align-items: center; ` +
      `justify-content: space-between; ` +
      `gap: 16px; ` +
      `cursor: pointer; ` +
      `&:focus { ` +
      `  outline-width: 2px; ` +
      `  outline-style: solid; ` +
      `  outline-color: #3b82f6; ` +
      `  outline-offset: -2px; ` +
      `}`;

    // The title slot is a fixed <span> wrapper; make it the flex row that
    // holds the gradient icon tile and the heading.
    s[`app-${k}-title`] =
      `display: flex; ` +
      `align-items: center; ` +
      `gap: 16px; ` +
      `flex: 1 1 auto; ` +
      `min-width: 0px; ` +
      `padding: 0px;`;

    // The 64px gradient icon tile. The e-svg wrapper is a <div>; Elementor
    // sets box-sizing:border-box on everything inside .elementor, so the
    // 16px padding sits inside the 64px box and the glyph is 32x32 - the
    // same ratio as the live tile.
    s[`app-${k}-icon`] =
      `width: 64px; ` +
      `height: 64px; ` +
      `padding: 16px; ` +
      `border-radius: 16px; ` +
      `background-image: linear-gradient(135deg, #2563eb 0%, #06b6d4 100%); ` +
      `background-color: transparent; ` +
      `color: #ffffff; ` +
      `box-shadow: 0px 10px 25px rgba(37,99,235,0.25); ` +
      `display: inline-block; ` +
      `flex: 0 0 auto;`;

    s[`app-${k}-label`] =
      `font-size: 20px; ` +
      `font-weight: 700; ` +
      `line-height: 1.33; ` +
      `color: #18181b; ` +
      `margin: 0px; ` +
      `padding: 0px;`;

    // The chevron slot ships 200x20; shrink it to the 24px glyph.
    s[`app-${k}-chevron`] =
      `width: 24px; ` +
      `height: 24px;`;

    s[`app-${k}-chevron-svg`] =
      `color: #52525b;`;

    s[`app-${k}-content`] =
      `padding: 0px 24px 24px 24px;`;

    s[`app-${k}-description`] =
      `font-size: 16px; ` +
      `line-height: 1.6; ` +
      `color: #52525b; ` +
      `margin: 0px 0px 16px 0px; ` +
      `padding: 0px;`;

    s[`app-${k}-question`] =
      `font-size: 14px; ` +
      `line-height: 1.5; ` +
      `font-style: italic; ` +
      `color: #52525b; ` +
      `margin: 0px; ` +
      `padding: 0px;`;
  }

  s['applications-cta'] =
    `display: flex; ` +
    `justify-content: center; ` +
    `margin: 64px 0px 0px 0px; ` +
    `padding: 0px;`;

  s['applications-cta-button'] =
    `font-size: 18px; ` +
    `font-weight: 600; ` +
    `color: #ffffff; ` +
    `text-decoration: none; ` +
    `padding: 16px 32px; ` +
    `border-radius: 9999px; ` +
    `background-image: linear-gradient(90deg, #1d4ed8 0%, #06b6d4 100%); ` +
    `background-color: transparent; ` +
    `box-shadow: 0px 10px 25px rgba(6,182,212,0.25); ` +
    `display: inline-flex; ` +
    `align-items: center; ` +
    `justify-content: center; ` +
    `&:hover { box-shadow: 0px 20px 25px -5px rgba(0,0,0,0.15); }`;

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

async function main() {
  const apply = process.argv.includes('--apply');
  const verify = process.argv.includes('--verify');

  if (!fs.existsSync(MEDIA_REPORT)) {
    console.error('FATAL: media report missing:', MEDIA_REPORT);
    console.error('Run: curl "http://landingwptest.local/?emifree_import_app_media=1"');
    process.exit(1);
  }
  const report = JSON.parse(fs.readFileSync(MEDIA_REPORT, 'utf8'));
  const ids = {};
  for (const [file, info] of Object.entries(report.imported)) {
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
    const bust = await httpGet(`${SITE}/?emifree_rebuild_72=1`);
    console.log('rebuild status:', bust.status, bust.body.slice(0, 300));

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
    if (fs.existsSync(html)) {
      const h = fs.readFileSync(html, 'utf8');
      console.log('\n=== RENDER CHECKS ===');
      const checks = {
        'applications section id': h.includes('id="applications"'),
        'h2 title': h.includes('Industrial Air Filtration for Every Application'),
        'subtitle': h.includes('From small tool shops to large manufacturing facilities'),
        'accordion details': (h.match(/<details/g) || []).length === 6,
        'accordion summary': (h.match(/<summary/g) || []).length === 6,
        'h3 cnc': h.includes('CNC Machining &amp; Tool Shops'),
        'h3 metal': h.includes('Metalworking &amp; Welding'),
        'h3 grinding': h.includes('Grinding &amp; Polishing'),
        'h3 bearing': h.includes('Bearing &amp; Precision Parts Manufacturing'),
        'h3 heavy': h.includes('Heavy Industry &amp; Metal Fabrication'),
        'h3 auto': h.includes('Automotive'),
        'cta text': h.includes('Find Your Solution'),
        'cta link #products': h.includes('href="#products"'),
        'icon cog inlined': h.includes('M19.4 15a1.65 1.65'),
        'icon flame inlined': h.includes('M8.5 14.5A2.5 2.5'),
        'icon sparkles inlined': h.includes('M9.937 15.5A2 2'),
        'icon wrench inlined': h.includes('M14.7 6.3a1 1'),
        'icon factory inlined': h.includes('M2 20a2 2 0 0 0 2 2h16'),
        'icon car inlined': h.includes('M19 17h2c.6 0 1-.4 1-1v-3'),
        'chevron inlined': h.includes('m6 9 6 6 6-6'),
        'description in DOM': h.includes('Remove oil mist and coolant fumes from CNC lathes'),
        'seo question in DOM': h.includes('How do I remove oil mist from my CNC machine'),
        'products section still present': h.includes('id="products"'),
      };
      for (const [k, v] of Object.entries(checks)) {
        console.log(`${v ? 'OK  ' : 'FAIL'} ${k}`);
      }
      console.log('render bytes:', h.length);
      fs.writeFileSync('C:/Users/vpedr/AppData/Local/Temp/novamira-svg/render-72.html', h);
    } else {
      console.error('render file missing:', html);
    }
  }
}

main().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
