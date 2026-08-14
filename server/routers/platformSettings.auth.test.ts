import { describe, expect, it } from "vitest";
import { platformSettingsRouter } from "./platformSettings";

describe("صلاحيات إعدادات المنصة", () => {
  it("يرفض الوصول إلى إعدادات الباقات والمظهر من دون دور مدير", async () => {
    const caller = platformSettingsRouter.createCaller({ user: { id: 1, role: "user" } } as never);
    await expect(caller.admin.get()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("يرفض حفظ المظهر والباقات من مستخدم غير مدير", async () => {
    const caller = platformSettingsRouter.createCaller({ user: { id: 1, role: "user" } } as never);
    const appearance = { platformName: "روايتي", tagline: "عبارة", heroEyebrow: "مساحة أدبية", heroTitle: "عنوان الحكاية", heroHighlight: "متجدد", heroDescription: "وصف مناسب لاختبار صلاحيات حفظ إعدادات المظهر في لوحة الإدارة.", heroImageUrl: "/manus-storage/test.jpg", accentColor: "#224466", primaryColor: "#102030", plansEyebrow: "عضوية", plansTitle: "خطط جديدة", plansDescription: "وصف صفحة الباقات المتغير من لوحة الإدارة بصورة آمنة.", checkoutTitle: "إتمام", checkoutDescription: "تابع إلى بوابة الدفع الآمنة." };
    const plans = [{ planName: "go" as const, billingTerm: "monthly" as const, label: "Go تجريبي", priceEgp: 55, novelLimit: 11, audioChapterLimitPerNovel: 2, enabled: true }];
    await expect(caller.admin.saveAppearance(appearance)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.savePlans({ plans })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
