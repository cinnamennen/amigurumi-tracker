/**
 * One-time (re-run only when patterns change) generation script: scans the
 * real source PDFs for sewing/embroidery/safety-eye mentions and freezes
 * the result as a fixture, the same pattern as frozenOutput.json. This is
 * NOT run as part of `build:catalog` or CI -- the source/ folder is
 * private and gitignored (see AGENTS.md's guardrails), so it only exists on
 * a machine that has the real PDFs. buildCatalog.ts reads the frozen
 * fixture this produces, never the PDFs directly.
 *
 * Run manually with: pnpm --filter @amigurumi/pipeline run generate:sewing-signal
 */

import { mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { classifySewingAmount, countSewingMentions } from "./sewingSignal.js";
import { extractText } from "./extraction.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE_ROOT = join(__dirname, "../../../source");
const FIXTURE_PATH = join(__dirname, "__tests__/fixtures/frozenOutput.json");
const OUTPUT_PATH = join(__dirname, "__tests__/fixtures/sewingSignal.json");

interface CrosswalkRow {
  tracker_name: string;
  category: string;
  pdf_file: string | null;
  pdf_path: string;
}

interface FrozenOutput {
  crosswalk: CrosswalkRow[];
}

function walkPdfs(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walkPdfs(p));
    else if (entry.toLowerCase().endsWith(".pdf")) out.push(p);
  }
  return out;
}

async function main() {
  const { readFileSync } = await import("node:fs");
  const data = JSON.parse(readFileSync(FIXTURE_PATH, "utf-8")) as FrozenOutput;

  const available = new Set(walkPdfs(SOURCE_ROOT));
  const results: Record<string, { sewingAmount: string; sew: number; embroider: number; safetyEye: number }> = {};

  let processed = 0;
  let missing = 0;
  let failed = 0;

  for (const row of data.crosswalk) {
    if (!row.pdf_file || !row.pdf_path) continue;
    const absPath = join(SOURCE_ROOT, row.pdf_path.replace(/^\.\//, ""));
    if (!available.has(absPath)) {
      missing++;
      continue;
    }
    try {
      const text = await extractText(absPath);
      const counts = countSewingMentions(text);
      results[row.pdf_file] = { sewingAmount: classifySewingAmount(text), ...counts };
      processed++;
    } catch {
      // Scanned/image-only PDF with no text layer -- OCR fallback isn't
      // implemented yet (extraction.ts), so this pattern stays "unknown".
      failed++;
    }
  }

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2) + "\n", "utf-8");
  console.log(`Processed ${processed}, missing ${missing}, failed (needs OCR) ${failed}. Wrote ${OUTPUT_PATH}`);
}

main();
