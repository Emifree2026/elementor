# Emifree — Global Design Tokens (PHP → Elementor)

**Source of truth:** legacy PHP theme `emifree-landing`
`C:\Users\vpedr\Local Sites\landingwptest\app\public\wp-content\themes\emifree-landing`

**Scope:** front page only (`front-page.php` + `template-parts/section-*.php` + `header.php` + `footer.php`).
English (`/en/`) values are authoritative here; the DE siblings (`*-de.php`) are the same layout with
German strings and are not duplicated in this document.

**Extraction date:** 2026-11-02

**Current Elementor state:** the target page (post `72`, "Elementor Preview") already contains all six
section containers, but the Elementor **kit has no global design tokens** — `uploads/elementor/css/global.css`
is empty and `elementor-get-default-styles` returns an empty string for every tag. Everything in this
document is therefore a **creation instruction for the Architect**, not a diff against existing globals.

---

## 0. Tailwind v3 → Elementor translation notes

The theme is a Tailwind **v3.4.19** build (`tailwind.config.js`, `node_modules/tailwindcss/package.json`).
Only two theme extensions exist (`tailwind.config.js:5-9`):

```js
fontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif'],
  mono: ['Roboto Mono', 'monospace'],
}
```

Everything else is **stock Tailwind v3 palette + stock scale**. That means every colour below is a
stock Tailwind colour, and every size below is a stock Tailwind size — nothing is hand-tuned except
the gradients, the shadows and the hero's inline `clamp()`.

Two practical consequences for the Architect:

1. **Do not translate Tailwind class names into Elementor "styles".** Translate the *resolved values*.
   `text-zinc-900` → `#18181B`; `md:text-5xl` → `48px` at `≥768px`.
2. **Elementor global variables** should be created from the semantic token table in §2 and §3 — not one
   variable per Tailwind colour. The theme uses 4 neutrals for body copy across 2 hue families
   (zinc + slate); that is an artefact of the copy-paste from a React app, and normalising it into
   3 semantic neutrals is the point of the token pass. See §5 *Deviations* for the exact list.

---

## 1. Typography hierarchy

### 1.1 Font families

| Role | Family | Stack | Source |
|---|---|---|---|
| Body / UI / Headings | **Inter** | `Inter, system-ui, sans-serif` | `tailwind.config.js:7` |
| Brand wordmark (footer) only | **Roboto Mono** | `Roboto Mono, monospace` | `tailwind.config.js:8` |

`Roboto Mono` is used in exactly one place — the footer "Emifree" wordmark (`footer.php:28`,
`class="text-3xl font-bold text-blue-400 font-mono"`). It is **not** a code/mono role in the design
system; treat it as a brand display face.

> **Font-loading gap:** neither `Inter` nor `Roboto Mono` is loaded by the theme. There is no
> `@font-face` in `assets/css/main.css` and no Google Fonts `<link>` anywhere in the theme
> (verified by search across `wp-content/plugins` + the theme). On the classic PHP page the browser
> therefore falls back to `system-ui` and the real Inter is never rendered.
> **Action for the Architect:** declare both families in Elementor Global Typography and let
> Elementor's Google Fonts loader enqueue them, so the Elementor page is the first place Inter
> actually renders.

### 1.2 Elementor Global Typography slots (create these)

| Elementor slot | Family | Weight | Line-height | Letter-spacing | Size (desktop / tablet / mobile) | Maps to |
|---|---|---|---|---|---|---|
| **Primary** (H1–H3) | Inter | 700 | 1.15 | -0.02em | 60px / 48px / 36px | Hero H1, section H2, card H3 |
| **Secondary** (H4–H6, accents) | Inter | 600 | 1.4 | 0 | 18px / 18px / 18px | Process step titles, contact card titles, footer column titles |
| **Accent** (eyebrow / label / badge) | Inter | 600 | 1.33 | 0.08em (uppercase) | 14px / 14px / 12px | Logo caption, technology eyebrows, badges, footer legal line |
| **Body** | Inter | 400 | **1.625** | 0 | **16px / 16px / 16px** | Paragraph copy, list items, card descriptions |
| **Body Large** (section lead) | Inter | 400 | 1.4 | 0 | 20px / 20px / 20px | The one-line paragraph under each section H2 |
| **Button** | Inter | 600 | 1.5 | 0 | 20px / 20px / 16px | Hero primary CTA, applications CTA |
| **Button Small** | Inter | 500 | 1.43 | 0 | 14px / 14px / 14px | Nav links, chips, card "Learn more" |
| **Brand Display** | Roboto Mono | 700 | 1.2 | 0 | 30px / 30px / 30px | Footer "Emifree" wordmark |

