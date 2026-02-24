# Stage — Refaktorering & Förvaltningsplan (Fas 3)

> Genererad från fullständig repoanalys (2026-02-24).
> 6 parallella agenter analyserade: säkerhet, kodkvalitet, frontend, tester, DX, databas/API.

## Bakgrund

Fas 1 (sessions 0–13) och Fas 2 (sessions 14–18) levererade en komplett eventplattform. Kodbasen är produktionsklar men har teknisk skuld som behöver åtgärdas innan mänskliga utvecklare kan bidra effektivt.

**Principer (samma som Fas 1–2):**

- Varje session = en separat AI-konversation
- Max 400 rader per fil
- Affärslogik i services, tunna routes
- Tester parallellt med kod — `npm run test` grönt vid sessionsavslut
- `npm run typecheck` grönt vid sessionsavslut
- Dokumentation uppdateras varje session (PROGRESS.md, SAD.md, TESTPLAN.md, SESSION-GUIDE.md)

---

## Sessionsöversikt

| Session | Fokus                                       | Uppskattad storlek |
| ------- | ------------------------------------------- | ------------------ |
| **19**  | Säkerhetsfixar (kritiska + höga)            | Medel              |
| **20**  | Backend-refaktorering + saknade tester      | Stor               |
| **21**  | Frontend-refaktorering (stora filer)        | Stor               |
| **22**  | Developer Experience (CI/CD, linting, docs) | Medel              |

---

## Session 19: Säkerhetsfixar

**Mål:** Åtgärda alla kritiska och höga säkerhetsfynd.

### 19.1 — XSS-skydd i PublicEvent (KRITISK)

- **Fil:** `frontend/src/pages/PublicEvent.tsx:188`
- **Problem:** `dangerouslySetInnerHTML={{ __html: websiteData.page_html }}` utan sanitering
- **Åtgärd:** Installera `dompurify` + `@types/dompurify`. Sanitera HTML innan rendering.
- **Verifiering:** Testa att `<script>alert(1)</script>` i page_html inte exekveras

### 19.2 — R2 path traversal (HÖG)

- **Fil:** `backend/src/routes/images.ts:37`
- **Problem:** `prefix` och `filename` från URL-parametrar valideras ej
- **Åtgärd:** Validera prefix mot allowlist (`['events']`), validera filename som UUID + extension (`/^[0-9a-f-]{36}\.(jpg|png|webp)$/`)
- **Test:** Nytt testfall i `backend/src/__tests__/` — verifierar att `../../etc/passwd` returnerar 400

### 19.3 — Rate limiting på publika endpoints (HÖG)

- **Filer:** `backend/src/routes/auth.ts`, `backend/src/routes/rsvp.ts`
- **Problem:** Ingen rate limiting — möjliggör brute-force och konto-spam
- **Åtgärd:** Skapa `backend/src/middleware/rate-limiter.ts` med in-memory sliding window (Cloudflare Worker har inga delade minne mellan requests, men D1-baserad rate limit-tabell eller Cloudflare KV om tillgängligt). Alternativt: enkel per-request check mot D1 med `rate_limits`-tabell.
- **Begränsningar:** `auth/login` = 10 req/IP/timme, `rsvp/respond` = 5 req/token/minut
- **Migration:** `migrations/0009_rate_limits.sql` — tabell `rate_limits(key TEXT, window_start INTEGER, count INTEGER)`
- **Test:** 2 testfall — verifierar att 11:e login-försöket returnerar 429

### 19.4 — Admin-bypass i behörighetshantering (MEDIUM)

- **Fil:** `backend/src/routes/permissions.ts:31-35`
- **Problem:** Admins blockeras av `isOwner`-check, kan inte hantera behörigheter
- **Åtgärd:** Lägg till `isAdmin`-check: `if (!isOwner && !isAdmin)`
- **Test:** Utöka befintligt permission-test med admin-scenario

### 19.5 — JSON.parse-skydd i website service (HÖG)

- **Fil:** `backend/src/services/website.service.ts:25, 85`
- **Problem:** `JSON.parse(website_data)` utan try-catch — kraschar vid ogiltig JSON
- **Åtgärd:** Wrappa i try-catch, returnera `null` vid parse-fel
- **Test:** Testfall i `website.service.test.ts` med ogiltig JSON

### Filer som ändras

