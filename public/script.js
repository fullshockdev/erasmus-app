// PRVKY NA WEBU
const tlacitko = document.getElementById("tlacitkoHledat");
const doporucit = document.getElementById("tlacitkoDoporucit");
const policko = document.getElementById("polickoMesto");
const vysledekDiv = document.getElementById("vysledek");

// VYHLEDAT
tlacitko.addEventListener("click", async () => {
  try {
    // NAZEV MESTA Z polickoMesto
    const mesto = policko.value;

    if (!mesto) {
      vysledekDiv.innerHTML = `<h3 style="color: #CF6679;"> Nebyl zadán název města</h3>`;
      return;
    }

    // DOTAZ NA BACKEND
    const odpoved = await fetch(`/api/erasmus-destinace/${mesto}`);
    const data = await odpoved.json();

    if (data.chyba) {
      vysledekDiv.innerHTML = `<h3 style="color: #CF6679;"> ${data.chyba}</h3>`;
      return;
    }

    // VYKRESELNI VYSLEDKU NA WEB
    vysledekDiv.innerHTML = `
      <h2>${data.hledaneMesto}, ${data.nazev}</h2>
      
      <!-- Kontejner, který drží vlajku a čas vedle sebe -->
      <div class="vlajka-cas-box">
        <img src="${data.vlajka}" alt="Vlajka" width="150" style="border: 1px solid black; border-radius: 5px;">
        <div class="hodiny-box">Aktuální čas<br><strong>${data.aktualniCas}</strong></div>
      </div>
      
      <h3> Počasí</h3>
      <p>
       <b>Aktuálně:</b> ${data.teplota} (${data.popisPocasi})
       <img src="https://openweathermap.org/img/wn/${data.ikonaPocasi}.png" alt="Ikona počasí" style="vertical-align: middle;">   
      </p>
      <p><b>Východ / Západ slunce:</b> ${data.vychod} | ${data.zapad}</p>
      <p><b>Pocitová teplota:</b> ${data.PocitovaTeplota}</p>
      <p><b>Dnešní minimum / maximum:</b> ${data.nejnizzsiTeplota} / ${data.NejvyssiTeplota}</p>
      <p><b>Vítr:</b> ${data.rychlostVetru} | <b>Tlak:</b> ${data.tlak}</p>
      <p><b>Viditelnost:</b> ${data.viditelnost} km</p>

      <h3> Informace o státu</h3>
      <p><b>Kontinent:</b> ${data.kontinent}</p>
      <p><b>Hlavní město:</b> ${data.hlavniMesto}</p>
      <p><b>Jazyk:</b> ${data.jazyk}</p>
      <p><b>Populace:</b> ${data.populace}</p>
      <p><b>Časové pásmo:</b> ${data.casovePasmo}</p>
      <p><b>Řízení:</b> Jezdí se ${data.stranaRizeni}</p>

      <h3> Kurzy a měna</h3>
      <p><b>Místní měna:</b> ${data.mena}</p>
      <p><b>Aktuální kurz:</b> 1 místní měna = ${data.zaCiziMenu}</p>
      <p><b>Převod:</b> 1000 Kč = <b>${data.zaTisicKorun}</b></p>
    `;
  } catch (chyba) {
    vysledekDiv.innerHTML = `<h3 style="color: #CF6679;"> Chyba stahování dat.</h3>`;
  }
});

/// DOPORUCIT NAHODNE MESTO
doporucit.addEventListener("click", async () => {
  vysledekDiv.innerHTML = `<h3 style="color: #03DAC6;"> Losuji město</h3>`;
  const odpoved = await fetch("/api/doporucit");
  const data = await odpoved.json();
  policko.value = data.nahodneVybraneMesto;
  tlacitko.click();
});

// NOUISLIDER
const sliderTeplota = document.getElementById("sliderTeplota");
const textTeplota = document.getElementById("hodnotaTeplota");

const sliderPopulace = document.getElementById("sliderPopulace");
const textPopulace = document.getElementById("hodnotaPopulace");

// TEPLOTA SLIDER
if (sliderTeplota) {
  noUiSlider.create(sliderTeplota, {
    start: [10, 30],
    connect: true,
    range: {
      min: -20,
      max: 45,
    },
    step: 0.2, // Krok po 0.2
  });

  // TEPLOTA DES. MISTO
  sliderTeplota.noUiSlider.on("update", function (values) {
    textTeplota.innerText =
      Number(values[0]).toFixed(1) +
      " °C až " +
      Number(values[1]).toFixed(1) +
      " °C";
  });
}

// POPULACE SLIDER
if (sliderPopulace) {
  noUiSlider.create(sliderPopulace, {
    start: [0.2, 30],
    connect: true,
    range: {
      min: 0,
      max: 350,
    },
    step: 0.2, // Krok po 0.2
  });

  // POPULACE DES. MISTO
  sliderPopulace.noUiSlider.on("update", function (values) {
    textPopulace.innerText =
      Number(values[0]).toFixed(1) +
      " až " +
      Number(values[1]).toFixed(1) +
      " mil.";
  });
}

// FILTRY UZIVATELE
const tlacitkoFiltry = document.getElementById("tlacitkoAplikovatFiltry");
const filtrJazyk = document.getElementById("filtrJazyk");

tlacitkoFiltry.addEventListener("click", async () => {
  try {
    const zvolenyJazyk = filtrJazyk.value;
    const hodnotyTeploty = sliderTeplota.noUiSlider.get();
    const hodnotyPopulace = sliderPopulace.noUiSlider.get();

    vysledekDiv.innerHTML = `<h3 style="color: #03DAC6;"> Filtr se aplikuje</h3>`;

    const url = `/api/filtr?jazyk=${zvolenyJazyk}&minTeplota=${hodnotyTeploty[0]}&maxTeplota=${hodnotyTeploty[1]}&minPopulace=${hodnotyPopulace[0]}&maxPopulace=${hodnotyPopulace[1]}`;

    const odpoved = await fetch(url);
    const data = await odpoved.json();

    if (data.chyba) {
      vysledekDiv.innerHTML = `<h3 style="color: #CF6679;"> ${data.chyba}</h3>`;
      return;
    }

    policko.value = data.filtrMesto;
    tlacitko.click();
  } catch (chyba) {
    console.error(chyba);
    vysledekDiv.innerHTML = `<h3 style="color: #CF6679;"> Nastala chyba při filtrování</h3>`;
  }
});
