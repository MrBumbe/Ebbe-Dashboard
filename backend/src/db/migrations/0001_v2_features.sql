ALTER TABLE `tasks` ADD `routine_name` text;--> statement-breakpoint
ALTER TABLE `tasks` ADD `is_visible_to_child` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` ADD `days_of_week` text DEFAULT '[0,1,2,3,4,5,6]' NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` ADD `time_start` text;--> statement-breakpoint
ALTER TABLE `tasks` ADD `time_end` text;--> statement-breakpoint
ALTER TABLE `tasks` ADD `focus_mode_enabled` integer DEFAULT false NOT NULL;--> statement-breakpoint
CREATE TABLE `reward_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`family_id` text NOT NULL,
	`reward_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`requested_at` integer NOT NULL,
	`resolved_at` integer,
	FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reward_id`) REFERENCES `rewards`(`id`) ON UPDATE no action ON DELETE no action
);--> statement-breakpoint
CREATE TABLE `child_layouts` (
	`family_id` text NOT NULL,
	`page_number` integer DEFAULT 1 NOT NULL,
	`widget_id` text NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	`is_enabled` integer DEFAULT true NOT NULL,
	`config` text DEFAULT '{}' NOT NULL,
	PRIMARY KEY(`family_id`, `page_number`, `widget_id`),
	FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON UPDATE no action ON DELETE no action
);
