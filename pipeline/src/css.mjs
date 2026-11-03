/**
 * CSS → Elementor 4 atomic style props.
 *
 * Elementor 4.3 stores element styling as a map of *style objects*:
 *
 *   styles: {
 *     "e-1a2b3c4-5d6e": {
 *       id, label: "local", type: "class",
 *       variants: [
 *         { meta: { breakpoint: "desktop", state: null },
 *           props: { "color": { "$$type": "color", "value": "#fff" } },
 *           custom_css: { raw: "<base64 CSS>" } | null }
 *       ]
 *     }
 *   }
 *
 * Every `$$type` used below was reverse-engineered from a real 296 KB
 * Elementor 4.3.5 document (post 72) rather than guessed, so the emitted
 * JSON is byte-faithful to what the editor itself writes.
 *
 * Rule 3 of the brief (scoped custom CSS) maps onto atomic Elementor as:
 *   - native props  → editable in the Elementor UI (colours, fonts, spacing)
 *   - state variants (meta.state) → hover/focus, no custom CSS needed
 *   - custom_css.raw → base64, element-scoped, for what native cannot express
 */

import { Buffer } from 'node:buffer';

/* ------------------------------------------------------------------ *
 * Typed value constructors
 * ------------------------------------------------------------------ */

export const size = (size, unit) => ({ $$type: 'size', value: { size, unit } });
export const color = (value) => ({ $$type: 'color', value });
export const number = (value) => ({ $$type: 'number', value });
export const string = (value) => ({ $$type: 'string', value });
export const dimensions = (value) => ({ $$type: 'dimensions', value });
export const span = (value) => ({ $$type: 'span', value });

/* ------------------------------------------------------------------ *
 * Property routing tables
 * ------------------------------------------------------------------ */

const COLOR_PROPS = new Set([
	'color',
	'border-color',
	'outline-color',
	'text-decoration-color',
]);

const NUMBER_PROPS = new Set(['z-index', 'opacity', 'order']);

const STRING_PROPS = new Set([
	'align-items',
	'align-self',
	'aspect-ratio',
	'background-position',
	'background-repeat',
	'background-size',
	'border-style',
	'box-sizing',
	'cursor',
	'display',
	'flex-direction',
	'flex-wrap',
	'font-style',
	'font-weight',
	'grid-template-columns',
	'grid-template-rows',
	'justify-content',
	'list-style-type',
	'object-fit',
	'outline-style',
	'overflow',
	'pointer-events',
	'position',
	'text-align',
	'text-decoration',
	'text-overflow',
	'text-transform',
	'vertical-align',
	'white-space',
]);

/** Single-value size properties (padding/margin are handled separately). */
const SIZE_PROPS = new Set([
	'border-bottom-width',
	'border-left-width',
	'border-radius',
	'border-right-width',
	'border-top-width',
	'border-width',
	'column-gap',
	'font-size',
	'gap',
	'height',
	'inset-block-end',
	'inset-block-start',
	'inset-inline-end',
	'inset-inline-start',
	'letter-spacing',
	'line-height',
	'max-height',
	'max-width',
	'min-height',
	'min-width',
	'outline-offset',
	'outline-width',
	'row-gap',
	'scroll-margin-top',
	'text-indent',
	'width',
]);

/** Physical offsets are stored as logical inset props in atomic Elementor. */
const INSET_ALIASES = {
	top: 'inset-block-start',
	right: 'inset-inline-end',
	bottom: 'inset-block-end',
	left: 'inset-inline-start',
};

/** Shorthands that expand into several native props. */
const BORDER_SHORTHAND = /^border-(top|right|bottom|left)$/;

/* ------------------------------------------------------------------ *
 * Parsing helpers
 * ------------------------------------------------------------------ */

/**
 * Split a CSS declaration list on semicolons, respecting parentheses and
 * quoted strings so `rgba(0, 0, 0, 0.5)` and `content: "a;b"` survive.
 */
