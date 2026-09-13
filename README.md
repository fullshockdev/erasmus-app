# Erasmus App 🌍

Komplexní webová aplikace v Node.js, která umožňuje objevování, výběr a filtrování ideálních destinací. Aplikace kombinuje reálná data o počasí, měnových kurzech a detailní informace o státech, přičemž je optimalizovaná pro bezplatný provoz na cloudu s důrazem na výkon a ochranu soukromí.

---

##  Zdroje dat a technologie
* **OpenWeather API:** Poskytuje živá data o aktuálním počasí, teplotách, větru, tlaku, viditelnosti a časech východu/západu slunce pro vybranou destinaci.
* **ExchangeRate API:** Poskytuje aktuální mezinárodní měnové kurzy vůči české koruně (CZK).
* **REST Countries (lokální `staty.json`):** Původní zdroj dat o státech byl kvůli limitům bezplatného tarifu a požadavkům na spolehlivost stažen a uložen lokálně do souboru `staty.json`. Obsahuje detailní informace o zemích (hlavní města, populace, jazyky, měny, kontinenty, směr řízení, vlajky).
* **Render.com & Cron-job.org:** Hosting zajišťuje platforma Render.com. Aby nedocházelo k uspávání bezplatné instance po 15 minutách nečinnosti, stará se o probouzení externí cron-job služba, která pravidelně pinguje speciální routu bez zkreslování statistik.
* **Umami Analytics:** Moderní analytický nástroj s důrazem na ochranu soukromí a plnou kompatibilitu s GDPR (nesleduje surové IP adresy).

---

## Kód v projektu
* **Vlastní kód uživatele:** Kompletní návrh logiky, soubor `server.js`, struktura `index.html`, vlastní skripty v `script.js`.
* **Práce od AI (gemini.google.com):** Návrh a stylování vizuální stránky (`style.css`), kód pro interaktivní slider a asistence s implementací stahování dat z API (`stahovac.js`).

---

## Architektura a fungování backendu (`server.js`)

### 1. Statické soubory a udržování chodu (Keep-Alive)
* Pomocí `app.use(express.static("public"));` zpřístupňuje server uživatelům veškerý frontendový obsah.
* Obsahuje dedikovanou routu `/ping`, která vrací prosté `OK`. Díky tomu může externí cron-job služba udržovat aplikaci na Renderu probuzenou, aniž by se tento provoz zbytečně propisoval do návštěvnosti v Umami.

### 2. Inteligentní cache pro měnové kurzy
* Funkce `ziskejKurz` stahuje data z ExchangeRate API pouze jednou denně.
* Aktuální kurzy se ukládají do **RAM cache** serveru spolu s datem. Pokud přijde další požadavek ve stejný den, server data vrátí okamžitě z paměti, což šetří API limity a maximalizuje rychlost odezvy.

### 3. Hlavní endpoint destinace (`/api/erasmus-destinace/:mesto`)
* Přijme požadavek na zadané město a stáhne aktuální meteorologická data z OpenWeather API.
* Z kódu státu ("DE, FR, CZ") v datech o počasí (`pocasi.sys.country`) vyhledá odpovídající záznam v lokální databázi `staty.json`.
* Převede anglické názvy kontinentů a směrů řízení na české ekvivalentní pojmy.
* Spáruje kód měny s daty z cache měnových kurzů a přepočítá hodnoty vůči české koruně.
* Vše zabalí do jednotného JSON objektu pro frontend.

### 4. Doporučení a pokročilé filtrování
* **Náhodný výběr (`/api/doporucit`):** Prochází lokální databázi `staty.json`, sesbírá všechna hlavní města a pomocí `Math.random()` vybere náhodnou destinaci.
* **Filtrování (`/api/filtr`):** Umožňuje uživateli filtrovat destinace podle preferovaného jazyka, rozsahu populace a teplotního rozmezí. Náhodně promíchává státy a přes OpenWeather API ověřuje aktuální teplotu ve městech, dokud nenajde vyhovující shodu.

---

##  Konfigurace prostředí (`.env`)
Pro správné fungování aplikace je nutný soubor `.env` s následujícími API klíči:

```env
API_KLIC_POCASI=klic_z_restcountries
API_KLIC_POCASI=klic_z_openwather
API_KLIC_KURZY=klic_z_exchangerate
