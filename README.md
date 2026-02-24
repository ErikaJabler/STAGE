# Stage — Consid Eventplattform

Eventplaneringsplattform för Consid. Hanterar events, deltagare, mailutskick och avbokningar. Byggt med Consid Brand Guidelines.

## Tech-stack

- **Runtime:** Cloudflare Workers
- **Backend:** Hono (TypeScript)
- **Databas:** Cloudflare D1 (SQLite)
- **Frontend:** React + TypeScript + Vite
- **Server state:** TanStack Query
- **Validering:** Zod (delade schemas frontend ↔ backend)
- **Email:** Resend via abstraktionslager
- **Bildlagring:** Cloudflare R2
- **Test:** Vitest + @cloudflare/vitest-pool-workers
- **CI:** GitHub Actions (typecheck → lint → test)

## Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0
- (Valfritt) Cloudflare-konto för deploy och D1/R2

## Snabbstart

```bash
# 1. Klona repot
git clone <repo-url>
cd stage

# 2. Installera beroenden
npm install

# 3. Konfigurera miljövariabler (valfritt)
cp .dev.vars.example .dev.vars
# Redigera .dev.vars om du vill använda Resend för email
# Utan RESEND_API_KEY loggas email till konsolen (ConsoleEmailProvider)

# 4. Skapa D1-databas (kräver Cloudflare-konto)
# wrangler d1 create stage_db_v2
# Uppdatera database_id i wrangler.toml

# 5. Kör migrationer lokalt
npm run db:migrate:local -- migrations/0001_events_participants.sql
npm run db:migrate:local -- migrations/0002_mailings.sql
npm run db:migrate:local -- migrations/0003_users_permissions.sql
npm run db:migrate:local -- migrations/0004_activities.sql
npm run db:migrate:local -- migrations/0005_participant_extras.sql
npm run db:migrate:local -- migrations/0006_email_editor.sql
npm run db:migrate:local -- migrations/0007_search_indexes.sql
npm run db:migrate:local -- migrations/0008_admin.sql
npm run db:migrate:local -- migrations/0009_rate_limits.sql

# 6. Starta dev-server
npm run dev
# → http://localhost:8787/stage
```

## Kommandon

```bash
npm run dev              # Starta Wrangler dev (backend + frontend)
npm run build            # Bygg frontend + backend
npm run typecheck        # TypeScript --build
npm run test             # Vitest run
npm run test:watch       # Vitest watch-läge
npm run lint             # ESLint
npm run lint:fix         # ESLint med autofix
npm run format           # Prettier (skriv)
npm run format:check     # Prettier (kontrollera)
```

## Projektstruktur

```
stage/
├── backend/src/         # Hono API (Cloudflare Worker)
│   ├── routes/          # Tunna routes (parse → service → response)
│   ├── services/        # Affärslogik per domän
│   ├── db/              # Typsäkra D1-frågor
│   ├── middleware/       # Auth, error-handler, rate-limiter
│   └── utils/           # Validering, escaping, route-helpers
├── frontend/src/        # React + Vite
│   ├── pages/           # Sidkomponenter
│   ├── components/      # UI + features
│   ├── hooks/           # TanStack Query hooks
│   └── styles/          # CSS-variabler, Consid-branding
├── packages/shared/src/ # Delade typer, Zod-schemas, konstanter
├── migrations/          # Inkrementella D1-migrationer
└── docs/                # Arkitekturdokumentation
```

## Troubleshooting

### TS6305-fel (stale build artifacts)

```bash
rm -rf frontend/dist backend/dist packages/shared/dist *.tsbuildinfo
npm run typecheck
```

### TS2307: Cannot find module 'cloudflare:test'

Förväntat vid `tsc --build` — modulen `cloudflare:test` finns bara i vitest runtime. Testerna körs korrekt med `npm run test`.

### D1-databas saknas

Skapa en lokal D1-databas:

```bash
wrangler d1 create stage_db_v2
```

Uppdatera `database_id` i `wrangler.toml` med ID:t som returneras.

## Dokumentation

- **[CONTRIBUTING.md](CONTRIBUTING.md)** — Guide för att bidra
- **CLAUDE.md** — AI-sessionskontext
- **PROGRESS.md** — Sessionsprogress
- **SAD.md** — Systemarkitekturdokument
- **TESTPLAN.md** — Manuella testfall
- **docs/IMPLEMENTATION-PLAN.md** — Fullständig implementationsplan
