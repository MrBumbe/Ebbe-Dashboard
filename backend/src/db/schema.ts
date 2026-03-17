import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';

// ── Families ────────────────────────────────────────────────
export const families = sqliteTable('families', {
  id:           text('id').primaryKey(),
  name:         text('name').notNull(),
  childToken:   text('child_token').notNull().unique(),
  createdAt:    integer('created_at').notNull(),
});

// ── Users (parents / guardians) ─────────────────────────────
export const users = sqliteTable('users', {
  id:                 text('id').primaryKey(),
  familyId:           text('family_id').notNull().references(() => families.id),
  name:               text('name').notNull(),
  email:              text('email').notNull().unique(),
  passwordHash:       text('password_hash').notNull(),
  role:               text('role', { enum: ['admin', 'parent', 'readonly'] }).notNull().default('parent'),
  phone:              text('phone'),
  roleTitle:          text('role_title'),      // custom display name for role, e.g. "Parent", "Relative"
  mustChangePassword: integer('must_change_password', { mode: 'boolean' }).notNull().default(false),
  createdAt:          integer('created_at').notNull(),
});

// ── Invite tokens ─────────────────────────────────────────
export const inviteTokens = sqliteTable('invite_tokens', {
  id:         text('id').primaryKey(),
  familyId:   text('family_id').notNull().references(() => families.id),
  token:      text('token').notNull().unique(),
  role:       text('role').notNull(),          // "admin" | "parent"
  createdBy:  text('created_by').notNull(),    // userId of admin who created it
  expiresAt:  integer('expires_at').notNull(), // unix ms
  usedAt:     integer('used_at'),              // unix ms; null = not yet used
  createdAt:  integer('created_at').notNull(),
});

// ── Children ─────────────────────────────────────────────
export const children = sqliteTable('children', {
  id:         text('id').primaryKey(),
  familyId:   text('family_id').notNull().references(() => families.id),
  name:       text('name').notNull(),
  emoji:      text('emoji').notNull().default('🧒'),
  color:      text('color').notNull().default('#1565C0'),
  birthdate:  integer('birthdate'),            // unix ms; optional
  childToken: text('child_token').notNull().unique(),
  createdAt:  integer('created_at').notNull(),
});

// ── Routine tasks ────────────────────────────────────────────
export const tasks = sqliteTable('tasks', {
  id:                text('id').primaryKey(),
  familyId:          text('family_id').notNull().references(() => families.id),
  title:             text('title').notNull(),
  emoji:             text('emoji').notNull().default('⭐'),
  routine:           text('routine', { enum: ['morning', 'evening', 'custom'] }).notNull(),
  routineName:       text('routine_name'),                    // display name for custom routines
  order:             integer('order').notNull().default(0),
  starValue:         integer('star_value').notNull().default(1),
  isActive:          integer('is_active', { mode: 'boolean' }).notNull().default(true),
  isVisibleToChild:  integer('is_visible_to_child', { mode: 'boolean' }).notNull().default(true),
  daysOfWeek:        text('days_of_week').notNull().default('[0,1,2,3,4,5,6]'), // JSON array 0=Mon
  timeStart:         text('time_start'),                      // "HH:MM" or null = always
  timeEnd:           text('time_end'),                        // "HH:MM" or null = always
  focusModeEnabled:  integer('focus_mode_enabled', { mode: 'boolean' }).notNull().default(false),
  createdAt:         integer('created_at').notNull(),
});

// ── Task completions log ─────────────────────────────────────
export const taskCompletions = sqliteTable('task_completions', {
  id:           text('id').primaryKey(),
  familyId:     text('family_id').notNull().references(() => families.id),
  childId:      text('child_id'),              // null = legacy (family-level); set = per-child
  taskId:       text('task_id').notNull().references(() => tasks.id),
  completedAt:  integer('completed_at').notNull(),
  starsAwarded: integer('stars_awarded').notNull(),
});

// ── Weekly schedule ──────────────────────────────────────────
export const scheduleItems = sqliteTable('schedule_items', {
  id:           text('id').primaryKey(),
  familyId:     text('family_id').notNull().references(() => families.id),
  dayOfWeek:    integer('day_of_week').notNull(), // 0=Mon … 6=Sun; computed from specificDate when isRecurring=false
  timeStart:    text('time_start').notNull(),     // "HH:MM"
  title:        text('title').notNull(),
  emoji:        text('emoji').notNull().default('📅'),
  color:        text('color').notNull().default('#4A90D9'),
  isRecurring:  integer('is_recurring', { mode: 'boolean' }).notNull().default(true),
  specificDate: integer('specific_date'),         // unix ms; one-time date (isRecurring=false) or annual anchor (isRecurring=true)
});

// ── One-off events with countdown ───────────────────────────
export const events = sqliteTable('events', {
  id:           text('id').primaryKey(),
  familyId:     text('family_id').notNull().references(() => families.id),
  childId:      text('child_id'),               // null = whole family; set = assigned to specific child
  title:        text('title').notNull(),
  emoji:        text('emoji').notNull().default('🎉'),
  eventDate:    integer('event_date').notNull(), // unix ms; next occurrence date (kept in sync with specificDate for annual events)
  isVisible:    integer('is_visible', { mode: 'boolean' }).notNull().default(true),
  specificDate: integer('specific_date'),        // unix ms; annual anchor date for recurring events (e.g. birthdays)
});

