ALTER TABLE `subscription_cycles` ADD `planLabelSnapshot` varchar(80);--> statement-breakpoint
ALTER TABLE `subscription_cycles` ADD `priceEgpSnapshot` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `subscription_cycles` ADD `novelLimitSnapshot` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `subscription_cycles` ADD `audioChapterLimitSnapshot` int;
--> statement-breakpoint
ALTER TABLE `subscription_cycles` ADD `planLabelSnapshot` varchar(80);
