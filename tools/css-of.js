#!/usr/bin/env node
/**
 * Print the generated atomic CSS rules for chosen elements of post 72.
 *
 *   node css-of.js <data-id> [data-id ...]
 *
 * It maps each element's data-id to its atomic class (e-<hash>-<hash>) out of
 * the rendered element tree, then prints every CSS rule in
 * local-72-frontend-desktop.css that mentions that class. That is the way to
 * find out what the style converter ACTUALLY wrote, instead of guessing what
 * the inline style string should have produced.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const PUB = 'C:/Users/vpedr/Local Sites/landingwptest/app/public';
const html = fs.readFileSync(path.join(PUB, 'wp-content/emifree-live-72.html'), 'utf8');
const css = fs.readFileSync(path.join(PUB, 'wp-content/uploads/elementor/css/local-72-frontend-desktop.css'), 'utf8');

// data-id -> atomic class
const map = {};
for (const m of html.matchAll(/<([a-z0-9]+)([^>]*data-id="([0-9a-f]+)"[^>]*)>/g)) {
  const cls = (m[2].match(/class="([^"]*)"/) || [])[1] || '';
  const atomic = cls.split(/\s+/).filter((c) => /^e-[0-9a-f]{8}-[0-9a-f]{4}$/.test(c));
  if (atomic.length) map[m[3]] = atomic[0];
}

// Split the stylesheet into (selector, body) pairs.
const rules = [];
const re = /([^{}]+)\{([^{}]*)\}/g;
let m;
while ((m = re.exec(css)) !== null) {
  rules.push({ sel: m[1].trim(), body: m[2].trim() });
}

const ids = process.argv.slice(2);
for (const id of ids) {
  const cls = map[id];
  if (!cls) {
    console.log(`### ${id}: no atomic class found`);
    continue;
  }
  console.log(`### ${id}  (${cls})`);
  const hits = rules.filter((r) => r.sel.includes(cls));
  if (!hits.length) console.log('    (no rules)');
  for (const r of hits) console.log('    ' + r.sel + ' { ' + r.body + ' }');
  console.log('');
}
