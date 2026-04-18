import { describe, expect, it } from "vitest";

import { docUrlToEnUsContentRelativePath } from "./mdn-url-resolve.js";

describe("docUrlToEnUsContentRelativePath", () => {
  it("Glossary の URL を files/en-us 相対パスに変換する（URL 側の docs は含めない）", () => {
    expect(
      docUrlToEnUsContentRelativePath(
        "https://developer.mozilla.org/en-US/docs/Glossary/Symbol",
      ),
    ).toBe("files/en-us/glossary/symbol/index.md");
  });

  it("Web/API の URL も docs を含めずに変換する", () => {
    expect(
      docUrlToEnUsContentRelativePath(
        "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/",
      ),
    ).toBe("files/en-us/web/api/fetch_api/index.md");
  });

  it("developer.mozilla.org 以外はエラー", () => {
    expect(() =>
      docUrlToEnUsContentRelativePath("https://example.com/en-US/docs/Foo"),
    ).toThrow();
  });

  it("/en-US/docs/ が含まれない URL はエラー", () => {
    expect(() =>
      docUrlToEnUsContentRelativePath(
        "https://developer.mozilla.org/en-US/plus/",
      ),
    ).toThrow();
  });
});
