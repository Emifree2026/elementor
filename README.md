# Emifree — Elementor Landing Page

Build pipeline, specifications and tooling for the Emifree landing pages, which are being migrated
from hand-written PHP templates to **Elementor** documents that a non-developer can edit.

The goal is not "the same pixels". The goal is that **every heading, paragraph, button, image and
icon on the page is a native Elementor widget**, so the marketing team can change copy and swap
photos without touching code.

---

## Two repositories, two jobs

| Repo | Contains | Deploys to production? |
|---|---|---|
| **`Emifree2026/elementor`** (this repo) | Specs, build pipeline, tooling, page snapshots, backups | **No** — dev-only |
| `Emifree2026/themeWP_SEP_26` | The WordPress theme (PHP, CSS, assets) | Yes — via the theme ZIP |

The theme keeps the running site. This repo keeps everything needed to *build* the Elementor
documents. They are deliberately separate so the deploy artifact stays lean: the specs and the
pipeline are ~250 KB of development material that has no business in production.

> This repo is currently **public**. The deploy key gives read access, so nothing breaks — switch
> it to private if the site copy in `specs/snapshots/` should not be world-readable.


---

## Layout

```
specs/      the binding documents — READ specs/constraints.md FIRST
  constraints.md        binding rules: format, widgets, depth, styling, write protocol
  elementor-blueprint.md  per-section trees, design, deviations (§4 = remediation backlog)
  sections-map.md      copy and assets per section, traced to the PHP source
  design-tokens.md     colors, fonts, spacing — resolved values, not Tailwind classes
  snapshots/           archived document trees (raw _elementor_data — a full restore point)

pipeline/   the build pipeline (emits MCP build-composition payloads)
  src/atomic.mjs       the atomic authoring DSL — el/flex/grid/heading/para/button/image
  src/product-content*.mjs  product-page copy (EN + DE), transcribed verbatim from the PHP
  src/content.mjs      landing-page copy + structured data
  src/css.mjs          CSS → atomic style props (styles / variants / custom_css)
  src/tokens.mjs       design tokens
  src/assets.mjs       media manifest — attachment ids
  src/media-manifest.json  product images after the Media Library sideload (ids 164–184)
  assets/              source SVGs

tools/      verification, inspection and the MCP client
  verify-doc.mjs       check a document dump against the constraints
  inspect-atomic.mjs   print representative atomic nodes from a dump
  css-of.js            print the generated atomic CSS rules for chosen elements
  fix-svg-fill.js      add fill="none" to the children of an Elementor-hosted SVG
  mcpcall.js           MCP-over-HTTP JSON-RPC client
  mcprun.js            run one MCP tool from a JSON args file
  make-contact-composition.js   reference atomic authoring pattern (the Elementor Pro form)
  shot.js / cdp.js / probe.js    headless-Chrome screenshot + DOM probe helpers
  schemas/             cached Elementor widget schemas
  php-guard.ini        PHP CLI config for the local site

scripts/    PHP probes and helpers that read the live site
  backup-post.php              dump _elementor_data + generated CSS for a post
  sideload-product-media.php   push the product images into the Media Library
  probe-*.php                  read-only probes: pages, media, kit, post meta

backups/    dated backups, taken before every write
```

### What is not here

* **No classic (V3) pipeline.** The emitter that produced `"elType": "container"` + `custom_css`
  selector blocks is deleted — the atomic editor cannot consume that format, and the two are
  mutually exclusive. See `pipeline/README.md` for the file-by-file list and the reasoning.
* **No build artifacts.** There is no `out/` directory: the classic JSON outputs were never
  deployable and were only ever a trap for the next agent.
* **No duplicate page exports.** `specs/snapshots/` holds the canonical raw `_elementor_data` for
  each document — the atomic styles travel *inside* it (per-element `styles` → `variants` →
  `props` + `custom_css`), so a snapshot is a complete restore point. The generated
  `local-<id>-frontend-*.css` files are regenerated from the document and are not committed.


---

## The build loop

Documents are **Elementor 4.x atomic (V4)** and are written through the MCP server
`landing_wp_test-elementor`. There is no JSON import.

```
1. build-composition   →  writes to the document's AUTOSAVE
2. publish-document    →  promotes the autosave to the live document
3. update-page-settings (settings: {})  →  invalidates Elementor's element cache
```

**Step 3 is mandatory.** `restore_revision()` copies the autosave's `_elementor*` meta onto the
post, including a stale `_elementor_element_cache` row with a 24-hour TTL. While that row is
valid, the front end serves the **previous** render verbatim and your write looks like it failed.

Do not try to fix this by deleting `_elementor_element_cache` / `_elementor_css` from PHP or by
calling `wp_cache_flush()` — the permission classifier denies both ("Logging/Audit Tampering").
`update-page-settings` clears the same cache through Elementor's own code path.

**One section per turn.** Build → verify → next. Building the whole document in one pass is how
five duplicate contact sections happened once.

---

## Verification

The live preview is not fetched over HTTP — the preview URL requires an editor login and the
rendered HTML is cached. Verify against the tree instead.

