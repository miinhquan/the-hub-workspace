CREATE TABLE `wa_conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`phone` text NOT NULL,
	`name` text NOT NULL,
	`customer_id` text,
	`inquiry_id` text,
	`last_message_at` integer DEFAULT 0 NOT NULL,
	`last_customer_at` integer DEFAULT 0 NOT NULL,
	`preview` text DEFAULT '' NOT NULL,
	`read_seq` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `wa_conversations_phone_unique` ON `wa_conversations` (`phone`);--> statement-breakpoint
CREATE INDEX `wa_conversations_recent` ON `wa_conversations` (`owner`,`last_message_at`);--> statement-breakpoint
CREATE TABLE `wa_messages` (
	`seq` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`id` text NOT NULL,
	`wamid` text,
	`conversation_id` text NOT NULL,
	`direction` text NOT NULL,
	`source` text NOT NULL,
	`type` text NOT NULL,
	`text` text NOT NULL,
	`payload` text NOT NULL,
	`timestamp` integer NOT NULL,
	`created_at` integer NOT NULL,
	`status` text NOT NULL,
	`status_at` integer NOT NULL,
	`error` text DEFAULT '' NOT NULL,
	`client_key` text,
	`actor` text,
	`ingestion_key` text NOT NULL,
	FOREIGN KEY (`conversation_id`) REFERENCES `wa_conversations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `wa_messages_id_unique` ON `wa_messages` (`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `wa_messages_wamid_unique` ON `wa_messages` (`wamid`);--> statement-breakpoint
CREATE UNIQUE INDEX `wa_messages_client_key_unique` ON `wa_messages` (`client_key`);--> statement-breakpoint
CREATE INDEX `wa_messages_thread` ON `wa_messages` (`conversation_id`,`seq`);--> statement-breakpoint
CREATE TABLE `wa_state` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `wa_statuses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`wamid` text NOT NULL,
	`status` text NOT NULL,
	`timestamp` integer NOT NULL,
	`error` text NOT NULL,
	`client_key` text
);
--> statement-breakpoint
CREATE INDEX `wa_statuses_message` ON `wa_statuses` (`wamid`);--> statement-breakpoint
CREATE TABLE `wa_sync` (
	`id` integer PRIMARY KEY NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL
);

