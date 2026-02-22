# Stage — Manuell testplan

> Testfall skrivs per session från användarens perspektiv.
> Format: tydliga steg, URL:er, förväntade resultat.
> Utformat för framtida AI-driven testning.
> **Live URL:** https://mikwik.se/stage/

---

## Session 0: Repo + config + build pipeline

### TC-0.1: Appen startar
**Förutsättning:** `npm install` har körts
**Steg:**
1. Kör `npm run dev` i terminalen
2. Öppna `http://localhost:8787/stage/` i webbläsaren
**Förväntat resultat:** Sidan visar Layout med sidebar (burgundy), topbar och eventöversikt
**Status:** ☐ Ej testad

### TC-0.2: Health-endpoint
**Förutsättning:** Dev-servern körs
**Steg:**
1. Öppna `https://mikwik.se/stage/api/health`
**Förväntat resultat:** JSON-svar: `{ "status": "ok", "timestamp": "..." }`
**Status:** ☑ Testad (session 3)

### TC-0.3: TypeScript-kontroll
**Steg:**
1. Kör `npm run typecheck` i terminalen
**Förväntat resultat:** Inga applikationsfel (TS6305-varningar från dist/ är kända och ofarliga)
**Status:** ☑ Testad (session 5)

### TC-0.4: Automatiska tester
**Steg:**
1. Kör `npm run test` i terminalen
**Förväntat resultat:** 21 tester gröna (health, events, participants, mailings/RSVP)
**Status:** ☑ Testad (session 5)

---

## Session 1: Designsystem + Layout

