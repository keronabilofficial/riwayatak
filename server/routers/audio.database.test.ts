import { eq } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";
import { authors, chapterAudio, chapters, novels, users } from "../../drizzle/schema";
import { getDb } from "../db";

const mocks = vi.hoisted(() => ({ storagePut: vi.fn() }));
vi.mock("../storage", () => ({ storagePut: mocks.storagePut }));

import { audioRouter } from "./audio";

describe("audio.upload في قاعدة البيانات", () => {
  it("ينشئ سجل chapter_audio بالمراجع الوصفية الصحيحة للفصل", async () => {
    const database = await getDb();
    if (!database) throw new Error("قاعدة البيانات غير متاحة لاختبار رفع الصوت.");
    const marker = Date.now();
    let userId: number | undefined;
    let authorId: number | undefined;
    let novelId: number | undefined;
    let chapterId: number | undefined;
    const storageKey = `test/audio/chapters/${marker}.mp3`;
    const url = `/manus-storage/audio-${marker}.mp3`;

    try {
      const user = await database.insert(users).values({ openId: `audio-db-user-${marker}`, name: "مدير اختبار", role: "admin", isDisabled: false });
      userId = Number(user[0].insertId);
      const author = await database.insert(authors).values({ name: "مؤلف صوتي", displayName: "مؤلف صوتي", normalizedName: "مؤلف صوتي", slug: `audio-db-author-${marker}`, isVisible: true });
      authorId = Number(author[0].insertId);
      const novel = await database.insert(novels).values({ authorId, title: "رواية صوتية", normalizedTitle: "رواية صوتية", slug: `audio-db-novel-${marker}`, status: "draft", chapterCount: 1, createdByUserId: userId });
      novelId = Number(novel[0].insertId);
      const chapter = await database.insert(chapters).values({ novelId, title: "الفصل الأول", slug: `audio-db-chapter-${marker}`, sortOrder: 1, content: "محتوى اختبار", status: "draft", createdByUserId: userId, updatedByUserId: userId });
      chapterId = Number(chapter[0].insertId);
      mocks.storagePut.mockResolvedValue({ key: storageKey, url });

      const caller = audioRouter.createCaller({ user: { id: userId, role: "admin" } } as never);
      await expect(caller.upload({ chapterId, fileName: "chapter.mp3", contentType: "audio/mpeg", dataBase64: "YXVkaW8=", durationSeconds: 4 })).resolves.toEqual({ success: true, url });

      const saved = await database.select().from(chapterAudio).where(eq(chapterAudio.chapterId, chapterId)).limit(1);
      expect(saved[0]).toMatchObject({ chapterId, storageKey, url, mimeType: "audio/mpeg", sizeBytes: 5, durationSeconds: 4, uploadedByUserId: userId });
    } finally {
      if (chapterId) await database.delete(chapterAudio).where(eq(chapterAudio.chapterId, chapterId));
      if (chapterId) await database.delete(chapters).where(eq(chapters.id, chapterId));
      if (novelId) await database.delete(novels).where(eq(novels.id, novelId));
      if (authorId) await database.delete(authors).where(eq(authors.id, authorId));
      if (userId) await database.delete(users).where(eq(users.id, userId));
    }
  }, 15_000);
});
