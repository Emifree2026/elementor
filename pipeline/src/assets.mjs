/**
 * Asset manifest for the generated Elementor templates.
 *
 * Two kinds of asset are referenced:
 *
 *  1. Media-Library attachments — referenced by numeric attachment id.
 *     Elementor's `e-image` / `e-svg` widgets only accept a library id, so
 *     these ids must exist on the target site. The filename is kept next to
 *     every id so the manifest can be re-mapped after a media re-import.
 *
 *  2. Theme files — referenced by absolute URL. Elementor resolves an SVG
 *     URL that lives under the site root by reading the file from disk and
 *     inlining it, so `stroke="currentColor"` icons keep working.
 */

/**
 * Site root.
 *
 * `url` must match the WordPress `siteurl` option, because Elementor's
 * SVG resolver (`Svg_Src_Transformer::resolve_local_path()`) compares an
 * SVG URL against `site_url()` before it will read the file from disk.
 * On this install `siteurl` is `http://landingwptest.local` while
 * `home` is `https://landingwptest.local` — the SVG URLs therefore use
 * the http form on purpose.
 *
 * Override at build time with `--site-url https://example.com`.
 */
export const site = {
	url: 'http://landingwptest.local',
	themePath: 'wp-content/themes/emifree-landing',
};

/** Absolute URL of a file inside the theme. */
export const themeUrl = (relative) => `${site.url}/${site.themePath}/${relative}`;

/**
 * Media Library attachment ids.
 *
 * `file`    — source filename in the media library, for re-mapping.
 * `size`    — the explicit WordPress image size the template requests.
 *             Never `full` unless the original is already web-sized, and
 *             never the raw upload (brief rule 4).
 */
export const media = {
	heroVideo: { id: 54, file: 'Video-Project-hero.mp4' },

	products: {
		// 600×792 source — already web-sized, `full` is the smallest
		// lossless copy.
		mechanical: { id: 78, file: 'fotom1.webp', size: 'full' },
		// 2560×1920 source — `medium_large` (768×576) covers the
		// 400 px card without shipping the 4 MB original.
		electrostatic: { id: 79, file: 'fotoe2.webp', size: 'medium_large' },
		// 1376×1824 source — `medium_large` (768×1018).
		dust: { id: 80, file: 'dust_filter-emi.png', size: 'medium_large' },
	},

	technology: {
		// 1024×1024 — `medium_large` (768×768).
		'eco-air': { id: 98, file: 'eco-air-self-cleaning-oil-mist-separator-diagram.webp', size: 'medium_large' },
		// 1376×768 — `medium_large` (768×429).
		earia: { id: 99, file: 'earia-electrostatic-air-filtration-diagram.webp', size: 'medium_large' },
	},

	knowledge: {
		// 1020×1360 — `medium_large` (768×1024).
		feature: { id: 127, file: 'hepa-1.webp', size: 'medium_large' },
	},

	svg: {
		arrowRight: { id: 81, file: 'arrow-right.svg' },
		chevronRight: { id: 113, file: 'chevron-right.svg' },
		chevronDown: { id: 90, file: 'chevron-down.svg' },
		check: { id: 100, file: 'check.svg' },
		moveRight: { id: 101, file: 'move-right.svg' },

		apps: {
			cnc: { id: 84, file: 'app-cnc.svg' },
			metal: { id: 85, file: 'app-metal.svg' },
			grinding: { id: 86, file: 'app-grinding.svg' },
			bearing: { id: 87, file: 'app-bearing.svg' },
			heavy: { id: 88, file: 'app-heavy.svg' },
			auto: { id: 89, file: 'app-auto.svg' },
		},

		knowledge: {
			award: { id: 109, file: 'award.svg' },
			bookMarked: { id: 110, file: 'book-marked.svg' },
			bookOpen: { id: 111, file: 'book-open.svg' },
			calendar: { id: 112, file: 'calendar.svg' },
			clock: { id: 114, file: 'clock.svg' },
			download: { id: 115, file: 'download.svg' },
			fileText: { id: 116, file: 'file-text.svg' },
			leaf: { id: 117, file: 'leaf.svg' },
			shield: { id: 124, file: 'shield.svg' },
			settings: { id: 123, file: 'settings.svg' },
			target: { id: 125, file: 'target.svg' },
			users: { id: 126, file: 'users.svg' },
		},

		contact: {
			mail: { id: 119, file: 'mail.svg' },
			phone: { id: 121, file: 'phone.svg' },
			mapPin: { id: 120, file: 'map-pin.svg' },
		},

		logos: {
			mercedes: { id: 65, file: 'mb_svg.svg' },
			bmw: { id: 66, file: 'bmw.svg' },
			gm: { id: 67, file: 'gm.svg' },
			nsk: { id: 68, file: 'NSK.svg' },
			knorr: { id: 69, file: 'knorr.svg' },
			siemens: { id: 70, file: 'siemens_logo.svg' },
		},
	},
};

/**
 * Public URL of every attachment the templates reference.
 *
 * Elementor's media control stores the URL next to the attachment id, and
 * the widget renders nothing when the URL is empty — so the manifest has
 * to carry both. The paths are relative to the uploads directory of the
 * site the media was imported into; `setSiteUrl()` re-points them.
 */
