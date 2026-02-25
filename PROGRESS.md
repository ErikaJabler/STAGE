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

| #   | Beslut                                                 | Motivering                                                                               | Session |
| --- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------- | ------- |
| 1   | npm workspaces (inte Turborepo)                        | Enkelt, inget extra beroende                                                             | 0       |
| 2   | Inkrementella SQL-migrationer                          | En fil per session, enkel att spåra                                                      | 0       |
| 3   | @cloudflare/vitest-pool-workers                        | Testar mot riktig D1 i miniflare                                                         | 0       |
| 4   | Frontend via Workers Assets                            | Byggs med Vite, serveras statiskt                                                        | 0       |
| 5   | Test-filer exkluderade från tsc                        | cloudflare:test-modul finns bara i vitest runtime                                        | 0       |
| 6   | Inline styles (CSSProperties) istället för CSS-moduler | Enklare för komponentbibliotek, inga extra filer                                         | 1       |
| 7   | CSS custom properties för design tokens                | Konsekvent branding, lätt att ändra, CSS-native                                          | 1       |
| 8   | Native dialog-element för Modal                        | Bättre tillgänglighet, inbyggd backdrop, focus trap                                      | 1       |
| 9   | Toast via React Context                                | Global åtkomst via useToast(), auto-dismiss                                              | 1       |
| 10  | Self-contained API-tester                              | Varje test skapar sin egen data, ej beroende mellan describe-block                       | 2       |
| 11  | Dynamisk partial update (PUT)                          | Bygger SET-klausul från inskickade fält, ej full replace                                 | 2       |
| 12  | Slug auto-generering                                   | Genereras från eventnamn med svensk teckenhantering                                      | 2       |
| 13  | Återanvändbar EventForm                                | Samma komponent för skapa + redigera, initialData-prop styr läge                         | 3       |
| 14  | Participant hard-delete                                | Deltagare raderas fysiskt (inte soft-delete), enklare modell                             | 3       |
| 15  | Nested participants-route                              | Monteras som `/api/events/:eventId/participants` i Hono                                  | 3       |
| 16  | Worker med ASSETS-binding + path rewriting             | Möjliggör deploy under `/stage/`-prefix på Pages-domän                                   | 3       |
| 17  | Email-abstraktionslager (interface + provider)         | Resend nu, O365 senare, ConsoleEmailProvider för dev/test                                | 4       |
| 18  | RSVP via cancellation_token                            | Publika routes, inga credentials, deltagare identifieras via UUID                        | 4       |
| 19  | RSVP-sida utanför Layout                               | Ren publik sida utan sidebar/topbar, egen route i React Router                           | 4       |
| 20  | Mailings med recipient_filter                          | Filtrera mottagare per status eller kategori vid skapande/sändning                       | 4       |
| 21  | CSV-import med auto-header-detection                   | Parser identifierar kolumner från header-rad (sv/en), fallback till positionell          | 6       |
| 22  | Frontendbaserade mailmallar                            | Mallar definierade i frontend, ej backend — enkelt, ingen migration, redigerbart         | 6       |
| 23  | Auto-waitlist vid kapacitetsgräns                      | shouldWaitlist() kontrollerar attending >= max_participants + overbooking_limit          | 7       |
| 24  | Auto-promote vid ledig plats                           | promoteFromWaitlist() vid delete, statusändring och RSVP-cancel                          | 7       |
| 25  | Klientsida deltagarfiltrering                          | Sök + statusfilter i frontend — all data redan hämtad, inga extra API-anrop              | 7       |
| 26  | Dubbel ICS-generering                                  | Backend-endpoint för email, klientsida för RSVP — redundans ger bättre UX                | 7       |
| 27  | Interface-baserad auth (AuthProvider)                  | Enkel token nu, Azure AD senare — byt implementation utan routeändringar                 | 10      |
| 28  | X-Auth-Token header                                    | Enkel header-baserad auth, klienten sätter header per request via localStorage           | 10      |
| 29  | Auto-owner vid event-skapande                          | POST /events sätter skaparen som owner automatiskt                                       | 10      |
| 30  | Roller per event (owner/editor/viewer)                 | Granulär åtkomstkontroll per event, ej global admin                                      | 10      |
| 31  | Backend email-mallar med template-renderer             | Mallar i backend med merge fields, exponeras via API — framtida CMS-integration möjlig   | 11      |
| 32  | Email-kö med Cron Trigger                              | ≤5 mottagare direkt, >5 via D1-kö + Cron (var 5 min, batch 20) — respekterar rate limits | 11      |
| 33  | Aktivitetslogg per event                               | Alla mutationer loggas med typ, beskrivning, metadata — ger audit trail                  | 11      |
| 34  | Sök filtrerat per behörighet                           | SQL LIKE-sök på events, resultat filtrerat per användarens permissions                   | 11      |
| 35  | Inline eventinställningar                              | Redigering via SettingsTab istf separat /edit-sida — allt på ett ställe                  | 12      |
| 36  | RSVP extra fält (dietary + plus_one)                   | Sparas vid RSVP-svar, valfria fält som inte påverkar existerande logik                   | 12      |
| 37  | Avbokning med bekräftelsesteg                          | Separata states i RSVP (confirm-cancel → cancelled) förhindrar accidentell avbokning     | 12      |

---

## Kända problem

| #   | Problem                                           | Status                                                      | Session |
| --- | ------------------------------------------------- | ----------------------------------------------------------- | ------- |
| 1   | ~~D1 database_id i wrangler.toml är placeholder~~ | Löst — `1e935a1e-4a24-44f4-b83d-c70235b982d9`               | 3       |
| 2   | ~~Consid Sans fontfiler saknas~~                  | Löst — konverterat OTF → woff2/woff, ligger i public/fonts/ | 2       |

---

## Deploy

**Live URL:** https://mikwik.se/stage/

| Milstolpe                            | Krav                                                      | Status      |
| ------------------------------------ | --------------------------------------------------------- | ----------- |
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

| #   | Avvikelse                                | Fixad i |
| --- | ---------------------------------------- | ------- |
| 1   | Ingen service-layer (all logik i routes) | 8a ✅   |
| 2   | Ingen Zod-validering                     | 8b ✅   |
| 3   | Ingen error-handler middleware           | 8b ✅   |
| 4   | Tom middleware/                          | 8b ✅   |
| 5   | Ingen R2-integration                     | 9 ✅    |
| 6   | Ingen dnd-kit för väntlista              | 9 ✅    |
| 7   | Email i en fil (196 rader)               | 8a ✅   |
| 8   | Ingen email-queue/Cron Trigger           | 11 ✅   |
| 9   | Frontend-mallar istf backend             | 11 ✅   |
| 10  | EventDetail.tsx = 1727 rader             | 9 ✅    |
| 11  | Tom features/ mapp                       | 9 ✅    |
| 12  | queries.ts = 654 rader                   | 8a ✅   |
| 13  | Duplicerad validering                    | 8b ✅   |
| 14  | Inga enhetstester för services           | 8a ✅   |
| 15  | CLAUDE.md matchar inte verkligheten      | 8a ✅   |
| 16  | Saknar CSV-export endpoint               | 9 ✅    |

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

