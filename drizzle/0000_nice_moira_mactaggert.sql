CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`record_id` text NOT NULL,
	`event` text NOT NULL,
	`detail` text NOT NULL,
	`actor` text NOT NULL,
	`at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `events_owner_record` ON `events` (`owner`,`record_id`,`at`);--> statement-breakpoint
CREATE TABLE `records` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`kind` text NOT NULL,
	`data` text NOT NULL,
	`status` text DEFAULT '' NOT NULL,
	`last_activity` text NOT NULL,
	`archived_at` text,
	`previous_status` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`mutation` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `records_owner_kind` ON `records` (`owner`,`kind`);--> statement-breakpoint
CREATE INDEX `records_inactivity` ON `records` (`owner`,`kind`,`last_activity`);