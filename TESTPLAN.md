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
**Förväntat resultat:** 92 tester gröna (health, events inkl. auth+clone, participants inkl. dietary/plus_one, mailings/RSVP inkl. template-preview+testmail, waitlist/ICS, event.service, participant.service, permission.service, activity.service, website.service, integration e2e)
**Status:** ☑ Testad (session 15)

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

---

## Session 6: CSV-import + mailmallar

### TC-6.1: Importera CSV med header-rad
**Steg:**
1. Skapa en CSV-fil med innehåll:
   ```
   namn,email,företag,kategori
   Anna Test,anna@test.se,Consid,intern
   Erik Test,erik@test.se,IKEA,partner
   Lisa Test,lisa@test.se,,
   ```
2. Öppna event → Deltagare-tab → "Importera CSV"
3. Välj filen → se förhandsgranskning → "Importera"
**Förväntat resultat:** Toast "3 deltagare importerade", alla tre syns i deltagartabellen med rätt kategori
**Status:** ☐ Ej testad

### TC-6.2: CSV-import hanterar dubbletter
**Steg:**
1. Importera CSV med en email som redan finns bland deltagarna
**Förväntat resultat:** Befintlig deltagare hoppas över, toast visar "X rader hoppades över", feldetaljer visar "Finns redan: email@test.se"
**Status:** ☐ Ej testad

### TC-6.3: CSV-import hanterar ogiltiga rader
**Steg:**
1. Importera CSV med rader som saknar namn, har ogiltig email, eller är tomma
**Förväntat resultat:** Giltiga rader importeras, ogiltiga hoppas över med tydliga felmeddelanden per rad
**Status:** ☐ Ej testad

### TC-6.4: CSV med semikolon-separator
**Steg:**
1. Skapa CSV med `;` som separator istället för `,`
2. Importera via "Importera CSV"
**Förväntat resultat:** Parsern identifierar semikolon som separator, import fungerar
**Status:** ☐ Ej testad

### TC-6.5: Importera CSV-knappen syns i tom-state och lista-vy
**Steg:**
1. Öppna event utan deltagare → Deltagare-tab
2. Öppna event med deltagare → Deltagare-tab
**Förväntat resultat:** "Importera CSV"-knapp syns i båda vyerna
**Status:** ☐ Ej testad

### TC-6.6: Välj mailmall "Save the date"
**Steg:**
1. Öppna event → Utskick-tab → "+ Nytt utskick"
2. Klicka på "Save the date"-kortet
**Förväntat resultat:** Ämne fylls i med "Save the date!", brödtext fylls i med malltext innehållande `{{name}}`
**Status:** ☐ Ej testad

### TC-6.7: Välj mailmall "Officiell inbjudan"
**Steg:**
1. Öppna "+ Nytt utskick" → klicka "Officiell inbjudan"
**Förväntat resultat:** Ämne och brödtext fylls i med inbjudningsmall, innehåller `{{name}}` och `{{rsvp_link}}`
**Status:** ☐ Ej testad

### TC-6.8: Välj mall och redigera innan skapande
**Steg:**
1. Välj en mall → ändra ämne och brödtext manuellt → "Skapa utkast"
**Förväntat resultat:** Utskicket skapas med den redigerade texten, inte originalmalltexten
**Status:** ☐ Ej testad

### TC-6.9: Avmarkera vald mall
**Steg:**
1. Välj en mall → klicka på samma mall igen
**Förväntat resultat:** Mallen avmarkeras (ingen blå border), ämne och brödtext behåller aktuellt innehåll
**Status:** ☐ Ej testad

### TC-6.10: API — CSV-import (automatiska tester)
**Steg:**
1. Kör `npm run test`
**Förväntat resultat:** 2 CSV-import-tester passerar (import med headers + dubbletter/validering)
**Status:** ☑ Testad (session 6, 23 tester totalt)

---

## Session 7: Väntlistelogik + Deltagarfiltrering + ICS-kalender

### TC-7.1: Auto-waitlist vid full kapacitet
**Steg:**
1. Skapa event med max_participants=2
2. Lägg till 2 deltagare med status "attending"
3. Lägg till en tredje deltagare med status "attending"
**Förväntat resultat:** Tredje deltagaren får automatiskt status "Väntelista" och queue_position=1
**Status:** ☐ Ej testad

### TC-7.2: Auto-promote vid borttagning
**Steg:**
1. Med event från TC-7.1 (2 attending + 1 waitlisted)
2. Ta bort en av de attending deltagarna
**Förväntat resultat:** Waitlisted-deltagaren uppgraderas automatiskt till "Deltar", queue_position nollställs
**Status:** ☐ Ej testad

### TC-7.3: Auto-promote vid statusändring
**Steg:**
1. Skapa event med max_participants=1, lägg till 1 attending + 1 waitlisted
2. Ändra attending-deltagarens status till "Avböjd"
**Förväntat resultat:** Waitlisted-deltagaren uppgraderas automatiskt till "Deltar"
**Status:** ☐ Ej testad

### TC-7.4: RSVP kapacitetskontroll
**Steg:**
1. Skapa event med max_participants=1, lägg till 1 attending
2. Öppna RSVP-sida för en invited deltagare → klicka "Jag kommer"
**Förväntat resultat:** Deltagaren placeras på väntelista (status "waitlisted"), inte "attending"
**Status:** ☐ Ej testad

### TC-7.5: RSVP avbokning → auto-promote
**Steg:**
1. Skapa event med max_participants=1, 1 attending + 1 waitlisted
2. Öppna RSVP-sida för attending-deltagaren → "Avboka min plats"
**Förväntat resultat:** Attending avbokas, waitlisted uppgraderas till attending
**Status:** ☐ Ej testad