// ── Mood log ─────────────────────────────────────────────────
export const moodLog = sqliteTable('mood_log', {
  id:           text('id').primaryKey(),
  familyId:     text('family_id').notNull().references(() => families.id),
  childId:      text('child_id'),              // null = legacy (family-level); set = per-child
  mood:         text('mood', {
                  enum: ['happy', 'okay', 'sad', 'angry', 'tired', 'excited', 'anxious']
                }).notNull(),
  loggedAt:     integer('logged_at').notNull(), // unix ms
  note:         text('note'),                   // optional parent note
});

// ── Reward catalog ───────────────────────────────────────────
export const rewards = sqliteTable('rewards', {
  id:           text('id').primaryKey(),
  familyId:     text('family_id').notNull().references(() => families.id),
  title:        text('title').notNull(),
  emoji:        text('emoji').notNull().default('🎁'),
  starCost:     integer('star_cost').notNull(),
  isActive:     integer('is_active', { mode: 'boolean' }).notNull().default(true),
});

// ── Star economy ledger ──────────────────────────────────────
export const rewardTransactions = sqliteTable('reward_transactions', {
  id:           text('id').primaryKey(),
  familyId:     text('family_id').notNull().references(() => families.id),
  childId:      text('child_id'),              // null = legacy (family-level); set = per-child
  type:         text('type', { enum: ['earn', 'redeem'] }).notNull(),
  amount:       integer('amount').notNull(),
  description:  text('description').notNull(),
  relatedId:    text('related_id'),  // taskId or rewardId
  createdAt:    integer('created_at').notNull(),
});

// ── Child reward requests (pending redemptions) ──────────────
export const rewardRequests = sqliteTable('reward_requests', {
  id:           text('id').primaryKey(),
  familyId:     text('family_id').notNull().references(() => families.id),
  childId:      text('child_id'),              // which child made the request
  rewardId:     text('reward_id').notNull().references(() => rewards.id),
  status:       text('status', { enum: ['pending', 'approved', 'denied'] }).notNull().default('pending'),
  requestedAt:  integer('requested_at').notNull(),
  resolvedAt:   integer('resolved_at'),
});

// ── Key/value settings per family ───────────────────────────
export const settings = sqliteTable('settings', {
  familyId:     text('family_id').notNull().references(() => families.id),
  key:          text('key').notNull(),
  value:        text('value').notNull(), // JSON string
}, (t) => ({
  pk: primaryKey({ columns: [t.familyId, t.key] }),
}));

// ── Installed modules ────────────────────────────────────────
export const modules = sqliteTable('modules', {
  familyId:     text('family_id').notNull().references(() => families.id),
  moduleId:     text('module_id').notNull(),
  isEnabled:    integer('is_enabled', { mode: 'boolean' }).notNull().default(true),
  config:       text('config').notNull().default('{}'), // JSON string
}, (t) => ({
  pk: primaryKey({ columns: [t.familyId, t.moduleId] }),
}));

// ── Child screen widget layout ───────────────────────────────
// widgetId values: clock, weather, routine-morning, routine-evening, routine-custom,
//   week-schedule, upcoming-event, mood-checkin, star-balance, timer-display
// childId: '' = family-level default; actual childId = per-child layout
export const childLayouts = sqliteTable('child_layouts', {
  familyId:    text('family_id').notNull().references(() => families.id),
  childId:     text('child_id').notNull().default(''), // '' = family default
  pageNumber:  integer('page_number').notNull().default(1),
  widgetId:    text('widget_id').notNull(),
  order:       integer('order').notNull().default(0),
  isEnabled:   integer('is_enabled', { mode: 'boolean' }).notNull().default(true),
  config:      text('config').notNull().default('{}'), // JSON string, widget-specific overrides
}, (t) => ({
  pk: primaryKey({ columns: [t.familyId, t.childId, t.pageNumber, t.widgetId] }),
}));

// ── AI memory (v3 — tables created now, populated later) ────
export const aiCoreMemory = sqliteTable('ai_core_memory', {
  familyId:     text('family_id').primaryKey().references(() => families.id),
  content:      text('content').notNull().default(''),
  updatedAt:    integer('updated_at').notNull(),
});

export const aiConversationLog = sqliteTable('ai_conversation_log', {
  id:           text('id').primaryKey(),
  familyId:     text('family_id').notNull().references(() => families.id),
  role:         text('role', { enum: ['user', 'assistant'] }).notNull(),
  content:      text('content').notNull(),
  createdAt:    integer('created_at').notNull(),
});

export const aiDailySummaries = sqliteTable('ai_daily_summaries', {
  id:           text('id').primaryKey(),
  familyId:     text('family_id').notNull().references(() => families.id),
  date:         text('date').notNull(),    // "YYYY-MM-DD"
  summary:      text('summary').notNull(),
  createdAt:    integer('created_at').notNull(),
});

export const aiMonthlySummaries = sqliteTable('ai_monthly_summaries', {
  id:           text('id').primaryKey(),
  familyId:     text('family_id').notNull().references(() => families.id),
  month:        text('month').notNull(),   // "YYYY-MM"
  summary:      text('summary').notNull(),
  createdAt:    integer('created_at').notNull(),
});
