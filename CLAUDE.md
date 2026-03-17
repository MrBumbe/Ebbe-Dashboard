# Ebbe — Project Context for Claude Code

## What is Ebbe?

Ebbe is an open-source, self-hosted family dashboard designed to help children build daily routines through visual schedules, task checklists, and a reward system. It is built for families with children who benefit from structure and predictability — but it is general enough for any family.

The project is modular by design (inspired by Home Assistant), privacy-first, and built to be deployable with a single `docker-compose up` command.

**GitHub target:** `github.com/[user]/ebbe`
**License:** MIT © 2026 Ebbe Dashboard Project
**Future consideration:** SaaS hosting option (architecture supports it from day one)

---

## Maintenance Rules

These rules apply to **all future work** in this codebase. They override any default behaviour.

1. **Keep CLAUDE.md updated after every session** — mark completed items, add new tables/endpoints/components as they are created. If STATUS.md is also open, keep them in sync.
2. **Flag contradictions before proceeding** — if a new task or requirement contradicts something in CLAUDE.md, say so explicitly before starting work.
3. **Never omit `family_id`** from any new table — non-negotiable for future multi-tenant/SaaS support.
4. **Never omit `child_id`** from any table that stores child-level data (completions, transactions, layouts, mood, requests, etc.).
5. **Always add new i18n strings to both `sv.json` and `en.json`** — never add a key to one without the other.
6. **Always commit to git** after each logical group of changes.
7. **Keep STATUS.md updated** in parallel with CLAUDE.md — session notes go there; architecture goes here.

---

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│  Clients                                    │
│  /child  (kiosk device, read-only)          │
│  /parent (admin panel, JWT-protected)       │
└────────────────┬────────────────────────────┘
                 │ HTTPS
┌────────────────▼────────────────────────────┐
│  Caddy (reverse proxy)                      │
│  Auto HTTPS · Rate limiting · JWT check     │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│  Backend — Node.js + TypeScript + Express   │
│  REST API · WebSocket (ws)                  │
│  Module system · i18n · Auth middleware     │
└──────┬──────────────────────┬───────────────┘
       │                      │
┌──────▼──────┐     ┌─────────▼──────┐
│  SQLite DB  │     │  Static files  │
│  Drizzle    │     │  Locales/icons │
│  ORM        │     │  Media         │
└──────┬──────┘     └────────────────┘
       │
┌──────▼──────┐
│  Litestream │
│  DB backup  │
└─────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| i18n | i18next + react-i18next |
| Backend | Node.js + TypeScript + Express |
| Real-time | WebSocket (ws package) |
| Database | SQLite via better-sqlite3 |
| ORM | Drizzle ORM |
| Backup | Litestream |
| Proxy | Caddy |
| Containers | Docker + Docker Compose |
| Auth | JWT (jsonwebtoken) |
| Security | helmet, express-rate-limit, cors |

---

## Project Structure

