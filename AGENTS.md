# AGENTS.md — Amigurumi Collection Tracker

Context for whoever (human or agent) picks this project up next. This repo is Caleb's personal
web app tracking his ~664 amigurumi crochet patterns (all from one source vendor currently):
what he's made, what he can make, and what yarn he needs. It replaces an earlier Excel-based
tracker (see "History" below).

A naming note for future edits: keep the source vendor's actual name out of code, package
names, identifiers, comments, and docs (including this file) wherever a generic term works —
"the source vendor," "the original pattern vendor," etc. The one place the real name is
unavoidable is literal data: the frozen fixture dataset, the gitignored `source/` folder, and
string-matching logic that has to recognize literal text appearing in that data (e.g. a filter
matching a note string that really does say "not from this vendor" in the source spreadsheet).
An external URL that's a genuine technical requirement (e.g. the vendor's storefront domain, if
a future integration needs to fetch from it) is the same kind of exception — it's a fact the
code needs, not a name we chose.

**This repo now uses `bd` (beads) for issue tracking — see the managed block further down for
commands.** The full implementation plan (architecture, phasing, rationale for every major
decision) lives in `bd`'s epic `ami-fcq` (`bd show ami-fcq`); the plan doc it was built
from is `/home/ion/.claude/plans/gentle-popping-hickey.md` on the machine it was authored on.
Read the epic before doing more work here — it explains *why* the repo is shaped this way, not
just what's in it.

## Repo layout

```
source/                  gitignored, private raw material — pattern PDFs/docx, xlsx trackers.
                          Never committed (see guardrails below). Not present on a fresh clone.
packages/
  schema/                 shared TS + Zod types (Pattern, MaterialRow, Stash, ...) — the one
                           source of truth both the pipeline and the web app import.
  pipeline/                Node/TS pipeline that builds packages/web/src/data/patterns.json.
    src/colorRecords.ts     classifies raw color text into {family, qualifier, isPlaceholder}
    src/__tests__/fixtures/frozenOutput.json   frozen snapshot of the original Python
                             pipeline's already-correct output (664 tracker rows, 1938
                             material rows, 664 crosswalk rows) — the regression baseline.
                             The Python code that produced it is gone; this JSON is what's
                             tested against now.
  web/                     Vue 3 + Vite + TS static SPA. No backend — catalog data is a build
                           artifact, user state (have-it/completed/notes/stash) lives in
                           browser localStorage only.
```

## Guardrails — read before touching git

The PDFs/patterns themselves must **never** be committed (copyright — this repo ships derived
metadata and a link back to the source vendor, not the patterns). Two layers enforce this:
1. Root `.gitignore`: `*.pdf`, `*.docx`, `*.xlsx`, lock files.
2. A pre-commit hook (`scripts/check-no-pattern-files.mjs`, wired via `simple-git-hooks`) that
   hard-rejects any commit staging one of those extensions, even via `git add -f`. Verified live
   against a real pattern PDF before any other repo work began — don't remove or weaken this.

**Two sharp edges found the hard way here** (see `bd memories hooks` for the full note):
`core.hooksPath` is `.beads/hooks`, not `.git/hooks` — bd set that up, so that's the file that
actually matters. And the `simple-git-hooks` config for `pre-commit` must be
`"node scripts/check-no-pattern-files.mjs || exit 1"`, not just the bare command — the compiled
hook has no `set -e`, so without the explicit `|| exit 1` a failing guardrail script silently
falls through to bd's appended hook chain and the commit succeeds anyway. `postinstall` must run
`simple-git-hooks && bd hooks install` (both, in that order) or a plain reinstall silently drops
bd's chain, since `simple-git-hooks` regenerates the file from scratch with no knowledge of it.
This actually let a real PDF get committed once before it was caught by testing an end-to-end
`git commit`, not just eyeballing the script — trust that test, not the code, when touching this.

## History: the original Excel tracker

Before this rewrite, the collection was tracked in an Excel workbook (Sheet1 + Yarn Materials +
Shopping List tabs, built with openpyxl/plain formulas) fed by a Python extraction pipeline
(`_pipeline/`, now deleted — its output is frozen in
`packages/pipeline/src/__tests__/fixtures/frozenOutput.json`, see above). The move away from the
spreadsheet was deliberate: Caleb's direction was **stop optimizing the Excel file** and build
something that could actually represent match-confidence on color (a flat "Blue" string can't
distinguish "any blue works" from "this needs to match exactly"), track a yarn stash, and support
real browsing via tags. Details on *why* below are still accurate and worth reading; the *what
to do about it* is now superseded by the beads epic mentioned above.

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

**PDF structure.** The source vendor's pattern PDFs come in roughly three layout families: a modern
icon-grid materials page, an older numbered-legend/diagram style, and a "Celebrate"
book-bundle format with no formal materials grid at all (colors only mentioned inline as
"With  yarn..." in the instructions). About 93 of the 654 PDFs are scanned/image-only and
need OCR (pdftoppm + tesseract) rather than text extraction. **The materials page has no
color swatches or color-coded icons** — checked directly by inspecting the PDF's embedded
images/vector objects (e.g. Grumpy Bear.pdf page 2): the only images present are five
generic tool icons (hook, eyes, needle, stuffing, scissors), identical across every
pattern regardless of what color yarn is listed. Color is text-only in the source data;
there is no pixel/swatch signal to extract.

**The source vendor's actual yarn line** (researched, not verified against a live current chart —
see below). They sell a proprietary yarn called "Easy Peasy Yarn" with a small set of named
colorways (punny product names, each mapped to one plain color word — e.g. "Seas the Day"
= Blue). As of the last confirmed snapshot there was exactly **one** official blue, not a
light/dark split, though the line has evidently grown since (mentions of newer pastels and
a rainbow set turned up in research but weren't confirmed against a current official chart).
Kits bundle the exact yarn for that pattern, so kit buyers never have to color-match by
reading text. This matters a lot for the color-ambiguity question below.

**Color-text breakdown**, computed against the 1937 non-blank color entries in
flat_rows_final.json:
- 88% (1711) are bare generic family words ("Blue", "Black", "White"...) — probably *not*
  actually ambiguous in practice, since the source vendor's own commercial line typically has
  only one option per family anyway.
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

## Where this was headed — status: in progress, tracked in beads

The analysis above (item 1, the family/qualifier/placeholder color record; item 2, three-tier
match confidence) is what `packages/pipeline/src/colorRecords.ts` implements — see `bd show
ami-fcq.7`. Items 3 (grounding the base palette against the source vendor's *current* official
color chart) and 4 (using the PDF cover photo as a visual reference) are **not done** — they were never
turned into beads issues, so if this picks back up, that's real remaining scope worth filing,
not just implied by old notes. Item 5's open question is answered: a static Vue SPA, no backend,
localStorage for user state (see `bd show ami-fcq` for the full architecture and why).

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
