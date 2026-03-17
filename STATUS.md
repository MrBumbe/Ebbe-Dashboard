# Ebbe — Build Status

Last updated: 2026-03-17 (session 15 — CLAUDE.md reconciliation)

---

## Environment

| Item | Status |
|---|---|
| Node.js | v22.22.0 ✅ |
| VS 2022 Build Tools + Windows SDK | Installed ✅ |
| `backend/` npm install | Done ✅ |
| `frontend/` npm install | Done ✅ |
| Docker stack | Running ✅ |

---

## Backend — Routes

| File | Status | Endpoints |
|---|---|---|
| `routes/auth.ts` | ✅ Done | `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh` — JWT payload now includes `name` + `mustChangePassword` |
| `routes/tasks.ts` | ✅ Done | `GET /`, `POST /`, `PATCH /:id`, `DELETE /:id`, `POST /:id/complete` — broadcasts TASK_UPDATED + STARS_UPDATED |
| `routes/rewards.ts` | ✅ Done | Full CRUD, `GET /balance`, `GET /transactions`, `GET /requests`, `PATCH /requests/:id` (approve/deny), `POST /adjust` (manual) |
| `routes/layouts.ts` | ✅ Done | `GET /`, `PUT /` (replace all), `PATCH /:widgetId` — broadcasts LAYOUT_UPDATED |
| `routes/mood.ts` | ✅ Done | `GET /`, `POST /`, `DELETE /:id` |
| `routes/schedule.ts` | ✅ Done | `GET /`, `POST /`, `PATCH /:id`, `DELETE /:id` — accepts optional `childId` |
| `routes/settings.ts` | ✅ Done | `GET /`, `GET /:key`, `PUT /:key`, `DELETE /:key` |
| `routes/events.ts` | ✅ Done | `GET /`, `POST /`, `PATCH /:id`, `DELETE /:id` |
| `routes/child.ts` | ✅ Done | tasks (day/time filtered), complete, schedule (child-scoped), events (child-scoped), balance, transactions, rewards, reward requests, mood status/log (child-scoped cooldown), layout, settings (bundled), theme, weather |
| `routes/setup.ts` | ✅ Done | First-run setup endpoint |
| `routes/users.ts` | ✅ Done | `GET /` (admin), `GET /me`, `POST /invite` (admin), `POST /join` (public), `PATCH /me/password`, `PATCH /me/profile`, `PATCH /:id` (admin), `DELETE /:id` (admin), `POST /:id/reset-password` (admin) |
| `routes/family.ts` | ✅ Done | `GET /`, `PATCH /` (admin) — get/update family name |
| `routes/children.ts` | ✅ Done | `GET /`, `POST /`, `PATCH /:id`, `DELETE /:id` — per-child profiles with unique childTokens |

## Backend — Core

| File | Status | Notes |
|---|---|---|
| `db/schema.ts` | ✅ Done | All tables incl. reward_requests, child_layouts, AI memory tables |
| `db/migrations/0000_initial.sql` | ✅ Done | Base schema |
| `db/migrations/0001_v2_features.sql` | ✅ Done | New task columns + reward_requests + child_layouts |
| `db/index.ts` | ✅ Done | SQLite singleton + auto-migration on startup |
| `middleware/auth.ts` | ✅ Done | `requireAuth`, `requireRole` |
| `middleware/childAuth.ts` | ✅ Done | `requireChildToken` |
| `middleware/errors.ts` | ✅ Done | Global Express error handler |
| `lib/jwt.ts` | ✅ Done | sign/verify access + refresh tokens |
| `lib/crypto.ts` | ✅ Done | Token generation utils |
| `config.ts` | ✅ Done | Env var loading + validation |
| `index.ts` | ✅ Done | All routes mounted including /api/v1/layouts |
| `websocket/index.ts` | ✅ Done | WS server + broadcastToFamily helper |
| `modules/weather-openmeteo/` | ✅ Done | Open-Meteo, 10min cache |

## Frontend