```
frontend/src/pages/PublicEvent.tsx          # DOMPurify-sanitering
frontend/package.json                       # + dompurify dependency
backend/src/routes/images.ts                # Prefix/filename-validering
backend/src/routes/auth.ts                  # Rate limiting
backend/src/routes/rsvp.ts                  # Rate limiting
backend/src/routes/permissions.ts           # Admin-bypass
backend/src/middleware/rate-limiter.ts       # NY — rate limiting middleware
backend/src/services/website.service.ts     # JSON.parse try-catch
migrations/0009_rate_limits.sql             # NY — rate limits tabell
backend/src/__tests__/security.test.ts      # NY — säkerhetstester
backend/src/services/__tests__/website.service.test.ts  # Utökat
backend/src/services/__tests__/permission.service.test.ts  # Utökat
```

### Risker

- **Rate limiting i Workers:** Workers har inget delat minne mellan isolates. D1-baserad lösning har latens. Alternativ: Cloudflare Rate Limiting (betalplan) eller acceptera att in-memory rate limit bara skyddar per-isolate.
- **DOMPurify i Workers:** DOMPurify behöver DOM — fungerar bara i frontend (React), inte i backend. Kontrollera att vi saniterar i rätt lager.

---

## Session 20: Backend-refaktorering + saknade tester

**Mål:** Eliminera kodduplici, standardisera mönster, testa otestade services.

### 20.1 — Konsolidera HTML-escape-funktioner

- **Filer:** `backend/src/services/email/html-builder.ts:112-118`, `backend/src/services/email/template-renderer.ts:87-93`
- **Problem:** Identiska `escapeHtml()` / `escapeHtmlChars()` i 2 filer
- **Åtgärd:** Skapa `backend/src/utils/escaping.ts` med en `escapeHtml()`. Importera i båda filerna.

### 20.2 — Extrahera delade route-hjälpfunktioner

- **Problem:** `validateEvent()` duplicerad i `participants.ts:14-24` och `mailings.ts:13-23`. ID-validering (7 routes) upprepas.
- **Åtgärd:** Flytta till `backend/src/utils/route-helpers.ts`:
  - `parseIdParam(value: string, fieldName: string): number` — kastar 400 vid ogiltigt
  - `validateEventAccess(db, eventId, userId): Promise<Event>` — returnerar event eller kastar 403/404
- **Standardisera:** Ersätt alla `isNaN(id)` med `Number.isFinite(id)` i `website.ts`, `activities.ts`

### 20.3 — Refaktorera mailing.service.ts

- **Fil:** `backend/src/services/mailing.service.ts` (323 rader)
- **Problem:** Email-queue-byggande duplicerat 3 gånger, direct-send-loop duplicerad 2 gånger
- **Åtgärd:** Extrahera:
  - `buildQueueItem(mailing, recipient, context): QueueItem` — privat helper
  - `sendEmailsDirect(provider, items): SendResult` — privat helper
  - `DIRECT_SEND_THRESHOLD = 5` — namnge magisk siffra
- **Resultat:** ~50 rader mindre, tydligare ansvarsuppdelning

### 20.4 — Flytta search-query till service-lager

- **Fil:** `backend/src/routes/search.ts:17-30`
- **Problem:** SQL direkt i route — bryter arkitekturregeln
- **Åtgärd:** Skapa `backend/src/db/search.queries.ts` + `backend/src/services/search.service.ts`

### 20.5 — Tester för MailingService

- **Fil:** `backend/src/services/__tests__/mailing.service.test.ts` (NY)
- **Testfall (~8-10 st):**
  - send() med recipients <= 5 (direkt send)
  - send() med recipients > 5 (kö-baserat)
  - sendToNew() — filtrerar redan skickade
  - sendTest() — testmail med fake-kontext
  - Fedhanding: provider-fel returnerar errors-array
  - Duplicate send prevention

### 20.6 — Tester för RsvpService

- **Fil:** `backend/src/services/__tests__/rsvp.service.test.ts` (NY)
- **Testfall (~6-8 st):**
  - respond() med status "attending"
  - respond() med dietary_notes + plus_one
  - respond() auto-waitlist vid full kapacitet
  - cancel() sätter status till "cancelled"
  - Ogiltig token → null
  - Redan avbokad → response ändå

### 20.7 — Tester för email-subsystem

