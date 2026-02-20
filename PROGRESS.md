# Stage — Sessionsprogress

## Session 0: Repo + config + build pipeline
**Datum:** 2026-02-20
**Status:** DONE

### Deliverables
- [x] Monorepo med npm workspaces (root + backend + frontend + shared)
- [x] TypeScript-konfiguration (root + per workspace med project references)
- [x] Wrangler.toml (Worker + Assets + D1-binding)
- [x] Vitest + @cloudflare/vitest-pool-workers
- [x] Hono backend med GET /api/health
- [x] Health-test (GET /api/health → 200 + JSON)
- [x] React + Vite frontend ("Stage" h1)
- [x] Delade typer (Event, Participant, enums)
- [x] Migration 0001: events + participants
- [x] .gitignore, CLAUDE.md, PROGRESS.md, TESTPLAN.md, README.md, SAD.md
- [x] git init + första commit

### Anteckningar
- Node v25.6.1, npm 11.9.0
- Ny D1-databas `stage_db_v2` (separat från prototypen)
- Test-filer exkluderade från tsc --build (körs via vitest med cloudflare:test)
- vitest.config.ts genererar .d.ts/.js/.map — dessa ligger i .gitignore
- `wrangler.toml` har `database_id = "placeholder-replace-after-creation"` — skapa D1 med `wrangler d1 create stage_db_v2` och uppdatera ID
- Frontend byggs med Vite, serveras via Workers Assets — behöver `npm run build:frontend` före `wrangler dev`

**Git commit:** `7c8d84c`

---

## Session 1: Consid designsystem + Layout
**Datum:** 2026-02-20
**Status:** DONE

### Deliverables
- [x] CSS-variabler i `frontend/src/styles/globals.css` (alla Consid-färger + semantiska aliases)
- [x] Design tokens i `frontend/src/styles/design-tokens.ts` (TS-export för dynamiska behov)
- [x] Consid Sans @font-face (Regular, Medium, Semibold) — struktur i `public/fonts/` (fontfiler ej inkluderade)
- [x] Consid-logotyp som inline SVG i `frontend/src/assets/ConsidLogo.tsx` (full + symbol variant)
- [x] Layout: Sidebar (Burgundy bg, vit logotyp), Topbar, Layout-wrapper med Outlet
- [x] UI-komponenter: Button (4 varianter), Badge (5 varianter), Modal (dialog-baserad), Input (med label/error/hint), Toast (context + provider), ErrorBoundary
- [x] React Router: `/` (Översikt), `/events/:id` (Eventdetalj)
- [x] TanStack Query: QueryClientProvider i App.tsx
- [x] Overview.tsx med mockdata (4 events) och EventCard-grid
- [x] EventDetail.tsx med tabs (Sammanfattning, Deltagare, Utskick, Inställningar)
- [x] Loading states, error states, tom-states (EmptyState, NotFoundState)
- [x] WCAG-godkända färgkombinationer dokumenterade i design-tokens.ts

### Anteckningar
- Consid Sans fontfiler saknas — `public/fonts/` är förberett med @font-face-deklarationer, fallback: system-ui
- Typsnittsvikter: Regular (400), Medium (500), Semibold (600) — enligt brand guidelines
- `dialog`-element för Modal (nativt med `::backdrop`)
- Toast via React Context (auto-dismiss 4s)
- Mockdata i `pages/mockdata.ts` — ersätts med API-anrop i session 2+
- Frontend typecheck: ren, Vite build: OK (291KB JS, 3.9KB CSS gzipped)
- Nya dependencies: react-router-dom, @tanstack/react-query

---

## Session 2: CRUD Events API + frontend-integration
**Datum:** 2026-02-20
**Status:** DONE

### Deliverables
- [x] Typsäkra D1-queries i `backend/src/db/queries.ts` (listEvents, getEventById, createEvent, updateEvent, softDeleteEvent)
- [x] CRUD-routes i `backend/src/routes/events.ts` (GET, GET/:id, POST, PUT, DELETE)
- [x] Input-validering: required fields, datumformat (YYYY-MM-DD), tidsformat (HH:MM), email-format, enum-värden
- [x] Slug-generering från eventnamn (med svensk ä/å/ö-hantering)
- [x] Soft-delete för DELETE /api/events/:id (sätter deleted_at)
- [x] API-klient i `frontend/src/api/client.ts` (typad fetch-wrapper med felhantering)
- [x] TanStack Query hooks i `frontend/src/hooks/useEvents.ts` (useEvents, useEvent, useCreateEvent, useUpdateEvent, useDeleteEvent)
- [x] Overview.tsx: Ersatt mockdata med useEvents() hook, loading-skeleton, error-state
- [x] EventDetail.tsx: Ersatt mockdata med useEvent() hook, loading-skeleton, error-state
- [x] Skeleton-komponent i `frontend/src/components/ui/Skeleton.tsx` (generisk + EventCard + EventGrid + EventDetail)
- [x] Skeleton-puls CSS-animation i globals.css
- [x] Tester: 9 events-tester + 1 health-test (10 totalt, alla passerar)
- [x] SAD.md uppdaterad med 5 nya API-endpoints
- [x] vitest.config.ts: explicit `include` för att bara köra .ts-filer (undviker tsc build-outputs)

### Anteckningar
- Ingen ny migration krävdes — befintligt schema (0001) stödjer alla CRUD-operationer
- D1.exec() kräver single-line SQL i tester — multiline template literals fungerar inte med miniflare
- vitest med cloudflare workers pool isolerar D1-data mellan describe-block — tester måste vara self-contained
- Frontend Vite build: 300KB JS, 4.1KB CSS (gzipped: 92KB JS, 1.4KB CSS)
- Deltagartab visar count men listar ej deltagare (participants CRUD i framtida session)
- Mockdata-filen (`pages/mockdata.ts`) behålls som referens men importeras inte längre

