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
| 21 | CSV-import med auto-header-detection | Parser identifierar kolumner från header-rad (sv/en), fallback till positionell | 6 |
| 22 | Frontendbaserade mailmallar | Mallar definierade i frontend, ej backend — enkelt, ingen migration, redigerbart | 6 |
| 23 | Auto-waitlist vid kapacitetsgräns | shouldWaitlist() kontrollerar attending >= max_participants + overbooking_limit | 7 |
| 24 | Auto-promote vid ledig plats | promoteFromWaitlist() vid delete, statusändring och RSVP-cancel | 7 |
| 25 | Klientsida deltagarfiltrering | Sök + statusfilter i frontend — all data redan hämtad, inga extra API-anrop | 7 |
| 26 | Dubbel ICS-generering | Backend-endpoint för email, klientsida för RSVP — redundans ger bättre UX | 7 |
| 27 | Interface-baserad auth (AuthProvider) | Enkel token nu, Azure AD senare — byt implementation utan routeändringar | 10 |
| 28 | X-Auth-Token header | Enkel header-baserad auth, klienten sätter header per request via localStorage | 10 |
| 29 | Auto-owner vid event-skapande | POST /events sätter skaparen som owner automatiskt | 10 |
| 30 | Roller per event (owner/editor/viewer) | Granulär åtkomstkontroll per event, ej global admin | 10 |
| 31 | Backend email-mallar med template-renderer | Mallar i backend med merge fields, exponeras via API — framtida CMS-integration möjlig | 11 |
| 32 | Email-kö med Cron Trigger | ≤5 mottagare direkt, >5 via D1-kö + Cron (var 5 min, batch 20) — respekterar rate limits | 11 |
| 33 | Aktivitetslogg per event | Alla mutationer loggas med typ, beskrivning, metadata — ger audit trail | 11 |
| 34 | Sök filtrerat per behörighet | SQL LIKE-sök på events, resultat filtrerat per användarens permissions | 11 |

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

## Session 5: Riktig mailsändning via Resend + HTML-mail med RSVP-länk
**Datum:** 2026-02-22
**Status:** DONE

### Deliverables
- [x] Resend-domän (mikwik.se) verifierad med DKIM, SPF (MX + TXT)
- [x] RESEND_API_KEY sparad som Cloudflare Worker secret
- [x] HTML-mailtemplate med Consid-branding (burgundy header, beige bakgrund, raspberry CTA-knapp)
- [x] Per-mottagare RSVP-länk injiceras automatiskt i varje mail (`https://mikwik.se/stage/rsvp/:token`)
- [x] Template-variabler: `{{name}}` (mottagarens namn), `{{rsvp_link}}` (personlig svarslänk)
- [x] RSVP-länk auto-appendas om `{{rsvp_link}}` inte finns i brödtexten
- [x] Eventinfo (namn, datum, tid, plats) visas i HTML-mailets footer
- [x] ResendProvider skickar både `text` (plaintext fallback) och `html`
- [x] Frontend: Hjälptext under meddelande-textarea om `{{name}}` och `{{rsvp_link}}`
- [x] Frontend: Toast visar antal misslyckade om det finns failures
- [x] Hela flödet verifierat live: skapa utskick → skicka → mail anländer → klicka RSVP → status "attending"

### Anteckningar
- Resend-domän verifierad i eu-west-1 (Ireland)
- `from`-adress: `Stage <noreply@mikwik.se>`
- `buildEmailHtml()` i `backend/src/services/email.ts` — table-baserad HTML för mailklient-kompatibilitet
- Consid-färger hårdkodade i HTML-mallen (CSS-variabler fungerar inte i mailklienter)
- Ingen ny migration behövdes
- Befintliga 21 tester passerar fortfarande

---

## Session 6: CSV-import av deltagare + fördefinierade mailmallar
**Datum:** 2026-02-22
**Status:** DONE