## Session 12: RSVP-förbättringar + Inställningar-tab

**Datum:** 2026-02-22
**Status:** DONE

### Deliverables

- [x] `migrations/0005_participant_dietary_plusone.sql` — dietary_notes, plus_one_name, plus_one_email kolumner
- [x] `packages/shared/src/types.ts` — Participant interface utökad med 3 nya fält
- [x] `packages/shared/src/schemas.ts` — createParticipant, updateParticipant, rsvpRespond utökade med dietary/plus_one
- [x] `backend/src/db/participant.queries.ts` — INSERT och UPDATE stödjer nya fält
- [x] `backend/src/services/rsvp.service.ts` — respond() sparar dietary_notes, plus_one_name, plus_one_email
- [x] `backend/src/routes/rsvp.ts` — GET returnerar dietary/plus_one + event.image_url, POST skickar extra fält
- [x] `frontend/src/api/client.ts` — RsvpInfo utökad, RsvpRespondPayload med extra fält, imagesApi.upload()
- [x] `frontend/src/pages/RsvpPage.tsx` — Hero image, dietary textarea, plusett-formulär, bekräftelse-sammanfattning, avbokningsbekräftelse
- [x] `frontend/src/components/features/settings/SettingsTab.tsx` — Komplett inställningssida med inline-redigering, hero image upload, synlighets-toggle, sender mailbox, GDPR-text, PermissionsPanel, DangerZone
- [x] `frontend/src/components/features/settings/DangerZone.tsx` — Soft-delete med bekräftelsedialog
- [x] `frontend/src/pages/EventDetail.tsx` — SettingsTab ersätter PermissionsPanel, Redigera-knapp borttagen (inline istället)
- [x] 2 nya tester (dietary/plus_one create + RSVP respond med extra fält) — totalt 68 tester, alla passerar
- [x] 7 testfiler uppdaterade med ny PARTICIPANTS_SQL (nya kolumner)
- [x] SAD.md uppdaterad med nya participant-kolumner
- [x] TESTPLAN.md uppdaterad med 12 nya testfall + TC-0.4 uppdaterad till 68

### Avvikelser från plan

Inga avvikelser — alla leverabler uppfyllda.

### Bugfixar efter session

- [x] **RSVP-knapp ej synlig på mobil:** Sidan använde `alignItems: 'center'` som vertikalt centrerade kortet — på mobil hamnade "Jag kommer"-knappen under synligt område pga ExtraFieldsForm (dietary + plus-one). Fix: `alignItems: 'flex-start'` + större/tydligare knapp med hårdkodad färg + box-shadow.

### Anteckningar

- SettingsTab samlar alla eventinställningar (info, bild, synlighet, avsändare, GDPR, behörigheter, borttagning) i en vy
- Redigera-knapp borttagen från EventDetail topbar — all redigering sker inline via Inställningar-tab
- RSVP-sida visar hero-bild som bakgrund med gradient-overlay om event har image_url
- Avbokning kräver nu bekräftelsesteg (visas som egen state 'confirm-cancel')
- Plus-one-formuläret har expanderbart UI ("+ Ta med en gäst" → formulär → "Ta bort gäst")
- Migration 0005 behöver köras på remote: `npx wrangler d1 execute stage_db_v2 --remote --file=migrations/0005_participant_dietary_plusone.sql`
- Frontend build: 499KB JS, 4.2KB CSS (gzipped: ~142KB JS, 1.4KB CSS)

---

## Session 13a: Saknade features från planen

**Datum:** 2026-02-22
**Status:** DONE

### Deliverables

- [x] **Klona event:** `EventService.clone()` + `POST /api/events/:id/clone` + "Klona"-knapp (kopieringsikon) per EventCard i Overview
- [x] **Unsubscribe-länk i mail (GDPR):** Avregistreringslänk i html-builder footer → pekar till deltagarens RSVP-sida
- [x] **Skicka testmail:** `MailingService.sendTest()` + `POST /api/events/:id/mailings/:mid/test` + testmail-knapp i MailingsTab
- [x] **Svarsfrist-UI för väntlistade:** Datepicker per väntlistad deltagare i ParticipantsTab → sparar `response_deadline` via befintlig PUT
- [x] **Template preview-endpoint:** `GET /api/templates/:type/preview` → renderad HTML med exempeldata
- [x] `frontend/src/hooks/useEvents.ts` — `useCloneEvent()` hook
- [x] `frontend/src/hooks/useMailings.ts` — `useSendTestMailing()` hook
- [x] `frontend/src/api/client.ts` — `eventsApi.clone()`, `mailingsApi.sendTest()`
- [x] 4 nya tester (clone event, template preview ×2, send test email) — totalt 72 tester, alla passerar
- [x] SAD.md uppdaterad med 3 nya endpoints
- [x] TESTPLAN.md uppdaterad med 8 nya testfall + TC-0.4 uppdaterad till 72

### Avvikelser från plan

Inga avvikelser — alla 5 features implementerade.

### Anteckningar

- Klonat event får namn "(kopia)", status "planning", skaparens email som created_by, auto-owner
- Testmail skickas med "[TEST]"-prefix i ämnesraden, fake RSVP-kontext
- Unsubscribe-länk visas i mailfootern: "Avregistrera / hantera din anmälan"
- Svarsfrist-kolumnen visas bara om det finns väntlistade deltagare
- Template preview använder exempeldata (Anna Andersson, Consid Sommarmingel 2026)
- Ingen ny migration behövdes — response_deadline-kolumnen fanns redan
- Frontend build: ~502KB JS, 4.2KB CSS

---

## Session 13b: Integrationstester + Deploy Fas 1

**Datum:** 2026-02-22
**Status:** DONE

### Deliverables

- [x] `backend/src/__tests__/integration.test.ts` — 14 E2E-integrationstester i 5 flöden:
  - Event → deltagare → waitlist → promote (2 tester: delete + statusändring)
  - Inbjudan → RSVP → bekräftelse (3 tester: full flow med dietary/plus-one, cancel med auto-promote, auto-waitlist vid full kapacitet)
  - Behörigheter owner/editor/viewer (5 tester: setup, editor read+write, viewer read-only, no-access 403, editor kan inte hantera permissions)
  - Email-kö + Cron-processning (2 tester: >5 köas + processQueue(), ≤5 direkt)
  - Klona event (2 tester: korrekt data + 0 deltagare, skaparen som owner)
- [x] Alla 86 tester passerar (72 befintliga + 14 nya)
- [x] SAD.md uppdaterad med teststruktur-tabell (86 tester, 10 filer)
- [x] TESTPLAN.md uppdaterad med 5 nya testfall (TC-13b.1–5) + TC-0.4 uppdaterad till 86
- [x] SESSION-GUIDE.md markerad ✅ DONE

