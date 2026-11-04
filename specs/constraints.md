# Elementor Migration Constraints & Anti-Rationalization Rules

> **Format: Elementor 4.x ATOMIC (V4).** This file supersedes the classic/V3 wording that
> previously described `"elType": "container"`, `flex_direction_tablet`, `custom_css` with a
> `selector` block, and the widget names `heading` / `text-editor` / `button` / `image` /
> `icon-box`. **None of that is valid here.** The live documents are atomic and are produced
> through the MCP `build-composition` ability. Read this file before writing a single element.

**Audience:** the next agent building or editing an Elementor document in this project.
**Binding:** where this file and `elementor-blueprint.md` disagree, this file wins on format and
tooling; the blueprint wins on design (colors, spacing, copy, tree shape).

---

## 0. The one-paragraph version

Documents are **atomic (V4)**. You never hand-write `_elementor_data`; you send
`{xml_structure, element_config, style, classes}` to the MCP `build-composition` ability, then
**publish**, then **update-page-settings**. Every heading, paragraph, button, image and icon is a
**native atomic widget** (`e-heading`, `e-paragraph`, `e-button`, `e-image`, `e-svg`, `e-form`) —
never an HTML widget, never a spacer, never raw text sitting in a container. Containers nest
**≤3 levels** (plus three named L4 inline groups). Styling goes in the `style` string as plain CSS
with only `&:hover` / `&:focus` / `&:active` nesting and `@media(--mobile)` / `@media(--tablet)`
blocks — never a `<style>` tag, never a descendant selector. Build **one section per turn** and
verify before moving on.

---

## 1. Target format

### 1.1 What "atomic" means here

| Concept | Classic / V3 (WRONG for this project) | Atomic / V4 (CORRECT) |
|---|---|---|
| Containers | `"elType": "container"` | `elType: "e-flexbox"` / `"e-div-block"` / `"e-grid"` / `"e-tabs"` / `"e-tab"` / `"e-accordion"` |
| Widgets | `"widgetType": "heading"` | `elType: "widget"` + `"widgetType": "e-heading"` |
| Styling | `custom_css` with `selector { … }` | `styles` keyed by class id → `variants[]` → `props` (typed) |
| Breakpoints | `flex_direction_tablet` | `@media(--tablet)` / `@media(--mobile)` inside the style string |
| Import unit | `{version, type, content}` envelope | **MCP `build-composition` payload** |

### 1.2 The build path — this is the part agents get wrong

There is **no JSON import**. The document is assembled through the MCP server
`landing_wp_test-elementor`:

```jsonc
{
  "post_id": 72,
  "xml_structure": "<e-flexbox configuration-id=\"hero-root\">…</e-flexbox>",
  "element_config": { "hero-root": { "tag": "section", "_cssid": "hero" } },
  "style":          { "hero-root": "padding-top: 96px; &:hover { … }" },
  "classes":        { "hero-root": ["existing-global-class-label"] },
  "interactions":   { }
}
```

Rules for that payload:

* `xml_structure` is **tags only** — `<e-flexbox configuration-id="…">`, `<e-heading …>`. Every tag
  carries a **unique** `configuration-id`; no other attributes, no text nodes, no ids, no classes.
* `element_config` / `style` / `classes` keys are the `configuration-id` values **exactly**.
* `element_config` holds **plain values** (not the typed `$$type` envelopes) — the ability converts
  them. `title`, `paragraph`, `text` accept inline HTML.
* `style` is a **plain CSS string**, not JSON, not a typed prop map.
* `configuration-id` is per-request only. It is **not** a persisted element id.
* The ability returns the **server-assigned element ids** in `resolved_xml`. Use those (and only
  those) for any follow-up `manage-elements` call.
* `mode: "replace_children"` clears the target container's children first. `mode: "append"` (default)
  adds to them. **Duplicate sections are the classic failure here** — always use
  `replace_children` when re-building a section, and check `resolved_xml` for what already exists.

### 1.3 Allowed element types