```
ebbe/
├── CLAUDE.md                  ← you are here
├── STATUS.md                  ← build status, session notes
├── docker-compose.yml
├── Caddyfile
├── .env.example
├── .gitignore
├── README.md
├── LICENSE
│
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts           ← entry point, starts Express + WS
│   │   ├── config.ts          ← loads and validates env vars
│   │   ├── db/
│   │   │   ├── index.ts       ← DB connection singleton + startup fixups
│   │   │   ├── schema.ts      ← Drizzle schema (all tables)
│   │   │   └── migrations/    ← SQL migration files
│   │   ├── routes/
│   │   │   ├── auth.ts        ← POST /api/v1/auth/login, /refresh
│   │   │   ├── tasks.ts       ← CRUD for routine tasks + completion
│   │   │   ├── schedule.ts    ← weekly schedule items
│   │   │   ├── events.ts      ← upcoming events with countdown
│   │   │   ├── rewards.ts     ← star economy, redemptions, requests
│   │   │   ├── mood.ts        ← mood check-in log (parent view)
│   │   │   ├── settings.ts    ← family settings key/value store
│   │   │   ├── layouts.ts     ← child screen widget layout
│   │   │   ├── users.ts       ← user management, invites, join
│   │   │   ├── family.ts      ← family name get/update
│   │   │   ├── children.ts    ← per-child profiles + tokens
│   │   │   ├── child.ts       ← child-facing read endpoints (token auth)
│   │   │   ├── setup.ts       ← first-run setup
│   │   │   └── modules.ts     ← installed module registry
│   │   ├── middleware/
│   │   │   ├── auth.ts        ← JWT validation: requireAuth, requireRole
│   │   │   ├── childAuth.ts   ← child token validation: requireChildToken
│   │   │   └── errors.ts      ← global error handler
│   │   ├── websocket/
│   │   │   └── index.ts       ← WS server, broadcast helpers
│   │   ├── modules/
│   │   │   ├── core/          ← module loader + registry
│   │   │   └── weather-openmeteo/   ← built-in weather module (10min cache)
│   │   └── lib/
│   │       ├── jwt.ts         ← sign/verify access + refresh tokens
│   │       ├── crypto.ts      ← token generation utils
│   │       └── scheduleDate.ts ← schedule date helpers (getEffectiveDayOfWeek, resolveItemsForWeek)
│
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js     ← darkMode: 'class'
│   ├── index.html
│   ├── public/
│   │   ├── manifest.json      ← PWA manifest
│   │   └── icons/             ← app icons
│   └── src/
│       ├── main.tsx
│       ├── App.tsx            ← routing: /child vs /parent vs /parent/join
│       ├── i18n.ts            ← i18next setup
│       ├── api/
│       │   ├── client.ts      ← axios instance with auth headers + JWT refresh
│       │   ├── child.ts       ← child-side fetch helpers (childToken)
│       │   └── websocket.ts   ← WS client singleton
│       ├── views/
│       │   ├── child/
│       │   │   ├── ChildApp.tsx       ← root child view; widget renderer; swipe pages
│       │   │   ├── ChildHeader.tsx    ← unified 3-col header: weather/date + clock + stars
│       │   │   ├── AnalogClock.tsx    ← standalone SVG analog clock (size via prop)
│       │   │   ├── Clock.tsx          ← kept for reference; superseded by ChildHeader
│       │   │   ├── TaskList.tsx       ← morning/evening/custom; compact mode
│       │   │   ├── WeekSchedule.tsx   ← visual weekly view; starts from today
│       │   │   ├── MoodCheckIn.tsx    ← emoji mood selector; single row; cooldown
│       │   │   ├── RewardDisplay.tsx  ← star count; tappable; compact mode
│       │   │   ├── StarStore.tsx      ← full-screen overlay; 45s inactivity close
│       │   │   ├── StarHistory.tsx    ← full-screen overlay; 45s inactivity close
│       │   │   ├── UpcomingEvent.tsx  ← countdown to next event in days
│       │   │   └── TimerAlert.tsx     ← parent-triggered countdown; fullscreen/minimized
│       │   └── parent/
│       │       ├── ParentApp.tsx      ← root parent view; sidebar; child selector; dark mode
│       │       ├── Login.tsx
│       │       ├── Join.tsx           ← public invite-token join flow (/parent/join?token=xxx)
│       │       ├── ChangePassword.tsx ← force password change screen
│       │       ├── Dashboard.tsx      ← overview
│       │       ├── Tasks.tsx          ← manage routine tasks
│       │       ├── Schedule.tsx       ← manage weekly schedule
│       │       ├── Events.tsx         ← add upcoming events
│       │       ├── Rewards.tsx        ← define + approve rewards + manual star adjust
│       │       ├── MoodLog.tsx        ← view mood history
│       │       ├── Timer.tsx          ← trigger warning timer (child-targeted)
│       │       ├── Settings.tsx       ← family config, accent colour, modules
│       │       ├── LayoutManager.tsx  ← enable/disable/reorder widgets per child
│       │       ├── Users.tsx          ← admin: list/invite/edit/delete users
│       │       ├── Children.tsx       ← manage children + per-child kiosk URLs
│       │       └── ModuleManager.tsx  ← enable/disable modules (placeholder)
│       ├── components/
│       │   └── EmojiPicker.tsx        ← ~200 emojis, 8 categories, click-outside-to-close
│       ├── hooks/             ← custom React hooks
│       ├── lib/
│       │   └── theme.ts       ← semantic Tailwind class token constants (tw.card, tw.input, etc.)
│       ├── store/
│       │   ├── useAuthStore.ts  ← JWT state + activeChildId + darkMode
│       │   └── useChildStore.ts ← child-side state: balance, transactions, layout
│       └── locales/
│           ├── sv.json        ← Swedish (primary)
│           └── en.json        ← English
│
└── data/                      ← gitignored, runtime data
    ├── ebbe.db                ← SQLite database
    └── backups/               ← Litestream output
```

