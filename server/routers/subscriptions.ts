import { TRPCError } from "@trpc/server";
import { and, desc, eq, gt } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { chapterAudio, chapters, subscriptionCycles, subscriptions } from "../../drizzle/schema";
import { getDb } from "../db";
import { createPaymobCheckout } from "../lib/paymob";
import { expireDueSubscriptionCycles, getAudioListenerAccess } from "../lib/subscriptionAccess";
import { SUBSCRIPTION_OPTIONS } from "../lib/subscriptions";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

const planInput = z.object({ planName: z.enum(["go", "plus", "ultra", "enterprise"]), billingTerm: z.enum(["monthly", "quarterly", "hundred_days", "six_months", "yearly"]) });

async function requireDb() {
  const database = await getDb();
  if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة مؤقتًا." });
  return database;
}

function getRequestOrigin(request: { get: (name: string) => string | undefined }) {
  const host = request.get("host");
  if (!host) throw new TRPCError({ code: "BAD_REQUEST", message: "تعذر تحديد عنوان العودة من الدفع." });
  return `https://${host}`;
}

export const subscriptionsRouter = router({
  plans: publicProcedure.query(() => SUBSCRIPTION_OPTIONS),
  mine: protectedProcedure.query(async ({ ctx }) => {
    await expireDueSubscriptionCycles(ctx.user.id);
    const database = await requireDb();
    const rows = await database
      .select({ subscriptionId: subscriptions.id, planName: subscriptions.planName, billingTerm: subscriptions.billingTerm, subscriptionStatus: subscriptions.status, cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd, cycleStatus: subscriptionCycles.status, startsAt: subscriptionCycles.startsAt, endsAt: subscriptionCycles.endsAt })
      .from(subscriptionCycles)
      .innerJoin(subscriptions, eq(subscriptionCycles.subscriptionId, subscriptions.id))
      .where(and(eq(subscriptions.userId, ctx.user.id), gt(subscriptionCycles.endsAt, new Date())))
      .orderBy(desc(subscriptionCycles.createdAt))
      .limit(1);
    return rows[0] ?? null;
  }),
  startCheckout: protectedProcedure.input(planInput.extend({ billingEmail: z.string().email(), phoneNumber: z.string().regex(/^\+[1-9]\d{7,14}$/, "أدخل رقم هاتف بصيغة دولية مثل +201..." ) })).mutation(async ({ ctx, input }) => {
    const option = SUBSCRIPTION_OPTIONS.find(item => item.planName === input.planName && item.billingTerm === input.billingTerm);
    if (!option) throw new TRPCError({ code: "BAD_REQUEST", message: "خيار الاشتراك غير متاح." });
    const database = await requireDb();
    const activeRows = await database.select({ id: subscriptionCycles.id }).from(subscriptionCycles).innerJoin(subscriptions, eq(subscriptionCycles.subscriptionId, subscriptions.id)).where(and(eq(subscriptions.userId, ctx.user.id), eq(subscriptionCycles.status, "active"), gt(subscriptionCycles.endsAt, new Date()))).limit(1);
    if (activeRows[0]) throw new TRPCError({ code: "CONFLICT", message: "لديك اشتراك نشط بالفعل. يمكنك التجديد بعد انتهاء دورته الحالية." });
    const subscriptionResult = await database.insert(subscriptions).values({ userId: ctx.user.id, planName: input.planName, billingTerm: input.billingTerm, provider: "paymob", status: "pending" });
    const subscriptionId = Number(subscriptionResult[0].insertId);
    const providerOrderId = `rw-${subscriptionId}-${randomUUID()}`;
    const cycleResult = await database.insert(subscriptionCycles).values({ subscriptionId, providerOrderId, status: "pending" });
    const cycleId = Number(cycleResult[0].insertId);
    try {
      const origin = getRequestOrigin(ctx.req);
      return await createPaymobCheckout({
        amountCents: option.priceEgp * 100,
        description: `اشتراك ${option.label} — روايتك بالعربية`,
        customerName: ctx.user.name ?? "قارئ روايتك بالعربية",
        customerEmail: input.billingEmail,
        customerPhone: input.phoneNumber,
        merchantReference: providerOrderId,
        notificationUrl: `${origin}/api/paymob/webhook`,
        redirectionUrl: `${origin}/subscription/return?cycle=${cycleId}`,
      });
    } catch (error) {
      await database.delete(subscriptionCycles).where(eq(subscriptionCycles.id, cycleId));
      await database.delete(subscriptions).where(eq(subscriptions.id, subscriptionId));
      throw new TRPCError({ code: "BAD_GATEWAY", message: error instanceof Error ? error.message : "تعذر بدء عملية الدفع." });
    }
  }),
  listenChapter: protectedProcedure.input(z.object({ chapterId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const database = await requireDb();
    const audioRows = await database.select({ novelId: chapters.novelId, audioUrl: chapterAudio.url }).from(chapterAudio).innerJoin(chapters, eq(chapterAudio.chapterId, chapters.id)).where(eq(chapterAudio.chapterId, input.chapterId)).limit(1);
    const audio = audioRows[0];
    if (!audio) throw new TRPCError({ code: "NOT_FOUND", message: "لا يتوفر تسجيل صوتي لهذا الفصل." });
    const access = await getAudioListenerAccess(ctx.user.id, { chapterId: input.chapterId, novelId: audio.novelId });
    if (!access.allowed) throw new TRPCError({ code: "FORBIDDEN", message: access.reason });
    return { audioUrl: audio.audioUrl };
  }),
  cancelAtPeriodEnd: protectedProcedure.mutation(async ({ ctx }) => {
    const database = await requireDb();
    const active = await database.select({ subscriptionId: subscriptions.id }).from(subscriptionCycles).innerJoin(subscriptions, eq(subscriptionCycles.subscriptionId, subscriptions.id)).where(and(eq(subscriptions.userId, ctx.user.id), eq(subscriptionCycles.status, "active"), gt(subscriptionCycles.endsAt, new Date()))).limit(1);
    if (!active[0]) throw new TRPCError({ code: "NOT_FOUND", message: "لا يوجد اشتراك نشط لإلغائه." });
    await database.update(subscriptions).set({ cancelAtPeriodEnd: true, cancelledAt: new Date() }).where(eq(subscriptions.id, active[0].subscriptionId));
    return { success: true };
  }),
  resumeRenewal: protectedProcedure.mutation(async ({ ctx }) => {
    const database = await requireDb();
    const active = await database.select({ subscriptionId: subscriptions.id }).from(subscriptionCycles).innerJoin(subscriptions, eq(subscriptionCycles.subscriptionId, subscriptions.id)).where(and(eq(subscriptions.userId, ctx.user.id), eq(subscriptionCycles.status, "active"), gt(subscriptionCycles.endsAt, new Date()))).limit(1);
    if (!active[0]) throw new TRPCError({ code: "NOT_FOUND", message: "لا يوجد اشتراك نشط لاستئناف تجديده." });
    await database.update(subscriptions).set({ cancelAtPeriodEnd: false, cancelledAt: null }).where(eq(subscriptions.id, active[0].subscriptionId));
    return { success: true };
  }),
});
