#!/usr/bin/env node
// Guardrail: this repo must never contain the actual pattern PDFs/docs.
// Hard-rejects the commit if any staged file matches a banned extension,
// as a second line of defense behind .gitignore (e.g. against `git add -f`).
import { execSync } from "node:child_process";

const BANNED_EXTENSIONS = [".pdf", ".docx", ".doc", ".xlsx", ".xls"];

const staged = execSync("git diff --cached --name-only --diff-filter=ACM", {
  encoding: "utf8",
})
  .split("\n")
  .filter(Boolean);

const offenders = staged.filter((file) =>
  BANNED_EXTENSIONS.some((ext) => file.toLowerCase().endsWith(ext)),
);

if (offenders.length > 0) {
  console.error("\n✖ Commit blocked: pattern source files must never be committed.\n");
  for (const file of offenders) {
    console.error(`  - ${file}`);
  }
  console.error(
    "\nThese belong in source/ (gitignored), not in the repo. If this is a false\n" +
      "positive, fix the extension list in scripts/check-no-pattern-files.mjs —\n" +
      "don't bypass with --no-verify.\n",
  );
  process.exit(1);
}