| Purpose | Types |
|---|---|
| Layout containers | `e-flexbox`, `e-div-block`, `e-grid` |
| Composite widgets | `e-tabs` / `e-tab`, `e-accordion` / `e-accordion-item`, `e-background-video`, `e-form` |
| Content widgets | `e-heading`, `e-paragraph`, `e-button`, `e-image`, `e-svg` |

Prohibited: `html`, `spacer`, `e-divider` (use `border-top` on the container), legacy
section/column, `e-div-block` used as a *layout* wrapper (a plain block has no `gap` — use
`e-flexbox` for column layout, `e-div-block` survives only as a single-child visual wrapper).

---

## 2. Native widgets only — the core promise of this project

**The entire point of the migration is that a non-coder can click any text and edit it.** Every
piece of visible copy must therefore be a **dedicated widget** in its own slot.

* Every heading → `e-heading` (set `tag`: `h1`…`h4`).
* Every paragraph, list, lead paragraph, caption, label, helper text → `e-paragraph`.
* Every link/CTA → `e-button`.
* Every photo → `e-image`. Every icon → `e-svg`.
* Lists are `e-paragraph` whose value contains `<ul><li>…</li></ul>`. There is no list widget.
* **Never** `::before` / `::after` pseudo-content for a label. **Never** a `<style>` tag for text.
  **Never** text inside a container's own settings. Text lives in a widget, always.
* **Never** the `html` widget, **never** the `spacer` widget. Both are hard errors.

> *Why:* a `<style>` block and a pseudo-element are invisible to the Elementor editor. A
> non-coder cannot find, select, or translate them. The moment one appears, the page is no longer
> editable and the migration has failed — regardless of how it looks.

---

## 3. Container depth

### 3.1 The rule (binding)

```
L1  root container (one per section)
L2  inner row / grid
L3  card / column container  → contains widgets only
```

**Maximum container depth = 3.** An L3 card container contains **widgets only**; if a card needs an
inner split, express it with a widget (an `e-paragraph` holding a `<ul>`, an `e-svg`) or by making
the card itself `flex-direction: row`.

**Exception E1 — inline-group leaf (the only permitted L4 container).** When an L3 column needs
**2+ sibling widgets laid out inline** (a chip strip, a button pair), it needs a flex row to get a
real `gap`, and this Elementor install has **no Button Group / Icon List / Icon Box widget** to do
it as a single widget. Shape: one `e-flexbox`, `flex-direction: row`, `flex-wrap: wrap`,
`align-items: center`, `gap: 12–16px`, containing **widgets only**.

Named instances in this build — **exactly four**:

| # | Instance | Where |
|---|---|---|
| E1-a | Hero value-chip strip (3 chips) | `hero-badge` |
| E1-b | Hero CTA button group (primary + secondary) | `hero-cta` |
| E1-c | Technology CTA card button group (2 buttons) | `technology-cta-actions` |
| E1-d | Product gallery thumb strip (3 thumbnails) | `emifree-thumb-strip` |

E1-d lives on the product pages (posts 44–49). It is the same shape as
E1-a/E1-b: one `e-flexbox`, row, wrap, `align-items: center`, `gap: 8px`,
holding **widgets only** — the bare `<img>` thumbnails. The strip's
thumbs are **bare images, not links**: an atomic image with a link
renders the anchor *around* the image and the kit styles that wrapper
like a blue button (`e-default-button`), which the editor cannot
restyle. The button semantics are added at runtime by
`assets/js/sections/product-page.js` instead.

**Native widget internals are not editor containers and do not count toward the cap:**
`e-background-video` (+ content / controls), `e-tabs` (+ menu / tab / content-area / tab-content),
`e-accordion` (+ item / header / title / icon / content), `e-form` (+ messages), `e-collection-loop`.

### 3.2 Measured baseline of the live documents — READ THIS

The rule above is the **target**. The live documents are **not yet compliant**, and a previous
handover note claimed the depth check had been verified as passing. **It was not.** Measured on a
fresh `_elementor_data` dump of post 72 (2026-11-03, `backups/post-72-elementor-20261103-104522.json`):

