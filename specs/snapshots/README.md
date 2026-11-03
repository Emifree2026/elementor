# Elementor document snapshots

Taken 2026-11-02 14:12:13 UTC from the local site database (`http://landingwptest.local`).

The Elementor document itself lives in the **database**, not in git — a git commit of the
theme does **not** capture it. These files are the git-trackable copy of the live page.

Each file is the raw `_elementor_data` post meta for that document, i.e. exactly the
format Elementor's own Import/Export tool produces, so a document can be restored with
Elementor → Import (or by copying the JSON back into `_elementor_data`).

| Post | Title | Status | File | Bytes | Modified (GMT) | Elementor |
|---|---|---|---|---|---|---|
| 72 | Elementor Preview | publish | `post-72-elementor.json` | 296,186 | 2026-10-26 12:08:36 | 4.3.5 |
| 135 | Elementor Vorschau (DE) | draft | `post-135-elementor.json` | 42,806 | 2026-11-02 13:42:48 | 4.3.5 |

Also worth capturing when the site is ready to hand over:

- the full database dump (`app/sql/local.sql` in this repo is from 2026-08-05 and predates
  every Elementor change),
- the generated CSS in `wp-content/uploads/elementor/css/` — it is regenerated from the
  documents, so it does not need to be committed separately.
