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

const files = ["translation-rules.json", "translation-rules.schema.json"];

fs.mkdirSync(destDir, { recursive: true });
for (const name of files) {
  fs.copyFileSync(path.join(srcDir, name), path.join(destDir, name));
}
