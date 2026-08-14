import { and, count, eq, gt, lte } from "drizzle-orm";
import { subscriptionAudioAccess, subscriptionCycles, subscriptionNovelAccess, subscriptions } from "../../drizzle/schema";
import { getDb } from "../db";
import { getSubscriptionOption, isFreePreviewChapter } from "./subscriptions";

type ChapterAccessInput = { novelId: number; sortOrder: number };

async function getActiveCycle(userId: number) {
  const database = await getDb();
  if (!database) throw new Error("قاعدة البيانات غير متاحة مؤقتًا.");
  const rows = await database
    .select({ cycleId: subscriptionCycles.id, planName: subscriptions.planName, billingTerm: subscriptions.billingTerm, endsAt: subscriptionCycles.endsAt })
    .from(subscriptionCycles)
    .innerJoin(subscriptions, eq(subscriptionCycles.subscriptionId, subscriptions.id))
    .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active"), eq(subscriptionCycles.status, "active"), gt(subscriptionCycles.endsAt, new Date())))
    .limit(1);
  return { database, cycle: rows[0] ?? null };
}

export async function getReaderAccess(userId: number | undefined, chapter: ChapterAccessInput) {
  if (isFreePreviewChapter(chapter.sortOrder)) return { allowed: true as const, kind: "preview" as const };
  if (!userId) return { allowed: false as const, kind: "locked" as const, reason: "يلزم تسجيل الدخول والاشتراك لقراءة هذا الفصل." };

  const { database, cycle } = await getActiveCycle(userId);
  if (!cycle) return { allowed: false as const, kind: "locked" as const, reason: "يلزم اشتراك نشط لقراءة هذا الفصل." };
  const option = getSubscriptionOption(cycle.planName, cycle.billingTerm);
  const existing = await database.select({ id: subscriptionNovelAccess.id }).from(subscriptionNovelAccess).where(and(eq(subscriptionNovelAccess.cycleId, cycle.cycleId), eq(subscriptionNovelAccess.novelId, chapter.novelId))).limit(1);
  if (existing[0]) return { allowed: true as const, kind: "subscription" as const, planName: cycle.planName, endsAt: cycle.endsAt };

  const used = await database.select({ value: count() }).from(subscriptionNovelAccess).where(eq(subscriptionNovelAccess.cycleId, cycle.cycleId));
  if (Number(used[0]?.value ?? 0) >= option.novelLimit) return { allowed: false as const, kind: "locked" as const, reason: `استهلكت حد ${option.novelLimit} روايات في دورة اشتراكك الحالية.` };
  await database.insert(subscriptionNovelAccess).values({ cycleId: cycle.cycleId, novelId: chapter.novelId });
  return { allowed: true as const, kind: "subscription" as const, planName: cycle.planName, endsAt: cycle.endsAt };
}

export async function getAudioListenerAccess(userId: number, chapter: { chapterId: number; novelId: number }) {
  const { database, cycle } = await getActiveCycle(userId);
  if (!cycle) return { allowed: false as const, reason: "يلزم اشتراك نشط للاستماع إلى الفصول الصوتية." };
  const option = getSubscriptionOption(cycle.planName, cycle.billingTerm);
  const existing = await database.select({ id: subscriptionAudioAccess.id }).from(subscriptionAudioAccess).where(and(eq(subscriptionAudioAccess.cycleId, cycle.cycleId), eq(subscriptionAudioAccess.chapterId, chapter.chapterId))).limit(1);
  if (existing[0]) return { allowed: true as const, planName: cycle.planName };
  const used = await database.select({ value: count() }).from(subscriptionAudioAccess).where(and(eq(subscriptionAudioAccess.cycleId, cycle.cycleId), eq(subscriptionAudioAccess.novelId, chapter.novelId)));
  if (option.audioChapterLimitPerNovel !== null && Number(used[0]?.value ?? 0) >= option.audioChapterLimitPerNovel) {
    return { allowed: false as const, reason: `استهلكت حد ${option.audioChapterLimitPerNovel} فصول صوتية لهذه الرواية في دورتك الحالية.` };
  }
  await database.insert(subscriptionAudioAccess).values({ cycleId: cycle.cycleId, novelId: chapter.novelId, chapterId: chapter.chapterId });
  return { allowed: true as const, planName: cycle.planName };
}

