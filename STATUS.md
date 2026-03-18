# Ebbe — Build Status

Last updated: 2026-03-17 (session 22)

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
| `routes/setup.ts` | ✅ Done | `GET /status` (configured?), `POST /` first-run setup (accepts adminName + language) |
| `routes/users.ts` | ✅ Done | `GET /` (admin), `GET /me`, `POST /invite` (admin), `POST /join` (public), `PATCH /me/password`, `PATCH /me/profile`, `PATCH /:id` (admin), `DELETE /:id` (admin), `POST /:id/reset-password` (admin) |
| `routes/family.ts` | ✅ Done | `GET /`, `PATCH /` (admin) — get/update family name |
| `routes/children.ts` | ✅ Done | `GET /`, `POST /`, `PATCH /:id`, `DELETE /:id` — per-child profiles with unique childTokens + shortPins |
| `routes/shortlink.ts` | ✅ Done | `GET /c/:pin` — short URL redirect to child screen |

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
| `config.ts` | ✅ Done | Env var loading; JWT secrets removed (now in `lib/secrets.ts`) |
| `lib/secrets.ts` | ✅ Done | JWT secret auto-generation: env vars → DB → generate |
| `index.ts` | ✅ Done | All routes mounted; `loadSecrets()` called first; `GET /api/v1/system/info` for LAN addresses; first-run banner |
| `websocket/index.ts` | ✅ Done | WS server + broadcastToFamily helper |
| `modules/weather-openmeteo/` | ✅ Done | Open-Meteo, 10min cache |

## Frontend

| Area | Status | Notes |
|---|---|---|
| Vite + React + Tailwind setup | ✅ Done | |
| i18n setup (en + sv + fr + de + es + nl) | ✅ Done | All strings i18n; 4 community language files added |
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
| `views/SetupWizard.tsx` | ✅ Done | 5+1 step wizard: welcome, family name, admin account, language (6 langs), children, success+QR+URLs; fully i18n; EbbeLogo on welcome (size=80) + done (size=48) |
| `views/parent/Login.tsx` | ✅ Done | EbbeLogo (size=64) + Baloo 2 brand heading |
| `views/parent/ParentApp.tsx` | ✅ Done | Sidebar nav + Layout entry; EbbeLogo + font-brand in sidebar header + mobile top bar |
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
| `Caddyfile` | ✅ Done | CSP updated: fonts.googleapis.com (style-src) + fonts.gstatic.com (font-src) |
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

## Session 23b (2026-03-18) — EbbeLogo v4 exact half-circle geometry

viewBox 110×90; horizon line + arc at y=55, endpoints x=11/x=99; semicircle radius 44 (exact half-circle); star top point at y=11 aligned to arc top; checkmark M44,53 L54,67 L70,44. TypeScript clean. Docker rebuilt.

## Session 23 (2026-03-18) — EbbeLogo v3 final geometry

Replaced SVG with exact user-specified coordinates (100×100 viewBox): star path M50,10…Z dominant element; white checkmark M37,46 L48,58 L64,36; arc A28,22 between star and horizon line at y=80. Removed `className` prop from interface; SetupWizard callers wrapped in flex div for centering. TypeScript clean. Docker rebuilt.

## Session 22b (2026-03-17) — EbbeLogo v2 redesign

Redesigned SVG geometry: viewBox 100×100; star is now the dominant element (large 5-pointed path, center ~50,47); arc uses A32,32 radius so it rises clearly above center (not flat/dish-like); horizon line at y=72; checkmark path updated to match new star. favicon.svg updated to match. Docker rebuilt.

## Session 22 (2026-03-17) — Ebbe logo + Baloo 2 brand font

