# Ebbe

A self-hosted family dashboard that helps children build daily routines through visual schedules, task checklists, and a reward system.

Built for families with children who thrive on structure and predictability — but general enough for any family.

Interested in contributing? See [CONTRIBUTING.md](CONTRIBUTING.md).

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
| Multi-language | Swedish, English, French, German, Spanish and Dutch included |

---

## Quick start

1. Clone the repo and start Ebbe:

   ```bash
   git clone https://github.com/[user]/ebbe.git
   cd ebbe
   docker compose up -d
   ```

2. Open `http://localhost` in your browser (or the IP address of your server
   if running on a Raspberry Pi or home server).

3. Follow the setup wizard — takes about 60 seconds.

That's it. No configuration files needed for a basic home install.

**Optional:** Copy `.env.example` to `.env` to configure a custom domain,
HTTPS, backups or AI features. See the Configuration section below for details.

---

### Setting up the child's screen

After the setup wizard, you'll see the child screen URL displayed — it looks like:
```
http://192.168.1.100/child?token=abc123...
```

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

MIT © 2026 Ebbe Dashboard Project

Free to use, modify and distribute. See [LICENSE](LICENSE) for full terms.

---

## Contributing

Pull requests welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for full guidelines.

### Translations

Ebbe ships with Swedish and English as primary languages. Community-generated translations for
French, German, Spanish and Dutch are also included. These were AI-generated and may contain
errors — native speakers are very welcome to submit corrections via pull request. Adding a new
language is as simple as copying `en.json`, translating the values, and opening a PR.