| Section | Container depth | Status |
|---|---|---|
| `hero-root` | 3 | ✅ compliant |
| `products-section` | 6 | ❌ over by 3 |
| `applications-section` | 6 | ❌ over by 3 |
| `technology-section` | 7 | ❌ over by 4 |
| `knowledge-section` | 5 | ❌ over by 2 |
| `contact-section` | 5 | ❌ over by 2 |

**Max container depth in the live document = 7.** DOM depth is 8.

Every one of those violations is already on the remediation list in `elementor-blueprint.md` §4
(the "current element → problem → resolution" table: `card-mechanical-media` L5, `card-*-cta`
L4/L5, `technology-eco-head` L4, `technology-eco-step-N` L5, `knowledge-masthead-text` L4,
`contact-info-email` L5, `contact-row-name` L4, `hero-logos-row` L4). **The flattening pass was
never executed.** Two consequences:

1. When you rebuild a section, **flatten it to the L1/L2/L3 grammar while you are in there** —
   the violations are known and enumerated, not open questions.
2. Until a section is rebuilt, it stays over-depth. **Do not report the document as "passing
   VERIFY"** — report the measured number and the section.

**Never "fix" depth by deleting content.** The flattening moves a wrapper up one level or
replaces it with `e-flexbox`/`e-grid`; the widgets and their order stay.

---

## 4. Layout, spacing, responsive

* **Section rhythm.** Root containers: 96px top/bottom padding desktop (rule: 80–120px), 48px
  mobile (rule: 40–60px).
* **Component gaps.** 32px (rule: 20–32px). The 48–80px gap between major blocks inside a section
  is section rhythm, not component spacing.
* **Never size things "to be safe."** Containers size to their content. Only set a height on a
  root section that is meant to fill the viewport (`min-height`, never `100vh` on a nested
  container), a `max-width` on a boxed content area, or an aspect-ratio on a media box.
* **Every atomic container is 100% wide** (`.e-con { --width: 100% }`). Pills, badges and
  thumbnails therefore need `width: fit-content` (or a flex-basis) — `display: inline-flex` is
  blockified to `flex` on a flex item and will not shrink-wrap.
* **Breakpoint mapping** (Elementor bands are max-width; Tailwind bands are min-width):

  | Source (Tailwind) | Range | Elementor band | Applied as |
  |---|---|---|---|
  | base (`<640`) | — | Mobile | mobile override |
  | `sm` (≥640) | 640–767 | Mobile | mobile override (fires ~640px early — flagged deviation) |
  | `md` (≥768) | 768–1024 | Tablet | tablet override |
  | `lg` (≥1024) | ≥1025 | Desktop | desktop **base** value |

  **Working rule:** write the **desktop (base) value with the largest number**, then override at
  `--tablet`, then at `--mobile`. A Tailwind `sm:` value has no exact equivalent and is folded
  into Mobile.
* **Two-state exception:** when the source has only two states (e.g. "≥768px" vs "below 768px")
  there is no separate tablet value — the tablet band and the desktop band carry the **same**
  value. Put it in the **base** and override only at `--mobile`.
* **Multi-column rows stack on mobile.** Set the column direction at `--mobile` explicitly rather
  than relying on `flex-wrap` alone.
* **Anchor targets** (`#technology`, `#contact`, `#hero`) need `scroll-margin-top: 80px`.

---

## 5. Styling

### 5.1 Where CSS lives

* All custom styling goes in the **`style` string** of the `build-composition` payload, or in
  `manage-elements` → `update` → `style`.
* **Never** a `<style>` tag, **never** an HTML widget, **never** an inline `style` attribute on an
  element. (An inline `style` inside a `title`/`paragraph` HTML string is additionally stripped by
  Elementor — the style is silently lost.)
* Prefer the theme's **global classes** and **global variables** over per-element CSS. Attach a
  global class by its **label** (not its internal id) via the `classes` map. Reference a global
  variable by its **label** in `var(--label, fallback)` form.

