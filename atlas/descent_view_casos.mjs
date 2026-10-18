// Casos de la vista del descenso (scroll presentation). Node: imprime {ok, casos}; rc=0 solo si
// todos pasan. El caso 8 es humo en vm con DOM falso: A escena real, B IO e identidad, C intros
// duales. Comentarios en espanol; no viaja al navegador.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createContext, runInContext } from 'node:vm';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CSS = join(RAIZ, 'public/assets/descent.css');
const JS = join(RAIZ, 'public/assets/descent_view.js');
const ESCENA = join(RAIZ, 'public/assets/descent_scene.js');
const SOPORTE = ['tabla_semantica.js', 'comic_tokens.js', 'comic_accents.js', 'comic_atoms.js'].map((f) => join(RAIZ, 'public/game', f));
const TECHO = 16384;
const TEXTOS = ['Check the rift', "Create this device's key", 'Skip the story and check the rift'];
const RETIRADO = 'Wake Atlantis';

// Nombres de color prohibidos como valor. 'transparent' no esta: el contrato lo pide como fondo.
const COLORES = 'aqua|black|blue|brown|coral|crimson|cyan|fuchsia|gold|gray|green|grey|indigo|ivory|khaki|lavender|lime|magenta|maroon|navy|olive|orange|orchid|pink|plum|purple|red|salmon|silver|tan|teal|tomato|turquoise|violet|wheat|white|yellow';
const RE_NOMBRE = new RegExp('(?<![\\w-])(?:' + COLORES + ')(?![\\w-])', 'i');
const RE_CADENA = new RegExp('([\'"`])(?:' + COLORES + ')\\1', 'i');
const RE_HEX = /#[0-9a-f]{3,8}(?![\w-])/i;
const RE_FUNC = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color-mix|color)\s*\(/i;
// Prohibidos en codigo (sin comentarios).
const PROHIBIDOS = ['Date', 'Math.random', 'fetch', 'localStorage', 'setTimeout', 'setInterval', 'requestAnimationFrame']
  .map((n) => [n, new RegExp('\\b' + n.replace(/\./g, '\\.') + '\\b')]);

const sinComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"\w])\/\/[^\n]*/gm, '$1');
const leer = (ruta) => {
  if (!existsSync(ruta)) throw new Error('falta ' + ruta.slice(RAIZ.length + 1));
  return readFileSync(ruta, 'utf8');
};
// Lista de carga de la vista en el juego: los /game/ de DESCENSO en thegame.js, en su orden.
const JUEGO = [...(leer(join(RAIZ, 'public/assets/thegame.js')).match(/var DESCENSO = (\[[\s\S]*?\]\]);/)?.[1] ?? '')
  .matchAll(/'\/game\/([^']+)'/g)].map((m) => join(RAIZ, 'public/game', m[1]));

// Hallazgos de la hoja (color, efectos, opacidad, sombras con radio).
function hallazgosCss(css) {
  const t = sinComentarios(css);
  const s = t.replace(/var\(\s*--[\w-]+\s*\)/g, '');
  const h = [];
  if (RE_HEX.test(s)) h.push('hex');
  if (RE_FUNC.test(s)) h.push('funcion de color');
  if (RE_NOMBRE.test(s)) h.push('nombre de color');
  for (const n of ['gradient', 'blur', 'backdrop-filter']) if (new RegExp(n, 'i').test(t)) h.push(n);
  for (const m of s.matchAll(/opacity\s*:\s*([\d.]+)/gi)) if (Number(m[1]) < 1) h.push('opacity ' + m[1]);
  for (const m of s.matchAll(/(?:box|text)-shadow\s*:\s*([^;}]*)/gi)) {
    for (const sombra of m[1].split(',')) {
      const nums = [...sombra.matchAll(/-?\d*\.?\d+/g)].map((x) => Number(x[0]));
      if (nums.slice(2).some((n) => n !== 0)) h.push('sombra con radio');
    }
  }
  return h;
}

function hallazgosJs(js) {
  const t = sinComentarios(js);
  return [RE_HEX.test(t) && 'hex', RE_FUNC.test(t) && 'funcion de color', RE_CADENA.test(t) && 'nombre de color en cadena'].filter(Boolean);
}

