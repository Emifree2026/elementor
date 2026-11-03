# Emifree — Section Inventory / Migration Map (PHP → Elementor)

**Source of truth:** legacy PHP theme `emifree-landing`
`C:\Users\vpedr\Local Sites\landingwptest\app\public\wp-content\themes\emifree-landing`

**Scope:** the English front page `/en/` — `front-page.php` → `template-parts/section-*.php`,
wrapped by `header.php` / `footer.php`.

**Extraction date:** 2026-11-02

**Companion doc:** `specs/design-tokens.md` (all colour / type values referenced here resolve to a
token there).

**PHP logic stripped:** every `foreach`, `if`, `esc_html`, `get_template_part` and data-lookup has
been resolved to its **literal rendered value**. The `data-emifree-*` hooks are kept because they are
the contract for behaviour — they are listed per section and in §11.

---

## 1. Composition

```
front-page.php
├── header.php                                  → §3  Header / navigation
├── <main>
│   ├── template-parts/section-hero.php         → §4  Hero
│   ├── template-parts/section-products.php     → §5  Products
│   ├── template-parts/section-applications.php → §6  Applications
│   ├── template-parts/section-technology.php   → §7  Technology
│   ├── template-parts/section-knowledge.php    → §8  Knowledge
│   └── template-parts/section-contact.php      → §9  Contact
├── template-parts/inquiry-modal.php            → §10 Inquiry modal — ⚠ DOES NOT EXIST
└── footer.php                                  → §11 Footer
```

German twins exist for every section (`template-parts/section-*-de.php`, `inc/*_de.php`) and render
the identical layout with German strings. **The Elementor rebuild needs one page per language**
(§2).

## 2. Language / routing

| Route | Template | Notes |
|---|---|---|
| `/en/` | `front-page.php` | Canonical default-locale landing. |
| `/de/` | `front-page-de.php` | Same section order, German data files. |
| `/` | — | **301 → `/de/`** (`emifree_maybe_redirect_home_to_de()`). |
| Legacy `/blog/`, `/impressum/`, `/privacy/`, `/terms/` | `page-blog.php`, `page-de-*.php` | Unprefixed, no language segment. |

Language is switched by a **cookie** (`emifree_lang`) plus the **URL prefix**, both handled in
`inc/i18n.php` + `functions.php:253` (`emifree_get_lang()`). The header language dropdown
(`#emifree-lang-btn` / `#emifree-lang-menu`) writes the cookie and rewrites the URL path.

> **For the Architect:** the header language selector and the whole EN/DE split are **out of scope
> for the Flexbox blueprint** — they are theme chrome, not page content. Build the language switch
> as an Elementor theme template or keep the PHP header; do not reimplement it as page widgets.

---

## 3. Header / navigation

**Source:** `header.php` (10.4 KB) · **Behaviour:** `assets/js/sections/header.js` (33.7 KB)

| Property | Value |
|---|---|
| Element | `<header id="emifree-header">` — `fixed top-0 left-0 right-0 z-50 bg-white` |
| Height | `h-16` (64px) |
| Container | `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` |
| Layout | 3 zones: brand · desktop nav · right cluster (phone CTA + language chip) + mobile menu button |

### 3.1 Brand

| Item | Value |
|---|---|
| Logo 1 | `assets/logo.png` — `<img>`, `h-10 w-auto`, 120×40, alt "Emifree" |
| Logo 2 | `assets/emilogo.png` — `<img>`, `h-8 w-auto`, 100×32, alt "Emifree" |
| Link | both → `/en/` (`home_url('/en/')`), aria-label "Emifree, back to home" |

> Two logos side by side (wordmark + symbol). The file header says the React version had a single
> logo and the *dual* logo was kept deliberately. Reproduce both.

### 3.2 Desktop nav (≥768px)

Contained in a pill: `flex items-center space-x-1 bg-slate-100 rounded-full px-2 py-2`.

| Label | URL | Link style |
|---|---|---|
| Products | `/en/#products` | `px-4 py-2 text-sm font-medium text-zinc-900 hover:text-blue-700 rounded-full` |
| Applications | `/en/#applications` | idem |
| Knowledge | `/en/#knowledge` | idem |
| Technology | `/en/#technology` | idem |
| Contact | `/en/#contact` | idem |

### 3.3 Right cluster (≥768px)

| Item | Value |
|---|---|
| Phone CTA | `tel:+493076283520` — label **+49 3076283520** — `bg-blue-700 text-white px-5 py-2 rounded-full font-medium text-sm` + phone SVG |
| Language chip | `#emifree-lang-btn` — globe SVG + `EN`/`DE` label (`#emifree-lang-label`) + chevron |
| Language menu | `#emifree-lang-menu` — `w-40 bg-white rounded-xl shadow-xl border border-slate-100` |
| Language options | **English** (`data-lang="EN"`, active → `bg-blue-700 text-white font-semibold`), **Deutsch** (`data-lang="DE"`, inactive → `text-zinc-700 hover:bg-blue-50`) |

### 3.4 Mobile menu (<768px)

| Item | Value |
|---|---|
| Toggle | `#emifree-mobile-menu-btn` — hamburger `#emifree-mobile-menu-icon-open` ⇄ close `#emifree-mobile-menu-icon-close` |
| Panel | `#emifree-mobile-menu` — `bg-white border-t border-slate-200`, `px-4 py-4 space-y-2` |
| Nav links | same 5 items, `block px-4 py-2 text-sm font-medium text-zinc-900 hover:text-blue-700 hover:bg-slate-100 rounded-lg` |
| Phone CTA | `tel:+493076283520` — **+49 3076283520** — `bg-blue-700 text-white px-6 py-2 rounded-full text-sm` |
| Language pills | `EN` / `DE` — `.emifree-mobile-lang` — `min-h-[44px] rounded-full text-sm font-medium` |

### 3.5 Interactive behaviour → Elementor widget mapping

| Behaviour | Source hook | Elementor equivalent |
|---|---|---|
| Sticky header; swaps `bg-white` → `bg-white/95 backdrop-blur-md shadow-lg` after 20px scroll | `header.js:20`, `:65-69` | Elementor **Sticky header** (`header` template with `position: sticky`), or `sticky` effect on a container |
| Mobile menu open/close (hamburger ⇄ X) | `header.js:84-113` | **Toggle** widget (`elementor-toggle`), or Elementor's native mobile-nav menu |
| Language dropdown open/close + outside-click close | `header.js:152-154`, `:267-270`, `:501-511`, `:587` | **Dropdown / Toggle** widget, or a menu item with two targets (`/en/`, `/de/`) |
| Language switch → rewrite path + set cookie | `header.js:226-233`, `:546-559` | Out of scope for the blueprint — theme-level |
| Smooth-scroll for `#anchor` / `/#anchor` links, sticky-header offset | `header.js:713` (`querySelector(emifreeFragment)`) | Elementor **Scroll to / Anchor** on the link + `scroll-margin-top: 80px` on each section (the PHP uses `scroll-mt-20`) |

---

## 4. Hero

**Source:** `template-parts/section-hero.php` (14.8 KB) · **Data:** `inc/hero.php` (EN)
**Behaviour:** `assets/js/main.js` (hero video carousel, lines 60-120) · **Elementor target:** post `72`
→ section `49847864` ("hero-root")

| Property | Value |
|---|---|
| Element | `<section id="hero">` — `relative w-full min-h-[100dvh] flex flex-col overflow-hidden bg-[#0a0a0a]` |
| Inner content | `relative z-30 flex flex-col items-center justify-center flex-1 px-5 pt-16 md:pt-20 text-center`, `padding-bottom: clamp(120px, 22vh, 180px)` |

### 4.1 Background

| Layer | Value |
|---|---|
| Base | `#0A0A0A` |
| Video 1 | `#hero-video-primary` → `assets/videos/Video Project hero.mp4` (`type=video/mp4`, `muted playsinline`, `preload="metadata"`) |
| Video 2 | `#hero-video-secondary` → `assets/videos/Landing Video_2.1.mp4` (`preload="none"`) |
| Scrim | `bg-gradient-to-b from-black/55 via-black/50 to-black/70` (`z-20`) |
| Emerald tint | `bg-gradient-to-br from-emerald-500/5 to-transparent` (`z-20`) |

> The two videos cross-fade on the `ended` event (`main.js:60-120`): the active one gets
> `.emifree-hero-video--active` (`opacity: 0.9 !important`), the other is reset to `currentTime = 0`.
> iOS autoplay is retried on the first user gesture.
> **Elementor:** the existing page already uses an `e-background-video` container
> (`5b4bd92`) with `e-background-video-content` (`d8d7e8a`) — Elementor's native background video
> handles the cross-fade natively. **No custom JS needed.** One video only; the carousel is a
> legacy nicety, and Elementor has no two-video carousel primitive.

### 4.2 Copy (exact)

| Slot | Copy | Ref |
|---|---|---|
| H1 | **Low maintenance air filtration solutions** | `section-hero.php:113` ← `inc/hero.php:46` |
| Chip 1 | **Self-cleaning** | `section-hero.php:192` ← `inc/hero.php:48` |
| Chip 2 | **Energy Saving** | `section-hero.php:192` ← `inc/hero.php:49` |
| Chip 3 | **HEPA filter** | `section-hero.php:192` ← `inc/hero.php:50` |
| Secondary link | **See the technology behind it →** | `section-hero.php:216` ← `inc/hero.php:53` |
| Primary CTA | **Contact Us!** | `section-hero.php:231` ← `inc/hero.php:52` |
| Logos caption | **Trusted by industry leaders** | `section-hero.php:239` ← `inc/hero.php:54` |

H1 is `text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight tracking-tight mb-6`
plus an inline LCP override (`section-hero.php:40-50`):
`font-size: clamp(2.25rem, 6vw, 3.75rem); line-height: 1.15; font-weight: 700; color: #fff;
letter-spacing: -0.02em; margin: 0 0 1.5rem 0; opacity: 1 !important;`

### 4.3 Value strip (3 chips)

Container: `flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-10` + `aria-label` = the three
labels joined by `", "`.

| Chip | Icon | Icon colour | Behaviour | Target |
|---|---|---|---|---|
| Self-cleaning | `cycle` — circular-arrow SVG, `w-3.5 h-3.5 sm:w-4 sm:h-4` | `text-blue-300` | **link** (`data-emifree-chip-link="cycle"`) | `#technology` (in-page) |
| Energy Saving | `energy` — lightning-bolt SVG | `text-blue-300` | **static `<span>`** | — |
| HEPA filter | `hepa` — shield-with-check SVG | `text-blue-300` | **link** (`data-emifree-chip-link="hepa"`) | `/en/knowledge/hepa-filters-cnc-industrial-workshops/` |

Chip style: `inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10
backdrop-blur-sm px-4 py-2 text-sm sm:text-base font-medium text-white whitespace-nowrap`;
link variant adds `hover:bg-white/20 hover:border-white/45 focus-visible:ring-2
focus-visible:ring-white/70`.

> **Flag:** the HEPA chip's href is `/en/knowledge/hepa-filters-cnc-industrial-workshops/`. This
> **is a valid route** — it has an explicit rewrite rule (`functions.php:1590-1594`) and is
> allowlisted out of the broad Knowledge dispatcher (`functions.php:1464`). Rebuild as-is.

