/**
 * Content for the three product landing pages (German).
 *
 * Every string here is copied VERBATIM from the German PHP templates
 * (`template-parts/page-products-*-de.php`) and the German branches of
 * the helpers in `inc/products-page-helpers.php`. Nothing is invented
 * and nothing is paraphrased — including the quirks:
 *
 *   - The mechanical spec table keeps the English column headers
 *     "Advanced" / "Premium + HEPA" inside the German sentence
 *     "… in zwei Ausführungen: Advanced und Premium + HEPA."
 *   - The electrostatic "Flow Rate Adjustment" row mixes languages:
 *     "über Potentiometer" (basic) / "via Touch-Panel" (premium).
 *   - The electrostatic "Standardfarbe" row repeats the same cell in
 *     both columns ("RAL 9002 (opt. andere RAL Farben)"), while the EN
 *     table differs between them ("other RAL colors available" in the
 *     Premium column).
 *   - The dust cross-link card is worded differently on the mechanical
 *     page ("Staubfiltration" / "… Metallschleiferei und Schüttgut.")
 *     than on the electrostatic page ("Entstaubung" / "… Metallschliff
 *     und Schüttguthandling.").
 *   - The mechanical hero intro has no subject/verb disagreement — the
 *     German copy reads "Unsere mechanische Filtrationsanlage nutzt …",
 *     whereas the EN string still says "system use centrifugal force".
 *   - The brochure lead has no double space (EN: "ECO AIR CLEANER
 *     catalogue"), and the file size is German-formatted ("2,1 MB").
 *
 * When the PHP copy changes, this file changes with it. That is the
 * point: the PHP is the source of truth, this module is its
 * transcription into the Elementor build.
 *
 * Structure is 1:1 with the English module (`product-content.mjs`):
 * same keys, same nesting, same order, for each of the three products.
 *
 * Media keys refer to `pipeline/src/media-manifest.json`, which is
 * written by `scripts/sideload-product-media.php`.
 *
 * ---------------------------------------------------------------------------
 * KNOWN DIVERGENCES between the DE and EN sources (not translation artefacts
 * — each of these was checked against the PHP and is reported as-is):
 *
 * 1. Quote slugs. FIXED 2026-11-04. The DE pages used to link with their
 *    translated URL slugs ('elektrostatische-filtration', 'entstaubung'),
 *    which `inc/atomic-form.php::emifree_contact_prefill_messages()` and
 *    the `functions.php` allowed-product list do not know — only
 *    'mechanical', 'electrostatic', 'dust' — so the DE electrostatic and
 *    DE dust CTAs silently did not prefill the contact form.
 *      - mechanical  → '/de/?quote=mechanical#contact'   ✓ whitelisted
 *      - electrostatic → '/de/?quote=electrostatic#contact'  ✓ (fixed)
 *      - dust       → '/de/?quote=dust#contact'              ✓ (fixed)
 *    The slug identifies the PRODUCT, not the language: the German page
 *    keeps the product key and the 'de' branch of the whitelist supplies
 *    the German label and message. This is the same convention the EN pages
 *    and the DE mechanical page already used.
 *    Fixed in template-parts/page-products-electrostatic-de.php and
 *    template-parts/page-products-dust-de.php; the module mirrors the fix.
 *
 * 2. Cross-link card for the dust line is worded differently on the two
 *    German pages, and the EN pages use one wording on both:
 *      - page-products-mechanical-de.php:487-488 → title "Staubfiltration",
 *        body "… für Holzbearbeitung, Metallschleiferei und Schüttgut."
 *      - page-products-electrostatic-de.php:320-321 → title "Entstaubung",
 *        body "… für Holzbearbeitung, Metallschliff und Schüttguthandling."
 *      - both EN pages → title "Dust Filtration", body "… for woodworking,
 *        metal grinding, and bulk material handling."
 *
 * 3. The mechanical spec table keeps the EN column names in the German
 *    lead sentence: "… in zwei Ausführungen: Advanced und Premium + HEPA."
 *    (page-products-mechanical-de.php:401). The table headers themselves
 *    are 'Spezifikation' / 'Advanced' / 'Premium + HEPA' (lines 411-413).
 *
 * 4. The electrostatic "Elektrik" row uses '3-Ph. 400 V 50/60 Hz' in DE
 *    (products-page-helpers.php:587) where EN writes '3-phase 400 V 50/60 Hz'
 *    (line 662) — the helper docblock records this as a per-language
 *    transcription, not a typo.
 *
 * 5. The electrostatic "Leistung" row mixes decimal separators inside one
 *    row: basic '0.4 kW' (dot), premium '0,5 kW' (comma)
 *    (products-page-helpers.php:591-592).
 *
 * 6. The electrostatic "Standardfarbe" row repeats one cell in both columns
 *    (products-page-helpers.php:611-612); the EN row differs between them
 *    (lines 685-686).
 *
 * 7. The electrostatic "Einstellung Volumenstrom" row mixes German and
 *    English in one row: 'über Potentiometer' / 'via Touch-Panel'
 *    (products-page-helpers.php:581-582).
 *
 * German strings with no rendered counterpart (helper data the templates
 * fetch but never echo — therefore not represented in this module either):
 *   - emifree_get_mechanical_applications('de') → 'CNC-Bearbeitung',
 *     'Schleifen', 'Drehen', 'Fräsen', 'Senkerodieren'. The DE mechanical
 *     template assigns the result to $emifree_applications
 *     (page-products-mechanical-de.php:49) but never echoes it; the EN
 *     template does not even call the helper.
 *   - emifree_get_mechanical_quotation_heading('de') → 'Angebot' and
 *     emifree_get_mechanical_quotation_intro('de') → 'Typische
 *     Anwendungsbereiche der ECO AIR Cleaner-Reihe:' — the quotation block
 *     was removed from both languages; no template calls these any more.
 *   - emifree_get_electrostatic_spec_image('de') → the earia_DE_final2.png
 *     spec-sheet PNG — the DE electrostatic page renders a structured
 *     table instead.
 *   - emifree_get_electrostatic_applications('de') → 'Ölnebel', 'Rauch',
 *     'Schweißrauch', 'Schleifstaub', 'Laserdämpfe' — no template calls it
 *     in either language.
 *
 * Chrome strings that differ between the two German pages themselves (also
 * outside the EN module's field set, so not represented here):
 *   - the floating back-to-top button reads "Nach oben" on the mechanical
 *     page (page-products-mechanical-de.php:305) but "Hoch" on the
 *     electrostatic page (page-products-electrostatic-de.php:199); both EN
 *     pages read "Up".
 *   - the mobile table hint reads "Wischen für mehr Spalten" on the
 *     mechanical page (line 405) and "Wischen, um alle Spalten zu sehen"
 *     on the electrostatic page (line 279); both EN pages read
 *     "Swipe to see all columns".
 *
 * ---------------------------------------------------------------------------
 * NOTE — language-specific media: the manifest currently only carries
 * the EN variants of the language-specific images. The five images the
 * German templates use instead are referenced here with the same key
 * scheme plus a `-de` suffix; those entries still have to be added to
 * `scripts/sideload-product-media.php` + `media-manifest.json`:
 *
 *   mech-dimension-4-de   → assets/products/mechanical/dimension-4-de.webp
 *                            alt: "ECO AIR Gehäuse mit Analoger
 *                            Differenzdruckanzeige-Callout (DE)"
 *   mech-performance-1-de → assets/products/mechanical/performance-1200-de.png
 *                            alt: "ECO AIR Cleaner Leistungskurve,
 *                            1200 m³/h Variante"
 *   mech-performance-2-de → assets/products/mechanical/performance-1500-de.png
 *                            alt: "ECO AIR Cleaner Leistungskurve,
 *                            1500 m³/h Variante"
 *   elec-dimension-3-de   → assets/products/electrostatic/earia-dim-3-de.jpg
 *                            alt: "EARIA Maße, Ansicht 3 — Montageansicht,
 *                            6 × M10 Befestigung"
 *   elec-performance-1-de → assets/products/electrostatic/earia-performance-de.png
 *                            alt: "Leistungsvergleich: Emifree-System mit
 *                            Selbstreinigung gegen konventionelles System
 *                            über die Zeit"
 *
 * @module product-content-de
 */

