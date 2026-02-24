# Bidra till Stage

Tack för att du vill bidra! Här är riktlinjer för att hålla kodbasen konsekvent och kvalitativ.

## Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0
- (Valfritt) Cloudflare-konto för deploy

## Snabbstart

```bash
git clone <repo-url>
cd stage
npm install
npm run db:migrate:local -- migrations/0001_events_participants.sql
npm run db:migrate:local -- migrations/0002_mailings.sql
npm run db:migrate:local -- migrations/0003_users_permissions.sql
npm run db:migrate:local -- migrations/0004_activities.sql
npm run db:migrate:local -- migrations/0005_participant_extras.sql
npm run db:migrate:local -- migrations/0006_email_editor.sql
npm run db:migrate:local -- migrations/0007_search_indexes.sql
npm run db:migrate:local -- migrations/0008_admin.sql
npm run db:migrate:local -- migrations/0009_rate_limits.sql
npm run dev
```

## Git workflow

1. Skapa en feature branch från `main`: `git checkout -b feat/min-feature`
2. Gör dina ändringar och committa (se commit-format nedan)
3. Pusha och skapa en Pull Request mot `main`
4. Alla CI-checks (typecheck, lint, test) måste passera
5. Minst en kodgranskning innan merge

## Commit-format (Conventional Commits)

```
<typ>: <kort beskrivning>

[Valfri längre beskrivning]
```

**Typer:**

| Typ | Beskrivning |
|-----|-------------|
| `feat` | Ny feature |
| `fix` | Buggfix |
| `refactor` | Kodändring utan ny feature eller fix |
| `test` | Tester (nya eller ändrade) |
| `docs` | Dokumentation |
| `chore` | Build, CI, beroenden |
| `style` | Formatering (ingen kodändring) |

**Exempel:**
```
feat: Lägg till CSV-export för deltagare
fix: Korrigera rate limiting för RSVP-endpoint
refactor: Bryt upp SettingsTab till delkomponenter
```

## Arkitekturregler

### Backend

- **Tunna routes:** Routes parsear request, anropar service, returnerar response. Max 200 rader per route-fil.
- **Affärslogik i services:** All affärslogik ligger i `backend/src/services/`. Aldrig i routes.
- **Databasqueries:** Typsäkra queries i `backend/src/db/`. Aldrig rå SQL i routes eller services (undantag: komplexa queries som bulk-uppdateringar).
- **Validering:** Zod-schemas i `packages/shared/src/schemas.ts` eller `backend/src/utils/validation.ts`.

### Frontend

- React + TypeScript + Vite
- TanStack Query för server state (hooks i `frontend/src/hooks/`)
- CSS-variabler från Consid Brand Guidelines (aldrig hårdkodade färger)

### Generellt

- **Max 400 rader per fil.** Bryt upp om filen växer.
- **Delade typer** i `packages/shared/src/types.ts`
- **Inga `any`-typer** — ESLint-regel `@typescript-eslint/no-explicit-any: error`

## Testning

### Krav

- Varje ny service MÅSTE ha tester i en colocated `__tests__/`-mapp
- Alla tester måste passera: `npm run test`
- Typecheck måste passera: `npm run typecheck`

### Mönster

```typescript
import { env } from 'cloudflare:test';
import { describe, it, expect, beforeAll } from 'vitest';

// Skapa tabeller i beforeAll
beforeAll(async () => {
  await env.DB.exec(CREATE_TABLE_SQL);
});

describe('MinService', () => {
  it('gör det förväntade', async () => {
    const result = await MinService.method(env.DB, input);
    expect(result).toBeDefined();
  });
});
```

## Kodgranskning-checklista

- [ ] Inga filer över 400 rader
- [ ] Affärslogik i services, inte routes
- [ ] Inga `any`-typer
- [ ] Inga hårdkodade färger (använd CSS-variabler)
- [ ] Nya services har tester
- [ ] Inga oanvända imports
- [ ] `npm run typecheck` + `npm run lint` + `npm run test` passerar
