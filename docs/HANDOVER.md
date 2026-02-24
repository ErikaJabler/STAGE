# Överlämningsdokument — Stage till produktion

> **Senast uppdaterad:** 2026-02-24
> **Repo:** https://github.com/ErikaJabler/STAGE
> **Live (dev):** https://mikwik.se/stage/
> **Målmiljö:** event.consid.se (eller annan Consid-ägd domän)

---

## 1. Systemöversikt

**Stage** är en eventplaneringsplattform för Consid. Eventskapare hanterar events, deltagare och mailutskick. Deltagare svarar via personliga RSVP-länkar. Allt i Consid Brand Guidelines 2025.

### Tech-stack

| Lager        | Val                                                   |
| ------------ | ----------------------------------------------------- |
| Runtime      | Cloudflare Workers                                    |
| Backend      | Hono (TypeScript)                                     |
| Databas      | Cloudflare D1 (SQLite)                                |
| Frontend     | React 19 + TypeScript + Vite                          |
| Server state | TanStack Query                                        |
| Validering   | Zod (delade schemas frontend ↔ backend)               |
| Email        | Resend via abstraktionslager                          |
| Bildlagring  | Cloudflare R2                                         |
| Auth         | Interface-baserad token-auth (förberett för Azure AD) |
| WYSIWYG      | GrapeJS (email + webbsideeditor)                      |
| Test         | Vitest + @cloudflare/vitest-pool-workers              |
| Deploy       | Cloudflare Workers (React via Assets)                 |

### Funktioner

- Skapa/redigera/klona events med Consid-branding
- Deltagarhantering: manuell, CSV-import, CSV-export
- Väntlistelogik med automatisk befordran
- Mailutskick med mallar eller visuell GrapeJS-editor
- RSVP-sidor med personliga tokens (dietary, +1)
- Publika eventwebbsidor med GrapeJS-editor
- Behörighetssystem: owner/editor/viewer per event
- Systemadmin-roll med dashboard
- Aktivitetslogg per event
- Email-kö med Cron Trigger (rate limit-hantering)
- ICS-kalenderfiler
- 101 automatiserade tester

---

## 2. Arkitektur

```
                    ┌──────────────────────────────────────┐
                    │        Cloudflare Worker "stage"      │
┌─────────────┐     │                                      │
│  Webbläsare │────▶│  ┌──────────────────────────────┐   │
│  (React SPA)│◀────│  │  Hono (TypeScript) — /api/*  │   │
└─────────────┘     │  │  Auth middleware              │   │
                    │  │  Error handler                │   │
                    │  └──────────┬────────┬───────────┘   │
                    │             │        │                │
                    │  ┌──────────▼──┐  ┌──▼────────────┐ │
                    │  │  D1 (SQLite) │  │  R2 (bilder)  │ │
                    │  │  stage_db_v2 │  │  stage-images  │ │
                    │  └─────────────┘  └───────────────┘ │
                    │                                      │
                    │  Frontend: Workers Assets             │
                    │  (Vite-bygge → statiska filer)        │
                    └─────────┬────────────────────────────┘
                              │
                    ┌─────────▼────────────┐
                    │   Resend API          │
                    │   (Email-sändning)    │
                    └──────────────────────┘

Cron Trigger: var 5:e minut → processQueue() → skicka köade mail
```

### Vad körs var

| Komponent    | Plats                     | Beskrivning                                        |
| ------------ | ------------------------- | -------------------------------------------------- |
| React SPA    | Cloudflare Workers Assets | Statiska filer (HTML/JS/CSS), serveras från Worker |
| Hono API     | Cloudflare Worker         | Backend-API under `/api/*`                         |
| D1 databas   | Cloudflare D1 (WEUR)      | SQLite-databas, 8 tabeller                         |
| R2 bucket    | Cloudflare R2             | Bildlagring (hero-bilder, mail-bilder)             |
| Cron Trigger | Cloudflare Worker         | Email-kö, kör var 5:e minut                        |
| Email        | Resend API (eu-west-1)    | SMTP-sändning via API                              |
| DNS          | Cloudflare DNS            | Routes: `mikwik.se/stage/*`                        |