### 5.2 What the CSS engine accepts

* Plain CSS declarations, one per line.
* Nested blocks are limited to **`&:hover`**, **`&:focus`**, **`&:active`**.
* Media blocks: **`@media(--mobile)`** and **`@media(--tablet)`** — *not* `@media (max-width: 768px)`.
* **Forbidden** inside a style string: descendant selectors (`span { … }`, `& a { … }`), compound
  selectors (`&.is-active { … }`), attribute selectors (`&[aria-current="true"] { … }`),
  pseudo-elements (`&::placeholder { … }`). These are a hard *"Unsupported nested selector"*
  error or silently dead CSS. Style the widget itself.
* **Measured (product page, 2026-11-04):** an unsupported selector is not rejected — it is written
  **verbatim into the rule body** and the browser discards it. `& a { color: inherit; }` produced

  ```css
  .elementor .e-b8940fe-211a{…;white-space: nowrap; & a { color: inherit; } }
  ```

  and `&[aria-current="true"] { … }` produced **no rule at all** (a grep for `aria-current` in
  `local-44-frontend-desktop.css` returned nothing). `&:hover` **is** supported and is emitted as a
  separate pseudo-state variant (`.elementor .e-<hash>:hover,.elementor .e-<hash>:focus-visible{…}`).
* **Where a state that cannot be expressed here goes:** the theme. A state driven by an
  attribute the runtime writes (`aria-current`, `.is-active`, `.is-visible`) belongs in
  `assets/css/product-elementor.css`, scoped to `.emifree-product-doc` — the wrapper
  `emifree_render_product_body()` prints around the product documents. An id or id+attribute
  selector there outranks Elementor's `.elementor .e-<hash>` rules (0,2,0) whatever the
  stylesheet order is. **Do not** work around it with a global `.e-paragraph-base a { … }` rule:
  the landing page shares that class.
* Shorthand `padding` / `margin` / `border` is supported — use it, do not split into longhand.
* `var(--token)` inside `box-shadow` falls back to custom CSS — keep shadows literal.
* A literal `font-family` value must be **one Google Font family name** (`Inter`), never a stack
  (`Inter, sans-serif`) and never a generic family.
* **Raw Tailwind class names are prohibited** — use resolved values from `design-tokens.md`.

### 5.3 The `<style>`-tag trap

A class on an inline `<style>` tag is a **sibling** of the rendered nodes, not an ancestor. A
descendant selector anchored on it matches nothing. If you need a style block at all (you should
not), the class must be on a real rendered ancestor.

### 5.4 Known atomic quirks

* **Atomic editor drops `data-*` attributes.** See §7.
* `e-svg` forces `fill="currentColor"` on the root SVG. A **stroked** icon needs `fill="none"` on
  each `<path>`, otherwise a near-closed circle path fills into a solid disc.
* `e-image` has **no `loading` prop** (core's `the_content` filter adds `loading="lazy"` on the
  front end; only the first three content images stay eager). `size` is **required**. Alt text
  comes from the attachment's Media Library metadata — ask the user to set it there.
* Elementor 4.3.5 caches the post tree in JS memory. After any **surgical `_elementor_data`
  mutation** (not a normal save) the editor needs a **Refresh** (circular arrow, bottom toolbar)
  before the new widget is selectable. JSON validity ≠ editor-visible.

---

## 6. Media

* **Images** come from the Media Library. `elementor/list-assets` gives the real ids, dimensions
  and `srcset` — call it before placing an `e-image`.
* `{"src": {"id": 123}, "size": "full"}` — library asset. `{"src": {"url": "https://…"}}` —
  external URL. The two are **mutually exclusive**. Never send `alt` with `id`.
* **SVG** must be an uploaded Media Library asset (`{"id": N}`). An external URL on `e-svg` renders
  an empty div. **Never fabricate an id.**
