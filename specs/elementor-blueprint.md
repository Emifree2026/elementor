# Emifree — Elementor Container Blueprint (PHP → Elementor V4 Flexbox)

**Target:** WordPress page `72` — "Elementor Preview" (EN, published) · `http://landingwptest.local/elementor-preview/`
**German twin:** page `135` — "Elementor Vorschau (DE)" (draft) — same tree, German strings.

**Inputs:**
- `specs/sections-map.md` — content inventory, copy, URLs, behaviour mapping (Extractor, 2026-11-02)
- `specs/design-tokens.md` — colour / type / spacing tokens (Extractor, 2026-11-02)
- `template-parts/section-*.php` + `inc/*.php` — the PHP source of truth

**Blueprint date:** 2026-11-02
**Status:** implementation-ready. Every element below is a native Elementor widget. No HTML widget is
used anywhere. No legacy Section/Column is used anywhere.

**Where this file lives:**
`wp-content/themes/emifree-landing/specs/elementor-blueprint.md` — the same `specs/` folder as
`design-tokens.md` and `sections-map.md`. All three are **on disk** (read them from there; no
sibling-copy or out-of-tree path).

---

## 0. How to read this document

Each section blueprint is written in five parts:

1. **Tree** — the element hierarchy, one line per element, indented by depth. `▸` marks a container,
   `•` marks a widget. The `L1/L2/L3` prefix is the **container depth level** (see §1.2).
2. **Widget map** — the tree line → the exact Elementor widget type → the copy / asset / link.
3. **Style** — the CSS that goes into the element's *Style* field (raw CSS, no HTML widget).
4. **Responsive** — the Tablet / Mobile overrides.
5. **Notes** — source fidelity, deviations, editor notes.

A tree line reads:

```
L1 ▸ products-section            e-flexbox    column · full width · bg bg-light-alt
L2 ▸ products-grid               e-grid       boxed 1280 · 3 col / 2 col / 1 col · gap 32
L3 ▸ card-mechanical             e-flexbox    column · card surface
  • card-mechanical-image        e-image      id 78
```

`boxed` means: `max-width: 1280px; margin-inline: auto; padding-inline: 32px` (24px ≤1024, 16px ≤767).

### 0.1 Output format contract (binding — read before writing any JSON)

This section answers the three questions that decide what you emit. **Do not infer the format from
the PHP templates — the target is an atomic document.**

#### (a) Which element model: **atomic / V4.** Not legacy V3.

**Emit atomic/V4.** This blueprint describes the target page exclusively in atomic element types,
and every `elType` named in it is an atomic type:

| Role | Atomic `elType` to emit |
|---|---|
| Row / column container | `e-flexbox` |
| Grid container | `e-grid` |
| Plain block / flow wrapper — **never a layout container** | `e-div-block` (see §1.1 — one narrow, permitted role) |
| Heading | `e-heading` (`tag: h1`–`h6`, text in `title`) |
| Body copy / list | `e-paragraph` (`text` in `paragraph`, `tag: p`\|`span`) |
| Button | `e-button` (`text` in `text`, `link`) |
| Image | `e-image` (`image: {src: {id}, size}` — or `image: {src: {url, alt}, size}`) |
| Icon | `e-svg` (`svg: {id}`) |
| Background video | `e-background-video` (+ `e-background-video-content`, `e-background-video-controls`) |
| Accordion | `e-accordion` (+ `e-accordion-item`, `-header`, `-title`, `-icon`, `-content`) |
| Tabs | `e-tabs` (+ `e-tabs-menu`, `e-tab`, `e-tabs-content-area`, `e-tab-content`) |
| Form | `e-form` (+ `e-form-input`, `-textarea`, `-label`, `-submit-button`, `-success-message`, `-error-message`) |

**Do not emit legacy V3.** The legacy widget classes (`includes/widgets/heading.php`,
`text-editor.php`, `button.php`, `image.php`, `icon-box.php`) and `elType: "container"` /
`"section"` / `"column"` with `isInner` are **not** used anywhere in this blueprint. Reasons, in
order of weight:

1. **The live target is atomic.** Post 72 is already an atomic document (`e-flexbox`, `e-grid`,
   `e-accordion`, `e-form`, `e-background-video`). Mixing models in one document produces a page
   that cannot be round-tripped and that the Elementor MCP tooling cannot read back.
2. **The MCP server's `list-widget-schemas` exposes only atomic types** — `e-heading`,
   `e-paragraph`, `e-button`, `e-image`, `e-svg`, `e-flexbox`, `e-grid`, `e-div-block`,
   `e-tabs*`, `e-accordion*`, `e-form*`, `e-background-video*`, `e-collection-loop*`. There is no
   legacy `heading` / `text-editor` / `button` / `image` / `icon-box` in the registry, so a legacy
   document cannot be built or validated through the same toolchain.
3. **Any validator running against this blueprint will use the atomic schema.** Emit atomic.

Corollary for the "House Style" vocabulary in the brief: *heading* → `e-heading`,
*text-editor* → `e-paragraph`, *button* → `e-button`, *image* → `e-image`,
*icon-box* → `e-svg` (there is no icon-box; an icon tile is an `e-svg` with a gradient background
and `color` set on the widget). §1.5 is the full mapping table.

#### (b) ID convention

