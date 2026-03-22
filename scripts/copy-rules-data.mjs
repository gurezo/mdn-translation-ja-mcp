/**
 * tsc は rules/ を dist にコピーしないため、ルール JSON とスキーマを dist/rules/ に複製する。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const srcDir = path.join(root, "rules");
const destDir = path.join(root, "dist", "rules");

const files = [
  "rule-category.schema.json",
  "editorial.rules.json",
  "l10n.rules.json",
  "glossary.rules.json",
  "style.rules.json",
  "mozilla-glossary-excerpt.json",
  "mozilla-glossary-excerpt.schema.json",
  "style-rules.json",
  "style-rules.schema.json",
  "prohibited-expressions.json",
  "prohibited-expressions.schema.json",
];

const obsoleteInDest = ["translation-rules.json", "translation-rules.schema.json"];

fs.mkdirSync(destDir, { recursive: true });
for (const name of obsoleteInDest) {
  const p = path.join(destDir, name);
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
  }
}
for (const name of files) {
  fs.copyFileSync(path.join(srcDir, name), path.join(destDir, name));
}
