/**
 * Emifree design tokens.
 *
 * Source of truth: `wp-content/themes/emifree-landing/specs/design-tokens.md`
 * (extracted 2026-11-02 from the legacy PHP theme).
 *
 * Values are the *resolved* Tailwind v3 values, not class names — the
 * tokens file is what an Elementor global-variable pass should mirror
 * (see README.md §"Global tokens").
 */

export const color = {
	// Brand
	primary: '#1D4ED8', // blue-700
	'primary-strong': '#1E40AF', // blue-800
	'primary-action': '#2563EB', // blue-600
	secondary: '#06B6D4', // cyan-500
	'secondary-deep': '#0891B2', // cyan-600

	// Text
	'text-heading': '#0F172A', // slate-900
	'text-heading-alt': '#18181B', // zinc-900
	'text-body': '#475569', // slate-600
	'text-body-alt': '#52525B', // zinc-600
	'text-muted': '#64748B', // slate-500
	'text-subtle': '#A1A1AA', // zinc-400
	'text-on-dark': '#FFFFFF',
	'accent-link': '#2563EB', // blue-600
	'accent-link-hover': '#1D4ED8', // blue-700
	'accent-soft': '#93C5FD', // blue-300

	// Surfaces
	'bg-light': '#FFFFFF',
	'bg-light-alt': '#F8FAFC', // slate-50
	'bg-tint': '#EFF6FF', // blue-50
	'bg-dark': '#0F172A',
	'bg-dark-deep': '#1E293B',
	'bg-footer': '#18181B',
	'bg-hero': '#0A0A0A',

	// Borders
	'border-subtle': '#F1F5F9', // slate-100
	'border-default': '#E2E8F0', // slate-200
	'border-strong': '#CBD5E1', // slate-300

	// Status
	'status-success': '#059669', // emerald-600
	'status-warning-bg': '#FEF3C7', // amber-100
	'status-warning-fg': '#92400E', // amber-800
	'status-info-bg': '#F3E8FF', // purple-100
	'status-info-fg': '#6B21A8', // purple-800
	'status-error': '#EF4444', // red-500

	// White with alpha (hero chips, scrims)
	'white-10': 'rgba(255,255,255,0.10)',
	'white-20': 'rgba(255,255,255,0.20)',
	'white-25': 'rgba(255,255,255,0.25)',
	'white-45': 'rgba(255,255,255,0.45)',
	'white-60': 'rgba(255,255,255,0.60)',
};

/** Gradients (design-tokens.md §2.4). */
export const gradient = {
	brand: 'linear-gradient(90deg, #1D4ED8 0%, #06B6D4 100%)',
	tile: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)',
	'card-footer': 'linear-gradient(180deg, #2563EB 0%, #1E40AF 100%)',
	'card-footer-hover': 'linear-gradient(180deg, #1D4ED8 0%, #1E3A8A 100%)',
	ambient: 'linear-gradient(to bottom right, #F8FAFC 0%, #FFFFFF 50%, #EFF6FF 100%)',
	'hero-scrim': 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.50) 50%, rgba(0,0,0,0.70) 100%)',
	'hero-emerald': 'linear-gradient(to bottom right, rgba(16,185,129,0.05) 0%, transparent 100%)',
};

/** Shadows (design-tokens.md §3.5). */
export const shadow = {
	md: '0px 4px 6px -1px rgba(0,0,0,0.1), 0px 2px 4px -2px rgba(0,0,0,0.1)',
	lg: '0px 10px 15px -3px rgba(0,0,0,0.1), 0px 4px 6px -4px rgba(0,0,0,0.1)',
	xl: '0px 20px 25px -5px rgba(0,0,0,0.1), 0px 10px 10px -5px rgba(0,0,0,0.04)',
	'2xl': '0px 25px 50px -12px rgba(0,0,0,0.25)',
	'tile-glow': '0px 10px 25px rgba(37,99,235,0.25)',
	'cta-glow': '0px 10px 25px rgba(6,182,212,0.25)',
	'contact-icon-glow': '0px 8px 20px rgba(37,99,235,0.20)',
	'badge-shadow': '0px 4px 16px rgba(0,0,0,0.35)',
};

/** Spacing / layout (design-tokens.md §3.2–§3.3). */
export const space = {
	containerMax: '1280px',
	contentMax: '768px',
	contentMaxXl: '896px',
	contentMaxSm: '672px',
	sectionPaddingMobile: '48px',
	sectionPaddingDesktop: '96px',
	gutterMobile: '16px',
	gutterTablet: '24px',
	gutterDesktop: '32px',
	gridGap: '24px',
	gridGapLg: '32px',
	splitGap: '48px',
	cardPadding: '24px',
	cardPaddingDesktop: '32px',
};

/** Radii (design-tokens.md §3.4). */
export const radius = {
	full: '9999px',
	'3xl': '24px',
	'2xl': '16px',
	xl: '12px',
};

/** Motion (design-tokens.md §4). */
export const motion = {
	fast: '200ms',
	base: '300ms',
	slow: '500ms',
	easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
	// Brief rule 3 — card hover lift easing.
	hoverEase: 'cubic-bezier(0.16, 1, 0.3, 1)',
};

/** Breakpoints (design-tokens.md §3.1) → Elementor breakpoint names. */
export const breakpoint = {
	desktop: 'desktop',
	tablet: 'tablet', // ≥768px
	mobile: 'mobile',
};
