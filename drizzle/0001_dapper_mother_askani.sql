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