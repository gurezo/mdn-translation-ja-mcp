/**
 * docs:build の出力に、公開に必要な HTML と静的 asset があることを確認する。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const docsDir = path.join(root, "docs");

const requiredFiles = [
  "index.html",
  "assets/style.css",
  "assets/main.js",
  "assets/search.js",
  "assets/navigation.js",
  "assets/icons.svg",
];

const requiredHtmlDirs = ["documents", "functions"];

function isNonEmptyFile(file) {
  try {
    const stat = fs.statSync(file);
    return stat.isFile() && stat.size > 0;
  } catch {
    return false;
  }
}

function hasHtml(dir) {
  try {
    return fs.readdirSync(dir).some((name) => name.endsWith(".html"));
  } catch {
    return false;
  }
}

const missing = [];

for (const rel of requiredFiles) {
  if (!isNonEmptyFile(path.join(docsDir, rel))) {
    missing.push(rel);
  }
}

for (const rel of requiredHtmlDirs) {
  if (!hasHtml(path.join(docsDir, rel))) {
    missing.push(`${rel}/*.html`);
  }
}

if (missing.length > 0) {
  console.error("docs に必要なファイルがありません:");
  for (const item of missing) {
    console.error(`- ${item}`);
  }
  process.exit(1);
}
