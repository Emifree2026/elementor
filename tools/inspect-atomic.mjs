/**
 * Print representative ATOMIC (V4) nodes from a live `_elementor_data` dump,
 * so the emitter rewrite and the constraints doc describe the real format.
 *
 *   node inspect-atomic.mjs <backup.json> [elType]
 *
 * Truncates long strings so the output stays readable.
 */
import { readFileSync } from 'node:fs';

const file = process.argv[2];
const wantType = process.argv[3] ?? null;

const raw = JSON.parse(readFileSync(file, 'utf8'));

const trunc = (v, n = 90) => {
	if (typeof v === 'string') return v.length > n ? v.slice(0, n) + `…(${v.length})` : v;
	if (Array.isArray(v)) return v.map((x) => trunc(x, n));
	if (v && typeof v === 'object') {
		const out = {};
		for (const [k, val] of Object.entries(v)) out[k] = trunc(val, n);
		return out;
	}
	return v;
};

const seen = new Set();
const samples = [];

const walk = (node, depth) => {
	if (!node || typeof node !== 'object') return;
	const t = node.elType ?? '?';
	const key = `${t}/${node.widgetType ?? ''}`;
	if (!wantType && !seen.has(key)) {
		seen.add(key);
		samples.push({ depth, node });
	}
	(node.elements ?? []).forEach((c) => walk(c, depth + 1));
};

raw.forEach((n) => walk(n, 0));

if (wantType) {
	samples.length = 0;
	seen.clear();
	const walk2 = (node, depth) => {
		if (!node || typeof node !== 'object') return;
		// Widgets carry elType "widget" and name themselves via widgetType.
		if ((node.elType ?? '?') === wantType || (node.widgetType ?? '?') === wantType) {
			samples.push({ depth, node });
		}
		(node.elements ?? []).forEach((c) => walk2(c, depth + 1));
	};
	raw.forEach((n) => walk2(n, 0));
}

for (const { depth, node } of samples.slice(0, 8)) {
	console.log(`\n${'='.repeat(78)}\n[${'  '.repeat(depth)}${node.elType}${node.widgetType ? '/' + node.widgetType : ''}] id=${node.id} title=${node.title ?? ''} depth=${depth}`);
	console.log(JSON.stringify(trunc(node), null, 1));
}