### TC-7.6: Omsortera väntelista
**Steg:**
1. Skapa event med max_participants=1, lägg till 3 deltagare med status attending (2 hamnar i kö)
2. Klicka "Flytta upp" på deltagare #2 i kön
**Förväntat resultat:** Deltagare #2 byter plats med #1, köpositioner uppdateras
**Status:** ☐ Ej testad

### TC-7.7: Sök deltagare
**Steg:**
1. Öppna event med flera deltagare → Deltagare-tab
2. Skriv ett namn i sökfältet
**Förväntat resultat:** Tabellen filtreras i realtid, visar bara deltagare vars namn, email eller företag matchar
**Status:** ☐ Ej testad

### TC-7.8: Statusfilter
**Steg:**
1. Öppna event med deltagare i olika status → Deltagare-tab
2. Klicka på "Deltar"-chippen
**Förväntat resultat:** Bara deltagare med status "attending" visas, aktiv chip highlightas i burgundy
**Status:** ☐ Ej testad

### TC-7.9: Kombinerat sök + statusfilter
**Steg:**
1. Välj statusfilter "Deltar"
2. Skriv ett namn i sökfältet
**Förväntat resultat:** Bara deltagare som matchar BÅDE status OCH sökterm visas (AND-logik)
**Status:** ☐ Ej testad

### TC-7.10: ICS-kalenderfil via backend
**Steg:**
1. Öppna `https://mikwik.se/stage/api/events/<id>/calendar.ics`
**Förväntat resultat:** Laddar ner .ics-fil, öppnas korrekt i kalenderapp med rätt datum, tid, plats, titel
**Status:** ☐ Ej testad

### TC-7.11: "Lägg till i kalender"-knapp på RSVP
**Steg:**
1. Öppna RSVP-sida → svara "Jag kommer"
2. Klicka "Lägg till i kalender"
**Förväntat resultat:** .ics-fil laddas ner med korrekt eventdata, öppnas i kalenderapp
**Status:** ☐ Ej testad

---

## Session 8b: Zod-validering + Error-handler middleware

### TC-8b.1: Zod-validering avvisar ogiltigt event
**Steg:**
1. `curl -X POST https://mikwik.se/stage/api/events -H "Content-Type: application/json" -d '{"name":"","date":"not-a-date"}'`
**Förväntat resultat:** 400 med `{ "error": "Valideringsfel", "details": ["name krävs", "date måste vara YYYY-MM-DD", ...] }`
**Status:** ☐ Ej testad

### TC-8b.2: Zod-validering avvisar ogiltig deltagare
**Steg:**
1. `curl -X POST https://mikwik.se/stage/api/events/1/participants -H "Content-Type: application/json" -d '{"name":"","email":"invalid"}'`
**Förväntat resultat:** 400 med `{ "error": "Valideringsfel", "details": ["name krävs", "email måste vara en giltig emailadress"] }`
**Status:** ☐ Ej testad

### TC-8b.3: Zod-validering avvisar ogiltig RSVP-status
**Steg:**
1. `curl -X POST https://mikwik.se/stage/api/rsvp/<token>/respond -H "Content-Type: application/json" -d '{"status":"maybe"}'`
**Förväntat resultat:** 400 med `{ "error": "Valideringsfel", "details": ["status måste vara 'attending' eller 'declined'"] }`
**Status:** ☐ Ej testad

### TC-8b.4: Error-handler returnerar 500 vid oväntat fel
**Steg:**
1. Trigga ett oväntat serverfel (t.ex. via trasig DB-anslutning)
**Förväntat resultat:** 500 med `{ "error": "Internt serverfel" }` (inte stack trace)
**Status:** ☐ Ej testad

### TC-8b.5: Giltigt event skapas korrekt med Zod-validering
**Steg:**
1. `curl -X POST https://mikwik.se/stage/api/events -H "Content-Type: application/json" -d '{"name":"Test","date":"2026-06-01","time":"18:00","location":"Kontoret","organizer":"Test","organizer_email":"test@test.se"}'`
**Förväntat resultat:** 201 Created med event-JSON (slug auto-genererad, status "planning")
**Status:** ☐ Ej testad

### TC-8b.6: Zod-validering i participant.service.test (automatiska)
**Steg:**
1. Kör `npm run test`
**Förväntat resultat:** createParticipantSchema-tester (4 st) + updateParticipantSchema-tester (2 st) passerar
**Status:** ☑ Testad (session 8b)

---

## Session 9: Frontend-refaktorering + R2 + dnd-kit + CSV-export

### TC-9.1: EventDetail.tsx under 200 rader
**Steg:**
1. Kör `wc -l frontend/src/pages/EventDetail.tsx`
**Förväntat resultat:** < 200 rader (alla tabs utbrutna till feature-komponenter)
**Status:** ☑ Testad (session 9 — 176 rader)

### TC-9.2: Feature-komponenter fungerar (Sammanfattningstab)
**Steg:**
1. Öppna event → Sammanfattning-tab
**Förväntat resultat:** Statistik (deltagare, status, typ), eventinfo (datum, tid, plats, arrangör) visas korrekt
**Status:** ☐ Ej testad

### TC-9.3: Feature-komponenter fungerar (Deltagartab)
**Steg:**
1. Öppna event med deltagare → Deltagare-tab
**Förväntat resultat:** Deltagartabell, sökfält, statusfilter, knappar (lägg till, importera, exportera) fungerar
**Status:** ☐ Ej testad

### TC-9.4: Feature-komponenter fungerar (Utskickstab)
**Steg:**
1. Öppna event → Utskick-tab → "+ Nytt utskick"
**Förväntat resultat:** Utskickslista, mallväljare, förhandsgranskning fungerar som innan
**Status:** ☐ Ej testad

