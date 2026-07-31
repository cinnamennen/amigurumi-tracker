import type { SewingAmount } from "@amigurumi/schema";

/**
 * Rough sewing-amount heuristic: scans full PDF text (not just the
 * materials page -- sewing/embroidery instructions live in the assembly
 * steps) for mentions of the three things that mean "you're using a needle
 * for something other than crochet": sewing pieces together, embroidering
 * facial features, and attaching safety eyes. Counts every match and buckets
 * the total.
 *
 * Deliberately a flat keyword count, not weighted per-keyword or
 * NLP-scored -- if a pattern gets misclassified, `debugSewingSignal` shows
 * exactly which words matched where, so the fix is "adjust a regex or a
 * threshold," never "retrain something."
 */

const SEW_RE = /\bsew(?:s|ing|n)?\b/gi;
const EMBROIDER_RE = /\bembroider\w*/gi;
const SAFETY_EYE_RE = /safety[\s-]?eyes?/gi;

export interface SewingSignalCounts {
  sew: number;
  embroider: number;
  safetyEye: number;
  total: number;
}

export function countSewingMentions(fullText: string): SewingSignalCounts {
  const sew = fullText.match(SEW_RE)?.length ?? 0;
  const embroider = fullText.match(EMBROIDER_RE)?.length ?? 0;
  const safetyEye = fullText.match(SAFETY_EYE_RE)?.length ?? 0;
  return { sew, embroider, safetyEye, total: sew + embroider + safetyEye };
}

/**
 * Thresholds calibrated against a spread sample of real pattern text (see
 * ami-fcq.19's closing notes for the sample): 0 mentions is "none" (e.g. a
 * simple flat accessory with no assembly), 1-3 is "low" (a couple of pieces
 * sewn together or one embroidered feature), 4-7 is "medium" (a typical
 * multi-piece animal with embroidered face + safety eyes), 8+ is "high"
 * (heavily assembled pieces, e.g. a large multi-part character).
 */
export function classifySewingAmount(fullText: string): SewingAmount {
  const { total } = countSewingMentions(fullText);
  if (total === 0) return "none";
  if (total <= 3) return "low";
  if (total <= 7) return "medium";
  return "high";
}
