import { and, asc, count, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import {
  authorFollows,
  authors,
  chapterComments,
  chapters,
  commentReports,
  favoriteRatings,
  favorites,
  notifications,
  novels,
  publicReadingListItems,
  publicReadingLists,
  readLater,
  readingEvents,
  readingProgress,
  userAchievements,
  users,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { adminProcedure, editorProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { canAuthorReply } from "../lib/authorReply";

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة مؤقتًا.");
  return db;
}

const listInput = z.object({ name: z.string().trim().min(2).max(120), description: z.string().trim().max(500).optional(), isPublic: z.boolean().default(false) });
const achievementDefinitions = [
  { key: "first_chapter", title: "فاتح الصفحات", description: "بدأت أول رحلة قراءة لك." },
  { key: "first_completion", title: "نهاية حكاية", description: "أكملت أول رواية." },
  { key: "five_completions", title: "قارئ نهم", description: "أكملت خمس روايات." },
  { key: "monthly_challenge", title: "تحدي الشهر", description: "أكملت تحدي القراءة الشهري." },
] as const;

async function refreshAchievements(userId: number) {
  const db = await requireDb();
  const [started] = await db.select({ total: count() }).from(readingProgress).where(eq(readingProgress.userId, userId));
  const [completed] = await db.select({ total: count() }).from(readingProgress).where(and(eq(readingProgress.userId, userId), eq(readingProgress.isCompleted, true)));
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const [monthly] = await db.select({ total: count() }).from(readingProgress).where(and(eq(readingProgress.userId, userId), eq(readingProgress.isCompleted, true), sql`${readingProgress.lastReadAt} >= ${monthStart}`));
  const earned = [started.total > 0 ? "first_chapter" : null, completed.total >= 1 ? "first_completion" : null, completed.total >= 5 ? "five_completions" : null, monthly.total >= 3 ? "monthly_challenge" : null].filter(Boolean) as string[];
  if (earned.length) await Promise.all(earned.map(achievementKey => db.insert(userAchievements).values({ userId, achievementKey }).onDuplicateKeyUpdate({ set: { achievementKey } })));
  return { started: started.total, completed: completed.total, monthlyCompleted: monthly.total, target: 3 };
}

export const communityRouter = router({
  publicLists: publicProcedure.query(async () => {
    const db = await requireDb();
    const lists = await db.select({ id: publicReadingLists.id, name: publicReadingLists.name, description: publicReadingLists.description, createdAt: publicReadingLists.createdAt, ownerName: users.name }).from(publicReadingLists).innerJoin(users, eq(publicReadingLists.userId, users.id)).where(eq(publicReadingLists.isPublic, true)).orderBy(desc(publicReadingLists.updatedAt)).limit(24);
    const counts = await db.select({ listId: publicReadingListItems.listId, total: count() }).from(publicReadingListItems).groupBy(publicReadingListItems.listId);
    const countByList = new Map(counts.map(row => [row.listId, row.total]));
    return lists.map(list => ({ ...list, itemCount: countByList.get(list.id) ?? 0 }));
  }),
  publicList: publicProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input }) => {
    const db = await requireDb();
    const [list] = await db.select({ id: publicReadingLists.id, name: publicReadingLists.name, description: publicReadingLists.description, ownerName: users.name }).from(publicReadingLists).innerJoin(users, eq(publicReadingLists.userId, users.id)).where(and(eq(publicReadingLists.id, input.id), eq(publicReadingLists.isPublic, true))).limit(1);
    if (!list) return null;
    const items = await db.select({ novelId: novels.id, title: novels.title, slug: novels.slug, shortDescription: novels.shortDescription, authorName: authors.displayName }).from(publicReadingListItems).innerJoin(novels, eq(publicReadingListItems.novelId, novels.id)).innerJoin(authors, eq(novels.authorId, authors.id)).where(eq(publicReadingListItems.listId, list.id)).orderBy(desc(publicReadingListItems.createdAt));
    return { ...list, items };
  }),
  myLists: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    const lists = await db.select().from(publicReadingLists).where(eq(publicReadingLists.userId, ctx.user.id)).orderBy(desc(publicReadingLists.updatedAt));
    const items = await db.select({ listId: publicReadingListItems.listId, novelId: publicReadingListItems.novelId, title: novels.title }).from(publicReadingListItems).innerJoin(novels, eq(publicReadingListItems.novelId, novels.id));
    return lists.map(list => ({ ...list, items: items.filter(item => item.listId === list.id) }));
  }),
  createList: protectedProcedure.input(listInput).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const [created] = await db.insert(publicReadingLists).values({ userId: ctx.user.id, ...input, description: input.description || null }).$returningId();
    return { id: created.id };
  }),
  updateList: protectedProcedure.input(z.object({ id: z.number().int().positive(), name: z.string().trim().min(2).max(120).optional(), description: z.string().trim().max(500).nullable().optional(), isPublic: z.boolean().optional() })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const [list] = await db.select({ id: publicReadingLists.id }).from(publicReadingLists).where(and(eq(publicReadingLists.id, input.id), eq(publicReadingLists.userId, ctx.user.id))).limit(1);
    if (!list) throw new Error("القائمة غير موجودة أو لا تملك صلاحية تعديلها.");
    const { id, ...values } = input;
    await db.update(publicReadingLists).set(values).where(eq(publicReadingLists.id, id));
    return { success: true };
  }),
  deleteList: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    await db.delete(publicReadingLists).where(and(eq(publicReadingLists.id, input.id), eq(publicReadingLists.userId, ctx.user.id)));
    return { success: true };
  }),
  addListItem: protectedProcedure.input(z.object({ listId: z.number().int().positive(), novelId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const [list] = await db.select({ id: publicReadingLists.id }).from(publicReadingLists).where(and(eq(publicReadingLists.id, input.listId), eq(publicReadingLists.userId, ctx.user.id))).limit(1);
    if (!list) throw new Error("لا تملك صلاحية تعديل هذه القائمة.");
    await db.insert(publicReadingListItems).values(input).onDuplicateKeyUpdate({ set: { novelId: input.novelId } });
    return { success: true };
  }),
  removeListItem: protectedProcedure.input(z.object({ listId: z.number().int().positive(), novelId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const [list] = await db.select({ id: publicReadingLists.id }).from(publicReadingLists).where(and(eq(publicReadingLists.id, input.listId), eq(publicReadingLists.userId, ctx.user.id))).limit(1);
    if (!list) throw new Error("لا تملك صلاحية تعديل هذه القائمة.");
    await db.delete(publicReadingListItems).where(and(eq(publicReadingListItems.listId, input.listId), eq(publicReadingListItems.novelId, input.novelId)));
    return { success: true };
  }),
  toggleAuthorFollow: protectedProcedure.input(z.object({ authorId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const [existing] = await db.select({ id: authorFollows.id }).from(authorFollows).where(and(eq(authorFollows.userId, ctx.user.id), eq(authorFollows.authorId, input.authorId))).limit(1);
    if (existing) { await db.delete(authorFollows).where(eq(authorFollows.id, existing.id)); return { active: false }; }
    await db.insert(authorFollows).values({ userId: ctx.user.id, authorId: input.authorId });
    return { active: true };
  }),
  isFollowingAuthor: protectedProcedure.input(z.object({ authorId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    const db = await requireDb();
    const [follow] = await db.select({ id: authorFollows.id }).from(authorFollows).where(and(eq(authorFollows.userId, ctx.user.id), eq(authorFollows.authorId, input.authorId))).limit(1);
    return Boolean(follow);
  }),
  toggleReadLater: protectedProcedure.input(z.object({ novelId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const [existing] = await db.select({ id: readLater.id }).from(readLater).where(and(eq(readLater.userId, ctx.user.id), eq(readLater.novelId, input.novelId))).limit(1);
    if (existing) { await db.delete(readLater).where(eq(readLater.id, existing.id)); return { active: false }; }
    await db.insert(readLater).values({ userId: ctx.user.id, novelId: input.novelId });
    return { active: true };
  }),
  readLater: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    return db.select({ novelId: novels.id, title: novels.title, slug: novels.slug, shortDescription: novels.shortDescription, authorName: authors.displayName, createdAt: readLater.createdAt }).from(readLater).innerJoin(novels, eq(readLater.novelId, novels.id)).innerJoin(authors, eq(novels.authorId, authors.id)).where(eq(readLater.userId, ctx.user.id)).orderBy(desc(readLater.createdAt));
  }),
  isReadLater: protectedProcedure.input(z.object({ novelId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    const db = await requireDb();
    const [item] = await db.select({ id: readLater.id }).from(readLater).where(and(eq(readLater.userId, ctx.user.id), eq(readLater.novelId, input.novelId))).limit(1);
    return Boolean(item);
  }),
  achievements: protectedProcedure.query(async ({ ctx }) => {
    const stats = await refreshAchievements(ctx.user.id);
    const db = await requireDb();
    const earned = await db.select({ achievementKey: userAchievements.achievementKey, earnedAt: userAchievements.earnedAt }).from(userAchievements).where(eq(userAchievements.userId, ctx.user.id));
    const earnedByKey = new Map(earned.map(item => [item.achievementKey, item.earnedAt]));
    return { stats, achievements: achievementDefinitions.map(item => ({ ...item, earnedAt: earnedByKey.get(item.key) ?? null })) };
  }),
  comments: publicProcedure.input(z.object({ chapterId: z.number().int().positive() })).query(async ({ input }) => {
    const db = await requireDb();
    return db.select({ id: chapterComments.id, body: chapterComments.body, createdAt: chapterComments.createdAt, userId: users.id, userName: users.name }).from(chapterComments).innerJoin(users, eq(chapterComments.userId, users.id)).where(and(eq(chapterComments.chapterId, input.chapterId), eq(chapterComments.isHidden, false))).orderBy(desc(chapterComments.createdAt)).limit(100);
  }),
  addComment: protectedProcedure.input(z.object({ chapterId: z.number().int().positive(), body: z.string().trim().min(2).max(1200) })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const [chapter] = await db.select({ id: chapters.id, status: chapters.status }).from(chapters).where(eq(chapters.id, input.chapterId)).limit(1);
    if (!chapter || chapter.status !== "published") throw new Error("لا يمكن التعليق على فصل غير منشور.");
    const [created] = await db.insert(chapterComments).values({ userId: ctx.user.id, ...input }).$returningId();
    return { id: created.id };
  }),
  authorReply: editorProcedure.input(z.object({ commentId: z.number().int().positive(), body: z.string().trim().min(2).max(1200) })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const [comment] = await db.select({ commentId: chapterComments.id, chapterId: chapters.id, chapterStatus: chapters.status, ownerId: novels.createdByUserId, recipientId: chapterComments.userId, novelTitle: novels.title, novelSlug: novels.slug, chapterSlug: chapters.slug }).from(chapterComments).innerJoin(chapters, eq(chapterComments.chapterId, chapters.id)).innerJoin(novels, eq(chapters.novelId, novels.id)).where(eq(chapterComments.id, input.commentId)).limit(1);
    if (!comment || !canAuthorReply({ chapterStatus: comment.chapterStatus, ownerId: comment.ownerId, userId: ctx.user.id })) throw new Error("لا تملك صلاحية الرد على هذا التعليق.");
    const [created] = await db.insert(chapterComments).values({ chapterId: comment.chapterId, userId: ctx.user.id, body: `رد المؤلف: ${input.body}` }).$returningId();
    if (comment.recipientId !== ctx.user.id) await db.insert(notifications).values({ userId: comment.recipientId, type: "system", title: "رد المؤلف على تعليقك", body: `رد مؤلف رواية «${comment.novelTitle}» على تعليقك.`, href: `/read/${comment.novelSlug}/${comment.chapterSlug}` });
    return { id: created.id };
  }),
  deleteComment: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    await db.delete(chapterComments).where(and(eq(chapterComments.id, input.id), eq(chapterComments.userId, ctx.user.id)));
    return { success: true };
  }),
  reportComment: protectedProcedure.input(z.object({ commentId: z.number().int().positive(), reason: z.string().trim().min(3).max(250) })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    await db.insert(commentReports).values({ userId: ctx.user.id, ...input }).onDuplicateKeyUpdate({ set: { reason: input.reason } });
    return { success: true };
  }),
  moderateComment: adminProcedure.input(z.object({ id: z.number().int().positive(), hidden: z.boolean() })).mutation(async ({ input }) => {
    const db = await requireDb();
    await db.update(chapterComments).set({ isHidden: input.hidden }).where(eq(chapterComments.id, input.id));
    return { success: true };
  }),
  authorAnalytics: editorProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    const createdNovels = await db.select({ id: novels.id, title: novels.title, chapterCount: novels.chapterCount }).from(novels).where(eq(novels.createdByUserId, ctx.user.id)).orderBy(desc(novels.updatedAt));
    const rows = await Promise.all(createdNovels.map(async novel => {
      const [[favoritesCount], [completedCount], [viewCount], [rating]] = await Promise.all([
        db.select({ total: count() }).from(favorites).where(eq(favorites.novelId, novel.id)),
        db.select({ total: count() }).from(readingProgress).where(and(eq(readingProgress.novelId, novel.id), eq(readingProgress.isCompleted, true))),
        db.select({ total: count() }).from(readingEvents).where(eq(readingEvents.novelId, novel.id)),
        db.select({ average: sql<number | null>`AVG(${favoriteRatings.rating})` }).from(favoriteRatings).where(eq(favoriteRatings.novelId, novel.id)),
      ]);
      return { ...novel, favorites: favoritesCount.total, completions: completedCount.total, views: viewCount.total, averageRating: rating.average ?? 0 };
    }));
    const [recentComments, unreadRows] = await Promise.all([
      db.select({ id: chapterComments.id, body: chapterComments.body, createdAt: chapterComments.createdAt, chapterId: chapters.id, chapterTitle: chapters.title, novelTitle: novels.title, userName: users.name }).from(chapterComments).innerJoin(chapters, eq(chapterComments.chapterId, chapters.id)).innerJoin(novels, eq(chapters.novelId, novels.id)).innerJoin(users, eq(chapterComments.userId, users.id)).where(and(eq(novels.createdByUserId, ctx.user.id), eq(chapterComments.isHidden, false))).orderBy(desc(chapterComments.createdAt)).limit(12),
      db.select({ total: count() }).from(notifications).where(and(eq(notifications.userId, ctx.user.id), eq(notifications.isRead, false))),
    ]);
    return { novels: rows, recentComments, unreadNotifications: Number(unreadRows[0]?.total ?? 0) };
  }),
});