| Area | Status | Notes |
|---|---|---|
| Vite + React + Tailwind setup | ✅ Done | |
| i18n setup (sv + en) | ✅ Done | All new strings added |
| `api/client.ts` | ✅ Done | axios + JWT refresh |
| `api/child.ts` | ✅ Done | fetch + childToken; all new endpoints |
| `api/websocket.ts` | ✅ Done | WS client; all new message types |
| `store/useAuthStore.ts` | ✅ Done | |
| `store/useChildStore.ts` | ✅ Done | includes rewards, transactions |
| `views/child/ChildApp.tsx` | ✅ Done | Header-first layout; level 1/2/3 system; swipe pages; star overlays |
| `views/child/AnalogClock.tsx` | ✅ Done | Standalone SVG analog clock (size via prop) |
| `views/child/ChildHeader.tsx` | ✅ Done | Unified 3-col header: weather/date/weekday + clock + stars; 3 levels |
| `views/child/Clock.tsx` | ✅ Done | (kept for reference; replaced by ChildHeader in child screen) |
| `views/child/TaskList.tsx` | ✅ Done | Morning/evening/custom; compact mode |
| `views/child/MoodCheckIn.tsx` | ✅ Done | Single row; activeMoods filter; cooldown |
| `views/child/RewardDisplay.tsx` | ✅ Done | Star count; tappable; compact mode |
| `views/child/StarStore.tsx` | ✅ Done | Full-screen overlay; 45s inactivity close |
| `views/child/StarHistory.tsx` | ✅ Done | Full-screen overlay; 45s inactivity close |
| `views/child/WeekSchedule.tsx` | ✅ Done | Starts from today; compact mode |
| `views/child/UpcomingEvent.tsx` | ✅ Done | Countdown in days |
| `views/child/TimerAlert.tsx` | ✅ Done | Fullscreen / minimized bar; Web Audio chime |
| `views/parent/Login.tsx` | ✅ Done | |
| `views/parent/ParentApp.tsx` | ✅ Done | Sidebar nav + Layout entry |
| `views/parent/Dashboard.tsx` | ✅ Done | |
| `views/parent/Tasks.tsx` | ✅ Done | isVisibleToChild, daysOfWeek, timeWindow, routineName, parent Complete button |
| `views/parent/Rewards.tsx` | ✅ Done | CRUD + pending requests + manual star adjustment |
| `views/parent/LayoutManager.tsx` | ✅ Done | Enable/disable, reorder, page assignment per widget |
| `views/parent/Schedule.tsx` | ✅ Done | |
| `views/parent/Events.tsx` | ✅ Done | |
| `views/parent/MoodLog.tsx` | ✅ Done | |
| `views/parent/Timer.tsx` | ✅ Done | |
| `views/parent/Settings.tsx` | ✅ Done | Language, weather, accent colour, store/history toggles, inactivity timeout |
| `views/parent/ModuleManager.tsx` | ✅ Done | Placeholder |
| `views/parent/Users.tsx` | ✅ Done | Admin: list/edit/delete users, invite link generation, reset password, edit family name |
| `views/parent/Children.tsx` | ✅ Done | List children, add/edit/delete, per-child kiosk URL with one-click copy |
| `views/parent/Join.tsx` | ✅ Done | Public invite-token join flow — create account from invite link at `/parent/join?token=xxx` |
| `views/parent/ChangePassword.tsx` | ✅ Done | Force-password-change screen shown when `mustChangePassword=true` |
| PWA manifest + icon | ✅ Done | |

## Infrastructure

| Item | Status | Notes |
|---|---|---|
| `docker-compose.yml` | ✅ Done | |
| `Caddyfile` | ✅ Done | |
| `.env.example` | ✅ Done | |
| `backend/Dockerfile` | ✅ Done | |
| `frontend/Dockerfile` | ✅ Done | |
| `litestream.yml` | ✅ Done | Optional backup profile |
| TypeScript (frontend) | ✅ Clean | `npx tsc --noEmit` passes |
| TypeScript (backend) | ✅ Clean | `npx tsc --noEmit` passes |

---

## v1 + Post-launch — All done ✅

Everything through Fix 13 + session 6 fixes is shipped.