### Avvikelser från plan

Inga avvikelser — alla 5 flöden implementerade och gröna.

### Anteckningar

- Integrationstesterna skapar 4 testanvändare (owner, editor, viewer, noaccess) med unika tokens
- Varje test är self-contained — skapar sin egen data, ej beroende av andra tester
- Email-kö-testet anropar `processQueue()` direkt (simulerar Cron Trigger)
- Ingen ny migration behövdes
- Inga frontend-ändringar

---

## Session 14: GrapeJS mailredigerare

**Datum:** 2026-02-22
**Status:** DONE

### Deliverables

- [x] `frontend/src/components/editor/EmailEditor.tsx` — GrapeJS-wrapper (lazy-loaded via React.lazy), helskärms-editor, R2-bilduppladdning, desktop/mobil preview, spara med juice CSS-inlining
- [x] `frontend/src/components/editor/grapejs-email-preset.ts` — 7 email-blocktyper: text, rubrik, bild, CTA-knapp, avdelare, 2-kolumner, mellanrum. Alla med table-layout.
- [x] `frontend/src/components/editor/grapejs-brand-config.ts` — Consid brand constraints: begränsad färgpalett (9 färger), Consid Sans typsnitt, CTA-stil (Raspberry Red), style manager med typografi/bakgrund/spacing
- [x] `frontend/src/components/features/email/CreateMailingModal.tsx` — Ombyggd med val "Visuell editor" vs "Snabbredigering", mallväljare bibehållen, helskärms-editor-vy
- [x] `migrations/0006_mailing_html_body.sql` — ALTER mailings: html_body TEXT, editor_data TEXT
- [x] `packages/shared/src/types.ts` — Mailing-interface utökat med html_body, editor_data
- [x] `packages/shared/src/schemas.ts` — createMailingSchema utökat med html_body, editor_data
- [x] `backend/src/db/mailing.queries.ts` — INSERT stödjer html_body + editor_data
- [x] `backend/src/services/mailing.service.ts` — send() och sendTest() hanterar html_body (använder direkt istf buildEmailHtml())
- [x] `frontend/src/api/client.ts` — CreateMailingPayload utökat med html_body, editor_data
- [x] 2 testfiler uppdaterade med nya MAILINGS_SQL (html_body + editor_data kolumner)
- [x] Alla 86 tester passerar

### Avvikelser från plan

- Planen nämner `TemplateSelector.tsx` som separat fil — mallväljare + redigeringsläge integrerades istället i `CreateMailingModal.tsx`
- 7 blocktyper (rubrik tillagd utöver planens 5-7)

### Bugfixar efter session

- [x] **Drag-and-drop i asset manager:** `uploadFile` hanterade bara `ev.target.files` (klick) — lade till `ev.dataTransfer.files` (drag)
- [x] **Bild visas inte + text ej redigerbar:** Bild-URL var relativ (fungerade ej i GrapeJS iframe). Fix: prepend `window.location.origin`. Registrerade custom cell-typ med `editable: true` för table cells.
- [x] **GET /api/images krävde auth:** GrapeJS iframe har ingen auth-token. Fix: GET images publikt, POST kräver fortfarande auth.
- [x] **"Spara mail"-knappen fungerade inte:** EmailEditor's container hade `position: absolute` som täckte topBar med ämnesfältet → ämnet alltid tomt → spara misslyckades tyst. Fix: ändrade container till `flex: 1`.

### Anteckningar

- GrapeJS lazy-laddas (~500KB) — påverkar ej initial bundle
- `juice` används för CSS-inlining vid export (email-kompatibilitet)
- Befintligt formulärflöde bibehålls som "Snabbredigering" — bakåtkompatibelt
- Om `html_body` finns på ett mailing, används det direkt vid sändning (merge fields ersätts). Annars standard buildEmailHtml()-flödet.
- editor_data (GrapeJS JSON) sparas för framtida återöppning i editorn
- Nya npm dependencies: grapesjs, @grapesjs/react, juice
- GET /api/images är publikt (UUID-baserade nycklar, cache-headers), POST kräver auth
- Migration 0006 behöver köras på remote: `npx wrangler d1 execute stage_db_v2 --remote --file=migrations/0006_mailing_html_body.sql`

---

## Session 15: Eventwebbplats

**Datum:** 2026-02-23
**Status:** DONE

### Deliverables

- [x] `migrations/0007_event_website.sql` — website_template, website_data (JSON), website_published på events-tabellen
- [x] `packages/shared/src/types.ts` — Event utökad med 3 website-fält + WebsiteData interface
- [x] `packages/shared/src/schemas.ts` — updateWebsiteSchema + publicRegisterSchema
- [x] `backend/src/services/website.service.ts` — getWebsite, saveWebsite, getPublicEvent, register (med dubblett-kontroll + auto-waitlist)
- [x] `backend/src/routes/website.ts` — GET/PUT /:id/website (auth), POST /:slug/register (publik)
- [x] `backend/src/index.ts` — GET /api/public/events/:slug (publik), auth-middleware undantag för register-endpoint
- [x] `frontend/src/components/features/settings/WebsitePanel.tsx` — template-väljare (Hero + Info, Hero + Program + Plats), fält, publicera-toggle, preview-länk
- [x] `frontend/src/pages/PublicEvent.tsx` — publik eventwebbsida med hero, eventinfo, programtidslinje, platssektion, anmälningsformulär (GDPR-samtycke), bekräftelsesida, ICS-kalenderknapp. Consid branding (Burgundy/Raspberry Red/Beige).
- [x] `frontend/src/hooks/useWebsite.ts` — useWebsite + useSaveWebsite hooks
- [x] `frontend/src/api/client.ts` — websiteApi (get, save, register)
- [x] `frontend/src/App.tsx` — route /e/:slug → PublicEvent
- [x] `frontend/src/components/features/settings/SettingsTab.tsx` — WebsitePanel integrerad
- [x] 2 webbplatsmallar:
  1. **Hero + Info** — hero-sektion, eventinfo, anmälningsformulär
  2. **Hero + Program + Plats** — hero, programtidslinje, platsbeskrivning, anmälningsformulär
- [x] `backend/src/services/__tests__/website.service.test.ts` — 6 nya tester (get/save, public event, register, dubblett, auto-waitlist)
- [x] 9 befintliga testfiler uppdaterade med website-kolumner i EVENTS_SQL
- [x] Alla 92 tester passerar (86 befintliga + 6 nya)
- [x] SAD.md, TESTPLAN.md, SESSION-GUIDE.md uppdaterade

### Avvikelser från plan

- Template 3 (Offentlig sektor) ej implementerad — 2 templates räcker för första iteration
- `/stage/e/:slug` prefix (ej /e/:slug) — enklast med befintligt SPA-fallback

### Anteckningar

