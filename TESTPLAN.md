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
**Förväntat resultat:** 27 tester gröna (health, events, participants inkl. CSV-import, mailings/RSVP, waitlist/ICS)
**Status:** ☑ Testad (session 7)

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
