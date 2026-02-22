# Implementationsplan: Stage Eventplattform (rev. 4)

## Kontext

Stage är en eventplaneringsplattform för Consid. En prototyp finns på mikwik.se/stage/ (Cloudflare Worker + D1). Nu ska en riktig produktionsapp byggas utifrån PRD-Stage.md.

**Nyckelbegränsningar:**
- Claude Opus 4.6 bygger i avgränsade sessioner — minimera kontextfönster
- Varje session producerar byggbar kod och uppdaterar PROGRESS.md
- CLAUDE.md ger kontext utan att AI:n behöver läsa hela kodbasen
- Gratis emailtjänst (Resend) med abstraktionslager för O365 senare
- GrapeJS (open source) som WYSIWYG-editor — men först i Fas 2
- Lokal git från start, senare GitHub
- Dokumentation i varje session — andra ska kunna ta över

**Fasindelning (från PRD sektion 11.5):**
- **Fas 1 (15 sessioner: 0–13 + 4a/4b-split):** Core — event, deltagare, formulärstyrd mail, avbokning, ICS, behörigheter, sök. Deploybar, användbar produkt.
- **Fas 2 (5 sessioner: 14–18):** WYSIWYG — GrapeJS mailredigering, eventwebbplats, systemadmin + brand-kontroll.
- **Totalt: 20 AI-sessioner** (varje session = en separat konversation med manuell start)

---

## Tech-stack

| Lager | Val | Motivering |
|---|---|---|
| **Runtime** | Cloudflare Workers | Redan uppsatt, gratis, edge computing |
| **Backend-framework** | Hono (TypeScript) | Typsäker routing, middleware, lättviktigt |
| **Databas** | Cloudflare D1 (SQLite) | Redan fungerande, gratis, serverlöst |
| **Frontend** | React + TypeScript + Vite | Modernt, välkänt, bra DX |
| **Server state** | TanStack Query (React Query) | Cache, refetch, mutation, loading/error states |
| **WYSIWYG-editor** | GrapeJS (open source, BSD) — Fas 2 | Drag-and-drop för mail + webbsidor, gratis |
| **Email** | Resend (betald plan behövs vid >100/dag) | Abstraktionslager → O365 Graph API senare |
| **Bildlagring** | Cloudflare R2 (från session 2) | Objektlagring, gratis tier 10 GB. Eventbilder i Fas 1, GrapeJS-bilder i Fas 2 |
| **Auth** | Interface-baserad (enkel token nu → Azure AD senare) | Designad för swap |
| **Validering** | Zod | Delade schemas mellan frontend/backend |
| **Drag-and-drop** | dnd-kit (för väntlista-köordning) | Lättviktigt, React-native, tillgängligt |
| **Schemaläggning** | Cloudflare Cron Triggers | Triggar Worker vid schemalagda tidpunkter |
| **Test** | Vitest + @cloudflare/vitest-pool-workers | Vite-native, D1-stöd via miniflare, snabb |
| **Deploy** | Cloudflare Workers (React via Assets) | Frontend byggs med Vite → serveras som statiska filer |

### Resend-begränsning
Gratis-tier: 100 mail/dag. Ett event med 200 deltagare överskrider gränsen. **Lösning:** Köbaserad utskickshantering som sprider mail (max 80/dag med marginal) + uppgradera till betald plan ($20/mån, 50 000 mail/mån) när produktionen startar. Abstraktionslagret gör att vi kan byta till O365 Graph API utan kodändringar.

### Bundlestorlek
Cloudflare Workers: 10 MB (betald plan). React-appen byggs med Vite och serveras via Workers Assets (ej inkluderad i Worker-bundlen). Backend-Worker är liten (~50 KB). GrapeJS (~500 KB gzip) laddas lazy i Fas 2.

---

## Consid Brand Guidelines

> Källa: `Considstage/Consid brand guidelines_2025.pdf` (22 sidor). Alla visuella element i Stage ska följa dessa riktlinjer.

### Färgpalett

| Namn | Hex | RGB | Användning i Stage |
|---|---|---|---|
| **Burgundy** | `#701131` | 112, 17, 49 | Primär — sidebar, headings, primärknapp hover, logotyp på mörk bg |
| **Raspberry Red** | `#B5223F` | 181, 33, 63 | Accent — primärknappar, CTA, aktiv tabb, badges, notifikationer |
| **Light Orange** | `#F49E88` | 244, 158, 136 | Highlight — ikoner, sekundära accenter, grafiskt element (20% opacity bg) |
| **Beige** | `#EFE6DD` | 240, 230, 221 | Bakgrund — sidor, cards, ljusa ytor |
| **Black** | `#1C1C1C` | 28, 28, 28 | Text — brödtext, rubriker på ljus bg |
| **Dark Purple** | `#492A34` | 73, 42, 52 | Mörkt komplement — sidebar alt, mörka sektioner |
| **Greige** | `#A99B94` | 169, 155, 148 | Neutral — borders, disabled, sekundärtext |
| **Orange** | `#EC6B6A` | 237, 107, 107 | Varning/uppmärksamhet — statusbadges, "väntlista" |
| **Beige (ljus)** | `#EFE6DD` | 240, 230, 221 | Ljus bakgrund |

### Tillgänglighet (WCAG)
Godkända kombinationer från brand guidelines kontrastmatris:
- **Burgundy på Beige** — godkänd (rubrik + brödtext)
- **Black på Beige** — godkänd (brödtext)
- **Vit på Burgundy** — godkänd (knappar, sidebar-text)
- **Vit på Raspberry Red** — godkänd (CTA-knappar)
- **Burgundy på Light Orange** — godkänd (accent-badges)
- **Raspberry Red på Beige** — ej godkänd för liten text (använd bara för stor rubrik/ikon)

### Typografi
- **Font:** "Consid Sans" — Consids egna typsnitt (modern soft sans-serif)
- **Rubriker:** Consid Sans Semibold
- **Brödtext:** Consid Sans Regular
- **Spacing:** Avstånd mellan rubrik och brödtext = versalt bokstavshöjd
- **Webfallback:** Om Consid Sans inte finns som webfont → ladda som custom `@font-face` från R2 (self-hosted). Fallback-stack: `"Consid Sans", system-ui, -apple-system, sans-serif`

### Logotyp
- **Primär:** Horisontell (symbol + "CONSID") — används i sidebar, mailheader
- **Sekundär:** Vertikal — används där horisontellt utrymme saknas
- **Frizon:** Storlek av bokstaven "C" runt logotypen
- **Färgregler:** Svart logotyp på ljus bakgrund, vit logotyp på mörk bakgrund. Enfärgsversion finns.
- **SVG-fil:** Inkludera som inline SVG i frontend (sidebar, mail-header)

### Grafiskt element
- Dekorativt cirkel-med-prick-motiv (härledd ur logotypens symbol)
- Används vid 20% opacity i Light Orange som bakgrundsdekoration
- Tillämpning: card-bakgrunder, hero-sektioner, mailmallar

### Brand-efterlevnad i systemet
Målet är att eventskapare **automatiskt** följer varumärkesprofilen utan att behöva tänka på det:

