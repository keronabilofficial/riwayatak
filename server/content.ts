import { and, asc, desc, eq, inArray, like, or } from "drizzle-orm";
import {
  authors,
  categories,
  chapters,
  media,
  novelCategories,
  novels,
  novelTags,
  tags,
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
};

export async function listPublicNovels(input: CatalogInput = {}) {
  const db = await getDb();
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

  return db
    .select(publicNovelFields)
    .from(novels)
    .innerJoin(authors, eq(novels.authorId, authors.id))
    .leftJoin(media, eq(novels.coverMediaId, media.id))
    .where(and(...conditions))
    .orderBy(desc(novels.isFeatured), desc(novels.updatedAt))
    .limit(limit)
    .offset(offset);
}

export async function getPublicNovel(slug: string) {
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

  return { ...novel, chapters: chapterRows, categories: categoryRows, tags: tagRows, related: relatedRows.filter(item => item.id !== novel.id) };
}

export async function getPublicChapter(novelSlug: string, chapterSlug: string) {
  const db = await getDb();
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
    })
    .from(chapters)
    .innerJoin(novels, eq(chapters.novelId, novels.id))
    .innerJoin(authors, eq(novels.authorId, authors.id))
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
  const siblingRows = await db
    .select({ title: chapters.title, slug: chapters.slug, sortOrder: chapters.sortOrder })
    .from(chapters)
    .where(and(eq(chapters.novelId, chapter.novelId), eq(chapters.status, "published")))
    .orderBy(asc(chapters.sortOrder));
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
