import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { authors, authorTranslations, categories, categoryTranslations, chapterTranslations, chapters, novelTranslations, novels, userLanguagePreferences } from "../../drizzle/schema";
import { getDb } from "../db";
import { invokeLLM } from "../_core/llm";
import { editorProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";

export const languageCodes = ["ar", "en", "fr", "tr"] as const;
export type LanguageCode = (typeof languageCodes)[number];
export const languageCodeSchema = z.enum(languageCodes);
const translationSchema = z.object({ title: z.string(), subtitle: z.string().nullable(), shortDescription: z.string().nullable(), description: z.string().nullable() });
const chapterTranslationSchema = z.object({ title: z.string(), excerpt: z.string().nullable(), content: z.string() });
const dynamicTranslationCache = new Map<string, string>();

async function requireDb() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة مؤقتًا." });
  return db;
}

async function translateWithSchema<T extends z.ZodTypeAny>(source: string, targetLanguage: LanguageCode, schema: T, fields: Record<string, { type: string | string[] }>): Promise<z.infer<T>> {
  const response = await invokeLLM({
    model: "gpt-5-mini",
    messages: [
      { role: "system", content: "أنت مترجم أدبي محترف. حافظ على المعنى والنبرة والشخصيات والتنسيق، ولا تضف أي معلومات. أعد JSON مطابقًا للمخطط فقط." },
      { role: "user", content: `ترجم النص العربي التالي إلى اللغة ذات الرمز ${targetLanguage}. النص:\n${source}` },
    ],
    responseFormat: { type: "json_schema", json_schema: { name: "translation", strict: true, schema: { type: "object", properties: fields, required: Object.keys(fields), additionalProperties: false } } },
    maxTokens: 12000,
  });
  const content = response.choices[0]?.message.content;
  if (typeof content !== "string") throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "تعذر الحصول على الترجمة." });
  const parsed = schema.safeParse(JSON.parse(content));
  if (!parsed.success) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "نتيجة الترجمة غير صالحة للمراجعة." });
  return parsed.data;
}

