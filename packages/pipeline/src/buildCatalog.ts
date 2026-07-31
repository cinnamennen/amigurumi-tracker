import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { Catalog, type MaterialRow, type Pattern, type SewingAmount, type SkillLevel } from "@amigurumi/schema";

import { classifyColor, classifyWeight, parseAmountYds } from "./colorRecords.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const FIXTURE_PATH = join(__dirname, "__tests__/fixtures/frozenOutput.json");
// Generated once by `pnpm run generate:sewing-signal` against the real
// (gitignored) source PDFs -- see generateSewingSignal.ts. Falls back to
// "unknown" per-pattern below if a pdf_file has no entry (e.g. this fixture
// predates a pattern, or that PDF needed OCR that isn't implemented yet).
const SEWING_SIGNAL_PATH = join(__dirname, "__tests__/fixtures/sewingSignal.json");
const OUTPUT_PATH = join(__dirname, "../../web/src/data/patterns.json");

interface TrackerRow {
  name: string;
  animal_food: string | null;
  category: string;
  skill_level: string;
  have_it: boolean;
  completed: boolean;
  location: string | null;
  pdf_file: string | null;
}

interface MaterialRowRaw {
  folder: string;
  file: string;
  path: string;
  status: string;
  color: string;
  weight: string;
  amount_yds: string;
}

interface CrosswalkRow {
  tracker_name: string;
  animal: string | null;
  category: string;
  have_it: boolean;
  pdf_file: string | null;
  pdf_path: string;
  match_method: string;
  note: string;
}

interface FrozenOutput {
  description: string;
  sheet1Tracker: TrackerRow[];
  materialRows: MaterialRowRaw[];
  crosswalk: CrosswalkRow[];
}

function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// "Animal>Dinosaurs" -> ["Animal", "Dinosaurs"]
function tagsFromLocation(location: string | null): string[] {
  if (!location) return [];
  return location
    .split(">")
    .map((s) => s.trim())
    .filter(Boolean);
}

// "./Animals/Dinosaurs/Fred the Dinosaur.pdf" -> ["Animals", "Dinosaurs"] (folder segments, no filename)
function tagsFromPdfPath(pdfPath: string): string[] {
  const segments = pdfPath.split("/").filter((s) => s && s !== ".");
  return segments.slice(0, -1);
}

const SKILL_LEVELS: ReadonlySet<string> = new Set(["Beginner", "Beginner +", "Intermediate"]);

function toSkillLevel(raw: string): SkillLevel {
  return SKILL_LEVELS.has(raw) ? (raw as SkillLevel) : "Unknown";
}

function buildMaterials(rows: MaterialRowRaw[]): MaterialRow[] {
  const materials: MaterialRow[] = [];
  for (const row of rows) {
    const classification = classifyColor(row.color);
    if (!classification) continue; // junk row (not a real color)
    materials.push({
      colorRaw: row.color,
      colorFamily: classification.colorFamily,
      qualifier: classification.qualifier,
      isPlaceholder: classification.isPlaceholder,
      weight: classifyWeight(row.weight),
      amountYds: parseAmountYds(row.amount_yds),
    });
  }
  return materials;
}

function crosswalkKey(name: string, category: string): string {
  return name + "::" + category;
}

interface SewingSignalEntry {
  sewingAmount: SewingAmount;
}

function buildCatalog(): Pattern[] {
  const raw = readFileSync(FIXTURE_PATH, "utf-8");
  const data = JSON.parse(raw) as FrozenOutput;
  const sewingSignal = JSON.parse(readFileSync(SEWING_SIGNAL_PATH, "utf-8")) as Record<string, SewingSignalEntry>;

  const crosswalkByKey = new Map<string, CrosswalkRow>();
  for (const row of data.crosswalk) {
    crosswalkByKey.set(crosswalkKey(row.tracker_name, row.category), row);
  }

  const materialRowsByFile = new Map<string, MaterialRowRaw[]>();
  for (const row of data.materialRows) {
    const existing = materialRowsByFile.get(row.file);
    if (existing) {
      existing.push(row);
    } else {
      materialRowsByFile.set(row.file, [row]);
    }
  }

  const patterns: Pattern[] = [];
  for (const tracker of data.sheet1Tracker) {
    const crosswalk = crosswalkByKey.get(crosswalkKey(tracker.name, tracker.category));
    // Tracker rows with no matched PDF (never had a materials page, or
    // have_it=false and nothing to match) aren't real catalog entries yet —
    // see crosswalk match_method "correctly_unowned"/"confirmed_gap" in
    // frozenOutput.json. Skip them; 664 tracker rows -> 654 catalog entries.
    if (!crosswalk || !crosswalk.pdf_file) continue;
    const pdfFile = crosswalk.pdf_file;

    const materials = buildMaterials(materialRowsByFile.get(pdfFile) ?? []);
    const collectionTags = crosswalk.pdf_path
      ? tagsFromPdfPath(crosswalk.pdf_path)
      : tagsFromLocation(tracker.location);

    patterns.push({
      id: slugify(tracker.name + "-" + tracker.category),
      name: tracker.name.trim(),
      category: tracker.category,
      subcategory: tracker.animal_food,
      collectionTags,
      skillLevel: toSkillLevel(tracker.skill_level),
      sewingAmount: sewingSignal[pdfFile]?.sewingAmount ?? "unknown",
      materials,
      haveIt: tracker.have_it,
      completed: tracker.completed,
      purchaseUrl: null,
      imageUrl: null,
      tags: [],
    });
  }

  return Catalog.parse(patterns);
}

function main() {
  const catalog = buildCatalog();
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(catalog, null, 2) + "\n", "utf-8");
  console.log("Wrote " + catalog.length + " patterns to " + OUTPUT_PATH);
}

main();
