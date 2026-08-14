import { describe, expect, it } from "vitest";
import { getCycleEndDate, getSubscriptionOption, isFreePreviewChapter } from "./subscriptions";

describe("باقات الاشتراك", () => {
  it("يعيد حدود Go الشهرية المعتمدة", () => {
    expect(getSubscriptionOption("go", "monthly")).toMatchObject({ priceEgp: 50, novelLimit: 10, audioChapterLimitPerNovel: 2 });
  });

  it("يعيد بدائل Ultra وEnterprise ومددها المعتمدة", () => {
    expect(getSubscriptionOption("ultra", "quarterly")).toMatchObject({ priceEgp: 500, novelLimit: 50, audioChapterLimitPerNovel: 10 });
    expect(getSubscriptionOption("enterprise", "yearly")).toMatchObject({ priceEgp: 1000, novelLimit: 100, audioChapterLimitPerNovel: null });
  });

  it("يحافظ على معاينة الفصلين الأولين قبل احتساب الرواية", () => {
    expect(isFreePreviewChapter(1)).toBe(true);
    expect(isFreePreviewChapter(2)).toBe(true);
    expect(isFreePreviewChapter(3)).toBe(false);
  });

  it("يحسب نهاية دورة التسعين يومًا والستة أشهر بصورة صحيحة", () => {
    const startsAt = new Date("2026-01-15T00:00:00.000Z");
    expect(getCycleEndDate(startsAt, "quarterly").toISOString()).toBe("2026-04-15T00:00:00.000Z");
    expect(getCycleEndDate(startsAt, "six_months").toISOString()).toBe("2026-07-15T00:00:00.000Z");
  });
});