export const languageRouter = router({
  supported: publicProcedure.query(() => languageCodes.map(code => ({ code, direction: code === "ar" ? "rtl" as const : "ltr" as const })) ),
  preference: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    const [row] = await db.select({ languageCode: userLanguagePreferences.languageCode }).from(userLanguagePreferences).where(eq(userLanguagePreferences.userId, ctx.user.id)).limit(1);
    return { languageCode: row?.languageCode ?? "ar" as LanguageCode };
  }),
  autoTranslate: publicProcedure.input(z.object({ targetLanguage: languageCodeSchema.refine(code => code !== "ar", "العربية هي اللغة الأصلية."), texts: z.array(z.string().trim().min(1).max(500)).min(1).max(24) })).mutation(async ({ input }) => {
    const uniqueTexts = Array.from(new Set(input.texts));
    const missing = uniqueTexts.filter(text => !dynamicTranslationCache.has(`${input.targetLanguage}:${text}`));
    if (missing.length) {
      const response = await invokeLLM({ model: "gpt-5-mini", messages: [{ role: "system", content: "أنت مترجم واجهات دقيق. ترجم كل عنصر إلى اللغة المطلوبة مع الحفاظ على ترتيب العناصر، ولا تضف شرحًا." }, { role: "user", content: JSON.stringify({ targetLanguage: input.targetLanguage, texts: missing }) }], responseFormat: { type: "json_schema", json_schema: { name: "dynamic_translations", strict: true, schema: { type: "object", properties: { translations: { type: "array", items: { type: "object", properties: { source: { type: "string" }, translated: { type: "string" } }, required: ["source", "translated"], additionalProperties: false } } }, required: ["translations"], additionalProperties: false } } }, maxTokens: 6000 });
      const content = response.choices[0]?.message.content;
      if (typeof content !== "string") throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "تعذر ترجمة النصوص حاليًا." });
      const parsed = z.object({ translations: z.array(z.object({ source: z.string(), translated: z.string() })) }).safeParse(JSON.parse(content));
      if (!parsed.success) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "نتيجة الترجمة التلقائية غير صالحة." });
      for (const item of parsed.data.translations) if (missing.includes(item.source) && item.translated.trim()) dynamicTranslationCache.set(`${input.targetLanguage}:${item.source}`, item.translated.trim());
    }
    return { translations: uniqueTexts.map(source => ({ source, translated: dynamicTranslationCache.get(`${input.targetLanguage}:${source}`) ?? source })) };
  }),
  setPreference: protectedProcedure.input(z.object({ languageCode: languageCodeSchema })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    await db.insert(userLanguagePreferences).values({ userId: ctx.user.id, languageCode: input.languageCode }).onDuplicateKeyUpdate({ set: { languageCode: input.languageCode, updatedAt: new Date() } });
    return { languageCode: input.languageCode };
  }),
  admin: router({
    pending: editorProcedure.query(async () => {
      const db = await requireDb();
      const [novelRows, chapterRows] = await Promise.all([
        db.select({ id: novelTranslations.id, novelId: novelTranslations.novelId, title: novelTranslations.title, languageCode: novelTranslations.languageCode, status: novelTranslations.status, updatedAt: novelTranslations.updatedAt, sourceTitle: novels.title }).from(novelTranslations).innerJoin(novels, eq(novelTranslations.novelId, novels.id)).where(eq(novelTranslations.status, "review")).orderBy(novelTranslations.updatedAt).limit(100),
        db.select({ id: chapterTranslations.id, chapterId: chapterTranslations.chapterId, title: chapterTranslations.title, languageCode: chapterTranslations.languageCode, status: chapterTranslations.status, updatedAt: chapterTranslations.updatedAt, sourceTitle: chapters.title }).from(chapterTranslations).innerJoin(chapters, eq(chapterTranslations.chapterId, chapters.id)).where(eq(chapterTranslations.status, "review")).orderBy(chapterTranslations.updatedAt).limit(200),
      ]);
      return { novels: novelRows, chapters: chapterRows };
    }),
    sources: editorProcedure.query(async () => {
      const db = await requireDb();
      const [novelRows, chapterRows] = await Promise.all([
        db.select({ id: novels.id, title: novels.title }).from(novels).where(eq(novels.status, "published")).orderBy(novels.title).limit(100),
        db.select({ id: chapters.id, title: chapters.title, novelId: chapters.novelId, novelTitle: novels.title }).from(chapters).innerJoin(novels, eq(chapters.novelId, novels.id)).where(eq(chapters.status, "published")).orderBy(novels.title, chapters.sortOrder).limit(200),
      ]);
      return { novels: novelRows, chapters: chapterRows };
    }),
    translateNovel: editorProcedure.input(z.object({ novelId: z.number().int().positive(), languageCode: languageCodeSchema.refine(code => code !== "ar", "العربية هي النص الأصلي ولا تحتاج ترجمة.") })).mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const [novel] = await db.select({ title: novels.title, subtitle: novels.subtitle, shortDescription: novels.shortDescription, description: novels.description }).from(novels).where(eq(novels.id, input.novelId)).limit(1);
      if (!novel) throw new TRPCError({ code: "NOT_FOUND", message: "الرواية غير موجودة." });
      const result = await translateWithSchema(JSON.stringify(novel), input.languageCode, translationSchema, { title: { type: "string" }, subtitle: { type: ["string", "null"] }, shortDescription: { type: ["string", "null"] }, description: { type: ["string", "null"] } });
      await db.insert(novelTranslations).values({ novelId: input.novelId, languageCode: input.languageCode, ...result, status: "review", translatedByUserId: ctx.user.id }).onDuplicateKeyUpdate({ set: { ...result, status: "review", translatedByUserId: ctx.user.id, updatedAt: new Date() } });
      return { success: true, status: "review" as const };
    }),
    translateChapter: editorProcedure.input(z.object({ chapterId: z.number().int().positive(), languageCode: languageCodeSchema.refine(code => code !== "ar", "العربية هي النص الأصلي ولا تحتاج ترجمة.") })).mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const [chapter] = await db.select({ title: chapters.title, excerpt: chapters.excerpt, content: chapters.content }).from(chapters).where(eq(chapters.id, input.chapterId)).limit(1);
      if (!chapter) throw new TRPCError({ code: "NOT_FOUND", message: "الفصل غير موجود." });
      const result = await translateWithSchema(JSON.stringify(chapter), input.languageCode, chapterTranslationSchema, { title: { type: "string" }, excerpt: { type: ["string", "null"] }, content: { type: "string" } });
      await db.insert(chapterTranslations).values({ chapterId: input.chapterId, languageCode: input.languageCode, ...result, status: "review", translatedByUserId: ctx.user.id }).onDuplicateKeyUpdate({ set: { ...result, status: "review", translatedByUserId: ctx.user.id, updatedAt: new Date() } });
      return { success: true, status: "review" as const };
    }),
    publishNovelTranslation: editorProcedure.input(z.object({ novelId: z.number().int().positive(), languageCode: languageCodeSchema })).mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      await db.update(novelTranslations).set({ status: "published", reviewedByUserId: ctx.user.id, updatedAt: new Date() }).where(and(eq(novelTranslations.novelId, input.novelId), eq(novelTranslations.languageCode, input.languageCode)));
      return { success: true };
    }),
    publishChapterTranslation: editorProcedure.input(z.object({ chapterId: z.number().int().positive(), languageCode: languageCodeSchema })).mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      await db.update(chapterTranslations).set({ status: "published", reviewedByUserId: ctx.user.id, updatedAt: new Date() }).where(and(eq(chapterTranslations.chapterId, input.chapterId), eq(chapterTranslations.languageCode, input.languageCode)));
      return { success: true };
    }),
  }),
});
