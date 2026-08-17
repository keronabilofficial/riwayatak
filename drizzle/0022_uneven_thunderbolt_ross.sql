CREATE TABLE `chapter_translation_suggestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chapterId` int NOT NULL,
	`languageCode` enum('ar','en','fr','tr') NOT NULL,
	`sourceText` text NOT NULL,
	`suggestedText` text NOT NULL,
	`note` varchar(500),
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`suggestedByUserId` int NOT NULL,
	`reviewedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chapter_translation_suggestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `chapter_translation_suggestions` ADD CONSTRAINT `chapter_translation_suggestions_chapterId_chapters_id_fk` FOREIGN KEY (`chapterId`) REFERENCES `chapters`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chapter_translation_suggestions` ADD CONSTRAINT `chapter_translation_suggestions_suggestedByUserId_users_id_fk` FOREIGN KEY (`suggestedByUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chapter_translation_suggestions` ADD CONSTRAINT `chapter_translation_suggestions_reviewedByUserId_users_id_fk` FOREIGN KEY (`reviewedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `chapter_translation_suggestions_chapter_language_idx` ON `chapter_translation_suggestions` (`chapterId`,`languageCode`);--> statement-breakpoint
CREATE INDEX `chapter_translation_suggestions_status_idx` ON `chapter_translation_suggestions` (`status`);