### 1.3 Full type scale as authored (exact source values)

Sizes are the stock Tailwind v3 scale: `text-xs` 12px · `text-sm` 14px · `text-base` 16px ·
`text-lg` 18px · `text-xl` 20px · `text-2xl` 24px · `text-3xl` 30px · `text-4xl` 36px ·
`text-5xl` 48px · `text-6xl` 60px.

| Element | Classes | Size D / T / M | Weight | LH | Tracking | Colour | Ref |
|---|---|---|---|---|---|---|---|
| Hero H1 | `text-4xl sm:text-5xl md:text-6xl font-bold leading-tight tracking-tight` | 60 / 48 / 36px | 700 | 1.15 | -0.02em | `#FFFFFF` | `template-parts/section-hero.php:112` |
| Hero H1 (LCP inline override) | `font-size: clamp(2.25rem, 6vw, 3.75rem)` | 60 / 48 / 36px | 700 | 1.15 | -0.02em | `#FFFFFF` | `template-parts/section-hero.php:41-49` |
| Hero chip label | `text-sm sm:text-base font-medium` | 16 / 16 / 14px | 500 | 1.5 | 0 | `#FFFFFF` | `section-hero.php:182` |
| Hero secondary link | `text-sm sm:text-base font-medium` | 16 / 16 / 14px | 500 | 1.5 | 0 | `#FFFFFF` | `section-hero.php:213` |
| Hero primary CTA | `text-xl font-semibold` | 20px | 600 | 1.5 | 0 | `#FFFFFF` | `section-hero.php:228` |
| Hero logos caption | `text-[10px] sm:text-xs uppercase tracking-wider` | 12 / 12 / 10px | 400 | 1.33 | 0.05em | `rgba(255,255,255,0.6)` | `section-hero.php:238` |
| Section H2 | `text-4xl md:text-5xl font-bold` | 48 / 36px | 700 | 1.2 | 0 | see §3.3 | `section-products.php:49`, `section-applications.php:39`, `section-technology.php:29`, `section-contact.php:34` |
| Section lead paragraph | `text-xl` | 20px | 400 | 1.4 | 0 | `#52525B` / `#475569` | `section-products.php:52`, `section-applications.php:42`, `section-technology.php:32`, `section-contact.php:37` |
| Section micro-note | `text-sm` | 14px | 400 | 1.43 | 0 | `#64748B` | `section-technology.php:36` |
| Card H3 (products) | `text-2xl font-bold` | 24px | 700 | 1.33 | 0 | `#FFFFFF` | `section-products.php:76` |
| Card H3 (technology) | `text-2xl md:text-3xl font-bold` | 36 / 24px | 700 | 1.2 | 0 | `#0F172A` | `section-technology.php:48` |
| Card H3 (applications) | `text-xl font-bold` | 20px | 700 | 1.4 | 0 | `#18181B` | `section-applications.php:65` |
| Card H3 (contact) | `text-2xl font-bold` | 24px | 700 | 1.33 | 0 | `#18181B` | `section-contact.php:46`, `:61` |
| Card body | *(inherits)* | 16px | 400 | **1.625** (`leading-relaxed`) | 0 | `#52525B` | `section-applications.php:78`, `footer.php:31` |
| SEO question (app card) | `text-sm italic` | 14px | 400 | 1.43 | 0 | `#52525B` | `section-applications.php:88` |
| Bullet list item | *(inherits)* | 16px | 400 | 1.5 | 0 | `#334155` | `section-technology.php:59` |
| Technology badge | `text-xs font-semibold` | 12px | 600 | 1.33 | 0 | `#92400E` / `#6B21A8` | `section-technology.php:45` |
| Technology subtitle | `text-sm` | 14px | 400 | 1.43 | 0 | `#64748B` | `section-technology.php:51`, `:96` |
| Step button label | `text-sm font-medium` | 14px | 500 | 1.43 | 0 | `#334155` / `#1E40AF` | `section-technology.php:109` |
| Process step title | `text-lg font-semibold` | 18px | 600 | 1.55 | 0 | `#0F172A` | `section-technology.php:161` |
| Process step description | *(inherits)* | 16px | 400 | 1.5 | 0 | `#475569` | `section-technology.php:162` |
| CTA card heading | `text-3xl md:text-4xl font-bold` | 48 / 30px | 700 | 1.2 | 0 | `#0F172A` | `section-technology.php:173` |
| CTA card body | `text-lg` | 18px | 400 | 1.55 | 0 | `#334155` | `section-technology.php:176` |
| Contact card title | `font-semibold` | 16px | 600 | 1.5 | 0 | `#18181B` | `section-contact.php:80` |
| Contact card link | *(inherits)* | 16px | 400 | 1.5 | 0 | `#475569` | `section-contact.php:86` |
| Contact card description | `text-sm` | 14px | 400 | 1.43 | 0 | `#64748B` | `section-contact.php:95` |
| Form input text | *(inherits)* | 16px | 400 | 1.5 | 0 | *(browser default)* | `template-parts/partials/contact-form.php:158`+ |
| Form submit button | `text-lg font-semibold` | 18px | 600 | 1.55 | 0 | `#FFFFFF` | `partials/contact-form.php:217` |
| Form error text | `text-sm text-red-500` | 14px | 400 | 1.43 | 0 | `#EF4444` | `partials/contact-form.php:160` |
| Nav link | `text-sm font-medium` | 14px | 500 | 1.43 | 0 | `#18181B` | `header.php:64` |
| Header phone CTA | `text-sm font-medium` | 14px | 500 | 1.43 | 0 | `#FFFFFF` | `header.php:77` |
| Language chip | `text-sm font-medium` | 14px | 500 | 1.43 | 0 | `#3F3F46` | `header.php:100` |
| Footer wordmark | `text-3xl font-bold font-mono` | 30px | 700 | 1.2 | 0 | `#60A5FA` | `footer.php:28` |
| Footer body | `text-zinc-400` | 16px | 400 | 1.625 | 0 | `#A1A1AA` | `footer.php:31` |
| Footer column title | `font-semibold` | 16px | 600 | 1.5 | 0 | `#FFFFFF` | `footer.php:56` |
| Footer link | *(inherits)* | 16px | 400 | 1.5 | 0 | `#A1A1AA` | `footer.php:95` |
| Footer legal line | `text-sm` | 14px | 400 | 1.43 | 0 | `#A1A1AA` | `footer.php:142` |

