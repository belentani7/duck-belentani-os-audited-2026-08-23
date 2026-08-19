CREATE TABLE `leadRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`searchId` int NOT NULL,
	`sourceId` int,
	`fullName` varchar(180),
	`companyName` varchar(180),
	`email` varchar(320),
	`phone` varchar(60),
	`website` varchar(500),
	`area` varchar(180),
	`niche` varchar(120),
	`intentSignal` varchar(255),
	`sourceUrl` varchar(1000) NOT NULL,
	`dedupeKey` varchar(500) NOT NULL,
	`score` int NOT NULL DEFAULT 0,
	`status` varchar(30) NOT NULL DEFAULT 'novo',
	`notes` text,
	`discoveredAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leadRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leadSearches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`niche` varchar(120) NOT NULL,
	`area` varchar(180) NOT NULL,
	`variablesJson` text,
	`sourceUrlsJson` text,
	`active` int NOT NULL DEFAULT 1,
	`lastRunAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `leadSearches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leadSources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`searchId` int NOT NULL,
	`url` varchar(1000) NOT NULL,
	`title` varchar(255),
	`status` varchar(30) NOT NULL DEFAULT 'pending',
	`fetchedAt` timestamp,
	`errorMessage` varchar(500),
	CONSTRAINT `leadSources_id` PRIMARY KEY(`id`)
);
