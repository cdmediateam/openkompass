# OpenKompass

A single-user, self-hosted personal dashboard with Fediverse support (ActivityPub via Fedify, planned). Manage your profile, subscribe to external ICS calendar feeds, and keep a private internal calendar — all from one clean web interface.

## Features

- **Events** — tomorrow's agenda pulled from all calendar sources in one list
- **Internal Calendar** — add, edit, and delete personal events (title, date, time, location, notes)
- **External Calendars** — subscribe to ICS feeds; drag-and-drop to reorder; manual "not checked" reminders for calendars without a URL
- **Profile** — public-facing display name, bio, avatar, and Fediverse handle
- **Single-user by design** — no registration, no multi-tenancy; credentials come from environment variables

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Node.js 20+, [Hono](https://hono.dev/) |
| Database | MySQL 8+ |
| Auth | JWT (1 h expiry) + bcrypt |
| Frontend | Vanilla JS, [Vite](https://vitejs.dev/), [Tailwind CSS](https://tailwindcss.com/) |
| Federation | [Fedify](https://fedify.dev/) *(planned)* |

---

## Prerequisites

- **Node.js** 20 or later
- **MySQL** 8.0 or later (or a compatible fork such as MariaDB 10.6+)
- **npm** 9 or later (comes with Node.js)

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-user/openkompass.git
cd openkompass
```

### 2. Install dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 3. Create the database

Log in to MySQL and run the schema file:

```bash
mysql -u root -p < db/schema.sql
```

This creates the `openkompass` database and all required tables.

### 4. Configure the backend

Copy the example environment file and fill in your values:

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and set each variable:

```dotenv
PORT=3000

# MySQL connection
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=openkompass

# JWT — use a long random string, keep it secret
JWT_SECRET=changeme-use-a-long-random-string

# Owner credentials
ROOT_USERNAME=admin
ROOT_PASSWORD_HASH=   # see step 5
```

### 5. Generate the password hash

OpenKompass never stores a plain-text password. Generate a bcrypt hash for your chosen password and paste it into `ROOT_PASSWORD_HASH`:

```bash
node backend/scripts/hash-password.js yourpassword
```

Copy the printed hash into `backend/.env`:

```dotenv
ROOT_PASSWORD_HASH=$2b$10$...
```

> The minimum cost factor is 10 rounds. Do not lower it.

### 6. Start the backend

```bash
cd backend
npm run dev       # development (auto-restarts on change)
# or
node server.js    # production
```

The API is now available at `http://localhost:3000`.

### 7. Start the frontend

In a separate terminal:

```bash
cd frontend
npm run dev
```

Vite starts a dev server (default port **5173**) that proxies `/api/*` requests to the backend automatically, reading the port from `backend/.env`.

Open `http://localhost:5173` in your browser and log in with the username and password you set in steps 4 and 5.

---

## Production build (manual)

Build the frontend into static files. The backend serves them automatically when `NODE_ENV=production`:

```bash
cd frontend && npm run build   # output goes to frontend/dist/
NODE_ENV=production node backend/server.js
```

---

## Deploying to DigitalOcean App Platform

App Platform runs the backend as a web service and provisions a managed MySQL database. The frontend is built during the deploy pipeline and served as static files by the Node process — no separate static host needed.

**Estimated cost:** ~$5/month (app) + ~$15/month (dev-size managed MySQL) = **~$20/month**.

### 1. Push to GitHub

App Platform deploys from a GitHub repository. Push your code and note the repo path (`your-github-user/openkompass`).

### 2. Generate a bcrypt hash

Do this locally — the hash is stored as a secret env var on the platform, never in source code:

```bash
node backend/scripts/hash-password.js yourpassword
```

### 3. Edit `.do/app.yaml`

Replace the placeholder repo reference:

```yaml
github:
  repo: your-github-user/openkompass   # ← your actual repo
```

Choose a region close to you (`nyc1`, `fra1`, `ams3`, `sgp1`, `blr1`, `syd1`).

### 4. Create the app

```bash
# Install the DigitalOcean CLI if you don't have it
brew install doctl          # macOS
doctl auth init             # log in

# Create the app from the spec
doctl apps create --spec .do/app.yaml
```

Or create it via the DigitalOcean web console: **Apps → Create App → GitHub → select repo → Edit Plan → paste spec**.

### 5. Set secret environment variables

In the App Platform dashboard, go to the app's **Settings → Environment Variables** and set the values that are marked `SECRET` in the spec (they are defined but intentionally have no value in the YAML):

| Variable | Value |
|---|---|
| `JWT_SECRET` | Any long random string (e.g. `openssl rand -hex 32`) |
| `ROOT_USERNAME` | Your chosen login name |
| `ROOT_PASSWORD_HASH` | The bcrypt hash from step 2 |

### 6. Deploy

Trigger the first deploy from the dashboard or push a commit. The deploy pipeline:

1. Installs frontend dependencies and runs `vite build`
2. Installs backend dependencies
3. On startup, runs `node backend/scripts/migrate.js` — creates all tables (idempotent, runs on every boot)
4. Starts `node backend/server.js`

Once the deploy is green, your app is live at the URL shown in the dashboard.

### How it works in production

```
Browser → App Platform URL
         ├── /api/*  → Hono routes (JWT-protected)
         └── /*      → frontend/dist/ static files (served by the same Node process)
```

The frontend's `api.js` uses relative paths (`/api/…`), so everything runs on a single origin with no CORS configuration needed.

### Updating

Push to `main`. App Platform auto-deploys on every push (configured via `deploy_on_push: true` in the spec). The migration script runs on each boot and is safe to re-run — all statements use `CREATE TABLE IF NOT EXISTS`.

---

## Environment variable reference

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Backend port (default: `3000`) |
| `DB_HOST` | Yes | MySQL hostname |
| `DB_USER` | Yes | MySQL username |
| `DB_PASSWORD` | Yes | MySQL password |
| `DB_NAME` | Yes | MySQL database name (create it first via `db/schema.sql`) |
| `JWT_SECRET` | Yes | Secret used to sign JWTs — any long random string |
| `ROOT_USERNAME` | Yes | Login username for the owner account |
| `ROOT_PASSWORD_HASH` | Yes | bcrypt hash of the owner password (min 10 rounds) |

---

## Navigation

| Page | Path | Description |
|---|---|---|
| Dashboard | `#/dashboard` | Profile overview |
| Events | `#/events` | Tomorrow's agenda from all calendars |
| Internal Calendar | `#/internal-calendar` | Create and manage personal events |
| External Calendars | `#/external-calendars` | Manage ICS subscriptions and reminders |
| Edit Profile | `#/profile` | Update display name, bio, avatar, Fediverse handle |

---

## Database schema

All tables are created by `db/schema.sql`. A summary:

```
profile            — single row (id = 1); public profile data
calendar_feeds     — external ICS URLs and manual reminders, ordered by sort_order
internal_events    — personal events with title, start_at, location, description
```

---

## Security notes

- Passwords are hashed with bcrypt at a minimum cost factor of 10.
- JWTs expire after 1 hour and carry only `{ role: "owner" }` — no user IDs.
- Login errors always return `"Invalid credentials"` regardless of which field failed, preventing username enumeration.
- All API routes except `POST /api/login` require a valid Bearer token.

---

## Project structure

```
openkompass/
├── backend/
│   ├── server.js               # Entry point
│   ├── src/
│   │   ├── app.js              # Hono app, mounts all routes
│   │   ├── routes/             # auth, profile, calendars, internalEvents
│   │   ├── controllers/        # Request handlers
│   │   ├── services/           # Database query logic
│   │   └── middleware/         # JWT auth middleware
│   ├── config/
│   │   └── db.js               # MySQL connection pool
│   ├── scripts/
│   │   └── hash-password.js    # CLI tool to generate bcrypt hashes
│   └── .env.example
├── frontend/
│   ├── index.html
│   ├── src/
│   │   ├── main.js             # SPA router
│   │   ├── api.js              # Fetch wrapper + token management
│   │   ├── layout.js           # Shared sidebar layout
│   │   └── views/              # login, dashboard, events, internalCalendar,
│   │                           #   externalCalendars, profile
│   ├── vite.config.js
│   └── tailwind.config.js
└── db/
    └── schema.sql              # Full database schema
```
