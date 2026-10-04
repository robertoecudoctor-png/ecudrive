const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const SVGNS = 'http://www.w3.org/2000/svg';

/* ---------- Nav, meniu mobil, progress ---------- */
const nav = $('#nav'), burger = $('#burger'), menu = $('#menu'), bar = $('#progress');
burger.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  burger.setAttribute('aria-expanded', open);
});
$$('a', menu).forEach(a => a.addEventListener('click', () => {
  menu.classList.remove('open');
  burger.setAttribute('aria-expanded', 'false');
}));
const onScroll = () => {
  const h = document.documentElement;
  bar.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100 + '%';
  nav.classList.toggle('scrolled', h.scrollTop > 20);
};
addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- Reveal la scroll ---------- */
$$('.bento, .plans, .band__in, .why__list, .hero__copy').forEach(group => {
  $$('.reveal', group).forEach((el, i) => el.style.setProperty('--d', i * 0.08 + 's'));
});
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    io.unobserve(e.target);
  });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
$$('.reveal').forEach(el => io.observe(el));

/* ---------- Count-up ---------- */
function countTo(el, to, { dur = 1100, suf = '', pre = '' } = {}) {
  const from = parseFloat(el.dataset.v ?? el.textContent.replace(/[^\d.-]/g, '')) || 0;
  el.dataset.v = to;
  if (reduce) { el.textContent = pre + Math.round(to) + suf; return; }
  const t0 = performance.now();
  cancelAnimationFrame(el._raf);
  const step = t => {
    const p = Math.min((t - t0) / dur, 1), k = 1 - Math.pow(1 - p, 3);
    el.textContent = pre + Math.round(from + (to - from) * k) + suf;
    if (p < 1) el._raf = requestAnimationFrame(step);
  };
  el._raf = requestAnimationFrame(step);
}
const statIO = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    countTo(el, +el.dataset.count, { dur: 1600, suf: el.dataset.suf || '' });
    statIO.unobserve(el);
  });
}, { threshold: 0.5 });
$$('[data-count]').forEach(el => statIO.observe(el));

// Restul (tahometru, dyno, schema, canvas) există doar pe prima pagină
if ($('#tacho')) {

/* ---------- Model motor (exemplu 2.0 diesel) ---------- */
const STAGES = [340, 410, 450, 520]; // cuplu maxim Nm: Stock, Stage 1, 2, 3
const smooth = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
const torqueAt = (rpm, tmax) => {
  let s;
  if (rpm < 1900) s = 0.55 + 0.45 * smooth((rpm - 1000) / 900);
  else if (rpm < 2800) s = 1;
  else s = 1 - 0.52 * smooth((rpm - 2800) / 2200);
  return tmax * s;
};
const hpAt = (rpm, tmax) => torqueAt(rpm, tmax) * rpm / 7022;
const peakHp = tmax => { let m = 0; for (let r = 1000; r <= 5000; r += 50) m = Math.max(m, hpAt(r, tmax)); return Math.round(m); };
const PEAK = STAGES.map(peakHp);

/* ---------- Tahometru ---------- */
const R = 118, CIRC = 2 * Math.PI * R, SWEEP = CIRC * 0.75, HP_MAX = 300;
const arc = $('#arcVal'), needle = $('#needle'), ticks = $('#ticks');
arc.style.strokeDasharray = `0 ${CIRC}`;
$('.arc-track').style.strokeDasharray = `${SWEEP} ${CIRC}`;
for (let i = 0; i <= 30; i++) {
  const a = (-225 + i * 9) * Math.PI / 180, major = i % 5 === 0;
  const r1 = 100, r2 = major ? 88 : 94;
  const l = document.createElementNS(SVGNS, 'line');
  l.setAttribute('x1', 150 + r1 * Math.cos(a)); l.setAttribute('y1', 150 + r1 * Math.sin(a));
  l.setAttribute('x2', 150 + r2 * Math.cos(a)); l.setAttribute('y2', 150 + r2 * Math.sin(a));
  if (major) {
    l.classList.add('major');
    const t = document.createElementNS(SVGNS, 'text');
    t.setAttribute('x', 150 + 74 * Math.cos(a)); t.setAttribute('y', 150 + 74 * Math.sin(a));
    t.textContent = i * 10;
    ticks.appendChild(t);
  }
  ticks.appendChild(l);
}
function setTacho(st) {
  const hp = PEAK[st], nm = STAGES[st], frac = hp / HP_MAX;
  arc.style.strokeDasharray = `${SWEEP * frac} ${CIRC}`;
  needle.style.transform = `rotate(${-135 + 270 * frac}deg)`;
  countTo($('#rHp'), hp);
  countTo($('#rNm'), nm);
  countTo($('#rGain'), Math.round((hp / PEAK[0] - 1) * 100), { pre: '+', suf: '%' });
}
function bindSeg(seg, fn) {
  $$('button', seg).forEach(b => b.addEventListener('click', () => {
    $$('button', seg).forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b); });
    fn(+b.dataset.st);
  }));
}
bindSeg($('#tacho .seg'), st => { autoplay = false; setTacho(st); });
$('#rHp').textContent = PEAK[0];