---

## 3. Öppna beslut

Följande beslut måste tas av Consid innan migrering kan påbörjas:

### 3.1 Domän

**Fråga:** Vilken domän ska Stage använda?

- `event.consid.se` (rekommendation)
- `stage.consid.se`
- Annan subdomain under `consid.se`

**Påverkar:** DNS-setup, Worker-routes, base path, email-avsändardomän, alla hårdkodade URL:er.

### 3.2 Base path

**Fråga:** Ska appen köras på root (`/`) eller under en sökväg (`/stage/`)?

- `/` (enklast om egen subdomain, t.ex. `event.consid.se/`)
- `/stage/` (som idag, om den delar domän med annat)

**Påverkar:** Vite base, React Router basename, Worker routing, alla interna URL:er.

### 3.3 E-post

**Fråga:** Behålla Resend eller byta till O365 Graph API?

|             | Resend                                         | O365 Graph API                         |
| ----------- | ---------------------------------------------- | -------------------------------------- |
| Komplexitet | Enkel — bara domänbyte                         | Kräver ny adapter (~100 rader)         |
| Avsändare   | `noreply@consid.se`                            | Delad brevlåda i Exchange              |
| Setup       | API-nyckel + DNS-verifiering                   | App registration + Graph API-tillstånd |
| GDPR        | Tredjepartstjänst (USA-baserad, EU-datacenter) | Data stannar i Consids M365-tenant     |
| Kostnad     | Free tier: 100 mail/dag, sedan betalt          | Ingår i M365-licens                    |

**Rekommendation:** Börja med Resend (snabbare setup), byt till O365 senare om önskat. Email-interface gör detta till ett separat steg.

### 3.4 Hosting

**Fråga:** Eget Cloudflare-konto eller annan plattform?

- **Cloudflare (rekommendation):** Appen är byggd specifikt för Workers + D1 + R2. Flytt till annan plattform kräver omskrivning.
- **Annat:** Kräver migration till annan databas (Postgres/MySQL), annan fillagring (S3), och annan serverless-plattform.

### 3.5 Autentisering

**Fråga:** Azure AD/Entra ID-konfiguration

- Vilken tenant? (Consids primära Entra ID)
- Vilka användare ska ha åtkomst? (Alla Consid-anställda? Specifik AD-grupp?)
- Vilka AD-grupper ska mappa till admin-rollen?

### 3.6 Admin-roller

**Fråga:** Vem ska vara systemadmin?

- Mappa `is_admin` till en specifik AD-grupp (t.ex. "Stage-admins")
- Eller manuellt via databasen

### 3.7 GDPR

**Fråga:** Juridisk granskning behövs

- DPA (Data Processing Agreement) med Cloudflare
- DPA med Resend (om Resend behålls)
- DPIA (Data Protection Impact Assessment) — krävs?
- Personuppgiftsbiträdesavtal

---

## 4. Vad som redan är abstrakt (plug-and-play)

Systemet är förberett för byte av flera komponenter utan att ändra affärslogik:

### AuthProvider interface

**Fil:** `backend/src/middleware/auth.ts`

```typescript
export interface AuthProvider {
  resolveUser(token: string, db: D1Database): Promise<User | null>;
}
```

Nuvarande implementation: `tokenAuthProvider` (D1-lookup på `X-Auth-Token`-header).
Byt genom att skapa en ny implementation och anropa `setAuthProvider(newProvider)`.

### EmailProvider interface

**Fil:** `backend/src/services/email/email.interface.ts`

```typescript
export interface EmailProvider {
  send(message: EmailMessage): Promise<EmailResult>;
}
```

Nuvarande implementation: `ResendProvider` i `resend.adapter.ts`.
Lägg till ny adapter (t.ex. `graph-api.adapter.ts`) och uppdatera factory i `factory.ts`.

### CSS-variabler

**Fil:** `frontend/src/styles/globals.css`

