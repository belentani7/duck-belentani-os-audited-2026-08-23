CREATE TABLE `releaseKits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`projectId` int,
	`title` varchar(180) NOT NULL,
	`concept` text,
	`isrc` varchar(30),
	`releaseDate` timestamp,
	`creditsJson` text,
	`linksJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `releaseKits_id` PRIMARY KEY(`id`)
);