---

## Database Schema (Drizzle)

Every table has `family_id` — critical for future multi-tenant/SaaS support. Do not omit it.
Any table that stores child-level data must also have `child_id` (nullable for backwards compatibility).

### Core tables

```typescript
// families — one row per household
families: {
  id:         text (uuid, PK)
  name:       text
  childToken: text (unique)   // legacy family-level child token; kept for backwards compat
  createdAt:  integer (unix ms)
}

// users — parents/guardians
users: {
  id:                 text (uuid, PK)
  familyId:           text (FK → families)
  name:               text
  email:              text (unique)
  passwordHash:       text                  // "<salt_hex>:<hash_hex>" scrypt
  role:               text                  // "admin" | "parent" | "readonly"
  phone:              text | null           // optional; future SMS/notifications
  roleTitle:          text | null           // custom display name, e.g. "Parent", "Relative"
  mustChangePassword: boolean (default false) // set true when admin resets password
  createdAt:          integer (unix ms)
}

// invite_tokens — one-time join links generated by admin
invite_tokens: {
  id:        text (uuid, PK)
  familyId:  text (FK → families)
  token:     text (unique)
  role:      text                // "admin" | "parent"
  createdBy: text                // userId of admin who created it
  expiresAt: integer (unix ms)
  usedAt:    integer | null      // unix ms; null = not yet used
  createdAt: integer (unix ms)
}

// children — named child profiles with per-child tokens
children: {
  id:         text (uuid, PK)
  familyId:   text (FK → families)
  name:       text
  emoji:      text (default '🧒')
  color:      text (default '#1565C0')  // accent colour for child's screen
  birthdate:  integer | null            // unix ms; optional
  childToken: text (unique)             // the /child?token=xxx value for this child
  createdAt:  integer (unix ms)
}

// tasks — routine items (brush teeth, get dressed, etc.)
tasks: {
  id:               text (uuid, PK)
  familyId:         text (FK → families)
  title:            text
  emoji:            text (default '⭐')
  routine:          text               // "morning" | "evening" | "custom"
  routineName:      text | null        // display name when routine === "custom"
  order:            integer (default 0)
  starValue:        integer (default 1)
  isActive:         boolean (default true)
  isVisibleToChild: boolean (default true) // false = parent-only completion
  daysOfWeek:       text               // JSON array e.g. "[0,1,2,3,4,5,6]" (0=Mon)
  timeStart:        text | null        // "HH:MM" — show from 2h before this
  timeEnd:          text | null        // "HH:MM" — hide after this
  focusModeEnabled: boolean (default false) // DB field only; no UI yet (v2)
  createdAt:        integer (unix ms)
}

// task_completions — log of when tasks were checked off
task_completions: {
  id:           text (uuid, PK)
  familyId:     text (FK → families)
  childId:      text | null            // null = legacy; set = per-child
  taskId:       text (FK → tasks)
  completedAt:  integer (unix ms)
  starsAwarded: integer
}

// schedule_items — weekly schedule entries
schedule_items: {
  id:           text (uuid, PK)
  familyId:     text (FK → families)
  childId:      text | null            // null = whole family; set = assigned child
  dayOfWeek:    integer                // 0=Mon … 6=Sun; computed from specificDate when not recurring
  timeStart:    text                   // "HH:MM"
  title:        text
  emoji:        text (default '📅')
  color:        text (default '#4A90D9')
  isRecurring:  boolean (default true) // false = one-time event on specificDate
  specificDate: integer | null         // unix ms; one-time date OR annual anchor for recurring
}

// events — upcoming one-off or annual events with countdown
events: {
  id:           text (uuid, PK)
  familyId:     text (FK → families)
  childId:      text | null            // null = whole family; set = assigned child
  title:        text
  emoji:        text (default '🎉')
  eventDate:    integer (unix ms)      // next occurrence date (kept in sync with specificDate)
  isVisible:    boolean (default true) // show on child screen
  specificDate: integer | null         // unix ms; annual anchor (e.g. birthday)
}

// mood_log — one entry per cooldown period per child
mood_log: {
  id:       text (uuid, PK)
  familyId: text (FK → families)
  childId:  text | null               // null = legacy; set = per-child
  mood:     text                      // "happy"|"okay"|"sad"|"angry"|"tired"|"excited"|"anxious"
  loggedAt: integer (unix ms)
  note:     text | null               // optional parent note
}

// rewards — reward catalog defined by parent
rewards: {
  id:       text (uuid, PK)
  familyId: text (FK → families)
  title:    text
  emoji:    text (default '🎁')
  starCost: integer
  isActive: boolean (default true)
}

// reward_transactions — star economy ledger (earn + redeem)
reward_transactions: {
  id:          text (uuid, PK)
  familyId:    text (FK → families)
  childId:     text | null            // null = legacy; set = per-child
  type:        text                   // "earn" | "redeem"
  amount:      integer                // positive always; type indicates direction
  description: text                   // "Brushed teeth" | "Redeemed: Extra TV"
  relatedId:   text | null            // taskId or rewardId
  createdAt:   integer (unix ms)
}

// reward_requests — child redemption requests awaiting parent approval
reward_requests: {
  id:          text (uuid, PK)
  familyId:    text (FK → families)
  childId:     text | null            // which child made the request
  rewardId:    text (FK → rewards)
  status:      text                   // "pending" | "approved" | "denied"
  requestedAt: integer (unix ms)
  resolvedAt:  integer | null         // unix ms
}

// settings — key/value store per family
settings: {
  familyId: text (FK → families)
  key:      text
  value:    text                      // JSON string for complex values
  PRIMARY KEY (familyId, key)
}

// modules — installed module registry
modules: {
  familyId: text (FK → families)
  moduleId: text                      // "weather-openmeteo"
  isEnabled: boolean (default true)
  config:   text (default '{}')       // JSON string
  PRIMARY KEY (familyId, moduleId)
}

// child_layouts — widget layout per family (and optionally per child)
// childId = '' means family-level default; a child UUID overrides for that child
child_layouts: {
  familyId:   text (FK → families)
  childId:    text (default '')       // '' = family default; child UUID = per-child layout
  pageNumber: integer (default 1)
  widgetId:   text
  order:      integer (default 0)
  isEnabled:  boolean (default true)
  config:     text (default '{}')     // JSON string, widget-specific overrides
  PRIMARY KEY (familyId, childId, pageNumber, widgetId)
}
```