Alla färger via CSS custom properties (`--color-burgundy`, `--color-raspberry-red` etc.). Inga hårdkodade färger i komponenter (undantag: HTML-email som inte stödjer CSS-variabler).

### Konfigurerbara värden i wrangler.toml

Worker-namn, D1 database ID, R2 bucket-namn, routes, cron-schedule — allt konfigurerat i `wrangler.toml`.

---

## 5. Konfiguration som måste ändras

### Hårdkodade värden

| Vad                   | Fil                                                        | Nuvarande värde                         | Nytt värde                  |
| --------------------- | ---------------------------------------------------------- | --------------------------------------- | --------------------------- |
| Worker routes         | `wrangler.toml` rad 21–26                                  | `mikwik.se/stage` + `mikwik.se/stage/*` | `event.consid.se/*`         |
| Zone name             | `wrangler.toml` rad 22, 26                                 | `mikwik.se`                             | `consid.se`                 |
| D1 database ID        | `wrangler.toml` rad 17                                     | `1e935a1e-4a24-44f4-b83d-c70235b982d9`  | _Ny D1-databas ID_          |
| R2 bucket name        | `wrangler.toml` rad 31                                     | `stage-images`                          | _Ny bucket-namn_            |
| Vite base path        | `frontend/vite.config.ts` rad 6                            | `/stage/`                               | `/` (eller behåll)          |
| React Router basename | `frontend/src/App.tsx` rad 62                              | `/stage`                                | `/` (eller behåll)          |
| Email from-adress     | `backend/src/services/email/resend.adapter.ts` rad 10      | `Stage <noreply@mikwik.se>`             | `Stage <noreply@consid.se>` |
| Base URL i mailing    | `backend/src/services/mailing.service.ts` rad 48, 173, 271 | `https://mikwik.se`                     | `https://event.consid.se`   |
| ICS UID-domän         | `backend/src/services/event.service.ts` rad 24             | `stage.mikwik.se`                       | `event.consid.se`           |
| ICS UID-domän (RSVP)  | `frontend/src/pages/RsvpPage.tsx` rad 372                  | `stage.mikwik.se`                       | `event.consid.se`           |

### Secrets

| Secret           | Nuvarande                        | Nytt                                               |
| ---------------- | -------------------------------- | -------------------------------------------------- |
| `RESEND_API_KEY` | Mikwiks personliga Resend-nyckel | Consids Resend API-nyckel (eller ta bort vid O365) |

### DNS-poster (vid byte till Resend med consid.se)

| Typ | Namn                          | Värde                                   | Syfte      |
| --- | ----------------------------- | --------------------------------------- | ---------- |
| TXT | `resend._domainkey.consid.se` | _Från Resend dashboard_                 | DKIM       |
| MX  | `send.consid.se`              | `feedback-smtp.eu-west-1.amazonses.com` | SPF/bounce |
| TXT | `send.consid.se`              | `v=spf1 include:amazonses.com ~all`     | SPF        |
| TXT | `_dmarc.consid.se`            | `v=DMARC1; p=quarantine;`               | DMARC      |

> **Obs:** Om consid.se redan har SPF/DMARC-poster måste dessa uppdateras (inte ersättas). Kontrollera befintlig DNS-konfiguration först.

---

## 6. Steg-för-steg: Infrastruktur

Checklista för IT-avdelningen. Kräver **ingen AI** — enbart Cloudflare dashboard + CLI.

### Förutsättningar

- Cloudflare-konto (Enterprise eller Pro rekommenderat)
- Node.js 18+ och npm installerat
- Tillgång till repot

### 6.1 Cloudflare-konto

- [ ] Skapa eller använd befintligt Cloudflare-konto för Consid
- [ ] Lägg till domänen (t.ex. `event.consid.se`) i Cloudflare — ändra nameservers

### 6.2 DNS + domän

- [ ] Skapa CNAME/A-record för `event.consid.se` → Cloudflare Worker
- [ ] SSL/TLS-certifikat genereras automatiskt av Cloudflare (Edge Certificate)
- [ ] Verifiera att HTTPS fungerar

