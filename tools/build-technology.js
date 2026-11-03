#!/usr/bin/env node
'use strict';
/*
 * Build the Technology section into Elementor post 72.
 *
 * Source of truth:
 *   - markup : wp-content/themes/emifree-landing/template-parts/section-technology.php
 *   - data   : wp-content/themes/emifree-landing/inc/technology.php
 *   - icons  : wp-content/themes/emifree-landing/assets/icons/{check,move-right,arrow-right}.svg
 *   - logo   : wp-content/themes/emifree-landing/assets/products/mechanical/eco_air_final.png
 *
 * Attachment ids come from wp-content/emifree-tech-media.json (written by the
 * one-shot mu-plugin emifree-import-tech-media.php).
 *
 * WHAT CHANGED VERSUS THE LIVE PHP SECTION
 * -----------------------------------------
 * 1. The mechanical card shows the ECO AIR wordmark logo (eco_air_final.png)
 *    instead of the text "ECO AIR CLEANER", and the heading under it reads
 *    "Mechanical Filtration".
 * 2. The step switcher is gone. Its controls were `data-emifree-step` /
 *    `data-emifree-image` / `data-emifree-step-caption` attributes, and
 *    Attributes_Transformer::transform() returns null -- the attributes prop
 *    is dropped at render -- so no atomic widget can carry them. Instead each
 *    process panel keeps only its self-cleaning step (title + description) and
 *    that step's image, plus a "Learn more" CTA to the product page.
 *    - ECO AIR: "Self-Cleaning & Recycling" / Step3_clean.webp
 *    - EARIA:   "Oil particle collection" / Step 4.webp  (its description is
 *               the self-cleaning drain, so it is EARIA's self-cleaning step)
 * 3. "Get expert recommendation" opened the inquiry modal via
 *    `data-emifree-inquiry="technology"`, which cannot be reproduced either;
 *    it links to #contact instead (the contact section carries the form).
 * 4. The live h2 colours "Filtration Technology" blue with a <span>. Atomic
 *    headings have no children and wp_kses strips the span's attributes, so
 *    the heading is one flat colour here.
 *
 * Usage:
 *   node build-technology.js            # dry run only (validate, print warnings)
 *   node build-technology.js --apply    # dry run, then persist
 *   node build-technology.js --verify   # after apply: rebuild atomic CSS + dump render
 */

const fs = require('fs');
const path = require('path');
const { init, callTool } = require('./mcpcall.js');

const POST_ID = 72;
const PUBLIC_DIR = 'C:/Users/vpedr/Local Sites/landingwptest/app/public';
const MEDIA_REPORT = path.join(PUBLIC_DIR, 'wp-content/emifree-tech-media.json');
const SITE = 'http://landingwptest.local';

/* The two technologies, verbatim from emifree_technologies() in inc/technology.php,
   with the two user-requested edits applied (logo + "Mechanical Filtration",
   steps dropped down to the self-cleaning step only). */
const TECH = [
  {
    key: 'eco',
    badge: 'Best for Oil Mist & Emulsions',
    badgeBg: '#fef3c7',
    badgeText: '#92400e',
    title: 'Mechanical Filtration',
    logo: 'eco_air_final.png',
    subtitle: 'Mechanical Oil Mist Separator',
    description:
      'Constant suction performance through self-cleaning mechanical filtration and oil recycling.',
    bullets: ['Self-cleaning system', 'No filter mats', 'Oil recycling', 'Up to 1,500 m³/h'],
    anchor: 'technology-eco-air',
    processTitle: 'How ECO AIR Works',
    processSubtitle: 'Mechanical separation + coalescence',
    stepTitle: 'Self-Cleaning & Recycling',
    stepDesc:
      'Integrated spraying nozzles maintain constant performance and recycle collected oil.',
    stepImage: 'Step3_clean.webp',
    learnUrl: '/en/products/mechanical/',
  },
  {
    key: 'earia',
    badge: 'Best for Smoke & Fine Aerosols',
    badgeBg: '#f3e8ff',
    badgeText: '#6b21a8',
    title: 'EARIA',
    logo: null,
    subtitle: 'Electrostatic Filtration System',
    description:
      'Electrostatic filtration for smoke, oil mist and ultra-fine particles with minimal maintenance.',
    bullets: [
      'Smoke & aerosol capture',
      'Electrostatic filtration',
      'No cartridge exchange',
      'Adjustable up to 1000 m³/h',
    ],
    anchor: 'technology-earia',
    processTitle: 'How EARIA Works',
    processSubtitle: 'Electrostatic filtration',
    stepTitle: 'Oil particle collection',
    stepDesc: 'Self-cleaning drain removes collected oil automatically.',
    stepImage: 'Step 4.webp',
    learnUrl: '/en/products/electrostatic/',
  },
];