// Ultimo valor de prop en las reglas con ese selector.
function valor(css, selector, prop) {
  let v = null;
  for (const m of sinComentarios(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!m[1].split(',').map((s) => s.trim()).includes(selector)) continue;
    for (const d of m[2].split(';')) {
      const i = d.indexOf(':');
      if (i >= 0 && d.slice(0, i).trim() === prop) v = d.slice(i + 1).trim();
    }
  }
  return v;
}
const px = (v) => (v && /^[\d.]+px$/.test(v) ? Number(v.slice(0, -2)) : NaN);

// DOM falso minimo (dos medidas: offsetTop y altura).
const texto = (s) => ({ textContent: String(s), hijos: [] });
class Nodo {
  constructor(tag, v) {
    Object.assign(this, {
      tagName: tag.toUpperCase(), v, hijos: [], attrs: {}, oyentes: {},
      style: { props: {}, setProperty(k, x) { this.props[k] = String(x); } },
    });
  }
  get textContent() { return this.hijos.map((h) => h.textContent).join(''); }
  set textContent(x) { this.hijos = []; if (x !== '') this.appendChild(texto(x)); }
  appendChild(h) { this.hijos.push(h); return h; }
  setAttribute(k, x) { this.attrs[k] = String(x); }
  getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
  addEventListener(t, f) { (this.oyentes[t] ||= []).push(f); }
  click() { (this.oyentes.click || []).slice().forEach((f) => f({ type: 'click' })); }
  getBoundingClientRect() { return { top: this.offsetTop - this.v.scrollY, height: 600 }; }
  // Contexto 2D falso.
  getContext() {
    return this.ctx ||= new Proxy({}, {
      get: (t, k) => (k in t || typeof k === 'symbol' ? t[k] : () => {}),
      set: (t, k, x) => { t[k] = x; return true; },
    });
  }
}

// Ventana falsa, con IntersectionObserver anotado si se pide.
function ventana({ dpr = 1, io = false, identidad = false }) {
  const v = { innerHeight: 800, scrollY: 0, devicePixelRatio: dpr, oyentes: {}, observadores: [], crearLlamadas: 0, Path2D: class {} };
  v.window = v;
  v.addEventListener = (t, f) => { (v.oyentes[t] ||= []).push(f); };
  v.removeEventListener = (t, f) => { v.oyentes[t] = (v.oyentes[t] || []).filter((g) => g !== f); };
  v.document = { createElement: (tag) => new Nodo(tag, v), createTextNode: texto };
  if (io) {
    v.IntersectionObserver = function (cb) { Object.assign(this, { cb, observados: [] }); v.observadores.push(this); };
    Object.assign(v.IntersectionObserver.prototype, { observe(el) { this.observados.push(el); }, disconnect() {} });
  }
  if (identidad) v.Identity = { crear: () => { v.crearLlamadas += 1; return Promise.resolve(); } };
  return v;
}

// Carga los scripts en un vm propio; el paint cuenta pasadas.
function cargaVista(opciones) {
  const v = ventana(opciones);
  createContext(v);
  const correr = (ruta) => {
    try { return runInContext(readFileSync(ruta, 'utf8'), v, { filename: ruta }); }
    catch (e) { throw new Error(ruta.split('/').pop() + ': ' + e.message); }
  };
  (opciones.escena ? SOPORTE : JUEGO).forEach(correr);
  if (opciones.escena) v.AtlasDescentScene = opciones.escena; else correr(ESCENA);
  const pinturas = [];
  const atomos = v.AtlasComicAtoms;
  v.AtlasComicAtoms = { paint: (ctx, items) => { pinturas.push(JSON.stringify(items)); return atomos.paint(ctx, items); } };
  correr(JS);
  return { v, pinturas };
}

// Busquedas en el arbol.
const todos = (n) => (n ? [n, ...n.hijos.flatMap((h) => todos(h))] : []);
const conClase = (n, c) => todos(n).filter((x) => x.className === c);
const etiqueta = (n, tag) => todos(n).filter((x) => x.tagName === tag);
const dentroDe = (a, n) => todos(a).includes(n);

