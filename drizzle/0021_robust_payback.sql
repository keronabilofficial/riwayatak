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