### 4.4 CTAs

| Button | Copy | URL | Style |
|---|---|---|---|
| Secondary link | See the technology behind it → | `#technology` | `text-white underline underline-offset-4 decoration-white/70 hover:decoration-white text-sm sm:text-base font-medium` + `text-shadow: 0 1px 2px rgba(0,0,0,.5), 0 2px 6px rgba(0,0,0,.4)` |
| Primary CTA | Contact Us! | `#contact` | `bg-gradient-to-r from-blue-700 to-cyan-500 text-white px-10 py-5 rounded-full font-semibold text-xl shadow-lg hover:shadow-xl` + inline `background-image: linear-gradient(90deg,#1d4ed8 0%,#06b6d4 100%); background-color:#2563eb` |

### 4.5 Client logo strip

Container: `absolute left-0 right-0 z-20 w-full` at `bottom: clamp(24px, 5vh, 48px)`.
Label: `text-white/60 text-[10px] sm:text-xs uppercase tracking-wider mb-2 text-center`.
Row: `flex flex-wrap items-center justify-center gap-x-4 gap-y-3 sm:flex-nowrap sm:gap-6 md:gap-8
lg:gap-12`. Each logo: `w-[30%] sm:w-auto h-6 sm:h-8 md:h-10 grayscale opacity-50
hover:grayscale-0 hover:opacity-100 transition-all duration-300`, img class `h-full w-auto
object-contain brightness-0 invert`, `aspect-ratio: 200/80`, `loading="lazy"`.

| Brand | File | Max width |
|---|---|---|
| Mercedes-Benz | `assets/logo_clients/mb_svg.svg` | `clamp(28px, 4.5vw, 50px)` |
| BMW | `assets/logo_clients/bmw.svg` | `clamp(30px, 5vw, 55px)` |
| GM | `assets/logo_clients/gm.svg` | `clamp(30px, 5vw, 55px)` |
| NSK | `assets/logo_clients/NSK.svg` | `clamp(45px, 8vw, 100px)` |
| Knorr-Bremse | `assets/logo_clients/knorr.svg` | `clamp(60px, 11vw, 130px)` |
| Siemens | `assets/logo_clients/siemens_logo.svg` | `clamp(55px, 9vw, 100px)` |

> **Elementor note:** the existing page renders the logo row as a single `shortcode` widget
> (`73c539a5`) — the row was moved server-side to keep the SVG count manageable. **Keep the
> shortcode**; do not rebuild the six logos as individual Image widgets, or the inline
> `max-width` clamps and the `brightness-0 invert` treatment are lost.

### 4.6 Entrance animation

`hero-fade-up` — `transform: translateY(20px) → translateY(0)` over `0.7s ease-out both`.
Delays: H1 `0ms`, chips `150ms`, secondary link `300ms`, primary CTA `450ms`.
`hero-fade-in` — `opacity: .001 → 1` over `0.3s ease-out both`.
Opacity never reaches 0 (LCP safeguard — see `design-tokens.md` §4).

**Elementor:** use Motion Effects → Entrance → "Fade In" / "Slide Up" with the same delays.
Keep the opacity floor at ≥0.001.

---

## 5. Products

**Source:** `template-parts/section-products.php` (4.4 KB) · **Elementor target:** section `2691800c`
("products-section")

| Property | Value |
|---|---|
| Element | `<section id="products">` — `py-12 md:py-24 bg-slate-50` |
| Container | `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` |
| Grid | `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6` |

### 5.1 Heading block — `text-center mb-12`

| Slot | Copy | Style |
|---|---|---|
| H2 | **Industrial Air Filtration Product Range** | `text-4xl md:text-5xl font-bold text-zinc-900 mb-6` |
| Lead | Professional-grade filtration systems designed for CNC workshops, metalworking shops, and industrial manufacturing environments. | `text-xl text-zinc-600 max-w-3xl mx-auto` |

### 5.2 Cards (3) — each is a real `<a href>`

Card shell: `group relative block aspect-[4/5] overflow-hidden rounded-2xl shadow-md bg-white
focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
focus-visible:ring-offset-slate-50 transition-all duration-300 hover:-translate-y-2
focus-visible:-translate-y-2 hover:shadow-2xl focus-visible:shadow-2xl`

Media: `relative flex-1 overflow-hidden` → `<img class="absolute inset-0 w-full h-full
object-contain p-6 transition-transform duration-500 ease-out group-hover:scale-105">`, 800×1000,
`loading="lazy"`.

Footer: `bg-gradient-to-b from-blue-600 to-blue-800 text-white p-6 transition-all duration-300
group-hover:from-blue-700 group-hover:to-blue-900` + H3 `text-2xl font-bold mb-2 drop-shadow-md`.

| # | Title | URL | Image | aria-label | CTA label |
|---|---|---|---|---|---|
| 1 | **Mechanical Filtration** | `/en/products/mechanical/` | `assets/products/fotom1.webp` | Mechanical Filtration — view category | **Learn more** |
| 2 | **Electrostatic Filtration** | `/en/products/electrostatic/` | `assets/products/fotoe2.webp` | Electrostatic Filtration — view category | **Learn more** |
| 3 | **Dust Filtration** | `/en/products/dust/` | `assets/products/dust_filter-emi.png` | Dust Filtration — view category | **Learn more** |

CTA row: `product-card__cta inline-flex items-center gap-2 text-sm font-semibold md:opacity-0
md:-translate-y-2 transition-all duration-300 md:group-hover:opacity-100 md:group-hover:translate-y-0
md:group-focus-visible:opacity-100 md:group-focus-visible:translate-y-0` + arrow SVG
(`M5 12h14` / `m12 5 7 7-7 7`) that translates `x` by 4px on hover.

> **Flag:** the file header comment claims *"the 'Learn more' CTA + darker gradient overlay are
> revealed on hover"* — but **there is no overlay element in the markup**. Only the CTA text reveals.
> The gradient change (`from-blue-600`→`from-blue-700`) is the actual hover treatment.
> Build what the markup does, not what the comment says.

### 5.3 Interactive behaviour → Elementor widget mapping

| Behaviour | Source | Elementor equivalent |
|---|---|---|
| Card hover: lift `-translate-y-2`, shadow `md→2xl`, image `scale-105`, CTA fade-in | pure CSS `:hover` / `:focus-visible` | **Elementor Hover** effect on the card container (translate + box-shadow) + a nested **Hover Box** or CSS `:hover` rules for the CTA |
| Whole card is a link with `aria-label` | `<a>` wrapper | Elementor **Box** with a link, or a **Link** wrapper + `aria-label` |

> The old tabbed product view (`assets/js/sections/products.js`, `data-emifree-tab` /
> `data-emifree-panel`) is **dead code** — `section-products.php:13` states the script is no longer
> enqueued. Do not build tabs.

---

## 6. Applications

**Source:** `template-parts/section-applications.php` (5.6 KB) · **Data:** `inc/applications.php`
**Elementor target:** section `3416f16c` ("applications-section")

| Property | Value |
|---|---|
| Element | `<section id="applications">` — `py-12 md:py-24 bg-white` |
| Container | `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` |
| Grid | `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8` |

### 6.1 Heading block — `text-center mb-20`

| Slot | Copy | Style |
|---|---|---|
| H2 | **Industrial Air Filtration for Every Application** | `text-4xl md:text-5xl font-bold mb-6` + `background: linear-gradient(90deg,#1d4ed8 0%,#06b6d4 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; color: transparent` (gradient text) |
| Lead | From small tool shops to large manufacturing facilities, Emifree systems capture oil mist, welding fumes, and dust at the source. | `text-xl text-zinc-600 max-w-3xl mx-auto` |

### 6.2 Cards (6) — **collapsed by default, expand on hover / focus-within**

Card shell: `<article tabindex="0" aria-label="{title}" class="group relative bg-white rounded-2xl
p-6 group-hover:p-8 group-focus-within:p-8 shadow-lg hover:shadow-2xl focus-within:shadow-2xl
transition-all duration-300 border border-slate-100 hover:border-slate-200
focus-within:border-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
focus-visible:ring-offset-2 focus-visible:ring-offset-white">`

Icon tile: `w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform
duration-300 group-hover:scale-110 group-focus-within:scale-110` +
`background: linear-gradient(135deg,#2563eb 0%,#06b6d4 100%); box-shadow: 0 10px 25px
rgba(37,99,235,0.25)` + inline SVG `w-8 h-8`, `stroke="#ffffff"`, `stroke-width="2.2"`.

H3: `text-xl font-bold text-zinc-900 mb-4 transition-colors duration-300 group-hover:text-blue-700
group-focus-within:text-blue-700`

Body wrapper: `emifree-app-card__body max-h-0 opacity-0 overflow-hidden transition-all duration-300
ease-out group-hover:max-h-96 group-hover:opacity-100 group-focus-within:max-h-96
group-focus-within:opacity-100`

| # | Icon | Title | Description | SEO question |
|---|---|---|---|---|
| 1 | `cog` | **CNC Machining & Tool Shops** | Remove oil mist and coolant fumes from CNC lathes, mills, and routers without stopping production. Keep your machines clean and operators healthy. | *How do I remove oil mist from my CNC machine without stopping production?* |
| 2 | `flame` | **Metalworking & Welding** | Capture welding fumes, metal dust, and grinding particles at the source. Protect your workforce from harmful particulates and meet EU safety standards. | *What is the best way to filter welding fumes in a small workshop?* |
| 3 | `sparkles` | **Grinding & Polishing** | Extract abrasive dust from surface grinding, cylindrical grinding, and polishing operations. Extend equipment lifespan and improve surface finish quality. | *How to control dust from surface grinding machines?* |
| 4 | `wrench` | **Bearing & Precision Parts Manufacturing** | Maintain clean air in bearing production, gear manufacturing, and precision engineering. Protect sensitive components from contamination. | *Best air filtration for bearing manufacturing clean rooms* |
| 5 | `factory` | **Heavy Industry & Metal Fabrication** | Handle high-volume dust and mist generation in fabrication shops, press rooms, and assembly lines. Industrial-grade filtration for demanding environments. | *Industrial dust extraction system for metal fabrication shop* |
| 6 | `car` | **Automotive** | Capture oil mist, coolant aerosol, and welding fumes from automotive production lines. Keep paint booths particle-free and EV battery assembly clean room compliant. | *Best air filtration system for automotive manufacturing plant oil mist and welding fume extraction* |

Icons are inline lucide-style SVG paths from `inc/applications.php:21-30` (24×24 viewBox, stroke-based).
The `color` key in the data array (`from-blue-700 to-blue-900`, `from-cyan-600 to-cyan-800`,
`from-slate-600 to-slate-800`, `from-blue-600 to-cyan-700`, `from-slate-700 to-zinc-800`,
`from-cyan-700 to-cyan-600`) is **unused dead data** — the template hard-codes the single blue→cyan
tile gradient.

Description: `text-zinc-600 leading-relaxed mb-4 pt-2` · Question: `text-sm text-zinc-600 italic`,
wrapped in `&ldquo; … &rdquo;`.

### 6.3 CTA

