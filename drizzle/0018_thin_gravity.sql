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