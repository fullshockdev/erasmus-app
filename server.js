require("dotenv").config();
const express = require("express");
const app = express();
app.use(express.static("public"));

// ULOZENE STATY MISTO API
const dataStatu = require("./staty.json");
///

// CACHE PRO EXCHANGERATE API
let kurzCacheData = null;
let kurzCacheDatum = null;

async function ziskejKurz(apiKlic) {
  const dnesniDatum = new Date().toISOString().split("T")[0];

  if (kurzCacheData && kurzCacheDatum === dnesniDatum) {
    console.log("3: nacteni cache");
    return kurzCacheData;
  }

  console.log("3: stazeni novych kurzu z ExchangeRate API");
  const urlKurzy = `https://v6.exchangerate-api.com/v6/${apiKlic}/latest/CZK`;
  const odpovedKurzy = await fetch(urlKurzy);
  const kurz = await odpovedKurzy.json();

  if (kurz.result === "success") {
    kurzCacheData = kurz.conversion_rates;
    kurzCacheDatum = dnesniDatum;
  }
  return kurzCacheData;
}

app.get("/api/debug-kurzy", (req, res) => {
  res.json({
    datum: kurzCacheDatum,
    data: kurzCacheData,
  });
});

///

const slovnikKontinentu = {
  Europe: "Evropa",
  "North America": "Severní Amerika",
  "South America": "Jižní Amerika",
  Asia: "Asie",
  Africa: "Afrika",
  Oceania: "Oceánie",
  Antarctica: "Antarktida",
};

const slovnikRizeni = {
  right: "vpravo",
  left: "vlevo",
};

app.get("/api/erasmus-destinace/:mesto", async (req, res) => {
  const hledaneMesto = req.params.mesto;
  try {
    ///OPENWEATHER API, ZISKANI POCASI
    console.log("1: stazeni pocasi");
    const API_KLIC_POCASI = process.env.API_KLIC_POCASI;
    const urlPocasi = `https://api.openweathermap.org/data/2.5/weather?q=${hledaneMesto}&appid=${API_KLIC_POCASI}&units=metric&lang=cz`;
    const odpovedPocasi = await fetch(urlPocasi);
    const pocasi = await odpovedPocasi.json();

    if (pocasi.cod == "404") {
      return res.json({ chyba: "mesto neexistuje" });
    }

    /// POCASI - UPRAVY
    const kodStatu = pocasi.sys.country; /// KOD STATU PRO ENDPOINT
    const jmenoMesta =
      hledaneMesto.charAt(0).toUpperCase() + hledaneMesto.slice(1);
    const tlak = pocasi.main.pressure;
    const viditelnost = pocasi.visibility / 1000;
    const teplota = pocasi.main.temp;
    const PocitovaTeplota = pocasi.main.feels_like;
    const NejvyssiTeplota = pocasi.main.temp_max;
    const nejnizzsiTeplota = pocasi.main.temp_min;
    const rychlostVetru = pocasi.wind.speed;
    const popisPocasi = pocasi.weather[0].description;
    const ikonaPocasi = pocasi.weather[0].icon;
    // CAS - VYCHOD, ZAPAD
    const formatujCas = (timestamp, timezoneSec) => {
      return new Date((timestamp + timezoneSec) * 1000).toLocaleTimeString(
        "cs-CZ",
        {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "UTC",
        },
      );
    };
    const aktualniCasMesto = formatujCas(Date.now() / 1000, pocasi.timezone);
    const vychodSlunce = formatujCas(pocasi.sys.sunrise, pocasi.timezone);
    const zapadSlunce = formatujCas(pocasi.sys.sunset, pocasi.timezone);
    ///

    /// ZISKANI STATU Z LOKALNIHO SOUBORU (MISTO RESTCOUNTRIES API)
    console.log(`2: nacteni statu ze souboru: ${kodStatu}`);
    const stat = dataStatu.find((s) => s.codes.alpha_2 === kodStatu);
    ///

    /// PREKLAD
    const anglickyKontinent = stat.continents[0];
    const anglickeRizeni = stat.cars.driving_side;

    const ceskyKontinent =
      slovnikKontinentu[anglickyKontinent] || anglickyKontinent;
    const ceskeRizeni = slovnikRizeni[anglickeRizeni] || anglickeRizeni;
    ///

    /// STAT - UPRAVY
    const menaStatu = stat.currencies
      .map((mena) => {
        return mena.name + " - " + mena.symbol + " " + mena.code;
      })
      .join(", ");
    const nazev = stat.names.translations.ces.common;
    const hlavniMesto = stat.capitals[0].name;
    const populaceStatu = stat.population.toLocaleString("cs-CZ");
    const vlajkaStatu = stat.flag.url_svg;
    const casovePasmo = stat.timezones.join(", ");
    const nativniJazyk = stat.languages
      .map((jazyk) => jazyk.native_name)
      .join(", ");
    const origoJazyk = stat.languages.map((jazyk) => jazyk.name).join(", ");
    const menaStatuSymbol = stat.currencies[0].symbol;
    const menaStatuKod = stat.currencies[0].code; /// KOD MENY PRO SPAROVANI S EXCHANGERATE API
    ///
    console.log(origoJazyk);

    /// EXCHANGERATE API, ZISKANI MEN S CACHOVÁNÍM
    const API_KLIC_KURZY = process.env.API_KLIC_KURZY;
    const vsechnyKurzy = await ziskejKurz(API_KLIC_KURZY);

    const kurzZaKorunu = vsechnyKurzy ? vsechnyKurzy[menaStatuKod] : 1;
    const zaTisicKorun = (1000 * kurzZaKorunu).toFixed(2);
    const zaCiziMenu = kurzZaKorunu ? (1 / kurzZaKorunu).toFixed(2) : 0;
    ///

    const frontendData = {
      /// POCASI
      hledaneMesto: jmenoMesta,
      aktualniCas: aktualniCasMesto,
      teplota: `${teplota}°C`,
      PocitovaTeplota: `${PocitovaTeplota}°C`,
      NejvyssiTeplota: `${NejvyssiTeplota}°C`,
      nejnizzsiTeplota: `${nejnizzsiTeplota}°C`,
      rychlostVetru: `${rychlostVetru}km/h`,
      tlak: `${tlak}hPa`,
      viditelnost: viditelnost,
      vychod: vychodSlunce,
      zapad: zapadSlunce,
      popisPocasi: popisPocasi,
      ikonaPocasi: ikonaPocasi,
      ///
      /// STATY
      nazev: nazev,
      populace: populaceStatu,
      hlavniMesto: hlavniMesto,
      vlajka: vlajkaStatu,
      casovePasmo: casovePasmo,
      kontinent: ceskyKontinent,
      jazyk: nativniJazyk,
      mena: menaStatu,
      stranaRizeni: ceskeRizeni,
      ///
      /// KURZY
      kurzZaKorunu: `${kurzZaKorunu} CZK`,
      zaCiziMenu: `${zaCiziMenu} CZK`,
      zaTisicKorun: `${zaTisicKorun} ${menaStatuSymbol}`,
      ///
    };

    console.log("4: stazeno");

    res.json(frontendData);
  } catch (chyba) {
    console.log("nastala chyba: ", chyba);
    res.json({ chyba: "nastala chyba" });
  }
});

