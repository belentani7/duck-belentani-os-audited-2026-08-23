CREATE TABLE `audioAssets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`projectId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`storageKey` varchar(500) NOT NULL,
	`versionLabel` varchar(120) NOT NULL,
	`mimeType` varchar(100) NOT NULL,
	`fileSize` int NOT NULL DEFAULT 0,
	`durationSeconds` int NOT NULL DEFAULT 0,
	`bpm` int,
	`loudnessLufs` varchar(20),
	`waveformJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audioAssets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `waveformComments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`assetId` int NOT NULL,
	`timestampSeconds` int NOT NULL,
	`body` varchar(500) NOT NULL,
	`resolved` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `waveformComments_id` PRIMARY KEY(`id`)
);
