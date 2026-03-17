-- Add child_id to mood_log (nullable; null = legacy family-level entry)
ALTER TABLE `mood_log` ADD `child_id` text;--> statement-breakpoint
-- Add child_id to reward_requests (nullable; which child made the request)
ALTER TABLE `reward_requests` ADD `child_id` text;--> statement-breakpoint
-- Add child_id to events (nullable; null = whole family, set = assigned to specific child)
ALTER TABLE `events` ADD `child_id` text;--> statement-breakpoint
-- Recreate child_layouts to include child_id in the primary key.
-- Existing rows (family-level layouts) are migrated with child_id = '' (empty string sentinel).
-- Per-child layouts use the actual child UUID as child_id.
CREATE TABLE `child_layouts_new` (
	`family_id` text NOT NULL,
	`child_id` text NOT NULL DEFAULT '',
	`page_number` integer NOT NULL DEFAULT 1,
	`widget_id` text NOT NULL,
	`order` integer NOT NULL DEFAULT 0,
	`is_enabled` integer NOT NULL DEFAULT 1,
	`config` text NOT NULL DEFAULT '{}',
	PRIMARY KEY(`family_id`, `child_id`, `page_number`, `widget_id`)
);--> statement-breakpoint
INSERT INTO `child_layouts_new` (`family_id`, `child_id`, `page_number`, `widget_id`, `order`, `is_enabled`, `config`)
  SELECT `family_id`, '', `page_number`, `widget_id`, `order`, `is_enabled`, `config` FROM `child_layouts`;--> statement-breakpoint
DROP TABLE `child_layouts`;--> statement-breakpoint
ALTER TABLE `child_layouts_new` RENAME TO `child_layouts`;