* **Video** goes in the `source` prop of a video widget — never in a `text`, `link` or `href` prop.
* `e-background-video` has **no intrinsic height** (`position: relative; overflow: hidden`). To
  make it fill a hero, give it `position: absolute; inset: 0; height: 100dvh` at a specificity that
  beats the widget base — the live page does this via
  `.elementor-page .e-background-video { … }`.

---

## 7. JavaScript and interactivity

* **The atomic editor drops `data-*` attributes.** Any JS in this project that used
  `data-emifree-*` hooks must be re-scoped. Use the element's **`_cssid`** (a stable slug you set
  in `element_config`) as the scope — **`_cssid` renders as the DOM `id`**, so the hook is
  `document.querySelectorAll('#emifree-thumb-1')`, *not* `[data-cssid="…"]`. It is the only
  reliable hook the atomic editor leaves.
* **`e-image` emits a second `id` attribute** — the attachment id — after the `_cssid` id
  (`<img id="emifree-thumb-1" … id="189">`). The browser keeps the **first**, so
  `getElementById` and `querySelector('#emifree-thumb-1')` both resolve to the `_cssid` ✓.
* **The product pages' JS contract** lives in `assets/js/sections/product-page.js` and is keyed on
  fixed ids that are the same on all six product documents (each page is a separate document, so
  they never collide):

  | Hook | Element |
  |---|---|
  | `.emifree-product-doc` | the wrapper the theme prints around the document |
  | `#emifree-gallery-main` | the large gallery image |
  | `img[id^="emifree-thumb-"]` | the thumbnails |
  | `.elementor-element[id^="emifree-nav-"]` | the section-navigator items (containers only — the label and icon are widgets and carry no `elementor-element` class) |
  | `#emifree-back-to-top` | the mobile back-to-top button |
  | `#emifree-hero`, `#emifree-dimensions`, `#emifree-performance`, `#emifree-specs`, `#emifree-brochure` | the sections the navigator targets |
* Theme JS that must keep working on an Elementor page must be **enqueued by the theme**, not
  inlined in the page. The product pages used to carry a large inline `<script type="module">`
  (gallery rotator, magnify, scroll-spy, back-to-top) that could not survive the move as-is.
  **Done:** it is now `assets/js/sections/product-page.js`, enqueued by
  `emifree_enqueue_product_page_assets()` in `inc/elementor-product-docs.php` at
  `wp_enqueue_scripts` priority **20** — after Elementor registers its own stylesheets (priority
  5) and after the theme's own enqueue, so it wins the cascade. The magnify panel did not survive
  the move at all (deviation D1).
* **`<table>` markup cannot be reproduced natively** — Elementor has no table widget. The product
  specs tables must become either a grid of widgets (label/value pairs) or a shortcode. This is a
  logged, deliberate substitution, not an accident.
* Elementor **interactions** are the native alternative to JS for hover/focus effects; read
  `elementor://interactions/schema` before using them.

---

## 8. Write protocol — do not skip a step

Every write to a live document follows this sequence. **All three steps are required.**

```
1. build-composition   (or manage-elements)   → writes to the AUTOSAVE
2. elementor-publish-document                → promotes the autosave to the live document
3. elementor-update-page-settings (settings: {})  → invalidates Elementor's element cache
```

**Step 3 is not optional.** `restore_revision()` copies the autosave's `_elementor*` meta onto the
post, including the stale `_elementor_element_cache` row (24 h TTL). While that row is valid,
`Document::print_elements()` echoes the **previous** render verbatim. Without step 3 the front
end keeps serving the old document for up to 24 hours, and you will conclude — wrongly — that
your write failed.

