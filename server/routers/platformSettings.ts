import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { activityLogs, subscriptions } from "../../drizzle/schema";
import { getDb } from "../db";
import { appearanceSettingsSchema, getAppearanceSettings, getManagedPlans, managedPlanSchema, managedPlansSchema, saveAppearanceSettings, saveManagedPlans } from "../lib/platformSettings";
import { publicProcedure, router, superAdminProcedure } from "../_core/trpc";

async function logPlatformUpdate(userId: number, action: string) {
  const database = await getDb();
  if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة مؤقتًا." });
  await database.insert(activityLogs).values({ actorUserId: userId, action, entityType: "platform_settings" });
}

const planReferenceSchema = z.object({ planName: z.enum(["go", "plus", "ultra", "enterprise"]), billingTerm: z.enum(["monthly", "quarterly", "hundred_days", "six_months", "yearly"]) });

async function assertPlanHasNoActiveSubscriptions(plan: z.infer<typeof planReferenceSchema>) {
  const database = await getDb();
  if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة مؤقتًا." });
  const active = await database.select({ id: subscriptions.id }).from(subscriptions).where(and(eq(subscriptions.planName, plan.planName), eq(subscriptions.billingTerm, plan.billingTerm), eq(subscriptions.status, "active"))).limit(1);
  if (active.length) throw new TRPCError({ code: "CONFLICT", message: "لا يمكن حذف هذه الباقة لأن لديها اشتراكات نشطة. عطّلها بدلًا من ذلك أو انتظر انتهاء الاشتراكات." });
}

export const platformSettingsRouter = router({
  appearance: publicProcedure.query(() => getAppearanceSettings()),
  plans: publicProcedure.query(() => getManagedPlans()),
  admin: router({
    get: superAdminProcedure.query(async () => ({ appearance: await getAppearanceSettings(), plans: await getManagedPlans() })),
    saveAppearance: superAdminProcedure.input(appearanceSettingsSchema).mutation(async ({ ctx, input }) => {
      await saveAppearanceSettings(input, ctx.user.id);
      await logPlatformUpdate(ctx.user.id, "platform.appearance.updated");
      return { success: true };
    }),
    savePlans: superAdminProcedure.input(z.object({ plans: managedPlansSchema })).mutation(async ({ ctx, input }) => {
      const currentPlans = await getManagedPlans();
      const removedPlans = currentPlans.filter(current => !input.plans.some(plan => plan.planName === current.planName && plan.billingTerm === current.billingTerm));
      for (const removedPlan of removedPlans) await assertPlanHasNoActiveSubscriptions(removedPlan);
      await saveManagedPlans(input.plans, ctx.user.id);
      await logPlatformUpdate(ctx.user.id, "platform.plans.updated");
      return { success: true };
    }),
    addPlan: superAdminProcedure.input(managedPlanSchema).mutation(async ({ ctx, input }) => {
      const plans = await getManagedPlans();
      if (plans.some(plan => plan.planName === input.planName && plan.billingTerm === input.billingTerm)) throw new TRPCError({ code: "CONFLICT", message: "هذه الباقة بهذه المدة موجودة بالفعل." });
      await saveManagedPlans([...plans, input], ctx.user.id);
      await logPlatformUpdate(ctx.user.id, "platform.plan.created");
      return { success: true };
    }),
    deletePlan: superAdminProcedure.input(planReferenceSchema).mutation(async ({ ctx, input }) => {
      const plans = await getManagedPlans();
      const exists = plans.some(plan => plan.planName === input.planName && plan.billingTerm === input.billingTerm);
      if (!exists) throw new TRPCError({ code: "NOT_FOUND", message: "تعذر العثور على الباقة المطلوبة." });
      await assertPlanHasNoActiveSubscriptions(input);
      const nextPlans = plans.filter(plan => plan.planName !== input.planName || plan.billingTerm !== input.billingTerm);
      if (!nextPlans.length) throw new TRPCError({ code: "BAD_REQUEST", message: "يجب أن تبقى باقة واحدة على الأقل في المنصة." });
      await saveManagedPlans(nextPlans, ctx.user.id);
      await logPlatformUpdate(ctx.user.id, "platform.plan.deleted");
      return { success: true };
    }),
  }),
});