`text-center mt-16` → `<a href="#products" class="text-white px-8 py-4 rounded-full font-semibold
text-lg hover:shadow-xl transition-all duration-300 inline-block" style="background: linear-gradient(90deg,
#1d4ed8 0%, #06b6d4 100%); box-shadow: 0 10px 25px rgba(6,182,212,0.25);">`
Copy: **Find Your Solution** → `#products`

### 6.4 Interactive behaviour → Elementor widget mapping

| Behaviour | Source | Elementor equivalent |
|---|---|---|
| Card expands on hover / focus-within: `max-h-0 → max-h-96`, `opacity 0 → 1`, padding `p-6 → p-8`, icon `scale-110`, H3 → `text-blue-700` | pure CSS `group-hover` / `group-focus-within` | **Elementor Accordion** (one item per application) — the existing page already uses `e-accordion` (`26de8000`) with `e-accordion-item` children. Use the Accordion's "expanded on hover" behaviour if the Elementor version supports it; otherwise the Accordion's click-to-expand is a **better mobile pattern** than the CSS hover, which currently requires a tap on touch devices. |
| `tabindex="0"` + `aria-label` per card | `<article>` | Accordion item title carries the label |

> **Design note for the Architect:** the collapsed-by-default card is a **desktop-hover-only**
> affordance. On touch, `group-focus-within` fires on tap and the card stays expanded until the user
> taps elsewhere — it works, but the copy is invisible until then. The Accordion migration the page
> has already started is the correct resolution. Keep the icon, title, description and question
> content identical; only the reveal mechanism changes.

---

## 7. Technology

**Source:** `template-parts/section-technology.php` (11 KB) · **Data:** `inc/technology.php`
**Behaviour:** `assets/js/sections/technology.js` (12.6 KB)
**Elementor target:** section `1d342fa3` ("technology-section")

| Property | Value |
|---|---|
| Element | `<section id="technology">` — `py-12 md:py-24 bg-slate-50 md:bg-gradient-to-br md:from-slate-50 md:via-white md:to-blue-50 scroll-mt-20` |
| Container | `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` |

### 7.1 Block 1 — heading (`text-center mb-20`)

| Slot | Copy | Style |
|---|---|---|
| H2 | Choose the Right **Filtration Technology** for Your Process | `text-4xl md:text-5xl font-bold text-slate-900 mb-6` — "Filtration Technology" is a `text-blue-700` span |
| Lead | Whether you handle oil mist, emulsions, smoke, or ultra-fine aerosols, our self-cleaning filtration systems deliver cleaner air, lower maintenance, and stable performance. | `text-xl text-slate-600 max-w-3xl mx-auto` |
| Micro-note | Compare technologies below or jump directly to the right solution. | `text-slate-500 text-sm mt-3` |

### 7.2 Block 2 — technology selector cards (2)

Grid: `grid grid-cols-1 md:grid-cols-2 gap-8 mb-20`.
Card: `bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 p-6 md:p-8
border border-slate-100`.

| Field | ECO AIR | EARIA |
|---|---|---|
| badge | **Best for Oil Mist & Emulsions** | **Best for Smoke & Fine Aerosols** |
| badge style | `bg-amber-100 text-amber-800 text-xs font-semibold` | `bg-purple-100 text-purple-800 text-xs font-semibold` |
| title | **ECO AIR CLEANER** | **EARIA** |
| title style | `text-2xl md:text-3xl font-bold text-slate-900` | idem |
| subtitle | Mechanical Oil Mist Separator | Electrostatic Filtration System |
| subtitle style | `text-slate-500 text-sm mt-1` | idem |
| description | Constant suction performance through self-cleaning mechanical filtration and oil recycling. | Electrostatic filtration for smoke, oil mist and ultra-fine particles with minimal maintenance. |
| description style | `text-slate-600 mt-4` | idem |
| bullets | Self-cleaning system · No filter mats · Oil recycling · Up to 1,500 m³/h | Smoke & aerosol capture · Electrostatic filtration · No cartridge exchange · Adjustable up to 1000 m³/h |
| bullets style | `mt-5 space-y-2` → `li flex items-center gap-2 text-slate-700` + emerald check SVG `w-[18px] h-[18px] text-emerald-600` (`stroke="#10b981"`) | idem |
| anchor id | `#technology-eco-air` | `#technology-earia` |
| inquiry type | `eco-air` | `earia` |

CTA on each card: `<button type="button" data-emifree-tech-anchor="{anchor_id}">` —
Copy **Learn How It Works** + `move-right` arrow SVG.
Style: `mt-6 text-blue-600 font-medium flex items-center gap-1 hover:gap-2 transition-all`.

### 7.3 Block 3 — process panels (2, side by side)

Grid: `grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20`.
Panel: `<section id="{anchor_id}" data-emifree-process="{key}" data-active-step="{n}"
data-emifree-initial-step="{n}" class="bg-white rounded-3xl shadow-xl border border-slate-100 p-6
md:p-8 scroll-mt-20">`

**ECO AIR** — `data-emifree-process="eco-air"`, `initial_step = 2`
- process title: **How ECO AIR Works** (`text-2xl font-bold text-slate-900`)
- process subtitle: Mechanical separation + coalescence (`text-slate-500 text-sm mb-6`)

| # | Step title | Step description | Image | Intrinsic |
|---|---|---|---|---|
| 0 | **Pre-Filtration** | Stainless steel mesh captures larger droplets before separation. | `assets/tech/Step1.1_ECOAIR.jpg` | 892×683 |
| 1 | **Coalescence** | Rotating drums enlarge tiny oil particles into larger droplets for efficient separation and oil recovery. | `assets/tech/Step2.1_ECOAIR.webp` | 1360×752 |
| 2 | **Self-Cleaning & Recycling** | Integrated spraying nozzles maintain constant performance and recycle collected oil. | `assets/tech/Step3_clean.webp` | 1024×1024 |

> `initial_step = 2` means **the third step is visible on first paint** — deliberate: the
> differentiator ("Self-Cleaning & Recycling") is the landing message, not the process order.
> The process order stays capture → separate → clean.

**EARIA** — `data-emifree-process="earia"`, `initial_step = 0`
- process title: **How EARIA Works**
- process subtitle: Electrostatic filtration

| # | Step title | Step description | Image | Intrinsic |
|---|---|---|---|---|
| 0 | **Stainless steel pre-filter** | First stage captures larger particles to protect ionizer. | `assets/tech/Step 1.webp` | 1376×768 |
| 1 | **Ionization** | High voltage ionizer charges particles for electrostatic capture. | `assets/tech/Step 2.webp` | 1376×768 |
| 2 | **Collector plates** | Alternating plates attract and hold charged particles. | `assets/tech/Step 3.webp` | 1376×768 |
| 3 | **Oil particle collection** | Self-cleaning drain removes collected oil automatically. | `assets/tech/Step 4.webp` | 1376×768 |

Step UI — **two variants, swapped at 767.98px** (matching Tailwind `md`):

| Variant | Container | Button |
|---|---|---|
| Desktop (`hidden md:flex flex-col gap-2 mb-6`) | `data-emifree-step-list="desktop"` | `emifree-step-btn-desktop text-left px-4 py-3 rounded-xl transition-all` — active: `bg-blue-50 font-semibold text-blue-800`; inactive: `hover:bg-slate-50 text-slate-600`; label `text-sm font-medium` |
| Mobile (`md:hidden mb-6 overflow-x-auto whitespace-nowrap flex gap-2 pb-2`, `-webkit-overflow-scrolling: touch`) | `data-emifree-step-list="mobile"` | `emifree-step-btn-mobile px-4 py-2 rounded-full text-sm transition flex-shrink-0` — active: `bg-blue-600 text-white`; inactive: `bg-slate-100 text-slate-700 hover:bg-slate-200` |

Image frame: `rounded-2xl overflow-hidden bg-slate-100 h-48 md:h-80 flex items-center justify-center
p-4`; `<img class="max-w-full max-h-full w-auto h-auto object-contain" style="aspect-ratio: W / H">`,
`loading="lazy"`. Only the active step's image is visible (others get `.hidden`).

Caption block: `mt-4`; per step `data-emifree-step-caption="{i}"` —
H4 `text-lg font-semibold text-slate-900`, P `text-slate-600 mt-1`.

### 7.4 Block 4 — CTA card

Wrapper `px-0 py-0` → `max-w-4xl mx-auto rounded-3xl shadow-xl p-8 md:p-12 text-center bg-blue-50`.

| Slot | Copy | Style |
|---|---|---|
| H3 | Not sure which filtration technology fits your application? | `text-3xl md:text-4xl font-bold text-slate-900` |
| Body | Tell us your contamination type, airflow requirements, or machine setup, we'll recommend the right solution. | `text-slate-700 text-lg mt-4 max-w-2xl mx-auto` |
| Button 1 | **Get expert recommendation** | `<button data-emifree-inquiry="technology">` — `px-6 py-3.5 min-h-[44px] border border-slate-300 bg-white rounded-full font-medium text-slate-800 hover:bg-slate-50` |
| Button 2 | **View more Technical Specs** | `<a href="#knowledge">` — `px-6 py-3.5 min-h-[44px] rounded-full font-medium text-blue-700 hover:text-blue-800 gap-1` + arrow-right SVG |

### 7.5 Interactive behaviour → Elementor widget mapping

| Behaviour | Source hook | Elementor equivalent |
|---|---|---|
| Step switching — click a step → swap active image + caption, update button active state | `technology.js` — `[data-emifree-process]`, `[data-emifree-step]`, `[data-emifree-image]`, `[data-emifree-step-caption]` | **Tabs** widget (one tab per step, vertical on desktop / horizontal scroll on mobile) — *or* Elementor Pro **Tabs** with `Tabs` layout `Vertical` |
| Desktop vs mobile step-list swap at 767.98px | `technology.js:41-73` (`matchMedia('(max-width: 767.98px)')`) | Tabs widget's responsive layout switch (`vertical` desktop → `horizontal` mobile) |
| "Learn How It Works" smooth-scrolls to the matching panel with header-offset (header height + 8px) | `data-emifree-tech-anchor` | **Scroll to / Anchor** link → `#technology-eco-air` / `#technology-earia`; set `scroll-margin-top: 80px` on the panel |
| Auto-cycling carousel — steps advance every 5s (`data-emifree-cycle-ms`), pauses on hover / focus-within / manual click / `prefers-reduced-motion`, only runs while in viewport | `technology.js` (IntersectionObserver) | **Tabs** widget → Motion Effects → **Auto Cycle** with the same 5s interval. Note: Elementor's auto-cycle does not pause on hover by default — verify, or drop the auto-cycle and keep manual-only. |
| "Get expert recommendation" dispatches `emifree:open-inquiry` on `window` with `{technologyType:'technology'}`, falling back to smooth-scroll to `#contact` after 50ms | `data-emifree-inquiry="technology"` | **Popup** widget (Elementor Pro) with a trigger on the button. The fallback scroll to `#contact` is the no-JS path. |

> **Flag:** `template-parts/inquiry-modal.php` **does not exist** — `front-page.php:55-57` guards it
> with `locate_template()`, so the page never 500s, but the inquiry modal has not shipped. The
> "Get expert recommendation" button therefore always lands on `#contact`. If the Architect maps
> it to a Popup, the popup content must be authored from scratch.

---

## 8. Knowledge

