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

Framtida integrationer (ej implementerade ännu):
- **R2** — Bildlagring (session 2)
- **Resend** — Email (session 6)
- **Cron Triggers** — Schemalagda mail (session 7)

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

## Deploy-flöde
1. `npm run build` — bygger frontend (Vite) + backend (esbuild)
2. `wrangler deploy` — deployer Worker med Assets
3. Frontend serveras som statiska filer via Workers Assets
4. Backend-API:t körs i samma Worker under `/api/*`

**Miljöer:**
- Lokal: `wrangler dev` → `http://localhost:8787`
- Staging: `stage.mikwik.se` (session 13)
- Produktion: `event.consid.se` (framtida)

## Autentisering
Ej implementerad ännu (session 10). Interface-baserad design för framtida Azure AD.

## Miljövariabler och secrets
| Variabel | Beskrivning | Källa |
|---|---|---|
| `DB` | D1-databas binding | wrangler.toml |

## Testning
- **Framework:** Vitest + @cloudflare/vitest-pool-workers
- **D1-tester:** Kör mot riktig D1 i miniflare
- **Kör:** `npm run test` (alla), `npm run test:watch` (watch-läge)
