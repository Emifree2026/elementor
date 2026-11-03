/**
 * Section builders for the Emifree landing page — classic (v3) Elementor.
 *
 * Each builder returns one root `container` node. The sections mirror
 * `template-parts/section-*.php` from the legacy PHP theme, which is the
 * design source of truth named in `specs/design-tokens.md`, and they follow
 * `specs/elementor-blueprint.md` for the tree, the copy and the metrics.
 *
 * Conventions
 * -----------
 *  - **Native first.** Colours, fonts, spacing, radii, shadows and
 *    transitions are emitted as Elementor style props so an editor can
 *    change them in the UI (brief rule 3).
 *  - **Custom CSS only for what native cannot express** — `flex: 1 1 58%`,
 *    `aspect-ratio`, gradient text (`background-clip: text`), a card-wide
 *    hover lift, grid placement, `backdrop-filter` and `object-fit` inside
 *    a widget that has no control for it.
 *  - **Explicit image sizes.** Every image names a WordPress size — never
 *    the raw upload (brief rule 4).
 *
 * The classic container box model (verified against `assets/css/frontend.css`
 * of the 4.3.5 install):
 *
 *  - a **full** container renders `<div class="e-con e-con-full e-flex">` with
 *    **no** inner wrapper; a **boxed** container renders
 *    `<div class="e-con e-con-boxed e-flex"><div class="e-con-inner">`;
 *  - inline padding always lands on `.e-con` (outside the measure), block
 *    padding lands on `.e-con` (full) or `.e-con-inner` (boxed);
 *  - `--content-width` (= `boxed_width`) caps the **content**, so a boxed
 *    container with `boxed_width: 1280` and 32px inline padding measures
 *    1280px of content with 32px of gutter outside it;
 *  - the boxed **outer** element is reset to a column flexbox — the real
 *    layout lives on the **inner** element, which inherits the same
 *    custom properties.
 */

import {
	container,
	heading,
	text,
	button,
	image,
	icon,
	iconBox,
	form,
	compileDocument,
	resetIds,
	mediaRef,
	svgRef,
} from './v3.mjs';
import { color, gradient, shadow, space, radius, motion } from './tokens.mjs';
import { media, attachmentUrl } from './assets.mjs';
import * as copy from './content.mjs';

/* ------------------------------------------------------------------ *
 * Small helpers
 * ------------------------------------------------------------------ */

/** An uploaded SVG from the Media Library, as an `icons` control value. */
const svg = (id) => svgRef(id, attachmentUrl(id));

/** An uploaded image from the Media Library, as a `media` control value. */
const img = (id, size) => mediaRef(id, attachmentUrl(id), size);

/** The icon ids of the six application tiles (media.svg 84–89). */
const APP_ICON = {
	cnc: media.svg.apps.cnc.id,
	metal: media.svg.apps.metal.id,
	grinding: media.svg.apps.grinding.id,
	bearing: media.svg.apps.bearing.id,
	heavy: media.svg.apps.heavy.id,
	auto: media.svg.apps.auto.id,
};

/** The card hover lift — `specs/design-tokens.md` §4 (brief rule 3). */
const LIFT = `transform: translateY(-6px);`;

/** The card transition — the same easing the PHP uses. */
const CARD_TRANSITION = `transition: transform ${motion.base} ${motion.hoverEase}, box-shadow ${motion.base} ease;`;

/**
 * The L1 root container of a section.
 *
 * A full-width container with the §1.8 preset: 96px block padding (48px on
 * mobile), a scroll offset for the fixed header and the section background.
 */
function sectionRoot({
	id,
	title,
	bg = null,
	bgGradient = null,
	gap = 48,
	gapMobile = 32,
	padding = [96, 0, 96, 0],
	paddingMobile = [48, 0, 48, 0],
	extra = {},
	children = [],
} = {}) {
	return container({
		title,
		id,
		isInner: false,
		htmlTag: 'section',
		contentWidth: 'full',
		width: 100,
		layout: 'flex',
		direction: 'column',
		gap,
		gapMobile,
		padding,
		paddingMobile,
		position: 'relative',
		bg,
		bgGradient,
		// `scroll-margin-top` clears the fixed 64px header + 16px.
		css: 'scroll-margin-top: 80px;',
		...extra,
		children,
	});
}

/**
 * The L2 measure — the 1280px content column.
 *
 * `boxed_width` caps the content; the inline padding is the gutter that
 * sits outside that cap, exactly like the blueprint's
 * `max-width: 1280px; padding-inline: 32px`.
 */
function measure({ title, id = null, layout = 'flex', ...rest } = {}) {
	return container({
		title,
		id,
		isInner: true,
		contentWidth: 'boxed',
		maxWidth: 1280,
		layout,
		padding: [0, 32, 0, 32],
		paddingTablet: [0, 24, 0, 24],
		paddingMobile: [0, 16, 0, 16],
		...rest,
	});
}

/**
 * An L3 card — a white surface with the shared radius, border and shadow.
 *
 * The two-layer shadows of the design tokens do not fit Elementor's
 * single-layer shadow control, so they travel as custom CSS.
 */
function card({ title, id = null, ...rest } = {}) {
	return container({
		title,
		id,
		isInner: true,
		contentWidth: 'full',
		width: 100,
		layout: 'flex',
		direction: 'column',
		align: 'flex-start',
		gap: 16,
		padding: [24, 24, 24, 24],
		paddingTablet: [32, 32, 32, 32],
		bg: '#FFFFFF',
		border: { style: 'solid', width: 1, color: '#F1F5F9' },
		radius: 24,
		shadow: shadow.xl,
		css: CARD_TRANSITION,
		...rest,
	});
}

/* ------------------------------------------------------------------ *
 * §3 — Hero
 * ------------------------------------------------------------------ */

