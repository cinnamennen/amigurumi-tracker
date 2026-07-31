import type { ColorFamily, MaterialRow } from "@amigurumi/schema";

/**
 * Family-level yardage totals needed across a set of materials (summing
 * multiple materials in the same family within one pattern), ignoring
 * placeholder "your choice" materials and rows with no captured yardage.
 * Shared by What Can I Make (stash covers this?) and the Shopping List
 * (how much more do I need to buy?) -- same aggregation, different
 * comparison against stash.
 */
export function neededByFamily(materials: MaterialRow[]): Partial<Record<ColorFamily, number>> {
  const totals: Partial<Record<ColorFamily, number>> = {};
  for (const m of materials) {
    if (m.isPlaceholder || m.amountYds === null) continue;
    totals[m.colorFamily] = (totals[m.colorFamily] ?? 0) + m.amountYds;
  }
  return totals;
}