| Context | Convention |
|---|---|
| **Element `id`** (in raw JSON) | **Unique 7-character alphanumeric**, e.g. `a1b2c3d`. Elementor-native; matches what the live document and the MCP server use. **Every id in the document must be unique** — duplicates corrupt the tree. |
| **Readable name** | Goes in `editor_settings.title` (V4) — e.g. `hero-root`, `card-mechanical`, `app-cnc-icon`. The blueprint's tree lines are these names. They are **not** ids. |
| **CSS hook** | Use `_cssid` where the blueprint asks for one (`hero` → `id="hero"`, `contact` → `id="contact"`, `products`, `applications`, `technology`, `knowledge`). `_cssid` lands on the element itself. |
| **Via the MCP** | Never hand-write ids. `elementor-build-composition` takes a **`configuration-id`** (any non-empty unique string per call — use the blueprint's readable names) and the **server assigns** the element ids. `elementor-manage-elements` then takes those returned ids. |

> If you are writing raw JSON rather than driving the MCP, use the 7-char alphanumeric ids and put
> the readable name in `editor_settings.title`. If you are driving the MCP, use the readable names
> as `configuration-id` and let the server assign ids — do **not** pass ids in `xml_structure`.

#### (c) Scope — **6 sections, post 72 only**

In scope, in this order:

| # | Section | Blueprint | Live element id |
|---|---|---|---|
| 1 | Hero | §3 | `49847864` (`hero-root`) |
| 2 | Products | §4 | `2691800c` |
| 3 | Applications | §5 | `3416f16c` |
| 4 | Technology | §6 | `1d342fa3` |
| 5 | Knowledge | §7 | `6fb3a25c` |
| 6 | Contact | §8 | `765cb5f5` |

**Out of scope:**

- **Header and footer — they stay PHP.** They are theme chrome (`emifree-header`, the language
  dropdown, the mobile menu, the Silktide cookie link). No Theme Builder templates, no Elementor
  header/footer. Rebuild the `<main>` body only. (Confirmed decision, §9.2.)
- **The German twin (post 135)** — same tree, German strings, `Emifree Contact (DE)`. Build it
  **after** post 72 is signed off (§10.1 step 7).
- **The `/en/` and `/de/` classic PHP pages** — they stay live until the Elementor document is
  published. Do not touch them.
- **Knowledge sub-pages** — they are virtual rewrite routes, not WordPress pages. Do **not** create
  Elementor documents at `/en/knowledge/…` (flag 16, §9.3).

**Stop conditions — do not build past these:**
- The contact form's `form-name` **must** start with `Emifree Contact` or the antispam core is
  silently disabled (§8.2). Non-negotiable.
- The two catalogue PDFs do not exist on disk — do not link them (§9.3, flag 14).
- No invented copy, ever. Every string is in §3–§8 or in the PHP.

---

## 1. Global architecture contract

### 1.1 The three-level grammar (binding)

Every section on the page is built from exactly this grammar. There is no fourth structural level.

| Level | Role | Element type | Direction | Sizing | Gaps |
|---|---|---|---|---|---|
| **L1** | **Root Section Container** | `e-flexbox` | `column` | full width (`width:100%`) | 48–80px between the L2 blocks |
| **L2** | **Inner Box / Row / Grid** | `e-flexbox` (row/col) or `e-grid` | `row` / `column` / grid | `boxed` 1280 unless stated | 32px between siblings, 64px between major blocks |
| **L3** | **Card Container** | `e-flexbox` | `column` (or `row` for a card's internal split) | fluid, 1/2/3 of the L2 track | 24–32px |

- **L1** owns: background colour / gradient, section padding
  (`padding-block: 96px` desktop, `48px` mobile), `scroll-margin-top: 80px`, `position: relative`,
  and the **block gap** between its L2 children (48px Products · 80px Applications + Technology ·
  64px Knowledge + Contact — mirroring the PHP's `mb-12` / `mb-16` / `mb-20`).
- **L2** owns: the 1280px measure, the gutter, and the row/grid that arranges the cards.
- **L3** owns: card surface, radius, border, shadow, internal padding, hover behaviour.

**`e-div-block` is not a layout container.** The grammar above is `e-flexbox` / `e-grid` only.
`e-div-block` is a plain block with **normal document flow** — no `gap`, no row/column semantics,
no grid tracks. It has exactly **one** permitted role:

| Permitted | Example |
|---|---|
| A **single-child** visual wrapper that needs its own background, padding, radius or border (a tile around one widget) | the gradient icon tile in §3.1 / §5.2 |

It is **prohibited wherever siblings are being arranged** — a column of cards, a row of chips, a
label+input pair, a step list. That is what `e-flexbox` / `e-grid` are for. A validator should
**fail** an `e-div-block` used as a layout wrapper: if it holds **two or more** children, it is a
layout container in disguise — replace it with `e-flexbox` (`flex-direction: column` + a `gap`).
This is a hard rule, not a preference (§1.6).

**Padding values** sit inside the mandated ranges: 96px desktop (rule: 80–120px), 48px mobile
(rule: 40–60px).

**Gap values** sit inside the mandated range: 32px for component gaps (rule: 20–32px). The
48–80px gap between *major blocks* inside a section is section rhythm, not component spacing, and
mirrors the PHP's `mb-12` / `mb-16` / `mb-20`.

### 1.2 Nesting depth — rule and the one permitted exception

**Rule (binding):** never nest containers more than 3 levels deep.
`Root Container (L1) → Inner Row/Grid (L2) → Card Container (L3) → widgets.`

An L3 card container contains **widgets only**. If a card needs an inner split, that split must be
expressed with a widget (`e-paragraph` with `<ul>`, `e-svg` with a gradient tile, an `e-tabs`
widget) or by making the card itself `flex-direction: row`.

**Exception E1 — inline-group leaf (the only permitted L4 container).**

*Where:* an L3 content column needs **2 or more sibling widgets laid out inline** (a chip strip, a
button group). A flex row is the only way to give them a real `gap`, and this Elementor install
has **no Button Group, Icon List or Icon Box widget** (verified against the live widget registry —
§1.5), so the group cannot be a single widget.

*Shape:* one `e-flexbox` container, `flex-direction: row`, `flex-wrap: wrap`, `align-items: center`,
`gap: 12–16px`, containing **widgets only** — never another container.

*Instances in this build — exactly three:*

| # | Instance | Blueprint ref |
|---|---|---|
| E1-a | Hero value-chip strip (3 chips) | §3.1 `hero-badge` |
| E1-b | Hero CTA button group (primary + secondary) | §3.1 `hero-cta` |
| E1-c | Technology CTA card button group (2 buttons) | §6.5 `technology-cta-actions` |

*Fallback if the user prefers zero exceptions:* delete the three group containers and let the
buttons/chips stack vertically inside their L3 column. No other change. One line per instance.

**Native widget internals are not editor containers and do not count toward the depth cap:**
`e-background-video` (+ content / controls), `e-tabs` (+ menu / tab / content-area / tab-content),
`e-accordion` (+ item / header / title / icon / content), `e-form` (+ messages), `e-collection-loop`.

### 1.3 Breakpoint mapping

Elementor breakpoints are max-width; Tailwind breakpoints are min-width. The mapping used here:

| Source (Tailwind) | Range | Elementor | Applied as |
|---|---|---|---|
| base (`<640`) | — | **Mobile** | Mobile override |
| `sm` (≥640) | 640–767 | **Mobile** (nearest) | Mobile override — *deviation: fires ~640px early* |
| `md` (≥768) | 768–1024 | **Tablet** | Tablet override |
| `lg` (≥1024) | ≥1025 | **Desktop** | Desktop (base) value |

**Working rule:** write the **Desktop (base)** value with the largest number, then override at
**Tablet**, then at **Mobile**. Tailwind's `sm:` utilities have no exact Elementor equivalent and
are folded into Mobile — flagged in §9.

**Why the bands tile exactly.** Elementor's bands are `--mobile` (≤767px), `--tablet` (768–1024px)
and desktop (>1024px). The tablet band is effectively **768–1024**, not 0–1024, because the mobile
stylesheet is enqueued **after** the tablet one — at ≤767px both media queries match and the
mobile rule wins. A Tailwind `md:` value (≥768px) therefore lands exactly on the tablet band, and
the `<768px` value lands exactly on the mobile band. The mapping above is exact for every
`md:`/`lg:` rule; only `sm:` is lossy.

> **Proof from the live page (post 72, generated CSS 2026-11-02).** The products grid
> (`e-5c56d7dc-2481`) appears in **both** breakpoint files:
> `local-72-frontend-tablet.css` → `@media(max-width:1024px){…grid-template-columns:repeat(2, 1fr);}`
> `local-72-frontend-mobile.css` → `@media(max-width:767px){…grid-template-columns:1fr;}`
> with the desktop base carrying `repeat(3, 1fr)` — three → two → one, exactly as the PHP's
> `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`.

**Two-state exception — write the value once in the base, override only at `--mobile`.**
When the source has only **two** states (e.g. "≥768px" vs "below 768px") there is no separate
tablet value: the tablet band and the desktop band carry the *same* value. Put it in the **base**
and override only the mobile band:

```
/* PHP: vertical from 768px up, horizontal below 768px */
flex-direction: row;                            /* base — vertical from 768px up */
@media (--mobile) { flex-direction: column; }    /* horizontal below 768px */
```

This is the case in **§6.4** (the technology step switcher) and in §3.4 / §7.3. It is **not** a
contradiction of the table above — it is the same rule with the tablet and desktop values equal.

> ⚠️ **The trap — do not generalise "a `md:` rule is a `--mobile` override".** That holds **only**
> for a two-state rule. For a rule with a separate tablet value (`md:` → 2 cols, `lg:` → 3 cols)
> the `md:` value goes in `@media (--tablet)` and the `<768px` value in `@media (--mobile)`.
> Writing the `md:` value only into `--mobile` would apply it across the whole tablet band too
> and break the 768–1024 layout.

Every container that must stack on smaller screens gets, in its Style field:

```
@media (--mobile) { flex-direction: column; }
@media (--tablet) { flex-direction: column; }   /* only where the source stacks at md */
```

Use `@media (--mobile)` / `@media (--tablet)` — **never** `@media (max-width: 767px)`.

### 1.4 Global tokens

Create these as **Elementor Global Colours** on the active kit before building. Labels are used
as `var(--label)` in every Style field, so a token change propagates page-wide.

> **✔ Already created on the kit (2026-11-02)** — all 26 colours + `font-body` ("Inter") +
> `font-mono` ("Roboto Mono"). Verified by re-reading `elementor://global-variables`. See §10.2.

| Label | Value | Role |
|---|---|---|
| `primary` | `#1D4ED8` | Brand blue. CTA gradient start. |
| `primary-strong` | `#1E40AF` | Product-card footer gradient end. Hover. |
| `primary-action` | `#2563EB` | Icon-tile gradient start. Header phone CTA. Inline links. |
| `secondary` | `#06B6D4` | CTA gradient end. Brand secondary hue. |
| `secondary-deep` | `#0891B2` | Reserved. |
| `text-heading` | `#0F172A` | **All headings.** (Normalises `#18181B` → `#0F172A`, design-tokens §5.3.) |
| `text-heading-alt` | `#18181B` | Footer surface only. **Do not use for headings.** |
| `text-body` | `#475569` | Body copy (slate family). |
| `text-body-alt` | `#52525B` | Body copy (zinc family). |
| `text-muted` | `#64748B` | Subtitles, descriptions. |
| `text-subtle` | `#A1A1AA` | Footer copy, links. |
| `text-on-dark` | `#FFFFFF` | Copy on hero / footer. |
| `accent-link` | `#2563EB` | Inline links, "Learn more". |
| `accent-link-hover` | `#1D4ED8` | Link hover. |
| `accent-soft` | `#93C5FD` | Hero chip icons. |
| `bg-light` | `#FFFFFF` | Card surfaces. |
| `bg-light-alt` | `#F8FAFC` | Section background (products, technology, contact). |
| `bg-tint` | `#EFF6FF` | Technology CTA card. |
| `bg-dark` | `#0F172A` | Reserved dark surface. |
| `bg-dark-deep` | `#1E293B` | Reserved. |
| `bg-footer` | `#18181B` | Footer surface. |
| `border-subtle` | `#F1F5F9` | Card borders. |
| `border-default` | `#E2E8F0` | Input borders. |
| `border-strong` | `#CBD5E1` | Secondary button border. |
| `status-success` | `#059669` | Technology bullet check. |
| `status-error` | `#EF4444` | Form field errors. |

**Gradients** (no global-variable slot exists for gradients — apply as raw CSS):

| Name | CSS | Used by |
|---|---|---|
| Brand CTA | `linear-gradient(90deg, #1D4ED8 0%, #06B6D4 100%)` | Hero primary CTA, applications CTA, knowledge CTA, contact submit, technology section label |
| Icon tile | `linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)` | Application icon tile, contact icon tile |
| Card footer | `linear-gradient(180deg, #2563EB 0%, #1E40AF 100%)` → hover `linear-gradient(180deg, #1D4ED8 0%, #1E3A8A 100%)` | Product card |
| Section ambient | `linear-gradient(to bottom right, #F8FAFC 0%, #FFFFFF 50%, #EFF6FF 100%)` | Technology + Contact section background, ≥768px |
| Hero scrim | `linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.50) 50%, rgba(0,0,0,0.70) 100%)` | Hero overlay |
| Hero emerald tint | `linear-gradient(to bottom right, rgba(16,185,129,0.05) 0%, transparent 100%)` | Hero overlay |

### 1.5 Widget map — what this Elementor install actually has

Verified against the live widget registry (2026-11-02). **The install is Elementor V4 / atomic.**
There is **no** `icon-box`, **no** `icon-list`, **no** `button-group`, **no** `text-editor`
(legacy names) and **no** `heading-group`.

| House Style requires | Use instead | Notes |
|---|---|---|
| heading | `e-heading` | `tag` prop: `h1`–`h6`; `title` prop holds the text. |
| text-editor | `e-paragraph` | `paragraph` prop; `tag` prop is `p` or `span` (use `span` for eyebrow/badge labels so they don't inherit body type). |
| button | `e-button` | `text` + `link`. Renders `display:inline-block` → inline groups flow naturally. |
| image | `e-image` | `image: { src: { id }, size }` for a library asset, or `image: { src: { url, alt }, size }` for a **URL**. `size` lives **inside** `image`, and `alt` lives **inside** `src` — not as siblings. A library image takes **no** `alt` (the attachment's own alt is used); `alt` is allowed only in the URL form. |
| icon / icon-box | `e-svg` | `svg` prop takes `{id}` (media library), `{url}`, or `{value: "<svg…>"}` for inline SVG. **Use inline `value` for the lucide icons** so no upload step is needed. |
| (n/a) | `e-flexbox`, `e-grid` | **Layout** containers — the only two the grammar (§1.1) allows for arranging siblings. |
| (n/a) | `e-div-block` | Plain flow wrapper — **not** a layout container. Single-child visual tile only (§1.1). |
| (n/a) | `e-tabs`, `e-accordion`, `e-form`, `e-background-video` | Native widget internals. |

`e-paragraph` accepts inline HTML limited to `b, strong, sup, sub, s, em, u, ul, ol, li, blockquote,
a, del, span, br`. This is how bullet lists and inline links are done **without** the HTML widget:
`<ul><li>…</li></ul>` inside one `e-paragraph` is a native, editable bullet list.

> **Exact tag lists** (from `modules/atomic-widgets/prop-types/escaped-html-prop-type.php`,
> verified 2026-11-02 — anything outside the list is stripped on save):
>
> | Prop | Allowed tags |
> |---|---|
> | `e-paragraph` → `paragraph` | `b, strong, sup, sub, s, em, u, ul, ol, li, blockquote, a, del, span, br` |
> | `e-heading` → `title` | `b, strong, sup, sub, s, em, i, u, a, del, span, br` |
> | `e-button` → `text` | `b, strong, sup, sub, s, em, i, u, del, span, br` |
>
> ⚠️ **`<i>` is allowed in a heading and a button but NOT in a paragraph** — it is absent from
> `PARAGRAPH_TEXT_TAGS` and is stripped there. Use `<em>` in a paragraph.

`e-heading` accepts `b, strong, sup, sub, s, em, i, u, a, del, span, br` — use `<span>` for the
accented phrase in "Choose the Right **Filtration Technology** for Your Process".

**Prop shapes — verified by dry run on post 72 (2026-11-02, zero warnings):**

| Widget | `element_config` shape |
|---|---|
| `e-heading` | `{ "tag": "h2", "title": "…", "link": { "destination": "…", "tag": "a" } }` |
| `e-paragraph` | `{ "paragraph": "…", "tag": "p" \| "span", "link": { "destination": "…", "tag": "a" } }` |
| `e-button` | `{ "text": "…", "link": { "destination": "…", "tag": "a" } }` |
| `e-image` | `{ "image": { "src": { "id": 78 }, "size": "large" } }` — library form · `{ "image": { "src": { "url": "…", "alt": "…" }, "size": "full" } }` — URL form |
| `e-svg` | `{ "svg": { "id": 119 } }` · `{ "svg": { "url": "…" } }` · `{ "svg": { "value": "<svg…>" } }` |
| `e-tabs` | `{ "default-active-tab": 2 }` — the **only** prop |
| `e-tab-content` | `{ "tab-id": "…" }` (optional) |

> ⚠️ **`e-image` nests differently from what it looks like.** `size` lives **inside** `image`, and
> `alt` lives **inside** `src` — putting either beside it is silently skipped with a warning
> (*"Property \"size\" is not supported on element type \"e-image\""*). A library image (`src.id`)
> takes **no** `alt`; the attachment's own alt text is used. `alt` is allowed only in the URL form.

> **Colouring a word inside a heading — NOT possible through the MCP.** Two roads, both closed:
>
> 1. **Inline `style` attribute** — Elementor **strips the attributes of nested inline
>    elements**, so `<span style="color:#1D4ED8">` renders unstyled (dark text inside a blue
>    heading; documented in `docs/elementor-pro-contact-form.md` §2).
> 2. **Descendant CSS rule on the widget** (`span { color: #1D4ED8; }`) — the CSS engine
>    **rejects** it as *"Unsupported nested selector. Only &:hover, &:focus, and &:active
>    pseudo-class blocks are allowed."* (a hard error, not a silent no-op — see §1.7).
>
> **Resolution:** every heading ships in **one colour** (`#0F172A` body / `#FFFFFF` on dark),
> which is exactly what the live post 72 already renders. The blue accent word is a
> **deliberate deviation** from the classic PHP — logged as **D-11** in §9.1 and flagged in
> §9.3 (flag 18). If the accent is required on the production page, the only viable route is
> **theme-side CSS** (`wp_enqueue_style` targeting the section), outside this blueprint — see
> the escape hatch note in §9.3.
>
> **What still works inside a heading:** `<strong>`, `<em>`, `<u>`, `<s>`, `<br>`, `<sub>`,
> `<sup>` and `<a href>` — those are semantic tags, not styled attributes, and Elementor keeps
> them. The same rules apply to `e-paragraph`.
>
> **Inline links: use the `link` prop, never an inline `<a>`.** An `e-paragraph` with
> `link: {destination: "…", tag: "a"}` renders `<p><a class="…">…</a></p>`, and Elementor puts
> **`all: unset`** on that inner anchor (`link-base` base style) — so the anchor **inherits** the
> paragraph's `color`, `font-size` and `:hover` state. An inline `<a href>` written into the
> `paragraph` string gets the UA's link colour instead and ignores the widget style. Same for
> `e-heading` (its `link` prop exists too).

### 1.6 Hard prohibitions

| Prohibited | Why | Instead |
|---|---|---|
| `e-html` widget | Rule 3 — non-developers must be able to click any text and edit it | Native widgets only |
| Legacy Section / Column | Rule 1 | `e-flexbox` / `e-grid` |
| `e-div-block` used as a **layout wrapper** (arranging two or more siblings) | §1.1 — a plain block has no `gap` and no row/column semantics; using it to arrange siblings is the V3 "div column" habit | `e-flexbox` (`flex-direction: column` + `gap`) or `e-grid`. `e-div-block` survives **only** as a single-child visual wrapper (§1.1) |
| Spacer widgets | Rule 3 — "never use empty Spacer widgets when container gaps can achieve the spacing" | `gap` on the container |
| Containers nested 4+ deep | Rule 3 | Flatten to the 3-level grammar (§1.2) |
| `e-divider` used as a layout device | — | `border-top` on the container |
| Raw Tailwind class names | — | Resolved values only (design-tokens §0) |
| Inline `style` attribute inside a `title` / `paragraph` string | Elementor strips the attributes of nested inline elements — the style is silently lost | One colour per heading; the accent word is a logged deviation (§1.5, §9.1 D-11) |
| Descendant / compound / pseudo-element selector inside a `style` string (`span { … }`, `&.x { … }`, `&::placeholder { … }`) | The CSS engine accepts **only** `&:hover`, `&:focus`, `&:active` as nested blocks — anything else is a hard *"Unsupported nested selector"* error or dead CSS | Style the widget itself; use `&:hover` / `&:focus` / `&:active` for states (§1.7) |
| Inventing copy | — | Every string comes from `sections-map.md` or the PHP. Gaps are flagged in §9, never filled with placeholder text. |

### 1.7 CSS engine limits — what the `style` string can and cannot express

**Verified 2026-11-02 against this install's Elementor build and its generated CSS.**

The MCP `style` field is a plain CSS string. Elementor parses it into *variants* — a
(breakpoint, state) pair — and renders each as its own rule. The parser recognises **exactly three
nested selectors**:

| Nested selector | Becomes | Rendered as |
|---|---|---|
| `&:hover` | a native variant | `.elementor .e-<hash>:hover` — Elementor **also** appends `:focus-visible` |
| `&:focus` | a native variant | `.elementor .e-<hash>:focus` |
| `&:active` | a native variant | `.elementor .e-<hash>:active` |
| **anything else** | `custom_css` | **dead CSS — see below** |

> ⚠️ **Two failure modes, and they are not the same.**
>
> **(a) A top-level selector is a HARD ERROR.** The scanner walks the string looking for `&`.
> Any `{` that appears **before** the first `&` aborts the parse:
>
> ```
> [probe-ul] Unsupported nested selector. Only &:hover, &:focus, and &:active pseudo-class blocks are allowed.
> ```
>
> So `ul { margin: 0; }`, `a { color: #2563EB; }`, `li::marker { color: #059669; }` — written
> **without** a leading `&` — **fail the whole build call**. (Verified by dry run on post 72,
> 2026-11-02.) This is the single most common way to break a composition.
>
> **(b) `&` + anything else is accepted but DEAD.** `&.some-class`, `&[attr="x"]`,
> `&::placeholder`, `& .descendant`, `& > .child` parse fine, but they are stored as
> `custom_css` and emitted **verbatim, inside the element's own declaration block, with a
> literal `&`**:
>
> ```css
> /* generated by the atomic renderer — the browser drops the inner block */
> .elementor .e-abc123{width:100%;background-color:#ffffff;&::placeholder { color: #94a3b8; }}
> ```
>
> The `&` is not substituted (it is a Sass token, not CSS), so the inner rule is invalid inside a
> declaration list and **the whole nested block is discarded**. This is not theoretical: the live
> `uploads/elementor/css/local-72-frontend-desktop.css` currently contains exactly that broken
> `&::placeholder { color: #94a3b8; }` inside a rule block, and the placeholder colour it was
> meant to set never applies.

**Consequences for this blueprint:**

1. **No descendant, attribute, compound or pseudo-element selectors.** A rule that needs a
   *parent* (`.card:hover .cta`) or an *attribute* (`[aria-selected="true"]`) or a *pseudo-element*
   (`::placeholder`) **cannot be written** through the MCP. Design around it — the Builder must not
   emit one and assume it works. **A descendant selector written without `&` does not even build**
   — it fails the whole call (failure mode (a) above).
2. **The state vocabulary is `hover` / `focus` / `active` only.** Elementor's own engine knows four
   more (`focus-visible`, `checked`) and four *class* states (`e--selected`, `e--disabled`,
   `e--playing`, `e--paused`), but the MCP's style-string parser does not expose them.
3. **A class state can still be targeted — by Elementor itself.** Widgets ship their own base
   layer in `uploads/elementor/css/base-desktop.css`, and that layer *does* use compound
   selectors. Example — the `e-tab` base:
   ```css
   .elementor .e-tab-base.e--selected{border-color:#0C0D0E;outline-width:0px;}
   ```
   So the selected tab gets Elementor's built-in treatment for free; the blueprint does not have
   to (and cannot) write that rule itself.
4. **Cascade order is known and stable** — the page loads, in this order:
   `post-51.css` → `base-desktop.css` → `default-desktop.css` → `local-<post>-frontend-desktop.css`.
   **Local styles load last.** A local rule of *equal* specificity therefore beats a base rule; a
   local rule of *lower* specificity does not. `base-desktop.css` `.elementor .e-tab-base.e--selected`
   is (0,3,0); a local base declaration `.elementor .e-<hash>` is (0,2,0) → **the base wins**;
   a local `&:focus` variant is (0,3,0) *and* later → **the local wins**.
5. **The practical substitute for a missing state is `:focus`.** A clicked `<button>` keeps focus,
   so `&:focus` doubles as the "this one is active" treatment for the rest of the session.

### 1.8 Container presets (apply to every L1 root)

```
width: 100%;
position: relative;
box-sizing: border-box;
padding-block: 96px;            /* 48px @ --mobile */
scroll-margin-top: 80px;        /* clears the 64px fixed header + 16px */
```

and on every L2 `boxed` container:

```
max-width: 1280px;
margin-inline: auto;
padding-inline: 32px;           /* 24px @ --tablet, 16px @ --mobile */
box-sizing: border-box;
```
---

## 2. Compliance audit of the current page (post `72`)

The page already has all six section containers, but several branches break the 3-level cap and one
widget is structurally invalid. The Builder **rebuilds each section to this blueprint** rather than
patching in place. Existing element IDs are listed so the Builder can delete the old tree.

| Current element | ID | Problem | Resolution |
|---|---|---|---|
| `hero-root` | `49847864` | OK as L1, but **no `id="hero"`** (the PHP `<section>` has one) — breaks `#hero` deep links and back-to-top | Keep, restyle, set `_cssid: "hero"` (§3.1) |
| `hero-video` | `5b4bd92` | `e-background-video` is missing its **required** `e-background-video-controls` child | Rebuild with content **and** controls (play / pause) per §3.1 |
| `hero-video` (source file) | `5b4bd92` | Plays `uploads/2026/10/Video-Project-hero.mp4` = **3,580,094 B**. The theme's 2026-10-29 re-encode of the same clip is **239,930 B** (15× lighter) and is still uncommitted in git | Re-point at the compressed encode and upload it (§9.4) |
| `hero-logos-block` → `hero-logos-row` | `44e8b440` → `73c539a5` | **L4** container (`hero-root` → `hero-content` → `hero-logos-block` → `hero-logos-row`) | Flatten: logo strip becomes one L3 row (§3.1) |
| `hero-logos-row` | `73c539a5` | `shortcode` widget with **empty settings** — the logos render as nothing and are not visually editable | Replace with 6 `e-image` widgets (§3.1) — all six SVGs are in the Media Library (ids 65–70) |
| `products-grid` → `card-mechanical` → `card-mechanical-media` | `2a8644a7` → `4e63db8c` → `17a7e710` | **L5** (section → inner → grid → card → media wrapper) | Cards rebuilt as L3 with no media wrapper (§4.2) |
| `card-mechanical-footer`, `card-*-cta` | `6e071e1d`, `41b51855`… | **L4/L5** | Flatten (§4.2) |
| `applications-accordion` | `26de8000` | Compliant (native widget internals are depth-exempt) — **keep it**; `sections-map.md` §16.1 closed this as deliberate | Keep, restyle to §5.1 — see deviation **D-02** for the grid variant |
| `technology-block-eco` → `technology-eco-head` | `53e0019c` → `37ccb6e4` | **L4** | Cards rebuilt as L3 (§6) |
| `technology-eco-step-N` → `…-num` → `…-body` | `5919550b` → `7114c6cc` → `17a63466` | **L5** | Replaced by an `e-tabs` step switcher — one tab per step, image + caption in the panel (§6.4) — see deviation **D-05** |
| `knowledge-masthead` → `knowledge-masthead-text` | `61f7add9` → `38ac0efd` | **L4** | Flatten (§7) |
| `knowledge-feature-row` → `knowledge-feature-body` → `knowledge-feature-meta` | `6dded8e7` → `625273d9` → `41481e2d` | **L4/L5** | Flatten (§7) |
| `knowledge-list-row` | `d03ad73` | A second article teaser with **no counterpart in the PHP** (the 2-card grid was removed in v1.6.10) | Dropped — see deviation **D-09** |
| `contact-columns` → `contact-info` → `contact-info-email` | `68f72226` → `23fe5cc5` → `5968f163` | **L5** | Flatten (§8) — the three info cards become grid items of `contact-grid` |
| `contact-form` → `contact-row-name` | `6402f4f4` → `6facb487` | The label/input row containers are **L4 containers inside the card** | Removed — label and input become direct children of the `e-form` (§8.1) |
| `e-div-block` wrappers | `17a7e710`, `73490182`, `22d41af5`, `1d849a73`, `5968f163`… | Div Blocks used as layout wrappers | Replace with `e-flexbox` / `e-grid` per §1.1 |
| whole document | `72` | The kit had **no** global variables and **no** default styles, so the page loaded **Roboto + Roboto Slab** instead of the intended **Inter + Roboto Mono** | **✔ Fixed 2026-11-02** — the 26 colour tokens + 2 font variables and the 11 kit default styles are in place (§10.2) |
| kit | — | One leftover global class `emifree-probe-test` (id `g-40e7a21`) from an earlier probe, carrying no CSS | Delete it (§10.2) |

**Section order (do not change):** Hero → Products → Applications → Technology → Knowledge →
Contact. *(Note: the `front-page.php` docblock lists Applications before Products — that comment is
stale. The actual `get_template_part()` order, and the order already on page `72`, is
Products → Applications.)*

---

## 3. §3 — Hero

**Source:** `template-parts/section-hero.php` · **Data:** `inc/hero.php` · **Map:** `sections-map.md` §4

### 3.1 Tree

```
L1 ▸ hero-root                    e-flexbox          column · full width · bg #0A0A0A · min-height 100dvh
                                   ↳ `_cssid: "hero"`  →  renders <section id="hero">
  ▸ hero-video                    e-background-video  source id 54 · autoplay · mute · loop · state playing
    ▸ hero-video-content          e-background-video-content   (empty)
    ▸ hero-video-controls         e-background-video-controls
      ▸ hero-video-play           e-background-video-play     → e-paragraph "Play"
      ▸ hero-video-pause          e-background-video-pause    → e-paragraph "Pause"
  ▸ hero-scrim                    e-flexbox          absolute · inset 0 · gradient overlay
  L2 ▸ hero-inner                 e-flexbox          row · boxed 1280 · gap 64 · align center
    L3 ▸ hero-copy                e-flexbox          column · gap 24 · align flex-start · flex 1 1 58%
      L4 ▸ hero-badge             e-flexbox  [E1-a]  row · wrap · gap 12 · align center
        • chip-cycle              e-button            → #technology
        • chip-energy             e-button            (no link)
        • chip-hepa               e-button            → /en/knowledge/hepa-filters-cnc-industrial-workshops/
      • hero-title                e-heading           h1
      • hero-subtitle             e-paragraph         (see D-01 — no source copy)
      L4 ▸ hero-cta               e-flexbox  [E1-b]  row · wrap · gap 16 · align center
        • hero-primary            e-button            → #contact
        • hero-secondary          e-button            → #technology
    L3 ▸ hero-visual              e-flexbox          row · wrap · gap 16 · align center · justify center · flex 0 1 34%
      • hero-logos-label          e-paragraph (span) "Trusted by industry leaders"  → flex: 0 0 100%; text-align center
      • hero-logo-mb              e-image             id 65
      • hero-logo-bmw             e-image             id 66
      • hero-logo-gm              e-image             id 67
      • hero-logo-nsk             e-image             id 68
      • hero-logo-knorr           e-image             id 69
      • hero-logo-siemens         e-image             id 70
```

Depth check: `hero-root` (1) → `hero-inner` (2) → `hero-copy` (3) → `hero-badge`/`hero-cta` (4, E1)
→ widgets. ✔ Within E1. The logo branch stays at 3 levels: `hero-visual` (3) → images (widgets).
`hero-scrim` and `hero-video` are sibling overlay/native layers of L1, not wrappers.

### 3.2 Widget map — copy, links, assets

| Element | Widget | Content | Link |
|---|---|---|---|
| `hero-title` | `e-heading` `tag: h1` | **Low maintenance air filtration solutions** | — |
| `hero-subtitle` | `e-paragraph` | *omitted — see D-01* | — |
| `hero-badge` / `chip-cycle` | `e-button` | **Self-cleaning** | `#technology` |
| `hero-badge` / `chip-energy` | `e-button` | **Energy Saving** | *(none — decorative)* |
| `hero-badge` / `chip-hepa` | `e-button` | **HEPA filter** | `/en/knowledge/hepa-filters-cnc-industrial-workshops/` |
| `hero-cta` / `hero-primary` | `e-button` | **Contact Us!** | `#contact` |
| `hero-cta` / `hero-secondary` | `e-button` | **See the technology behind it →** | `#technology` |
| `hero-logos-label` | `e-paragraph` `tag: span` | **Trusted by industry leaders** | — |
| `hero-logo-*` | `e-image` | Mercedes-Benz · BMW · GM · NSK · Knorr-Bremse · Siemens | — |

### 3.3 Style

**`hero-root`**
```
width: 100%; min-height: 100dvh; position: relative; overflow: hidden;
background-color: #0A0A0A; display: flex; flex-direction: column;
```

**`hero-video`** — native element; set the source to media-library id `54`
(`Video Project hero.mp4`), `autoplay: true`, `mute: true`, `loop: true`, `state: "playing"`.
Set the play/pause labels to "Play" / "Pause" (English) / "Abspielen" / "Pause" (German).

**`hero-scrim`**
```
position: absolute; inset: 0; z-index: 2; pointer-events: none;
background-image: linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.50) 50%, rgba(0,0,0,0.70) 100%);
```
Add a second overlay element (or a second background layer on the same element) for the emerald
tint: `linear-gradient(to bottom right, rgba(16,185,129,0.05) 0%, transparent 100%)`.

**`hero-inner`**
```
max-width: 1280px; margin-inline: auto; padding-inline: 32px;
width: 100%; box-sizing: border-box; position: relative; z-index: 3;
display: flex; flex-direction: row; align-items: center; justify-content: space-between;
gap: 64px; padding-block: 96px 120px;
```
`@media (--mobile) { flex-direction: column; gap: 32px; padding-block: 80px 64px; padding-inline: 16px; }`
`@media (--tablet) { padding-inline: 24px; gap: 40px; }`

**`hero-copy`**
```
display: flex; flex-direction: column; align-items: flex-start; gap: 24px;
flex: 1 1 58%; max-width: 640px;
```

**`hero-badge`** (E1-a)
```
display: flex; flex-direction: row; flex-wrap: wrap; align-items: center; gap: 12px;
```
Chips (`chip-cycle`, `chip-energy`, `chip-hepa`):
```
background: rgba(255,255,255,0.10); border: 1px solid rgba(255,255,255,0.25);
border-radius: 9999px; padding: 8px 16px; color: #FFFFFF;
font-family: Inter; font-size: 16px; font-weight: 500; line-height: 1.5;
backdrop-filter: blur(4px);
&:hover { background: rgba(255,255,255,0.20); border-color: rgba(255,255,255,0.45); }
```
Icon: the source chip icons (`cycle`, `energy`, `hepa`) are inline lucide SVGs at `#93C5FD`.
The chip is a single `e-button`, so the icon must live **inside** the button label — but `e-button`
allows only `b, strong, sup, sub, i, u, del, span, br`. **Resolution:** render the chip as a
`e-paragraph` with `tag: span` containing the label, and place the icon as an inline SVG
`<span>` background? No.
→ **Chosen:** drop the chip icons and keep the three text chips as `e-button` pills. The icons are
decorative; the labels carry the meaning and remain fully editable. Logged as **D-03**.

**`hero-title`**
```
color: #FFFFFF; font-family: Inter; font-weight: 700; font-size: 60px;
line-height: 1.15; letter-spacing: -0.02em; margin: 0 0 24px 0;
```
`@media (--tablet) { font-size: 48px; }` · `@media (--mobile) { font-size: 36px; }`

> **LCP guard (design-tokens §4):** the H1 is the intended LCP element. Set the size **on the
> widget** as above — do not inherit it from a global with a responsive override. Keep any entrance
> animation's opacity floor at ≥ `0.001`.

**`hero-primary`**
```
background-image: linear-gradient(90deg, #1D4ED8 0%, #06B6D4 100%);
background-color: #2563EB; color: #FFFFFF; border-radius: 9999px;
padding: 20px 40px; font-family: Inter; font-weight: 600; font-size: 20px; line-height: 1.5;
box-shadow: 0 10px 15px rgba(0,0,0,0.10);
&:hover { box-shadow: 0 20px 25px rgba(0,0,0,0.15); transform: translateY(-2px); }
```

**`hero-secondary`** (ghost button — the source's quiet link, rendered as a ghost button)
```
background: transparent; border: 1px solid rgba(255,255,255,0.45); color: #FFFFFF;
border-radius: 9999px; padding: 20px 32px;
font-family: Inter; font-weight: 500; font-size: 16px; line-height: 1.5;
&:hover { background: rgba(255,255,255,0.12); border-color: #FFFFFF; }
```

**`hero-visual`** (logo strip — the source's absolutely-positioned bottom strip, now in flow)
```
display: flex; flex-direction: row; flex-wrap: wrap; align-items: center;
justify-content: center; gap: 24px; flex: 0 1 34%;
```

**`hero-logos-label`**
```
color: rgba(255,255,255,0.60); font-family: Inter; font-size: 12px; font-weight: 400;
letter-spacing: 0.05em; text-transform: uppercase; text-align: center;
flex: 0 0 100%;
```

**`hero-logo-*`**
```
max-height: 40px; width: auto; opacity: 0.50; filter: grayscale(1) brightness(0) invert(1);
&:hover { opacity: 1; filter: none; }
```
Per-logo `max-width` (from the source): MB 50px · BMW 55px · GM 55px · NSK 100px · Knorr 130px ·
Siemens 100px. `@media (--mobile) { max-height: 24px; }`

### 3.4 Motion

| Element | Effect | Delay |
|---|---|---|
| `hero-title` | Motion Effects → Entrance → **Fade In** | 0ms |
| `hero-badge` | Entrance → **Fade In** | 150ms |
| `hero-secondary` | Entrance → **Fade In** | 300ms |
| `hero-primary` | Entrance → **Fade In** | 450ms |

Keep the opacity floor at ≥ `0.001`.

### 3.5 Notes

- **Full-bleed background video is retained.** The two-video PHP carousel is dropped — Elementor's
  Background Video handles one loop natively and there is no two-video primitive
  (`sections-map.md` §4.1, flag 7). Media-library id `54` = `Video Project hero.mp4`.
- **The hero video must be re-encoded before it goes back on the page (D-10).** Media id `54`
  is `uploads/2026/10/Video-Project-hero.mp4` = **3,580,094 B (3.58 MB)**. The theme's
  2026-10-29 re-encode of the same clip is **239,930 B (240 KB)** — 15× lighter — and it is still
  **uncommitted in git**. The hero video sits on the **LCP path**: a 3.58 MB background video is
  fetched before the `h1` paints on a cold cache. Upload the compressed file to the Media Library
  and point `hero-video` at the new id before publishing (§9.4).
- **`_cssid: "hero"` on `hero-root`** — the PHP `<section id="hero">` carries the id; the current
  Elementor build does not, which breaks `#hero` deep links and the header's back-to-top anchor.
  The `_cssid` lands on the element itself, so the anchor works (same pattern as the live
  contact section, `_cssid: contact` → `id="contact"`).
- **The client-logo strip moves out of absolute positioning into the right column.** It was
  `position:absolute; bottom: clamp(24px,5vh,48px)` in the PHP and was 4 levels deep in the
  current Elementor build. In flow it is editable, non-overlapping, and 3 levels deep.
- The `hero-inner` bottom padding (120px) preserves the breathing room the absolute strip had.
- **Right column = the logo strip**, which satisfies the House Style's "Right column: hero image,
  video modal trigger, or visual element" with content that already exists.
  *Optional Variant B:* replace `hero-visual` with a video-modal trigger — an `e-image` poster
  (asset 54's poster frame) inside an `e-flexbox` rounded frame, plus an `e-button` "▶ Play"
  whose link uses the **`lightbox`** dynamic tag. Requires a poster image in the Media Library.
- **Anchor targets:** `#technology` and `#contact` need `scroll-margin-top: 80px` on the target
  containers (§1.8) — already covered by the L1 preset.

---

## 4. §4 — Products (Feature Grid)

**Source:** `template-parts/section-products.php` · **Map:** `sections-map.md` §5
**Pattern:** House Style *Feature Grid* — Main Container (Column) → centred Header Block → Grid
sub-container (3 / 2 / 1).

### 4.1 Tree

```
L1 ▸ products-section            e-flexbox   column · full width · bg bg-light-alt · gap 48
  L2 ▸ products-header           e-flexbox   column · align center · gap 24 · boxed 1280
    • products-title             e-heading   h2
    • products-subtitle          e-paragraph
  L2 ▸ products-grid             e-grid      boxed 1280 · 3 col / 2 col / 1 col · gap 32 · rows 1fr
    L3 ▸ card-mechanical         e-flexbox   column · card surface · aspect-ratio 4/5
      • card-mechanical-image    e-image     id 78
      • card-mechanical-title    e-heading   h3
      • card-mechanical-cta      e-paragraph
    L3 ▸ card-electrostatic      e-flexbox   column · card surface · aspect-ratio 4/5
      • card-electrostatic-image e-image     id 79
      • card-electrostatic-title e-heading   h3
      • card-electrostatic-cta   e-paragraph
    L3 ▸ card-dust               e-flexbox   column · card surface · aspect-ratio 4/5
      • card-dust-image          e-image     id 80
      • card-dust-title          e-heading   h3
      • card-dust-cta            e-paragraph
```

Depth: section (1) → grid (2) → card (3) → widgets ✔ **3 levels, no exception.**

### 4.2 Widget map

| Element | Widget | Content | Link |
|---|---|---|---|
| `products-title` | `e-heading` h2 | **Industrial Air Filtration Product Range** | — |
| `products-subtitle` | `e-paragraph` | Professional-grade filtration systems designed for CNC workshops, metalworking shops, and industrial manufacturing environments. | — |
| `card-mechanical-image` | `e-image` `image: { src: { id: 78 }, size: "large" }` | Mechanical filtration photo | `id 78` (`fotom1.webp`) |
| `card-mechanical-title` | `e-heading` h3 | **Mechanical Filtration** | — |
| `card-mechanical-cta` | `e-paragraph` | Learn more → | — |
| `card-electrostatic-image` | `e-image` `image: { src: { id: 79 }, size: "large" }` | Electrostatic filtration photo | `id 79` (`fotoe2-scaled.webp`) |
| `card-electrostatic-title` | `e-heading` h3 | **Electrostatic Filtration** | — |
| `card-electrostatic-cta` | `e-paragraph` | Learn more → | — |
| `card-dust-image` | `e-image` `image: { src: { id: 80 }, size: "large" }` | Dust filtration photo | `id 80` (`dust_filter-emi.png`) |
| `card-dust-title` | `e-heading` h3 | **Dust Filtration** | — |
| `card-dust-cta` | `e-paragraph` | Learn more → | — |

**Whole-card link.** Each card is a link in the PHP. Set the link on the **card container**:
`link: {destination: "/en/products/mechanical/", tag: "a"}` — the `e-flexbox` widget supports a
`link` prop, so the whole card becomes one anchor and the card stays a single editable container.

| Card | `link.destination` | `aria` note |
|---|---|---|
| `card-mechanical` | `/en/products/mechanical/` | Mechanical Filtration — view category |
| `card-electrostatic` | `/en/products/electrostatic/` | Electrostatic Filtration — view category |
| `card-dust` | `/en/products/dust/` | Dust Filtration — view category |

> The source's arrow SVG is replaced by the "→" glyph inside the CTA paragraph so the card needs
> no inline row container. Logged as **D-06**. If the SVG arrow is required, add `e-svg` + an L4
> inline row (E1) inside the card.

### 4.3 Style

**`products-section`**
```
width: 100%; position: relative; box-sizing: border-box;
padding-block: 96px; scroll-margin-top: 80px;
background-color: #F8FAFC;
display: flex; flex-direction: column; gap: 48px;
```
`@media (--mobile) { padding-block: 48px; gap: 32px; }`

**`products-header`**
```
max-width: 1280px; margin-inline: auto; padding-inline: 32px; width: 100%; box-sizing: border-box;
display: flex; flex-direction: column; align-items: center; gap: 24px; text-align: center;
```
`@media (--mobile) { padding-inline: 16px; }`

**`products-title`** → `color: #0F172A; font-size: 48px; font-weight: 700; line-height: 1.2; text-align: center;`
`@media (--tablet) { font-size: 48px; }` · `@media (--mobile) { font-size: 36px; }`

**`products-subtitle`** → `color: #52525B; font-size: 20px; line-height: 1.4; max-width: 768px; margin-inline: auto;`

**`products-grid`**
```
max-width: 1280px; margin-inline: auto; padding-inline: 32px; width: 100%; box-sizing: border-box;
display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px;
grid-template-rows: 1fr;
```
`@media (--tablet) { grid-template-columns: repeat(2, 1fr); padding-inline: 24px; gap: 24px; }`
`@media (--mobile) { grid-template-columns: repeat(1, 1fr); padding-inline: 16px; }`

> `grid-template-rows` must match the number of rows the children fill (§ widget note). One row on
> desktop/tablet, two on mobile → set `grid-template-rows: repeat(2, 1fr)` in the mobile override.

**`card-*`** (shared)
```
display: flex; flex-direction: column; position: relative; overflow: hidden;
aspect-ratio: 4 / 5; border-radius: 16px; background-color: #FFFFFF;
box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.10), 0 2px 4px -2px rgb(0 0 0 / 0.10);
transition: box-shadow 0.3s ease, transform 0.3s ease;
&:hover { transform: translateY(-8px); box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25); }
```
> The hover rule targets the card itself. The image scale-on-hover is **not** delivered by a
> descendant rule — that CSS is dead (§1.7) and the earlier "global class `emifree-card-product`"
> recipe is **withdrawn**. The image scales when the pointer is over the image itself:
> `&:hover { transform: scale(1.05); }` on **`card-*-image`** (a legal native state variant).
> The card's own hover lift + shadow still fires on the whole card. Logged as **D-04** (§9.1).

**`card-*-image`**
```
flex: 1 1 auto; min-height: 0; width: 100%; height: auto; object-fit: contain;
padding: 24px; box-sizing: border-box; transition: transform 0.5s ease-out;
&:hover { transform: scale(1.05); }
```

**`card-*-title`**
```
margin: 0; padding: 24px 24px 0; color: #FFFFFF;
font-size: 24px; font-weight: 700; line-height: 1.33; text-shadow: 0 1px 2px rgb(0 0 0 / 0.20);
background-image: linear-gradient(180deg, #2563EB 0%, #1E40AF 100%);
&:hover { background-image: linear-gradient(180deg, #1D4ED8 0%, #1E3A8A 100%); }
```

**`card-*-cta`**
```
margin: 0; padding: 8px 24px 24px; background-color: #1E40AF; color: #FFFFFF;
font-size: 14px; font-weight: 600; line-height: 1.43;
&:hover { background-color: #1E3A8A; }
```

> The gradient footer is rendered by the **title widget** (gradient) plus the **CTA widget**
> (flat end colour `#1E40AF`), so the two read as one continuous band — and the card needs no
> inner footer container. The hover variant shifts both, reproducing the PHP's
> `from-blue-600→from-blue-700 / to-blue-800→to-blue-900`.

### 4.4 Notes

- The card is one `<a>` (link on the container) — no nested anchors, no wrapper.
- The PHP's `md:opacity-0` hover-reveal of the "Learn more" line is **not** reproduced as a
  hover-only reveal: the CTA is always visible (see **D-04**). The gradient shift is the hover
  treatment, exactly as `sections-map.md` §5.2 concludes.
- The old tabbed product view (`assets/js/sections/products.js`) is dead code — **do not build tabs**.

---

## 5. §5 — Applications (Accordion — primary)

**Source:** `template-parts/section-applications.php` · **Data:** `inc/applications.php`
**Map:** `sections-map.md` §6 (behaviour rows 8 & 13) + §16.1
**Pattern:** native **`e-accordion`** — one `<details>` per application, six of them.

> **Decision (deviation D-02):** the Accordion is **primary** here, not the 3/2/1 Feature Grid of
> Rule 2. `sections-map.md` §16.1 closes the question: *"Applications were rebuilt as an Accordion,
> which is a deliberate improvement over the PHP hover-reveal (`group-hover:max-h-96`) — it makes the
> six descriptions reachable on touch devices. **Keep it.**"* §5.1 is the build spec; **§5.5 keeps
> the complete grid spec** so the Builder can switch variants without re-architecting.

### 5.1 Tree — accordion (build this)

```
L1 ▸ applications-section        e-flexbox   column · full width · bg #FFFFFF · gap 80
  L2 ▸ applications-header       e-flexbox   column · align center · gap 24 · boxed 1280
    • applications-title         e-heading   h2 (gradient text)
    • applications-subtitle      e-paragraph
  L2 ▸ applications-accordion    e-accordion native widget · boxed 1280 · gap 12
  L2 ▸ applications-cta          e-flexbox   column · align center · gap 24 · boxed 1280
    • applications-cta-button    e-button
```

The accordion's own internals (native widget tree — depth-exempt per §1.2), six identical items:

```
  applications-accordion                       e-accordion
    ▸ app-cnc                                 e-accordion-item        → <details>
      ▸ app-cnc-header                        e-accordion-item-header → <summary>
        ▸ app-cnc-title                       e-accordion-item-title
          • app-cnc-icon                      e-svg        id 84
          • app-cnc-label                     e-heading    h3
        ▸ app-cnc-chevron                     e-accordion-item-icon
          • app-cnc-chevron-svg               e-svg        id 90
      ▸ app-cnc-content                       e-accordion-item-content
        • app-cnc-description                 e-paragraph
        • app-cnc-question                    e-paragraph
    ▸ app-metal                               e-accordion-item      (id 85)
    ▸ app-grinding                            e-accordion-item      (id 86)
    ▸ app-bearing                             e-accordion-item      (id 87)
    ▸ app-heavy                               e-accordion-item      (id 88)
    ▸ app-auto                                e-accordion-item      (id 89)
```

Depth: section (1) → accordion (2) → item (3) → widgets ✔ **3 levels, no exception.**
The accordion is a **widget**, so the L2 measure is applied to the widget itself
(`max-width: 1280px; margin-inline: auto`) — no wrapper container is needed, and the six items
are *not* editor containers.

**Accordion settings** (`element_config` on `applications-accordion`):

| Setting | Value | Why |
|---|---|---|
| `default_state` | `all_collapsed` | Matches the PHP's collapsed-by-default cards. |
| `max_expanded` | `multiple` | Lets a visitor compare two applications at once. |
| `show_icon` | `true` | The chevron is the open/close affordance. |
| `faq_schema` | `false` | These are application segments, not FAQ questions — no FAQPage JSON-LD. |

### 5.2 Widget map

**Section header + CTA**

| Element | Widget | Content | Link |
|---|---|---|---|
| `applications-title` | `e-heading` h2 | **Industrial Air Filtration for Every Application** | — |
| `applications-subtitle` | `e-paragraph` | From small tool shops to large manufacturing facilities, Emifree systems capture oil mist, welding fumes, and dust at the source. | — |
| `applications-cta-button` | `e-button` | **Find Your Solution** | `#products` |

**Accordion items** — six, in this order. Every item has the identical shape of §5.1; only the
content and the icon id change.

| # | Item (`e-accordion-item`) | Icon (`e-svg`) | Label (`e-heading` h3) | Description (`e-paragraph`) | Question (`e-paragraph`, italic) |
|---|---|---|---|---|---|
| 1 | `app-cnc` | `id 84` `app-cnc.svg` | **CNC Machining & Tool Shops** | Remove oil mist and coolant fumes from CNC lathes, mills, and routers without stopping production. Keep your machines clean and operators healthy. | “How do I remove oil mist from my CNC machine without stopping production?” |
| 2 | `app-metal` | `id 85` `app-metal.svg` | **Metalworking & Welding** | Capture welding fumes, metal dust, and grinding particles at the source. Protect your workforce from harmful particulates and meet EU safety standards. | “What is the best way to filter welding fumes in a small workshop?” |
| 3 | `app-grinding` | `id 86` `app-grinding.svg` | **Grinding & Polishing** | Extract abrasive dust from surface grinding, cylindrical grinding, and polishing operations. Extend equipment lifespan and improve surface finish quality. | “How to control dust from surface grinding machines?” |
| 4 | `app-bearing` | `id 87` `app-bearing.svg` | **Bearing & Precision Parts Manufacturing** | Maintain clean air in bearing production, gear manufacturing, and precision engineering. Protect sensitive components from contamination. | “Best air filtration for bearing manufacturing clean rooms” |
| 5 | `app-heavy` | `id 88` `app-heavy.svg` | **Heavy Industry & Metal Fabrication** | Handle high-volume dust and mist generation in fabrication shops, press rooms, and assembly lines. Industrial-grade filtration for demanding environments. | “Industrial dust extraction system for metal fabrication shop” |
| 6 | `app-auto` | `id 89` `app-auto.svg` | **Automotive** | Capture oil mist, coolant aerosol, and welding fumes from automotive production lines. Keep paint booths particle-free and EV battery assembly clean room compliant. | “Best air filtration system for automotive manufacturing plant oil mist and welding fume extraction” |

Every item also carries `app-*-chevron` → `e-svg` **`id 90`** (`chevron-down.svg`, alt "Accordion chevron").

> **Icon correction.** The live page uses **id 102** (`machine-press-factory-svgrepo-com.svg`,
> 800×800, hard-coded fills) for the CNC item. That is the wrong glyph **and** the wrong kind of
> asset: it is a filled 800×800 picture, not a 24×24 `currentColor` stroke icon, so the tile's
> `color: #FFFFFF` cannot recolour it. Use **`id 84`** (`app-cnc.svg`, 32×32, `currentColor`)
> like the other five.

### 5.3 Style

**`applications-section`** — `background-color: #FFFFFF;` + the §1.8 root box
(padding-block 96px desktop / 48px mobile, gap 80px).

**`applications-header`** — `max-width: 1280px; margin-inline: auto; width: 100%;`
**`applications-subtitle`** — `font-size: 20px; color: #52525B; line-height: 1.55; max-width: 768px; margin-inline: auto; text-align: center;`
`@media (--mobile) { font-size: 18px; }`

**`applications-title`** (gradient text)
```
margin: 0; text-align: center; font-size: 48px; font-weight: 700; line-height: 1.2;
background-image: linear-gradient(90deg, #1D4ED8 0%, #06B6D4 100%);
-webkit-background-clip: text; background-clip: text; color: transparent;
```
`@media (--tablet) { font-size: 40px; }` · `@media (--mobile) { font-size: 32px; }`
> If `background-clip: text` is dropped by the style converter, fall back to
> `color: #1D4ED8` — do not use the HTML widget for this.

**`applications-accordion`** — the L2 measure + the rhythm between the six items
```
width: 100%; max-width: 1280px; margin-inline: auto;
display: flex; flex-direction: column; gap: 12px;
```

**`app-*`** (the `e-accordion-item` → `<details>` card surface)
```
padding: 0; margin: 0;
background-color: #FFFFFF; border: 1px solid #F1F5F9; border-radius: 16px;
box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.10), 0 2px 4px -2px rgb(0 0 0 / 0.10);
transition: box-shadow 0.3s ease, border-color 0.3s ease;
&:hover { border-color: #E2E8F0; box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25); }
```

**`app-*-header`** (the `e-accordion-item-header` → `<summary>` click target)
```
cursor: pointer; padding: 24px;
display: flex; gap: 16px; justify-content: space-between; align-items: center;
&:focus { outline-width: 2px; outline-style: solid; outline-color: #3B82F6; outline-offset: -2px; }
```
`@media (--mobile) { padding: 16px; gap: 12px; }`

**`app-*-title`** (the `e-accordion-item-title` slot — a fixed `<span>` wrapper)
```
min-width: 0; display: flex; gap: 16px; flex: 1 1 auto; align-items: center;
```

**`app-*-icon`** (the 64px gradient tile — the tile is the **widget**, no container)
```
width: 64px; height: 64px; padding: 16px; box-sizing: border-box;
border-radius: 16px; color: #FFFFFF;
background-image: linear-gradient(135deg, #2563EB 0%, #06B6D4 100%);
box-shadow: 0 10px 25px rgb(37 99 235 / 0.25);
display: inline-block; flex: 0 0 auto;
```
The SVG in the Media Library uses `stroke="currentColor"` → setting `color: #FFFFFF` on the widget
makes the glyph white. ✔
> The `e-svg` base layer forces `width: 65px; height: 65px` — **always** write the explicit
> `width` / `height` on the widget or the tile drifts 1px.

**`app-*-label`** (`e-heading` h3) → `color: #0F172A; font-size: 20px; font-weight: 700; line-height: 1.33; padding: 0; margin: 0;`
**`app-*-chevron`** (`e-accordion-item-icon`) → `width: 24px; height: 24px; flex: 0 0 auto;`
**`app-*-chevron-svg`** (`e-svg`) → `width: 24px; height: 24px; color: #52525B;`
> The chevron's base layer is `width: 200px` and the `e-svg` base is `65px` — both must be
> overridden or the indicator overflows its 24px slot.

**`app-*-content`** (the `e-accordion-item-content` body)
```
padding: 0 24px 24px 104px;
```
`104px` = the header's 24px padding + the 64px icon + the 16px gap, so the body copy lines up
with the `h3` label instead of the icon.
`@media (--mobile) { padding: 0 16px 16px 16px; }`

**`app-*-description`** (`e-paragraph`) → `color: #52525B; font-size: 16px; line-height: 1.6; margin: 0 0 16px;`
**`app-*-question`** (`e-paragraph`) → `color: #52525B; font-size: 14px; font-style: italic; line-height: 1.5; margin: 0;`
Wrapped in typographic quotes: `“…”` (source uses `&ldquo; &rdquo;`).

**`applications-cta`** — `max-width: 1280px; margin-inline: auto; width: 100%;`

**`applications-cta-button`**
```
background-image: linear-gradient(90deg, #1D4ED8 0%, #06B6D4 100%); background-color: #2563EB;
color: #FFFFFF; border-radius: 9999px; padding: 16px 32px;
font-size: 18px; font-weight: 600; line-height: 1.55;
box-shadow: 0 10px 25px rgb(6 182 212 / 0.25);
&:hover { box-shadow: 0 20px 30px rgb(6 182 212 / 0.35); }
```

### 5.4 Notes

- The PHP collapses the description + question behind a **desktop-hover-only** reveal
  (`group-hover:max-h-96` + `group-focus-within`). On touch the copy stays invisible until the
  card is tapped. The Accordion replaces that reveal mechanism and **keeps the content identical**
  (same icon, title, description, question) — that is the whole of the change.
- The Accordion renders native `<details>` / `<summary>`: the toggle works with no JavaScript, is
  keyboard-operable, and each item is a separate disclosure.
- The `color` key in `inc/applications.php` is dead data; the template hard-codes one blue→cyan
  tile gradient. Use the tile gradient above for all six.
- The `e-accordion-item-title` slot is a **fixed, non-semantic wrapper** — the visible HTML tag is
  set by the inner `e-heading`'s own `tag` prop (`h3`). Do not try to set a tag on the slot.

---

### 5.5 Variant B — the 3/2/1 Feature Grid (Rule 2 literal)

**Build this only if the user asks for the grid back.** It is the literal Rule-2 *Feature Grid*
specification; it is kept complete so a variant switch costs one rebuild, not a re-architecture.
To switch: delete the `applications-accordion` widget, insert the `applications-grid` container
below, and keep the header and CTA untouched.

```
L1 ▸ applications-section        e-flexbox   column · full width · bg #FFFFFF · gap 80
  L2 ▸ applications-header       e-flexbox   column · align center · gap 24 · boxed 1280
    • applications-title         e-heading   h2 (gradient text)
    • applications-subtitle      e-paragraph
  L2 ▸ applications-grid         e-grid      boxed 1280 · 3 col / 2 col / 1 col · gap 32 · rows 1fr
    L3 ▸ appcard-cnc             e-flexbox   column · gap 24 · card surface
      • appcard-cnc-icon         e-svg       id 84
      • appcard-cnc-title        e-heading   h3
      • appcard-cnc-description  e-paragraph
      • appcard-cnc-question     e-paragraph
    L3 ▸ appcard-metal           e-flexbox   column · gap 24 · card surface   (id 85)
    L3 ▸ appcard-grinding        e-flexbox   column · gap 24 · card surface   (id 86)
    L3 ▸ appcard-bearing         e-flexbox   column · gap 24 · card surface   (id 87)
    L3 ▸ appcard-heavy           e-flexbox   column · gap 24 · card surface   (id 88)
    L3 ▸ appcard-auto            e-flexbox   column · gap 24 · card surface   (id 89)
  L2 ▸ applications-cta          e-flexbox   column · align center · gap 24 · boxed 1280
    • applications-cta-button    e-button
```

Depth: section (1) → grid (2) → card (3) → widgets ✔ **3 levels, no exception.**
The copy is the same table as §5.2; only the widget names change (`app-*` → `appcard-*`).

**`applications-grid`** — `max-width: 1280px; margin-inline: auto; width: 100%;`
```
display: grid;
grid-template-columns: repeat(3, 1fr);
grid-template-rows: 1fr;
gap: 32px;
@media (--tablet) { grid-template-columns: repeat(2, 1fr); }
@media (--mobile) { grid-template-columns: 1fr; }
```

**`appcard-*`** (shared card)
```
display: flex; flex-direction: column; align-items: flex-start; gap: 24px;
padding: 24px; background-color: #FFFFFF; border: 1px solid #F1F5F9; border-radius: 16px;
box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.10), 0 4px 6px -4px rgb(0 0 0 / 0.10);
transition: box-shadow 0.3s ease, transform 0.3s ease, border-color 0.3s ease;
&:hover { box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25); border-color: #E2E8F0; transform: translateY(-4px); }
```
`@media (--tablet) { padding: 32px; }`

**`appcard-*-icon`** — the same 64px gradient tile as §5.3 (`app-*-icon`).
**`appcard-*-title`** — `color: #0F172A; font-size: 20px; font-weight: 700; line-height: 1.4; margin: 0;`
**`appcard-*-description`** — `color: #52525B; font-size: 16px; line-height: 1.625; margin: 0;`
**`appcard-*-question`** — `color: #52525B; font-size: 14px; font-style: italic; line-height: 1.43; margin: 0;`

> In Variant B the description and the question are **always visible** (there is no hover
> affordance), so the six SEO questions are readable without any interaction.

---

## 6. §6 — Technology

**Source:** `template-parts/section-technology.php` · **Data:** `inc/technology.php`
**Map:** `sections-map.md` §7

### 6.1 Tree — section shell

```
L1 ▸ technology-section          e-flexbox   column · full width · ambient gradient · gap 80
  L2 ▸ technology-header         e-flexbox   column · align center · gap 24 · boxed 1280
    • technology-title           e-heading   h2
    • technology-lead            e-paragraph
    • technology-note            e-paragraph
  L2 ▸ technology-cards          e-grid      boxed 1280 · 2 col / 1 col · gap 32 · rows 1fr
    L3 ▸ tech-card-eco           e-flexbox   column · gap 24 · card surface
      • tech-eco-badge           e-paragraph (span)
      • tech-eco-title           e-heading   h3
      • tech-eco-subtitle        e-paragraph
      • tech-eco-description     e-paragraph
      • tech-eco-bullets         e-paragraph   (tag: span · inline <ul><li>)
      • tech-eco-cta             e-paragraph   (link prop → #technology-eco-air)
    L3 ▸ tech-card-earia         e-flexbox   column · gap 24 · card surface
      • tech-earia-badge         e-paragraph (span)
      • tech-earia-title         e-heading   h3
      • tech-earia-subtitle      e-paragraph
      • tech-earia-description   e-paragraph
      • tech-earia-bullets       e-paragraph   (tag: span · inline <ul><li>)
      • tech-earia-cta           e-paragraph   (link prop → #technology-earia)
  L2 ▸ technology-process         e-grid      boxed 1280 · 2 col / 1 col · gap 48 · rows 1fr
    L3 ▸ panel-eco                e-flexbox   column · gap 24 · card surface   → §6.4
    L3 ▸ panel-earia              e-flexbox   column · gap 24 · card surface   → §6.4
  L2 ▸ technology-cta             e-flexbox   column · align center · gap 32 · boxed 896
```

### 6.2 Widget map — header

| Element | Widget | Content |
|---|---|---|
| `technology-title` | `e-heading` h2 | Choose the Right Filtration Technology for Your Process — **one colour, no accent span** (the blue accent word is not expressible in V4; §1.5, D-11) |
| `technology-lead` | `e-paragraph` | Whether you handle oil mist, emulsions, smoke, or ultra-fine aerosols, our self-cleaning filtration systems deliver cleaner air, lower maintenance, and stable performance. |
| `technology-note` | `e-paragraph` | Compare technologies below or jump directly to the right solution. |

### 6.3 Widget map — selector cards

| Field | ECO AIR | EARIA |
|---|---|---|
| `*-badge` (`e-paragraph`, span) | **Best for Oil Mist & Emulsions** | **Best for Smoke & Fine Aerosols** |
| `*-title` (`e-heading` h3) | **ECO AIR CLEANER** | **EARIA** |
| `*-subtitle` (`e-paragraph`) | Mechanical Oil Mist Separator | Electrostatic Filtration System |
| `*-description` (`e-paragraph`) | Constant suction performance through self-cleaning mechanical filtration and oil recycling. | Electrostatic filtration for smoke, oil mist and ultra-fine particles with minimal maintenance. |
| `*-bullets` (`e-paragraph`, **`tag: "span"`**, inline `<ul><li>`) | Self-cleaning system · No filter mats · Oil recycling · Up to 1,500 m³/h | Smoke & aerosol capture · Electrostatic filtration · No cartridge exchange · Adjustable up to 1000 m³/h |
| `*-cta` (`e-paragraph` with the **`link` prop**, `tag: "a"`) | Learn How It Works → (`#technology-eco-air`) | Learn How It Works → (`#technology-earia`) |

Bullet markup (one native widget, fully editable):
```html
<ul><li>Self-cleaning system</li><li>No filter mats</li><li>Oil recycling</li><li>Up to 1,500 m³/h</li></ul>
```

> **`tag: "span"` is mandatory here, not cosmetic.** The widget renders
> `<p class="…">…</p>` by default, and the HTML parser **auto-closes an open `<p>`** when it meets
> a `<ul>` — the list would be hoisted out of the paragraph and would lose the widget's own
> `font-size` / `color`. With `tag: "span"` the parser keeps the `<ul>` inside the element, the
> widget's typography **inherits** into the `<li>`s, and `display: block` on the widget makes the
> span behave like a block. (`<span><ul>` is not valid HTML, but the browser keeps the
> nesting — it is the only way to get a styled native list out of `e-paragraph`.)
>
> The source's emerald check glyph per bullet is dropped — the list markers carry the same meaning
> and adding 4 `e-svg` widgets would need a per-bullet container. Logged as **D-07**.
> The `<ul>` / `<li>` **indent, spacing and marker colour cannot be styled** (descendant rules
> are impossible in V4 — §1.7); the list renders with the browser defaults. Logged as **D-13**.

### 6.4 Widget map — process panels (interactive step switcher)

**Decision (D-05, reversed):** the process panels are an **interactive `e-tabs` step switcher** —
one tab per step, the step diagram and its caption in the panel. This is the PHP's own behaviour
(`data-emifree-step` / `data-emifree-image` / `data-emifree-step-caption`), and the two objections
that originally ruled Tabs out are both gone:

- **The step images exist.** All seven are in the theme at `assets/tech/` with their intrinsic
  dimensions recorded in `inc/technology.php:44-54`. `e-image` accepts a **URL** as well as a
  library id, so the build is **not blocked on a Media Library import** — the theme URLs work
  today. Import the five extra files into the library later for editor convenience (§9.4).
- **There is no auto-advance.** The V4 `e-tabs` schema exposes exactly one prop —
  `default-active-tab`. There is **no auto-cycle control at all**, so the PHP's 5-second
  auto-rotate (map flag 8) simply does not carry over. Nothing to pause, nothing to disable.

```
  L2 ▸ technology-process         e-grid      boxed 1280 · 2 col / 1 col · gap 48 · rows 1fr
    L3 ▸ panel-eco                e-flexbox   column · gap 24 · card surface · scroll-margin-top 80px
      • panel-eco-title           e-heading   h3
      • panel-eco-subtitle        e-paragraph
      ▸ panel-eco-tabs            e-tabs          default-active-tab: 2
        ▸ panel-eco-menu          e-tabs-menu
          ▸ panel-eco-tab-1       e-tab   → e-paragraph (span) "1 · Pre-Filtration"
          ▸ panel-eco-tab-2       e-tab   → e-paragraph (span) "2 · Coalescence"
          ▸ panel-eco-tab-3       e-tab   → e-paragraph (span) "3 · Self-Cleaning & Recycling"
        ▸ panel-eco-panels        e-tabs-content-area
          ▸ panel-eco-panel-1     e-tab-content
            • panel-eco-step-1    e-heading   h4  "Step 1 · Pre-Filtration"
            • panel-eco-image-1   e-image      url → Step1.1_ECOAIR.jpg
            • panel-eco-caption-1 e-paragraph
          ▸ panel-eco-panel-2     e-tab-content   (Coalescence)
            • panel-eco-step-2    e-heading   h4  "Step 2 · Coalescence"
            • panel-eco-image-2   e-image      url → Step2.1_ECOAIR.webp
            • panel-eco-caption-2 e-paragraph
          ▸ panel-eco-panel-3     e-tab-content   (Self-Cleaning & Recycling)
            • panel-eco-step-3    e-heading   h4  "Step 3 · Self-Cleaning & Recycling"
            • panel-eco-image-3   e-image      url → Step3_clean.webp
            • panel-eco-caption-3 e-paragraph
    L3 ▸ panel-earia              e-flexbox   column · gap 24 · card surface · scroll-margin-top 80px
      • panel-earia-title         e-heading   h3
      • panel-earia-subtitle      e-paragraph
      ▸ panel-earia-tabs          e-tabs          default-active-tab: 0
        ▸ panel-earia-menu        e-tabs-menu
          ▸ panel-earia-tab-1     e-tab   → e-paragraph (span) "1 · Stainless steel pre-filter"
          ▸ panel-earia-tab-2     e-tab   → e-paragraph (span) "2 · Ionization"
          ▸ panel-earia-tab-3     e-tab   → e-paragraph (span) "3 · Collector plates"
          ▸ panel-earia-tab-4     e-tab   → e-paragraph (span) "4 · Oil particle collection"
        ▸ panel-earia-panels      e-tabs-content-area
          ▸ panel-earia-panel-1   e-tab-content
            • panel-earia-step-1  e-heading   h4  "Step 1 · Stainless steel pre-filter"
            • panel-earia-image-1 e-image      url → Step%201.webp
            • panel-earia-caption-1 e-paragraph
          ▸ panel-earia-panel-2   e-tab-content
            • panel-earia-step-2  e-heading   h4  "Step 2 · Ionization"
            • panel-earia-image-2 e-image      url → Step%202.webp
            • panel-earia-caption-2 e-paragraph
          ▸ panel-earia-panel-3   e-tab-content
            • panel-earia-step-3  e-heading   h4  "Step 3 · Collector plates"
            • panel-earia-image-3 e-image      url → Step%203.webp
            • panel-earia-caption-3 e-paragraph
          ▸ panel-earia-panel-4   e-tab-content
            • panel-earia-step-4  e-heading   h4  "Step 4 · Oil particle collection"
            • panel-earia-image-4 e-image      url → Step%204.webp
            • panel-earia-caption-4 e-paragraph
```

Depth: section (1) → `technology-process` (2) → `panel-eco` (3) → `e-tabs` — **native widget
internals are depth-exempt** (§1.2). ✔ **No exception needed.**

> ⚠️ **Do not rebuild the steps as containers.** The classic PHP structure
> `steps → step-N → body` is **three real container levels**; nested under the L1 → L2 → L3 chain
> it pushes the page to **depth 7** and breaks the §1.2 cap. In this tree the steps are the
> `e-tabs` widget's own internals (`e-tab` / `e-tab-content`), which are **not** editor containers
> and do not count. If a build arrives with `step-N` / `body` as `e-flexbox` / `e-div-block`
> elements, that is the thing to flatten — not the `e-tabs` tree. See also §6.4.1.

#### Schema facts (verified against the widget registry — 2026-11-02)

| Element | Own props | Base style that must be overridden | Children |
|---|---|---|---|
| `e-tabs` | **`default-active-tab`** only (number) | `display:flex; flex-direction:column; gap:30px` | `e-tabs-menu`, `e-tabs-content-area` |
| `e-tabs-menu` | none | `display:flex; justify-content:center` — **no `flex-direction`**, so the row is horizontal by default | `e-tab`, `container` |
| `e-tab` | none | `width:160px; padding:8px; border-width:2px; border-style:solid; border-color:#E0E0E0; background-color:#FFFFFF; color:#0C0D0E; display:block` — **plus** `.e--selected{border-color:#0C0D0E}` and `:hover,:focus-visible{background-color:#E0E0E0}` | **one** heading or paragraph (the label) |
| `e-tabs-content-area` | none | `display:block; width:100%` | `e-tab-content`, `container` |
| `e-tab-content` | `tab-id` (optional) | `padding:10px; width:100%` | any widget type |

**Hard constraint from the schema:** *"The number of `e-tab` elements MUST equal the number of
`e-tab-content` elements. Each `e-tab` at index N is paired with the `e-tab-content` at index N."*
ECO AIR = 3 + 3, EARIA = 4 + 4. The pairing is **by index**, so the tab order and the panel order
must be identical.

> ⚠️ **Schema quirk:** the registry reports `can_have_children: false` on `e-tab` and
> `e-tab-content`, yet both descriptions say they hold content (and `e-tab` has no
> `allowed_child_types` key at all). The description is the authoritative field — `e-tab` must hold
> its label paragraph. If the Builder's schema validation rejects the direct children, the
> fallback is to wrap each panel's content in an `e-flexbox` container inside the `e-tab-content`
> (`e-tabs-content-area` explicitly allows a `container` child). Verify on the first render.

**Tab labels** are the step titles **prefixed with their number** — `1 · Pre-Filtration`,
`2 · Coalescence`, `3 · Self-Cleaning & Recycling` (EARIA: `1 · Stainless steel pre-filter`,
`2 · Ionization`, `3 · Collector plates`, `4 · Oil particle collection`). The PHP shows the title
alone (`<span class="text-sm font-medium">Pre-Filtration</span>`) and lets the order carry the
numbering; in a tab strip that stops being self-evident, and the number is also the fallback that
makes the **active step readable without any selected-state styling** (§6.6).
Each `e-tab` holds **one** `e-paragraph` (the label) with **`tag: "span"`** — a `<span>` has no
kit default style, so the label **inherits** the tab's colour, size and `:hover` / `:focus` state
(a `p` label would be pinned to the kit's `.e-default-p` colour and would never change).
`e-tab` accepts a single heading or paragraph, nothing else.

> ⚠️ **The `e-tab` schema's `default_styles` block is misleading.** The MCP's schema summary
> reports `border-color:#0C0D0E` and `background-color:#E0E0E0` — those are the **selected** and
> **hover** values, not the resting ones. The widget's real base (`define_base_styles()` in
> `atomic-tab.php`, confirmed in the generated `uploads/elementor/css/base-desktop.css`) is
> `border-color:#E0E0E0; background-color:#FFFFFF`. **The generated CSS is authoritative** — the
> table above is transcribed from it.

**Panel content** — one `e-heading` (the numbered step title, h4) + one `e-image` + one
`e-paragraph` caption, in that order (the PHP renders the image box above the caption; the
numbered heading is added so the open panel names its own step).

| Panel | Title | Subtitle | Caption (the PHP `desc`) |
|---|---|---|---|
| `panel-eco` | **How ECO AIR Works** | Mechanical separation + coalescence | 1 Stainless steel mesh captures larger droplets before separation. · 2 Rotating drums enlarge tiny oil particles into larger droplets for efficient separation and oil recovery. · 3 Integrated spraying nozzles maintain constant performance and recycle collected oil. |
| `panel-earia` | **How EARIA Works** | Electrostatic filtration | 1 First stage captures larger particles to protect ionizer. · 2 High voltage ionizer charges particles for electrostatic capture. · 3 Alternating plates attract and hold charged particles. · 4 Self-cleaning drain removes collected oil automatically. |

**Images** — `e-image` with the **URL form** (verified by dry run on post 72, 2026-11-02):

```json
"image": { "src": { "url": "http://landingwptest.local/wp-content/themes/emifree-landing/assets/tech/Step1.1_ECOAIR.jpg",
                    "alt": "Pre-Filtration" },
           "size": "full" }
```

`size` is **inside** `image` and `alt` is **inside** `src` — a sibling `alt`/`size` is skipped with
a warning (`Property "size" is not supported on element type "e-image"`). The `alt` is the step
title, exactly as the PHP's `alt="<?php echo esc_attr( $emifree_step['title'] ); ?>"`.

| Tab | File | Intrinsic | URL path |
|---|---|---|---|
| ECO AIR 1 | `Step1.1_ECOAIR.jpg` | 892×683 | `…/themes/emifree-landing/assets/tech/Step1.1_ECOAIR.jpg` |
| ECO AIR 2 | `Step2.1_ECOAIR.webp` | 1360×752 | `…/themes/emifree-landing/assets/tech/Step2.1_ECOAIR.webp` |
| ECO AIR 3 | `Step3_clean.webp` | 1024×1024 | `…/themes/emifree-landing/assets/tech/Step3_clean.webp` |
| EARIA 1 | `Step 1.webp` | 1376×768 | `…/themes/emifree-landing/assets/tech/Step%201.webp` |
| EARIA 2 | `Step 2.webp` | 1376×768 | `…/themes/emifree-landing/assets/tech/Step%202.webp` |
| EARIA 3 | `Step 3.webp` | 1376×768 | `…/themes/emifree-landing/assets/tech/Step%203.webp` |
| EARIA 4 | `Step 4.webp` | 1376×768 | `…/themes/emifree-landing/assets/tech/Step%204.webp` |

> ⚠️ The EARIA filenames contain a **space** — it must be percent-encoded (`%20`) in the URL, or
> the request 404s. Base URL:
> `http://landingwptest.local/wp-content/themes/emifree-landing/assets/tech/`

**`default-active-tab`** — this reproduces the PHP's `initial_step` (`section-technology.php:84`
compares it against a **0-based** index, so `initial_step => 2` is the **third** step):

| Tabs | `initial_step` | Opens on | `default-active-tab` |
|---|---|---|---|
| `panel-eco-tabs` | `2` | **Self-Cleaning & Recycling** (the differentiation moment the PHP comment calls out) | `2` |
| `panel-earia-tabs` | *(absent → 0)* | Stainless steel pre-filter | `0` |

> ✔ **The index base is settled: `default-active-tab` is 0-based.** Proven from the plugin source
> (2026-11-02), with the exact lines:
>
> | Fact | Source |
> |---|---|
> | The child id list is built with `->flip()->all()` → **0-based** keys | `atomic-tabs/atomic-tabs.php:201-212` (`get_filtered_children_ids()`) |
> | The active tab is resolved by `$tab_ids[$tab_id]` — the same 0-based list | `atomic-tabs/atomic-tabs.php:214-220` (`get_tab_index()`) |
> | The render check is a **strict** comparison `$default_active_tab === $index` | `atomic-tab/atomic-tab.php:178` (read) + `:183` (compare); `atomic-tab-content/atomic-tab-content.php:124` + `:129` |
> | The prop's **own default is `0`** | `atomic-tabs/atomic-tabs.php:78-80` — `Number_Prop_Type::make()->default(0)` |
> | The front-end JS is 0-based too | `handlers/atomic-tabs-handler.js` → `getIndex()` = `indexOf` |
>
> All paths are relative to
> `wp-content/plugins/elementor/modules/atomic-widgets/elements/atomic-tabs/`.
>
> So **ECO AIR = `2` is the third step** and **EARIA = `0` is the first step**. The 1-based
> reading (ECO AIR `3`, EARIA `1`) is **wrong** — it would open ECO AIR on *Coalescence* and
> EARIA on *Ionization*. No guessing needed in the build.

**Breakpoint — the two-state case (§1.3).** The PHP splits the step list at Tailwind's `md:`
(**768px min-width**): a **vertical** button list at ≥768px, a **horizontally scrolling pill row**
below 768px. There is only **one** value for ≥768px, so the tablet band (768–1024) and the desktop
band (>1024) are identical → put the value in the **base** and override **only** at `--mobile`.
Elementor's mobile band is **max-width 767px** (§1.3), so the PHP's 768px split lands exactly on
that boundary. Concretely: **horizontal below 768px, vertical from 768px up.**

```css
/* base — vertical from 768px up */
flex-direction: column;
@media (--mobile) { flex-direction: row; overflow-x: auto; }
```

> This is **not** the general rule — a `md:` rule with a separate tablet value goes into
> `@media (--tablet)`. Only this two-state rule collapses to base + `--mobile`. See §1.3,
> "Two-state exception" and "The trap".

**Layout change, accepted deliberately.** The PHP's desktop step list is vertical; an `e-tabs`
menu is a horizontal row of triggers. The Tabs build therefore shows a **horizontal stepper** where
the classic page shows a vertical list. The step order, titles, images and captions are identical —
only the trigger row's axis changes. If a vertical list is required, set
`flex-direction: column` on `e-tabs-menu` (the menu is a plain flex container) and confirm the
active-state styling still reads; see the style block below.

#### 6.4.1 Fallback — static step list

If the `e-tabs` widget cannot be styled to the PHP's look in the first render, fall back to the
static list — **one `e-paragraph` per panel carrying the numbered steps, plus the two library
diagrams** (`id 98` ECO AIR, `id 99` EARIA). Nothing else changes.

> **This fallback is also the cheapest route for the §1.2 depth cap.** The `e-tabs` route keeps the
> page at **L3 → widget** (the tabs' internals are depth-exempt, §1.2). The classic PHP structure
> `steps → step-N → body` is **three real container levels** and, nested under L1 → L2 → L3, pushes
> the page to **depth 7** — a cap breach. The fallback collapses the whole step list into a single
> `e-paragraph` carrying the inline `<ol><li>`: **L3 → widgets**, no extra container at all.
> §1.5 already allows `ol li strong em` in an `e-paragraph`, so the list stays fully editable on
> the canvas. **If a build comes in over depth 3, this is the fix — never a deeper tree.**

```
    L3 ▸ panel-eco                e-flexbox   column · gap 24 · card surface
      • panel-eco-title           e-heading   h3
      • panel-eco-subtitle        e-paragraph
      • panel-eco-image           e-image     id 98   (ECO AIR diagram, 1024×1024)
      • panel-eco-steps           e-paragraph (inline <ol><li>)
    L3 ▸ panel-earia              e-flexbox   column · gap 24 · card surface
      • panel-earia-title         e-heading   h3
      • panel-earia-subtitle      e-paragraph
      • panel-earia-image         e-image     id 99   (EARIA diagram, 1376×768)
      • panel-earia-steps         e-paragraph (inline <ol><li>)
```

Step markup (one native widget, still fully editable):
```html
<ol>
  <li><strong>Pre-Filtration</strong> — Stainless steel mesh captures larger droplets before separation.</li>
  …
</ol>
```
This is the no-JS baseline — every word survives, but the step switcher is gone.

### 6.5 Widget map — CTA card

```
  L2 ▸ technology-cta            e-flexbox   column · align center · gap 32 · max-width 896 · margin-inline auto
    • technology-cta-title       e-heading   h3
    • technology-cta-body        e-paragraph
    L3 ▸ technology-cta-actions  e-flexbox  [E1-c]  row · wrap · gap 16 · align center · justify center
      • technology-cta-primary   e-button
      • technology-cta-secondary e-button
```

| Element | Content | Link |
|---|---|---|
| `technology-cta-title` (h3) | Not sure which filtration technology fits your application? | — |
| `technology-cta-body` | Tell us your contamination type, airflow requirements, or machine setup, we'll recommend the right solution. | — |
| `technology-cta-primary` | **Get expert recommendation** | `#contact` (see **D-08**) |
| `technology-cta-secondary` | **View more Technical Specs →** | `#knowledge` |

`technology-cta` = the blue-tint card itself (`max-width: 896px; margin-inline: auto; padding: 48px;
background-color: #EFF6FF; border-radius: 24px; box-shadow: …xl; text-align: center;`) — it is the
L2 container, so the button group lands at L3 and no depth exception is needed *for the card*.

> **E1-c** is still required because the two buttons must sit side by side inside the card.
> Fallback: stack them vertically.

### 6.6 Style

**`technology-section`**
```
width: 100%; position: relative; box-sizing: border-box; padding-block: 96px; scroll-margin-top: 80px;
background-color: #F8FAFC;
background-image: linear-gradient(to bottom right, #F8FAFC 0%, #FFFFFF 50%, #EFF6FF 100%);
display: flex; flex-direction: column; gap: 80px;
@media (--mobile) { padding-block: 48px; gap: 48px; background-image: none; }
```
> The ambient gradient switches on at `md:` (**768px min-width**) in the PHP. Elementor's Mobile
> breakpoint is **≤767px** (§1.3), so the base rule + a `--mobile` reset reproduces it exactly —
> no pixel query needed. The gradient is therefore **in the base rule**, not in `@media (--tablet)`:
> `--tablet` (≤1024px) is *inside* the PHP's gradient range, so putting it there would wrongly
> switch the gradient **off** above 1024px.

**`technology-title`** → `color: #0F172A; font-size: 48px; font-weight: 700; line-height: 1.2; text-align: center;`
**`technology-lead`** → `color: #475569; font-size: 20px; line-height: 1.4; max-width: 768px; margin-inline: auto; text-align: center;`
**`technology-note`** → `color: #64748B; font-size: 14px; line-height: 1.43; margin: 0; text-align: center;`

**`tech-card-*`**
```
display: flex; flex-direction: column; align-items: flex-start; gap: 16px; padding: 24px;
background-color: #FFFFFF; border: 1px solid #F1F5F9; border-radius: 24px;
box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.10), 0 8px 10px -6px rgb(0 0 0 / 0.10);
transition: box-shadow 0.3s ease;
&:hover { box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25); }
```
`@media (--tablet) { padding: 32px; }`

**`tech-eco-badge`** → `background-color: #FEF3C7; color: #92400E; font-size: 12px; font-weight: 600;
line-height: 1.33; padding: 4px 12px; border-radius: 9999px; display: inline-block;`
**`tech-earia-badge`** → `background-color: #F3E8FF; color: #6B21A8;` (same metrics)

**`tech-*-title`** → `color: #0F172A; font-size: 36px; font-weight: 700; line-height: 1.2; margin: 0;`
`@media (--tablet) { font-size: 24px; }`
**`tech-*-subtitle`** → `color: #64748B; font-size: 14px; line-height: 1.43; margin: 0;`
**`tech-*-description`** → `color: #475569; font-size: 16px; line-height: 1.5; margin: 0;`
**`tech-*-bullets`** → `display: block; color: #334155; font-size: 16px; line-height: 1.5; margin: 0;`
> The `<ul>` / `<li>` keep the browser's default indent, spacing and marker colour — descendant
> rules are impossible in V4 (§1.7). Do **not** add `ul { … }`: without a leading `&` it **fails
> the whole build**, with `&` it is dead CSS. Logged as **D-13**.

**`tech-*-cta`** → `color: #2563EB; font-size: 16px; font-weight: 500; margin: 0; text-decoration: none;`
`&:hover { color: #1D4ED8; }`
> The CTA is an `e-paragraph` with `link: {destination: "#technology-eco-air", tag: "a"}`.
> Elementor puts `all: unset` on the inner anchor (`link-base` base style), so the anchor
> **inherits** the paragraph's colour and its `:hover` state — no `a { … }` rule is needed, and
> none is possible.

**`panel-*`**
```
display: flex; flex-direction: column; gap: 24px; padding: 24px;
background-color: #FFFFFF; border: 1px solid #F1F5F9; border-radius: 24px;
box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.10), 0 8px 10px -6px rgb(0 0 0 / 0.10);
scroll-margin-top: 80px;
```
`@media (--tablet) { padding: 32px; }`
**`panel-*-title`** → `color: #0F172A; font-size: 24px; font-weight: 700; line-height: 1.33; margin: 0;`
**`panel-*-subtitle`** → `color: #64748B; font-size: 14px; line-height: 1.43; margin: 0;`
**`panel-*-image`** → `width: 100%; height: auto; border-radius: 16px; object-fit: contain;
background-color: #F1F5F9; padding: 16px; box-sizing: border-box;`
**`panel-*-step`** → `color: #0F172A; font-size: 18px; font-weight: 700; line-height: 1.4;
margin: 0; text-align: center;` — the numbered step title that names the open panel.
**`panel-*-caption`** → `color: #475569; font-size: 16px; line-height: 1.5; margin: 0; text-align: center;`
> The caption keeps `<strong>` for the bold phrase. A `<strong>` inside the paragraph **inherits**
> the caption colour — it cannot be given its own colour (descendant rule impossible, §1.7), so
> the bold phrase is bold, not darker. Part of **D-13**.

**`panel-*-tabs`** — the `e-tabs` wrapper. The widget's own base style is minimal; the layout work is
in the menu (row → column) and the trigger buttons.

```
gap: 24px;
```
**`panel-*-menu`** — the step list. Base style is `display:flex; justify-content:center`; the PHP's
desktop list is a **vertical** button stack, so `flex-direction: column` is the desktop default
and the mobile override flips it back to a scrolling row.

```
display: flex; flex-direction: column; align-items: stretch; justify-content: flex-start;
gap: 8px; width: 100%;
@media (--mobile) {
  flex-direction: row; align-items: stretch; justify-content: flex-start;
  overflow-x: auto; scroll-snap-type: x mandatory; gap: 8px;
  padding-bottom: 8px;
}
```
**`panel-*-tab`** — the trigger button (`<button role="tab" aria-selected>`). The widget base
forces `width:160px` and a 2px border — **`width` and the border colour must be overridden**,
otherwise the stepper renders as a row of 160px-wide boxes.

```
width: auto; min-width: 0; flex: 1 1 auto;
border-width: 2px; border-style: solid; border-color: #E2E8F0;
border-radius: 12px; background-color: #FFFFFF;
padding: 14px 18px; box-sizing: border-box;
color: #334155; font-size: 15px; font-weight: 500; text-align: left; line-height: 1.4;
transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
&:hover { background-color: #EFF6FF; border-color: #BFDBFE; color: #1E40AF; }
&:focus { background-color: #1D4ED8; border-color: #1D4ED8; color: #FFFFFF; }
@media (--mobile) { flex: 0 0 auto; white-space: nowrap; scroll-snap-align: start; }
```
> **`&:hover` must be written **before** `&:focus`.** Elementor renders the variants in the order
> they appear in the style string, and the later rule wins when both match — a clicked tab is
> both hovered and focused. `focus` last ⇒ the blue focus fill wins. (`&:hover` is emitted as
> `:hover, :focus-visible`; the base layer's `.e-tab-base:hover` / `:focus-visible` grey is
> (0,3,0) and loads earlier, so the local hover tint wins.)

**`panel-*-tab-label`** — the `e-paragraph` inside the tab. **Give it `tag: "span"` and no style
entry at all.** A `span` has **no kit default style**, so the label inherits the tab's `color`,
`font-size` and `font-weight` — and therefore **follows the `:hover` / `:focus` colour change**.
A `p` label would be pinned to the kit's `.e-default-p` colour (`var(--text-body-alt)`) and would
stay grey on the blue focus fill.

**The active step.** Elementor's own base layer already draws it:
```css
.elementor .e-tab-base.e--selected{border-color:#0C0D0E;outline-width:0px;}
```
So the selected tab gets a **2px near-black border** with no extra CSS from us. The specificity
maths: the base rule is (0,3,0) and our local base rule `.elementor .e-<hash>` is (0,2,0), so
**the base wins for `border-color`** — exactly what we want for the resting selected tab. A local
`&:focus` is also (0,3,0) but loads **later** (`local-<post>-frontend-desktop.css` is the last
stylesheet), so it takes over once the tab is clicked.

> **There is no blue "selected" fill available through the MCP.** `&.e--selected` and
> `&[aria-selected="true"]` are both impossible: a top-level `.e--selected { … }` **fails the
> build**, and `&.e--selected { … }` becomes dead `custom_css` (§1.7). Global classes go through
> the same parser, so they cannot do it either. The active step is therefore carried by
> (a) the near-black border above, (b) the **numbered** tab label, and (c) the numbered step
> heading inside the open panel. **If a true blue selected fill is wanted**, it is a one-off in the
> Elementor editor: select the tab → **Advanced → States → Selected** → set the background. That
> path writes the `e--selected` state natively and is the only route to it.
**`panel-*-panels`** — the content area holding the three/four `e-tab-content` panels.
```
width: 100%;
```
**`panel-*-panel`** — one step's panel: image + caption. The base adds `padding:10px` — the
image box carries its own padding, so the panel's is removed.
```
display: flex; flex-direction: column; gap: 16px; align-items: center; padding: 0;
```
> **Fallback styles.** If the Tabs build is dropped for §6.4.1 (static list), use instead:
> **`panel-*-steps`** → `display: block; color: #475569; font-size: 16px; line-height: 1.5; margin: 0;`
> `tag: "span"` + inline `<ol><li>` (same rule as the bullets — §6.3). The list keeps the browser
> defaults for indent and spacing.

**`technology-cta`** → `max-width: 896px; margin-inline: auto; width: 100%; box-sizing: border-box;
padding: 32px; background-color: #EFF6FF; border-radius: 24px;
box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.10), 0 8px 10px -6px rgb(0 0 0 / 0.10);
display: flex; flex-direction: column; align-items: center; gap: 32px; text-align: center;`
`@media (--tablet) { padding: 48px; }`
**`technology-cta-title`** → `color: #0F172A; font-size: 48px; font-weight: 700; line-height: 1.2; margin: 0;`
`@media (--tablet) { font-size: 30px; }`
**`technology-cta-body`** → `color: #334155; font-size: 18px; line-height: 1.55; margin: 0; max-width: 672px;`
**`technology-cta-primary`** → `background-color: #FFFFFF; color: #334155; border: 1px solid #CBD5E1;
border-radius: 9999px; padding: 14px 24px; min-height: 44px; font-size: 16px; font-weight: 500;
&:hover { background-color: #F8FAFC; }`
**`technology-cta-secondary`** → `background: transparent; color: #1E40AF; border-radius: 9999px;
padding: 14px 24px; min-height: 44px; font-size: 16px; font-weight: 500;
&:hover { color: #1E3A8A; }`

---

## 7. §7 — Knowledge

**Source:** `template-parts/section-knowledge.php` · **Data:** `inc/knowledge.php`
**Map:** `sections-map.md` §8 (which already fixes the architecture decision: **option (b)** —
Panel A on the homepage, the other two bodies on their own sub-pages)

### 7.1 Tree

```
L1 ▸ knowledge-section          e-flexbox   column · full width · bg #FFFFFF · gap 64
  L2 ▸ knowledge-masthead       e-flexbox   column · align center · gap 24 · boxed 1280
    • knowledge-title           e-heading   h2
    • knowledge-subtitle        e-paragraph
    • knowledge-tools-button    e-button    → /en/knowledge/tools/
  L2 ▸ knowledge-tabs           e-flexbox   row · wrap · gap 16 · align center · justify center · boxed 1280
    • knowledge-tab-insights    e-button    → /en/knowledge/insights/   (active style)
    • knowledge-tab-about       e-button    → /en/knowledge/about/
    • knowledge-tab-downloads   e-button    → /en/knowledge/downloads/
  L2 ▸ knowledge-feature        e-grid      boxed 1280 · 2 col (2fr 3fr) · 4 rows · card surface
    • knowledge-feature-image   e-image     id 127
    • knowledge-feature-badge   e-paragraph (overlaps the image, col 1 / row 1)
    • knowledge-feature-meta    e-paragraph
    • knowledge-feature-title   e-heading   h3
    • knowledge-feature-excerpt e-paragraph
    • knowledge-feature-cta     e-paragraph
  L2 ▸ knowledge-archive        e-flexbox   column · align center · boxed 1280
    • knowledge-archive-button  e-button    → /blog/
```

Depth: section (1) → grid (2) → widgets (3) ✔ **3 levels, no exception.**

### 7.2 Widget map

| Element | Widget | Content | Link |
|---|---|---|---|
| `knowledge-title` | `e-heading` h2 | `Resources & Knowledge` — **one colour, no accent span** (the classic PHP colours "Knowledge"; the accent is not expressible in V4 — §1.5, D-11) | — |
| `knowledge-subtitle` | `e-paragraph` | Explore our latest insights, company updates, and technical resources to stay informed about industrial air filtration. | — |
| `knowledge-tools-button` | `e-button` | Open Our Free Engineering Tools | `/en/knowledge/tools/` |
| `knowledge-tab-insights` | `e-button` | Industry Insights | `/en/knowledge/insights/` |
| `knowledge-tab-about` | `e-button` | About Us | `/en/knowledge/about/` |
| `knowledge-tab-downloads` | `e-button` | Downloads | `/en/knowledge/downloads/` |
| `knowledge-feature-image` | `e-image` `image: { src: { id: 127 }, size: "large" }` | HEPA filter close-up | `id 127` (`hepa-1.webp`, alt **HEPA filter close-up** — the attachment alt is already set; a library image takes **no** `alt` prop) |
| `knowledge-feature-badge` | `e-paragraph` | Safety Guide | — |
| `knowledge-feature-meta` | `e-paragraph` | `October 14, 2026 · 6 min read` | — |
| `knowledge-feature-title` | `e-heading` h3 | HEPA Filters in CNC & Industrial Workshops: Uses, Limits & Safety | — |
| `knowledge-feature-excerpt` | `e-paragraph` | How HEPA filters control fine dust in CNC and industrial workshops — what they capture, what they don't (gases, vapors, oil mist), and the combustible-dust safety rules you need to follow before installing one. | — |
| `knowledge-feature-cta` | `e-paragraph` | Read article → | — |
| `knowledge-archive-button` | `e-button` | View All Articles | `/blog/` |

**Whole-card link.** `knowledge-feature` is a grid container and carries
`link: {destination: "/en/knowledge/hepa-filters-cnc-industrial-workshops/", tag: "a"}` — the card is
one anchor, exactly like the source `<a>`.

### 7.3 Style

**`knowledge-section`**
```
width: 100%; position: relative; box-sizing: border-box; padding-block: 96px; scroll-margin-top: 80px;
background-color: #FFFFFF; display: flex; flex-direction: column; gap: 64px;
@media (--mobile) { padding-block: 48px; gap: 40px; }
```
`tag: "section"` · `_cssid: "knowledge"` (so `#knowledge` anchors resolve).

**`knowledge-masthead`** → `max-width: 1280px; margin-inline: auto; padding-inline: 32px; width: 100%;
box-sizing: border-box; display: flex; flex-direction: column; align-items: center; gap: 24px; text-align: center;`
`@media (--mobile) { padding-inline: 16px; }`

**`knowledge-title`** → `color: #0F172A; font-size: 48px; font-weight: 700; line-height: 1.2; text-align: center;`
`@media (--tablet) { font-size: 48px; }` · `@media (--mobile) { font-size: 36px; }`
One colour only — the accent word is **not** colourable in V4 (§1.5, D-11).

**`knowledge-subtitle`** → `color: #475569; font-size: 20px; line-height: 1.4; max-width: 768px; margin-inline: auto;`
**`knowledge-tools-button`** → `background-image: linear-gradient(90deg, #1D4ED8 0%, #06B6D4 100%);
background-color: #2563EB; color: #FFFFFF; border-radius: 9999px; padding: 16px 32px; font-size: 18px;
font-weight: 600; line-height: 1.55; box-shadow: 0 10px 25px rgb(6 182 212 / 0.25);
&:hover { box-shadow: 0 20px 30px rgb(6 182 212 / 0.35); }`

**`knowledge-tabs`** → `max-width: 1280px; margin-inline: auto; padding-inline: 32px; width: 100%;
box-sizing: border-box; display: flex; flex-direction: row; flex-wrap: wrap; gap: 16px;
align-items: center; justify-content: center;`

**`knowledge-tab-insights`** (active) → `background-color: #1D4ED8; color: #FFFFFF; border: 1px solid #1D4ED8;
border-radius: 9999px; padding: 16px 32px; font-size: 16px; font-weight: 600; line-height: 1.5;
box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.10);`
**`knowledge-tab-about` / `-downloads`** (inactive) → `background-color: #FFFFFF; color: #475569;
border: 1px solid #E2E8F0; border-radius: 9999px; padding: 16px 32px; font-size: 16px; font-weight: 600;
&:hover { background-color: #F1F5F9; color: #1D4ED8; border-color: #CBD5E1; }`

**`knowledge-feature`**
```
max-width: 1280px; margin-inline: auto; padding-inline: 32px; width: 100%; box-sizing: border-box;
display: grid; grid-template-columns: 2fr 3fr; grid-template-rows: auto auto auto auto;
column-gap: 32px; row-gap: 12px; align-items: center;
padding: 24px; background-color: #FFFFFF; border-radius: 24px; overflow: hidden;
box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.10), 0 4px 6px -4px rgb(0 0 0 / 0.10);
transition: box-shadow 0.3s ease;
&:hover { box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.10), 0 8px 10px -6px rgb(0 0 0 / 0.10); }
```
`@media (--tablet) { padding-inline: 24px; column-gap: 24px; }`
`@media (--mobile) { grid-template-columns: 1fr; grid-template-rows: none; row-gap: 16px; padding: 16px; }`

**`knowledge-feature-image`** → `grid-column: 1; grid-row: 1 / -1; width: 100%; height: 100%;
min-height: 240px; object-fit: cover; border-radius: 16px; background-color: #F1F5F9;
transition: transform 0.3s ease;`
`&:hover { transform: scale(1.05); }`
`@media (--mobile) { grid-row: 1; height: auto; aspect-ratio: 16 / 9; }`
> The PHP scales the image with `group-hover:scale-105` (card-wide). A card-wide trigger needs a
> parent selector, which V4 cannot express — so the scale fires when the pointer is over the
> **image** itself. Same limitation as D-04. `overflow: hidden` on the grid clips the scale at the
> card edge.

**`knowledge-feature-badge`** → `grid-column: 1; grid-row: 1; justify-self: start; align-self: start;
z-index: 2; margin: 16px; background-color: #DC2626; color: #FFFFFF; font-size: 14px; font-weight: 600;
line-height: 1.43; padding: 4px 12px; border-radius: 9999px;`
`@media (--mobile) { grid-column: 1; grid-row: 2; justify-self: start; align-self: center; margin: 0; }`

**`knowledge-feature-meta`** → `grid-column: 2; grid-row: 1; color: #64748B; font-size: 14px; line-height: 1.43; margin: 0;`
**`knowledge-feature-title`** → `grid-column: 2; grid-row: 2; color: #0F172A; font-size: 36px; font-weight: 700; line-height: 1.33; margin: 0;`
`&:hover { color: #1D4ED8; }` — the PHP's `group-hover:text-blue-700`, reduced to a title-hover
(again, no parent selector in V4).
`@media (--tablet) { font-size: 24px; }`
**`knowledge-feature-excerpt`** → `grid-column: 2; grid-row: 3; color: #475569; font-size: 18px; line-height: 1.55; margin: 0;`
**`knowledge-feature-cta`** → `grid-column: 2; grid-row: 4; color: #1D4ED8; font-size: 16px; font-weight: 500; margin: 0;`
`@media (--mobile) { grid-column: 1; grid-row: auto; }` (for meta/title/excerpt/cta as well)

**`knowledge-archive-button`** → `background-color: #FFFFFF; color: #1D4ED8; border: 2px solid #1D4ED8;
border-radius: 9999px; padding: 12px 32px; font-size: 16px; font-weight: 600; line-height: 1.5;
&:hover { background-color: #1D4ED8; color: #FFFFFF; }`

### 7.4 Notes

- The grid places the badge **over** the image (grid items may overlap) — no extra container needed.
  On mobile the badge reflows under the image.
- **Prerequisite:** `/en/knowledge/insights/`, `/en/knowledge/about/`, `/en/knowledge/downloads/` and
  `/en/knowledge/tools/` must resolve. They are theme routes (`page-knowledge-*.php` templates),
  **not** WordPress pages — verify each returns 200 before publishing. The **About Us** and
  **Downloads** bodies must not be dropped: they are the content of those two sub-pages
  (`sections-map.md` §8.6).
- The tab icons (`book-open` 111, `users` 126, `download` 115) are **not** used: `e-button` cannot
  host an SVG and an icon+label pair would need a 4th level. Text-only pills, same as the hero chips.
  Logged as **D-03** (shared rule).
- The PHP's `role="tab"` / `aria-selected` attributes are stale (the tab JS is an empty IIFE). The
  pills are plain links — do **not** re-add tab ARIA.

---

## 8. §8 — Contact

**Source:** `template-parts/section-contact.php` · **Data:** `inc/contact.php`
**Form contract:** `docs/elementor-pro-contact-form.md` · `inc/atomic-form.php`
**Map:** `sections-map.md` §9

### 8.1 Tree

```
L1 ▸ contact-section            e-flexbox   column · full width · bg gradient · gap 64
  L2 ▸ contact-header           e-flexbox   column · align center · gap 24 · boxed 1280
    • contact-title             e-heading   h2
    • contact-subtitle          e-paragraph
  L2 ▸ contact-grid             e-grid      boxed 1280 · 2 col (1fr 1fr) · 4 rows · gap 24/48
    L3 ▸ contact-form-card      e-flexbox   column · gap 24 · card surface
      • contact-form-title      e-heading   h3
      • contact-form            e-form      form-name "Emifree Contact (EN)"
        • contact-label-name    e-form-label
        • contact-field-name    e-form-input
        • contact-label-email   e-form-label
        • contact-field-email   e-form-input
        • contact-label-company e-form-label
        • contact-field-company e-form-input
        • contact-label-message e-form-label
        • contact-field-message e-form-textarea
        • contact-submit        e-form-submit-button
        • contact-success       e-form-success-message → e-paragraph
        • contact-error         e-form-error-message   → e-paragraph
    L3 ▸ contact-info-title     e-heading   h3          (grid col 2 / row 1)
    L3 ▸ contact-info-email     e-grid      2 col × 3 rows (grid col 2 / row 2)
      • contact-email-icon      e-svg       id 119
      • contact-email-heading   e-heading   h4
      • contact-email-value     e-paragraph (mailto link)
      • contact-email-desc      e-paragraph
    L3 ▸ contact-info-phone     e-grid      (grid col 2 / row 3)
      • contact-phone-icon      e-svg       id 121
      • contact-phone-heading   e-heading   h4
      • contact-phone-value     e-paragraph (tel link)
      • contact-phone-desc      e-paragraph
    L3 ▸ contact-info-address   e-grid      (grid col 2 / row 4)
      • contact-address-icon    e-svg       id 120
      • contact-address-heading e-heading   h4
      • contact-address-value   e-paragraph (plain text)
      • contact-address-desc    e-paragraph
```

Depth: section (1) → grid (2) → card (3) → widgets ✔ **3 levels, no exception.**
The form's fields are **direct children of the `e-form`** — no label/input row containers.
The three contact-info cards are **grid items of `contact-grid`**, not children of a right-hand
column — that is what keeps them at level 3.

### 8.2 Widget map — form

| Element | Widget | Settings |
|---|---|---|
| `contact-form` | `e-form` | `form-name: "Emifree Contact (EN)"` · `actions-after-submit: ["email", "collect-submissions"]` · `submissions_metadata: ["remote_ip", "user_agent"]` |
| `contact-label-name` | `e-form-label` | `tag: "label"` · `text: "Name"` · `input-id: "name"` |
| `contact-field-name` | `e-form-input` | `type: "text"` · `placeholder: "Your Name"` · `required: true` · `autocomplete: true` · `_cssid: "name"` |
| `contact-label-email` | `e-form-label` | `text: "Email"` · `input-id: "email"` |
| `contact-field-email` | `e-form-input` | `type: "email"` · `placeholder: "Your Email"` · `required: true` · `autocomplete: true` · `_cssid: "email"` |
| `contact-label-company` | `e-form-label` | `text: "Company Name"` · `input-id: "company"` |
| `contact-field-company` | `e-form-input` | `type: "text"` · `placeholder: "Company Name"` · `required: true` · `autocomplete: true` · `_cssid: "company"` |
| `contact-label-message` | `e-form-label` | `text: "Message"` · `input-id: "message"` |
| `contact-field-message` | `e-form-textarea` | `placeholder: "Tell us about your project..."` · `rows: 5` · `required: true` · `resizable: true` · `_cssid: "message"` |
| `contact-submit` | `e-form-submit-button` | `text: "Send Message"` · `tag: "button"` |
| `contact-success` | `e-form-success-message` | child: `e-paragraph` — Thank you! We have received your message and will get back to you shortly. |
| `contact-error` | `e-form-error-message` | child: `e-paragraph` — Something went wrong. Please try again, or email us directly at info@emifree.com. |

**`contact-form` → `email` settings (do not change without reading the doc):**

| Setting | Value |
|---|---|
| `to` | `["contact.website@emifree.com"]` |
| `from` | `info@emifree.com` |
| `from-name` | `Emifree` |
| `reply-to` | `[email]` |
| `send-as` | `plain` |
| `subject` | `New contact form submission from Emifree` |
| `message` | `Name: [name]\nEmail: [email]\nCompany: [company]\n\nMessage:\n[message]` |

> **Why the form name matters.** `inc/atomic-form.php` only applies the site's antispam core
> (timestamp window + 3-per-hour IP limit) to a form whose `form-name` starts with
> **“Emifree Contact”**, and `assets/js/sections/atomic-form.js` only injects the `emifree_ts`
> field into a form whose rendered `data-form-name` starts with the same prefix. **Do not rename
> the form** — a rename silently disables the spam protection.
> The German document (post 135) uses `Emifree Contact (DE)`.

### 8.3 Widget map — info cards

| Card | Icon | Title (h4) | Value | Description |
|---|---|---|---|---|
| `contact-info-email` | `id 119` mail | **Email Us** | `info@emifree.com` → `link.destination: "mailto:info@emifree.com"` | Send us an email anytime |
| `contact-info-phone` | `id 121` phone | **Call Us** | `+49 307 628 3520` → `link.destination: "tel:+493076283520"` | Mon-Fri from 8am to 6pm |
| `contact-info-address` | `id 120` map-pin | **Direction** | Pestalozzistraße 13 (plain text, no link) | 12557 Berlin, Germany. |

`contact-title` — `Ready for cleaner air?` (one colour — the accent span is not expressible in V4, §1.5, D-11; the live post 72 heading already ships this way)
`contact-subtitle` — Plan your next filtration project with us and schedule a free consultation with our engineering team.
`contact-info-title` — **Get in touch**
`contact-form-title` — **Send us a message**

### 8.4 Style

**`contact-section`**
```
width: 100%; position: relative; box-sizing: border-box; padding-block: 96px; scroll-margin-top: 80px;
background-color: #F8FAFC;
display: flex; flex-direction: column; gap: 64px;
@media (--tablet) {
  background-image: linear-gradient(to bottom right, #F8FAFC 0%, #FFFFFF 50%, #EFF6FF 100%);
}
@media (--mobile) { padding-block: 48px; gap: 40px; background-image: none; }
```
`tag: "section"` · `_cssid: "contact"`.

**`contact-header`** → same box as `knowledge-masthead`.
**`contact-title`** → `color: #0F172A; font-size: 48px; font-weight: 700; line-height: 1.2; text-align: center;`
`@media (--mobile) { font-size: 36px; }` · one colour only (§1.5, D-11)
**`contact-subtitle`** → `color: #475569; font-size: 20px; line-height: 1.4; max-width: 768px; margin-inline: auto;`

**`contact-grid`**
```
max-width: 1280px; margin-inline: auto; padding-inline: 32px; width: 100%; box-sizing: border-box;
display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: auto auto auto auto;
column-gap: 48px; row-gap: 24px; align-items: start;
@media (--tablet) { grid-template-columns: 1fr; grid-template-rows: none; column-gap: 24px; }
@media (--mobile) { padding-inline: 16px; }
```

**`contact-form-card`**
```
grid-column: 1; grid-row: 1 / -1;
display: flex; flex-direction: column; gap: 24px; padding: 32px;
background-color: #FFFFFF; border-radius: 24px;
box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.10), 0 8px 10px -6px rgb(0 0 0 / 0.10);
@media (--tablet) { grid-column: 1; grid-row: auto; padding: 24px; }
```
**`contact-form-title`** → `color: #0F172A; font-size: 24px; font-weight: 700; line-height: 1.33; margin: 0;`

**`contact-form`** (the `e-form`) — the field rows must be a grid so that label→input and
field→field spacing can differ without row containers:
```
width: 100%; padding: 0; margin: 0;
display: grid; grid-template-columns: 1fr; row-gap: 6px;
```
> Fallback if `display: grid` does not stick on the form: `display: flex; flex-direction: column;
> gap: 6px;` plus `margin-block-end: 18px;` on each input/textarea.

**`contact-label-*`** → `font-weight: 600; font-size: 14px; color: #334155; margin: 0; display: block;`
**`contact-field-*`**
```
width: 100%; height: auto; font-size: 16px; color: #0F172A;
padding-block: 14px; padding-inline: 16px; margin: 0 0 18px 0;
border-radius: 12px; border-width: 2px; border-style: solid; border-color: #E2E8F0;
background-color: #FFFFFF;
&:focus { border-color: #1D4ED8; }
```
> **No `::placeholder` rule.** The atomic `e-form-input` / `e-form-textarea` have no
> placeholder-colour prop and the CSS engine rejects `&::placeholder` as an unsupported nested
> selector (§1.7). The placeholder therefore inherits the browser default (≈ `#757575` on white)
> against the field's `#0F172A` text colour. Acceptable and matches the live post 72 form.
> If a grey placeholder is mandatory, it has to come from **theme-side CSS**
> (`input::placeholder { … }` in `wp_enqueue_style`) — outside this blueprint. Logged as **D-12** (§9.1).
**`contact-field-message`** → same, plus `min-height: 128px; resize: vertical; margin-block-end: 24px;`

**`contact-submit`**
```
width: 100%; font-weight: 600; font-size: 18px; color: #FFFFFF; cursor: pointer;
padding-block: 16px; padding-inline: 40px; margin: 0;
border-radius: 12px; border-style: none;
background-image: linear-gradient(90deg, #1D4ED8 0%, #06B6D4 100%); background-color: #2563EB;
box-shadow: 0 10px 25px rgb(6 182 212 / 0.25);
&:hover { box-shadow: 0 14px 30px rgb(6 182 212 / 0.35); }
```
**`contact-success-text`** → `font-size: 14px; color: #166534; margin: 0;`
**`contact-error-text`** → `font-size: 14px; color: #991B1B; margin: 0;`

**`contact-info-title`** → `grid-column: 2; grid-row: 1; color: #0F172A; font-size: 24px; font-weight: 700; line-height: 1.33; margin: 0;`
`@media (--tablet) { grid-column: 1; grid-row: auto; }`

**`contact-info-*` (cards)** → `grid-column: 2;`
`display: grid; grid-template-columns: 48px 1fr; grid-template-rows: auto auto auto; column-gap: 16px;
row-gap: 4px; align-items: start;
padding: 24px; background-color: #FFFFFF; border-radius: 16px;
box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.10), 0 4px 6px -4px rgb(0 0 0 / 0.10);
transition: box-shadow 0.3s ease;
&:hover { box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.10), 0 8px 10px -6px rgb(0 0 0 / 0.10); }`
`@media (--tablet) { grid-column: 1; grid-row: auto; padding: 20px; }`

**`contact-*-icon`** → `grid-column: 1; grid-row: 1 / -1; width: 48px; height: 48px; padding: 12px;
box-sizing: border-box; border-radius: 12px; color: #FFFFFF;
background-image: linear-gradient(135deg, #2563EB 0%, #06B6D4 100%);
box-shadow: 0 8px 20px rgb(37 99 235 / 0.20);`
**`contact-*-heading`** → `grid-column: 2; grid-row: 1; color: #0F172A; font-size: 16px; font-weight: 600; line-height: 1.5; margin: 0;`
**`contact-*-value`** → `grid-column: 2; grid-row: 2; color: #334155; font-size: 16px; line-height: 1.5; margin: 0; text-decoration: none;`
`&:hover { color: #1D4ED8; }`
> The email and phone values are `e-paragraph`s with the **`link` prop**
> (`{destination: "mailto:info@emifree.com", tag: "a"}` and
> `{destination: "tel:+493076283520", tag: "a"}`). Elementor puts `all: unset` on the inner
> anchor, so it **inherits** the paragraph's colour and its `:hover` state — no `a { … }` rule is
> needed, and none is possible (§1.7).
**`contact-*-desc`** → `grid-column: 2; grid-row: 3; color: #64748B; font-size: 14px; line-height: 1.43; margin: 0;`

### 8.5 Notes

- The `Direction` card has **no link** (per the user's direction recorded in the template) — plain
  text, no `<a>`.
- The three info cards are grid items of `contact-grid`, not children of a right-hand column —
  that is the only way to keep the title + 3 cards at level 3.
- The `e-form-success-message` and `e-form-error-message` elements are **required direct children**
  of `e-form` (schema `required_direct_children`) and each holds one `e-paragraph`.

---

## 9. Deviations, confirmed decisions and open flags

### 9.1 Deviations register

Every deviation is a deliberate, documented departure from a source, a rule, or the live build.
None of them is a placeholder.

| # | Deviation | From | Why | How it is handled |
|---|---|---|---|---|
| **D-01** | **Hero has no subtitle paragraph.** | Rule 2 (Hero blueprint lists "Subtitle text") | The source has no subtitle — `section-hero.php` renders the H1, then the chip strip, then the CTAs. Inventing a sentence would be fabricated copy. | The `hero-subtitle` slot is left empty in §3.1. If the user wants one, it is a single `e-paragraph` between the H1 and the chip strip — 30 seconds of work. |
| **D-02** | **Applications is an Accordion, not the 3/2/1 Feature Grid.** | Rule 2 (Feature Grid blueprint) | `sections-map.md` §16.1 closes this: the accordion was a deliberate improvement over the PHP's `group-hover:max-h-96` body (a hover-only reveal is unreachable on touch) and the map says **keep it**. The accordion is also depth-exempt (§1.2). Rule 2's Feature Grid blueprint is applied where it matches exactly — Products (§4). | §5.1 is the accordion. **Variant B (§5.5)** holds the complete grid spec so the Builder can switch to it without re-architecting. The choice is one element swap. |
| **D-03** | **Inline icons dropped where a widget cannot host an SVG.** | Hero chips, Knowledge tab pills, "Featured Articles" heading | `e-button` and `e-heading` accept inline HTML from a fixed allowlist (`b, strong, sup, sub, i, u, a, del, span, br`) — **no `<svg>`**. An icon + label pair would need an L4 row container, which the rules forbid. | Chips and tab pills are text-only. Icons that *do* get a widget of their own (`e-svg`): application tiles (84–89), contact tiles (119–121), knowledge tab icons are dropped, hero client logos (65–70). |
| **D-04** | **The product-card "Learn more" line is always visible; the card image scales on image-hover only.** | PHP: `md:opacity-0` + `group-hover:opacity-100`; `group-hover:scale-105` on the image | Both effects need a *parent-selector* rule (`.card:hover .cta`, `.card:hover img`), which per-element atomic styles cannot express. A global class does not help either — `elementor-manage-classes` runs the **same** CSS parser, so a descendant rule inside a global class is dead CSS too (§1.7). The PHP itself shows the line on mobile (no hover), so "always visible" is the behaviour mobile users already have. | The gradient shift (`#2563EB→#1D4ED8` / `#1E40AF→#1E3A8A`) is the hover treatment, exactly as `sections-map.md` §5.2 concludes. The card lifts and deepens its shadow on hover (§4.3); the image scales when the pointer is over the image itself (`&:hover { transform: scale(1.05); }` on `card-*-image`). **A true card-wide hover reveal is not available in V4** — it would need theme-side CSS. |
| **D-05** | **Technology steps are an interactive `e-tabs` step switcher.** *(Decision reversed 2026-11-02 — see below.)* | Map §12 rows 9–10 (Tabs + auto-cycle) | The map's two objections are both void. **(1) Images:** all seven step images exist on disk in the theme (`assets/tech/`, dimensions in `inc/technology.php:44-54`) and `e-image` accepts a **URL** as well as a library id — so the build is **not blocked on a Media Library import**. **(2) Auto-cycle:** the V4 `e-tabs` widget exposes **only** `default-active-tab` — there is **no auto-advance prop at all**, so the PHP's 5-second rotate (map flag 8) does not carry over and there is nothing to pause. The PHP's own behaviour is a click-to-switch stepper, which Tabs reproduces exactly. | §6.4 is the full Tabs spec: per-step tabs, image + numbered heading + caption panels, `default-active-tab` reproducing each product's `initial_step` (**0-based — proven from the plugin source**). **§6.4.1 keeps the static `<ol>` list as the documented fallback** if the widget cannot be styled to the PHP's look in the first render. The two items that were open when this decision was first written are now **closed**: the index base (0-based, from `atomic-tabs.php` / `atomic-tab.php`) and the selected-state styling (Elementor's own `.e-tab-base.e--selected{border-color:#0C0D0E}` gives a 2px near-black border on the active tab; a true blue fill is only reachable through the editor's Advanced → States → Selected, not through the MCP — §6.6). |
| **D-06** | **Product-card arrow is the "→" glyph, not an SVG.** | PHP `section-products.php:84` arrow SVG | An SVG + label pair needs a row container (L4) inside the card. | The CTA paragraph reads `Learn more →`. |
| **D-07** | **Technology bullet check icons dropped.** | `inc/technology.php` check SVG per bullet | One check SVG per bullet means one widget per bullet plus a row container per bullet — three levels of nesting inside one `e-paragraph` that already carries the list. | `tech-*-bullets` is one `e-paragraph` with an inline `<ul><li>`; the list marker carries the meaning. |
| **D-08** | **"Get expert recommendation" scrolls to `#contact`.** | PHP `data-emifree-inquiry` → inquiry modal | `template-parts/inquiry-modal.php` **does not exist** (map flag 1). The PHP itself falls back to a smooth-scroll to `#contact`. | The CTA is a normal `e-button` with `link.destination: "#contact"`. Building a Popup is a separate decision for the user. |
| **D-09** | **The extra article row on the live page is dropped.** | Live page `knowledge-list-row` (`d03ad73`) | The PHP removed the 2-card blog grid in v1.6.10 — the HEPA card is the *only* featured entry, followed by the "View All Articles" button. The live row has no counterpart in the source. | §7.1 ends with the HEPA card + the archive button. |
| **D-10** | **One hero video, not the PHP's cross-fade pair.** | PHP `section-hero.php:77-96` | Elementor's Background Video takes a single source (map flag 7). | `hero-video` points at the **re-encoded** `Video Project hero.mp4` (239,930 B — 15× lighter than the 3.58 MB file the live page currently plays). See §9.4. |
| **D-11** | **The blue accent word inside a heading is dropped — every heading is one colour.** | Classic PHP: `<span class="text-blue-700">Filtration Technology</span>` (technology), "Knowledge" (knowledge), "cleaner air?" (contact) | Elementor **strips the attributes of nested inline elements**, so an inline `style` on the span is lost; and the CSS engine **rejects** a descendant rule (`span { color: … }`) as *"Unsupported nested selector"* — it is a hard build error, not a silent no-op (§1.7). There is no MCP route to a second colour inside one heading. | All headings ship in a single colour (`#0F172A` / `#FFFFFF`), which is exactly what the **live post 72** already renders (its headings have no span). If the accent is required on the production page, the only route is **theme-side CSS** in `wp_enqueue_style` targeting the section — outside this blueprint. See §9.3 flag 18. |
| **D-12** | **Form placeholder text keeps the browser's default colour.** | Design token `#94A3B8` for placeholder text | The atomic `e-form-input` / `e-form-textarea` have **no placeholder-colour prop**, and `&::placeholder` is not expressible (§1.7). The live page 72 form already ships with the browser default. | Nothing to do — the placeholder inherits the UA default (≈ `#757575`) on the white field, next to the `#0F172A` typed text. A grey placeholder would need theme-side CSS. |
| **D-13** | **Inline `<ul>` / `<ol>` / `<strong>` / `<a>` descendants keep the browser's typography.** | The design tokens for list indents, marker colour and the darker `<strong>` | Descendant rules are impossible in V4 (§1.7) — and a top-level descendant selector **fails the whole build**. The `e-paragraph` can only carry the *host* element's style. | The bullet list renders with the browser's default indent, spacing and marker; the caption's `<strong>` is bold but inherits the caption colour. The `tech-*-cta` and the contact email/phone values avoid the problem entirely by using the **`link` prop** (Elementor puts `all: unset` on the inner anchor, so it inherits the host's colour and `:hover`). §6.3, §6.6, §8.4. |

### 9.2 Confirmed decisions (already settled by the map — do not reopen)

| Decision | Detail |
|---|---|
| **Contact form = Elementor Pro atomic form** | `e-form` + `e-form-input` / `e-form-textarea` / `e-form-submit-button` / success + error. The classic PHP form keeps its honeypot and `?quote=` prefill for `/en/` and `/de/`. The Pro path is protected by the shared antispam core (`inc/atomic-form.php`). **The form name must start with “Emifree Contact”** or the protection is silently disabled (§8.2). |
| **Header and footer stay PHP** | They are theme chrome (`emifree-header`, language dropdown, mobile menu, Silktide cookie link). No Theme Builder templates. Rebuild the `<main>` body only. |
| **`emifree-elementor-bridge` shortcode is superseded** | The Pro atomic form replaced it. The plugin is harmless but not on the critical path. Its `?emifree_bridge_test=1` debug endpoint should be deleted before go-live (map §16.2 defect D). |
| **Applications = accordion** | See D-02. |
| **Section order** | Hero → Products → Applications → Technology → Knowledge → Contact. (The `front-page.php` docblock listing Applications before Products is stale.) |

### 9.3 Open flags carried over from `sections-map.md` §15

| # | Flag | Effect on this blueprint | Who resolves it |
|---|---|---|---|
| 1 | Inquiry modal never built | D-08 — the CTA scrolls to `#contact` | User: build a Pro Popup or keep the anchor |
| 8 | Tabs auto-cycle does not pause on hover | **Closed.** The V4 `e-tabs` widget has **no auto-advance prop** — only `default-active-tab` — so the PHP's auto-rotate does not carry over. Nothing to pause. D-05 now builds Tabs. | — |
| 10 | The German document (post 135) has only the contact section | This blueprint covers EN (post 72); the DE twin needs the same tree with German strings | Builder, after EN is signed off |
| 14 | Two catalogue PDFs do not exist on disk | The Downloads sub-page renders them as disabled "(coming soon)" cards — **do not invent URLs**. Not part of this page. | — |
| 16 | The Knowledge sub-pages are virtual rewrite routes, not WordPress pages | **Do not create Elementor documents at `/en/knowledge/…`** — a page row would be shadowed by the rewrite rule. The three tab pills link to the existing PHP routes (verified 200 on 2026-11-02). | — |
| **17 (new)** | **The theme never loads Inter or Roboto Mono.** No `@font-face`, no Google Fonts link anywhere in `emifree-landing`; `tailwind.config.js` only *names* Inter in `fontFamily.sans`. | The **classic** `/en/` and `/de/` pages render in **system-ui**, not Inter. The **Elementor** page is fine — the V4 font variables do trigger a Google Fonts enqueue (verified on the rendered post 72). | **User / theme dev** — add a `wp_enqueue_style` for Inter + Roboto Mono (or self-host the woff2) before cutover, otherwise the classic and Elementor pages will not match. Outside the Elementor blueprint's scope. |
| **18 (new)** | **Two visual details can only be delivered by theme-side CSS.** (a) the blue accent word inside a heading, (b) the grey form placeholder colour. | The Elementor MCP cannot express either: the inline `style` on a nested span is stripped by Elementor, and the CSS engine rejects every nested selector except `&:hover` / `&:focus` / `&:active` (§1.7). Global classes go through the **same** parser, so they cannot do it either. | D-11 (headings ship in one colour — the live post 72 already does this) and D-12 (placeholder keeps the UA default). Neither blocks the build. | **User / theme dev** — if the accent or the placeholder colour must match the classic pages pixel-for-pixel, add a small `wp_enqueue_style` block (e.g. `h2 .accent { color: #1D4ED8; }` / `input::placeholder { color: #94A3B8; }`). Outside the Elementor blueprint's scope. |
| **19 (new)** | **A verification probe is still sitting in the German draft (post 135).** | During blueprint verification, a 16-element probe tree (root element id **`7925553a`**, plus `a045710`, `59e19aa9`, `735e349a`, `6ab1ba35`, `35e615d3`, `2b9cebe3`, `249e0698`, `30891d28`, `50201c81`, `4b7a5cae`, `4e0e540d`, `3b6a0f4`, `7bca024f`, `501f2a88`, `2a3680b`) was written into post 135, and a global class **`emifree-probe-test`** was created on the kit. | Post 135 is a **draft** and the probe is invisible on the live site, but it must not survive into the German page. The removal was attempted three times and **the permission layer denied the delete each time** — it is not something the agent may do unilaterally. | **User** — delete the probe root `7925553a` in the Elementor editor (select it → delete; the 15 children go with it) and delete the global class `emifree-probe-test` in the kit. Or authorise the removal explicitly and it can be scripted. |
| **20 (new)** | **The step switcher's blue "selected" fill is an editor-only refinement.** | The MCP cannot write `&.e--selected` or `&[aria-selected="true"]` (§1.7), and Elementor's own base gives the active tab a **2px near-black border** instead. | Not a defect — the active step is already unambiguous from the near-black border, the numbered tab label and the numbered heading inside the open panel (§6.6). | **Optional, after the build** — in the Elementor editor: select each tab → **Advanced → States → Selected** → set the blue background. That path writes the `e--selected` state natively and is the only route to a true blue fill. |

### 9.4 Asset prerequisites

| Asset | State | Action |
|---|---|---|
| Hero video | The live page plays `uploads/2026/10/Video-Project-hero.mp4` = **3,580,094 B**. The theme's re-encode (2026-10-29) is **239,930 B**, same clip, byte-identical to the *pre*-compression original in git HEAD. | **Re-point `hero-video` (id `5b4bd92`) at the compressed file** and upload it to the Media Library (or reference the theme asset). The re-encodes are still uncommitted in git — commit them. |
| Second hero video (`Landing Video_2.1.mp4`, 1,014,415 B) | Not used | D-10 |
| Product photos | ids 78, 79, 80 ✔ | — |
| Technology diagrams | ids 98, 99 ✔ | — |
| ECO AIR / EARIA step images (7 files) | **On disk in the theme** at `assets/tech/` — `Step1.1_ECOAIR.jpg` (892×683), `Step2.1_ECOAIR.webp` (1360×752), `Step3_clean.webp` (1024×1024), `Step 1.webp` … `Step 4.webp` (1376×768 each). **Not in the Media Library**, but `e-image` takes a URL. | **None required for the build** — §6.4 references the theme URLs directly. Import the seven into the library later for editor convenience (the EARIA filenames contain a **space** → `Step%201.webp`). |
| Client logos | ids 65–70 ✔ | — |
| Application icons | ids 84–89 ✔ | — |
| Contact icons | ids 119, 120, 121 ✔ | — |
| Knowledge icons | ids 109–117 ✔ | — |
| HEPA article image | id 127 (`hepa-1.webp`, **1020×1360**) | The attachment alt is already **HEPA filter close-up** ✔. **No crop mismatch** — the theme copy at `assets/products/hepa/hepa-1.webp` is **byte-identical** to attachment 127 (MD5 `6c8de8d7bbafccb68dc10d7851af05d7`), both 1020×1360. An earlier note in this blueprint claiming a 1280×720 → 1020×1360 crop difference was wrong and is withdrawn. |
| Berlin badge | id 128 ✔ | About Us sub-page only |

---

## 10. Builder handoff

### 10.1 Build order

| Step | What | Why this order |
|---|---|---|
| **0** | ~~Create the §1.4 global variables on the kit + the kit's default styles (§10.2)~~ **✔ DONE 2026-11-02** | Every Style field in this blueprint references `var(--label)`. Tokens first, or every element needs a second pass. |
| **1** | Hero (`hero-root`, id `49847864`) | The LCP element. Everything else is below the fold. |
| **2** | Products (`2691800c`) | The Rule-2 Feature Grid — the reference implementation of the grammar. |
| **3** | Applications (`3416f16c`) | The accordion variant of the same grammar. |
| **4** | Technology (`1d342fa3`) | The densest section — 2 selector cards, 2 process panels, 1 CTA card. |
| **5** | Knowledge (`6fb3a25c`) | The only section with a grid-placement trick (the overlapping badge). |
| **6** | Contact (`765cb5f5`) | The only section with a live form — the riskiest; leave it last. |
| **7** | German twin (post 135) | Same tree, German strings, `Emifree Contact (DE)`. |

### 10.2 Kit setup — **already done (2026-11-02), step 0 is complete**

**Global variables — created ✔.** 26 colour tokens + 2 font families, exactly as §1.4:

```
elementor-manage-global-variable  →  28 creates, all ok
   26 × {action: "create", type: "global-color-variable", label: <§1.4 label>, value: <hex>}
   + {action: "create", type: "global-font-variable", label: "font-body", value: "Inter"}
   + {action: "create", type: "global-font-variable", label: "font-mono", value: "Roboto Mono"}
```

Verified by re-reading `elementor://global-variables` → 29 records (28 live + 1 soft-deleted
`color-heading`, the earlier duplicate of `text-heading`).

> The font variable value is the **plain family name** (verified: `{"type":"global-font-variable","value":"Inter"}`).
> Fonts are referenced in CSS as `font-family: var(--font-body);`.

**Kit default styles — set ✔.** The live page fetched **Roboto + Roboto Slab** (Elementor kit
defaults) while the theme intends **Inter + Roboto Mono** (map §16.2 defect C). The site-wide
defaults are now set so every element inherits the right stack instead of restyling each widget:

```
elementor-manage-default-styles  →  11 × {action: "update", tag: <tag>, mode: "replace"}
   h1: font-family: var(--font-body); font-size: 60px; font-weight: 700; line-height: 1.2; color: var(--text-heading); margin: 0;
   h2: 48px / 700 / 1.2 · h3: 24px / 700 / 1.33 · h4: 18px / 600 / 1.4 · h5: 16px / 600 / 1.5 · h6: 14px / 600 / 1.5
   p:  font-size: 16px; line-height: 1.6; color: var(--text-body-alt); margin: 0;
   a:  color: var(--accent-link); text-decoration: none; &:hover { color: var(--accent-link-hover); text-decoration: underline; }
   button: font-size: 16px; font-weight: 600; color: var(--text-on-dark); background-color: var(--primary-action);
           border-radius: 9999px; padding: 16px 32px; &:hover { background-color: var(--primary); }
   section, div: font-family: var(--font-body); box-sizing: border-box;
```

Widget inline styles still win over these defaults, so the per-element specs in §3–§8 are
authoritative.

**Kit typography — one manual step left (not reachable from the MCP).**

The kit's **classic** typography is still the Elementor starter-kit default and is what the
generated `post-51.css` emits:

```css
.elementor-kit-51{
  --e-global-typography-primary-font-family:"Roboto";
  --e-global-typography-secondary-font-family:"Roboto Slab";
  --e-global-typography-text-font-family:"Roboto";
  --e-global-typography-accent-font-family:"Roboto";
}
```

Consequence: the page currently fetches **four** Google families — **Inter**, **Roboto Mono**
(from the new V4 font variables) **plus Roboto and Roboto Slab** (from the classic typography).
Roboto Slab is a leftover of the Elementor starter kit; the theme never asked for it
(`tailwind.config.js` defines only `sans: Inter` and `mono: Roboto Mono`).

The V4 default styles above override the classic typography for every tag they cover, so this is a
**payload** problem, not a visual one — but it is worth closing.

**Manual step (admin UI, one minute):** *Elementor → Site Settings → Typography* → set
**Primary**, **Text** and **Accent** to **Inter**, **Secondary** to **Inter** (or leave it — it is
unused), **Mono** to **Roboto Mono** → save. Roboto and Roboto Slab then drop out of the fetch
list. *(The MCP exposes V4 global variables and V4 default styles, but not the kit's classic
typography settings, so this one cannot be done from here.)*

> **Font loading — verified on the rendered page (2026-11-02).** The V4 font variables *do* trigger
> a Google Fonts enqueue: post 72 now requests
> `fonts.googleapis.com/css?family=Inter…` and `…Roboto+Mono…`. **Inter really renders on the
> Elementor page.**
>
> ⚠️ **The classic PHP page is a different story.** The theme has **no `@font-face` and no Google
> Fonts link** — `tailwind.config.js` only *names* Inter in `fontFamily.sans`, it never loads it.
> So `/en/` and `/de/` still render in **system-ui**, and `assets/css/main.css` asks for
> `Inter, system-ui, sans-serif` and silently gets system-ui. This is theme-side work and is
> **outside this blueprint**; it must be fixed (a `wp_enqueue_style` for the two families, or
> self-hosted woff2) before cutover, or the classic and Elementor pages will look different.

**Global classes (optional)** — the blueprint's inline styles are authoritative. Four shared classes
remove the repetition if the Builder prefers them:

| Label | CSS | Use |
|---|---|---|
| `emifree-section-root` | the §1.8 L1 preset | every L1 |
| `emifree-card` | white surface, radius 16–24, shadow, hover lift | every L3 card |
| `emifree-icon-tile` | 48/64px gradient tile, radius, shadow | app + contact icons |
| `emifree-button-brand` | brand gradient, pill, shadow | primary CTAs |

> **One leftover class remains on the kit:** `emifree-probe-test` (id `g-40e7a21`) from an earlier
> probe. It carries no CSS and is attached to nothing, so it is inert — but it should still be
> deleted from the kit. The delete was **blocked by the permission classifier** (a kit-config change
> nobody named), so it needs a human to remove it in *Elementor → Site Settings → Custom CSS* or by
> approving the `elementor-manage-classes` delete. It does **not** affect the build.

### 10.3 Tool sequence per section

```
1. elementor-get-page-structure (post_id, include_content=false)   → confirm the current ids
2. elementor-build-composition (dry_run=true)                      → validate the XML + styles
3. elementor-build-composition (dry_run=false)                     → write
4. elementor-manage-elements (the ids from step 3's resolved_xml)  → per-element corrections only
```

**Non-negotiable rules for the tool calls:**

- **Emit atomic / V4 only** — `e-flexbox`, `e-grid`, `e-heading`, `e-paragraph`, `e-button`,
  `e-image`, `e-svg`, `e-tabs*`, `e-accordion*`, `e-form*`, `e-background-video*`. **No legacy V3**: no
  `elType: "container"` / `"section"` / `"column"`, no `isInner`, no `widgetType: heading |
  text-editor | button | image | icon-box`, no `"version": "0.4"` tree. The full rationale is §0.1(a).
- **`configuration-id` is unique per call** and is only an input label — it is not an element id.
- **Element ids in `manage-elements` must come from the `resolved_xml` of the most recent
  `build-composition` call.** Using ids from an earlier `get-page-structure` read silently restores
  the old tree and overwrites the build.
- **Never** put an element id, a class or an `id` attribute in `xml_structure` — `configuration-id`
  only.
- Every `@media` block uses `--tablet` / `--mobile`, never pixel queries.
- The `style` string is **raw CSS**; `element_config` carries **widget props only**.
- `e-grid` needs `grid-template-rows` to match the rows the children actually fill — an empty `fr`
  track renders as an empty band.
- Readable element names go in `editor_settings.title`; CSS hooks go in `_cssid` where §3–§8 ask
  for one.

### 10.4 Verification checklist

**Structure**
- [ ] No container is nested 4+ levels deep (§1.2). The only L4 containers are the three E1
      instances: `hero-badge`, `hero-cta`, `technology-cta-actions`.
- [ ] No `e-html` widget anywhere.
- [ ] No legacy Section/Column.
- [ ] **No `e-div-block` used as a layout wrapper** (§1.1) — it may only wrap a **single** child
      (a visual tile). Two or more children ⇒ it is a layout container in disguise: replace it with
      `e-flexbox` (`flex-direction: column` + `gap`) or `e-grid`.
- [ ] No Spacer widgets — all spacing comes from `gap` / `padding`.
- [ ] Every text, image, icon and button is a native widget and is click-editable on the canvas.

**Layout**
- [ ] Every L1: `padding-block: 96px` desktop / `48px` mobile, `scroll-margin-top: 80px`.
- [ ] Every L2 `boxed`: `max-width: 1280px; margin-inline: auto; padding-inline: 32px`.
- [ ] Products: 3 / 2 / 1 columns. Applications accordion: full width.
- [ ] Technology: 2 / 1 columns for the selector cards and the process panels.
- [ ] Knowledge feature: 2 columns desktop, 1 mobile, badge overlapping the image.
- [ ] Contact: 2 columns desktop, 1 mobile; the form card spans all rows in column 1.

**Technology step switcher** (the D-05 build — check on the **first** render, before the rest of §6)
- [ ] `e-tab` count == `e-tab-content` count in each widget (3/3 ECO AIR, 4/4 EARIA) and the
      orders match pairwise (schema requirement).
- [ ] **ECO AIR opens on "Self-Cleaning & Recycling"** (`default-active-tab: 2`) and EARIA opens on
      "Stainless steel pre-filter" (`default-active-tab: 0`). The prop is **0-based — proven from
      the plugin source**; ECO AIR opening on *Coalescence* means the value was mis-set, not that
      the index base is different.
      **Never use the 1-based reading (ECO AIR `3`, EARIA `1`)** — it would open ECO AIR on
      *Coalescence* and EARIA on *Ionization*. Proof: `atomic-tabs.php:201-212` (`->flip()->all()`,
      0-based keys), `:214-220` (`get_tab_index()`), `atomic-tab.php:178` + `:183`
      (`$default_active_tab === $index`), and the prop's own default `0` at
      `atomic-tabs.php:78-80`. Full citation table in §6.4.
- [ ] The **active** step is visibly distinct: a **2px near-black border** (Elementor's own
      `.e-tab-base.e--selected`) plus the numbered label and the numbered heading inside the open
      panel. A blue fill is **not** expected from the MCP (§9.3 flag 20).
- [ ] The tab **label follows the tab's hover / focus colour** — that only happens if the label is
      an `e-paragraph` with **`tag: "span"`** (a `p` label is pinned to the kit's `.e-default-p`
      colour and stays grey on the blue focus fill).
- [ ] The stepper is a **vertical list from 768px up** and a **horizontally scrolling row below
      768px** (the PHP's `md:` split → Elementor's `--mobile` boundary).
- [ ] All seven step images load (the four EARIA filenames contain a **space** → `Step%201.webp`).
- [ ] The `e-tab` base look is gone — no `160px`-wide boxes, no grey hover fill.
- [ ] If the widget cannot be brought to the PHP's look, fall back to §6.4.1 (static `<ol>`).

**CSS-engine sanity** (the failure mode that breaks the whole build — §1.7)
- [ ] No `style` string contains a **top-level** selector (`ul { … }`, `a { … }`,
      `strong { … }`, `li::marker { … }`) — that is a hard *"Unsupported nested selector"* error
      and fails the **entire** `build-composition` call.
- [ ] No `style` string contains `&` + anything other than `:hover` / `:focus` / `:active` — that
      is dead CSS (a literal `&` ends up inside the declaration block and the browser drops it).
- [ ] Every inline link uses the **`link` prop**, never an inline `<a href>` in the text string.
- [ ] Every heading is **one colour** — no accent span (D-11).

**Anchors** (`scroll-margin-top` is on every L1)
- [ ] `id="hero"`, `id="products"`, `id="applications"`, `id="technology"`,
      `id="technology-eco-air"`, `id="technology-earia"`, `id="knowledge"`, `id="contact"` all resolve.
- [ ] `hero-primary` → `#contact`; `applications-cta-button` → `#products`;
      `tech-eco-cta` → `#technology-eco-air`; `tech-earia-cta` → `#technology-earia`;
      `technology-cta-secondary` → `#knowledge`.

**Form** (the only interactive part — test it)
- [ ] `form-name` starts with **“Emifree Contact”**.
- [ ] Fields submit as `name`, `email`, `company`, `message` (`_cssid` set on each).
- [ ] `email.to` = `contact.website@emifree.com`, `from` = `info@emifree.com`,
      `from-name` = `Emifree`, `reply-to` = `[email]`, `send-as` = `plain`.
- [ ] Success and error message elements are present.
- [ ] A real browser submit lands in `wp_e_submissions` **and** delivers mail.
- [ ] A submit without `emifree_ts` is rejected (`ts_missing` in the error log) — the antispam core
      is actually wired.

**Content fidelity**
- [ ] Every string matches `sections-map.md` — no invented copy, no lorem ipsum.
- [ ] The two unavailable catalogue PDFs are **not** linked (they live on the Downloads sub-page).

**Performance**
- [ ] The hero video is the compressed encode (≈240 KB), not the 3.58 MB original.
- [ ] The hero H1 is the LCP element: no entrance animation that keeps its opacity below 0.001
      before the first paint.
- [ ] Fonts: Inter + Roboto Mono only — no Roboto / Roboto Slab left on the page.
      (Requires the manual kit-typography step in §10.2; Inter and Roboto Mono already load.)

**Cutover**
- [ ] A **cache exclusion for the landing page** is in place at deploy time — the form nonce is
      baked into the HTML and expires after 12–24 h (`docs/elementor-pro-contact-form.md` §5).
- [ ] The `?emifree_bridge_test=1` debug endpoint is deleted before go-live.

---

*End of blueprint. Implementation-ready: post 72 (EN) and post 135 (DE) can be built from this
document without further architecture decisions.*




