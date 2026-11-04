# Build pipeline

The pipeline emits **MCP `build-composition` payloads** — the format that actually built the live
documents (post 72 / post 135). There is no JSON import step.

```jsonc
{
  "post_id": 72,
  "xml_structure": "<e-flexbox configuration-id=\"hero-root\">…</e-flexbox>",
  "element_config": { "hero-root": { "tag": "section", "_cssid": "hero" } },
  "style":          { "hero-root": "padding-top: 96px;" },
  "classes":        { "hero-root": [] }
}
```

`element_config` holds **plain** values (the ability converts them into the typed `$$type`
envelopes the atomic store uses). `style` is a **plain CSS string** — nested blocks limited to
`&:hover` / `&:focus` / `&:active`, media blocks as `@media(--mobile)` / `@media(--tablet)`.

## Modules

| File | Role |
|---|---|
| `src/atomic.mjs` | The atomic authoring DSL: `el()` / `flex()` / `grid()` / `heading()` / `para()` / `button()` / `image()`, plus `serialize()` → the `build-composition` payload and `checkDepth()` → the ≤3-container-depth rule. |
| `src/product-content.mjs` | Copy + data for the three EN product pages, transcribed verbatim from the PHP templates and `inc/products-page-helpers.php`. |
| `src/product-content-de.mjs` | The DE counterpart. Separate module on purpose: the theme keeps hand-written German copy, so DE is not a translation of the EN data. |
| `src/content.mjs` | Copy + structured data for the landing page (EN), transcribed from the PHP theme. |
| `src/tokens.mjs` | Design tokens: colours, spacing, radii, shadows, motion. |
| `src/assets.mjs` | Media manifest — attachment ids for images, SVGs, video, logos. |
| `src/css.mjs` | CSS → atomic style props. `compileCss()` turns a plain CSS string into the `styles` / `variants` / `custom_css` shape Elementor 4.3.5 stores. Every `$$type` here was reverse-engineered from the live 296 KB document, not guessed. |
| `src/media-manifest.json` | Written by `scripts/sideload-product-media.php` — the product images that now live in the Media Library as real attachments (ids 164–184). |
| `assets/chip-*.svg` | Source SVGs for the hero chips. The live document sources its SVGs from the Media Library by attachment id, not from these files. |

## What was removed, and why

The classic (V3) pipeline is gone:

| Removed | Reason |
|---|---|
| `src/v3.mjs` | Classic emitter. Produced `"elType": "container"` + `custom_css` selector blocks — a format the atomic editor cannot consume. The two formats are mutually exclusive. |
| `src/element.mjs` | The classic neutral-node authoring layer that `v3.mjs` compiled. |
| `src/sections.mjs` | The six classic section builders. Built on `v3.mjs`'s node API, so they could only ever emit classic output. Their **copy and structure were correct** — that content survives in `src/content.mjs` + `specs/elementor-blueprint.md` + `specs/sections-map.md`, and the live document is the working reference. |
| `build.mjs` | The classic driver. Its `verify()` rules move to `tools/verify-doc.mjs` (see below). |
| `out/*.json` | Build artifacts of the superseded emitter. Explicitly **not deployable** — a classic document cannot replace an atomic one by import. |

## Rules the emitter must obey

See `../specs/constraints.md` — it is binding. The short version:

* Element tags only, each with a unique `configuration-id`. No ids, no classes, no text nodes.
* `element_config` holds plain values, not typed `$$type` envelopes.
* `style` is a plain CSS string with the nesting limits above.
* Container depth ≤ 3 (plus the named inline-group exceptions).
* Never invent copy — every string comes from `src/content.mjs` / `src/product-content.mjs` or the
  PHP source they were transcribed from.
* `configuration-id` is per-request. The server assigns the real element ids and returns them in
  `resolved_xml`; those are the only ids usable in a follow-up `manage-elements` call.