**Source:** `template-parts/section-knowledge.php` (20.6 KB) · **Data:** `inc/knowledge.php` (33.5 KB)
**Elementor target:** section `6fb3a25c` ("knowledge-section")

| Property | Value |
|---|---|
| Element | `<section id="knowledge">` — `py-12 md:py-24 bg-white scroll-mt-20` |
| Container | `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` |
| Heading block | `text-center mb-16` |
| Tab bar | `flex flex-wrap justify-center gap-4 mb-12` (`role="tablist"`) |
| Panels | 3 × `role="tabpanel"` — **all three are rendered in the DOM**; panels 2 and 3 carry `hidden` |

> **Behaviour change:** the tabs are now **real `<a href>` links** to crawlable sub-pages
> (`/en/knowledge/insights/`, `/en/knowledge/about/`, `/en/knowledge/downloads/`). The comment at
> `section-knowledge.php:34-39` says JS intercepts the click to keep the in-page UX, but
> `assets/js/sections/knowledge.js` is now an **empty IIFE** — the in-page swap no longer happens.
> Clicking a tab navigates. The `role="tab"` / `role="tabpanel"` / `aria-selected` attributes are
> therefore **stale ARIA** that no longer matches the behaviour.

### 8.1 Heading block — `text-center mb-16`

| Slot | Copy | Style |
|---|---|---|
| H2 | Resources & **Knowledge** | `text-4xl md:text-5xl font-bold text-zinc-900 mb-6` — "Knowledge" is a `text-blue-700` span |
| Lead | Explore our latest insights, company updates, and technical resources to stay informed about industrial air filtration. | `text-xl text-slate-600 max-w-3xl mx-auto` |
| CTA (in `mt-8`) | **Open Our Free Engineering Tools** → `/en/knowledge/tools/` | `inline-flex items-center gap-2 text-white px-8 py-4 rounded-full font-semibold text-lg` + brand gradient + `arrow-right` SVG |

### 8.2 Tab bar (3)

Tab style: `emifree-knowledge-tab px-8 py-4 rounded-full font-semibold transition-all duration-300
flex items-center gap-2` + `w-5 h-5 flex-shrink-0` icon.
First tab: `bg-blue-700 text-white shadow-lg`. Others: `bg-white text-slate-600 hover:bg-slate-100
hover:text-blue-700 border border-slate-200`.

| Key | Label | Icon | href | Panel id |
|---|---|---|---|---|
| `blog` | **Industry Insights** | `book-open` | `/en/knowledge/insights/` | `emifree-panel-blog` |
| `about` | **About Us** | `users` | `/en/knowledge/about/` | `emifree-panel-about` |
| `downloads` | **Downloads** | `download` | `/en/knowledge/downloads/` | `emifree-panel-downloads` |

### 8.3 Panel A — Industry Insights (default visible)

H3: **Featured Articles** — `text-2xl md:text-3xl font-bold text-zinc-900 flex items-center gap-3 mb-8`
+ `w-7 h-7 text-amber-500` award SVG.

**One featured card** (the 2-column blog-post grid was removed in v1.6.10 — the HEPA editorial guide
is now the only featured entry):

Card shell: `<a>` — `group block bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-xl
transition-all duration-300 mb-8` · `aria-label="Read article: {title}"`.
Inner: `grid grid-cols-1 lg:grid-cols-5` → media `lg:col-span-2`, body `lg:col-span-3 p-6 lg:p-8
flex flex-col justify-center`.

| Field | Value |
|---|---|
| URL | `/en/knowledge/hepa-filters-cnc-industrial-workshops/` |
| Image | `assets/products/hepa/hepa-1.webp` — alt **HEPA filter close-up** — 1280×720, `object-cover group-hover:scale-105 transition-transform duration-300` |
| Media bg | `aspect-video lg:aspect-auto bg-gradient-to-br from-slate-100 to-blue-50 relative overflow-hidden` |
| Category pill | **Safety Guide** — `absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold` |
| Date | **October 14, 2026** — `inline-flex items-center gap-1` + calendar SVG — `text-sm text-slate-500` |
| Read time | **6 min read** — clock SVG — `text-sm text-slate-500` |
| Title | **HEPA Filters in CNC & Industrial Workshops: Uses, Limits & Safety** — `text-2xl lg:text-3xl font-bold text-zinc-900 mb-3 group-hover:text-blue-700 transition-colors` |
| Excerpt | How HEPA filters control fine dust in CNC and industrial workshops — what they capture, what they don't (gases, vapors, oil mist), and the combustible-dust safety rules you need to follow before installing one. — `text-slate-600 mb-4 text-base lg:text-lg` |
| Link label | **Read article** — `inline-flex items-center gap-1 text-blue-700 font-medium` + chevron-right SVG |

Footer button: `<a href="/blog/">` — **View All Articles** — `inline-flex items-center gap-2 bg-white
border-2 border-blue-700 text-blue-700 px-8 py-3 rounded-full font-semibold hover:bg-blue-700
hover:text-white transition-all duration-300` + arrow-right SVG.

### 8.4 Panel B — About Us (`hidden` by default)

**Our Story** — 2-column grid `grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16 items-center`.
H3: **Our Story** — `text-2xl md:text-3xl font-bold text-zinc-900 flex items-center gap-3 mb-6` +
`w-7 h-7 text-blue-700` book-marked SVG.

Body: `text-lg text-slate-600 mb-6 leading-relaxed`
> Founded in Berlin in 2010, Emifree GmbH emerged from a vision to create filtration solutions that
> balance industrial performance with environmental responsibility. What started as a small
> engineering team focused on CNC machining applications has grown into a global leader in air
> filtration technology.

Stats row: `grid grid-cols-3 gap-6`, each `text-center` —
value `text-3xl font-bold text-blue-700 mb-1`, label `text-sm text-slate-600`.

| Value | Label |
|---|---|
| **2010** | Founded |
| **500+** | Clients Worldwide |
| **15+** | Countries |

Aside panel: `bg-gradient-to-br from-blue-100 to-cyan-50 rounded-3xl p-8 flex flex-col items-center
justify-center aspect-video`
- Image `assets/icons/berlin.png` — alt **Based in Berlin** — `w-20 h-20 object-contain`
- **Based in Berlin, Germany** — `text-lg font-semibold text-zinc-900 mt-4`
- Serving industry worldwide since 2010 — `text-sm text-slate-600`

**Our Mission** — `mb-16 text-center`
H3: **Our Mission** (`text-2xl md:text-3xl font-bold text-zinc-900 mb-4`)
Lead: `text-lg text-slate-600 max-w-3xl mx-auto mb-12`
> We believe that clean air is a fundamental right in every workplace. Our mission is to develop
> innovative filtration technologies that protect workers, reduce environmental impact, and help
> industries operate more sustainably.

Value cards: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left`
Card: `bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-300`
Icon tile: `w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4` + `w-6 h-6 text-blue-700` SVG
Title: `font-semibold text-zinc-900 mb-2` · Desc: `text-sm text-slate-600`

| Icon | Title | Description |
|---|---|---|
| `leaf` | **Sustainability** | Designing products that minimize environmental footprint |
| `shield` | **Safety First** | Protecting worker health with proven filtration efficiency |
| `settings` | **Innovation** | Continuously improving our technology and processes |
| `target` | **Reliability** | Delivering consistent performance our customers can trust |

**Trusted by Industry Leaders** — `bg-slate-100 rounded-3xl p-8 text-center`
H3: `text-2xl md:text-3xl font-bold text-zinc-900 mb-6`
Strip: `flex flex-wrap justify-center gap-x-8 gap-y-3 items-center` — each
`text-lg font-semibold text-slate-500 hover:text-slate-800 transition-colors duration-200`

> Mercedes-Benz · BMW · General Motors · NSK Bearings · Knorr-Bremse · Siemens · Bosch · ThyssenKrupp

*(text only — no logo images; this is a wordmark list, not the hero logo strip)*

### 8.5 Panel C — Downloads (`hidden` by default)

H3: **Product Brochures** — `text-2xl md:text-3xl font-bold text-zinc-900 flex items-center gap-3 mb-8`
+ `w-7 h-7 text-blue-700` book-open SVG.

Grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8`

| # | Name | File | Size | Lang | Available | URL |
|---|---|---|---|---|---|---|
| 1 | **ECO AIR Cleaner Catalog** | `emifree_eco_air_cleaner_katalog_ENG_v4.2.pdf` | 2.1 MB | EN | ✔ | `assets/catalog/emifree_eco_air_cleaner_katalog_ENG_v4.2.pdf` |
| 2 | **ECO AIR Cleaner Katalog** | `emifree_eco_air_cleaner_katalog_DE_v4.2.pdf` | 2.1 MB | DE | ✔ | `assets/catalog/emifree_eco_air_cleaner_katalog_DE_v4.2.pdf` |
| 3 | **EARIA Electrostatic Catalog** | `earia-catalog-en.pdf` | 3.8 MB | EN | ✘ | *(none — "coming soon")* |
| 4 | **Full Product Range 2026** | `full-range-2026.pdf` | 12.5 MB | EN | ✘ | *(none — "coming soon")* |

Card (available): `<a href="{url}" download>` — `bg-white rounded-xl p-6 shadow-sm border border-slate-100
hover:shadow-lg hover:border-blue-200 transition-all duration-300 group block`.
Card (unavailable): `<div aria-disabled="true">` — same base + `opacity-60 cursor-not-allowed`.

Icon tile: `w-12 h-12 bg-blue-100 group-hover:bg-blue-700 rounded-xl flex items-center justify-center
mb-4 transition-colors duration-300` + `w-6 h-6 text-blue-700 group-hover:text-white` file-text SVG.
Title: `text-zinc-900 font-semibold mb-2 leading-snug` (+ ` (coming soon)` span in
`text-slate-500 font-normal` when unavailable).
Meta row: `flex items-center justify-between text-sm text-slate-500` — size + lang badge
`bg-slate-100 px-2 py-0.5 rounded text-xs font-semibold`.

CTA banner: `rounded-3xl p-8 md:p-12 text-white text-center` + brand gradient
(`linear-gradient(90deg,#1d4ed8 0%,#06b6d4 100%)`)
- H3: **Need Custom Documentation?** — `text-2xl md:text-3xl font-bold mb-4`
- Body: Can't find what you're looking for? Contact our technical team for custom datasheets, CAD
  drawings, or specific documentation for your application. — `text-lg text-blue-100 mb-8 max-w-2xl mx-auto`
- Button: **Contact Technical Support** → `/#contact` — `inline-flex items-center gap-2 bg-white
  text-blue-700 px-8 py-4 rounded-full font-semibold hover:bg-blue-50 transition-colors` + arrow-right SVG

### 8.6 Interactive behaviour → Elementor widget mapping

| Behaviour | Source | Elementor equivalent |
|---|---|---|
| Tab switch — click a tab to swap the visible panel (`data-emifree-tab` / `data-emifree-panel`, `.hidden` toggle, `aria-selected`) | **dead** — `assets/js/sections/knowledge.js` is an empty IIFE | **Tabs** widget (3 tabs, 3 panels) **only if** the Architect wants to restore the in-page UX. Otherwise the tabs are three **Buttons** linking to the three sub-pages. |
| Featured-article card hover: shadow `lg→xl`, title → `text-blue-700`, image `scale-105` | CSS only | Elementor **Hover** effect on the card box |
| Catalog card hover: shadow `sm→lg`, border → `border-blue-200`, icon tile → `bg-blue-700`, icon → white | CSS only (`group-hover`) | Elementor **Hover** effect; the icon colour swap needs a CSS rule on the hovered box |
| "coming soon" state on the two unavailable PDFs | `available => false` → `<div aria-disabled>` | Build both cards; leave the unavailable ones as non-link boxes with the "(coming soon)" label. **Do not fabricate PDF URLs.** |

