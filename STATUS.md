# Ebbe — Build Status

Last updated: 2026-03-16 (session 6)

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
| `routes/auth.ts` | ✅ Done | `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh` |
| `routes/tasks.ts` | ✅ Done | `GET /`, `POST /`, `PATCH /:id`, `DELETE /:id`, `POST /:id/complete` — broadcasts TASK_UPDATED + STARS_UPDATED |
| `routes/rewards.ts` | ✅ Done | Full CRUD, `GET /balance`, `GET /transactions`, `GET /requests`, `PATCH /requests/:id` (approve/deny), `POST /adjust` (manual) |
| `routes/layouts.ts` | ✅ Done | `GET /`, `PUT /` (replace all), `PATCH /:widgetId` — broadcasts LAYOUT_UPDATED |
| `routes/mood.ts` | ✅ Done | `GET /`, `POST /`, `DELETE /:id` |
| `routes/schedule.ts` | ✅ Done | `GET /`, `POST /`, `PATCH /:id`, `DELETE /:id` |
| `routes/settings.ts` | ✅ Done | `GET /`, `GET /:key`, `PUT /:key`, `DELETE /:key` |
| `routes/events.ts` | ✅ Done | `GET /`, `POST /`, `PATCH /:id`, `DELETE /:id` |
| `routes/child.ts` | ✅ Done | tasks (day/time filtered), complete, schedule, events, balance, transactions, rewards, reward requests, mood status/log, layout, settings (bundled), theme, weather |
| `routes/setup.ts` | ✅ Done | First-run setup endpoint |

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

**Session 6 fixes (2026-03-16):**
- Bug 1: Transaction icons — `⭐` earn, `🎁` reward redemption, `✂️` manual deduction. Parent Rewards page now shows recent transaction history.
- Bug 2: Settings now load from API on mount (store/history toggles + inactivity timeout persist correctly).
- Bug 3: Star store/history overlays now show live countdown in the autoClose hint (`Closing in 42s`).
- Bug 4: Analog clock restored — now always visible in the unified header (level 1 = large, level 2 = medium, level 3 = hidden/row).
- Bug 5: Schedule items are now editable — click any item to open an inline edit form. Title is no longer truncated.
- Bug 6: Layout manager now shows widgets (backend returns DEFAULT_LAYOUT when DB is empty; setup seeds it; header widgets filtered from LayoutManager UI).
- New: Redesigned child screen header — always-visible 3-column header (weather, clock+analog, stars) with 3 levels based on widget count. `AnalogClock.tsx` extracted as reusable component. `ChildHeader.tsx` created.

## Remaining before GitHub release

- [ ] Clear test data from `data/ebbe.db` (not included in git — recreated on first run)
- [ ] Tag `v0.1.0` release

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
