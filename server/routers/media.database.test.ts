import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { authors, media, users } from "../../drizzle/schema";
import { getDb } from "../db";
import { mediaRouter } from "./media";

describe("حذف الوسائط في قاعدة البيانات", () => {
  it("يحذف الوسيط غير المرتبط ويرفض حذف صورة مؤلف مستخدمة", async () => {
    const database = await getDb();
    if (!database) throw new Error("قاعدة البيانات غير متاحة لاختبار الوسائط.");
    const marker = Date.now();
    let userId: number | undefined;
    let unusedMediaId: number | undefined;
    let protectedMediaId: number | undefined;
    let authorId: number | undefined;
    try {
      const user = await database.insert(users).values({ openId: `media-editor-${marker}`, name: "محرر اختبار", role: "editor", isDisabled: false });
      userId = Number(user[0].insertId);
      const unused = await database.insert(media).values({ storageKey: `test/media/unused-${marker}.png`, url: `/manus-storage/unused-${marker}.png`, mimeType: "image/png", createdByUserId: userId });
      unusedMediaId = Number(unused[0].insertId);
      const protectedMedia = await database.insert(media).values({ storageKey: `test/media/protected-${marker}.png`, url: `/manus-storage/protected-${marker}.png`, mimeType: "image/png", createdByUserId: userId });
      protectedMediaId = Number(protectedMedia[0].insertId);
      const author = await database.insert(authors).values({ name: "مؤلف اختبار", displayName: "مؤلف اختبار", normalizedName: "مؤلف اختبار", slug: `media-author-${marker}`, imageMediaId: protectedMediaId, isVisible: true });
      authorId = Number(author[0].insertId);

      const caller = mediaRouter.createCaller({ user: { id: userId, role: "editor" } } as never);
      await expect(caller.delete({ id: unusedMediaId })).resolves.toEqual({ deletedId: unusedMediaId });
      const deleted = await database.select({ id: media.id }).from(media).where(eq(media.id, unusedMediaId)).limit(1);
      expect(deleted).toHaveLength(0);
      await expect(caller.delete({ id: protectedMediaId })).rejects.toThrow("لا يمكن حذف هذا الملف");
    } finally {
      if (authorId) await database.delete(authors).where(eq(authors.id, authorId));
      if (protectedMediaId) await database.delete(media).where(eq(media.id, protectedMediaId));
      if (unusedMediaId) await database.delete(media).where(eq(media.id, unusedMediaId));
      if (userId) await database.delete(users).where(eq(users.id, userId));
    }
  }, 15_000);
});
