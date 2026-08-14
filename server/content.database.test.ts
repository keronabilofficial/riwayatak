import { afterAll, describe, expect, it } from "vitest";
import { authors, categories, chapterAudio, chapters, novelCategories, novelTags, novels, tags, users } from "../drizzle/schema";
import { getDb } from "./db";
import { getPublicChapter, listPublicNovels } from "./content";

const ROLLBACK = "rollback-isolated-catalog-test";

describe("بحث الكتالوج في قاعدة بيانات معزولة", () => {
  it("يعيد الرواية المنشورة عند البحث باسم تصنيف أو وسم عربي مطبع", async () => {
    const database = await getDb();
    if (!database) throw new Error("قاعدة البيانات غير متاحة للاختبار المعزول.");
    const marker = Date.now();
    await expect(database.transaction(async tx => {
      const user = await tx.insert(users).values({ openId: `catalog-test-${marker}`, name: "مستخدم اختبار", role: "admin", isDisabled: false });
      const userId = Number(user[0].insertId);
      const author = await tx.insert(authors).values({ name: "كاتب اختبار", displayName: "كاتب اختبار", normalizedName: "كاتب اختبار", slug: `author-test-${marker}`, isVisible: true });
      const authorId = Number(author[0].insertId);
      const novel = await tx.insert(novels).values({ authorId, title: "رواية اختبار البحث", normalizedTitle: "روايه اختبار البحث", slug: `novel-test-${marker}`, status: "published", chapterCount: 0, createdByUserId: userId, updatedByUserId: userId, publishedAt: new Date() });
      const novelId = Number(novel[0].insertId);
      const category = await tx.insert(categories).values({ name: "إثارة", normalizedName: "اثاره", slug: `thriller-${marker}`, isVisible: true });
      const tag = await tx.insert(tags).values({ name: "غموض", normalizedName: "غموض", slug: `mystery-${marker}`, isArchived: false });
      await tx.insert(novelCategories).values({ novelId, categoryId: Number(category[0].insertId) });
      await tx.insert(novelTags).values({ novelId, tagId: Number(tag[0].insertId) });
      const chapter = await tx.insert(chapters).values({ novelId, title: "الفصل الأول", slug: `chapter-test-${marker}`, sortOrder: 1, content: "محتوى فصل اختباري.", status: "published", publishedAt: new Date(), createdByUserId: userId, updatedByUserId: userId });
      const chapterId = Number(chapter[0].insertId);
      await tx.insert(chapterAudio).values({ chapterId, storageKey: `test-audio-${marker}`, url: `/manus-storage/test-audio-${marker}.mp3`, mimeType: "audio/mpeg", sizeBytes: 8, durationSeconds: 75, uploadedByUserId: userId });
      const byCategory = await listPublicNovels({ query: "إثارَة" }, tx as never);
      const byTag = await listPublicNovels({ query: "غُموض" }, tx as never);
      expect(byCategory.some(row => row.id === novelId)).toBe(true);
      expect(byTag.some(row => row.id === novelId)).toBe(true);
      const readingChapter = await getPublicChapter(`novel-test-${marker}`, `chapter-test-${marker}`, tx as never);
      expect(readingChapter).toMatchObject({ chapterId, audioUrl: `/manus-storage/test-audio-${marker}.mp3`, audioDurationSeconds: 75 });
      throw new Error(ROLLBACK);
    })).rejects.toThrow(ROLLBACK);
  }, 15_000);
});

afterAll(() => undefined);