Widget IDs: `clock`, `star-balance`, `weather`, `routine-morning`, `routine-evening`, `routine-custom`, `week-schedule`, `upcoming-event`, `mood-checkin`, `timer-display`

### AI memory tables (v3 — tables exist, not yet populated)

```typescript
// ai_core_memory — permanent facts, edited by parent
ai_core_memory: {
  familyId:  text (PK, FK → families)
  content:   text (default '')        // free text, <5KB
  updatedAt: integer (unix ms)
}

// ai_conversation_log — rolling last ~50 turns
ai_conversation_log: {
  id:        text (uuid, PK)
  familyId:  text (FK → families)
  role:      text                     // "user" | "assistant"
  content:   text
  createdAt: integer (unix ms)
}

// ai_daily_summaries — compressed daily summaries, 90 days
ai_daily_summaries: {
  id:        text (uuid, PK)
  familyId:  text (FK → families)
  date:      text                     // "YYYY-MM-DD"
  summary:   text
  createdAt: integer (unix ms)
}

// ai_monthly_summaries — compressed monthly, 24 months
ai_monthly_summaries: {
  id:        text (uuid, PK)
  familyId:  text (FK → families)
  month:     text                     // "YYYY-MM"
  summary:   text
  createdAt: integer (unix ms)
}
```

---

## Module System

Every module is a folder under `backend/src/modules/` that exports an `EbbeModule` object:

```typescript
interface EbbeModule {
  id: string              // "weather-openmeteo" — kebab-case, globally unique
  type: "weather" | "game" | "widget" | "ai" | "integration"
  version: string         // semver "1.0.0"
  name: Record<string, string>   // { en: "Open-Meteo Weather", sv: "Open-Meteo Väder" }

  onInstall?(db: Database): void    // run DB migrations if needed
  onStart?(config: ModuleConfig): void
  onStop?(): void
  routes?: Router                   // mounted at /api/modules/:moduleId/
  widgetComponent?: string          // frontend component name
}
```

Weather modules must additionally implement:

