# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OpenKompass is a single-user Fediverse-capable web application. Stack: Node.js + Hono (backend), MySQL, JWT auth, Tailwind CSS (frontend), Fedify (ActivityPub federation).

## Commands

```bash
# Backend
cd backend && npm install
cd backend && npm run dev       # start dev server (nodemon or node --watch)
cd backend && node server.js    # start production

# Frontend (once scaffolded)
cd frontend && npm install
cd frontend && npm run dev
```

Generate a bcrypt hash for `ROOT_PASSWORD_HASH`:
```bash
node -e "const b = require('bcrypt'); b.hash('yourpassword', 10).then(console.log)"
```

## Architecture

```
backend/
  server.js           # entry point — serves Hono app via @hono/node-server
  src/
    app.js            # Hono app, mounts all routes
    routes/           # route files imported into app.js
    middleware/       # authMiddleware (JWT verification)
    controllers/      # handler logic (authController, profileController)
    services/         # DB query logic, separated from controllers
    utils/
  config/
    db.js             # mysql2 connection pool
  .env

frontend/
  src/
  tailwind.config.js
```

## Critical Design Constraints

**Single-user only — forever.** There is no registration, no user list, no multi-tenancy. The owner's credentials come entirely from environment variables (`ROOT_USERNAME`, `ROOT_PASSWORD_HASH`). Never add user tables, user IDs, or multi-user logic.

**JWT payload is `{ role: 'owner' }` only** — no user ID needed. All protected routes just check that a valid token exists.

**Profile table has exactly one row (`id = 1`)**:
```sql
CREATE TABLE profile (
  id INT PRIMARY KEY DEFAULT 1,
  display_name VARCHAR(255),
  bio TEXT,
  avatar_url TEXT,
  fediverse_handle VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```
Use `INSERT ... ON DUPLICATE KEY UPDATE` or `UPDATE WHERE id = 1` — never insert a second row.

## Environment Variables

```
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=app_db
JWT_SECRET=supersecretkey
ROOT_USERNAME=admin
ROOT_PASSWORD_HASH=<bcrypt hash, min 10 rounds>
```

## Security Rules

- bcrypt salt rounds: **minimum 10**
- JWTs expire in **1 hour**
- Auth errors always return the same message (`'Invalid credentials'`) regardless of whether username or password failed — no oracle

## Fedify (Planned)

The profile record (id = 1) will map 1:1 to a Fediverse Actor. Fedify integration reads from the profile table; no actor configuration lives outside of it.
