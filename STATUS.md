# Ebbe — Build Status

Last updated: 2026-03-14 (session 3)

---

## Environment

| Item | Status |
|---|---|
| Node.js | v22.22.0 ✅ |
| VS 2022 Build Tools + Windows SDK | Installed ✅ |
| `backend/` npm install | Done ✅ |
| `frontend/` npm install | Done ✅ |

---

## Backend — Routes

| File | Status | Endpoints |
|---|---|---|
| `routes/auth.ts` | ✅ Done | `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh` |
| `routes/tasks.ts` | ✅ Done | `GET /`, `POST /`, `PATCH /:id`, `DELETE /:id`, `POST /:id/complete` |
| `routes/rewards.ts` | ✅ Done | `GET /`, `POST /`, `PATCH /:id`, `DELETE /:id`, `POST /:id/redeem`, `GET /balance`, `GET /transactions` |
| `routes/mood.ts` | ✅ Done | `GET /`, `POST /`, `DELETE /:id` |
| `routes/schedule.ts` | ✅ Done | `GET /`, `POST /`, `PATCH /:id`, `DELETE /:id` |
| `routes/settings.ts` | ✅ Done | `GET /`, `GET /:key`, `PUT /:key`, `DELETE /:key` |
| `routes/events.ts` | ✅ Done | `GET /`, `POST /`, `PATCH /:id`, `DELETE /:id` |
| `routes/child.ts` | ✅ Done | Child-safe endpoints via `?token=` auth |

## Backend — Core

| File | Status | Notes |
|---|---|---|
| `db/schema.ts` | ✅ Done | All tables incl. AI memory tables |
| `db/index.ts` | ✅ Done | SQLite singleton + auto-migration on startup |
| `middleware/auth.ts` | ✅ Done | `requireAuth`, `requireRole` |
| `middleware/childAuth.ts` | ✅ Done | `requireChildToken` |
| `middleware/errors.ts` | ✅ Done | Global Express error handler |
| `lib/jwt.ts` | ✅ Done | sign/verify access + refresh tokens |
| `lib/crypto.ts` | ✅ Done | Token generation utils |
| `config.ts` | ✅ Done | Env var loading + validation |
| `index.ts` | ✅ Done | Express + WebSocket setup, all routes mounted |
| `websocket/index.ts` | ✅ Done | WS server + broadcast helpers |
| `modules/core/types.ts` | ✅ Done | EbbeModule, WeatherModule, WeatherData interfaces |
| `modules/core/registry.ts` | ✅ Done | Module registry singleton |
| `modules/core/loader.ts` | ✅ Done | Registers + starts all built-in modules, mounts routes |
| `modules/weather-openmeteo/` | ✅ Done | Open-Meteo, 10min cache, `/current` + `/config` routes |

## Frontend