function heroChip(chip) {
	return button({
		label: chip.label,
		href: chip.href,
		editorTitle: `hero-chip-${chip.id}`,
		bg: 'rgba(255,255,255,0.10)',
		bgHover: 'rgba(255,255,255,0.20)',
		textColor: '#FFFFFF',
		textHoverColor: '#FFFFFF',
		border: { style: 'solid', width: 1, color: 'rgba(255,255,255,0.25)' },
		borderHoverColor: 'rgba(255,255,255,0.45)',
		radius: 9999,
		padding: [8, 16, 8, 16],
		size: 16,
		weight: 500,
		lineHeight: 1.5,
		// `backdrop-filter` has no native control.
		css: 'backdrop-filter: blur(4px);',
	});
}

export function hero() {
	return sectionRoot({
		id: 'hero',
		title: 'Hero',
		bg: '#0A0A0A',
		bgVideo: { url: attachmentUrl(media.heroVideo.id) },
		gap: 0,
		padding: 0,
		extra: {
			minHeight: '100dvh',
			overflow: 'hidden',
			// The PHP centres the hero copy in the viewport; the blueprint's
			// logo strip now sits in the right-hand column, so the whole
			// hero row is centred instead.
			justify: 'center',
		},
		children: [
			// The scrim is an overlay layer of the L1 root, not a wrapper.
			container({
				title: 'hero-scrim',
				isInner: true,
				contentWidth: 'full',
				width: 100,
				layout: 'flex',
				direction: 'column',
				gap: 0,
				padding: 0,
				position: 'absolute',
				offsetX: 0,
				offsetXEnd: 0,
				offsetY: 0,
				offsetYEnd: 0,
				zIndex: 2,
				css:
					'pointer-events: none; background-image: linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.50) 50%, rgba(0,0,0,0.70) 100%), linear-gradient(to bottom right, rgba(16,185,129,0.05) 0%, transparent 100%);',
			}),

			measure({
				title: 'hero-inner',
				layout: 'flex',
				direction: 'row',
				directionMobile: 'column',
				align: 'center',
				justify: 'space-between',
				gap: 64,
				gapTablet: 40,
				gapMobile: 32,
				padding: [96, 32, 120, 32],
				paddingTablet: [96, 24, 120, 24],
				paddingMobile: [80, 16, 64, 16],
				position: 'relative',
				zIndex: 3,
				children: [
					// hero-copy
					container({
						title: 'hero-copy',
						isInner: true,
						contentWidth: 'full',
						width: 100,
						layout: 'flex',
						direction: 'column',
						align: 'flex-start',
						gap: 24,
						padding: 0,
						css: 'flex: 1 1 58%; max-width: 640px;',
						children: [
							// hero-badge — the first depth exception (E1-a).
							container({
								title: 'hero-badge',
								isInner: true,
								contentWidth: 'full',
								width: 100,
								layout: 'flex',
								direction: 'row',
								wrap: 'wrap',
								align: 'center',
								gap: 12,
								padding: 0,
								children: copy.hero.chips.map(heroChip),
							}),

							heading({
								title: copy.hero.headline,
								tag: 'h1',
								editorTitle: 'hero-title',
								id: 'hero-title',
								color: '#FFFFFF',
								fontFamily: 'Inter',
								size: 60,
								sizeTablet: 48,
								sizeMobile: 36,
								weight: 700,
								lineHeight: 1.15,
								letterSpacing: -0.02,
							}),

							// hero-cta — the second depth exception (E1-b).
							container({
								title: 'hero-cta',
								isInner: true,
								contentWidth: 'full',
								width: 100,
								layout: 'flex',
								direction: 'row',
								wrap: 'wrap',
								align: 'center',
								gap: 16,
								padding: 0,
								children: [
									button({
										label: copy.hero.primaryLabel,
										href: '#contact',
										editorTitle: 'hero-primary',
										id: 'hero-primary',
										bgGradient: { from: '#1D4ED8', to: '#06B6D4', type: 'linear', angle: 90 },
										textColor: '#FFFFFF',
										textHoverColor: '#FFFFFF',
										radius: 9999,
										padding: [20, 40, 20, 40],
										size: 20,
										weight: 600,
										lineHeight: 1.5,
										shadow: '0px 10px 15px rgba(0,0,0,0.10)',
										shadowHover: '0px 20px 25px rgba(0,0,0,0.15)',
										cssHover: 'transform: translateY(-2px);',
									}),
									button({
										label: copy.hero.secondaryLabel,
										href: '#technology',
										editorTitle: 'hero-secondary',
										id: 'hero-secondary',
										bg: 'transparent',
										bgHover: 'rgba(255,255,255,0.12)',
										textColor: '#FFFFFF',
										textHoverColor: '#FFFFFF',
										border: { style: 'solid', width: 1, color: 'rgba(255,255,255,0.45)' },
										borderHoverColor: '#FFFFFF',
										radius: 9999,
										padding: [20, 32, 20, 32],
										size: 16,
										weight: 500,
										lineHeight: 1.5,
									}),
								],
							}),
						],
					}),

					// hero-visual — the client logo strip.
					container({
						title: 'hero-visual',
						isInner: true,
						contentWidth: 'full',
						width: 100,
						layout: 'flex',
						direction: 'row',
						wrap: 'wrap',
						align: 'center',
						justify: 'center',
						gap: 24,
						padding: 0,
						css: 'flex: 0 1 34%;',
						children: [
							text({
								html: `<p>${copy.hero.logosLabel}</p>`,
								editorTitle: 'hero-logos-label',
								color: 'rgba(255,255,255,0.60)',
								align: 'center',
								fontFamily: 'Inter',
								size: 12,
								weight: 400,
								letterSpacing: 0.05,
								transform: 'uppercase',
								lineHeight: 1.4,
								paragraphSpacing: 0,
								css: 'flex: 0 0 100%;',
							}),
							...copy.hero.logos.map((logo) =>
								image({
									src: svg(media.svg.logos[logoKey(logo.file)].id),
									size: 'full',
									editorTitle: `hero-logo-${logoKey(logo.file)}`,
									maxWidth: Number.parseInt(logo.max.replace(/[^0-9]/g, ''), 10),
									opacity: 0.5,
									opacityHover: 1,
									css: 'filter: grayscale(1) brightness(0) invert(1); transition: filter 0.3s ease, opacity 0.3s ease;',
									cssHover: 'filter: none;',
									cssMobile: 'max-height: 24px;',
								}),
							),
						],
					}),
				],
			}),
		],
	});
}