/* ------------------------------------------------------------------ XML --- */

function bulletsXml(t) {
  return t.bullets
    .map(
      (b, i) => [
        `          <e-flexbox configuration-id="technology-${t.key}-bullet-${i + 1}">`,
        `            <e-svg configuration-id="technology-${t.key}-bullet-${i + 1}-icon"></e-svg>`,
        `            <e-paragraph configuration-id="technology-${t.key}-bullet-${i + 1}-text"></e-paragraph>`,
        `          </e-flexbox>`,
      ].join('\n')
    )
    .join('\n');
}

function cardXml(t) {
  const logo = t.logo
    ? `        <e-image configuration-id="technology-${t.key}-logo"></e-image>\n`
    : '';
  return [
    `      <e-flexbox configuration-id="technology-card-${t.key}">`,
    `        <e-paragraph configuration-id="technology-${t.key}-badge"></e-paragraph>`,
    logo.trimEnd(),
    `        <e-heading configuration-id="technology-${t.key}-title"></e-heading>`,
    `        <e-paragraph configuration-id="technology-${t.key}-subtitle"></e-paragraph>`,
    `        <e-paragraph configuration-id="technology-${t.key}-description"></e-paragraph>`,
    `        <e-flexbox configuration-id="technology-${t.key}-bullets">`,
    bulletsXml(t),
    `        </e-flexbox>`,
    `        <e-flexbox configuration-id="technology-${t.key}-link-row">`,
    `          <e-button configuration-id="technology-${t.key}-link"></e-button>`,
    `          <e-svg configuration-id="technology-${t.key}-link-arrow"></e-svg>`,
    `        </e-flexbox>`,
    `      </e-flexbox>`,
  ]
    .filter((l) => l !== '')
    .join('\n');
}

function panelXml(t) {
  return [
    `      <e-flexbox configuration-id="technology-panel-${t.key}">`,
    `        <e-heading configuration-id="technology-${t.key}-process-title"></e-heading>`,
    `        <e-paragraph configuration-id="technology-${t.key}-process-subtitle"></e-paragraph>`,
    `        <e-flexbox configuration-id="technology-${t.key}-media">`,
    `          <e-image configuration-id="technology-${t.key}-image"></e-image>`,
    `        </e-flexbox>`,
    `        <e-heading configuration-id="technology-${t.key}-step-title"></e-heading>`,
    `        <e-paragraph configuration-id="technology-${t.key}-step-desc"></e-paragraph>`,
    `        <e-button configuration-id="technology-${t.key}-learn"></e-button>`,
    `      </e-flexbox>`,
  ].join('\n');
}

function buildXml() {
  return [
    `<e-flexbox configuration-id="technology-section">`,
    `  <e-flexbox configuration-id="technology-inner">`,
    `    <e-flexbox configuration-id="technology-header">`,
    `      <e-heading configuration-id="technology-title"></e-heading>`,
    `      <e-paragraph configuration-id="technology-lead"></e-paragraph>`,
    `      <e-paragraph configuration-id="technology-hint"></e-paragraph>`,
    `    </e-flexbox>`,
    `    <e-flexbox configuration-id="technology-cards">`,
    TECH.map(cardXml).join('\n'),
    `    </e-flexbox>`,
    `    <e-flexbox configuration-id="technology-panels">`,
    TECH.map(panelXml).join('\n'),
    `    </e-flexbox>`,
    `    <e-flexbox configuration-id="technology-cta">`,
    `      <e-flexbox configuration-id="technology-cta-card">`,
    `        <e-heading configuration-id="technology-cta-title"></e-heading>`,
    `        <e-paragraph configuration-id="technology-cta-text"></e-paragraph>`,
    `        <e-flexbox configuration-id="technology-cta-actions">`,
    `          <e-button configuration-id="technology-cta-recommend"></e-button>`,
    `          <e-flexbox configuration-id="technology-cta-specs-row">`,
    `            <e-button configuration-id="technology-cta-specs"></e-button>`,
    `            <e-svg configuration-id="technology-cta-specs-arrow"></e-svg>`,
    `          </e-flexbox>`,
    `        </e-flexbox>`,
    `      </e-flexbox>`,
    `    </e-flexbox>`,
    `  </e-flexbox>`,
    `</e-flexbox>`,
  ].join('\n');
}

