import {
  boolean,
  index,
  int,
  json,
  longtext,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const publicationStatus = ["draft", "review", "published", "unpublished", "archived"] as const;
export const subscriptionPlanName = ["go", "plus", "ultra", "enterprise"] as const;
export const subscriptionBillingTerm = ["monthly", "quarterly", "hundred_days", "six_months", "yearly"] as const;
export const subscriptionStatus = ["pending", "active", "past_due", "cancelled", "expired"] as const;
export const subscriptionCycleStatus = ["pending", "active", "expired", "failed"] as const;
export const narrativeStatus = ["ongoing", "completed"] as const;
export const supportedLanguageCode = ["ar", "en", "fr", "tr"] as const;

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  avatarUrl: varchar("avatarUrl", { length: 1024 }),
  avatarKey: varchar("avatarKey", { length: 512 }),
  bio: varchar("bio", { length: 500 }),
  country: varchar("country", { length: 120 }),
  preferredLanguage: mysqlEnum("preferredLanguage", supportedLanguageCode),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "editor", "admin", "super_admin"]).default("user").notNull(),
  isDisabled: boolean("isDisabled").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const media = mysqlTable(
  "media",
  {
    id: int("id").autoincrement().primaryKey(),
    storageKey: varchar("storageKey", { length: 512 }).notNull().unique(),
    url: varchar("url", { length: 1024 }).notNull(),
    altText: varchar("altText", { length: 255 }),
    mimeType: varchar("mimeType", { length: 127 }).notNull(),
    sizeBytes: int("sizeBytes"),
    width: int("width"),
    height: int("height"),
    createdByUserId: int("createdByUserId").references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("media_created_by_idx").on(table.createdByUserId)]
);

export const authors = mysqlTable(
  "authors",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 180 }).notNull(),
    displayName: varchar("displayName", { length: 180 }).notNull(),
    normalizedName: varchar("normalizedName", { length: 220 }).notNull(),
    slug: varchar("slug", { length: 220 }).notNull().unique(),
    shortBio: text("shortBio"),
    biography: longtext("biography"),
    imageMediaId: int("imageMediaId").references(() => media.id),
    seoTitle: varchar("seoTitle", { length: 255 }),
    seoDescription: varchar("seoDescription", { length: 360 }),
    isVisible: boolean("isVisible").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("authors_visibility_idx").on(table.isVisible),
    index("authors_search_name_idx").on(table.normalizedName),
  ]
);

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  normalizedName: varchar("normalizedName", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  description: text("description"),
  isVisible: boolean("isVisible").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("categories_search_name_idx").on(table.normalizedName)]);

export const tags = mysqlTable("tags", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 80 }).notNull(),
  normalizedName: varchar("normalizedName", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  isArchived: boolean("isArchived").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("tags_search_name_idx").on(table.normalizedName)]);

export const novels = mysqlTable(
  "novels",
  {
    id: int("id").autoincrement().primaryKey(),
    authorId: int("authorId").notNull().references(() => authors.id),
    title: varchar("title", { length: 255 }).notNull(),
    subtitle: varchar("subtitle", { length: 255 }),
    slug: varchar("slug", { length: 280 }).notNull().unique(),
    shortDescription: text("shortDescription"),
    description: longtext("description"),
    normalizedTitle: varchar("normalizedTitle", { length: 300 }).notNull(),
    coverMediaId: int("coverMediaId").references(() => media.id),
    status: mysqlEnum("status", publicationStatus).default("draft").notNull(),
    narrativeStatus: mysqlEnum("narrativeStatus", narrativeStatus).default("ongoing").notNull(),
    isFeatured: boolean("isFeatured").default(false).notNull(),
    chapterCount: int("chapterCount").default(0).notNull(),
    publishedAt: timestamp("publishedAt"),
    archivedAt: timestamp("archivedAt"),
    seoTitle: varchar("seoTitle", { length: 255 }),
    seoDescription: varchar("seoDescription", { length: 360 }),
    createdByUserId: int("createdByUserId").notNull().references(() => users.id),
    updatedByUserId: int("updatedByUserId").references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("novels_publication_idx").on(table.status, table.publishedAt),
    index("novels_author_idx").on(table.authorId),
    index("novels_featured_idx").on(table.isFeatured, table.status),
    index("novels_search_title_idx").on(table.normalizedTitle),
  ]
);

