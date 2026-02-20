# Stage — Manuell testplan

> Testfall skrivs per session från användarens perspektiv.
> Format: tydliga steg, URL:er, förväntade resultat.
> Utformat för framtida AI-driven testning.

---

## Session 0: Repo + config + build pipeline

### TC-0.1: Appen startar
**Förutsättning:** `npm install` har körts
**Steg:**
1. Kör `npm run dev` i terminalen
2. Öppna `http://localhost:8787` i webbläsaren
**Förväntat resultat:** Sidan visar rubriken "Stage" och texten "Consid Eventplattform"
**Status:** ☐ Ej testad

### TC-0.2: Health-endpoint
**Förutsättning:** Dev-servern körs
**Steg:**
1. Öppna `http://localhost:8787/api/health` i webbläsaren
**Förväntat resultat:** JSON-svar: `{ "status": "ok", "timestamp": "..." }`
**Status:** ☐ Ej testad

### TC-0.3: TypeScript-kontroll
**Förutsättning:** `npm install` har körts
**Steg:**
1. Kör `npm run typecheck` i terminalen
**Förväntat resultat:** Inga fel — exitkod 0
**Status:** ☐ Ej testad

### TC-0.4: Tester
**Förutsättning:** `npm install` har körts
**Steg:**
1. Kör `npm run test` i terminalen
**Förväntat resultat:** 1 test grön (health endpoint)
**Status:** ☐ Ej testad