### 1.4 Body-text note

The requested target is a **16px base at 1.5–1.6 line-height**. The theme is consistent with that:
the base is 16px (Tailwind `text-base`), and `leading-relaxed` (1.625) is the only place that
exceeds the 1.6 ceiling — used for the applications card description (`section-applications.php:78`)
and the footer tagline (`footer.php:31`). Everything else inherits Tailwind's 1.5.

**Recommendation:** set the Body global slot to `16px / 1.6` and use it as the floor for all
paragraph copy. Do **not** port `leading-relaxed` (1.625) into the global — keep it as a one-off
utility on the two long-form paragraphs.

---

## 2. Colour palette

### 2.1 Semantic token table (create these as Elementor Global Colours)

| Slot | Token | Hex | Role in the design |
|---|---|---|---|
| **Primary** | `primary` | **`#1D4ED8`** (blue-700) | Brand blue. Gradient start on every CTA; nav hover; active step pill. |
| **Primary (strong)** | `primary-strong` | `#1E40AF` (blue-800) | Product-card footer gradient end; hover state. |
| **Primary (interactive)** | `primary-action` | `#2563EB` (blue-600) | Icon-tile gradient start; header phone CTA; product-card footer gradient start; inline "Learn How It Works" link. |
| **Secondary** | `secondary` | **`#06B6D4`** (cyan-500) | Gradient end on every CTA — the brand's secondary hue. |
| **Secondary (deep)** | `secondary-deep` | `#0891B2` (cyan-600) | Reserved; no current use on the front page. |
| **Text (heading)** | `text-heading` | **`#0F172A`** (slate-900) | Dark headings (technology, contact, products, CTA card). |
| **Text (heading alt)** | `text-heading-alt` | **`#18181B`** (zinc-900) | Dark headings (applications, contact cards) **and** the footer background. |
| **Text (body)** | `text-body` | **`#475569`** (slate-600) | Paragraph copy on slate-family sections. |
| **Text (body alt)** | `text-body-alt` | `#52525B` (zinc-600) | Paragraph copy on zinc-family sections (applications, products lead). |
| **Text (muted)** | `text-muted` | `#64748B` (slate-500) | Subtitles, timestamps, descriptions under contact cards. |
| **Text (subtle)** | `text-subtle` | `#A1A1AA` (zinc-400) | Footer copy, footer links. |
| **Text (on-dark)** | `text-on-dark` | `#FFFFFF` | All copy on the dark hero and footer. |
| **Accent (link)** | `accent-link` | **`#2563EB`** (blue-600) | Inline links, "Learn more", "Learn How It Works". |
| **Accent (link hover)** | `accent-link-hover` | `#1D4ED8` (blue-700) | Link hover. |
| **Accent (soft)** | `accent-soft` | `#93C5FD` (blue-300) | Hero chip icons. |
| **Background (light)** | `bg-light` | **`#FFFFFF`** | Card surfaces, products + applications sections. |
| **Background (light alt)** | `bg-light-alt` | **`#F8FAFC`** (slate-50) | Section background behind products / technology / contact. |
| **Background (tint)** | `bg-tint` | `#EFF6FF` (blue-50) | Technology CTA card; section gradient end. |
| **Background (dark)** | `bg-dark` | **`#0F172A`** (slate-900) | Reserved dark surface. |
| **Background (dark deep)** | `bg-dark-deep` | **`#1E293B`** (slate-800) | Reserved dark surface / dark border. |
| **Background (footer)** | `bg-footer` | `#18181B` (zinc-900) | Footer surface (actual value in the theme). |
| **Background (hero)** | `bg-hero` | `#0A0A0A` | Hero base layer behind the video. |
| **Border (subtle)** | `border-subtle` | `#F1F5F9` (slate-100) | Card borders. |
| **Border (default)** | `border-default` | `#E2E8F0` (slate-200) | Input borders, footer inner divider is `#27272A` (zinc-800). |
| **Border (strong)** | `border-strong` | `#CBD5E1` (slate-300) | Secondary button border in the technology CTA card. |
| **Status (success)** | `status-success` | `#059669` (emerald-600) | Technology bullet check icon. |
| **Status (warning)** | `status-warning-bg` / `status-warning-fg` | `#FEF3C7` / `#92400E` | ECO AIR badge. |
| **Status (info)** | `status-info-bg` / `status-info-fg` | `#F3E8FF` / `#6B21A8` | EARIA badge. |
| **Status (error)** | `status-error` | `#EF4444` (red-500) | Contact-form field errors. |