/// DOPORUCIT NAHODNE MESTO
app.get("/api/doporucit", async (req, res) => {
  try {
    let vsechnyStaty = [];

    // POUZITI STATY MISTO API
    const seznamStatu = dataStatu;

    seznamStatu.forEach((stat) => {
      if (stat.capitals) {
        stat.capitals.forEach((capitals) => {
          vsechnyStaty.push(capitals.name);
        });
      }
    });

    const nahodneMesto =
      vsechnyStaty[Math.floor(Math.random() * vsechnyStaty.length)];
    res.json({ nahodneVybraneMesto: nahodneMesto });
  } catch (chyba) {
    console.log("nastala chyba", chyba);
    res.json({ chyba: "nastala chyba" });
  }
});
///

app.get("/api/filtr", async (req, res) => {
  try {
    const zvolenyJazyk = req.query.jazyk;

    // HODNOTY Z FILTRU
    const minTeplota = parseFloat(req.query.minTeplota);
    const maxTeplota = parseFloat(req.query.maxTeplota);
    const minPopulace = parseFloat(req.query.minPopulace) * 1000000;
    const maxPopulace = parseFloat(req.query.maxPopulace) * 1000000;

    const seznamStatu = [...dataStatu];
    seznamStatu.sort(() => Math.random() - 0.5);

    for (let stat of seznamStatu) {
      let textJazyku = JSON.stringify(stat.languages);

      // 1. DATA V FILTRU
      if (
        stat.population >= minPopulace &&
        stat.population <= maxPopulace &&
        (zvolenyJazyk === "vse" || textJazyku.includes(zvolenyJazyk))
      ) {
        if (stat.capitals && stat.capitals.length > 0) {
          let mesto = stat.capitals[0].name;
          const API_KLIC_POCASI = process.env.API_KLIC_POCASI;

          // 2. POCASI PRO MESTO
          let urlPocasi = `https://api.openweathermap.org/data/2.5/weather?q=${mesto}&appid=${API_KLIC_POCASI}&units=metric`;
          let odpovedPocasi = await fetch(urlPocasi);
          let pocasi = await odpovedPocasi.json();

          // CHYBI V OPWEATHER
          if (pocasi.cod == "404") continue;

          if (pocasi.cod == "429") {
            return res.json({
              chyba: "Moc api pozadavku na pocasi",
            });
          }

          // 3. FILTR TEPLOTY
          if (
            pocasi.main &&
            pocasi.main.temp >= minTeplota &&
            pocasi.main.temp <= maxTeplota
          ) {
            return res.json({ filtrMesto: mesto });
          }
        }
      }
    }

    res.json({ chyba: "Nic neodpovídá filtrům" });
  } catch (chyba) {
    console.log("nastala chyba", chyba);
    res.json({ chyba: "nastala chyba" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server je ready na portu ${PORT}`);
});
