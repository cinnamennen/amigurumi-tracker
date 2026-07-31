import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { classifyColor, classifyWeight, isPlaceholderColor, parseAmountYds } from "../colorRecords.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = JSON.parse(
  readFileSync(join(__dirname, "fixtures/frozenOutput.json"), "utf-8"),
) as {
  materialRows: { file: string; color: string; weight: string; amount_yds: string }[];
};

describe("classifyColor against the real dataset", () => {
  it("classifies every raw color string from frozenOutput.json without throwing", () => {
    for (const row of fixture.materialRows) {
      expect(() => classifyColor(row.color)).not.toThrow();
    }
  });
});

describe("classifyColor documented edge cases", () => {
  it("handles the Chococat OCR artifacts (trailing dash/equals leftovers)", () => {
    // Chococat.pdf's filename has a trailing space (a separate join-key bug,
    // fixed in buildCatalog.ts) -- here we just confirm its OCR-messy color
    // strings still classify cleanly.
    expect(classifyColor("White -")).toEqual({ colorFamily: "White", qualifier: null, isPlaceholder: false });
    expect(classifyColor("Blue -")).toEqual({ colorFamily: "Blue", qualifier: null, isPlaceholder: false });
    expect(classifyColor("Brown -")).toEqual({ colorFamily: "Brown", qualifier: null, isPlaceholder: false });
    // "Yellow - =" has a stray "=" that isn't stripped by normalize() (only
    // trailing dashes/underscores are) -- it should still resolve to Yellow.
    expect(classifyColor("Yellow - =")).toEqual({ colorFamily: "Yellow", qualifier: null, isPlaceholder: false });
  });

  it("resolves the four distinct Fred patterns' colors despite the product-line suffixes", () => {
    // Fred the Dinosaur vs Fred the Dinosaur Loopable are two different
    // patterns (see buildCatalog.ts join-key tests) that happen to share a
    // base color word plus a product-line suffix ("Loopable", "Extra
    // Squeezy") that normalize() strips -- confirm that doesn't bleed into a
    // different family.
    expect(classifyColor("Green")).toEqual({ colorFamily: "Green", qualifier: null, isPlaceholder: false });
    expect(classifyColor("Green Loopable")).toEqual({ colorFamily: "Green", qualifier: null, isPlaceholder: false });
    expect(classifyColor("Green Extra Squeezy")).toEqual({
      colorFamily: "Green",
      qualifier: null,
      isPlaceholder: false,
    });
    expect(classifyColor("Yellow Extra Squeezy")).toEqual({
      colorFamily: "Yellow",
      qualifier: null,
      isPlaceholder: false,
    });
  });

  it("flags 'Skin color' as a placeholder, not a real color family", () => {
    const result = classifyColor("Skin color");
    expect(result).toEqual({ colorFamily: "Other", qualifier: null, isPlaceholder: true });
    expect(isPlaceholderColor("skin color")).toBe(true);
  });

  it("keeps a compound colorway as one unsplit unit ('Dark Blue and Blue')", () => {
    expect(classifyColor("Dark Blue and Blue")).toEqual({
      colorFamily: "Other",
      qualifier: "Dark Blue and Blue",
      isPlaceholder: false,
    });
    // Comma-separated compounds hit the same rule.
    expect(classifyColor("Dark Brown, Yellow, and Black")).toEqual({
      colorFamily: "Other",
      qualifier: "Dark Brown, Yellow, and Black",
      isPlaceholder: false,
    });
  });

  it("drops junk rows (extraction failures, non-Woobles patterns) as null", () => {
    expect(classifyColor("could not extract - needs manual review of source PDF")).toBeNull();
    expect(classifyColor("NOT A WOOBLES PATTERN - third-party pattern")).toBeNull();
    expect(classifyColor("374-page compiled book/index - individual patterns already covered elsewhere")).toBeNull();
  });
});

describe("classifyWeight", () => {
  it("normalizes messy weight strings seen in the source data", () => {
    expect(classifyWeight("medium-weight")).toBe("medium");
    expect(classifyWeight("medium-")).toBe("medium");
    expect(classifyWeight("bulky-")).toBe("bulky");
    expect(classifyWeight("aran-weight")).toBe("aran");
    expect(classifyWeight("fingering-weight")).toBe("fingering");
  });

  it("falls back to 'unknown' for blank or non-standard values", () => {
    expect(classifyWeight("")).toBe("unknown");
    expect(classifyWeight("n/a")).toBe("unknown");
  });
});

describe("parseAmountYds", () => {
  it("parses plain numeric strings", () => {
    expect(parseAmountYds("36")).toBe(36);
    expect(parseAmountYds("0.5")).toBe(0.5);
  });

  it("parses the leading number out of messy amount strings", () => {
    expect(parseAmountYds("1 each")).toBe(1);
    expect(parseAmountYds("12 each")).toBe(12);
    expect(parseAmountYds("1 (unclear in source)")).toBe(1);
  });

  it("returns null for blank or non-numeric values", () => {
    expect(parseAmountYds("")).toBeNull();
    expect(parseAmountYds("n/a")).toBeNull();
  });
});
