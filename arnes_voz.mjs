// arnes_voz.mjs · ejecuta public/assets/voice.js con un navegador FALSO y le
// pide las cuatro cosas de la voz verificada (2026-10-04):
//   1. sin un si registrado y vigente (hash del trato, ttl), la nube no arranca;
//   2. «revocado» solo sale del evento de fin del reconocedor; sin el, fallo
//      declarado al vencer el plazo;
//   3. tono al abrir y al cerrar, y silencio si se apaga;
//   4. ni localStorage, ni red, ni audio guardado.
// LO QUE NO PRUEBA: que un navegador real dispare onend al abortar, ni como
// suena el tono, ni la experiencia con lector de pantalla. Eso es NO_DATA aqui.
//
//     node arnes_voz.mjs        -> sale 0 si todo pasa
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, webcrypto } from 'node:crypto';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const CODIGO = fs.readFileSync(path.join(AQUI, 'public', 'assets', 'voice.js'), 'utf8');
const pagina = fs.readFileSync(path.join(AQUI, 'public', 'es', 'index.html'), 'utf8');
const T = JSON.parse(pagina.match(/<script[^>]*id="i18n"[^>]*>([\s\S]*?)<\/script>/)[1]);
const HUELLA = createHash('sha256').update(T.micNubeTrato, 'utf8').digest('hex');

