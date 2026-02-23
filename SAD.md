# SAD — Stage Systemarkitekturdokument

## Systemöversikt
Stage är en eventplaneringsplattform för Consid. Eventskapare hanterar events, deltagare och mailutskick. Deltagare svarar via personliga RSVP-länkar. Systemet körs på Cloudflare Workers med D1-databas.

## Arkitektur

```
┌─────────────┐     ┌──────────────────────────┐
│  Webbläsare │────▶│  Cloudflare Worker        │
│  (React)    │◀────│  ┌──────────────────────┐ │
└─────────────┘     │  │  Hono (TypeScript)   │ │
                    │  │  /api/*              │ │
                    │  └──────────┬───────────┘ │
                    │             │              │
                    │  ┌──────────▼───────────┐ │
                    │  │  D1 (SQLite)         │ │
                    │  │  stage_db_v2         │ │
                    │  └──────────────────────┘ │
                    │                           │
                    │  Frontend: Workers Assets  │
                    │  (Vite-bygge → statiska)  │
                    └──────────────────────────┘
```

Integrationer:
- **Resend** — Email via Resend API (session 4–5). Domän `mikwik.se` verifierad (DKIM + SPF). HTML-mail med Consid-branding. Avsändare: `Stage <noreply@mikwik.se>`. ConsoleEmailProvider som fallback utan API-nyckel.
- **R2** — Bildlagring (session 9). Bucket `stage-images`. Stöder JPEG, PNG, WebP, max 5 MB. Bilder serveras via `/api/images/:prefix/:filename` med cache-headers. IMAGES binding optional — returnerar 503 om ej konfigurerad.

- **Cron Triggers** — Email-kö (session 11). Kör var 5:e minut, processar upp till 20 väntande mail per körning. Konfigurerat i `wrangler.toml`: `crons = ["*/5 * * * *"]`.

## Repostruktur

| Mapp/Fil | Syfte |
|---|---|
| `backend/src/index.ts` | Hono app entry — alla routes monteras här |
| `backend/src/bindings.ts` | Cloudflare Env-typer (D1, R2, secrets) |
| `backend/src/routes/` | Tunna API-routes (parse → service → response) |
| `backend/src/routes/auth.ts` | Login-endpoint (POST /api/auth/login, GET /api/auth/me) |
| `backend/src/routes/permissions.ts` | Behörighets-CRUD per event |
| `backend/src/services/` | Affärslogik per domän (event, participant, waitlist, mailing, rsvp, image, permission, activity) |
| `backend/src/services/email/` | Email-abstraktionslager (interface, resend, console, factory, html-builder, template-renderer, send-queue) |
| `backend/src/services/email/templates/` | 6 email-mallar (save-the-date, invitation, waitlist, confirmation, reminder, thank-you) |
| `backend/src/services/__tests__/` | Service-enhetstester |
| `backend/src/middleware/auth.ts` | Auth-middleware + AuthProvider interface + token-provider |
| `backend/src/middleware/error-handler.ts` | Global error-handler (ZodError → 400, övriga → 500) |
| `backend/src/utils/validation.ts` | `parseBody()` — Zod-wrapper för request-validering |
| `backend/src/db/` | Typsäkra D1-frågor per domän (event, participant, mailing, waitlist, user, permission) |
| `frontend/src/components/features/` | Feature-komponenter per domän (events, participants, email, settings) |
| `frontend/src/` | React-app (Vite) |
| `packages/shared/src/` | Delade typer, konstanter + Zod-schemas |
| `migrations/` | Inkrementella D1 SQL-filer |
| `docs/` | IMPLEMENTATION-PLAN.md, RECOVERY-PLAN.md, SESSION-GUIDE.md, PRD, brand guidelines |

## API-endpoints

