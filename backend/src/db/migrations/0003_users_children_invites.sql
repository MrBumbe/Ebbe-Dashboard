ALTER TABLE `users` ADD `must_change_password` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `phone` text;--> statement-breakpoint
ALTER TABLE `users` ADD `role_title` text;--> statement-breakpoint
CREATE TABLE `invite_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`family_id` text NOT NULL,
	`token` text NOT NULL,
	`role` text NOT NULL,
	`created_by` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`created_at` integer NOT NULL
);--> statement-breakpoint
CREATE TABLE `children` (
	`id` text PRIMARY KEY NOT NULL,
	`family_id` text NOT NULL,
	`name` text NOT NULL,
	`emoji` text NOT NULL DEFAULT '🧒',
	`color` text NOT NULL DEFAULT '#1565C0',
	`birthdate` integer,
	`child_token` text NOT NULL,
	`created_at` integer NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX `invite_tokens_token_unique` ON `invite_tokens` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `children_child_token_unique` ON `children` (`child_token`);