// Pornire: acul „turează” apoi se rotește prin stage-uri până la primul click
let autoplay = !reduce;
setTimeout(() => {
  needle.style.transform = 'rotate(135deg)';
  arc.style.strokeDasharray = `${SWEEP} ${CIRC}`;
  setTimeout(() => setTacho(0), 700);
}, 500);
let cur = 0;
setInterval(() => {
  if (!autoplay || document.hidden) return;
  cur = (cur + 1) % 4;
  $$('#tacho .seg button').forEach((b, i) => { b.classList.toggle('on', i === cur); b.setAttribute('aria-selected', i === cur); });
  setTacho(cur);
}, 3200);

/* ---------- Dyno ---------- */
const W = 640, H = 320, PL = 44, PR = 44, PT = 16, PB = 34;
const x = rpm => PL + (rpm - 1000) / 4000 * (W - PL - PR);
const yP = hp => H - PB - hp / 300 * (H - PT - PB);
const yT = nm => H - PB - nm / 600 * (H - PT - PB);
const dGrid = $('#dGrid');
const mk = (tag, attrs, text) => {
  const e = document.createElementNS(SVGNS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (text != null) e.textContent = text;
  dGrid.appendChild(e);
};
for (let i = 0; i <= 6; i++) {
  const y = PT + i * (H - PT - PB) / 6;
  mk('line', { x1: PL, x2: W - PR, y1: y, y2: y });
  mk('text', { x: PL - 8, y: y + 3, 'text-anchor': 'end' }, 300 - i * 50);
  mk('text', { x: W - PR + 8, y: y + 3 }, 600 - i * 100);
}
for (let r = 1000; r <= 5000; r += 1000) {
  mk('line', { x1: x(r), x2: x(r), y1: PT, y2: H - PB });
  mk('text', { x: x(r), y: H - 12, 'text-anchor': 'middle' }, r);
}
mk('text', { x: PL - 8, y: PT - 4, 'text-anchor': 'end', fill: '#1e90ff' }, 'CP');
mk('text', { x: W - PR + 8, y: PT - 4, fill: '#78d2ff' }, 'Nm');

const path = (fn, tmax) => {
  let d = '';
  for (let r = 1000; r <= 5000; r += 50) d += (d ? 'L' : 'M') + x(r).toFixed(1) + ' ' + fn(r, tmax).toFixed(1);
  return d;
};
const curveP = t => path((r, m) => yP(hpAt(r, m)), t);
const curveT = t => path((r, m) => yT(torqueAt(r, m)), t);

function drawPath(el, d, dashed) {
  el.setAttribute('d', d);
  const len = el.getTotalLength();
  el.classList.remove('draw');
  if (reduce) return;
  void el.getBoundingClientRect();
  if (dashed) { el.style.opacity = 0; requestAnimationFrame(() => { el.style.transition = 'opacity 1s .6s'; el.style.opacity = 1; }); return; }
  el.style.setProperty('--len', len);
  el.style.strokeDasharray = len;
  el.style.strokeDashoffset = len;
  el.classList.add('draw');
}
$('#dStockP').setAttribute('d', curveP(STAGES[0]));
$('#dStockT').setAttribute('d', curveT(STAGES[0]));
$('#dHp0').textContent = PEAK[0];
$('#dNm0').textContent = STAGES[0];

function setDyno(st) {
  const t = STAGES[st], p = curveP(t);
  drawPath($('#dTunedP'), p);
  drawPath($('#dTunedT'), curveT(t), true);
  const fill = $('#dFill');
  fill.setAttribute('d', p + `L${x(5000)} ${H - PB}L${x(1000)} ${H - PB}Z`);
  fill.classList.remove('show'); void fill.getBoundingClientRect(); fill.classList.add('show');
  countTo($('#dHp1'), PEAK[st]);
  countTo($('#dNm1'), t);
  countTo($('#dGain'), Math.round((PEAK[st] / PEAK[0] - 1) * 100), { pre: '+', suf: '%' });
}
bindSeg($('#dynoSeg'), setDyno);
const dynoIO = new IntersectionObserver(([e]) => {
  if (e.isIntersecting) { setDyno(1); dynoIO.disconnect(); }
}, { threshold: 0.35 });
dynoIO.observe($('#dynoSvg'));

/* ---------- Schema sisteme poluare ---------- */
const INFO = {
  motor:  { tag: 'MOTOR', t: 'Motor și senzori', d: 'Punctul de plecare: datele de la senzori ne spun unde e problema reală.',
            s: ['Pierdere de putere', 'Fum negru sau alb', 'Pornire grea', 'Mod avarie'],
            f: ['Erori și date live', 'Injectoare și debit', 'MAF / MAP', 'Bujii incandescente'] },
  egr:    { tag: 'EGR', t: 'Supapa EGR', d: 'Recirculă o parte din gaze în admisie. Se încarcă des cu calamină.',
            s: ['Ralanti instabil', 'Fum la accelerare', 'Erori de debit EGR', 'Mod avarie'],
            f: ['Funcționare supapă', 'Răcitor EGR', 'Senzori de poziție', 'Curățare / înlocuire'] },
  turbo:  { tag: 'TURBO', t: 'Turbocompresor', d: 'Presiunea de supraalimentare influențează direct puterea și fumul.',
            s: ['Lipsă de tracțiune', 'Fluierat', 'Erori de presiune', 'Fum albastru'],
            f: ['Presiune reală vs. cerută', 'Geometrie variabilă', 'Pierderi pe furtunuri', 'Actuator'] },
  dpf:    { tag: 'DPF', t: 'Filtru de particule', d: 'Reține funinginea și o arde periodic prin regenerare.',
            s: ['Regenerări dese sau eșuate', 'Martor DPF aprins', 'Consum crescut', 'Mod avarie'],
            f: ['Grad de încărcare', 'Senzor presiune diferențială', 'Senzori temperatură', 'Regenerare / curățare'] },
  adblue: { tag: 'ADBLUE', t: 'Sistem AdBlue', d: 'Dozează soluție de uree în evacuare pentru reducerea NOx.',
            s: ['„Pornire blocată în X km”', 'Martor AdBlue', 'Cristalizare', 'Erori de dozare'],
            f: ['Pompă și încălzire', 'Injector AdBlue', 'Calitate fluid', 'Senzor nivel'] },
  scr:    { tag: 'SCR', t: 'Catalizator SCR', d: 'Aici are loc reacția care transformă NOx în azot și apă.',
            s: ['Eficiență SCR scăzută', 'Erori NOx', 'Limitare putere'],
            f: ['Eficiență catalizator', 'Temperaturi', 'Corelare senzori NOx'] },
  nox:    { tag: 'NOX', t: 'Senzori NOx', d: 'Măsoară oxizii de azot înainte și după SCR.',
            s: ['Erori senzor NOx', 'Mesaje AdBlue', 'Valori neplauzibile'],
            f: ['Valori live', 'Alimentare și CAN', 'Testare / înlocuire'] },
};
const panel = $('#panel');
function showNode(k) {
  const i = INFO[k];
  $$('#schema .node').forEach(n => n.classList.toggle('on', n.dataset.k === k));
  $('#pTag').textContent = i.tag;
  $('#pTitle').textContent = i.t;
  $('#pDesc').textContent = i.d;
  $('#pSym').innerHTML = i.s.map(v => `<li>${v}</li>`).join('');
  $('#pFix').innerHTML = i.f.map(v => `<li>${v}</li>`).join('');
  panel.classList.remove('swap'); void panel.offsetWidth; panel.classList.add('swap');
}
$$('#schema .node').forEach(n => {
  n.addEventListener('click', () => showNode(n.dataset.k));
  n.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showNode(n.dataset.k); } });
});
showNode('dpf');