class El {
  constructor(tag) { this.tagName = tag; this.children = []; this.attrs = {}; this.dataset = {};
    this.listeners = {}; this.hidden = false; this.textContent = ''; this.parentNode = null;
    this.clases = new Set(); this.value = '';
    const yo = this;
    this.classList = { add: c => yo.clases.add(c), remove: c => yo.clases.delete(c),
                       contains: c => yo.clases.has(c) }; }
  set className(v) { this.clases = new Set(String(v).split(/\s+/).filter(Boolean)); }
  get className() { return [...this.clases].join(' '); }
  set innerHTML(h) { this.children = []; if (h.includes('class="rotulo"')) {
    const s = new El('span'); s.className = 'rotulo'; s.textContent = (h.match(/rotulo">([^<]*)/) || [])[1] || '';
    this.appendChild(s); } }
  appendChild(c) { c.parentNode = this; this.children.push(c); return c; }
  remove() { if (this.parentNode) { const h = this.parentNode.children; h.splice(h.indexOf(this), 1); this.parentNode = null; } }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
  addEventListener(t, f) { (this.listeners[t] ||= []).push(f); }
  removeEventListener(t, f) { this.listeners[t] = (this.listeners[t] || []).filter(g => g !== f); }
  dispatchEvent() { return true; }
  click() { (this.listeners.click || []).slice().forEach(f => f({ target: this })); }
  contains(x) { return x === this || this.children.some(c => c.contains(x)); }
  todos() { return [this, ...this.children.flatMap(c => c.todos())]; }
  querySelector(sel) {
    const [tag, cls] = sel.includes('.') ? sel.split('.') : [sel, null];
    return this.todos().find(e => e !== this && (!tag || e.tagName === tag) && (!cls || e.clases.has(cls))) || null;
  }
}

function navegador({ local = false, sinCrypto = false, mudo = false, guardado = {} } = {}) {
  const raiz = new El('main'), envoltura = new El('div'), fila = new El('div'), entrada = new El('textarea');
  raiz.appendChild(envoltura); envoltura.appendChild(fila); raiz.appendChild(entrada);
  const i18n = { textContent: JSON.stringify(T) };
  const reg = { localStorage: 0, red: 0, reconocedores: [], tonos: [], timers: [], docListeners: {} };
  const almacen = new Map(Object.entries(guardado));
  class SR {
    constructor() { reg.reconocedores.push(this); this.empezado = false; this.abortado = false; }
    start() { this.empezado = true; }
    stop() { this.parado = true; }
    abort() { this.abortado = true; if (!mudo) { this.onerror && this.onerror({ error: 'aborted' }); this.onend && this.onend(); } }
  }
  if (local) SR.prototype.processLocally = false;
  class AudioContext {
    constructor() { this.state = 'running'; this.currentTime = 0; this.destination = {}; }
    createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; }
    createOscillator() { const o = { frequency: { value: 0 }, connect() {}, start() { reg.tonos.push(o.frequency.value); }, stop() {} }; return o; }
  }
  const documento = {
    getElementById: id => ({ i18n, voice: fila, pregunta: entrada })[id] || null,
    createElement: t => new El(t),
    querySelector: s => raiz.querySelector(s),
    addEventListener: (t, f) => (reg.docListeners[t] ||= []).push(f),
    removeEventListener: (t, f) => { reg.docListeners[t] = (reg.docListeners[t] || []).filter(g => g !== f); },
    dispatchEvent: () => true,
  };
  const ctx = {
    document: documento, navigator: { language: 'es-ES' }, console, JSON, Date, Array, Uint8Array,
    TextEncoder, Promise, isNaN,
    SpeechRecognition: SR, AudioContext,
    Event: class { constructor(t) { this.type = t; } }, CustomEvent: class { constructor(t) { this.type = t; } },
    crypto: sinCrypto ? {} : webcrypto,
    sessionStorage: { getItem: k => (almacen.has(k) ? almacen.get(k) : null),
                      setItem: (k, v) => almacen.set(k, String(v)), removeItem: k => almacen.delete(k) },
    setTimeout: (f, ms) => { reg.timers.push({ f, ms }); return reg.timers.length; },
    clearTimeout: id => { if (reg.timers[id - 1]) reg.timers[id - 1].f = null; },
    fetch: () => { reg.red++; throw new Error('red'); },
    XMLHttpRequest: function () { reg.red++; throw new Error('red'); },
  };
  Object.defineProperty(ctx, 'localStorage', { get() { reg.localStorage++; throw new Error('localStorage'); } });
  ctx.window = ctx;
  vm.runInNewContext(CODIGO, ctx);
  const boton = fila.children.find(e => e.clases.has('mic'));
  const revocar = fila.children.find(e => e.clases.has('voice-revocar'));
  const pitido = fila.children.find(e => e.clases.has('voice-pitido'));
  const nota = () => (envoltura.querySelector('.voice-nota') || {}).textContent || '';
  const aviso = () => fila.querySelector('.voice-aviso');
  const tecla = e => (reg.docListeners.keydown || []).slice().forEach(f => f({ preventDefault() {}, ...e }));
  const vencer = () => reg.timers.splice(0).forEach(t => t.f && t.f());
  return { reg, almacen, boton, revocar, pitido, nota, aviso, tecla, vencer, entrada,
           ultimo: () => reg.reconocedores[reg.reconocedores.length - 1] };
}
// La huella se calcula con crypto.subtle, que es asincrono: se le da tiempo de
// sobra. Un solo setImmediate daba falsos rojos segun la carga de la maquina.
const tic = () => new Promise(r => setTimeout(r, 30));

const casos = [];
const caso = (n, f) => casos.push([n, f]);
const exige = (c, m) => { if (!c) throw new Error(m); };

caso('nube: pulsar sin si NO arranca y pregunta', async () => {
  const n = navegador(); await tic();
  n.boton.click();
  exige(n.reg.reconocedores.length === 0, 'arranco un reconocedor sin si');
  exige(n.aviso(), 'no salio el trato');
  exige(!n.almacen.has('voz-nube'), 'hay permiso sin aceptar');
});
caso('nube: aceptar registra {que,alcance,ttl_s,fecha,hash} y arranca', async () => {
  const n = navegador(); await tic();
  n.boton.click(); n.aviso().querySelector('.voice-aviso-si').click();
  const p = JSON.parse(n.almacen.get('voz-nube'));
  exige(p.que === 'voz-web' && Array.isArray(p.alcance) && p.alcance.length, 'que/alcance');
  exige(typeof p.ttl_s === 'number' && p.ttl_s > 0, 'ttl_s');
  exige(!isNaN(Date.parse(p.fecha)), 'fecha');
  exige(p.hash === HUELLA, 'el hash no es el SHA-256 del trato');
  exige(n.ultimo() && n.ultimo().empezado && !n.ultimo().processLocally, 'no arranco por la nube');
});
for (const [nombre, valor] of [
  ['caducado', { que: 'voz-web', alcance: ['x'], ttl_s: 1800, fecha: new Date(Date.now() - 3600e3).toISOString(), hash: HUELLA }],
  ['hash de otro trato', { que: 'voz-web', alcance: ['x'], ttl_s: 1800, fecha: new Date().toISOString(), hash: '0'.repeat(64) }],
  ['formato viejo «1»', 1],
]) caso(`nube: permiso ${nombre} = sin permiso`, async () => {
  const n = navegador({ guardado: { 'voz-nube': JSON.stringify(valor) } }); await tic();
  n.boton.click();
  exige(n.reg.reconocedores.length === 0, 'arranco con un permiso que no vale');
  exige(n.aviso(), 'no volvio a preguntar');
});
caso('nube: sin crypto.subtle no hay registro, y se dice', async () => {
  const n = navegador({ sinCrypto: true }); await tic();
  n.boton.click(); n.aviso().querySelector('.voice-aviso-si').click();
  exige(n.reg.reconocedores.length === 0, 'arranco sin poder registrar');
  exige(n.nota() === T.micSinRegistro, 'no declaro el fallo de registro');
});
caso('local: arranca en el aparato sin preguntar', async () => {
  const n = navegador({ local: true }); await tic();
  n.boton.click();
  exige(!n.aviso() && n.ultimo().empezado && n.ultimo().processLocally === true, 'local no arranco en el aparato');
});
caso('tono al abrir y al cerrar; revocar por atajo confirma por evento', async () => {
  const n = navegador(); await tic();
  n.boton.click(); n.aviso().querySelector('.voice-aviso-si').click();
  const r = n.ultimo(); r.onstart();
  exige(n.reg.tonos.join() === '880', 'no sono al abrir');
  exige(!n.revocar.hidden, 'el killswitch no se ve con el micro abierto');
  exige(n.revocar.getAttribute('aria-keyshortcuts') === 'Alt+Shift+V', 'atajo sin declarar');
  n.tecla({ altKey: true, shiftKey: true, code: 'KeyV' });
  exige(r.abortado, 'no aborto');
  exige(!n.almacen.has('voz-nube'), 'no borro el permiso');
  exige(n.nota() === T.micRevocado, 'no confirmo tras el evento de fin');
  exige(n.reg.tonos.join() === '880,440', 'no sono al cerrar');
});
caso('revocar sin evento de fin: fallo declarado, nunca «revocado»', async () => {
  const n = navegador({ mudo: true }); await tic();
  n.boton.click(); n.aviso().querySelector('.voice-aviso-si').click();
  const r = n.ultimo(); r.onstart();
  n.revocar.click();
  exige(n.nota() !== T.micRevocado, 'pinto exito sin evento de fin');
  n.vencer();
  exige(n.nota().startsWith(T.micRevocarFallo), 'vencido el plazo, no declaro el fallo');
  r.onend();
  exige(n.nota() === T.micRevocado, 'el fin tardio no se dijo');
});
caso('silencio: apagado el tono, no suena', async () => {
  const n = navegador({ local: true }); await tic();
  n.pitido.click();
  exige(n.pitido.getAttribute('aria-pressed') === 'false', 'el control no dice que esta callado');
  n.boton.click(); n.ultimo().onstart();
  exige(n.reg.tonos.length === 0, 'sono estando callado');
});
caso('nada fuera: ni localStorage, ni red, ni audio guardado', async () => {
  const n = navegador(); await tic();
  n.boton.click(); n.aviso().querySelector('.voice-aviso-si').click();
  const r = n.ultimo(); r.onstart();
  r.onresult({ resultIndex: 0, results: [[{ transcript: 'hola rack' }]] });
  r.onend();
  exige(n.entrada.value === 'hola rack', 'el texto no llego al campo');
  exige(n.reg.localStorage === 0, 'toco localStorage');
  exige(n.reg.red === 0, 'hizo peticiones');
  const guardado = [...n.almacen.keys()].filter(k => k !== 'voz-nube' && k !== 'voz-silencio');
  exige(guardado.length === 0, 'guardo en sesion algo mas que el permiso: ' + guardado);
  exige(![...n.almacen.values()].some(v => v.includes('hola rack')), 'guardo lo dictado');
});

let ok = 0;
const solo = process.argv[2];
for (const [n, f] of casos) {
  if (solo && !n.includes(solo)) continue;
  try { await f(); ok++; console.log('ok   ' + n); }
  catch (e) { console.log('FALLA ' + n + ' · ' + e.message); }
}
console.log(`${ok}/${casos.length}`);
process.exit(ok === casos.length ? 0 : 1);
