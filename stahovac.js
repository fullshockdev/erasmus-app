/// TENTO KOD BYL BYL VYTVOREN POMOCI AI (gemini.google.com)
///SLOUZI KE STAZENI DAT Z RESTCOUNTRIES API DO staty.json K USETRENI API DODAZU

const fs = require("fs");

async function stahniVsechnov5() {
  let vsechnyStaty = [];

  // SEM VLOŽ SVŮJ API KLÍČ PRO REST COUNTRIES
  const API_KLIC = "////";

  let offset = 0;
  const limit = 25; // API nám jich víc najednou nedovolí
  let stahuji = true;

  console.log("Začínám stahovat všechny státy (pomocí offsetu)...");

  while (stahuji) {
    const url = `https://api.restcountries.com/countries/v5?limit=${limit}&offset=${offset}`;

    try {
      const odpoved = await fetch(url, {
        headers: { Authorization: `Bearer ${API_KLIC}` },
      });
      const data = await odpoved.json();

      // Pokud nám API pošle nějaká data, přidáme je do našeho velkého seznamu
      if (data.data && data.data.objects && data.data.objects.length > 0) {
        vsechnyStaty.push(...data.data.objects);
        console.log(
          `Staženo ${data.data.objects.length} států. Celkem zatím mám: ${vsechnyStaty.length}`,
        );

        // Posuneme se o 25 míst dál pro další kolo
        offset += limit;
      } else {
        // Pokud už API nic neposlalo (jsme na konci), ukončíme stahování
        stahuji = false;
      }
    } catch (chyba) {
      console.log(`Chyba při offsetu ${offset}:`, chyba);
      stahuji = false;
    }
  }

  // Uložíme všechny nasbírané státy do jednoho souboru
  fs.writeFileSync("staty.json", JSON.stringify(vsechnyStaty, null, 2));
  console.log(
    `✅ HOTOVO! Úspěšně uloženo ${vsechnyStaty.length} unikátních států do souboru staty.json`,
  );
}

stahniVsechnov5();