/** Map a logo file name to its media.svg.logos key. */
function logoKey(file) {
	const map = {
		'mb_svg.svg': 'mercedes',
		'bmw.svg': 'bmw',
		'gm.svg': 'gm',
		'NSK.svg': 'nsk',
		'knorr.svg': 'knorr',
		'siemens_logo.svg': 'siemens',
	};
	return map[file];
}

/* ------------------------------------------------------------------ *
 * §4 — Products (feature grid)
 * ------------------------------------------------------------------ */

function productCard(cardData) {
	const asset = media.products[cardData.id];

	return container({
		title: `card-${cardData.id}`,
		id: `card-${cardData.id}`,
		isInner: true,
		contentWidth: 'full',
		width: 100,
		layout: 'flex',
		direction: 'column',
		align: 'stretch',
		gap: 0,
		padding: 0,
		bg: '#FFFFFF',
		radius: 16,
		overflow: 'hidden',
		position: 'relative',
		// The whole card is one anchor — the PHP renders it as a link.
		htmlTag: 'a',
		href: cardData.href,
		// `aspect-ratio` and the hover lift have no native control.
		css: `aspect-ratio: 4 / 5; ${CARD_TRANSITION}`,
		cssHover: `${LIFT} box-shadow: ${shadow['2xl']};`,
		children: [
			image({
				src: img(asset.id, asset.size),
				size: asset.size,
				editorTitle: `card-${cardData.id}-image`,
				width: 100,
				objectFit: 'contain',
				padding: 24,
				extra: [
					'selector img { flex: 1 1 auto; min-height: 0; height: auto; transition: transform 0.5s ease-out; }',
					'selector:hover img { transform: scale(1.05); }',
				],
			}),
			heading({
				title: cardData.title,
				tag: 'h3',
				editorTitle: `card-${cardData.id}-title`,
				color: '#FFFFFF',
				fontFamily: 'Inter',
				size: 24,
				weight: 700,
				lineHeight: 1.33,
				padding: [24, 24, 0, 24],
				bgGradient: { from: '#2563EB', to: '#1E40AF', type: 'linear', angle: 180 },
				bgHoverGradient: { from: '#1D4ED8', to: '#1E3A8A', type: 'linear', angle: 180 },
				css: 'text-shadow: 0px 1px 2px rgba(0,0,0,0.20);',
			}),
			text({
				html: `<p>${copy.products.ctaLabel} →</p>`,
				editorTitle: `card-${cardData.id}-cta`,
				color: '#FFFFFF',
				fontFamily: 'Inter',
				size: 14,
				weight: 600,
				lineHeight: 1.43,
				paragraphSpacing: 0,
				padding: [8, 24, 24, 24],
				bg: '#1E40AF',
				bgHover: '#1E3A8A',
			}),
		],
	});
}

export function products() {
	return sectionRoot({
		id: 'products',
		title: 'Products',
		bg: '#F8FAFC',
		gap: 48,
		gapMobile: 32,
		children: [
			measure({
				title: 'products-header',
				layout: 'flex',
				direction: 'column',
				align: 'center',
				gap: 24,
				children: [
					heading({
						title: copy.products.title,
						tag: 'h2',
						editorTitle: 'products-title',
						id: 'products-title',
						color: '#0F172A',
						fontFamily: 'Inter',
						size: 48,
						sizeTablet: 48,
						sizeMobile: 36,
						weight: 700,
						lineHeight: 1.2,
						align: 'center',
					}),
					text({
						html: `<p>${copy.products.lead}</p>`,
						editorTitle: 'products-subtitle',
						color: '#52525B',
						fontFamily: 'Inter',
						size: 20,
						lineHeight: 1.4,
						align: 'center',
						paragraphSpacing: 0,
						css: 'max-width: 768px; margin-inline: auto;',
					}),
				],
			}),

			measure({
				title: 'products-grid',
				layout: 'grid',
				columns: 3,
				columnsTablet: 2,
				columnsMobile: 1,
				rows: 'auto',
				gap: 32,
				gapTablet: 24,
				gapMobile: 24,
				children: copy.products.cards.map(productCard),
			}),
		],
	});
}

/* ------------------------------------------------------------------ *
 * §5 — Applications (Variant B — the 3/2/1 feature grid)
 * ------------------------------------------------------------------ */

