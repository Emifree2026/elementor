/**
 * Atomic (V4) section builders for the three product pages.
 *
 * ── The tree grammar ────────────────────────────────────────────────────────
 *
 *   L1  section band          one per section, full-bleed background
 *   L2  row                   the section's content row
 *   L3  card / column         contains widgets only
 *   L4  E1 inline group       the ONE permitted fourth level (thumb strip,
 *                              swipe hint). See specs/constraints.md §3.1.
 *
 * The horizontal container is NOT a level. A section band centres its own
 * content with
 *
 *   padding: <v> max(32px, calc((100% - 1280px) / 2));
 *
 * so the band's content box IS the 1280 px container the PHP used
 * (`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`). Everything inside it lines up
 * without a wrapper element — which is what keeps the tree at three levels.
 *
 * ── DOM ids ────────────────────────────────────────────────────────────────
 *
 * Every element the JavaScript needs carries a fixed `_cssid`, because the
 * atomic editor drops `data-*` attributes. The ids are the SAME on all six
 * product pages: each page is a separate document, so the ids never collide,
 * and `assets/js/product-page.js` can be a single file with no per-page
 * configuration.
 *
 * @module product-sections
 */

import { el, flex, heading, para, button, image, link } from './atomic.mjs';

/* ------------------------------------------------------------------ *
 * Palette — the resolved values from tokens.mjs
 * ------------------------------------------------------------------ */

const C = {
	white: '#FFFFFF',
	slate50: '#F8FAFC',
	slate100: '#F1F5F9',
	slate200: '#E2E8F0',
	slate400: '#94A3B8',
	slate500: '#64748B',
	slate600: '#475569',
	slate700: '#334155',
	zinc900: '#18181B',
	blue100: '#DBEAFE',
	blue300: '#93C5FD',
	blue600: '#2563EB',
	blue700: '#1D4ED8',
	blue800: '#1E40AF',
};

/* Media Library SVG attachment ids (see elementor/list-assets, type=svg). */
const ICON = {
	arrowRight: 81,
	download: 115,
};

/**
 * The NAMED inline groups — exception E1 in specs/constraints.md §3.1.
 *
 * These are the only containers allowed to sit one level deeper than the
 * depth-3 rule. Each is an `e-flexbox` whose children are widgets only.
 * The names are the BASE configuration-id; the builder appends a numeric
 * suffix, so `collectE1()` resolves them to their generated ids.
 */
export const E1_GROUP_NAMES = ['emifree-thumb-strip'];

/* ------------------------------------------------------------------ *
 * Shared style fragments
 * ------------------------------------------------------------------ */

/**
 * A full-bleed section band whose content box is the 1280 px container.
 *
 * @param {object} [opts]
 * @param {string} [opts.bg]            background colour
 * @param {string} [opts.borderTop]     top border colour
 * @param {string} [opts.borderBottom]  bottom border colour
 * @param {number} [opts.padTop]        desktop block padding, top
 * @param {number} [opts.padBottom]     desktop block padding, bottom
 * @param {number} [opts.padTopMobile]  mobile block padding, top
 * @param {number} [opts.padBottomMobile] mobile block padding, bottom
 * @returns {string} plain CSS
 */
function band(opts = {}) {
	const {
		bg = null,
		borderTop = null,
		borderBottom = null,
		padTop = 80,
		padBottom = 80,
		padTopMobile = 64,
		padBottomMobile = 64,
	} = opts;
	return [
		'display: flex;',
		'flex-direction: column;',
		`padding: ${padTop}px max(32px, calc((100% - 1280px) / 2)) ${padBottom}px;`,
		// The navigator links to these bands by id, and the sticky header
		// is 64 px tall — scroll-mt-20 in the PHP version.
		'scroll-margin-top: 80px;',
		bg ? `background-color: ${bg};` : '',
		borderTop ? `border-top: 1px solid ${borderTop};` : '',
		borderBottom ? `border-bottom: 1px solid ${borderBottom};` : '',
		'@media(--tablet) {',
		`  padding: ${padTop}px max(24px, calc((100% - 1280px) / 2)) ${padBottom}px;`,
		'}',
		'@media(--mobile) {',
		`  padding: ${padTopMobile}px 16px ${padBottomMobile}px;`,
		'}',
	].filter(Boolean).join('\n');
}

