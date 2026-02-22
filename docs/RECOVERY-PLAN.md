# Återgångsplan — Stage Session 8

## Kontext
Efter 7 sessioner avvek implementationen kraftigt från den 20-sessions implementationsplan som utarbetades med 7 revisioner. Denna plan dokumenterar rotorsaker, alla avvikelser, och sessionsordningen för att fixa dem.

---

## Del 1: Rotorsaksanalys

### Användarmisstag
1. **Planen refererades aldrig i CLAUDE.md** — AI:n visste inte att den fanns
2. **7 sessioner på 2 dagar utan granskning** — avvikelser upptäcktes sent
3. **Planen var för stor (914 rader)** — för stor att läsas varje session
4. **Ingen arkitektonisk "smoke test"** — kontrollerade aldrig om services/ eller middleware/ användes
5. **Startprompterna saknade scope-avgränsning** — AI:n konsoliderade och förenklad

### Tekniska rotorsaker
1. CLAUDE.md refererade inte implementationsplanen
2. Ingen kompakt sessionguide per session
3. Startprompterna var generiska
4. Ingen arkitektur-gate vid sessionsslut
5. Planen lagrad utanför repot (ej versionshanterad)

---

## Del 2: Avvikelser (alla fixas)

| # | Avvikelse | Fix-session |
|---|-----------|-------------|
| 1 | Ingen service-layer (all logik i routes) | 8 |
| 2 | Ingen Zod-validering | 8 |
| 3 | Ingen error-handler middleware | 8 |
| 4 | Tom middleware/ | 8 |
| 5 | Ingen R2-integration | 9 |
| 6 | Ingen dnd-kit för väntlista | 9 |
| 7 | Email i en fil (196 rader) | 8 |
| 8 | Ingen email-queue/Cron Trigger | 11 |
| 9 | Frontend-mallar istf backend | 11 |
| 10 | EventDetail.tsx = 1727 rader | 9 |
| 11 | Tom features/ mapp | 9 |
| 12 | queries.ts = 654 rader | 8 |
| 13 | Duplicerad validering | 8 |
| 14 | Inga enhetstester för services | 8 |
| 15 | CLAUDE.md matchar inte verkligheten | 8 |
| 16 | Saknar CSV-export endpoint | 9 |

---

## Del 3: Sessionsplan (8-18)

| Session | Innehåll | Fixar avvikelse # |
|---|---|---|
| **8** | Processfixar + Backend-refaktorering | 1,2,3,4,7,12,13,14,15 |
| **9** | Frontend-refaktorering + R2 + dnd-kit + CSV-export | 5,6,10,11,16 |
| **10** | Behörighetssystem + auth | — |
| **11** | Email-förbättringar + Aktivitetslogg + Sök | 8,9 |
| **12** | Inställningar-tab + Polish | — |
| **13** | Integrationstester + Deploy Fas 1 | — |
| **14-18** | Fas 2 (GrapeJS, webbplats, admin) | — |

---

## Del 4: Verifieringschecklista Session 8

- [ ] Alla 27 befintliga tester passerar efter refaktorering
- [ ] Minst 10 nya service-tester
- [ ] Routes < 200 rader vardera
- [ ] Affärslogik i services/
- [ ] Validering via Zod
- [ ] Error-handler middleware registrerad
- [ ] Email i 5 filer under services/email/
- [ ] Queries i 4 filer under db/
- [ ] CLAUDE.md, PROGRESS.md, SESSION-GUIDE.md uppdaterade