### 6.3 D1 databas

```bash
# Skapa ny D1-databas
npx wrangler d1 create stage-prod

# Notera database_id och uppdatera wrangler.toml
```

### 6.4 Kör alla migrationer (i ordning)

```bash
npx wrangler d1 execute stage-prod --remote --file=migrations/0001_events_participants.sql
npx wrangler d1 execute stage-prod --remote --file=migrations/0002_mailings.sql
npx wrangler d1 execute stage-prod --remote --file=migrations/0003_event_permissions.sql
npx wrangler d1 execute stage-prod --remote --file=migrations/0004_activities.sql
npx wrangler d1 execute stage-prod --remote --file=migrations/0005_participant_dietary_plusone.sql
npx wrangler d1 execute stage-prod --remote --file=migrations/0006_mailing_html_body.sql
npx wrangler d1 execute stage-prod --remote --file=migrations/0007_event_website.sql
npx wrangler d1 execute stage-prod --remote --file=migrations/0008_admin_role.sql
```

### 6.5 R2 bucket

```bash
npx wrangler r2 bucket create stage-images
```

### 6.6 Secrets

```bash
# Resend API-nyckel (om Resend används)
npx wrangler secret put RESEND_API_KEY
# Klistra in API-nyckeln när prompten visas
```

### 6.7 Uppdatera konfiguration

Uppdatera alla värden i tabellen i sektion 5 (wrangler.toml, Vite config, källkod).

### 6.8 Bygg + deploy

```bash
npm install
npm run build
npx wrangler deploy
```

### 6.9 Verifiera

- [ ] `https://event.consid.se/api/health` → `{ "status": "ok" }`
- [ ] Frontend laddar på `https://event.consid.se/`
- [ ] Skapa ett testevent
- [ ] Logga in (skapar user + token)

---

## 7. Steg-för-steg: Azure AD-integration

Kräver **en utvecklare** med kunskap om Azure AD/Entra ID + TypeScript.

### 7.1 App Registration i Azure Portal

1. Gå till Azure Portal → Entra ID → App registrations → New registration
2. **Namn:** "Stage Eventplattform"
3. **Redirect URI:** `https://event.consid.se/auth/callback` (SPA)
4. **Supported account types:** "Accounts in this organizational directory only" (single tenant)
5. Notera: Application (client) ID, Directory (tenant) ID
6. Under **Authentication:** Lägg till Single-page application redirect URI
7. Under **API permissions:** Lägg till `User.Read` (delegated)
8. Under **Token configuration:** Lägg till optional claims: `email`, `preferred_username`

### 7.2 Backend: Ny AuthProvider

Skapa `backend/src/middleware/azure-ad-provider.ts`:

```typescript
import type { AuthProvider } from './auth';
import type { User } from '@stage/shared';

export const azureAdProvider: AuthProvider = {
  async resolveUser(token: string, db: D1Database): Promise<User | null> {
    // 1. Validera JWT mot Azure AD
    //    - Hämta JWKS från https://login.microsoftonline.com/{tenant}/discovery/v2.0/keys
    //    - Verifiera signatur, issuer, audience, expiry
    //
    // 2. Extrahera email + name från JWT claims
    //
    // 3. Upsert user i D1 (get-or-create)
    //    - Returnera User-objekt
    //
    // 4. (Valfritt) Kontrollera AD-gruppmedlemskap
    //    - Om grupp "Stage-admins" → is_admin = 1
  },
};
```

Registrera i `backend/src/index.ts`:

```typescript
import { setAuthProvider } from './middleware/auth';
import { azureAdProvider } from './middleware/azure-ad-provider';
setAuthProvider(azureAdProvider);
```

### 7.3 Frontend: MSAL-integration

1. Installera `@azure/msal-browser` och `@azure/msal-react`
2. Skapa MSAL-konfiguration med client ID + tenant ID
3. Ersätt nuvarande `useAuth` hook:
   - Login: redirect till Azure AD (PKCE flow)
   - Callback: hämta access token
   - Skicka access token som `X-Auth-Token` (eller `Authorization: Bearer`)
   - Hämta användarinfo från token claims
