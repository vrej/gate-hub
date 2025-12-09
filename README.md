# GateHub

## Overview

GateHub is a full-stack web application for managing software applications, user access requests, and admin operations within an organization. It features a modern React frontend, a robust Express backend, and PostgreSQL for persistent storage, with shared types and validation using Drizzle ORM and Zod.

---

## Tech Stack

- **Frontend:** React, Vite, Wouter, Tailwind CSS, Radix UI, TanStack React Query
- **Backend:** Node.js, Express, Passport.js (local strategy), Drizzle ORM, Multer, CSV utilities
- **Database:** PostgreSQL (via Drizzle ORM, Neon serverless compatible)
- **Session Management:** express-session (MemoryStore for dev, connect-pg-simple for prod)
- **Validation:** Zod (with drizzle-zod)
- **Monorepo Structure:** Shared types and schema in `shared/`, backend in `server/`, frontend in `client/`

---

## Features

- User authentication (register, login, logout, session-based, admin/user roles)
- CRUD for applications (with CSV import)
- CRUD for application access requests
- Admin panel for user management and activity logs
- Modern UI with Radix, Tailwind, and custom components
- RESTful API endpoints under `/api/`

---

## Project Structure

- `client/` — React frontend (entry: `client/src/main.tsx`)
- `server/` — Express backend (entry: `server/index.ts`)
- `shared/` — Shared Zod/Drizzle schemas and types
- `server/storage.ts` — In-memory storage (dev)
- `server/database-storage.ts` — Persistent storage (PostgreSQL, prod)
- `server/auth.ts` — Passport.js authentication
- `server/db.ts` — Database connection setup
- `drizzle.config.ts` — Drizzle ORM config for migrations

---

## Local Setup

### 1. Prerequisites

- Node.js (v18+ recommended)
- PostgreSQL database (for production-like setup)
- Yarn or npm

### 2. Clone and Install

```sh
git clone <repo-url>
cd DWM-gate-hub
npm install
```

### 3. Environment Variables

Create a `.env` file in the root with at least:

```
DATABASE_URL=postgres://<user>:<password>@<host>:<port>/<db>
SESSION_SECRET=your-session-secret
```

- For dev/testing, you can omit `DATABASE_URL` to use in-memory storage, but most features expect a real database.

### 4. Database Setup

Run migrations (if using PostgreSQL):

```sh
npm run db:push
```

This uses Drizzle ORM to push schema to your database.

### 5. Running the App

#### Development (hot reload, in-memory storage):

```sh
npm run dev
```

- Starts the Express server (on port 5000) and serves both API and frontend.

#### Production (bundled, persistent storage):

```sh
npm run build
npm start
```

- Bundles both frontend and backend, and serves from `dist/`.

### 6. Access

- Open [http://localhost:5000](http://localhost:5000) in your browser.

---

## Default Admin (Dev Mode)

- Username: `admin`
- Password: `admin`

---

## API Endpoints

See `server/api-routes.ts` for all available endpoints.

---

## Frontend Routing

- `/` — Dashboard
- `/admin` — Admin Panel
- `/admin/users` — User Management

---

## License

MIT