/** Section heading — `text-3xl md:text-4xl font-bold text-zinc-900`. */
const H2 = [
	'font-size: 36px;',
	'font-weight: 700;',
	`color: ${C.zinc900};`,
	'line-height: 1.2;',
	'margin: 0 0 16px;',
	'@media(--mobile) {',
	'  font-size: 30px;',
	'}',
].join('\n');

/** Section lead paragraph — `text-lg text-slate-600 max-w-3xl`. */
const LEAD = [
	'font-size: 18px;',
	`color: ${C.slate600};`,
	'line-height: 1.625;',
	'max-width: 768px;',
	'align-self: flex-start;',
	'margin: 0 0 32px;',
].join('\n');

/** Small pill button (the brochure "Download PDF" link). */
const LINK_BUTTON = [
	'align-self: flex-start;',
	'background-color: transparent;',
	`color: ${C.blue700};`,
	'font-weight: 600;',
	'font-size: 14px;',
	'padding: 0;',
	'border-radius: 0;',
	'&:hover {',
	`  color: ${C.blue800};`,
	'}',
].join('\n');

/**
 * Build an inline icon widget.
 * @param {number} attachmentId Media Library SVG id
 * @param {object} [opts]
 * @param {number} [opts.size]    square size in px
 * @param {string} [opts.color]   currentColor for the stroke
 * @param {string} [opts.transform] extra transform, e.g. rotate(180deg)
 * @param {string} [opts.id]      configuration id
 * @returns {object} El
 */
function icon(attachmentId, opts = {}) {
	const { size = 16, color = C.blue700, transform = '', id } = opts;
	return el('e-svg', {
		id,
		props: { svg: { id: attachmentId } },
		style: [
			`width: ${size}px;`,
			`height: ${size}px;`,
			`color: ${color};`,
			'flex-shrink: 0;',
			transform ? `transform: ${transform};` : '',
		]
			.filter(Boolean)
			.join('\n'),
	});
}

/* ------------------------------------------------------------------ *
 * Section builders
 * ------------------------------------------------------------------ */

/**
 * The hero band: back link, breadcrumb, gallery + copy.
 *
 * @param {object} product  entry from product-content.mjs / product-content-de.mjs
 * @param {object} media    media-manifest.json `media` map
 * @returns {object[]} root elements
 */