### TC-9.5: CSV-export
**Steg:**
1. Öppna event med deltagare → Deltagare-tab
2. Klicka "Exportera CSV"
**Förväntat resultat:** CSV-fil laddas ner med header (Namn,E-post,Företag,Kategori,Status) + rader per deltagare
**Status:** ☐ Ej testad

### TC-9.6: CSV-export API
**Steg:**
1. Kör `curl https://mikwik.se/stage/api/events/<id>/participants/export`
**Förväntat resultat:** CSV-data med Content-Type: text/csv och Content-Disposition: attachment
**Status:** ☑ Testad (automatiskt test)

### TC-9.7: R2-bilduppladdning (backend)
**Steg:**
1. `curl -X POST https://mikwik.se/stage/api/images -F "file=@bild.jpg"`
**Förväntat resultat:** 201 Created med `{ "key": "events/<uuid>.jpg", "url": "/stage/api/images/events/<uuid>.jpg" }`
**Status:** ☐ Ej testad (kräver R2-bucket skapad)

### TC-9.8: R2-bilduppladdning — filtyp-validering
**Steg:**
1. `curl -X POST https://mikwik.se/stage/api/images -F "file=@dokument.pdf"`
**Förväntat resultat:** 400 med `{ "error": "Otillåten filtyp: application/pdf. Tillåtna: JPEG, PNG, WebP." }`
**Status:** ☐ Ej testad

### TC-9.9: R2-bilduppladdning — storleksgräns
**Steg:**
1. Försök ladda upp en bild > 5 MB
**Förväntat resultat:** 400 med felmeddelande om storlek
**Status:** ☐ Ej testad

### TC-9.10: dnd-kit väntlista drag-n-drop
**Steg:**
1. Öppna event med väntlistade deltagare → Deltagare-tab
2. Dra en deltagare i WaitlistPanel till en ny position
**Förväntat resultat:** Deltagaren byter position, köplatser uppdateras
**Status:** ☐ Ej testad

### TC-9.11: API — CSV-export (automatiskt test)
**Steg:**
1. Kör `npm run test`
**Förväntat resultat:** CSV-export-test passerar (header + data + Content-Type/Disposition)
**Status:** ☑ Testad (session 9, 52 tester totalt)

### TC-9.12: Modaler öppnas en åt gången
**Steg:**
1. Öppna event med deltagare → Deltagare-tab
2. Klicka "Importera CSV"
3. Stäng modalen
4. Klicka "+ Lägg till"
**Förväntat resultat:** Bara en modal visas åt gången, aldrig staplade modaler
**Status:** ☑ Testad (session 9 — bugfix)

---

## Session 10: Behörighetssystem

### TC-10.1: Login-sida visas för oautentiserad användare
**Steg:**
1. Rensa localStorage (eller öppna inkognitofönster)
2. Navigera till `https://mikwik.se/stage/`
**Förväntat resultat:** Redirect till login-sida med namn- och e-postfält, Stage-logotyp, Consid-branding
**Status:** ☐ Ej testad

### TC-10.2: Login skapar konto och loggar in
**Steg:**
1. På login-sidan, fyll i namn och e-post → "Logga in"
**Förväntat resultat:** Redirect till översiktssidan, sidebar visar användarnamn + e-post + utloggningsknapp
**Status:** ☐ Ej testad

### TC-10.3: Login med befintligt konto returnerar samma token
**Steg:**
1. Logga in med samma e-post som innan
**Förväntat resultat:** Inloggning lyckas, ingen dubblett i users-tabellen
**Status:** ☐ Ej testad

### TC-10.4: Utloggning
**Steg:**
1. Klicka "Logga ut" i sidebar
**Förväntat resultat:** Redirect till login-sida, localStorage rensad
**Status:** ☐ Ej testad

### TC-10.5: API returnerar 401 utan token
**Steg:**
1. `curl https://mikwik.se/stage/api/events`
**Förväntat resultat:** 401 `{ "error": "Autentisering krävs" }`
**Status:** ☑ Testad (automatiskt test)

### TC-10.6: API returnerar 401 med ogiltig token
**Steg:**
1. `curl -H "X-Auth-Token: ogiltig" https://mikwik.se/stage/api/events`
**Förväntat resultat:** 401 `{ "error": "Ogiltig token" }`
**Status:** ☐ Ej testad

### TC-10.7: Eventskapare blir automatiskt ägare
**Steg:**
1. Logga in → skapa nytt event
2. Öppna eventet → Inställningar-tab
**Förväntat resultat:** Behörighetslista visar dig som "Ägare"
**Status:** ☐ Ej testad

### TC-10.8: Ägare kan lägga till redigerare
**Steg:**
1. Som ägare: Inställningar-tab → "+ Lägg till" → fyll i namn, e-post, roll "Redigerare" → "Lägg till"
**Förväntat resultat:** Redigeraren visas i listan med badge "Redigerare"
**Status:** ☐ Ej testad

### TC-10.9: Ägare kan ta bort behörighet
**Steg:**
1. Som ägare: klicka × på en redigerare/läsare i behörighetslistan
**Förväntat resultat:** Behörigheten tas bort, personen syns inte längre
**Status:** ☐ Ej testad

### TC-10.10: Viewer kan se men inte redigera
**Steg:**
1. Logga in som viewer → navigera till eventet
**Förväntat resultat:** Kan se sammanfattning, deltagare, utskick. Redigera-knapp och modifierande åtgärder returnerar 403.
**Status:** ☐ Ej testad