### 2.2 Where each token actually appears

| Token | Files |
|---|---|
| `#1D4ED8` / `#06B6D4` | `section-hero.php:229`, `section-applications.php:39`,`:101`, `section-technology.php` (inline label gradient), `partials/contact-form.php:218` |
| `#2563EB` | `section-applications.php:56`, `section-contact.php:65`, `section-products.php:75`, `section-technology.php:124`, `header.php:77`, `:133`, `:217` |
| `#0F172A` | `section-technology.php:29`,`:48`,`:93`,`:161`,`:173` |
| `#18181B` | `section-products.php:49`, `section-applications.php:65`, `section-contact.php:34`,`:46`,`:61`,`:80`, `header.php:64`, `footer.php:19` |
| `#475569` | `section-technology.php:32`,`:54`,`:59`,`:162`,`:176`, `section-contact.php:86`,`:91` |
| `#52525B` | `section-products.php:52`, `section-applications.php:42`,`:78`,`:88` |
| `#64748B` | `section-technology.php:36`,`:51`,`:96`, `section-contact.php:95` |
| `#A1A1AA` | `footer.php:31`,`:95`,`:142`,`:157`,`:159` |
| `#334155` | `section-technology.php:59`,`:176` |
| `#E2E8F0` | `header.php:91`, `:165`, `partials/contact-form.php:158`+ |
| `#F1F5F9` | `section-applications.php:53`, `section-technology.php:44`,`:91`, `header.php:60` |
| `#FFFFFF` | `section-hero.php` (all), `section-technology.php:72`+ |

