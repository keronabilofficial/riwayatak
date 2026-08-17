import { and, asc, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import {
  authors,
  categories,
  chapters,
  chapterAudio,
  media,
  novelCategories,
  novels,
  novelTags,
  novelReviews,
  tags,
  novelTranslations,
  authorTranslations,
  chapterTranslations,
  categoryTranslations,
} from "../drizzle/schema";
import { getDb } from "./db";
import { normalizeArabic } from "./lib/arabic";

const publicNovelFields = {
  id: novels.id,
  title: novels.title,
  subtitle: novels.subtitle,
  slug: novels.slug,
  shortDescription: novels.shortDescription,
  chapterCount: novels.chapterCount,
  publishedAt: novels.publishedAt,
  updatedAt: novels.updatedAt,
  isFeatured: novels.isFeatured,
  authorId: authors.id,
  authorName: authors.displayName,
  authorSlug: authors.slug,
  coverUrl: media.url,
  coverAlt: media.altText,
};

export type CatalogInput = {
  limit?: number;
  offset?: number;
  query?: string;
  categorySlug?: string;
  narrativeStatus?: "ongoing" | "completed";
  audioOnly?: boolean;
  length?: "short" | "medium" | "long";
  minRating?: number;
  sort?: "latest" | "title" | "chapters" | "rating";
};

export async function listPublicNovels(input: CatalogInput = {}, dbOverride?: NonNullable<Awaited<ReturnType<typeof getDb>>>, languageCode: "ar" | "en" | "fr" | "tr" = "ar") {
  const db = dbOverride ?? await getDb();
  if (!db) return [];
  const limit = Math.min(Math.max(input.limit ?? 18, 1), 48);
  const offset = Math.max(input.offset ?? 0, 0);
  const conditions = [eq(novels.status, "published")];

  if (input.query?.trim()) {
    const term = `%${normalizeArabic(input.query)}%`;
    const categoryNovelIds = db
      .select({ novelId: novelCategories.novelId })
      .from(novelCategories)
      .innerJoin(categories, eq(novelCategories.categoryId, categories.id))
      .where(like(categories.normalizedName, term));
    const tagNovelIds = db
      .select({ novelId: novelTags.novelId })
      .from(novelTags)
      .innerJoin(tags, eq(novelTags.tagId, tags.id))
      .where(and(like(tags.normalizedName, term), eq(tags.isArchived, false)));
    conditions.push(or(like(novels.normalizedTitle, term), like(authors.normalizedName, term), inArray(novels.id, categoryNovelIds), inArray(novels.id, tagNovelIds))!);
  }
  if (input.categorySlug) {
    const categoryNovelIds = db
      .select({ novelId: novelCategories.novelId })
      .from(novelCategories)
      .innerJoin(categories, eq(novelCategories.categoryId, categories.id))
      .where(and(eq(categories.slug, input.categorySlug), eq(categories.isVisible, true)));
    conditions.push(inArray(novels.id, categoryNovelIds));
  }
  if (input.narrativeStatus) conditions.push(eq(novels.narrativeStatus, input.narrativeStatus));
  if (input.audioOnly) conditions.push(sql`EXISTS (SELECT 1 FROM ${chapters} c INNER JOIN ${chapterAudio} ca ON ca.chapterId = c.id WHERE c.novelId = ${novels.id} AND c.status = 'published')`);
  if (input.length === "short") conditions.push(sql`${novels.chapterCount} <= 10`);
  if (input.length === "medium") conditions.push(sql`${novels.chapterCount} BETWEEN 11 AND 30`);
  if (input.length === "long") conditions.push(sql`${novels.chapterCount} > 30`);
  if (input.minRating) conditions.push(sql`COALESCE((SELECT AVG(${novelReviews.rating}) FROM ${novelReviews} WHERE ${novelReviews.novelId} = ${novels.id}), 0) >= ${input.minRating}`);
  const orderBy = input.sort === "title" ? [asc(novels.title)] : input.sort === "chapters" ? [desc(novels.chapterCount), desc(novels.updatedAt)] : input.sort === "rating" ? [desc(sql`COALESCE((SELECT AVG(${novelReviews.rating}) FROM ${novelReviews} WHERE ${novelReviews.novelId} = ${novels.id}), 0)`), desc(novels.updatedAt)] : [desc(novels.isFeatured), desc(novels.updatedAt)];

  const rows = await db.select(publicNovelFields).from(novels).innerJoin(authors, eq(novels.authorId, authors.id)).leftJoin(media, eq(novels.coverMediaId, media.id)).where(and(...conditions)).orderBy(...orderBy).limit(limit).offset(offset);
  if (languageCode === "ar" || !rows.length) return rows;
  const novelIds = rows.map(row => row.id);
  const translations = await db.select({ novelId: novelTranslations.novelId, title: novelTranslations.title, subtitle: novelTranslations.subtitle, shortDescription: novelTranslations.shortDescription, authorId: novels.authorId }).from(novelTranslations).innerJoin(novels, eq(novelTranslations.novelId, novels.id)).where(and(inArray(novelTranslations.novelId, novelIds), eq(novelTranslations.languageCode, languageCode), eq(novelTranslations.status, "published")));
  const byNovel = new Map(translations.map(item => [item.novelId, item]));
  const authorIds = Array.from(new Set(translations.map(item => item.authorId)));
  const authorRows = authorIds.length ? await db.select({ authorId: authorTranslations.authorId, displayName: authorTranslations.displayName }).from(authorTranslations).where(and(inArray(authorTranslations.authorId, authorIds), eq(authorTranslations.languageCode, languageCode), eq(authorTranslations.status, "published"))) : [];
  const byAuthor = new Map(authorRows.map(item => [item.authorId, item.displayName]));
  return rows.map(row => { const translation = byNovel.get(row.id); return translation ? { ...row, title: translation.title, subtitle: translation.subtitle, shortDescription: translation.shortDescription, authorName: byAuthor.get(translation.authorId) ?? row.authorName } : row; });
}

export async function getPublicNovel(slug: string, languageCode: "ar" | "en" | "fr" | "tr" = "ar") {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select({
      ...publicNovelFields,
      description: novels.description,
      seoTitle: novels.seoTitle,
      seoDescription: novels.seoDescription,
      authorBio: authors.shortBio,
      authorImageUrl: media.url,
    })
    .from(novels)
    .innerJoin(authors, eq(novels.authorId, authors.id))
    .leftJoin(media, eq(novels.coverMediaId, media.id))
    .where(and(eq(novels.slug, slug), eq(novels.status, "published")))
    .limit(1);
  const novel = rows[0];
  if (!novel) return null;

  const [chapterRows, categoryRows, tagRows, relatedRows] = await Promise.all([
    db
      .select({ id: chapters.id, title: chapters.title, slug: chapters.slug, sortOrder: chapters.sortOrder, publishedAt: chapters.publishedAt })
      .from(chapters)
      .where(and(eq(chapters.novelId, novel.id), eq(chapters.status, "published")))
      .orderBy(asc(chapters.sortOrder)),
    db
      .select({ name: categories.name, slug: categories.slug })
      .from(novelCategories)
      .innerJoin(categories, eq(novelCategories.categoryId, categories.id))
      .where(eq(novelCategories.novelId, novel.id)),
    db
      .select({ name: tags.name, slug: tags.slug })
      .from(novelTags)
      .innerJoin(tags, eq(novelTags.tagId, tags.id))
      .where(and(eq(novelTags.novelId, novel.id), eq(tags.isArchived, false))),
    db
      .select(publicNovelFields)
      .from(novels)
      .innerJoin(authors, eq(novels.authorId, authors.id))
      .leftJoin(media, eq(novels.coverMediaId, media.id))
      .where(and(eq(novels.authorId, novel.authorId), eq(novels.status, "published")))
      .orderBy(desc(novels.updatedAt))
      .limit(4),
  ]);

  if (languageCode === "ar") return { ...novel, chapters: chapterRows, categories: categoryRows, tags: tagRows, related: relatedRows.filter(item => item.id !== novel.id) };
  const [novelTranslation] = await db.select({ title: novelTranslations.title, subtitle: novelTranslations.subtitle, shortDescription: novelTranslations.shortDescription, description: novelTranslations.description, seoTitle: novelTranslations.seoTitle, seoDescription: novelTranslations.seoDescription }).from(novelTranslations).where(and(eq(novelTranslations.novelId, novel.id), eq(novelTranslations.languageCode, languageCode), eq(novelTranslations.status, "published"))).limit(1);
  const translatedChapters = await db.select({ id: chapterTranslations.chapterId, title: chapterTranslations.title, slug: chapters.slug, sortOrder: chapters.sortOrder, publishedAt: chapters.publishedAt }).from(chapterTranslations).innerJoin(chapters, eq(chapterTranslations.chapterId, chapters.id)).where(and(eq(chapters.novelId, novel.id), eq(chapterTranslations.languageCode, languageCode), eq(chapterTranslations.status, "published"))).orderBy(asc(chapters.sortOrder));
  const translatedCategories = await db.select({ name: sql<string>`COALESCE(${categoryTranslations.name}, ${categories.name})`, slug: categories.slug }).from(novelCategories).innerJoin(categories, eq(novelCategories.categoryId, categories.id)).leftJoin(categoryTranslations, and(eq(categoryTranslations.categoryId, categories.id), eq(categoryTranslations.languageCode, languageCode), eq(categoryTranslations.status, "published"))).where(eq(novelCategories.novelId, novel.id));
  const translatedAuthor = await db.select({ displayName: authorTranslations.displayName, shortBio: authorTranslations.shortBio }).from(authorTranslations).where(and(eq(authorTranslations.authorId, novel.authorId), eq(authorTranslations.languageCode, languageCode), eq(authorTranslations.status, "published"))).limit(1);
  return { ...novel, ...(novelTranslation ?? {}), authorName: translatedAuthor[0]?.displayName ?? novel.authorName, authorBio: translatedAuthor[0]?.shortBio ?? novel.authorBio, chapters: translatedChapters.length ? translatedChapters : chapterRows, categories: translatedCategories.length ? translatedCategories : categoryRows, tags: tagRows, related: relatedRows.filter(item => item.id !== novel.id) };
}

export async function getPublicChapter(novelSlug: string, chapterSlug: string, dbOverride?: NonNullable<Awaited<ReturnType<typeof getDb>>>, languageCode: "ar" | "en" | "fr" | "tr" = "ar") {
  const db = dbOverride ?? await getDb();
  if (!db) return null;
  const rows = await db
    .select({
      chapterId: chapters.id,
      chapterTitle: chapters.title,
      chapterSlug: chapters.slug,
      sortOrder: chapters.sortOrder,
      content: chapters.content,
      novelId: novels.id,
      novelTitle: novels.title,
      novelSlug: novels.slug,
      authorName: authors.displayName,
      authorSlug: authors.slug,
      audioUrl: chapterAudio.url,
      audioDurationSeconds: chapterAudio.durationSeconds,
    })
    .from(chapters)
    .innerJoin(novels, eq(chapters.novelId, novels.id))
    .innerJoin(authors, eq(novels.authorId, authors.id))
    .leftJoin(chapterAudio, eq(chapterAudio.chapterId, chapters.id))
    .where(
      and(
        eq(novels.slug, novelSlug),
        eq(novels.status, "published"),
        eq(chapters.slug, chapterSlug),
        eq(chapters.status, "published")
      )
    )
    .limit(1);
  const chapter = rows[0];
  if (!chapter) return null;
  const siblingRows = await db.select({ title: chapters.title, slug: chapters.slug, sortOrder: chapters.sortOrder }).from(chapters).where(and(eq(chapters.novelId, chapter.novelId), eq(chapters.status, "published"))).orderBy(asc(chapters.sortOrder));
  if (languageCode !== "ar") {
    const [chapterTranslation] = await db.select({ title: chapterTranslations.title, content: chapterTranslations.content }).from(chapterTranslations).where(and(eq(chapterTranslations.chapterId, chapter.chapterId), eq(chapterTranslations.languageCode, languageCode), eq(chapterTranslations.status, "published"))).limit(1);
    const translatedNovel = await db.select({ title: novelTranslations.title }).from(novelTranslations).where(and(eq(novelTranslations.novelId, chapter.novelId), eq(novelTranslations.languageCode, languageCode), eq(novelTranslations.status, "published"))).limit(1);
    const translatedAuthor = await db.select({ displayName: authorTranslations.displayName }).from(authorTranslations).where(and(eq(authorTranslations.authorId, await db.select({ authorId: novels.authorId }).from(novels).where(eq(novels.id, chapter.novelId)).limit(1).then(rows => rows[0]?.authorId ?? 0)), eq(authorTranslations.languageCode, languageCode), eq(authorTranslations.status, "published"))).limit(1);
    if (chapterTranslation) return { ...chapter, chapterTitle: chapterTranslation.title, content: chapterTranslation.content, novelTitle: translatedNovel[0]?.title ?? chapter.novelTitle, authorName: translatedAuthor[0]?.displayName ?? chapter.authorName, chapters: siblingRows, previous: null, next: null };
  }
  const index = siblingRows.findIndex(item => item.slug === chapter.chapterSlug);
  return { ...chapter, chapters: siblingRows, previous: index > 0 ? siblingRows[index - 1] : null, next: index < siblingRows.length - 1 ? siblingRows[index + 1] : null };
}

export async function listPublicAuthors(input: { query?: string; limit?: number; offset?: number } = {}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(authors.isVisible, true)];
  if (input.query?.trim()) conditions.push(like(authors.normalizedName, `%${normalizeArabic(input.query)}%`));
  return db
    .select({ id: authors.id, name: authors.displayName, slug: authors.slug, shortBio: authors.shortBio, imageUrl: media.url })
    .from(authors)
    .leftJoin(media, eq(authors.imageMediaId, media.id))
    .where(and(...conditions))
    .orderBy(asc(authors.displayName))
    .limit(Math.min(Math.max(input.limit ?? 24, 1), 48))
    .offset(Math.max(input.offset ?? 0, 0));
}