### Deliverables
- [x] Backend: POST /api/events/:id/participants/import — tar emot CSV-fil via multipart form-data
- [x] CSV-parser med stöd för `,` och `;` som separator, header-autodetektering (namn/email/företag/kategori på svenska och engelska)
- [x] Validering per rad: email-format, dubbletter (inom CSV + mot befintliga deltagare), felrapport med rad-nummer
- [x] Fallback till positionell parsning om ingen header-rad identifieras
- [x] `bulkCreateParticipants()` i db/queries.ts för effektiv batch-insättning
- [x] Frontend: ImportCSVModal med filuppladdning, förhandsgranskning (5 första rader), import-knapp
- [x] Frontend: Importresultat-vy med antal importerade/hoppade + detaljerade felmeddelanden per rad
- [x] "Importera CSV"-knapp i ParticipantsTab (både tom-state och lista-vy)
- [x] Frontend: API-klient `participantsApi.import()` + TanStack Query hook `useImportParticipants()`
- [x] 3 fördefinierade mailmallar: "Save the date", "Officiell inbjudan", "Påminnelse"
- [x] Varje mall har förpopulerad subject + body med `{{name}}` och `{{rsvp_link}}` variabler
- [x] Mall-väljare i CreateMailingModal — 3 klickbara kort med namn + beskrivning
- [x] Välja mall fyller i ämne + brödtext, användaren kan redigera fritt
- [x] 2 nya tester (CSV-import med headers + duplikat/valideringsfel) — totalt 23, alla passerar
- [x] SAD.md uppdaterad med ny endpoint

### Anteckningar
- Ingen ny migration krävdes — befintligt schema stödjer import
- CSV-parser stödjer vanliga svenska kolumnnamn (namn, e-post, företag, kategori) + engelska (name, email, company, category)
- CSV-parser hanterar citerade fält (dubbla citattecken)
- Mallarna är hårdkodade i frontend (inga backend-ändringar behövdes) — i Consid-profil med formella men varma texter
- Frontend Vite build: 348KB JS, 4.2KB CSS (gzipped: 102KB JS, 1.4KB CSS)

---

## Session 7: Väntlistelogik + Deltagarfiltrering + ICS-kalender
**Datum:** 2026-02-22
**Status:** DONE

### Deliverables
- [x] Backend: Waitlist-queries (`getAttendingCount`, `getNextWaitlisted`, `getMaxQueuePosition`, `promoteFromWaitlist`, `shouldWaitlist`) i `db/queries.ts`
- [x] Backend: Auto-waitlist vid POST /participants (sätter status "waitlisted" + queue_position om fullt)
- [x] Backend: Auto-waitlist vid CSV-import (räknar kapacitet löpande per rad)
- [x] Backend: Auto-promote vid PUT /participants/:id (status attending → annat → promote)
- [x] Backend: Auto-promote vid DELETE /participants/:id (om attending → promote)
- [x] Backend: Auto-promote vid POST /rsvp/:token/cancel (om attending → promote)
- [x] Backend: Kapacitetskontroll i POST /rsvp/:token/respond (waitlista om fullt)
- [x] Backend: PUT /participants/:id/reorder — omsortering av väntlistekö med positionsshift
- [x] Backend: GET /events/:id/calendar.ics — ICS-fil med VTIMEZONE Europe/Stockholm
- [x] Backend: ICS-kalenderlänk i email-HTML (via `buildEmailHtml()` + mailings send-logik)
- [x] Frontend: Sökfält i ParticipantsTab (filtrerar namn, email, företag, case-insensitive)
- [x] Frontend: Statusfilter-chips (Alla, Deltar, Inbjudna, Väntelista, Avböjda, Avbokade) med antal
- [x] Frontend: Kö-kolumn i deltagartabellen (visas bara om det finns waitlisted)
- [x] Frontend: Flytta upp/ner-knappar för väntlistade deltagare
- [x] Frontend: "Lägg till i kalender"-knapp på RSVP-bekräftelsesidan (klientsidesgenererad ICS)
- [x] Frontend: Kalenderknapp visas även för redan-attending deltagare
- [x] Frontend: API-klient `participantsApi.reorder()` + `useReorderParticipant()` hook
- [x] 4 nya tester (auto-waitlist, promote vid delete, promote vid statusändring, ICS endpoint) — totalt 27 tester
- [x] SAD.md uppdaterad med 2 nya endpoints
- [x] TESTPLAN.md uppdaterad med 11 nya testfall

### Anteckningar
- Ingen ny migration krävdes — befintligt schema har `queue_position` + `waitlisted` i participants
- Väntlistelogik tar hänsyn till `max_participants + overbooking_limit`
- ICS-generering finns på två ställen: backend (GET endpoint) och frontend (klientsida på RSVP-sidan)
- VTIMEZONE-blocket i ICS inkluderar både CET (vinter) och CEST (sommar)
- Sök + statusfilter kombineras med AND-logik, all filtrering klientsida
- Frontend Vite build: 355KB JS, 4.2KB CSS (gzipped: ~104KB JS, 1.4KB CSS)

