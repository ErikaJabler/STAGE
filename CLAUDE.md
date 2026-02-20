# Stage — Consid Eventplattform

## Vad är Stage?
Stage är en eventplaneringsplattform för Consid. Eventskapare hanterar events, deltagare och mailutskick. Deltagare svarar via personliga RSVP-länkar. Allt i Consid Brand Guidelines.

## Tech-stack
| Lager | Val |
|---|---|
| Runtime | Cloudflare Workers |
| Backend | Hono (TypeScript) |
| Databas | Cloudflare D1 (SQLite) |
| Frontend | React + TypeScript + Vite |
| Server state | TanStack Query (från session 1) |
| Email | Resend via abstraktionslager (från session 6) |
| Bildlagring | Cloudflare R2 (från session 2) |
| Auth | Interface-baserad token (från session 10) |
| Test | Vitest + @cloudflare/vitest-pool-workers |
| Deploy | Cloudflare Workers (React via Assets) |

## Repostruktur
```
~/stage/
├── CLAUDE.md              # Denna fil — läs först
├── PROGRESS.md            # Sessionsstatus
├── TESTPLAN.md            # Manuella testfall
├── SAD.md                 # Systemarkitekturdokument
├── wrangler.toml          # Worker + D1 + Assets
├── vitest.config.ts       # Vitest med miniflare
├── migrations/            # Inkrementella D1-migrationer
├── packages/shared/src/   # Delade typer (Event, Participant, enums)
├── backend/src/           # Hono API
│   ├── index.ts           # App entry
│   ├── bindings.ts        # Cloudflare Env-typer
│   ├── routes/            # API-routes
│   ├── services/          # Affärslogik
│   ├── middleware/         # auth, cors, error-handler
│   └── db/queries.ts      # Typsäkra D1-frågor
└── frontend/src/          # React-app
    ├── App.tsx            # Root med routing
    ├── api/client.ts      # Typad fetch-wrapper
    ├── pages/             # Sidkomponenter
    ├── components/        # UI + features
    ├── hooks/             # TanStack Query hooks
    └── styles/            # CSS-variabler, Consid-branding
```

## Kommandon
```bash
npm run dev          # Starta Wrangler dev (backend + frontend)
npm run build        # Bygg frontend + backend
npm run typecheck    # TypeScript --build
npm run test         # Vitest run
npm run test:watch   # Vitest watch-läge
npm run db:migrate:local -- migrations/0001_events_participants.sql
```

## API-mönster (Hono)
```typescript
// backend/src/routes/events.ts
import { Hono } from "hono";
import type { Env } from "../bindings";

const events = new Hono<{ Bindings: Env }>();
events.get("/", async (c) => {
  const result = await c.env.DB.prepare("SELECT * FROM events WHERE deleted_at IS NULL").all();
  return c.json(result.results);
});
export default events;
```

## Designsystem — Consid Brand Guidelines 2025
- **Burgundy** `#701131` — primär (sidebar, headings)
- **Raspberry Red** `#B5223F` — accent/CTA (knappar)
- **Light Orange** `#F49E88` — highlight (ikoner, accenter)
- **Beige** `#EFE6DD` — bakgrund
- **Black** `#1C1C1C` — text
- **Font:** Consid Sans (Regular + Semibold), fallback: system-ui, sans-serif
- Alla färger via CSS-variabler (`--color-burgundy` etc.)
- WCAG: Vit på Burgundy ✅, Vit på Raspberry Red ✅, Black på Beige ✅

## Nyckeldesignbeslut
- **Soft-delete:** events har `deleted_at`, aldrig fysisk radering
- **Inkrementella migrationer:** ny SQL-fil per session som behöver det
- **Token-auth:** `cancellation_token` (UUID) för deltagaråtgärder
- **Email-interface:** abstrakt provider → Resend nu, O365 senare
- **Error handling:** ErrorBoundary + Toast (från session 1)

## Vad INTE göra
- Använd INTE egna färger — bara Consid-paletten
- Använd INTE Inter/system-typsnitt om Consid Sans finns
- Hårdkoda INTE färger — använd CSS-variabler
- Skapa INTE nya migrationer utan att uppdatera SAD.md
- Starta INTE nästa session automatiskt

## Status
Se `PROGRESS.md` för aktuell sessionsstatus.