4. Ta bort Login.tsx (ersätts av Azure AD redirect)

### 7.4 Migrera befintlig data

Om det redan finns events och users i databasen:

- Users-tabellen behöver kopplas till Azure AD-identiteter (via email-matchning)
- event_permissions förblir oförändrade (kopplade via user_id)

---

## 8. Steg-för-steg: E-post

### Alternativ A: Behåll Resend (enklast)

1. **Skapa Resend-konto** (om nytt): https://resend.com
2. **Lägg till domän:** `consid.se` (eller subdomain `events.consid.se`)
3. **DNS-verifiering:** Lägg till DKIM/SPF/DMARC-poster (se sektion 5)
4. **API-nyckel:** Skapa och lägg till som Worker secret
5. **Uppdatera from-adress:** `resend.adapter.ts` rad 10 → `Stage <noreply@consid.se>`
6. **Klart** — ingen kodändring behövs utöver from-adressen

**Begränsningar:** Free tier = 100 mail/dag, 3000/månad. Pro = $20/mån, 50 000/månad.

### Alternativ B: O365 Graph API

Kräver en ny adapter (~100 rader TypeScript):

1. **App Registration i Azure Portal:**
   - API permissions: `Mail.Send` (application, inte delegated)
   - Admin consent krävs
   - Client secret eller certifikat

2. **Skapa adapter:** `backend/src/services/email/graph-api.adapter.ts`

```typescript
import type { EmailMessage, EmailResult, EmailProvider } from './email.interface';

export class GraphApiProvider implements EmailProvider {
  constructor(
    private tenantId: string,
    private clientId: string,
    private clientSecret: string,
    private senderMailbox: string, // t.ex. "events@consid.se"
  ) {}

  async send(message: EmailMessage): Promise<EmailResult> {
    // 1. Hämta access token via client credentials flow
    //    POST https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token
    //
    // 2. Skicka mail via Graph API
    //    POST https://graph.microsoft.com/v1.0/users/{senderMailbox}/sendMail
    //
    // 3. Returnera EmailResult
  }
}
```

3. **Uppdatera factory:** `backend/src/services/email/factory.ts`
4. **Nya secrets:** `GRAPH_TENANT_ID`, `GRAPH_CLIENT_ID`, `GRAPH_CLIENT_SECRET`
5. **Avsändare:** Delad brevlåda i Exchange (t.ex. `events@consid.se`)

---

## 9. GDPR-checklista

### 9.1 Personuppgifter som behandlas

| Data                   | Kategori                     | Lagras i          | Rättslig grund                 |
| ---------------------- | ---------------------------- | ----------------- | ------------------------------ |
| Deltagarens namn       | Identifierande               | D1 (participants) | Berättigat intresse / samtycke |
| Deltagarens email      | Kontaktuppgift               | D1 (participants) | Berättigat intresse / samtycke |
| Deltagarens företag    | Organisationsdata            | D1 (participants) | Berättigat intresse            |
| Kostrestriktioner      | Hälsouppgift (känslig)       | D1 (participants) | Uttryckligt samtycke           |
| +1 gästens namn/email  | Identifierande (tredje part) | D1 (participants) | Berättigat intresse            |
| Eventskaparens email   | Kontaktuppgift               | D1 (users)        | Anställningsförhållande        |
| GDPR-samtyckestidpunkt | Loggdata                     | D1 (participants) | Dokumentation av samtycke      |

### 9.2 Tredjeparter (personuppgiftsbiträden)

| Tjänst                         | Data som delas      | Plats          | DPA krävs |
| ------------------------------ | ------------------- | -------------- | --------- |
| Cloudflare (Workers + D1 + R2) | All data            | EU (WEUR)      | Ja        |
| Resend (om använd)             | Namn + email i mail | EU (eu-west-1) | Ja        |

### 9.3 Åtgärder

