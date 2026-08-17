import { describe, expect, it } from "vitest";
import { defaultLibraryPreferences, parseLibraryPreferences, parseReaderFontScale } from "./readerPreferences";

describe("تفضيلات القراءة والمكتبة", () => {
  it("يعيد حجم الخط الافتراضي عند قيمة غير صالحة", () => {
    expect(parseReaderFontScale("2")).toBe(1.22);
    expect(parseReaderFontScale("not-a-number")).toBe(1.22);
  });

  it("يقبل حجم الخط المحفوظ داخل النطاق", () => {
    expect(parseReaderFontScale("1.42")).toBe(1.42);
  });

  it("يستعيد تفضيلات المكتبة ويملأ القيم الغائبة", () => {
    const preferences = parseLibraryPreferences(JSON.stringify({ sort: "rating", status: "completed" }));
    expect(preferences.sort).toBe("rating");
    expect(preferences.status).toBe("completed");
    expect(preferences.category).toBe(defaultLibraryPreferences.category);
  });

  it("يتعامل مع JSON التالف بأمان", () => {
    expect(parseLibraryPreferences("{").sort).toBe("recent");
  });
});
