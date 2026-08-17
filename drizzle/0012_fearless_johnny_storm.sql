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