**Session 7 fixes (2026-03-16):**
- Fix 1: Schedule edit form now opens above the calendar grid (not squeezed inside the cell). Editing highlights the item in the grid and shows the full-width form at the top.
- Fix 2: `isRecurring` boolean added to schedule items (default: true). Form shows "Recurring every week" toggle. When unchecked, a date picker replaces the weekday dropdown.
- Fix 3: `specificDate` (unix ms) added to `schedule_items` and `events` tables as date backbone. `lib/scheduleDate.ts` shared utility on backend handles effective-day resolution. Child schedule endpoint uses `resolveItemsForWeek` so date-specific items only appear in the correct weekday column for the current week. Annual recurring date picker available in the parent form via "+ Annual date" button.
- Fix 4: Removed `bg-white/10 rounded-2xl` card frame from the star balance section in the child header — stars now sit directly on the header surface. Weather emoji and star emoji use identical size classes per level for visual balance.

**Session 6 fixes (2026-03-16):**
- Bug 1: Transaction icons — `⭐` earn, `🎁` reward redemption, `✂️` manual deduction. Parent Rewards page now shows recent transaction history.
- Bug 2: Settings now load from API on mount (store/history toggles + inactivity timeout persist correctly).
- Bug 3: Star store/history overlays now show live countdown in the autoClose hint (`Closing in 42s`).
- Bug 4: Analog clock restored — now always visible in the unified header (level 1 = large, level 2 = medium, level 3 = hidden/row).
- Bug 5: Schedule items are now editable — click any item to open an inline edit form. Title is no longer truncated.
- Bug 6: Layout manager now shows widgets (backend returns DEFAULT_LAYOUT when DB is empty; setup seeds it; header widgets filtered from LayoutManager UI).
- New: Redesigned child screen header — always-visible 3-column header (weather, clock+analog, stars) with 3 levels based on widget count. `AnalogClock.tsx` extracted as reusable component. `ChildHeader.tsx` created.

## Session 12 fixes (2026-03-17)

**Active-child scoping — full parent panel data isolation:**

Store:
- `useAuthStore`: added `activeChildId: string | null` and `setActiveChildId(id)`. Persists to `localStorage`. Hydrated on page load.
- `ChildSelector` in `ParentApp.tsx`: now calls `setActiveChildId` from the store on selection (previously was local state only). On first load auto-selects `children[0]` if no stored selection.

Database migration `0005_child_scoped_data`:
- Added `child_id` (nullable) to `mood_log` — per-child mood history
- Added `child_id` (nullable) to `reward_requests` — tracks which child made each request
- Added `child_id` (nullable) to `events` — optional child assignment
- Recreated `child_layouts` table: added `child_id TEXT NOT NULL DEFAULT ''` to the primary key `(family_id, child_id, page_number, widget_id)`. Empty string = family-level default; child UUID = per-child layout. Existing rows migrated with `child_id = ''`.

Backend route changes:
- `routes/mood.ts`: `GET /mood` accepts `?childId=` to scope results; `POST /mood` saves `childId` from body
- `routes/rewards.ts`: `GET /balance`, `GET /transactions`, `GET /requests` all accept `?childId=`; `POST /adjust` accepts `childId` in body; `PATCH /requests/:id` (approve) scopes balance check and deduction to `request.childId`; all new transactions include `childId`
- `routes/layouts.ts`: `GET /layouts` accepts `?childId=`, falls back to family default; `PUT /layouts` accepts `{ childId, entries }` body; `PATCH /layouts/:widgetId` accepts `childId` in body
- `routes/tasks.ts`: `POST /:id/complete` accepts `childId` in body, records it on completion and transaction
- `routes/child.ts`: `rewardRequests` insert now saves `req.childId`; `/events` filters by `childId IS NULL OR childId = req.childId`; `/layout` queries per-child first, falls back to family default
- `routes/events.ts`: `POST` and `PATCH` accept optional `childId`; `GET` accepts optional `?childId=` filter

Frontend view changes (all re-fetch when `activeChildId` changes):
- `Tasks.tsx`: passes `childId: activeChildId` to parent-complete endpoint
- `Rewards.tsx`: passes `{ childId }` params to balance/transactions/requests; passes `childId` to adjust
- `MoodLog.tsx`: passes `{ childId }` as query param
- `LayoutManager.tsx`: passes `{ childId }` to GET; sends `{ childId, entries }` to PUT
- `Events.tsx`: added "Assign to" dropdown in add form (empty = whole family); shows assigned child name in list

Events design (intentional):
- Family-wide events (`childId = null`) appear on ALL child screens
- Child-assigned events (`childId = <uuid>`) appear only on that child's screen
- Parent Events view shows all events regardless of assignment

