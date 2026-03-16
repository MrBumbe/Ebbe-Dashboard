# Ebbe — Build Status

Last updated: 2026-03-16 (session 8)

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
| `routes/schedule.ts` | ✅ Done | `GET /`, `POST /`, `PATCH /:id`, `DELETE /:id` |
| `routes/settings.ts` | ✅ Done | `GET /`, `GET /:key`, `PUT /:key`, `DELETE /:key` |
| `routes/events.ts` | ✅ Done | `GET /`, `POST /`, `PATCH /:id`, `DELETE /:id` |
| `routes/child.ts` | ✅ Done | tasks (day/time filtered), complete, schedule, events, balance, transactions, rewards, reward requests, mood status/log, layout, settings (bundled), theme, weather |
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
