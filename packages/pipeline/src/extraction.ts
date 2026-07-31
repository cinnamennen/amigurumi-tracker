/**
 * TS port of the extraction step that originally produced
 * frozenOutput.json (see AGENTS.md's "PDF structure" section for the three
 * layout families and why ~93/654 PDFs need OCR). The materials-page parsing
 * that fed the v1 catalog is already fully covered by that frozen fixture
 * and doesn't need to run again -- extractText is implemented for real
 * because sewingSignal.ts's one-time fixture generation (see
 * generateSewingSignal.ts) needs to scan *full* PDF text, not just the
 * materials page. extractOcr/parseMaterials stay stubs until the first new
 * pattern actually needs adding (they're for the materials-page pipeline,
 * not sewing-signal scanning).
 */

import { readFileSync } from "node:fs";

// pdfjs-dist ships its Node-compatible build under this subpath; the
// package's default export targets browsers and breaks under plain Node.
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

export interface ExtractedMaterialRow {
  color: string;
  weight: string;
  amountYds: string;
}

/**
 * Extracts all embedded text from a PDF, page by page, via pdfjs-dist.
 * Works for the modern icon-grid and older numbered-legend layouts, which
 * have a real text layer. Returns an empty string (not a throw) for
 * scanned/image-only PDFs with no text layer -- callers that need those
 * pages should fall back to extractOcr.
 */
export async function extractText(pdfPath: string): Promise<string> {
  const data = new Uint8Array(readFileSync(pdfPath));
  const doc = await pdfjsLib.getDocument({ data }).promise;
  let text = "";
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    text += content.items.map((item) => ("str" in item ? item.str : "")).join(" ") + "\n";
  }
  return text;
}

/**
 * OCR fallback (pdftoppm + tesseract.js) for the ~93/654 scanned/image-only
 * PDFs where extractText finds no embedded text layer.
 */
export function extractOcr(_pdfPath: string): Promise<string> {
  throw new Error("extractOcr: not yet implemented -- wire in tesseract.js when the first new pattern needs it");
}

/**
 * Parses raw materials-page text (from either extractText or extractOcr)
 * into structured color/weight/amount rows, using geometric word-band
 * grouping (see AGENTS.md's "PDF structure" note on the icon-grid layout).
 */
export function parseMaterials(_rawText: string): ExtractedMaterialRow[] {
  throw new Error("parseMaterials: not yet implemented -- wire in geometric word-band parsing when needed");
}