### 2.3 Background surfaces, in page order

| # | Section | Background |
|---|---|---|
| 1 | Header | `#FFFFFF` (`header.php:29`, `bg-white`), fixed, h-64px |
| 2 | Hero | `#0A0A0A` base + video + scrim (§4.2) |
| 3 | Products | `#F8FAFC` (`section-products.php:45`, `bg-slate-50`) |
| 4 | Applications | `#FFFFFF` (`section-applications.php:35`, `bg-white`) |
| 5 | Technology | `#F8FAFC` → `#FFFFFF` → `#EFF6FF` diagonal gradient at ≥768px (`section-technology.php:24`) |
| 6 | Knowledge | *see `sections-map.md`* |
| 7 | Contact | `#F8FAFC` → `#FFFFFF` → `#EFF6FF` diagonal gradient at ≥768px (`section-contact.php:29`) |
| 8 | Footer | `#18181B` (`footer.php:19`, `bg-zinc-900`) |

**Rhythm note:** the light/dark alternation is `slate-50 → white → gradient → … → zinc-900`.
Products (`slate-50`) and Applications (`white`) are adjacent light-on-light with no separator —
in the Elementor rebuild, keep the 96px section padding as the only separator or introduce a
hairline border; do not change the colour values.

### 2.4 Gradients (define as Elementor background gradients)

| Name | CSS | Used by |
|---|---|---|
| **Brand CTA** | `linear-gradient(90deg, #1D4ED8 0%, #06B6D4 100%)` | Hero primary CTA (`section-hero.php:229`), Applications "Find Your Solution" (`section-applications.php:101`), contact submit (`partials/contact-form.php:218`), Technology section-label text |
| **Icon tile** | `linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)` | 64px application icon tile (`section-applications.php:56`), 48px contact icon tile (`section-contact.php:65`) |
| **Product card footer** | `linear-gradient(180deg, #2563EB 0%, #1E40AF 100%)` → hover `linear-gradient(180deg, #1D4ED8 0%, #1E3A8A 100%)` | `section-products.php:75` |
| **Section ambient** | `linear-gradient(to bottom right, #F8FAFC 0%, #FFFFFF 50%, #EFF6FF 100%)` | Technology + Contact sections, ≥768px (`section-technology.php:24`, `section-contact.php:29`) |
| **Hero scrim** | `linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.50) 50%, rgba(0,0,0,0.70) 100%)` | `section-hero.php:102` |
| **Hero emerald tint** | `linear-gradient(to bottom right, rgba(16,185,129,0.05) 0%, transparent 100%)` | `section-hero.php:103` |

---

## 3. Elementor container / spacing tokens

### 3.1 Breakpoints (Tailwind v3 defaults)

| Name | Min width | Role in this design |
|---|---|---|
| `sm` | 640px | Hero chips switch to 16px label; logo strip stops wrapping; applications CTA row becomes horizontal (`sm:flex-row`) |
| `md` | 768px | **Primary breakpoint.** Section H2 36→48px; hero H1 48→60px; applications grid 1→2 col; technology selector cards 1→2 col; step list switches from mobile pills to desktop rows; section ambient gradients switch on |
| `lg` | 1024px | Products grid 2→3 col; applications grid 2→3 col; technology/contact 2-column split; footer 5-col grid; container padding 24→32px |
| `xl` | 1280px | Container max-width reached (1280px) |

### 3.2 Container

