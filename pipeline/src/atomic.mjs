/**
 * Atomic (V4) authoring layer for Elementor.
 *
 * Produces the payload shape that the MCP `build-composition` ability accepts:
 *
 *   { xml_structure, element_config, style, classes }
 *
 * ── Why this file exists ────────────────────────────────────────────────────
 * The live documents (post 72, post 135) are Elementor 4.x ATOMIC. They were
 * built through `build-composition`, not by importing a classic JSON envelope.
 * The classic emitter that used to live here (src/v3.mjs) produced
 * `"elType": "container"` + `custom_css` selector blocks, which the atomic
 * editor cannot consume. That emitter is superseded.
 *
 * ── The rules this layer enforces ───────────────────────────────────────────
 * • `xml_structure` is tags only. Every element carries a unique
 *   `configuration-id`; no ids, no classes, no text nodes.
 * • `element_config` holds PLAIN values. The ability converts them into the
 *   typed `$$type` envelopes the atomic store uses.
 * • `style` is a PLAIN CSS string. Nested blocks are limited to
 *   `&:hover` / `&:focus` / `&:active`; media blocks use
 *   `@media(--mobile)` / `@media(--tablet)`.
 * • `configuration-id` is per-request. The server assigns the real element ids
 *   and returns them in `resolved_xml`; those are the only ids usable in a
 *   follow-up `manage-elements` call.
 *
 * @module atomic
 */

/** Widget/element type names used by the atomic editor. */
export const T = {
	FLEX: 'e-flexbox',
	DIV: 'e-div-block',
	GRID: 'e-grid',
	HEADING: 'e-heading',
	PARA: 'e-paragraph',
	BUTTON: 'e-button',
	IMAGE: 'e-image',
	SVG: 'e-svg',
};

/**
 * A single element in the composition tree.
 *
 * @typedef {object} El
 * @property {string}  id       unique configuration-id
 * @property {string}  type     one of T.*
 * @property {object}  props    element_config values (plain)
 * @property {string}  style    plain CSS string
 * @property {string[]} classes global class labels
 * @property {El[]}    children
 */

/** Configuration-id counters, kept per composition so ids stay unique. */
let idSeq = 0;

/** Reset the id counter. Call before composing a fresh page. */
export function resetIds() {
	idSeq = 0;
}

/**
 * Normalise a slug into a configuration-id.
 * @param {string} base
 * @returns {string}
 */
function slug(base) {
	idSeq += 1;
	const clean = String(base)
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
	return `${clean || 'el'}-${idSeq}`;
}

/**
 * Build an element.
 *
 * @param {string} type    one of T.*
 * @param {object} [opts]
 * @param {string} [opts.id]      configuration-id (generated when omitted)
 * @param {object} [opts.props]   element_config values
 * @param {string} [opts.style]   plain CSS string
 * @param {string[]} [opts.classes] global class labels
 * @param {El[]} [opts.children]
 * @returns {El}
 */
export function el(type, opts = {}) {
	const node = {
		id: opts.id ? slug(opts.id) : slug(type.replace(/^e-/, '')),
		type,
		props: opts.props ? { ...opts.props } : {},
		style: opts.style ?? '',
		classes: opts.classes ?? [],
		children: opts.children ?? [],
	};
	// `_cssid` gives the element a stable, hand-written id in the DOM, which
	// is how JS scopes to it (the atomic editor drops `data-*` attributes).
	if (opts.cssid) node.props._cssid = opts.cssid;
	return node;
}

/** Flex container. `column` switches the main axis to column. */
export function flex(opts) {
	return el(T.FLEX, opts);
}

/** Block container. Use only as a single-child visual wrapper, never to lay out siblings. */
export function div(opts) {
	return el(T.DIV, opts);
}

/**
 * Grid container.
 *
 * `columns` is a CSS grid-template-columns value, `rows` a grid-template-rows
 * value. BOTH must be set explicitly: the atomic default is
 * `repeat(2, 1fr)` rows, and empty `fr` row tracks do not collapse — they
 * render as an equal-height empty band below the content.
 */
export function grid(opts) {
	const cols = opts.columns ?? 'repeat(2, 1fr)';
	const rows = opts.rows ?? 'repeat(1, 1fr)';
	const style = [opts.style, `display: grid;`, `grid-template-columns: ${cols};`, `grid-template-rows: ${rows};`]
		.filter(Boolean)
		.join('\n');
	return el(T.GRID, { ...opts, style });
}

/** Heading. `text` may contain inline HTML limited to the tags Elementor allows. */
export function heading(opts) {
	return el(T.HEADING, {
		...opts,
		props: { tag: opts.tag ?? 'h2', title: opts.text ?? '', ...(opts.props ?? {}) },
	});
}

/** Paragraph. `text` may contain inline HTML, including lists. */
export function para(opts) {
	return el(T.PARA, {
		...opts,
		props: { tag: opts.tag ?? 'p', paragraph: opts.text ?? '', ...(opts.props ?? {}) },
	});
}

/** Button. `href` becomes a link destination; omit it for a button with no target. */
export function button(opts) {
	const props = { text: opts.text ?? '', ...(opts.props ?? {}) };
	if (opts.href) props.link = { destination: opts.href, isTargetBlank: !!opts.blank };
	return el(T.BUTTON, { ...opts, props });
}

/**
 * Image from the Media Library.
 *
 * `mediaId` is an attachment id. Media Library images use the ATTACHMENT's alt
 * text — the widget's own `alt` is ignored for `id` sources, so the alt text
 * belongs on the attachment. `size` is required.
 */