/* ---------- Timeline ---------- */
const tlIO = new IntersectionObserver(([e]) => {
  if (e.isIntersecting) { e.target.classList.add('go'); tlIO.disconnect(); }
}, { threshold: 0.3 });
tlIO.observe($('#timeline'));

/* ---------- Spotlight pe carduri ---------- */
$$('.spot').forEach(c => c.addEventListener('pointermove', e => {
  const r = c.getBoundingClientRect();
  c.style.setProperty('--mx', e.clientX - r.left + 'px');
  c.style.setProperty('--my', e.clientY - r.top + 'px');
}));

/* ---------- Fundal hero: grilă în perspectivă + semnale ---------- */
(() => {
  const cv = $('#bg'), ctx = cv.getContext('2d');
  let w, h, dpr, t = 0, visible = true, mx = 0.5, my = 0.5;
  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = cv.clientWidth; h = cv.clientHeight;
    cv.width = w * dpr; cv.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize(); addEventListener('resize', resize);
  addEventListener('pointermove', e => { mx = e.clientX / innerWidth; my = e.clientY / innerHeight; }, { passive: true });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(cv);

  const frame = () => {
    if (visible) {
      ctx.clearRect(0, 0, w, h);
      const hz = h * 0.58, cx = w * (0.5 + (mx - 0.5) * 0.08);
      // grilă podea
      ctx.lineWidth = 1;
      for (let i = -24; i <= 24; i++) {
        const a = Math.max(0, 0.16 - Math.abs(i) * 0.005);
        ctx.strokeStyle = `rgba(30,144,255,${a})`;
        ctx.beginPath(); ctx.moveTo(cx + i * 6, hz); ctx.lineTo(cx + i * w * 0.12, h); ctx.stroke();
      }
      const off = (t * 0.6) % 1;
      for (let i = 0; i < 16; i++) {
        const p = (i + off) / 16, y = hz + Math.pow(p, 2.2) * (h - hz);
        ctx.strokeStyle = `rgba(30,144,255,${0.02 + p * 0.16})`;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
      // semnale tip osciloscop
      const waves = [
        { y: 0.30, a: 22, f: 0.012, s: 2.2, c: 'rgba(30,144,255,.55)', lw: 2 },
        { y: 0.36, a: 14, f: 0.02, s: -1.6, c: 'rgba(120,210,255,.28)', lw: 1.2 },
        { y: 0.24, a: 10, f: 0.03, s: 3.1, c: 'rgba(0,82,255,.22)', lw: 1 },
      ];
      waves.forEach(wv => {
        ctx.beginPath();
        for (let px = 0; px <= w; px += 4) {
          const env = Math.sin(px / w * Math.PI);
          const yy = h * (wv.y + (my - 0.5) * 0.03) + Math.sin(px * wv.f + t * wv.s) * wv.a * env + Math.sin(px * wv.f * 2.7 - t * wv.s * 0.6) * wv.a * 0.35 * env;
          px ? ctx.lineTo(px, yy) : ctx.moveTo(px, yy);
        }
        ctx.strokeStyle = wv.c; ctx.lineWidth = wv.lw;
        ctx.shadowColor = wv.c; ctx.shadowBlur = 12;
        ctx.stroke(); ctx.shadowBlur = 0;
      });
      t += 0.012;
    }
    if (!reduce) requestAnimationFrame(frame);
  };
  frame();
})();

}

/* ---------- Formular -> WhatsApp ---------- */
const WA_NUMBER = '40773492879'; // înlocuiește cu numărul real, fără +
const form = $('#form'), msg = $('#msg');
if (form) {
$$('[data-service]').forEach(el => el.addEventListener('click', () => {
  const r = form.querySelector(`input[name="serviciu"][value="${el.dataset.service}"]`);
  if (r) r.checked = true;
}));
form.addEventListener('submit', e => {
  e.preventDefault();
  const d = new FormData(form);
  let ok = true;
  ['nume', 'tel', 'masina'].forEach(n => {
    const bad = !String(d.get(n) || '').trim();
    form.elements[n].classList.toggle('err', bad);
    if (bad) ok = false;
  });
  if (!ok) { msg.textContent = 'Completează numele, telefonul și mașina.'; return; }
  const text = `Salut ECU DRIVE!\nNume: ${d.get('nume')}\nTelefon: ${d.get('tel')}\nMașina: ${d.get('masina')}\nServiciu: ${d.get('serviciu')}\nDetalii: ${d.get('detalii') || '-'}`;
  window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  msg.textContent = 'Se deschide WhatsApp cu mesajul pregătit.';
});
}

$('#yr').textContent = new Date().getFullYear();
