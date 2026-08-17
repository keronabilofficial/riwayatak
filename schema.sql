-- Unified database schema for Riwayatak Bialarabiya
-- Generated from Drizzle migrations 0000-0026 in journal order.
-- Target dialect: MySQL/TiDB. Review credentials and database selection before importing.
SET NAMES utf8mb4;


-- ============================================================================
-- Migration: drizzle/0000_omniscient_nightcrawler.sql
-- ============================================================================

CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);


-- ============================================================================
-- Migration: drizzle/0001_dapper_mother_askani.sql
-- ============================================================================

CREATE TABLE `activity_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorUserId` int,
	`action` varchar(100) NOT NULL,
	`entityType` varchar(80) NOT NULL,
	`entityId` int,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ad_slots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`placement` enum('home','category','novel','reader') NOT NULL,
	`label` varchar(120) NOT NULL,
	`provider` varchar(80),
	`slotCode` varchar(255),
	`isEnabled` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ad_slots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `authors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(180) NOT NULL,
	`displayName` varchar(180) NOT NULL,
	`slug` varchar(220) NOT NULL,
	`shortBio` text,
	`biography` longtext,
	`imageMediaId` int,
	`seoTitle` varchar(255),
	`seoDescription` varchar(360),
	`isVisible` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `authors_id` PRIMARY KEY(`id`),
	CONSTRAINT `authors_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `backup_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`kind` enum('content_snapshot','database_export','media_manifest') NOT NULL,
	`status` enum('queued','running','verified','failed','expired') NOT NULL DEFAULT 'queued',
	`storageKey` varchar(512),
	`externalReference` varchar(500),
	`checksum` varchar(128),
	`sizeBytes` int,
	`retentionUntil` timestamp,
	`errorMessage` text,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `backup_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(120) NOT NULL,
	`description` text,
	`isVisible` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `chapters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`novelId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`slug` varchar(280) NOT NULL,
	`sortOrder` int NOT NULL,
	`content` longtext NOT NULL,
	`excerpt` text,
	`status` enum('draft','review','published','unpublished','archived') NOT NULL DEFAULT 'draft',
	`publishedAt` timestamp,
	`createdByUserId` int NOT NULL,
	`updatedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chapters_id` PRIMARY KEY(`id`),
	CONSTRAINT `chapters_novel_slug_unique` UNIQUE(`novelId`,`slug`),
	CONSTRAINT `chapters_novel_order_unique` UNIQUE(`novelId`,`sortOrder`)
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`novelId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `favorites_id` PRIMARY KEY(`id`),
	CONSTRAINT `favorites_user_novel_unique` UNIQUE(`userId`,`novelId`)
);
--> statement-breakpoint
CREATE TABLE `media` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`url` varchar(1024) NOT NULL,
	`altText` varchar(255),
	`mimeType` varchar(127) NOT NULL,
	`sizeBytes` int,
	`width` int,
	`height` int,
	`createdByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `media_id` PRIMARY KEY(`id`),
	CONSTRAINT `media_storageKey_unique` UNIQUE(`storageKey`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('new_chapter','new_novel','system') NOT NULL,
	`title` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`href` varchar(500),
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `novel_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`novelId` int NOT NULL,
	`categoryId` int NOT NULL,
	CONSTRAINT `novel_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `novel_categories_unique` UNIQUE(`novelId`,`categoryId`)
);
--> statement-breakpoint
CREATE TABLE `novel_follows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`novelId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `novel_follows_id` PRIMARY KEY(`id`),
	CONSTRAINT `novel_follows_user_novel_unique` UNIQUE(`userId`,`novelId`)
);
--> statement-breakpoint
CREATE TABLE `novel_tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`novelId` int NOT NULL,
	`tagId` int NOT NULL,
	CONSTRAINT `novel_tags_id` PRIMARY KEY(`id`),
	CONSTRAINT `novel_tags_unique` UNIQUE(`novelId`,`tagId`)
);
--> statement-breakpoint
CREATE TABLE `novels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`authorId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`subtitle` varchar(255),
	`slug` varchar(280) NOT NULL,
	`shortDescription` text,
	`description` longtext,
	`normalizedTitle` varchar(300) NOT NULL,
	`coverMediaId` int,
	`status` enum('draft','review','published','unpublished','archived') NOT NULL DEFAULT 'draft',
	`isFeatured` boolean NOT NULL DEFAULT false,
	`chapterCount` int NOT NULL DEFAULT 0,
	`publishedAt` timestamp,
	`archivedAt` timestamp,
	`seoTitle` varchar(255),
	`seoDescription` varchar(360),
	`createdByUserId` int NOT NULL,
	`updatedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `novels_id` PRIMARY KEY(`id`),
	CONSTRAINT `novels_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `reading_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`sessionHash` varchar(128),
	`novelId` int NOT NULL,
	`chapterId` int,
	`eventType` enum('novel_view','chapter_open','chapter_complete') NOT NULL,
	`occurredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reading_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reading_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`novelId` int NOT NULL,
	`chapterId` int NOT NULL,
	`characterOffset` int NOT NULL DEFAULT 0,
	`progressPercent` int NOT NULL DEFAULT 0,
	`isCompleted` boolean NOT NULL DEFAULT false,
	`lastReadAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reading_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `reading_progress_user_novel_unique` UNIQUE(`userId`,`novelId`)
);
--> statement-breakpoint
CREATE TABLE `scheduled_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobKey` varchar(100) NOT NULL,
	`scheduleCronTaskUid` varchar(65),
	`cronExpression` varchar(80) NOT NULL,
	`isEnabled` boolean NOT NULL DEFAULT true,
	`lastRunAt` timestamp,
	`lastResult` varchar(80),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scheduled_jobs_id` PRIMARY KEY(`id`),
	CONSTRAINT `scheduled_jobs_jobKey_unique` UNIQUE(`jobKey`)
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`settingKey` varchar(160) NOT NULL,
	`value` json NOT NULL,
	`updatedByUserId` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `settings_settingKey_unique` UNIQUE(`settingKey`)
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(80) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`isArchived` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tags_id` PRIMARY KEY(`id`),
	CONSTRAINT `tags_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','editor','admin','super_admin') NOT NULL DEFAULT 'user';--> statement-breakpoint
CREATE INDEX `activity_logs_created_idx` ON `activity_logs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `authors_visibility_idx` ON `authors` (`isVisible`);--> statement-breakpoint
CREATE INDEX `backup_runs_status_idx` ON `backup_runs` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `chapters_reading_idx` ON `chapters` (`novelId`,`status`,`sortOrder`);--> statement-breakpoint
CREATE INDEX `media_created_by_idx` ON `media` (`createdByUserId`);--> statement-breakpoint
CREATE INDEX `notifications_inbox_idx` ON `notifications` (`userId`,`isRead`,`createdAt`);--> statement-breakpoint
CREATE INDEX `novel_categories_category_idx` ON `novel_categories` (`categoryId`);--> statement-breakpoint
CREATE INDEX `novel_tags_tag_idx` ON `novel_tags` (`tagId`);--> statement-breakpoint
CREATE INDEX `novels_publication_idx` ON `novels` (`status`,`publishedAt`);--> statement-breakpoint
CREATE INDEX `novels_author_idx` ON `novels` (`authorId`);--> statement-breakpoint
CREATE INDEX `novels_featured_idx` ON `novels` (`isFeatured`,`status`);--> statement-breakpoint
CREATE INDEX `novels_search_title_idx` ON `novels` (`normalizedTitle`);--> statement-breakpoint
CREATE INDEX `reading_events_content_idx` ON `reading_events` (`novelId`,`chapterId`,`occurredAt`);--> statement-breakpoint
CREATE INDEX `reading_events_user_idx` ON `reading_events` (`userId`,`occurredAt`);--> statement-breakpoint
CREATE INDEX `reading_progress_continue_idx` ON `reading_progress` (`userId`,`lastReadAt`);

