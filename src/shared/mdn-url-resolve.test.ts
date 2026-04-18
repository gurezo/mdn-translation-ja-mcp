import { describe, expect, it } from "vitest";

import { docUrlToEnUsContentRelativePath } from "./mdn-url-resolve.js";

describe("docUrlToEnUsContentRelativePath", () => {
  it("Glossary の URL を files/en-us 相対パスに変換する", () => {
    expect(
      docUrlToEnUsContentRelativePath(
        "https://developer.mozilla.org/en-US/docs/Glossary/Symbol",
      ),
    ).toBe("files/en-us/docs/glossary/symbol/index.md");
  });

  it("末尾スラッシュを許容する", () => {
    expect(
      docUrlToEnUsContentRelativePath(
        "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/",
      ),
    ).toBe("files/en-us/docs/web/api/fetch_api/index.md");
  });

  it("developer.mozilla.org 以外はエラー", () => {
    expect(() =>
      docUrlToEnUsContentRelativePath("https://example.com/en-US/docs/Foo"),
    ).toThrow();
  });
});
