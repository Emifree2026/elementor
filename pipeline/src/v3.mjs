/**
 * Elementor 3 (classic) template emitter.
 *
 * Turns a declarative spec into a ready-to-import Elementor template
 * document (`version: "0.4"`, `type: "page"`).
 *
 * Why classic and not atomic (v4)
 * -------------------------------
 * Elementor 4.3.5 ships both element systems. The atomic system writes a
 * different document shape (`elementType`, `style` objects, no `isInner`)
 * and has no `custom_css` control, so the two cannot be mixed. This
 * project targets the classic system because
 *
 *   - `custom_css` (an Elementor **Pro** feature) is only available on
 *     classic containers and widgets — `elementor-pro/modules/custom-css/
 *     module.php` registers the `code` control only when the licence
 *     reports the `custom-css` feature, and it renders the CSS through
 *     `$post_css->get_element_unique_selector( $element )`, which is what
 *     makes the `selector` keyword work;
 *   - the classic system exposes the control names the brief asks for
 *     (`heading`, `text-editor`, `button`, `image`, `icon-box`) and the
 *     `isInner` flag;
 *   - classic documents import into any Elementor 3.x site, while atomic
 *     documents require Elementor 3.28+ and the atomic experiment.
 *
 * The single rule that governs every decision below
 * --------------------------------------------------
 * Elementor Pro appends an element's `custom_css` **after** all device
 * media queries (`add_raw_css()` in `elementor-pro/modules/custom-css/
 * module.php`). A property that is emitted both natively and in
 * `custom_css` therefore resolves to the custom value on every device.
 * So: **a property is either native or custom, never both.** This module
 * enforces that by routing each declaration exactly once.
 *
 * Custom CSS uses the `selector` keyword, which Pro replaces with the
 * element's unique selector. Because the replacement is a plain
 * `str_replace()`, the word "selector" must not appear anywhere else in
 * the stored CSS — `buildCustomCss()` refuses to emit it.
 */

/* ------------------------------------------------------------------ *
 * Identifiers
 * ------------------------------------------------------------------ */

const ID_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

const usedElementIds = new Set();

let seedCounter = 0;

/**
 * 32-bit integer hash (murmur3 finaliser).
 *
 * A plain LCG is not good enough here: its low bits have a period of 16,
 * so taking `value % 16` for the id digits produced a repeating pattern
 * and the id space collapsed. This mixer spreads a seed over all 32 bits.
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
 * Each section gets its own seed window so that the element ids are
 * stable — the same section always produces the same ids, whether it is
 * built on its own (per-section template file) or as part of the full
 * page.
 */
export function resetIds(seedBase = 0) {
	usedElementIds.clear();
	seedCounter = seedBase;
}

/** Allocate the next id from the current seed window. */
const nextId = () => {
	seedCounter += 1;
	return elementId(seedCounter);
};

/* ------------------------------------------------------------------ *
 * Control value helpers
 *
 * Every value below matches the shape the live control expects — the
 * shapes were taken from `workspace/tools/controls.json`, a dump of the
 * control definitions of the running install.
 * ------------------------------------------------------------------ */

/** A pixel dimension slider. */
export const px = (n) => ({ unit: 'px', size: String(n), sizes: [] });

/** A percentage dimension slider. */
export const pct = (n) => ({ unit: '%', size: String(n), sizes: [] });

/** A grid track slider (`repeat(N, 1fr)`). */
export const fr = (n) => ({ unit: 'fr', size: String(n), sizes: [] });

/** A free-form unit slider (`--min-height: 100dvh`, `line-height: 1.2`). */
export const raw = (value, unit = 'custom') => ({ unit, size: String(value), sizes: [] });

/**
 * A four-sided box (`padding`, `margin`, `border-radius`, …).
 *
 * Accepts a single number for all sides, or `[top, right, bottom, left]`.
 */
export function box(value) {
	if (value === null || value === undefined) return null;
	const [top, right, bottom, left] = Array.isArray(value) ? value : [value, value, value, value];
	return {
		unit: 'px',
		top: String(top),
		right: String(right),
		bottom: String(bottom),
		left: String(left),
		isLinked: top === right && right === bottom && bottom === left,
	};
}

/**
 * A gap control (`--gap: ROW COLUMN`).
 *
 * Accepts a single number for both axes or `[row, column]`.
 */
export function gap(value) {
	if (value === null || value === undefined) return null;
	const [row, column] = Array.isArray(value) ? value : [value, value];
	return {
		row: String(row),
		column: String(column),
		unit: 'px',
		isLinked: row === column,
	};
}

/**
 * A URL control.
 *
 * `blank` opens the target in a new tab (`is_external`).
 */
export function link(url, { blank = false, nofollow = false } = {}) {
	return {
		url,
		is_external: blank ? '1' : '',
		nofollow: nofollow ? '1' : '',
		custom_attributes: '',
	};
}

/**
 * A media control.
 *
 * Elementor's media control stores the URL next to the attachment id and
 * renders nothing when the URL is empty — both are required. `size` is
 * always an explicit WordPress size, never the raw upload (brief rule 4).
 */
export function mediaRef(id, url, size = 'large') {
	return { id: String(id ?? ''), url: url ?? '', size };
}

/**
 * An icons control holding an uploaded SVG.
 *
 * `library: 'svg'` tells Elementor the value is a media-library SVG; the
 * `value` object carries the attachment id and the URL.
 */
export function svgRef(id, url) {
	return {
		value: { id: String(id ?? ''), url: url ?? '' },
		library: 'svg',
	};
}

/* ------------------------------------------------------------------ *
 * Shadows
 * ------------------------------------------------------------------ */