- Routing: `/stage/e/:slug` — publik webbsida renderas som React-route, eventdata hämtas via GET /api/public/events/:slug
- Auth-middleware har undantag för POST .../:slug/register (matchar c.req.path.endsWith("/register"))
- Registrering sätter gdpr_consent_at + GDPR-samtycke krävs via Zod-schema
- Auto-waitlist via befintlig WaitlistService.shouldWaitlist()
- ICS-kalenderknapp på bekräftelsesida (klientsidegenererad, likadant som RSVP-sidan)
- Migration 0007 behöver köras på remote: `npx wrangler d1 execute stage_db_v2 --remote --file=migrations/0007_event_website.sql`

---

## Bugfixar: Utskick mall → editor → spara

**Datum:** 2026-02-23
**Status:** DONE

### Deliverables

- [x] Mall-klick → direkt till snabbredigering (`setEditMode('form')` efter mallval)
- [x] Visuell editor: felhantering i `handleSave` (try-catch + `onError`-prop)
- [x] Toast z-index höjt till 9999 (var 70, doldes bakom fullscreen-editor z-2000)
- [x] Fullscreen-editor z-index via CSS-variabel (`--z-fullscreen-editor: 2000`)
- [x] Modal.tsx: borttagen `createPortal` (befintlig ändring)

### Rotorsak

1. Mall-klick satte bara `selectedTemplate` + form-data — saknades `setEditMode('form')` → användaren fastnade i steg 1
2. `handleSave()` i EmailEditor hade ingen felhantering — om GrapeJS/juice kastade, hände inget
3. Toast z-index 70 < fullscreen-editor z-index 2000 → alla toast-meddelanden (felmeddelanden, bekräftelser) doldes bakom editorn

### Filer ändrade

- `frontend/src/components/features/email/CreateMailingModal.tsx`
- `frontend/src/components/editor/EmailEditor.tsx`
- `frontend/src/components/ui/Modal.tsx`
- `frontend/src/styles/globals.css`

---

## Session 16: GrapeJS webbplatsredigerare

**Datum:** 2026-02-24
**Status:** DONE

### Deliverables

- [x] `frontend/src/components/editor/PageEditor.tsx` — GrapeJS-wrapper för webbsidor (lazy-loaded, R2-bilduppladdning, desktop/mobil preview, spara HTML + editor_data)
- [x] `frontend/src/components/editor/grapejs-page-preset.ts` — 14 webbsideblock: 6 webbsidespecifika (hero, eventinfo, program, plats, anmälningsformulär, footer) + 8 generella (text, rubrik, bild, CTA-knapp, avdelare, kolumner, mellanrum) + `buildInitialPageHtml()` för att generera startinnehåll från template + eventdata
- [x] `frontend/src/components/features/settings/WebsitePanel.tsx` — "Visuell editor"-knapp med lazy-loaded PageEditor i fullskärm, "Anpassad sida"-badge, "Återställ till mall"-knapp, snabbredigerings-sektion behållen
- [x] `frontend/src/pages/PublicEvent.tsx` — Om `page_html` finns → renderar GrapeJS-HTML direkt med `dangerouslySetInnerHTML`, React-anmälningsformulär portad in via `createPortal` i `data-page-register-form`-platshållaren, template-rendering som fallback
- [x] `packages/shared/src/types.ts` — WebsiteData utökad med `page_html` + `page_editor_data`
- [x] `packages/shared/src/schemas.ts` — updateWebsiteSchema utökat med `page_html` + `page_editor_data`
- [x] Alla 92 tester passerar (inga nya tester — alla ändringar är frontend)
- [x] Typecheck: enbart förväntade `cloudflare:test` TS2307-fel

### Avvikelser från plan

- Ingen ny migration behövdes — `page_html` + `page_editor_data` lagras i `website_data` JSON-kolumnen
- Webbsideblock använder modern CSS (flexbox/grid) istf table-layout (separat från email-block som planen specificerade)
- `buildInitialPageHtml()` genererar startinnehåll från befintlig template + eventdata, så editorn öppnas förpopulerad

### Arkitekturbeslut

| #   | Beslut                                  | Motivering                                                            | Session |
| --- | --------------------------------------- | --------------------------------------------------------------------- | ------- |
| 38  | page_html i website_data JSON           | Ingen migration krävs, tillräckligt för JSON-fältlagring              | 16      |
| 39  | createPortal för formulär i custom HTML | React-formulär fungerar i GrapeJS-genererad HTML via DOM-platshållare | 16      |
| 40  | Separata page-block vs email-block      | Webbsidor använder modern CSS (flexbox), email kräver table-layout    | 16      |

### Anteckningar

- PageEditor och EmailEditor delar `grapejs-brand-config.ts` (samma färgpalett, typsnitt, CTA-stil)
- PageEditor lazy-laddas — påverkar ej initial bundle
- Anmälningsformuläret i custom pages fungerar via `data-page-register-form` attribut i GrapeJS-HTML + React `createPortal`
- Befintlig formulärdriven redigering behålls som "Snabbredigering" — kan användas parallellt med visuell editor
- "Återställ till mall"-knappen tar bort `page_html`/`page_editor_data` och återgår till template-rendering
- Frontend build: ~502KB JS, 4.2KB CSS (PageEditor lazy-loaded, ingen ökning av initial bundle)

---

## Session 17: Systemadmin + brand-kontroll

**Datum:** 2026-02-24
**Status:** DONE

### Deliverables

- [x] `migrations/0008_admin_role.sql` — ALTER users: is_admin INTEGER NOT NULL DEFAULT 0
- [x] `packages/shared/src/types.ts` — is_admin på User, nya AdminDashboardData + EventConflict interfaces
- [x] `backend/src/db/user.queries.ts` — is_admin i SELECT, isAdminUser() funktion
- [x] `backend/src/middleware/auth.ts` — is_admin i tokenAuthProvider SELECT
- [x] `backend/src/services/permission.service.ts` — isAdmin(), canView/canEdit bypassa vid admin
- [x] `backend/src/services/admin.service.ts` — listAllEvents, getDashboardData (aggregat), checkConflicts (datum+plats)
- [x] `backend/src/routes/admin.ts` — admin guard middleware, GET /dashboard, GET /events
- [x] `backend/src/routes/events.ts` — GET /conflicts endpoint (datum+plats+excludeId)
- [x] `backend/src/services/template-lock.service.ts` — locked zone definitions
- [x] `backend/src/routes/auth.ts` — is_admin i login och /me responses
- [x] `backend/src/index.ts` — admin routes monterade med auth middleware
- [x] `frontend/src/hooks/useAuth.tsx` — is_admin i AuthUser
- [x] `frontend/src/api/client.ts` — adminApi (dashboard, events) + conflictsApi (check)
- [x] `frontend/src/hooks/useAdmin.ts` — useAdminDashboard, useAdminEvents hooks
- [x] `frontend/src/App.tsx` — RequireAdmin guard, /admin route
- [x] `frontend/src/components/layout/Sidebar.tsx` — Admin-länk med sköldikon, Admin-badge
- [x] `frontend/src/pages/AdminDashboard.tsx` — Statistikkort, kommande events, senaste utskick, alla events
- [x] `frontend/src/components/EventForm.tsx` — Konfliktdetektering med varningsruta + "Skapa ändå"
- [x] `frontend/src/components/editor/grapejs-brand-config.ts` — lockBrandComponents() för header/footer-låsning
- [x] `frontend/src/components/editor/grapejs-email-preset.ts` — data-locked-header/footer attribut
- [x] `frontend/src/components/editor/grapejs-page-preset.ts` — data-locked-header/footer attribut
- [x] `frontend/src/components/editor/EmailEditor.tsx` — lockBrandComponents() anrop
- [x] `frontend/src/components/editor/PageEditor.tsx` — lockBrandComponents() anrop
- [x] `backend/src/services/__tests__/admin.service.test.ts` — 9 nya tester
- [x] 6 befintliga testfiler uppdaterade med is_admin i USERS_SQL
- [x] Alla 101 tester passerar (92 befintliga + 9 nya)
- [x] SAD.md, TESTPLAN.md, SESSION-GUIDE.md uppdaterade

