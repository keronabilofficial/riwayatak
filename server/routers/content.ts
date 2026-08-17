import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, inArray, not, sql } from "drizzle-orm";
import { z } from "zod";
import {
  activityLogs,
  authors,
  categories,
  chapters,
  favorites,
  favoriteRatings,
  favoriteNotes,
  favoriteQuotes,
  recommendationDismissals,
  favoriteLists,
  favoriteListItems,
  novelCategories,
  novelFollows,
  novelReviews,
  novelTags,
  novels,
  notifications,
  userNotificationPreferences,
  novelNotificationPreferences,
  readingEvents,
  readingProgress,
  tags,
  users,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { getHomeContent, getPublicAuthor, getPublicChapter, getPublicNovel, listPublicAuthors, listPublicCategories, listPublicNovels } from "../content";
import { normalizeArabic, toSlug } from "../lib/arabic";
import { getUserAccessUpdateError } from "../lib/access";
import { mapChapterOrder } from "../lib/chapters";
import { reviewInputSchema } from "../lib/reviews";
import { getReaderAccess } from "../lib/subscriptionAccess";
import { notifyOwner } from "../_core/notification";
import { adminProcedure, editorProcedure, protectedProcedure, publicProcedure, router, superAdminProcedure } from "../_core/trpc";

const publicationStatus = z.enum(["draft", "review", "published", "unpublished", "archived"]);
const paginationInput = z.object({ limit: z.number().int().min(1).max(48).optional(), offset: z.number().int().min(0).optional() });

async function requireDb() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة مؤقتًا." });
  return db;
}

async function logActivity(actorUserId: number, action: string, entityType: string, entityId: number, metadata?: Record<string, unknown>) {
  const db = await getDb();
  if (!db) return;
  await db.insert(activityLogs).values({ actorUserId, action, entityType, entityId, metadata });
}

async function notifyChapterFollowers(novelId: number, chapterId: number, chapterTitle: string) {
  const db = await getDb();
  if (!db) return;
  const [novel] = await db.select({ title: novels.title, slug: novels.slug }).from(novels).where(eq(novels.id, novelId)).limit(1);
  if (!novel) return;
  const [chapter] = await db.select({ slug: chapters.slug }).from(chapters).where(eq(chapters.id, chapterId)).limit(1);
  if (!chapter) return;
  const followers = await db.select({ userId: novelFollows.userId }).from(novelFollows).where(eq(novelFollows.novelId, novelId));
  const favoriteReaders = await db.select({ userId: favorites.userId }).from(favorites).where(eq(favorites.novelId, novelId));
  const recipientIds = Array.from(new Set([...followers.map(item => item.userId), ...favoriteReaders.map(item => item.userId)]));
  if (!recipientIds.length) return;
  const preferences = await db.select({ userId: novelNotificationPreferences.userId, enabled: novelNotificationPreferences.enabled }).from(novelNotificationPreferences).where(and(eq(novelNotificationPreferences.novelId, novelId), inArray(novelNotificationPreferences.userId, recipientIds)));
  const enabledByUser = new Map(preferences.map(item => [item.userId, item.enabled]));
  const optedInRecipients = recipientIds.filter(userId => enabledByUser.get(userId) !== false);
  if (!optedInRecipients.length) return;
  await db.insert(notifications).values(optedInRecipients.map(userId => ({ userId, type: "new_chapter" as const, title: `فصل جديد من «${novel.title}»`, body: `نُشر فصل «${chapterTitle}» لرواية محفوظة لديك. يمكنك متابعته الآن.`, href: `/read/${novel.slug}/${chapter.slug}` })));
}

export const catalogRouter = router({
  home: publicProcedure.query(() => getHomeContent()),
  listNovels: publicProcedure.input(paginationInput.extend({ query: z.string().max(180).optional(), categorySlug: z.string().max(120).optional() })).query(({ input }) => listPublicNovels(input)),
  detail: publicProcedure.input(z.object({ slug: z.string().min(1).max(280) })).query(({ input }) => getPublicNovel(input.slug)),
  listAuthors: publicProcedure.input(paginationInput.extend({ query: z.string().max(180).optional() })).query(({ input }) => listPublicAuthors(input)),
  author: publicProcedure.input(z.object({ slug: z.string().min(1).max(220) })).query(({ input }) => getPublicAuthor(input.slug)),
  categories: publicProcedure.query(() => listPublicCategories()),
  read: publicProcedure.input(z.object({ novelSlug: z.string().min(1), chapterSlug: z.string().min(1) })).query(async ({ ctx, input }) => {
    const chapter = await getPublicChapter(input.novelSlug, input.chapterSlug);
    if (!chapter) return null;
    const access = await getReaderAccess(ctx.user?.id, { novelId: chapter.novelId, sortOrder: chapter.sortOrder });
    const { audioUrl, ...safeChapter } = chapter;
    if (!access.allowed) return { ...safeChapter, content: "", hasAudio: Boolean(audioUrl), access };
    return { ...safeChapter, hasAudio: Boolean(audioUrl), access };
  }),
  recordView: publicProcedure.input(z.object({ novelId: z.number().int(), chapterId: z.number().int().optional(), eventType: z.enum(["novel_view", "chapter_open", "chapter_complete"]) })).mutation(async ({ input }) => {
    const db = await requireDb();
    await db.insert(readingEvents).values({ novelId: input.novelId, chapterId: input.chapterId, eventType: input.eventType });
    return { success: true };
  }),
});

