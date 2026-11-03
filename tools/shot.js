#!/usr/bin/env node
'use strict';
/*
 * Headless-Chrome screenshot helper.
 *
 *   node shot.js <url> <width> <height> <out.png> [extra-chrome-args...]
 *
 * The Elementor preview page is long, so the URL normally carries a #fragment
 * (e.g. #technology): Chrome scrolls the anchor into view before the shot is
 * taken, and --virtual-time-budget lets the page settle first.
 */
const { execFileSync } = require('child_process');
const fs = require('fs');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const [url, width, height, out, ...extra] = process.argv.slice(2);

if (!url || !width || !height || !out) {
  console.error('usage: node shot.js <url> <width> <height> <out.png>');
  process.exit(1);
}

const args = [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  `--window-size=${width},${height}`,
  '--virtual-time-budget=8000',
  `--screenshot=${out}`,
  ...extra,
  url,
];

try {
  execFileSync(CHROME, args, { stdio: ['ignore', 'ignore', 'pipe'] });
} catch (e) {
  // Chrome writes noisy GCM errors to stderr but still produces the file.
  const err = (e.stderr || '').toString();
  if (!/written to file/.test(err)) {
    console.error(err.split('\n').slice(-6).join('\n'));
  }
}

if (fs.existsSync(out)) {
  console.log('ok', out, fs.statSync(out).size, 'bytes');
} else {
  console.error('FAILED: no file at', out);
  process.exit(1);
}
