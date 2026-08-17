import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { chapterComments, chapterTranslationSuggestions, chapters, favorites, novelReviews, novels, readingProgress, users } from "../../drizzle/schema";
import { getDb } from "../db";
import { storagePut } from "../storage";
import { protectedProcedure, router } from "../_core/trpc";

const roleSchema = z.enum(["user", "editor", "admin", "super_admin"]);
const imageSchema = z.string().regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=\s]+$/, "صيغة الصورة غير مدعومة").max(7_000_000);

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db;
}

export const profileRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    const [rows, favoriteItems, progressItems, reviewItems, suggestionItems, commentItems] = await Promise.all([
      db.select({ id: users.id, name: users.name, email: users.email, loginMethod: users.loginMethod, role: users.role, isDisabled: users.isDisabled, createdAt: users.createdAt, updatedAt: users.updatedAt, lastSignedIn: users.lastSignedIn, avatarUrl: users.avatarUrl, bio: users.bio, country: users.country, preferredLanguage: users.preferredLanguage }).from(users).where(eq(users.id, ctx.user.id)).limit(1),
      db.select({ id: favorites.id, novelId: favorites.novelId, novelTitle: novels.title, createdAt: favorites.createdAt }).from(favorites).innerJoin(novels, eq(favorites.novelId, novels.id)).where(eq(favorites.userId, ctx.user.id)).orderBy(desc(favorites.createdAt)).limit(50),
      db.select({ id: readingProgress.id, novelId: readingProgress.novelId, novelTitle: novels.title, chapterId: readingProgress.chapterId, progressPercent: readingProgress.progressPercent, isCompleted: readingProgress.isCompleted, lastReadAt: readingProgress.lastReadAt }).from(readingProgress).innerJoin(novels, eq(readingProgress.novelId, novels.id)).where(eq(readingProgress.userId, ctx.user.id)).orderBy(desc(readingProgress.lastReadAt)).limit(50),
      db.select({ id: novelReviews.id, novelId: novelReviews.novelId, novelTitle: novels.title, rating: novelReviews.rating, createdAt: novelReviews.createdAt }).from(novelReviews).innerJoin(novels, eq(novelReviews.novelId, novels.id)).where(eq(novelReviews.userId, ctx.user.id)).orderBy(desc(novelReviews.createdAt)).limit(50),
      db.select({ id: chapterTranslationSuggestions.id, chapterId: chapterTranslationSuggestions.chapterId, chapterTitle: chapters.title, languageCode: chapterTranslationSuggestions.languageCode, status: chapterTranslationSuggestions.status, createdAt: chapterTranslationSuggestions.createdAt }).from(chapterTranslationSuggestions).innerJoin(chapters, eq(chapterTranslationSuggestions.chapterId, chapters.id)).where(eq(chapterTranslationSuggestions.suggestedByUserId, ctx.user.id)).orderBy(desc(chapterTranslationSuggestions.createdAt)).limit(50),
      db.select({ id: chapterComments.id, chapterId: chapterComments.chapterId, chapterTitle: chapters.title, createdAt: chapterComments.createdAt }).from(chapterComments).innerJoin(chapters, eq(chapterComments.chapterId, chapters.id)).where(and(eq(chapterComments.userId, ctx.user.id), eq(chapterComments.isHidden, false))).orderBy(desc(chapterComments.createdAt)).limit(50),
    ]);
    const user = rows[0];
    if (!user) return null;
    const profileComplete = Boolean(user.name && user.avatarUrl && user.bio && user.country && user.preferredLanguage);
    const activities = [
      ...favoriteItems.map(item => ({ id: `favorite-${item.id}`, kind: "favorite" as const, label: `أضاف «${item.novelTitle}» إلى مكتبته`, points: 5, createdAt: item.createdAt })),
      ...progressItems.map(item => ({ id: `reading-${item.id}`, kind: item.isCompleted ? "chapter_complete" as const : "reading" as const, label: item.isCompleted ? `أكمل قراءة «${item.novelTitle}»` : `تابع قراءة «${item.novelTitle}»`, points: item.isCompleted ? 20 : 2, createdAt: item.lastReadAt })),
      ...reviewItems.map(item => ({ id: `review-${item.id}`, kind: "review" as const, label: `قيّم «${item.novelTitle}»`, points: 15, createdAt: item.createdAt })),
      ...suggestionItems.map(item => ({ id: `suggestion-${item.id}`, kind: "translation_suggestion" as const, label: `اقترح تعديل ترجمة فصل «${item.chapterTitle}»`, points: 10, createdAt: item.createdAt })),
      ...commentItems.map(item => ({ id: `comment-${item.id}`, kind: "reading" as const, label: `شارك في نقاش فصل «${item.chapterTitle}»`, points: 3, createdAt: item.createdAt })),
      ...(profileComplete ? [{ id: "profile-complete", kind: "profile_complete" as const, label: "أكمل بيانات ملفه الشخصي", points: 25, createdAt: user.updatedAt }] : []),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 80);
    return { ...user, activities, points: activities.reduce((sum, item) => sum + item.points, 0), pointsUses: ["فتح شارات إنجاز جديدة", "الحصول على أولوية في مراجعة اقتراحات الترجمة", "استبدالها مستقبلًا بمزايا قراءة أو محتوى حصري عند تفعيل متجر النقاط"], source: "محسوب من التفاعلات الفعلية" as const };
  }),
  update: protectedProcedure.input(z.object({ name: z.string().trim().min(2).max(160).optional(), bio: z.string().trim().max(500).nullable().optional(), country: z.string().trim().max(120).nullable().optional(), preferredLanguage: z.enum(["ar", "en", "fr", "tr"]).nullable().optional(), avatarDataUrl: imageSchema.nullable().optional() })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const patch: { name?: string; bio?: string | null; country?: string | null; preferredLanguage?: "ar" | "en" | "fr" | "tr" | null; avatarUrl?: string | null; avatarKey?: string | null } = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.bio !== undefined) patch.bio = input.bio;
    if (input.country !== undefined) patch.country = input.country;
    if (input.preferredLanguage !== undefined) patch.preferredLanguage = input.preferredLanguage;
    if (input.avatarDataUrl !== undefined) {
      if (input.avatarDataUrl === null) {
        patch.avatarUrl = null;
        patch.avatarKey = null;
      } else {
        const match = input.avatarDataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,([\s\S]+)$/);
        if (!match) throw new Error("صيغة الصورة غير مدعومة");
        const contentType = match[1];
        const buffer = Buffer.from(match[2], "base64");
        if (buffer.byteLength > 5 * 1024 * 1024) throw new Error("حجم الصورة يتجاوز 5 ميجابايت");
        const extension = contentType === "image/jpeg" ? "jpg" : contentType.slice("image/".length);
        const uploaded = await storagePut(`avatars/${ctx.user.id}/profile.${extension}`, buffer, contentType);
        patch.avatarUrl = uploaded.url;
        patch.avatarKey = uploaded.key;
      }
    }
    if (Object.keys(patch).length > 0) await db.update(users).set(patch).where(eq(users.id, ctx.user.id));
    return { success: true };
  }),
});

export { roleSchema };
