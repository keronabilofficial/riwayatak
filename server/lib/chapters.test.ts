import { describe, expect, it } from "vitest";
import { mapChapterOrder } from "./chapters";

describe("ترتيب الفصول", () => {
  it("يعيد ترقيم الفصول تسلسليًا وفق ترتيب الإدارة", () => {
    expect(mapChapterOrder([31, 9, 18])).toEqual([{ id: 31, sortOrder: 1 }, { id: 9, sortOrder: 2 }, { id: 18, sortOrder: 3 }]);
  });
  it("يرفض ترتيبًا يحتوي على فصل مكرر", () => {
    expect(() => mapChapterOrder([4, 4])).toThrow("المكررة");
  });
});