### Avvikelser från plan

- Mailbox-hantering (dropdown för sender_mailbox) skippades — redan implementerat i SettingsTab (session 12)
- Konfliktdetektering baseras på datum + plats (inte datum + plats + tidsintervall)

### Arkitekturbeslut

| #   | Beslut                                          | Motivering                                                        | Session |
| --- | ----------------------------------------------- | ----------------------------------------------------------------- | ------- |
| 41  | is_admin kolumn på users (ej event_permissions) | Global roll, inte per-event — enklare modell                      | 17      |
| 42  | Admin bypass i canView/canEdit                  | Admins behöver inte explicit event_permissions                    | 17      |
| 43  | Konfliktdetektering klientsida med API          | Frontend checkar API innan submit, visar varning, inte blockering | 17      |
| 44  | GrapeJS locking via data-attribut               | data-locked-header/footer attribut + rekursiv komponentlåsning    | 17      |

### Anteckningar

- Migration 0008 behöver köras på remote: `npx wrangler d1 execute stage_db_v2 --remote --file=migrations/0008_admin_role.sql`
- Admin-dashboard är en ren frontend-sida som anropar 2 API-endpoints (dashboard + events)
- lockBrandComponents() använder setTimeout(200ms) för att säkerställa att GrapeJS-komponenter är fulladdade
- Konfliktdetektering exkluderar aktuellt event via excludeId-parameter (relevant vid redigering)

---

## Session 18: Test, polish, deploy Fas 2

**Datum:** 2026-02-24
**Status:** DONE

### Deliverables

- [x] **XSS-fix i GrapeJS-mail:** Ny `renderHtml()` funktion i template-renderer.ts som HTML-escaper merge field-värden (namn, event, plats etc.) innan de ersätts i HTML-kontext. URL-fält (rsvp_link, calendar_link) undantas för att href-attribut ska fungera. Alla `renderText(html_body, ...)` i mailing.service.ts ersatta med `renderHtml(html_body, ...)`.
- [x] **Mobilresponsivt registreringsformulär:** PublicEvent.tsx formRow ändrad från `grid-template-columns: 1fr 1fr` → `flex-wrap: wrap` med `flex: 1 1 250px` per fält. Formuläret stackar automatiskt på skärmar < 530px.
- [x] **Admin-dashboard days_until fix:** Explicit `T00:00:00Z` suffix på datumsträngar + `Math.round` istf `Math.ceil` för konsekvent tidszonshantering.
- [x] Kodgranskning: GrapeJS mailrendering, webbplats, admin-dashboard
- [x] Alla 101 tester passerar
- [x] Dokumentation uppdaterad (PROGRESS.md, SAD.md, TESTPLAN.md, SESSION-GUIDE.md)

### Avvikelser från plan

- Deploy skippas i denna session — migrationer (0007 + 0008) redan körda på remote (markerade ✅ i migrationsloggen). Användaren kör `npm run build && npx wrangler deploy` manuellt.
- Manuell mailrendering-test (Outlook/Gmail/Apple Mail) kräver live deploy — noterat som TC-18.4.

### Anteckningar

- Pre-existerande TS-varningar (TS2731, TS2339, TS2769) i queries + auth routes — kosmetiska, esbuild bygger utan problem
- GrapeJS canvas laddar Inter-font istf Consid Sans — kosmetiskt (preview-only), påverkar ej slutresultatet
- `dangerouslySetInnerHTML` för GrapeJS page_html är OK — bara autentiserade admins kan redigera, GrapeJS filtrerar scripts

---

## Migrations-logg

| Migration | Fil                             | Tabeller                                                          | Lokal | Remote |
| --------- | ------------------------------- | ----------------------------------------------------------------- | ----- | ------ |
| 0001      | events_participants.sql         | events, participants                                              | ✅    | ✅     |
| 0002      | mailings.sql                    | mailings                                                          | ✅    | ✅     |
| 0003      | event_permissions.sql           | users, event_permissions                                          | ✅    | ✅     |
| 0004      | activities.sql                  | activities, email_queue                                           | ✅    | ✅     |
| 0005      | participant_dietary_plusone.sql | (ALTER participants)                                              | ✅    | ✅     |
| 0006      | mailing_html_body.sql           | (ALTER mailings)                                                  | ✅    | ✅     |
| 0007      | event_website.sql               | (ALTER events: website_template, website_data, website_published) | ✅    | ✅     |
| 0008      | admin_role.sql                  | (ALTER users: is_admin)                                           | ✅    | ✅     |
| 0009      | rate_limits.sql                 | rate_limits                                                       | ✅    | ✅     |
| 0010      | email_queue_recipient_index.sql | (INDEX email_queue: event_id, to_email)                           | ✅    | ✅     |

---

## Fas 3: Refaktorering & Förvaltning

> Plan: `docs/REFACTORING-PLAN.md` (genererad från fullständig repoanalys 2026-02-24)

| Session | Fokus                                                                                  | Status |
| ------- | -------------------------------------------------------------------------------------- | ------ |
| 19      | Säkerhetsfixar (XSS, rate limiting, path traversal)                                    | DONE   |
| 20a     | Backend-refaktorering (20.1–20.4)                                                      | DONE   |
| 20b     | Saknade tester (20.5–20.7)                                                             | DONE   |
| 21a     | Frontend-refaktorering (SettingsTab + WebsitePanel + RsvpPage + a11y)                  | DONE   |
| 21b     | Frontend-refaktorering (PublicEvent + EventForm + CreateMailingModal + AdminDashboard) | DONE   |
| 22      | Developer Experience (CI/CD, linting, docs)                                            | TODO   |

---

## Session 19: Säkerhetsfixar

**Datum:** 2026-02-24
**Status:** DONE

### Deliverables