const casos = [];
function caso(n, nombre, prueba) {
  let r;
  try {
    r = prueba();
  } catch (e) {
    r = { ok: false, detalle: 'error: ' + e.message };
  }
  casos.push({ n, nombre, ok: r.ok === true, detalle: r.detalle });
}

caso(1, 'los dos ficheros existen y caben en el techo', () => {
  const tam = [CSS, JS].map((r) => (existsSync(r) ? statSync(r).size : -1));
  return {
    ok: tam.every((t) => t > 0 && t <= TECHO),
    detalle: 'descent.css ' + tam[0] + ' B, descent_view.js ' + tam[1] + ' B (techo ' + TECHO + ' B)',
  };
});

caso(2, 'css sin color, gradient, blur, backdrop-filter, opacity < 1 ni sombra con radio', () => {
  const h = hallazgosCss(leer(CSS));
  return { ok: h.length === 0, detalle: h.join(', ') || 'limpia' };
});

caso(3, 'skip fijo con 48 px, enter con 56 px y stage sticky', () => {
  const css = leer(CSS);
  const f = [];
  if (valor(css, '.descent-skip', 'position') !== 'fixed') f.push('skip sin position fixed');
  if (!(px(valor(css, '.descent-skip', 'min-width')) >= 48) || !(px(valor(css, '.descent-skip', 'min-height')) >= 48)) f.push('skip menor de 48 px');
  if (!(px(valor(css, '.descent-enter', 'min-height')) >= 56)) f.push('enter menor de 56 px');
  if (valor(css, '.descent-stage', 'position') !== 'sticky') f.push('stage sin sticky');
  return { ok: f.length === 0, detalle: f.join(', ') || 'skip fijo 48 px, enter 56 px, stage sticky' };
});

caso(4, 'js sin Date, Math.random, fetch, localStorage, setTimeout, setInterval ni rAF', () => {
  const t = sinComentarios(leer(JS));
  const h = PROHIBIDOS.filter(([, re]) => re.test(t)).map(([n]) => n);
  return { ok: h.length === 0, detalle: h.join(', ') || 'limpia' };
});