| Metod | Path | Beskrivning | Session |
|---|---|---|---|
| GET | `/api/health` | Hälsokontroll | 0 |
| GET | `/api/events` | Lista alla events (med participant_count) | 2 |
| GET | `/api/events/:id` | Hämta enskilt event | 2 |
| POST | `/api/events` | Skapa nytt event | 2 |
| PUT | `/api/events/:id` | Uppdatera event (partiell) | 2 |
| DELETE | `/api/events/:id` | Soft-delete event | 2 |
| GET | `/api/events/:id/participants` | Lista deltagare för event | 3 |
| POST | `/api/events/:id/participants` | Lägg till deltagare | 3 |
| PUT | `/api/events/:id/participants/:pid` | Uppdatera deltagare | 3 |
| DELETE | `/api/events/:id/participants/:pid` | Ta bort deltagare | 3 |
| POST | `/api/events/:id/participants/import` | CSV-import av deltagare | 6 |
| PUT | `/api/events/:id/participants/:pid/reorder` | Omordna väntlisteposition | 7 |
| GET | `/api/events/:id/calendar.ics` | Ladda ner ICS-kalenderfil | 7 |
| GET | `/api/events/:id/mailings` | Lista utskick för event | 4 |
| POST | `/api/events/:id/mailings` | Skapa nytt utskick | 4 |
| POST | `/api/events/:id/mailings/:mid/send` | Skicka utskick | 4 |
| GET | `/api/events/:id/participants/export` | Exportera deltagare som CSV | 9 |
| POST | `/api/images` | Ladda upp bild till R2 (multipart form-data) | 9 |
| GET | `/api/images/:prefix/:filename` | Hämta bild från R2 | 9 |
| POST | `/api/auth/login` | Logga in (email + name → token) | 10 |
| GET | `/api/auth/me` | Hämta inloggad användare via token | 10 |
| GET | `/api/events/:id/permissions` | Lista behörigheter för event (viewer+) | 10 |
| POST | `/api/events/:id/permissions` | Lägg till/uppdatera behörighet (owner) | 10 |
| DELETE | `/api/events/:id/permissions/:userId` | Ta bort behörighet (owner) | 10 |
| GET | `/api/events/:id/activities` | Lista aktivitetslogg (viewer+) | 11 |
| GET | `/api/search?q=` | Sök events (namn, plats, arrangör) | 11 |
| GET | `/api/templates` | Lista email-mallar (metadata) | 11 |
| POST | `/api/events/:id/clone` | Klona event (editor+) | 13a |
| POST | `/api/events/:id/mailings/:mid/test` | Skicka testmail till inloggad användare (editor+) | 13a |
| GET | `/api/templates/:type/preview` | Förhandsgranska renderad email-mall (auth) | 13a |
| GET | `/api/rsvp/:token` | Hämta deltagarinfo + eventinfo (publik) | 4 |
| POST | `/api/rsvp/:token/respond` | Svara attending/declined (publik) | 4 |
| POST | `/api/rsvp/:token/cancel` | Avboka deltagande (publik) | 4 |
| GET | `/api/events/:id/website` | Hämta webbplatskonfiguration (viewer+) | 15 |
| PUT | `/api/events/:id/website` | Spara webbplatskonfiguration (editor+) | 15 |
| GET | `/api/public/events/:slug` | Hämta publik eventdata för webbplats (publik) | 15 |
| POST | `/api/events/:slug/register` | Publik anmälan via webbplats (publik) | 15 |

## Databasschema

### events (migration 0001)
| Kolumn | Typ | Beskrivning |
|---|---|---|
| id | INTEGER PK | Auto-increment |
| name | TEXT NOT NULL | Eventnamn |
| emoji | TEXT | Emoji-ikon |
| slug | TEXT NOT NULL UNIQUE | URL-slug |
| date | TEXT NOT NULL | Datum (YYYY-MM-DD) |
| time | TEXT NOT NULL | Starttid (HH:MM) |
| end_date | TEXT | Slutdatum |
| end_time | TEXT | Sluttid |
| location | TEXT NOT NULL | Plats |
| description | TEXT | Beskrivning |
| organizer | TEXT NOT NULL | Kontaktperson |
| organizer_email | TEXT NOT NULL | Kontaktpersonens email |
| status | TEXT NOT NULL | planning/upcoming/ongoing/completed/cancelled |
| type | TEXT NOT NULL | conference/workshop/seminar/networking/internal/other |
| max_participants | INTEGER | Max antal (NULL = obegränsat) |
| overbooking_limit | INTEGER NOT NULL | Extra platser utöver max |
| visibility | TEXT NOT NULL | public/private |
| sender_mailbox | TEXT | Avsändaradress för mail |
| gdpr_consent_text | TEXT | GDPR-samtyckestext |
| image_url | TEXT | Hero-bild (R2-URL) |
| website_template | TEXT | Webbplatsmall (hero-info/hero-program-plats) (migration 0007) |
| website_data | TEXT | JSON med webbplatsdata (hero, program, plats) (migration 0007) |
| website_published | INTEGER NOT NULL | Publicerad (0/1) (migration 0007) |
| created_by | TEXT NOT NULL | Skaparens email |
| created_at | TEXT NOT NULL | Skapades |
| updated_at | TEXT NOT NULL | Senast ändrad |
| deleted_at | TEXT | Soft-delete tidsstämpel |