1. **Designsystem (session 1):** Alla UI-komponenter (Button, Badge, Modal, Input, Card) byggs med rätt färger/typsnitt. Eventskapare kan inte välja "fel" färg — komponenterna har Consid-profil inbyggd.
2. **Mailmallar (session 6):** Alla 6 mallar har Consid-logotyp i header, rätt färger, Consid Sans font. Eventskaparen fyller bara i text — layouten är brand-safe.
3. **Färgpalett i CSS-variabler:** `--color-burgundy`, `--color-raspberry`, etc. Ingen hårdkodning.
4. **Eventwebbplats (session 15):** Templates i Consid-profil. Eventskaparen väljer template + fyller i fält.
5. **GrapeJS mall-lås (session 17, Fas 2):** Header (logotyp) och footer (unsubscribe + kontakt) är låsta — kan inte redigeras av eventskapare. Endast färger från godkänd palett tillgängliga i editorn.

---

## Repostruktur

```
~/stage/
├── CLAUDE.md                     # AI-kontext (läses först varje session)
├── PROGRESS.md                   # Sessionsprogress
├── TESTPLAN.md                   # Manuella testfall (byggs löpande, AI-testbar i framtiden)
├── README.md                     # Setup + kommandon
├── SAD.md                        # Systemarkitekturdokument (lever, uppdateras varje session)
├── package.json                  # Root med workspaces
├── tsconfig.json                 # Delad TS-config
├── wrangler.toml                 # Worker-config + Cron Triggers + R2-binding
├── .gitignore
│
├── migrations/                   # D1 SQL-migrationer (inkrementella)
│   ├── 0001_events_participants.sql    # Session 0
│   ├── 0002_email_sends.sql            # Session 6
│   ├── 0003_event_permissions.sql      # Session 10
│   ├── 0004_activities.sql             # Session 11
│   ├── 0005_admin_role.sql             # Session 17
│   └── ...
│
├── packages/shared/              # Delade typer frontend ↔ backend
│   └── src/
│       ├── types.ts              # Event, Participant, Email-typer
│       └── constants.ts          # Status-enums, kategori-enums
│
├── backend/
│   └── src/
│       ├── index.ts              # Hono app entry
│       ├── bindings.ts           # Cloudflare Env-typer (D1, R2, secrets)
│       ├── middleware/           # auth.ts, cors.ts, error-handler.ts
│       ├── routes/               # events.ts, participants.ts, email.ts, etc.
│       ├── services/             # Affärslogik per domän
│       │   ├── __tests__/        # Enhetstester (colocated per service)
│       │   └── email/
│       │       ├── __tests__/    # Email-specifika tester
│       │       ├── email.interface.ts    # Abstrakt interface
│       │       ├── resend.adapter.ts     # Resend-implementation
│       │       └── msgraph.adapter.ts    # Stub för O365
│       ├── db/queries.ts         # Typsäkra D1-frågor
│       └── utils/                # validation.ts, token.ts
│
├── vitest.config.ts              # Vitest + @cloudflare/vitest-pool-workers
│
├── frontend/
│   └── src/
│       ├── main.tsx, App.tsx
│       ├── api/client.ts         # Typad fetch-wrapper med TanStack Query
│       ├── pages/                # Overview, EventDetail, CancelPortal
│       ├── components/
│       │   ├── layout/           # Sidebar, Topbar, Layout
│       │   ├── ui/               # Badge, Button, Modal, Table, Input, Toast, ErrorBoundary
│       │   ├── editor/           # GrapeJS-wrapper (Fas 2)
│       │   └── features/         # events/, participants/, email/
│       ├── hooks/                # useEvents, useParticipants, etc.
│       └── styles/globals.css    # CSS-variabler, Consid-branding
│
└── docs/                         # Arkitekturdokumentation
    ├── api.md
    ├── email-abstraction.md
    ├── auth-abstraction.md
    └── session-guide.md
```

---

## Sessionsprotokoll

### KRITISK REGEL: Ingen session startar automatiskt
Varje session är en **separat AI-konversation**. Användaren startar varje session manuellt genom att ge en prompt. AI:n ska **aldrig** automatiskt påbörja nästa session.

### Sessionsstart
Varje session börjar med att AI:n:
1. Läser `CLAUDE.md` (projektkontext, ~150 rader)
2. Läser `PROGRESS.md` (vad som är gjort, var vi är)
3. Bekräftar sessionens mål med användaren innan kodning startar

### Enhetstester — i VARJE session
Tester skrivs **parallellt med koden**, inte i en separat test-session. Regel:
- **Backend-sessioner (2, 3, 5, 6, 7, 8, 9, 10, 11, 12):** Vitest-tester för varje service/route som skapas. Minst 3-5 testfall per service.
- **Frontend-sessioner (1, 4a, 4b):** Smoke-test att komponenter renderar utan fel.
- **Testmönster:** `backend/src/services/__tests__/event.service.test.ts` (colocated med koden)
- **D1-tester:** Använd `@cloudflare/vitest-pool-workers` för att testa mot riktig D1-instans i miniflare.
- **Session 13/18** testar *integration* och *end-to-end* — inte enhetstester (de ska redan finnas).
- `npm run test` måste vara grönt vid sessionsavslut.

### Dokumentation — SAD.md lever
`SAD.md` uppdateras **varje session som ändrar arkitekturen**:
- Ny tabell/migration → uppdatera databassektion
- Ny API-endpoint → uppdatera endpoint-lista
- Ny service/middleware → uppdatera komponentdiagram
- Ny integration (R2, Resend, Cron) → uppdatera integrationssektion

SAD.md ska alltid vara tillräcklig för att en **ny utvecklare kan sätta sig in i systemet** utan att läsa all kod. Innehåll:
- Systemöversikt (vad Stage gör, 3 meningar)
- Arkitekturdiagram (textbaserat — worker → D1/R2/Resend)
- Repostruktur med filändamål
- Alla API-endpoints (metod, path, beskrivning)
- Databasschema (aktuellt, alla tabeller)
- Deploy-flöde (steg för steg)
- Autentisering och behörighetsmodell
- Externa integrationer (Resend, R2, Cron Triggers)
- Miljövariabler och secrets
- Testning (hur man kör tester, vad som testas)

### Manuella testfall — `TESTPLAN.md`
Varje session som bygger användarsynlig funktionalitet skapar **manuella testfall** i `TESTPLAN.md`:

**Dokumentformat:**
```markdown
# Stage — Manuell testplan

## Session X: [Namn]
### TC-X.1: [Testfallsnamn]
**Förutsättning:** [Vad som behöver finnas/göras innan]
**Steg:**
1. Gå till [URL/vy]
2. Klicka på [element]
3. Fyll i [fält] med [värde]
**Förväntat resultat:** [Vad som ska hända]
**Status:** ☐ Ej testad / ✅ Godkänd / ❌ Underkänd
```

**Regler:**
- Varje session lägger till sina testfall (append, aldrig ta bort gamla)
- Testfall skrivs från **användarens perspektiv** (inte tekniskt)
- Täcker alla användarflöden som sessionen implementerar
- Inkluderar negativa testfall (felhantering, ogiltiga indata)
- Dokumentet är utformat så att det kan användas som underlag för **AI-driven testning** (t.ex. Chrome-tillägg) i framtiden — därför tydliga steg, URL:er, och förväntade resultat
- Testfall-ID:n är stabila (`TC-2.1`, `TC-4a.3`) så de kan refereras

