import { describe, expect, it } from "vitest";
import { matchesPersonalDate, matchesPersonalNovel } from "./personalCollectionFilters";

describe("تصفية المقتنيات الشخصية", () => {
  const now = new Date("2026-08-17T12:00:00Z");
  it("يميز العناصر الحديثة والقديمة", () => {
    expect(matchesPersonalDate("2026-08-15T12:00:00Z", "last7", now)).toBe(true);
    expect(matchesPersonalDate("2026-07-01T12:00:00Z", "last30", now)).toBe(false);
    expect(matchesPersonalDate("2026-07-01T12:00:00Z", "older", now)).toBe(true);
  });
  it("يطابق الرواية المختارة أو يعرض الجميع", () => {
    expect(matchesPersonalNovel("رواية الليل", "رواية الليل")).toBe(true);
    expect(matchesPersonalNovel("رواية النهار", "رواية الليل")).toBe(false);
    expect(matchesPersonalNovel("رواية النهار", "all")).toBe(true);
  });
});
