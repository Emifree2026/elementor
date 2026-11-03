# Build pipeline

> ## ⚠️ Status: mid-migration. The emitter is still CLASSIC and does NOT match the live site.
>
> The live documents (post 72, post 135) are **Elementor 4.x atomic (V4)**. The emitter in
> `src/v3.mjs` produces **classic (V3)** output — `"elType": "container"`, `custom_css` with a
> `selector` block, `flex_direction_tablet`. That output **cannot replace the live document** by
> import; the two formats are mutually exclusive.
>
> **Do not treat `out/*.json` as deployable.** They are build artifacts of a superseded emitter.

## What this becomes

The target is an emitter that produces **MCP `build-composition` payloads**, because that is what
actually built post 72:

```jsonc
{
  "post_id": 72,
  "xml_structure": "<e-flexbox configuration-id=\"hero-root\">…</e-flexbox>",
  "element_config": { "hero-root": { "tag": "section", "_cssid": "hero" } },
  "style":          { "hero-root": "padding-top: 96px;" },
  "classes":        { "hero-root": [] }
}
```

`src/v3.mjs` → `src/atomic.mjs` is that rewrite. `build.mjs` and its `verify()` stay; the
verification rules in `verify()` must move to the atomic rules in `specs/constraints.md`
(container depth ≤ 3, no `html`/`spacer` widgets, no text outside a widget, no duplicate titles).

## Current modules

| File | Role |
|---|---|
| `src/v3.mjs` | **Classic (V3) emitter — superseded, kept for reference.** 46 KB. |
| `src/element.mjs` | Neutral authoring layer: `el(type, spec)` → node, id generation, media refs. Reusable as-is. |
| `src/sections.mjs` | The six section builders (hero, products, applications, technology, knowledge, contact). **The copy and structure here are correct** — only the emitter underneath them is wrong. |
| `src/content.mjs` | All EN copy as structured data. |
| `src/assets.mjs` | Media manifest (attachment ids for images, SVGs, video, logos). |
| `src/tokens.mjs` | Design tokens. |
| `src/css.mjs` | CSS helpers. |
| `build.mjs` | Driver: runs the section builders, calls `verify()`, writes `out/*.json`. |
| `assets/chip-*.svg` | Hero chip icons. **Note:** the live document sources its SVGs from the Media Library by attachment id, not from these files. |

## Rules the emitter must obey

See `specs/constraints.md`. The short version:

* Element tags only, each with a unique `configuration-id`. No ids, no classes, no text nodes.
* `element_config` holds **plain** values, not typed `$$type` envelopes.
* `style` is a **plain CSS string**. Nested blocks are limited to `&:hover` / `&:focus` /
  `&:active`; media blocks use `@media(--mobile)` / `@media(--tablet)`.
* `configuration-id` is per-request. The server assigns the real element ids and returns them in
  `resolved_xml`; those are the only ids usable in a follow-up `manage-elements` call.