---

## Session 8a: Backend-refaktorering + Processfixar
**Datum:** 2026-02-22
**Status:** DONE

### Deliverables
- [x] `docs/IMPLEMENTATION-PLAN.md` — kopierad från `~/.claude/plans/bubbly-weaving-pizza.md`
- [x] `docs/RECOVERY-PLAN.md` — rotorsaksanalys, avvikelser, sessionsordning
- [x] `docs/SESSION-GUIDE.md` — kompakta guider per resterande session (8-18)
- [x] Uppdaterad `CLAUDE.md` — plan-referens, arkitekturkrav, sessionsprotokoll, korrekt repostruktur
- [x] Service-layer: `event.service.ts`, `participant.service.ts`, `waitlist.service.ts`, `mailing.service.ts`, `rsvp.service.ts`
- [x] Email-uppdelning: `email.ts` (196 rader) → 5 filer under `services/email/` (interface, resend, console, factory, html-builder)
- [x] Queries-uppdelning: `queries.ts` (654 rader) → 4 domänfiler (`event.queries.ts`, `participant.queries.ts`, `mailing.queries.ts`, `waitlist.queries.ts`)
- [x] Tunna routes: events.ts 292→170, participants.ts 521→137, mailings.ts 196→74, rsvp.ts 143→79
- [x] 24 nya service-tester (event.service.test.ts: 10, participant.service.test.ts: 14)
- [x] Alla 51 tester passerar (27 befintliga + 24 nya)

### Avvikelser från plan
Session 8 delades i 8a + 8b pga kontextfönsterstorlek:
- **8a (denna):** Processfixar + services + email-uppdelning + queries-uppdelning + tester
- **8b (nästa):** Zod-validering + error-handler middleware + slutgiltig refaktorering av validering till centraliserad modul

Validering finns kvar inline i routes (events.ts) — flyttas till Zod i session 8b.

### Anteckningar
- Barrel-filer (`db/queries.ts`, `services/email/index.ts`) bevarar alla befintliga importvägar — inga ändringar i övriga filer behövdes
- participant.service.ts = 351 rader (inkl CSV-parsning + validering) — under 400-gränsen men kan delas ytterligare i framtiden
- Inga nya migrationer behövdes
- Inga frontend-ändringar

---

## Session 8b: Zod-validering + Error-handler middleware
**Datum:** 2026-02-22
**Status:** DONE

### Deliverables
- [x] `packages/shared/src/schemas.ts` — 7 Zod-schemas (createEvent, updateEvent, createParticipant, updateParticipant, createMailing, rsvpRespond, reorder)
- [x] `packages/shared/src/index.ts` — exporterar schemas
- [x] `backend/src/utils/validation.ts` — `parseBody()` wrapper som kastar ZodError
- [x] `backend/src/middleware/error-handler.ts` — global Hono onError (ZodError → 400, övriga → 500)
- [x] Error-handler registrerad i `backend/src/index.ts` via `app.onError(errorHandler)`
- [x] `events.ts` — inline `validateCreateEvent`/`validateUpdateEvent` ersatta med `parseBody(createEventSchema, body)`
- [x] `participants.ts` — inline-validering ersatt med Zod-parse
- [x] `mailings.ts` — `validateCreateMailing` borttagen, Zod-parse
- [x] `rsvp.ts` — inline status-validering ersatt med `parseBody(rsvpRespondSchema, body)`
- [x] `participant.service.ts` — `validateCreateParticipant`/`validateUpdateParticipant` borttagna
- [x] `mailing.service.ts` — `validateCreateMailing` borttagen
- [x] DB query-filer (`event.queries.ts`, `participant.queries.ts`, `mailing.queries.ts`) — input-interfaces ersatta med re-export av Zod-typer
- [x] `participant.service.test.ts` — uppdaterade tester att använda `createParticipantSchema.safeParse()` istf borttagna funktioner
- [x] Alla 51 tester passerar
- [x] SAD.md uppdaterad med validering, error-handler, nya moduler
- [x] TESTPLAN.md uppdaterad med 6 nya testfall + TC-0.4

### Avvikelser från plan
Inga avvikelser — sessionen följde planen exakt.

