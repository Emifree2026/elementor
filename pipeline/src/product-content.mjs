/**
 * Content for the three product landing pages (English).
 *
 * Every string here is copied VERBATIM from the PHP templates and the
 * helpers in `inc/products-page-helpers.php`. Nothing is invented and nothing
 * is paraphrased — including the quirks:
 *
 *   - "Our mechanical filtration system use centrifugal force…" (subject/verb
 *     disagreement, present in the source since 2026-10).
 *   - "Download the ECO AIR CLEANER  catalogue…" (double space before
 *     "catalogue").
 *   - The mechanical table says "Premium + HEPA" while the product schema
 *     description says "Basis and Premium variants" (a separate copy bug in
 *     `page-products-electrostatic.php`).
 *
 * When the PHP copy changes, this file changes with it. That is the point:
 * the PHP is the source of truth, this module is its transcription into the
 * Elementor build.
 *
 * Media keys refer to `pipeline/src/media-manifest.json`, which is written by
 * `scripts/sideload-product-media.php`.
 *
 * @module product-content
 */

/** Home / section URLs used across the product pages. */
export const URLS = {
	home: '/en/',
	products: '/en/#products',
	mechanical: '/en/products/mechanical/',
	electrostatic: '/en/products/electrostatic/',
	dust: '/en/products/dust/',
	contact: '/en/?quote=mechanical#contact',
};

/**
 * @typedef {object} ProductPage
 * @property {string}   slug
 * @property {string}   label        breadcrumb / page label
 * @property {string}   cssid        stable DOM id prefix (for JS scoping)
 * @property {object}   hero
 * @property {object}   [dimensions]
 * @property {object}   [performance]
 * @property {object}   [specs]
 * @property {object}   [brochure]
 * @property {object}   [crossLinks]
 */

/**
 * The right-rail navigator labels. Copied verbatim from the PHP templates
 * (`template-parts/page-products-mechanical.php` and its `_de` twin).
 */
export const NAV_LABELS = {
	top: 'To the top',
	dimensions: 'Dimensions',
	performance: 'Performance',
	specs: 'Specs',
	brochure: 'Brochure',
	up: 'Up',
};

/** The "Swipe to see all columns" hint above the specs table (mobile only). */
export const SWIPE_HINT = 'Swipe to see all columns';