function applicationCard(cardData) {
	return card({
		title: `appcard-${cardData.id}`,
		id: `appcard-${cardData.id}`,
		gap: 24,
		radius: 16,
		shadow: shadow.lg,
		cssHover: `${LIFT} box-shadow: ${shadow['2xl']}; border-color: #E2E8F0;`,
		children: [
			iconBox({
				src: svg(APP_ICON[cardData.id]),
				title: cardData.title,
				description: cardData.description,
				titleSize: 'h3',
				iconColor: '#FFFFFF',
				iconSize: 32,
				titleColor: '#0F172A',
				titleHoverColor: '#0F172A',
				descriptionColor: '#52525B',
				iconSpace: 24,
				titleBottomSpace: 8,
				align: 'start',
				editorTitle: `appcard-${cardData.id}-icon`,
				titleType: {
					fontFamily: 'Inter',
					size: 20,
					weight: 700,
					lineHeight: 1.4,
				},
				descriptionType: {
					fontFamily: 'Inter',
					size: 16,
					lineHeight: 1.625,
				},
				extra: [
					'selector .elementor-icon-box-icon { width: 64px; height: 64px; padding: 16px; box-sizing: border-box; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; background-image: linear-gradient(135deg, #2563EB 0%, #06B6D4 100%); box-shadow: 0px 10px 25px rgba(37,99,235,0.25); }',
					// The icon-box base layer pins the copy to the centre.
					'selector .elementor-icon-box-content { text-align: left; }',
				],
			}),
			text({
				html: `<p><em>“${cardData.question}”</em></p>`,
				editorTitle: `appcard-${cardData.id}-question`,
				color: '#52525B',
				fontFamily: 'Inter',
				size: 14,
				fontStyle: 'italic',
				lineHeight: 1.43,
				paragraphSpacing: 0,
			}),
		],
	});
}

export function applications() {
	return sectionRoot({
		id: 'applications',
		title: 'Applications',
		bg: '#FFFFFF',
		gap: 80,
		gapMobile: 48,
		children: [
			measure({
				title: 'applications-header',
				layout: 'flex',
				direction: 'column',
				align: 'center',
				gap: 24,
				children: [
					heading({
						title: copy.applications.title,
						tag: 'h2',
						editorTitle: 'applications-title',
						id: 'applications-title',
						fontFamily: 'Inter',
						size: 48,
						sizeTablet: 40,
						sizeMobile: 32,
						weight: 700,
						lineHeight: 1.2,
						align: 'center',
						// Gradient text — `background-clip: text` has no
						// native control, so the whole treatment is CSS.
						extra: [
							'selector .elementor-heading-title { background-image: linear-gradient(90deg, #1D4ED8 0%, #06B6D4 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }',
						],
					}),
					text({
						html: `<p>${copy.applications.lead}</p>`,
						editorTitle: 'applications-subtitle',
						color: '#52525B',
						fontFamily: 'Inter',
						size: 20,
						sizeMobile: 18,
						lineHeight: 1.55,
						align: 'center',
						paragraphSpacing: 0,
						css: 'max-width: 768px; margin-inline: auto;',
					}),
				],
			}),

			measure({
				title: 'applications-grid',
				layout: 'grid',
				columns: 3,
				columnsTablet: 2,
				columnsMobile: 1,
				rows: 'auto',
				gap: 32,
				gapTablet: 24,
				gapMobile: 24,
				children: copy.applications.cards.map(applicationCard),
			}),

			measure({
				title: 'applications-cta',
				layout: 'flex',
				direction: 'column',
				align: 'center',
				gap: 24,
				children: [
					button({
						label: copy.applications.ctaLabel,
						href: copy.applications.ctaHref,
						editorTitle: 'applications-cta-button',
						id: 'applications-cta-button',
						bgGradient: { from: '#1D4ED8', to: '#06B6D4', type: 'linear', angle: 90 },
						textColor: '#FFFFFF',
						textHoverColor: '#FFFFFF',
						radius: 9999,
						padding: [16, 32, 16, 32],
						size: 18,
						weight: 600,
						lineHeight: 1.55,
						shadow: '0px 10px 25px rgba(6,182,212,0.25)',
						shadowHover: '0px 20px 30px rgba(6,182,212,0.35)',
					}),
				],
			}),
		],
	});
}

/* ------------------------------------------------------------------ *
 * §6 — Technology
 * ------------------------------------------------------------------ */

function techCard(tech) {
	return card({
		title: `tech-card-${tech.id}`,
		id: `tech-card-${tech.id}`,
		gap: 16,
		children: [
			text({
				html: `<p>${tech.badge}</p>`,
				editorTitle: `tech-${tech.id}-badge`,
				color: tech.badgeFg,
				fontFamily: 'Inter',
				size: 12,
				weight: 600,
				lineHeight: 1.33,
				paragraphSpacing: 0,
				padding: [4, 12, 4, 12],
				bg: tech.badgeBg,
				radius: 9999,
			}),
			heading({
				title: tech.title,
				tag: 'h3',
				editorTitle: `tech-${tech.id}-title`,
				color: '#0F172A',
				fontFamily: 'Inter',
				size: 36,
				sizeTablet: 24,
				weight: 700,
				lineHeight: 1.2,
			}),
			text({
				html: `<p>${tech.subtitle}</p>`,
				editorTitle: `tech-${tech.id}-subtitle`,
				color: '#64748B',
				fontFamily: 'Inter',
				size: 14,
				lineHeight: 1.43,
				paragraphSpacing: 0,
			}),
			text({
				html: `<p>${tech.description}</p>`,
				editorTitle: `tech-${tech.id}-description`,
				color: '#475569',
				fontFamily: 'Inter',
				size: 16,
				lineHeight: 1.5,
				paragraphSpacing: 0,
			}),
			text({
				html: `<ul>${tech.bullets.map((bullet) => `<li>${bullet}</li>`).join('')}</ul>`,
				editorTitle: `tech-${tech.id}-bullets`,
				color: '#334155',
				fontFamily: 'Inter',
				size: 16,
				lineHeight: 1.5,
				paragraphSpacing: 0,
				extra: [
					'selector ul { margin: 0; padding-inline-start: 20px; list-style: disc; }',
					'selector li { margin-block-end: 4px; }',
				],
			}),
			text({
				html: `<p><a href="#${tech.anchor}">${tech.ctaLabel} →</a></p>`,
				editorTitle: `tech-${tech.id}-cta`,
				color: '#2563EB',
				linkColor: '#2563EB',
				linkHoverColor: '#1D4ED8',
				fontFamily: 'Inter',
				size: 16,
				weight: 500,
				lineHeight: 1.5,
				paragraphSpacing: 0,
				extra: ['selector a { text-decoration: none; }'],
			}),
		],
	});
}