### Anteckningar
- Zod redan installerad i `packages/shared` (version ^3.25.76)
- DB-lagren behåller `??`-fallbacks (t.ex. `status ?? "planning"`) — Zod validerar format/enum men applicerar inte defaults, DB hanterar defaults
- Netto: -199 rader kod (88 tillagda, 287 borttagna) — validering mer koncis med Zod
- Inga nya migrationer behövdes
- Inga frontend-ändringar

---

### Avvikelser från plan — Session 0-7 (retrospektiv)

| # | Avvikelse | Fixad i |
|---|-----------|---------|
| 1 | Ingen service-layer (all logik i routes) | 8a ✅ |
| 2 | Ingen Zod-validering | 8b ✅ |
| 3 | Ingen error-handler middleware | 8b ✅ |
| 4 | Tom middleware/ | 8b ✅ |
| 5 | Ingen R2-integration | 9 ✅ |
| 6 | Ingen dnd-kit för väntlista | 9 ✅ |
| 7 | Email i en fil (196 rader) | 8a ✅ |
| 8 | Ingen email-queue/Cron Trigger | 11 ✅ |
| 9 | Frontend-mallar istf backend | 11 ✅ |
| 10 | EventDetail.tsx = 1727 rader | 9 ✅ |
| 11 | Tom features/ mapp | 9 ✅ |
| 12 | queries.ts = 654 rader | 8a ✅ |
| 13 | Duplicerad validering | 8b ✅ |
| 14 | Inga enhetstester för services | 8a ✅ |
| 15 | CLAUDE.md matchar inte verkligheten | 8a ✅ |
| 16 | Saknar CSV-export endpoint | 9 ✅ |

---

## Session 9: Frontend-refaktorering + R2 + dnd-kit + CSV-export
**Datum:** 2026-02-22
**Status:** DONE

### Deliverables
- [x] EventDetail.tsx bruten från 1727 → 176 rader (< 200)
- [x] 10 nya filer under `frontend/src/components/features/`:
  - `events/SummaryTab.tsx` — sammanfattningstab med statistik + eventinfo
  - `participants/ParticipantsTab.tsx` — deltagartabell, sök, filter, export
  - `participants/AddParticipantModal.tsx` — lägg till deltagare
  - `participants/ImportCSVModal.tsx` — CSV-import
  - `participants/WaitlistPanel.tsx` — dnd-kit drag-n-drop för väntlista
  - `email/MailingsTab.tsx` — utskickslista + förhandsgranskning
  - `email/CreateMailingModal.tsx` — skapa utskick + mallväljare
  - `shared-styles.ts` — delade CSS-styles
  - `shared-helpers.ts` — delade hjälpfunktioner
  - `shared-icons.tsx` — delade SVG-ikoner
- [x] R2-bilduppladdning: `image.service.ts` (validering: JPEG/PNG/WebP, max 5 MB), `routes/images.ts` (POST + GET)
- [x] R2-bucket aktiverad i `wrangler.toml` + `bindings.ts` (IMAGES binding)
- [x] dnd-kit installerad (`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`)
- [x] WaitlistPanel med drag-n-drop — ersätter chevron-knappar (behålls i tabellen som fallback)
- [x] CSV-export: `GET /api/events/:id/participants/export` — returnerar CSV med header + data
- [x] CSV-export: `ParticipantService.exportCSV()` med `escapeCSVField()` för korrekt CSV-formatering
- [x] Frontend: "Exportera CSV"-knapp i ParticipantsTab
- [x] 1 nytt test (CSV-export) — totalt 52 tester, alla passerar
- [x] SAD.md uppdaterad med nya endpoints, R2-integration, ImageService
- [x] TESTPLAN.md uppdaterad med nya testfall + TC-0.4

### Avvikelser från plan
Inga avvikelser — alla leverabler uppfyllda.

### Bugfixar efter session
- [x] **Modal-staplingsbugg:** `<dialog>` med inline `display: flex` överskrev webbläsarens `display: none` för stängda dialoger → alla modaler synliga simultant. Fix: Modal returnerar `null` när `open={false}` (villkorlig rendering)
- [x] **Dubbla modalstates:** ParticipantsTab hade separata `showAddModal`/`showImportModal` booleans → möjliggjorde att båda var `true` samtidigt. Fix: ersatt med `useState<'add' | 'import' | null>(null)`

