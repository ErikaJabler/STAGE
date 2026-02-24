# Stage — Consid Eventplattform

## Vad är Stage?

Stage är en eventplaneringsplattform för Consid. Eventskapare hanterar events, deltagare och mailutskick. Deltagare svarar via personliga RSVP-länkar. Allt i Consid Brand Guidelines.

## Implementationsplan

- Fullständig sessionsplan: `docs/IMPLEMENTATION-PLAN.md`
- Återgångsplan (rotorsaksanalys + avvikelser): `docs/RECOVERY-PLAN.md`
- Sessionguider: `docs/SESSION-GUIDE.md`
- Aktuell session: se `PROGRESS.md`

## Tech-stack

| Lager        | Val                                       |
| ------------ | ----------------------------------------- |
| Runtime      | Cloudflare Workers                        |
| Backend      | Hono (TypeScript)                         |
| Databas      | Cloudflare D1 (SQLite)                    |
| Frontend     | React + TypeScript + Vite                 |
| Server state | TanStack Query                            |
| Validering   | Zod (delade schemas frontend ↔ backend)   |
| Email        | Resend via abstraktionslager              |
| Bildlagring  | Cloudflare R2 (från session 9)            |
| Auth         | Interface-baserad token (från session 10) |
| Test         | Vitest + @cloudflare/vitest-pool-workers  |
| Deploy       | Cloudflare Workers (React via Assets)     |

## Repostruktur

```
~/stage/
├── CLAUDE.md                    # Denna fil — läs först
├── PROGRESS.md                  # Sessionsstatus
├── TESTPLAN.md                  # Manuella testfall
├── SAD.md                       # Systemarkitekturdokument
├── docs/
│   ├── IMPLEMENTATION-PLAN.md   # Fullständig 20-sessions plan
│   ├── RECOVERY-PLAN.md         # Rotorsaksanalys + avvikelser
│   ├── SESSION-GUIDE.md         # Kompakt guide per session
│   ├── Consid brand guidelines_2025.pdf
│   ├── PRD-Stage.md             # Product Requirements Document
│   └── Skärmavbild*.png         # Prototyp-skärmdumpar
├── wrangler.toml                # Worker + D1 + Assets
├── vitest.config.ts             # Vitest med miniflare
├── migrations/                  # Inkrementella D1-migrationer
├── packages/shared/src/         # Delade typer + Zod-schemas
│   ├── types.ts                 # Event, Participant, Mailing interfaces
│   ├── constants.ts             # Status-enums, kategori-enums
│   └── schemas.ts               # Zod-schemas (validering)
├── backend/src/                 # Hono API
│   ├── index.ts                 # App entry
│   ├── bindings.ts              # Cloudflare Env-typer
│   ├── routes/                  # Tunna routes (parse → service → response)
│   ├── services/                # Affärslogik per domän
│   │   ├── event.service.ts
│   │   ├── participant.service.ts
│   │   ├── waitlist.service.ts
│   │   ├── __tests__/           # Service-tester
│   │   └── email/               # Email-abstraktionslager
│   │       ├── email.interface.ts
│   │       ├── resend.adapter.ts
│   │       ├── console.adapter.ts
│   │       ├── factory.ts
│   │       └── html-builder.ts
│   ├── middleware/              # error-handler
│   ├── db/                     # Typsäkra D1-frågor per domän
│   │   ├── event.queries.ts
│   │   ├── participant.queries.ts
│   │   ├── mailing.queries.ts
│   │   └── waitlist.queries.ts
│   └── utils/                  # validation.ts
└── frontend/src/               # React-app
    ├── App.tsx                 # Root med routing
    ├── api/client.ts           # Typad fetch-wrapper
    ├── pages/                  # Sidkomponenter
    ├── components/             # UI + features
    ├── hooks/                  # TanStack Query hooks
    └── styles/                 # CSS-variabler, Consid-branding
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

## Sessionsstart — OBLIGATORISKT

1. Läs CLAUDE.md (denna fil)
2. Läs PROGRESS.md (vad som är gjort)
3. Läs sessionguiden i `docs/SESSION-GUIDE.md` för aktuell session
4. Läs de filer som sessionen ska ändra/utöka
5. Bekräfta sessionens mål och filer med användaren INNAN kodning startar
6. Gör BARA det som sessionen specificerar — inte mer

## Arkitekturkrav

- Affärslogik i `backend/src/services/`, ALDRIG i routes
- Routes är tunna: parse request → anropa service → returnera response (max 200 rader per fil)
- Validering via Zod i `packages/shared/src/schemas.ts` eller `backend/src/utils/validation.ts`
- Inga filer över 400 rader — bryt upp
- Varje ny service MÅSTE ha colocated tester i `__tests__/`

## API-mönster (Hono)

```typescript
// Routes är tunna — delegerar till services
events.post('/', async (c) => {
  const body = await c.req.json();
  const input = parseCreateEvent(body); // Zod-validering
  const event = await EventService.create(c.env.DB, input);
  return c.json(event, 201);
});
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
- **Error handling:** ErrorBoundary + Toast + global error-handler middleware

## Sessionsavslut — OBLIGATORISKT

Varje session MÅSTE avslutas med:

1. `npm run typecheck` + `npm run test` — inga fel
2. Arkitekturverifiering: Kontrollera att arkitekturkraven ovan uppfylls
3. Git commit av alla ändringar
4. Uppdatera **PROGRESS.md** — markera session DONE, lista deliverables + avvikelser från plan
5. Uppdatera **SAD.md** — nya endpoints, schemaändringar, integrationer
6. Uppdatera **TESTPLAN.md** — testfall för nya features + uppdatera TC-0.4 testantal
7. Uppdatera **docs/SESSION-GUIDE.md** — markera sessionen ✅ DONE med kort leveranssammanfattning
8. Ge användaren en kopierbar prompt för nästa session — prompten MÅSTE:
   - Läsa nästa sessions sektion i `docs/IMPLEMENTATION-PLAN.md`
   - Inkludera ALLA filer som ska skapas/ändras (exakta sökvägar)
   - Inkludera ALLA constraints och krav (brand, tekniska, arkitektur)
   - Inkludera risker och mittigeringar om planen nämner sådana
   - ALDRIG vara kortare än planens sessionsbeskrivning — all information ska med

## Vad INTE göra

- Använd INTE egna färger — bara Consid-paletten
- Använd INTE Inter/system-typsnitt om Consid Sans finns
- Hårdkoda INTE färger — använd CSS-variabler
- Skapa INTE nya migrationer utan att uppdatera SAD.md
- Starta INTE nästa session automatiskt
- Lägg INTE affärslogik i routes — använd services/

## Status

Se `PROGRESS.md` för aktuell sessionsstatus.