- [ ] **DPA med Cloudflare:** https://www.cloudflare.com/cloudflare-customer-dpa/
- [ ] **DPA med Resend:** https://resend.com/legal/dpa (om Resend behålls)
- [ ] **DPIA (konsekvensbedömning):** Rekommenderas pga kostrestriktioner (hälsodata) — juridik avgör om obligatoriskt
- [ ] **Registerförteckning:** Lägg till Stage i Consids registerförteckning (art. 30 GDPR)
- [ ] **Informationstext:** Uppdatera GDPR-text i eventinställningar (SettingsTab → "GDPR-samtyckestext")
- [ ] **Radering:** Soft-delete på events (behåller data). Fysisk radering av deltagare. Rutiner för dataradering/export vid begäran krävs.
- [ ] **Dataexport:** CSV-export finns (GET `/api/events/:id/participants/export`). Kan användas för registerutdrag.

---

## 10. Roller och ansvar

### IT / Infrastruktur

- [ ] Skapa Cloudflare-konto
- [ ] DNS-konfiguration (domän, CNAME, DKIM/SPF)
- [ ] D1 databas + R2 bucket
- [ ] Deploy pipeline (CI/CD om önskat)
- [ ] SSL-certifikat (automatiskt via Cloudflare)
- [ ] Övervaka Worker-hälsa (Cloudflare Dashboard → Analytics)

### Utvecklare

- [ ] Uppdatera hårdkodade värden (sektion 5)
- [ ] Implementera Azure AD AuthProvider (sektion 7)
- [ ] (Valfritt) Implementera O365 Graph API EmailProvider (sektion 8B)
- [ ] Köra migrationer på ny databas
- [ ] Bygg + deploy
- [ ] Verifiera alla funktioner
- [ ] Sätta upp första admin-användare

### DPO / Juridik

- [ ] Granska personuppgiftsbehandling
- [ ] Signera DPA med Cloudflare och Resend
- [ ] Bedöma om DPIA krävs
- [ ] Uppdatera registerförteckning
- [ ] Granska GDPR-samtyckestext

### DNS-admin

- [ ] Skapa subdomain (t.ex. `event.consid.se`)
- [ ] Ändra nameservers till Cloudflare (eller CNAME)
- [ ] Lägga till Resend DNS-poster (DKIM/SPF/DMARC) om Resend används

### Eventskapare (slutanvändare)

Behöver ingen teknisk kunskap. Dokumentation/utbildning rekommenderas för:

- Skapa event + hantera deltagare
- Skicka mailutskick (mallar vs visuell editor)
- Publicera eventwebbsida
- Hantera behörigheter (owner/editor/viewer)

---

## 11. Kända begränsningar och tech debt

### Säkerhet

| Begränsning                   | Allvarlighetsgrad | Kommentar                                                                                                                                            |
| ----------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ingen rate limiting           | Medel             | Cloudflare WAF kan användas som yttre skydd. Intern rate limiting bör implementeras.                                                                 |
| Inga CSP headers              | Låg               | Bör läggas till som Hono-middleware                                                                                                                  |
| XSS-skydd partiellt           | Låg               | Merge fields i email HTML-escade (session 18). `dangerouslySetInnerHTML` för GrapeJS page_html — OK pga att bara autentiserade editors kan redigera. |
| Ingen lösenordsauth           | By design         | Ersätts med Azure AD. Nuvarande token-auth är en brygga.                                                                                             |
| GET /api/images/\* är publikt | Låg               | UUID-baserade nycklar gör enumeration svår. Kan skyddas om önskat.                                                                                   |

### Prestanda

| Begränsning                    | Allvarlighetsgrad | Kommentar                                                                      |
| ------------------------------ | ----------------- | ------------------------------------------------------------------------------ |
| Resend free tier: 100 mail/dag | Medel             | Uppgradera till Pro vid produktionsanvändning                                  |
| Ingen caching                  | Låg               | D1 är snabb, Workers har låg latens. Caching kan läggas till om behov uppstår. |
| GrapeJS bundle: ~500KB         | Låg               | Lazy-loaded, påverkar inte initial page load                                   |