function techPanel(tech, asset) {
	return card({
		title: `panel-${tech.id}`,
		id: tech.anchor,
		gap: 24,
		children: [
			heading({
				title: tech.processTitle,
				tag: 'h3',
				editorTitle: `panel-${tech.id}-title`,
				color: '#0F172A',
				fontFamily: 'Inter',
				size: 24,
				weight: 700,
				lineHeight: 1.33,
			}),
			text({
				html: `<p>${tech.processSubtitle}</p>`,
				editorTitle: `panel-${tech.id}-subtitle`,
				color: '#64748B',
				fontFamily: 'Inter',
				size: 14,
				lineHeight: 1.43,
				paragraphSpacing: 0,
			}),
			image({
				src: img(asset.id, asset.size),
				size: asset.size,
				editorTitle: `panel-${tech.id}-image`,
				width: 100,
				objectFit: 'contain',
				padding: 16,
				bg: '#F1F5F9',
				radius: 16,
			}),
			text({
				html: `<ol>${tech.steps
					.map((step) => `<li><strong>${step.title}</strong> — ${step.desc}</li>`)
					.join('')}</ol>`,
				editorTitle: `panel-${tech.id}-steps`,
				color: '#475569',
				fontFamily: 'Inter',
				size: 16,
				lineHeight: 1.5,
				paragraphSpacing: 0,
				extra: [
					'selector ol { margin: 0; padding-inline-start: 20px; }',
					'selector li { margin-block-end: 8px; }',
				],
			}),
		],
	});
}

export function technology() {
	return sectionRoot({
		id: 'technology',
		title: 'Technology',
		bg: '#F8FAFC',
		bgGradient: { from: '#F8FAFC', to: '#EFF6FF', type: 'linear', angle: 135 },
		gap: 80,
		gapMobile: 48,
		children: [
			measure({
				title: 'technology-header',
				layout: 'flex',
				direction: 'column',
				align: 'center',
				gap: 24,
				children: [
					heading({
						title: `${copy.technology.titleLead}<span class="accent">${copy.technology.titleAccent}</span>${copy.technology.titleTail}`,
						tag: 'h2',
						editorTitle: 'technology-title',
						id: 'technology-title',
						color: '#0F172A',
						fontFamily: 'Inter',
						size: 48,
						sizeTablet: 40,
						sizeMobile: 32,
						weight: 700,
						lineHeight: 1.2,
						align: 'center',
						extra: [
							'selector .elementor-heading-title .accent { color: #1D4ED8; }',
						],
					}),
					text({
						html: `<p>${copy.technology.lead}</p>`,
						editorTitle: 'technology-lead',
						color: '#475569',
						fontFamily: 'Inter',
						size: 20,
						lineHeight: 1.4,
						align: 'center',
						paragraphSpacing: 0,
						css: 'max-width: 768px; margin-inline: auto;',
					}),
					text({
						html: `<p>${copy.technology.note}</p>`,
						editorTitle: 'technology-note',
						color: '#64748B',
						fontFamily: 'Inter',
						size: 14,
						lineHeight: 1.43,
						align: 'center',
						paragraphSpacing: 0,
					}),
				],
			}),

			measure({
				title: 'technology-cards',
				layout: 'grid',
				columns: 2,
				columnsMobile: 1,
				rows: 'auto',
				gap: 32,
				gapTablet: 24,
				gapMobile: 24,
				children: copy.technology.technologies.map(techCard),
			}),

			measure({
				title: 'technology-process',
				layout: 'grid',
				columns: 2,
				columnsMobile: 1,
				rows: 'auto',
				gap: 48,
				gapTablet: 24,
				gapMobile: 24,
				children: copy.technology.technologies.map((tech) =>
					techPanel(tech, media.technology[tech.id]),
				),
			}),

			// The CTA card is a 896px measure, centred in the section.
			container({
				title: 'technology-cta',
				isInner: true,
				contentWidth: 'full',
				width: 100,
				layout: 'flex',
				direction: 'column',
				align: 'center',
				gap: 32,
				padding: [32, 32, 32, 32],
				paddingTablet: [48, 48, 48, 48],
				bg: '#EFF6FF',
				radius: 24,
				shadow: shadow.xl,
				css: 'max-width: 896px; margin-inline: auto;',
				children: [
					heading({
						title: copy.technology.ctaTitle,
						tag: 'h3',
						editorTitle: 'technology-cta-title',
						color: '#0F172A',
						fontFamily: 'Inter',
						size: 48,
						sizeTablet: 30,
						weight: 700,
						lineHeight: 1.2,
						align: 'center',
					}),
					text({
						html: `<p>${copy.technology.ctaBody}</p>`,
						editorTitle: 'technology-cta-body',
						color: '#334155',
						fontFamily: 'Inter',
						size: 18,
						lineHeight: 1.55,
						align: 'center',
						paragraphSpacing: 0,
						css: 'max-width: 672px;',
					}),
					// technology-cta-actions — the third depth exception (E1-c).
					container({
						title: 'technology-cta-actions',
						isInner: true,
						contentWidth: 'full',
						width: 100,
						layout: 'flex',
						direction: 'row',
						wrap: 'wrap',
						align: 'center',
						justify: 'center',
						gap: 16,
						padding: 0,
						children: [
							button({
								label: copy.technology.ctaPrimaryLabel,
								href: '#contact',
								editorTitle: 'technology-cta-primary',
								bg: '#FFFFFF',
								bgHover: '#F8FAFC',
								textColor: '#334155',
								textHoverColor: '#334155',
								border: { style: 'solid', width: 1, color: '#CBD5E1' },
								radius: 9999,
								padding: [14, 24, 14, 24],
								size: 16,
								weight: 500,
								lineHeight: 1.5,
							}),
							button({
								label: `${copy.technology.ctaSecondaryLabel} →`,
								href: '#knowledge',
								editorTitle: 'technology-cta-secondary',
								bg: 'transparent',
								textColor: '#1E40AF',
								textHoverColor: '#1E3A8A',
								radius: 9999,
								padding: [14, 24, 14, 24],
								size: 16,
								weight: 500,
								lineHeight: 1.5,
							}),
						],
					}),
				],
			}),
		],
	});
}