---

## Session 3: Skapa-event-formulär + deltagarhantering
**Datum:** 2026-02-20
**Status:** DONE

### Deliverables
- [x] EventForm-komponent — återanvändbar för både skapa och redigera (alla event-fält i sektioner)
- [x] CreateEvent-sida (`/events/new`) med formulärvalidering, toast-notis, redirect till eventdetalj
- [x] EditEvent-sida (`/events/:id/edit`) med förpopulerat formulär, toast-notis, redirect
- [x] Backend: Participant CRUD-queries i `backend/src/db/queries.ts` (listParticipants, getParticipantById, createParticipant, updateParticipant, deleteParticipant)
- [x] Backend: Participant routes i `backend/src/routes/participants.ts` (GET/POST/PUT/DELETE `/api/events/:id/participants`)
- [x] Backend: Input-validering för deltagare (name, email, category, status)
- [x] Frontend: Participants API-klient i `frontend/src/api/client.ts` (participantsApi)
- [x] Frontend: TanStack Query hooks i `frontend/src/hooks/useParticipants.ts` (useParticipants, useCreateParticipant, useUpdateParticipant, useDeleteParticipant)
- [x] Frontend: ParticipantsTab i EventDetail — riktig deltagartabell med namn, email, företag, kategori, status, ta bort-knapp
- [x] Frontend: AddParticipantModal med formulär (namn, email, företag, kategori)
- [x] Router: Nya routes `/events/new`, `/events/:id/edit`
- [x] Redigera-knapp i EventDetail nu länkad till `/events/:id/edit`
- [x] "Nytt event"-knapp i Overview nu länkad till `/events/new`
- [x] SAD.md uppdaterad med 4 nya API-endpoints
- [x] 4 nya tester (participants CRUD) — totalt 14 tester, alla passerar

### Anteckningar
- Ingen ny migration krävdes — befintligt schema (0001) stödjer participant CRUD
- EventForm validerar: required fields, datumformat (YYYY-MM-DD), tidsformat (HH:MM), email-format, max_participants >= 1
- Participant hard-delete (inte soft-delete som events) — deltagare kan faktiskt tas bort
- cancellation_token genereras automatiskt med crypto.randomUUID()
- Frontend Vite build: 323KB JS, 4.1KB CSS (gzipped: 97KB JS, 1.4KB CSS)
- Deploy-redo: Session 3 klara, alla krav för första deploy uppfyllda

---

## Arkitekturbeslut

| # | Beslut | Motivering | Session |
|---|--------|-----------|---------|
| 1 | npm workspaces (inte Turborepo) | Enkelt, inget extra beroende | 0 |
| 2 | Inkrementella SQL-migrationer | En fil per session, enkel att spåra | 0 |
| 3 | @cloudflare/vitest-pool-workers | Testar mot riktig D1 i miniflare | 0 |
| 4 | Frontend via Workers Assets | Byggs med Vite, serveras statiskt | 0 |
| 5 | Test-filer exkluderade från tsc | cloudflare:test-modul finns bara i vitest runtime | 0 |
| 6 | Inline styles (CSSProperties) istället för CSS-moduler | Enklare för komponentbibliotek, inga extra filer | 1 |
| 7 | CSS custom properties för design tokens | Konsekvent branding, lätt att ändra, CSS-native | 1 |
| 8 | Native dialog-element för Modal | Bättre tillgänglighet, inbyggd backdrop, focus trap | 1 |
| 9 | Toast via React Context | Global åtkomst via useToast(), auto-dismiss | 1 |
| 10 | Self-contained API-tester | Varje test skapar sin egen data, ej beroende mellan describe-block | 2 |
| 11 | Dynamisk partial update (PUT) | Bygger SET-klausul från inskickade fält, ej full replace | 2 |
| 12 | Slug auto-generering | Genereras från eventnamn med svensk teckenhantering | 2 |
| 13 | Återanvändbar EventForm | Samma komponent för skapa + redigera, initialData-prop styr läge | 3 |
| 14 | Participant hard-delete | Deltagare raderas fysiskt (inte soft-delete), enklare modell | 3 |
| 15 | Nested participants-route | Monteras som `/api/events/:eventId/participants` i Hono | 3 |

---

## Kända problem

| # | Problem | Status | Session |
|---|---------|--------|---------|
| 1 | D1 database_id i wrangler.toml är placeholder | Skapa med `wrangler d1 create` | 0 |
| 2 | ~~Consid Sans fontfiler saknas~~ | Löst — konverterat OTF → woff2/woff, ligger i public/fonts/ | 2 |

---

## Deploy-plan

| Milstolpe | Krav | Status |
|---|---|---|
| Första deploy till `mikwik.se/stage` | Session 3 klar (skapa/redigera event + deltagarhantering) | Redo |

**Deploy-steg (efter session 3):**
1. `wrangler d1 create stage_db_v2` → uppdatera `database_id` i wrangler.toml
2. `npm run db:migrate:remote -- migrations/0001_events_participants.sql`
3. `npm run build && wrangler deploy`
4. Konfigurera custom domain/route i Cloudflare → `mikwik.se/stage`

---

## Migrations-logg

| Migration | Fil | Tabeller | Lokal | Remote |
|-----------|-----|----------|-------|--------|
| 0001 | events_participants.sql | events, participants | ❌ | ❌ |