/* ------------------------------------------------------------- CONFIG ---- */

/*
 * `attributes` (aria-label / data-*) is NOT used: Attributes_Transformer::
 * transform() returns null, so the attributes prop is dropped at render time.
 */
function buildConfig(ids) {
  const cfg = {
    'technology-section': { tag: 'section', _cssid: 'technology' },
    'technology-title': {
      tag: 'h2',
      title: 'Choose the Right Filtration Technology for Your Process',
    },
    'technology-lead': {
      tag: 'p',
      paragraph:
        'Whether you handle oil mist, emulsions, smoke, or ultra-fine aerosols, our self-cleaning filtration systems deliver cleaner air, lower maintenance, and stable performance.',
    },
    'technology-hint': {
      tag: 'p',
      paragraph: 'Compare technologies below or jump directly to the right solution.',
    },
  };

  for (const t of TECH) {
    const k = t.key;

    cfg[`technology-card-${k}`] = { tag: 'div' };
    cfg[`technology-${k}-badge`] = { tag: 'span', paragraph: t.badge };
    if (t.logo) {
      cfg[`technology-${k}-logo`] = { image: { src: { id: ids[t.logo] }, size: 'full' } };
    }
    cfg[`technology-${k}-title`] = { tag: 'h3', title: t.title };
    cfg[`technology-${k}-subtitle`] = { tag: 'p', paragraph: t.subtitle };
    cfg[`technology-${k}-description`] = { tag: 'p', paragraph: t.description };

    t.bullets.forEach((b, i) => {
      const n = i + 1;
      cfg[`technology-${k}-bullet-${n}`] = { tag: 'div' };
      cfg[`technology-${k}-bullet-${n}-icon`] = { svg: { id: ids['check.svg'] } };
      cfg[`technology-${k}-bullet-${n}-text`] = { tag: 'span', paragraph: b };
    });

    cfg[`technology-${k}-link-row`] = { tag: 'div' };
    cfg[`technology-${k}-link`] = {
      tag: 'a',
      text: 'Learn How It Works',
      link: { destination: `#${t.anchor}`, isTargetBlank: false, tag: 'a' },
    };
    cfg[`technology-${k}-link-arrow`] = { svg: { id: ids['move-right.svg'] } };

    cfg[`technology-panel-${k}`] = { tag: 'section', _cssid: t.anchor };
    cfg[`technology-${k}-process-title`] = { tag: 'h3', title: t.processTitle };
    cfg[`technology-${k}-process-subtitle`] = { tag: 'p', paragraph: t.processSubtitle };
    cfg[`technology-${k}-media`] = { tag: 'div' };
    cfg[`technology-${k}-image`] = { image: { src: { id: ids[t.stepImage] }, size: 'full' } };
    cfg[`technology-${k}-step-title`] = { tag: 'h4', title: t.stepTitle };
    cfg[`technology-${k}-step-desc`] = { tag: 'p', paragraph: t.stepDesc };
    cfg[`technology-${k}-learn`] = {
      tag: 'a',
      text: 'Learn more',
      link: { destination: t.learnUrl, isTargetBlank: false, tag: 'a' },
    };
  }

  cfg['technology-cta'] = { tag: 'div' };
  cfg['technology-cta-card'] = { tag: 'div' };
  cfg['technology-cta-title'] = {
    tag: 'h3',
    title: 'Not sure which filtration technology fits your application?',
  };
  cfg['technology-cta-text'] = {
    tag: 'p',
    paragraph:
      "Tell us your contamination type, airflow requirements, or machine setup, we'll recommend the right solution.",
  };
  cfg['technology-cta-actions'] = { tag: 'div' };
  cfg['technology-cta-recommend'] = {
    tag: 'a',
    text: 'Get expert recommendation',
    link: { destination: '#contact', isTargetBlank: false, tag: 'a' },
  };
  cfg['technology-cta-specs-row'] = { tag: 'div' };
  cfg['technology-cta-specs'] = {
    tag: 'a',
    text: 'View more Technical Specs',
    link: { destination: '#knowledge', isTargetBlank: false, tag: 'a' },
  };
  cfg['technology-cta-specs-arrow'] = { svg: { id: ids['arrow-right.svg'] } };

  return cfg;
}