export function buildHero(product, media) {
	const h = product.hero;
	const gallery = h.gallery || [];

	const backLink = flex({
		id: 'emifree-hero-back',
		style: [
			'display: flex;',
			'flex-direction: row;',
			'align-items: center;',
			'gap: 8px;',
			'margin: 0 0 24px;',
		].join('\n'),
		children: [
			icon(ICON.arrowRight, { transform: 'rotate(180deg)', id: 'emifree-hero-back-icon' }),
			para({
				id: 'emifree-hero-back-text',
				text: product.backLabel || 'Back to home',
				props: { link: link(h.backLink) },
				style: `font-weight: 500;\ncolor: ${C.blue700};`,
			}),
		],
	});

	const crumbs = [];
	h.breadcrumb.forEach((crumb, i) => {
		if (i > 0) {
			crumbs.push(
				para({
					id: `emifree-crumb-sep-${i}`,
					text: '/',
					style: `color: ${C.slate400};\nfont-size: 14px;`,
				})
			);
		}
		crumbs.push(
			para({
				id: `emifree-crumb-${i}`,
				text: crumb.text,
				props: crumb.href ? { link: link(crumb.href) } : {},
				style: crumb.href
					? `font-size: 14px;\ncolor: ${C.slate500};`
					: `font-size: 14px;\ncolor: ${C.slate700};`,
			})
		);
	});

	const breadcrumb = flex({
		id: 'emifree-hero-breadcrumb',
		style: [
			'display: flex;',
			'flex-direction: row;',
			'flex-wrap: wrap;',
			'align-items: center;',
			'gap: 4px;',
			'margin: 0 0 32px;',
		].join('\n'),
		children: crumbs,
	});

	/* --- left column: logo + gallery ------------------------------- */

	const mediaChildren = [];

	if (h.logo) {
		mediaChildren.push(
			image({
				id: 'emifree-hero-logo',
				mediaId: media[h.logo].id,
				size: 'full',
				style: [
					'width: 224px;',
					'height: auto;',
					'margin: 0 0 24px;',
					'@media(--mobile) {',
					'  width: 192px;',
					'}',
				].join('\n'),
			})
		);
	}

	mediaChildren.push(
		image({
			id: 'emifree-gallery-main',
			cssid: 'emifree-gallery-main',
			mediaId: media[gallery[0]].id,
			size: 'full',
			style: [
				'width: 100%;',
				'aspect-ratio: 4 / 3;',
				'object-fit: contain;',
				`background-color: ${C.slate100};`,
				`border: 1px solid ${C.slate200};`,
				'border-radius: 16px 16px 0 0;',
				'padding: 24px;',
				'transition: opacity 300ms ease;',
			].join('\n'),
		})
	);

	/* E1-d — the gallery thumb strip (one inline group, the only L4).
	 *
	 * The thumbs are bare <img> widgets, NOT <button> wrappers: an
	 * atomic image with a link renders the link tag AROUND the image,
	 * and Elementor gives that wrapper the `e-default-button` style
	 * (blue pill, 16/32px padding) — which the editor cannot restyle,
	 * so the theme would have to fight it from outside. Keeping the
	 * <img> bare leaves every visual rule in the atomic document and
	 * lets product-page.js add the button semantics at runtime.
	 */
	const thumbs = gallery.map((key, i) =>
		image({
			id: `emifree-thumb-${i + 1}`,
			cssid: `emifree-thumb-${i + 1}`,
			mediaId: media[key].id,
			size: 'full',
			style: [
				'width: 100%;',
				'flex: 1 1 0;',
				'aspect-ratio: 4 / 3;',
				'object-fit: contain;',
				`background-color: ${C.white};`,
				`border: 2px solid ${C.slate200};`,
				'border-radius: 8px;',
				'padding: 8px;',
				'cursor: pointer;',
				'&:hover {',
				`  border-color: ${C.blue300};`,
				'}',
			].join('\n'),
		})
	);

	mediaChildren.push(
		flex({
			id: 'emifree-thumb-strip',
			style: [
				'display: flex;',
				'flex-direction: row;',
				'flex-wrap: wrap;',
				'align-items: center;',
				'gap: 8px;',
				'padding: 8px;',
				`background-color: ${C.slate50};`,
				`border-top: 1px solid ${C.slate200};`,
				'border-radius: 0 0 16px 16px;',
			].join('\n'),
			children: thumbs,
		})
	);

	const mediaColumn = flex({
		id: 'emifree-hero-media',
		style: [
			'display: flex;',
			'flex-direction: column;',
			'gap: 0;',
			'flex: 1 1 0;',
			'min-width: 0;',
		].join('\n'),
		children: mediaChildren,
	});

	/* --- right column: eyebrow, h1, CTA, intro --------------------- */

	const copyChildren = [
		para({
			id: 'emifree-hero-eyebrow',
			text: h.eyebrow,
			style: [
				'font-size: 14px;',
				'font-weight: 600;',
				'text-transform: uppercase;',
				'letter-spacing: 0.05em;',
				`color: ${C.blue700};`,
				'margin: 0 0 12px;',
			].join('\n'),
		}),
		heading({
			id: 'emifree-hero-title',
			tag: 'h1',
			text: h.h1,
			style: [
				'font-size: 48px;',
				'font-weight: 700;',
				`color: ${C.zinc900};`,
				'line-height: 1.25;',
				'margin: 0 0 20px;',
				'@media(--mobile) {',
				'  font-size: 36px;',
				'}',
			].join('\n'),
		}),
		button({
			id: 'emifree-hero-cta',
			text: h.cta.text,
			href: h.cta.href,
			style: [
				'align-self: flex-start;',
				`background-color: ${C.blue700};`,
				`color: ${C.white};`,
				'font-weight: 600;',
				'font-size: 16px;',
				'padding: 12px 24px;',
				'border-radius: 9999px;',
				'box-shadow: 0px 4px 6px -1px rgba(0,0,0,0.1), 0px 2px 4px -2px rgba(0,0,0,0.1);',
				'&:hover {',
				`  background-color: ${C.blue800};`,
				'  box-shadow: 0px 10px 15px -3px rgba(0,0,0,0.1), 0px 4px 6px -4px rgba(0,0,0,0.1);',
				'}',
			].join('\n'),
		}),
	];

	if (h.intro) {
		copyChildren.push(
			para({
				id: 'emifree-hero-intro',
				text: h.intro,
				style: [
					'font-size: 20px;',
					`color: ${C.slate600};`,
					'line-height: 1.625;',
					'margin: 24px 0 0;',
					'@media(--mobile) {',
					'  font-size: 18px;',
					'}',
				].join('\n'),
			})
		);
	}

	(h.introList || []).forEach((item, i) => {
		copyChildren.push(
			para({
				id: `emifree-hero-intro-${i}`,
				text: `<strong>${item[0]}:</strong> ${item[1]}`,
				style: [
					'font-size: 18px;',
					`color: ${C.slate600};`,
					'line-height: 1.625;',
					'margin: 0 0 12px;',
					'@media(--mobile) {',
					'  font-size: 16px;',
					'}',
				].join('\n'),
			})
		);
	});

	const copyColumn = flex({
		id: 'emifree-hero-copy',
		style: [
			'display: flex;',
			'flex-direction: column;',
			'gap: 0;',
			'flex: 1 1 0;',
			'min-width: 0;',
		].join('\n'),
		children: copyChildren,
	});

	const grid = flex({
		id: 'emifree-hero-grid',
		style: [
			'display: flex;',
			'flex-direction: row;',
			'align-items: center;',
			'gap: 64px;',
			'@media(--tablet) {',
			'  gap: 40px;',
			'}',
			'@media(--mobile) {',
			'  flex-direction: column;',
			'  align-items: stretch;',
			'  gap: 32px;',
			'}',
		].join('\n'),
		children: [mediaColumn, copyColumn],
	});

	return [
		flex({
			id: 'emifree-section-hero',
			cssid: 'emifree-hero',
			style: band({
				bg: C.slate50,
				borderBottom: C.slate200,
				padTop: 80,
				padBottom: 48,
				padTopMobile: 48,
				padBottomMobile: 32,
			}),
			children: [backLink, breadcrumb, grid],
		}),
	];
}