| Token | Value | Ref |
|---|---|---|
| Max width | `80rem` / **1280px** (`max-w-7xl`) | all sections |
| Gutter — mobile | `1rem` / 16px (`px-4`) | all sections |
| Gutter — tablet (≥640) | `1.5rem` / 24px (`sm:px-6`) | all sections |
| Gutter — desktop (≥1024) | `2rem` / 32px (`lg:px-8`) | all sections |
| Footer container | identical (`max-w-7xl`, same gutters) | `footer.php:20` |

### 3.3 Spacing scale (values actually used)

| Token | Value | Use |
|---|---|---|
| Section padding — mobile | `3rem` / 48px (`py-12`) | every section |
| Section padding — desktop | `6rem` / 96px (`md:py-24`) | every section |
| Footer main block | `4rem` / 64px (`py-16`) | `footer.php:23` |
| Footer bottom bar | `2rem` / 32px (`py-8`) | `footer.php:121` |
| Heading block → content | `3rem` / 48px (`mb-12`) | Products |
| Heading block → content | `5rem` / 80px (`mb-20`) | Applications, Technology, Contact |
| CTA block offset | `4rem` / 64px (`mt-16`) | Applications CTA (`section-applications.php:97`) |
| Grid gap — cards | `1.5rem` / 24px (`gap-6`) | Products grid |
| Grid gap — cards | `2rem` / 32px (`gap-8`) | Applications grid, Technology selector cards |
| Grid gap — 2-col split | `3rem` / 48px (`gap-12`) | Technology process row, Contact columns |
| Content max-width | `48rem` / 768px (`max-w-3xl`) | section lead paragraphs |
| Content max-width | `56rem` / 896px (`max-w-4xl`) | Technology CTA card |
| Content max-width | `42rem` / 672px (`max-w-2xl`) | Technology CTA body |
| Card padding | `1.5rem` / 24px (`p-6`) → `2rem` / 32px (`md:p-8`) | Technology + contact cards |
| Application card padding | `1.5rem` (24px) → `2rem` on hover (32px) | `section-applications.php:53` |

### 3.4 Radii

| Token | Value | Use |
|---|---|---|
| `rounded-full` | 9999px | All pills: CTAs, chips, nav pill, language menu button, mobile step pills, footer social buttons |
| `rounded-3xl` | `1.5rem` / 24px | Technology cards, process panels, contact form card, CTA card |
| `rounded-2xl` | `1rem` / 16px | Product cards, application cards, contact info cards, icon tiles, image frames |
| `rounded-xl` | `0.75rem` / 12px | Language dropdown, form inputs, desktop step rows, result banner |
| `rounded-2xl` on icon tile | 16px | Application icon tile is `w-16 h-16 rounded-2xl` (24px container, 16px radius) |

### 3.5 Shadows

| Name | CSS | Use |
|---|---|---|
| `shadow-md` | Tailwind md | Product card (`section-products.php:62`) |
| `shadow-lg` | Tailwind lg | Application card, contact info card |
| `shadow-xl` | Tailwind xl | Technology card, process panel, contact form card, CTA card, header phone CTA |
| `shadow-2xl` | Tailwind 2xl | Hover state on all of the above |
| Icon-tile glow | `0 10px 25px rgba(37,99,235,0.25)` | Application icon tile (`section-applications.php:56`) |
| CTA glow | `0 10px 25px rgba(6,182,212,0.25)` | Applications CTA (`section-applications.php:101`), contact submit (`partials/contact-form.php:218`) |
| Contact-icon glow | `0 8px 20px rgba(37,99,235,0.20)` | Contact info icon tile (`section-contact.php:65`) |
| Badge shadow | `0 4px 16px rgba(0,0,0,0.35)` | ISO 9001 badge in footer (`footer.php:149`) |
| Card title shadow | `drop-shadow-md` | Product card H3 over the gradient (`section-products.php:76`) |

---

## 4. Motion & interaction tokens

