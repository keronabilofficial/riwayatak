import { desc } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { authors, media, novels } from "../../drizzle/schema";
import * as db from "../db";
import { storagePut } from "../storage";
import { editorProcedure, router } from "../_core/trpc";
import { assertModeratedText, moderateImageUrl, moderationTextForUpload } from "../lib/moderation";

const MAX_BYTES = 3 * 1024 * 1024;

export const mediaRouter = router({
  list: editorProcedure.query(async () => {
    const database = await db.getDb();
    if (!database) throw new Error("قاعدة البيانات غير متاحة.");
    return database.select().from(media).orderBy(desc(media.createdAt)).limit(48);
  }),
  upload: editorProcedure.input(z.object({ fileName: z.string().min(1).max(240), contentType: z.string().regex(/^image\/(jpeg|png|webp|gif)$/), dataBase64: z.string().min(8), altText: z.string().max(500).optional() })).mutation(async ({ ctx, input }) => {
    const moderation = moderationTextForUpload(input.fileName, input.altText);
    if (!moderation.allowed) throw new Error("لا يمكن رفع الصورة لأن اسم الملف أو وصفها يتضمن محتوى مخالفًا.");
    if (input.altText) assertModeratedText(input.altText, "النص البديل للصورة");
    const bytes = Buffer.from(input.dataBase64.replace(/^data:[^;]+;base64,/, ""), "base64");
    if (!bytes.length || bytes.byteLength > MAX_BYTES) throw new Error("يجب أن يكون حجم الصورة بين 1 بايت و3 ميغابايت.");
    const file = await storagePut(`uploads/media/${ctx.user.id}/${Date.now()}-${input.fileName}`, bytes, input.contentType);
    let imageModeration;
    try {
      imageModeration = await moderateImageUrl(file.url);
    } catch {
      throw new Error("تعذر إكمال الفحص الآمن للصورة حاليًا. لم يتم اعتمادها، حاول مرة أخرى لاحقًا.");
    }
    if (!imageModeration.allowed) throw new Error(`تم رفض الصورة وفق سياسة المحتوى: ${imageModeration.reason}`);
    const database = await db.getDb();
    if (!database) throw new Error("قاعدة البيانات غير متاحة.");
    const result = await database.insert(media).values({ storageKey: file.key, url: file.url, mimeType: input.contentType, sizeBytes: bytes.byteLength, altText: input.altText, createdByUserId: ctx.user.id });
    return { id: Number(result[0].insertId), url: file.url };
  }),
  delete: editorProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
    const database = await db.getDb();
    if (!database) throw new Error("قاعدة البيانات غير متاحة.");
    const [target, authorReferences, novelReferences] = await Promise.all([
      database.select({ id: media.id }).from(media).where(eq(media.id, input.id)).limit(1),
      database.select({ id: authors.id, label: authors.displayName }).from(authors).where(eq(authors.imageMediaId, input.id)).limit(3),
      database.select({ id: novels.id, label: novels.title }).from(novels).where(eq(novels.coverMediaId, input.id)).limit(3),
    ]);
    if (!target[0]) throw new Error("تعذر العثور على ملف الوسائط المطلوب.");
    if (authorReferences.length || novelReferences.length) {
      const usages = [
        ...authorReferences.map(author => `صورة المؤلف «${author.label}»`),
        ...novelReferences.map(novel => `غلاف الرواية «${novel.label}»`),
      ];
      throw new Error(`لا يمكن حذف هذا الملف لأنه مستخدم حاليًا كـ ${usages.join("، ")}. غيّر المرجع أولًا ثم أعد المحاولة.`);
    }
    await database.delete(media).where(eq(media.id, input.id));
    return { deletedId: input.id };
  }),
});