- **Fil:** `backend/src/services/email/__tests__/template-renderer.test.ts` (NY)
- **Testfall (~5 st):**
  - renderHtml() — merge fields ersätts
  - renderHtml() — XSS i namn escapes korrekt
  - renderHtml() — URL-fält (rsvp_link) escapes INTE
  - renderText() — enkel ersättning
  - buildMergeContext() — alla fält mappas korrekt

### Filer som ändras

```
backend/src/utils/escaping.ts               # NY — escapeHtml()
backend/src/utils/route-helpers.ts          # NY — parseIdParam(), validateEventAccess()
backend/src/services/email/html-builder.ts  # Importera escapeHtml
backend/src/services/email/template-renderer.ts  # Importera escapeHtml
backend/src/routes/participants.ts          # Använd route-helpers
backend/src/routes/mailings.ts              # Använd route-helpers
backend/src/routes/events.ts                # Använd parseIdParam
backend/src/routes/website.ts               # Standardisera ID-validering
backend/src/routes/activities.ts            # Standardisera ID-validering
backend/src/routes/search.ts                # Flytta query till service
backend/src/db/search.queries.ts            # NY
backend/src/services/search.service.ts      # NY (liten, ~20 rader)
backend/src/services/mailing.service.ts     # Extrahera helpers
backend/src/services/__tests__/mailing.service.test.ts      # NY
backend/src/services/__tests__/rsvp.service.test.ts         # NY
backend/src/services/email/__tests__/template-renderer.test.ts  # NY
```

### Risker

- **Stor session:** 17 filer berörs. Om det blir för stort, dela i 20a (refaktorering) + 20b (tester).
- **Route-helpers kan ändra error-format:** Befintliga frontend-felhantering kan behöva anpassas om felmeddelanden ändras.

---

## Session 21: Frontend-refaktorering

**Mål:** Bryt upp 7 filer som överskrider 400-radersgränsen. Förbättra a11y.

### 21.1 — Bryt upp SettingsTab.tsx (561 → ~200 + 4 delkomponenter)

- **Fil:** `frontend/src/components/features/settings/SettingsTab.tsx`
- **Åtgärd:** Extrahera till separata filer:
  - `EventInfoSection.tsx` — grundläggande eventinfo
  - `HeroImageSection.tsx` — hero-bilduppladdning
  - `VisibilitySection.tsx` — synlighet + sender
  - `DangerZone.tsx` — radera event
- **SettingsTab** blir en orkestrerare som renderar sektionerna

### 21.2 — Bryt upp WebsitePanel.tsx (607 → ~250 + 2 delkomponenter)

- **Fil:** `frontend/src/components/features/settings/WebsitePanel.tsx`
- **Åtgärd:** Extrahera:
  - `WebsiteTemplateSelector.tsx` — template-val + preview
  - `WebsiteFormFields.tsx` — formulärfält per template
  - `useWebsiteForm.ts` — hook för formulärstate + validering
- **WebsitePanel** koordinerar editor-öppning + template-val

### 21.3 — Bryt upp RsvpPage.tsx (568 → ~200 + 3 delkomponenter)

- **Fil:** `frontend/src/pages/RsvpPage.tsx`
- **Åtgärd:** Extrahera:
  - `RsvpResponseForm.tsx` — formulär med dietary/plus-one
  - `RsvpConfirmation.tsx` — bekräftelsevy
  - `useRsvpState.ts` — hook för state-maskin (loading → form → confirmed → cancelled)

### 21.4 — Bryt upp PublicEvent.tsx (543 → ~200 + 2 delkomponenter)

- **Fil:** `frontend/src/pages/PublicEvent.tsx`
- **Åtgärd:** Extrahera:
  - `PublicRegistrationForm.tsx` — anmälningsformulär
  - `PublicEventRenderer.tsx` — template/custom page rendering

### 21.5 — Bryt upp EventForm.tsx (484 → ~250 + hooks)

- **Fil:** `frontend/src/components/EventForm.tsx`
- **Åtgärd:** Extrahera:
  - `useEventFormValidation.ts` — hook för validering
  - `useConflictCheck.ts` — hook för krockkontroll
- **EventForm** behåller layout men delegerar logik till hooks

### 21.6 — Bryt upp CreateMailingModal.tsx (447 → ~250 + hook)

