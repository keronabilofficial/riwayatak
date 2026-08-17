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