### participants (migration 0001)
| Kolumn | Typ | Beskrivning |
|---|---|---|
| id | INTEGER PK | Auto-increment |
| event_id | INTEGER FK | Referens till events |
| name | TEXT NOT NULL | Deltagarnamn |
| email | TEXT NOT NULL | Email |
| company | TEXT | Företag |
| category | TEXT NOT NULL | internal/public_sector/private_sector/partner/other |
| status | TEXT NOT NULL | invited/attending/declined/waitlisted/cancelled |
| queue_position | INTEGER | Köplats (för väntlista) |
| response_deadline | TEXT | Svarsfrist |
| dietary_notes | TEXT | Allergier/kostpreferenser |
| plus_one_name | TEXT | +1 gästens namn |
| plus_one_email | TEXT | +1 gästens email |
| cancellation_token | TEXT NOT NULL UNIQUE | Token för RSVP/avbokning |
| email_status | TEXT | Senaste mailstatus |
| gdpr_consent_at | TEXT | GDPR-samtycke tidsstämpel |
| created_at | TEXT NOT NULL | Skapades |
| updated_at | TEXT NOT NULL | Senast ändrad |

### mailings (migration 0002 + 0006)
| Kolumn | Typ | Beskrivning |
|---|---|---|
| id | INTEGER PK | Auto-increment |
| event_id | INTEGER FK | Referens till events |
| subject | TEXT NOT NULL | Ämnesrad |
| body | TEXT NOT NULL | Brödtext (plaintext) |
| html_body | TEXT | Custom HTML från GrapeJS editor (migration 0006) |
| editor_data | TEXT | GrapeJS project JSON för återeditering (migration 0006) |
| recipient_filter | TEXT NOT NULL | all/invited/attending/etc. |
| status | TEXT NOT NULL | draft/sent |
| sent_at | TEXT | Tidpunkt för utskick |
| created_at | TEXT NOT NULL | Skapades |

### users (migration 0003)
| Kolumn | Typ | Beskrivning |
|---|---|---|
| id | INTEGER PK | Auto-increment |
| email | TEXT NOT NULL UNIQUE | Användarens email |
| name | TEXT NOT NULL | Användarens namn |
| token | TEXT NOT NULL UNIQUE | Auth-token |
| created_at | TEXT NOT NULL | Skapades |
| updated_at | TEXT NOT NULL | Senast ändrad |

### event_permissions (migration 0003)
| Kolumn | Typ | Beskrivning |
|---|---|---|
| id | INTEGER PK | Auto-increment |
| user_id | INTEGER FK | Referens till users |
| event_id | INTEGER FK | Referens till events |
| role | TEXT NOT NULL | owner/editor/viewer |
| created_at | TEXT NOT NULL | Skapades |
| UNIQUE(user_id, event_id) | | En roll per user per event |

### activities (migration 0004)
| Kolumn | Typ | Beskrivning |
|---|---|---|
| id | INTEGER PK | Auto-increment |
| event_id | INTEGER FK | Referens till events |
| type | TEXT NOT NULL | Aktivitetstyp (event_created, participant_added, mailing_sent, etc.) |
| description | TEXT NOT NULL | Beskrivning av händelsen |
| metadata | TEXT | JSON-metadata (extra detaljer) |
| created_by | TEXT | Användarens email |
| created_at | TEXT NOT NULL | Tidsstämpel |

