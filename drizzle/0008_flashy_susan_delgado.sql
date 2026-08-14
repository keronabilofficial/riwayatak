CREATE TABLE `subscription_audio_access` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cycleId` int NOT NULL,
	`novelId` int NOT NULL,
	`chapterId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `subscription_audio_access_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscription_audio_access_cycle_chapter_unique` UNIQUE(`cycleId`,`chapterId`)
);
--> statement-breakpoint
CREATE TABLE `subscription_cycles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subscriptionId` int NOT NULL,
	`providerOrderId` varchar(255) NOT NULL,
	`providerTransactionId` varchar(255),
	`status` enum('pending','active','expired','failed') NOT NULL DEFAULT 'pending',
	`startsAt` timestamp,
	`endsAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscription_cycles_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscription_cycles_providerOrderId_unique` UNIQUE(`providerOrderId`),
	CONSTRAINT `subscription_cycles_providerTransactionId_unique` UNIQUE(`providerTransactionId`)
);
--> statement-breakpoint
CREATE TABLE `subscription_novel_access` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cycleId` int NOT NULL,
	`novelId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `subscription_novel_access_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscription_novel_access_cycle_novel_unique` UNIQUE(`cycleId`,`novelId`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`planName` enum('go','plus','ultra','enterprise') NOT NULL,
	`billingTerm` enum('monthly','quarterly','hundred_days','six_months','yearly') NOT NULL,
	`provider` varchar(32) NOT NULL DEFAULT 'paymob',
	`providerSubscriptionId` varchar(255),
	`status` enum('pending','active','past_due','cancelled','expired') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptions_providerSubscriptionId_unique` UNIQUE(`providerSubscriptionId`)
);
--> statement-breakpoint
ALTER TABLE `subscription_audio_access` ADD CONSTRAINT `subscription_audio_access_cycleId_subscription_cycles_id_fk` FOREIGN KEY (`cycleId`) REFERENCES `subscription_cycles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscription_audio_access` ADD CONSTRAINT `subscription_audio_access_novelId_novels_id_fk` FOREIGN KEY (`novelId`) REFERENCES `novels`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscription_audio_access` ADD CONSTRAINT `subscription_audio_access_chapterId_chapters_id_fk` FOREIGN KEY (`chapterId`) REFERENCES `chapters`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscription_cycles` ADD CONSTRAINT `subscription_cycles_subscriptionId_subscriptions_id_fk` FOREIGN KEY (`subscriptionId`) REFERENCES `subscriptions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscription_novel_access` ADD CONSTRAINT `subscription_novel_access_cycleId_subscription_cycles_id_fk` FOREIGN KEY (`cycleId`) REFERENCES `subscription_cycles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscription_novel_access` ADD CONSTRAINT `subscription_novel_access_novelId_novels_id_fk` FOREIGN KEY (`novelId`) REFERENCES `novels`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `subscription_audio_access_cycle_novel_idx` ON `subscription_audio_access` (`cycleId`,`novelId`);--> statement-breakpoint
CREATE INDEX `subscription_cycles_access_idx` ON `subscription_cycles` (`status`,`endsAt`);--> statement-breakpoint
CREATE INDEX `subscription_cycles_subscription_idx` ON `subscription_cycles` (`subscriptionId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `subscription_novel_access_cycle_idx` ON `subscription_novel_access` (`cycleId`);--> statement-breakpoint
CREATE INDEX `subscriptions_user_status_idx` ON `subscriptions` (`userId`,`status`);