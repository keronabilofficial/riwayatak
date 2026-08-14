import { describe, expect, it } from "vitest";
import { appearanceSettingsSchema, DEFAULT_APPEARANCE_SETTINGS, DEFAULT_MANAGED_PLANS, managedPlansSchema } from "./platformSettings";

describe("إعدادات المنصة والباقات", () => {
  it("يقبل قيم المظهر الافتراضية ذات الألوان الآمنة", () => {
    expect(appearanceSettingsSchema.parse(DEFAULT_APPEARANCE_SETTINGS)).toEqual(DEFAULT_APPEARANCE_SETTINGS);
  });

  it("يحافظ على جميع الباقات المعتمدة ومددها الافتراضية", () => {
    expect(DEFAULT_MANAGED_PLANS.map(plan => `${plan.planName}:${plan.billingTerm}`)).toEqual([
      "go:monthly", "plus:monthly", "ultra:monthly", "ultra:quarterly", "enterprise:hundred_days", "enterprise:six_months", "enterprise:yearly",
    ]);
  });

  it("يرفض تكرار الباقة والمدة عند الحفظ الإداري", () => {
    const duplicated = [...DEFAULT_MANAGED_PLANS, { ...DEFAULT_MANAGED_PLANS[0] }];
    expect(managedPlansSchema.safeParse(duplicated).success).toBe(false);
  });
});