### email_queue (migration 0004)
| Kolumn | Typ | Beskrivning |
|---|---|---|
| id | INTEGER PK | Auto-increment |
| mailing_id | INTEGER FK | Referens till mailings |
| event_id | INTEGER FK | Referens till events |
| to_email | TEXT NOT NULL | Mottagarens email |
| to_name | TEXT NOT NULL | Mottagarens namn |
| subject | TEXT NOT NULL | Ämnesrad |
| html | TEXT NOT NULL | HTML-body |
| plain_text | TEXT NOT NULL | Plaintext-body |
| status | TEXT NOT NULL | pending/sent/failed |
| error | TEXT | Felmeddelande vid failure |
| created_at | TEXT NOT NULL | Skapades |
| sent_at | TEXT | Skickades |

## Deploy-flöde
1. `npm run build` — bygger frontend (Vite) + backend (esbuild)
2. `wrangler deploy` — deployer Worker med Assets
3. Frontend serveras som statiska filer via Workers Assets
4. Backend-API:t körs i samma Worker under `/api/*`

**Miljöer:**
- Lokal: `wrangler dev` → `http://localhost:8787`
- Staging: `mikwik.se/stage` (efter session 3)
- Produktion: `event.consid.se` (framtida)

## Autentisering (session 10)

**Modell:** Interface-baserad token-auth (`AuthProvider`). Enkel token-lookup i D1 nu, utbytbar mot Azure AD.

| Komponent | Fil | Beskrivning |
|---|---|---|
| AuthProvider interface | `backend/src/middleware/auth.ts` | Abstrakt `resolveUser(token, db)` |
| tokenAuthProvider | `backend/src/middleware/auth.ts` | D1-baserad token-lookup |
| authMiddleware | `backend/src/middleware/auth.ts` | Hono middleware: `X-Auth-Token` → `c.var.user` |
| PermissionService | `backend/src/services/permission.service.ts` | Rollkontroll: canView, canEdit, isOwner |

**Roller:** `owner` (full kontroll + hantera behörigheter), `editor` (redigera event/deltagare/utskick), `viewer` (enbart läsåtkomst).

**Skyddade routes:** Alla `/api/events/*` (utom `POST .../register`), `POST /api/images` kräver auth.
**Publika routes:** `/api/health`, `/api/auth/*`, `/api/rsvp/*`, `GET /api/images/*`, `GET /api/public/events/:slug`, `POST /api/events/:slug/register`.

**Auto-owner:** Vid skapande av event sätts skaparen automatiskt som owner.

## Miljövariabler och secrets
| Variabel | Beskrivning | Källa |
|---|---|---|
| `DB` | D1-databas binding | wrangler.toml |
| `IMAGES` | R2-bucket binding (optional, session 9) | wrangler.toml |
| `RESEND_API_KEY` | API-nyckel för Resend (konfigurerad session 5) | wrangler secret |

## Emailtjänst (session 4–5, refaktorerad session 8a)

| Komponent | Fil | Beskrivning |
|---|---|---|
| EmailProvider interface | `backend/src/services/email/email.interface.ts` | Abstrakt provider med `send()` |
| ResendProvider | `backend/src/services/email/resend.adapter.ts` | Skickar via Resend API (text + HTML) |
| ConsoleEmailProvider | `backend/src/services/email/console.adapter.ts` | Loggar till console (dev/test fallback) |
| `buildEmailHtml()` | `backend/src/services/email/html-builder.ts` | Consid-branded HTML-mall (table-baserad) |
| `createEmailProvider()` | `backend/src/services/email/factory.ts` | Factory — Resend om API-nyckel finns, annars Console |

## Service-layer (session 8a)

| Service | Fil | Beskrivning |
|---|---|---|
| EventService | `backend/src/services/event.service.ts` | Slug-generering, ICS-generering, event CRUD, clone |
| ParticipantService | `backend/src/services/participant.service.ts` | Deltagarhantering, CSV-import/parsning, validering |
| WaitlistService | `backend/src/services/waitlist.service.ts` | shouldWaitlist, promoteNext, reorder |
| MailingService | `backend/src/services/mailing.service.ts` | Utskickshantering, send med per-mottagare RSVP-länk, sendTest |
| RsvpService | `backend/src/services/rsvp.service.ts` | RSVP-svar, avbokning, auto-waitlist vid kapacitet |
| ImageService | `backend/src/services/image.service.ts` | Bilduppladdning till R2, validering (typ/storlek), servering |
| PermissionService | `backend/src/services/permission.service.ts` | Rollkontroll (canView/canEdit/isOwner), CRUD behörigheter |
| ActivityService | `backend/src/services/activity.service.ts` | Aktivitetsloggning per event (log, logMailingCreated, logParticipantAdded, etc.) |
| WebsiteService | `backend/src/services/website.service.ts` | Webbplats CRUD, publik eventdata, registrering via webbformulär |