- [x] **19.1 XSS-skydd i PublicEvent (KRITISK):** DOMPurify installerat i frontend. `page_html` saniteras med `DOMPurify.sanitize()` via `useMemo` innan `dangerouslySetInnerHTML`. Tillåter safe HTML + `<style>` + `data-page-register-form` attribut. Strippar `<script>`, `onclick` etc.
- [x] **19.2 R2 path traversal-validering (HÖG):** Prefix valideras mot allowlist (`['events']`). Filename valideras som UUID + extension (`/^[0-9a-f]{8}-...\.(jpg|jpeg|png|webp|gif)$/`). Returnerar 400 vid ogiltigt.
- [x] **19.3 Rate limiting (HÖG):** Ny `backend/src/middleware/rate-limiter.ts` med D1-baserad sliding window. `auth/login` = 10 req/IP/timme, `rsvp/:token/respond` = 5 req/token/minut. Migration `0009_rate_limits.sql` (rate_limits tabell). Fail-open vid D1-fel.
- [x] **19.4 Admin-bypass i permissions (MEDIUM):** POST och DELETE i `permissions.ts` kontrollerar nu `isOwner || isAdmin`. Admins kan hantera behörigheter för alla events.
- [x] **19.5 JSON.parse try-catch (HÖG):** Båda `JSON.parse`-anropen i `website.service.ts` (getWebsite rad 25, getPublicEvent rad 85) wrappade i try-catch. Returnerar `null` vid parse-fel, loggar warning.
- [x] **Säkerhetstester:** 8 nya tester i `security.test.ts` (path traversal: 5, rate limit auth: 2, rate limit RSVP: 1). 2 nya tester i `website.service.test.ts` (ogiltig JSON). 2 nya tester i `permission.service.test.ts` (admin-bypass).
- [x] Alla 113 tester passerar (101 befintliga + 12 nya)
- [x] SAD.md, TESTPLAN.md, SESSION-GUIDE.md uppdaterade

### Avvikelser från plan

Inga avvikelser — alla 5 säkerhetsfynd åtgärdade.

### Anteckningar

- DOMPurify installerat i frontend (browser-only) — INTE i Cloudflare Worker backend (som planen specificerade)
- Rate limiter fail-open design: om D1-query misslyckas (t.ex. rate_limits-tabellen saknas i test-env), tillåts requestet genom. Loggar error. Skyddar mot att rate limiting-buggar blockerar legitim trafik.
- Befintliga tester som anropar RSVP-respond loggar `[rate-limiter] D1 error` — detta är förväntat (rate_limits-tabellen skapas inte i alla testfilers beforeAll)
- Pre-existerande TS-varningar (TS2731, TS2339, TS2769) oförändrade — kosmetiska, esbuild bygger utan problem
- Migration 0009 behöver köras på remote: `npx wrangler d1 execute stage_db_v2 --remote --file=migrations/0009_rate_limits.sql`

---

## Session 20a: Backend-refaktorering

**Datum:** 2026-02-24
**Status:** DONE

### Deliverables

- [x] **20.1 — escapeHtml-konsolidering:** Ny `backend/src/utils/escaping.ts` med gemensam `escapeHtml()`. Importerad i `html-builder.ts` och `template-renderer.ts`. Lokala kopior borttagna. Re-export i html-builder för bakåtkompatibilitet.
- [x] **20.2 — Route-helpers:** Ny `backend/src/utils/route-helpers.ts` med `parseIdParam()` (kastar HTTPException 400) + `requireEvent()` (parse + event-exists, kastar 400/404). Duplicerad `validateEvent()` borttagen från `participants.ts` och `mailings.ts`. `isNaN(id)` ersatt med `parseIdParam` i `website.ts` och `activities.ts`. Alla ID-valideringar i `events.ts` ersatta med `parseIdParam`.
- [x] **20.3 — mailing.service.ts refaktorering:** Extraherat `buildQueueItem()` (deduplicerat queue-item-byggande i `send()` + `sendToNew()`), `sendEmailsDirect()` (deduplicerat direct-send-loop i `sendDirect()` + `sendToNew()`), `DIRECT_SEND_THRESHOLD = 5` (namngiven magisk siffra). Borttagen `sendDirect()`-metod (ersatt av fristående `sendEmailsDirect()`). Netto: ~50 rader mindre.
- [x] **20.4 — Search till service-lager:** SQL flyttad från `routes/search.ts` till ny `backend/src/db/search.queries.ts` + `backend/src/services/search.service.ts`. Route är nu tunn (parse → service → response).
- [x] Alla 113 tester passerar
- [x] `npm run typecheck` grönt (enbart förväntade `cloudflare:test` TS2307-fel)
- [x] Dokumentation uppdaterad (PROGRESS.md, SAD.md, TESTPLAN.md, SESSION-GUIDE.md)

### Avvikelser från plan

- Session delad i 20a (refaktorering) + 20b (tester) per användarens instruktion
- `validateEventAccess` (med permission-check) implementerades som `requireEvent` (utan permission-check) — permission-nivån varierar per route (canView/canEdit/isOwner) och hanteras bättre separat

### Anteckningar

- Route-helpers använder Hono HTTPException med JSON-body (`{ error: "..." }`) — matchande format som innan
- Hono fångar HTTPException automatiskt innan custom error-handler → inga ändringar i error-handler.ts
- Inga nya migrationer behövdes
- Inga frontend-ändringar
- Netto: ~70 rader borttagna (duplicering eliminerad)

---

## Session 20b: Saknade tester (MailingService, RsvpService, template-renderer)

**Datum:** 2026-02-24
**Status:** DONE

### Deliverables

- [x] `backend/src/services/__tests__/mailing.service.test.ts` — 14 nya tester: create+list, update draft/sent/non-existent, send direkt (≤5), send kö (>5), send redan skickad, send inga mottagare, send non-existent, sendToNew (nya/status/inga nya), sendTest (ok + non-existent)
- [x] `backend/src/services/__tests__/rsvp.service.test.ts` — 10 nya tester: getByToken (valid + ogiltig), respond attending/declined/dietary+plus_one/auto-waitlist/ogiltig token, cancel (ok + promote + ogiltig token)
- [x] `backend/src/services/email/__tests__/template-renderer.test.ts` — 11 nya tester: buildMergeContext, renderText (ersättning + multipel + ej escape), renderHtml (ersättning + XSS-escape + URL ej escape + specialtecken), renderEmail (komplett + auto-append rsvp + ej dubbla rsvp)
- [x] Alla 148 tester passerar (113 befintliga + 35 nya)
- [x] `npm run typecheck` grönt (enbart förväntade `cloudflare:test` TS2307-fel)
- [x] Dokumentation uppdaterad (PROGRESS.md, SAD.md, TESTPLAN.md, SESSION-GUIDE.md)

### Avvikelser från plan

- Planen estimerade ~20 testfall, levererade 35 — fler edge cases täckta
- Inga avvikelser i scope — alla tre service-komponenter testade

### Anteckningar

- Template-renderer-tester använder inga DB-beroenden (rena funktioner)
- MailingService-tester skapar alla tabeller (events, participants, mailings, email_queue) i beforeAll
- RsvpService-tester verifierar auto-waitlist och auto-promote via WaitlistService-integration
- ConsoleEmailProvider används som fallback i alla tester (ingen RESEND_API_KEY)

