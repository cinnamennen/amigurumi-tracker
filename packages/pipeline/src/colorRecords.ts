import type { ColorFamily, YarnWeight } from "@amigurumi/schema";

/**
 * Rows whose "color" text is actually a note about the row itself (a
 * third-party file not from the source vendor, an extraction failure, a
 * book bundle already covered elsewhere) rather than a yarn color at all.
 * These get dropped entirely by buildCatalog, not classified. The patterns
 * below match literal strings that appear in the source dataset itself —
 * not a naming choice, just what the data says.
 */
const JUNK_ROW_PATTERNS: RegExp[] = [
  /^NOT A WOOBLES PATTERN/i,
  /^NOT STANDARD WOOBLES FORMAT/i,
  /could not extract/i,
  /compiled book\/index/i,
];

export function isJunkColorRow(raw: string): boolean {
  return JUNK_ROW_PATTERNS.some((re) => re.test(raw));
}

/**
 * "Your choice" style entries — a real material the crafter picks freely,
 * not a constraint to match against stash. Matched on normalized lowercase
 * text so casing/whitespace variants all hit.
 */
const PLACEHOLDER_PATTERNS: RegExp[] = [
  /skin color/,
  /body colou?red?/,
  /hair colou?red?/,
  /ear colou?red?/,
  /tail colou?red?/,
  /outfit colou?red?/,
  /collar colou?red?/,
  /^color [ab]\b/,
  /^color [ab]:/,
  /bracelet yarn/,
  /kit-dependent/,
  /emerald colou?red?/,
];

export function isPlaceholderColor(normalized: string): boolean {
  return PLACEHOLDER_PATTERNS.some((re) => re.test(normalized));
}

/** Base family words. Longer/more specific keys first isn't required here — matching is whole-word. */
const FAMILY_WORDS: Record<string, ColorFamily> = {
  black: "Black",
  white: "White",
  gray: "Gray",
  grey: "Gray",
  brown: "Brown",
  tan: "Tan",
  cream: "Cream",
  red: "Red",
  pink: "Pink",
  orange: "Orange",
  yellow: "Yellow",
  green: "Green",
  blue: "Blue",
  teal: "Blue", // the source vendor's line has no separate teal SKU seen in the data; closest family is Blue
  purple: "Purple",
  gold: "Gold",
  silver: "Silver",
  peach: "Orange", // closest family; flagged via qualifier so it stays visually checkable
};

/**
 * Words that modify a family without being a family themselves. Kept
 * separate from FAMILY_WORDS so e.g. "Glitter Blue" resolves to
 * {family: Blue, qualifier: "Glitter"} rather than failing to match.
 */
const QUALIFIER_WORDS = [
  "dark",
  "light",
  "medium",
  "glitter",
  "variegated",
  "variagated", // real typo seen in source data
  "pastel",
  "hot",
  "glowing",
  "glow in the dark",
];

function normalize(raw: string): string {
  return raw
    .normalize("NFKC")
    .replace(/[‘’´`]/g, "") // stray OCR quote artifacts
    .replace(/\((?:l?yds?|1lyds?)\)/gi, "") // "(lyd)", "(yd)", "(1lyds)"
    .replace(/-weight\b/gi, "")
    .replace(/\byam\b/gi, "yarn") // OCR typo seen in source ("Pink yam")
    .replace(/\byarn\b/gi, "")
    .replace(/\bextra squeezy\b/gi, "") // product-line name leaked into color text
    .replace(/\bloopable\b/gi, "")
    .replace(/^with\s+/i, "") // OCR-fallback "With <color> yarn" leftover prefix
    .replace(/^==\s*/, "")
    .replace(/[-–—_]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export interface ColorClassification {
  colorFamily: ColorFamily;
  qualifier: string | null;
  isPlaceholder: boolean;
}

/**
 * Classifies one raw extracted color string into the family/qualifier/
 * placeholder record described in AGENTS.md. Returns null for junk rows
 * (caller should drop them). Anything that doesn't confidently resolve to a
 * single known family — compound colorways ("Dark Blue and Blue"), garbled
 * OCR fragments, genuinely novel words — becomes family "Other" with the
 * original text preserved as the qualifier, which is the honest outcome:
 * low confidence, needs a human glance at the cover photo, not a guess.
 */
export function classifyColor(raw: string): ColorClassification | null {
  if (isJunkColorRow(raw)) return null;

  const normalized = normalize(raw);
  if (normalized.length === 0) return null;

  const lower = normalized.toLowerCase();

  if (isPlaceholderColor(lower)) {
    return { colorFamily: "Other", qualifier: null, isPlaceholder: true };
  }

  // Compound colorways ("Black and Brown", "Red, Pink") that survived the
  // upstream split step (i.e. weren't split because only one combined
  // amount was given) are a single named colorway, not decomposable — per
  // AGENTS.md, don't reintroduce per-word splitting here.
  if (/\band\b|,/.test(lower) && !/glitter|variegated/.test(lower)) {
    return { colorFamily: "Other", qualifier: normalized, isPlaceholder: false };
  }

  const words = lower.split(" ").filter(Boolean);
  const qualifiers: string[] = [];
  let family: ColorFamily | null = null;

  for (const word of words) {
    if (FAMILY_WORDS[word]) {
      family = FAMILY_WORDS[word];
    } else if (QUALIFIER_WORDS.includes(word)) {
      qualifiers.push(word[0]!.toUpperCase() + word.slice(1));
    }
  }

  if (!family) {
    return { colorFamily: "Other", qualifier: normalized, isPlaceholder: false };
  }

  // "Peach" resolved to Orange above via a direct family mapping, but it's
  // shade-sensitive enough that it should always carry a visible qualifier.
  if (lower === "peach") {
    return { colorFamily: "Orange", qualifier: "Peach", isPlaceholder: false };
  }

  return {
    colorFamily: family,
    qualifier: qualifiers.length > 0 ? qualifiers.join(" ") : null,
    isPlaceholder: false,
  };
}

const WEIGHT_MAP: Record<string, YarnWeight> = {
  fingering: "fingering",
  "fingering-weight": "fingering",
  medium: "medium",
  "medium-weight": "medium",
  "medium-": "medium",
  aran: "aran",
  "aran-weight": "aran",
  bulky: "bulky",
  "bulky-weight": "bulky",
  "bulky-": "bulky",
};

export function classifyWeight(raw: string): YarnWeight {
  const key = raw.trim().toLowerCase();
  return WEIGHT_MAP[key] ?? "unknown";
}

export function parseAmountYds(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  const n = Number.parseFloat(trimmed);
  return Number.isFinite(n) ? n : null;
}