> **Design decision for the Architect:** the Knowledge section has **three distinct bodies** that
> today live behind tabs but are all present in the DOM. Two paths:
> **(a)** Rebuild as a Tabs widget — preserves the current (broken) in-page intent but the JS is
> dead, so the Architect would be *re-adding* behaviour.
> **(b)** Rebuild the default "Industry Insights" panel only and turn the other two tabs into
> links to the crawlable sub-pages, which is what the markup actually does today and what SEO
> wants. **(b) is the faithful port.** The existing Elementor page already chose (b) — it has a
> `knowledge-tabs-bar` with three paragraph links and no tab panels
> (`knowledge-tab-insights` / `knowledge-tab-about` / `knowledge-tab-downloads`).
>
> **Whichever is chosen, the "About Us" and "Downloads" bodies are real content that must not be
> dropped** — either as tab panels or as the source for the standalone sub-pages
> `/en/knowledge/about/` and `/en/knowledge/downloads/`, which already exist as separate PHP
> templates (`page-knowledge-about.php`, `page-knowledge-downloads.php`).

---

## 9. Contact

**Source:** `template-parts/section-contact.php` (4.4 KB) · **Form:** `template-parts/partials/contact-form.php`
**Data:** `inc/contact.php` · **Behaviour:** `assets/js/sections/contact.js` (16.9 KB)
**Elementor target:** section `765cb5f5` ("contact-section")

| Property | Value |
|---|---|
| Element | `<section id="contact">` — `py-12 md:py-24 bg-slate-50 md:bg-gradient-to-br md:from-slate-50 md:via-white md:to-blue-50 scroll-mt-20` |
| Container | `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` |
| Grid | `grid grid-cols-1 lg:grid-cols-2 gap-12 items-start` |

### 9.1 Heading block — `text-center mb-20`

| Slot | Copy | Style |
|---|---|---|
| H2 | Ready for **cleaner air?** | `text-4xl md:text-5xl font-bold text-zinc-900 mb-6` — "cleaner air?" is a `text-blue-700` span |
| Lead | Plan your next filtration project with us and schedule a free consultation with our engineering team. | `text-xl text-zinc-600 max-w-3xl mx-auto` |

### 9.2 Left column — form card

Card: `bg-white rounded-3xl p-8 shadow-xl` · H3: **Send us a message** (`text-2xl font-bold text-zinc-900 mb-6`)

Form (`id="emifree-contact-form"`, `method="post"`, `action="{admin_url}/admin-ajax.php?action=send_contact"`,
`novalidate`, `class="space-y-6"`):

| # | Field | Type | Label (sr-only) | Placeholder | Required | Validation |
|---|---|---|---|---|---|---|
| 1 | `name` | text (`id="emifree-contact-name"`) | Name | Your Name | ✔ | `minlength=2` |
| 2 | `email` | email (`id="emifree-contact-email"`) | Email | Your Email | ✔ | `inputmode=email` |
| 3 | `company` | text (`id="emifree-contact-company"`) | Company Name | Company Name | ✔ | `minlength=2` |
| 4 | `message` | textarea, `rows=5` (`id="emifree-contact-message"`) | Message | Tell us about your project... | ✔ | `minlength=10` |

Input style: `emifree-contact-input w-full px-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-0
transition-all duration-200 border-slate-200 focus:border-blue-500`.
Per-field error `<p data-emifree-contact-error="{name}" class="hidden text-red-500 text-sm mt-2">`.

Hidden inputs: `emifree_contact_nonce` (WP nonce), `emifree_ts` (timestamp, anti-spam),
`website_url` (honeypot, `position:absolute; left:-9999px`), `product`, `product_label`.

Result banner: `<div id="emifree-contact-result" class="hidden rounded-xl p-4 mb-6 text-sm"
role="status" aria-live="polite">`

Submit: `<button type="submit" id="emifree-contact-submit" class="w-full text-white py-4 rounded-xl
font-semibold text-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50
disabled:cursor-not-allowed flex items-center justify-center gap-2" style="background: linear-gradient(90deg,
#1d4ed8 0%, #06b6d4 100%); box-shadow: 0 10px 25px rgba(6,182,212,0.25);">`
Copy **Send Message** + send SVG (idle) / loader SVG (`animate-spin`, hidden).

### 9.3 Right column — contact info cards (3)

H3: **Get in touch** (`text-2xl font-bold text-zinc-900 mb-6`) · list `space-y-6`.

Card: `bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 flex items-start gap-4`
Icon tile: `w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0` +
`linear-gradient(135deg,#2563eb 0%,#06b6d4 100%); box-shadow: 0 8px 20px rgba(37,99,235,0.2)` + `w-6 h-6` SVG.

| Icon | Title | Content | href | Description |
|---|---|---|---|---|
| `mail` | **Email Us** | info@emifree.com | `mailto:info@emifree.com` | Send us an email anytime |
| `phone` | **Call Us** | +49 307 628 3520 | `tel:+493076283520` | Mon-Fri from 8am to 6pm |
| `map-pin` | **Direction** | Pestalozzistraße 13 | *(none — plain text)* | 12557 Berlin, Germany. |

Title `font-semibold text-zinc-900 mb-1` · link `text-slate-700 hover:text-blue-700` ·
description `text-sm text-slate-500 mt-1`.

### 9.4 Interactive behaviour → Elementor widget mapping

| Behaviour | Source hook | Elementor equivalent |
|---|---|---|
| AJAX submit to `admin-ajax.php?action=send_contact` | `contact.js:305` (`fetch(window.emifreeContact.ajaxUrl)`) | **Elementor Pro Form** — the page already uses `e-form` (`6402f4f4`) with `e-form-input` / `e-form-textarea` / `e-form-submit-button` / `e-form-success-message` / `e-form-error-message`. See `docs/elementor-pro-contact-form.md`. |
| Client-side validation + inline per-field errors | `contact.js:191-235` (`data-emifree-contact-error`) | Elementor Pro Form **Required** toggle + **Min length** validation |
| Idle ⇄ loading icon swap on the submit button | `data-emifree-contact-submit-icon-idle` / `-icon-loading` | Elementor Pro Form built-in "On submit" state |
| Anti-spam: server-side timestamp window + honeypot | `emifree_ts`, `website_url` | Elementor Pro form has no honeypot field type — the shared antispam core (`inc/atomic-form.php`) covers the timestamp; the honeypot is **classic-path only** |
| `mailto:` / `tel:` cards | `<a href>` | Elementor **Button** or plain anchor inside a Box |

---

## 10. Inquiry modal — ⚠ NOT IMPLEMENTED

`front-page.php:52-57` and `front-page-de.php:63-66` both do:

```php
if ( locate_template( 'template-parts/inquiry-modal.php' ) ) {
    get_template_part( 'template-parts/inquiry-modal' );
}
```

**`template-parts/inquiry-modal.php` does not exist** (the file list confirms it). The guard means
the page loads fine, but there is no inquiry modal. The two CTAs that would open it —
`data-emifree-inquiry="technology"` (Technology CTA card) and the Products-section inquiry CTA —
fall back to a smooth-scroll to `#contact`.

> **Action:** either author the Popup in Elementor Pro (Architect) or drop the "opens a modal"
> affordance and keep the `#contact` anchor. Do not build a dead trigger.

---

## 11. Footer

**Source:** `footer.php` (7.2 KB) · **Data:** `inc/footer.php`

| Property | Value |
|---|---|
| Element | `<footer class="bg-zinc-900 text-white">` |
| Container | `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` |
| Main grid | `py-16` → `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8` |

### 11.1 Brand column (`lg:col-span-2`)

| Slot | Copy | Style |
|---|---|---|
| Wordmark | **Emifree** | `text-3xl font-bold text-blue-400 font-mono mb-4` |
| Tagline | Choose the Right Filtration Technology for Your Process. | `text-zinc-400 mb-6 leading-relaxed` |

Social links: `flex space-x-4` — each `w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center
hover:bg-blue-600 transition-all duration-200`, `target="_blank" rel="noopener noreferrer"`,
`aria-label` = network name, `w-5 h-5` stroke SVG.

| Network | URL | Icon path |
|---|---|---|
| LinkedIn | `https://www.linkedin.com/company/emifree` | `M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.61 0 4.28 2.38 4.28 5.47v6.27zM5.34 7.43a2.06 2.06 0 110-4.12 2.06 2.06 0 010 4.12zM7.12 20.45H3.56V9h3.56v11.45z` |
| YouTube | `https://www.youtube.com/@Emifree-Berlin` | `M2 8 a4 4 0 0 1 4 -4 h12 a4 4 0 0 1 4 4 v8 a4 4 0 0 1 -4 4 h-12 a4 4 0 0 1 -4 -4 z M10 9 l5 3 l-5 3 z` |
| Email | `mailto:info@emifree.com` | `M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z` |

### 11.2 Link columns (3)

| Column | Links (English) |
|---|---|
| **Company** | Blog → `/blog/` · Contact → `/#contact` |
| **Resources** | Duct Sizing Calculator → `/en/knowledge/ductulator/` · Air Pressure Loss Calculator → `/air-pressure-loss-calculator/` · About Us → `/en/knowledge/about/` · Downloads → `/en/knowledge/downloads/` |
| **Legal** | Imprint → `/impressum/` · Privacy Policy → `/privacy/` · General Terms (GTC) → `/terms/` · Cookie settings → `#` + inline `onclick` opening the Silktide preferences modal |

Link style: `text-zinc-400 hover:text-white transition-colors duration-200` · column title
`font-semibold text-white mb-4` · list `space-y-3`.

The Legal column uses `name_en` / `name_de` + `href_en` / `href_de` pairs and swaps href on the
client (`header.js:526` queries `.emifree-legal-link`).

> **Flag — Cookie settings link:** the inline `onclick` calls
> `window.silktideConsentManager.getInstance().toggleModal(true)`. This is **site-wide consent
> chrome, not page content**. Do not rebuild it as an Elementor widget — keep the theme footer, or
> wire it to the Silktide API via a small custom widget.

### 11.3 Bottom bar

`py-8 border-t border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4`

| Item | Copy | Style |
|---|---|---|
| Legal line | © {current year} Emifree GmbH · Pestalozzistraße 13 · 12557 Berlin · Germany | `text-zinc-400 text-sm` |
| ISO badge | `assets/badges/iso9001_badge_en.png` (DE: `iso9001_badge_de.png`) — alt `ISO 9001 Quality Management certified` / `ISO 9001 Qualitätsmanagement zertifiziert` | `w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 shrink-0 rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.35)]` — **not a link** |
| Email | info@emifree.com | `mailto:info@emifree.com` — `text-zinc-300 hover:text-white` |
| Phone | +49 307 628 3520 | `tel:+493076283520` — `text-zinc-300 hover:text-white` |

