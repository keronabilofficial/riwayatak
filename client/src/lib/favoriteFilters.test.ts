import { describe, expect, it } from "vitest";
import { filterAndSortFavorites } from "./favoriteFilters";

const items = [
  { title: "ألف", authorName: "كاتب أ", progressPercent: 80, isCompleted: false, personalRating: 5, personalNote: "ملاحظة", totalReadingSeconds: 120 },
  { title: "باء", authorName: "كاتب ب", progressPercent: 0, isCompleted: false, personalRating: null, personalNote: null, totalReadingSeconds: 0 },
  { title: "جيم", authorName: "كاتب ج", progressPercent: 100, isCompleted: true, personalRating: 3, personalNote: "قائمة", totalReadingSeconds: 300 },
];

describe("فلاتر وفرز المكتبة", () => {
  it("يُبقي الروايات قيد القراءة فقط", () => {
    expect(filterAndSortFavorites(items, { query: "", status: "in_progress", rating: "all", note: "all", sort: "recent" }).map(item => item.title)).toEqual(["ألف"]);
  });

  it("يُرشح التقييمات المرتفعة والملاحظات الموجودة", () => {
    expect(filterAndSortFavorites(items, { query: "", status: "all", rating: "four_plus", note: "with_note", sort: "recent" }).map(item => item.title)).toEqual(["ألف"]);
  });

  it("يفرز حسب وقت القراءة من الأعلى إلى الأقل", () => {
    expect(filterAndSortFavorites(items, { query: "", status: "all", rating: "all", note: "all", sort: "reading_time" }).map(item => item.title)).toEqual(["جيم", "ألف", "باء"]);
  });
});
