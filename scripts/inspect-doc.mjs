/**
 * Inspect an exported Elementor document.
 *
 *   node scripts/inspect-doc.mjs backups/post-72-elementor-20261103-110236.json
 *
 * Prints the widget/container types in use, every element that carries a
 * `_cssid` setting (the attribute the atomic editor keeps so JS can scope
 * to an element without relying on `data-*`, which the editor drops), and
 * the full settings of the first element of each type.
 */
import { readFileSync } from 'node:fs';

const file = process.argv[2];
if (!file) {
	console.error('usage: node inspect-doc.mjs <export.json>');
	process.exit(1);
}

const doc = JSON.parse(readFileSync(file, 'utf8'));
const roots = Array.isArray(doc) ? doc : doc.elements || [];

const types = new Map();
const cssids = [];
const samples = new Map();

function walk(nodes, depth, trail) {
	for (const node of nodes || []) {
		const type = node.widgetType || node.elType || '?';
		types.set(type, (types.get(type) || 0) + 1);
		if (!samples.has(type)) {
			samples.set(type, {
				id: node.id,
				elType: node.elType,
				widgetType: node.widgetType,
				depth,
				trail,
				settings: node.settings,
				editor_settings: node.editor_settings,
			});
		}
		const raw = JSON.stringify(node.settings || {});
		if (raw.includes('_cssid')) {
			cssids.push({
				id: node.id,
				type,
				depth,
				trail,
				cssid: node.settings?._cssid?.value ?? node.settings?._cssid,
			});
		}
		walk(node.elements, depth + 1, `${trail} > ${node.editor_settings?.title || node.id}`);
	}
}

walk(roots, 0, '');

console.log('=== element types in use ===');
for (const [type, n] of [...types.entries()].sort((a, b) => b[1] - a[1])) {
	console.log(`${String(n).padStart(4)}  ${type}`);
}

console.log('\n=== elements carrying _cssid ===');
for (const c of cssids) {
	console.log(`d${c.depth} ${c.type.padEnd(14)} ${JSON.stringify(c.cssid)}  ${c.trail}`);
}

console.log('\n=== one full sample per type ===');
for (const [type, s] of samples.entries()) {
	console.log(`\n--- ${type} (id ${s.id}, depth ${s.depth}) ---`);
	console.log(`trail: ${s.trail}`);
	console.log(`editor_settings: ${JSON.stringify(s.editor_settings)}`);
	console.log(`settings: ${JSON.stringify(s.settings ?? {}).slice(0, 1200)}`);
}
