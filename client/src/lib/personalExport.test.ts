import { describe, expect, it } from "vitest";
import { buildPersonalExportText } from "./personalExport";

describe("تصدير المقتنيات الشخصية", () => {
  it("يجمع الملاحظات والتقييمات والاقتباسات في نص عربي واضح", () => {
    const result = buildPersonalExportText(
      [{ title: "رواية الليل", rating: 5, note: "نهاية مؤثرة" }],
      [{ novelTitle: "رواية الليل", chapterTitle: "الفصل الأول", selectedText: "كان المساء هادئًا" }],
    );
    expect(result).toContain("رواية الليل — تقييمي: 5/5");
    expect(result).toContain("نهاية مؤثرة");
    expect(result).toContain("«كان المساء هادئًا»");
  });

  it("يقدم رسالة مفهومة عند عدم وجود مقتنيات", () => {
    expect(buildPersonalExportText([], [])).toContain("لا توجد ملاحظات أو اقتباسات محفوظة بعد");
  });
});
