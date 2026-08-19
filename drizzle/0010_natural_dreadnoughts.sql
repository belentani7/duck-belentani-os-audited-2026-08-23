CREATE TABLE `dawRenders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`projectId` int NOT NULL,
	`assetId` int,
	`externalId` varchar(180) NOT NULL,
	`source` varchar(40) NOT NULL DEFAULT 'ableton',
	`status` varchar(30) NOT NULL DEFAULT 'received',
	`metadataJson` text,
	`receivedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dawRenders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notificationPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`channel` varchar(40) NOT NULL,
	`destination` varchar(255),
	`enabled` int NOT NULL DEFAULT 0,
	`eventTypes` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notificationPreferences_id` PRIMARY KEY(`id`)
);
