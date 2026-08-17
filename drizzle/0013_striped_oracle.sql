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