### TC-10.11: RSVP förblir publikt (ingen auth krävs)
**Steg:**
1. Öppna `/stage/rsvp/<token>` utan inloggning
**Förväntat resultat:** RSVP-sida laddas och fungerar utan autentisering
**Status:** ☑ Testad (automatiska tester)

### TC-10.12: Permission-tester (automatiska)
**Steg:**
1. Kör `npm run test`
**Förväntat resultat:** 8 permission.service.test passerar (setOwner, owner/editor/viewer rollkontroll, oautentiserad nekas, removePermission, listForEvent, roleUpgrade)
**Status:** ☑ Testad (session 10, 61 tester totalt)

---

## Session 11: Email-förbättringar + Aktivitetslogg + Sök

### TC-11.1: Aktivitetslogg visas i Sammanfattning-tab
**Steg:**
1. Öppna event → Sammanfattning-tab
**Förväntat resultat:** "Aktivitetslogg" sektion visas med tidslinje av händelser (skapat, deltagare tillagda, utskick, etc.)
**Status:** ☐ Ej testad

### TC-11.2: Aktivitetslogg loggar event-skapande
**Steg:**
1. Skapa ett nytt event
2. Öppna eventet → Sammanfattning-tab
**Förväntat resultat:** Aktivitetsloggen visar "Event 'Namn' skapat" med tidsstämpel
**Status:** ☐ Ej testad

### TC-11.3: Aktivitetslogg loggar deltagare tillagd
**Steg:**
1. Öppna event → Deltagare-tab → "+ Lägg till"
2. Fyll i och spara
3. Gå till Sammanfattning-tab
**Förväntat resultat:** Aktivitetsloggen visar "Deltagare 'Namn' tillagd" med tidsstämpel
**Status:** ☐ Ej testad

### TC-11.4: Aktivitetslogg loggar utskick skapat
**Steg:**
1. Öppna event → Utskick-tab → "+ Nytt utskick" → "Skapa utkast"
2. Gå till Sammanfattning-tab
**Förväntat resultat:** Aktivitetsloggen visar "Utskick 'Ämne' skapat" med tidsstämpel
**Status:** ☐ Ej testad

### TC-11.5: Sökfält i topbar
**Steg:**
1. Logga in → se topbar
**Förväntat resultat:** Sökfält med "Sök event..."-placeholder visas till höger i topbar
**Status:** ☐ Ej testad

### TC-11.6: Sök event
**Steg:**
1. Skriv minst 2 tecken i sökfältet
**Förväntat resultat:** Dropdown med matchande events (namn, plats, arrangör), visar eventnamn + datum/plats
**Status:** ☐ Ej testad

### TC-11.7: Sökresultat navigerar till event
**Steg:**
1. Sök och klicka på ett event i dropdown-listan
**Förväntat resultat:** Navigerar till eventdetalj-sidan, sökfältet töms
**Status:** ☐ Ej testad

### TC-11.8: Sök med tangentbord
**Steg:**
1. Skriv sökterm → använd piltangenter (upp/ner) → tryck Enter
**Förväntat resultat:** Piltangenter markerar resultat, Enter navigerar till markerat event, Escape stänger dropdown
**Status:** ☐ Ej testad

### TC-11.9: Sök visar "Inga resultat"
**Steg:**
1. Skriv en sökterm som inte matchar något event
**Förväntat resultat:** Dropdown visar "Inga resultat" (italic, muted)
**Status:** ☐ Ej testad

### TC-11.10: Email-mallar från backend
**Steg:**
1. Öppna event → Utskick-tab → "+ Nytt utskick"
**Förväntat resultat:** 6 mallkort visas (Save the date, Inbjudan, Väntelista, Bekräftelse, Påminnelse, Tack), hämtade från backend
**Status:** ☐ Ej testad

### TC-11.11: Mallval fyller i ämne och meddelande med merge-fält
**Steg:**
1. Klicka på en mall (t.ex. "Inbjudan")
**Förväntat resultat:** Ämne och brödtext fylls i med malltext, inkluderar {{name}}, {{event}}, {{datum}}, {{rsvp_link}} etc.
**Status:** ☐ Ej testad

### TC-11.12: Email-kö (Cron Trigger)
**Steg:**
1. Skicka utskick till > 5 mottagare
**Förväntat resultat:** Utskick köas i email_queue-tabellen, Cron Trigger processar kön var 5:e minut
**Status:** ☐ Ej testad (kräver deploy med Cron Trigger)

### TC-11.13: Aktivitetslogg API (automatiska tester)
**Steg:**
1. Kör `npm run test`
**Förväntat resultat:** 5 activity.service.test passerar (log+retrieve, list, metadata JSON, limit, status change)
**Status:** ☑ Testad (session 11, 66 tester totalt)

---

## Session 12: RSVP-förbättringar + Inställningar-tab

### TC-12.1: RSVP — hero-bild visas
**Steg:**
1. Skapa event med hero-bild (ladda upp via Inställningar)
2. Öppna RSVP-sida via deltagartoken
**Förväntat resultat:** Hero-bild visas överst i RSVP-kortet med gradient-overlay och "Stage"-logotyp
**Status:** ☐ Ej testad

### TC-12.2: RSVP — dietary notes sparas
**Steg:**
1. Öppna RSVP-sida → fyll i "Allergier / kostpreferenser" → "Jag kommer"
2. Kolla deltagaren i admin
**Förväntat resultat:** dietary_notes syns i deltagardata
**Status:** ☑ Testad (automatiskt test)

### TC-12.3: RSVP — plusett-gäst sparas
**Steg:**
1. Öppna RSVP-sida → klicka "+ Ta med en gäst" → fyll i namn + email → "Jag kommer"
2. Kolla deltagaren i admin
**Förväntat resultat:** plus_one_name och plus_one_email sparas
**Status:** ☑ Testad (automatiskt test)