export function image(opts) {
	return el(T.IMAGE, {
		...opts,
		props: {
			image: { src: { id: opts.mediaId }, size: opts.size ?? 'full' },
			...(opts.props ?? {}),
		},
	});
}

/**
 * A link destination object for `element_config`.
 * @param {string} url
 * @param {boolean} [blank]
 */
export function link(url, blank = false) {
	return { destination: url, isTargetBlank: blank };
}

/**
 * Serialise an element tree to XML.
 * @param {El} node
 * @returns {string}
 */
function toXml(node) {
	const attrs = `configuration-id="${node.id}"`;
	if (!node.children.length) return `<${node.type} ${attrs}></${node.type}>`;
	const inner = node.children.map(toXml).join('');
	return `<${node.type} ${attrs}>${inner}</${node.type}>`;
}

/**
 * Walk a tree, invoking the callback for each element.
 * @param {El} node
 * @param {(node: El) => void} fn
 */
export function walk(node, fn) {
	fn(node);
	(node.children ?? []).forEach((c) => walk(c, fn));
}

/**
 * Serialise a composition into the `build-composition` payload.
 *
 * @param {El} root
 * @returns {{xml_structure: string, element_config: object, style: object, classes: object}}
 */
export function serialize(root) {
	const element_config = {};
	const style = {};
	const classes = {};

	walk(root, (node) => {
		if (Object.keys(node.props).length) element_config[node.id] = node.props;
		if (node.style) style[node.id] = node.style;
		if (node.classes.length) classes[node.id] = node.classes;
	});

	return { xml_structure: toXml(root), element_config, style, classes };
}

/**
 * Serialise SEVERAL root elements into one composition payload.
 *
 * `build-composition` accepts multiple root elements, so a whole page can be
 * written in one call — one root per section.
 *
 * @param {El[]} roots
 * @returns {{xml_structure: string, element_config: object, style: object, classes: object}}
 */
export function serializeAll(roots) {
	const element_config = {};
	const style = {};
	const classes = {};

	roots.forEach((root) =>
		walk(root, (node) => {
			if (Object.keys(node.props).length) element_config[node.id] = node.props;
			if (node.style) style[node.id] = node.style;
			if (node.classes.length) classes[node.id] = node.classes;
		})
	);

	return {
		xml_structure: roots.map((r) => toXml(r)).join(''),
		element_config,
		style,
		classes,
	};
}

/**
 * Count the container depth of a tree, and report the deepest path.
 *
 * Containers are `e-flexbox` / `e-div-block` / `e-grid` / `e-tabs` / `e-tab` /
 * `e-accordion*` / `e-background-video*`. Widgets are leaves and never add a
 * level. The rule is <= 3, plus the named inline-group exception.
 *
 * @param {El} node
 * @param {number} [depth]
 * @returns {{depth: number, path: string[]}}
 */
export function depthOf(node, depth = 0) {
	const isContainer = node.type !== T.HEADING && node.type !== T.PARA && node.type !== T.BUTTON && node.type !== T.IMAGE && node.type !== T.SVG;
	const next = isContainer ? depth + 1 : depth;
	let best = { depth: next, path: [node.id] };
	(node.children ?? []).forEach((child) => {
		const sub = depthOf(child, next);
		if (sub.depth > best.depth) best = { depth: sub.depth, path: [node.id, ...sub.path] };
	});
	return best;
}

/** Widget types — leaves. They never add a container level. */
const WIDGET_TYPES = [T.HEADING, T.PARA, T.BUTTON, T.IMAGE, T.SVG];

/**
 * Resolve the NAMED inline groups (exception E1) to their generated ids.
 *
 * The builder appends a numeric suffix to every configuration-id, so the
 * named groups are tracked by their BASE name and resolved here.
 *
 * @param {El[]} roots
 * @param {string[]} baseNames e.g. ['emifree-thumb-strip']
 * @returns {Set<string>} the generated configuration-ids
 */
export function collectE1(roots, baseNames) {
	const found = new Set();
	roots.forEach((root) =>
		walk(root, (node) => {
			if (baseNames.some((base) => node.id === base || node.id.startsWith(`${base}-`))) {
				found.add(node.id);
			}
		})
	);
	return found;
}

/**
 * Assert the container-depth rule for a composition.
 *
 * The rule: at most `max` container levels. One extra level is permitted for
 * the NAMED inline groups (exception E1 in specs/constraints.md §3.1) — an
 * `e-flexbox` whose children are widgets only. A named group that contains a
 * container, or any container deeper than the named group, is a violation.
 *
 * @param {El} root
 * @param {number} [max]
 * @param {Set<string>} [e1Ids] configuration-ids allowed to sit at max + 1
 * @returns {string[]} problems (empty when compliant)
 */
export function checkDepth(root, max = 3, e1Ids = new Set()) {
	const problems = [];
	const walkDepth = (node, depth) => {
		const isContainer = !WIDGET_TYPES.includes(node.type);
		const next = isContainer ? depth + 1 : depth;
		if (isContainer && next > max) {
			if (next === max + 1 && e1Ids.has(node.id)) {
				const nested = (node.children ?? []).filter((c) => !WIDGET_TYPES.includes(c.type));
				if (nested.length) {
					problems.push(
						`E1 group ${node.id} may contain widgets only, found container(s): ${nested
							.map((c) => c.id)
							.join(', ')}`
					);
				}
			} else {
				problems.push(`container depth ${next} exceeds max ${max}: ${node.id}`);
			}
		}
		(node.children ?? []).forEach((c) => walkDepth(c, next));
	};
	walkDepth(root, 0);
	return problems;
}