export const libraryRouter = router({
  toggleFavorite: protectedProcedure.input(z.object({ novelId: z.number().int() })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const existing = await db.select({ id: favorites.id }).from(favorites).where(and(eq(favorites.userId, ctx.user.id), eq(favorites.novelId, input.novelId))).limit(1);
    if (existing[0]) {
      await db.delete(favorites).where(eq(favorites.id, existing[0].id));
      return { active: false };
    }
    await db.insert(favorites).values({ userId: ctx.user.id, novelId: input.novelId });
    return { active: true };
  }),
  toggleFollow: protectedProcedure.input(z.object({ novelId: z.number().int() })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const existing = await db.select({ id: novelFollows.id }).from(novelFollows).where(and(eq(novelFollows.userId, ctx.user.id), eq(novelFollows.novelId, input.novelId))).limit(1);
    if (existing[0]) {
      await db.delete(novelFollows).where(eq(novelFollows.id, existing[0].id));
      return { active: false };
    }
    await db.insert(novelFollows).values({ userId: ctx.user.id, novelId: input.novelId });
    return { active: true };
  }),
  saveProgress: protectedProcedure.input(z.object({ novelId: z.number().int(), chapterId: z.number().int(), characterOffset: z.number().int().min(0), progressPercent: z.number().int().min(0).max(100), isCompleted: z.boolean().default(false) })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    await db.insert(readingProgress).values({ userId: ctx.user.id, ...input, lastReadAt: new Date() }).onDuplicateKeyUpdate({ set: { chapterId: input.chapterId, characterOffset: input.characterOffset, progressPercent: input.progressPercent, isCompleted: input.isCompleted, lastReadAt: new Date() } });
    return { success: true };
  }),
  continueReading: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    return db.select({ novelId: readingProgress.novelId, chapterId: readingProgress.chapterId, progressPercent: readingProgress.progressPercent, lastReadAt: readingProgress.lastReadAt, novelTitle: novels.title, novelSlug: novels.slug, chapterSlug: chapters.slug, chapterTitle: chapters.title, totalReadingSeconds: readingProgress.totalReadingSeconds }).from(readingProgress).innerJoin(novels, eq(readingProgress.novelId, novels.id)).innerJoin(chapters, eq(readingProgress.chapterId, chapters.id)).where(eq(readingProgress.userId, ctx.user.id)).orderBy(desc(readingProgress.lastReadAt)).limit(12);
  }),
  quotes: protectedProcedure.input(z.object({ chapterId: z.number().int().positive().optional() }).optional()).query(async ({ ctx, input }) => {
    const db = await requireDb();
    const chapterCondition = input?.chapterId ? eq(favoriteQuotes.chapterId, input.chapterId) : undefined;
    return db.select({ id: favoriteQuotes.id, novelId: favoriteQuotes.novelId, chapterId: favoriteQuotes.chapterId, selectedText: favoriteQuotes.selectedText, startOffset: favoriteQuotes.startOffset, endOffset: favoriteQuotes.endOffset, createdAt: favoriteQuotes.createdAt, chapterTitle: chapters.title, novelTitle: novels.title }).from(favoriteQuotes).innerJoin(chapters, eq(favoriteQuotes.chapterId, chapters.id)).innerJoin(novels, eq(favoriteQuotes.novelId, novels.id)).where(chapterCondition ? and(eq(favoriteQuotes.userId, ctx.user.id), chapterCondition) : eq(favoriteQuotes.userId, ctx.user.id)).orderBy(desc(favoriteQuotes.createdAt)).limit(100);
  }),
  saveQuote: protectedProcedure.input(z.object({ novelId: z.number().int().positive(), chapterId: z.number().int().positive(), selectedText: z.string().trim().min(1, "حدد نصًا قبل حفظ الاقتباس.").max(2000), startOffset: z.number().int().min(0).optional(), endOffset: z.number().int().min(0).optional() })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const [chapter] = await db.select({ id: chapters.id, novelId: chapters.novelId }).from(chapters).where(and(eq(chapters.id, input.chapterId), eq(chapters.novelId, input.novelId))).limit(1);
    if (!chapter) throw new TRPCError({ code: "BAD_REQUEST", message: "الفصل المحدد لا ينتمي إلى الرواية المطلوبة." });
    const [created] = await db.insert(favoriteQuotes).values({ userId: ctx.user.id, ...input }).$returningId();
    return { success: true, id: created.id };
  }),
  deleteQuote: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const [quote] = await db.select({ id: favoriteQuotes.id }).from(favoriteQuotes).where(and(eq(favoriteQuotes.id, input.id), eq(favoriteQuotes.userId, ctx.user.id))).limit(1);
    if (!quote) throw new TRPCError({ code: "NOT_FOUND", message: "الاقتباس غير موجود أو لا تملك صلاحية حذفه." });
    await db.delete(favoriteQuotes).where(eq(favoriteQuotes.id, input.id));
    return { success: true };
  }),
  favorites: protectedProcedure.input(z.object({ sort: z.enum(["recent", "alphabetical"]).default("recent"), categorySlug: z.string().max(120).optional() }).optional()).query(async ({ ctx, input }) => {
    const db = await requireDb();
    const orderBy = input?.sort === "alphabetical" ? asc(novels.title) : desc(favorites.createdAt);
    const userCondition = eq(favorites.userId, ctx.user.id);
    const categoryCondition = input?.categorySlug ? sql`EXISTS (SELECT 1 FROM novel_categories nc INNER JOIN categories c ON c.id = nc.categoryId WHERE nc.novelId = ${novels.id} AND c.slug = ${input.categorySlug})` : undefined;
    return db.select({ novelId: novels.id, title: novels.title, slug: novels.slug, shortDescription: novels.shortDescription, authorName: authors.displayName, authorSlug: authors.slug, chapterCount: novels.chapterCount, favoritedAt: favorites.createdAt, personalRating: favoriteRatings.rating, personalNote: favoriteNotes.note, personalNotePublished: favoriteNotes.isPublished, totalReadingSeconds: readingProgress.totalReadingSeconds, progressPercent: readingProgress.progressPercent, isCompleted: readingProgress.isCompleted }).from(favorites).innerJoin(novels, eq(favorites.novelId, novels.id)).innerJoin(authors, eq(novels.authorId, authors.id)).leftJoin(favoriteRatings, and(eq(favoriteRatings.novelId, novels.id), eq(favoriteRatings.userId, ctx.user.id))).leftJoin(favoriteNotes, and(eq(favoriteNotes.novelId, novels.id), eq(favoriteNotes.userId, ctx.user.id))).leftJoin(readingProgress, and(eq(readingProgress.novelId, novels.id), eq(readingProgress.userId, ctx.user.id))).where(categoryCondition ? and(userCondition, categoryCondition) : userCondition).orderBy(orderBy).limit(24);
  }),
  saveFavoriteNote: protectedProcedure.input(z.object({ novelId: z.number().int(), note: z.string().trim().max(2000) })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const [favorite] = await db.select({ id: favorites.id }).from(favorites).where(and(eq(favorites.userId, ctx.user.id), eq(favorites.novelId, input.novelId))).limit(1);
    if (!favorite) throw new TRPCError({ code: "NOT_FOUND", message: "احفظ الرواية في المفضلة أولًا قبل كتابة ملاحظة." });
    if (!input.note) {
      await db.delete(favoriteNotes).where(and(eq(favoriteNotes.userId, ctx.user.id), eq(favoriteNotes.novelId, input.novelId)));
    } else {
      await db.insert(favoriteNotes).values({ userId: ctx.user.id, novelId: input.novelId, note: input.note }).onDuplicateKeyUpdate({ set: { note: input.note, updatedAt: new Date() } });
    }
    return { success: true };
  }),
  suggestions: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    const favoriteSeeds = await db.select({ novelId: favorites.novelId }).from(favorites).where(eq(favorites.userId, ctx.user.id));
    const readingSeeds = await db.select({ novelId: readingProgress.novelId }).from(readingProgress).where(eq(readingProgress.userId, ctx.user.id));
    const ratingSeeds = await db.select({ novelId: favoriteRatings.novelId, rating: favoriteRatings.rating }).from(favoriteRatings).where(and(eq(favoriteRatings.userId, ctx.user.id), sql`${favoriteRatings.rating} >= 4`));
    const highRatedSeedIds = new Set(ratingSeeds.map(row => row.novelId));
    const seedIds = Array.from(new Set([...favoriteSeeds, ...readingSeeds].map(row => row.novelId)));
    if (!seedIds.length) return [];
    const dismissedRows = await db.select({ novelId: recommendationDismissals.novelId }).from(recommendationDismissals).where(eq(recommendationDismissals.userId, ctx.user.id));
    const dismissedIds = dismissedRows.map(row => row.novelId);
    const seedCategoryRows = await db.select({ novelId: novelCategories.novelId, categoryId: novelCategories.categoryId }).from(novelCategories).where(inArray(novelCategories.novelId, seedIds));
    const seedTagRows = await db.select({ novelId: novelTags.novelId, tagId: novelTags.tagId }).from(novelTags).where(inArray(novelTags.novelId, seedIds));
    const categoryIds = new Set(seedCategoryRows.map(row => row.categoryId));
    const tagIds = new Set(seedTagRows.map(row => row.tagId));
    const highRatedCategoryIds = new Set(seedCategoryRows.filter(row => highRatedSeedIds.has(row.novelId)).map(row => row.categoryId));
    const highRatedTagIds = new Set(seedTagRows.filter(row => highRatedSeedIds.has(row.novelId)).map(row => row.tagId));
    const candidates = await db.select({ novelId: novels.id, title: novels.title, slug: novels.slug, shortDescription: novels.shortDescription, authorName: authors.displayName }).from(novels).innerJoin(authors, eq(novels.authorId, authors.id)).where(not(inArray(novels.id, [...seedIds, ...dismissedIds]))).limit(100);
    if (!candidates.length) return [];
    const candidateIds = candidates.map(row => row.novelId);
    const candidateCategories = await db.select({ novelId: novelCategories.novelId, categoryId: novelCategories.categoryId }).from(novelCategories).where(inArray(novelCategories.novelId, candidateIds));
    const candidateTags = await db.select({ novelId: novelTags.novelId, tagId: novelTags.tagId }).from(novelTags).where(inArray(novelTags.novelId, candidateIds));
    const scores = new Map<number, number>();
    candidateCategories.forEach(row => { if (categoryIds.has(row.categoryId)) scores.set(row.novelId, (scores.get(row.novelId) ?? 0) + (highRatedCategoryIds.has(row.categoryId) ? 4 : 2)); });
    candidateTags.forEach(row => { if (tagIds.has(row.tagId)) scores.set(row.novelId, (scores.get(row.novelId) ?? 0) + (highRatedTagIds.has(row.tagId) ? 2 : 1)); });
    return candidates.map(row => ({ ...row, relevanceScore: scores.get(row.novelId) ?? 0 })).filter(row => row.relevanceScore > 0).sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 8);
  }),
  publishFavoriteNote: protectedProcedure.input(z.object({ novelId: z.number().int(), rating: z.number().int().min(1).max(5).optional() })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const [note] = await db.select({ note: favoriteNotes.note }).from(favoriteNotes).where(and(eq(favoriteNotes.userId, ctx.user.id), eq(favoriteNotes.novelId, input.novelId))).limit(1);
    const [favorite] = await db.select({ id: favorites.id }).from(favorites).where(and(eq(favorites.userId, ctx.user.id), eq(favorites.novelId, input.novelId))).limit(1);
    const [savedRating] = await db.select({ rating: favoriteRatings.rating }).from(favoriteRatings).where(and(eq(favoriteRatings.userId, ctx.user.id), eq(favoriteRatings.novelId, input.novelId))).limit(1);
    if (!note || !favorite) throw new TRPCError({ code: "NOT_FOUND", message: "اكتب ملاحظة لرواية محفوظة في المفضلة أولًا." });
    const rating = input.rating ?? savedRating?.rating;
    if (!rating) throw new TRPCError({ code: "BAD_REQUEST", message: "اختر تقييمًا بالنجوم قبل نشر الملاحظة كمراجعة." });
    const body = note.note.replace(/\\*\\*(.*?)\\*\\*/g, "$1").replace(/^[-*] /gm, "• ");
    await db.insert(novelReviews).values({ novelId: input.novelId, userId: ctx.user.id, rating, body }).onDuplicateKeyUpdate({ set: { rating, body, updatedAt: new Date() } });
    await db.update(favoriteNotes).set({ isPublished: true }).where(and(eq(favoriteNotes.userId, ctx.user.id), eq(favoriteNotes.novelId, input.novelId)));
    return { success: true };
  }),
  unpublishFavoriteNote: protectedProcedure.input(z.object({ novelId: z.number().int() })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    await db.delete(novelReviews).where(and(eq(novelReviews.userId, ctx.user.id), eq(novelReviews.novelId, input.novelId)));
    await db.update(favoriteNotes).set({ isPublished: false }).where(and(eq(favoriteNotes.userId, ctx.user.id), eq(favoriteNotes.novelId, input.novelId)));
    return { success: true };
  }),
  dismissSuggestion: protectedProcedure.input(z.object({ novelId: z.number().int() })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    await db.insert(recommendationDismissals).values({ userId: ctx.user.id, novelId: input.novelId }).onDuplicateKeyUpdate({ set: { novelId: input.novelId } });
    return { success: true };
  }),
  rateFavorite: protectedProcedure.input(z.object({ novelId: z.number().int(), rating: z.number().int().min(1).max(5) })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const [favorite] = await db.select({ id: favorites.id }).from(favorites).where(and(eq(favorites.userId, ctx.user.id), eq(favorites.novelId, input.novelId))).limit(1);
    if (!favorite) throw new TRPCError({ code: "NOT_FOUND", message: "احفظ الرواية في المفضلة أولًا قبل تقييمها." });
    await db.insert(favoriteRatings).values({ userId: ctx.user.id, novelId: input.novelId, rating: input.rating }).onDuplicateKeyUpdate({ set: { rating: input.rating, updatedAt: new Date() } });
    return { success: true, rating: input.rating };
  }),
  recordReadingTime: protectedProcedure.input(z.object({ novelId: z.number().int(), seconds: z.number().int().min(1).max(300) })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    await db.update(readingProgress).set({ totalReadingSeconds: sql`${readingProgress.totalReadingSeconds} + ${input.seconds}` }).where(and(eq(readingProgress.userId, ctx.user.id), eq(readingProgress.novelId, input.novelId)));
    return { success: true };
  }),
  favoriteLists: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    return db.select({ id: favoriteLists.id, name: favoriteLists.name, itemCount: count(favoriteListItems.id) }).from(favoriteLists).leftJoin(favoriteListItems, eq(favoriteListItems.listId, favoriteLists.id)).where(eq(favoriteLists.userId, ctx.user.id)).groupBy(favoriteLists.id, favoriteLists.name).orderBy(asc(favoriteLists.name));
  }),
  createFavoriteList: protectedProcedure.input(z.object({ name: z.string().trim().min(1).max(120) })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const [existing] = await db.select({ id: favoriteLists.id }).from(favoriteLists).where(and(eq(favoriteLists.userId, ctx.user.id), eq(favoriteLists.name, input.name))).limit(1);
    if (existing) throw new TRPCError({ code: "CONFLICT", message: "توجد قائمة بهذا الاسم بالفعل." });
    const result = await db.insert(favoriteLists).values({ userId: ctx.user.id, name: input.name });
    return { id: Number(result[0].insertId), name: input.name };
  }),
  deleteFavoriteList: protectedProcedure.input(z.object({ id: z.number().int() })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    await db.delete(favoriteLists).where(and(eq(favoriteLists.id, input.id), eq(favoriteLists.userId, ctx.user.id)));
    return { success: true };
  }),
  addFavoriteToList: protectedProcedure.input(z.object({ listId: z.number().int(), novelId: z.number().int() })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const [list] = await db.select({ id: favoriteLists.id }).from(favoriteLists).where(and(eq(favoriteLists.id, input.listId), eq(favoriteLists.userId, ctx.user.id))).limit(1);
    const [favorite] = await db.select({ id: favorites.id }).from(favorites).where(and(eq(favorites.userId, ctx.user.id), eq(favorites.novelId, input.novelId))).limit(1);
    if (!list || !favorite) throw new TRPCError({ code: "NOT_FOUND", message: "القائمة أو الرواية المفضلة غير متاحة." });
    await db.insert(favoriteListItems).values({ listId: input.listId, novelId: input.novelId }).onDuplicateKeyUpdate({ set: { novelId: input.novelId } });
    return { success: true };
  }),
  markAllNotificationsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await requireDb();
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, ctx.user.id));
    return { success: true };
  }),
  deleteAllNotifications: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await requireDb();
    await db.delete(notifications).where(eq(notifications.userId, ctx.user.id));
    return { success: true };
  }),
  notifications: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    return db.select().from(notifications).where(eq(notifications.userId, ctx.user.id)).orderBy(desc(notifications.createdAt)).limit(50);
  }),
  notificationSettings: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    const [global] = await db.select({ popupEnabled: userNotificationPreferences.popupEnabled }).from(userNotificationPreferences).where(eq(userNotificationPreferences.userId, ctx.user.id)).limit(1);
    const rows = await db.select({ novelId: favorites.novelId, title: novels.title, enabled: novelNotificationPreferences.enabled }).from(favorites).innerJoin(novels, eq(favorites.novelId, novels.id)).leftJoin(novelNotificationPreferences, and(eq(novelNotificationPreferences.userId, ctx.user.id), eq(novelNotificationPreferences.novelId, favorites.novelId))).where(eq(favorites.userId, ctx.user.id)).orderBy(asc(novels.title));
    return { popupEnabled: global?.popupEnabled ?? true, novels: rows.map(row => ({ novelId: row.novelId, title: row.title, enabled: row.enabled ?? true })) };
  }),
  setPopupNotifications: protectedProcedure.input(z.object({ enabled: z.boolean() })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    await db.insert(userNotificationPreferences).values({ userId: ctx.user.id, popupEnabled: input.enabled }).onDuplicateKeyUpdate({ set: { popupEnabled: input.enabled, updatedAt: new Date() } });
    return { popupEnabled: input.enabled };
  }),
  setNovelNotifications: protectedProcedure.input(z.object({ novelId: z.number().int().positive(), enabled: z.boolean() })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const [favorite] = await db.select({ id: favorites.id }).from(favorites).where(and(eq(favorites.userId, ctx.user.id), eq(favorites.novelId, input.novelId))).limit(1);
    if (!favorite) throw new TRPCError({ code: "NOT_FOUND", message: "يمكن تخصيص تنبيهات روايات مكتبتك فقط." });
    await db.insert(novelNotificationPreferences).values({ userId: ctx.user.id, novelId: input.novelId, enabled: input.enabled }).onDuplicateKeyUpdate({ set: { enabled: input.enabled, updatedAt: new Date() } });
    return { novelId: input.novelId, enabled: input.enabled };
  }),
  markNotificationRead: protectedProcedure.input(z.object({ id: z.number().int() })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.id, input.id), eq(notifications.userId, ctx.user.id)));
    return { success: true };
  }),
});

