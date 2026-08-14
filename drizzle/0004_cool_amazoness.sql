ALTER TABLE `categories` ADD `normalizedName` varchar(120) NOT NULL;--> statement-breakpoint
ALTER TABLE `tags` ADD `normalizedName` varchar(100) NOT NULL;--> statement-breakpoint
CREATE INDEX `categories_search_name_idx` ON `categories` (`normalizedName`);--> statement-breakpoint
CREATE INDEX `tags_search_name_idx` ON `tags` (`normalizedName`);