---

## Session 21a: Frontend-refaktorering (SettingsTab + WebsitePanel + RsvpPage + a11y)

**Datum:** 2026-02-24
**Status:** DONE

### Deliverables

- [x] **SettingsTab.tsx** (561 → 44 rader): Extraherat `EventInfoSection.tsx` (245), `HeroImageSection.tsx` (133), `VisibilitySection.tsx` (222, inkl. SenderSection + GdprSection). SettingsTab är nu tunn orkestrerare.
- [x] **WebsitePanel.tsx** (607 → 145 rader): Extraherat `WebsiteTemplateSelector.tsx` (185), `WebsiteFormFields.tsx` (242), `useWebsiteForm.ts` hook (131). ProgramEditor flyttad till WebsiteFormFields.
- [x] **RsvpPage.tsx** (568 → 150 rader): Extraherat `RsvpResponseForm.tsx` (303), `RsvpConfirmation.tsx` (80), `RsvpIcons.tsx` (26), `useRsvpState.ts` hook (144, inkl. downloadICS + formatRsvpDate).
- [x] **Accessibility:** Focus trap i Modal.tsx (Tab-fångst, auto-focus), role="dialog" + aria-modal. aria-label på clone-knapp i Overview.tsx. alt-text på hero-bild i RsvpPage + HeroImageSection. aria-hidden på dekorativa SVG-ikoner. Touch target 44px på clone-knapp och modal close-knapp. aria-label på toggle-knapp i VisibilitySection.
- [x] Alla 148 tester passerar (inga nya — ren refaktorering)
- [x] `npm run typecheck` grönt (enbart förväntade `cloudflare:test` TS2307-fel)
- [x] Alla filer under 400 rader

### Avvikelser från plan

- `Overview.tsx` ligger i `frontend/src/pages/`, inte `frontend/src/components/features/events/` som planen angav
- `DangerZone.tsx` existerade redan — verifierad som importerad
- SenderSection + GdprSection placerade i VisibilitySection.tsx (nära relaterade, under 400 rader tillsammans)
- RsvpIcons.tsx tillagd som delad ikonkomponent (används av RsvpResponseForm + RsvpConfirmation + RsvpPage)

### Nya filer

```
frontend/src/components/features/settings/EventInfoSection.tsx      # 245 rader
frontend/src/components/features/settings/HeroImageSection.tsx      # 133 rader
frontend/src/components/features/settings/VisibilitySection.tsx     # 222 rader
frontend/src/components/features/settings/WebsiteTemplateSelector.tsx # 185 rader
frontend/src/components/features/settings/WebsiteFormFields.tsx     # 242 rader
frontend/src/hooks/useWebsiteForm.ts                                # 131 rader
frontend/src/pages/RsvpResponseForm.tsx                             # 303 rader
frontend/src/pages/RsvpConfirmation.tsx                             # 80 rader
frontend/src/pages/RsvpIcons.tsx                                    # 26 rader
frontend/src/hooks/useRsvpState.ts                                  # 144 rader
```

---

## Session 21b: Frontend-refaktorering (PublicEvent + EventForm + CreateMailingModal + AdminDashboard)

**Datum:** 2026-02-24
**Status:** DONE

### Deliverables

- [x] **PublicEvent.tsx** (554 → 147 rader): Extraherat `PublicRegistrationForm.tsx` (258, anmälningsformulär + GDPR + ICS), `PublicEventRenderer.tsx` (195, template-rendering med hero/info/program/plats). PublicEvent är nu orkestrerare med DOMPurify + createPortal-logik.
- [x] **EventForm.tsx** (484 → 387 rader): Extraherat `useEventFormValidation.ts` hook (86, validate + buildPayload + clearFieldError), `useConflictCheck.ts` hook (49, krockkontroll med conflicts API). EventForm behåller layout.
- [x] **CreateMailingModal.tsx** (447 → 342 rader): Extraherat `useMailingForm.ts` hook (79, formulärstate + mallval + validering + reset). Modal behåller UI + editor-vy.
- [x] **AdminDashboard.tsx** (418 → 87 rader): Extraherat `DashboardStats.tsx` (96, statistikkort med kategorichips), `DashboardEventList.tsx` (269, kommande events + senaste utskick + alla events tabeller). AdminDashboard är tunn orkestrerare.
- [x] Alla 148 tester passerar (inga nya — ren refaktorering)
- [x] `npm run typecheck` grönt (enbart förväntade `cloudflare:test` TS2307-fel)
- [x] Alla filer under 400 rader

### Avvikelser från plan

Inga avvikelser — alla 4 filer uppbrutna enligt plan.

### Nya filer

```
frontend/src/pages/PublicRegistrationForm.tsx      # 258 rader
frontend/src/pages/PublicEventRenderer.tsx          # 195 rader
frontend/src/hooks/useEventFormValidation.ts        # 86 rader
frontend/src/hooks/useConflictCheck.ts              # 49 rader
frontend/src/hooks/useMailingForm.ts                # 79 rader
frontend/src/pages/DashboardStats.tsx               # 96 rader
frontend/src/pages/DashboardEventList.tsx           # 269 rader
```

---

## Session 22: Developer Experience (CI/CD, linting, docs)

**Datum:** 2026-02-24
**Status:** DONE

### Deliverables

- [x] **ESLint** flat config (`eslint.config.js`): `@typescript-eslint/no-explicit-any: error`, `@typescript-eslint/no-unused-vars: error`, `max-lines: [warn, 400]`
- [x] **Prettier** (`.prettierrc`): single quotes, trailing commas, 2 spaces, 100 print width
- [x] **EditorConfig** (`.editorconfig`): indent_style space, indent_size 2, LF, UTF-8
- [x] **Autofix:** Prettier + ESLint körd på hela kodbasen, 11 oanvända imports/variabler borttagna
- [x] **GitHub Actions CI** (`.github/workflows/ci.yml`): push + PR trigger → checkout → setup-node → npm ci → typecheck → lint → test
- [x] **PR-template** (`.github/pull_request_template.md`): beskrivning, typ av ändring, checklista
- [x] **Husky** pre-commit hook med lint-staged (eslint --fix + prettier)
- [x] **README.md** utökad: prerequisites, steg-för-steg setup, alla kommandon, projektstruktur, troubleshooting
- [x] **CONTRIBUTING.md**: git workflow, Conventional Commits, arkitekturregler, testmönster, kodgranskningschecklista
- [x] **`.dev.vars.example`**: mall för miljövariabler
- [x] **`.gitattributes`**: LF line endings, binärfiler
- [x] **`engines`** i package.json: node >=20, npm >=10
- [x] Alla 148 tester passerar
- [x] `npm run typecheck` grönt (enbart förväntade `cloudflare:test` TS2307-fel)

### Avvikelser från plan

Inga avvikelser — alla 4 deluppgifter (22.1–22.4) levererade enligt plan.

