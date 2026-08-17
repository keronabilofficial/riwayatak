CREATE TABLE `novel_notification_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`novelId` int NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `novel_notification_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `novel_notification_preferences_user_novel_unique` UNIQUE(`userId`,`novelId`)
);
--> statement-breakpoint
CREATE TABLE `user_notification_preferences` (
	`userId` int NOT NULL,
	`popupEnabled` boolean NOT NULL DEFAULT true,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_notification_preferences_userId` PRIMARY KEY(`userId`)
);
--> statement-breakpoint
ALTER TABLE `novel_notification_preferences` ADD CONSTRAINT `novel_notification_preferences_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `novel_notification_preferences` ADD CONSTRAINT `novel_notification_preferences_novelId_novels_id_fk` FOREIGN KEY (`novelId`) REFERENCES `novels`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_notification_preferences` ADD CONSTRAINT `user_notification_preferences_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `novel_notification_preferences_user_idx` ON `novel_notification_preferences` (`userId`,`enabled`);