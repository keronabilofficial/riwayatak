import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { subscriptions, users } from "../../drizzle/schema";
import { getDb } from "../db";
import { getManagedPlans } from "../lib/platformSettings";
import { platformSettingsRouter } from "./platformSettings";

describe("حذف الباقات في قاعدة البيانات", () => {
  it("يرفض حذف باقة لها اشتراك نشط", async () => {
    const database = await getDb();
    if (!database) throw new Error("قاعدة البيانات غير متاحة لاختبار الباقات.");
    const targetPlan = (await getManagedPlans())[0];
    const marker = Date.now();
    let userId: number | undefined;
    let subscriptionId: number | undefined;
    try {
      const user = await database.insert(users).values({ openId: `plans-super-admin-${marker}`, name: "مدير نظام اختبار", role: "super_admin", isDisabled: false });
      userId = Number(user[0].insertId);
      const subscription = await database.insert(subscriptions).values({ userId, planName: targetPlan.planName, billingTerm: targetPlan.billingTerm, provider: "test", status: "active", cancelAtPeriodEnd: false });
      subscriptionId = Number(subscription[0].insertId);
      const caller = platformSettingsRouter.createCaller({ user: { id: userId, role: "super_admin" } } as never);
      await expect(caller.admin.deletePlan({ planName: targetPlan.planName, billingTerm: targetPlan.billingTerm })).rejects.toMatchObject({ code: "CONFLICT" });
    } finally {
      if (subscriptionId) await database.delete(subscriptions).where(eq(subscriptions.id, subscriptionId));
      if (userId) await database.delete(users).where(eq(users.id, userId));
    }
  }, 15_000);
});
