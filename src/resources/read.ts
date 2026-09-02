import fs from "node:fs";

import { findGuidelineResource } from "./catalog.js";

export type ResourceFileContent = {
  uri: string;
  mimeType: string;
  text: string;
};

/** カタログ上の正本ファイルをそのまま返す（JSON は再シリアライズしない） */
export function readGuidelineResource(
  uri: string | URL,
): ResourceFileContent[] {
  const entry = findGuidelineResource(uri);
  if (!entry) {
    const href = typeof uri === "string" ? uri : uri.href;
    throw new Error(`未知の Resource URI: ${href}`);
  }
  return entry.getFilePaths().map((filePath) => ({
    uri: entry.uri,
    mimeType: entry.mimeType,
    text: fs.readFileSync(filePath, "utf8"),
  }));
}