### Funktionalitet

| Begränsning                                    | Kommentar                                                                                |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Consid Sans fontfiler i repot                  | Fontfilerna (woff2/woff) ligger i `frontend/public/fonts/`. Licensiering bör verifieras. |
| Ingen CI/CD pipeline                           | Deploy sker manuellt via `npm run build && npx wrangler deploy`                          |
| Ingen staging-miljö                            | Nuvarande dev-miljö på mikwik.se kan användas som staging                                |
| Email-kö har ingen retry-logik                 | Misslyckade mail markeras som `failed`, ingen automatisk retry                           |
| Ingen audit trail export                       | Aktivitetsloggen finns per event men kan inte exporteras                                 |
| Template 3 (offentlig sektor) ej implementerad | 2 webbplatsmallar finns, ytterligare kan läggas till                                     |

### Kända TS-varningar

- `cloudflare:test`-modulen ger TS2307 vid `tsc --build` — detta är förväntat (modulen finns bara i Vitest-runtime)
- Pre-existerande TS-varningar (TS2731, TS2339, TS2769) i queries + auth routes — kosmetiska, esbuild bygger utan problem

---

## 12. Testning efter migration

### Automatiserade tester

```bash
npm run test       # 101 tester, alla ska passera
npm run typecheck  # Inga nya fel (enbart kända cloudflare:test-varningar)
```

### Manuell verifiering

| #   | Test                    | Förväntat                                             |
| --- | ----------------------- | ----------------------------------------------------- |
| 1   | `GET /api/health`       | `{ "status": "ok" }`                                  |
| 2   | Ladda frontend          | React-app med Consid-branding                         |
| 3   | Logga in                | Skapar användare, token sparas                        |
| 4   | Skapa event             | Event skapas, visas i lista                           |
| 5   | Lägg till deltagare     | Deltagare syns i deltagartab                          |
| 6   | CSV-import              | Import med 5+ deltagare                               |
| 7   | Skicka mailutskick      | Mail ankommer med RSVP-länk                           |
| 8   | Klicka RSVP-länk        | RSVP-sida laddas, kan svara                           |
| 9   | Publicera eventwebbsida | Publik sida laddas på `/e/:slug`                      |
| 10  | Anmälan via webbsida    | Deltagare skapas med GDPR-samtycke                    |
| 11  | Ladda upp bild          | Bild sparas i R2, visas i event                       |
| 12  | Admin-dashboard         | Statistik och alla events visas (kräver is_admin = 1) |
| 13  | Email-kö (>5 mottagare) | Mail köas, Cron processar inom 5 min                  |

### Manuella testfall (TESTPLAN.md)

Alla befintliga manuella testfall i `TESTPLAN.md` refererar till `https://mikwik.se/stage/` och behöver:

- [ ] Uppdateras med ny URL (t.ex. `https://event.consid.se/`)
- [ ] Gås igenom och kompletteras — nya testfall kan behövas för:
  - Azure AD-inloggning (ersätter token-auth)
  - O365-mailsändning (om Resend byts ut)
  - DNS/domänspecifika tester
  - Produktionsspecifika flöden (t.ex. flera samtida eventskapare)

### Sätta första admin-användare

```bash
# Efter att en användare loggat in, uppgradera till admin:
npx wrangler d1 execute stage-prod --remote --command="UPDATE users SET is_admin = 1 WHERE email = 'admin@consid.se'"
```

---

## Appendix A: Fullständig filstruktur

