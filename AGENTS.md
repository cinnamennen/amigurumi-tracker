# AGENTS.md — Woobles Collection Project

Context for whoever (human or agent) picks this project up next. This folder is Caleb's
personal tracker + yarn-materials database for ~664 "The Woobles" crochet patterns (PDFs
organized in subfolders below this file: Animals/, Christmas/, Collabs/, Food/, etc.).

## What exists in this folder right now

- **654 pattern PDFs**, in their original subfolder structure (untouched — this is source data).
- **`Woobles List (extended).xlsx`** — the current/best spreadsheet deliverable. Four tabs:
  Read Me, Sheet1 (original tracker + a "PDF File" key column + a live "Yarn Data?" status
  column), Yarn Materials (one row per color per pattern), Shopping List (yardage needed per
  color, summed across owned-but-not-completed patterns). Built with plain openpyxl-generated
  formulas (SUMIFS/COUNTIFS/INDEX/MATCH) — no dynamic-array functions, no macros.
- **`Woobles Yarn Materials.xlsx`**, **`Reconciliation Report.xlsx`** — earlier standalone
  deliverables from before the tabs were merged into one workbook. Superseded by the
  "extended" file above but left in place rather than deleted.
- **`Woobles List (all images, take 2).xlsx`**, **`Woobles List (trimmed only).xlsx`**,
  **`Woobles List .xlsx`** — earlier iterations of the tracker, kept for history. The
  "(all images, take 2)" version is the one "extended.xlsx" was built on top of.
- **`_pipeline/`** — the actual extraction/build pipeline, so this is reproducible rather
  than a one-off. See below.

**As of the last working session, the direction is shifting away from the spreadsheet.**
See "Where this was headed" at the bottom — that's the part most worth reading before
doing more spreadsheet engineering.

## `_pipeline/` contents

```
_pipeline/scripts/
  extract_core.py         shared geometric PDF-parsing engine (word bands -> materials rows)
  extract_yarn5.py         direct pdfplumber extractor (final iteration, non-OCR path)
  extract_ocr.py           OCR path: pdftoppm + tesseract, for scanned/image-only PDFs
  extract_ocr_fallback.py  inline "With <color> yarn" extractor for the "book"-format PDFs
                           that have no formal materials grid (Celebrate bundles etc.)
  manual_overrides.py      hand-verified (color, weight, amount) tuples for ~57 files where
                           automated extraction couldn't be trusted (glued OCR tokens,
                           non-standard templates, third-party/non-Woobles files)
  clean_colors.py          strips "with N stitch markers in it" phrasing out of color text
  split_colors.py          splits genuine multi-color entries ("Red and Blue, 3 yds each")
                           into separate rows. Deliberately does NOT split "X and Y" when
                           only one combined number is given with no "each" — that pattern
                           means a single compound-named colorway (e.g. "Dark Blue and Blue"
                           is one yarn), not two colors. Caleb corrected this by hand once;
                           don't reintroduce the old behavior.
  color_text_fixes.py      small EXACT_FIXES dict + DROP_ROWS set for one-off text artifacts
  final_merge_all.py       merges all of the above into data/flat_rows_final.json. Run this
                           after touching manual_overrides.py, clean_colors.py, split_colors.py,
                           or color_text_fixes.py — those files don't take effect until this
                           script re-runs. (This bit me once: edited manual_overrides.py,
                           forgot to re-run this, shipped stale data.)
  build_xlsx_final.py      standalone Yarn Materials workbook builder (superseded by
                           build_extended_tracker.py, kept for reference)
  build_extended_tracker.py  builds "Woobles List (extended).xlsx" from
                           Woobles List (all images, take 2).xlsx + data/flat_rows_final.json
                           + data/crosswalk.json

_pipeline/data/
  flat_rows_final.json    canonical yarn dataset. 1938 rows, one per (pattern, color).
                           Fields: folder, file, path, status, color, weight, amount_yds.
                           `status` is one of: ok, verified_manual, ocr_ok, ocr_review,
                           color_only_no_yardage. `file` is the PDF filename stem (no
                           extension) — this is the join key everywhere.
  crosswalk.json           664 records, one per row in Sheet1 of the tracker, linking
                           tracker Name/Animal/Category/Have-It to a pdf_file (or null if
                           genuinely unowned/no materials page exists). match_method tells
                           you how confident that link is (exact/prefix/family_disambiguated/
                           typo_fixed/confirmed_gap/correctly_unowned).
```