**Emailflöde vid utskick (session 11 — template-renderer + email-kö, utökat session 14 med GrapeJS):**
1. Hämtar mottagare baserat på `recipient_filter`
2. Per mottagare: bygger `MergeContext` med `buildMergeContext()` — ersätter `{{name}}`, `{{event}}`, `{{datum}}`, `{{tid}}`, `{{plats}}`, `{{rsvp_link}}`, `{{calendar_link}}`
3. **Om `html_body` finns (GrapeJS):** Ersätter merge fields i html_body, använder som-is
4. **Annars:** Renderar text + HTML med `renderEmail()` (auto-append RSVP-länk om ej i body)
5. ≤5 mottagare: skickas direkt via Resend. >5 mottagare: köas i `email_queue` och processas av Cron Trigger (var 5:e min, 20 mail/batch)

**Email-mallar (6 st, session 11):**
| Mall | ID | Beskrivning |
|---|---|---|
| Save the date | `save-the-date` | Förhandsinformation om kommande event |
| Inbjudan | `invitation` | Formell inbjudan med RSVP-länk |
| Väntelista | `waitlist` | Bekräftelse på väntelisteplacering |
| Bekräftelse | `confirmation` | Bekräftelse av anmälan |
| Påminnelse | `reminder` | Påminnelse inför eventet |
| Tack | `thank-you` | Tackmejl efter genomfört event |

**DNS-konfiguration (mikwik.se):**
- DKIM: TXT `resend._domainkey` — verifierad
- SPF: MX `send` + TXT `send` — verifierad
- DMARC: TXT `_dmarc` — `v=DMARC1; p=none;`

## GrapeJS WYSIWYG Editor (session 14 + 16)

**Paket:** `grapesjs` + `@grapesjs/react` + `juice` (CSS-inlining, enbart email)

### Email-editor (session 14)

| Fil | Beskrivning |
|---|---|
| `frontend/src/components/editor/EmailEditor.tsx` | GrapeJS-wrapper för mail (lazy-loaded), toolbar med desktop/mobil preview, R2-upload |
| `frontend/src/components/editor/grapejs-brand-config.ts` | Consid brand constraints: begränsad färgpalett (9 färger), typsnitt (Consid Sans), CTA-stil |
| `frontend/src/components/editor/grapejs-email-preset.ts` | 7 email-block: text, rubrik, bild, CTA-knapp, avdelare, kolumner, mellanrum (table-layout) |

### Webbsideeditor (session 16)

| Fil | Beskrivning |
|---|---|
| `frontend/src/components/editor/PageEditor.tsx` | GrapeJS-wrapper för webbsidor (lazy-loaded), toolbar med desktop/mobil preview, R2-upload |
| `frontend/src/components/editor/grapejs-page-preset.ts` | 14 webbsideblock: hero, eventinfo, program, plats, anmälningsformulär, footer + text, rubrik, bild, CTA, avdelare, kolumner, mellanrum (modern CSS/flexbox) + `buildInitialPageHtml()` |

**Skillnad email vs webbsida:** Email-block använder table-layout (kompatibilitet med mailklienter), webbsideblock använder modern CSS (flexbox/grid).

**Anmälningsformulär i custom pages:** GrapeJS-blocket "Anmälan" infogar en `data-page-register-form="true"` platshållare. PublicEvent.tsx använder `createPortal()` för att rendera React-formuläret in i denna platshållare.

**Brand-begränsningar (delade):**
- Färgväljare: bara #701131, #B5223F, #F49E88, #EFE6DD, #1C1C1C, #492A34, #A99B94, #EC6B6A, #FFFFFF
- Typsnitt: bara Consid Sans (+ Arial/Helvetica fallbacks)
- CTA-knapp: Raspberry Red #B5223F bakgrund, vit text (förinställt)
- Bilduppladdning: max 5 MB, JPEG/PNG/WebP → R2

