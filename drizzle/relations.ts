import { relations } from "drizzle-orm";
import {
  activityLogs,
  authors,
  categories,
  chapters,
  favorites,
  media,
  notifications,
  novelCategories,
  novelFollows,
  novels,
  novelTags,
  readingEvents,
  readingProgress,
  tags,
  users,
} from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  uploadedMedia: many(media),
  createdNovels: many(novels, { relationName: "novelCreator" }),
  updatedNovels: many(novels, { relationName: "novelUpdater" }),
  createdChapters: many(chapters, { relationName: "chapterCreator" }),
  updatedChapters: many(chapters, { relationName: "chapterUpdater" }),
  favorites: many(favorites),
  follows: many(novelFollows),
  readingProgress: many(readingProgress),
  readingEvents: many(readingEvents),
  notifications: many(notifications),
  activityLogs: many(activityLogs),
}));

export const authorsRelations = relations(authors, ({ one, many }) => ({
  image: one(media, { fields: [authors.imageMediaId], references: [media.id] }),
  novels: many(novels),
}));

export const mediaRelations = relations(media, ({ one, many }) => ({
  uploadedBy: one(users, { fields: [media.createdByUserId], references: [users.id] }),
  authorImages: many(authors),
  novelCovers: many(novels),
}));

export const novelsRelations = relations(novels, ({ one, many }) => ({
  author: one(authors, { fields: [novels.authorId], references: [authors.id] }),
  cover: one(media, { fields: [novels.coverMediaId], references: [media.id] }),
  createdBy: one(users, { fields: [novels.createdByUserId], references: [users.id], relationName: "novelCreator" }),
  updatedBy: one(users, { fields: [novels.updatedByUserId], references: [users.id], relationName: "novelUpdater" }),
  chapters: many(chapters),
  categories: many(novelCategories),
  tags: many(novelTags),
  favorites: many(favorites),
  follows: many(novelFollows),
  readingProgress: many(readingProgress),
  readingEvents: many(readingEvents),
}));

export const chaptersRelations = relations(chapters, ({ one, many }) => ({
  novel: one(novels, { fields: [chapters.novelId], references: [novels.id] }),
  createdBy: one(users, { fields: [chapters.createdByUserId], references: [users.id], relationName: "chapterCreator" }),
  updatedBy: one(users, { fields: [chapters.updatedByUserId], references: [users.id], relationName: "chapterUpdater" }),
  progressEntries: many(readingProgress),
  readingEvents: many(readingEvents),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({ novelLinks: many(novelCategories) }));
export const tagsRelations = relations(tags, ({ many }) => ({ novelLinks: many(novelTags) }));
export const novelCategoriesRelations = relations(novelCategories, ({ one }) => ({
  novel: one(novels, { fields: [novelCategories.novelId], references: [novels.id] }),
  category: one(categories, { fields: [novelCategories.categoryId], references: [categories.id] }),
}));
export const novelTagsRelations = relations(novelTags, ({ one }) => ({
  novel: one(novels, { fields: [novelTags.novelId], references: [novels.id] }),
  tag: one(tags, { fields: [novelTags.tagId], references: [tags.id] }),
}));
export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, { fields: [favorites.userId], references: [users.id] }),
  novel: one(novels, { fields: [favorites.novelId], references: [novels.id] }),
}));
export const novelFollowsRelations = relations(novelFollows, ({ one }) => ({
  user: one(users, { fields: [novelFollows.userId], references: [users.id] }),
  novel: one(novels, { fields: [novelFollows.novelId], references: [novels.id] }),
}));
export const readingProgressRelations = relations(readingProgress, ({ one }) => ({
  user: one(users, { fields: [readingProgress.userId], references: [users.id] }),
  novel: one(novels, { fields: [readingProgress.novelId], references: [novels.id] }),
  chapter: one(chapters, { fields: [readingProgress.chapterId], references: [chapters.id] }),
}));
export const readingEventsRelations = relations(readingEvents, ({ one }) => ({
  user: one(users, { fields: [readingEvents.userId], references: [users.id] }),
  novel: one(novels, { fields: [readingEvents.novelId], references: [novels.id] }),
  chapter: one(chapters, { fields: [readingEvents.chapterId], references: [chapters.id] }),
}));
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));
export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  actor: one(users, { fields: [activityLogs.actorUserId], references: [users.id] }),
}));