> Do **not** try to fix this by deleting `_elementor_element_cache` / `_elementor_css` from PHP or
> calling `wp_cache_flush()`. Both are **denied by the permission classifier** ("Logging/Audit
> Tampering"). `update-page-settings` invalidates the same cache through Elementor's own code
> path and is allowed.

Also: `manage-elements` is a **read → modify → write** on the current document. If you call it
after a `build-composition`, using ids from an **earlier** `get-page-structure` read, it will
restore the old tree and **silently overwrite** what you just built. Only ever use ids from the
`resolved_xml` of the most recent build.

---

## 9. Verification protocol

**Do not fetch the live preview over HTTP.** The preview URL requires an editor login and the
rendered HTML is cached. Verify by reading the tree and rendering a PHP probe instead.

### 9.1 Tree verification

```bash
node tools/verify-doc.mjs <backup.json> [--max-depth 3]
```

`tools/verify-doc.mjs` reports: top-level element count, **container** depth (root = 1; widgets
are leaves and never add a level), widget inventory (flagging `html` / `spacer`), text sitting
outside a widget, elements with no editor title, and **duplicate element titles** — the exact
signature of the duplicated-section bug.

```bash
node tools/inspect-atomic.mjs <backup.json> [elType]   # print representative atomic nodes
```

### 9.2 Live-tree read (PHP CLI)

```
"<php.exe>" -c "<php-guard.ini>" probe.php
```

Read `_elementor_data` for the post and assert on it. This is a **read**; it does not touch the
cache.

### 9.3 What a section is "done" when

* 0 `html` widgets, 0 `spacer` widgets.
* 0 text nodes outside widgets.
* 0 duplicate element titles.
* Container depth ≤ 3 (or ≤ 4 for one of the three named E1 instances).
* Every image resolves to a Media Library id; every SVG is an uploaded asset; every icon has
  `fill="none"` on stroked paths.
* Every link points at a live URL.
* The editor can select and edit every piece of copy.

---

## 10. Build discipline

* **One section per turn.** Build → verify → hand off. Never generate the whole document in one
  pass; that is how five contact sections happened.
* `mode: "replace_children"` when re-building a section that already exists.
* **Never invent copy.** Every string comes from `sections-map.md` or the PHP. A gap is a logged
  deviation, never placeholder text.
* **Never change the section order:** Hero → Products → Applications → Technology → Knowledge →
  Contact.
* **Never touch the PHP source of truth** to make an Elementor page match. The PHP is the reference;
  the Elementor document is the deliverable. (Note: the docblock at the top of `front-page.php`
  lists Applications before Products — the docblock is stale, the code puts Products first. Trust
  the code.)

### Anti-rationalization table

| If you are tempted to think… | Do this instead |
|---|---|
| "This block is too intricate for native widgets; I'll use an `html` widget." | Reject. Break it into an L1/L2/L3 flex or grid with native `e-heading`, `e-paragraph`, `e-button`, `e-image`, `e-svg`. |
| "The label would be easier as `::before` content." | Reject. Make it its own `e-paragraph` widget. A non-coder must be able to click it. |
| "This section is over-depth but the page looks fine." | Over-depth is a real defect. Flatten it (blueprint §4 lists every offender). |
| "I'll generate the whole document at once to save time." | Stop. One section per turn, verified. |
| "The JSON looks valid, no need to test in WordPress." | Untested is broken. Verify with `verify-doc.mjs` + a PHP probe on the live tree. |
| "I published it, the page hasn't changed." | You skipped `update-page-settings` (settings `{}`). The element cache is still serving the old render. |
| "The style didn't apply." | Check the selector: only `&:hover` / `&:focus` / `&:active` nest. A descendant selector is dead CSS. |
| "The SVG shows as a black blob." | `e-svg` forces `fill="currentColor"`; stroked paths need `fill="none"`. |
| "The icon is on its own line / stretched." | Atomic containers are 100% wide. Add `width: fit-content`. |
| "The dropdown works in the editor but the front end shows the old text." | The element cache. Run `update-page-settings` (settings `{}`). |
| "I'll install Polylang/WPML so the German page can be edited separately." | Reject. §12 — one page per language is already implemented in the theme, and a plugin would double the hreflang output. |
| "I'll make the German document a copy of the English one so they stay in sync." | Reject. §12.3 — the twin link is metadata, not a shared template. The documents are independent. |

---

## 11. Where things live

| What | Path |
|---|---|
| Theme | `wp-content/themes/emifree-landing/` |
| This file | `wp-content/themes/emifree-landing/specs/constraints.md` |
| Blueprint (design + tree) | `specs/elementor-blueprint.md` |
| Section map (copy + assets) | `specs/sections-map.md` |
| Design tokens | `specs/design-tokens.md` |
| Live documents | post **72** = EN landing (`/en/`); post **135** = DE |
| Product documents | posts **44–49** (EN 44/46/48, DE 45/47/49) |
| Product behaviour (JS) | theme: `assets/js/sections/product-page.js` |
| Product states (CSS) | theme: `assets/css/product-elementor.css` |
| Product document glue | theme: `inc/elementor-product-docs.php` |
| Product document builder | `pipeline/src/product-sections.mjs` |
| MCP server | `landing_wp_test-elementor` |
| Build tooling | `C:\Users\vpedr\Projects\emifree-elementor\` |

---

## 12. Languages — the decision, and what it means for the build

**Binding. Do not install, recommend or design around WPML, Polylang, TranslatePress or Weglot.**
The site runs EN + DE with **one WordPress page per language**, and it does that with the theme's
own code. This was a deliberate call (the site's owner ruled out paid plugins), not an oversight.

### 12.1 Why no plugin

| Plugin option | Why it loses |
|---|---|
| **WPML** | "A separate post per language" is a paid tier. The free tier translates interface strings only — which this theme does not need, because it hard-codes EN/DE copy rather than using gettext. |
| **Polylang** | Same wall: Polylang Pro is what carries native cross-language content duplication; the free tier has no content model to duplicate. A free "Duplicate Content Addon" exists, but it re-implements what the theme is about to do anyway. |
| **Either of them** | The theme **already emits its own hreflang**: `emifree_seo_page()` in `inc/seo.php` writes one `<link rel="alternate" hreflang="…">` per language plus an automatic `x-default`. A multilingual plugin emits a **second, competing** set. Two hreflang sets on one URL is a conflict search engines resolve by ignoring both. |
| **Either of them** | The theme **already owns the routing**: `/en/…` and `/de/…` are rewrite rules the theme registers itself (`inc/products-page-routes.php`, `inc/knowledge.php`, `inc/nav.php`). A plugin's URL handling fights those rules. |
| **Either of them** | The theme **already has the language plumbing**: `emifree_language` and `emifree_translation_of` post meta, an admin metabox and slug mirroring for the `blog_post` CPT (`inc/cpt-blog.php`). The plugin's headline feature is already ~80 % built in-house. |

### 12.2 What the theme implements instead

`inc/translations.php` (new) completes the layer:

* `emifree_language` and `emifree_translation_of` are registered for the `page` post type, with the
  same sanitisation the blog CPT uses.
* Every page's edit screen carries a **Translations** box: the language, the twin, links to the
  twin (edit / view), and a button that copies the twin's Elementor layout into this page.
* `emifree_copy_elementor_document( $from_id, $to_id )` copies `_elementor_data`,
  `_elementor_edit_mode`, `_elementor_template_type` and `_elementor_page_settings`, then
  invalidates the target's cached render through Elementor's own public API
  (`Document::save()`), which clears the generated CSS and the 24-hour `_elementor_element_cache`
  row. Nothing deletes cache meta directly.
* `inc/page-seed.php` links the seeded EN/DE pairs symmetrically:
  `products ↔ produkte` (42 ↔ 43), `mechanical ↔ mechanische-filtration` (44 ↔ 45),
  `electrostatic ↔ elektrostatische-filtration` (46 ↔ 47), `dust ↔ entstaubung` (48 ↔ 49).

### 12.3 What this means when you build

* **One Elementor document per language.** The EN and DE product pages are separate posts (44/46/48
  and 45/47/49) with separate `_elementor_data`. A document is never shared between languages.
* **Editing the German page must never touch the English one.** They are separate documents; the
  twin link is metadata, not a shared template. The Translations box's "copy the sibling's layout"
  button is the only way content crosses between them, and it is a deliberate, confirmed action.
* **The hreflang map comes from the twin.** `emifree_seo_page()` keeps receiving its `hreflang`
  array explicitly from the page template; do not add a second hreflang source in the document
  itself (an Elementor page has no hreflang widget, and injecting one through a `html` widget is
  forbidden by §2).
* **Do not add a language switcher that is not there today.** The product pages get their
  language links from the theme's own header/footer, not from the Elementor document.
* **A future third language** is one more column in `emifree_get_seed_pages()` plus one more
  Elementor document per page — not a plugin install.

---

## 13. Deviations log — where the atomic build differs from the PHP

Every entry below is **deliberate** and was measured on the live pages (posts 44–49) on
2026-11-04. Do not "fix" one of these by editing the document — they are the cost of the
atomic format, and each has a documented reason.

| # | Deviation | Why | Where the replacement lives |
|---|---|---|---|
| D1 | **Magnify / zoom panel dropped.** The PHP gallery opened a lightbox with a zoomed view. | The atomic editor has no modal/lightbox widget, and §2 forbids an `html` widget. Building a zoom from an `e-image` plus theme JS would need a fullscreen container that the atomic editor cannot express. | The gallery still swaps the main image (`#emifree-gallery-main`) and auto-advances. A lightbox, if it is wanted, is a theme-level feature, not a document-level one. |
| D2 | **Hero CTA icon dropped.** The PHP drew a small arrow next to the hero buttons. | `e-paragraph`'s allowed HTML is `b, strong, sup, sub, s, em, u, ul, ol, li, blockquote, a, del, span, br` — **no SVG**. An icon therefore cannot live inside a button's label. The alternative (the icon as a sibling inside the button container) makes the whole pill clickable only if the anchor wraps both, which no atomic link widget does. | The button is a plain `e-button` with its text. If the icon comes back it must be an `e-svg` sibling *outside* the button, or the button must become a link-wrapped container. |
| D3 | **Section-navigator icon sits beside the anchor, not inside it.** The PHP had `<a><svg/>Label</a>`. | No atomic link widget wraps sibling widgets, and an SVG cannot be in a paragraph. The `e-svg` is a sibling of the label inside the pill container; the label's `<a>` is the click target. | `pipeline/src/product-sections.mjs` → `buildSubmenu()`. The pill still reads as one unit (the icon is inside the pill's rounded background). |
| D4 | **Thumbnails load the full-size file** (~47–60 KB each) instead of a downscaled candidate. | The atomic `e-image` emits **no `sizes` attribute**, so the browser cannot pick a smaller srcset candidate and takes the largest. `size: "full"` was kept on purpose — it is what guarantees the full URL is in the `srcset` the runtime reads to swap the main image. | `assets/js/sections/product-page.js` → `emifreeFullUrl()` reads the **largest `w` candidate** from the `srcset` (WordPress writes the candidates unordered, so position is not a signal). Accepting the bandwidth cost, or dropping the swap, is a product decision. |
| D5 | **The back-to-top button's hidden state is theme-owned.** The document does not set `opacity: 0`. | The atomic converter rewrites `opacity: 0` into `opacity: 0%`, which is invalid and silently dropped. | `assets/css/product-elementor.css` — `#emifree-back-to-top { opacity: 0; pointer-events: none; }` and `.is-visible { opacity: 1; pointer-events: auto; }`. |
| D6 | **The specs table became a grid of widgets**, not a `<table>`. | Elementor has no table widget; §2 forbids raw HTML. | The product documents, section "Specifications". |
| D7 | **The link colour is theme-owned, not document-owned.** | `e-default-a` (kit default) makes every anchor the accent blue, which made the white "Up" label on the blue back-to-top pill invisible. | `assets/css/product-elementor.css` — `.emifree-product-doc .elementor .e-paragraph-base a { color: inherit; }` (0,3,1) beats `.elementor .e-default-a` (0,2,0). **Never** make this a global `.e-paragraph-base a` rule: the landing page shares that class. |