- `frontend/src/components/EbbeLogo.tsx` (NEW): inline SVG React component — amber star (#F5A623) with white checkmark + sunrise arc + horizon line. Accepts `size` and `className` props. Works on any background, light or dark.
- `frontend/public/favicon.svg` (NEW): standalone SVG logo file for browser tab + PWA icons.
- `frontend/index.html`: added Baloo 2 Google Fonts preconnect + stylesheet; updated favicon to `/favicon.svg`; `theme-color` → `#F5A623`.
- `frontend/tailwind.config.js`: added `font-brand: ["Baloo 2", cursive]` utility; updated `ebbe.amber` → `#F5A623`.
- `frontend/public/manifest.json`: `background_color` + `theme_color` → `#F5A623`; icon → `/favicon.svg`.
- `frontend/src/views/parent/ParentApp.tsx`: sidebar header + mobile top bar now use `<EbbeLogo>` + `font-brand` text.
- `frontend/src/views/parent/Login.tsx`: centered `<EbbeLogo size={64}>` above form; "Ebbe" heading in `font-brand`.
- `frontend/src/views/SetupWizard.tsx`: EbbeLogo size=80 on welcome step; size=48 on done step.
- `Caddyfile`: CSP extended — `style-src` allows `fonts.googleapis.com`; added `font-src 'self' fonts.gstatic.com`.
- `README.md`: Ebbe logo image added above title.
- TypeScript clean on both frontend and backend. Docker reloaded.

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

## Session 21 additions (2026-03-17)

**i18n audit + community language files (fr/de/es/nl):**

**Fix 1 — i18n audit:**
- `SetupWizard.tsx`: fully i18n-ized — all hardcoded English strings replaced with `t()` calls. Added `useTranslation`. Language selection in step 4 now immediately calls `i18n.changeLanguage()` so the rest of the wizard adapts in real time.
- `Children.tsx`: "Show QR" / "Hide QR" toggle and scan note now use `t('parent.children.showQr')`, `t('parent.children.hideQr')`, `t('parent.children.qrHint')`; Cancel button in ChildForm now uses `t('parent.children.cancel')`.
- `Settings.tsx`: weather section (title, hint, saved message, placeholder, search button, not-found error, save error) and colour section (title, hint, saved message) all converted to `t()`. `featuresSaved` message also converted.
- New i18n keys in `en.json` + `sv.json`: `setup.*` (all wizard strings), `parent.children.{cancel,showQr,hideQr,qrHint}`, `parent.settings.{weatherTitle,weatherHint,weatherSaved,weatherPlaceholder,weatherSearch,weatherNotFound,weatherSaveError,colourTitle,colourHint,colourSaved,saved}`.

**Fix 2 — Community language files:**
- `frontend/src/locales/fr.json` — French 🇫🇷 (complete translation)
- `frontend/src/locales/de.json` — German 🇩🇪 (complete translation)
- `frontend/src/locales/es.json` — Spanish 🇪🇸 (complete translation)
- `frontend/src/locales/nl.json` — Dutch 🇳🇱 (complete translation)
- `frontend/src/i18n.ts`: imports all 6 locale files; validates stored lang against supported list before using it.
- `SetupWizard.tsx` language step: expanded from 2 to 6 language options (en, sv, fr, de, es, nl). `LANGS` array with flag, code, and native label.
- `Settings.tsx` language selector: expanded from 2-button row to 6-button flex-wrap row using the same language list.
- `backend/src/routes/setup.ts`: `lang` validation now accepts all 6 language codes (previously only `'sv'` was accepted; everything else fell back to `'en'`).

**Fix 3 — Short/full URL explanation text:**
- `SetupWizard.tsx` done screen: replaced "The short URL is convenient on your local network. The full URL works everywhere." with `t('setup.done.urlExplanation')` = "The short URL is easier to type on your local network. The full URL contains the complete security token."

**Fix 4 — README translations note:**
- `README.md`: updated "Multi-language" feature row to list all 6 languages; expanded Contributing section with a `### Translations` subsection explaining the AI-generated community translations and how to add a new language.

## Session 20 additions (2026-03-17)

**Wizard child setup + QR codes + short URLs:**

**Fix 1 — Language applied immediately after wizard:**
- `frontend/src/views/SetupWizard.tsx`: `handleFinish()` now calls `localStorage.setItem('ebbe_lang', ...)` and `i18n.changeLanguage()` immediately on successful setup, before the success screen is shown. Language is therefore correct on the full-page reload when navigating to `/parent`.

**Fix 2 — Children step added to wizard:**
- New Step 5 "Add your children" with inline add-child form (name, EmojiPicker, 8 colour swatches). Children accumulate in a local list with remove buttons. "Next →" disabled until at least one child added. Step 6 is the Done screen.
- `backend/src/routes/setup.ts`: accepts `children` array in POST body; creates all children with individual tokens and shortPins; returns `children` array in response. Falls back to single default "Child" if array not provided.

**Fix 3 — Done screen per-child sections with QR codes:**
- `frontend/src/views/SetupWizard.tsx` success screen: each child gets its own card with name/emoji header, QR code (180px, clickable link), short URL field, full URL field. URLs are both copyable and open in new tab. Reassuring note about finding URLs later in Children panel.
- `frontend/src/views/parent/Children.tsx`: added "Show QR" / "Hide QR" toggle button per child row. Expands inline `QrCodeImg` (180px) below the URL bar. Also shows short URL (`/c/:pin`) as a secondary row.
- `frontend/package.json`: added `qrcode` + `@types/qrcode` dependencies.

**Fix 4 — Short URL alias per child:**
- `backend/src/db/schema.ts`: added `shortPin TEXT UNIQUE` to children table.
- `backend/src/db/migrations/0007_children_short_pin.sql`: `ALTER TABLE children ADD COLUMN short_pin TEXT`.
- `backend/src/db/index.ts`: exported `generateShortPin(db)` helper (4-digit 1000–9999, unique, falls back to 6 digits); Fixup 3 generates PINs for any existing children without one.
- `backend/src/routes/children.ts`: generates `shortPin` on every new child created.
- `backend/src/routes/shortlink.ts` (NEW): `GET /c/:pin` — validates PIN format, looks up child, redirects 302 to `/child?token=<childToken>`.
- `backend/src/index.ts`: mounts shortlink router at `/c`.
- `Caddyfile`: added `@shortlink path /c/*` block routing to backend before the frontend catch-all.

## Session 19 additions (2026-03-17)

**First-run setup wizard — zero .env required:**

- `backend/src/lib/secrets.ts` (NEW) — JWT secret auto-generation. On startup: if `JWT_SECRET` / `JWT_REFRESH_SECRET` env vars are set, use them. Otherwise load from `secrets` table in SQLite (or generate and store fresh `crypto.randomBytes(32).toString('hex')` values on very first run).
- `backend/src/config.ts` — removed `require_env('JWT_SECRET')` / `require_env('JWT_REFRESH_SECRET')`; secrets are now managed by `lib/secrets.ts`
- `backend/src/lib/jwt.ts` — replaced `config.jwtSecret/jwtRefreshSecret` with `getJwtSecret()` / `getJwtRefreshSecret()` from `lib/secrets`
- `backend/src/index.ts` — calls `loadSecrets(config.databasePath)` before anything else; added `GET /api/v1/system/info` (returns LAN IPv4 addresses filtered to 192.168/10.x, excluding 127.x loopback and 172.x Docker); prints first-run banner if no family exists yet
- `backend/src/routes/setup.ts` — added `GET /api/v1/setup/status` → `{ data: { configured: boolean } }`; POST now accepts `adminName` (used as user display name) and `language` ('en'|'sv', seeds `family.language` setting)
- `frontend/src/App.tsx` — on load calls `GET /api/v1/setup/status`; if not configured, renders SetupWizard at `/setup` and redirects all other paths there; if configured, redirects `/setup` → `/parent`
- `frontend/src/views/SetupWizard.tsx` (NEW) — 4+1 step wizard using `tw.*` tokens:
  - Step 1: Welcome screen
  - Step 2: Family name input
  - Step 3: Admin account (name, email, password, confirm) with validation
  - Step 4: Language selection (EN/SV as clickable cards) + calls POST /api/v1/setup on finish
  - Step 5 (success): Shows child screen + parent panel URLs for each LAN address with copy buttons; auto-login button calls POST /api/v1/auth/login and redirects to /parent
- `README.md` — replaced old 6-step Quick Start (with manual curl setup call) with a 3-step wizard-based Quick Start

Result: a fresh `docker compose up -d` → open `http://localhost` → follow wizard (60s) is all that's needed. No `.env` file, no curl commands, no token copying.

## Session 18 additions (2026-03-17)

**Default language fix — English on new install:**

Root cause: `i18n.ts` defaulted to `'sv'` when no localStorage key existed; `setup.ts` never wrote any language setting to the DB; child screen never loaded language from DB at all; Settings.tsx used wrong key `language` instead of `family.language`.

Changes:
- `frontend/src/i18n.ts`: default fallback changed from `'sv'` to `'en'`
- `backend/src/routes/setup.ts`: seeds `{ key: 'family.language', value: '"en"' }` in settings table on first run
- `backend/src/routes/settings.ts`: broadcasts `LANGUAGE_UPDATED` WS event to child connections when `family.language` key changes
- `backend/src/routes/child.ts`: `/settings` endpoint now includes `language` field (reads `family.language`, fallback `'en'`)
- `frontend/src/api/child.ts`: added `language: string` to `ChildSettings` interface
- `frontend/src/api/websocket.ts`: added `LANGUAGE_UPDATED` to `WsMessage` union type
- `frontend/src/views/child/ChildApp.tsx`: applies `i18n.changeLanguage()` on settings load; handles `LANGUAGE_UPDATED` WS event for immediate cross-screen update
- `frontend/src/views/parent/Settings.tsx`: corrected key to `family.language`; reads persisted language from DB on mount so the UI button reflects the stored value

Result: new installs default to English; parent can switch language in Settings; child screen updates immediately via WebSocket (no reload required).

## Session 17 additions (2026-03-17)

- `CONTRIBUTING.md` created — public-facing contributor guide (bug reports, feature suggestions, translations, code, roadmap, dev setup, code style)
- `README.md` — added contributing link near the top
- `.gitignore` — added `CLAUDE.md` and `STATUS.md` (internal AI context, not for public repo)

## Session 16 additions (2026-03-17)

- Switched license to MIT; created `LICENSE` file with standard MIT text
- Updated `README.md` license section
- Updated `CLAUDE.md` license line
- Set `"license": "MIT"` in `backend/package.json` and `frontend/package.json`
- Added copyright footer to parent sidebar: `© 2026 Ebbe Dashboard Project · v0.1.0` (version read from `package.json` via import)

## Session 15 additions (2026-03-17)

- `healthcheck.sh` — bash health check script (Docker, API, frontend, DB latency, WebSocket)
- `healthcheck.ps1` — PowerShell equivalent for Windows
- Both scripts auto-attempt `docker compose up -d` if containers are not running
- `CLAUDE.md` fully reconciled with current architecture (all tables, auth model, project structure, session history)

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