```typescript
interface WeatherModule extends EbbeModule {
  type: "weather"
  fetchWeather(lat: number, lon: number): Promise<WeatherData>
}

interface WeatherData {
  temperature: number     // always Celsius
  feelsLike: number
  condition: WeatherCondition   // "sunny"|"cloudy"|"rain"|"snow"|"storm"|"fog"
  icon: string            // maps to icon file in frontend/public/icons/weather/
  locationName: string
  updatedAt: Date
}
```

---

## Authentication Model

### Child view (`/child`)

Each named child has their own `childToken` stored in `children.childToken`. The kiosk URL is `/child?token=<childToken>`. The legacy `families.childToken` (created at first-run setup) also works — `requireChildToken` middleware checks `children.childToken` first, then falls back to `families.childToken`. When a child-specific token matches, `req.childId` is set to that child's UUID; legacy family tokens leave `req.childId` as null.

No login required — the URL itself is the auth. Store permanently in Fully Kiosk Browser.

### Parent view (`/parent`)

Email + password → JWT access token (15 min) + refresh token (30 days). Role-based: `admin` > `parent` > `readonly`.

**JWT payload:** `{ userId, familyId, role, name, mustChangePassword }`

- `name` and `mustChangePassword` are included so the frontend does not need an extra API call on login.
- When `mustChangePassword` is true, `ParentApp` redirects to `ChangePassword.tsx` before allowing navigation.

### Role system

| Role | Can do |
|---|---|
| `admin` | Everything: manage users, reset passwords, invite, manage children, family name |
| `parent` | Tasks, rewards, schedule, events, layout, settings, mood log |
| `readonly` | DB enum exists; not exposed in UI |

### Invite flow

Admin generates a one-time link (stored in `invite_tokens`). Recipient visits `/parent/join?token=xxx`, enters name + password, account is created with the pre-assigned role. Token is marked used.

---

## WebSocket Events

The WS server at `ws://host/ws` handles real-time updates. All messages are JSON.

Child connections authenticate via `?token=<childToken>` query param.
Parent connections authenticate via `?auth=<accessToken>` query param.

```typescript
// Server → Child client
{ type: "TIMER_START",    payload: { seconds: number, label: string } }
{ type: "TIMER_CANCEL" }
{ type: "TASK_UPDATED",   payload: { taskId: string, isComplete: boolean } }
{ type: "STARS_UPDATED",  payload: { balance: number } }
{ type: "LAYOUT_UPDATED" }  // child re-fetches layout on receipt

// Client → Server (parent only, validated server-side)
{ type: "TRIGGER_TIMER", payload: { seconds: number, label: string, childId?: string | null } }
  // childId = null | undefined = broadcast to all children in family
  // childId = "<uuid>" = targeted delivery to that child's WS connection only
{ type: "CANCEL_TIMER",  payload: { childId?: string | null } }
```

`broadcastToFamily(familyId, target, message, childId?)` — optional 4th arg filters delivery to a specific child's connection. All existing callers (TASK_UPDATED, STARS_UPDATED, LAYOUT_UPDATED) omit the 4th arg and broadcast to all children.

---

## API Conventions

- Base path: `/api/v1/`
- Auth header: `Authorization: Bearer <token>`
- Child token: `?token=<childToken>` on public child endpoints
- All responses: `{ data: T }` on success, `{ error: { code, message } }` on failure
- Dates: always Unix milliseconds (integer) in DB and API
- Language: all API field names and error codes in English

---

## i18n

- Backend: English only (code, comments, API responses, error codes)
- Frontend: i18next, JSON files in `frontend/src/locales/`
- Language setting stored in `settings` table per family
- Adding a new language = add one JSON file + open a PR
- **Always add new keys to both `sv.json` and `en.json` simultaneously.**

```json
// locales/en.json structure (abbreviated)
{
  "child": {
    "goodMorning": "Good morning!",
    "tasks": { "morning": "Morning routine", "evening": "Evening routine" },
    "mood": { "prompt": "How are you feeling?", "happy": "Happy" },
    "schedule": { "days": { "0": "Monday", "1": "Tuesday", ... } }
  },
  "parent": {
    "nav": { "tasks": "Tasks", "schedule": "Schedule", "children": "Children", "users": "Users" },
    "users": { ... },
    "children": { ... },
    "join": { ... },
    "changePassword": { ... },
    "profile": { ... }
  }
}
```

---

## Mood System