| Area | Status | Notes |
|---|---|---|
| Vite + React + Tailwind setup | ✅ Done | |
| i18n setup (sv + en) | ✅ Done | |
| `api/client.ts` (axios + JWT refresh) | ✅ Done | |
| `api/child.ts` (fetch + childToken) | ✅ Done | |
| `api/websocket.ts` (WS client) | ✅ Done | |
| `store/useAuthStore.ts` | ✅ Done | |
| `store/useChildStore.ts` | ✅ Done | |
| `views/child/ChildApp.tsx` | ✅ Done | Token auth, WS, data loading, 3-col layout |
| `views/child/Clock.tsx` | ✅ Done | SVG analog + digital, responsive |
| `views/child/TaskList.tsx` | ✅ Done | Morning/evening, ≥64px tap targets |
| `views/child/MoodCheckIn.tsx` | ✅ Done | ≥60px emoji buttons |
| `views/child/RewardDisplay.tsx` | ✅ Done | Star count |
| `views/child/WeekSchedule.tsx` | ✅ Done | 7-col grid, today highlighted |
| `views/child/UpcomingEvent.tsx` | ✅ Done | Countdown in days |
| `views/child/TimerAlert.tsx` | ✅ Done | Full-screen overlay with SVG ring |
| `views/parent/Login.tsx` | ✅ Done | |
| `views/parent/ParentApp.tsx` | ✅ Done | Sidebar nav, mobile hamburger, auth guard |
| `views/parent/Dashboard.tsx` | ✅ Done | |
| `views/parent/Tasks.tsx` | ✅ Done | Full CRUD |
| `views/parent/Rewards.tsx` | ✅ Done | Full CRUD + balance |
| `views/parent/Schedule.tsx` | ✅ Done | 7-day grid |
| `views/parent/Events.tsx` | ✅ Done | Full CRUD |
| `views/parent/MoodLog.tsx` | ✅ Done | Read-only list |
| `views/parent/Timer.tsx` | ✅ Done | WS-connected, preset buttons |
| `views/parent/Settings.tsx` | ✅ Done | Language + weather location search |
| `views/parent/ModuleManager.tsx` | ✅ Done | Placeholder, full UI in v2 |
| PWA manifest + icon | ✅ Done | SVG icon (`icon.svg`), apple-touch-icon in index.html |

## Infrastructure

| Item | Status | Notes |
|---|---|---|
| `docker-compose.yml` | ✅ Done | backend + frontend + caddy + litestream (backup profile) |
| `Caddyfile` | ✅ Done | WS upgrade, CSP headers, gzip, auto-HTTPS |
| `.env.example` | ✅ Done | All vars documented |
| `backend/Dockerfile` | ✅ Done | node:22-alpine, multi-stage, copies migrations |
| `frontend/Dockerfile` | ✅ Done | node:22-alpine builder + nginx:alpine |
| `litestream.yml` | ✅ Done | 1min sync, 24h snapshot, 7d retention |
| Backend health check | ✅ Done | `/api/v1/health` returns `{"status":"ok"}` |
| Backend boot smoke test | ✅ Done | Server starts, migrations run, health check passes |
| Full Docker stack boot | ⏳ Not tested | Requires Docker Desktop — run `docker compose up` |

---

## v1 Scope — Done ✅

All v1 items are complete. The full stack is implemented:
- All backend routes and middleware
- Complete child + parent frontend
- Module system with weather module
- Docker Compose + Caddy + Litestream infrastructure
- Auto-migration on startup

## Remaining Before GitHub Release

- [x] Full `docker compose up` integration test — all three services healthy, health check passes, setup endpoint works
- [ ] Replace test data in `data/ebbe.db` (created during development, not included in git)
- [x] Verify `.gitignore` excludes `data/` and `.env`
- [x] Write `README.md` with quickstart instructions (Step-by-step for non-technical users)
- [x] `routes/setup.ts` — first-run setup endpoint (creates family + admin, then locks itself)
- [ ] Tag `v0.1.0` release

---

## Known Notes

- **Drizzle 0.30.x + better-sqlite3**: Use `db.select().from(t).where(...).get()` / `.all()` for type-safe queries. The relational `db.query.*.findFirst()` API returns `SQLiteSyncRelationalQuery<T>` which has a TS typing issue in this version — avoid it.
- **Password hash format**: `<salt_hex>:<hash_hex>` (scrypt, N=16384, r=8, p=1, keylen=64)
- **Star economy**: completing a task writes to both `task_completions` AND `reward_transactions` (type=`earn`)
- **PWA icons**: SVG icon used (`"sizes": "any"`) — works in Chrome/Edge/Firefox. PNG icons can be generated from `public/icons/icon.svg` using `sharp` or Inkscape if needed for older browser/OS support.
- **Child token**: The `/child?token=xxx` URL is the kiosk URL. Store it in Fully Kiosk Browser on the child's tablet.
- **Litestream**: Only runs when `docker compose --profile backup up` is used — optional backup service.