### Anteckningar
- R2-bucket `stage-images` behöver skapas med `wrangler r2 bucket create stage-images` innan deploy
- IMAGES binding är optional (`R2Bucket?`) — images route returnerar 503 om bucket ej konfigurerad
- dnd-kit tillagd som npm dependency (ej CDN)
- Chevron-knappar behålls i huvudtabellen som komplement till drag-n-drop i WaitlistPanel
- Delade hjälpare (styles, helpers, icons) undviker duplicering mellan feature-komponenter
- Frontend build: 462KB JS, 4.2KB CSS (gzipped: ~135KB JS, 1.4KB CSS) — ökning från dnd-kit
- Inga nya migrationer behövdes

---

## Session 10: Behörighetssystem
**Datum:** 2026-02-22
**Status:** DONE

### Deliverables
- [x] `migrations/0003_event_permissions.sql` — users + event_permissions tabeller
- [x] `backend/src/middleware/auth.ts` — AuthProvider interface + tokenAuthProvider + authMiddleware (X-Auth-Token)
- [x] `backend/src/services/permission.service.ts` — rollkontroll (canView/canEdit/isOwner), CRUD behörigheter, auto-owner
- [x] `backend/src/db/user.queries.ts` — getUserByEmail, getUserByToken, createUser, getOrCreateUser
- [x] `backend/src/db/permission.queries.ts` — getPermission, listPermissions, addPermission, removePermission
- [x] `backend/src/routes/auth.ts` — POST /api/auth/login, GET /api/auth/me
- [x] `backend/src/routes/permissions.ts` — GET/POST/DELETE /api/events/:id/permissions
- [x] Alla befintliga endpoints skyddade med auth-middleware (events, participants, mailings, images)
- [x] Health + RSVP + Auth förblir publika
- [x] Rollbaserad åtkomstkontroll: owner (full), editor (redigera), viewer (läsa)
- [x] Auto-owner: eventskapare blir automatiskt owner
- [x] Event-lista filtrerad per användarbehörigheter (listEventsForUser)
- [x] `frontend/src/pages/Login.tsx` — inloggningssida med Consid-branding
- [x] `frontend/src/hooks/useAuth.tsx` — AuthProvider/Context, localStorage-persist, login/logout
- [x] `frontend/src/hooks/usePermissions.ts` — usePermissions, useAddPermission, useRemovePermission
- [x] `frontend/src/components/features/settings/PermissionsPanel.tsx` — behörighetshantering i Inställningar-tab
- [x] Sidebar: användarinfo + utloggningsknapp
- [x] Route guards: RequireAuth redirect till /login, GuestOnly redirect till /
- [x] API-klient skickar X-Auth-Token i alla requests
- [x] `packages/shared` — User, EventPermission, Role typer + loginSchema, addPermissionSchema
- [x] 8 nya permission-tester + 2 nya auth-tester — totalt 61 tester, alla passerar
- [x] Befintliga integrationstester uppdaterade med auth-setup
- [x] SAD.md uppdaterad med nya endpoints, tabeller, auth-sektion, schemas
- [x] TESTPLAN.md uppdaterad med 12 nya testfall + TC-0.4

### Avvikelser från plan
Inga avvikelser — alla leverabler uppfyllda.

### Anteckningar
- AuthProvider interface designat för framtida Azure AD swap — byt `tokenAuthProvider` mot ny implementation
- Token lagras i localStorage och skickas som `X-Auth-Token` header
- Login-endpointen gör get-or-create: returnerar befintlig token om email finns, skapar nytt konto annars
- Inga CSS-moduler tillagda — inline styles konsekvent med befintlig kodbas
- Inga nya npm dependencies
- Migration 0003 behöver köras på remote: `npx wrangler d1 execute stage_db_v2 --remote --file=migrations/0003_event_permissions.sql`

---

## Session 11: Email-förbättringar + Aktivitetslogg + Sök
**Datum:** 2026-02-22
**Status:** DONE

