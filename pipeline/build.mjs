#!/usr/bin/env node
/**
 * Build the Elementor template JSON for the Emifree landing page.
 *
 *   node build.mjs [--site-url https://example.com] [--out ./out]
 *
 * Outputs (all in `out/`):
 *
 *   emifree-landing-page.json   the full page — import this one
 *   section-hero.json           one file per section, for partial imports
 *   section-products.json
 *   section-applications.json
 *   section-technology.json
 *   section-knowledge.json
 *   section-contact.json
 *
 * Every file is a valid Elementor template:
 *
 *   { "version": "0.4", "type": "page", "content": [ … ] }
 *
 * The element ids are deterministic: the same source always produces the
 * same file, and the ids of a section are identical in the full page and
 * in its own section file.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { setSiteUrl, site } from './src/assets.mjs';
import { buildSection, buildSections, SECTION_NAMES } from './src/sections.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

/* ------------------------------------------------------------------ *
 * Arguments
 * ------------------------------------------------------------------ */

const args = process.argv.slice(2);

const argValue = (flag) => {
	const i = args.indexOf(flag);
	return i === -1 ? null : args[i + 1];
};

const outDir = resolve(HERE, argValue('--out') ?? 'out');

if (argValue('--site-url')) {
	setSiteUrl(argValue('--site-url'));
}

/* ------------------------------------------------------------------ *
 * Envelope
 * ------------------------------------------------------------------ */

/**
 * Wrap element trees in the Elementor template envelope.
 *
 * `"version": "0.4"` and `"type": "page"` are the two keys the brief asks
 * for; `page_settings` is what the editor writes next to them.
 */
const envelope = (title, content) => ({
	version: '0.4',
	title,
	type: 'page',
	content,
	page_settings: [],
});

/* ------------------------------------------------------------------ *
 * Self-check
 * ------------------------------------------------------------------ */

const ID_PATTERN = /^[a-z0-9]{7}$/;

/**
 * Verify the invariants the brief cares about:
 *
 *  - every element id is 7 alphanumeric characters and unique
 *  - every style referenced through `settings.classes` exists on the node
 *  - every node has an `elType`
 */
function verify(label, content) {
	const ids = new Set();
	const problems = [];

	const walk = (node, path) => {
		if (!node || typeof node !== 'object') return;

		if (!ID_PATTERN.test(node.id || '')) {
			problems.push(`${path}: id "${node.id}" is not 7 alphanumeric characters`);
		}
		if (ids.has(node.id)) {
			problems.push(`${path}: duplicate id "${node.id}"`);
		}
		ids.add(node.id);

		if (!node.elType) {
			problems.push(`${path}: missing elType`);
		}

		const styleIds = Object.keys(node.styles ?? {});
		const classes = node.settings?.classes?.value ?? [];
		for (const cls of classes) {
			if (styleIds.length && !styleIds.includes(cls)) {
				problems.push(`${path}: class "${cls}" has no matching style object`);
			}
		}

		(node.elements ?? []).forEach((child, i) => walk(child, `${path}>${child?.elType ?? '?'}[${i}]`));
	};

	content.forEach((node, i) => walk(node, `${label}[${i}]`));

	return { count: ids.size, problems };
}

/* ------------------------------------------------------------------ *
 * Write
 * ------------------------------------------------------------------ */

mkdirSync(outDir, { recursive: true });

// Full page — every section is built from its own seed window, so the ids
// are the same as in the per-section files.
const pageContent = buildSections();
{
	const file = join(outDir, 'emifree-landing-page.json');
	const { count, problems } = verify('page', pageContent);
	if (problems.length) {
		console.error(`✗ ${file}`);
		problems.forEach((p) => console.error(`    ${p}`));
		process.exitCode = 1;
	} else {
		console.log(`✓ ${file} — ${count} elements`);
	}
	writeFileSync(file, JSON.stringify(envelope('Emifree Landing Page', pageContent), null, 2) + '\n');
}

// One file per section — same ids as in the full page.
for (const name of SECTION_NAMES) {
	const content = [buildSection(name)];
	const file = join(outDir, `section-${name}.json`);
	const { count, problems } = verify(name, content);
	if (problems.length) {
		console.error(`✗ ${file}`);
		problems.forEach((p) => console.error(`    ${p}`));
		process.exitCode = 1;
	} else {
		console.log(`✓ ${file} — ${count} elements`);
	}
	writeFileSync(
		file,
		JSON.stringify(envelope(`Emifree Landing — ${name}`, content), null, 2) + '\n'
	);
}

console.log(`\nSite URL: ${site.url}`);
console.log(`Output:   ${outDir}`);
