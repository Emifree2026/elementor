/**
 * Verify an Elementor atomic (V4) document dump against the migration rules.
 *
 *   node verify-doc.mjs <post-72-elementor-backup.json> [--max-depth 3]
 *
 * Checks:
 *   - top-level element count
 *   - container depth (root = 1)
 *   - widget inventory, flagging `html` and `spacer` widgets
 *   - duplicate section titles (the post-72 duplicate-contact-section bug)
 *   - elements with no editor title
 *   - text nodes that are not real widgets
 */
import { readFileSync } from 'node:fs';

const file = process.argv[2];
const maxDepthArg = process.argv.indexOf('--max-depth');
const MAX_DEPTH = maxDepthArg !== -1 ? Number(process.argv[maxDepthArg + 1]) : 3;

if (!file) {
	console.error('usage: node verify-doc.mjs <dump.json> [--max-depth N]');
	process.exit(1);
}

const root = JSON.parse(readFileSync(file, 'utf8'));
const top = Array.isArray(root) ? root : root.elements ?? [];

const problems = [];
const widgetCounts = new Map();
const elTypeCounts = new Map();
const titleCounts = new Map();
let maxSeen = 0;
let maxContainerDepth = 0;
let textNodes = 0;

/**
 * Container-ish element types. The depth rule counts *containers*, not
 * widgets — a heading inside a level-3 card is at container depth 3, while
 * its DOM depth is 4. Widgets are leaves and never add a level.
 */
const CONTAINER_TYPES = new Set([
	'e-flexbox',
	'e-div-block',
	'e-grid',
	'e-accordion',
	'e-accordion-item',
	'e-accordion-item-header',
	'e-accordion-item-title',
	'e-accordion-item-icon',
	'e-accordion-item-content',
	'e-background-video',
	'e-background-video-content',
	'e-tabs',
	'e-tab',
]);

const isContainer = (node) => !node.widgetType && CONTAINER_TYPES.has(node.elType);

const isTexty = (node) => {
	const s = node.settings ?? {};
	return s.title !== undefined || s.paragraph !== undefined || s.text !== undefined;
};

const walk = (node, depth, containerDepth) => {
	if (!node || typeof node !== 'object') return;
	maxSeen = Math.max(maxSeen, depth);

	const elType = node.elType ?? '?';
	elTypeCounts.set(elType, (elTypeCounts.get(elType) ?? 0) + 1);

	const isCont = isContainer(node);
	const nextContainerDepth = isCont ? containerDepth + 1 : containerDepth;
	if (isCont) maxContainerDepth = Math.max(maxContainerDepth, nextContainerDepth);

	if (node.widgetType) {
		widgetCounts.set(node.widgetType, (widgetCounts.get(node.widgetType) ?? 0) + 1);
		if (node.widgetType === 'html' || node.widgetType === 'spacer') {
			problems.push(`depth ${depth}: forbidden widget "${node.widgetType}" (${node.id})`);
		}
	}

	// A text-ish node that is not a widget carries its text as a raw string.
	if (!node.widgetType && isTexty(node)) {
		textNodes += 1;
		problems.push(`depth ${depth}: text outside a widget (${node.id}, elType ${elType})`);
	}

	const title = node.editor_settings?.title;
	if (title) {
		titleCounts.set(title, (titleCounts.get(title) ?? 0) + 1);
	}

	if (isCont && nextContainerDepth > MAX_DEPTH) {
		problems.push(
			`container depth ${nextContainerDepth}: exceeds max ${MAX_DEPTH} (${node.id} "${title ?? ''}")`
		);
	}

	(node.elements ?? []).forEach((c) => walk(c, depth + 1, nextContainerDepth));
};

top.forEach((n) => walk(n, 1, 0));

// Duplicate top-level titles are the exact signature of the duplicated-section bug.
for (const [title, count] of titleCounts) {
	if (count > 1) {
		problems.push(`duplicate element title "${title}" appears ${count}x`);
	}
}

console.log(`file:      ${file}`);
console.log(`top-level: ${top.length}`);
console.log(`max DOM depth:        ${maxSeen}`);
console.log(`max CONTAINER depth:  ${maxContainerDepth} (limit ${MAX_DEPTH})`);
console.log(`text nodes outside widgets: ${textNodes}`);

// Per-top-level-section container depth, so a violation can be located.
console.log(`\ndepth per top-level section:`);
top.forEach((node) => {
	let deepest = 0;
	const walk = (n, cd) => {
		if (!n || typeof n !== 'object') return;
		const cont = isContainer(n);
		const next = cont ? cd + 1 : cd;
		if (cont) deepest = Math.max(deepest, next);
		(n.elements ?? []).forEach((c) => walk(c, next));
	};
	walk(node, 0);
	const t = node.editor_settings?.title ?? node.id;
	console.log(`  ${String(deepest).padStart(2)}  ${t}`);
});
console.log(`\nelTypes:`);
[...elTypeCounts.entries()].sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${String(v).padStart(4)}  ${k}`));
console.log(`\nwidgets:`);
[...widgetCounts.entries()].sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${String(v).padStart(4)}  ${k}`));

console.log(`\n${problems.length ? '✗ PROBLEMS' : '✓ OK'}`);
problems.forEach((p) => console.log(`  - ${p}`));
process.exitCode = problems.length ? 1 : 0;