export function parseDeclarations(css) {
	const out = [];
	let depth = 0;
	let quote = null;
	let buf = '';

	for (const ch of css) {
		if (quote) {
			buf += ch;
			if (ch === quote) quote = null;
			continue;
		}
		if (ch === '"' || ch === "'") {
			quote = ch;
			buf += ch;
			continue;
		}
		if (ch === '(') depth++;
		if (ch === ')') depth--;
		if (ch === ';' && depth === 0) {
			out.push(buf);
			buf = '';
			continue;
		}
		buf += ch;
	}
	out.push(buf);

	return out
		.map((d) => d.trim())
		.filter(Boolean)
		.map((d) => {
			const i = d.indexOf(':');
			if (i === -1) return null;
			return { prop: d.slice(0, i).trim().toLowerCase(), value: d.slice(i + 1).trim() };
		})
		.filter(Boolean);
}

/** Split a value on top-level whitespace. */
export function splitValues(value) {
	const out = [];
	let depth = 0;
	let quote = null;
	let buf = '';

	for (const ch of value) {
		if (quote) {
			buf += ch;
			if (ch === quote) quote = null;
			continue;
		}
		if (ch === '"' || ch === "'") {
			quote = ch;
			buf += ch;
			continue;
		}
		if (ch === '(') depth++;
		if (ch === ')') depth--;
		if (/\s/.test(ch) && depth === 0) {
			if (buf) out.push(buf);
			buf = '';
			continue;
		}
		buf += ch;
	}
	if (buf) out.push(buf);
	return out;
}

/** Split a value on a top-level separator, respecting parentheses/quotes. */
export function splitTopLevel(value, separator = ',') {
	const out = [];
	let depth = 0;
	let quote = null;
	let buf = '';

	for (const ch of value) {
		if (quote) {
			buf += ch;
			if (ch === quote) quote = null;
			continue;
		}
		if (ch === '"' || ch === "'") {
			quote = ch;
			buf += ch;
			continue;
		}
		if (ch === '(') depth++;
		if (ch === ')') depth--;
		if (ch === separator && depth === 0) {
			out.push(buf);
			buf = '';
			continue;
		}
		buf += ch;
	}
	out.push(buf);

	return out.map((s) => s.trim()).filter(Boolean);
}

/**
 * Parse a CSS length into Elementor's `size` value.
 * Returns null when the value cannot be modelled natively.
 */
