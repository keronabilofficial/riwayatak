import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ saveAppearance: vi.fn(), savePlans: vi.fn(), values: vi.fn().mockResolvedValue(undefined) }));

vi.mock("../db", () => ({ getDb: vi.fn().mockResolvedValue({ insert: vi.fn().mockReturnValue({ values: mocks.values }) }) }));
vi.mock("../lib/platformSettings", async importOriginal => {
  const actual = await importOriginal<typeof import("../lib/platformSettings")>();
  return { ...actual, saveAppearanceSettings: mocks.saveAppearance, saveManagedPlans: mocks.savePlans };
});

import { platformSettingsRouter } from "./platformSettings";

const appearance = { platformName: "روايتي", tagline: "عبارة", heroEyebrow: "مساحة أدبية", heroTitle: "عنوان الحكاية", heroHighlight: "متجدد", heroDescription: "وصف مناسب لاختبار حفظ إعدادات المظهر في لوحة الإدارة.", heroImageUrl: "/manus-storage/test.jpg", accentColor: "#224466", primaryColor: "#102030", plansEyebrow: "عضوية", plansTitle: "خطط جديدة", plansDescription: "وصف صفحة الباقات المتغير من لوحة الإدارة بصورة آمنة.", checkoutTitle: "إتمام", checkoutDescription: "تابع إلى بوابة الدفع الآمنة." };
const plans = [{ planName: "go" as const, billingTerm: "monthly" as const, label: "Go تجريبي", priceEgp: 55, novelLimit: 11, audioChapterLimitPerNovel: 2, enabled: true }];

describe("إجراءات حفظ إعدادات المنصة", () => {
  it("يحفظ المظهر والباقات عند طلب مدير مرخص", async () => {
    const caller = platformSettingsRouter.createCaller({ user: { id: 27, role: "admin" } } as never);
    await caller.admin.saveAppearance(appearance);
    await caller.admin.savePlans({ plans });
    expect(mocks.saveAppearance).toHaveBeenCalledWith(appearance, 27);
    expect(mocks.savePlans).toHaveBeenCalledWith(plans, 27);
    expect(mocks.values).toHaveBeenCalledTimes(2);
  });
});