/** @type {ProductPage[]} */
export const PRODUCTS = [
	{
		slug: 'mechanical',
		label: 'Mechanical',
		cssid: 'mech',
		backLabel: 'Back to home',
		navLabels: NAV_LABELS,
		sections: ['hero', 'dimensions', 'performance', 'specs', 'brochure'],
		hero: {
			backLink: URLS.home,
			breadcrumb: [
				{ text: 'Home', href: URLS.home },
				{ text: 'Products', href: URLS.products },
				{ text: 'Mechanical' },
			],
			eyebrow: 'Mechanical Filtration',
			h1: 'Industrial Oil Mist Extraction',
			cta: { text: 'Request a quote', href: '/en/?quote=mechanical#contact' },
			intro:
				'Our mechanical filtration system use centrifugal force to separate oil mist and coolant fumes directly at the source for heavy-duty CNC machining environments.',
			logo: 'mech-logo',
			gallery: ['mech-gallery-1', 'mech-gallery-2', 'mech-gallery-3'],
		},
		dimensions: {
			heading: 'Dimensions',
			lead: 'Mechanical drawings of the ECO AIR Cleaner in its standard and HEPA-equipped configurations. All measurements are in millimeters.',
			images: ['mech-dimension-1', 'mech-dimension-2', 'mech-dimension-3', 'mech-dimension-4'],
		},
		performance: {
			heading: 'Performance',
			lead: 'Pressure-loss / airflow curves for the two ECO AIR Cleaner variants. The red marker on each curve shows the unit\'s nominal operating point.',
			figures: [
				{ media: 'mech-performance-1', caption: '1200 m³/h' },
				{ media: 'mech-performance-2', caption: '1500 m³/h' },
			],
		},
		specs: {
			heading: 'Specs',
			lead: 'Technical comparison of the ECO AIR Cleaner in its two configurations: Advanced and Premium + HEPA. Optional variants and accessories are listed where applicable.',
			headers: ['Specification', 'Advanced', 'Premium + HEPA'],
			swipeHint: SWIPE_HINT,
			rows: [
				['Designation', 'EAC12-2 / EAC15-2 + CS-X-X', 'EAC12-2 / EAC15-2 + CS-C-F'],
				['Dimensions [L×W×H]', '818 × 466 × 566 mm', '818 × 470 × 961 mm'],
				['Airflow', 'up to 1200 / 1500 m³/h', '—'],
				['Electrical', '3-Ph. 400 V · 50/60 Hz', '3-Ph. 400 V · 50/60 Hz'],
				['Power', '1.5 kW (IE3)', '1.5 kW (IE3)'],
				['Current', '2.3 A', '2.3 A'],
				['Protection class', 'IP54', 'IP54'],
				['Noise level', '70 dB', '70 dB'],
				['Pipe connection', 'DN 200 mm (opt. DN 150 mm)', 'DN 200 mm (opt. DN 150 mm)'],
				['Standard color', 'RAL 7035 (opt. other RAL colors)', 'RAL 7035 (opt. other RAL colors)'],
				['Weight', '95 / 96 kg', '110 / 111 kg + 20 kg'],
				['Pre-filter', '✓', '✓'],
				['Cleaning system', '✓', '✓'],
				['Advanced control system', '—', '✓'],
				['Frequency converter', '—', '✓'],
			],
		},
		brochure: {
			heading: 'Brochure',
			lead: 'Download the ECO AIR CLEANER  catalogue for more information.',
			cardTitle: 'ECO AIR Cleaner Catalog',
			meta: ['v4.2', '·', '2.1 MB', '·', 'EN'],
			href: '/wp-content/themes/emifree-landing/assets/catalog/emifree_eco_air_cleaner_katalog_ENG_v4.2.pdf',
			linkLabel: 'Download PDF',
		},
		crossLinks: {
			heading: 'Other product lines',
			cards: [
				{
					title: 'Electrostatic Filtration',
					body: 'Sub-micron particle capture for smoke, fine mist, and industrial odor control.',
					href: URLS.electrostatic,
				},
				{
					title: 'Dust Filtration',
					body: 'Cartridge and baghouse solutions for woodworking, metal grinding, and bulk material handling.',
					href: URLS.dust,
				},
			],
			backLabel: 'Back to home',
			backHref: URLS.home,
		},
	},

	{
		slug: 'electrostatic',
		label: 'Electrostatic',
		cssid: 'elec',
		backLabel: 'Back to home',
		navLabels: NAV_LABELS,
		sections: ['hero', 'dimensions', 'performance', 'specs'],
		hero: {
			backLink: URLS.home,
			breadcrumb: [
				{ text: 'Home', href: URLS.home },
				{ text: 'Products', href: URLS.products },
				{ text: 'Electrostatic' },
			],
			eyebrow: 'Electrostatic Filtration',
			h1: 'Sub-Micron Particle Capture',
			cta: { text: 'Request Electrostatic Filtration Quote', href: '/en/?quote=electrostatic#contact' },
			intro:
				'The EARIA 1000 m³/h electrostatic precipitator captures sub-micron particles — smoke, fine mist, and industrial odor — directly at the source, with adjustable airflow and an optional touch-panel control system.',
			logo: 'elec-logo',
			gallery: ['elec-gallery-1', 'elec-gallery-2', 'elec-gallery-3'],
		},
		dimensions: {
			heading: 'Dimensions',
			lead: 'Mechanical drawings of the EARIA 1000 m³/h electrostatic precipitator in its standard and touch-panel configurations. All measurements are in millimeters.',
			images: ['elec-dimension-1', 'elec-dimension-2', 'elec-dimension-3'],
		},
		performance: {
			heading: 'Stop Losing Performance',
			lead: 'See the difference between standard filtration and the Emifree System. Our self-cleaning technology maintains a consistent cycle of high-efficiency filtration, while conventional systems suffer a permanent drop in efficiency.',
			figures: [{ media: 'elec-performance-1', caption: '' }],
		},
		specs: {
			heading: 'Specs',
			lead: 'Technical comparison of the EARIA 1000 m³/h in its two configurations: Basic and Premium.',
			headers: ['Version', 'Basic', 'Premium'],
			swipeHint: SWIPE_HINT,
			rows: [
				['Designation', 'EAR-10-CS-X', 'EAR-10-CS-X'],
				['Dimensions', '818 x 466 x 566 mm (L x W x H)', '818 x 466 x 566 mm [L x W x H]'],
				['Flow Rate', 'Adjustable up to 1000 m³/h', 'Adjustable up to 1000 m³/h'],
				['Flow Rate Adjustment', 'via potentiometer', 'via touch panel'],
				['Electrical', '1-Ph. 230 V 50/60 Hz', '3-phase 400 V 50/60 Hz'],
				['Power', '0.4 kW', '0.5 kW'],
				['Protection Class', 'IP54', 'IP54'],
				['Noise', '68 dB', '68 dB'],
				['Pipe Connection', 'DN 200 mm', 'DN 200 mm'],
				['Standard Color', 'RAL 9002 (opt. other RAL colors)', 'RAL 9002 (other RAL colors available)'],
				['Weight', '120 kg', '130 kg'],
				['Pre-filter', '✓', '✓'],
				['Cleaning System', '✓', '✓'],
				['Control System', '—', '✓'],
			],
		},
		crossLinks: {
			heading: 'Other product lines',
			cards: [
				{
					title: 'Mechanical Filtration',
					body: 'Self-cleaning centrifugal filtration for oil mist and coolant fumes at CNC machining sources.',
					href: URLS.mechanical,
				},
				{
					title: 'Dust Filtration',
					body: 'Cartridge and baghouse solutions for woodworking, metal grinding, and bulk material handling.',
					href: URLS.dust,
				},
			],
			backLabel: 'Back to home',
			backHref: URLS.home,
		},
	},

	{
		slug: 'dust',
		label: 'Dust',
		cssid: 'dust',
		backLabel: 'Back to home',
		navLabels: NAV_LABELS,
		sections: [],
		hero: {
			backLink: URLS.home,
			breadcrumb: [
				{ text: 'Home', href: URLS.home },
				{ text: 'Products', href: URLS.products },
				{ text: 'Dust', href: URLS.dust },
			],
			eyebrow: 'Dust Filtration',
			h1: 'Stop Dust at the Source',
			cta: { text: 'Request a quote', href: '/en/?quote=dust#contact' },
			intro: null,
			introList: [
				['Continuous 24/7 Operation', 'High-performance turbine built for non-stop industrial use.'],
				['Smart Volume Control', 'Frequency converter (FC) technology optimizes air flow and saves energy.'],
				['Zero-Downtime Cleaning', 'Automatic compressed air cleaning extends filter life dramatically.'],
				['Versatile Extraction', 'Handles welding fumes, grinding dust, and complex suspended particles.'],
			],
			logo: null,
			gallery: ['dust-gallery-1', 'dust-gallery-2', 'dust-gallery-3'],
		},
	},
];

/**
 * Look a product up by slug.
 * @param {string} slug
 * @returns {ProductPage}
 */
export function getProduct(slug) {
	const found = PRODUCTS.find((p) => p.slug === slug);
	if (!found) throw new Error(`unknown product slug: ${slug}`);
	return found;
}
