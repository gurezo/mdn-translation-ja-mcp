/**
 * tsc は JSON を dist にコピーしないため、shared/data の JSON を dist/shared/data に複製する。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const srcDir = path.join(root, "src", "shared", "data");
const destDir = path.join(root, "dist", "shared", "data");

const files = ["glossary-terms.json", "prohibited-expressions.json"];

fs.mkdirSync(destDir, { recursive: true });
for (const name of files) {
  fs.copyFileSync(path.join(srcDir, name), path.join(destDir, name));
}
