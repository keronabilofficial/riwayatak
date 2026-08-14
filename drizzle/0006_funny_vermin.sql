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