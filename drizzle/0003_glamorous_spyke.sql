ALTER TABLE `authors` ADD `normalizedName` varchar(220) NOT NULL;--> statement-breakpoint
CREATE INDEX `authors_search_name_idx` ON `authors` (`normalizedName`);