-- ============================================================================
-- Migration: drizzle/0002_steep_maginty.sql
-- ============================================================================

ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_actorUserId_users_id_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `authors` ADD CONSTRAINT `authors_imageMediaId_media_id_fk` FOREIGN KEY (`imageMediaId`) REFERENCES `media`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chapters` ADD CONSTRAINT `chapters_novelId_novels_id_fk` FOREIGN KEY (`novelId`) REFERENCES `novels`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chapters` ADD CONSTRAINT `chapters_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chapters` ADD CONSTRAINT `chapters_updatedByUserId_users_id_fk` FOREIGN KEY (`updatedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_novelId_novels_id_fk` FOREIGN KEY (`novelId`) REFERENCES `novels`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `media` ADD CONSTRAINT `media_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `novel_categories` ADD CONSTRAINT `novel_categories_novelId_novels_id_fk` FOREIGN KEY (`novelId`) REFERENCES `novels`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `novel_categories` ADD CONSTRAINT `novel_categories_categoryId_categories_id_fk` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `novel_follows` ADD CONSTRAINT `novel_follows_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `novel_follows` ADD CONSTRAINT `novel_follows_novelId_novels_id_fk` FOREIGN KEY (`novelId`) REFERENCES `novels`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `novel_tags` ADD CONSTRAINT `novel_tags_novelId_novels_id_fk` FOREIGN KEY (`novelId`) REFERENCES `novels`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `novel_tags` ADD CONSTRAINT `novel_tags_tagId_tags_id_fk` FOREIGN KEY (`tagId`) REFERENCES `tags`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `novels` ADD CONSTRAINT `novels_authorId_authors_id_fk` FOREIGN KEY (`authorId`) REFERENCES `authors`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `novels` ADD CONSTRAINT `novels_coverMediaId_media_id_fk` FOREIGN KEY (`coverMediaId`) REFERENCES `media`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `novels` ADD CONSTRAINT `novels_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `novels` ADD CONSTRAINT `novels_updatedByUserId_users_id_fk` FOREIGN KEY (`updatedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reading_events` ADD CONSTRAINT `reading_events_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reading_events` ADD CONSTRAINT `reading_events_novelId_novels_id_fk` FOREIGN KEY (`novelId`) REFERENCES `novels`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reading_events` ADD CONSTRAINT `reading_events_chapterId_chapters_id_fk` FOREIGN KEY (`chapterId`) REFERENCES `chapters`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reading_progress` ADD CONSTRAINT `reading_progress_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reading_progress` ADD CONSTRAINT `reading_progress_novelId_novels_id_fk` FOREIGN KEY (`novelId`) REFERENCES `novels`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reading_progress` ADD CONSTRAINT `reading_progress_chapterId_chapters_id_fk` FOREIGN KEY (`chapterId`) REFERENCES `chapters`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `settings` ADD CONSTRAINT `settings_updatedByUserId_users_id_fk` FOREIGN KEY (`updatedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;

-- ============================================================================
-- Migration: drizzle/0003_glamorous_spyke.sql
-- ============================================================================

ALTER TABLE `authors` ADD `normalizedName` varchar(220) NOT NULL;--> statement-breakpoint
CREATE INDEX `authors_search_name_idx` ON `authors` (`normalizedName`);

-- ============================================================================
-- Migration: drizzle/0004_cool_amazoness.sql
-- ============================================================================

ALTER TABLE `categories` ADD `normalizedName` varchar(120) NOT NULL;--> statement-breakpoint
ALTER TABLE `tags` ADD `normalizedName` varchar(100) NOT NULL;--> statement-breakpoint
CREATE INDEX `categories_search_name_idx` ON `categories` (`normalizedName`);--> statement-breakpoint
CREATE INDEX `tags_search_name_idx` ON `tags` (`normalizedName`);

-- ============================================================================
-- Migration: drizzle/0005_condemned_ken_ellis.sql
-- ============================================================================

ALTER TABLE `users` ADD `isDisabled` boolean DEFAULT false NOT NULL;

-- ============================================================================
-- Migration: drizzle/0006_funny_vermin.sql
-- ============================================================================

CREATE TABLE `novel_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`novelId` int NOT NULL,
	`userId` int NOT NULL,
	`rating` int NOT NULL,
	`body` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `novel_reviews_id` PRIMARY KEY(`id`),
	CONSTRAINT `novel_reviews_user_novel_unique` UNIQUE(`userId`,`novelId`)
);
--> statement-breakpoint
ALTER TABLE `novel_reviews` ADD CONSTRAINT `novel_reviews_novelId_novels_id_fk` FOREIGN KEY (`novelId`) REFERENCES `novels`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `novel_reviews` ADD CONSTRAINT `novel_reviews_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `novel_reviews_novel_updated_idx` ON `novel_reviews` (`novelId`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `novel_reviews_novel_rating_idx` ON `novel_reviews` (`novelId`,`rating`);

-- ============================================================================
-- Migration: drizzle/0007_sweet_hardball.sql
-- ============================================================================

CREATE TABLE `chapter_audio` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chapterId` int NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`url` varchar(1024) NOT NULL,
	`mimeType` varchar(127) NOT NULL,
	`sizeBytes` int NOT NULL,
	`durationSeconds` int,
	`uploadedByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chapter_audio_id` PRIMARY KEY(`id`),
	CONSTRAINT `chapter_audio_chapterId_unique` UNIQUE(`chapterId`),
	CONSTRAINT `chapter_audio_storageKey_unique` UNIQUE(`storageKey`)
);
--> statement-breakpoint
ALTER TABLE `chapter_audio` ADD CONSTRAINT `chapter_audio_chapterId_chapters_id_fk` FOREIGN KEY (`chapterId`) REFERENCES `chapters`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chapter_audio` ADD CONSTRAINT `chapter_audio_uploadedByUserId_users_id_fk` FOREIGN KEY (`uploadedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `chapter_audio_uploader_idx` ON `chapter_audio` (`uploadedByUserId`);