- **Fil:** `frontend/src/components/features/email/CreateMailingModal.tsx`
- **Åtgärd:** Extrahera:
  - `useMailingForm.ts` — hook för formulärstate, mallval, validering

### 21.7 — Bryt upp AdminDashboard.tsx (418 → ~200 + 2 delkomponenter)

- **Fil:** `frontend/src/pages/AdminDashboard.tsx`
- **Åtgärd:** Extrahera:
  - `DashboardStats.tsx` — statistikkort
  - `DashboardEventList.tsx` — eventlista med filter

### 21.8 — Accessibility-fixar

- Lägg till `alt`-text på bilder i `RsvpPage.tsx:76`, `PublicEvent.tsx`
- Lägg till `aria-label` på alla ikonknappar (clone-knapp i `Overview.tsx:83`, reorder-knappar)
- Implementera focus trap i `Modal.tsx` (Tab-fångst inom modal)
- Öka touch targets till minst 44px på småknappar

### Filer som ändras

```
# Uppbrutna filer (7 befintliga → 7 + ~15 nya)
frontend/src/components/features/settings/SettingsTab.tsx
frontend/src/components/features/settings/WebsitePanel.tsx
frontend/src/components/features/settings/EventInfoSection.tsx      # NY
frontend/src/components/features/settings/HeroImageSection.tsx      # NY
frontend/src/components/features/settings/VisibilitySection.tsx     # NY
frontend/src/components/features/settings/DangerZone.tsx            # NY
frontend/src/components/features/settings/WebsiteTemplateSelector.tsx  # NY
frontend/src/components/features/settings/WebsiteFormFields.tsx     # NY
frontend/src/hooks/useWebsiteForm.ts                                # NY
frontend/src/pages/RsvpPage.tsx
frontend/src/pages/RsvpResponseForm.tsx                             # NY (eller subfolder)
frontend/src/pages/RsvpConfirmation.tsx                             # NY
frontend/src/hooks/useRsvpState.ts                                  # NY
frontend/src/pages/PublicEvent.tsx
frontend/src/pages/PublicRegistrationForm.tsx                       # NY
frontend/src/pages/PublicEventRenderer.tsx                          # NY
frontend/src/components/EventForm.tsx
frontend/src/hooks/useEventFormValidation.ts                        # NY
frontend/src/hooks/useConflictCheck.ts                              # NY
frontend/src/components/features/email/CreateMailingModal.tsx
frontend/src/hooks/useMailingForm.ts                                # NY
frontend/src/pages/AdminDashboard.tsx
frontend/src/pages/DashboardStats.tsx                               # NY
frontend/src/pages/DashboardEventList.tsx                           # NY
# A11y-fixar
frontend/src/components/ui/Modal.tsx
frontend/src/pages/RsvpPage.tsx               # (ingår redan ovan)
frontend/src/pages/PublicEvent.tsx             # (ingår redan ovan)
frontend/src/components/features/events/Overview.tsx
```

### Risker

- **Stor session — 25+ filer.** Överväg att dela i 21a (SettingsTab + WebsitePanel + RsvpPage + a11y) och 21b (PublicEvent + EventForm + CreateMailingModal + AdminDashboard) om kontextfönstret inte räcker.
- **Refaktorering utan nya funktioner:** Risk att oavsiktligt ändra beteende. Verifiera med `npm run typecheck` + `npm run test` efter varje fil.
- **Inga automatiserade frontend-tester.** Beteendebrytningar upptäcks bara manuellt.

---

## Session 22: Developer Experience

**Mål:** Ge mänskliga utvecklare förutsättningar att bidra.

### 22.1 — ESLint + Prettier

