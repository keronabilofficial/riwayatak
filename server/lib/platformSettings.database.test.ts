import { describe, expect, it } from "vitest";
import { getPlanPresentation } from "../../client/src/lib/planPresentation";
import { users } from "../../drizzle/schema";
import { getDb } from "../db";
import { DEFAULT_APPEARANCE_SETTINGS, DEFAULT_MANAGED_PLANS, getAppearanceSettings, getManagedPlans, saveAppearanceSettings, saveManagedPlans } from "./platformSettings";

describe("حفظ إعدادات المنصة", () => {
  it("يحفظ مظهر المنصة والباقات ويعيدهما داخل معاملة معزولة", async () => {
    const database = await getDb();
    if (!database) throw new Error("قاعدة البيانات غير متاحة لاختبار الإعدادات.");
    const marker = Date.now();
    try {
      await database.transaction(async transaction => {
        const user = await transaction.insert(users).values({ openId: `platform-settings-${marker}`, name: "مدير الإعدادات", role: "admin", isDisabled: false });
        const userId = Number(user[0].insertId);
        const appearance = { ...DEFAULT_APPEARANCE_SETTINGS, platformName: `روايتي ${marker}`, accentColor: "#224466", plansTitle: "خطط القراءة المميزة", checkoutTitle: "إتمام آمن" };
        const plans = DEFAULT_MANAGED_PLANS.map((plan, index) => index === 0 ? { ...plan, priceEgp: 77, enabled: false } : plan);
        await saveAppearanceSettings(appearance, userId, transaction as never);
        await saveManagedPlans(plans, userId, transaction as never);
        const savedAppearance = await getAppearanceSettings(transaction as never);
        expect(savedAppearance).toEqual(appearance);
        expect(getPlanPresentation(savedAppearance)).toMatchObject({ platformName: appearance.platformName, plansTitle: "خطط القراءة المميزة", checkoutTitle: "إتمام آمن" });
        expect(await getManagedPlans(transaction as never)).toEqual(plans);
        throw new Error("ROLLBACK_PLATFORM_SETTINGS_TEST");
      });
    } catch (error) {
      if (!(error instanceof Error) || error.message !== "ROLLBACK_PLATFORM_SETTINGS_TEST") throw error;
    }
  }, 20_000);
});
