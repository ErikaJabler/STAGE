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

## Session 13a: Saknade features från planen ✅ DONE
**Levererat:** 5 features: Klona event (POST /clone + frontend-knapp), unsubscribe-länk i mailfooter (GDPR), skicka testmail (POST /test + frontend-knapp), svarsfrist-UI för väntlistade (datepicker), template preview-endpoint (GET /preview). 4 nya tester (72 totalt).

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