-- ============================================================================
-- Migration: drizzle/0008_flashy_susan_delgado.sql
-- ============================================================================

CREATE TABLE `subscription_audio_access` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cycleId` int NOT NULL,
	`novelId` int NOT NULL,
	`chapterId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `subscription_audio_access_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscription_audio_access_cycle_chapter_unique` UNIQUE(`cycleId`,`chapterId`)
);
--> statement-breakpoint
CREATE TABLE `subscription_cycles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subscriptionId` int NOT NULL,
	`providerOrderId` varchar(255) NOT NULL,
	`providerTransactionId` varchar(255),
	`status` enum('pending','active','expired','failed') NOT NULL DEFAULT 'pending',
	`startsAt` timestamp,
	`endsAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscription_cycles_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscription_cycles_providerOrderId_unique` UNIQUE(`providerOrderId`),
	CONSTRAINT `subscription_cycles_providerTransactionId_unique` UNIQUE(`providerTransactionId`)
);
--> statement-breakpoint
CREATE TABLE `subscription_novel_access` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cycleId` int NOT NULL,
	`novelId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `subscription_novel_access_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscription_novel_access_cycle_novel_unique` UNIQUE(`cycleId`,`novelId`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`planName` enum('go','plus','ultra','enterprise') NOT NULL,
	`billingTerm` enum('monthly','quarterly','hundred_days','six_months','yearly') NOT NULL,
	`provider` varchar(32) NOT NULL DEFAULT 'paymob',
	`providerSubscriptionId` varchar(255),
	`status` enum('pending','active','past_due','cancelled','expired') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptions_providerSubscriptionId_unique` UNIQUE(`providerSubscriptionId`)
);
--> statement-breakpoint
ALTER TABLE `subscription_audio_access` ADD CONSTRAINT `subscription_audio_access_cycleId_subscription_cycles_id_fk` FOREIGN KEY (`cycleId`) REFERENCES `subscription_cycles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscription_audio_access` ADD CONSTRAINT `subscription_audio_access_novelId_novels_id_fk` FOREIGN KEY (`novelId`) REFERENCES `novels`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscription_audio_access` ADD CONSTRAINT `subscription_audio_access_chapterId_chapters_id_fk` FOREIGN KEY (`chapterId`) REFERENCES `chapters`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscription_cycles` ADD CONSTRAINT `subscription_cycles_subscriptionId_subscriptions_id_fk` FOREIGN KEY (`subscriptionId`) REFERENCES `subscriptions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscription_novel_access` ADD CONSTRAINT `subscription_novel_access_cycleId_subscription_cycles_id_fk` FOREIGN KEY (`cycleId`) REFERENCES `subscription_cycles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscription_novel_access` ADD CONSTRAINT `subscription_novel_access_novelId_novels_id_fk` FOREIGN KEY (`novelId`) REFERENCES `novels`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `subscription_audio_access_cycle_novel_idx` ON `subscription_audio_access` (`cycleId`,`novelId`);--> statement-breakpoint
CREATE INDEX `subscription_cycles_access_idx` ON `subscription_cycles` (`status`,`endsAt`);--> statement-breakpoint
CREATE INDEX `subscription_cycles_subscription_idx` ON `subscription_cycles` (`subscriptionId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `subscription_novel_access_cycle_idx` ON `subscription_novel_access` (`cycleId`);--> statement-breakpoint
CREATE INDEX `subscriptions_user_status_idx` ON `subscriptions` (`userId`,`status`);

-- ============================================================================
-- Migration: drizzle/0009_romantic_robin_chapel.sql
-- ============================================================================

ALTER TABLE `subscriptions` ADD `cancelAtPeriodEnd` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `cancelledAt` timestamp;

-- ============================================================================
-- Migration: drizzle/0010_fantastic_typhoid_mary.sql
-- ============================================================================

ALTER TABLE `subscription_cycles` ADD `planLabelSnapshot` varchar(80);--> statement-breakpoint
ALTER TABLE `subscription_cycles` ADD `priceEgpSnapshot` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `subscription_cycles` ADD `novelLimitSnapshot` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `subscription_cycles` ADD `audioChapterLimitSnapshot` int;
--> statement-breakpoint
ALTER TABLE `subscription_cycles` ADD `planLabelSnapshot` varchar(80);


-- ============================================================================
-- Migration: drizzle/0011_quick_excalibur.sql
-- ============================================================================

ALTER TABLE `ad_slots` ADD COLUMN `adSensePublisherId` varchar(32);


-- ============================================================================
-- Migration: drizzle/0012_fearless_johnny_storm.sql
-- ============================================================================

CREATE TABLE `favorite_ratings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`novelId` int NOT NULL,
	`rating` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `favorite_ratings_id` PRIMARY KEY(`id`),
	CONSTRAINT `favorite_ratings_user_novel_unique` UNIQUE(`userId`,`novelId`)
);
--> statement-breakpoint
ALTER TABLE `favorite_ratings` ADD CONSTRAINT `favorite_ratings_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favorite_ratings` ADD CONSTRAINT `favorite_ratings_novelId_novels_id_fk` FOREIGN KEY (`novelId`) REFERENCES `novels`(`id`) ON DELETE no action ON UPDATE no action;

-- ============================================================================
-- Migration: drizzle/0013_striped_oracle.sql
-- ============================================================================

CREATE TABLE `favorite_list_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listId` int NOT NULL,
	`novelId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `favorite_list_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `favorite_list_items_list_novel_unique` UNIQUE(`listId`,`novelId`)
);
--> statement-breakpoint
CREATE TABLE `favorite_lists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `favorite_lists_id` PRIMARY KEY(`id`),
	CONSTRAINT `favorite_lists_user_name_unique` UNIQUE(`userId`,`name`)
);
--> statement-breakpoint
ALTER TABLE `reading_progress` ADD `totalReadingSeconds` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `favorite_list_items` ADD CONSTRAINT `favorite_list_items_listId_favorite_lists_id_fk` FOREIGN KEY (`listId`) REFERENCES `favorite_lists`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favorite_list_items` ADD CONSTRAINT `favorite_list_items_novelId_novels_id_fk` FOREIGN KEY (`novelId`) REFERENCES `novels`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favorite_lists` ADD CONSTRAINT `favorite_lists_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;

-- ============================================================================
-- Migration: drizzle/0014_sudden_firestar.sql
-- ============================================================================

CREATE TABLE `favorite_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`novelId` int NOT NULL,
	`note` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `favorite_notes_id` PRIMARY KEY(`id`),
	CONSTRAINT `favorite_notes_user_novel_unique` UNIQUE(`userId`,`novelId`)
);
--> statement-breakpoint
ALTER TABLE `favorite_notes` ADD CONSTRAINT `favorite_notes_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favorite_notes` ADD CONSTRAINT `favorite_notes_novelId_novels_id_fk` FOREIGN KEY (`novelId`) REFERENCES `novels`(`id`) ON DELETE no action ON UPDATE no action;