export async function activatePaymobCycle(providerOrderId: string, providerTransactionId: string) {
  const database = await getDb();
  if (!database) throw new Error("قاعدة البيانات غير متاحة مؤقتًا.");
  const rows = await database
    .select({ cycleId: subscriptionCycles.id, cycleStatus: subscriptionCycles.status, subscriptionId: subscriptions.id, billingTerm: subscriptions.billingTerm })
    .from(subscriptionCycles)
    .innerJoin(subscriptions, eq(subscriptionCycles.subscriptionId, subscriptions.id))
    .where(eq(subscriptionCycles.providerOrderId, providerOrderId))
    .limit(1);
  const record = rows[0];
  if (!record || record.cycleStatus === "active") return false;
  const startsAt = new Date();
  const endsAt = new Date(startsAt);
  if (record.billingTerm === "monthly") endsAt.setMonth(endsAt.getMonth() + 1);
  if (record.billingTerm === "quarterly") endsAt.setDate(endsAt.getDate() + 90);
  if (record.billingTerm === "hundred_days") endsAt.setDate(endsAt.getDate() + 100);
  if (record.billingTerm === "six_months") endsAt.setMonth(endsAt.getMonth() + 6);
  if (record.billingTerm === "yearly") endsAt.setFullYear(endsAt.getFullYear() + 1);
  await database.update(subscriptionCycles).set({ status: "active", startsAt, endsAt, providerTransactionId }).where(eq(subscriptionCycles.id, record.cycleId));
  await database.update(subscriptions).set({ status: "active" }).where(eq(subscriptions.id, record.subscriptionId));
  return true;
}

export async function failPaymobCycle(providerOrderId: string, providerTransactionId: string) {
  const database = await getDb();
  if (!database) throw new Error("قاعدة البيانات غير متاحة مؤقتًا.");
  const rows = await database.select({ cycleId: subscriptionCycles.id, cycleStatus: subscriptionCycles.status, subscriptionId: subscriptions.id }).from(subscriptionCycles).innerJoin(subscriptions, eq(subscriptionCycles.subscriptionId, subscriptions.id)).where(eq(subscriptionCycles.providerOrderId, providerOrderId)).limit(1);
  const record = rows[0];
  if (!record || record.cycleStatus !== "pending") return false;
  await database.update(subscriptionCycles).set({ status: "failed", providerTransactionId }).where(eq(subscriptionCycles.id, record.cycleId));
  await database.update(subscriptions).set({ status: "past_due" }).where(eq(subscriptions.id, record.subscriptionId));
  return true;
}

export async function expireDueSubscriptionCycles(userId: number) {
  const database = await getDb();
  if (!database) throw new Error("قاعدة البيانات غير متاحة مؤقتًا.");
  const rows = await database.select({ cycleId: subscriptionCycles.id, subscriptionId: subscriptions.id }).from(subscriptionCycles).innerJoin(subscriptions, eq(subscriptionCycles.subscriptionId, subscriptions.id)).where(and(eq(subscriptions.userId, userId), eq(subscriptionCycles.status, "active"), lte(subscriptionCycles.endsAt, new Date())));
  if (!rows.length) return 0;
  await Promise.all(rows.map(row => database.update(subscriptionCycles).set({ status: "expired" }).where(eq(subscriptionCycles.id, row.cycleId))));
  await Promise.all(rows.map(row => database.update(subscriptions).set({ status: "expired" }).where(eq(subscriptions.id, row.subscriptionId))));
  return rows.length;
}
