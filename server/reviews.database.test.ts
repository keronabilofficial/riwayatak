import { describe, expect, it } from "vitest";
import { authors, novelReviews, novels, users } from "../drizzle/schema";
import { getDb } from "./db";

const ROLLBACK = "rollback-isolated-review-test";

describe("تفرد مراجعة المستخدم", () => {
  it("يفرض قاعدة مراجعة واحدة للرواية من الحساب نفسه داخل قاعدة البيانات", async () => {
    const database = await getDb();
    if (!database) throw new Error("قاعدة البيانات غير متاحة للاختبار المعزول.");
    const marker = Date.now();
    await expect(database.transaction(async tx => {
      const user = await tx.insert(users).values({ openId: `review-test-${marker}`, name: "قارئ اختبار", role: "user", isDisabled: false });
      const userId = Number(user[0].insertId);
      const author = await tx.insert(authors).values({ name: "مؤلف مراجعة", displayName: "مؤلف مراجعة", normalizedName: "مؤلف مراجعه", slug: `review-author-${marker}`, isVisible: true });
      const novel = await tx.insert(novels).values({ authorId: Number(author[0].insertId), title: "رواية مراجعة", normalizedTitle: "روايه مراجعه", slug: `review-novel-${marker}`, status: "published", chapterCount: 0, createdByUserId: userId, publishedAt: new Date() });
      const novelId = Number(novel[0].insertId);
      await tx.insert(novelReviews).values({ userId, novelId, rating: 4, body: "هذه مراجعة اختبارية ذات وصف كافٍ." });
      const duplicateRejected = await tx.insert(novelReviews).values({ userId, novelId, rating: 5, body: "هذه مراجعة ثانية ينبغي أن تُرفض." }).then(() => false, () => true);
      expect(duplicateRejected).toBe(true);
      throw new Error(ROLLBACK);
    })).rejects.toThrow(ROLLBACK);
  });
});