To regenerate everything from scratch: run the scripts in `_pipeline/scripts/` against the
PDFs in this folder (paths inside the scripts assume the sandbox mount point used during
development — update the SRC path at the top of each script for wherever this folder lives
in the new environment), in this order: extract_yarn5.py -> extract_ocr.py ->
extract_ocr_fallback.py -> final_merge_all.py -> build_extended_tracker.py.

## Things learned the hard way (don't rediscover these)

**Excel/OpenOffice compatibility.** The very first version of the tracker used Excel's
"Picture in Cell" rich-value image type, which LibreOffice/OpenOffice can't parse — it
would try to "recover" the file on open and hang. Fix: use ordinary floating images
anchored to cells (openpyxl `ws.add_image`), never the rich-value/IMAGE() datatype. Also
watch cell-style count — the broken version had bloated per-cell styling; the fixed
version holds steady around 28-31 distinct styles for 664+ rows. **This sandbox has
LibreOffice installed** (`soffice --headless --convert-to xlsx ...`) — use it to actually
round-trip and recalculate any new spreadsheet before calling it done, rather than trusting
that openpyxl-valid XML means LibreOffice-safe. It caught two real bugs this way: yardage
amounts stored as text (silently zeroed every SUMIFS), and a PDF with a literal trailing
space in its own filename ("Chococat .pdf") breaking an exact-match join key.

**PDF structure.** Woobles pattern PDFs come in roughly three layout families: a modern
icon-grid materials page, an older numbered-legend/diagram style, and a "Celebrate"
book-bundle format with no formal materials grid at all (colors only mentioned inline as
"With  yarn..." in the instructions). About 93 of the 654 PDFs are scanned/image-only and
need OCR (pdftoppm + tesseract) rather than text extraction. **The materials page has no
color swatches or color-coded icons** — checked directly by inspecting the PDF's embedded
images/vector objects (e.g. Grumpy Bear.pdf page 2): the only images present are five
generic tool icons (hook, eyes, needle, stuffing, scissors), identical across every
pattern regardless of what color yarn is listed. Color is text-only in the source data;
there is no pixel/swatch signal to extract.

