# Ebbe

A self-hosted family dashboard that helps children build daily routines through visual schedules, task checklists, and a reward system.

Built for families with children who thrive on structure and predictability — but general enough for any family.

---

## What it does

| Feature | Description |
|---|---|
| Morning & evening routines | Visual checklists the child ticks off themselves |
| Star reward system | Earn stars for tasks, redeem for rewards the parent defines |
| Weekly schedule | Visual overview of the week at a glance |
| Upcoming events | Countdown to birthdays, holidays, or special days |
| Warning timer | Parent triggers a countdown on the child's screen in real time |
| Mood check-in | Child taps an emoji to log how they're feeling |
| Analogue + digital clock | Helps children learn to read the time |
| Weather widget | Current weather via Open-Meteo (no API key needed) |
| Parent admin panel | Manage everything from any phone, tablet, or browser |
| Multi-language | Swedish and English included |

---

## Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

That's the only requirement. Everything else runs inside Docker.

---

### Step 1 — Download the project

If you received the project as a ZIP file, unzip it somewhere on your computer (e.g. `C:\Ebbe`).

If you're cloning from GitHub:
```bash
git clone https://github.com/[user]/ebbe.git
cd ebbe
```

---

### Step 2 — Create your configuration file

In the project folder, find the file called `.env.example`. Make a copy of it and name the copy `.env`.

Open `.env` in any text editor (Notepad is fine) and fill in these values:

```
JWT_SECRET=          ← paste a long random string here (see below)
JWT_REFRESH_SECRET=  ← paste a different long random string here
CADDY_EMAIL=         ← your email address (used for HTTPS certificates)
CADDY_HOST=          ← your domain, or "localhost" for home use
CORS_ORIGIN=         ← same as CADDY_HOST (with https:// if using a domain)
```

**How to generate a random secret string:**

Open PowerShell and run this command — it will print a random string you can paste in:
```powershell
[System.Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

Run it twice to get two different strings — one for `JWT_SECRET` and one for `JWT_REFRESH_SECRET`.

**For home use only (no public domain):**
```
CADDY_HOST=localhost
CORS_ORIGIN=http://localhost
```

**For a public domain (e.g. on a home server or VPS):**
```
CADDY_HOST=ebbe.yourdomain.com
CORS_ORIGIN=https://ebbe.yourdomain.com
CADDY_EMAIL=your@email.com
```

---

### Step 3 — Start Ebbe

Open PowerShell (or Terminal) in the project folder and run:

```powershell
docker compose up -d
```

Docker will download the required images and build the app. This takes a few minutes the first time. You'll see output while it works. When it finishes you'll get your prompt back.

To check that everything is running:
```powershell
docker compose ps
```

All three services (`ebbe-backend`, `ebbe-frontend`, `ebbe-caddy`) should show as `running`.

---

### Step 4 — Create your account

Ebbe doesn't have a sign-up page — you create the first account using a one-time setup call.

Open PowerShell and run this (replace the values in `<angle brackets>`):

```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost/api/v1/setup" `
  -ContentType "application/json" `
  -Body '{"familyName":"<Your Family Name>","adminEmail":"<your@email.com>","adminPassword":"<choose a password>"}'
```

**Example:**
```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost/api/v1/setup" `
  -ContentType "application/json" `
  -Body '{"familyName":"The Svenssons","adminEmail":"parent@example.com","adminPassword":"mysecretpassword"}'
```

The response will look like this:
```json
{
  "data": {
    "message": "Ebbe is ready!",
    "childToken": "a3f8b2c1...",
    "loginUrl": "/parent"
  }
}
```

**Save the `childToken` value** — you'll need it in the next step. This is the secret key for the child's screen. If you lose it, you can find it later in the Parent panel under Settings.

> The setup endpoint automatically disables itself after the first account is created. Calling it again returns an error.

---

### Step 5 — Log in to the parent panel

Open your browser and go to:
- **Home use:** `http://localhost/parent`
- **With a domain:** `https://ebbe.yourdomain.com/parent`

Log in with the email and password you just created. From here you can add tasks, rewards, schedule items, and events.

---

### Step 6 — Set up the child's screen

The child's screen URL is:
```
http://localhost/child?token=<childToken>
```
Replace `<childToken>` with the token you received in Step 4.

**Option A — Kiosk tablet (recommended)**

Install [Fully Kiosk Browser](https://www.fully-kiosk.com/) on an Android tablet. Enter the child URL as the start URL. Fully Kiosk locks the device to just this screen.

**Option B — Install as an app (PWA)**

On any phone or tablet, open the child URL in Chrome, tap the menu (three dots) → "Add to Home Screen". It will install like a regular app and open full screen.

**Option C — Just a browser tab**

Open the URL in any browser on any device. Works fine as a regular webpage.

---

## Stopping and starting

```powershell
# Stop Ebbe (data is preserved)
docker compose down

# Start again
docker compose up -d

# View logs
docker compose logs -f

# View logs for just the backend
docker compose logs -f backend
```

---

## Updating Ebbe

```powershell
# Stop the current version
docker compose down

# Pull the latest code (if using git)
git pull

# Rebuild and start
docker compose up -d --build
```

The database is stored in a Docker volume (`ebbe-data`) and is never deleted when you stop or rebuild.

---

## Backup (optional)

Ebbe supports continuous backup to cloud storage using [Litestream](https://litestream.io/).

Add this to your `.env`:
```
LITESTREAM_REPLICA_URL=s3://your-bucket-name/ebbe
```

Then start with the backup profile:
```powershell
docker compose --profile backup up -d
```

Supports S3, Backblaze B2, Azure Blob Storage, and local paths. See [litestream.io/guides](https://litestream.io/guides/) for setup instructions per provider.

---

## Deploying on a public domain

If you want Ebbe accessible from outside your home (e.g. so you can check the parent panel while away):

1. Point your domain's DNS to your server's IP address
2. Open ports 80 and 443 on your router/firewall
3. Set `CADDY_HOST=ebbe.yourdomain.com` and `CORS_ORIGIN=https://ebbe.yourdomain.com` in `.env`
4. Set `CADDY_EMAIL=your@email.com` (required for automatic HTTPS via Let's Encrypt)
5. Run `docker compose up -d`

HTTPS is handled automatically — Caddy requests a certificate from Let's Encrypt on first start.

---

## Development

### Prerequisites
- Node.js 22+
- npm

### Run locally (without Docker)

```bash
# Terminal 1 — backend
cd backend
npm install
npm run dev

# Terminal 2 — frontend
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:3000

### Database tools

```bash
cd backend
npm run db:generate   # generate a migration after changing schema.ts
npm run db:migrate    # apply pending migrations
npm run db:studio     # open Drizzle Studio (visual database browser)
```

---

## Project structure

```
ebbe/
├── backend/       Node.js + TypeScript + Express API
├── frontend/      React + Vite + Tailwind CSS
├── Caddyfile      Reverse proxy configuration
├── docker-compose.yml
├── litestream.yml Backup configuration
└── .env.example   Configuration template
```

---

## Roadmap

- **v1** — Core routines, rewards, schedule, mood, weather, parent panel ✅
- **v2** — Math game module, Home Assistant integration, Capacitor APK
- **v3** — AI companion, mood pattern analysis

---

## License

Business Source License 1.1 (BUSL-1.1). Free to self-host for personal and family use. Converts to MIT after 2 years.

See [LICENSE](LICENSE) for full terms.

---

## Contributing

Pull requests welcome. To add a language, create a file in `frontend/src/locales/` and open a PR.