### Deliverables
- [x] `migrations/0004_activities.sql` — activities + email_queue tabeller med index
- [x] `packages/shared/src/types.ts` — Activity, EmailQueueItem interfaces
- [x] `packages/shared/src/constants.ts` — ACTIVITY_TYPE (10 typer), EMAIL_QUEUE_STATUS
- [x] 6 email-mallar i `backend/src/services/email/templates/`: save-the-date, invitation, waitlist, confirmation, reminder, thank-you
- [x] `backend/src/services/email/template-renderer.ts` — merge fields ({{name}}, {{event}}, {{datum}}, {{tid}}, {{plats}}, {{rsvp_link}}, {{calendar_link}}), renderEmail()
- [x] `backend/src/services/email/send-queue.ts` — enqueueEmails(), processQueue() (batch 20), getQueueStats()
- [x] Cron Trigger aktiverat i `wrangler.toml` (`*/5 * * * *`) + scheduled() handler i index.ts
- [x] `backend/src/db/activity.queries.ts` — listActivities, createActivity
- [x] `backend/src/services/activity.service.ts` — log, logMailingCreated, logMailingSent, logParticipantAdded, logParticipantRemoved, logParticipantStatusChanged, logParticipantImported, logEventUpdated, logPermissionAdded, logPermissionRemoved
- [x] `backend/src/routes/activities.ts` — GET /api/events/:id/activities (viewer+)
- [x] `backend/src/routes/search.ts` — GET /api/search?q= (auth, filtrerat per behörighet)
- [x] GET /api/templates — lista email-mallmetadata (auth)
- [x] Aktivitetsloggning integrerad i routes: events (create/update), participants (add/import/delete), mailings (create/send), permissions (add)
- [x] `mailing.service.ts` omskriven — template-renderer + smart sändning (≤5 direkt, >5 via kö)
- [x] `frontend/src/hooks/useActivities.ts`, `useSearch.ts`, `useTemplates.ts` — TanStack Query hooks
- [x] `frontend/src/components/features/events/ActivityTimeline.tsx` — tidslinje med ikoner per typ, relativa tidsstämplar
- [x] `frontend/src/components/layout/SearchBar.tsx` — autocomplete med tangentbordsnavigering, click-outside close
- [x] SummaryTab.tsx — integrerar ActivityTimeline
- [x] Topbar.tsx — integrerar SearchBar
- [x] CreateMailingModal.tsx — hämtar mallar från backend istf hårdkodade
- [x] `frontend/src/api/client.ts` — activitiesApi, searchApi, templatesApi
- [x] 5 nya tester (activity.service.test.ts) — totalt 66 tester, alla passerar
- [x] 4 befintliga testfiler uppdaterade med activities + email_queue tabeller i beforeAll
- [x] SAD.md uppdaterad med 3 nya endpoints, 2 nya tabeller, Cron Trigger, mallar, uppdaterat emailflöde
- [x] TESTPLAN.md uppdaterad med 13 nya testfall + TC-0.4 uppdaterad till 66

### Avvikelser från plan
Inga avvikelser — alla leverabler uppfyllda.

### Anteckningar
- Export i index.ts ändrad från `export default app` till `export default { fetch: app.fetch, async scheduled() { ... } }` för Cron Trigger-stöd
- Email-kö: ≤5 mottagare skickas direkt, >5 köas för Cron-processning (respekterar Resend rate limits)
- Mallar definierade som TypeScript-objekt i backend — exponeras via GET /api/templates för frontend
- ActivityTimeline visar 20 senaste händelserna med emoji-ikoner och relativa tidsstämplar
- SearchBar söker via SQL LIKE på namn, plats och arrangör, filtrerat per användarens behörigheter
- Migration 0003 + 0004 behöver köras på remote innan nästa deploy
- Frontend build: 477KB JS, 4.2KB CSS

---

## Planerad: Migrering till Consid-ägd miljö

**När:** Efter att alla utvecklingssessioner är klara
**Vad:** En dedikerad session för att ta fram en komplett migreringsplan och checklista för att flytta Stage från mikwik.se till Consid-ägd infrastruktur (event.consid.se).

Ska inkludera:
- Checklista för DNS, domän, Cloudflare-konto (eller annan hosting)
- Flytt från Resend → Consid MS 365 (Graph API med delade brevlådor)
- Avsändardomän, SPF/DKIM/DMARC för consid.se
- D1-databas och secrets i Consids konto
- SSL/TLS-certifikat
- Azure AD/Entra ID-autentisering
- GDPR-krav (DPIA, PuB-avtal med tredjeparter)
- Vad som kan/bör göras av någon annan utan AI (IT-avdelning, DNS-admin, DPO, etc.)

**Status:** EJ PÅBÖRJAD — planeras som avslutande session

---

## Migrations-logg

| Migration | Fil | Tabeller | Lokal | Remote |
|-----------|-----|----------|-------|--------|
| 0001 | events_participants.sql | events, participants | ❌ | ✅ |
| 0002 | mailings.sql | mailings | ❌ | ✅ |
| 0003 | event_permissions.sql | users, event_permissions | ❌ | ❌ |
| 0004 | activities.sql | activities, email_queue | ❌ | ❌ |