-- ============================================================================
-- Migration: drizzle/0015_demonic_malcolm_colcord.sql
-- ============================================================================

CREATE TABLE `recommendation_dismissals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`novelId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `recommendation_dismissals_id` PRIMARY KEY(`id`),
	CONSTRAINT `recommendation_dismissals_user_novel_unique` UNIQUE(`userId`,`novelId`)
);
--> statement-breakpoint
ALTER TABLE `favorite_notes` ADD `isPublished` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `recommendation_dismissals` ADD CONSTRAINT `recommendation_dismissals_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `recommendation_dismissals` ADD CONSTRAINT `recommendation_dismissals_novelId_novels_id_fk` FOREIGN KEY (`novelId`) REFERENCES `novels`(`id`) ON DELETE no action ON UPDATE no action;

-- ============================================================================
-- Migration: drizzle/0016_confused_unus.sql
-- ============================================================================

CREATE TABLE `favorite_quotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`novelId` int NOT NULL,
	`chapterId` int NOT NULL,
	`selectedText` varchar(2000) NOT NULL,
	`startOffset` int,
	`endOffset` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `favorite_quotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `favorite_quotes` ADD CONSTRAINT `favorite_quotes_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favorite_quotes` ADD CONSTRAINT `favorite_quotes_novelId_novels_id_fk` FOREIGN KEY (`novelId`) REFERENCES `novels`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favorite_quotes` ADD CONSTRAINT `favorite_quotes_chapterId_chapters_id_fk` FOREIGN KEY (`chapterId`) REFERENCES `chapters`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `favorite_quotes_user_novel_idx` ON `favorite_quotes` (`userId`,`novelId`);--> statement-breakpoint