export const reviewsRouter = router({
  summary: publicProcedure.input(z.object({ novelId: z.number().int() })).query(async ({ input }) => {
    const db = await requireDb();
    const [summary] = await db.select({ average: sql<string | null>`AVG(${novelReviews.rating})`, count: count(novelReviews.id) }).from(novelReviews).where(eq(novelReviews.novelId, input.novelId));
    return { average: summary?.average ? Number(summary.average) : null, count: Number(summary?.count ?? 0) };
  }),
  list: publicProcedure.input(z.object({ novelId: z.number().int(), limit: z.number().int().min(1).max(30).default(12) })).query(async ({ input }) => {
    const db = await requireDb();
    return db.select({ id: novelReviews.id, rating: novelReviews.rating, body: novelReviews.body, createdAt: novelReviews.createdAt, updatedAt: novelReviews.updatedAt, userName: users.name }).from(novelReviews).innerJoin(users, eq(novelReviews.userId, users.id)).where(eq(novelReviews.novelId, input.novelId)).orderBy(desc(novelReviews.updatedAt)).limit(input.limit);
  }),
  mine: protectedProcedure.input(z.object({ novelId: z.number().int() })).query(async ({ ctx, input }) => {
    const db = await requireDb();
    const [review] = await db.select({ id: novelReviews.id, rating: novelReviews.rating, body: novelReviews.body, updatedAt: novelReviews.updatedAt }).from(novelReviews).where(and(eq(novelReviews.novelId, input.novelId), eq(novelReviews.userId, ctx.user.id))).limit(1);
    return review ?? null;
  }),
  upsert: protectedProcedure.input(reviewInputSchema).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const [novel] = await db.select({ id: novels.id, status: novels.status }).from(novels).where(eq(novels.id, input.novelId)).limit(1);
    if (!novel || novel.status !== "published") throw new TRPCError({ code: "NOT_FOUND", message: "لا يمكن تقييم رواية غير منشورة." });
    await db.insert(novelReviews).values({ novelId: input.novelId, userId: ctx.user.id, rating: input.rating, body: input.body }).onDuplicateKeyUpdate({ set: { rating: input.rating, body: input.body, updatedAt: new Date() } });
    await logActivity(ctx.user.id, "review.upserted", "novel", input.novelId, { rating: input.rating });
    return { success: true };
  }),
  remove: protectedProcedure.input(z.object({ novelId: z.number().int() })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    await db.delete(novelReviews).where(and(eq(novelReviews.novelId, input.novelId), eq(novelReviews.userId, ctx.user.id)));
    await logActivity(ctx.user.id, "review.deleted", "novel", input.novelId);
    return { success: true };
  }),
});

