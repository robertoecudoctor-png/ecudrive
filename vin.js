/* Verificare VIN ECU DRIVE: decodare locală (marcă, țară, model și an unde seria le conține sigur) */
(() => {
  // Linkul spre raportul de istoric. După aprobarea în programul de afiliere carVertical, pune aici linkul tău.
  const CV_LINK = 'https://www.carvertical.com/ro';
  const WA = '40773492879';

  // WMI (primele 3 caractere) -> [marcă, țara de fabricație]
  const WMI = {
    WVW: ['Volkswagen', 'Germania'], WVG: ['Volkswagen (SUV)', 'Germania'], WV1: ['Volkswagen Utilitare', 'Germania'], WV2: ['Volkswagen Utilitare', 'Germania'], '3VW': ['Volkswagen', 'Mexic'],
    WAU: ['Audi', 'Germania'], WA1: ['Audi (SUV)', 'Germania'], TRU: ['Audi', 'Ungaria'], WUA: ['Audi Sport', 'Germania'],
    TMB: ['Škoda', 'Cehia'], VSS: ['SEAT / Cupra', 'Spania'],
    WBA: ['BMW', 'Germania'], WBS: ['BMW M', 'Germania'], WBY: ['BMW i', 'Germania'], WMW: ['MINI', 'Marea Britanie'], '5UX': ['BMW (SUV)', 'SUA'],
    WDB: ['Mercedes-Benz', 'Germania'], WDD: ['Mercedes-Benz', 'Germania'], WDC: ['Mercedes-Benz (SUV)', 'Germania'], W1K: ['Mercedes-Benz', 'Germania'], W1N: ['Mercedes-Benz (SUV)', 'Germania'], W1V: ['Mercedes-Benz Vans', 'Germania'], WDF: ['Mercedes-Benz Vans', 'Germania'], WD3: ['Mercedes-Benz Vans', 'Germania'],
    WP0: ['Porsche', 'Germania'], WP1: ['Porsche (SUV)', 'Germania'],
    W0L: ['Opel', 'Germania'], W0V: ['Opel', 'Germania'], WF0: ['Ford', 'Germania'], NM0: ['Ford', 'Turcia'],
    VF1: ['Renault', 'Franța'], UU1: ['Dacia', 'România'], VF3: ['Peugeot', 'Franța'], VR3: ['Peugeot', 'Franța'], VF7: ['Citroën', 'Franța'], VR7: ['Citroën', 'Franța'], VR1: ['DS', 'Franța'],
    VSK: ['Nissan', 'Spania'], SJN: ['Nissan', 'Marea Britanie'], JN1: ['Nissan', 'Japonia'],
    ZFA: ['Fiat', 'Italia'], ZAR: ['Alfa Romeo', 'Italia'], ZCF: ['Iveco', 'Italia'], ZFF: ['Ferrari', 'Italia'],
    YV1: ['Volvo', 'Suedia'], YV4: ['Volvo (SUV)', 'Suedia'], LYV: ['Volvo', 'China'],
    SAL: ['Land Rover', 'Marea Britanie'], SAJ: ['Jaguar', 'Marea Britanie'],
    JTD: ['Toyota', 'Japonia'], JTE: ['Toyota', 'Japonia'], JTN: ['Toyota', 'Japonia'], JTM: ['Toyota', 'Japonia'], JTH: ['Lexus', 'Japonia'], SB1: ['Toyota', 'Marea Britanie'], VNK: ['Toyota', 'Franța'], NMT: ['Toyota', 'Turcia'],
    KMH: ['Hyundai', 'Coreea de Sud'], TMA: ['Hyundai', 'Cehia'], NLH: ['Hyundai', 'Turcia'],
    KNA: ['Kia', 'Coreea de Sud'], KNE: ['Kia', 'Coreea de Sud'], U5Y: ['Kia', 'Slovacia'],
    JMZ: ['Mazda', 'Japonia'], JHM: ['Honda', 'Japonia'], SHH: ['Honda', 'Marea Britanie'],
    JMB: ['Mitsubishi', 'Japonia'], JSA: ['Suzuki', 'Japonia'], TSM: ['Suzuki', 'Ungaria'],
    '5YJ': ['Tesla', 'SUA'], LRW: ['Tesla', 'China'], XP7: ['Tesla', 'Germania'],
  };
  const REGION = { W: 'Germania', V: 'Franța / Spania', T: 'Europa Centrală', U: 'Europa de Est', Z: 'Italia', S: 'Marea Britanie / Europa', Y: 'Suedia / Finlanda', J: 'Japonia', K: 'Coreea de Sud', L: 'China', 1: 'SUA', 4: 'SUA', 5: 'SUA', 3: 'Mexic', 2: 'Canada', 9: 'Brazilia' };

  // Grupul VW: pozițiile 7–8 = codul modelului
  const VAG_WMI = ['WVW', 'WVG', 'WV1', 'WV2', '3VW', 'WAU', 'WA1', 'TRU', 'TMB', 'VSS'];
  const VAG = {
    '1J': 'Golf IV / Bora', '1K': 'Golf V / VI / Jetta', '5K': 'Golf VI', AU: 'Golf VII', '5G': 'Golf VII', CD: 'Golf VIII', '1T': 'Touran', '5T': 'Touran II',
    '6R': 'Polo V', '6C': 'Polo V', AW: 'Polo VI', AA: 'up! / Citigo', A1: 'T-Roc', C1: 'T-Cross', '3B': 'Passat B5', '3C': 'Passat B6 / B7 / CC', '3G': 'Passat B8', '3H': 'Arteon',
    '5N': 'Tiguan', '7L': 'Touareg', '7P': 'Touareg II', CR: 'Touareg III', '7H': 'Transporter T5', '7J': 'Transporter T5', '2K': 'Caddy', '2H': 'Amarok',
    '1U': 'Octavia I', '1Z': 'Octavia II', NE: 'Octavia III', '5E': 'Octavia III', NX: 'Octavia IV', '3U': 'Superb I', '3T': 'Superb II', '3V': 'Superb III', '6Y': 'Fabia I', '5J': 'Fabia II / Roomster', NJ: 'Fabia III', PJ: 'Fabia IV', '5L': 'Yeti', NS: 'Kodiaq', NU: 'Karoq', NW: 'Scala', NH: 'Rapid',
    '1M': 'Leon I / Toledo II', '1P': 'Leon II', '5F': 'Leon III / Ateca', KL: 'Leon IV', '6L': 'Ibiza III', '6J': 'Ibiza IV', KJ: 'Ibiza V / Arona', '5P': 'Altea / Toledo III',
    '8L': 'A3 (8L)', '8P': 'A3 (8P)', '8V': 'A3 (8V)', '8Y': 'A3 (8Y)', '8E': 'A4 B6 / B7', '8K': 'A4 B8', '8W': 'A4 B9', '8T': 'A5', F5: 'A5 II', '4B': 'A6 C5', '4F': 'A6 C6', '4G': 'A6 / A7 C7', '4K': 'A6 / A7 C8', '4H': 'A8 D4', '4N': 'A8 D5',
    '8U': 'Q3', F3: 'Q3 II', '8R': 'Q5', FY: 'Q5 II', '4L': 'Q7', '4M': 'Q7 II / Q8', '8J': 'TT II', FV: 'TT III', '8X': 'A1', GB: 'A1 II',
  };
  // Mercedes: pozițiile 4–6 = seria constructivă
  const MB_WMI = ['WDB', 'WDD', 'WDC', 'W1K', 'W1N', 'W1V', 'WDF', 'WD3'];
  const MB = {
    169: 'Clasa A (W169)', 176: 'Clasa A (W176)', 177: 'Clasa A (W177)', 245: 'Clasa B (W245)', 246: 'Clasa B (W246)', 247: 'Clasa B / GLA / GLB (247)',
    203: 'Clasa C (W203)', 204: 'Clasa C (W204) / GLK', 205: 'Clasa C (W205)', 206: 'Clasa C (W206)', 211: 'Clasa E (W211)', 212: 'Clasa E (W212)', 213: 'Clasa E (W213)', 214: 'Clasa E (W214)',
    221: 'Clasa S (W221)', 222: 'Clasa S (W222)', 223: 'Clasa S (W223)', 117: 'CLA (C117)', 118: 'CLA (C118)', 156: 'GLA (X156)', 164: 'ML (W164)', 166: 'ML / GLE (W166)', 167: 'GLE (V167)',
    253: 'GLC (X253)', 254: 'GLC (X254)', 463: 'Clasa G', 906: 'Sprinter', 907: 'Sprinter', 910: 'Sprinter', 639: 'Vito / Viano', 447: 'Vito / Clasa V',
  };
  // Mărci la care poziția 10 indică sigur anul modelului
  const YEAR_OK = w => VAG_WMI.includes(w) || /^(YV1|YV4|KMH|KNA|KNE|U5Y|TMA|5YJ|LRW|XP7)$/.test(w) || /^[145]/.test(w);
  const YEARS = '123456789ABCDEFGHJKLMNPRSTVWXY';

  const year = (v, wmi) => {
    if (!YEAR_OK(wmi)) return null;
    const i = YEARS.indexOf(v[9]);
    if (i < 0) return null;
    const y = i < 9 ? 2001 + i : (i === 29 ? 2000 : 2010 + (i - 9));
    return y <= new Date().getFullYear() + 1 ? y : null;
  };

  const decode = raw => {
    const v = raw.toUpperCase().replace(/[\s-]/g, '');
    if (v.length !== 17) return { err: `VIN-ul are 17 caractere. Ai introdus ${v.length}.` };
    if (/[IOQ]/.test(v)) return { err: 'VIN-ul nu conține literele I, O sau Q. Verifică dacă nu e cifra 1 sau 0.' };
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(v)) return { err: 'VIN-ul conține doar litere și cifre.' };
    const wmi = v.slice(0, 3);
    const m = WMI[wmi];
    let model = null;
    if (VAG_WMI.includes(wmi)) model = VAG[v.slice(6, 8)] || null;
    if (MB_WMI.includes(wmi)) model = MB[v.slice(3, 6)] || null;
    return { vin: v, make: m ? m[0] : null, country: m ? m[1] : (REGION[v[0]] || null), model, year: year(v, wmi) };
  };

  const $ = (s, el = document) => el.querySelector(s);

  document.querySelectorAll('[data-vin]').forEach(box => {
    const form = $('form', box), input = $('input', box), msg = $('.vin__msg', box), res = $('.vin__res', box);
    const wa = $('[data-vin-wa]', box), cv = $('[data-vin-cv]', box), cvNote = $('.vin__cvnote', box);
    let current = '';
    if (cv) cv.href = CV_LINK;

    const setWa = vin => {
      if (!wa) return;
      const t = vin
        ? `Salut ECU DRIVE! Aș vrea o verificare înainte de cumpărare (km din 3 surse, grosime vopsea, diagnoză). VIN: ${vin}. Mașina se află în: `
        : 'Salut ECU DRIVE! Aș vrea o verificare înainte de cumpărare. Mașina se află în: ';
      wa.href = `https://wa.me/${WA}?text=${encodeURIComponent(t)}`;
    };
    setWa('');

    input.addEventListener('input', () => {
      const p = input.selectionStart;
      input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 17);
      try { input.setSelectionRange(p, p); } catch (_) {}
    });

    form.addEventListener('submit', e => {
      e.preventDefault();
      const r = decode(input.value);
      if (r.err) { msg.textContent = r.err; msg.classList.add('err'); res.hidden = true; input.focus(); return; }
      msg.classList.remove('err');
      current = r.vin;
      const row = (k, val, note) => `<div><dt>${k}</dt><dd>${val || '<span class="vin__na">aflăm la verificare</span>'}${note ? ` <small>${note}</small>` : ''}</dd></div>`;
      res.innerHTML = `<dl>
        ${row('Marcă', r.make)}
        ${row('Model', r.model, r.model ? 'estimat din VIN' : '')}
        ${row('An model', r.year, r.year ? 'estimat din VIN' : '')}
        ${row('Fabricată în', r.country)}
      </dl>
      <p class="vin__hint">Motorizarea, echiparea și istoricul nu se pot citi doar din VIN. Pe ele le afli din raportul de istoric și la verificarea la fața locului.</p>`;
      res.hidden = false;
      msg.textContent = r.make ? `VIN ${r.vin}` : `VIN ${r.vin}: marca nu e în baza noastră rapidă. O identificăm la verificare.`;
      setWa(r.vin);
    });

    // La clic pe raportul de istoric, copiem VIN-ul ca să-l poată lipi direct pe carVertical
    if (cv) cv.addEventListener('click', () => {
      const v = current || input.value.trim();
      if (!v || !navigator.clipboard) return;
      navigator.clipboard.writeText(v).then(() => { if (cvNote) cvNote.textContent = 'VIN copiat. Lipește-l pe carVertical.'; }, () => {});
    });
  });
})();
