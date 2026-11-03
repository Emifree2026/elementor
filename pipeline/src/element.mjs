/**
 * Elementor 3 (classic) element builders — the authoring layer.
 *
 * The builders return a *neutral* tree: plain objects that keep the CSS of
 * every breakpoint as text. `src/v3.mjs` compiles that tree into an
 * Elementor document — native settings wherever Elementor has a control,
 * element-scoped `custom_css` (with the `selector` keyword) for everything
 * else.
 *
 * The neutral node looks like this:
 *
 * {
 *   id: 'a1b2c3d',
 *   type: 'e-flexbox',            // the authoring type
 *   settings: { … },              // plain values, widget specific
 *   css: { css, hover, focus, selected, tablet, mobile, raw },
 *   children: [ … ],
 *   title: 'hero-root',
 * }
 *
 * The authoring types map onto Elementor as follows:
 *
 *   e-flexbox / e-div-block / e-grid  →  container (isInner false / true)
 *   e-heading                         →  heading
 *   e-paragraph                       →  text-editor
 *   e-button                          →  button
 *   e-image                           →  image
 *   e-svg                             →  icon
 *   e-icon-box                        →  icon-box
 *   e-tabs                            →  nested-tabs
 *   e-form                            →  form
 */

import { attachmentUrl } from './assets.mjs';

/* ------------------------------------------------------------------ *
 * Identifiers
 * ------------------------------------------------------------------ */

const ID_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

const usedElementIds = new Set();

/**
 * 32-bit integer hash (murmur3 finaliser).
 *
 * A plain LCG is not good enough here: its low bits have a period of 16,
 * so taking `value % 16` for the id digits produced a repeating pattern and
 * the id space collapsed. This mixer spreads a seed over all 32 bits.
 */
const mix = (x) => {
	let z = (x + 0x9e3779b9) >>> 0;
	z = Math.imul(z ^ (z >>> 16), 0x21f0aaad) >>> 0;
	z = Math.imul(z ^ (z >>> 15), 0x735a2d97) >>> 0;
	return (z ^ (z >>> 15)) >>> 0;
};

/** Derive `length` characters of `alphabet` from a 32-bit hash. */
const idFrom = (hash, length, alphabet) => {
	let out = '';
	let s = hash;
	for (let i = 0; i < length; i++) {
		s = mix(s);
		out += alphabet[s % alphabet.length];
	}
	return out;
};

/**
 * Deterministic 7-character alphanumeric element id (brief rule 1).
 * Seeded, so a rebuild of the same source produces the same ids.
 */
export function elementId(seed = 1) {
	for (let attempt = 0; attempt < 10000; attempt++) {
		const hash = mix((seed * 2654435761 + attempt * 40503) >>> 0);
		const id = idFrom(hash, 7, ID_ALPHABET);
		if (!usedElementIds.has(id)) {
			usedElementIds.add(id);
			return id;
		}
	}
	throw new Error('elementId: exhausted the id space');
}

/**
 * Reset the id registry and re-base the id seed.
 *
 * Each section gets its own seed window so that the element ids are stable
 * — the same section always produces the same ids, whether it is built on
 * its own (per-section template file) or as part of the full page.
 */
export function resetIds(seedBase = 0) {
	usedElementIds.clear();
	seedCounter = seedBase;
}

/* ------------------------------------------------------------------ *
 * Setting helpers
 * ------------------------------------------------------------------ */

/**
 * A link.
 *
 * Elementor's URL control stores `{ url, is_external, nofollow,
 * custom_attributes }`; `is_external` is what opens the target in a new
 * tab.
 */
export function link(destination, opts = {}) {
	return {
		url: destination,
		is_external: opts.blank ? '1' : '',
		nofollow: opts.nofollow ? '1' : '',
		custom_attributes: '',
	};
}

/**
 * A media-library image.
 *
 * `size` is an explicit WordPress size — never the raw upload (brief
 * rule 4). The Elementor media control needs the id *and* the url: the
 * widget renders nothing when the url is empty.
 */
export function image(attachmentId, size = 'large') {
	return {
		id: attachmentId,
		url: attachmentUrl(attachmentId) ?? '',
		size,
	};
}

/**
 * An image referenced by absolute URL (theme file or CDN).
 *
 * External images carry their own alt text — a media-library image takes
 * its alt from the attachment instead.
 */
export function imageUrl(url, alt = '') {
	return {
		id: '',
		url,
		size: 'full',
		alt,
	};
}

/**
 * An uploaded SVG asset, in the shape Elementor's icons control stores.
 */
export function svg(attachmentId) {
	return {
		value: {
			id: attachmentId,
			url: attachmentUrl(attachmentId) ?? '',
		},
		library: 'svg',
	};
}

/**
 * An SVG referenced by absolute URL.
 *
 * Elementor resolves a URL that starts with `site_url()` by reading the
 * file from disk and inlining it, so a theme-shipped icon keeps working
 * without being uploaded to the Media Library.
 */
export function svgUrl(url) {
	return {
		value: { id: '', url },
		library: 'svg',
	};
}

/* ------------------------------------------------------------------ *
 * Element builder
 * ------------------------------------------------------------------ */

let seedCounter = 0;

/**
 * Create a neutral element node.
 *
 * @param {string} type  Authoring type, e.g. 'e-flexbox' or 'e-heading'.
 * @param {object} spec
 * @param {string}  [spec.title]       Editor title (shown in the navigator)
 * @param {object}  [spec.editorSettings] Extra editor settings
 * @param {object}  [spec.settings]    Widget settings
 * @param {string}  [spec.css]         Desktop declarations
 * @param {string}  [spec.hover]       Desktop hover declarations
 * @param {string}  [spec.focus]       Desktop focus declarations
 * @param {string}  [spec.selected]    Desktop "selected" declarations
 * @param {string}  [spec.tablet]      Tablet declarations
 * @param {string}  [spec.mobile]      Mobile declarations
 * @param {string}  [spec.raw]         Extra element-scoped CSS
 * @param {Array}   [spec.children]    Child elements
 * @param {boolean} [spec.locked]
 */
export function el(type, spec = {}) {
	seedCounter += 1;
	const seed = spec.seed ?? seedCounter;

	return {
		id: elementId(seed),
		type,
		settings: { ...(spec.settings ?? {}) },
		css: {
			css: spec.css ?? '',
			hover: spec.hover ?? '',
			focus: spec.focus ?? '',
			selected: spec.selected ?? '',
			tablet: spec.tablet ?? '',
			mobile: spec.mobile ?? '',
			raw: spec.raw ?? '',
		},
		children: (spec.children ?? []).filter(Boolean),
		title: spec.title ?? type,
		editorSettings: { ...(spec.editorSettings ?? {}) },
		locked: spec.locked ?? false,
	};
}

/**
 * Shorthand for a plain text widget (`e-paragraph`).
 */
export const text = (value, spec = {}) =>
	el('e-paragraph', {
		...spec,
		settings: { ...spec.settings, paragraph: value },
	});

/** Shorthand for a heading widget (`e-heading`). */
export const heading = (value, spec = {}) =>
	el('e-heading', { ...spec, settings: { ...spec.settings, title: value } });

/** Shorthand for a button widget (`e-button`). */
export const button = (label, spec = {}) =>
	el('e-button', { ...spec, settings: { ...spec.settings, text: label } });