/* ------------------------------------------------------------------ *
 * §7 — Knowledge
 * ------------------------------------------------------------------ */

export function knowledge() {
	return sectionRoot({
		id: 'knowledge',
		title: 'Knowledge',
		bg: '#FFFFFF',
		gap: 64,
		gapMobile: 40,
		children: [
			measure({
				title: 'knowledge-masthead',
				layout: 'flex',
				direction: 'column',
				align: 'center',
				gap: 24,
				children: [
					heading({
						title: `${copy.knowledge.titleLead}<span class="accent">${copy.knowledge.titleAccent}</span>`,
						tag: 'h2',
						editorTitle: 'knowledge-title',
						id: 'knowledge-title',
						color: '#0F172A',
						fontFamily: 'Inter',
						size: 48,
						sizeTablet: 48,
						sizeMobile: 36,
						weight: 700,
						lineHeight: 1.2,
						align: 'center',
						extra: ['selector .elementor-heading-title .accent { color: #1D4ED8; }'],
					}),
					text({
						html: `<p>${copy.knowledge.lead}</p>`,
						editorTitle: 'knowledge-subtitle',
						color: '#475569',
						fontFamily: 'Inter',
						size: 20,
						lineHeight: 1.4,
						align: 'center',
						paragraphSpacing: 0,
						css: 'max-width: 768px; margin-inline: auto;',
					}),
					button({
						label: copy.knowledge.ctaLabel,
						href: copy.knowledge.ctaHref,
						editorTitle: 'knowledge-tools-button',
						bgGradient: { from: '#1D4ED8', to: '#06B6D4', type: 'linear', angle: 90 },
						textColor: '#FFFFFF',
						textHoverColor: '#FFFFFF',
						radius: 9999,
						padding: [16, 32, 16, 32],
						size: 18,
						weight: 600,
						lineHeight: 1.55,
						shadow: '0px 10px 25px rgba(6,182,212,0.25)',
						shadowHover: '0px 20px 30px rgba(6,182,212,0.35)',
					}),
				],
			}),

			measure({
				title: 'knowledge-tabs',
				layout: 'flex',
				direction: 'row',
				wrap: 'wrap',
				align: 'center',
				justify: 'center',
				gap: 16,
				children: copy.knowledge.tabs.map((tab, index) =>
					button({
						label: tab.label,
						href: tab.href,
						editorTitle: `knowledge-tab-${tab.id}`,
						id: `knowledge-tab-${tab.id}`,
						bg: index === 0 ? '#1D4ED8' : '#FFFFFF',
						bgHover: index === 0 ? '#1D4ED8' : '#F1F5F9',
						textColor: index === 0 ? '#FFFFFF' : '#475569',
						textHoverColor: index === 0 ? '#FFFFFF' : '#1D4ED8',
						border: {
							style: 'solid',
							width: 1,
							color: index === 0 ? '#1D4ED8' : '#E2E8F0',
						},
						borderHoverColor: index === 0 ? '#1D4ED8' : '#CBD5E1',
						radius: 9999,
						padding: [16, 32, 16, 32],
						size: 16,
						weight: 600,
						lineHeight: 1.5,
						shadow: index === 0 ? shadow.lg : null,
					}),
				),
			}),

			measure({
				title: 'knowledge-feature',
				layout: 'grid',
				columnsCustom: '2fr 3fr',
				columnsMobile: 1,
				rows: 'auto auto auto auto',
				gap: [12, 32],
				gapTablet: [12, 24],
				gapMobile: [16, 16],
				gridAlignItems: 'center',
				padding: [24, 24, 24, 24],
				paddingTablet: [24, 24, 24, 24],
				paddingMobile: [16, 16, 16, 16],
				bg: '#FFFFFF',
				radius: 24,
				overflow: 'hidden',
				shadow: shadow.lg,
				htmlTag: 'a',
				href: copy.knowledge.feature.url,
				css: `${CARD_TRANSITION}`,
				cssHover: `box-shadow: ${shadow.xl};`,
				children: [
					image({
						src: img(media.knowledge.feature.id, media.knowledge.feature.size),
						size: media.knowledge.feature.size,
						editorTitle: 'knowledge-feature-image',
						width: 100,
						height: 100,
						objectFit: 'cover',
						radius: 16,
						bg: '#F1F5F9',
						extra: [
							'selector { grid-column: 1; grid-row: 1 / -1; min-height: 240px; transition: transform 0.3s ease; }',
							'selector:hover img { transform: scale(1.05); }',
							'@media (max-width: 767px) { selector { grid-row: 1; height: auto; aspect-ratio: 16 / 9; } }',
						],
					}),
					text({
						html: `<p>${copy.knowledge.feature.category}</p>`,
						editorTitle: 'knowledge-feature-badge',
						color: '#FFFFFF',
						fontFamily: 'Inter',
						size: 14,
						weight: 600,
						lineHeight: 1.43,
						paragraphSpacing: 0,
						padding: [4, 12, 4, 12],
						bg: '#DC2626',
						radius: 9999,
						extra: [
							'selector { grid-column: 1; grid-row: 1; justify-self: start; align-self: start; z-index: 2; margin: 16px; }',
							'@media (max-width: 767px) { selector { grid-row: 2; margin: 0; } }',
						],
					}),
					text({
						html: `<p>${copy.knowledge.feature.date} · ${copy.knowledge.feature.readTime}</p>`,
						editorTitle: 'knowledge-feature-meta',
						color: '#64748B',
						fontFamily: 'Inter',
						size: 14,
						lineHeight: 1.43,
						paragraphSpacing: 0,
						extra: [
							'selector { grid-column: 2; grid-row: 1; }',
							'@media (max-width: 767px) { selector { grid-column: 1; grid-row: auto; } }',
						],
					}),
					heading({
						title: copy.knowledge.feature.title,
						tag: 'h3',
						editorTitle: 'knowledge-feature-title',
						color: '#0F172A',
						fontFamily: 'Inter',
						size: 36,
						sizeTablet: 24,
						weight: 700,
						lineHeight: 1.33,
						extra: [
							'selector { grid-column: 2; grid-row: 2; }',
							'selector:hover .elementor-heading-title { color: #1D4ED8; }',
							'@media (max-width: 767px) { selector { grid-column: 1; grid-row: auto; } }',
						],
					}),
					text({
						html: `<p>${copy.knowledge.feature.excerpt}</p>`,
						editorTitle: 'knowledge-feature-excerpt',
						color: '#475569',
						fontFamily: 'Inter',
						size: 18,
						lineHeight: 1.55,
						paragraphSpacing: 0,
						extra: [
							'selector { grid-column: 2; grid-row: 3; }',
							'@media (max-width: 767px) { selector { grid-column: 1; grid-row: auto; } }',
						],
					}),
					text({
						html: `<p><a href="${copy.knowledge.feature.url}">${copy.knowledge.feature.readLabel} →</a></p>`,
						editorTitle: 'knowledge-feature-cta',
						color: '#1D4ED8',
						linkColor: '#1D4ED8',
						linkHoverColor: '#1D4ED8',
						fontFamily: 'Inter',
						size: 16,
						weight: 500,
						lineHeight: 1.5,
						paragraphSpacing: 0,
						extra: [
							'selector { grid-column: 2; grid-row: 4; }',
							'selector a { text-decoration: none; }',
							'@media (max-width: 767px) { selector { grid-column: 1; grid-row: auto; } }',
						],
					}),
				],
			}),

			measure({
				title: 'knowledge-archive',
				layout: 'flex',
				direction: 'column',
				align: 'center',
				children: [
					button({
						label: copy.knowledge.viewAllLabel,
						href: copy.knowledge.viewAllHref,
						editorTitle: 'knowledge-archive-button',
						bg: '#FFFFFF',
						bgHover: '#1D4ED8',
						textColor: '#1D4ED8',
						textHoverColor: '#FFFFFF',
						border: { style: 'solid', width: 2, color: '#1D4ED8' },
						radius: 9999,
						padding: [12, 32, 12, 32],
						size: 16,
						weight: 600,
						lineHeight: 1.5,
					}),
				],
			}),
		],
	});
}

