/**
 * Build the `build-composition` payload for one product page.
 *
 *   node pipeline/build-products.mjs mechanical en
 *   node pipeline/build-products.mjs electrostatic de
 *
 * Writes the payload to `pipeline/out/product-<slug>-<lang>.json` and prints a
 * short report (element count, container depth, any depth violations).
 *
 * The payload is sent to WordPress by `tools/apply-product.mjs`, which drives
 * the MCP abilities in the order the write protocol demands:
 *
 *   build-composition -> publish-document -> update-page-settings
 *
 * @module build-products
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { resetIds, serializeAll, depthOf, checkDepth, collectE1 } from './src/atomic.mjs';
import { buildProductPage, E1_GROUP_NAMES } from './src/product-sections.mjs';
import { getProduct } from './src/product-content.mjs';
import { getProductDe } from './src/product-content-de.mjs';
import manifest from './src/media-manifest.json' with { type: 'json' };

const HERE = dirname(fileURLToPath(import.meta.url));

/** The page ids the seeder creates. See inc/page-seed.php. */
export const POST_IDS = {
	mechanical: { en: 44, de: 45 },
	electrostatic: { en: 46, de: 47 },
	dust: { en: 48, de: 49 },
};

const slug = process.argv[2];
const lang = process.argv[3] || 'en';

if (!slug || !POST_IDS[slug]) {
	console.error('usage: node pipeline/build-products.mjs <slug> <en|de>');
	console.error('  slugs: ' + Object.keys(POST_IDS).join(', '));
	process.exit(1);
}

const product = lang === 'de' ? getProductDe(slug) : getProduct(slug);
const media = manifest.media;

resetIds();
const roots = buildProductPage(product, media);

/* ---- depth check ---------------------------------------------------- */

const e1Ids = collectE1(roots, E1_GROUP_NAMES);
const problems = [];
let maxDepth = 0;
let deepest = null;
roots.forEach((root) => {
	const d = depthOf(root);
	if (d.depth > maxDepth) {
		maxDepth = d.depth;
		deepest = d.path;
	}
	checkDepth(root, 3, e1Ids).forEach((p) => problems.push(p));
});

/* ---- element counts ------------------------------------------------- */

let containers = 0;
let widgets = 0;
const byType = {};
roots.forEach((root) => {
	const stack = [root];
	while (stack.length) {
		const node = stack.pop();
		byType[node.type] = (byType[node.type] || 0) + 1;
		if (['e-heading', 'e-paragraph', 'e-button', 'e-image', 'e-svg'].includes(node.type)) widgets += 1;
		else containers += 1;
		(node.children || []).forEach((c) => stack.push(c));
	}
});

/* ---- payload -------------------------------------------------------- */

const payload = serializeAll(roots);
const postId = POST_IDS[slug][lang];

const out = {
	post_id: postId,
	parent_id: 'document',
	mode: 'replace_children',
	...payload,
};

const outDir = resolve(HERE, 'out');
mkdirSync(outDir, { recursive: true });
const outFile = resolve(outDir, `product-${slug}-${lang}.json`);
writeFileSync(outFile, JSON.stringify(out, null, '\t'), 'utf8');

/* ---- report --------------------------------------------------------- */

console.log(`product      : ${slug} (${lang}) -> post ${postId}`);
console.log(`root elements: ${roots.length}`);
console.log(`containers   : ${containers}`);
console.log(`widgets      : ${widgets}`);
console.log(`by type      : ${Object.entries(byType).map(([k, v]) => `${k}=${v}`).join(' ')}`);
console.log(`max depth    : ${maxDepth}  ${deepest ? deepest.join(' > ') : ''}`);
console.log(`violations   : ${problems.length ? problems.join(' | ') : 'none'}`);
console.log(`xml bytes    : ${out.xml_structure.length}`);
console.log(`written      : ${outFile}`);

if (problems.length) {
	console.error('');
	console.error('DEPTH VIOLATIONS — the E1 inline-group exceptions are the only allowed L4.');
	process.exitCode = 1;
}
