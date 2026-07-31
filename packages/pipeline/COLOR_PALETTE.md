# Color palette vs. colorRecords.ts qualifiers

Grounds AGENTS.md's stale color research against the vendor's *current*
official Easy Peasy Yarn lineup, and checks which qualifier-bearing entries
in the data resolve to a real yarn SKU vs. are collab-specific custom
shading that needs a human to eyeball the pattern's cover photo.

## Current official lineup (13 colors, one SKU per name)

Corroborated across the vendor's own storefront listings as syndicated to
Walmart/Amazon (checked 2026-07-30; not fetched directly from the vendor's
own site — see note at bottom):

| Product name              | Plain color |
|----------------------------|-------------|
| The Coal Shebang            | Black       |
| Snow Place Like Home        | White       |
| Pebble Without a Cause      | Gray        |
| Chocolate Moose             | **Dark Brown** |
| A Whole Latte Love          | Brown       |
| This Sand is Your Sand      | Tan         |
| Let's Ketchup Soon          | Red         |
| Eat, Pink & Be Merry        | Pink        |
| Orange You Glad             | Orange      |
| What's Up Buttercup         | Yellow      |
| Leaf It to Us                | Green       |
| Seas the Day                | Blue        |
| Happily Ever Lavender       | Purple      |

No Cream, Gold, or Silver SKU exists in the base line (those `ColorFamily`
values in `packages/schema` are there for data that doesn't map cleanly to
this lineup, not because the vendor sells yarn in those colors). No pastel,
"light", or variegated SKUs either, despite AGENTS.md's earlier unconfirmed
mention of a rainbow/pastel expansion — didn't find one.

## The headline finding: two browns, not one

**Brown is the one family with two distinct official SKUs** — "A Whole
Latte Love" (Brown) and "Chocolate Moose" (Dark Brown) — not a single base
color the way every other family is. That matters because "Dark Brown" is
also, by a wide margin, the most common qualifier in the actual pattern
data:

| Qualifier(s) + family (from materialRows in frozenOutput.json) | Count | Real SKU? |
|---|---|---|
| Dark Brown                  | 49 | **Yes** — Chocolate Moose |
| Dark Green                  | 23 | No |
| Glowing White                | 22 | No |
| Glitter Yellow                | 19 | No |
| Glowing Yellow                | 15 | No |
| Glitter White                 | 12 | No |
| Glowing Blue                  | 11 | No |
| Light Blue / Dark Blue / Light Pink / Dark Gray / Glitter Gray | 10 each | No |
| ...(everything else: Glitter/Glowing/Variegated/Light/Dark × various families) | — | No |

So of the ~155 qualifier-bearing rows AGENTS.md flagged as "the real risk
group," the ~49 "Dark Brown" ones (the single largest cluster) are backed by
a real SKU — a "Dark Brown" material listing means exactly what it says, use
Chocolate Moose. Everything else with a qualifier (Glitter/Glowing/
Variegated anything, Light/Dark on any family other than Brown) has no
corresponding base-line SKU and is genuinely collab-specific custom shading,
confirming AGENTS.md's original guess.

## Feedback into colorRecords.ts

No behavior change needed. `classifyColor()` already does the right thing
for both cases: it returns `{family, qualifier: "Dark", isPlaceholder:
false}` for "Dark Brown" today, which is already the correct, precise
signal — a reader (or a future "does my stash cover this" check) sees
"needs the darker skein specifically," not just "any brown." The qualifier
field doesn't currently distinguish "this qualifier is a confirmed SKU" from
"this qualifier is custom shading nobody's confirmed" — that's a reasonable
future refinement (e.g. a `qualifierConfirmed: boolean` on `MaterialRow`)
but out of scope here; this doc is the source of truth for that distinction
until/unless it's worth encoding in the schema.

## Caveat

This wasn't fetched directly from the vendor's own product pages — direct
requests to `thewoobles.com` from this environment hit Shopify's bot-rate-
limiting (see `bd show ami-fcq.18`'s notes), so this is corroborated across
independent third-party listings (Walmart, Amazon) instead, all of which
agree on the same 13 names. Worth a direct re-check against the vendor's own
site next time someone's actually browsing it.