/* ------------------------------------------------------------------ *
 * §8 — Contact
 * ------------------------------------------------------------------ */

function contactInfoCard(entry, row) {
	return container({
		title: `contact-info-${entry.icon}`,
		id: `contact-info-${entry.icon}`,
		isInner: true,
		contentWidth: 'full',
		width: 100,
		layout: 'grid',
		columnsCustom: '48px 1fr',
		rows: 'auto auto auto',
		gap: [4, 16],
		gridAlignItems: 'start',
		padding: [24, 24, 24, 24],
		paddingTablet: [20, 20, 20, 20],
		bg: '#FFFFFF',
		radius: 16,
		shadow: shadow.lg,
		css: CARD_TRANSITION,
		cssHover: `box-shadow: ${shadow.xl};`,
		extra: [
			`selector { grid-column: 2; grid-row: ${row}; }`,
			'@media (max-width: 1024px) { selector { grid-column: 1; grid-row: auto; } }',
		],
		children: [
			icon({
				src: svg(media.svg.contact[entry.icon].id),
				size: 24,
				color: '#FFFFFF',
				editorTitle: `contact-${entry.icon}-icon`,
				extra: [
					'selector { grid-column: 1; grid-row: 1 / -1; width: 48px; height: 48px; padding: 12px; box-sizing: border-box; border-radius: 12px; background-image: linear-gradient(135deg, #2563EB 0%, #06B6D4 100%); box-shadow: 0px 8px 20px rgba(37,99,235,0.20); }',
				],
			}),
			heading({
				title: entry.title,
				tag: 'h4',
				editorTitle: `contact-${entry.icon}-heading`,
				color: '#0F172A',
				fontFamily: 'Inter',
				size: 16,
				weight: 600,
				lineHeight: 1.5,
				extra: ['selector { grid-column: 2; grid-row: 1; }'],
			}),
			text({
				html: entry.href
					? `<p><a href="${entry.href}">${entry.content}</a></p>`
					: `<p>${entry.content}</p>`,
				editorTitle: `contact-${entry.icon}-value`,
				color: '#334155',
				linkColor: '#334155',
				linkHoverColor: '#1D4ED8',
				fontFamily: 'Inter',
				size: 16,
				lineHeight: 1.5,
				paragraphSpacing: 0,
				extra: [
					'selector { grid-column: 2; grid-row: 2; }',
					'selector a { text-decoration: none; }',
				],
			}),
			text({
				html: `<p>${entry.description}</p>`,
				editorTitle: `contact-${entry.icon}-desc`,
				color: '#64748B',
				fontFamily: 'Inter',
				size: 14,
				lineHeight: 1.43,
				paragraphSpacing: 0,
				extra: ['selector { grid-column: 2; grid-row: 3; }'],
			}),
		],
	});
}