/**
 * The dimensions section: a 2-up grid of technical drawings.
 *
 * @param {object} product
 * @param {object} media
 * @returns {object[]} root elements
 */
export function buildDimensions(product, media) {
	const d = product.dimensions;
	if (!d) return [];

	const cards = d.images.map((key) =>
		flex({
			id: 'emifree-dimension-card',
			style: [
				'display: flex;',
				'flex-direction: column;',
				'align-items: center;',
				'justify-content: center;',
				'flex: 1 1 calc(50% - 12px);',
				'min-height: 280px;',
				`background-color: ${C.slate50};`,
				`border: 1px solid ${C.slate200};`,
				'border-radius: 16px;',
				'padding: 24px;',
				'@media(--mobile) {',
				'  flex: 1 1 100%;',
				'}',
			].join('\n'),
			children: [
				image({
					id: 'emifree-dimension-image',
					mediaId: media[key].id,
					size: 'full',
					style: [
						'width: 100%;',
						'max-height: 420px;',
						'object-fit: contain;',
					].join('\n'),
				}),
			],
		})
	);

	return [
		flex({
			id: 'emifree-section-dimensions',
			cssid: 'emifree-dimensions',
			style: band({ padTop: 80, padBottom: 80 }),
			children: [
				heading({ id: 'emifree-dimensions-title', tag: 'h2', text: d.heading, style: H2 }),
				para({ id: 'emifree-dimensions-lead', text: d.lead, style: LEAD }),
				flex({
					id: 'emifree-dimensions-grid',
					style: [
						'display: flex;',
						'flex-direction: row;',
						'flex-wrap: wrap;',
						'gap: 24px;',
					].join('\n'),
					children: cards,
				}),
			],
		}),
	];
}

/**
 * The performance section: 2-up cards with a caption under each curve.
 *
 * @param {object} product
 * @param {object} media
 * @returns {object[]} root elements
 */
