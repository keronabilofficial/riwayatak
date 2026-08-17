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