export function contact() {
	return sectionRoot({
		id: 'contact',
		title: 'Contact',
		bg: '#F8FAFC',
		bgGradient: { from: '#F8FAFC', to: '#EFF6FF', type: 'linear', angle: 135 },
		gap: 64,
		gapMobile: 40,
		children: [
			measure({
				title: 'contact-header',
				layout: 'flex',
				direction: 'column',
				align: 'center',
				gap: 24,
				children: [
					heading({
						title: `${copy.contact.titleLead}<span class="accent">${copy.contact.titleAccent}</span>`,
						tag: 'h2',
						editorTitle: 'contact-title',
						id: 'contact-title',
						color: '#0F172A',
						fontFamily: 'Inter',
						size: 48,
						sizeTablet: 40,
						sizeMobile: 36,
						weight: 700,
						lineHeight: 1.2,
						align: 'center',
						extra: ['selector .elementor-heading-title .accent { color: #1D4ED8; }'],
					}),
					text({
						html: `<p>${copy.contact.lead}</p>`,
						editorTitle: 'contact-subtitle',
						color: '#475569',
						fontFamily: 'Inter',
						size: 20,
						lineHeight: 1.4,
						align: 'center',
						paragraphSpacing: 0,
						css: 'max-width: 768px; margin-inline: auto;',
					}),
				],
			}),

			measure({
				title: 'contact-grid',
				layout: 'grid',
				columns: 2,
				columnsTablet: 1,
				rows: 'auto auto auto auto',
				gap: [24, 48],
				gapTablet: [24, 24],
				gridAlignItems: 'start',
				children: [
					container({
						title: 'contact-form-card',
						isInner: true,
						contentWidth: 'full',
						width: 100,
						layout: 'flex',
						direction: 'column',
						align: 'stretch',
						gap: 24,
						padding: [32, 32, 32, 32],
						paddingTablet: [24, 24, 24, 24],
						bg: '#FFFFFF',
						radius: 24,
						shadow: shadow.xl,
						extra: [
							'selector { grid-column: 1; grid-row: 1 / -1; }',
							'@media (max-width: 1024px) { selector { grid-column: 1; grid-row: auto; } }',
						],
						children: [
							heading({
								title: copy.contact.formTitle,
								tag: 'h3',
								editorTitle: 'contact-form-title',
								color: '#0F172A',
								fontFamily: 'Inter',
								size: 24,
								weight: 700,
								lineHeight: 1.33,
							}),
							form({
								name: 'Emifree Contact (EN)',
								editorTitle: 'contact-form',
								id: 'contact-form',
								fields: copy.contact.fields.map((field) => ({
									id: field.id,
									type: field.type,
									label: field.label,
									placeholder: field.placeholder,
									required: field.required,
								})),
								submitActions: ['email', 'collect-submissions'],
								emailTo: 'contact.website@emifree.com',
								emailFrom: 'info@emifree.com',
								emailFromName: 'Emifree',
								emailReplyTo: '[email]',
								emailSubject: 'New contact form submission from Emifree',
								emailContent:
									'Name: [name]\nEmail: [email]\nCompany: [company]\n\nMessage:\n[message]',
								emailContentType: 'plain',
								successMessage:
									'Thank you! We have received your message and will get back to you shortly.',
								errorMessage:
									'Something went wrong. Please try again, or email us directly at info@emifree.com.',
								rowGap: 6,
								labelColor: '#334155',
								labelType: {
									fontFamily: 'Inter',
									size: 14,
									weight: 600,
									lineHeight: 1.5,
								},
								fieldColor: '#0F172A',
								fieldBg: '#FFFFFF',
								fieldBorderColor: '#E2E8F0',
								fieldBorderWidth: 2,
								fieldRadius: 12,
								fieldType: {
									fontFamily: 'Inter',
									size: 16,
									lineHeight: 1.5,
								},
								buttonBg: '#2563EB',
								buttonTextColor: '#FFFFFF',
								buttonRadius: 12,
								buttonPadding: [16, 40, 16, 40],
								buttonType: {
									fontFamily: 'Inter',
									size: 18,
									weight: 600,
									lineHeight: 1.5,
								},
							}),
						],
					}),

					heading({
						title: copy.contact.infoTitle,
						tag: 'h3',
						editorTitle: 'contact-info-title',
						color: '#0F172A',
						fontFamily: 'Inter',
						size: 24,
						weight: 700,
						lineHeight: 1.33,
						extra: [
							'selector { grid-column: 2; grid-row: 1; }',
							'@media (max-width: 1024px) { selector { grid-column: 1; grid-row: auto; } }',
						],
					}),

					...copy.contact.info.map((entry, index) =>
						contactInfoCard(entry, index + 2),
					),
				],
			}),
		],
	});
}

/* ------------------------------------------------------------------ *
 * Document
 * ------------------------------------------------------------------ */

export const sectionBuilders = {
	hero,
	products,
	applications,
	technology,
	knowledge,
	contact,
};

export const SECTION_NAMES = Object.keys(sectionBuilders);

/** The id window each section owns, so the ids are stable per section. */
const SEED_WINDOW = 10000;

/**
 * Build one section on its own — the per-section template file.
 */
export function buildSection(name) {
	const builder = sectionBuilders[name];
	if (!builder) throw new Error(`buildSection: unknown section "${name}"`);

	resetIds(SEED_WINDOW * (SECTION_NAMES.indexOf(name) + 1));

	return builder();
}

/**
 * Build the whole page — every section, in the blueprint's order.
 */
export function buildSections() {
	const nodes = SECTION_NAMES.map((name) => {
		resetIds(SEED_WINDOW * (SECTION_NAMES.indexOf(name) + 1));
		return sectionBuilders[name]();
	});

	return nodes;
}

/** The full page template document. */
export function buildPage() {
	return compileDocument('Emifree Landing Page', buildSections());
}
