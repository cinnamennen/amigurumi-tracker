/**
 * TS port of the extraction step that originally produced
 * frozenOutput.json (see AGENTS.md's "PDF structure" section for the three
 * layout families and why ~93/654 PDFs need OCR). Today's 654 patterns are
 * already fully covered by that frozen fixture, so none of this needs to
 * run yet -- it exists so that adding the *next* new pattern PDF has an
 * obvious place to wire in real pdfjs-dist/tesseract.js logic, rather than
 * requiring the old (deleted) Python environment.
 *
 * Implement each function when the first new pattern actually needs adding.
 */

export interface ExtractedMaterialRow {
  color: string;
  weight: string;
  amountYds: string;
}

/**
 * Extracts raw text from a PDF's materials page via pdfjs-dist. Works for
 * the modern icon-grid and older numbered-legend layouts, which have real
 * embedded text. Throws for scanned/image-only PDFs -- callers should fall
 * back to extractOcr.
 */
export function extractText(_pdfPath: string): Promise<string> {
  throw new Error("extractText: not yet implemented -- wire in pdfjs-dist when the first new pattern needs it");
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
