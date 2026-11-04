/**
 * Show the top-level shape of an exported Elementor document and a sample of
 * its `styles` map (the atomic CSS classes that carry all the layout).
 *
 *   node scripts/inspect-styles.mjs backups/post-72-elementor-20261103-110236.json [classId]
 */
import { readFileSync } from 'node:fs';

const file = process.argv[2];
const wanted = process.argv[3];
const doc = JSON.parse(readFileSync(file, 'utf8'));

console.log('top-level keys:', Object.keys(doc));
for (const k of Object.keys(doc)) {
	const v = doc[k];
	console.log(`  ${k}: ${Array.isArray(v) ? `array(${v.length})` : typeof v}`);
}

const styles = doc.styles || {};
console.log(`\nstyles: ${Object.keys(styles).length} entries`);

const ids = Object.keys(styles);
if (wanted) {
	console.log(`\n--- ${wanted} ---`);
	console.log(JSON.stringify(styles[wanted], null, 2));
} else {
	for (const id of ids.slice(0, 4)) {
		console.log(`\n--- ${id} ---`);
		console.log(JSON.stringify(styles[id], null, 2).slice(0, 2000));
	}
}
