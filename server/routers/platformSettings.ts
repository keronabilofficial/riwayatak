import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { activityLogs } from "../../drizzle/schema";
import { getDb } from "../db";
import { appearanceSettingsSchema, getAppearanceSettings, getManagedPlans, managedPlansSchema, saveAppearanceSettings, saveManagedPlans } from "../lib/platformSettings";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";

async function logPlatformUpdate(userId: number, action: string) {
  const database = await getDb();
  if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة مؤقتًا." });
  await database.insert(activityLogs).values({ actorUserId: userId, action, entityType: "platform_settings" });
}

export const platformSettingsRouter = router({
  appearance: publicProcedure.query(() => getAppearanceSettings()),
  plans: publicProcedure.query(() => getManagedPlans()),
  admin: router({
    get: adminProcedure.query(async () => ({ appearance: await getAppearanceSettings(), plans: await getManagedPlans() })),
    saveAppearance: adminProcedure.input(appearanceSettingsSchema).mutation(async ({ ctx, input }) => {
      await saveAppearanceSettings(input, ctx.user.id);
      await logPlatformUpdate(ctx.user.id, "platform.appearance.updated");
      return { success: true };
    }),
    savePlans: adminProcedure.input(z.object({ plans: managedPlansSchema })).mutation(async ({ ctx, input }) => {
      await saveManagedPlans(input.plans, ctx.user.id);
      await logPlatformUpdate(ctx.user.id, "platform.plans.updated");
      return { success: true };
    }),
  }),
});
