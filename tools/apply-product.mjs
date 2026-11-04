/**
 * Apply a product page payload to WordPress.
 *
 *   node tools/apply-product.mjs mechanical en
 *   node tools/apply-product.mjs --all
 *
 * The payload is the JSON written by `pipeline/build-products.mjs`. This
 * script drives the three MCP abilities in the order the write protocol
 * demands — the order matters:
 *
 *   1. elementor-build-composition   stage the tree into the autosave
 *   2. elementor-publish-document      promote the autosave to the live doc
 *   3. elementor-update-page-settings  settings {} — busts the 24 h
 *                                      `_elementor_element_cache`
 *
 * Skipping step 3 leaves the front end serving the previous tree. Skipping
 * step 2 leaves the live document untouched.
 *
 * The MCP credentials are read from the user config by `tools/mcpcall.js`;
 * nothing secret is ever written to disk or printed.
 *
 * @module apply-product
 */

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { init, callTool } = require('./mcpcall.js');

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(HERE, '..', 'pipeline', 'out');

/** Pull the human-readable text out of an MCP tool result. */
function resultText(r) {
	const content = r?.result?.content ?? [];
	const text = content
		.filter((b) => b.type === 'text')
		.map((b) => b.text)
		.join('\n');
	return text || JSON.stringify(r, null, 1);
}

/** Call an MCP ability and return its text payload. */
async function call(name, args) {
	const r = await callTool(name, args);
	if (r?.error) throw new Error(`${name}: ${JSON.stringify(r.error)}`);
	return resultText(r);
}

/**
 * Apply one payload file through the three-step write protocol.
 *
 * @param {string} file    payload path
 * @param {boolean} [dry]  only validate the payload, do not write
 */
async function apply(file, dry = false) {
	const payload = JSON.parse(readFileSync(file, 'utf8'));
	const label = file.split(/[\\/]/).pop().replace(/\.json$/, '');

	if (dry) {
		console.log(`[dry] ${label}: ${payload.xml_structure.length} xml bytes, ${Object.keys(payload.element_config).length} configured elements`);
		return;
	}

	console.log(`[${label}] build-composition …`);
	const built = await call('elementor-build-composition', {
		post_id: payload.post_id,
		xml_structure: payload.xml_structure,
		element_config: payload.element_config,
		style: payload.style,
		classes: payload.classes,
		parent_id: payload.parent_id,
		mode: payload.mode,
	});
	const summary = built.replace(/\s+/g, ' ').slice(0, 400);
	console.log(`  ${summary}`);

	console.log(`[${label}] publish-document …`);
	const published = await call('elementor-publish-document', { post_id: payload.post_id });
	console.log(`  ${published.replace(/\s+/g, ' ').slice(0, 300)}`);

	console.log(`[${label}] update-page-settings …`);
	const settings = await call('elementor-update-page-settings', { post_id: payload.post_id, settings: {} });
	console.log(`  ${settings.replace(/\s+/g, ' ').slice(0, 300)}`);

	console.log(`[${label}] done.`);
}

/* ------------------------------------------------------------------ */

const SLUGS = ['mechanical', 'electrostatic', 'dust'];
const LANGS = ['en', 'de'];

(async () => {
	const argv = process.argv.slice(2);
	const dry = argv.includes('--dry');
	const targets = [];

	if (argv.includes('--all')) {
		SLUGS.forEach((s) => LANGS.forEach((l) => targets.push([s, l])));
	} else {
		const slug = argv[0];
		const lang = argv[1] || 'en';
		if (!slug || !SLUGS.includes(slug)) {
			console.error('usage: node tools/apply-product.mjs <slug> <en|de> [--dry]');
			console.error('       node tools/apply-product.mjs --all [--dry]');
			process.exit(1);
		}
		targets.push([slug, lang]);
	}

	await init();
	for (const [slug, lang] of targets) {
		await apply(resolve(OUT_DIR, `product-${slug}-${lang}.json`), dry);
	}
})().catch((e) => {
	console.error('FATAL', e.message);
	process.exit(1);
});
