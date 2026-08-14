import { describe, expect, it } from "vitest";
import { getPlanPresentation } from "./planPresentation";

describe("عرض صفحة الباقات", () => {
  it("يعكس نصوص وألوان الإعدادات المحفوظة بدل القيم الافتراضية", () => {
    const presentation = getPlanPresentation({ platformName: "مكتبتي", accentColor: "#224466", plansTitle: "خطط القراءة", checkoutTitle: "ادفع بأمان" });
    expect(presentation).toMatchObject({ platformName: "مكتبتي", accentColor: "#224466", plansTitle: "خطط القراءة", checkoutTitle: "ادفع بأمان" });
  });
});