export function buildPerformance(product, media) {
	const p = product.performance;
	if (!p) return [];

	const cards = p.figures.map((figure) =>
		flex({
			id: 'emifree-performance-card',
			style: [
				'display: flex;',
				'flex-direction: column;',
				'align-items: center;',
				'justify-content: center;',
				'flex: 1 1 calc(50% - 12px);',
				'min-height: 280px;',
				`background-color: ${C.white};`,
				`border: 1px solid ${C.slate200};`,
				'border-radius: 16px;',
				'padding: 24px;',
				'box-shadow: 0px 1px 3px rgba(0,0,0,0.1);',
				'@media(--mobile) {',
				'  flex: 1 1 100%;',
				'}',
			].join('\n'),
			children: [
				image({
					id: 'emifree-performance-image',
					mediaId: media[figure.media].id,
					size: 'full',
					style: [
						'width: 100%;',
						'max-height: 420px;',
						'object-fit: contain;',
					].join('\n'),
				}),
				figure.caption
					? para({
							id: 'emifree-performance-caption',
							text: figure.caption,
							style: [
								'margin: 16px 0 0;',
								'font-size: 14px;',
								'font-weight: 600;',
								`color: ${C.zinc900};`,
							].join('\n'),
						})
					: null,
			].filter(Boolean),
		})
	);

	return [
		flex({
			id: 'emifree-section-performance',
			cssid: 'emifree-performance',
			style: band({ bg: C.slate50, padTop: 80, padBottom: 80 }),
			children: [
				heading({ id: 'emifree-performance-title', tag: 'h2', text: p.heading, style: H2 }),
				para({ id: 'emifree-performance-lead', text: p.lead, style: LEAD }),
				flex({
					id: 'emifree-performance-grid',
					style: [
						'display: flex;',
						'flex-direction: row;',
						'flex-wrap: wrap;',
						'gap: 24px;',
					].join('\n'),
					children: cards,
				}),
			],
		}),
	];
}

/**
 * The specs section: the PHP table rebuilt as a grid of editable cells.
 *
 * Elementor has no table widget, so the table becomes a stack of rows; each
 * row is an L3 flex row and each cell an `e-paragraph`. A non-coder edits a
 * cell exactly the way they edit any other paragraph.
 *
 * @param {object} product
 * @param {object} media
 * @returns {object[]} root elements
 */
export function buildSpecs(product, media) {
	const s = product.specs;
	if (!s) return [];

	const cellStyle = (isHeader, isLabel) => {
		const lines = [];
		lines.push('flex: 1 1 0;');
		lines.push('min-width: 0;');
		if (isHeader) {
			lines.push('padding: 16px 24px;');
			lines.push('font-weight: 600;');
			lines.push(`color: ${C.white};`);
		} else {
			lines.push('padding: 12px 24px;');
			lines.push('font-size: 14px;');
			lines.push(`color: ${isLabel ? C.zinc900 : C.slate700};`);
			if (isLabel) lines.push('font-weight: 500;');
		}
		lines.push('@media(--mobile) {');
		lines.push('  padding-left: 16px;');
		lines.push('  padding-right: 16px;');
		lines.push('}');
		return lines.join('\n');
	};

	const makeRow = (cells, isHeader, rowId) =>
		flex({
			id: rowId,
			style: [
				'display: flex;',
				'flex-direction: row;',
				'align-items: flex-start;',
				'min-width: 640px;',
				isHeader
					? `background-color: ${C.blue600};`
					: `border-bottom: 1px solid ${C.slate200};`,
			].join('\n'),
			children: cells.map((text, i) =>
				para({
					id: `${rowId}-cell-${i}`,
					text,
					style: cellStyle(isHeader, i === 0),
				})
			),
		});

	const rows = [makeRow(s.headers, true, 'emifree-spec-header')];
	s.rows.forEach((row, i) => {
		rows.push(makeRow(row, false, `emifree-spec-row-${i}`));
	});

	const swipeHint = flex({
		id: 'emifree-specs-swipe',
		style: [
			'display: none;',
			'flex-direction: row;',
			'align-items: center;',
			'gap: 6px;',
			'margin: 0 0 12px;',
			'@media(--mobile) {',
			'  display: flex;',
			'}',
		].join('\n'),
		children: [
			icon(ICON.arrowRight, { color: C.slate500, id: 'emifree-specs-swipe-icon' }),
			para({
				id: 'emifree-specs-swipe-text',
				text: s.swipeHint || 'Swipe to see all columns',
				style: `font-size: 14px;\ncolor: ${C.slate500};`,
			}),
		],
	});

	return [
		flex({
			id: 'emifree-section-specs',
			cssid: 'emifree-specs',
			style: band({ bg: C.slate50, padTop: 80, padBottom: 80 }),
			children: [
				heading({ id: 'emifree-specs-title', tag: 'h2', text: s.heading, style: H2 }),
				para({ id: 'emifree-specs-lead', text: s.lead, style: LEAD }),
				swipeHint,
				flex({
					id: 'emifree-specs-table',
					style: [
						'display: flex;',
						'flex-direction: column;',
						'overflow-x: auto;',
						`background-color: ${C.white};`,
						`border: 1px solid ${C.slate200};`,
						'border-radius: 16px;',
						'box-shadow: 0px 1px 3px rgba(0,0,0,0.1);',
					].join('\n'),
					children: rows,
				}),
			],
		}),
	];
}

