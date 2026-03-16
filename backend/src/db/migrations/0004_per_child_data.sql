-- Add child_id to task_completions and reward_transactions.
-- Nullable for backward compat — existing rows keep null (family-level).
-- The startup fixup in db/index.ts migrates null rows to the sole child
-- when a family has exactly one child, preserving historical balances.
ALTER TABLE `task_completions` ADD `child_id` text;--> statement-breakpoint
ALTER TABLE `reward_transactions` ADD `child_id` text;
