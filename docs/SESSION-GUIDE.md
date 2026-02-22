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

## Session 9: Frontend-refaktorering + R2 + dnd-kit + CSV-export
**Mål:** Bryt ut EventDetail.tsx. R2-bilduppladdning, dnd-kit, CSV-export.

**Filer att skapa/ändra:**
- `frontend/src/components/features/participants/ParticipantsTab.tsx`
- `frontend/src/components/features/participants/AddParticipantModal.tsx`
- `frontend/src/components/features/participants/ImportCSVModal.tsx`
- `frontend/src/components/features/participants/WaitlistPanel.tsx` — dnd-kit
- `frontend/src/components/features/email/MailingsTab.tsx`
- `frontend/src/components/features/email/CreateMailingModal.tsx`
- `frontend/src/components/features/events/SummaryTab.tsx`
- `backend/src/routes/images.ts` — POST /api/images (R2)
- `backend/src/services/image.service.ts` — validering
- `GET /api/events/:id/participants/export` — CSV-export

**Arkitekturkrav:** EventDetail.tsx < 200 rader, features/ har 6+ filer

**Klart när:** EventDetail.tsx < 200 rader, R2 fungerar, dnd-kit fungerar, CSV-export fungerar

---

## Session 10: Behörighetssystem
**Mål:** Auth-middleware + roller per event.

**Filer att skapa/ändra:**
- `migrations/0003_event_permissions.sql`
- `backend/src/middleware/auth.ts` — AuthProvider interface + token
- `backend/src/services/permission.service.ts` + tester
- `backend/src/routes/auth.ts` — POST /api/auth/login
- `backend/src/routes/permissions.ts`
- `frontend/src/pages/Login.tsx`
- `frontend/src/components/features/settings/PermissionsPanel.tsx`

**Klart när:** Inloggning, endpoints skyddade, roller fungerar, 5+ nya tester

---

## Session 11: Email-förbättringar + Aktivitetslogg + Sök
**Mål:** Backend-mallar, email-queue med Cron Trigger, aktivitetslogg, global sök.

**Filer att skapa/ändra:**
- `backend/src/services/email/templates/` — 6 mallar
- `backend/src/services/email/template-renderer.ts`
- `backend/src/services/email/send-queue.ts`
- `migrations/0004_activities.sql`
- `backend/src/services/activity.service.ts` + tester
- `backend/src/routes/activities.ts`, `search.ts`
- `frontend/src/components/features/events/ActivityTimeline.tsx`
- `frontend/src/components/layout/SearchBar.tsx`

**Klart när:** Mallar på backend, Cron processar kö, aktivitetslogg, sök fungerar

---

## Session 12: Inställningar-tab + Polish
**Mål:** Komplett Inställningar-tab + UI-polish.

**Filer att skapa/ändra:**
- `frontend/src/components/features/settings/EventSettingsForm.tsx`
- `frontend/src/components/features/settings/VisibilityToggle.tsx`
- `frontend/src/components/features/settings/DangerZone.tsx`

**Klart när:** Event redigerbart via Inställningar-tabb, synlighet togglas, radera fungerar

---

## Session 13: Integrationstester + Deploy Fas 1
**Mål:** E2E-tester, final docs, deploy.

**Tester:** Event→deltagare→waitlist→promote, Inbjudan→RSVP→bekräftelse, Behörigheter, Email-queue
**Klart när:** Alla tester gröna, appen deployad, docs kompletta

---

## Session 14-18: Fas 2
Följer `docs/IMPLEMENTATION-PLAN.md` exakt:
- **14:** GrapeJS mailredigerare
- **15:** Eventwebbplats
- **16:** GrapeJS webbplatsredigerare (valfri)
- **17:** Systemadmin + brand-kontroll
- **18:** Test, polish, deploy Fas 2