### TC-1.1: Sidebar och navigation
**Steg:**
1. Öppna `https://mikwik.se/stage/`
**Förväntat resultat:** Sidebar med burgundy bakgrund (#701131), vit Consid-logotyp, navigeringslänkar
**Status:** ☑ Testad (session 3)

### TC-1.2: Consid Sans typsnitt
**Steg:**
1. Öppna appen och inspektera texten i DevTools → Computed → font-family
**Förväntat resultat:** "Consid Sans" används (Regular 400, Medium 500, Semibold 600)
**Status:** ☑ Testad (session 2)

### TC-1.3: Consid-färger
**Steg:**
1. Inspektera sidebar-bakgrund, knappar, text
**Förväntat resultat:** Burgundy (#701131) sidebar, Raspberry Red (#B5223F) knappar, Beige (#EFE6DD) bakgrund, Black (#1C1C1C) text
**Status:** ☑ Testad (session 3)

---

## Session 2: CRUD Events

### TC-2.1: Lista events
**Steg:**
1. Öppna `https://mikwik.se/stage/`
**Förväntat resultat:** Eventöversikt med EventCards (namn, datum, plats, deltagare, status)
**Status:** ☑ Testad (session 3)

### TC-2.2: Visa eventdetalj
**Steg:**
1. Klicka på ett event i översikten
**Förväntat resultat:** Eventdetalj med tabs (Sammanfattning, Deltagare, Utskick, Inställningar). Sammanfattning visar statistik, eventinfo.
**Status:** ☑ Testad (session 3)

### TC-2.3: API — skapa event
**Steg:**
1. `curl -X POST https://mikwik.se/stage/api/events -H "Content-Type: application/json" -d '{"name":"Test","date":"2026-03-01","time":"18:00","location":"Kontoret","organizer":"Test","organizer_email":"test@test.se","status":"planning","type":"internal","visibility":"private","created_by":"test@test.se"}'`
**Förväntat resultat:** 201 Created med event-JSON inkl. auto-genererad slug
**Status:** ☑ Testad (automatiska tester, 9 st)

---

## Session 3: Skapa-event-formulär + deltagarhantering

### TC-3.1: Skapa event via formulär
**Steg:**
1. Klicka "+ Nytt event" i översikten
2. Fyll i alla obligatoriska fält
3. Klicka "Skapa event"
**Förväntat resultat:** Redirect till eventdetalj, toast "Event skapat"
**Status:** ☑ Testad (session 3)

### TC-3.2: Redigera event
**Steg:**
1. Öppna ett event → klicka "Redigera"
2. Ändra namn eller datum → klicka "Spara"
**Förväntat resultat:** Redirect till eventdetalj med uppdaterad info, toast
**Status:** ☑ Testad (session 3)

### TC-3.3: Lägg till deltagare
**Steg:**
1. Öppna event → Deltagare-tab → "+ Lägg till"
2. Fyll i namn, email, företag, kategori → "Lägg till"
**Förväntat resultat:** Deltagare syns i tabellen med status "Inbjuden"
**Status:** ☑ Testad (session 3)

### TC-3.4: Ta bort deltagare
**Steg:**
1. Öppna event → Deltagare-tab → klicka papperskorgsikonen
2. Bekräfta i confirm-dialog
**Förväntat resultat:** Deltagare försvinner ur listan, toast
**Status:** ☑ Testad (session 3)

### TC-3.5: API — participants CRUD
**Steg:**
1. Kör automatiska tester: `npm run test`
**Förväntat resultat:** 4 participant-tester passerar (create, list, update, delete)
**Status:** ☑ Testad (session 5, 21 tester totalt)

---

## Session 4: Mailutskick + RSVP

### TC-4.1: Skapa utskick (utkast)
**Steg:**
1. Öppna event → Utskick-tab → "+ Nytt utskick"
2. Välj mottagare, skriv ämne och meddelande → "Skapa utkast"
**Förväntat resultat:** Utskick syns i tabellen med status "Utkast"
**Status:** ☑ Testad (session 4)

### TC-4.2: Förhandsgranska utskick
**Steg:**
1. Klicka ögon-ikonen på ett utskick
**Förväntat resultat:** Modal med mottagare, status, datum och fullständigt meddelande
**Status:** ☑ Testad (session 4)

### TC-4.3: RSVP-sida laddas
**Steg:**
1. Öppna `https://mikwik.se/stage/rsvp/<giltig-token>`
**Förväntat resultat:** RSVP-sida med eventinfo, deltagarnamn, "Jag kommer"/"Jag kan inte"-knappar
**Status:** ☑ Testad (session 4)

### TC-4.4: RSVP — svara "Jag kommer"
**Steg:**
1. Öppna RSVP-sidan → klicka "Jag kommer"
**Förväntat resultat:** Bekräftelsesida "Du är anmäld!", deltagare får status "attending" i admin
**Status:** ☑ Testad (session 5)

### TC-4.5: RSVP — ogiltig token
**Steg:**
1. Öppna `https://mikwik.se/stage/rsvp/ogiltig-token-som-inte-finns`
**Förväntat resultat:** Felmeddelande "Ogiltig eller utgången länk"
**Status:** ☑ Testad (automatiska tester)

---

## Session 5: Riktig mailsändning via Resend

### TC-5.1: Skicka utskick via Resend
**Steg:**
1. Skapa ett event med minst en deltagare (med riktig email)
2. Skapa utskick → Klicka skicka-ikonen (eller "Skicka utskick" i preview)
**Förväntat resultat:** Toast "Utskickat till N mottagare", utskick får status "Skickat"
**Status:** ☑ Testad (session 5 — mail mottaget på mikwik70@gmail.com)

### TC-5.2: HTML-mail med Consid-branding
**Steg:**
1. Öppna mottaget mail i inkorg
**Förväntat resultat:** Burgundy header med "Stage", vit body med meddelande, raspberry "Svara på inbjudan"-knapp, eventinfo (namn, datum, tid, plats) i footer, beige bakgrund
**Status:** ☑ Testad (session 5)

### TC-5.3: RSVP-länk i mail fungerar
**Steg:**
1. Klicka "Svara på inbjudan"-knappen i mailet
**Förväntat resultat:** Öppnar `https://mikwik.se/stage/rsvp/<token>`, RSVP-sidan laddas med eventinfo
**Status:** ☑ Testad (session 5)

### TC-5.4: {{name}} och {{rsvp_link}} placeholder
**Steg:**
1. Skapa utskick med `Hej {{name}}` och `{{rsvp_link}}` i brödtexten
2. Skicka utskicket
**Förväntat resultat:** Mailet visar deltagarens riktiga namn och en personlig RSVP-URL
**Status:** ☑ Testad (session 5)

### TC-5.5: Auto-append RSVP-länk
**Steg:**
1. Skapa utskick UTAN `{{rsvp_link}}` i brödtexten
2. Skicka utskicket
**Förväntat resultat:** RSVP-länk läggs till automatiskt i slutet av mailet + som HTML-knapp
**Status:** ☑ Testad (session 5)

### TC-5.6: Hjälptext om variabler i CreateMailingModal
**Steg:**
1. Öppna "+ Nytt utskick"-modalen
**Förväntat resultat:** Under textarea: text som förklarar `{{name}}` och `{{rsvp_link}}` med kodformatering
**Status:** ☑ Testad (session 5)

### TC-5.7: Hel E2E-kedja
**Steg:**
1. Skapa event → lägg till deltagare → skapa utskick → skicka
2. Öppna mail → klicka RSVP-knapp → svara "Jag kommer"
3. Gå till admin → Deltagare-tab
**Förväntat resultat:** Deltagaren har status "Deltar" (attending)
**Status:** ☑ Testad (session 5 — verifierat live)
