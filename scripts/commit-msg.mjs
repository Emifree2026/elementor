/**
 * Write a commit message to a file as UTF-8 **without** a BOM.
 *
 *   node scripts/commit-msg.mjs <outfile>
 *
 * PowerShell 5.1's `Set-Content -Encoding utf8` writes a BOM, and git then puts
 * it at the start of the commit subject. This writes the same bytes git wants.
 */
import { writeFileSync } from 'node:fs';

const out = process.argv[2];
if (!out) {
	console.error('usage: node commit-msg.mjs <outfile>');
	process.exit(1);
}

const message = `chore: drop the classic pipeline and the stale build artifacts

The repo now contains only what the atomic (V4) pipeline actually needs.

Removed:
  pipeline/src/v3.mjs, element.mjs, sections.mjs, build.mjs
    The classic (V3) emitter and the node API it compiled. They produced
    "elType": "container" + custom_css selector blocks, a format the atomic
    editor cannot consume. The copy and structure in sections.mjs were
    correct and survive in src/content.mjs + specs/elementor-blueprint.md +
    specs/sections-map.md.
  pipeline/out/*.json
    Build artifacts of the superseded emitter. Never deployable, and a trap
    for the next agent.
  tools/build-*.js, tools/verify-products.js
    One-off classic builders for post 72, superseded by build-composition.
  specs/HANDOVER.md
    The previous session's handover. Its claim that post 72 passes the
    <=3-container-depth check is false (it measures 7), so keeping it risked
    repeating the mistake. specs/constraints.md now carries the measured
    baseline instead.
  pages/*.json
    Byte-identical duplicates of specs/snapshots/.
  backups/post-72-local-72-frontend-*.css, the older post-72 dump
    The generated CSS is regenerated from the document (the atomic styles
    travel inside _elementor_data, per element), so a snapshot is already a
    complete restore point.

Added:
  pipeline/src/atomic.mjs           atomic authoring DSL + depth check
  pipeline/src/product-content.mjs   EN product-page copy, transcribed verbatim
  scripts/probe-*.php, scripts/inspect-*.mjs   read-only probes

Co-Authored-By: Claude Code <noreply@anthropic.com>
`;

writeFileSync(out, message, 'utf8');
console.log(`wrote ${out}`);