export async function getPublicAuthor(slug: string) {
  const db = await getDb();
  if (!db) return null;
  const authorRows = await db
    .select({ id: authors.id, name: authors.displayName, slug: authors.slug, shortBio: authors.shortBio, biography: authors.biography, imageUrl: media.url })
    .from(authors)
    .leftJoin(media, eq(authors.imageMediaId, media.id))
    .where(and(eq(authors.slug, slug), eq(authors.isVisible, true)))
    .limit(1);
  const author = authorRows[0];
  if (!author) return null;
  const works = await db
    .select(publicNovelFields)
    .from(novels)
    .innerJoin(authors, eq(novels.authorId, authors.id))
    .leftJoin(media, eq(novels.coverMediaId, media.id))
    .where(and(eq(novels.authorId, author.id), eq(novels.status, "published")))
    .orderBy(desc(novels.updatedAt));
  return { ...author, works };
}

export async function listPublicCategories() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ id: categories.id, name: categories.name, slug: categories.slug, description: categories.description })
    .from(categories)
    .where(eq(categories.isVisible, true))
    .orderBy(asc(categories.name));
}

export async function getHomeContent() {
  const [featured, latest, categories] = await Promise.all([
    listPublicNovels({ limit: 6 }),
    listPublicNovels({ limit: 12 }),
    listPublicCategories(),
  ]);
  return { featured: featured.filter(novel => novel.isFeatured), latest, categories };
}