**Email-flöde:** Visuell editor → dra-och-släpp → spara → HTML inline-CSS via `juice` → sparas som `html_body` + `editor_data` i mailings.

**Webbsideflöde:** Visuell editor → dra-och-släpp → spara → HTML + editor_data sparas i `website_data` JSON (fälten `page_html` + `page_editor_data`). PublicEvent renderar `page_html` direkt om det finns, annars template-baserad rendering.

## Validering (session 8b)

All input-validering sker via **Zod-schemas** i `packages/shared/src/schemas.ts`:

| Schema | Beskrivning |
|---|---|
| `createEventSchema` | Skapar event: required name/date/time/location/organizer/organizer_email |
| `updateEventSchema` | Uppdaterar event: alla fält optional, validerar format om angivna |
| `createParticipantSchema` | Skapar deltagare: required name/email, enum category/status |
| `updateParticipantSchema` | Uppdaterar deltagare: alla fält optional |
| `createMailingSchema` | Skapar utskick: required subject/body, enum recipient_filter |
| `rsvpRespondSchema` | RSVP-svar: status = "attending" | "declined" |
| `reorderSchema` | Omsortera väntelista: queue_position (positivt heltal) |
| `loginSchema` | Inloggning: email + name |
| `addPermissionSchema` | Lägg till behörighet: email + name + role (owner/editor/viewer) |
| `updateWebsiteSchema` | Uppdatera webbplats: template, data (JSON), published |
| `publicRegisterSchema` | Publik registrering: name, email, company, category, dietary, gdpr_consent |

**Flöde:** Route → `parseBody(schema, body)` → ZodError fångas av `errorHandler` → 400 med `{ error, details }`.

## Testning
- **Framework:** Vitest + @cloudflare/vitest-pool-workers
- **D1-tester:** Kör mot riktig D1 i miniflare
- **Kör:** `npm run test` (alla), `npm run test:watch` (watch-läge)
- **Antal:** 92 tester (11 testfiler)

### Teststruktur

| Typ | Plats | Antal | Beskrivning |
|---|---|---|---|
| Route-integration | `backend/src/__tests__/events.test.ts` | 11 | Events CRUD, auth, clone |
| Route-integration | `backend/src/__tests__/participants.test.ts` | 9 | Participants CRUD |
| Route-integration | `backend/src/__tests__/mailings.test.ts` | 10 | Mailings, RSVP, templates, testmail |
| Route-integration | `backend/src/__tests__/waitlist.test.ts` | 4 | Waitlist auto-promote, ICS |
| Route-integration | `backend/src/__tests__/health.test.ts` | 1 | Health endpoint |
| E2E-integration | `backend/src/__tests__/integration.test.ts` | 14 | Fullständiga flöden (session 13b) |
| Service-enhetstester | `backend/src/services/__tests__/event.service.test.ts` | 10 | EventService, slug, ICS |
| Service-enhetstester | `backend/src/services/__tests__/participant.service.test.ts` | 14 | ParticipantService, CSV |
| Service-enhetstester | `backend/src/services/__tests__/permission.service.test.ts` | 8 | PermissionService, roller |
| Service-enhetstester | `backend/src/services/__tests__/activity.service.test.ts` | 5 | ActivityService, loggning |
| Service-enhetstester | `backend/src/services/__tests__/website.service.test.ts` | 6 | WebsiteService, CRUD, registrering |

### E2E-integrationstester (session 13b)

Testar fullständiga flöden som korsar service-gränser:
1. **Event → Deltagare → Waitlist → Promote** — kapacitetsgräns, auto-waitlist, promote vid delete/statusändring
2. **Inbjudan → RSVP → Bekräftelse** — invited→attending, dietary/plus-one, cancel med auto-promote, RSVP auto-waitlist
3. **Behörigheter** — owner/editor/viewer rollkontroll, 403 vid obehörig åtkomst
4. **Email-kö + Cron** — >5 mottagare köas, processQueue() processar, ≤5 direkt
5. **Klona event** — kopia med korrekt data, 0 deltagare, skaparen som owner