## Session 11 fixes (2026-03-16)

**Bug 1 — Per-child data isolation:**
- `middleware/childAuth.ts`: swapped check order — `children.childToken` is checked FIRST (sets both `req.familyId` and `req.childId`), then falls back to `families.childToken` legacy path. Ensures `req.childId` is always set when a known child token is used.
- `db/schema.ts`: added `childId` (nullable text) to `taskCompletions` and `rewardTransactions`. Nullable for backward compatibility — existing rows have null.
- `db/migrations/0004_per_child_data.sql`: new migration with two `ALTER TABLE ADD child_id text` statements.
- `db/migrations/meta/_journal.json`: added entry for `0004_per_child_data` (idx: 4).
- `db/index.ts`: added Fixup 2 — on startup, for families with exactly one child, migrates all null-`child_id` rows in `reward_transactions` and `task_completions` to that child's ID. Preserves historical balances on upgrade.
- `routes/child.ts`: all queries now scoped by `req.childId` when set:
  - `/tasks`: completions filtered by `childId`
  - `/tasks/:id/complete`: `alreadyDone` check scoped by `childId`; `taskCompletions` insert includes `childId`; `rewardTransactions` insert includes `childId`; balance calculation scoped by `childId`
  - `/balance`: transactions filtered by `childId`
  - `/transactions`: transactions filtered by `childId`

**Bug 2 — Per-child accent color:**
- `routes/child.ts` (`/settings` and `/theme`): when `req.childId` is set, looks up `children.color` and returns it as `accentColor`, overriding the family-level `settings.child.accentColor` fallback. Each child now sees their own color on the child screen.

## Session 10 fixes (2026-03-16)

**Bug 1 — Children name input focus loss:**
- `Children.tsx`: `ChildForm` was defined inside the `Children` function, causing React to recreate the component type on every render and unmount/remount the input. Moved `ChildForm` to module level with explicit props (same pattern as `TaskForm` in `Tasks.tsx`).
- Proactive audit confirmed: `Users.tsx` edit form renders inputs directly (no nested component), `Events.tsx` form also inline — neither has this issue. Only `Children.tsx` needed the fix.

**Bug 2 — Dark mode across all views:**
- Created `frontend/src/lib/theme.ts` — semantic Tailwind class token constants (`tw.pageHeading`, `tw.card`, `tw.input`, `tw.btnPrimary`, etc.) with full class name strings so Tailwind scans them correctly. This is the single source of truth for the color system; all future components should import and use these tokens.
- Applied dark mode to all older views that lacked it: `Tasks.tsx`, `Schedule.tsx`, `Events.tsx`, `Rewards.tsx`, `MoodLog.tsx`, `Timer.tsx`, `Settings.tsx`, `Dashboard.tsx`, `LayoutManager.tsx`, `Login.tsx`, `ModuleManager.tsx`.
- Consistent dark mode pairs applied throughout: `bg-white dark:bg-gray-800`, `border-gray-100 dark:border-gray-700`, `divide-gray-50 dark:divide-gray-700`, `text-gray-800 dark:text-gray-100`, etc.
- Child view components (`ChildApp`, `ChildHeader`, `TaskList`, etc.) intentionally left as-is — the child view uses a dynamic accent-color gradient as its background and is not part of the dark mode system.

## Session 9 fixes (2026-03-16)

- Fix: Children page was empty for existing installs. Root cause: `POST /api/v1/setup` wrote the child token to `families.childToken` only — it never inserted a row into the new `children` table. Fix has two parts:
  - `db/index.ts`: startup fixup — after migrations, any family with no `children` rows gets a default child record created using `families.childToken`. Runs once and is idempotent.
  - `routes/setup.ts`: also inserts a default child row at setup time for new installs.
- The existing child now appears in the Children management page with name "Child" (editable) and the same kiosk URL as before.

## Remaining before GitHub release

- [ ] Clear test data from `data/ebbe.db` (not included in git — recreated on first run)
- [ ] Tag `v0.1.0` release

## Session 8 additions (2026-03-16)

**Database changes:**
- `users` table: added `mustChangePassword` (boolean, default false), `phone` (text, nullable), `roleTitle` (text, nullable)
- New `invite_tokens` table: id, familyId, token (unique), role, createdBy, expiresAt, usedAt, createdAt
- New `children` table: id, familyId, name, emoji, color, birthdate, childToken (unique), createdAt
- Migration: `0003_users_children_invites.sql`

