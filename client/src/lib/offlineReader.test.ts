import { describe, expect, it } from "vitest";
import { canCacheChapter, offlineChapterKey } from "./offlineReader";

describe("القراءة دون اتصال", () => {
  it("يسمح بتخزين فصل متاح بنص فعلي فقط", () => {
    expect(canCacheChapter(true, "محتوى عربي")).toBe(true);
    expect(canCacheChapter(false, "محتوى عربي")).toBe(false);
    expect(canCacheChapter(true, "   ")).toBe(false);
  });

  it("ينشئ مفتاحًا منفصلًا لكل رواية وفصل", () => {
    expect(offlineChapterKey("novel", "chapter-1")).toBe("riwayatak:offline:novel:chapter-1");
    expect(offlineChapterKey("novel", "chapter-2")).not.toBe(offlineChapterKey("novel", "chapter-1"));
  });
});