### TC-12.4: RSVP — bekräftelsesida med sammanfattning
**Steg:**
1. Öppna RSVP-sida → "Jag kommer"
**Förväntat resultat:** Bekräftelsesida visar datum, tid, plats i sammanfattningskort + kalenderknapp
**Status:** ☐ Ej testad

### TC-12.5: RSVP — avbokning med bekräftelsesteg
**Steg:**
1. Öppna RSVP-sida (redan attending) → "Avboka min plats"
**Förväntat resultat:** Bekräftelsesteg visas med "Ja, avboka" / "Nej, behåll min plats" — inte direkt avbokning
**Status:** ☐ Ej testad

### TC-12.6: Inställningar-tab — inline-redigering
**Steg:**
1. Öppna event → Inställningar-tab → klicka "Redigera" på Eventinformation
2. Ändra namn eller datum → "Spara"
**Förväntat resultat:** Eventinfo uppdateras, toast "Eventinformation uppdaterad", formuläret stängs
**Status:** ☐ Ej testad

### TC-12.7: Inställningar-tab — hero image upload
**Steg:**
1. Öppna event → Inställningar → Hero-bild → klicka uploadarea
2. Välj en JPEG/PNG bild < 5 MB
**Förväntat resultat:** Bilden laddas upp, visas som preview, event.image_url uppdateras
**Status:** ☐ Ej testad

### TC-12.8: Inställningar-tab — synlighets-toggle
**Steg:**
1. Öppna event → Inställningar → klicka toggle "Publikt/Privat"
**Förväntat resultat:** Toggle byter, toast "Synlighet ändrad till publik/privat"
**Status:** ☐ Ej testad

### TC-12.9: Inställningar-tab — GDPR-text
**Steg:**
1. Öppna event → Inställningar → skriv GDPR-samtyckestext → "Spara"
**Förväntat resultat:** GDPR-text sparas, toast "GDPR-text uppdaterad"
**Status:** ☐ Ej testad

### TC-12.10: Inställningar-tab — sender mailbox
**Steg:**
1. Öppna event → Inställningar → fyll i avsändaradress → "Spara"
**Förväntat resultat:** Avsändare sparas, toast "Avsändare uppdaterad"
**Status:** ☐ Ej testad

### TC-12.11: Inställningar-tab — soft-delete med bekräftelse
**Steg:**
1. Öppna event → Inställningar → scroll ner till "Farozon" → "Ta bort event"
2. Bekräfta i dialog
**Förväntat resultat:** Eventet soft-deletas, redirect till översikt, toast "Eventet har tagits bort"
**Status:** ☐ Ej testad

### TC-12.12: Participant med dietary_notes och plus_one (automatiskt test)
**Steg:**
1. Kör `npm run test`
**Förväntat resultat:** 2 nya tester passerar (create participant med dietary/plus_one + RSVP respond med dietary/plus_one)
**Status:** ☑ Testad (session 12, 68 tester totalt)

---

## Session 13a: Saknade features

### TC-13a.1: Klona event
**Steg:**
1. Öppna översikten med minst ett event
2. Klicka kopieringsikonen på ett EventCard
**Förväntat resultat:** Nytt event skapas med namn "(kopia)", status "planning", redirect till det nya eventet, toast-bekräftelse
**Status:** ☐ Ej testad

### TC-13a.2: Klona event (automatiskt test)
**Steg:**
1. Kör `npm run test`
**Förväntat resultat:** Test "POST /api/events/:id/clone clones an event" passerar — verifierar att klonat event har korrekt namn, typ och status
**Status:** ☑ Testad (session 13a)

### TC-13a.3: Unsubscribe-länk i mail
**Steg:**
1. Skapa utskick med RSVP-mottagare → skicka
2. Öppna mailet i mailklienten
**Förväntat resultat:** Footer innehåller "Avregistrera / hantera din anmälan"-länk som pekar till deltagarens RSVP-sida
**Status:** ☐ Ej testad

### TC-13a.4: Skicka testmail
**Steg:**
1. Skapa ett utskick (draft)
2. Klicka testmail-ikonen (kuvert med prick) i utskickslistan
**Förväntat resultat:** Toast "Testmail skickat till [din email]", mail anländer med "[TEST]"-prefix i ämnesraden
**Status:** ☐ Ej testad

### TC-13a.5: Skicka testmail (automatiskt test)
**Steg:**
1. Kör `npm run test`
**Förväntat resultat:** Test "POST /api/events/:id/mailings/:mid/test sends test email" passerar — verifierar sentTo = test@consid.se
**Status:** ☑ Testad (session 13a)

### TC-13a.6: Svarsfrist-UI för väntlistade
**Steg:**
1. Skapa event med max_participants = 1, lägg till 2 deltagare (en attending, en waitlisted)
2. Gå till Deltagare-tab
**Förväntat resultat:** "Svarsfrist"-kolumn visas med datepicker per väntlistad deltagare. Ange datum → toast "Svarsfrist uppdaterad"
**Status:** ☐ Ej testad

### TC-13a.7: Template preview
**Steg:**
1. Öppna `https://mikwik.se/stage/api/templates/save-the-date/preview` (inloggad)
**Förväntat resultat:** Renderad HTML visas med exempeldata (Anna Andersson, Consid Sommarmingel 2026) i Consid-branded mall
**Status:** ☐ Ej testad

### TC-13a.8: Template preview (automatiskt test)
**Steg:**
1. Kör `npm run test`
**Förväntat resultat:** 2 template-preview-tester passerar — save-the-date renderar HTML med exempeldata, nonexistent returnerar 404
**Status:** ☑ Testad (session 13a)

---

## Session 13b: Integrationstester + Deploy