Separated by `·` (`text-zinc-500`).

---

## 12. Consolidated interactive-behaviour → Elementor widget map

| # | Behaviour | Source file | Hook / selector | Elementor widget |
|---|---|---|---|---|
| 1 | Hero video cross-fade carousel | `assets/js/main.js:60-120` | `.emifree-hero-video`, `.emifree-hero-video--active` | **Background Video** container (`e-background-video`) — already on post 72 |
| 2 | Hero entrance stagger | `assets/css/tailwind.src.css:59-76` | `.hero-fade-in`, `.hero-fade-up` | Motion Effects → Entrance (Fade / Slide Up), staggered delays |
| 3 | Sticky header backdrop on scroll | `assets/js/sections/header.js:20,65-69` | `#emifree-header` | Sticky header template / `position: sticky` |
| 4 | Mobile nav toggle | `header.js:84-113` | `#emifree-mobile-menu-btn`, `#emifree-mobile-menu` | **Toggle** widget / Elementor mobile menu |
| 5 | Language dropdown | `header.js:152-154, 267-270, 501-511` | `#emifree-lang-btn`, `#emifree-lang-menu`, `[data-lang]` | **Dropdown** widget — *out of scope, theme chrome* |
| 6 | Smooth-scroll to in-page anchors | `header.js:713` | `a[href^="#"]`, `a[href^="/#"]` | **Scroll to / Anchor** + `scroll-margin-top: 80px` |
| 7 | Product card hover reveal + lift | CSS only | `.product-card__link`, `.product-card__cta` | Elementor **Hover** effect + CSS `:hover` |
| 8 | Application card expand on hover/focus | CSS only | `.emifree-app-card__body`, `group-hover` / `group-focus-within` | **Accordion** — already on post 72 (`26de8000`) |
| 9 | Technology step switching | `assets/js/sections/technology.js` | `[data-emifree-process]`, `[data-emifree-step]`, `[data-emifree-image]`, `[data-emifree-step-caption]` | **Tabs** widget (vertical desktop / horizontal mobile) |
| 10 | Technology step auto-cycle (5s) + viewport pause | `technology.js` | `data-emifree-cycle-ms`, IntersectionObserver | **Tabs** → Motion Effects → Auto Cycle |
| 11 | "Learn How It Works" anchor scroll | `technology.js` | `data-emifree-tech-anchor` | **Scroll to / Anchor** |
| 12 | Inquiry modal open | `technology.js` | `data-emifree-inquiry` | **Popup** (Elementor Pro) — *modal does not exist yet* |
| 13 | Contact form AJAX + validation + button states | `assets/js/sections/contact.js` | `#emifree-contact-form`, `data-emifree-contact-*` | **Elementor Pro Form** — already on post 72 (`6402f4f4`) |
| 14 | Knowledge tabs | *dead code* | `assets/js/sections/knowledge.js` is an empty IIFE; `data-emifree-tab` / `data-emifree-panel` are vestigial | Tabs are now real `<a>` links to sub-pages. **Decision needed:** Tabs widget (restores dead behaviour) vs. three link buttons (faithful). See §8.6. |
| 15 | Product tabs (legacy) | *dead code* | `assets/js/sections/products.js` (`data-emifree-tab`) | Not enqueued — ignore |
| 16 | Cookie preferences modal | `inc/footer.php:82` | inline `onclick` → Silktide API | Out of scope — theme chrome |

---

## 13. Asset manifest

### 13.1 Images

| Path | Used by |
|---|---|
| `assets/videos/Video Project hero.mp4` | Hero video 1 |
| `assets/videos/Landing Video_2.1.mp4` | Hero video 2 |
| `assets/products/fotom1.webp` | Products card 1 (Mechanical) |
| `assets/products/fotoe2.webp` | Products card 2 (Electrostatic) |
| `assets/products/dust_filter-emi.png` | Products card 3 (Dust) |
| `assets/tech/Step1.1_ECOAIR.jpg` | ECO AIR step 1 (892×683) |
| `assets/tech/Step2.1_ECOAIR.webp` | ECO AIR step 2 (1360×752) |
| `assets/tech/Step3_clean.webp` | ECO AIR step 3 (1024×1024) |
| `assets/tech/Step 1.webp` | EARIA step 1 (1376×768) |
| `assets/tech/Step 2.webp` | EARIA step 2 (1376×768) |
| `assets/tech/Step 3.webp` | EARIA step 3 (1376×768) |
| `assets/tech/Step 4.webp` | EARIA step 4 (1376×768) |
| `assets/logo.png` | Header logo 1 (120×40) |
| `assets/emilogo.png` | Header logo 2 (100×32) |
| `assets/logo_clients/mb_svg.svg` | Client logo — Mercedes-Benz |
| `assets/logo_clients/bmw.svg` | Client logo — BMW |
| `assets/logo_clients/gm.svg` | Client logo — GM |
| `assets/logo_clients/NSK.svg` | Client logo — NSK |
| `assets/logo_clients/knorr.svg` | Client logo — Knorr-Bremse |
| `assets/logo_clients/siemens_logo.svg` | Client logo — Siemens |
| `assets/badges/iso9001_badge_en.png` | Footer ISO badge (EN) |
| `assets/badges/iso9001_badge_de.png` | Footer ISO badge (DE) |
| `assets/products/hepa/hepa-1.webp` | Knowledge — featured HEPA article image (1280×720) |
| `assets/icons/berlin.png` | Knowledge / About Us — Berlin badge (`w-20 h-20`) |
| `assets/catalog/emifree_eco_air_cleaner_katalog_ENG_v4.2.pdf` | Knowledge / Downloads — brochure 1 |
| `assets/catalog/emifree_eco_air_cleaner_katalog_DE_v4.2.pdf` | Knowledge / Downloads — brochure 2 |

> Two catalog entries (**EARIA Electrostatic Catalog**, **Full Product Range 2026**) have **no file
> on disk** and render as disabled "coming soon" cards. Do not create the files or the URLs.

### 13.2 Inline SVG icon sets (all lucide-style, 24×24 viewBox, stroke-based)

| Set | Keys | Source |
|---|---|---|
| Hero chips | `cycle`, `energy`, `hepa` | `section-hero.php:138-142` |
| Applications | `cog`, `flame`, `sparkles`, `wrench`, `factory`, `car` | `inc/applications.php:21-30` |
| Technology | `check`, `move-right`, `arrow-right` | `inc/technology.php:20-27` |
| Contact | `mail`, `phone`, `map-pin`, `send`, `loader` | `inc/contact.php:21-29` |
| Footer social | LinkedIn, YouTube, Email paths | `inc/footer.php:140-164` |
| Products card arrow | `M5 12h14` / `m12 5 7 7-7 7` | `section-products.php:84` |

> Elementor has an **Icon** widget with a built-in icon library. These lucide paths map almost
> 1:1 onto Elementor's icon set — use Elementor Icons instead of inlining raw SVG where possible.
> Where a specific path matters (the Hero chip icons, which carry brand meaning), keep the SVG.

---

## 14. URL manifest (all front-page links)

### 14.1 Internal page links

| Label | URL | From |
|---|---|---|
| Products nav | `/en/#products` | Header |
| Applications nav | `/en/#applications` | Header |
| Knowledge nav | `/en/#knowledge` | Header |
| Technology nav | `/en/#technology` | Header |
| Contact nav | `/en/#contact` | Header |
| Logo → home | `/en/` | Header (×2) |
| Self-cleaning chip | `#technology` | Hero |
| HEPA filter chip | `/en/knowledge/hepa-filters-cnc-industrial-workshops/` | Hero |
| Secondary hero link | `#technology` | Hero |
| Primary hero CTA | `#contact` | Hero |
| Mechanical Filtration | `/en/products/mechanical/` | Products |
| Electrostatic Filtration | `/en/products/electrostatic/` | Products |
| Dust Filtration | `/en/products/dust/` | Products |
| Find Your Solution | `#products` | Applications |
| Learn How It Works (ECO AIR) | `#technology-eco-air` | Technology |
| Learn How It Works (EARIA) | `#technology-earia` | Technology |
| View more Technical Specs | `#knowledge` | Technology |
| Blog | `/blog/` | Footer |
| Contact (footer) | `/#contact` | Footer |
| Duct Sizing Calculator | `/en/knowledge/ductulator/` | Footer |
| Air Pressure Loss Calculator | `/air-pressure-loss-calculator/` | Footer |
| About Us | `/en/knowledge/about/` | Footer |
| Downloads | `/en/knowledge/downloads/` | Footer |
| Imprint | `/impressum/` | Footer |
| Privacy Policy | `/privacy/` | Footer |
| General Terms (GTC) | `/terms/` | Footer |

### 14.2 Contact links

| Label | URL |
|---|---|
| Email | `mailto:info@emifree.com` |
| Phone (header, footer, card) | `tel:+493076283520` |

### 14.3 External

| Label | URL |
|---|---|
| LinkedIn | `https://www.linkedin.com/company/emifree` |
| YouTube | `https://www.youtube.com/@Emifree-Berlin` |

---

## 15. Open flags for the Architect