**Backend:**
- JWT payload extended: now includes `name` and `mustChangePassword` (used by frontend without extra API call)
- `routes/users.ts`: full user management (list, invite, join, edit, delete, reset-password, me profile/password)
- `routes/family.ts`: GET + PATCH family name
- `routes/children.ts`: CRUD for named children with per-child tokens
- `middleware/childAuth.ts`: now checks both `families.childToken` (legacy) and `children.childToken` (new)
- `index.ts`: mounts `/api/v1/users`, `/api/v1/family`, `/api/v1/children`

**Frontend:**
- `useAuthStore.ts`: added `name`, `mustChangePassword`, `darkMode`, `setDarkMode`, `setMustChangePassword`
- `tailwind.config.js`: `darkMode: 'class'` added
- `ParentApp.tsx`: major overhaul — new sidebar footer (user pill + cog → profile panel + logout), child selector dropdown, profile slide-out panel (display name, phone, password change, dark mode toggle, admin link), dark mode `dark:` classes throughout, routes for Users + Children, `mustChangePassword` redirect
- `App.tsx`: added `/parent/join` route (public, no auth required)
- `Users.tsx`: admin user management — list users, edit name/role/roleTitle/phone, invite link, show temp password on reset
- `Children.tsx`: manage children — add/edit/delete, colour picker, birthdate, kiosk URL copy
- `Join.tsx`: invite link join page — public, no auth needed
- `ChangePassword.tsx`: force password change screen (shown when admin resets password)
- i18n: new strings in both `en.json` and `sv.json` — `parent.nav.{children,users,logout}`, `parent.users.*`, `parent.children.*`, `parent.join.*`, `parent.changePassword.*`, `parent.profile.*`

**Role system:**
- Two active roles: `admin` (default roleTitle: "Parent" / "Förälder") and `parent` (default roleTitle: "Relative" / "Anhörig")
- Admin can: manage all users, reset passwords, invite, manage children, manage family name
- Parent can: everything else (tasks, rewards, schedule, events, layout, settings, children)
- `readonly` role remains in DB enum but is not exposed in UI

**Children multi-token system:**
- Each named child has their own `childToken`; child view tokens are per-child
- Legacy `families.childToken` (from setup) continues to work (childAuth checks both)
- `phone` field on users: prepared for future SMS/notification/emergency contact features (v3+)

**Dark mode:**
- Tailwind `class` strategy; toggle in profile panel
- Preference stored in `localStorage` (`ebbe_dark`) and toggled by adding/removing `dark` class on `<html>`
- DB persistence of dark mode preference is a v2 item (cross-device sync not yet implemented)

## Schema additions (session 7)

New columns on `schedule_items`:
```typescript
isRecurring:  boolean (default true)   // false = one-time on specificDate
specificDate: integer | null           // unix ms; one-time date or annual anchor
```

New column on `events`:
```typescript
specificDate: integer | null           // unix ms; annual anchor (e.g. birthday)
```

New file: `backend/src/lib/scheduleDate.ts` — `getEffectiveDayOfWeek`, `resolveItemsForWeek`

## Known v2/future items

- Focus mode UI (`focusModeEnabled` DB field on tasks exists, no UI yet)
- Vertical scroll page navigation (setting placeholder exists; only horizontal swipe now)
- Math game module
- Home Assistant integration
- Full Module manager UI in parent
- Capacitor APK build
- AI conversation module

---

## Important technical notes

- **Drizzle 0.30.x:** always use `db.select().from(t).where(...).get()` / `.all()` — NOT `db.query.*.findFirst()` (TypeScript typing issue)
- **Dates:** always Unix milliseconds (integer) in SQLite and API responses
- **family_id:** required on every table — non-negotiable for multi-tenant support
- **Child token auth:** `?token=<childToken>` query param, separate from JWT
- **Password hash format:** `<salt_hex>:<hash_hex>` (scrypt, N=16384, r=8, p=1, keylen=64)
- **Star economy:** task completion writes to both `task_completions` AND `reward_transactions` (type=`earn`)
- **Child kiosk URL:** `/child?token=xxx` — store in Fully Kiosk Browser on the child's device