export const adminRouter = router({
  dashboard: adminProcedure.query(async () => {
    const db = await requireDb();
    const [novelCount, authorCount, chapterCount, readingCount, userCount, recentActivity] = await Promise.all([
      db.select({ value: count() }).from(novels),
      db.select({ value: count() }).from(authors),
      db.select({ value: count() }).from(chapters),
      db.select({ value: count() }).from(readingEvents),
      db.select({ value: count() }).from(users),
      db.select({ id: activityLogs.id, action: activityLogs.action, entityType: activityLogs.entityType, createdAt: activityLogs.createdAt }).from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(8),
    ]);
    return { novels: novelCount[0]?.value ?? 0, authors: authorCount[0]?.value ?? 0, chapters: chapterCount[0]?.value ?? 0, readings: readingCount[0]?.value ?? 0, users: userCount[0]?.value ?? 0, recentActivity };
  }),
  listUsers: superAdminProcedure.input(paginationInput).query(async ({ input }) => {
    const db = await requireDb();
    return db.select({ id: users.id, name: users.name, email: users.email, role: users.role, isDisabled: users.isDisabled, lastSignedIn: users.lastSignedIn, createdAt: users.createdAt }).from(users).orderBy(desc(users.lastSignedIn)).limit(input.limit ?? 48).offset(input.offset ?? 0);
  }),
  updateUserAccess: superAdminProcedure.input(z.object({ id: z.number().int(), role: z.enum(["user", "editor", "admin", "super_admin"]), isDisabled: z.boolean() })).mutation(async ({ ctx, input }) => {
    const accessError = getUserAccessUpdateError({ actorId: ctx.user.id, actorRole: ctx.user.role, targetId: input.id, nextRole: input.role, isDisabled: input.isDisabled });
    if (accessError) throw new TRPCError(accessError);
    const db = await requireDb();
    await db.update(users).set({ role: input.role, isDisabled: input.isDisabled }).where(eq(users.id, input.id));
    await logActivity(ctx.user.id, "user.access.updated", "user", input.id, { role: input.role, isDisabled: input.isDisabled });
    return { success: true };
  }),
  listAuthors: editorProcedure.input(paginationInput).query(async ({ input }) => {
    const db = await requireDb();
    return db.select({ id: authors.id, name: authors.name, displayName: authors.displayName, slug: authors.slug, shortBio: authors.shortBio, biography: authors.biography, imageMediaId: authors.imageMediaId, visible: authors.isVisible, updatedAt: authors.updatedAt }).from(authors).orderBy(desc(authors.updatedAt)).limit(input.limit ?? 24).offset(input.offset ?? 0);
  }),
  listNovels: editorProcedure.input(paginationInput).query(async ({ input }) => {
    const db = await requireDb();
    return db.select({ id: novels.id, authorId: novels.authorId, title: novels.title, subtitle: novels.subtitle, slug: novels.slug, shortDescription: novels.shortDescription, description: novels.description, coverMediaId: novels.coverMediaId, status: novels.status, isFeatured: novels.isFeatured, chapterCount: novels.chapterCount, authorName: authors.displayName, updatedAt: novels.updatedAt }).from(novels).innerJoin(authors, eq(novels.authorId, authors.id)).orderBy(desc(novels.updatedAt)).limit(input.limit ?? 24).offset(input.offset ?? 0);
  }),
  listChapters: editorProcedure.input(z.object({ novelId: z.number().int() })).query(async ({ input }) => {
    const db = await requireDb();
    return db.select({ id: chapters.id, title: chapters.title, slug: chapters.slug, sortOrder: chapters.sortOrder, content: chapters.content, excerpt: chapters.excerpt, status: chapters.status, updatedAt: chapters.updatedAt }).from(chapters).where(eq(chapters.novelId, input.novelId)).orderBy(asc(chapters.sortOrder));
  }),
  listCategories: editorProcedure.query(async () => {
    const db = await requireDb();
    return db.select({ id: categories.id, name: categories.name, slug: categories.slug, visible: categories.isVisible, updatedAt: categories.updatedAt }).from(categories).orderBy(asc(categories.name));
  }),
  listTags: editorProcedure.query(async () => {
    const db = await requireDb();
    return db.select({ id: tags.id, name: tags.name, slug: tags.slug, archived: tags.isArchived, updatedAt: tags.updatedAt }).from(tags).orderBy(asc(tags.name));
  }),
  getNovelTaxonomy: editorProcedure.input(z.object({ novelId: z.number().int() })).query(async ({ input }) => {
    const db = await requireDb();
    const [categoryRows, tagRows] = await Promise.all([
      db.select({ id: novelCategories.categoryId }).from(novelCategories).where(eq(novelCategories.novelId, input.novelId)),
      db.select({ id: novelTags.tagId }).from(novelTags).where(eq(novelTags.novelId, input.novelId)),
    ]);
    return { categoryIds: categoryRows.map(row => row.id), tagIds: tagRows.map(row => row.id) };
  }),
  upsertAuthor: editorProcedure.input(z.object({ id: z.number().int().optional(), name: z.string().min(2).max(180), displayName: z.string().min(2).max(180).optional(), slug: z.string().max(220).optional(), shortBio: z.string().max(1500).optional(), biography: z.string().max(30000).optional(), imageMediaId: z.number().int().optional().nullable(), isVisible: z.boolean().default(true), seoTitle: z.string().max(255).optional(), seoDescription: z.string().max(360).optional() })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const displayName = input.displayName?.trim() || input.name.trim();
    const values = { name: input.name.trim(), displayName, normalizedName: normalizeArabic(displayName), slug: input.slug?.trim() || toSlug(displayName), shortBio: input.shortBio, biography: input.biography, imageMediaId: input.imageMediaId ?? null, isVisible: input.isVisible, seoTitle: input.seoTitle, seoDescription: input.seoDescription };
    if (input.id) {
      await db.update(authors).set(values).where(eq(authors.id, input.id));
      await logActivity(ctx.user.id, "author.updated", "author", input.id);
      return { id: input.id };
    }
    const result = await db.insert(authors).values(values);
    const id = Number(result[0].insertId);
    await logActivity(ctx.user.id, "author.created", "author", id);
    return { id };
  }),
  archiveAuthor: adminProcedure.input(z.object({ id: z.number().int() })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    await db.update(authors).set({ isVisible: false }).where(eq(authors.id, input.id));
    await logActivity(ctx.user.id, "author.archived", "author", input.id);
    return { success: true };
  }),
  archiveNovel: adminProcedure.input(z.object({ id: z.number().int() })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    await db.update(novels).set({ status: "archived", archivedAt: new Date(), updatedByUserId: ctx.user.id }).where(eq(novels.id, input.id));
    await db.update(chapters).set({ status: "archived", updatedByUserId: ctx.user.id }).where(eq(chapters.novelId, input.id));
    await logActivity(ctx.user.id, "novel.archived", "novel", input.id);
    return { success: true };
  }),
  upsertNovel: editorProcedure.input(z.object({ id: z.number().int().optional(), authorId: z.number().int(), title: z.string().min(2).max(255), subtitle: z.string().max(255).optional(), slug: z.string().max(280).optional(), shortDescription: z.string().max(1500).optional(), description: z.string().max(50000).optional(), coverMediaId: z.number().int().optional().nullable(), status: publicationStatus.default("draft"), isFeatured: z.boolean().default(false), seoTitle: z.string().max(255).optional(), seoDescription: z.string().max(360).optional() })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const now = new Date();
    const values = { authorId: input.authorId, title: input.title.trim(), subtitle: input.subtitle, slug: input.slug?.trim() || toSlug(input.title), shortDescription: input.shortDescription, description: input.description, normalizedTitle: normalizeArabic(input.title), coverMediaId: input.coverMediaId ?? null, status: input.status, isFeatured: input.isFeatured, seoTitle: input.seoTitle, seoDescription: input.seoDescription, updatedByUserId: ctx.user.id };
    if (input.id) {
      const existing = await db.select({ status: novels.status, publishedAt: novels.publishedAt }).from(novels).where(eq(novels.id, input.id)).limit(1);
      await db.update(novels).set({ ...values, publishedAt: input.status === "published" && !existing[0]?.publishedAt ? now : existing[0]?.publishedAt ?? null }).where(eq(novels.id, input.id));
      await logActivity(ctx.user.id, "novel.updated", "novel", input.id, { status: input.status });
      if (input.status === "published" && existing[0]?.status !== "published") await notifyOwner({ title: "نُشرت رواية جديدة", content: `تم نشر رواية «${input.title.trim()}».` });
      return { id: input.id };
    }
    const result = await db.insert(novels).values({ ...values, createdByUserId: ctx.user.id, publishedAt: input.status === "published" ? now : null });
    const id = Number(result[0].insertId);
    await logActivity(ctx.user.id, "novel.created", "novel", id, { status: input.status });
    if (input.status === "published") await notifyOwner({ title: "نُشرت رواية جديدة", content: `تم نشر رواية «${input.title.trim()}».` });
    return { id };
  }),
  upsertChapter: editorProcedure.input(z.object({ id: z.number().int().optional(), novelId: z.number().int(), title: z.string().min(1).max(255), slug: z.string().max(280).optional(), sortOrder: z.number().int().min(1), content: z.string().min(1).max(200000), excerpt: z.string().max(1500).optional(), status: publicationStatus.default("draft") })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const now = new Date();
    const values = { novelId: input.novelId, title: input.title.trim(), slug: input.slug?.trim() || toSlug(input.title), sortOrder: input.sortOrder, content: input.content, excerpt: input.excerpt, status: input.status, updatedByUserId: ctx.user.id };
    if (input.id) {
      const existing = await db.select({ status: chapters.status, publishedAt: chapters.publishedAt }).from(chapters).where(eq(chapters.id, input.id)).limit(1);
      await db.update(chapters).set({ ...values, publishedAt: input.status === "published" && !existing[0]?.publishedAt ? now : existing[0]?.publishedAt ?? null }).where(eq(chapters.id, input.id));
      await logActivity(ctx.user.id, "chapter.updated", "chapter", input.id, { novelId: input.novelId, status: input.status });
      if (input.status === "published" && existing[0]?.status !== "published") { await notifyOwner({ title: "نُشر فصل جديد", content: `تم نشر فصل «${input.title.trim()}».` }); await notifyChapterFollowers(input.novelId, input.id, input.title.trim()); }
      return { id: input.id };
    }
    const result = await db.insert(chapters).values({ ...values, createdByUserId: ctx.user.id, publishedAt: input.status === "published" ? now : null });
    const id = Number(result[0].insertId);
    await db.update(novels).set({ chapterCount: sql`${novels.chapterCount} + 1`, updatedByUserId: ctx.user.id }).where(eq(novels.id, input.novelId));
    await logActivity(ctx.user.id, "chapter.created", "chapter", id, { novelId: input.novelId, status: input.status });
    if (input.status === "published") { await notifyOwner({ title: "نُشر فصل جديد", content: `تم نشر فصل «${input.title.trim()}».` }); await notifyChapterFollowers(input.novelId, id, input.title.trim()); }
    return { id };
  }),
  archiveChapter: editorProcedure.input(z.object({ id: z.number().int(), novelId: z.number().int() })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    await db.update(chapters).set({ status: "archived", updatedByUserId: ctx.user.id }).where(and(eq(chapters.id, input.id), eq(chapters.novelId, input.novelId)));
    await logActivity(ctx.user.id, "chapter.archived", "chapter", input.id, { novelId: input.novelId });
    return { success: true };
  }),
  reorderChapters: editorProcedure.input(z.object({ novelId: z.number().int(), orderedIds: z.array(z.number().int()).min(1).refine(ids => new Set(ids).size === ids.length, "لا يمكن تكرار الفصل في الترتيب.") })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    await db.update(chapters).set({ sortOrder: sql`${chapters.sortOrder} + 1000000` }).where(eq(chapters.novelId, input.novelId));
    await Promise.all(mapChapterOrder(input.orderedIds).map(item => db.update(chapters).set({ sortOrder: item.sortOrder, updatedByUserId: ctx.user.id }).where(and(eq(chapters.id, item.id), eq(chapters.novelId, input.novelId)))));
    await logActivity(ctx.user.id, "chapter.reordered", "novel", input.novelId, { count: input.orderedIds.length });
    return { success: true };
  }),
  upsertCategory: editorProcedure.input(z.object({ id: z.number().int().optional(), name: z.string().min(2).max(100), slug: z.string().max(120).optional(), description: z.string().max(1500).optional(), isVisible: z.boolean().default(true) })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const values = { name: input.name.trim(), normalizedName: normalizeArabic(input.name), slug: input.slug?.trim() || toSlug(input.name), description: input.description, isVisible: input.isVisible };
    if (input.id) { await db.update(categories).set(values).where(eq(categories.id, input.id)); await logActivity(ctx.user.id, "category.updated", "category", input.id); return { id: input.id }; }
    const result = await db.insert(categories).values(values); const id = Number(result[0].insertId); await logActivity(ctx.user.id, "category.created", "category", id); return { id };
  }),
  upsertTag: editorProcedure.input(z.object({ id: z.number().int().optional(), name: z.string().min(2).max(80), slug: z.string().max(100).optional(), isArchived: z.boolean().default(false) })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const values = { name: input.name.trim(), normalizedName: normalizeArabic(input.name), slug: input.slug?.trim() || toSlug(input.name), isArchived: input.isArchived };
    if (input.id) { await db.update(tags).set(values).where(eq(tags.id, input.id)); await logActivity(ctx.user.id, "tag.updated", "tag", input.id); return { id: input.id }; }
    const result = await db.insert(tags).values(values); const id = Number(result[0].insertId); await logActivity(ctx.user.id, "tag.created", "tag", id); return { id };
  }),
  setNovelTaxonomy: editorProcedure.input(z.object({ novelId: z.number().int(), categoryIds: z.array(z.number().int()).max(12), tagIds: z.array(z.number().int()).max(30) })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    await db.delete(novelCategories).where(eq(novelCategories.novelId, input.novelId));
    await db.delete(novelTags).where(eq(novelTags.novelId, input.novelId));
    if (input.categoryIds.length) await db.insert(novelCategories).values(input.categoryIds.map(categoryId => ({ novelId: input.novelId, categoryId })));
    if (input.tagIds.length) await db.insert(novelTags).values(input.tagIds.map(tagId => ({ novelId: input.novelId, tagId })));
    await logActivity(ctx.user.id, "novel.taxonomy.updated", "novel", input.novelId, { categories: input.categoryIds.length, tags: input.tagIds.length });
    return { success: true };
  }),
});