/**
 * The brochure section: a single download card.
 *
 * @param {object} product
 * @param {object} media
 * @returns {object[]} root elements
 */
export function buildBrochure(product, media) {
	const b = product.brochure;
	if (!b) return [];

	const card = flex({
		id: 'emifree-brochure-card',
		style: [
			'display: flex;',
			'flex-direction: row;',
			'align-items: flex-start;',
			'gap: 20px;',
			'align-self: flex-start;',
			'max-width: 576px;',
			`background-color: ${C.white};`,
			`border: 1px solid ${C.slate100};`,
			'border-radius: 16px;',
			'padding: 24px;',
			'box-shadow: 0px 1px 3px rgba(0,0,0,0.1);',
			'&:hover {',
			`  border-color: ${C.blue200 || '#BFDBFE'};`,
			'  box-shadow: 0px 10px 15px -3px rgba(0,0,0,0.1), 0px 4px 6px -4px rgba(0,0,0,0.1);',
			'}',
			'@media(--mobile) {',
			'  max-width: 100%;',
			'}',
		].join('\n'),
		children: [
			flex({
				id: 'emifree-brochure-icon',
				style: [
					'display: flex;',
					'flex-direction: column;',
					'align-items: center;',
					'justify-content: center;',
					'width: 56px;',
					'height: 56px;',
					`background-color: ${C.blue100};`,
					'border-radius: 12px;',
					'flex-shrink: 0;',
				].join('\n'),
				children: [
					icon(ICON.download, { size: 28, color: C.blue700, id: 'emifree-brochure-icon-svg' }),
				],
			}),
			flex({
				id: 'emifree-brochure-body',
				style: [
					'display: flex;',
					'flex-direction: column;',
					'gap: 4px;',
					'flex: 1 1 0;',
					'min-width: 0;',
				].join('\n'),
				children: [
					heading({
						id: 'emifree-brochure-title',
						tag: 'h3',
						text: b.cardTitle,
						style: [
							'font-size: 20px;',
							'font-weight: 600;',
							`color: ${C.zinc900};`,
							'line-height: 1.4;',
							'margin: 0 0 4px;',
						].join('\n'),
					}),
					para({
						id: 'emifree-brochure-meta',
						text: b.meta.join(' '),
						style: `font-size: 14px;\ncolor: ${C.slate500};\nmargin: 0 0 12px;`,
					}),
					button({
						id: 'emifree-brochure-link',
						text: b.linkLabel,
						href: b.href,
						style: LINK_BUTTON,
					}),
				],
			}),
		],
	});

	return [
		flex({
			id: 'emifree-section-brochure',
			cssid: 'emifree-brochure',
			style: band({ padTop: 80, padBottom: 80 }),
			children: [
				heading({ id: 'emifree-brochure-heading', tag: 'h2', text: b.heading, style: H2 }),
				para({ id: 'emifree-brochure-lead', text: b.lead, style: LEAD }),
				card,
			],
		}),
	];
}

/**
 * The cross-link strip: the other product lines + a link back home.
 *
 * @param {object} product
 * @param {object} media
 * @returns {object[]} root elements
 */
