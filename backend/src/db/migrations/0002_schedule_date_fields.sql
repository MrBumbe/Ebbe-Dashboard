ALTER TABLE `schedule_items` ADD `is_recurring` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `schedule_items` ADD `specific_date` integer;--> statement-breakpoint
ALTER TABLE `events` ADD `specific_date` integer;
