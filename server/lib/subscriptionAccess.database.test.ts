import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { authors, chapters, novels, subscriptionAudioAccess, subscriptionCycles, subscriptionNovelAccess, subscriptions, users } from "../../drizzle/schema";
import { getDb } from "../db";
import { activatePaymobCycle, expireDueSubscriptionCycles, failPaymobCycle, getAudioListenerAccess, getReaderAccess } from "./subscriptionAccess";

describe("حدود الوصول في الاشتراك", () => {
  it("يحتسب الرواية عند الفصل الثالث ويمنع الفصل الصوتي الثالث في باقة Go", async () => {
    const database = await getDb();
    if (!database) throw new Error("قاعدة البيانات غير متاحة لاختبار الاشتراك.");
    const marker = Date.now();
    let userId: number | undefined;
    let authorId: number | undefined;
    let novelId: number | undefined;
    let secondNovelId: number | undefined;
    let subscriptionId: number | undefined;

    try {
      const user = await database.insert(users).values({ openId: `subscription-test-user-${marker}`, name: "قارئ اختبار", role: "user", isDisabled: false });
      userId = Number(user[0].insertId);
      const author = await database.insert(authors).values({ name: "مؤلف اختبار", displayName: "مؤلف اختبار", normalizedName: "مؤلف اختبار", slug: `subscription-test-author-${marker}`, isVisible: true });
      authorId = Number(author[0].insertId);
      const novel = await database.insert(novels).values({ authorId, title: "رواية اختبار", normalizedTitle: "رواية اختبار", slug: `subscription-test-novel-${marker}`, status: "draft", chapterCount: 5, createdByUserId: userId });
      novelId = Number(novel[0].insertId);
      const secondNovel = await database.insert(novels).values({ authorId, title: "رواية حد ثابت", normalizedTitle: "رواية حد ثابت", slug: `subscription-snapshot-novel-${marker}`, status: "draft", chapterCount: 1, createdByUserId: userId });
      secondNovelId = Number(secondNovel[0].insertId);
      const chapterRows = await database.insert(chapters).values([1, 2, 3, 4, 5].map(sortOrder => ({ novelId, title: `فصل ${sortOrder}`, slug: `subscription-test-chapter-${marker}-${sortOrder}`, sortOrder, content: "محتوى اختبار", status: "draft", createdByUserId: userId })));
      const firstChapterId = Number(chapterRows[0].insertId);
      const chapterIds = [0, 1, 2, 3, 4].map(offset => firstChapterId + offset);
      const subscription = await database.insert(subscriptions).values({ userId, planName: "go", billingTerm: "monthly", provider: "paymob", status: "active" });
      subscriptionId = Number(subscription[0].insertId);
      const endsAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const cycle = await database.insert(subscriptionCycles).values({ subscriptionId, providerOrderId: `subscription-test-order-${marker}`, status: "active", planLabelSnapshot: "Go ثابت", priceEgpSnapshot: 50, novelLimitSnapshot: 1, audioChapterLimitSnapshot: 2, startsAt: new Date(), endsAt });
      const cycleId = Number(cycle[0].insertId);

      expect(await getReaderAccess(undefined, { novelId, sortOrder: 2 })).toMatchObject({ allowed: true, kind: "preview" });
      expect(await getReaderAccess(userId, { novelId, sortOrder: 3 })).toMatchObject({ allowed: true, kind: "subscription", planName: "go" });
      expect(await getReaderAccess(userId, { novelId: secondNovelId, sortOrder: 3 })).toMatchObject({ allowed: false, kind: "locked" });
      const novelAccess = await database.select().from(subscriptionNovelAccess).where(eq(subscriptionNovelAccess.cycleId, cycleId));
      expect(novelAccess).toHaveLength(1);

      expect(await getAudioListenerAccess(userId, { novelId, chapterId: chapterIds[2] })).toMatchObject({ allowed: true, planName: "go" });
      expect(await getAudioListenerAccess(userId, { novelId, chapterId: chapterIds[3] })).toMatchObject({ allowed: true, planName: "go" });
      expect(await getAudioListenerAccess(userId, { novelId, chapterId: chapterIds[4] })).toMatchObject({ allowed: false });
      const audioAccess = await database.select().from(subscriptionAudioAccess).where(eq(subscriptionAudioAccess.cycleId, cycleId));
      expect(audioAccess).toHaveLength(2);
    } finally {
      if (subscriptionId) await database.delete(subscriptions).where(eq(subscriptions.id, subscriptionId));
      if (novelId) await database.delete(chapters).where(eq(chapters.novelId, novelId));
      if (secondNovelId) await database.delete(novels).where(eq(novels.id, secondNovelId));
      if (novelId) await database.delete(novels).where(eq(novels.id, novelId));
      if (authorId) await database.delete(authors).where(eq(authors.id, authorId));
      if (userId) await database.delete(users).where(eq(users.id, userId));
    }
  }, 20_000);

  it("يفعل دورة Paymob الناجحة ويسجل الدورة الفاشلة دون منح وصول", async () => {
    const database = await getDb();
    if (!database) throw new Error("قاعدة البيانات غير متاحة لاختبار دورة Paymob.");
    const marker = Date.now();
    let userId: number | undefined;
    let activeSubscriptionId: number | undefined;
    let failedSubscriptionId: number | undefined;
    let expiredSubscriptionId: number | undefined;
    try {
      const user = await database.insert(users).values({ openId: `paymob-cycle-user-${marker}`, name: "قارئ دورة", role: "user", isDisabled: false });
      userId = Number(user[0].insertId);
      const activeSubscription = await database.insert(subscriptions).values({ userId, planName: "plus", billingTerm: "monthly", provider: "paymob", status: "pending" });
      activeSubscriptionId = Number(activeSubscription[0].insertId);
      const activeOrderId = `paymob-success-${marker}`;
      const activeCycle = await database.insert(subscriptionCycles).values({ subscriptionId: activeSubscriptionId, providerOrderId: activeOrderId, status: "pending" });
      const activeCycleId = Number(activeCycle[0].insertId);
      expect(await activatePaymobCycle(activeOrderId, "trx-success")).toBe(true);
      const activeRows = await database.select({ subscriptionStatus: subscriptions.status, cycleStatus: subscriptionCycles.status, endsAt: subscriptionCycles.endsAt }).from(subscriptionCycles).innerJoin(subscriptions, eq(subscriptionCycles.subscriptionId, subscriptions.id)).where(eq(subscriptionCycles.id, activeCycleId));
      expect(activeRows[0]).toMatchObject({ subscriptionStatus: "active", cycleStatus: "active" });
      expect(activeRows[0].endsAt).toBeTruthy();

      const failedSubscription = await database.insert(subscriptions).values({ userId, planName: "go", billingTerm: "monthly", provider: "paymob", status: "pending" });
      failedSubscriptionId = Number(failedSubscription[0].insertId);
      const failedOrderId = `paymob-failed-${marker}`;
      const failedCycle = await database.insert(subscriptionCycles).values({ subscriptionId: failedSubscriptionId, providerOrderId: failedOrderId, status: "pending" });
      const failedCycleId = Number(failedCycle[0].insertId);
      expect(await failPaymobCycle(failedOrderId, "trx-failed")).toBe(true);
      const failedRows = await database.select({ subscriptionStatus: subscriptions.status, cycleStatus: subscriptionCycles.status }).from(subscriptionCycles).innerJoin(subscriptions, eq(subscriptionCycles.subscriptionId, subscriptions.id)).where(eq(subscriptionCycles.id, failedCycleId));
      expect(failedRows[0]).toEqual({ subscriptionStatus: "past_due", cycleStatus: "failed" });

      const expiredSubscription = await database.insert(subscriptions).values({ userId, planName: "go", billingTerm: "monthly", provider: "paymob", status: "active" });
      expiredSubscriptionId = Number(expiredSubscription[0].insertId);
      const expiredCycle = await database.insert(subscriptionCycles).values({ subscriptionId: expiredSubscriptionId, providerOrderId: `paymob-expired-${marker}`, status: "active", startsAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), endsAt: new Date(Date.now() - 24 * 60 * 60 * 1000) });
      const expiredCycleId = Number(expiredCycle[0].insertId);
      expect(await expireDueSubscriptionCycles(userId)).toBe(1);
      const expiredRows = await database.select({ subscriptionStatus: subscriptions.status, cycleStatus: subscriptionCycles.status }).from(subscriptionCycles).innerJoin(subscriptions, eq(subscriptionCycles.subscriptionId, subscriptions.id)).where(eq(subscriptionCycles.id, expiredCycleId));
      expect(expiredRows[0]).toEqual({ subscriptionStatus: "expired", cycleStatus: "expired" });
    } finally {
      if (activeSubscriptionId) await database.delete(subscriptions).where(eq(subscriptions.id, activeSubscriptionId));
      if (failedSubscriptionId) await database.delete(subscriptions).where(eq(subscriptions.id, failedSubscriptionId));
      if (expiredSubscriptionId) await database.delete(subscriptions).where(eq(subscriptions.id, expiredSubscriptionId));
      if (userId) await database.delete(users).where(eq(users.id, userId));
    }
  }, 20_000);
});
