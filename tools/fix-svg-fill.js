#!/usr/bin/env node
/**
 * Add fill="none" to every child element of an Elementor-hosted SVG.
 *
 * Elementor's Svg_Src_Transformer::process_svg() unconditionally sets
 * fill="currentColor" on the ROOT <svg> and merges an inline width/height
 * style. `fill` is inherited, so an icon whose children rely on the file's
 * own fill="none" gets painted instead of stroked -- a near-closed circle
 * (check.svg, award.svg, clock.svg, users.svg) fills into a solid disc.
 *
 * The transformer only touches the root tag, and `fill` is on the
 * sanitizer's allowed-attributes list, so a CHILD-level fill="none"
 * survives both. The transform also reads the file from disk on every
 * render (get_attached_file() -> Utils::file_get_contents()), so editing
 * the uploaded copy changes the front end with no re-import and no cache
 * to bust.
 *
 * Usage: node fix-svg-fill.js <file.svg> [file.svg ...]
 */
const fs = require('fs');
const path = require('path');

const CHILD_ELEMENTS = ['path', 'circle', 'rect', 'polyline', 'line', 'polygon', 'ellipse'];
const OPEN_TAG = new RegExp(`<(${CHILD_ELEMENTS.join('|')})(?=[\\s/>])`, 'g');

function fixOne(file) {
  const before = fs.readFileSync(file, 'utf8');
  let added = 0;

  const after = before.replace(OPEN_TAG, (match, tag, offset) => {
    // Find the end of this opening tag, then check whether it already
    // declares a fill attribute.
    const end = before.indexOf('>', offset);
    const tagText = before.slice(offset, end === -1 ? undefined : end);
    if (/\sfill\s*=/.test(tagText)) {
      return match;
    }
    added++;
    return `<${tag} fill="none"`;
  });

  if (added === 0) {
    console.log(`  unchanged  ${path.basename(file)}`);
    return false;
  }
  fs.writeFileSync(file, after);
  console.log(`  patched    ${path.basename(file)}  (+${added} child fill="none")`);
  return true;
}

const files = process.argv.slice(2);
if (!files.length) {
  console.error('usage: node fix-svg-fill.js <file.svg> [...]');
  process.exit(1);
}
let changed = 0;
for (const f of files) {
  if (!fs.existsSync(f)) {
    console.error(`  MISSING    ${f}`);
    continue;
  }
  if (fixOne(f)) changed++;
}
console.log(`\n${changed}/${files.length} file(s) patched.`);