**Woobles' actual yarn line** (researched, not verified against a live current chart — see
below). They sell a proprietary yarn called "Easy Peasy Yarn" with a small set of named
colorways (punny product names, each mapped to one plain color word — e.g. "Seas the Day"
= Blue). As of the last confirmed snapshot there was exactly **one** official blue, not a
light/dark split, though the line has evidently grown since (mentions of newer pastels and
a rainbow set turned up in research but weren't confirmed against a current official chart).
Kits bundle the exact yarn for that pattern, so kit buyers never have to color-match by
reading text. This matters a lot for the color-ambiguity question below.

**Color-text breakdown**, computed against the 1937 non-blank color entries in
flat_rows_final.json:
- 88% (1711) are bare generic family words ("Blue", "Black", "White"...) — probably *not*
  actually ambiguous in practice, since Woobles' own commercial line typically has only one
  option per family anyway.
- 8% (155) carry an explicit shade qualifier ("Dark Brown", "Light Blue", "Navy"...) — this
  is the real risk group. A designer who bothered to specify a shade is telling you it
  matters, likely for a licensed collab needing a character-accurate color outside the base
  line.
- 3.7% (71) aren't colors at all — placeholders like "Skin color", "Hair color", "Collar
  colored" where the crafter picks whatever they want. These are a category error if you
  try to color-match them; exclude them from that logic entirely.

**Reconciliation methodology** (tracker rows <-> PDF files, i.e. how crosswalk.json was
built): normalize names (strip "Tiny " prefix, lowercase, strip punctuation), try exact
match, then prefix match. Rows sharing a first-word "root" with more than one tracker row
*and* more than one PDF filename were pulled out as ambiguous — naive matching on those is
unsafe. This caught a real wrong pairing: an early pass matched tracker row "Fred"
(Loopables category) to "Fred the Dino Ornament.pdf" instead of the correct "Fred the
Dinosaur Loopable.pdf" — plausible-looking but wrong. A subagent later resolved the full
121-row ambiguous set using category/animal-field reasoning and, where that wasn't enough,
by reading the actual PDF title text. Final result: 654/654 PDFs matched to exactly one
tracker row each, zero duplicates, 2 confirmed genuine gaps (no materials page exists for
those patterns), 8 correctly-unowned (Have It? = FALSE, no PDF expected).

## Where this was headed (read this before doing more spreadsheet work)

Caleb's stated direction, most recently: **stop optimizing the Excel file** and instead
solve the underlying problem properly — that tracking color as a flat text string (e.g.
just "Blue") isn't useful for "can I make this with yarn I already have" questions, because
two patterns both saying "Blue" might genuinely need different shades, or might not — the
data as extracted doesn't distinguish those cases, and neither does a spreadsheet cell.

The conclusion from the investigation above: don't try to solve this with cleverer text
parsing — the ambiguity is a real gap in the source material, not an extraction bug. The
proposed shape of a real fix:

1. **Restructure color as a small record, not a string**: family (Blue/Green/etc.),
   optional qualifier (only ~8% of entries have one — treat those as genuinely
   shade-sensitive), and a `is_placeholder` flag for the "your choice" entries (~3.7%).
2. **Three-tier match confidence** instead of true/false: family-only match ("safe, no
   shade specified"), qualifier match required ("verify visually"), placeholder ("no
   constraint"). A spreadsheet cell can't represent this well; this wants real code.
3. **Ground the base palette**: fetch Woobles' *current* official Easy Peasy Yarn color
   chart (not done yet — the research above is a stale/partial snapshot) to check how much
   of the 8% qualified group actually resolves against real SKUs vs. is genuinely
   collab-specific custom shading.
4. **Use the cover photo as a visual reference**: each pattern PDF's first content page has
   a photo of the finished piece in its real colors (this does exist, unlike materials-page
   swatches) — nobody's using this yet. Not pixel-precise, but a real reference a human (or
   Claude) could compare against instead of trusting a text label alone.
5. **Open question, not yet decided**: what the actual tool/interface becomes. Caleb's
   instinct was that this no longer belongs in a spreadsheet — something interactive, or at
   minimum a properly structured dataset with real matching logic, is the likely direction.
   Nothing has been built for this yet; the color-record restructuring above and the
   current-chart lookup are the natural next steps whenever this picks back up.

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:6cd5cc61 -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.

## Agent Context Profiles

The managed Beads block is task-tracking guidance, not permission to override repository, user, or orchestrator instructions.

- **Conservative (default)**: Use `bd` for task tracking. Do not run git commits, git pushes, or Dolt remote sync unless explicitly asked. At handoff, report changed files, validation, and suggested next commands.
- **Minimal**: Keep tool instruction files as pointers to `bd prime`; use the same conservative git policy unless active instructions say otherwise.
- **Team-maintainer**: Only when the repository explicitly opts in, agents may close beads, run quality gates, commit, and push as part of session close. A current "do not commit" or "do not push" instruction still wins.

## Session Completion

This protocol applies when ending a Beads implementation workflow. It is subordinate to explicit user, repository, and orchestrator instructions.

1. **File issues for remaining work** - Create beads for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **Handle git/sync by active profile**:
   ```bash
   # Conservative/minimal/default: report status and proposed commands; wait for approval.
   git status

   # Team-maintainer opt-in only, unless current instructions forbid it:
   git pull --rebase
   git push
   git status
   ```
5. **Hand off** - Summarize changes, validation, issue status, and any blocked sync/commit/push step

**Critical rules:**
- Explicit user or orchestrator instructions override this Beads block.
- Do not commit or push without clear authority from the active profile or the current user request.
- If a required sync or push is blocked, stop and report the exact command and error.
<!-- END BEADS INTEGRATION -->

<!-- BEGIN BEADS CODEX SETUP: generated by bd setup codex -->
## Beads Issue Tracker

Use Beads (`bd`) for durable task tracking in repositories that include it. Use the `beads` skill at `.agents/skills/beads/SKILL.md` (project install) or `~/.agents/skills/beads/SKILL.md` (global install) for Beads workflow guidance, then use the `bd` CLI for issue operations.

### Quick Reference

```bash
bd ready                # Find available work
bd show <id>            # View issue details
bd update <id> --claim  # Claim work
bd close <id>           # Complete work
bd prime                # Refresh Beads context
```

### Rules

- Use `bd` for all task tracking; do not create markdown TODO lists.
- Run `bd prime` when Beads context is missing or stale. Codex 0.129.0+ can load Beads context automatically through native hooks; use `/hooks` to inspect or toggle them.
- Keep persistent project memory in Beads via `bd remember`; do not create ad hoc memory files.

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.
<!-- END BEADS CODEX SETUP -->
