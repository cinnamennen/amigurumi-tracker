// Fetches thewoobles.com's Shopify storefront product JSON and fuzzy-matches
// products to catalog patterns by name, so buildCatalog.ts can populate real
// imageUrl/purchaseUrl instead of null placeholders.
//
// This hits a rate-limited endpoint (see packages/pipeline/data/README.md) --
// it's meant to be run occasionally (locally or via the
// .github/workflows/match-catalog.yml workflow_dispatch job), with its output
// committed to packages/pipeline/data/sourceCatalogMatch.json. buildCatalog.ts
// merges that committed file at build time; it never fetches over the
// network itself.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PATTERNS_PATH = join(__dirname, "../../web/src/data/patterns.json");
const OVERRIDES_PATH = join(__dirname, "../data/sourceCatalogOverrides.json");
const OUTPUT_PATH = join(__dirname, "../data/sourceCatalogMatch.json");

const STORE_URL = "https://thewoobles.com";
const PAGE_LIMIT = 250;
const MAX_PAGES = 20; // 20 * 250 = 5000 products, comfortably above the real catalog size
const REQUEST_DELAY_MS = 500;
const MAX_RETRIES = 4;

interface PatternRow {
  id: string;
  name: string;
}

interface ShopifyProduct {
  title: string;
  handle: string;
  images: { src: string }[];
}

interface MatchResult {
  productUrl: string;
  imageUrl: string;
  matchedTitle: string;
  confidence: "high" | "medium";
}

interface AmbiguousCandidate {
  title: string;
  handle: string;
  score: number;
}

interface MatchOutput {
  fetchedAt: string;
  productCount: number;
  matches: Record<string, MatchResult>;
  unmatched: string[];
  ambiguous: Record<string, AmbiguousCandidate[]>;
}