export function parseSize(raw) {
	const v = String(raw).trim();
	if (v === '') return null;

	if (v === 'auto') return { size: '', unit: 'auto' };

	const m = /^(-?\d*\.?\d+)(px|rem|em|%|vw|vh|vmin|vmax|dvh|dvw|svh|lvh|svw|lvw|fr|s|ms|ch)?$/.exec(v);
	if (m) {
		const n = Number(m[1]);
		const unit = m[2];
		// A unitless zero is a length of zero — Elementor stores it as 0px.
		if (!unit && n === 0) return { size: 0, unit: 'px' };
		// Unitless numbers (line-height: 1.15) are "custom" in Elementor.
		if (!unit) return { size: n, unit: 'custom' };
		// Elementor's size prop has no dvh/dvw/svh/lvh unit — the raw
		// length survives as a custom value instead.
		if (/^(d|sv|l)[hv]w$/.test(unit)) return { size: v, unit: 'custom' };
		return { size: n, unit };
	}

	// calc()/clamp()/var() are modelled as a custom unit string.
	if (/^(calc|clamp|min|max|var)\(/i.test(v)) return { size: v, unit: 'custom' };

	return null;
}

const toSize = (raw) => {
	const s = parseSize(raw);
	return s ? size(s.size, s.unit) : null;
};

/** Expand a 1–4 value box shorthand into top/right/bottom/left. */
function boxValues(values) {
	switch (values.length) {
		case 1:
			return [values[0], values[0], values[0], values[0]];
		case 2:
			return [values[0], values[1], values[0], values[1]];
		case 3:
			return [values[0], values[1], values[2], values[1]];
		case 4:
			return [values[0], values[1], values[2], values[3]];
		default:
			return null;
	}
}

/** Build the `dimensions` value object for padding/margin shorthands. */
function parseDimensions(value) {
	const parts = splitValues(value);
	if (parts.length < 1 || parts.length > 4) return null;
	const box = boxValues(parts);
	if (!box) return null;

	const [top, right, bottom, left] = box;
	const t = toSize(top);
	const r = toSize(right);
	const b = toSize(bottom);
	const l = toSize(left);
	if (!t || !r || !b || !l) return null;

	return {
		'block-start': t,
		'inline-end': r,
		'block-end': b,
		'inline-start': l,
	};
}

/** Parse a single box-shadow into Elementor's `shadow` object. */
function parseShadow(value) {
	const v = value.trim();
	if (v === 'none' || v === 'inset') return null;

	const parts = splitValues(v);
	if (parts.length < 3) return null;

	const lengths = [];
	let col = null;
	for (const p of parts) {
		if (/^-?[\d.]+(px|rem|em|%)?$/i.test(p)) {
			const s = parseSize(p);
			if (!s) return null;
			lengths.push(s);
			continue;
		}
		if (/^(#|rgb|rgba|hsl|hsla)/i.test(p) || /^[a-z]+$/i.test(p)) {
			col = p;
			continue;
		}
		return null;
	}
	if (lengths.length < 3 || lengths.length > 4) return null;

	const spread = lengths[3] ?? { size: 0, unit: 'px' };
	return {
		$$type: 'shadow',
		value: {
			hOffset: size(lengths[0].size, lengths[0].unit),
			vOffset: size(lengths[1].size, lengths[1].unit),
			blur: size(lengths[2].size, lengths[2].unit),
			spread: size(spread.size, spread.unit),
			color: color(col ?? 'rgba(0,0,0,0.2)'),
		},
	};
}

/** Parse the `transition` shorthand into Elementor's `selection-size` list. */
function parseTransition(value) {
	const items = [];
	for (const part of splitValues(value)) {
		if (part === 'none') return [];
		const chunks = part.split(/\s+/);
		const prop = chunks[0];
		const duration = chunks[1];
		const timing = chunks[2];

		// A custom easing function is not representable in the native
		// transition prop — the whole declaration falls back to custom CSS.
		if (timing && /cubic-bezier|steps|linear\(/.test(timing)) return null;

		const dur = parseSize(duration ?? '');
		if (!dur) return null;

		items.push({
			$$type: 'selection-size',
			value: {
				selection: {
					$$type: 'key-value',
					value: {
						key: string(prop),
						value: string(prop),
					},
				},
				size: size(dur.size, dur.unit),
			},
		});
	}
	return items.length ? items : null;
}

/** Parse a `transform` function list into Elementor's transform-functions. */
function parseTransform(value) {
	const v = value.trim();
	if (v === 'none') return null;

	const fns = [];
	const re = /(translate3d|translate|translateY|translateX|scale3d|scale|scaleX|scaleY|rotate)\(([^)]*)\)/g;
	let m;
	while ((m = re.exec(v)) !== null) {
		const name = m[1];
		const args = splitValues(m[2]).map(Number);

		if (name === 'translate3d' || name === 'translate') {
			fns.push({
				$$type: 'transform-move',
				value: {
					x: size(args[0] ?? 0, 'px'),
					y: size(args[1] ?? 0, 'px'),
					z: size(name === 'translate3d' ? (args[2] ?? 0) : 0, 'px'),
				},
			});
		} else if (name === 'translateY' || name === 'translateX') {
			fns.push({
				$$type: 'transform-move',
				value: {
					x: size(name === 'translateX' ? (args[0] ?? 0) : 0, 'px'),
					y: size(name === 'translateY' ? (args[0] ?? 0) : 0, 'px'),
					z: size(0, 'px'),
				},
			});
		} else if (name.startsWith('scale')) {
			fns.push({
				$$type: 'transform-scale',
				value: {
					x: args[0] ?? 1,
					y: args[1] ?? args[0] ?? 1,
					z: args[2] ?? args[1] ?? args[0] ?? 1,
				},
			});
		} else {
			// rotate() — keep as custom CSS rather than guess the prop shape.
			return null;
		}
	}
	if (!fns.length) return null;

	return {
		$$type: 'transform',
		value: {
			'transform-functions': {
				$$type: 'transform-functions',
				value: fns,
			},
		},
	};
}

/** Parse the `flex` shorthand into Elementor's `flex` prop. */
function parseFlex(value) {
	const parts = splitValues(value);
	if (!parts.length) return null;

	const grow = parts[0];
	const shrink = parts[1];
	const basis = parts[2];

	if (parts.length === 1 && grow === 'none') {
		return { $$type: 'flex', value: { flexGrow: number(0), flexShrink: number(0), flexBasis: size('auto', 'custom') } };
	}
	if (parts.length === 1 && grow === 'auto') {
		return { $$type: 'flex', value: { flexGrow: number(1), flexShrink: number(1), flexBasis: size('auto', 'custom') } };
	}
	if (parts.length === 1) {
		return { $$type: 'flex', value: { flexGrow: number(Number(grow)), flexShrink: number(1), flexBasis: size(0, '%') } };
	}

	const b = parseSize(basis ?? 'auto');
	if (!b) return null;

	return {
		$$type: 'flex',
		value: {
			flexGrow: number(Number(grow)),
			flexShrink: number(Number(shrink)),
			flexBasis: size(b.size, b.unit),
		},
	};
}

/* ------------------------------------------------------------------ *
 * Gradients
 * ------------------------------------------------------------------ */

/** CSS gradient keyword → angle in degrees (CSS convention). */
const GRADIENT_ANGLES = {
	'to top': 0,
	'to top right': 45,
	'to right top': 45,
	'to right': 90,
	'to bottom right': 135,
	'to right bottom': 135,
	'to bottom': 180,
	'to bottom left': 225,
	'to left bottom': 225,
	'to left': 270,
	'to top left': 315,
	'to left top': 315,
};

/**
 * Parse a linear-gradient() into Elementor's native `background-overlay`.
 * Returns null for radial/conic gradients (kept in custom CSS).
 */
function parseLinearGradient(value) {
	const m = /^linear-gradient\(\s*([^,]+),\s*(.+)\)$/i.exec(value.trim());
	if (!m) return null;

	const head = m[1].trim();
	let angle = null;
	let rest = m[2];

	const deg = /^(-?[\d.]+)deg$/i.exec(head);
	if (deg) {
		angle = Number(deg[1]);
	} else if (GRADIENT_ANGLES[head.toLowerCase()]) {
		angle = GRADIENT_ANGLES[head.toLowerCase()];
	} else {
		return null;
	}

	const stops = [];
	for (const raw of splitTopLevel(rest, ',')) {
		const parts = splitValues(raw);
		const col = parts[0];
		const offsetPart = parts[1];
		if (!col) return null;

		let offset = stops.length === 0 ? 0 : 100;
		if (offsetPart) {
			if (/%$/.test(offsetPart)) offset = parseFloat(offsetPart);
			else return null;
		} else if (parts.length > 2) {
			return null;
		}

		stops.push({
			$$type: 'color-stop',
			value: {
				color: color(col),
				offset: number(offset),
			},
		});
	}
	if (!stops.length) return null;

	return {
		$$type: 'background-gradient-overlay',
		value: {
			type: string('linear'),
			stops: { $$type: 'gradient-color-stop', value: stops },
			angle: number(angle),
		},
	};
}

/* ------------------------------------------------------------------ *
 * Filters
 * ------------------------------------------------------------------ */

/**
 * Parse a filter-function list into Elementor's `css-filter-func` array.
 * Supports the two functions this design uses: blur() and drop-shadow().
 */
function parseFilterFunctions(value) {
	const fns = [];
	const re = /(blur|drop-shadow)\(([^)]*)\)/g;
	let m;
	while ((m = re.exec(value)) !== null) {
		const name = m[1];
		const args = splitValues(m[2]);

		if (name === 'blur') {
			const s = parseSize(args[0] ?? '');
			if (!s) return null;
			fns.push({
				$$type: 'css-filter-func',
				value: {
					func: string('blur'),
					args: { $$type: 'blur', value: { size: size(s.size, s.unit) } },
				},
			});
			continue;
		}

		// drop-shadow(x y blur color)
		const lengths = [];
		let col = null;
		for (const a of args) {
			if (/^-?[\d.]+(px|rem|em|%)?$/i.test(a)) {
				const s = parseSize(a);
				if (!s) return null;
				lengths.push(s);
				continue;
			}
			if (/^(#|rgb|rgba|hsl|hsla)/i.test(a) || /^[a-z]+$/i.test(a)) {
				col = a;
				continue;
			}
			return null;
		}
		if (lengths.length < 2) return null;

		fns.push({
			$$type: 'css-filter-func',
			value: {
				func: string('drop-shadow'),
				args: {
					$$type: 'drop-shadow',
					value: {
						xAxis: size(lengths[0].size, lengths[0].unit),
						yAxis: size(lengths[1].size, lengths[1].unit),
						blur: size((lengths[2] ?? { size: 0, unit: 'px' }).size, (lengths[2] ?? { size: 0, unit: 'px' }).unit),
						color: color(col ?? 'rgba(0,0,0,0.2)'),
					},
				},
			},
		});
	}
	return fns.length ? fns : null;
}

/* ------------------------------------------------------------------ *
 * Declaration → props
 * ------------------------------------------------------------------ */

/**
 * Compile a CSS declaration list into Elementor typed props.
 *
 * @param {string} css Raw CSS declarations, e.g. "padding: 24px; color: #fff;"
 * @returns {{ props: object, customCss: string|null }} `customCss` holds the
 *          declarations Elementor has no native prop for; the caller stores
 *          them base64-encoded in the variant's `custom_css.raw`.
 */
export function compileCss(css) {
	const props = {};
	const leftovers = [];

	// `background-color` and `background-image` both land in the single
	// `background` prop, so they are collected and merged at the end.
	const bg = {};

	const push = (prop, value) => {
		if (value === null || value === undefined) leftovers.push({ prop, value });
		else props[prop] = value;
	};

	for (const { prop, value } of parseDeclarations(css)) {
		/* ---- background ------------------------------------------- */
		if (prop === 'background-color') {
			bg.color = color(value);
			continue;
		}
		if (prop === 'background-image') {
			const grad = parseLinearGradient(value);
			if (grad) {
				bg['background-overlay'] = { $$type: 'background-overlay', value: [grad] };
			} else {
				leftovers.push({ prop, value });
			}
			continue;
		}

		/* ---- box shorthands --------------------------------------- */
		if (prop === 'inset') {
			const box = boxValues(splitValues(value));
			if (box) {
				const [t, r, b, l] = box;
				push('inset-block-start', toSize(t));
				push('inset-inline-end', toSize(r));
				push('inset-block-end', toSize(b));
				push('inset-inline-start', toSize(l));
			} else {
				leftovers.push({ prop, value });
			}
			continue;
		}

		if (prop === 'border' || BORDER_SHORTHAND.test(prop)) {
			const side = prop === 'border' ? null : prop.replace('border-', '');
			const parts = splitValues(value);
			const width = parts.find((p) => /^-?[\d.]+(px|rem|em|%)?$/.test(p));
			const style = parts.find((p) => ['solid', 'dashed', 'dotted', 'none'].includes(p));
			const col = parts.find((p) => /^#|^rgb|^hsl|^\w+$/.test(p) && !['solid', 'dashed', 'dotted', 'none'].includes(p));

			if (width) push(side ? `border-${side}-width` : 'border-width', toSize(width));
			if (style) push(side ? `border-${side}-style` : 'border-style', string(style));
			if (col) push(side ? `border-${side}-color` : 'border-color', color(col));
			continue;
		}

		if (prop === 'outline') {
			const parts = splitValues(value);
			const width = parts.find((p) => /^-?[\d.]+(px|rem|em)?$/.test(p));
			const style = parts.find((p) => ['solid', 'dashed', 'dotted', 'none'].includes(p));
			const col = parts.find((p) => /^#|^rgb|^hsl|^\w+$/.test(p) && !['solid', 'dashed', 'dotted', 'none'].includes(p));
			if (width) push('outline-width', toSize(width));
			if (style) push('outline-style', string(style));
			if (col) push('outline-color', color(col));
			continue;
		}

		if (prop === 'padding' || prop === 'margin') {
			const dim = parseDimensions(value);
			if (dim) {
				// The Elementor editor collapses a uniform box into the
				// simple `size` prop and only uses the four-sided
				// `dimensions` prop when the sides differ. Mirror that.
				const sides = Object.values(dim);
				const uniform =
					sides.length === 4 &&
					sides.every(
						(s) =>
							s.value.size === sides[0].value.size &&
							s.value.unit === sides[0].value.unit
					);
				props[prop] = uniform
					? sides[0]
					: dimensions(dim);
			} else leftovers.push({ prop, value });
			continue;
		}

		/* ---- native single-value props ---------------------------- */
		if (prop === 'box-shadow') {
			const raw = splitValues(value);
			const shadows = raw.map(parseShadow);
			if (shadows.length && shadows.every(Boolean)) {
				props['box-shadow'] = { $$type: 'box-shadow', value: shadows };
			} else {
				leftovers.push({ prop, value });
			}
			continue;
		}

		if (prop === 'transition') {
			const t = parseTransition(value);
			if (t) props.transition = { $$type: 'transition', value: t };
			else leftovers.push({ prop, value });
			continue;
		}

		if (prop === 'transform') {
			const t = parseTransform(value);
			if (t) props.transform = t;
			else leftovers.push({ prop, value });
			continue;
		}

		if (prop === 'flex') {
			const f = parseFlex(value);
			if (f) props.flex = f;
			else leftovers.push({ prop, value });
			continue;
		}

		if (prop === 'grid-column' || prop === 'grid-row') {
			props[prop] = span(value);
			continue;
		}

		if (prop === 'filter' || prop === 'backdrop-filter') {
			const fns = parseFilterFunctions(value);
			if (fns) props[prop] = { $$type: prop, value: fns };
			else leftovers.push({ prop, value });
			continue;
		}

		if (COLOR_PROPS.has(prop)) {
			props[prop] = color(value);
			continue;
		}

		if (NUMBER_PROPS.has(prop)) {
			const n = Number(value);
			if (!Number.isNaN(n)) props[prop] = number(n);
			else leftovers.push({ prop, value });
			continue;
		}

		if (STRING_PROPS.has(prop)) {
			props[prop] = string(value);
			continue;
		}

		if (SIZE_PROPS.has(prop)) {
			const s = toSize(value);
			if (s) props[prop] = s;
			else leftovers.push({ prop, value });
			continue;
		}

		if (prop in INSET_ALIASES) {
			const s = toSize(value);
			if (s) props[INSET_ALIASES[prop]] = s;
			else leftovers.push({ prop, value });
			continue;
		}

		/* ---- everything else --------------------------------------- */
		leftovers.push({ prop, value });
	}

	let customCss = null;
	if (leftovers.length) {
		customCss = leftovers.map((l) => `${l.prop}: ${l.value};`).join(' ');
	}

	if (Object.keys(bg).length) {
		props.background = { $$type: 'background', value: bg };
	}

	return { props, customCss };
}

/** Base64-encode a CSS string the way Elementor stores `custom_css.raw`. */
export function encodeCustomCss(css) {
	return Buffer.from(css, 'utf8').toString('base64');
}
