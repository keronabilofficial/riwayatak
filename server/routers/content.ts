import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import {
  activityLogs,
  authors,
  categories,
  chapters,
  favorites,
  novelCategories,
  novelFollows,
  novelReviews,
  novelTags,
  novels,
  notifications,
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
  if (!followers.length) return;
  await db.insert(notifications).values(followers.map(follower => ({ userId: follower.userId, type: "new_chapter" as const, title: `فصل جديد من «${novel.title}»`, body: `نُشر فصل «${chapterTitle}» ويمكنك متابعته الآن.`, href: `/read/${novel.slug}/${chapter.slug}` })));
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
    return db.select({ novelId: readingProgress.novelId, chapterId: readingProgress.chapterId, progressPercent: readingProgress.progressPercent, lastReadAt: readingProgress.lastReadAt, novelTitle: novels.title, novelSlug: novels.slug, chapterSlug: chapters.slug, chapterTitle: chapters.title }).from(readingProgress).innerJoin(novels, eq(readingProgress.novelId, novels.id)).innerJoin(chapters, eq(readingProgress.chapterId, chapters.id)).where(eq(readingProgress.userId, ctx.user.id)).orderBy(desc(readingProgress.lastReadAt)).limit(12);
  }),
  favorites: protectedProcedure.input(z.object({ sort: z.enum(["recent", "alphabetical"]).default("recent"), categorySlug: z.string().max(120).optional() }).optional()).query(async ({ ctx, input }) => {
    const db = await requireDb();
    const orderBy = input?.sort === "alphabetical" ? asc(novels.title) : desc(favorites.createdAt);
    const userCondition = eq(favorites.userId, ctx.user.id);
    const categoryCondition = input?.categorySlug ? sql`EXISTS (SELECT 1 FROM novel_categories nc INNER JOIN categories c ON c.id = nc.categoryId WHERE nc.novelId = ${novels.id} AND c.slug = ${input.categorySlug})` : undefined;
    return db.select({ novelId: novels.id, title: novels.title, slug: novels.slug, shortDescription: novels.shortDescription, authorName: authors.displayName, authorSlug: authors.slug, chapterCount: novels.chapterCount, favoritedAt: favorites.createdAt }).from(favorites).innerJoin(novels, eq(favorites.novelId, novels.id)).innerJoin(authors, eq(novels.authorId, authors.id)).where(categoryCondition ? and(userCondition, categoryCondition) : userCondition).orderBy(orderBy).limit(24);
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
    return db.select().from(notifications).where(eq(notifications.userId, ctx.user.id)).orderBy(desc(notifications.createdAt)).limit(30);
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