export const novelReviews = mysqlTable(
  "novel_reviews",
  {
    id: int("id").autoincrement().primaryKey(),
    novelId: int("novelId").notNull().references(() => novels.id, { onDelete: "cascade" }),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    rating: int("rating").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("novel_reviews_user_novel_unique").on(table.userId, table.novelId),
    index("novel_reviews_novel_updated_idx").on(table.novelId, table.updatedAt),
    index("novel_reviews_novel_rating_idx").on(table.novelId, table.rating),
  ]
);

export const chapters = mysqlTable(
  "chapters",
  {
    id: int("id").autoincrement().primaryKey(),
    novelId: int("novelId").notNull().references(() => novels.id),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 280 }).notNull(),
    sortOrder: int("sortOrder").notNull(),
    content: longtext("content").notNull(),
    excerpt: text("excerpt"),
    status: mysqlEnum("status", publicationStatus).default("draft").notNull(),
    publishedAt: timestamp("publishedAt"),
    scheduledAt: timestamp("scheduledAt"),
    createdByUserId: int("createdByUserId").notNull().references(() => users.id),
    updatedByUserId: int("updatedByUserId").references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("chapters_novel_slug_unique").on(table.novelId, table.slug),
    uniqueIndex("chapters_novel_order_unique").on(table.novelId, table.sortOrder),
    index("chapters_reading_idx").on(table.novelId, table.status, table.sortOrder),
    index("chapters_scheduled_idx").on(table.status, table.scheduledAt),
  ]
);

export const chapterAudio = mysqlTable(
  "chapter_audio",
  {
    id: int("id").autoincrement().primaryKey(),
    chapterId: int("chapterId").notNull().references(() => chapters.id, { onDelete: "cascade" }).unique(),
    storageKey: varchar("storageKey", { length: 512 }).notNull().unique(),
    url: varchar("url", { length: 1024 }).notNull(),
    mimeType: varchar("mimeType", { length: 127 }).notNull(),
    sizeBytes: int("sizeBytes").notNull(),
    durationSeconds: int("durationSeconds"),
    uploadedByUserId: int("uploadedByUserId").notNull().references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("chapter_audio_uploader_idx").on(table.uploadedByUserId)]
);

export const novelCategories = mysqlTable(
  "novel_categories",
  {
    id: int("id").autoincrement().primaryKey(),
    novelId: int("novelId").notNull().references(() => novels.id),
    categoryId: int("categoryId").notNull().references(() => categories.id),
  },
  table => [
    uniqueIndex("novel_categories_unique").on(table.novelId, table.categoryId),
    index("novel_categories_category_idx").on(table.categoryId),
  ]
);

export const novelTags = mysqlTable(
  "novel_tags",
  {
    id: int("id").autoincrement().primaryKey(),
    novelId: int("novelId").notNull().references(() => novels.id),
    tagId: int("tagId").notNull().references(() => tags.id),
  },
  table => [
    uniqueIndex("novel_tags_unique").on(table.novelId, table.tagId),
    index("novel_tags_tag_idx").on(table.tagId),
  ]
);

export const favorites = mysqlTable(
  "favorites",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id),
    novelId: int("novelId").notNull().references(() => novels.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [uniqueIndex("favorites_user_novel_unique").on(table.userId, table.novelId)]
);

export const favoriteRatings = mysqlTable(
  "favorite_ratings",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id),
    novelId: int("novelId").notNull().references(() => novels.id),
    rating: int("rating").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("favorite_ratings_user_novel_unique").on(table.userId, table.novelId)]
);

export const favoriteNotes = mysqlTable(
  "favorite_notes",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id),
    novelId: int("novelId").notNull().references(() => novels.id),
    note: text("note").notNull(),
    isPublished: boolean("isPublished").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("favorite_notes_user_novel_unique").on(table.userId, table.novelId)]
);

export const favoriteQuotes = mysqlTable(
  "favorite_quotes",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    novelId: int("novelId").notNull().references(() => novels.id, { onDelete: "cascade" }),
    chapterId: int("chapterId").notNull().references(() => chapters.id, { onDelete: "cascade" }),
    selectedText: varchar("selectedText", { length: 2000 }).notNull(),
    startOffset: int("startOffset"),
    endOffset: int("endOffset"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("favorite_quotes_user_novel_idx").on(table.userId, table.novelId), index("favorite_quotes_user_chapter_idx").on(table.userId, table.chapterId)]
);

