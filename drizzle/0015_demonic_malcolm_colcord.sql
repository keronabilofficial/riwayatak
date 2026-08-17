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