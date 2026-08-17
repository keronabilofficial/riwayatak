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