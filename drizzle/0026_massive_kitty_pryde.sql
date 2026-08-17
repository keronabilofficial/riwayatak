CREATE TABLE `user_point_redemptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`rewardKey` enum('reader_badge','golden_bookmark','early_access','exclusive_audio') NOT NULL,
	`pointsCost` int NOT NULL,
	`redeemedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_point_redemptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_point_redemptions_user_reward_unique` UNIQUE(`userId`,`rewardKey`)
);
--> statement-breakpoint
ALTER TABLE `user_point_transactions` MODIFY COLUMN `type` enum('reading','chapter_complete','favorite','review','translation_suggestion','profile_complete','redemption') NOT NULL;--> statement-breakpoint
ALTER TABLE `user_point_redemptions` ADD CONSTRAINT `user_point_redemptions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `user_point_redemptions_user_idx` ON `user_point_redemptions` (`userId`,`redeemedAt`);