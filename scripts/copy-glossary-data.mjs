/**
 * tsc は JSON を dist にコピーしないため、用語集ファイルを dist/shared/data に複製する。
 * （glossary-loader は dist/shared に出力され、既定パスはその直下の data/ を参照する）
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const srcFile = path.join(root, "src", "shared", "data", "glossary-terms.json");
const destDir = path.join(root, "dist", "shared", "data");
const destFile = path.join(destDir, "glossary-terms.json");

fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(srcFile, destFile);
