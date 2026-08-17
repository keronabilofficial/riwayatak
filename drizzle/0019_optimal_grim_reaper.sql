ALTER TABLE `chapters` ADD `scheduledAt` timestamp;--> statement-breakpoint
CREATE INDEX `chapters_scheduled_idx` ON `chapters` (`status`,`scheduledAt`);