export function buildCrossLinks(product, media) {
	const x = product.crossLinks;
	if (!x) return [];

	const cards = x.cards.map((card) =>
		flex({
			id: 'emifree-cross-card',
			style: [
				'display: flex;',
				'flex-direction: column;',
				'gap: 4px;',
				'flex: 1 1 calc(50% - 8px);',
				`background-color: ${C.white};`,
				`border: 1px solid ${C.slate200};`,
				'border-radius: 12px;',
				'padding: 20px;',
				'&:hover {',
				`  border-color: ${C.blue300};`,
				`  background-color: ${C.blue100};`,
				'}',
				'@media(--mobile) {',
				'  flex: 1 1 100%;',
				'}',
			].join('\n'),
			children: [
				para({
					id: 'emifree-cross-title',
					text: card.title,
					props: { link: link(card.href) },
					style: `font-weight: 600;\ncolor: ${C.zinc900};\nmargin: 0 0 4px;`,
				}),
				para({
					id: 'emifree-cross-body',
					text: card.body,
					style: `font-size: 14px;\ncolor: ${C.slate600};`,
				}),
			],
		})
	);

	return [
		flex({
			id: 'emifree-section-cross',
			cssid: 'emifree-cross',
			style: band({
				bg: C.slate50,
				borderTop: C.slate200,
				padTop: 64,
				padBottom: 64,
				padTopMobile: 48,
				padBottomMobile: 48,
			}),
			children: [
				heading({
					id: 'emifree-cross-heading',
					tag: 'h2',
					text: x.heading,
					style: [
						'font-size: 24px;',
						'font-weight: 700;',
						`color: ${C.zinc900};`,
						'line-height: 1.3;',
						'margin: 0 0 24px;',
					].join('\n'),
				}),
				flex({
					id: 'emifree-cross-grid',
					style: [
						'display: flex;',
						'flex-direction: row;',
						'flex-wrap: wrap;',
						'gap: 16px;',
						'margin: 0 0 32px;',
					].join('\n'),
					children: cards,
				}),
				flex({
					id: 'emifree-cross-back',
					style: [
						'display: flex;',
						'flex-direction: row;',
						'align-items: center;',
						'gap: 8px;',
					].join('\n'),
					children: [
						icon(ICON.arrowRight, { transform: 'rotate(180deg)', id: 'emifree-cross-back-icon' }),
						para({
							id: 'emifree-cross-back-text',
							text: x.backLabel,
							props: { link: link(x.backHref) },
							style: `font-weight: 500;\ncolor: ${C.blue700};`,
						}),
					],
				}),
			],
		}),
	];
}

/**
 * The desktop right-rail section navigator.
 *
 * @param {object} product
 * @returns {object[]} root elements
 */