**Exempel på testfall per session:**
- **Session 1:** Sidebar-navigation, tab-switching, responsivitet
- **Session 4a:** Skapa event, klona event, se event i översikt
- **Session 4b:** Lägg till deltagare, sök, filtrera, radera, CSV-export
- **Session 6:** Förhandsgranska mailmall, verifiera brand compliance
- **Session 9:** RSVP ja/nej via länk, avboka, väntlista-uppflyttning
- **Session 10:** Inloggning, behörigheter (Skapare vs Läsare)

### Sessionsavslutning — OBLIGATORISKT
Varje session **måste** avslutas med dessa steg i ordning:
1. `npm run typecheck` — inga TypeScript-fel
2. `npm run test` — alla tester gröna
3. `npm run dev` — appen startar och visar frontend
4. Manuell verifiering av sessionens specifika mål
5. Git commit med beskrivande meddelande
6. Uppdatera `PROGRESS.md` med:
   - Status: DONE
   - Checklista med deliverables (✅/❌)
   - Anteckningar (problem, beslut, insikter)
   - Git commit-hash
7. Uppdatera `CLAUDE.md` om nya mönster/beslut/filer tillkommit
8. Uppdatera `SAD.md` om arkitekturen ändrats (nya endpoints, tabeller, integrationer)
9. Uppdatera `TESTPLAN.md` med manuella testfall för sessionens funktionalitet
10. **Skriv en startprompt för nästa session** — en komplett prompt som användaren kan kopiera och klistra in för att starta nästa session. Prompten ska innehålla:
   - Sessionsnummer och namn
   - Kort sammanfattning av vad som ska byggas
   - Filer som förväntas skapas/ändras
   - Eventuella förutsättningar eller beslut från denna session
   - Referens till CLAUDE.md och PROGRESS.md

### Startprompt-format (exempel)
```
Starta Session 2: Event CRUD API

Läs CLAUDE.md och PROGRESS.md först.

Bygg fullständig event-backend:
- 6 Hono-routes i backend/src/routes/events.ts
- Service-lager i backend/src/services/event.service.ts
- Zod-validering i backend/src/utils/validation.ts
- R2 bilduppladdning i backend/src/routes/images.ts
- CORS + error-handler middleware

Se planen (session 2) för detaljer.
```

### AI-kontextfönster-budget per session
- **Målstorlek:** Max ~10 nya/ändrade filer per session
- **Läsa:** ~5-8 befintliga filer för kontext
- **Skapa:** ~6-10 nya filer
- Om en session riskerar att överskrida → dela i del A + del B (se session 4)

---

## Sessionsplan

---

## Fas 1: Core (session 0–14)

> Mål: Deploybar, användbar produkt med formulärdriven mailredigering (utan GrapeJS).
> 20 sessioner totalt (0, 1, 2, 3, 4a, 4b, 5–14 Fas 1 + 15–19 Fas 2).

### Session 0: Repo + config + build pipeline
**Mål:** Monorepo med npm workspaces, Hono backend, React frontend, TypeScript + Vitest som bygger och serveras korrekt via Wrangler.
**Skapar:**
- `package.json` (root + backend/frontend/shared workspaces)
- `tsconfig.json` (root + per workspace med project references)
- `wrangler.toml` (Worker + Assets för frontend + D1-binding + Cron Trigger placeholder)
- `vitest.config.ts` — Vitest-konfiguration med `@cloudflare/vitest-pool-workers` för backend-tester
- `backend/src/index.ts` — minimal Hono med `GET /api/health` → `{ status: "ok" }`
- `backend/src/__tests__/health.test.ts` — första testet (GET /api/health returnerar 200 + JSON)
- `frontend/` — minimal React + Vite som renderar "Stage" med en `<h1>`
- `packages/shared/src/types.ts` — Event, Participant grundtyper
- `packages/shared/src/constants.ts` — StatusEnum, CategoryEnum
- `migrations/0001_events_participants.sql` — **bara events + participants** (2 tabeller)
- `.gitignore`, `CLAUDE.md`, `PROGRESS.md`, `TESTPLAN.md` (tom struktur), `README.md`, `SAD.md` (initial version)
- `git init` + första commit

**Beslut att dokumentera i CLAUDE.md:**
- TanStack Query för server state (installeras session 1)
- dnd-kit för drag-and-drop (installeras session 5)
- Vitest för enhetstester (setup i denna session)
- Error boundary + Toast-mönster (skapas session 1)
- Inkrementella migrationer — ny SQL-fil per session som behöver det

**Klart när:** `npm run dev` → `localhost:8787` serverar React-appen, `/api/health` returnerar JSON, `npm run typecheck` grön, `npm run test` grön (1 test).

---

### Session 1: Consid designsystem + Layout
**Mål:** Designsystem strikt enligt Consid Brand Guidelines 2025. Layout med sidebar, topbar, routing. Grundläggande UI-kit. TanStack Query setup.
**Skapar:**
- `frontend/src/styles/globals.css` — CSS-variabler enligt brand guidelines:
  - `--color-burgundy: #701131` (primär)
  - `--color-raspberry: #B5223F` (accent/CTA)
  - `--color-light-orange: #F49E88` (highlight)
  - `--color-beige: #EFE6DD` (bakgrund)
  - `--color-black: #1C1C1C` (text)
  - `--color-dark-purple: #492A34` (mörkt komplement)
  - `--color-greige: #A99B94` (neutral/border)
  - `--color-orange: #EC6B6A` (varning/uppmärksamhet)
  - Typografi: Consid Sans via `@font-face` (self-hosted från R2 eller bundlad)
  - Spacing-skala baserad på brand guidelines (versalt bokstavshöjd)
- `frontend/src/styles/design-tokens.ts` — exporterade tokens
- `frontend/src/assets/consid-logo.svg` — Consid-logotyp (primär horisontell + vit variant)
- `frontend/src/assets/consid-graphic-element.svg` — dekorativt cirkel-prick-motiv (20% opacity)
- `@font-face`-deklaration för Consid Sans (Regular + Semibold) — filer på R2 eller i `/public/fonts/`
- Layout-komponenter: `Sidebar.tsx` (Burgundy bg, vit logotyp + text), `Topbar.tsx`, `Layout.tsx`
- UI-komponenter: `Button.tsx` (Raspberry Red primär, Burgundy hover), `Badge.tsx`, `Modal.tsx`, `Input.tsx`, `Toast.tsx`, `ErrorBoundary.tsx`
- Alla komponenter följer WCAG-godkända färgkombinationer från brand guidelines kontrastmatris
- React Router: `/` (Översikt), `/events/:id` (Eventdetalj)
- TanStack Query: `QueryClientProvider` i App.tsx
- `Overview.tsx` + `EventDetail.tsx` med mockdata och tabs (Sammanfattning, Deltagare, Utskick, Inställningar)

**Mönster som etableras:**
- Loading states: Skeleton/spinner i varje vy
- Error states: ErrorBoundary + Toast för felmeddelanden
- Tom-states: "Inga event ännu — skapa ditt första" med CTA-knapp
- Grafiskt element som bakgrundsdekoration (cirkel-prick-motivet vid 20% opacity Light Orange)

