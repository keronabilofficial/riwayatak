import { describe, expect, it } from "vitest";
import { canAuthorReply } from "./authorReply";

describe("صلاحية رد المؤلف", () => {
  it("يسمح لمالك الرواية بالرد على فصل منشور", () => {
    expect(canAuthorReply({ chapterStatus: "published", ownerId: 7, userId: 7 })).toBe(true);
  });

  it("يرفض غير المالك أو الفصل غير المنشور", () => {
    expect(canAuthorReply({ chapterStatus: "published", ownerId: 7, userId: 8 })).toBe(false);
    expect(canAuthorReply({ chapterStatus: "draft", ownerId: 7, userId: 7 })).toBe(false);
  });
});