export function buildSubmenu(product) {
	const sections = [
		{ id: 'hero', label: product.navLabels?.top || 'To the top', icon: true },
		{ id: 'dimensions', label: product.navLabels?.dimensions || 'Dimensions' },
		{ id: 'performance', label: product.navLabels?.performance || 'Performance' },
		{ id: 'specs', label: product.navLabels?.specs || 'Specs' },
		{ id: 'brochure', label: product.navLabels?.brochure || 'Brochure' },
	].filter((s) => (product.sections || []).includes(s.id));

	/* The nav item IS the pill.
	 *
	 * The atomic style converter understands PSEUDO-CLASS states only.
	 * `&:hover` becomes a real hover rule; a descendant (`& a`) or an
	 * attribute selector (`&[aria-current="true"]`) is emitted verbatim
	 * inside the rule body, where the browser throws it away. So:
	 *
	 *   - the hover lives HERE, in the document, and
	 *   - the ACTIVE state — the `aria-current` the scroll-spy writes —
	 *     lives in the theme stylesheet (assets/css/product-elementor.css),
	 *     keyed on the item's id.
	 *
	 * Every item has the same shape (a flex row holding the label), so a
	 * single theme rule styles them all. Only the first one carries an
	 * icon, and the icon sits inside the pill — the PHP version had the
	 * icon inside the anchor, which an atomic link widget cannot do,
	 * because it can only wrap the text it owns.
	 */
	const itemStyle = [
		'display: flex;',
		'flex-direction: row;',
		'align-items: center;',
		'gap: 6px;',
		'padding: 12px 16px;',
		'border-radius: 9999px;',
		'white-space: nowrap;',
		'&:hover {',
		`  background-color: ${C.slate100};`,
		'}',
	].join('\n');

	/* The label — the editable text plus its anchor.
	 *
	 * The kit's `e-default-a` paints the anchor with the accent-link
	 * colour, so the theme stylesheet re-points it at the label colour.
	 */
	const labelStyle = [
		'font-size: 14px;',
		'font-weight: 600;',
		`color: ${C.slate700};`,
	].join('\n');

	const children = sections.map((section) =>
		flex({
			id: `emifree-nav-${section.id}`,
			cssid: `emifree-nav-${section.id}`,
			style: itemStyle,
			children: [
				...(section.icon
					? [
							icon(ICON.arrowRight, {
								size: 16,
								color: C.slate700,
								transform: 'rotate(-90deg)',
								id: `emifree-nav-${section.id}-icon`,
							}),
					  ]
					: []),
				para({
					id: `emifree-nav-${section.id}-label`,
					text: section.label,
					props: { link: link(`#emifree-${section.id}`) },
					style: labelStyle,
				}),
			],
		})
	);

	return [
		flex({
			id: 'emifree-submenu',
			cssid: 'emifree-submenu',
			style: [
				'display: flex;',
				'flex-direction: column;',
				'align-items: center;',
				'gap: 4px;',
				'padding: 8px;',
				'position: fixed;',
				'right: 16px;',
				'top: 50%;',
				'transform: translateY(-50%);',
				'z-index: 40;',
				`background-color: rgba(255,255,255,0.85);`,
				`border: 1px solid rgba(226,232,240,0.8);`,
				'border-radius: 9999px;',
				'box-shadow: 0px 25px 50px -12px rgba(0,0,0,0.25);',
				'backdrop-filter: blur(16px);',
				'@media(--tablet) {',
				'  display: none;',
				'}',
				'@media(--mobile) {',
				'  display: none;',
				'}',
			].join('\n'),
			children,
		}),
	];
}

/**
 * The mobile "back to top" pill.
 *
 * @param {object} product
 * @returns {object[]} root elements
 */
export function buildBackToTop(product) {
	if (!product.sections || !product.sections.length) return [];
	return [
		flex({
			id: 'emifree-back-to-top',
			cssid: 'emifree-back-to-top',
			style: [
				'display: none;',
				'flex-direction: row;',
				'align-items: center;',
				'gap: 6px;',
				'padding: 12px 16px;',
				'position: fixed;',
				'right: 16px;',
				'bottom: 16px;',
				'z-index: 40;',
				`background-color: ${C.blue600};`,
				`color: ${C.white};`,
				'font-size: 14px;',
				'font-weight: 600;',
				'border-radius: 9999px;',
				'box-shadow: 0px 20px 25px -5px rgba(0,0,0,0.1);',
				// The hidden/shown state belongs to the theme stylesheet:
				// the converter rewrites `opacity: 0` as `opacity: 0%`,
				// and product-page.js toggles a class rather than a style.
				'transition: opacity 200ms ease;',
				'&:hover {',
				`  background-color: ${C.blue700};`,
				'}',
				'@media(--mobile) {',
				'  display: flex;',
				'}',
			].join('\n'),
			children: [
				icon(ICON.arrowRight, {
					size: 16,
					color: C.white,
					transform: 'rotate(-90deg)',
					id: 'emifree-back-to-top-icon',
				}),
				para({
					id: 'emifree-back-to-top-text',
					text: product.navLabels?.up || 'Up',
					props: { link: link('#emifree-hero') },
					style: `font-size: 14px;\nfont-weight: 600;\ncolor: ${C.white};`,
				}),
			],
		}),
	];
}

/**
 * Every section of one product page, in the order the PHP renders them.
 *
 * @param {object} product
 * @param {object} media
 * @returns {object[]} root elements
 */
export function buildProductPage(product, media) {
	const roots = [];
	roots.push(...buildHero(product, media));
	roots.push(...buildDimensions(product, media));
	roots.push(...buildPerformance(product, media));
	roots.push(...buildSpecs(product, media));
	roots.push(...buildBrochure(product, media));
	roots.push(...buildCrossLinks(product, media));
	roots.push(...buildSubmenu(product));
	roots.push(...buildBackToTop(product));
	return roots;
}
