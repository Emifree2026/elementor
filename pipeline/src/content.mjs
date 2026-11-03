/**
 * Copy + structured data for the generated Elementor templates.
 *
 * Everything here is transcribed from the legacy PHP theme — the data
 * arrays in `inc/*.php` and the markup in `template-parts/section-*.php`.
 * Keeping the copy in one module means the section builders stay purely
 * structural and a copy change never touches layout code.
 *
 * English strings only: `specs/design-tokens.md` §0 states that the EN
 * siblings are authoritative and the DE variants are the same layout with
 * German strings, so one template covers both locales.
 */

export const hero = {
	headline: 'Low maintenance air filtration solutions',
	chips: [
		{
			id: 'cycle',
			label: 'Self-cleaning',
			icon: 'cycle',
			href: '#technology',
			ariaSuffix: 'see the technology behind it',
		},
		{
			id: 'energy',
			label: 'Energy Saving',
			icon: 'energy',
			href: null,
			ariaSuffix: null,
		},
		{
			id: 'hepa',
			label: 'HEPA filter',
			icon: 'hepa',
			href: '/en/knowledge/hepa-filters-cnc-industrial-workshops/',
			ariaSuffix: 'learn about HEPA filters in CNC workshops',
		},
	],
	secondaryLabel: 'See the technology behind it →',
	primaryLabel: 'Contact Us!',
	logosLabel: 'Trusted by industry leaders',
	logos: [
		{ name: 'Mercedes-Benz', file: 'mb_svg.svg', max: 'clamp(28px, 4.5vw, 50px)' },
		{ name: 'BMW', file: 'bmw.svg', max: 'clamp(30px, 5vw, 55px)' },
		{ name: 'GM', file: 'gm.svg', max: 'clamp(30px, 5vw, 55px)' },
		{ name: 'NSK', file: 'NSK.svg', max: 'clamp(45px, 8vw, 100px)' },
		{ name: 'Knorr-Bremse', file: 'knorr.svg', max: 'clamp(60px, 11vw, 130px)' },
		{ name: 'Siemens', file: 'siemens_logo.svg', max: 'clamp(55px, 9vw, 100px)' },
	],
};

export const products = {
	title: 'Industrial Air Filtration Product Range',
	lead:
		'Professional-grade filtration systems designed for CNC workshops, metalworking shops, and industrial manufacturing environments.',
	cards: [
		{
			id: 'mechanical',
			title: 'Mechanical Filtration',
			href: '/en/products/mechanical/',
			ariaLabel: 'Mechanical Filtration — view category',
		},
		{
			id: 'electrostatic',
			title: 'Electrostatic Filtration',
			href: '/en/products/electrostatic/',
			ariaLabel: 'Electrostatic Filtration — view category',
		},
		{
			id: 'dust',
			title: 'Dust Filtration',
			href: '/en/products/dust/',
			ariaLabel: 'Dust Filtration — view category',
		},
	],
	ctaLabel: 'Learn more',
};

export const applications = {
	title: 'Industrial Air Filtration for Every Application',
	lead:
		'From small tool shops to large manufacturing facilities, Emifree systems capture oil mist, welding fumes, and dust at the source.',
	ctaLabel: 'Find Your Solution',
	ctaHref: '#products',
	// Link inside every collapsed application card. The PHP gives the
	// <article> a `tabindex="0"` so tapping it expands the card; Elementor
	// atomic containers cannot render a tabindex, so this link takes that
	// role and points at the products section of the same page.
	cardCtaLabel: 'Find the right solution →',
	cards: [
		{
			id: 'cnc',
			icon: 'cnc',
			title: 'CNC Machining & Tool Shops',
			description:
				'Remove oil mist and coolant fumes from CNC lathes, mills, and routers without stopping production. Keep your machines clean and operators healthy.',
			question: 'How do I remove oil mist from my CNC machine without stopping production?',
		},
		{
			id: 'metal',
			icon: 'metal',
			title: 'Metalworking & Welding',
			description:
				'Capture welding fumes, metal dust, and grinding particles at the source. Protect your workforce from harmful particulates and meet EU safety standards.',
			question: 'What is the best way to filter welding fumes in a small workshop?',
		},
		{
			id: 'grinding',
			icon: 'grinding',
			title: 'Grinding & Polishing',
			description:
				'Extract abrasive dust from surface grinding, cylindrical grinding, and polishing operations. Extend equipment lifespan and improve surface finish quality.',
			question: 'How to control dust from surface grinding machines?',
		},
		{
			id: 'bearing',
			icon: 'bearing',
			title: 'Bearing & Precision Parts Manufacturing',
			description:
				'Maintain clean air in bearing production, gear manufacturing, and precision engineering. Protect sensitive components from contamination.',
			question: 'Best air filtration for bearing manufacturing clean rooms',
		},
		{
			id: 'heavy',
			icon: 'heavy',
			title: 'Heavy Industry & Metal Fabrication',
			description:
				'Handle high-volume dust and mist generation in fabrication shops, press rooms, and assembly lines. Industrial-grade filtration for demanding environments.',
			question: 'Industrial dust extraction system for metal fabrication shop',
		},
		{
			id: 'auto',
			icon: 'auto',
			title: 'Automotive',
			description:
				'Capture oil mist, coolant aerosol, and welding fumes from automotive production lines. Keep paint booths particle-free and EV battery assembly clean room compliant.',
			question:
				'Best air filtration system for automotive manufacturing plant oil mist and welding fume extraction',
		},
	],
};