### TC-13b.1: E2E — Event → deltagare → waitlist → promote
**Steg:**
1. Kör `npm run test` — integration.test.ts
**Förväntat resultat:** 2 tester passerar:
- Skapa event (max 2), fyll kapacitet, auto-waitlist 3:e och 4:e, ta bort 1:a → 3:e promoted
- Skapa event (max 1), fyll kapacitet, ändra status till declined → waitlisted promoted
**Status:** ☑ Testad (session 13b)

### TC-13b.2: E2E — Inbjudan → RSVP → bekräftelse
**Steg:**
1. Kör `npm run test` — integration.test.ts
**Förväntat resultat:** 3 tester passerar:
- Fullständigt flöde: invited → RSVP attending med dietary + plus-one → verifierad i admin
- RSVP cancel med auto-promote från väntelista
- RSVP auto-waitlist vid full kapacitet (invited → RSVP → waitlisted)
**Status:** ☑ Testad (session 13b)

### TC-13b.3: E2E — Behörigheter (owner/editor/viewer)
**Steg:**
1. Kör `npm run test` — integration.test.ts
**Förväntat resultat:** 5 tester passerar:
- Owner skapar event, lägger till editor + viewer → 3 permissions
- Editor kan läsa + redigera + lägga till deltagare
- Viewer kan läsa men inte redigera (403)
- Utan behörighet → 403
- Editor kan inte hantera permissions (403)
**Status:** ☑ Testad (session 13b)

### TC-13b.4: E2E — Email-kö + Cron-processning
**Steg:**
1. Kör `npm run test` — integration.test.ts
**Förväntat resultat:** 2 tester passerar:
- >5 mottagare → köas → processQueue() skickar 6 → verifierad i DB
- ≤5 mottagare → skickas direkt (ingen kö)
**Status:** ☑ Testad (session 13b)

### TC-13b.5: E2E — Klona event
**Steg:**
1. Kör `npm run test` — integration.test.ts
**Förväntat resultat:** 2 tester passerar:
- Klona event med deltagare → kopia har korrekt data, 0 deltagare
- Klonat event har skaparen som owner
**Status:** ☑ Testad (session 13b)

---

## Session 14: GrapeJS mailredigerare

### TC-14.1: Valet "Visuell editor" vs "Snabbredigering"
**Förutsättning:** Inloggad, på eventets Utskick-tab
**Steg:**
1. Klicka "+ Nytt utskick"
2. Modalen visar mallväljare och två redigeringslägen
3. Klicka "Visuell editor"
**Förväntat resultat:** Helskärmseditor (GrapeJS) öppnas med Consid-brandad email-mall (burgundy header, beige bakgrund)
**Status:** ☐ Ej testad

### TC-14.2: Valet "Snabbredigering" (befintligt flöde)
**Förutsättning:** Inloggad, på eventets Utskick-tab
**Steg:**
1. Klicka "+ Nytt utskick"
2. Klicka "Snabbredigering"
**Förväntat resultat:** Formulär med ämne, brödtext och mottagarfilter visas (samma som tidigare)
**Status:** ☐ Ej testad

### TC-14.3: GrapeJS — drag-and-drop block
**Förutsättning:** Visuell editor öppen
**Steg:**
1. Dra "Text"-blocket från blockpanelen till canvas
2. Dra "CTA-knapp" till canvas
3. Dra "Bild" till canvas
4. Dra "Avdelare" till canvas
**Förväntat resultat:** Alla block placeras korrekt i canvas. CTA-knappen har Raspberry Red bakgrund, vit text.
**Status:** ☐ Ej testad

### TC-14.4: GrapeJS — begränsad färgpalett
**Förutsättning:** Visuell editor öppen, textblock markerat
**Steg:**
1. Markera textblocket
2. Öppna färgväljaren i style manager
**Förväntat resultat:** Bara Consid-färger visas: #701131, #B5223F, #F49E88, #EFE6DD, #1C1C1C, #492A34, #A99B94, #EC6B6A, #FFFFFF
**Status:** ☐ Ej testad

### TC-14.5: GrapeJS — bilduppladdning till R2
**Förutsättning:** Visuell editor öppen, bildblock tillagt
**Steg:**
1. Dubbelklicka på bildblocket
2. Asset Manager öppnas
3. Ladda upp en JPEG-bild (< 5 MB)
**Förväntat resultat:** Bilden laddas upp till R2, visas i asset manager, infogas i blocket
**Status:** ☐ Ej testad

### TC-14.6: GrapeJS — preview desktop/mobil
**Förutsättning:** Visuell editor öppen med innehåll
**Steg:**
1. Klicka mobil-ikonen i toolbar
2. Klicka desktop-ikonen i toolbar
**Förväntat resultat:** Canvas ändrar bredd till 375px (mobil) resp 100% (desktop)
**Status:** ☐ Ej testad

### TC-14.7: GrapeJS — spara mail
**Förutsättning:** Visuell editor öppen med redigerat innehåll, ämne ifyllt
**Steg:**
1. Fyll i ämne i topbar
2. Klicka "Spara mail"
**Förväntat resultat:** Utskick skapas med html_body (inline-CSS via juice) + editor_data (GrapeJS JSON). Visas i utskickslistan.
**Status:** ☐ Ej testad

### TC-14.8: Mailings med html_body — korrekt sändning
**Förutsättning:** Utskick skapat via visuell editor
**Steg:**
1. Skicka utskicket
**Förväntat resultat:** Mailet skickas med den visuella editorns HTML (inte auto-genererad). Merge fields ({{name}}, {{rsvp_link}}) ersätts korrekt.
**Status:** ☐ Ej testad

---

## Session 15: Eventwebbplats