CREATE INDEX `favorite_quotes_user_chapter_idx` ON `favorite_quotes` (`userId`,`chapterId`);

-- ============================================================================
-- Migration: drizzle/0017_volatile_hannibal_king.sql
-- ============================================================================

CREATE TABLE `novel_notification_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`novelId` int NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `novel_notification_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `novel_notification_preferences_user_novel_unique` UNIQUE(`userId`,`novelId`)
);
--> statement-breakpoint
CREATE TABLE `user_notification_preferences` (
	`userId` int NOT NULL,
	`popupEnabled` boolean NOT NULL DEFAULT true,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_notification_preferences_userId` PRIMARY KEY(`userId`)
);
--> statement-breakpoint
ALTER TABLE `novel_notification_preferences` ADD CONSTRAINT `novel_notification_preferences_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `novel_notification_preferences` ADD CONSTRAINT `novel_notification_preferences_novelId_novels_id_fk` FOREIGN KEY (`novelId`) REFERENCES `novels`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_notification_preferences` ADD CONSTRAINT `user_notification_preferences_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `novel_notification_preferences_user_idx` ON `novel_notification_preferences` (`userId`,`enabled`);

-- ============================================================================
-- Migration: drizzle/0018_thin_gravity.sql
-- ============================================================================

CREATE TABLE `author_follows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`authorId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `author_follows_id` PRIMARY KEY(`id`),
	CONSTRAINT `author_follows_user_author_unique` UNIQUE(`userId`,`authorId`)
);
--> statement-breakpoint
CREATE TABLE `chapter_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chapterId` int NOT NULL,
	`userId` int NOT NULL,
	`body` varchar(1200) NOT NULL,
	`isHidden` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chapter_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `comment_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`commentId` int NOT NULL,
	`userId` int NOT NULL,
	`reason` varchar(250) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `comment_reports_id` PRIMARY KEY(`id`),
	CONSTRAINT `comment_reports_user_comment_unique` UNIQUE(`userId`,`commentId`)
);
--> statement-breakpoint
CREATE TABLE `public_reading_list_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listId` int NOT NULL,
	`novelId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `public_reading_list_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `public_reading_list_items_list_novel_unique` UNIQUE(`listId`,`novelId`)
);
--> statement-breakpoint
CREATE TABLE `public_reading_lists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`description` text,
	`isPublic` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `public_reading_lists_id` PRIMARY KEY(`id`),
	CONSTRAINT `public_reading_lists_user_name_unique` UNIQUE(`userId`,`name`)
);
--> statement-breakpoint
CREATE TABLE `read_later` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`novelId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `read_later_id` PRIMARY KEY(`id`),
	CONSTRAINT `read_later_user_novel_unique` UNIQUE(`userId`,`novelId`)
);
--> statement-breakpoint
CREATE TABLE `user_achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`achievementKey` varchar(80) NOT NULL,
	`earnedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_achievements_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_achievements_user_key_unique` UNIQUE(`userId`,`achievementKey`)
);
--> statement-breakpoint
ALTER TABLE `novels` ADD `narrativeStatus` enum('ongoing','completed') DEFAULT 'ongoing' NOT NULL;--> statement-breakpoint
ALTER TABLE `author_follows` ADD CONSTRAINT `author_follows_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `author_follows` ADD CONSTRAINT `author_follows_authorId_authors_id_fk` FOREIGN KEY (`authorId`) REFERENCES `authors`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chapter_comments` ADD CONSTRAINT `chapter_comments_chapterId_chapters_id_fk` FOREIGN KEY (`chapterId`) REFERENCES `chapters`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chapter_comments` ADD CONSTRAINT `chapter_comments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comment_reports` ADD CONSTRAINT `comment_reports_commentId_chapter_comments_id_fk` FOREIGN KEY (`commentId`) REFERENCES `chapter_comments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comment_reports` ADD CONSTRAINT `comment_reports_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `public_reading_list_items` ADD CONSTRAINT `public_reading_list_items_listId_public_reading_lists_id_fk` FOREIGN KEY (`listId`) REFERENCES `public_reading_lists`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `public_reading_list_items` ADD CONSTRAINT `public_reading_list_items_novelId_novels_id_fk` FOREIGN KEY (`novelId`) REFERENCES `novels`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `public_reading_lists` ADD CONSTRAINT `public_reading_lists_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `read_later` ADD CONSTRAINT `read_later_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `read_later` ADD CONSTRAINT `read_later_novelId_novels_id_fk` FOREIGN KEY (`novelId`) REFERENCES `novels`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_achievements` ADD CONSTRAINT `user_achievements_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `author_follows_author_idx` ON `author_follows` (`authorId`);--> statement-breakpoint
CREATE INDEX `chapter_comments_chapter_created_idx` ON `chapter_comments` (`chapterId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `chapter_comments_user_idx` ON `chapter_comments` (`userId`);--> statement-breakpoint
CREATE INDEX `comment_reports_comment_idx` ON `comment_reports` (`commentId`);--> statement-breakpoint
CREATE INDEX `public_reading_list_items_novel_idx` ON `public_reading_list_items` (`novelId`);--> statement-breakpoint
CREATE INDEX `public_reading_lists_public_idx` ON `public_reading_lists` (`isPublic`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `read_later_user_created_idx` ON `read_later` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `user_achievements_user_earned_idx` ON `user_achievements` (`userId`,`earnedAt`);

-- ============================================================================
-- Migration: drizzle/0019_optimal_grim_reaper.sql
-- ============================================================================

ALTER TABLE `chapters` ADD `scheduledAt` timestamp;--> statement-breakpoint
CREATE INDEX `chapters_scheduled_idx` ON `chapters` (`status`,`scheduledAt`);

-- ============================================================================
-- Migration: drizzle/0020_lethal_gamma_corps.sql
-- ============================================================================

ALTER TABLE `notifications` ADD `novelId` int;--> statement-breakpoint
ALTER TABLE `notifications` ADD `authorId` int;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_novelId_novels_id_fk` FOREIGN KEY (`novelId`) REFERENCES `novels`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_authorId_authors_id_fk` FOREIGN KEY (`authorId`) REFERENCES `authors`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `notifications_novel_idx` ON `notifications` (`novelId`);--> statement-breakpoint
CREATE INDEX `notifications_author_idx` ON `notifications` (`authorId`);

-- ============================================================================
-- Migration: drizzle/0021_robust_payback.sql
-- ============================================================================

CREATE TABLE `author_translations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`authorId` int NOT NULL,
	`languageCode` enum('ar','en','fr','tr') NOT NULL,
	`displayName` varchar(180) NOT NULL,
	`shortBio` text,
	`biography` longtext,
	`status` enum('draft','review','published') NOT NULL DEFAULT 'draft',
	`translatedByUserId` int,
	`reviewedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `author_translations_id` PRIMARY KEY(`id`),
	CONSTRAINT `author_translations_author_language_unique` UNIQUE(`authorId`,`languageCode`)
);
--> statement-breakpoint
CREATE TABLE `category_translations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoryId` int NOT NULL,
	`languageCode` enum('ar','en','fr','tr') NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`status` enum('draft','review','published') NOT NULL DEFAULT 'draft',
	`translatedByUserId` int,
	`reviewedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `category_translations_id` PRIMARY KEY(`id`),
	CONSTRAINT `category_translations_category_language_unique` UNIQUE(`categoryId`,`languageCode`)
);
--> statement-breakpoint
CREATE TABLE `chapter_translations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chapterId` int NOT NULL,
	`languageCode` enum('ar','en','fr','tr') NOT NULL,
	`title` varchar(255) NOT NULL,
	`excerpt` text,
	`content` longtext NOT NULL,
	`status` enum('draft','review','published') NOT NULL DEFAULT 'draft',
	`translatedByUserId` int,
	`reviewedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chapter_translations_id` PRIMARY KEY(`id`),
	CONSTRAINT `chapter_translations_chapter_language_unique` UNIQUE(`chapterId`,`languageCode`)
);
--> statement-breakpoint
CREATE TABLE `novel_translations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`novelId` int NOT NULL,
	`languageCode` enum('ar','en','fr','tr') NOT NULL,
	`title` varchar(255) NOT NULL,
	`subtitle` varchar(255),
	`shortDescription` text,
	`description` longtext,
	`seoTitle` varchar(255),
	`seoDescription` varchar(360),
	`status` enum('draft','review','published') NOT NULL DEFAULT 'draft',
	`translatedByUserId` int,
	`reviewedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `novel_translations_id` PRIMARY KEY(`id`),
	CONSTRAINT `novel_translations_novel_language_unique` UNIQUE(`novelId`,`languageCode`)
);
--> statement-breakpoint
CREATE TABLE `user_language_preferences` (
	`userId` int NOT NULL,
	`languageCode` enum('ar','en','fr','tr') NOT NULL DEFAULT 'ar',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_language_preferences_userId` PRIMARY KEY(`userId`)
);
--> statement-breakpoint
ALTER TABLE `author_translations` ADD CONSTRAINT `author_translations_authorId_authors_id_fk` FOREIGN KEY (`authorId`) REFERENCES `authors`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `author_translations` ADD CONSTRAINT `author_translations_translatedByUserId_users_id_fk` FOREIGN KEY (`translatedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `author_translations` ADD CONSTRAINT `author_translations_reviewedByUserId_users_id_fk` FOREIGN KEY (`reviewedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `category_translations` ADD CONSTRAINT `category_translations_categoryId_categories_id_fk` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `category_translations` ADD CONSTRAINT `category_translations_translatedByUserId_users_id_fk` FOREIGN KEY (`translatedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `category_translations` ADD CONSTRAINT `category_translations_reviewedByUserId_users_id_fk` FOREIGN KEY (`reviewedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chapter_translations` ADD CONSTRAINT `chapter_translations_chapterId_chapters_id_fk` FOREIGN KEY (`chapterId`) REFERENCES `chapters`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chapter_translations` ADD CONSTRAINT `chapter_translations_translatedByUserId_users_id_fk` FOREIGN KEY (`translatedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chapter_translations` ADD CONSTRAINT `chapter_translations_reviewedByUserId_users_id_fk` FOREIGN KEY (`reviewedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `novel_translations` ADD CONSTRAINT `novel_translations_novelId_novels_id_fk` FOREIGN KEY (`novelId`) REFERENCES `novels`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `novel_translations` ADD CONSTRAINT `novel_translations_translatedByUserId_users_id_fk` FOREIGN KEY (`translatedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `novel_translations` ADD CONSTRAINT `novel_translations_reviewedByUserId_users_id_fk` FOREIGN KEY (`reviewedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_language_preferences` ADD CONSTRAINT `user_language_preferences_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `author_translations_language_status_idx` ON `author_translations` (`languageCode`,`status`);--> statement-breakpoint
CREATE INDEX `category_translations_language_status_idx` ON `category_translations` (`languageCode`,`status`);--> statement-breakpoint
CREATE INDEX `chapter_translations_language_status_idx` ON `chapter_translations` (`languageCode`,`status`);--> statement-breakpoint
CREATE INDEX `novel_translations_language_status_idx` ON `novel_translations` (`languageCode`,`status`);

-- ============================================================================
-- Migration: drizzle/0022_uneven_thunderbolt_ross.sql
-- ============================================================================

CREATE TABLE `chapter_translation_suggestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chapterId` int NOT NULL,
	`languageCode` enum('ar','en','fr','tr') NOT NULL,
	`sourceText` text NOT NULL,
	`suggestedText` text NOT NULL,
	`note` varchar(500),
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`suggestedByUserId` int NOT NULL,
	`reviewedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chapter_translation_suggestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `chapter_translation_suggestions` ADD CONSTRAINT `chapter_translation_suggestions_chapterId_chapters_id_fk` FOREIGN KEY (`chapterId`) REFERENCES `chapters`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chapter_translation_suggestions` ADD CONSTRAINT `chapter_translation_suggestions_suggestedByUserId_users_id_fk` FOREIGN KEY (`suggestedByUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chapter_translation_suggestions` ADD CONSTRAINT `chapter_translation_suggestions_reviewedByUserId_users_id_fk` FOREIGN KEY (`reviewedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `chapter_translation_suggestions_chapter_language_idx` ON `chapter_translation_suggestions` (`chapterId`,`languageCode`);--> statement-breakpoint
CREATE INDEX `chapter_translation_suggestions_status_idx` ON `chapter_translation_suggestions` (`status`);

-- ============================================================================
-- Migration: drizzle/0023_remarkable_molly_hayes.sql
-- ============================================================================

CREATE TABLE `contact_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`name` varchar(160) NOT NULL,
	`email` varchar(320) NOT NULL,
	`subject` varchar(220) NOT NULL,
	`message` text NOT NULL,
	`status` enum('new','read','replied','archived') NOT NULL DEFAULT 'new',
	`adminReply` text,
	`repliedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contact_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `contact_messages` ADD CONSTRAINT `contact_messages_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contact_messages` ADD CONSTRAINT `contact_messages_repliedByUserId_users_id_fk` FOREIGN KEY (`repliedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `contact_messages_status_idx` ON `contact_messages` (`status`);--> statement-breakpoint
CREATE INDEX `contact_messages_user_idx` ON `contact_messages` (`userId`);

-- ============================================================================
-- Migration: drizzle/0024_great_galactus.sql
-- ============================================================================

ALTER TABLE `users` ADD `avatarUrl` varchar(1024);--> statement-breakpoint
ALTER TABLE `users` ADD `avatarKey` varchar(512);

-- ============================================================================
-- Migration: drizzle/0025_fair_morg.sql
-- ============================================================================

CREATE TABLE `user_point_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('reading','chapter_complete','favorite','review','translation_suggestion','profile_complete') NOT NULL,
	`points` int NOT NULL,
	`description` varchar(240) NOT NULL,
	`entityType` varchar(80),
	`entityId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_point_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `bio` varchar(500);--> statement-breakpoint
ALTER TABLE `users` ADD `country` varchar(120);--> statement-breakpoint
ALTER TABLE `users` ADD `preferredLanguage` enum('ar','en','fr','tr');--> statement-breakpoint
ALTER TABLE `user_point_transactions` ADD CONSTRAINT `user_point_transactions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `user_points_user_created_idx` ON `user_point_transactions` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `user_points_user_type_idx` ON `user_point_transactions` (`userId`,`type`);

-- ============================================================================
-- Migration: drizzle/0026_massive_kitty_pryde.sql
-- ============================================================================

CREATE TABLE `user_point_redemptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`rewardKey` enum('reader_badge','golden_bookmark','early_access','exclusive_audio') NOT NULL,
	`pointsCost` int NOT NULL,
	`redeemedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_point_redemptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_point_redemptions_user_reward_unique` UNIQUE(`userId`,`rewardKey`)
);
--> statement-breakpoint
ALTER TABLE `user_point_transactions` MODIFY COLUMN `type` enum('reading','chapter_complete','favorite','review','translation_suggestion','profile_complete','redemption') NOT NULL;--> statement-breakpoint
ALTER TABLE `user_point_redemptions` ADD CONSTRAINT `user_point_redemptions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `user_point_redemptions_user_idx` ON `user_point_redemptions` (`userId`,`redeemedAt`);
