# Ebbe Dashboard

An interactive dashboard where kids can complete chores and earn stars as rewards.  
Originally built for personal use, now shared openly for anyone who finds it useful.

---

## ⚠️ Project Status

This project is **not production‑ready** and has only been tested locally.


- Do **not** expose it to the public internet.
- Caddy and its HTTPS/Let’s Encrypt setup are included but **not tested**.
- SQLite + Drizzle work locally, but the database layer is still evolving.
- “Run locally without Docker” is **not verified**.
- No security hardening has been done.

Use at your own risk.

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

## 🐳 Running with Docker (recommended)

```bash
docker compose up --build
```
Follow the setup wizard — takes about 60 seconds.

---

## 🧪 Running without Docker

Not tested yet and may require manual configuration.

---

## 🤝 Contributing

Although this started as a personal project for my own family, I’d love for others — especially parents with similar needs or interests — to help shape it.

I welcome:
Pull Requests
Ideas and feature suggestions
Discussions about how to improve or expand the project
If you want to collaborate or build something useful together, you’re more than welcome.

---

## Translations

Ebbe ships with Swedish and English as primary languages. Community-generated translations for
French, German, Spanish and Dutch are also included. These were AI-generated and may contain
errors — native speakers are very welcome to submit corrections via pull request. Adding a new
language is as simple as copying `en.json`, translating the values, and opening a PR.

---

## License

MIT © 2026 Ebbe Dashboard Project

Free to use, modify and distribute. See [LICENSE](LICENSE) for full terms.

---