- Installera: `eslint`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`, `prettier`, `eslint-config-prettier`
- Skapa `eslint.config.js` (flat config) med regler:
  - `@typescript-eslint/no-explicit-any: error`
  - `@typescript-eslint/no-unused-vars: error`
  - `max-lines: [warn, 400]`
- Skapa `.prettierrc` — 2 spaces, single quotes, trailing commas
- Skapa `.editorconfig` — indent_style = space, indent_size = 2
- Lägg till scripts i root `package.json`: `"lint"`, `"format"`, `"lint:fix"`
- Kör `lint:fix` på hela kodbasen och commita formatering separat

### 22.2 — GitHub Actions CI

- Skapa `.github/workflows/ci.yml`:
  - Trigger: push + pull_request
  - Steg: checkout → setup-node → npm ci → typecheck → lint → test
- Skapa `.github/pull_request_template.md` med checklista

### 22.3 — Dokumentation för utvecklare

- Uppdatera `README.md` med:
  - Prerequisites (Node 25.6+, npm 11.9+, valfritt Cloudflare-konto)
  - Steg-för-steg setup (clone → install → migrate → dev)
  - `.dev.vars.example`-mall
  - Troubleshooting (TS6305-fix, D1-setup)
  - Länk till CONTRIBUTING.md
- Skapa `CONTRIBUTING.md`:
  - Git workflow (main-branch, feature branches, PR-krav)
  - Commit-format (Conventional Commits-stil)
  - Arkitekturregler (tunna routes, services, 400-raders max)
  - Testning (krav + mönster)
  - Kodgranskning-checklista
- Skapa `.dev.vars.example`:
  ```
  # Email (valfritt lokalt — ConsoleEmailProvider används utan nyckel)
  # RESEND_API_KEY=re_xxxxxxxxxxxx
  ```
- Lägg till `"engines"` i root `package.json`

### 22.4 — Git hooks

- Installera `husky` + `lint-staged`
- Pre-commit: `lint-staged` (eslint --fix + prettier)
- Skapa `.gitattributes` för line endings

### Filer som ändras

```
eslint.config.js                            # NY
.prettierrc                                 # NY
.editorconfig                               # NY
.gitattributes                              # NY
.github/workflows/ci.yml                    # NY
.github/pull_request_template.md            # NY
CONTRIBUTING.md                             # NY
.dev.vars.example                           # NY
README.md                                   # Utökad
package.json                                # engines, scripts, devDependencies
```

### Risker

- **ESLint autofix kan ändra kod oavsiktligt.** Kör `npm run test` efter autofix.
- **Husky + Cloudflare Workers:** Verifiera att git hooks fungerar korrekt i workspace-setup.
- **CI kräver GitHub repo.** Om repot fortfarande är lokalt, förbered CI-filerna men verifiera efter push.

---

## Eventuella framtida sessioner (Fas 3+)

Dessa ryms inte i 4 sessioner men kan göras vid behov:

| Ämne                          | Beskrivning                                                                |
| ----------------------------- | -------------------------------------------------------------------------- |
| **Pagination**                | `?page=1&limit=50` på events, participants, mailings + frontend-paginering |
| **Frontend-tester**           | Vitest + React Testing Library för Login, EventDetail, RsvpPage            |
| **Soft-delete harmonisering** | Mjuk radering av participants (audit trail, GDPR)                          |
| **API-versionering**          | `/api/v1/` prefix, deprecation headers                                     |
| **Prestandaoptimering**       | Composite indexes, N+1-eliminering, lazy-loaded routes                     |
| **E-postvalidering**          | Förbättrad email-regex eller Zod `.email()`                                |
| **Observability**             | Sentry/Axiom error tracking, audit logging                                 |

---

## Uppskattning: Sessionsanpassning

Sessionsguiden anger att varje session ska vara en avgränsad AI-konversation. Baserat på erfarenhet från Fas 1–2:

- **Session 19 (Säkerhet):** Medelstor — 12 filer, 5 avgränsade fixar + tester. Ryms i en session.
- **Session 20 (Backend):** **Risk för överstorlek.** 17 filer, refaktorering + 3 nya testfiler med ~20 testfall. **Rekommendation:** Förbered delning i 20a + 20b om kontextfönstret tar slut.
  - **20a:** Refaktorering (20.1–20.4) — 12 filer
  - **20b:** Tester (20.5–20.7) — 5 nya filer, ~20 testfall
- **Session 21 (Frontend):** **Kommer sannolikt behöva delas.** 25+ filer, ren refaktorering. **Rekommendation:**
  - **21a:** SettingsTab + WebsitePanel + RsvpPage + a11y — 15 filer
  - **21b:** PublicEvent + EventForm + CreateMailingModal + AdminDashboard — 12 filer
- **Session 22 (DX):** Medelstor — mestadels konfigurationsfiler + README. Ryms i en session.

**Total uppskattning: 4–6 sessioner** (beroende på om 20 och 21 behöver delas).