export const technology = {
	titleLead: 'Choose the Right ',
	titleAccent: 'Filtration Technology',
	titleTail: ' for Your Process',
	lead:
		'Whether you handle oil mist, emulsions, smoke, or ultra-fine aerosols, our self-cleaning filtration systems deliver cleaner air, lower maintenance, and stable performance.',
	note: 'Compare technologies below or jump directly to the right solution.',
	technologies: [
		{
			id: 'eco-air',
			badge: 'Best for Oil Mist & Emulsions',
			badgeBg: '#FEF3C7',
			badgeFg: '#92400E',
			title: 'ECO AIR CLEANER',
			subtitle: 'Mechanical Oil Mist Separator',
			description:
				'Constant suction performance through self-cleaning mechanical filtration and oil recycling.',
			bullets: [
				'Self-cleaning system',
				'No filter mats',
				'Oil recycling',
				'Up to 1,500 m³/h',
			],
			anchor: 'technology-eco-air',
			ctaLabel: 'Learn How It Works',
			processTitle: 'How ECO AIR Works',
			processSubtitle: 'Mechanical separation + coalescence',
			steps: [
				{
					title: 'Pre-Filtration',
					desc: 'Stainless steel mesh captures larger droplets before separation.',
				},
				{
					title: 'Coalescence',
					desc: 'Rotating drums enlarge tiny oil particles into larger droplets for efficient separation and oil recovery.',
				},
				{
					title: 'Self-Cleaning & Recycling',
					desc: 'Integrated spraying nozzles maintain constant performance and recycle collected oil.',
				},
			],
		},
		{
			id: 'earia',
			badge: 'Best for Smoke & Fine Aerosols',
			badgeBg: '#F3E8FF',
			badgeFg: '#6B21A8',
			title: 'EARIA',
			subtitle: 'Electrostatic Filtration System',
			description:
				'Electrostatic filtration for smoke, oil mist and ultra-fine particles with minimal maintenance.',
			bullets: [
				'Smoke & aerosol capture',
				'Electrostatic filtration',
				'No cartridge exchange',
				'Adjustable up to 1000 m³/h',
			],
			anchor: 'technology-earia',
			ctaLabel: 'Learn How It Works',
			processTitle: 'How EARIA Works',
			processSubtitle: 'Electrostatic filtration',
			steps: [
				{
					title: 'Stainless steel pre-filter',
					desc: 'First stage captures larger particles to protect ionizer.',
				},
				{
					title: 'Ionization',
					desc: 'High voltage ionizer charges particles for electrostatic capture.',
				},
				{
					title: 'Collector plates',
					desc: 'Alternating plates attract and hold charged particles.',
				},
				{
					title: 'Oil particle collection',
					desc: 'Self-cleaning drain removes collected oil automatically.',
				},
			],
		},
	],
	ctaTitle: 'Not sure which filtration technology fits your application?',
	ctaBody:
		"Tell us your contamination type, airflow requirements, or machine setup, we'll recommend the right solution.",
	ctaPrimaryLabel: 'Get expert recommendation',
	ctaSecondaryLabel: 'View more Technical Specs',
};