/* -------------------------------------------------------------- STYLES --- */

/*
 * Tailwind's own values, spelled out:
 *   slate-50 #f8fafc  slate-100 #f1f5f9  slate-200 #e2e8f0  slate-300 #cbd5e1
 *   slate-500 #64748b slate-600 #475569  slate-700 #334155  slate-800 #1e293b
 *   slate-900 #0f172a
 *   blue-50 #eff6ff   blue-600 #2563eb    blue-700 #1d4ed8  blue-800 #1e40af
 *   emerald-500 #10b981  amber-100 #fef3c7  amber-800 #92400e
 *   purple-100 #f3e8ff  purple-800 #6b21a8
 *
 * Elementor's atomic breakpoints are max-width queries:
 *   --mobile  <= 767px      --tablet  <= 1024px      (desktop = the default)
 * So a Tailwind `md:` (>=768px) rule is simply "the default, minus the mobile
 * override", and `lg:` (>=1024px) needs an explicit --tablet override.
 */
function buildStyles() {
  const s = {};

  s['technology-section'] =
    `background-color: #f8fafc; ` +
    `background-image: linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #eff6ff 100%); ` +
    `padding: 96px 0px; ` +
    `display: flex; ` +
    `flex-direction: column; ` +
    `width: 100%; ` +
    `scroll-margin-top: 80px; ` +
    `@media(--mobile) { ` +
    `  padding: 48px 0px; ` +
    `  background-image: none; ` +
    `}`;

  s['technology-inner'] =
    `max-width: 1280px; ` +
    `margin: 0px auto; ` +
    `padding: 0px 32px; ` +
    `display: flex; ` +
    `flex-direction: column; ` +
    `@media(--tablet) { padding: 0px 24px; } ` +
    `@media(--mobile) { padding: 0px 16px; }`;

  s['technology-header'] =
    `display: flex; ` +
    `flex-direction: column; ` +
    `align-items: center; ` +
    `text-align: center; ` +
    `margin: 0px 0px 80px 0px; ` +
    `padding: 0px;`;

  // The live heading colours two words blue with a <span>. Atomic headings
  // take no children and wp_kses strips the span's attributes, so the accent
  // cannot be reproduced -- the heading is one flat colour.
  s['technology-title'] =
    `font-size: 48px; ` +
    `font-weight: 700; ` +
    `line-height: 1.1667; ` +
    `color: #0f172a; ` +
    `margin: 0px 0px 24px 0px; ` +
    `padding: 0px; ` +
    `@media(--mobile) { font-size: 36px; line-height: 1.1111; }`;

  s['technology-lead'] =
    `font-size: 20px; ` +
    `line-height: 1.4; ` +
    `color: #475569; ` +
    `max-width: 768px; ` +
    `margin: 0px auto; ` +
    `padding: 0px;`;

  s['technology-hint'] =
    `font-size: 14px; ` +
    `line-height: 1.4286; ` +
    `color: #64748b; ` +
    `margin: 12px 0px 0px 0px; ` +
    `padding: 0px;`;

  // Selector cards. The live grid is `grid-cols-1 md:grid-cols-2`, i.e. two
  // columns from 768px up -- so the default is two columns and only the
  // mobile query collapses to one.
  s['technology-cards'] =
    `display: grid; ` +
    `grid-template-columns: repeat(2, 1fr); ` +
    `gap: 32px; ` +
    `margin: 0px 0px 80px 0px; ` +
    `padding: 0px; ` +
    `@media(--mobile) { grid-template-columns: 1fr; }`;

  for (const t of TECH) {
    const k = t.key;

    s[`technology-card-${k}`] =
      `display: flex; ` +
      `flex-direction: column; ` +
      `background-color: #ffffff; ` +
      `border-width: 1px; ` +
      `border-style: solid; ` +
      `border-color: #f1f5f9; ` +
      `border-radius: 24px; ` +
      `padding: 32px; ` +
      `box-shadow: 0px 20px 25px -5px rgba(0,0,0,0.1), 0px 8px 10px -6px rgba(0,0,0,0.1); ` +
      `transition: box-shadow 0.3s ease; ` +
      `@media(--mobile) { padding: 24px; } ` +
      `&:hover { box-shadow: 0px 25px 50px -12px rgba(0,0,0,0.25); }`;

    s[`technology-${k}-badge`] =
      `display: inline-block; ` +
      `align-self: flex-start; ` +
      `padding: 4px 12px; ` +
      `border-radius: 9999px; ` +
      `background-color: ${t.badgeBg}; ` +
      `color: ${t.badgeText}; ` +
      `font-size: 12px; ` +
      `font-weight: 600; ` +
      `line-height: 1.3333; ` +
      `margin: 0px 0px 16px 0px;`;

    if (t.logo) {
      s[`technology-${k}-logo`] =
        `display: block; ` +
        `width: 220px; ` +
        `height: auto; ` +
        `object-fit: contain; ` +
        `margin: 0px 0px 16px 0px;`;
    }

    s[`technology-${k}-title`] =
      `font-size: 30px; ` +
      `font-weight: 700; ` +
      `line-height: 1.2; ` +
      `color: #0f172a; ` +
      `margin: 0px; ` +
      `padding: 0px; ` +
      `@media(--mobile) { font-size: 24px; line-height: 1.3333; }`;

    s[`technology-${k}-subtitle`] =
      `font-size: 14px; ` +
      `line-height: 1.4286; ` +
      `color: #64748b; ` +
      `margin: 4px 0px 0px 0px; ` +
      `padding: 0px;`;

    s[`technology-${k}-description`] =
      `font-size: 16px; ` +
      `line-height: 1.5; ` +
      `color: #475569; ` +
      `margin: 16px 0px 0px 0px; ` +
      `padding: 0px;`;

    s[`technology-${k}-bullets`] =
      `display: flex; ` +
      `flex-direction: column; ` +
      `gap: 8px; ` +
      `margin: 20px 0px 0px 0px; ` +
      `padding: 0px;`;

    t.bullets.forEach((_, i) => {
      const n = i + 1;
      s[`technology-${k}-bullet-${n}`] =
        `display: flex; ` +
        `flex-direction: row; ` +
        `align-items: center; ` +
        `gap: 8px; ` +
        `padding: 0px;`;

      s[`technology-${k}-bullet-${n}-icon`] =
        `width: 18px; ` +
        `height: 18px; ` +
        `color: #10b981; ` +
        `flex: 0 0 auto; ` +
        `display: inline-block;`;

      s[`technology-${k}-bullet-${n}-text`] =
        `font-size: 16px; ` +
        `line-height: 1.5; ` +
        `color: #334155; ` +
        `margin: 0px; ` +
        `padding: 0px;`;
    });

    // "Learn How It Works" -- a text link in the live template. e-button has no
    // icon prop, so the arrow is a sibling e-svg in the same inline-flex row.
    s[`technology-${k}-link-row`] =
      `display: inline-flex; ` +
      `flex-direction: row; ` +
      `align-items: center; ` +
      `align-self: flex-start; ` +
      `gap: 4px; ` +
      `margin: 24px 0px 0px 0px; ` +
      `padding: 0px; ` +
      `&:hover { gap: 8px; }`;

    s[`technology-${k}-link`] =
      `display: inline-flex; ` +
      `align-items: center; ` +
      `background-color: transparent; ` +
      `background-image: none; ` +
      `border-width: 0px; ` +
      `border-style: solid; ` +
      `border-color: transparent; ` +
      `border-radius: 0px; ` +
      `box-shadow: none; ` +
      `padding: 0px; ` +
      `font-size: 16px; ` +
      `font-weight: 500; ` +
      `line-height: 1.5; ` +
      `color: #2563eb; ` +
      `text-decoration: none; ` +
      `&:hover { color: #1d4ed8; } ` +
      `&:focus { ` +
      `  outline-width: 2px; ` +
      `  outline-style: solid; ` +
      `  outline-color: #3b82f6; ` +
      `  outline-offset: 2px; ` +
      `}`;

    s[`technology-${k}-link-arrow`] =
      `width: 16px; ` +
      `height: 16px; ` +
      `color: #2563eb; ` +
      `flex: 0 0 auto; ` +
      `display: inline-block;`;

    // Process panel.
    s[`technology-panel-${k}`] =
      `display: flex; ` +
      `flex-direction: column; ` +
      `background-color: #ffffff; ` +
      `border-width: 1px; ` +
      `border-style: solid; ` +
      `border-color: #f1f5f9; ` +
      `border-radius: 24px; ` +
      `padding: 32px; ` +
      `box-shadow: 0px 20px 25px -5px rgba(0,0,0,0.1), 0px 8px 10px -6px rgba(0,0,0,0.1); ` +
      `scroll-margin-top: 80px; ` +
      `@media(--mobile) { padding: 24px; }`;

    s[`technology-${k}-process-title`] =
      `font-size: 24px; ` +
      `font-weight: 700; ` +
      `line-height: 1.3333; ` +
      `color: #0f172a; ` +
      `margin: 0px; ` +
      `padding: 0px;`;

    s[`technology-${k}-process-subtitle`] =
      `font-size: 14px; ` +
      `line-height: 1.4286; ` +
      `color: #64748b; ` +
      `margin: 0px 0px 24px 0px; ` +
      `padding: 0px;`;

    s[`technology-${k}-media`] =
      `display: flex; ` +
      `flex-direction: row; ` +
      `align-items: center; ` +
      `justify-content: center; ` +
      `width: 100%; ` +
      `height: 320px; ` +
      `border-radius: 16px; ` +
      `overflow: hidden; ` +
      `background-color: #f1f5f9; ` +
      `padding: 16px; ` +
      `@media(--mobile) { height: 192px; }`;

    s[`technology-${k}-image`] =
      `display: block; ` +
      `max-width: 100%; ` +
      `max-height: 100%; ` +
      `width: auto; ` +
      `height: auto; ` +
      `object-fit: contain;`;

    s[`technology-${k}-step-title`] =
      `font-size: 18px; ` +
      `font-weight: 600; ` +
      `line-height: 1.5556; ` +
      `color: #0f172a; ` +
      `margin: 16px 0px 0px 0px; ` +
      `padding: 0px;`;

    s[`technology-${k}-step-desc`] =
      `font-size: 16px; ` +
      `line-height: 1.5; ` +
      `color: #475569; ` +
      `margin: 4px 0px 0px 0px; ` +
      `padding: 0px;`;

    // "Learn more" -- the new CTA to the product page (the destination page
    // will be built later).
    s[`technology-${k}-learn`] =
      `display: inline-flex; ` +
      `align-items: center; ` +
      `justify-content: center; ` +
      `align-self: flex-start; ` +
      `background-color: transparent; ` +
      `background-image: linear-gradient(90deg, #1d4ed8 0%, #06b6d4 100%); ` +
      `border-width: 0px; ` +
      `border-style: solid; ` +
      `border-color: transparent; ` +
      `border-radius: 9999px; ` +
      `box-shadow: 0px 10px 25px rgba(6,182,212,0.25); ` +
      `padding: 14px 28px; ` +
      `margin: 24px 0px 0px 0px; ` +
      `font-size: 16px; ` +
      `font-weight: 600; ` +
      `line-height: 1.5; ` +
      `color: #ffffff; ` +
      `text-decoration: none; ` +
      `&:hover { box-shadow: 0px 20px 25px -5px rgba(0,0,0,0.15); } ` +
      `&:focus { ` +
      `  outline-width: 2px; ` +
      `  outline-style: solid; ` +
      `  outline-color: #3b82f6; ` +
      `  outline-offset: 2px; ` +
      `}`;
  }

  // The live panel grid is `grid-cols-1 lg:grid-cols-2`, i.e. two columns
  // only from 1024px up -- so --tablet drops back to one.
  s['technology-panels'] =
    `display: grid; ` +
    `grid-template-columns: repeat(2, 1fr); ` +
    `gap: 48px; ` +
    `margin: 0px 0px 80px 0px; ` +
    `padding: 0px; ` +
    `@media(--tablet) { grid-template-columns: 1fr; }`;

  s['technology-cta'] =
    `display: flex; ` +
    `justify-content: center; ` +
    `margin: 0px; ` +
    `padding: 0px;`;

  s['technology-cta-card'] =
    `display: flex; ` +
    `flex-direction: column; ` +
    `align-items: center; ` +
    `text-align: center; ` +
    `width: 100%; ` +
    `max-width: 896px; ` +
    `background-color: #eff6ff; ` +
    `border-radius: 24px; ` +
    `box-shadow: 0px 20px 25px -5px rgba(0,0,0,0.1), 0px 8px 10px -6px rgba(0,0,0,0.1); ` +
    `padding: 48px; ` +
    `@media(--mobile) { padding: 32px; }`;

  s['technology-cta-title'] =
    `font-size: 36px; ` +
    `font-weight: 700; ` +
    `line-height: 1.1111; ` +
    `color: #0f172a; ` +
    `margin: 0px; ` +
    `padding: 0px; ` +
    `@media(--mobile) { font-size: 30px; line-height: 1.2; }`;

  s['technology-cta-text'] =
    `font-size: 18px; ` +
    `line-height: 1.5556; ` +
    `color: #334155; ` +
    `max-width: 672px; ` +
    `margin: 16px auto 0px auto; ` +
    `padding: 0px;`;

  s['technology-cta-actions'] =
    `display: flex; ` +
    `flex-direction: row; ` +
    `align-items: center; ` +
    `justify-content: center; ` +
    `gap: 16px; ` +
    `margin: 32px 0px 0px 0px; ` +
    `padding: 0px; ` +
    `@media(--mobile) { flex-direction: column; }`;

  s['technology-cta-recommend'] =
    `display: inline-flex; ` +
    `align-items: center; ` +
    `justify-content: center; ` +
    `background-color: #ffffff; ` +
    `background-image: none; ` +
    `border-width: 1px; ` +
    `border-style: solid; ` +
    `border-color: #cbd5e1; ` +
    `border-radius: 9999px; ` +
    `box-shadow: none; ` +
    `padding: 14px 24px; ` +
    `min-height: 44px; ` +
    `font-size: 16px; ` +
    `font-weight: 500; ` +
    `line-height: 1.5; ` +
    `color: #1e293b; ` +
    `text-decoration: none; ` +
    `&:hover { background-color: #f8fafc; } ` +
    `&:focus { ` +
    `  outline-width: 2px; ` +
    `  outline-style: solid; ` +
    `  outline-color: #3b82f6; ` +
    `  outline-offset: 2px; ` +
    `}`;

  s['technology-cta-specs-row'] =
    `display: inline-flex; ` +
    `flex-direction: row; ` +
    `align-items: center; ` +
    `gap: 4px; ` +
    `padding: 0px;`;

  s['technology-cta-specs'] =
    `display: inline-flex; ` +
    `align-items: center; ` +
    `justify-content: center; ` +
    `background-color: transparent; ` +
    `background-image: none; ` +
    `border-width: 0px; ` +
    `border-style: solid; ` +
    `border-color: transparent; ` +
    `border-radius: 9999px; ` +
    `box-shadow: none; ` +
    `padding: 14px 24px; ` +
    `min-height: 44px; ` +
    `font-size: 16px; ` +
    `font-weight: 500; ` +
    `line-height: 1.5; ` +
    `color: #1d4ed8; ` +
    `text-decoration: none; ` +
    `&:hover { color: #1e40af; } ` +
    `&:focus { ` +
    `  outline-width: 2px; ` +
    `  outline-style: solid; ` +
    `  outline-color: #3b82f6; ` +
    `  outline-offset: 2px; ` +
    `}`;

  s['technology-cta-specs-arrow'] =
    `width: 16px; ` +
    `height: 16px; ` +
    `color: #1d4ed8; ` +
    `flex: 0 0 auto; ` +
    `display: inline-block;`;

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
    console.error('Run: curl "http://landingwptest.local/?emifree_import_tech=1"');
    process.exit(1);
  }
  const report = JSON.parse(fs.readFileSync(MEDIA_REPORT, 'utf8'));
  if (report.errors && report.errors.length) {
    console.error('FATAL: media import reported errors:', report.errors);
    process.exit(1);
  }
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

  if (!apply && !verify) {
    console.log('\nDry run OK. Re-run with --apply to persist.');
    return;
  }

  if (apply) {
    console.log('\n=== APPLY ===');
    const saved = await callTool('elementor-build-composition', { ...base, dry_run: false });
    console.log(toolText(saved));
    if (isError(saved)) {
      console.error('\nApply failed.');
      process.exit(1);
    }
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
      // Scope the section-level checks to the Technology section. "Learn more"
      // also appears three times in the Products cards, so a page-wide count
      // would fail for a reason that has nothing to do with this section.
      const techStart = h.indexOf('id="technology"');
      const techEnd = h.indexOf('id="knowledge"');
      const tech =
        techStart >= 0
          ? h.slice(techStart, techEnd > techStart ? techEnd : h.length)
          : '';
      console.log('\n=== RENDER CHECKS ===');
      const checks = {
        'technology section id': h.includes('id="technology"'),
        'h2 title': h.includes('Choose the Right Filtration Technology for Your Process'),
        'lead paragraph': h.includes('Whether you handle oil mist, emulsions, smoke'),
        'hint paragraph': h.includes('Compare technologies below or jump directly'),
        'eco badge': h.includes('Best for Oil Mist &amp; Emulsions'),
        'earia badge': h.includes('Best for Smoke &amp; Fine Aerosols'),
        'eco logo img': h.includes('eco_air_final'),
        'eco h3 title': h.includes('Mechanical Filtration'),
        'earia h3 title': h.includes('>EARIA<'),
        'eco subtitle': h.includes('Mechanical Oil Mist Separator'),
        'earia subtitle': h.includes('Electrostatic Filtration System'),
        'eco description': h.includes('Constant suction performance through self-cleaning'),
        'earia description': h.includes('Electrostatic filtration for smoke, oil mist'),
        '8 bullet texts': TECH.every((t) =>
          t.bullets.every((b) => h.includes(b.replace('&', '&amp;')))
        ),
        'check icon inlined': h.includes('M21.801 10A10 10 0 1 1 17 3.335'),
        'move-right icon inlined': h.includes('M18 8L22 12L18 16'),
        'arrow-right icon inlined': h.includes('m12 5 7 7-7 7'),
        'Learn How It Works x2': (h.match(/Learn How It Works/g) || []).length === 2,
        'anchor #technology-eco-air': h.includes('href="#technology-eco-air"'),
        'anchor #technology-earia': h.includes('href="#technology-earia"'),
        'panel id eco-air': h.includes('id="technology-eco-air"'),
        'panel id earia': h.includes('id="technology-earia"'),
        'eco process title': h.includes('How ECO AIR Works'),
        'earia process title': h.includes('How EARIA Works'),
        'eco step title': h.includes('Self-Cleaning &amp; Recycling'),
        'earia step title': h.includes('Oil particle collection'),
        'eco step image': h.includes('Step3_clean'),
        'earia step image': h.includes('Step-4'),
        'Learn more x2': (tech.match(/Learn more/g) || []).length === 2,
        'learn link mechanical': h.includes('href="/en/products/mechanical/"'),
        'learn link electrostatic': h.includes('href="/en/products/electrostatic/"'),
        'cta title': h.includes('Not sure which filtration technology fits'),
        'cta recommend': h.includes('Get expert recommendation'),
        'cta recommend -> #contact': h.includes('href="#contact"'),
        'cta specs': h.includes('View more Technical Specs'),
        'cta specs -> #knowledge': h.includes('href="#knowledge"'),
        'products section still present': h.includes('id="products"'),
        'applications section still present': h.includes('id="applications"'),
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
