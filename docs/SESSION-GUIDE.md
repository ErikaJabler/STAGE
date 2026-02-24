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

## Session 13b: Integrationstester + Deploy Fas 1 ✅ DONE

**Levererat:** 14 E2E-integrationstester i 5 flöden: waitlist+promote, RSVP+bekräftelse, behörigheter (owner/editor/viewer), email-kö+Cron, klona event. Totalt 86 tester. Docs uppdaterade. Deploy.

---

## Session 14: GrapeJS mailredigerare ✅ DONE

**Levererat:** GrapeJS WYSIWYG drag-and-drop editor för mail. 3 nya filer (EmailEditor, email-preset, brand-config). 7 email-block (text, rubrik, bild, CTA-knapp, avdelare, kolumner, mellanrum). Consid brand constraints (begränsad färgpalett, typsnitt, CTA-stil). R2-bilduppladdning. Desktop/mobil preview. Val "Visuell editor" vs "Snabbredigering". Migration 0006 (html_body + editor_data). juice CSS-inlining. 86 tester.

---

## Session 15: Eventwebbplats ✅ DONE

Publik eventwebbsida med 2 templates (Hero + Info, Hero + Program + Plats). Anmälningsformulär med GDPR-samtycke. WebsitePanel i Inställningar-tab. 6 nya tester (92 totalt).

## Bugfix: Utskick mall → editor → spara ✅ DONE (2026-02-23)

**Fixat:** Mall-klick → direkt till formulär, felhantering i visuell editors Spara-knapp, toast z-index höjt till 9999 (doldes bakom fullscreen-editor z-2000).

---

## Session 16: GrapeJS webbplatsredigerare ✅ DONE

**Levererat:** PageEditor.tsx (GrapeJS-wrapper för webbsidor, lazy-loaded). 14 webbsideblock (hero, eventinfo, program, plats, anmälningsformulär, footer + generella). buildInitialPageHtml() för förpopulerad editor. WebsitePanel med "Visuell editor"-knapp, "Anpassad sida"-badge, "Återställ till mall". PublicEvent renderar page_html med createPortal för React-formulär. 92 tester.

---

## Session 17: Systemadmin + brand-kontroll ✅ DONE

**Levererat:** Migration 0008 (is_admin). AdminService (dashboard-aggregat, krockkontroll). Admin guard + routes (GET /dashboard, GET /events). Conflicts endpoint (GET /conflicts). AdminDashboard-sida (statistikkort, kommande events, senaste utskick, alla events). RequireAdmin guard. Sidebar admin-länk + badge. Krockkontroll i EventForm (datum+plats, varning med "Skapa ändå"). GrapeJS header/footer-låsning (data-locked-attribut + lockBrandComponents). 9 nya tester (101 totalt).

---

## Session 18: Test, polish, deploy Fas 2 ✅ DONE

**Levererat:** Kodgranskning av GrapeJS mailrendering, publik webbplats, admin-dashboard. 3 bugfixar: XSS-skydd i email merge fields (renderHtml()), mobilresponsivt registreringsformulär (flex-wrap), admin-dashboard days_until tidszonsfix. 6 nya manuella testfall. 101 tester. Docs uppdaterade.

---

# Fas 3: Refaktorering & Förvaltning

> Fullständig plan: `docs/REFACTORING-PLAN.md`

---

## Session 19: Säkerhetsfixar ✅ DONE

**Levererat:** DOMPurify XSS-skydd i PublicEvent. R2 path traversal-validering (prefix allowlist + UUID filename). D1-baserad rate limiter (auth/login 10/h, RSVP respond 5/min). Admin-bypass i permissions (owner || admin). JSON.parse try-catch i website.service. 12 nya tester (113 totalt). Migration 0009.

---

## Session 20a: Backend-refaktorering ✅ DONE

**Levererat:** escapeHtml konsoliderad till utils/escaping.ts. Route-helpers (parseIdParam + requireEvent) eliminerar duplicerad validateEvent i 2 filer + standardiserar ID-validering i 5 route-filer. mailing.service.ts refaktorerad (buildQueueItem, sendEmailsDirect, DIRECT_SEND_THRESHOLD). Search-query flyttad till service-lager (SearchService + search.queries.ts). ~70 rader netto borttagna. 113 tester.

---

## Session 20b: Saknade tester ✅ DONE

**Levererat:** 3 nya testfiler: mailing.service.test.ts (14 tester), rsvp.service.test.ts (10 tester), template-renderer.test.ts (11 tester). Totalt 35 nya tester (148 totalt). Full täckning av MailingService (send/sendToNew/sendTest/update), RsvpService (respond/cancel/auto-waitlist), template-renderer (renderHtml/renderText/XSS-escape/buildMergeContext).

---

## Session 21a: Frontend-refaktorering (SettingsTab + WebsitePanel + RsvpPage + a11y) ✅ DONE

**Levererat:** SettingsTab (561→44, 3 nya komponentfiler), WebsitePanel (607→145, 2 nya komponentfiler + hook), RsvpPage (568→150, 2 nya komponentfiler + ikonfil + hook). A11y: focus trap i Modal, aria-labels, alt-text, touch targets 44px. 10 nya filer. 148 tester (oförändrat).

---

## Session 21b: Frontend-refaktorering (PublicEvent + EventForm + CreateMailingModal + AdminDashboard) ✅ DONE

**Levererat:** PublicEvent (554→147, 2 nya komponentfiler), EventForm (484→387, 2 nya hooks), CreateMailingModal (447→342, 1 ny hook), AdminDashboard (418→87, 2 nya komponentfiler). 7 nya filer. 148 tester (oförändrat).

---

## Session 22: Developer Experience ✅ DONE

**Levererat:** ESLint 10 flat config (no-explicit-any, no-unused-vars, max-lines 400). Prettier (single quotes, trailing commas). EditorConfig. Autofix på hela kodbasen (11 oanvända imports borttagna). GitHub Actions CI (typecheck → lint → test). PR-template. Husky + lint-staged pre-commit. README utökad (prerequisites, setup, troubleshooting). CONTRIBUTING.md (git workflow, Conventional Commits, arkitekturregler). .dev.vars.example. .gitattributes. 9 nya filer. 148 tester (oförändrat).