```bash
# structural check against the constraints
node tools/verify-doc.mjs backups/post-72-elementor-*.json --max-depth 3

# see the real atomic shape of a node type
node tools/inspect-atomic.mjs backups/post-72-elementor-*.json e-heading

# back up a live document (tree + generated CSS)
php scripts/backup-post.php 72 backups
```

`verify-doc.mjs` reports container depth, the widget inventory (flagging `html` and `spacer`),
text sitting outside a widget, elements with no editor title, and duplicate element titles.

### PHP CLI probes

`php` is not on the Windows PATH — the LocalWP binary is, and it needs the guard ini for the
site's extensions and MySQL port:

```bash
PHP="C:/Users/vpedr/AppData/Roaming/Local/lightning-services/php-8.2.29+0/bin/win64/php.exe"

# Elementor state of every product page row (template, edit mode, data length, CSS)
"$PHP" -c tools/php-guard.ini scripts/probe-elementor-docs.php

# Product-page health: renders all six partials and checks every theme asset
# they reference against the filesystem, plus every ?quote= prefill slug against
# the contact-form whitelist.
"$PHP" -c tools/php-guard.ini scripts/render-route.php
```

`render-route.php` is the regression check for the two failure modes that actually bit the
live site: a theme asset deleted while the PHP template still points at it, and a `?quote=`
slug that the contact form does not accept. Both are silent — the page still renders.

### Secret audit

```bash
node scripts/audit-secrets.mjs
```

Scans every blob in the git history for the MCP token and the SSH private key body, and
reports counts and file names only. The repository is public; keep it that way.

---

## Current state

| Page | WordPress post | Status |
|---|---|---|
| Landing — EN | 72 | Live. 6 sections: hero → products → applications → technology → knowledge → contact. |
| Landing — DE | 135 | Partial — contact section only. |
| `/en/products/mechanical/` | 44 | PHP template. Copy + media transcribed; Elementor build not applied yet. |
| `/en/products/electrostatic/` | 46 | PHP template. Copy + media transcribed; Elementor build not applied yet. |
| `/en/products/dust/` | 48 | PHP template. Hero only in the PHP; copy + media transcribed. |

The three product pages already exist as WordPress pages (44 / 46 / 48, children of the `products`
page) and are also reachable as `/en/products/…` through the virtual routes in
`inc/products-page-routes.php`. Both paths must render the same Elementor document once the
migration lands.


### Known gaps on the live EN landing page

* **Container depth.** The target grammar is ≤3 levels (plus three named inline-group exceptions).
  The live document measures **7** — hero 3, products 6, applications 6, technology 7, knowledge 5,
  contact 5. Every offender is enumerated in `specs/elementor-blueprint.md` §4. The flattening pass
  was never executed.
* **Hero** has no `id="hero"`, so `#hero` deep links are dead.
* **Hero client logos** are a shortcode widget, so they are not editable in Elementor.
* **Knowledge** has three fake tabs (plain containers, not an `e-tabs` widget) and is missing the
  *Our Story*, *Our Mission*, *Trusted by Industry Leaders* and *Need Custom Documentation?*
  content that exists in the PHP.
* **Contact** info cards have no icons (the mail / phone / map-pin SVGs are already in the Media
  Library as ids 119 / 121 / 120).

---

## Product pages

The three product pages are **virtual routes** registered in
`inc/products-page-routes.php`, not WordPress pages. They are rendered by
`template-parts/page-products-*.php` and wrapped by `page-products-*.php`, which emits the SEO
metadata and JSON-LD through `emifree_seo_page_with_breadcrumb()`.

Migrating them means creating real Elementor documents and pointing the route at them, while
keeping the SEO output and the hreflang map intact.

Three things the atomic format cannot reproduce natively, each needing a deliberate decision:

1. **The specs tables.** Elementor has no table widget. The mechanical page has 15 rows, the
   electrostatic page 14. These become grids of widgets, or a shortcode.
2. **The inline `<script type="module">` blocks.** Each product page carries ~280 lines of
   gallery-rotation, magnify, scroll-spy and back-to-top logic in the template. It has to be
   hoisted into `assets/js/` and enqueued by the theme, and re-scoped by `_cssid` because the
   atomic editor drops `data-*` attributes.
3. **`data-*` attributes and `role="tablist"` markup** in the gallery. The thumb strip has to be
   rebuilt from widgets, and the JS re-scoped accordingly.

---

## Ground rules

`specs/constraints.md` is binding. In particular:

* Atomic widgets only — no `html` widget, no `spacer`, no text outside a widget.
* Container depth ≤ 3 (plus the three named inline-group exceptions).
* Custom CSS lives in the `style` string, with only `&:hover` / `&:focus` / `&:active` nesting and
  `@media(--mobile)` / `@media(--tablet)` blocks. Never a `<style>` tag, never a descendant
  selector.
* Never invent copy — every string comes from `sections-map.md` or the PHP.
* Never change the section order: Hero → Products → Applications → Technology → Knowledge →
  Contact.