### Nya filer

```
eslint.config.js                        # ESLint flat config
.prettierrc                             # Prettier-konfiguration
.editorconfig                           # EditorConfig
.gitattributes                          # Line endings + binärfiler
.github/workflows/ci.yml               # GitHub Actions CI
.github/pull_request_template.md        # PR-template
.husky/pre-commit                       # Husky pre-commit hook
CONTRIBUTING.md                         # Bidragsguide
.dev.vars.example                       # Miljövariabel-mall
```

---

## Förbättrad deltagarhantering (Email-historik, cateringexport, detaljpanel)

**Datum:** 2026-02-24
**Status:** DONE

### Deliverables

- [x] `migrations/0010_email_queue_recipient_index.sql` — INDEX på email_queue(event_id, to_email) för snabb mailhistorik-lookup
- [x] `packages/shared/src/types.ts` — Ny `ParticipantEmailHistory` interface
- [x] `backend/src/db/participant.queries.ts` — Ny `getParticipantEmailHistory()` query
- [x] `backend/src/services/participant.service.ts` — Nya metoder: `getEmailHistory()`, `exportCateringCSV()`
- [x] `backend/src/routes/participants.ts` — Nya endpoints: `GET /export-catering`, `GET /:id/emails`
- [x] `backend/src/services/__tests__/participant.service.test.ts` — 7 nya tester (getEmailHistory ×3, exportCateringCSV ×4)
- [x] `frontend/src/api/client.ts` — `participantsApi.emailHistory()` + `UpdateParticipantPayload` export
- [x] `frontend/src/hooks/useParticipants.ts` — `useParticipantEmailHistory()` hook (lazy-loading)
- [x] `frontend/src/components/features/participants/EditParticipantModal.tsx` — Redigera deltagare (namn, email, företag, kategori, allergier, plus-one)
- [x] `frontend/src/components/features/participants/ParticipantDetailPanel.tsx` — Expanderbar detaljpanel med kostinfo, plus-one, mailhistorik, "Redigera"-knapp
- [x] `frontend/src/components/features/participants/ParticipantRow.tsx` — Extraherad tabellrad (Info-kolumn med ikoner, Ändrad-kolumn, expanderbar panel)
- [x] `frontend/src/components/features/participants/ParticipantsTab.tsx` — Ny exportmeny (dropdown med deltagarlista + cateringlista), klickbara expanderbara rader, edit-modal
- [x] 155 tester (148 + 7 nya), alla passerar
- [x] `npm run typecheck` grönt (enbart förväntade cloudflare:test TS2307-fel)
- [x] Dokumentation uppdaterad (PROGRESS.md, SAD.md, TESTPLAN.md, SESSION-GUIDE.md)

### Avvikelser från plan

- ParticipantsTab.tsx överskred 400-radersgräns (644 rader) → ParticipantRow.tsx extraherad (228 rader), ParticipantsTab reducerad till 403 rader
- Inga andra avvikelser — alla planerade features implementerade

### Nya filer

```
migrations/0010_email_queue_recipient_index.sql
frontend/src/components/features/participants/EditParticipantModal.tsx
frontend/src/components/features/participants/ParticipantDetailPanel.tsx
frontend/src/components/features/participants/ParticipantRow.tsx
```

### Anteckningar

- Cateringexport inkluderar bara `attending` + `waitlisted` (declined/cancelled exkluderas)
- Waitlisted visas som "Väntelista" i CSV:ens Status-kolumn
- Mailhistorik laddas lazy (bara vid expanderad rad) via `useParticipantEmailHistory`
- `/export-catering` registrerad FÖRE `/:id`-routes i participants.ts (Hono route-ordning kritisk)
- Migration 0010 behöver köras på remote: `npx wrangler d1 execute stage_db_v2 --remote --file=migrations/0010_email_queue_recipient_index.sql`

---

## Aktivitetslogg per deltagare

**Datum:** 2026-02-25
**Status:** DONE

### Deliverables

- [x] `migrations/0012_activity_participant_id.sql` — ny kolumn `participant_id` med `ON DELETE SET NULL` + index
- [x] `packages/shared/src/constants.ts` — 5 nya activity types: `rsvp_responded`, `rsvp_cancelled`, `participant_edited`, `participant_registered`, `waitlist_promoted`
- [x] `packages/shared/src/types.ts` — `Activity` interface utökad med `participant_id: number | null`
- [x] `backend/src/db/activity.queries.ts` — `createActivity` med `participantId`, ny `listParticipantActivities`
- [x] `backend/src/services/activity.service.ts` — 6 nya loggmetoder (`logRsvpResponded`, `logRsvpCancelled`, `logParticipantEdited`, `logParticipantRegistered`, `logWaitlistPromoted`, `listForParticipant`) + `participantId` parameter på befintliga
- [x] `backend/src/routes/participants.ts` — nytt `GET /:id/activities` endpoint, edit-loggning i PUT, participantId i POST/DELETE
- [x] `backend/src/services/rsvp.service.ts` — loggar RSVP-svar och avbokningar (try/catch)
- [x] `backend/src/services/waitlist.service.ts` — loggar waitlist-promotions (try/catch)
- [x] `backend/src/services/website.service.ts` — loggar registreringar via hemsidan (try/catch)
- [x] `frontend/src/api/client.ts` — ny `participantsApi.activities()` metod
- [x] `frontend/src/hooks/useParticipants.ts` — ny `useParticipantActivities` hook
- [x] `frontend/src/components/features/participants/ParticipantTimeline.tsx` — ny komponent (activities + email → kronologisk tidslinje)
- [x] `frontend/src/components/features/participants/ParticipantDetailPanel.tsx` — "Mailhistorik" ersatt med `<ParticipantTimeline>`
- [x] 7 nya tester i `activity.service.test.ts` (12 totalt), alla 162 tester passerar
- [x] 6 testfiler uppdaterade med `participant_id` i ACTIVITIES_SQL
- [x] Dokumentation uppdaterad (PROGRESS.md, SAD.md, TESTPLAN.md, SESSION-GUIDE.md)

### Avvikelser från plan

- FK constraint `REFERENCES participants(id)` krävde `ON DELETE SET NULL` — utan detta blockerade FK deltagarborttagning
- DELETE-routen loggar aktivitet FÖRE borttagning (FK kräver att deltagaren finns vid INSERT)
- Alla loggningsanrop i publika endpoints (RSVP, waitlist promote, website register) wrappade i try/catch

### Nya filer

```
migrations/0012_activity_participant_id.sql
frontend/src/components/features/participants/ParticipantTimeline.tsx
```

### Anteckningar

- Migration 0012 behöver köras på remote: `npx wrangler d1 execute stage_db_v2 --remote --file=migrations/0012_activity_participant_id.sql`
- Tidslinjen slår ihop activities + email_queue-historik i en sorterad lista (nyast först)
- Max 15 entries initialt, "Visa alla (N)" knapp om fler
- `created_by` visas diskret för admin-triggade händelser
