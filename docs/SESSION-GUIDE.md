# Stage — Sessionguider

> Kompakta guider per resterande session. Max 50 rader per session.
> Fullständig plan: `docs/IMPLEMENTATION-PLAN.md`

---

## Session 8a: Backend-refaktorering + Processfixar ✅ DONE
**Levererat:** Service-layer (5 services), email-uppdelning (5 filer), queries-uppdelning (4 filer), 24 nya tester, processdokumentation. Alla routes < 200 rader.

---

## Session 8b: Zod-validering + Error-handler + Tunna routes ✅ DONE
**Levererat:** 7 Zod-schemas, parseBody() wrapper, error-handler middleware, all inline-validering ersatt. Netto -199 rader. 51 tester passerar.

---

## Session 9: Frontend-refaktorering + R2 + dnd-kit + CSV-export ✅ DONE
**Levererat:** EventDetail.tsx 1727→176 rader, 10 feature-filer, R2-bilduppladdning, dnd-kit WaitlistPanel, CSV-export. 52 tester.

---

## Session 10: Behörighetssystem ✅ DONE
**Levererat:** Auth-middleware, roller per event (owner/editor/viewer), login-sida, PermissionsPanel, auto-owner. 61 tester.

---

## Session 11: Email-förbättringar + Aktivitetslogg + Sök ✅ DONE
**Levererat:** 6 backend-mallar, template-renderer, email-kö med Cron Trigger, aktivitetslogg, global sök, ActivityTimeline, SearchBar. 66 tester.

---

## Session 12: RSVP-förbättringar + Inställningar-tab ✅ DONE
**Levererat:** RSVP: hero-bild, dietary/allergier, plus-one-gäst, bekräftelsesammanfattning, avbokningsbekräftelse. Inställningar: inline-redigering, hero image upload, synlighets-toggle, sender mailbox, GDPR-text, DangerZone. Migration 0005. 68 tester.

---

## Session 13a: Saknade features från planen
**Mål:** Implementera 5 saknade features som planen specificerade men som aldrig byggdes.

**1. Klona event**
- `backend/src/services/event.service.ts` — clone() kopierar alla fält utom datum/tid/slug
- `backend/src/routes/events.ts` — POST /api/events/:id/clone
- `frontend/src/pages/Overview.tsx` — "Klona"-knapp per EventCard
- Zod-schema om det behövs i `packages/shared/src/schemas.ts`

**2. Unsubscribe-länk i mail (GDPR art. 7(3))**
- `backend/src/services/email/html-builder.ts` — lägg till avregistreringslänk i footer på alla mail
- Länken pekar till deltagarens RSVP-sida (avboka = opt-out)

**3. Skicka testmail till mig**
- `backend/src/routes/mailings.ts` — POST /api/events/:id/mailings/:mid/test (skickar till inloggad användare)
- `frontend/src/components/features/email/MailingsTab.tsx` — "Skicka testmail"-knapp

**4. Svarsfrist-UI för väntlistade**
- `backend/src/routes/participants.ts` — PUT response_deadline (kolumn finns redan i DB)
- `frontend/src/components/features/participants/ParticipantsTab.tsx` — datepicker per väntlistad

**5. Template preview-endpoint**
- `backend/src/routes/mailings.ts` — GET /api/templates/:type/preview (renderad HTML med exempeldata)

**Klart när:** Alla 5 features implementerade, tester för varje, typecheck + test gröna, deploy

---

## Session 13b: Integrationstester + Deploy Fas 1
**Mål:** End-to-end integrationstester, slutgiltig docs-uppdatering, deploy.

**Integrationstester** (`backend/src/__tests__/integration.test.ts`):
- Event→deltagare→waitlist→promote
- Inbjudan→RSVP→bekräftelse
- Behörigheter (owner/editor/viewer)
- Email-queue (Cron processning)
- Klona event→verifiera kopia

**Docs + Deploy:**
- Uppdatera SAD.md (komplett för onboarding)
- Uppdatera TESTPLAN.md med nya testfall
- `npm run build && npx wrangler deploy`

**Klart när:** Alla integrationstester gröna, appen deployad, docs kompletta för Fas 1

---

## Session 14-18: Fas 2
Följer `docs/IMPLEMENTATION-PLAN.md` exakt:
- **14:** GrapeJS mailredigerare
- **15:** Eventwebbplats
- **16:** GrapeJS webbplatsredigerare (valfri)
- **17:** Systemadmin + brand-kontroll
- **18:** Test, polish, deploy Fas 2