/** A single, outside, pixel-offset shadow layer. */
const SHADOW_LAYER = /^(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+(.+)$/;

/**
 * Split a comma separated list, ignoring commas inside parentheses.
 */
function splitTopLevel(value) {
	const parts = [];
	let depth = 0;
	let current = '';

	for (const ch of value) {
		if (ch === '(') depth += 1;
		if (ch === ')') depth -= 1;

		if (ch === ',' && depth === 0) {
			parts.push(current);
			current = '';
			continue;
		}
		current += ch;
	}
	parts.push(current);

	return parts;
}

/**
 * Parse a CSS `box-shadow` value.
 *
 * Returns the Elementor box-shadow control value when the shadow is a
 * single outside layer with pixel offsets — that is the only shape the
 * control can express. Every other shape (two layers, an inset shadow, a
 * keyword) returns `null` and has to be written to `custom_css` instead.
 */
export function parseShadow(value) {
	if (!value) return null;

	const layers = splitTopLevel(value)
		.map((layer) => layer.trim())
		.filter(Boolean);

	if (layers.length !== 1) return null;

	const match = SHADOW_LAYER.exec(layers[0]);
	if (!match) return null;

	return {
		horizontal: Number(match[1]),
		vertical: Number(match[2]),
		blur: Number(match[3]),
		spread: Number(match[4]),
		color: match[5].trim(),
	};
}

/* ------------------------------------------------------------------ *
 * Custom CSS
 * ------------------------------------------------------------------ */

/** Elementor's own device breakpoints, as used by its media queries. */
export const MEDIA = {
	tablet: '(max-width: 1024px)',
	mobile: '(max-width: 767px)',
};

/**
 * Assemble an element's `custom_css` block.
 *
 * The `selector` keyword is replaced by Elementor Pro with the element's
 * unique selector, so every rule has to be written against it.
 *
 * `extra` holds complete rules that do not fit the `selector { … }` shape —
 * a descendant rule (`selector ul { … }`) or a rule that targets a child
 * widget (`selector .elementor-button { … }`). The caller writes the
 * `selector` keyword itself in those.
 */
export function buildCustomCss({ css, hover, focus, tablet, mobile, extra = [] } = {}) {
	const chunks = [];

	const push = (body) => {
		if (body && body.trim()) chunks.push(body.trim());
	};

	push(css ? `selector { ${css} }` : '');
	push(hover ? `selector:hover { ${hover} }` : '');
	push(focus ? `selector:focus-visible { ${focus} }` : '');
	push(tablet ? `@media ${MEDIA.tablet} { selector { ${tablet} } }` : '');
	push(mobile ? `@media ${MEDIA.mobile} { selector { ${mobile} } }` : '');

	for (const rule of extra) push(rule);

	const out = chunks.join('\n');

	// The replacement is a plain `str_replace()`, so the word "selector"
	// must not appear anywhere else — a class named `.my-selector` would
	// be rewritten to `.my-.elementor-element-…`.
	if (/[.#a-zA-Z0-9_-]selector|selector[.#a-zA-Z0-9_-]/.test(out)) {
		throw new Error(
			'buildCustomCss: the word "selector" may only be used as the Elementor keyword',
		);
	}

	return out;
}

/**
 * Join declaration fragments into a CSS declaration block.
 *
 * `null` fragments are dropped, so callers can pass optional values
 * inline.
 */
const decl = (...parts) =>
	parts
		.filter((part) => part && String(part).trim())
		.map((part) => {
			const text = String(part).trim();
			return text.endsWith(';') ? text : `${text};`;
		})
		.join(' ');

/* ------------------------------------------------------------------ *
 * Node factory
 * ------------------------------------------------------------------ */

/**
 * Create a classic Elementor node.
 *
 * Containers carry `isInner` (brief rule 2): `false` for a root
 * container, `true` for a container nested inside another container.
 */
function node({ elType, widgetType = null, isInner = false, title, settings = {}, children = [] }) {
	const base = {
		id: nextId(),
		elType,
	};

	if (widgetType) base.widgetType = widgetType;
	if (elType === 'container') base.isInner = isInner;

	return {
		...base,
		settings,
		elements: children.filter(Boolean),
		editor_settings: { title: title ?? elType },
	};
}

/* ------------------------------------------------------------------ *
 * Container
 * ------------------------------------------------------------------ */

/**
 * Build a classic Elementor container.
 *
 * Box model
 * ---------
 * A root container is `content_width: 'full'`: it fills the column and
 * carries the section padding and the section background, so the
 * background is full bleed while the content stays inside the gutter.
 *
 * The max-width column inside it is `content_width: 'boxed'` with
 * `boxed_width`; Elementor renders an `.e-con-inner` wrapper for it,
 * which is centred by `margin: 0 auto`.
 *
 * Both containers must set `padding` and `gap` explicitly — Elementor
 * defaults them to 10px and 20px.
 */
export function container(spec = {}) {
	const {
		title = 'container',
		id = null,
		classes = null,
		isInner = false,

		layout = 'flex',
		contentWidth = 'full',
		maxWidth = null,
		width = null,
		htmlTag = null,
		href = null,

		direction = null,
		directionTablet = null,
		directionMobile = null,
		align = null,
		alignTablet = null,
		alignMobile = null,
		justify = null,
		justifyTablet = null,
		justifyMobile = null,
		wrap = null,
		wrapTablet = null,
		wrapMobile = null,

		gap: gapValue = 0,
		gapTablet = null,
		gapMobile = null,

		columns = null,
		columnsTablet = null,
		columnsMobile = null,
		columnsCustom = null,
		rows = null,
		gridAlignItems = null,
		gridJustifyItems = null,
		gridAlignContent = null,
		gridJustifyContent = null,
		gridAutoFlow = null,

		padding = 0,
		paddingTablet = null,
		paddingMobile = null,
		margin = null,
		marginTablet = null,
		marginMobile = null,

		minHeight = null,
		position = null,
		offsetX = null,
		offsetXEnd = null,
		offsetY = null,
		offsetYEnd = null,
		zIndex = null,
		overflow = null,

		bg = null,
		bgGradient = null,
		bgVideo = null,
		bgHover = null,

		border = null,
		borderHover = null,
		radius = null,
		radiusTablet = null,
		radiusMobile = null,

		shadow = null,
		shadowHover = null,
		transition = null,

		css = null,
		cssHover = null,
		cssFocus = null,
		cssTablet = null,
		cssMobile = null,
		extra = [],

		children = [],
	} = spec;

	const settings = {
		container_type: layout,
		content_width: contentWidth,
	};

	if (contentWidth === 'full') {
		settings.width = width !== null ? pct(width) : pct(100);
	} else if (maxWidth !== null) {
		settings.boxed_width = px(maxWidth);
	}

	// A container can become the anchor of a card (`html_tag: 'a'` plus a
	// `link`), which is how the product cards keep a single, valid link.
	if (htmlTag !== null) settings.html_tag = htmlTag;
	if (href) settings.link = link(href);

	if (layout === 'grid') {
		if (columnsCustom !== null) settings.grid_columns_grid = raw(columnsCustom);
		if (columns !== null) settings.grid_columns_grid = fr(columns);
		if (columnsTablet !== null) settings.grid_columns_grid_tablet = fr(columnsTablet);
		if (columnsMobile !== null) settings.grid_columns_grid_mobile = fr(columnsMobile);
		if (rows !== null) settings.grid_rows_grid = raw(rows);
		if (gridAlignItems !== null) settings.grid_align_items = gridAlignItems;
		if (gridJustifyItems !== null) settings.grid_justify_items = gridJustifyItems;
		if (gridAlignContent !== null) settings.grid_align_content = gridAlignContent;
		if (gridJustifyContent !== null) settings.grid_justify_content = gridJustifyContent;
		if (gridAutoFlow !== null) settings.grid_auto_flow = gridAutoFlow;
	} else {
		if (direction !== null) settings.flex_direction = direction;
		if (directionTablet !== null) settings.flex_direction_tablet = directionTablet;
		if (directionMobile !== null) settings.flex_direction_mobile = directionMobile;
		if (align !== null) settings.flex_align_items = align;
		if (alignTablet !== null) settings.flex_align_items_tablet = alignTablet;
		if (alignMobile !== null) settings.flex_align_items_mobile = alignMobile;
		if (justify !== null) settings.flex_justify_content = justify;
		if (justifyTablet !== null) settings.flex_justify_content_tablet = justifyTablet;
		if (justifyMobile !== null) settings.flex_justify_content_mobile = justifyMobile;
		if (wrap !== null) settings.flex_wrap = wrap;
		if (wrapTablet !== null) settings.flex_wrap_tablet = wrapTablet;
		if (wrapMobile !== null) settings.flex_wrap_mobile = wrapMobile;
	}

	if (layout === 'grid') {
		const gridGaps = gap(gapValue);
		if (gridGaps) settings.grid_gaps = gridGaps;
		const gridGapsTablet = gap(gapTablet);
		if (gridGapsTablet) settings.grid_gaps_tablet = gridGapsTablet;
		const gridGapsMobile = gap(gapMobile);
		if (gridGapsMobile) settings.grid_gaps_mobile = gridGapsMobile;
	} else {
		const flexGap = gap(gapValue);
		if (flexGap) settings.flex_gap = flexGap;
		const flexGapTablet = gap(gapTablet);
		if (flexGapTablet) settings.flex_gap_tablet = flexGapTablet;
		const flexGapMobile = gap(gapMobile);
		if (flexGapMobile) settings.flex_gap_mobile = flexGapMobile;
	}

	const pad = box(padding);
	if (pad) settings.padding = pad;
	const padTablet = box(paddingTablet);
	if (padTablet) settings.padding_tablet = padTablet;
	const padMobile = box(paddingMobile);
	if (padMobile) settings.padding_mobile = padMobile;

	const mar = box(margin);
	if (mar) settings.margin = mar;
	const marTablet = box(marginTablet);
	if (marTablet) settings.margin_tablet = marTablet;
	const marMobile = box(marginMobile);
	if (marMobile) settings.margin_mobile = marMobile;

	if (minHeight !== null) settings.min_height = raw(minHeight);
	if (position !== null) settings.position = position;
	// The offset controls are the native route to `inset: 0` — they emit
	// `left` / `right` / `top` / `bottom` on the wrapper.
	if (offsetX !== null) settings._offset_x = px(offsetX);
	if (offsetXEnd !== null) settings._offset_x_end = px(offsetXEnd);
	if (offsetY !== null) settings._offset_y = px(offsetY);
	if (offsetYEnd !== null) settings._offset_y_end = px(offsetYEnd);
	if (zIndex !== null) settings.z_index = zIndex;
	if (overflow !== null) settings.overflow = overflow;

	if (bgVideo) {
		settings.background_background = 'video';
		settings.background_video_link = bgVideo.url;
		// The colour stays behind the video as the pre-load frame.
		if (bg !== null) settings.background_color = bg;
		if (bgVideo.playOnMobile) settings.background_play_on_mobile = 'yes';
	} else if (bgGradient) {
		settings.background_background = 'gradient';
		settings.background_color = bgGradient.from;
		settings.background_color_stop = pct(bgGradient.fromStop ?? 0);
		settings.background_color_b = bgGradient.to;
		settings.background_color_b_stop = pct(bgGradient.toStop ?? 100);
		settings.background_gradient_type = bgGradient.type ?? 'linear';
		settings.background_gradient_angle = raw(bgGradient.angle ?? 90, 'deg');
	} else if (bg !== null) {
		settings.background_background = 'classic';
		settings.background_color = bg;
	}

	if (bgHover !== null) {
		settings.background_hover_background = 'classic';
		settings.background_hover_color = bgHover;
	}

	if (border) {
		settings.border_border = border.style ?? 'solid';
		settings.border_width = box(border.width ?? 1);
		settings.border_color = border.color;
	}

	if (borderHover) {
		settings.border_hover_border = borderHover.style ?? 'solid';
		if (borderHover.width !== undefined) settings.border_hover_width = box(borderHover.width);
		if (borderHover.color !== undefined) settings.border_hover_color = borderHover.color;
	}

	const rad = box(radius);
	if (rad) settings.border_radius = rad;
	const radTablet = box(radiusTablet);
	if (radTablet) settings.border_radius_tablet = radTablet;
	const radMobile = box(radiusMobile);
	if (radMobile) settings.border_radius_mobile = radMobile;

	// Shadows: a single outside layer is native, anything else is custom
	// CSS (brief rule 3 — Elementor's control holds exactly one layer).
	const nativeShadow = parseShadow(shadow);
	const nativeShadowHover = parseShadow(shadowHover);

	if (nativeShadow) {
		settings.box_shadow_box_shadow_type = 'yes';
		settings.box_shadow_box_shadow = nativeShadow;
	}
	if (nativeShadowHover) {
		settings.box_shadow_hover_box_shadow_type = 'yes';
		settings.box_shadow_hover_box_shadow = nativeShadowHover;
	}

	if (id) settings._element_id = id;
	if (classes) settings.css_classes = classes;

	// Custom CSS — only what the native controls cannot express.
	const baseCss = decl(
		css,
		transition ? `transition: ${transition}` : null,
		shadow && !nativeShadow ? `box-shadow: ${shadow}` : null,
	);

	const hoverCss = decl(
		cssHover,
		shadowHover && !nativeShadowHover ? `box-shadow: ${shadowHover}` : null,
	);

	const customCss = buildCustomCss({
		css: baseCss,
		hover: hoverCss,
		focus: cssFocus,
		tablet: cssTablet,
		mobile: cssMobile,
		extra,
	});

	if (customCss) settings.custom_css = customCss;

	return node({
		elType: 'container',
		isInner,
		title,
		settings,
		children,
	});
}

/* ------------------------------------------------------------------ *
 * Typography helper
 * ------------------------------------------------------------------ */

/**
 * Build the `typography_*` control group.
 *
 * The group only renders when `typography_typography` is switched on, so
 * that switcher is always emitted together with the values.
 */
function typography(prefix, options = {}) {
	const {
		fontFamily = null,
		size = null,
		sizeTablet = null,
		sizeMobile = null,
		weight = null,
		fontStyle = null,
		lineHeight = null,
		letterSpacing = null,
		transform = null,
	} = options;

	const settings = { [`${prefix}_typography`]: 'yes' };

	if (fontFamily !== null) settings[`${prefix}_font_family`] = fontFamily;
	if (size !== null) settings[`${prefix}_font_size`] = px(size);
	if (sizeTablet !== null) settings[`${prefix}_font_size_tablet`] = px(sizeTablet);
	if (sizeMobile !== null) settings[`${prefix}_font_size_mobile`] = px(sizeMobile);
	if (weight !== null) settings[`${prefix}_font_weight`] = String(weight);
	if (fontStyle !== null) settings[`${prefix}_font_style`] = fontStyle;
	if (lineHeight !== null) settings[`${prefix}_line_height`] = raw(lineHeight);
	// Letter spacing is unitless in the design tokens (`-0.02em`), and the
	// `custom` unit would emit a bare number, which CSS rejects.
	if (letterSpacing !== null) settings[`${prefix}_letter_spacing`] = raw(letterSpacing, 'em');
	if (transform !== null) settings[`${prefix}_text_transform`] = transform;

	return settings;
}

/**
 * A widget-level background group.
 *
 * Widgets expose the background group under the `_background` name, so the
 * control ids carry the leading underscore (`_background_color`, …) and the
 * hover tab lives under `_background_hover`.
 */
function widgetBackground({ bg = null, gradient = null, hover = null, hoverGradient = null } = {}) {
	const settings = {};

	if (gradient) {
		settings._background_background = 'gradient';
		settings._background_color = gradient.from;
		settings._background_color_stop = pct(gradient.fromStop ?? 0);
		settings._background_color_b = gradient.to;
		settings._background_color_b_stop = pct(gradient.toStop ?? 100);
		settings._background_gradient_type = gradient.type ?? 'linear';
		settings._background_gradient_angle = raw(gradient.angle ?? 180, 'deg');
	} else if (bg !== null) {
		settings._background_background = 'classic';
		settings._background_color = bg;
	}

	if (hoverGradient) {
		settings._background_hover_background = 'gradient';
		settings._background_hover_color = hoverGradient.from;
		settings._background_hover_color_stop = pct(hoverGradient.fromStop ?? 0);
		settings._background_hover_color_b = hoverGradient.to;
		settings._background_hover_color_b_stop = pct(hoverGradient.toStop ?? 100);
		settings._background_hover_gradient_type = hoverGradient.type ?? 'linear';
		settings._background_hover_gradient_angle = raw(hoverGradient.angle ?? 180, 'deg');
	} else if (hover !== null) {
		settings._background_hover_background = 'classic';
		settings._background_hover_color = hover;
	}

	return settings;
}

/* ------------------------------------------------------------------ *
 * Widgets
 * ------------------------------------------------------------------ */

/**
 * A heading widget.
 *
 * The `title` is passed through `wp_kses_post()` by Elementor, which
 * strips inline styles — an accented phrase is therefore wrapped in a
 * `<span class="…">` and coloured from `custom_css`.
 */
export function heading(spec = {}) {
	const {
		title,
		tag = 'h2',
		color = null,
		hoverColor = null,
		align = null,
		href = null,
		id = null,
		bg = null,
		bgGradient = null,
		bgHover = null,
		bgHoverGradient = null,
		padding = null,
		css = null,
		cssHover = null,
		cssTablet = null,
		cssMobile = null,
		extra = [],
		...type
	} = spec;

	const settings = {
		title,
		header_size: tag,
		...typography('typography', type),
		...widgetBackground({ bg, gradient: bgGradient, hover: bgHover, hoverGradient: bgHoverGradient }),
	};

	if (color !== null) settings.title_color = color;
	if (hoverColor !== null) settings.title_hover_color = hoverColor;
	if (align !== null) settings.align = align;
	if (href) settings.link = link(href);
	if (id) settings._element_id = id;
	if (padding !== null) settings._padding = box(padding);

	const customCss = buildCustomCss({ css, hover: cssHover, tablet: cssTablet, mobile: cssMobile, extra });
	if (customCss) settings.custom_css = customCss;

	return node({ elType: 'widget', widgetType: 'heading', title: spec.editorTitle ?? tag, settings });
}

/**
 * A text-editor widget.
 *
 * Links live inside the HTML — the widget has no link control — and are
 * coloured with `link_color` / `link_hover_color`.
 */
export function text(spec = {}) {
	const {
		html,
		color = null,
		linkColor = null,
		linkHoverColor = null,
		align = null,
		paragraphSpacing = null,
		id = null,
		bg = null,
		bgGradient = null,
		bgHover = null,
		bgHoverGradient = null,
		padding = null,
		css = null,
		cssHover = null,
		cssTablet = null,
		cssMobile = null,
		extra = [],
		...type
	} = spec;

	const settings = {
		editor: html,
		...typography('typography', type),
		...widgetBackground({ bg, gradient: bgGradient, hover: bgHover, hoverGradient: bgHoverGradient }),
	};

	if (color !== null) settings.text_color = color;
	if (linkColor !== null) settings.link_color = linkColor;
	if (linkHoverColor !== null) settings.link_hover_color = linkHoverColor;
	if (align !== null) settings.align = align;
	if (paragraphSpacing !== null) settings.paragraph_spacing = px(paragraphSpacing);
	if (id) settings._element_id = id;
	if (padding !== null) settings._padding = box(padding);

	const customCss = buildCustomCss({ css, hover: cssHover, tablet: cssTablet, mobile: cssMobile, extra });
	if (customCss) settings.custom_css = customCss;

	return node({ elType: 'widget', widgetType: 'text-editor', title: spec.editorTitle ?? 'text', settings });
}

/**
 * A button widget.
 *
 * The CTA padding is the `text_padding` control — it targets
 * `{{WRAPPER}} .elementor-button`, i.e. the anchor itself, not the
 * widget wrapper. `controlSize` only adds the `elementor-size-*` class,
 * whose base padding loses to `text_padding` on specificity. The
 * typography font size travels with the shared `size` option, so the
 * control class has to carry a different name.
 *
 * `css` / `cssHover` are written against the anchor (`.elementor-button`),
 * because that is the box the visitor actually sees: the `selector`
 * keyword resolves to the widget wrapper, which is a plain block around
 * the anchor. A multi-layer shadow cannot use the native control (it
 * holds one layer), so it lands in `extra` as an anchor-level rule too.
 */
export function button(spec = {}) {
	const {
		label,
		href = null,
		blank = false,
		align = null,
		controlSize = 'sm',
		icon = null,
		iconAlign = null,
		iconIndent = null,
		iconColor = null,
		bg = null,
		bgGradient = null,
		bgHover = null,
		bgHoverGradient = null,
		textColor = null,
		textHoverColor = null,
		border = null,
		borderHoverColor = null,
		radius = null,
		padding = null,
		shadow = null,
		shadowHover = null,
		transitionDuration = null,
		id = null,
		css = null,
		cssHover = null,
		cssTablet = null,
		cssMobile = null,
		extra = [],
		...type
	} = spec;

	const settings = {
		text: label,
		size: controlSize,
		...typography('typography', type),
	};

	if (href) settings.link = link(href, { blank });
	if (align !== null) settings.align = align;

	// The button widget carries its own icon slot (`selected_icon`), so a
	// CTA can be an icon + label pair without a wrapper container.
	if (icon !== null) settings.selected_icon = icon;
	if (iconAlign !== null) settings.icon_align = iconAlign;
	if (iconIndent !== null) settings.icon_indent = px(iconIndent);

	if (bgGradient) {
		settings.background_background = 'gradient';
		settings.background_color = bgGradient.from;
		settings.background_color_stop = pct(bgGradient.fromStop ?? 0);
		settings.background_color_b = bgGradient.to;
		settings.background_color_b_stop = pct(bgGradient.toStop ?? 100);
		settings.background_gradient_type = bgGradient.type ?? 'linear';
		settings.background_gradient_angle = raw(bgGradient.angle ?? 90, 'deg');
	} else if (bg !== null) {
		settings.background_background = 'classic';
		settings.background_color = bg;
	}

	if (bgHoverGradient) {
		settings.button_background_hover_background = 'gradient';
		settings.button_background_hover_color = bgHoverGradient.from;
		settings.button_background_hover_color_stop = pct(bgHoverGradient.fromStop ?? 0);
		settings.button_background_hover_color_b = bgHoverGradient.to;
		settings.button_background_hover_color_b_stop = pct(bgHoverGradient.toStop ?? 100);
		settings.button_background_hover_gradient_type = bgHoverGradient.type ?? 'linear';
		settings.button_background_hover_gradient_angle = raw(bgHoverGradient.angle ?? 90, 'deg');
	} else if (bgHover !== null) {
		settings.button_background_hover_background = 'classic';
		settings.button_background_hover_color = bgHover;
	}

	if (textColor !== null) settings.button_text_color = textColor;
	if (textHoverColor !== null) settings.hover_color = textHoverColor;

	if (border) {
		settings.border_border = border.style ?? 'solid';
		settings.border_width = box(border.width ?? 1);
		settings.border_color = border.color;
	}
	if (borderHoverColor !== null) settings.button_hover_border_color = borderHoverColor;

	const rad = box(radius);
	if (rad) settings.border_radius = rad;

	const pad = box(padding);
	if (pad) settings.text_padding = pad;

	const nativeShadow = parseShadow(shadow);
	const nativeShadowHover = parseShadow(shadowHover);
	if (nativeShadow) {
		settings.button_box_shadow_box_shadow_type = 'yes';
		settings.button_box_shadow_box_shadow = nativeShadow;
	}
	if (nativeShadowHover) {
		settings.button_hover_box_shadow_box_shadow_type = 'yes';
		settings.button_hover_box_shadow_box_shadow = nativeShadowHover;
	}

	if (transitionDuration !== null) {
		settings.button_hover_transition_duration = raw(transitionDuration, 's');
	}

	if (id) settings._element_id = id;

	const customCss = buildCustomCss({
		// The anchor is the visible box, so the declarations go there.
		css: css ? `selector .elementor-button { ${decl(css)} }` : '',
		hover: cssHover ? `selector:hover .elementor-button { ${decl(cssHover)} }` : '',
		tablet: cssTablet ? `@media ${MEDIA.tablet} { selector .elementor-button { ${decl(cssTablet)} } }` : '',
		mobile: cssMobile ? `@media ${MEDIA.mobile} { selector .elementor-button { ${decl(cssMobile)} } }` : '',
		extra: [
			...extra,
			// The button widget has no icon-colour control, so a tinted
			// glyph has to be coloured from CSS. The uploaded SVGs use
			// `stroke="currentColor"`, so `color` is enough.
			...(iconColor !== null
				? [`selector .elementor-button-icon svg { color: ${iconColor}; }`]
				: []),
			// Elementor's shadow control holds a single layer, so a
			// two-layer shadow is written here instead.
			...(shadow && !nativeShadow
				? [`selector .elementor-button { box-shadow: ${shadow}; }`]
				: []),
			...(shadowHover && !nativeShadowHover
				? [`selector .elementor-button:hover { box-shadow: ${shadowHover}; }`]
				: []),
		],
	});
	if (customCss) settings.custom_css = customCss;

	return node({ elType: 'widget', widgetType: 'button', title: spec.editorTitle ?? 'button', settings });
}

/**
 * An image widget.
 *
 * The widget has no `alt` control — alt text comes from the attachment
 * metadata, so a library image needs its alt text set in the Media
 * Library. An external URL renders without alt text at all.
 */
export function image(spec = {}) {
	const {
		src,
		size = 'large',
		width = null,
		maxWidth = null,
		height = null,
		opacity = null,
		opacityHover = null,
		brightness = null,
		href = null,
		blank = false,
		id = null,
		css = null,
		cssHover = null,
		cssTablet = null,
		cssMobile = null,
		extra = [],
	} = spec;

	const settings = {
		image: src,
		image_size: size,
	};

	if (width !== null) settings.width = pct(width);
	// `space` is the widget's "Max Width" control — it targets the `<img>`.
	if (maxWidth !== null) settings.space = px(maxWidth);
	if (height !== null) settings.height = pct(height);
	if (opacity !== null) settings.opacity = raw(opacity, 'px');
	if (opacityHover !== null) settings.opacity_hover = raw(opacityHover, 'px');
	if (brightness !== null) {
		settings.css_filters_css_filter = 'yes';
		settings.css_filters_brightness = raw(brightness, 'px');
	}
	if (href) {
		settings.link_to = 'custom';
		settings.link = link(href, { blank });
	}
	if (id) settings._element_id = id;

	const customCss = buildCustomCss({ css, hover: cssHover, tablet: cssTablet, mobile: cssMobile, extra });
	if (customCss) settings.custom_css = customCss;

	return node({ elType: 'widget', widgetType: 'image', title: spec.editorTitle ?? 'image', settings });
}

/**
 * An icon widget (an uploaded SVG glyph).
 *
 * The icon widget has no background group, so a coloured tile around the
 * glyph is written to `custom_css`.
 *
 * The glyph colour is *also* written to CSS rather than to the widget's
 * `primary_color` control: that control emits `fill` on the `<svg>` itself
 * (`{{WRAPPER}}.elementor-view-default .elementor-icon svg { fill: … }`),
 * and a CSS declaration beats the SVG's own `fill="none"` attribute — the
 * stroke-only glyphs would render as solid blobs. A CSS `color` is enough
 * for `stroke="currentColor"`.
 */
export function icon(spec = {}) {
	const {
		src,
		size = null,
		color = null,
		id = null,
		css = null,
		cssHover = null,
		cssTablet = null,
		cssMobile = null,
		extra = [],
	} = spec;

	const settings = {
		selected_icon: src,
		view: 'default',
	};

	if (size !== null) settings.size = px(size);
	if (id) settings._element_id = id;

	const customCss = buildCustomCss({
		css,
		hover: cssHover,
		tablet: cssTablet,
		mobile: cssMobile,
		extra: [
			...extra,
			...(color !== null
				? [`selector .elementor-icon svg { color: ${color}; }`]
				: []),
		],
	});
	if (customCss) settings.custom_css = customCss;

	return node({ elType: 'widget', widgetType: 'icon', title: spec.editorTitle ?? 'icon', settings });
}

/**
 * An icon-box widget (a glyph with a title and a description).
 */
export function iconBox(spec = {}) {
	const {
		src,
		title,
		description = null,
		href = null,
		titleSize = 'h4',
		iconColor = null,
		iconHoverColor = null,
		iconSize = null,
		iconPadding = null,
		titleColor = null,
		titleHoverColor = null,
		descriptionColor = null,
		bg = null,
		border = null,
		radius = null,
		shadow = null,
		padding = null,
		align = null,
		iconSpace = null,
		titleBottomSpace = null,
		id = null,
		css = null,
		cssHover = null,
		cssTablet = null,
		cssMobile = null,
		extra = [],
		titleType = {},
		descriptionType = {},
	} = spec;

	const settings = {
		selected_icon: src,
		view: 'default',
		title_text: title,
		title_size: titleSize,
		...typography('title_typography', titleType),
	};

	if (description !== null) {
		settings.description_text = description;
		Object.assign(settings, typography('description_typography', descriptionType));
	}
	if (href) settings.link = link(href);
	if (iconColor !== null) settings.primary_color = iconColor;
	if (iconHoverColor !== null) settings.hover_primary_color = iconHoverColor;
	if (iconSize !== null) settings.icon_size = px(iconSize);
	if (iconPadding !== null) settings.icon_padding = px(iconPadding);
	if (titleColor !== null) settings.title_color = titleColor;
	if (titleHoverColor !== null) settings.hover_title_color = titleHoverColor;
	if (descriptionColor !== null) settings.description_color = descriptionColor;
	if (bg !== null) settings._background_color = bg;
	if (align !== null) settings.text_align = align;
	if (iconSpace !== null) settings.icon_space = px(iconSpace);
	if (titleBottomSpace !== null) settings.title_bottom_space = px(titleBottomSpace);

	if (border) {
		settings._border_border = border.style ?? 'solid';
		settings._border_width = box(border.width ?? 1);
		settings._border_color = border.color;
	}
	const rad = box(radius);
	if (rad) settings._border_radius = rad;
	const pad = box(padding);
	if (pad) settings._padding = pad;

	const nativeShadow = parseShadow(shadow);
	if (nativeShadow) {
		settings._box_shadow_box_shadow_type = 'yes';
		settings._box_shadow_box_shadow = nativeShadow;
	}

	if (id) settings._element_id = id;

	const customCss = buildCustomCss({
		css: decl(css, shadow && !nativeShadow ? `box-shadow: ${shadow}` : null),
		hover: cssHover,
		tablet: cssTablet,
		mobile: cssMobile,
		extra,
	});
	if (customCss) settings.custom_css = customCss;

	return node({ elType: 'widget', widgetType: 'icon-box', title: spec.editorTitle ?? 'icon-box', settings });
}

// Classic nested-tabs enumerates the axis, not the visual direction, and
// the horizontal justification is start/center/end/stretch.
const TAB_DIRECTIONS = ['block-start', 'block-end', 'inline-start', 'inline-end'];
const TAB_JUSTIFY = ['start', 'center', 'end', 'stretch'];

/**
 * A nested-tabs widget.
 *
 * Each tab panel is a container child of the widget; the `tabs` repeater
 * links a tab title to the id of its panel.
 */
export function tabs(spec = {}) {
	const {
		tabs: tabList = [],
		direction = 'block-start',
		justify = 'center',
		titleGap = null,
		titleSpacing = null,
		titlePadding = null,
		titleRadius = null,
		titleBg = null,
		titleBgHover = null,
		titleBgActive = null,
		titleBorder = null,
		titleBorderHover = null,
		titleBorderActive = null,
		titleShadow = null,
		titleShadowActive = null,
		titleColor = null,
		titleColorHover = null,
		titleColorActive = null,
		iconSize = null,
		iconSpacing = null,
		iconColor = null,
		boxPadding = null,
		boxRadius = null,
		boxBg = null,
		boxBorder = null,
		boxShadow = null,
		id = null,
		css = null,
		cssTablet = null,
		cssMobile = null,
		extra = [],
		children = [],
	} = spec;

	const settings = {
		tabs: tabList.map((tab) => ({
			tab_title: tab.title,
			...(tab.icon ? { tab_icon: tab.icon } : {}),
			element_id: tab.elementId,
		})),
		// Classic nested-tabs enumerates the axis, not the visual direction.
		tabs_direction: TAB_DIRECTIONS.includes(direction) ? direction : 'block-start',
		tabs_justify_horizontal: TAB_JUSTIFY.includes(justify) ? justify : 'center',
	};

	if (titleGap !== null) settings.tabs_title_space_between = px(titleGap);
	if (titleSpacing !== null) settings.tabs_title_spacing = px(titleSpacing);
	if (titlePadding !== null) settings.padding = box(titlePadding);
	const titleRad = box(titleRadius);
	if (titleRad) settings.tabs_title_border_radius = titleRad;

	if (titleBg !== null) {
		settings.tabs_title_background_color_background = 'classic';
		settings.tabs_title_background_color_color = titleBg;
	}
	if (titleBgHover !== null) {
		settings.tabs_title_background_color_hover_background = 'classic';
		settings.tabs_title_background_color_hover_color = titleBgHover;
	}
	if (titleBgActive !== null) {
		settings.tabs_title_background_color_active_background = 'classic';
		settings.tabs_title_background_color_active_color = titleBgActive;
	}

	if (titleBorder) {
		settings.tabs_title_border_border = titleBorder.style ?? 'solid';
		settings.tabs_title_border_width = box(titleBorder.width ?? 1);
		settings.tabs_title_border_color = titleBorder.color;
	}
	if (titleBorderHover) {
		settings.tabs_title_border_hover_border = titleBorderHover.style ?? 'solid';
		settings.tabs_title_border_hover_width = box(titleBorderHover.width ?? 1);
		settings.tabs_title_border_hover_color = titleBorderHover.color;
	}
	if (titleBorderActive) {
		settings.tabs_title_border_active_border = titleBorderActive.style ?? 'solid';
		settings.tabs_title_border_active_width = box(titleBorderActive.width ?? 1);
		settings.tabs_title_border_active_color = titleBorderActive.color;
	}

	const nativeTitleShadow = parseShadow(titleShadow);
	const nativeTitleShadowActive = parseShadow(titleShadowActive);
	if (nativeTitleShadow) {
		settings.tabs_title_box_shadow_box_shadow_type = 'yes';
		settings.tabs_title_box_shadow_box_shadow = nativeTitleShadow;
	}
	if (nativeTitleShadowActive) {
		settings.tabs_title_box_shadow_active_box_shadow_type = 'yes';
		settings.tabs_title_box_shadow_active_box_shadow = nativeTitleShadowActive;
	}

	if (titleColor !== null) settings.title_text_color = titleColor;
	if (titleColorHover !== null) settings.title_text_color_hover = titleColorHover;
	if (titleColorActive !== null) settings.title_text_color_active = titleColorActive;

	if (iconSize !== null) settings.icon_size = px(iconSize);
	if (iconSpacing !== null) settings.icon_spacing = px(iconSpacing);
	if (iconColor !== null) settings.icon_color = iconColor;

	const boxPad = box(boxPadding);
	if (boxPad) settings.box_padding = boxPad;
	const boxRad = box(boxRadius);
	if (boxRad) settings.box_border_radius = boxRad;
	if (boxBg !== null) {
		settings.box_background_color_background = 'classic';
		settings.box_background_color_color = boxBg;
	}
	if (boxBorder) {
		settings.box_border_border = boxBorder.style ?? 'solid';
		settings.box_border_width = box(boxBorder.width ?? 1);
		settings.box_border_color = boxBorder.color;
	}
	const nativeBoxShadow = parseShadow(boxShadow);
	if (nativeBoxShadow) {
		settings.box_shadow_box_shadow_type = 'yes';
		settings.box_shadow_box_shadow = nativeBoxShadow;
	}

	if (id) settings._element_id = id;

	const customCss = buildCustomCss({
		css: decl(css, titleShadow && !nativeTitleShadow ? `box-shadow: ${titleShadow}` : null),
		tablet: cssTablet,
		mobile: cssMobile,
		extra,
	});
	if (customCss) settings.custom_css = customCss;

	return node({
		elType: 'widget',
		widgetType: 'nested-tabs',
		title: spec.editorTitle ?? 'tabs',
		settings,
		children,
	});
}

/**
 * A form widget.
 *
 * Elementor's form is a single widget: the fields live in the
 * `form_fields` repeater, not in separate child widgets.
 */
export function form(spec = {}) {
	const {
		name,
		fields = [],
		showLabels = true,
		markRequired = true,
		buttonText = 'Send',
		buttonWidth = '100',
		submitActions = ['email'],
		emailTo = null,
		emailSubject = null,
		emailContent = null,
		emailContentType = null,
		emailFrom = null,
		emailFromName = null,
		emailReplyTo = null,
		successMessage = null,
		errorMessage = null,
		columnGap = null,
		rowGap = null,
		labelColor = null,
		labelType = {},
		fieldColor = null,
		fieldBg = null,
		fieldBorderColor = null,
		fieldBorderWidth = null,
		fieldRadius = null,
		fieldType = {},
		buttonBg = null,
		buttonTextColor = null,
		buttonBorderColor = null,
		buttonBorderWidth = null,
		buttonRadius = null,
		buttonPadding = null,
		buttonType = {},
		id = null,
		css = null,
		cssTablet = null,
		cssMobile = null,
		extra = [],
	} = spec;

	const settings = {
		form_name: name,
		form_fields: fields.map((field) => ({
			custom_id: field.id,
			field_type: field.type ?? 'text',
			...(field.label ? { field_label: field.label } : {}),
			...(field.placeholder ? { placeholder: field.placeholder } : {}),
			width: field.width ?? '100',
			...(field.required ? { required: 'true' } : {}),
		})),
		show_labels: showLabels ? 'yes' : '',
		mark_required: markRequired ? 'yes' : '',
		button_text: buttonText,
		button_width: buttonWidth,
		submit_actions: submitActions,
	};

	if (emailTo !== null) settings.email_to = emailTo;
	if (emailSubject !== null) settings.email_subject = emailSubject;
	if (emailContent !== null) settings.email_content = emailContent;
	if (emailContentType !== null) settings.email_content_type = emailContentType;
	if (emailFrom !== null) settings.email_from = emailFrom;
	if (emailFromName !== null) settings.email_from_name = emailFromName;
	if (emailReplyTo !== null) settings.email_reply_to = emailReplyTo;

	if (successMessage !== null || errorMessage !== null) {
		settings.custom_messages = 'yes';
	}
	if (successMessage !== null) settings.success_message = successMessage;
	if (errorMessage !== null) settings.error_message = errorMessage;

	if (columnGap !== null) settings.column_gap = px(columnGap);
	if (rowGap !== null) settings.row_gap = px(rowGap);

	if (labelColor !== null) settings.label_color = labelColor;
	Object.assign(settings, typography('label_typography', labelType));

	if (fieldColor !== null) settings.field_text_color = fieldColor;
	if (fieldBg !== null) settings.field_background_color = fieldBg;
	if (fieldBorderColor !== null) settings.field_border_color = fieldBorderColor;
	if (fieldBorderWidth !== null) settings.field_border_width = box(fieldBorderWidth);
	const fieldRad = box(fieldRadius);
	if (fieldRad) settings.field_border_radius = fieldRad;
	Object.assign(settings, typography('field_typography', fieldType));

	if (buttonBg !== null) settings.button_background_color = buttonBg;
	if (buttonTextColor !== null) settings.button_text_color = buttonTextColor;
	if (buttonBorderColor !== null) settings.button_border_color = buttonBorderColor;
	if (buttonBorderWidth !== null) settings.button_border_width = box(buttonBorderWidth);
	const buttonRad = box(buttonRadius);
	if (buttonRad) settings.button_border_radius = buttonRad;
	const buttonPad = box(buttonPadding);
	if (buttonPad) settings.button_text_padding = buttonPad;
	Object.assign(settings, typography('button_typography', buttonType));

	if (id) settings._element_id = id;

	const customCss = buildCustomCss({ css, tablet: cssTablet, mobile: cssMobile, extra });
	if (customCss) settings.custom_css = customCss;

	return node({ elType: 'widget', widgetType: 'form', title: spec.editorTitle ?? 'form', settings });
}

/* ------------------------------------------------------------------ *
 * Document
 * ------------------------------------------------------------------ */

/**
 * Wrap the compiled nodes in a classic Elementor template document.
 */
export function compileDocument(title, nodes) {
	return {
		version: '0.4',
		title,
		type: 'page',
		content: nodes.filter(Boolean),
		page_settings: [],
	};
}