**Branding-krav:** Strikt enligt `Consid brand guidelines_2025.pdf`. Alla färger via CSS-variabler (ingen hårdkodning). Consid Sans typsnitt. Logotyp med korrekt frizon. WCAG-godkända färgkombinationer.

**Klart när:** Appen matchar Consid Brand Guidelines — rätt färger (#701131, #B5223F, #F49E88, #EFE6DD), Consid Sans-typsnitt laddat, logotyp med frizon, sidebar-navigation fungerar, tabs på eventdetalj, typecheck grön.

---

### Session 2: Event CRUD API
**Mål:** Fullständig event-backend med Hono-routes, service-lager, zod-validering, bilduppladdning, klona event.
**Skapar:**
- `backend/src/routes/events.ts` — GET lista, POST skapa, GET :id, PUT uppdatera, DELETE mjuk-radera, POST :id/clone
- `backend/src/services/event.service.ts` — affärslogik, soft-delete (sätter `deleted_at`), klona event (kopierar alla fält utom datum/tid)
- `backend/src/utils/validation.ts` — Zod-schemas (delade med `packages/shared`)
- `backend/src/middleware/cors.ts` — CORS för dev + prod
- `backend/src/middleware/error-handler.ts` — global felhantering
- `backend/src/db/queries.ts` — typsäkra D1-frågor
- R2-binding i `wrangler.toml` + `POST /api/images` (upload till R2, max 5 MB, vitlista jpg/png/webp)
- `backend/src/routes/images.ts` — bilduppladdning med validering (MIME + magic bytes)
- Event-schema utökat med `image_url` (R2-URL till hero-bild)

**Tester:** `backend/src/services/__tests__/event.service.test.ts` — CRUD, soft-delete, clone, validering (5+ testfall)

**Klart när:** 6 event-endpoints fungerar, bilduppladdning till R2 fungerar, validering avvisar ogiltiga indata, soft-delete sätter `deleted_at`, `npm run test` grön.

---

### Session 3: Deltagar-CRUD API
**Mål:** Deltagarhantering backend — CRUD, statusmaskin, auto-väntlista, cancellation-token.
**Skapar:**
- `backend/src/routes/participants.ts` — GET lista (med filtrering), POST skapa, PUT uppdatera status, DELETE radera
- `backend/src/services/participant.service.ts`
- Statusmaskin: Inbjuden → Kommer / Tackat nej / Väntlista; Väntlista → Kommer; Kommer → Avbokad
- Auto-väntlista: vid POST, om `count >= max_participants` → status = "Väntlista" med `queue_position`
- `cancellation_token` (UUID) genereras vid skapande
- `PUT /api/events/:id/participants/:pid` — ändra status, kategori, företag

**Tester:** `backend/src/services/__tests__/participant.service.test.ts` — CRUD, statusmaskin (alla övergångar), auto-väntlista, token-generering (5+ testfall)

**Klart när:** CRUD fungerar, statusmaskin korrekt, auto-väntlista vid fullbokat, cancellation_token genereras, `npm run test` grön.

---

### Session 4a: Frontend — Event API-integration
**Mål:** Ersätt mockdata för events med riktiga API-anrop. Skapa api-client och event-hooks.
**Storlek:** ~7 filer (lämplig för en AI-session)
**Skapar:**
- `frontend/src/api/client.ts` — typad fetch-wrapper med felhantering
- `frontend/src/hooks/useEvents.ts` — useQuery/useMutation för events (lista, skapa, klona, radera)
- Uppdatera `Overview.tsx` — laddar events från API, visar stats, loading/error states
- `CreateEventModal.tsx` — formulär → POST /api/events (alla fält inkl. bild-upload)
- "Klona event"-knapp i eventöversikten
- Uppdatera `EventDetail.tsx` — laddar event från API, tabs fungerar

**Klart när:** Översikt visar riktiga events från API, skapa event fungerar, klona event fungerar, eventdetalj laddar korrekt, loading/error states visas.

---

### Session 4b: Frontend — Deltagar API-integration
**Mål:** Deltagar-UI kopplat till API. Sök, filter, badges, export.
**Storlek:** ~8 filer (lämplig för en AI-session)
**Skapar:**
- `frontend/src/hooks/useParticipants.ts` — useQuery/useMutation för deltagare
- `AddParticipantModal.tsx` — formulär → POST /api/events/:id/participants
- `ParticipantTable.tsx` — tabell med sök, filter (status, kategori), radera
- `StatusBadge.tsx`, `CategoryBadge.tsx` — visuella statusmarkeringar med Consid-färger
- `ExportButton.tsx` — exportera deltagarlista som CSV (namn, email, företag, kategori, status)
- `GET /api/events/:id/participants/export` — CSV-export endpoint (backend)

**Klart när:** Eventdetalj visar deltagare från API, sök/filter fungerar, lägg till/radera deltagare fungerar, CSV-export laddar ner korrekt fil, badges visar rätt färg per status.

---

### Session 5: Väntlista & köhantering
**Mål:** Kö-logik med drag-and-drop-ordning, svarsfrist, auto-uppflyttning.
**Skapar:**
- `backend/src/services/waitlist.service.ts` — köordning, uppflyttning vid avbokning, svarsfrist-validering
- `backend/src/routes/waitlist.ts` — PUT köordning, POST svarsfrist
- `frontend/src/components/features/participants/WaitlistPanel.tsx` — dnd-kit för drag-and-drop köordning
- Installera `@dnd-kit/core` + `@dnd-kit/sortable`
- UI för att sätta svarsfrist per väntlistad deltagare

**Tester:** `backend/src/services/__tests__/waitlist.service.test.ts` — uppflyttning vid avbokning, köordning, svarsfrist-validering (5+ testfall)

**Klart när:** Avbokning → automatisk uppflyttning, köordning redigerbar, svarsfrist kan sättas, `npm run test` grön.

---

### Session 6: Email-abstraktion + Resend + mailmallar
**Mål:** Email-interface, Resend-adapter, 6 HTML-mailmallar i Consid-profil, preview-endpoint.
**Storlek:** ~12 filer (⚠️ stor — om kontextfönstret tar slut, gör 3 mallar nu och resterande 3 som session 6b)
**Skapar:**
- `migrations/0002_email_sends.sql` — email_sends-tabell
- `backend/src/services/email/email.interface.ts` — `EmailProvider` interface
- `backend/src/services/email/resend.adapter.ts` — Resend SDK-implementation
- `backend/src/services/email/msgraph.adapter.ts` — stub (kastar "not implemented")
- `backend/src/services/email/factory.ts` — väljer adapter baserat på `EMAIL_PROVIDER` env
- `backend/src/services/email/templates/` — base-layout + 6 mallar:
  1. **Save the date** — datum, plats, kort teaser
  2. **Officiell inbjudan** — full info + RSVP-knappar (Ja/Nej)
  3. **Väntlista** — "Du står på plats X i kön"
  4. **Bekräftelse** — "Du är med!" + ICS-länk + avbokningslänk
  5. **Påminnelse** — "Eventet är snart — glöm inte!" (1 vecka / 1 dag före)
  6. **Tackmail** — "Tack för att du deltog!" (efteråt)
- `backend/src/services/email/template-renderer.ts` — merge fields: `{{namn}}`, `{{event}}`, `{{datum}}`, `{{plats}}`, `{{rsvp_ja_länk}}`, `{{rsvp_nej_länk}}`, `{{avbokningslänk}}`, `{{kalender_länk}}`
- `GET /api/templates/:type/preview` — förhandsgranska renderad mall
- **Alla mallar inkluderar:** Consid-logotyp i header, unsubscribe/avregistreringslänk i footer (GDPR art. 7(3)), kontaktinfo till eventskapare

**Mailmallar:** 6 mallar strikt enligt Consid Brand Guidelines 2025:
- Consid-logotyp i header (SVG → inline PNG för mailkompatibilitet)
- Färger: Burgundy #701131 (rubrik), Raspberry Red #B5223F (CTA-knappar), Beige #EFE6DD (bakgrund), Light Orange #F49E88 (accent)
- Typsnitt: Consid Sans med fallback `Arial, Helvetica, sans-serif` (mail-klienter stöder sällan custom fonts)
- Grafiskt element (cirkel-prick) som subtil dekoration
- Responsiva table-based layouts för Outlook-kompatibilitet (inline CSS, table layout, inga CSS grid/flex)
- WCAG-godkända färgkombinationer (vit text på Burgundy/Raspberry Red, svart text på Beige)

**Tester:**
- `backend/src/services/email/__tests__/template-renderer.test.ts` — merge fields renderas korrekt, alla 6 mallar genererar giltig HTML (6+ testfall)
- `backend/src/services/email/__tests__/factory.test.ts` — rätt adapter väljs baserat på env

**Klart när:** `POST /api/email/send` skickar testmail via Resend, factory väljer adapter, alla 6 mallar renderar korrekt med unsubscribe-länk, preview-endpoint fungerar, `npm run test` grön, `docs/email-abstraction.md` skriven.

---

### Session 7: Email-UI — formulärdriven
**Mål:** Komplett mailflöde: välj mall → fyll i text via formulär → välj mottagare → schemalägga/skicka. **Ingen GrapeJS — det är Fas 2.**
**Skapar:**
- `backend/src/routes/email.ts` — POST send, POST schedule, GET lista utskick
- `backend/src/services/email/scheduler.ts` — köhantering med rate limiting (max 80/dag Resend free, eller obegränsat betald)
- `backend/src/services/email/send-queue.ts` — persistent kö i D1, processed av Cron Trigger
- Cron Trigger i `wrangler.toml`: `crons = ["*/5 * * * *"]` (var 5:e minut)
- `scheduled()` handler i Worker för att processa mail-kö
- `frontend/src/components/features/email/TemplateSelector.tsx` — välj bland 6 mallar
- `frontend/src/components/features/email/TemplateForm.tsx` — formulär för merge fields (ämne, brödtext, CTA-knapp)
- `frontend/src/components/features/email/RecipientSelector.tsx` — filtrera mottagare (kategori, status)
- `frontend/src/components/features/email/SendOverview.tsx` — lista utskick per event
- `frontend/src/components/features/email/PreviewPanel.tsx` — förhandsgranska desktop/mobil
- "Skicka testmail till mig"-knapp
- "Skicka om 5 minuter (ångra)"-mekanism
- Utskick-tabb på eventdetalj

**Tester:** `backend/src/services/email/__tests__/scheduler.test.ts` — rate limiting, kölogik, schemaläggningstider (3+ testfall)

**Klart när:** Välj mall → fyll i text → välj mottagare → förhandsgranska → skicka/schemalägg. Testmail till egen adress fungerar. Cron Trigger processar kö. `npm run test` grön.

---

### Session 8: CSV-import
**Mål:** Importera deltagare från CSV med kolumnmappning och validering.
**Skapar:**
- `backend/src/services/import.service.ts` — parsning, validering, bulk-insert
- `backend/src/routes/import.ts` — POST upload, POST confirm
- `frontend/src/components/features/import/CSVUpload.tsx` — filuppladdning
- `frontend/src/components/features/import/ColumnMapper.tsx` — mappa CSV-kolumner till fält
- `frontend/src/components/features/import/ImportPreview.tsx` — förhandsgranska + validering

**Tester:** `backend/src/services/__tests__/import.service.test.ts` — parsning, validering, UTF-8/ISO-8859-1, felaktiga rader (4+ testfall)

**Klart när:** CSV upload → preview → kolumnmappning → validering → import. UTF-8 och ISO-8859-1. Felaktiga rader markeras med anledning. `npm run test` grön.

---

### Session 9: Deltagarportal (RSVP + avbokning)
**Mål:** Publik deltagarportal med RSVP-svar och avbokning via personlig token-länk. Detta är deltagarens enda touchpoint med systemet i Fas 1.
**Skapar:**
- `backend/src/routes/participant-portal.ts`:
  - `GET /rsvp/:token` — visa eventinfo + deltagarens status
  - `POST /rsvp/:token/yes` — status → "Kommer", skicka bekräftelsemail + ICS
  - `POST /rsvp/:token/no` — status → "Tackat nej"
  - `POST /rsvp/:token/cancel` — status → "Avbokad", trigga waitlist-uppflyttning
- `backend/src/services/participant-portal.service.ts` — validera token, statusövergångar, trigga waitlist.service + bekräftelsemail
- `frontend/src/pages/ParticipantPortal.tsx` — publik sida i Consid Brand Guidelines (utan admin-sidebar) som visar:
  - Consid-logotyp i header
  - Eventinfo (namn, datum, plats, beskrivning, hero-bild) — Consid Sans, Burgundy rubriker
  - Deltagarens nuvarande status
  - RSVP-knappar (Ja / Nej) — Raspberry Red #B5223F CTA-stil
  - Avboka-knapp — om status är "Kommer"
  - "Du är på väntlista (plats X)" — om status är "Väntlista"
  - Bekräftelsemeddelande efter åtgärd
  - Kontaktinfo till eventskaparen
  - Beige bakgrund (#EFE6DD), grafiskt element som dekoration
- RSVP-länkar i inbjudningsmallen: `{{rsvp_ja_länk}}` → `/rsvp/:token/yes`, `{{rsvp_nej_länk}}` → `/rsvp/:token/no`

**Flöde:**
1. Deltagare får inbjudningsmail med "Ja, jag kommer" / "Nej tack"-knappar
2. Klickar → landar på `/rsvp/:token` med bekräftelse
3. Senare: kan besöka samma URL för att se status eller avboka
4. Vid avbokning → nästa i kö erbjuds plats automatiskt

**Tester:** `backend/src/services/__tests__/participant-portal.service.test.ts` — token-validering, alla statusövergångar (Inbjuden→Kommer, Inbjuden→Tackat nej, Kommer→Avbokad), väntlista-trigger (5+ testfall)

**Klart när:** RSVP via mail-knapp fungerar (ja/nej), avbokning fungerar, väntlista-uppflyttning triggas, bekräftelsemail skickas vid "Kommer", portalen visar korrekt status. `npm run test` grön.

---

### Session 10: Behörighetssystem
**Mål:** Roller per event (Skapare/Redigerare/Läsare). Auth-middleware med interface för framtida Azure AD.
**Storlek:** ~8 filer + ändra alla befintliga routes (⚠️ refaktoreringsintensiv — börja med att läsa alla route-filer)
**Skapar:**
- `migrations/0003_event_permissions.sql` — event_permissions-tabell
- `backend/src/middleware/auth.ts` — `AuthProvider` interface + enkel token-implementation (header `X-Auth-Token`)
- Token-issuance: `POST /api/auth/login` (email → generera enkel JWT eller signerad token)
- `backend/src/services/permission.service.ts` — kontrollera roll per event
- `backend/src/routes/permissions.ts` — GET/POST/DELETE behörigheter
- `frontend/src/components/features/settings/PermissionsPanel.tsx` — bjud in redigerare/läsare per event
- `frontend/src/pages/Login.tsx` — enkel inloggningssida
- Alla befintliga API-routes skyddade med auth-middleware
- `docs/auth-abstraction.md`

**Tester:** `backend/src/services/__tests__/permission.service.test.ts` — rollkontroll (Skapare/Redigerare/Läsare), oautentiserad åtkomst nekas, token-validering (5+ testfall)

**Klart när:** Inloggning fungerar, endpoints skyddade, Redigerare kan ändra, Läsare kan bara se, UI för rollhantering. `npm run test` grön.

---

### Session 11: Aktivitetslogg + Sök
**Mål:** Automatisk aktivitetslogg per event + global sökfunktion i topbar.
**Skapar:**
- `migrations/0004_activities.sql` — activities-tabell
- `backend/src/services/activity.service.ts` — logga vid mail/deltagarändringar automatiskt
- `backend/src/routes/activities.ts` — GET lista per event
- `frontend/src/components/features/events/ActivityTimeline.tsx` — tidslinje i Sammanfattning-tabben
- `backend/src/routes/search.ts` — `GET /api/search?q=` (söker events på namn, plats, kontaktperson)
- `frontend/src/components/layout/SearchBar.tsx` — autocomplete i topbar med tangentbordsnavigering

**Tester:** `backend/src/services/__tests__/activity.service.test.ts` — aktiviteter loggas korrekt, sökresultat filtreras (3+ testfall)

**Klart när:** Aktiviteter loggas automatiskt, tidslinje visas, global sök returnerar events i realtid, klick navigerar till event. `npm run test` grön.

---

### Session 12: Inställningar + ICS-kalender
**Mål:** Inställningar-tabben (redigera event, synlighet, GDPR). ICS-filgenerering.
**Skapar:**
- `frontend/src/components/features/settings/EventSettingsForm.tsx` — redigera event (PUT /api/events/:id)
- `frontend/src/components/features/settings/VisibilityToggle.tsx`
- `frontend/src/components/features/settings/DangerZone.tsx` — radera event med bekräftelse
- `backend/src/services/ics.service.ts` — generera ICS-filer med VTIMEZONE
- `GET /api/events/:id/calendar.ics`
- "Lägg till i kalender"-länk i bekräftelsemail (uppdatera template)

**Tester:** `backend/src/services/__tests__/ics.service.test.ts` — ICS genereras med korrekt VTIMEZONE, datum, plats (3+ testfall)

**Klart när:** Event redigerbart via Inställningar-tabb, synlighet togglas, ICS laddar ner och öppnas i Outlook/Google Calendar, ICS-länk i bekräftelsemail. `npm run test` grön.

---

### Session 13: Integrationstester, polish, deploy Fas 1
**Mål:** Integrationstester (enhetstester finns redan per session), bugfixar, deploy till staging.
**Skapar:**
- **Integrationstester** — testa flöden end-to-end mot D1 via miniflare:
  - Skapa event → lägg till deltagare → fullbokat → auto-väntlista
  - Skapa event → skicka inbjudan → RSVP ja → bekräftelsemail
  - Avbokning → väntlista-uppflyttning → nytt erbjudande
  - Behörigheter: Skapare vs Redigerare vs Läsare på samma event
- `deploy.sh` — bygger frontend + deployer Worker
- Slutgiltig `README.md`, uppdaterad `SAD.md` (komplett för förvaltning)
- Deploy till `stage.mikwik.se`
- Migrera data från prototypens D1 (om relevant)

**Klart när:** Inga TS-fel, alla enhetstester + integrationstester gröna, deploy fungerar, appen tillgänglig på `stage.mikwik.se`, SAD.md komplett för onboarding av ny utvecklare.

---

## Fas 2: WYSIWYG + Webbplats + Brand-kontroll (session 14–18, 5 sessioner)

> Mål: GrapeJS för mailredigering och eventwebbplats. Systemadmin-roll och varumärkesstyrning. Kräver R2 för bildlagring (redan satt upp i session 2).

### Session 14: GrapeJS mailredigerare
**Mål:** Integrera GrapeJS som WYSIWYG drag-and-drop editor för mailutskick. Ersätter formulärdriven redigering med visuell editor. **Brand-safe by default.**
**Skapar:**
- `frontend/src/components/editor/EmailEditor.tsx` — GrapeJS-wrapper (lazy-loaded)
- `frontend/src/components/editor/grapejs-email-preset.ts` — email-blocks: text, bild, knapp, avdelare, kolumner
- `frontend/src/components/editor/grapejs-brand-config.ts` — Consid brand constraints:
  - Färgväljare: **bara** godkänd Consid-palett (Burgundy, Raspberry Red, Light Orange, Beige, Black, Dark Purple, Greige, Orange + vit)
  - Typsnitt: **bara** Consid Sans (+ mail-fallbacks Arial/Helvetica)
  - CTA-block: Raspberry Red #B5223F bakgrund, vit text (förinställt, ej ändringsbart)
  - Bildblock: uppladdning till R2 med max 5 MB
- Integration med befintliga mailmallar som startpunkter i editorn (alla redan brand-compliant från session 6)
- Preview desktop/mobil
- Uppdatera `TemplateSelector.tsx` — "Redigera i editor" vs "Snabbredigera med formulär"
- GrapeJS image upload → R2 (redan uppsatt i session 2)

**Risk:** GrapeJS är primärt designad för webbsidor, inte mail. Outlook renderar via Word-motorn. **Mitigering:** Begränsa till 5-7 blocktyper, tvinga table-layout i genererad HTML, testa i Outlook/Gmail/Apple Mail.

**Klart när:** Användare kan öppna mall i GrapeJS, dra-och-släpp block, redigera text/bilder (med bilduppladdning till R2), exportera HTML, preview desktop/mobil.

---

### Session 15: Eventwebbplats
**Mål:** Publik eventwebbsida med formulärdriven sidgenerering (2-3 templates). Anmälningsformulär med GDPR.
**Skapar:**
- `backend/src/routes/website.ts` — spara/hämta webbsida-data, GET /e/:slug (publik rendering)
- `backend/src/services/website.service.ts` — generera HTML från template + data
- 2-3 webbplatsmallar strikt enligt Consid Brand Guidelines (hero + info, hero + program + plats, hero + info + offentlig sektor) — Consid Sans, godkänd färgpalett, logotyp, grafiskt element
- `frontend/src/components/features/settings/WebsitePanel.tsx` — välj template, fyll i fält, preview
- `frontend/src/pages/PublicEvent.tsx` — publik eventwebbsida
- Anmälningsformulär med GDPR-samtycke: POST /api/events/:slug/register
- "Lägg till i kalender"-knapp på webbsidan

**Klart när:** `/e/:slug` visar eventwebbsida, anmälningsformulär fungerar, GDPR-samtycke registreras.

---

### Session 16: GrapeJS webbplatsredigerare (valfri)
**Mål:** Visuell drag-and-drop editor för eventwebbsidor. **Kan skippas om formulärdriven redigering räcker.**
**Skapar:**
- `frontend/src/components/editor/PageEditor.tsx` — GrapeJS för webbsidor (reuse blocks från EmailEditor)
- Integration med befintliga webbplatsmallar som startpunkter
- Spara/ladda webbsid-HTML via API
- Offentlig sektor-sida med obligatoriska fält

**Klart när:** Användare kan redigera eventwebbsida visuellt, spara, publicera.

---

### Session 17: Systemadmin + brand-kontroll
**Mål:** Central översikt och varumärkesstyrning. Krockkontroll. Mall-lås i GrapeJS.
**Skapar:**
- `migrations/0005_admin_role.sql` — utöka `event_permissions` med global `admin` roll
- `backend/src/services/admin.service.ts` — lista alla event (oavsett behörighet), cross-event dashboard-data
- `backend/src/routes/admin.ts` — GET /api/admin/events, GET /api/admin/dashboard
- `frontend/src/pages/AdminDashboard.tsx` — cross-event översikt:
  - Totalt antal event (aktiva/historiska)
  - Totalt antal deltagare (per kategori)
  - Kommande event med deltagarsiffror
  - Senaste utskick (cross-event)
- **Krockkontroll:** `GET /api/events/conflicts?date=&location=` — varning vid överlappande event
- Frontend: varning vid eventskapande om krock detekteras
- **Mall-lås i GrapeJS:** Header (Consid-logotyp) och footer (unsubscribe + kontakt) är låsta/ej redigerbara i editorn
- `backend/src/services/template-lock.service.ts` — definiera låsta zoner per mall
- **Brand-enforcement i GrapeJS:**
  - Färgväljare begränsad till godkänd Consid-palett (#701131, #B5223F, #F49E88, #EFE6DD, #1C1C1C, #492A34, #A99B94, #EC6B6A)
  - Typsnitt begränsat till Consid Sans (+ mail-fallbacks)
  - CTA-knappar tvingar Raspberry Red #B5223F med vit text (WCAG-godkänt)
- Brevlådehantering: `GET /api/admin/mailboxes` — central lista över tillgängliga avsändarbrevlådor

**Klart när:** Admin kan se alla event, krockkontroll varnar, GrapeJS-header/footer är låst, GrapeJS-färgpalett begränsad till Consid-färger, brevlådor konfigureras centralt.

---

### Session 18: Test, polish, deploy Fas 2
**Mål:** Testa GrapeJS-integration, mailrendering i klienter, deploy.
**Skapar:**
- Testa mailrendering i Outlook, Gmail, Apple Mail (manuellt)
- Testa webbplats i mobil/desktop
- Testa admin-dashboard
- Bugfixar
- Uppdatera dokumentation
- Deploy till `stage.mikwik.se`

**Klart när:** GrapeJS-mail renderar korrekt i Outlook/Gmail/Apple Mail, webbplats fungerar, admin-dashboard visar cross-event data, deploy klar.

---

## Sessionsberoenden

```
Fas 1 (15 sessioner):
0 (Bootstrap)
└─ 1 (Design + Layout)
   └─ 2 (Event API)
      ├─ 3 (Deltagar API)
      │  └─ 4a (Frontend Events)
      │     └─ 4b (Frontend Deltagare)
      │        └─ 5 (Väntlista)
      │           └─ 9 (Deltagarportal)
      │
      └─ 6 (Email abstraktion + mallar)
         └─ 7 (Email UI formulärdriven)

8 (CSV-import) ← efter session 4b
10 (Behörigheter) ← efter session 2
11 (Aktiviteter + Sök) ← efter session 7
12 (Inställningar + ICS) ← efter session 6
13 (Deploy Fas 1) ← efter alla sessioner i Fas 1

Fas 2 (5 sessioner):
14 (GrapeJS mail) ← efter session 13
15 (Eventwebbplats) ← efter session 13
16 (GrapeJS webb, valfri) ← efter session 15
17 (Systemadmin + brand-kontroll) ← efter session 14
18 (Deploy Fas 2) ← efter alla 14–17
```

**Totalt: 20 sessioner** (Fas 1: 0, 1, 2, 3, 4a, 4b, 5, 6, 7, 8, 9, 10, 11, 12, 13. Fas 2: 14, 15, 16, 17, 18)

**Kritisk väg Fas 1:** `0 → 1 → 2 → 3 → 4a → 4b → 5 → 9` (8 sessioner)
**Parallella kedjor:** `2 → 6 → 7`, `2 → 10`, `4b → 8`, `7 → 11`, `6 → 12`

### Sessionsstorlek (AI-budget)

| Session | Nya/ändrade filer | Bedömning |
|---|---|---|
| 0 | ~10 | ✅ Config/scaffolding |
| 1 | ~15 | ⚠️ Stor men nödvändig (designsystem) |
| 2 | ~8 | ✅ Backend only |
| 3 | ~5 | ✅ Fokuserad |
| 4a | ~7 | ✅ Event-frontend |
| 4b | ~8 | ✅ Deltagar-frontend |
| 5 | ~4 | ✅ Liten |
| 6 | ~12 | ⚠️ 6 HTML-mallar — överväg att göra 3+3 om det tar för lång tid |
| 7 | ~10 | ✅ OK men tight |
| 8 | ~6 | ✅ Liten |
| 9 | ~3 | ✅ Fokuserad |
| 10 | ~8 + refaktor | ⚠️ Auth på alla routes — läs alla route-filer först |
| 11 | ~6 | ✅ OK |
| 12 | ~5 | ✅ Liten |
| 13 | Varierande | ✅ Test/deploy |

---

## Deploy-strategi

1. **Under utveckling:** Lokalt via `wrangler dev --local`
2. **Fas 1 deploy (session 13):** Worker `stage` på `stage.mikwik.se/*`
3. **Fas 2 deploy (session 17):** Uppdaterad deploy till samma
4. **Produktion:** Byt till `event.consid.se` när DNS finns
5. **Prototypen** på `mikwik.se/stage/` lever kvar tills nya appen tar över

Ny D1-databas (`stage_db_v2`) för att undvika schemakonflikter med prototypen.

---

## CLAUDE.md (mall)

Varje session börjar med att läsa CLAUDE.md som innehåller:
- Vad projektet gör (2-3 meningar)
- Tech-stack (tabell)
- Repostruktur (tree)
- Kommandon (`npm run dev`, `build`, `typecheck`, `db:migrate:local`)
- API-mönster (kort Hono-route-exempel)
- Frontend-mönster (TanStack Query hook-exempel)
- Designsystem (Consid Brand Guidelines 2025: Burgundy #701131, Raspberry Red #B5223F, Light Orange #F49E88, Beige #EFE6DD, Black #1C1C1C. Font: Consid Sans. Se planen för fullständig palett.)
- Branding-krav: Strikt enligt `Consid brand guidelines_2025.pdf`. Alla färger via CSS-variabler. Inga egna färgval.
- Felhanteringsmönster (ErrorBoundary, Toast, loading states)
- Nyckeldesignbeslut (soft-delete, token-auth, email-interface, inkrementella migrationer)
- "Se PROGRESS.md för aktuell status"
- "Vad INTE göra"-lista

Max ~150 rader — allt en AI-session behöver för att komma igång utan att läsa all kod.

---

## PROGRESS.md (mall)

Per session:
- Datum, status (DONE/IN PROGRESS/NEXT)
- Checklista med deliverables
- Anteckningar (problem, beslut, saker att tänka på nästa gång)
- Git commit-hash

Plus:
- Arkitekturbeslut-logg (tabell)
- Kända problem (tabell)
- Migrations-logg (vilka migrationer som körts lokalt/remote)

---

## Databasschema (inkrementellt)

### Migration 0001 (session 0): events + participants

```sql
events (id, name, emoji, slug UNIQUE, date, time, end_date, end_time,
  location, description, organizer, organizer_email, status, type,
  max_participants, overbooking_limit, visibility, sender_mailbox,
  gdpr_consent_text, image_url, created_by, created_at, updated_at, deleted_at)

participants (id, event_id FK, name, email, company, category, status,
  queue_position, response_deadline, cancellation_token UNIQUE,
  email_status, gdpr_consent_at, created_at, updated_at)
```

### Migration 0002 (session 6): email_sends

```sql
email_sends (id, event_id FK, template_type, subject, html_content,
  status, scheduled_at, sent_at, recipient_filter JSON,
  recipient_count, sent_count, bounce_count, created_by, created_at)
```

### Migration 0003 (session 10): event_permissions

```sql
event_permissions (id, event_id FK, user_email, user_name, role,
  created_at, UNIQUE(event_id, user_email))
```

### Migration 0004 (session 11): activities

```sql
activities (id, event_id FK, type, description, metadata JSON,
  created_by, created_at)
```

---

## Verifiering

### Efter Fas 1 (session 13) — som eventskapare:
- Logga in → se events → skapa nytt event (med hero-bild)
- Klona befintligt event → nytt event med kopierade inställningar
- Lägg till deltagare → auto-väntlista vid fullt
- Ändra köordning via drag-and-drop
- Välj mailmall (6 st) → fyll i text → förhandsgranska → skicka testmail till sig själv
- Schemalägg utskick → Cron Trigger processar vid rätt tid
- CSV-import → deltagare läggs till
- Exportera deltagarlista som CSV
- Ladda ner ICS → öppnas i kalender
- Behörigheter → Läsare kan inte redigera
- Global sök → hittar events
- Aktivitetstidslinje → visar historik

### Efter Fas 1 (session 13) — som deltagare:
- Får inbjudningsmail → klickar "Ja, jag kommer" → landar på deltagarportal
- Ser eventinfo, bekräftelse, ICS-länk
- Besöker `/rsvp/:token` senare → ser status, kan avboka
- Avbokning → nästa i kö erbjuds plats
- Alla mail har unsubscribe-länk i footer

### Efter Fas 2 (session 18):
- Redigera mail i GrapeJS → ladda upp bild → skicka
- Mail renderas korrekt i Outlook/Gmail/Apple Mail
- GrapeJS header/footer låsta (Consid-logotyp + unsubscribe skyddade)
- GrapeJS färgväljare begränsad till Consid-palett — eventskapare kan inte välja "fel" färg
- Skapa eventwebbplats → publikt på /e/:slug
- Anmälningsformulär → GDPR-samtycke registreras

### Efter Fas 2 (session 18) — som central brand-ansvarig:
- Admin-dashboard → se alla event i organisationen
- Krockkontroll → varning vid överlappande event
- Brevlådehantering → konfigurera tillgängliga avsändarbrevlådor
- GrapeJS mall-lås → header/footer kan inte ändras av eventskapare
- GrapeJS brand-enforcement → färger och typsnitt låsta till Consid-profilen

### Brand guidelines-verifiering (alla faser):
- Alla sidor använder Consid Sans (eller korrekt fallback)
- Alla färger matchar godkänd Consid-palett (ingen #E63946, ingen #1D3557, inget Inter-typsnitt)
- Logotyp med korrekt frizon överallt (sidebar, mail, deltagarportal, webbplats)
- WCAG-godkända färgkombinationer enligt brand guidelines kontrastmatris
- Grafiskt element (cirkel-prick) används som bakgrundsdekoration

---

## Ändringslogg

| Rev | Datum | Ändringar |
|-----|-------|-----------|
| 1 | 2026-02-20 | Ursprunglig plan (19 sessioner) |
| 2 | 2026-02-20 | **Teknisk granskning:** GrapeJS till Fas 2, inkrementella migrationer, TanStack Query, dnd-kit, Cron Triggers, Resend-begränsning, R2, bundlestorlek, auth login, kritisk väg korrigerad. 18 sessioner (0–17) i 2 faser. |
| 3 | 2026-02-20 | **Användargranskning (3 perspektiv):** RSVP-flöde via token (session 9 → deltagarportal). 6 mailmallar (+ påminnelse, tackmail). Unsubscribe i alla mail. CSV-export. Klona event. Eventbild (R2 i Fas 1). Systemadmin-roll + cross-event dashboard (session 17). Mall-lås i GrapeJS. Krockkontroll. 19 sessioner (0–18) i 2 faser. |
| 4 | 2026-02-20 | **Consid Brand Guidelines 2025:** Korrekta färger (Burgundy #701131, Raspberry Red #B5223F, Light Orange #F49E88, Beige #EFE6DD — ersätter felaktiga #E63946/#1D3557/#F8F9FA). Consid Sans typsnitt (ersätter Inter). Ny sektion "Consid Brand Guidelines" med fullständig palett, tillgänglighetsmatris, logotypregler, grafiskt element. Brand-enforcement i GrapeJS (session 14+17): låst färgväljare, låst typsnitt, låst header/footer. Deltagarportal och eventwebbplats i brand-profil. WCAG-verifiering. |
| 5 | 2026-02-20 | **AI-sessionsgranskning:** Session 4 delad i 4a (event-frontend) + 4b (deltagar-frontend). Nytt "Sessionsprotokoll" med strikt handoff-rutin: varje session avslutas med startprompt för nästa, ingen auto-start. Sessionsstorlek-tabell med AI-budget. Safety-ventil på session 6. Totalt 20 sessioner. |
| 6 | 2026-02-20 | **Test + dokumentation:** Vitest i tech-stack. Enhetstester i VARJE session. SAD.md uppdateras varje session. Session 13 = integrationstester. |
| 7 | 2026-02-20 | **Manuella testfall:** Ny `TESTPLAN.md` — manuella testfall skapas löpande per session. Skrivet från användarperspektiv med tydliga steg, URL:er, förväntat resultat. Utformat för framtida AI-driven testning (Chrome-tillägg). Steg 9 i sessionsavslutning. |
