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
- **Deployad till https://mikwik.se/stage/** — Worker med route `mikwik.se/stage/*`, D1 `stage_db_v2` i WEUR
- Worker ASSETS-binding med path rewriting: `/stage/*` → `/` för frontend, SPA-fallback till index.html

---

## Session 4: Mailutskick + RSVP
**Datum:** 2026-02-20
**Status:** DONE

### Deliverables
- [x] Migration 0002: mailings-tabell (id, event_id, subject, body, recipient_filter, status, sent_at, created_at)
- [x] Shared types: Mailing interface + MAILING_STATUS konstanter
- [x] Backend: Email-abstraktionslager med Resend-provider + ConsoleEmailProvider (fallback)
- [x] Backend: Mailing routes — POST /api/events/:id/mailings (skapa), GET /api/events/:id/mailings (lista), POST /api/events/:id/mailings/:mid/send (skicka)
- [x] Backend: RSVP routes (publika, token-baserade) — GET /api/rsvp/:token, POST /api/rsvp/:token/respond, POST /api/rsvp/:token/cancel
- [x] Backend: DB-queries för mailings CRUD + RSVP (token-baserad lookup, statusuppdatering, mottagarfilter)
- [x] Frontend: MailingsTab i EventDetail — utskickslista, "Nytt utskick"-modal (mottagarfilter, ämne, brödtext), förhandsgranskning, skicka-knapp, status per utskick
- [x] Frontend: Publik RSVP-sida (/rsvp/:token) — eventinfo, Jag kommer/Jag kan inte-knappar, bekräftelsesida, avbokningslänk
- [x] Frontend: API-klient (mailingsApi, rsvpApi) + TanStack Query hooks (useMailings, useCreateMailing, useSendMailing)
- [x] 7 nya tester (mailing create, mailing list, mailing validation, RSVP respond, RSVP cancel, RSVP get info, RSVP invalid token) — totalt 21, alla passerar
- [x] SAD.md uppdaterad med 6 nya endpoints + mailings-tabell + RESEND_API_KEY

### Anteckningar
- RESEND_API_KEY är valfri — utan den loggas mail till console (ConsoleEmailProvider)
- RSVP-sidan renderas utanför Layout (ingen sidebar/topbar) — egen route /rsvp/:token
- Mottagarfilter stödjer: alla, per status (invited/attending/declined/waitlisted/cancelled), per kategori (internal/public_sector/private_sector/partner/other)
- Utskick har status draft → sent (irreversibel efter skickning)
- Frontend build: 339KB JS, 4.2KB CSS (gzipped: 100KB JS, 1.4KB CSS)
- **SPA-fallback fix:** `not_found_handling = "single-page-application"` i wrangler.toml krävdes för att direktlänkar till SPA-routes (t.ex. /rsvp/:token, /events/:id) ska fungera — utan denna returnerade Cloudflare Assets 307-redirect
- **RSVP testad live:** https://mikwik.se/stage/rsvp/fc3907c1-8cfb-40a4-8e18-fb4f887419fd

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
| 16 | Worker med ASSETS-binding + path rewriting | Möjliggör deploy under `/stage/`-prefix på Pages-domän | 3 |
| 17 | Email-abstraktionslager (interface + provider) | Resend nu, O365 senare, ConsoleEmailProvider för dev/test | 4 |
| 18 | RSVP via cancellation_token | Publika routes, inga credentials, deltagare identifieras via UUID | 4 |
| 19 | RSVP-sida utanför Layout | Ren publik sida utan sidebar/topbar, egen route i React Router | 4 |
| 20 | Mailings med recipient_filter | Filtrera mottagare per status eller kategori vid skapande/sändning | 4 |

---

## Kända problem

| # | Problem | Status | Session |
|---|---------|--------|---------|
| 1 | ~~D1 database_id i wrangler.toml är placeholder~~ | Löst — `1e935a1e-4a24-44f4-b83d-c70235b982d9` | 3 |
| 2 | ~~Consid Sans fontfiler saknas~~ | Löst — konverterat OTF → woff2/woff, ligger i public/fonts/ | 2 |

---

## Deploy

**Live URL:** https://mikwik.se/stage/

| Milstolpe | Krav | Status |
|---|---|---|
| Första deploy till `mikwik.se/stage` | Session 3 klar (skapa/redigera event + deltagarhantering) | **DONE** ✅ |

### Deploy-konfiguration
- **Worker:** `stage` (Cloudflare Workers)
- **Route:** `mikwik.se/stage/*` (zone: mikwik.se)
- **D1-databas:** `stage_db_v2` (`1e935a1e-4a24-44f4-b83d-c70235b982d9`, region WEUR)
- **ASSETS-binding:** Worker hanterar path rewriting `/stage/*` → `/` för frontend-filer
- **Base path:** Vite `base: '/stage/'`, React Router `basename="/stage"`, API under `/stage/api/*`

### Deploy-steg (vid omdeploy)
```bash
npm run build && npx wrangler deploy
```

### Första deploy (utförd 2026-02-20)
1. `npx wrangler d1 create stage_db_v2` → databas skapad ✅
2. `npx wrangler d1 execute stage_db_v2 --remote --file=migrations/0001_events_participants.sql` → migration körd ✅
3. `npm run build && npx wrangler deploy` → Worker deployad med route `mikwik.se/stage/*` ✅
4. Verifierad: health, events CRUD, participants CRUD, frontend, fonts — allt OK ✅

---

## Migrations-logg

| Migration | Fil | Tabeller | Lokal | Remote |
|-----------|-----|----------|-------|--------|
| 0001 | events_participants.sql | events, participants | ❌ | ✅ |
| 0002 | mailings.sql | mailings | ❌ | ✅ |