| # | Flag | Where | Recommended resolution |
|---|---|---|---|
| 1 | **Inquiry modal does not exist.** `template-parts/inquiry-modal.php` is missing. | `front-page.php:55` | Build an Elementor Pro **Popup** for "Get expert recommendation", or keep the `#contact` anchor. Decide with the user. |
| 2 | **HEPA chip URL — ✅ VERIFIED VALID.** `/en/knowledge/hepa-filters-cnc-industrial-workshops/` is an explicitly-registered rewrite rule (`functions.php:1590-1594` → `emifree_knowledge=subsection` → `page-hepa-filters.php`). It is also allowlisted out of the broad `/en/knowledge/([^/]+)` dispatcher (`functions.php:1464`). | `section-hero.php:173` | Rebuild as-is. |
| 3 | **Product card "darker gradient overlay" is not in the markup.** | `section-products.php:10` (comment) vs. `:60-91` | Ignore the comment. The hover treatment is the gradient shift + CTA reveal. |
| 4 | **Applications `color` data key is dead.** Each entry carries a gradient class that the template never reads. | `inc/applications.php:40` etc. | Ignore. |
| 5 | **Two dark heading neutrals** in use — `#0F172A` and `#18181B`. | throughout | Normalise to one `text-heading` token (`design-tokens.md` §5 item 3). |
| 6 | **Inter / Roboto Mono are never actually loaded** by the theme. | `tailwind.config.js:7-8` | Declare them in Elementor Global Typography; verify visually against the classic page before cutover. |
| 7 | **Two hero videos** cross-fade in PHP; Elementor's Background Video takes one. | `section-hero.php:77-96` | Pick one hero video, or keep the PHP carousel. Elementor already has `e-background-video` on post 72 — confirm which file it uses. |
| 8 | **Technology auto-cycle pauses on hover** in JS; Elementor Tabs auto-cycle may not. | `technology.js` | Verify or drop the auto-cycle. |
| 9 | **Header + footer are PHP chrome**, not Elementor content. | `header.php`, `footer.php` | Decide: Elementor **Theme Builder** header/footer templates, or keep the PHP theme header/footer and rebuild only the page body. The simplest cutover is: keep the PHP header/footer, rebuild the `<main>` body as an Elementor page. |
| 10 | **German page needs the same rebuild.** | `front-page-de.php` | Second Elementor document, German strings, same Flexbox blueprint. |
| 11 | **The classic form's honeypot** (`website_url`) has no equivalent in Elementor Pro. | `partials/contact-form.php:124-131` | The shared antispam core (`inc/atomic-form.php`) covers the timestamp half; the honeypot half is classic-only. Acceptable for the Pro path (documented in `docs/elementor-pro-contact-form.md`). |
| 12 | **Knowledge tab ARIA is stale.** The markup declares `role="tab"` / `role="tabpanel"` / `aria-selected`, but the panels never swap (the JS is an empty IIFE) — the tabs navigate instead. | `section-knowledge.php:96-120` | If the Architect rebuilds as a Tabs widget, the ARIA becomes correct again. If rebuilt as links, **drop the tab roles** and use plain buttons/links — otherwise screen readers announce a tab that does not behave like one. |
| 13 | ~~**The "About Us" and "Downloads" panel bodies are only reachable via the (dead) tab JS today.**~~ ✅ **RESOLVED 2026-11-02 — nothing was dropped.** Verified live: `/en/knowledge/about/` → HTTP 200, renders *Our Story*, *Our Mission*, *Trusted by Industry Leaders*, the 2010/500+/15+ stats. `/en/knowledge/downloads/` → HTTP 200, renders the 4 brochure cards + *Need Custom Documentation?* + the two "(coming soon)" placeholders. The landing page's three tab buttons are real links to exactly those routes, so the Elementor build (Panel A only + 3 link tabs) is **faithful to the classic page**, where panels 2–3 were `hidden` and the tab JS was dead anyway. | `section-knowledge.php:238-389` | Keep as-is: three link buttons + Panel A on the landing page; the other two bodies live on their own routes. |
| 14 | **Two catalog PDFs do not exist on disk.** | `inc/knowledge.php:153-168` | Render as disabled "(coming soon)" cards. Do not invent URLs. |
| 15 | **The hero HEPA chip and the Knowledge featured card point at the same article** — `/en/knowledge/hepa-filters-cnc-industrial-workshops/`. | `section-hero.php:173`, `section-knowledge.php:151` | Intentional. Rebuild both as-is. |
| 16 | **The Knowledge sub-pages are virtual routes, not WordPress pages.** `/en/knowledge/`, `/en/knowledge/{insights,about,downloads,tools}/` and the HEPA pair are all served by rewrite rules (`functions.php:1446-1598`) that hand off to PHP templates (`page-knowledge-index.php`, `page-knowledge-about.php`, `page-knowledge-downloads.php`, `page-hepa-filters.php`) via `template_include`. | `functions.php` | **Do not create Elementor documents at those URLs** — a WordPress page row would be shadowed by the rewrite rule. If the Knowledge sub-sections are ever migrated to Elementor, the rewrite rules must be retired first. This is a separate migration from the front page. |

---

## 16. Delta vs. the live Elementor document (audit 2026-11-02)

Audited the running site against this map. The live document is **post 72** ("Elementor Preview",
`/elementor-preview/`). Everything below is measured, not inferred.

### 16.1 What is already built (post 72 tree)

| Section | Element id | Status |
|---|---|---|
| Hero | `49847864` (`hero-root`) | ✅ built — bg-video + scrim + content + chips + logos shortcode |
| Products | `2691800c` | ✅ built — 3 cards, grid + per-card footer gradient |
| Applications | `3416f16c` | ✅ built — **6 `e-accordion` items** + CTA |
| Technology | `1d342fa3` | ✅ built — ECO AIR + EARIA blocks, 3 steps each |
| Knowledge | `6fb3a25c` | ✅ built — 3 tab buttons + feature row + list row |
| Contact | `765cb5f5` | ✅ built — **Elementor Pro atomic form** (`e-form`) + 3 info cards |

Applications were rebuilt as an **Accordion**, which is a deliberate improvement over the PHP
hover-reveal (`group-hover:max-h-96`) — it makes the six descriptions reachable on touch devices.
Keep it.

### 16.2 Defects found on the live page

| # | Severity | Finding | Fix |
|---|---|---|---|
| A | **High** | **Hero video is a stale 3.58 MB file.** Elementor plays `wp-content/uploads/2026/10/Video-Project-hero.mp4` = **3,580,094 B**. The theme's own `assets/videos/Video Project hero.mp4` was re-encoded on 2026-10-29 down to **239,930 B** (same clip, ~15× lighter). The uploads file is **byte-identical (MD5 `2b0645a5fc981c7ef53925d9b4f0d064`) to the pre-compression original in git HEAD** — so the Elementor page is literally playing the old encode on the LCP path. | Repoint `e-background-video` (id `5b4bd92`) at the compressed asset. Second file: `Landing Video_2.1.mp4` went 2,274,582 B → 1,014,415 B. **Both re-encodes are still uncommitted in git.** |
| B | Medium | **No `id="hero"` anchor.** Live page renders `id="applications"`, `id="contact"`, `id="knowledge"`, `id="products"`, `id="technology"` — the hero container `49847864` has none, while the PHP `<section id="hero">` does. Nothing links to it today, but it breaks `#hero` deep links and back-to-top. | Set `_cssid: hero` on `49847864`. |
| C | Medium | **Typography diverges from the theme.** The page fetches **Roboto + Roboto Slab** from Google Fonts (Elementor kit defaults). The theme declares **Inter** + **Roboto Mono** and loads *neither* — so the classic page renders `system-ui` and the Elementor page renders Roboto. Two different pages, two different typefaces, neither matching the intent. | Pick one stack (recommend: load **Inter** + **Roboto Mono** properly) and declare it in Elementor Global Typography. See `design-tokens.md` §7. |
| D | Low | **Debug endpoint left enabled.** `emifree-elementor-bridge` ships `?emifree_bridge_test=1` (admin-only, 403 for anonymous). It renders the *old* shortcode form, not the Pro form. | Delete the handler before go-live — the plugin doc says so itself. |
| E | Info | `classic-theme-styles-inline-css` is loaded alongside Elementor CSS — the classic theme's stylesheet is still on the page. Expected while the PHP header/footer stay, but it means the Elementor page carries **both** CSS bundles. | Confirm the header/footer decision (see §15 flag 9) before optimising. |

### 16.3 Decisions already made (no longer open)

- **Contact form → Elementor Pro atomic form.** Live on post 72 (EN) and post 135 (DE, draft).
  The classic AJAX form (`partials/contact-form.php`) stays for the classic PHP page only.
  Spam protection is the shared `emifree_ts` timestamp core (`functions.php` ~1836-1888:
  3-3600 s window, 3 submissions/hour/IP) plus Elementor's inline nonce.
  Doc: `docs/elementor-pro-contact-form.md`. **A cache exclusion for the landing page is required
  at deploy time** — the nonce is baked into the page.
- **Header/footer stay PHP.** The live page already proves it: `emifree-header`,
  `emifree-lang-btn`, `emifree-mobile-menu-btn` are all theme chrome around the Elementor body.
  §15 flag 9 is settled in practice — no Theme Builder templates needed.
- **`emifree-elementor-bridge` shortcode is superseded.** It was the 2026-10-28 approach
  (`[emifree_contact_form]` renders the theme partial). The 2026-10-29 Pro atomic form replaced it.
  The plugin is harmless but no longer on the critical path.

### 16.4 Still open

- §15 flag 1 — Inquiry modal (never built in PHP).
- §15 flag 10 — the **German document** (post 135) has only the contact section; the other five
  sections still need the full rebuild.
- The two `(coming soon)` catalogue PDFs (flag 14) still do not exist on disk.

---

## 17. State of play after the blueprint (2026-11-02, later pass)

`elementor-blueprint.md` (1,744 lines) now exists — @Archi built it from this map and handed it
to @Builder. Corrections and additions from the audit that followed:

### 17.1 My "kit has no global tokens" line is stale — fixed

`@Archi` created the globals on 2026-11-02. Verified in
`uploads/elementor/css/post-51.css`, whose `:root` block now carries all 26 colour variables
(`--primary: #1D4ED8`, `--text-heading: #0F172A`, `--text-body: #475569`, …) plus
`--font-body: Inter` and `--font-mono: Roboto Mono`. Step 0 of the build is done.

### 17.2 Font situation changed — the page now fetches FOUR families

| Before (my §7) | Now |
|---|---|
| Elementor page: Roboto + Roboto Slab | Elementor page: **Inter + Roboto Mono + Roboto + Roboto Slab** |

The V4 font variables do trigger a Google Fonts enqueue, so **Inter really renders on the
Elementor page** — the theme's intent is met there. What is left is the kit's *classic*
typography, which still emits Roboto (primary) + Roboto Slab (secondary):
`--e-global-typography-primary-font-family: "Roboto"`,
`--e-global-typography-secondary-font-family: "Roboto Slab"`. The MCP cannot reach those
settings; they live in *Site Settings → Typography* and need a human. Payload issue, not visual.

The **classic** `/en/` and `/de/` pages still render `system-ui` — the theme names Inter in
`tailwind.config.js` but never loads it. That remains a theme-side fix before cutover
(blueprint flag 17).

### 17.3 Corrections to the blueprint

| Blueprint says | Reality |
|---|---|
| §9.4: "id 127 `hepa-1.webp`, 1020×1360 — **the theme copy is 1280×720**", crop differs | ❌ **Wrong.** The theme copy `assets/products/hepa/hepa-1.webp` is also **1020×1360** and is **byte-identical** to attachment 127 (MD5 `6c8de8d7bbafccb68dc10d7851af05d7`). Only the *source path* differs (theme asset vs. library attachment). **No crop mismatch — drop that note.** |
| D-05: "five of the seven step images are not in the Media Library" → static list, no Tabs | ⚠️ **Assets exist on disk**, only not imported. `assets/tech/`: ECO AIR `Step1.1_ECOAIR.jpg` (892×683), `Step2.1_ECOAIR.webp` (1360×752), `Step3_clean.webp` (1024×1024); EARIA `Step 1–4.webp` (1376×768 each). Dimensions are already documented in `inc/technology.php:46-51`. `e-tabs` **is** in this install (blueprint §1.5). The blocker is a 5-file Media Library import, not a missing asset — and the auto-cycle objection is answered by turning auto-advance **off**, which keeps the click-a-step → image-swaps behaviour. See §17.4. |
| D-09: 2-col blog grid removed in 1.6.10 | ✅ Verified — `section-knowledge.php:133` and `:165` say exactly that. |
| Section order | ✅ Verified — `front-page.php:29-48`. |

### 17.4 Technology step switcher — recommendation

Keep the section interactive:

1. **Import the 5 step images** into the Media Library (they are already on disk).
2. Use `e-tabs` — one tab per step, vertical on desktop / horizontal on mobile.
3. **Auto-cycle OFF.** The objection was that Elementor's auto-advance does not pause on hover;
   disabling auto-advance removes the problem entirely and keeps the PHP's 5-second rotation
   (garnish) out of the build. The valuable part — click a step, the diagram changes — survives.
4. **ECO AIR must open on step 2** (`inc/technology.php:80`, `initial_step => 2` → *Self-Cleaning &
   Recycling*). EARIA opens on step 1.
