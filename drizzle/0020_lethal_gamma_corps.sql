ALTER TABLE `notifications` ADD `novelId` int;--> statement-breakpoint
ALTER TABLE `notifications` ADD `authorId` int;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_novelId_novels_id_fk` FOREIGN KEY (`novelId`) REFERENCES `novels`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_authorId_authors_id_fk` FOREIGN KEY (`authorId`) REFERENCES `authors`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `notifications_novel_idx` ON `notifications` (`novelId`);--> statement-breakpoint
CREATE INDEX `notifications_author_idx` ON `notifications` (`authorId`);