### TC-15.1: Webbplatspanel i Inställningar
**Förutsättning:** Inloggad, på eventets Inställningar-tab
**Steg:**
1. Scrolla ner till "Webbplats"-sektionen
2. Välj template "Hero + Info"
3. Fyll i hero-rubrik
4. Klicka "Spara webbplats"
**Förväntat resultat:** Toast "Webbplats sparad" visas. Konfigurationen sparas.
**Status:** ☐ Ej testad

### TC-15.2: Publicera webbplats
**Förutsättning:** Inloggad, webbplats sparad med template
**Steg:**
1. Klicka "Publicera"
2. Publik webbadress visas
3. Klicka på URL:en
**Förväntat resultat:** Publik eventwebbsida öppnas i ny flik med hero-sektion, eventinfo och anmälningsformulär. Consid-branding (Burgundy #701131, Beige #EFE6DD, Raspberry Red #B5223F CTA).
**Status:** ☐ Ej testad

### TC-15.3: Publik eventwebbsida — Hero + Info
**Förutsättning:** Publicerad webbplats med Hero + Info template
**Steg:**
1. Öppna `/stage/e/:slug` i en annan webbläsare (ej inloggad)
**Förväntat resultat:** Hero-sektion med bild (om uppladdad) eller burgundy bakgrund, eventnamn, datum, tid, plats, arrangör, beskrivning. Anmälningsformulär med namn, email, företag, kategori, GDPR-samtycke.
**Status:** ☐ Ej testad

### TC-15.4: Publik eventwebbsida — Hero + Program + Plats
**Förutsättning:** Publicerad webbplats med Hero + Program + Plats template, programpunkter och platsinfo ifylld
**Steg:**
1. Öppna `/stage/e/:slug`
**Förväntat resultat:** Utöver Hero + Info visas: programsektion med tidslinje (tidpunkter + aktiviteter), platssektion med beskrivning och adress.
**Status:** ☐ Ej testad

### TC-15.5: Anmälan via webbplats
**Förutsättning:** Publicerad webbplats
**Steg:**
1. Öppna publik webbsida
2. Fyll i namn, email, bocka GDPR-samtycke
3. Klicka "Anmäl mig"
**Förväntat resultat:** Bekräftelsesida visas med "Tack för din anmälan!" och "Lägg till i kalender"-knapp. Deltagaren syns i admin-vyn med status "attending".
**Status:** ☐ Ej testad

### TC-15.6: Dubbel anmälan avvisas
**Förutsättning:** Redan anmäld via webbplats
**Steg:**
1. Försök anmäla med samma email igen
**Förväntat resultat:** Felmeddelande "Du är redan anmäld till detta event".
**Status:** ☐ Ej testad

### TC-15.7: Auto-waitlist vid full kapacitet
**Förutsättning:** Event med max_participants = 1, 1 befintlig deltagare
**Steg:**
1. Anmäl ny deltagare via webbplats
**Förväntat resultat:** Bekräftelsesida visar "Du står på väntelistan" med ⏳-ikon.
**Status:** ☐ Ej testad

### TC-15.8: Ej publicerad webbplats ger 404
**Förutsättning:** Event med webbplats EJ publicerad
**Steg:**
1. Öppna `/stage/e/:slug`
**Förväntat resultat:** Sidan visar "Sidan hittades inte" med felmeddelande.
**Status:** ☐ Ej testad

### TC-15.9: Kalenderknapp efter anmälan
**Förutsättning:** Framgångsrik anmälan via webbplats
**Steg:**
1. Klicka "Lägg till i kalender" på bekräftelsesidan
**Förväntat resultat:** ICS-fil laddas ner med korrekt eventdata (namn, datum, tid, plats).
**Status:** ☐ Ej testad

### TC-15.10: Responsiv design
**Förutsättning:** Publicerad webbplats
**Steg:**
1. Öppna publik webbsida på mobil (eller Chrome DevTools mobile view)
**Förväntat resultat:** Sidan anpassar sig — hero-text, inforutor och formulär stack vertikalt. Inga horisontella scrollbar.
**Status:** ☐ Ej testad

---

## Bugfixar: Utskick mall → editor → spara

### TC-BF.1: Mall-klick → direkt till snabbredigering
**Förutsättning:** Inloggad, på eventets Utskick-tab
**Steg:**
1. Klicka "+ Nytt utskick"
2. Klicka på en mall (t.ex. "Save the Date")
**Förväntat resultat:** Formuläret (snabbredigering) öppnas direkt med förfyllt ämne och brödtext från mallen. Användaren behöver inte klicka "Snabbredigering" separat.
**Status:** ☑ Testad (bugfix 2026-02-23)

### TC-BF.2: Mall → redigera → skapa utkast
**Förutsättning:** Inloggad, på eventets Utskick-tab
**Steg:**
1. Klicka "+ Nytt utskick"
2. Klicka på "Save the Date"-mallen
3. Redigera ämne eller brödtext valfritt
4. Klicka "Skapa utkast"
**Förväntat resultat:** Utskick skapas och syns i utskickslistan med status "Utkast". Toast "Utskick skapat" visas.
**Status:** ☑ Testad (bugfix 2026-02-23)

### TC-BF.3: Visuell editor — spara mail fungerar
**Förutsättning:** Inloggad, på eventets Utskick-tab
**Steg:**
1. Klicka "+ Nytt utskick"
2. Klicka "Visuell editor"
3. Fyll i ämne i topbar
4. Redigera innehåll (dra in block, lägg till bild etc.)
5. Klicka "Spara mail"
**Förväntat resultat:** Utskick skapas. Toast "Utskick skapat med visuell editor" visas. Editorn stängs.
**Status:** ☑ Testad (bugfix 2026-02-23)

### TC-BF.4: Visuell editor — spara utan ämne visar felmeddelande
**Förutsättning:** Inloggad, visuell editor öppen
**Steg:**
1. Lämna ämnesfältet i topbar tomt
2. Klicka "Spara mail"
**Förväntat resultat:** Toast-felmeddelande "Ange ett ämne innan du sparar" visas. Editorn förblir öppen. Inget utskick skapas.
**Status:** ☑ Testad (bugfix 2026-02-23)

### TC-BF.5: Toast-meddelanden synliga ovanpå fullscreen-editor
**Förutsättning:** Visuell editor öppen (fullskärm)
**Steg:**
1. Utför en åtgärd som triggar toast (t.ex. spara utan ämne)
**Förväntat resultat:** Toast-notis visas synligt ovanpå editorn (z-index 9999 > editorns 2000).
**Status:** ☑ Testad (bugfix 2026-02-23)

---

## Session 16: GrapeJS webbplatsredigerare

### TC-16.1: "Visuell editor"-knapp i WebsitePanel
**Förutsättning:** Inloggad, på eventets Inställningar-tab → Webbplats
**Steg:**
1. Välj en mall (Hero + Info eller Hero + Program + Plats)
2. "Visuell editor"-kortet visas med "Öppna editor"-knapp
3. Klicka "Öppna editor"
**Förväntat resultat:** GrapeJS-editor öppnas i fullskärm med förpopulerat innehåll baserat på vald mall och eventdata (hero med eventnamn, infokort med datum/tid/plats/arrangör, anmälningsformulär-platshållare, footer).
**Status:** ☐ Ej testad

### TC-16.2: GrapeJS webbsideblock — drag-and-drop
**Förutsättning:** Visuell webbsideeditor öppen
**Steg:**
1. Dra "Hero"-blocket från blockpanelen till canvas
2. Dra "Eventinfo"-blocket till canvas
3. Dra "Program"-blocket till canvas
4. Dra "Plats"-blocket till canvas
5. Dra "Anmälan"-blocket till canvas
6. Dra "Footer"-blocket till canvas
**Förväntat resultat:** Alla block placeras korrekt. Hero har burgundy bakgrund (#701131), CTA-knappar har Raspberry Red (#B5223F), beige bakgrund (#EFE6DD).
**Status:** ☐ Ej testad

### TC-16.3: GrapeJS — spara webbsida
**Förutsättning:** Visuell webbsideeditor öppen med redigerat innehåll
**Steg:**
1. Redigera text och block
2. Klicka "Spara webbsida"
**Förväntat resultat:** Toast "Webbsida sparad". Editorn stängs. WebsitePanel visar "Anpassad sida"-badge.
**Status:** ☐ Ej testad

### TC-16.4: Publik sida renderar custom page_html
**Förutsättning:** Event med sparad page_html och publicerad webbplats
**Steg:**
1. Öppna `/stage/e/:slug` i en annan webbläsare (ej inloggad)
**Förväntat resultat:** Sidan renderar GrapeJS-genererad HTML (ej template-baserad). Layout, färger och typsnitt matchar det som skapades i editorn.
**Status:** ☐ Ej testad

### TC-16.5: Anmälningsformulär fungerar i custom page
**Förutsättning:** Publicerad webbplats med custom page_html som innehåller anmälningsblock
**Steg:**
1. Öppna publik sida
2. Fyll i namn, email, bocka GDPR-samtycke
3. Klicka "Anmäl mig"
**Förväntat resultat:** Bekräftelsesida visas. Deltagaren registreras i backend (POST /:slug/register).
**Status:** ☐ Ej testad

### TC-16.6: Återredigera sparad webbsida
**Förutsättning:** Event med sparad page_html + page_editor_data
**Steg:**
1. Öppna Inställningar → Webbplats
2. Klicka "Redigera sida" (ersätter "Öppna editor" för befintlig sida)
**Förväntat resultat:** GrapeJS öppnas med allt befintligt innehåll laddat (via editor_data JSON).
**Status:** ☐ Ej testad

### TC-16.7: Återställ till mall
**Förutsättning:** Event med sparad custom page_html
**Steg:**
1. Öppna Inställningar → Webbplats
2. Klicka "Återställ till mall"
**Förväntat resultat:** Toast "Återställd till mallbaserad sida". "Anpassad sida"-badge försvinner. Publik sida renderar template-baserad layout igen.
**Status:** ☐ Ej testad

### TC-16.8: Snabbredigering behålls vid custom page
**Förutsättning:** Event med sparad custom page_html
**Steg:**
1. Öppna Inställningar → Webbplats
2. Ändra hero-rubrik i snabbredigeringen → "Spara webbplats"
**Förväntat resultat:** Info-notis visas: "Snabbredigering påverkar bara mallbaserad rendering. Använd visuella editorn för att ändra den anpassade sidan."
**Status:** ☐ Ej testad

### TC-16.9: Desktop/mobil preview i webbsideeditor
**Förutsättning:** Visuell webbsideeditor öppen med innehåll
**Steg:**
1. Klicka mobil-ikonen i toolbar
2. Klicka desktop-ikonen
**Förväntat resultat:** Canvas ändrar bredd till 375px (mobil) resp 100% (desktop).
**Status:** ☐ Ej testad

### TC-16.10: Bilduppladdning i webbsideeditor
**Förutsättning:** Visuell webbsideeditor öppen, bildblock tillagt
**Steg:**
1. Dubbelklicka på bildblocket
2. Ladda upp en JPEG-bild (< 5 MB)
**Förväntat resultat:** Bilden laddas upp till R2 och visas i blocket.
**Status:** ☐ Ej testad