export const attachmentPaths = {
	54: '2026/10/Video-Project-hero.mp4',
	65: '2026/10/mb_svg-1.svg',
	66: '2026/10/bmw-1.svg',
	67: '2026/10/gm-1.svg',
	68: '2026/10/NSK-1.svg',
	69: '2026/10/knorr-1.svg',
	70: '2026/10/siemens_logo-1.svg',
	78: '2026/10/fotom1.webp',
	79: '2026/10/fotoe2-scaled.webp',
	80: '2026/10/dust_filter-emi.png',
	81: '2026/10/arrow-right.svg',
	84: '2026/10/app-cnc.svg',
	85: '2026/10/app-metal.svg',
	86: '2026/10/app-grinding.svg',
	87: '2026/10/app-bearing.svg',
	88: '2026/10/app-heavy.svg',
	89: '2026/10/app-auto.svg',
	90: '2026/10/chevron-down.svg',
	98: '2026/10/eco-air-self-cleaning-oil-mist-separator-diagram.webp',
	99: '2026/10/earia-electrostatic-air-filtration-diagram.webp',
	100: '2026/10/check.svg',
	101: '2026/10/move-right.svg',
	109: '2026/10/award.svg',
	110: '2026/10/book-marked.svg',
	111: '2026/10/book-open.svg',
	112: '2026/10/calendar.svg',
	113: '2026/10/chevron-right.svg',
	114: '2026/10/clock.svg',
	115: '2026/10/download.svg',
	116: '2026/10/file-text.svg',
	117: '2026/10/leaf.svg',
	119: '2026/10/mail.svg',
	120: '2026/10/map-pin.svg',
	121: '2026/10/phone.svg',
	123: '2026/10/settings.svg',
	124: '2026/10/shield.svg',
	125: '2026/10/target.svg',
	126: '2026/10/users.svg',
	127: '2026/10/hepa-1.webp',
};

/**
 * The public URL of an attachment, or null when the id is unknown.
 *
 * @param {number|string} id Attachment id.
 */
export function attachmentUrl(id) {
	const path = attachmentPaths[Number(id)];
	if (!path) return null;
	return `${site.url}/wp-content/uploads/${path}`;
}

/**
 * Icons that only exist as inline SVG inside the PHP templates.
 * They ship next to this compiler and are referenced by URL — Elementor
 * inlines them, so `stroke="currentColor"` keeps inheriting the CSS colour.
 */
export const themeIcons = {
	chipCycle: themeUrl('elementor-json/assets/chip-cycle.svg'),
	chipEnergy: themeUrl('elementor-json/assets/chip-energy.svg'),
	chipHepa: themeUrl('elementor-json/assets/chip-hepa.svg'),
};

/**
 * Theme files that are referenced by URL rather than by attachment id.
 *
 * `e-image` accepts an external `url` in its `image-src` prop (with an
 * explicit `alt`, which library images do not need), so a theme asset
 * needs no Media Library round-trip.
 */
export const themeImages = {
	berlin: {
		url: themeUrl('assets/icons/berlin.png'),
		alt: 'Based in Berlin',
	},
};

/**
 * Point every theme URL at another site.
 *
 * Used by `build.mjs --site-url https://example.com` so the templates can
 * be generated for a staging or production install without editing the
 * source.
 */
export function setSiteUrl(url) {
	const previous = site.url;
	site.url = url.replace(/\/+$/, '');

	themeIcons.chipCycle = themeUrl('elementor-json/assets/chip-cycle.svg');
	themeIcons.chipEnergy = themeUrl('elementor-json/assets/chip-energy.svg');
	themeIcons.chipHepa = themeUrl('elementor-json/assets/chip-hepa.svg');

	themeImages.berlin.url = themeUrl('assets/icons/berlin.png');

	catalog.ecoAirEn = themeUrl('assets/catalog/emifree_eco_air_cleaner_katalog_ENG_v4.2.pdf');
	catalog.ecoAirDe = themeUrl('assets/catalog/emifree_eco_air_cleaner_katalog_DE_v4.2.pdf');

	return previous;
}

/** Product brochures that actually exist in `assets/catalog/`. */
export const catalog = {
	ecoAirEn: themeUrl('assets/catalog/emifree_eco_air_cleaner_katalog_ENG_v4.2.pdf'),
	ecoAirDe: themeUrl('assets/catalog/emifree_eco_air_cleaner_katalog_DE_v4.2.pdf'),
};

/** Internal links, relative to the site root. */
export const links = {
	productsMechanical: '/en/products/mechanical/',
	productsElectrostatic: '/en/products/electrostatic/',
	productsDust: '/en/products/dust/',
	hepaArticle: '/en/knowledge/hepa-filters-cnc-industrial-workshops/',
	knowledgeInsights: '/en/knowledge/insights/',
	knowledgeAbout: '/en/knowledge/about/',
	knowledgeDownloads: '/en/knowledge/downloads/',
	knowledgeTools: '/en/knowledge/tools/',
	blog: '/blog/',
};
