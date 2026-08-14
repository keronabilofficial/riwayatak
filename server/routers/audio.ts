import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { chapterAudio, chapters, novels } from "../../drizzle/schema";
import * as db from "../db";
import { AUDIO_MIME_TYPES, canUploadChapterAudio, decodeAudioUpload, getChapterAudioStorageKey } from "../lib/audio";
import { storagePut } from "../storage";
import { editorProcedure, router } from "../_core/trpc";

const supportedAudioType = z.enum(AUDIO_MIME_TYPES);

async function requireDb() {
  const database = await db.getDb();
  if (!database) throw new Error("قاعدة البيانات غير متاحة.");
  return database;
}

export const audioRouter = router({
  list: editorProcedure.query(async () => {
    const database = await requireDb();
    return database.select({ id: chapterAudio.id, chapterId: chapterAudio.chapterId, url: chapterAudio.url, mimeType: chapterAudio.mimeType, sizeBytes: chapterAudio.sizeBytes, durationSeconds: chapterAudio.durationSeconds, createdAt: chapterAudio.createdAt, chapterTitle: chapters.title, chapterStatus: chapters.status, chapterPublishedAt: chapters.publishedAt, novelTitle: novels.title }).from(chapterAudio).innerJoin(chapters, eq(chapterAudio.chapterId, chapters.id)).innerJoin(novels, eq(chapters.novelId, novels.id)).orderBy(desc(chapterAudio.updatedAt)).limit(100);
  }),
  upload: editorProcedure.input(z.object({ chapterId: z.number().int(), fileName: z.string().min(1).max(240), contentType: supportedAudioType, dataBase64: z.string().min(8), durationSeconds: z.number().int().min(1).max(86_400).optional() })).mutation(async ({ ctx, input }) => {
    const database = await requireDb();
    const [chapter] = await database.select({ id: chapters.id, status: chapters.status, publishedAt: chapters.publishedAt }).from(chapters).where(eq(chapters.id, input.chapterId)).limit(1);
    if (!chapter) throw new Error("الفصل غير موجود.");
    const policy = canUploadChapterAudio(chapter);
    if (!policy.allowed) throw new Error(`انتهت مهلة رفع الفصل الصوتي في ${policy.deadline?.toLocaleDateString("ar")}.`);
    const bytes = decodeAudioUpload(input.dataBase64);
    const file = await storagePut(getChapterAudioStorageKey(input.chapterId, input.fileName), bytes, input.contentType);
    await database.insert(chapterAudio).values({ chapterId: input.chapterId, storageKey: file.key, url: file.url, mimeType: input.contentType, sizeBytes: bytes.byteLength, durationSeconds: input.durationSeconds, uploadedByUserId: ctx.user.id }).onDuplicateKeyUpdate({ set: { storageKey: file.key, url: file.url, mimeType: input.contentType, sizeBytes: bytes.byteLength, durationSeconds: input.durationSeconds, uploadedByUserId: ctx.user.id, updatedAt: new Date() } });
    return { success: true, url: file.url };
  }),
  remove: editorProcedure.input(z.object({ chapterId: z.number().int() })).mutation(async ({ input }) => {
    const database = await requireDb();
    await database.delete(chapterAudio).where(eq(chapterAudio.chapterId, input.chapterId));
    return { success: true };
  }),
});
