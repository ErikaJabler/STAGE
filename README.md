# Stage — Consid Eventplattform

Eventplaneringsplattform för Consid. Hanterar events, deltagare, mailutskick och avbokningar.

## Tech-stack
- **Runtime:** Cloudflare Workers
- **Backend:** Hono (TypeScript)
- **Databas:** Cloudflare D1 (SQLite)
- **Frontend:** React + TypeScript + Vite
- **Test:** Vitest + @cloudflare/vitest-pool-workers

## Setup

```bash
# Installera beroenden
npm install

# Kör lokal migration
npm run db:migrate:local -- migrations/0001_events_participants.sql

# Starta dev-server
npm run dev
# → http://localhost:8787

# TypeScript-kontroll
npm run typecheck

# Kör tester
npm run test
```

## Projektstruktur

```
stage/
├── backend/           # Hono API (Cloudflare Worker)
├── frontend/          # React + Vite
├── packages/shared/   # Delade typer och konstanter
├── migrations/        # D1 SQL-migrationer
└── docs/              # Arkitekturdokumentation
```

## Dokumentation

- **CLAUDE.md** — AI-sessionskontext
- **PROGRESS.md** — Sessionsprogress
- **SAD.md** — Systemarkitekturdokument
- **TESTPLAN.md** — Manuella testfall