```
~/stage/
├── CLAUDE.md                    # Projektinstruktioner
├── PROGRESS.md                  # Sessionsstatus (18 sessions)
├── TESTPLAN.md                  # Manuella testfall
├── SAD.md                       # Systemarkitekturdokument
├── wrangler.toml                # Worker + D1 + R2 + Cron
├── vitest.config.ts             # Vitest med miniflare
├── package.json                 # Root workspace
├── migrations/                  # 8 inkrementella SQL-filer
│   ├── 0001_events_participants.sql
│   ├── 0002_mailings.sql
│   ├── 0003_event_permissions.sql
│   ├── 0004_activities.sql
│   ├── 0005_participant_dietary_plusone.sql
│   ├── 0006_mailing_html_body.sql
│   ├── 0007_event_website.sql
│   └── 0008_admin_role.sql
├── packages/shared/src/
│   ├── types.ts                 # Alla interfaces
│   ├── constants.ts             # Enums och konstanter
│   ├── schemas.ts               # Zod-schemas (validering)
│   └── index.ts                 # Barrel export
├── backend/src/
│   ├── index.ts                 # App entry + Cron handler
│   ├── bindings.ts              # Cloudflare Env-typer
│   ├── routes/
│   │   ├── events.ts            # Event CRUD + clone + conflicts
│   │   ├── participants.ts      # Deltagare CRUD + import
│   │   ├── mailings.ts          # Utskick CRUD + send + test
│   │   ├── rsvp.ts              # RSVP (publika routes)
│   │   ├── auth.ts              # Login + me
│   │   ├── permissions.ts       # Behörigheter per event
│   │   ├── images.ts            # R2 bilduppladdning
│   │   ├── activities.ts        # Aktivitetslogg
│   │   ├── search.ts            # Eventsökning
│   │   ├── website.ts           # Eventwebbplats
│   │   └── admin.ts             # Admin-dashboard
│   ├── services/
│   │   ├── event.service.ts
│   │   ├── participant.service.ts
│   │   ├── waitlist.service.ts
│   │   ├── mailing.service.ts
│   │   ├── rsvp.service.ts
│   │   ├── image.service.ts
│   │   ├── permission.service.ts
│   │   ├── activity.service.ts
│   │   ├── website.service.ts
│   │   ├── admin.service.ts
│   │   ├── template-lock.service.ts
│   │   ├── email/               # Email-abstraktionslager
│   │   │   ├── email.interface.ts
│   │   │   ├── resend.adapter.ts
│   │   │   ├── console.adapter.ts
│   │   │   ├── factory.ts
│   │   │   ├── html-builder.ts
│   │   │   ├── template-renderer.ts
│   │   │   ├── send-queue.ts
│   │   │   └── templates/       # 6 email-mallar
│   │   └── __tests__/           # Service-tester
│   ├── middleware/
│   │   ├── auth.ts              # AuthProvider + middleware
│   │   └── error-handler.ts     # Global error handler
│   ├── db/                      # D1-queries per domän
│   └── utils/                   # Zod parseBody()
└── frontend/src/
    ├── App.tsx                  # Routing + guards
    ├── api/client.ts            # Typad fetch-wrapper
    ├── pages/                   # Sidkomponenter
    │   ├── Overview.tsx
    │   ├── EventDetail.tsx
    │   ├── Login.tsx
    │   ├── RsvpPage.tsx
    │   ├── PublicEvent.tsx
    │   └── AdminDashboard.tsx
    ├── components/
    │   ├── ui/                  # Button, Modal, Badge, Input, Toast, etc.
    │   ├── layout/              # Sidebar, Topbar, SearchBar
    │   ├── features/            # Events, Participants, Email, Settings
    │   └── editor/              # GrapeJS EmailEditor + PageEditor
    ├── hooks/                   # TanStack Query hooks
    └── styles/                  # CSS-variabler, Consid-branding
```

## Appendix B: API-endpoints (komplett lista)

Se `SAD.md` sektion "API-endpoints" för fullständig lista med 30 endpoints.

## Appendix C: Databasschema

Se `SAD.md` sektion "Databasschema" för alla 8 tabeller med kolumnbeskrivningar.

## Appendix D: Kontakt

| Roll                           | Namn          | Kommentar                                        |
| ------------------------------ | ------------- | ------------------------------------------------ |
| Utvecklare (alla 18 sessioner) | Mikael Wikman | mikwik.se — Cloudflare-konto, Resend-konto, repo |