interface Overrides {
  [patternId: string]: { productHandle: string };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson<T>(url: string): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      // Exponential backoff: 1s, 2s, 4s, 8s.
      await sleep(1000 * 2 ** (attempt - 1));
    }
    try {
      const res = await fetch(url, { headers: { "User-Agent": "amigurumi-tracker-catalog-sync/1.0" } });
      if (res.status === 429) {
        lastError = new Error(`429 rate limited on attempt ${attempt + 1}`);
        continue;
      }
      if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText} fetching ${url}`);
      }
      return (await res.json()) as T;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function fetchAllProducts(): Promise<ShopifyProduct[]> {
  const products: ShopifyProduct[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = `${STORE_URL}/products.json?limit=${PAGE_LIMIT}&page=${page}`;
    const body = await fetchJson<{ products: ShopifyProduct[] }>(url);
    if (body.products.length === 0) break;
    products.push(...body.products);
    console.log(`Fetched page ${page}: ${body.products.length} products (${products.length} total)`);
    if (body.products.length < PAGE_LIMIT) break;
    await sleep(REQUEST_DELAY_MS);
  }
  return products;
}

// Woobles product titles are consistently "{Pattern Name} ... Crochet kit"
// (e.g. "Kurt the Poison Dart Frog Extra Squeezy Crochet kit" for pattern
// name "Kurt the Poison Dart Frog") -- strip the common marketing suffixes
// and compare token sets rather than exact strings.
const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "kit",
  "crochet",
  "pattern",
  "amigurumi",
  "extra",
  "squeezy",
  "plus",
  "mini",
  "edition",
  "holiday",
  // Almost every Woobles product and pattern name starts with "Tiny" -- it
  // carries no discriminating power, but without stripping it, a 2-token
  // pattern name like "Tiny Bowtie" matching just "tiny" alone scores 0.5
  // and clears the ambiguous-match threshold against literally any other
  // "Tiny ___" product on the storefront.
  "tiny",
]);

function normalize(text: string): string[] {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .split(/\s+/)
    .filter((word) => word && !STOPWORDS.has(word));
}

function tokenScore(patternTokens: string[], productTokens: string[]): number {
  if (patternTokens.length === 0) return 0;
  const productSet = new Set(productTokens);
  const overlap = patternTokens.filter((t) => productSet.has(t)).length;
  return overlap / patternTokens.length;
}

// A handful of pattern names carry a parenthetical qualifier -- e.g. "Tiny
// Backpack (Safari)", "Hubert (baby toy)" -- that describes a variant or
// theme rather than being part of the product's actual name on the
// storefront. Treated as a required token like any other word, it forces a
// spurious tie against products that happen to share just the qualifier
// (e.g. "Tiny Safari Hat") instead of the actual item.
function stripParentheticalQualifier(name: string): string {
  return name.replace(/\([^)]*\)/g, " ");
}

function matchPattern(
  pattern: PatternRow,
  products: ShopifyProduct[],
): { result: MatchResult } | { ambiguous: AmbiguousCandidate[] } | { unmatched: true } {
  const patternTokens = normalize(stripParentheticalQualifier(pattern.name));
  const scored = products
    .map((product) => ({ product, score: tokenScore(patternTokens, normalize(product.title)) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return { unmatched: true };

  const best = scored[0]!;
  const runnerUp = scored[1];

  // A full token match (every word in the pattern name appears in the
  // product title) is a strong signal on its own. Otherwise require a
  // clear margin over the next-best candidate to call it unambiguous.
  const isHighConfidence = best.score === 1;
  const hasClearMargin = !runnerUp || best.score - runnerUp.score >= 0.34;

  if (best.score >= 0.67 && (isHighConfidence || hasClearMargin)) {
    const image = best.product.images[0];
    if (!image) return { unmatched: true };
    return {
      result: {
        productUrl: `${STORE_URL}/products/${best.product.handle}`,
        imageUrl: image.src,
        matchedTitle: best.product.title,
        confidence: isHighConfidence ? "high" : "medium",
      },
    };
  }

  if (best.score >= 0.5) {
    return {
      ambiguous: scored.slice(0, 5).map((s) => ({ title: s.product.title, handle: s.product.handle, score: s.score })),
    };
  }

  return { unmatched: true };
}

async function verifyImageReachable(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

async function main() {
  const patterns = (JSON.parse(readFileSync(PATTERNS_PATH, "utf-8")) as PatternRow[]).map((p) => ({
    id: p.id,
    name: p.name,
  }));
  let overrides: Overrides = {};
  try {
    overrides = JSON.parse(readFileSync(OVERRIDES_PATH, "utf-8")) as Overrides;
  } catch {
    // No overrides file yet -- fine, treat as empty.
  }

  console.log(`Fetching product catalog from ${STORE_URL} ...`);
  const products = await fetchAllProducts();
  console.log(`Fetched ${products.length} products total. Matching against ${patterns.length} patterns ...`);

  const productsByHandle = new Map(products.map((p) => [p.handle, p]));
  const matches: Record<string, MatchResult> = {};
  const unmatched: string[] = [];
  const ambiguous: Record<string, AmbiguousCandidate[]> = {};

  for (const pattern of patterns) {
    const override = overrides[pattern.id];
    if (override) {
      const product = productsByHandle.get(override.productHandle);
      const image = product?.images[0];
      if (product && image) {
        matches[pattern.id] = {
          productUrl: `${STORE_URL}/products/${product.handle}`,
          imageUrl: image.src,
          matchedTitle: product.title,
          confidence: "high",
        };
      } else {
        unmatched.push(pattern.id);
      }
      continue;
    }

    const outcome = matchPattern(pattern, products);
    if ("result" in outcome) {
      matches[pattern.id] = outcome.result;
    } else if ("ambiguous" in outcome) {
      ambiguous[pattern.id] = outcome.ambiguous;
    } else {
      unmatched.push(pattern.id);
    }
  }

  console.log(
    `Matched ${Object.keys(matches).length}, ambiguous ${Object.keys(ambiguous).length}, unmatched ${unmatched.length}.`,
  );

  if (process.argv.includes("--verify")) {
    console.log("Verifying matched image URLs are reachable ...");
    let verified = 0;
    for (const [patternId, match] of Object.entries(matches)) {
      const reachable = await verifyImageReachable(match.imageUrl);
      if (!reachable) {
        console.warn(`  ${patternId}: image not reachable, demoting to unmatched (${match.imageUrl})`);
        delete matches[patternId];
        unmatched.push(patternId);
      } else {
        verified++;
      }
      await sleep(150);
    }
    console.log(`Verified ${verified} image URLs.`);
  }

  const output: MatchOutput = {
    fetchedAt: new Date().toISOString(),
    productCount: products.length,
    matches,
    unmatched: unmatched.sort(),
    ambiguous,
  };
  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + "\n", "utf-8");
  console.log(`Wrote ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
