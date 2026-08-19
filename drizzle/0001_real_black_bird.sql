CREATE TABLE `opportunities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`clientName` varchar(180) NOT NULL,
	`service` varchar(80) NOT NULL,
	`durationMinutes` int NOT NULL DEFAULT 180,
	`trackCount` int NOT NULL DEFAULT 1,
	`deadlineDays` int NOT NULL DEFAULT 7,
	`quotedMin` int NOT NULL,
	`quotedMax` int NOT NULL,
	`status` varchar(30) NOT NULL DEFAULT 'new',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `opportunities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `studioEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`type` varchar(30) NOT NULL,
	`title` varchar(180) NOT NULL,
	`detail` varchar(255) NOT NULL,
	`tone` varchar(20) NOT NULL DEFAULT 'lime',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `studioEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `studioProjects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(180) NOT NULL,
	`artist` varchar(180) NOT NULL,
	`status` varchar(40) NOT NULL DEFAULT 'Briefing',
	`progress` int NOT NULL DEFAULT 0,
	`color` varchar(20) NOT NULL DEFAULT 'lime',
	`currentVersion` varchar(120) NOT NULL DEFAULT 'Ideia inicial',
	`lastActivityAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `studioProjects_id` PRIMARY KEY(`id`)
);
