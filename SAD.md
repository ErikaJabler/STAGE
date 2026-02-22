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

Framtida integrationer (ej implementerade ännu):
- **R2** — Bildlagring
- **Cron Triggers** — Schemalagda mail

## Repostruktur

| Mapp/Fil | Syfte |
|---|---|
| `backend/src/index.ts` | Hono app entry — alla routes monteras här |
| `backend/src/bindings.ts` | Cloudflare Env-typer (D1, R2, secrets) |
| `backend/src/routes/` | API-routes per domän |
| `backend/src/services/` | Affärslogik per domän |
| `backend/src/middleware/` | Auth, CORS, error handler |
| `backend/src/db/queries.ts` | Typsäkra D1-frågor |
| `frontend/src/` | React-app (Vite) |
| `packages/shared/src/` | Delade typer + konstanter |
| `migrations/` | Inkrementella D1 SQL-filer |

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
| GET | `/api/events/:id/mailings` | Lista utskick för event | 4 |
| POST | `/api/events/:id/mailings` | Skapa nytt utskick | 4 |
| POST | `/api/events/:id/mailings/:mid/send` | Skicka utskick | 4 |
| GET | `/api/rsvp/:token` | Hämta deltagarinfo + eventinfo (publik) | 4 |
| POST | `/api/rsvp/:token/respond` | Svara attending/declined (publik) | 4 |
| POST | `/api/rsvp/:token/cancel` | Avboka deltagande (publik) | 4 |

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
| cancellation_token | TEXT NOT NULL UNIQUE | Token för RSVP/avbokning |
| email_status | TEXT | Senaste mailstatus |
| gdpr_consent_at | TEXT | GDPR-samtycke tidsstämpel |
| created_at | TEXT NOT NULL | Skapades |
| updated_at | TEXT NOT NULL | Senast ändrad |

### mailings (migration 0002)
| Kolumn | Typ | Beskrivning |
|---|---|---|
| id | INTEGER PK | Auto-increment |
| event_id | INTEGER FK | Referens till events |
| subject | TEXT NOT NULL | Ämnesrad |
| body | TEXT NOT NULL | Brödtext |
| recipient_filter | TEXT NOT NULL | all/invited/attending/etc. |
| status | TEXT NOT NULL | draft/sent |
| sent_at | TEXT | Tidpunkt för utskick |
| created_at | TEXT NOT NULL | Skapades |

## Deploy-flöde
1. `npm run build` — bygger frontend (Vite) + backend (esbuild)
2. `wrangler deploy` — deployer Worker med Assets
3. Frontend serveras som statiska filer via Workers Assets
4. Backend-API:t körs i samma Worker under `/api/*`

**Miljöer:**
- Lokal: `wrangler dev` → `http://localhost:8787`
- Staging: `mikwik.se/stage` (efter session 3)
- Produktion: `event.consid.se` (framtida)

## Autentisering
Ej implementerad ännu (session 10). Interface-baserad design för framtida Azure AD.

## Miljövariabler och secrets
| Variabel | Beskrivning | Källa |
|---|---|---|
| `DB` | D1-databas binding | wrangler.toml |
| `RESEND_API_KEY` | API-nyckel för Resend (konfigurerad session 5) | wrangler secret |

## Emailtjänst (session 4–5)

| Komponent | Fil | Beskrivning |
|---|---|---|
| EmailProvider interface | `backend/src/services/email.ts` | Abstrakt provider med `send()` |
| ResendProvider | `backend/src/services/email.ts` | Skickar via Resend API (text + HTML) |
| ConsoleEmailProvider | `backend/src/services/email.ts` | Loggar till console (dev/test fallback) |
| `buildEmailHtml()` | `backend/src/services/email.ts` | Consid-branded HTML-mall (table-baserad) |
| `createEmailProvider()` | `backend/src/services/email.ts` | Factory — Resend om API-nyckel finns, annars Console |

**Emailflöde vid utskick:**
1. Hämtar mottagare baserat på `recipient_filter`
2. Per mottagare: ersätter `{{name}}` och `{{rsvp_link}}` (auto-append om ej i body)
3. Genererar HTML med `buildEmailHtml()` (burgundy header, RSVP-knapp, eventinfo)
4. Skickar via Resend (text + html) från `Stage <noreply@mikwik.se>`

**DNS-konfiguration (mikwik.se):**
- DKIM: TXT `resend._domainkey` — verifierad
- SPF: MX `send` + TXT `send` — verifierad
- DMARC: TXT `_dmarc` — `v=DMARC1; p=none;`

## Testning
- **Framework:** Vitest + @cloudflare/vitest-pool-workers
- **D1-tester:** Kör mot riktig D1 i miniflare
- **Kör:** `npm run test` (alla), `npm run test:watch` (watch-läge)
