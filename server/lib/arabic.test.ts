import { describe, expect, it } from "vitest";
import { normalizeArabic, toSlug } from "./arabic";

describe("تطبيع العربية", () => {
  it("يوحد الألف والياء ويزيل التشكيل والتطويل من استعلام البحث", () => {
    expect(normalizeArabic("إلـى  الرِّوايَةِ")).toBe("الي الروايه");
  });

  it("ينتج رابطًا ثابتًا قابلًا للمشاركة من العنوان العربي", () => {
    expect(toSlug("ظلالُ المدينة 2026")).toBe("ظلال-المدينه-2026");
  });

  it("يعالج اختلافات الحروف الشائعة في أسماء التصنيفات والوسوم", () => {
    expect(normalizeArabic("رُعْب وإثارة")).toBe(normalizeArabic("رعب واثاره"));
  });
});