Seven mood types, configurable per family (parent chooses which are active):

| ID | Default emoji | English label |
|---|---|---|
| happy | 😄 | Happy |
| okay | 🙂 | Okay |
| sad | 😔 | Sad |
| angry | 😡 | Angry |
| tired | 😴 | Tired |
| excited | 🤩 | Excited |
| anxious | 😰 | Anxious |

Active moods and their order stored in `settings` as JSON: `{ key: "mood.active", value: "[\"happy\",\"okay\",\"sad\",\"angry\",\"tired\"]" }`

Cooldown: once per hour **per child** (scoped by `childId`). Each child's cooldown is independent.

---

## Environment Variables

See `.env.example` for all variables. Key ones:

```
PORT=3000
NODE_ENV=production
DATABASE_PATH=/data/ebbe.db
JWT_SECRET=<generate with: openssl rand -hex 32>
JWT_REFRESH_SECRET=<generate with: openssl rand -hex 32>
CORS_ORIGIN=https://yourdomain.com

# Optional — only needed if AI module enabled
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Optional — Litestream backup
LITESTREAM_REPLICA_URL=s3://your-bucket/ebbe
```

---

## Responsive Design

### Breakpoint strategy

Use Tailwind's standard breakpoints consistently across all components:

| Tailwind prefix | Min width | Target device |
|---|---|---|
| *(none)* | 0px | Phone (360–430px) — base styles |
| `sm:` | 640px | Large phone / small tablet |
| `md:` | 768px | Tablet (768–1024px) |
| `lg:` | 1024px | Large tablet / small desktop |
| `xl:` | 1280px | 1080p touch screen / desktop |

Always write mobile-first: base styles target phones, then layer in `md:` and `xl:` overrides.

---

### Child view — three mandatory screen sizes

The child view is the most important surface to get right. It is used by a young child, often alone, on whatever device the family has mounted or placed. Every layout decision must be made with the primary user in mind.

#### Phone (base styles, 360–430px wide)

- Single column, full width, no sidebars
- Text: minimum `text-2xl` for labels, `text-4xl` or larger for the clock
- All interactive elements (task checkboxes, mood buttons, reward tap areas) must be **at least 60×60px** — this is a hard requirement, non-negotiable
- Generous vertical padding between sections (`py-6` or more)
- Scroll vertically through sections; nothing should require horizontal scroll
- Simplified layout: show one section at a time where possible (e.g. tabs or stacked cards)

#### Tablet (`md:`, 768–1024px)

- Two-panel layout where it makes sense: e.g. clock + weather on the left, task list on the right
- Text can be slightly larger than phone since viewing distance increases
- Touch targets remain ≥ 60×60px — the child may still be tapping directly
- Grid layouts: `md:grid-cols-2` is the primary pattern
- More content visible at once without scrolling

#### Large touch screen (`xl:`, 1080p+, e.g. 22" wall-mounted monitor)

- Full dashboard layout — all major panels visible simultaneously without scrolling
- Much larger text: clock at `text-8xl` or larger, task titles at `text-3xl` minimum
- Touch targets scale up further — aim for 80×80px or larger since the child may be standing at arm's length and tapping from a distance
- Generous spacing throughout (`gap-8`, `p-8` or more) — nothing should feel cramped
- `xl:grid-cols-3` or `xl:grid-cols-4` layouts as appropriate
- Consider that the child may be standing 50–100cm from the screen

#### Touch target rule — enforced everywhere

```tsx
// CORRECT — always provide a minimum tap area
<button className="min-h-[60px] min-w-[60px] xl:min-h-[80px] xl:min-w-[80px] ...">

// WRONG — never use small touch targets in the child view
<button className="p-1 text-sm ...">
```

This rule applies to: task checkboxes, mood emoji buttons, reward tap areas, navigation elements, and any other interactive element in the child view. No exceptions.

---

### Parent view — responsive but not touch-first

The parent view is managed by an adult, typically from their own device. Design priorities differ from the child view.

#### Tablet (`md:`, 768–1024px)

- Still touch-friendly: buttons and form controls should have comfortable tap areas (`min-h-[44px]`)
- Single or two-column layout depending on content
- Navigation as a collapsible sidebar or top nav
- Forms should be easy to fill out with thumbs

#### Desktop / large screen (`lg:` and above)