| Token | Value | Ref |
|---|---|---|
| Fast | `200ms` (`duration-200`) | chips, links, nav, form inputs |
| Base | `300ms` (`duration-300`) | card hover lift, icon scale, colour shifts |
| Slow | `500ms` (`duration-500`) | product card image `scale-105` |
| Hero entrance | `hero-fade-up` — `0.7s ease-out both`, `translateY(20px)→0` | `assets/css/tailwind.src.css:64-67` |
| Hero fade | `hero-fade-in` — `0.3s ease-out both` | `assets/css/tailwind.src.css:59-62` |
| Hero stagger | 0ms (H1) / 150ms (chips) / 300ms (secondary link) / 450ms (primary CTA) | `section-hero.php:112`,`:146`,`:214`,`:229` |
| Hero video cross-fade | `1000ms` opacity (`transition-opacity duration-1000`) | `section-hero.php:83`,`:93` |
| Easing | Tailwind default `cubic-bezier(0.4,0,0.2,1)`; `ease-out` on app-card body | `section-applications.php:77` |
| Scroll | `scroll-behavior: smooth` on `html`, disabled under `prefers-reduced-motion` | `assets/css/tailwind.src.css:28-38` |

**LCP note (must survive the rebuild):** the hero H1 is the intended LCP element. The theme ships an
inline `<style>` block forcing `font-size: clamp(2.25rem, 6vw, 3.75rem)` on `#hero > div > h1` so the
headline renders at final size on first paint instead of waiting for the stylesheet
(`section-hero.php:40-50`). The hero fade animations also start at `opacity: 0.001`, never `0`, for
the same reason (`assets/css/tailwind.src.css:59-62`). **In Elementor, set the hero heading size
directly on the widget (not via a global + responsive override) and keep the entrance animation
opacity-floor at ≥0.001.**

---

## 5. Deviations from the requested target spec — action required

| # | Requested target | Actual in the PHP | Action |
|---|---|---|---|
| 1 | Background light alt `#F9FAFB` | `#F8FAFC` (slate-50) | Use **`#F8FAFC`**. It is the stock Tailwind value actually painted; `#F9FAFB` is Tailwind `gray-50` and would introduce a third neutral family. |
| 2 | Background dark `#0F172A` + `#1E293B` | `#0F172A` (slate-900) is **not used as a surface anywhere**; the footer is `#18181B` (zinc-900) and the hero base is `#0A0A0A` | Create `bg-dark` = `#0F172A` and `bg-dark-deep` = `#1E293B` as **reserved** globals for future dark surfaces, and map the footer to a dedicated `bg-footer` = `#18181B`. Do not silently recolour the footer — it is the one place the zinc family is load-bearing. |
| 3 | Text dark neutral `#111827` or `#1F2937` | Two different values in use: `#0F172A` (slate-900) and `#18181B` (zinc-900) | Create `text-heading` = **`#0F172A`** (the higher-contrast of the two, and matches the requested intent). Then fold `#18181B` into it and update the applications / contact / nav headings to match — they are visually indistinguishable on white, so this is a safe normalisation. |
| 4 | Body 16px @ 1.5–1.6 | 16px base, `leading-relaxed` (1.625) on two paragraphs | Global body = `16px / 1.6`; keep 1.625 as a per-widget override on the applications card description and footer tagline only. |
| 5 | Accent = CTAs/links | Links use `#2563EB`, CTAs use the `#1D4ED8→#06B6D4` gradient | `accent-link` = `#2563EB`; CTAs keep the brand gradient. Do not flatten the CTA to a solid colour — the gradient is the brand's primary CTA signature and appears on 4 surfaces. |
| 6 | — | **No Elementor global tokens exist.** `uploads/elementor/css/global.css` is empty; `elementor-get-default-styles` returns `""` for every tag. | Everything above must be **created**, not patched. Creating the globals first, then binding the existing section widgets to them, is the recommended order. |
| 7 | — | `Inter` / `Roboto Mono` are declared in `tailwind.config.js` but **never loaded** — no `@font-face`, no Google Fonts link anywhere in the theme. The classic PHP page renders in `system-ui`. | Declare both families as Elementor Global Typography. The Elementor page becomes the first place the real Inter renders. Verify against the classic page before cutover. |

---

## 6. Quick reference for the Architect

