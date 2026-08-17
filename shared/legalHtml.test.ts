import { describe, expect, it } from "vitest";
import { sanitizeLegalHtml } from "./legalHtml";

describe("sanitizeLegalHtml", () => {
  it("keeps supported formatting, lists, and safe links", () => {
    const html = sanitizeLegalHtml('<p><strong>عنوان</strong></p><ul><li>نقطة</li></ul><a href="https://example.com">رابط</a>');
    expect(html).toContain("<strong>عنوان</strong>");
    expect(html).toContain("<ul><li>نقطة</li></ul>");
    expect(html).toContain('href="https://example.com"');
  });

  it("removes scripts and unsafe link protocols", () => {
    const html = sanitizeLegalHtml('<script>alert(1)</script><a href="javascript:alert(1)">خطر</a>');
    expect(html).not.toContain("script");
    expect(html).not.toContain("javascript:");
    expect(html).toContain("<a>خطر</a>");
  });
});
