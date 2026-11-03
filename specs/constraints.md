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

Named instances in this build — **exactly three**:

| # | Instance | Where |
|---|---|---|
| E1-a | Hero value-chip strip (3 chips) | `hero-badge` |
| E1-b | Hero CTA button group (primary + secondary) | `hero-cta` |
| E1-c | Technology CTA card button group (2 buttons) | `technology-cta-actions` |

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
* **Forbidden** inside a style string: descendant selectors (`span { … }`), compound selectors
  (`&.is-active { … }`), pseudo-elements (`&::placeholder { … }`). These are a hard
  *"Unsupported nested selector"* error or silently dead CSS. Style the widget itself.
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
  in `element_config`) as the scope, e.g. `document.querySelectorAll('[data-cssid="hero"] …')` —
  the live page scopes by `_cssid` for exactly this reason.
* Theme JS that must keep working on an Elementor page must be **enqueued by the theme**, not
  inlined in the page. The product pages currently carry a large inline `<script type="module">`
  (gallery rotator, magnify, scroll-spy, back-to-top) that **cannot** survive the move as-is:
  hoist it into `assets/js/` and enqueue it.
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
| MCP server | `landing_wp_test-elementor` |
| Build tooling | `C:\Users\vpedr\Projects\emifree-elementor\` |