/** Home / section URLs used across the German product pages. */
export const URLS_DE = {
	home: '/de/',
	products: '/de/#produkte',
	mechanical: '/de/produkte/mechanische-filtration/',
	electrostatic: '/de/produkte/elektrostatische-filtration/',
	dust: '/de/produkte/entstaubung/',
	contact: '/de/?quote=mechanical#contact',
};

/**
 * @typedef {object} ProductPageDe
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

/** @type {ProductPageDe[]} */
export const PRODUCTS_DE = [
	{
		slug: 'mechanical',
		label: 'Mechanische Filtration',
		cssid: 'mech',
		hero: {
			backLink: URLS_DE.home,
			breadcrumb: [
				{ text: 'Startseite', href: URLS_DE.home },
				{ text: 'Produkte', href: URLS_DE.products },
				{ text: 'Mechanische Filtration' },
			],
			eyebrow: 'Mechanische Filtration',
			h1: 'Industrielle Ölnebelabscheidung',
			cta: { text: 'Angebot anfordern', href: '/de/?quote=mechanical#contact' },
			intro:
				'Unsere mechanische Filtrationsanlage nutzt Zentrifugalkraft, um Ölnebel und Kühlschmierstoffdämpfe direkt an der Quelle abzuscheiden, für anspruchsvolle CNC-Zerspanungsumgebungen.',
			logo: 'mech-logo',
			gallery: ['mech-gallery-1', 'mech-gallery-2', 'mech-gallery-3'],
		},
		dimensions: {
			heading: 'Abmessungen',
			lead: 'Technische Zeichnungen des ECO AIR Cleaners in der Standard- und HEPA-Ausführung. Alle Maße in Millimetern.',
			images: ['mech-dimension-1', 'mech-dimension-2', 'mech-dimension-3', 'mech-dimension-4-de'],
		},
		performance: {
			heading: 'Leistungskurve',
			lead: 'Druckverlust- / Volumenstrom-Kennlinien der beiden ECO AIR Cleaner-Varianten. Die rote Markierung auf jeder Kurve zeigt den Nennarbeitspunkt des Geräts.',
			figures: [
				{ media: 'mech-performance-1-de', caption: '1200 m³/h' },
				{ media: 'mech-performance-2-de', caption: '1500 m³/h' },
			],
		},
		specs: {
			heading: 'Spezifikation',
			lead: 'Technischer Vergleich des ECO AIR Cleaners in zwei Ausführungen: Advanced und Premium + HEPA. Optionale Varianten und Zubehör sind entsprechend gekennzeichnet.',
			headers: ['Spezifikation', 'Advanced', 'Premium + HEPA'],
			rows: [
				['Bezeichnung', 'EAC12-2 / EAC15-2 + CS-X-X', 'EAC12-2 / EAC15-2 + CS-C-F'],
				['Abmessungen [L×B×H]', '818 × 466 × 566 mm', '818 × 470 × 961 mm'],
				['Luftleistung', 'bis zu 1200 / 1500 m³/h', '—'],
				['Elektrik', '3-Ph. 400 V · 50/60 Hz', '3-Ph. 400 V · 50/60 Hz'],
				['Leistung', '1,5 kW (IE3)', '1,5 kW (IE3)'],
				['Stromstärke', '2,3 A', '2,3 A'],
				['Schutzart', 'IP54', 'IP54'],
				['Schallpegel', '70 dB', '70 dB'],
				['Rohranschluss', 'DN 200 mm (opt. DN 150 mm)', 'DN 200 mm (opt. DN 150 mm)'],
				['Standardfarbe', 'RAL 7035 (opt. weitere RAL-Farben)', 'RAL 7035 (opt. weitere RAL-Farben)'],
				['Gewicht', '95 / 96 kg', '110 / 111 kg + 20 kg'],
				['Vorfilter', '✓', '✓'],
				['Reinigungssystem', '✓', '✓'],
				['Erweitertes Steuerungssystem', '—', '✓'],
				['Frequenzumrichter', '—', '✓'],
			],
		},
		brochure: {
			heading: 'Broschüre',
			lead: 'Laden Sie den ECO AIR CLEANER Katalog für weitere Informationen herunter.',
			cardTitle: 'ECO AIR Cleaner Katalog',
			meta: ['v4.2', '·', '2,1 MB', '·', 'DE'],
			href: '/wp-content/themes/emifree-landing/assets/catalog/emifree_eco_air_cleaner_katalog_DE_v4.2.pdf',
			linkLabel: 'PDF herunterladen',
		},
		crossLinks: {
			heading: 'Weitere Produktlinien',
			cards: [
				{
					title: 'Elektrostatische Filtration',
					body: 'Abscheidung sub-mikroner Partikel für Rauch, Feinnebel und industrielle Geruchsbelastung.',
					href: URLS_DE.electrostatic,
				},
				{
					title: 'Staubfiltration',
					body: 'Patronen- und Schlauchfilterlösungen für Holzbearbeitung, Metallschleiferei und Schüttgut.',
					href: URLS_DE.dust,
				},
			],
			backLabel: 'Zurück zur Startseite',
			backHref: URLS_DE.home,
		},
	},

	{
		slug: 'electrostatic',
		label: 'Elektrostatische Filtration',
		cssid: 'elec',
		hero: {
			backLink: URLS_DE.home,
			breadcrumb: [
				{ text: 'Startseite', href: URLS_DE.home },
				{ text: 'Produkte', href: URLS_DE.products },
				{ text: 'Elektrostatische Filtration' },
			],
			eyebrow: 'Elektrostatische Filtration',
			h1: 'Submikron-Partikelabscheidung',
			cta: { text: 'Angebot anfordern', href: '/de/?quote=electrostatic#contact' },
			intro:
				'Der EARIA 1000 m³/h Elektroabscheider scheidet submikrone Partikel — Rauch, Feinstnebel und industrielle Gerüche — direkt an der Quelle ab, mit einstellbarem Volumenstrom und optionalem Touch-Panel-Kontrollsystem.',
			logo: 'elec-logo',
			gallery: ['elec-gallery-1', 'elec-gallery-2', 'elec-gallery-3'],
		},
		dimensions: {
			heading: 'Abmessungen',
			lead: 'Maßzeichnungen des EARIA 1000 m³/h Elektroabscheiders in Standard- und Touch-Panel-Ausführung. Alle Maße in Millimetern.',
			images: ['elec-dimension-1', 'elec-dimension-2', 'elec-dimension-3-de'],
		},
		performance: {
			heading: 'Kein Leistungsverlust mehr',
			lead: 'Vergleichen Sie die Standardfiltration mit dem Emifree-System. Unsere Selbstreinigungstechnologie erhält einen konstanten Zyklus hocheffizienter Filtration, während konventionelle Systeme einen dauerhaften Effizienzverlust erleiden.',
			figures: [{ media: 'elec-performance-1-de', caption: '' }],
		},
		specs: {
			heading: 'Spezifikation',
			lead: 'Technischer Vergleich der EARIA 1000 m³/h in zwei Ausführungen: Basis und Premium.',
			headers: ['Version', 'Basis', 'Premium'],
			rows: [
				['Bezeichnung', 'EAR-10-CS-X', 'EAR-10-CS-X'],
				['Abmessungen', '818 x 466 x 566 mm (L x W x H)', '818 x 466 x 566 mm [L x W x H]'],
				['Volumenstrom', 'einstellbar, bis 1000 m³/h', 'einstellbar, bis 1000 m³/h'],
				['Einstellung Volumenstrom', 'über Potentiometer', 'via Touch-Panel'],
				['Elektrik', '1-Ph. 230 V 50/60 Hz', '3-Ph. 400 V 50/60 Hz'],
				['Leistung', '0.4 kW', '0,5 kW'],
				['Schutzklasse', 'IP54', 'IP54'],
				['Geräusch', '68 dB', '68 dB'],
				['Rohranschluss', 'DN 200 mm', 'DN 200 mm'],
				['Standardfarbe', 'RAL 9002 (opt. andere RAL Farben)', 'RAL 9002 (opt. andere RAL Farben)'],
				['Gewicht', '120 kg', '130 kg'],
				['Vorfilter', '✓', '✓'],
				['Reinigungssystem', '✓', '✓'],
				['Kontrollsystem', '—', '✓'],
			],
		},
		crossLinks: {
			heading: 'Weitere Produktlinien',
			cards: [
				{
					title: 'Mechanische Filtration',
					body: 'Selbstreinigende Zentrifugalfiltration für Ölnebel und Kühlschmierstoffdämpfe an CNC-Bearbeitungsmaschinen.',
					href: URLS_DE.mechanical,
				},
				{
					title: 'Entstaubung',
					body: 'Patronen- und Schlauchfilterlösungen für Holzbearbeitung, Metallschliff und Schüttguthandling.',
					href: URLS_DE.dust,
				},
			],
			backLabel: 'Zurück zur Startseite',
			backHref: URLS_DE.home,
		},
	},

	{
		slug: 'dust',
		label: 'Staub',
		cssid: 'dust',
		hero: {
			backLink: URLS_DE.home,
			breadcrumb: [
				{ text: 'Startseite', href: URLS_DE.home },
				{ text: 'Produkte', href: URLS_DE.products },
				{ text: 'Staub', href: URLS_DE.dust },
			],
			eyebrow: 'Staubfiltration',
			h1: 'Staub direkt an der Quelle stoppen',
			cta: { text: 'Angebot anfordern', href: '/de/?quote=dust#contact' },
			intro: null,
			introList: [
				['Dauerbetrieb 24/7', 'Hochleistungsturbine für den industriellen Non-Stop-Einsatz.'],
				['Intelligente Volumenregelung', 'Frequenzumrichter (FC) optimiert den Luftstrom und spart Energie.'],
				['Null-Ausfallzeit-Reinigung', 'Automatische Druckluftabreinigung verlängert die Filterlebensdauer erheblich.'],
				['Vielseitige Absaugung', 'Erfasst Schweißrauch, Schleifstaub und komplexe Schwebstoffe.'],
			],
			logo: null,
			gallery: ['dust-gallery-1', 'dust-gallery-2', 'dust-gallery-3'],
		},
	},
];

/**
 * Look a German product up by slug.
 * @param {string} slug
 * @returns {ProductPageDe}
 */
export function getProductDe(slug) {
	const found = PRODUCTS_DE.find((p) => p.slug === slug);
	if (!found) throw new Error(`unknown product slug: ${slug}`);
	return found;
}