caso(5, 'js define monta y frame, usa paint, items, IO con reserva de scroll; textos presentes; sin texto retirado', () => {
  const js = leer(JS);
  const requeridos = {
    'AtlasDescentView.monta': /window\.AtlasDescentView\s*=\s*\{[^}]*\bmonta\b/,
    'AtlasDescenso.frame': /window\.AtlasDescenso\s*=\s*\{[^}]*\bframe\b/,
    'AtlasComicAtoms.paint': /AtlasComicAtoms\.paint\s*\(/,
    // La vista pinta la escena montada (el descenso por defecto, el Codex de V9 si se le pasa): S = escena.
    'items de la escena': /\bS\.items\s*\(/,
    IntersectionObserver: /\bIntersectionObserver\b/,
    'reserva de scroll': /addEventListener\(\s*['"]scroll['"]/,
  };
  const f = [
    ...Object.keys(requeridos).filter((k) => !requeridos[k].test(js)),
    ...TEXTOS.filter((t) => !js.includes(t)).map((t) => 'texto ' + t),
  ];
  if (js.toLowerCase().includes(RETIRADO.toLowerCase())) f.push('texto retirado presente');
  return { ok: f.length === 0, detalle: f.join(', ') || 'completo' };
});

caso(6, 'js sin literales de color', () => {
  const h = hallazgosJs(leer(JS));
  return { ok: h.length === 0, detalle: h.join(', ') || 'limpia' };
});

caso(7, 'sabotaje: #123456 en una copia de la hoja hace fallar el caso 2', () => {
  const h = hallazgosCss(leer(CSS) + '\n.descent-sabotaje { color: #123456; }\n');
  return { ok: h.includes('hex'), detalle: h.join(', ') || 'nada' };
});

caso(8, 'humo en vm: escena real (A), IO e identidad (B), intros duales (C)', () => {
  const f = [];
  const exige = (c, msg) => { if (!c) f.push(msg); };
  const J = (x) => JSON.stringify(x);

  try {
    // A: escena real, dpr 2, sin identidad ni IO (reserva de scroll).
    const A = cargaVista({ dpr: 2 });
    const va = A.v;
    const S = va.AtlasDescentScene;
    exige(va.AtlasDescenso.frame(0).cause === 'descent not mounted', 'sin montar no hay NO_DATA');
    const panel = va.document.createElement('div');
    panel.textContent = 'antes';
    let despertados = 0;
    va.AtlasDescentView.monta(panel, () => { despertados += 1; });
    const raiz = panel.hijos[0];
    const ids = S.SECTIONS || S.PAGES;
    const pasos = conClase(raiz, 'descent-step');
    const L = S.CANVAS || { w: 380, h: 380 };
    const dual = Boolean(S.TEXT.kids && S.TEXT.tech);
    exige(panel.hijos.length === 1 && raiz.className === 'descent' && raiz.getAttribute('aria-label') === 'The story of the statue', 'raiz mal');
    // Dos capas (pulso, 2026-10-18): por seccion nueva, fondo (una vez) y frente(p); el escena_casos 11 fija fondo + frente = items(id, p).
    const capa = (i, q = 0) => J(S.fondo(ids[i])) + '|' + J(S.frente(ids[i], q / 24));
    const ultimas = (n) => A.pinturas.slice(-n).join('|');
    exige(A.pinturas.length === 2 && ultimas(2) === capa(0), 'montar: una pasada');
    exige(J(pasos.map((p) => p.getAttribute('data-frame'))) === J(ids), 'orden de secciones');
    const lienzos = etiqueta(raiz, 'CANVAS');
    exige(lienzos.length === 1 && lienzos[0].className === 'descent-art' && lienzos[0].getAttribute('aria-hidden') === 'true' && lienzos[0].width === L.w * 2 && lienzos[0].height === L.h * 2, 'canvas mal');
    exige(conClase(raiz, 'descent-intro').length === (dual ? 1 : 0), 'intros mal');
    const x = conClase(raiz, 'descent-skip')[0];
    exige(x?.type === 'button' && x.getAttribute('aria-label') === 'Skip the story and check the rift' && x.textContent === 'x', 'x mal');
    x?.click();
    exige(despertados === 1, 'x: una llamada a despertar');
    const puerta = conClase(raiz, 'descent-enter')[0];
    exige(puerta?.textContent === 'Check the rift' && dentroDe(pasos.at(-1), puerta), 'puerta fuera de la ultima');
    puerta?.click();
    exige(despertados === 2, 'puerta: una llamada');
    exige(conClase(raiz, 'descent-account').length === 0, 'cuenta sin Identity');
    exige(conClase(raiz, 'descent-ai')[0]?.textContent === 'Connect your local AI with the app later, from the terminal.', 'falta descent-ai');
    const tok = raiz.style.props;
    exige(['--d-ink', '--d-paper', '--d-ocean', '--d-cyan', '--d-vermilion', '--d-yellow'].every((k) => tok[k]), 'faltan tokens');
    exige(!va.AtlasSemantica || Boolean(tok['--d-violet']), 'falta --d-violet');
    exige(!panel.textContent.includes(RETIRADO), 'texto retirado visible');
    // Contrato (FIRMO 2026-10-18, pulido): manda la ultima seccion cuyo borde de arriba ya cruzo el 75 % de la ventana (800 -> 600 px).
    pasos.forEach((p, i) => { p.offsetTop = i * 600; });
    const scroll = () => (va.oyentes.scroll || []).forEach((g) => g({ type: 'scroll' }));
    va.scrollY = 10; scroll(); scroll();
    exige(A.pinturas.length === 4 && ultimas(2) === capa(1), 'scroll 2: no repinta una vez');
    va.scrollY = 610; scroll();
    exige(A.pinturas.length === 6 && ultimas(2) === capa(2), 'scroll 3: no repinta');
    va.scrollY = 910; scroll();
    exige(A.pinturas.length === 7 && ultimas(1) === J(S.frente(ids[2], 12 / 24)), 'pulso: a mitad de seccion solo repinta el frente, en el paso 12');
    const f0 = va.AtlasDescenso.frame(0);
    const f1 = va.AtlasDescenso.frame(700);
    exige(f0 && f1 && J(f0) === J(S.frame(ids[0])) && J(f1) === J(S.frame(ids[2])), 'frame mal');
  } catch (e) {
    f.push('escena real: ' + e.message);
  }

  // B: IO e identidad, con escena sintetica de cuatro secciones.
  const B = cargaVista({
    io: true,
    identidad: true,
    escena: {
      SECTIONS: ['P0', 'V3', 'V4', 'DW'], items: (id) => [id], frame: (id) => ({ marco: id }),
      TEXT: { P0: { h: 'a' }, V3: { h: 'b' }, V4: { h: 'c' }, DW: { h: 'd' } },
    },
  });
  const panelB = B.v.document.createElement('div');
  B.v.AtlasDescentView.monta(panelB, () => {});
  const obs = B.v.observadores[0];
  // Contrato del capataz (2026-10-18): con IO, el scroll TAMBIEN escucha, de forma sincrona (mismo scroll, mismo fotograma).
  exige(B.v.observadores.length === 1 && obs.observados.length === 4 && (B.v.oyentes.scroll || []).length === 1, 'IO: 4 observados y scroll sincrono');
  const cuenta = conClase(panelB.hijos[0], 'descent-account')[0];
  exige(cuenta?.textContent === "Create this device's key", 'cuenta: boton mal');
  cuenta?.click();
  exige(B.v.crearLlamadas === 1, 'cuenta: una llamada');
  obs.observados.forEach((p, i) => { p.offsetTop = i * 600; });
  B.v.scrollY = 10;
  obs.cb([]);
  obs.cb([]);
  exige(B.pinturas.length === 2 && B.pinturas[1] === J(['V3']), 'IO repinta mal');

  // C: TEXT.kids y TEXT.tech: el selector cambia solo el texto, nunca el fotograma.
  const C = cargaVista({
    escena: {
      SECTIONS: ['P0', 'DW'], CANVAS: { w: 300, h: 200 }, items: () => [], frame: (id) => ({ marco: id }),
      TEXT: {
        kids: { P0: { h: 'K0', p: ['k'], sound: 's' }, DW: { h: 'K1', p: ['k'], sound: 's' } },
        tech: { P0: { h: 'T0', p: ['t'], sound: 's' }, DW: { h: 'T1', p: ['t'], sound: 's' } },
      },
    },
  });
  const panelC = C.v.document.createElement('div');
  C.v.AtlasDescentView.monta(panelC, () => {});
  const raizC = panelC.hijos[0];
  const botones = conClase(raizC, 'descent-intro')[0]?.hijos ?? [];
  const pasosC = conClase(raizC, 'descent-step');
  const titular = (p) => etiqueta(p, 'H2')[0]?.textContent;
  exige(botones[0]?.textContent === 'For kids' && botones[1]?.textContent === 'Technical', 'intros: selector mal');
  exige(botones[0]?.getAttribute('aria-pressed') === 'true' && botones[1]?.getAttribute('aria-pressed') === 'false', 'For kids no pulsado');
  exige(pasosC.length === 2 && titular(pasosC[0]) === 'K0', 'texto kids mal');
  botones[1]?.click();
  exige(botones[0]?.getAttribute('aria-pressed') === 'false' && botones[1]?.getAttribute('aria-pressed') === 'true' && titular(pasosC[0]) === 'T0', 'Technical no cambia');
  exige(C.pinturas.length === 1, 'intro repinta');
  const lienzoC = etiqueta(raizC, 'CANVAS')[0];
  exige(lienzoC?.width === 300 && lienzoC?.height === 200, 'CANVAS de la escena no usado');
  exige(dentroDe(pasosC[1], conClase(raizC, 'descent-enter')[0]), 'puerta fuera (C)');

  return { ok: f.length === 0, detalle: f.length ? 'falla: ' + f.join(' | ') : 'escena real, IO e identidad, intros duales: limpios' };
});

const ok = casos.length === 8 && casos.every((c) => c.ok);
console.log(JSON.stringify({ ok, casos }));
process.exitCode = ok ? 0 : 1;