- Traditional web admin interface feel: mouse-friendly, hover states on interactive elements (`hover:bg-gray-100`, etc.)
- Denser information layout is fine — tables, compact lists, multi-column forms
- Standard-sized form controls (default browser sizing is acceptable)
- Sidebar navigation always visible
- No need to optimise for touch — assume mouse and keyboard
- Hover tooltips, icon-only buttons with tooltips, and other desktop-only affordances are welcome

#### Parent view does NOT need to support phone as a primary use case

While it should not be completely broken on mobile, a parent managing tasks or rewards from a phone is not the primary scenario. If a layout is complex (e.g. a schedule grid), it is acceptable to show a simplified mobile version with a note to use a tablet or desktop for full functionality.

#### Theme system

`frontend/src/lib/theme.ts` exports semantic Tailwind class token constants (`tw.card`, `tw.input`, `tw.btnPrimary`, etc.) with full class name strings so Tailwind scans them correctly. **All parent view components must use these tokens** — never hardcode colour classes in parent views. Dark mode is handled by the `dark:` variant via Tailwind's `class` strategy; the `dark` class is added to `<html>` when enabled.

---

### Component authoring checklist

Before marking any child view component as done, verify:

- [ ] Renders correctly at 375px wide (phone)
- [ ] Renders correctly at 768px wide (tablet) with appropriate two-panel layout
- [ ] Renders correctly at 1280px wide (large screen) with full dashboard layout
- [ ] All interactive elements are ≥ 60×60px on every breakpoint
- [ ] Text is large enough to read at expected viewing distance for each breakpoint
- [ ] No horizontal scroll at any breakpoint
- [ ] Breakpoint classes use `md:` and `xl:` (not `sm:` or `lg:`) as the primary layout switches

---

## Development Notes

- **Always add `family_id`** to any new table — non-negotiable for future multi-tenant support
- **Always add `child_id`** (nullable) to any table storing child-level data
- **Never store secrets in DB** — API keys go in `.env` only
- **Dates as Unix ms integers** in SQLite — never ISO strings in the DB
- **Module routes** are mounted automatically by the module loader — don't register them manually in `index.ts`
- **WebSocket auth**: child connections authenticated by `?token=` query param (resolved at connection time, not message time); parent connections authenticated by `?auth=<JWT>` query param
- **PWA**: `manifest.json` is already included — keep it updated when adding features
- **Drizzle query style**: always use `db.select().from(t).where(...).get()` / `.all()` — NOT `db.query.*.findFirst()` (TypeScript typing issues with Drizzle 0.30.x)
- **Password hash format**: `<salt_hex>:<hash_hex>` (scrypt, N=16384, r=8, p=1, keylen=64)
- **Star economy**: task completion writes to both `task_completions` AND `reward_transactions` (type=`earn`)
- **Child kiosk URL**: `/child?token=xxx` — store permanently in Fully Kiosk Browser
- **Dark mode**: Tailwind `class` strategy; preference stored in `localStorage` (`ebbe_dark`); DB persistence is a v2 item

---

## Current Status

**Phase:** v1 shipped + post-launch fixes complete — all features running in Docker.

### v1 core — complete ✅
- [x] Project skeleton + Docker Compose
- [x] Database schema + Drizzle migrations
- [x] Auth (JWT + child token)
- [x] Task CRUD + completion logging
- [x] Reward system (earn + redeem)
- [x] Mood check-in
- [x] Weekly schedule
- [x] Events with countdown
- [x] WebSocket (timer trigger)
- [x] Child view UI
- [x] Parent admin UI
- [x] Weather module (Open-Meteo)
- [x] i18n (sv + en)
- [x] PWA manifest

### Post-launch fixes — all shipped ✅