export const knowledge = {
	titleLead: 'Resources & ',
	titleAccent: 'Knowledge',
	lead:
		'Explore our latest insights, company updates, and technical resources to stay informed about industrial air filtration.',
	ctaLabel: 'Open Our Free Engineering Tools',
	ctaHref: '/en/knowledge/tools/',
	tabs: [
		{ id: 'blog', label: 'Industry Insights', icon: 'bookOpen', href: '/en/knowledge/insights/' },
		{ id: 'about', label: 'About Us', icon: 'users', href: '/en/knowledge/about/' },
		{ id: 'downloads', label: 'Downloads', icon: 'download', href: '/en/knowledge/downloads/' },
	],
	feature: {
		url: '/en/knowledge/hepa-filters-cnc-industrial-workshops/',
		title: 'HEPA Filters in CNC &amp; Industrial Workshops: Uses, Limits &amp; Safety',
		category: 'Safety Guide',
		date: 'October 14, 2026',
		readTime: '6 min read',
		excerpt:
			'How HEPA filters control fine dust in CNC and industrial workshops — what they capture, what they don’t (gases, vapors, oil mist), and the combustible-dust safety rules you need to follow before installing one.',
		readLabel: 'Read article',
	},
	viewAllLabel: 'View All Articles',
	viewAllHref: '/blog/',
	story: {
		title: 'Our Story',
		body:
			'Founded in Berlin in 2010, Emifree GmbH emerged from a vision to create filtration solutions that balance industrial performance with environmental responsibility. What started as a small engineering team focused on CNC machining applications has grown into a global leader in air filtration technology.',
		stats: [
			{ value: '2010', label: 'Founded' },
			{ value: '500+', label: 'Clients Worldwide' },
			{ value: '15+', label: 'Countries' },
		],
		imageAlt: 'Based in Berlin',
		imageCaption: 'Based in Berlin, Germany',
		imageSub: 'Serving industry worldwide since 2010',
	},
	mission: {
		title: 'Our Mission',
		lead:
			'We believe that clean air is a fundamental right in every workplace. Our mission is to develop innovative filtration technologies that protect workers, reduce environmental impact, and help industries operate more sustainably.',
		values: [
			{
				icon: 'leaf',
				title: 'Sustainability',
				desc: 'Designing products that minimize environmental footprint',
			},
			{
				icon: 'shield',
				title: 'Safety First',
				desc: 'Protecting worker health with proven filtration efficiency',
			},
			{
				icon: 'settings',
				title: 'Innovation',
				desc: 'Continuously improving our technology and processes',
			},
			{
				icon: 'target',
				title: 'Reliability',
				desc: 'Delivering consistent performance our customers can trust',
			},
		],
	},
	clientsTitle: 'Trusted by Industry Leaders',
	clients: [
		'Mercedes-Benz',
		'BMW',
		'General Motors',
		'NSK Bearings',
		'Knorr-Bremse',
		'Siemens',
		'Bosch',
		'ThyssenKrupp',
	],
	brochuresTitle: 'Product Brochures',
	brochures: [
		{
			title: 'ECO AIR Cleaner Catalog',
			lang: 'EN',
			size: '2.1 MB',
			file: 'emifree_eco_air_cleaner_katalog_ENG_v4.2.pdf',
			available: true,
		},
		{
			title: 'ECO AIR Cleaner Katalog',
			lang: 'DE',
			size: '2.1 MB',
			file: 'emifree_eco_air_cleaner_katalog_DE_v4.2.pdf',
			available: true,
		},
		{
			title: 'EARIA Electrostatic Catalog',
			lang: 'EN',
			size: '3.8 MB',
			file: 'earia-catalog-en.pdf',
			available: false,
		},
		{
			title: 'Full Product Range 2026',
			lang: 'EN',
			size: '12.5 MB',
			file: 'full-range-2026.pdf',
			available: false,
		},
	],
	customDocTitle: 'Need Custom Documentation?',
	customDocLead:
		"Can't find what you're looking for? Contact our technical team for custom datasheets, CAD drawings, or specific documentation for your application.",
	customDocCta: 'Contact Technical Support',
	customDocHref: '#contact',
};

export const contact = {
	titleLead: 'Ready for ',
	titleAccent: 'cleaner air?',
	lead:
		'Plan your next filtration project with us and schedule a free consultation with our engineering team.',
	formTitle: 'Send us a message',
	fields: [
		{ id: 'name', label: 'Name', placeholder: 'Your Name', type: 'text', required: true },
		{ id: 'email', label: 'Email', placeholder: 'Your Email', type: 'email', required: true },
		{ id: 'company', label: 'Company Name', placeholder: 'Company Name', type: 'text', required: true },
		{
			id: 'message',
			label: 'Message',
			placeholder: 'Tell us about your project...',
			type: 'textarea',
			required: true,
		},
	],
	submitLabel: 'Send Message',
	infoTitle: 'Get in touch',
	info: [
		{
			icon: 'mail',
			title: 'Email Us',
			content: 'info@emifree.com',
			description: 'Send us an email anytime',
			href: 'mailto:info@emifree.com',
		},
		{
			icon: 'phone',
			title: 'Call Us',
			content: '+49 307 628 3520',
			description: 'Mon-Fri from 8am to 6pm',
			href: 'tel:+493076283520',
		},
		{
			icon: 'mapPin',
			title: 'Direction',
			content: 'Pestalozzistraße 13',
			description: '12557 Berlin, Germany.',
			href: null,
		},
	],
};