5. Breakpoint: the PHP splits the step list at **767.98px**; Elementor's `--tablet` is
   **max-width 767px**. Switch the Tabs to horizontal at `--tablet` and `--mobile`.

The blueprint's static `<ol>` is a perfectly good fallback and can ship first — the swap to
`e-tabs` is one element replacement (§6.4 already documents it).

### 17.5 Hero video — MD5 proof

`uploads/2026/10/Video-Project-hero.mp4` = `2b0645a5fc981c7ef53925d9b4f0d064` =
**byte-identical to the pre-compression original in git HEAD**.
The theme's current file = `ac42bdb2d85d9cd4f9a8a49008a29159` (239,930 B).
So the live page is literally serving the old 3.58 MB encode. Commit + upload the re-encode.

---

## 18. Post-build audit — responsive mapping + token drift (2026-11-02, later pass)

Audited the *generated* CSS of post 72 (`wp-content/uploads/elementor/css/local-72-frontend-*.css`)
against the PHP source.

### 18.1 Tailwind `sm:` (640px) has no Elementor equivalent — two elements affected

Elementor's breakpoints are **max-width**: `--tablet` = max-width **1024px**,
`--mobile` = max-width **767px** (confirmed in the generated files:
`local-72-frontend-tablet.css` → `max-width:1024px`, `local-72-frontend-mobile.css` → `max-width:767px`).
Tailwind's are **min-width**: `sm` = **640px**, `md` = 768px, `lg` = 1024px.

`md:` (768) and `lg:` (1024) land on `--tablet` and on the desktop base respectively and
**map cleanly**. Only **`sm:` (640px) is inexpressible** — Elementor has no breakpoint between
0 and 767px, so a 640px step cannot be written exactly.

> **Correction (2026-11-03).** This section originally called the `sm:` problem a *systemic
> inversion* and gave a fix pattern that does not work in Elementor V4 atomic. Both were wrong.
> See §19.1 and §19.4. The two elements actually affected are listed below with their measured
> verdicts; nothing else in the build is broken by this.

| Element | PHP (Tailwind) | Live build | Verdict |
|---|---|---|---|
| `hero-chips` gap (`gap-3 sm:gap-4`) | 12px <640px · 16px ≥640px | 16px ≤1024px · 12px >1024px | ❌ wrong at both ends |
| `products-inner` padding (`px-4 sm:px-6 lg:px-8`) | 16 · 24 (640-1023) · 32 | 16 ≤767 · 24 ≤1024 · 32 | ❌ wrong in the 640-767px band (16px vs 24px) |

Measured from the generated CSS of post 72:

* `.e-5b1c4df3-8797` (hero-chips) — desktop `gap:12px`, tablet `gap:16px`, **no mobile rule**
  → ≤767px inherits tablet's 16px and >1024px gets 12px. Both ends are wrong.
* `.e-69155189-83b9` (products-inner) — desktop `padding-inline:32px`, tablet `24px`,
  mobile `16px` → correct at every width **except** 640-767px, where Tailwind wants 24px
  and the build gives 16px.

`sm:` appears in 6 of the section templates — `sm:px-6` ×5 (products, applications, technology,
knowledge, contact), `sm:gap-4`, `sm:gap-6`, `sm:grid-cols-2`, `sm:flex-nowrap`, `sm:w-*`/`sm:h-*`.
**Every one of these needs a check.**

**The only working fix pattern** is the blueprint's cascade rule (§19.2): put the **largest**
value in the desktop base, override at `--tablet`, then override at `--mobile`. Applied to
`gap-3 sm:gap-4` that gives desktop 16px / tablet 16px / mobile 12px — correct at every width
except the 640-767px band, which is the smallest error achievable. A raw
`@media (min-width: 640px)` **cannot** be used: Elementor V4 atomic silently drops it
(§19.4, probe-verified). The exact alternative is a **min-width-640 custom breakpoint**, which
is a *Site Settings → Responsive* action needing a human — see §19.4.

### 18.2 Heading-colour normalisation not yet applied

The build carries **19 hardcoded `#18181b`** (`local-72-frontend-desktop.css`), including the
Products h2 (`e-405ba62d-de9c`) and the three product-card link colours. The kit token is
`--text-heading: #0F172A`, and `#18181B` survives only as `text-heading-alt` (footer surface).

The build is faithful to the PHP's per-element colours — the normalisation decision (map flag 5)
simply hasn't been applied yet. Mechanical swap: `#18181b` → `var(--text-heading)` on headings;
keep `#18181b` on the footer surface only.

### 18.3 Three blueprint items not yet landed on post 72

| Item | State |
|---|---|
| Hero video | `hero-video` (`5b4bd92`) still `source.id 54` = the 3.58 MB original. The 239,930 B re-encode is in neither the Media Library nor git. |
| `#hero` anchor | `hero-root` (`49847864`) still has **no `_cssid`** → no `id="hero"`. |
| Technology step images | Not in `uploads/` — but **not a blocker**: all 7 files are in the theme's `assets/tech/` and `e-image` accepts a URL (§19.1). |

Git: HEAD is now `7d3c163` ("chore: snapshot theme + Elementor landing page for review",
48 files) — **committed but not pushed**. Working tree: `elementor-blueprint.md` (@Archi) and
`elementor-json/src/element.mjs` modified.

---

## 19. Re-audit of the Architect's reversals (2026-11-03)

@Archi revised `elementor-blueprint.md` after the first build. Every correction was re-verified
against the **live install** (post 72 + the Elementor plugin source), not against the notes.
All of the corrections hold; two of my own earlier statements did not, and are corrected here.

### 19.1 D-05 reversed — the technology steps are Tabs, not a slider

The blueprint's original objection ("the images must be imported into the Media Library, so no
native step switcher is possible") is void:

* All **7** step images exist on disk in `wp-content/themes/emifree-landing/assets/tech/`
  (`Step 1-4.webp`, `Step1.1_ECOAIR.jpg`, `Step2.1_ECOAIR.webp`, `Step3_clean.webp`), with the
  pixel dimensions declared in `inc/technology.php:46-51`.
* `e-image` accepts an **external URL** (`image.src.url`) — a Media Library import is *optional*,
  not required. The theme's own `assets/tech/` path is a valid URL source.
* `e-tabs` exposes exactly **one** prop, `default-active-tab` (0-based). There is **no**
  auto-advance prop, so the PHP 5-second rotate does not carry over — which is precisely what
  makes the native Tabs widget the right target.
* `initial_step => 2` (`inc/technology.php:80`) → ECO AIR's `default-active-tab: 2`
  (third step = "Self-Cleaning & Recycling" = `Step3_clean.webp`); EARIA has no `initial_step`,
  so it starts at `default-active-tab: 0` ("Stainless steel pre-filter" = `Step 1.webp`).

### 19.2 The breakpoint rule — confirmed, with one precision fix

The blueprint's §1.3 table is right in substance, and its "largest value at the desktop base,
then override at Tablet, then at Mobile" rule is the **only** implementable mapping for a 640px
step (see §19.4). One precision fix: the `sm` → Mobile row says "*fires ~240px early*"; the
actual distance is **767 − 640 = 127px** (the mobile band edge minus the Tailwind `sm` edge).

### 19.3 CSS-engine limits (verified against plugin source + live probes)

| Rule | Failure mode |
|---|---|
| Only `&:hover`, `&:focus`, `&:active` may be nested | any other nested selector → **hard error** ("Unsupported nested selector") |
| A top-level selector without `&` | **hard error** |
| `&` + anything else (e.g. `& .child`) | accepted, emitted as **dead CSS** |
| `@media (min-width: 640px)` (raw) | **silently dropped** — no error, no warning |
| `@media (--widescreen)` (unknown alias) | **hard error** ("Unknown breakpoint alias") |
| `@media (--mobile) { @media (min-width: 640px) { … } }` | **hard error** (nested media) |

Breakpoint aliases are **max-width only**: `mobile` = 767px, `tablet` = 1024px. There is
**no `desktop` alias** — the desktop/base variant is the un-prefixed rule.

`:focus` is the practical substitute for a missing `:focus-visible`. There is no state for
`:focus-within`, or for `:active` on a parent.

### 19.4 Why `sm:` cannot be expressed as a raw min-width query

Probe-verified against the running install (`Css_Media_Splitter` → `Style_Variants_Merger`):

```
input : gap: 12px;  @media (min-width: 640px) { gap: 16px; }
split  → breakpoints: {"desktop": "gap: 12px;"}      ← the 640px rule is NOT here
         custom_css : "@media (min-width: 640px) { gap: 16px; }"
apply → variants: [ {bp: desktop, gap: 12px} ]        ← the 640px rule is GONE
         Style_Variants_Merger::parse_css_string() reads only $split['breakpoints'];
         $split['custom_css'] is never read on this path.
```

So a min-width rule is **dropped without any error or warning** — the change appears to succeed
and does nothing. This invalidates the "write `sm:` as `@media (min-width: 640px)`" advice that
§18.1 used to give.

**The exact route** for `sm:` is a **min-width-640 custom breakpoint**: the
`additional_custom_breakpoints` experiment is **active** on this install, and the breakpoint
model already contains a `min`-direction breakpoint (`widescreen`, min 2400px), so a min-640
breakpoint is representable. But it is a **Site Settings → Responsive** action — a human has
to add and enable it; it is not something an MCP style string can do. Until it exists, use the
cascade rule (§19.2) and accept the 640-767px band.

### 19.5 Widget prop shapes (verified)

* `e-image`: `image.src.{id|url, alt}` + `image.size`. `alt` is only accepted for a **URL**
  image; a library image (`src.id`) renders the attachment's own alt text.
* `e-div-block` is **not** a layout container: it may wrap only a **single** child. Two or more
  children → use `e-flexbox` (with `gap`) or `e-grid`. A validator should fail the former.

### 19.6 Note withdrawal — the HEPA crop

The blueprint's HEPA crop note is **withdrawn**: the source and the build are byte-identical,
both 1020×1360. No crop is applied or needed.

### 19.7 Open divergence — the two-column hero and the missing "House Style"

The blueprint describes a **two-column** hero (`hero-copy` + `hero-visual`, with the logos as
six individual `e-image` widgets, ids 65-70). The PHP hero (`section-hero.php:111`) is a
**centered single column** (`flex flex-col items-center justify-center … text-center`), and the
live build keeps that structure with a `shortcode` widget for the logos.

The blueprint cites a **"House Style" brief in four places** (lines 84, 321, 724, 737) — but
**no such document exists anywhere in the repo**: "House Style" appears in no other file, and
`git log -S` finds it only in the commit that introduced the blueprint itself. The two-column
hero therefore has **no traceable source**. This needs a decision before the hero is rebuilt:
either source the brief, or follow the PHP.

### 19.8 Still open (unchanged)

The hero video remains **attachment id 54** — the 3.58 MB original, not the 239,930 B re-encode.
`elementor-json/src/assets.mjs:45` still reads
`heroVideo: { id: 54, file: 'Video-Project-hero.mp4' }`. The re-encode
(`ac42bdb2d85d9cd4f9a8a49008a29159`) is in the theme folder but has never been uploaded to the
Media Library, so there is no new attachment id to point at.

Also still open: the `#hero` anchor (`hero-root` has no `_cssid`) and the 19 hardcoded
`#18181b` heading colours (§18.2).