export const recommendationDismissals = mysqlTable(
  "recommendation_dismissals",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id),
    novelId: int("novelId").notNull().references(() => novels.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [uniqueIndex("recommendation_dismissals_user_novel_unique").on(table.userId, table.novelId)]
);

export const favoriteLists = mysqlTable(
  "favorite_lists",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id),
    name: varchar("name", { length: 120 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("favorite_lists_user_name_unique").on(table.userId, table.name)]
);

export const favoriteListItems = mysqlTable(
  "favorite_list_items",
  {
    id: int("id").autoincrement().primaryKey(),
    listId: int("listId").notNull().references(() => favoriteLists.id, { onDelete: "cascade" }),
    novelId: int("novelId").notNull().references(() => novels.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [uniqueIndex("favorite_list_items_list_novel_unique").on(table.listId, table.novelId)]
);

export const novelFollows = mysqlTable(
  "novel_follows",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id),
    novelId: int("novelId").notNull().references(() => novels.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [uniqueIndex("novel_follows_user_novel_unique").on(table.userId, table.novelId)]
);

export const authorFollows = mysqlTable(
  "author_follows",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    authorId: int("authorId").notNull().references(() => authors.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [uniqueIndex("author_follows_user_author_unique").on(table.userId, table.authorId), index("author_follows_author_idx").on(table.authorId)]
);

export const publicReadingLists = mysqlTable(
  "public_reading_lists",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description"),
    isPublic: boolean("isPublic").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("public_reading_lists_user_name_unique").on(table.userId, table.name), index("public_reading_lists_public_idx").on(table.isPublic, table.updatedAt)]
);

export const publicReadingListItems = mysqlTable(
  "public_reading_list_items",
  {
    id: int("id").autoincrement().primaryKey(),
    listId: int("listId").notNull().references(() => publicReadingLists.id, { onDelete: "cascade" }),
    novelId: int("novelId").notNull().references(() => novels.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [uniqueIndex("public_reading_list_items_list_novel_unique").on(table.listId, table.novelId), index("public_reading_list_items_novel_idx").on(table.novelId)]
);

export const readLater = mysqlTable(
  "read_later",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    novelId: int("novelId").notNull().references(() => novels.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [uniqueIndex("read_later_user_novel_unique").on(table.userId, table.novelId), index("read_later_user_created_idx").on(table.userId, table.createdAt)]
);

export const userAchievements = mysqlTable(
  "user_achievements",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    achievementKey: varchar("achievementKey", { length: 80 }).notNull(),
    earnedAt: timestamp("earnedAt").defaultNow().notNull(),
  },
  table => [uniqueIndex("user_achievements_user_key_unique").on(table.userId, table.achievementKey), index("user_achievements_user_earned_idx").on(table.userId, table.earnedAt)]
);

export const readingProgress = mysqlTable(
  "reading_progress",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id),
    novelId: int("novelId").notNull().references(() => novels.id),
    chapterId: int("chapterId").notNull().references(() => chapters.id),
    characterOffset: int("characterOffset").default(0).notNull(),
    progressPercent: int("progressPercent").default(0).notNull(),
    isCompleted: boolean("isCompleted").default(false).notNull(),
    totalReadingSeconds: int("totalReadingSeconds").default(0).notNull(),
    lastReadAt: timestamp("lastReadAt").defaultNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("reading_progress_user_novel_unique").on(table.userId, table.novelId),
    index("reading_progress_continue_idx").on(table.userId, table.lastReadAt),
  ]
);

export const readingEvents = mysqlTable(
  "reading_events",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").references(() => users.id),
    sessionHash: varchar("sessionHash", { length: 128 }),
    novelId: int("novelId").notNull().references(() => novels.id),
    chapterId: int("chapterId").references(() => chapters.id),
    eventType: mysqlEnum("eventType", ["novel_view", "chapter_open", "chapter_complete"]).notNull(),
    occurredAt: timestamp("occurredAt").defaultNow().notNull(),
  },
  table => [
    index("reading_events_content_idx").on(table.novelId, table.chapterId, table.occurredAt),
    index("reading_events_user_idx").on(table.userId, table.occurredAt),
  ]
);

export const chapterComments = mysqlTable(
  "chapter_comments",
  {
    id: int("id").autoincrement().primaryKey(),
    chapterId: int("chapterId").notNull().references(() => chapters.id, { onDelete: "cascade" }),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    body: varchar("body", { length: 1200 }).notNull(),
    isHidden: boolean("isHidden").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("chapter_comments_chapter_created_idx").on(table.chapterId, table.createdAt), index("chapter_comments_user_idx").on(table.userId)]
);

export const commentReports = mysqlTable(
  "comment_reports",
  {
    id: int("id").autoincrement().primaryKey(),
    commentId: int("commentId").notNull().references(() => chapterComments.id, { onDelete: "cascade" }),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    reason: varchar("reason", { length: 250 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [uniqueIndex("comment_reports_user_comment_unique").on(table.userId, table.commentId), index("comment_reports_comment_idx").on(table.commentId)]
);

export const userNotificationPreferences = mysqlTable(
  "user_notification_preferences",
  {
    userId: int("userId").notNull().primaryKey().references(() => users.id, { onDelete: "cascade" }),
    popupEnabled: boolean("popupEnabled").default(true).notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  }
);

export const novelNotificationPreferences = mysqlTable(
  "novel_notification_preferences",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    novelId: int("novelId").notNull().references(() => novels.id, { onDelete: "cascade" }),
    enabled: boolean("enabled").default(true).notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("novel_notification_preferences_user_novel_unique").on(table.userId, table.novelId), index("novel_notification_preferences_user_idx").on(table.userId, table.enabled)]
);

export const notifications = mysqlTable(
  "notifications",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id),
    novelId: int("novelId").references(() => novels.id, { onDelete: "set null" }),
    authorId: int("authorId").references(() => authors.id, { onDelete: "set null" }),
    type: mysqlEnum("type", ["new_chapter", "new_novel", "system"]).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    body: text("body").notNull(),
    href: varchar("href", { length: 500 }),
    isRead: boolean("isRead").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("notifications_inbox_idx").on(table.userId, table.isRead, table.createdAt), index("notifications_novel_idx").on(table.novelId), index("notifications_author_idx").on(table.authorId)]
);

export const adSlots = mysqlTable("ad_slots", {
  id: int("id").autoincrement().primaryKey(),
  placement: mysqlEnum("placement", ["home", "category", "novel", "reader"]).notNull(),
  label: varchar("label", { length: 120 }).notNull(),
  provider: varchar("provider", { length: 80 }),
  adSensePublisherId: varchar("adSensePublisherId", { length: 32 }),
  slotCode: varchar("slotCode", { length: 255 }),
  isEnabled: boolean("isEnabled").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const activityLogs = mysqlTable(
  "activity_logs",
  {
    id: int("id").autoincrement().primaryKey(),
    actorUserId: int("actorUserId").references(() => users.id),
    action: varchar("action", { length: 100 }).notNull(),
    entityType: varchar("entityType", { length: 80 }).notNull(),
    entityId: int("entityId"),
    metadata: json("metadata"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("activity_logs_created_idx").on(table.createdAt)]
);

export const backupRuns = mysqlTable(
  "backup_runs",
  {
    id: int("id").autoincrement().primaryKey(),
    kind: mysqlEnum("kind", ["content_snapshot", "database_export", "media_manifest"]).notNull(),
    status: mysqlEnum("status", ["queued", "running", "verified", "failed", "expired"]).default("queued").notNull(),
    storageKey: varchar("storageKey", { length: 512 }),
    externalReference: varchar("externalReference", { length: 500 }),
    checksum: varchar("checksum", { length: 128 }),
    sizeBytes: int("sizeBytes"),
    retentionUntil: timestamp("retentionUntil"),
    errorMessage: text("errorMessage"),
    startedAt: timestamp("startedAt"),
    completedAt: timestamp("completedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("backup_runs_status_idx").on(table.status, table.createdAt)]
);

export const subscriptions = mysqlTable(
  "subscriptions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id),
    planName: mysqlEnum("planName", subscriptionPlanName).notNull(),
    billingTerm: mysqlEnum("billingTerm", subscriptionBillingTerm).notNull(),
    provider: varchar("provider", { length: 32 }).default("paymob").notNull(),
    providerSubscriptionId: varchar("providerSubscriptionId", { length: 255 }).unique(),
    status: mysqlEnum("status", subscriptionStatus).default("pending").notNull(),
    cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").default(false).notNull(),
    cancelledAt: timestamp("cancelledAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("subscriptions_user_status_idx").on(table.userId, table.status)]
);

export const subscriptionCycles = mysqlTable(
  "subscription_cycles",
  {
    id: int("id").autoincrement().primaryKey(),
    subscriptionId: int("subscriptionId").notNull().references(() => subscriptions.id, { onDelete: "cascade" }),
    providerOrderId: varchar("providerOrderId", { length: 255 }).notNull().unique(),
    providerTransactionId: varchar("providerTransactionId", { length: 255 }).unique(),
    status: mysqlEnum("status", subscriptionCycleStatus).default("pending").notNull(),
    planLabelSnapshot: varchar("planLabelSnapshot", { length: 80 }),
    priceEgpSnapshot: int("priceEgpSnapshot").default(0).notNull(),
    novelLimitSnapshot: int("novelLimitSnapshot").default(0).notNull(),
    audioChapterLimitSnapshot: int("audioChapterLimitSnapshot"),
    startsAt: timestamp("startsAt"),
    endsAt: timestamp("endsAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("subscription_cycles_access_idx").on(table.status, table.endsAt), index("subscription_cycles_subscription_idx").on(table.subscriptionId, table.createdAt)]
);

export const subscriptionNovelAccess = mysqlTable(
  "subscription_novel_access",
  {
    id: int("id").autoincrement().primaryKey(),
    cycleId: int("cycleId").notNull().references(() => subscriptionCycles.id, { onDelete: "cascade" }),
    novelId: int("novelId").notNull().references(() => novels.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [uniqueIndex("subscription_novel_access_cycle_novel_unique").on(table.cycleId, table.novelId), index("subscription_novel_access_cycle_idx").on(table.cycleId)]
);

export const subscriptionAudioAccess = mysqlTable(
  "subscription_audio_access",
  {
    id: int("id").autoincrement().primaryKey(),
    cycleId: int("cycleId").notNull().references(() => subscriptionCycles.id, { onDelete: "cascade" }),
    novelId: int("novelId").notNull().references(() => novels.id),
    chapterId: int("chapterId").notNull().references(() => chapters.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [uniqueIndex("subscription_audio_access_cycle_chapter_unique").on(table.cycleId, table.chapterId), index("subscription_audio_access_cycle_novel_idx").on(table.cycleId, table.novelId)]
);

export const scheduledJobs = mysqlTable("scheduled_jobs", {
  id: int("id").autoincrement().primaryKey(),
  jobKey: varchar("jobKey", { length: 100 }).notNull().unique(),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  cronExpression: varchar("cronExpression", { length: 80 }).notNull(),
  isEnabled: boolean("isEnabled").default(true).notNull(),
  lastRunAt: timestamp("lastRunAt"),
  lastResult: varchar("lastResult", { length: 80 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const settings = mysqlTable("settings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("settingKey", { length: 160 }).notNull().unique(),
  value: json("value").notNull(),
  updatedByUserId: int("updatedByUserId").references(() => users.id),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Author = typeof authors.$inferSelect;
export type Novel = typeof novels.$inferSelect;
export type Chapter = typeof chapters.$inferSelect;


export const translationStatus = ["draft", "review", "published"] as const;

export const userLanguagePreferences = mysqlTable("user_language_preferences", {
  userId: int("userId").notNull().primaryKey().references(() => users.id, { onDelete: "cascade" }),
  languageCode: mysqlEnum("languageCode", supportedLanguageCode).default("ar").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const authorTranslations = mysqlTable("author_translations", {
  id: int("id").autoincrement().primaryKey(),
  authorId: int("authorId").notNull().references(() => authors.id, { onDelete: "cascade" }),
  languageCode: mysqlEnum("languageCode", supportedLanguageCode).notNull(),
  displayName: varchar("displayName", { length: 180 }).notNull(),
  shortBio: text("shortBio"),
  biography: longtext("biography"),
  status: mysqlEnum("status", translationStatus).default("draft").notNull(),
  translatedByUserId: int("translatedByUserId").references(() => users.id),
  reviewedByUserId: int("reviewedByUserId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("author_translations_author_language_unique").on(table.authorId, table.languageCode), index("author_translations_language_status_idx").on(table.languageCode, table.status)]);

export const categoryTranslations = mysqlTable("category_translations", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("categoryId").notNull().references(() => categories.id, { onDelete: "cascade" }),
  languageCode: mysqlEnum("languageCode", supportedLanguageCode).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", translationStatus).default("draft").notNull(),
  translatedByUserId: int("translatedByUserId").references(() => users.id),
  reviewedByUserId: int("reviewedByUserId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("category_translations_category_language_unique").on(table.categoryId, table.languageCode), index("category_translations_language_status_idx").on(table.languageCode, table.status)]);

export const novelTranslations = mysqlTable("novel_translations", {
  id: int("id").autoincrement().primaryKey(),
  novelId: int("novelId").notNull().references(() => novels.id, { onDelete: "cascade" }),
  languageCode: mysqlEnum("languageCode", supportedLanguageCode).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  subtitle: varchar("subtitle", { length: 255 }),
  shortDescription: text("shortDescription"),
  description: longtext("description"),
  seoTitle: varchar("seoTitle", { length: 255 }),
  seoDescription: varchar("seoDescription", { length: 360 }),
  status: mysqlEnum("status", translationStatus).default("draft").notNull(),
  translatedByUserId: int("translatedByUserId").references(() => users.id),
  reviewedByUserId: int("reviewedByUserId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("novel_translations_novel_language_unique").on(table.novelId, table.languageCode), index("novel_translations_language_status_idx").on(table.languageCode, table.status)]);

export const chapterTranslations = mysqlTable("chapter_translations", {
  id: int("id").autoincrement().primaryKey(),
  chapterId: int("chapterId").notNull().references(() => chapters.id, { onDelete: "cascade" }),
  languageCode: mysqlEnum("languageCode", supportedLanguageCode).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  excerpt: text("excerpt"),
  content: longtext("content").notNull(),
  status: mysqlEnum("status", translationStatus).default("draft").notNull(),
  translatedByUserId: int("translatedByUserId").references(() => users.id),
  reviewedByUserId: int("reviewedByUserId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("chapter_translations_chapter_language_unique").on(table.chapterId, table.languageCode), index("chapter_translations_language_status_idx").on(table.languageCode, table.status)]);


export const translationSuggestionStatus = ["pending", "approved", "rejected"] as const;

export const chapterTranslationSuggestions = mysqlTable("chapter_translation_suggestions", {
  id: int("id").autoincrement().primaryKey(),
  chapterId: int("chapterId").notNull().references(() => chapters.id, { onDelete: "cascade" }),
  languageCode: mysqlEnum("languageCode", supportedLanguageCode).notNull(),
  sourceText: text("sourceText").notNull(),
  suggestedText: text("suggestedText").notNull(),
  note: varchar("note", { length: 500 }),
  status: mysqlEnum("status", translationSuggestionStatus).default("pending").notNull(),
  suggestedByUserId: int("suggestedByUserId").notNull().references(() => users.id, { onDelete: "cascade" }),
  reviewedByUserId: int("reviewedByUserId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("chapter_translation_suggestions_chapter_language_idx").on(table.chapterId, table.languageCode), index("chapter_translation_suggestions_status_idx").on(table.status)]);


export const contactMessageStatus = ["new", "read", "replied", "archived"] as const;
export const pointTransactionTypes = ["reading", "chapter_complete", "favorite", "review", "translation_suggestion", "profile_complete"] as const;

export const userPointTransactions = mysqlTable("user_point_transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: mysqlEnum("type", pointTransactionTypes).notNull(),
  points: int("points").notNull(),
  description: varchar("description", { length: 240 }).notNull(),
  entityType: varchar("entityType", { length: 80 }),
  entityId: int("entityId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("user_points_user_created_idx").on(table.userId, table.createdAt), index("user_points_user_type_idx").on(table.userId, table.type)]);


export const contactMessages = mysqlTable("contact_messages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id, { onDelete: "set null" }),
  name: varchar("name", { length: 160 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 220 }).notNull(),
  message: text("message").notNull(),
  status: mysqlEnum("status", contactMessageStatus).default("new").notNull(),
  adminReply: text("adminReply"),
  repliedByUserId: int("repliedByUserId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("contact_messages_status_idx").on(table.status), index("contact_messages_user_idx").on(table.userId)]);