- [x] **Fix 1** — Mood cooldown (once/hour per child, scoped by childId)
- [x] **Fix 2** — Weather location picker (double prefix bug + blur-before-click)
- [x] **Fix 3** — EmojiPicker component integrated across Tasks, Schedule, Events, Rewards, Timer
- [x] **Fix 4** — Weekly schedule size in child view (horizontal scroll, today highlight)
- [x] **Fix 5** — Timer improvements (tap-to-minimize, auto-fullscreen at ≤60s, Web Audio chime)
- [x] **Fix 6** — Per-child accent colour (`children.color` returned by `/child/theme`)
- [x] **Fix 7** — Task broadcasting + real-time star sync (TASK_UPDATED + STARS_UPDATED via WS)
- [x] **Fix 8** — WeekSchedule day order (starts from today)
- [x] **Fix 9** — Time-aware routines (daysOfWeek, timeStart/End, isVisibleToChild, parent Complete button)
- [x] **Fix 10** — Modular layout system (child_layouts table, LayoutManager, swipe pages, inactivity reset)
- [x] **Fix 11** — Star store + history (StarStore.tsx, StarHistory.tsx, reward requests, manual adjust)
- [x] **Fix 12** — Mood check-in single row (all 7 moods fit; activeMoods filter)
- [x] **Fix 13** — Clock weekday label in compact mode
- [x] **Session 6** — Transaction icons, settings persistence, live inactivity countdown, analog clock in header, schedule item editing, layout manager backend fallback; redesigned child header (ChildHeader.tsx + AnalogClock.tsx)
- [x] **Session 7** — Schedule edit form above grid; `isRecurring` toggle; `specificDate` on schedule + events; `lib/scheduleDate.ts`; star section styling cleanup
- [x] **Session 8** — Multi-user system (invite_tokens, users.ts, family.ts, children.ts, Join.tsx, ChangePassword.tsx, Users.tsx, Children.tsx); JWT extended with `name` + `mustChangePassword`; per-child tokens; dark mode via Tailwind class strategy
- [x] **Session 9** — Startup fixup: families with no children rows get a default child seeded from `families.childToken`
- [x] **Session 10** — ChildForm moved to module level (focus loss bug); `lib/theme.ts` token system; dark mode applied to all parent views
- [x] **Session 11** — Per-child data isolation (childAuth checks children.childToken first; childId on taskCompletions + rewardTransactions; per-child balance, completions, accent colour)
- [x] **Session 12** — Active-child scoping in parent panel (activeChildId in store; mood, rewards, layouts, events, tasks all scoped to selected child); child_layouts PK includes childId; events child-assignment
- [x] **Session 13** — Mood cooldown scoped by childId (independent per child); schedule items child-scoped (childId filter on child screen)
- [x] **Session 14** — Per-child targeted timer via WebSocket (EbbeClient stores childId; TRIGGER_TIMER/CANCEL_TIMER payload includes childId; broadcastToFamily optional 4th arg for child filtering)
- [x] **Session 21** — Full i18n audit; community language files (fr/de/es/nl); `setup.*` key namespace; SetupWizard language step + Settings language selector expanded to 6 languages; `i18n.changeLanguage()` called immediately on selection
- [x] **Session 22** — Ebbe logo (concept G: amber star + white checkmark + sunrise arc) as `EbbeLogo.tsx` + `favicon.svg`; Baloo 2 brand font via Google Fonts; logo applied to Login, SetupWizard (welcome + done), ParentApp sidebar + mobile header; Caddyfile CSP updated for Google Fonts; README logo added

### Remaining before GitHub release
- [ ] Clear test data from `data/ebbe.db` (not included in git — recreated on first run)
- [ ] Tag `v0.1.0` release

---

## v2 scope (future)
- [ ] Math game module
- [ ] Home Assistant integration
- [ ] Module manager UI (full UI; placeholder exists)
- [ ] Capacitor APK build
- [ ] Vertical scroll page navigation option (DB setting placeholder; horizontal swipe only now)
- [ ] Focus mode UI behavior (`focusModeEnabled` DB field on tasks exists; no UI yet)
- [ ] Dark mode preference persisted to DB (currently localStorage only)
- [ ] Screen Time — Manual (T1): A new reward type `screen_time` with a `minutes` parameter. The child redeems stars for screen time. The parent receives a notification/pending request in the parent panel and approves manually. No external integrations required. Uses the existing `reward_transactions` system.

## v3 scope (future)
- [ ] AI conversation module
- [ ] AI mood pattern analysis
- [ ] AI memory compression system

## v4 scope (future)
- [ ] Screen Time Module — Automated (T2/T3): A modular screen time integration system with three tiers. T2: Home Assistant webhook bridge — Ebbe triggers a HA automation which controls the child's device via the parent's existing router/HA setup. T3: Native router APIs — dedicated modules for Circle, Firewalla, pfSense/OPNsense and similar routers with open local APIs. Both tiers are community-module candidates. Note: Microsoft Family Safety, Apple Screen Time and Google Family Link have no public APIs and cannot be integrated directly.