**Global Colours to create (in order):**
`primary` #1D4ED8 · `secondary` #06B6D4 · `text-heading` #0F172A · `text-body` #475569 ·
`text-muted` #64748B · `text-subtle` #A1A1AA · `text-on-dark` #FFFFFF · `accent-link` #2563EB ·
`bg-light` #FFFFFF · `bg-light-alt` #F8FAFC · `bg-tint` #EFF6FF · `bg-dark` #0F172A ·
`bg-dark-deep` #1E293B · `bg-footer` #18181B · `border-subtle` #F1F5F9 · `border-default` #E2E8F0 ·
`status-success` #059669 · `status-error` #EF4444

**Global Typography to create (in order):**
`Primary` Inter 700 · `Secondary` Inter 600 · `Accent` Inter 600 · `Body` Inter 400 ·
`Body Large` Inter 400 · `Button` Inter 600 · `Button Small` Inter 500 · `Brand Display` Roboto Mono 700

**Global Sizes:** 1280px container · 768px content · 96px section padding (desktop) · 48px (mobile)

**Global custom properties (CSS vars):**
`--emifree-gradient-brand` · `--emifree-gradient-tile` · `--emifree-gradient-card` ·
`--emifree-gradient-ambient` · `--emifree-gradient-hero-scrim`

---

## 7. Type stack — audited on the live Elementor page (2026-11-02)

The three stacks in play, measured from the running site:

| Where | Declared | Actually rendered |
|---|---|---|
| Theme intent (`tailwind.config.js`) | `Inter` sans, `Roboto Mono` mono | — |
| Classic PHP page | `Inter`, `system-ui` | **`system-ui`** — neither webfont is ever fetched, so the theme has always rendered in the OS UI font |
| Live Elementor page (post 72) | Elementor kit defaults | **Roboto + Roboto Slab**, fetched from `fonts.googleapis.com` |

So the classic page and the Elementor page do **not** share a typeface, and neither of them
shows the intended Inter/Roboto Mono. The Roboto Slab in particular is a **serif** — it is not
in the theme's palette at all and will show up in every heading that inherits the kit's
`Primary` slot.

**Recommendation — one stack, loaded for real:**

- Sans: **Inter** (400 / 500 / 600 / 700) — self-host it or load it from Google Fonts with
  `display=swap`; the theme declares it but never enqueues it.
- Mono: **Roboto Mono** (700) for the wordmark and any mono label.
- Replace the kit's Roboto / Roboto Slab slots with these, or every atomic element that
  inherits the kit typography silently changes face at cutover.

**Also note:** the live page loads `classic-theme-styles-inline-css` next to
`elementor-frontend-inline-css`. While the header/footer stay in the theme, both CSS bundles
ship to the browser — budget for that in the performance pass.

**Hero video weight (LCP path).** The live Elementor hero plays the *pre-compression* encode
(3,580,094 B). The theme's re-encoded copy is 239,930 B. Point the `e-background-video` element
(`5b4bd92`) at the compressed file — see `sections-map.md` §16.2 item A.

---

## 8. Token state after the blueprint (2026-11-02, later pass)

- **The global tokens in §6 now exist.** Verified in `uploads/elementor/css/post-51.css`: the
  `:root` block carries all 26 colour variables (`--primary: #1D4ED8`, `--text-heading: #0F172A`,
  `--text-body: #475569`, `--accent-link: #2563EB`, …) plus `--font-body: Inter` and
  `--font-mono: Roboto Mono`. Created by @Archi; step 0 of the build is complete.
- **§7 is partly superseded.** The Elementor page now fetches **four** families — Inter,
  Roboto Mono (from the V4 font variables, which do trigger the enqueue) **plus** Roboto and
  Roboto Slab (from the kit's *classic* typography, which still emits them). Fix in
  *Site Settings → Typography*: Primary / Text / Accent → Inter, Mono → Roboto Mono.
  The MCP cannot reach those settings.
- **Still true from §7:** the classic `/en/` and `/de/` pages render `system-ui`. The theme names
  Inter in `tailwind.config.js` but never enqueues it — theme-side fix required before cutover.
- **Hero video weight** unchanged: the live page still serves the 3,580,094 B original
  (MD5 `2b0645a5fc981c7ef53925d9b4f0d064`, byte-identical to git HEAD) instead of the theme's
  239,930 B re-encode (`ac42bdb2d85d9cd4f9a8a49008a29159`). Commit and upload it.
