ALTER TABLE `leadSearches` ADD `lastInsertedCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `leadSearches` ADD `lastDuplicateCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `leadSearches` ADD `lastErrorCount` int DEFAULT 0 NOT NULL;