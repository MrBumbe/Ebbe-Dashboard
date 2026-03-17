# Contributing to Ebbe

Thank you for your interest in Ebbe! Ebbe is a self-hosted family dashboard that helps children build daily routines through visual schedules, task checklists, and a reward system. It is built by parents, for families — and contributions of any kind are genuinely welcome, whether you are a developer, a translator, or someone who just found a bug.

---

## Ways to contribute

You do not need to write code to contribute. Here are some ways to help:

- **Report a bug** — something not working as expected
- **Suggest a feature** — an idea that would make Ebbe better for your family
- **Add a translation** — help Ebbe reach families who speak other languages
- **Improve documentation** — fix a typo, clarify a step in the README
- **Submit code** — fix a bug or implement a feature from the roadmap

---

## How to report a bug

Open a new issue on GitHub and include:

1. **Steps to reproduce** — what did you do, in what order?
2. **Expected behaviour** — what did you expect to happen?
3. **Actual behaviour** — what happened instead?
4. **Device and browser** — e.g. "Android tablet, Chrome 123" or "Windows 11, Firefox 125"
5. **Any error messages** — paste them as text, not screenshots

The more detail you provide, the faster we can help.

---

## How to suggest a feature

Open a GitHub Issue with the label **enhancement**.

When describing your idea, focus on the **use case** rather than the specific solution. For example:

> "I'd like the child to be able to see how many stars they need to reach a reward, so they have a sense of progress."

is more useful than:

> "Add a progress bar to the reward list."

Both are welcome — but the use case helps us find the best solution for everyone.

---

## How to add a new language

Adding a language requires no coding. Here is the full process:

1. Go to `frontend/src/locales/` in the repository
2. Copy `en.json` and name the copy after your language code — e.g. `de.json` for German, `fr.json` for French, `nl.json` for Dutch
3. Translate all the **values** in the file (the text on the right side of each colon). **Do not change the keys** (the text on the left side)
4. Open a pull request with your new file

That is it. You do not need to touch any code. If you are unsure about a string or want to discuss the translation, open an issue first and we will help.

---

## How to submit code

1. **Fork** the repository on GitHub
2. **Create a branch** with a descriptive name — e.g. `fix/timer-cancel-bug` or `feat/german-translation`
3. **Make your changes** — see the development setup below
4. **Open a pull request** with a clear description of what you changed and why

A few guidelines that keep things smooth for everyone:

- **One thing per PR.** A focused pull request is much easier to review than a large one touching many areas at once.
- **Describe what and why.** The PR description does not need to be long, but it should explain the problem being solved or the improvement being made.
- **Follow existing patterns.** TypeScript throughout, Tailwind for styling, i18n strings in both `sv.json` and `en.json`. See [Code style](#code-style) below.
- **Test what you changed.** Run the Docker stack locally and verify your change works as expected before opening a PR.

---

## Roadmap

Here is where Ebbe is heading. If you want to contribute to a specific area, these are the priorities:

### v1 — Complete ✅

Core family dashboard: morning and evening routines, star reward system, mood check-in, weekly schedule, upcoming events with countdown, Open-Meteo weather widget, parent admin panel, multi-child support with per-child tokens and layouts, dark mode, PWA support.

### v2 — Planned 🔜

- Math game module
- Home Assistant integration
- Capacitor mobile app (Android / iOS APK)
- Full module manager UI in the parent panel
- Focus mode for active routines (DB field already exists)
- Vertical scroll page navigation option
- Screen time manual redemption (T1): child redeems stars for screen time; parent approves in the panel

### v3 — Future 🔮

- AI companion for children
- Mood pattern analysis using AI
- AI memory compression system
- Ollama support for local / self-hosted AI

### v4 — Exploratory 💡

Automated screen time control via router APIs — dedicated modules for Circle, Firewalla, pfSense/OPNsense, and a Home Assistant webhook bridge. Note: Microsoft Family Safety, Apple Screen Time, and Google Family Link do not have public APIs and cannot be integrated directly.

---

## Development setup

**Prerequisites:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) and [Node.js 22+](https://nodejs.org/)

```bash
# Clone the repository
git clone https://github.com/[user]/ebbe.git
cd ebbe

# Create your local configuration
cp .env.example .env
# Open .env and fill in JWT_SECRET, JWT_REFRESH_SECRET, and CORS_ORIGIN

# Build and start
docker compose up --build
```

The app will be available at `http://localhost`. See the README for the full first-run setup guide.

To run the frontend and backend separately without Docker (useful for faster iteration):

```bash
# Terminal 1 — backend
cd backend && npm install && npm run dev

# Terminal 2 — frontend
cd frontend && npm install && npm run dev
```

Frontend dev server: `http://localhost:5173` · Backend: `http://localhost:3000`

---

## Code style

- **TypeScript** throughout — no plain `.js` files in `src/`
- **Tailwind CSS** for all styling in the frontend — no external CSS files
- **i18n** — every user-visible string must be added to **both** `frontend/src/locales/en.json` and `frontend/src/locales/sv.json`
- **Follow existing patterns** — look at a similar file before writing a new one. Route files, React components, and Drizzle queries all have established conventions in the codebase
- **No raw SQL** — use Drizzle's query builder (`db.select().from(...).where(...)`)
- **family_id on every table** — required for multi-tenant support; do not omit it

---

## License

By contributing to Ebbe, you agree that your contributions will be licensed under the [MIT License](LICENSE).
