// Casos deterministas de la CRIA SOBERANA y del GENOMA de SISIL (auditoria SISIL_CRIA §3). Los
// ejecuta atlas/test_atlas.py:   node atlas/cria_casos.mjs  -> una linea JSON: [{caso, ok, detalle}]
// Sin red, sin reloj, sin azar del sistema.
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const K = require('../public/game/canon.js');
const G = require('../public/game/gacha.js');
const C = require('../public/game/cria.js');
const Gn = require('../public/game/genoma.js');

const casos = [];
function caso(nombre, fn) {
  try { const d = fn(); casos.push({ caso: nombre, ok: d === true, detalle: d === true ? '' : String(d) }); }
  catch (e) { casos.push({ caso: nombre, ok: false, detalle: 'excepcion: ' + e.message }); }
}
const igual = (a, b) => a === b || `${JSON.stringify(a)} != ${JSON.stringify(b)}`;
const todas = (...xs) => xs.find((x) => x !== true) ?? true;
const copia = (x) => JSON.parse(JSON.stringify(x));
const semilla = (i) => createHash('sha256').update('cria:' + i).digest('hex');
const BASE = C.desdeValores();

// ---------------------------------------------------------------- genoma
const bueno = { esquema: 'atlas.genoma/1', base: K.huella(BASE), procedencia: 'sintetico',
                dominios: { incubacion: { ciclos_min_tc1: 15, ciclos_max_tc1: 25 }, rareza: { unico_tc4: 60, raro_tc4: 1500 },
                            novedad: { enfriamiento_ciclos: 300 } } };
caso('genoma: el bueno pasa y su param_hash no depende del orden de las claves', () => {
  const otro = { procedencia: 'sintetico', dominios: { novedad: { enfriamiento_ciclos: 300 }, rareza: { raro_tc4: 1500, unico_tc4: 60 },
                 incubacion: { ciclos_max_tc1: 25, ciclos_min_tc1: 15 } }, base: bueno.base, esquema: 'atlas.genoma/1' };
  return todas(igual(Gn.valida(bueno), ''), igual(Gn.paramHash(bueno), Gn.paramHash(otro)));
});
caso('genoma: fuera de banda, desconocido, decimal y min > max se rechazan', () => {
  const con = (d) => ({ ...bueno, dominios: d });
  return todas(/fuera de/.test(Gn.valida(con({ rareza: { unico_tc1: 20000 } }))) || 'banda',
               /desconocido/.test(Gn.valida(con({ rareza: { suerte_extra: 1 } }))) || 'parametro',
               /desconocido/.test(Gn.valida(con({ tienda: { x: 1 } }))) || 'dominio',
               /solo enteros/.test(Gn.valida(con({ combate: { k: 32.5 } }))) || 'decimal',
               /min > max/.test(Gn.valida(con({ incubacion: { ciclos_min_tc2: 90, ciclos_max_tc2: 40 } }))) || 'min>max');
});
caso('genoma: los dominios prohibidos no entran ni disfrazados (addendum §5 y §9)', () => {
  const nombres = ['invocation_permission', 'human_only_override', 'motor_cost_override', 'real_money', 'crypto_wallet',
                   'remote_url', 'executable_payload', 'hidden_probability_float', 'wall_clock_timer', 'auto_adoption_troop',
                   'auto_invoke', 'private_path', 'hostname', 'ip', 'personal_data'];
  for (const n of nombres) {
    const comoDominio = Gn.valida({ ...bueno, dominios: { [n]: { x: 1 } } });
    const comoParametro = Gn.valida({ ...bueno, dominios: { rareza: { [n]: 1 } } });
    if (!/prohibido/.test(comoDominio) || !/prohibido/.test(comoParametro)) { return 'entra: ' + n + ' · ' + comoDominio + ' · ' + comoParametro; }
  }
  return true;
});

// ---------------------------------------------------------------- paquete de cria
caso('cria: el juego de hoy escrito como paquete pasa la forma y las puertas duras', () =>
  todas(igual(C.forma(BASE), ''), igual(C.puertas(BASE).ok, true)));
caso('cria: las odds que se ensenan son las que se tiran (puntos basicos exactos)', () => {
  for (const tc of Object.keys(G.TCS)) {
    const o = C.odds(BASE, tc), g = G.odds(tc);
    if (o.pb.join() !== g.map((x) => x * 10).join() || o.resto !== 0) { return tc + ': ' + o.pb + ' vs ' + g; }
  }
  return true;
});
caso('cria: 20 000 tiradas reales caen donde dicen las odds (tc4)', () => {
  const c = { normal: 0, magico: 0, raro: 0, unico: 0 }, o = G.odds('tc4');
  for (let i = 0; i < 20000; i++) { c[G.tirada(semilla(i), 'tc4').rareza]++; }
  const fuera = G.RAREZAS.filter((r, i) => Math.abs(c[r] - o[i] * 20) > Math.max(60, o[i] * 20 * 0.08));
  return fuera.length ? JSON.stringify(c) + ' odds ' + o : true;
});
caso('cria: ninguna de 2 000 tropas de hoy incumple la linea base (tropas_invalidas = 0)', () => {
  for (let i = 0; i < 2000; i++) {
    const tc = 'tc' + (1 + (i % 4)), t = G.tirada(semilla('b' + i), tc), m = C.compruebaTropa(t, BASE);
    if (m) { return tc + ' #' + i + ': ' + m; }
  }
  return true;
});
caso('cria: presupuesto, simetria y exclusion de afijos se hacen cumplir', () => {
  const unico = (() => { for (let i = 0; ; i++) { const t = G.tirada(semilla('u' + i), 'tc4'); if (t.rareza === 'unico') { return t; } } })();
  const corto = copia(BASE); corto.presupuesto.suma.unico = 10;
  const exc = copia(BASE); exc.afijos.exclusiones = [['atlante', 'abismo']];
  const rota = copia(unico); rota.armonicos[1][0] += 1;
  return todas(/presupuesto/.test(C.compruebaTropa(unico, corto)) || 'presupuesto',
               /excluidos/.test(C.compruebaTropa(unico, exc)) || 'exclusion',
               /simetria/.test(C.compruebaTropa(rota, BASE)) || 'simetria');
});
caso('cria: las puertas duras tumban el casino, el reloj y el piloto que invoca', () => {
  const con = (f) => { const p = copia(BASE); f(p); return C.forma(p); };
  const malos = {
    auto_invoke: (p) => { p.auto_invoke = true; },
    auto_adoption_troop: (p) => { p.afijos.auto_adoption_troop = 1; },
    reloj: (p) => { p.incubacion.segundos_tc1 = 30; },
    decimal: (p) => { p.rareza.tc1[0] = 700.5; },
    odds_ocultas: (p) => { delete p.rareza.tc3; },
    dinero_real: (p) => { p.precio_real = 5; },
    tirada_de_pago: (p) => { p.paid_reroll = 1; },
    fomo: (p) => { p.fomo_timer = 3; },
    racha: (p) => { p.racha_perdida = 1; },
    cuenta_atras: (p) => { p.cuenta_atras = 10; },
    codigo: (p) => { p.version = 'function(){ return 1 }'; },
    remoto: (p) => { p.base = 'https:' + '//example'; },
    coste_motor: (p) => { p.coste = { cobre: 1 }; }
  };
  const puerta = (f) => { const p = copia(BASE); f(p); return C.puertas(p); };
  const pasan = Object.keys(malos).filter((k) => !con(malos[k]));
  const sinPuerta = Object.keys(malos).filter((k) => puerta(malos[k]).ok);
  return todas(pasan.length ? 'la forma deja pasar: ' + pasan.join(', ') : true,
               sinPuerta.length ? 'la puerta dura no lo nombra: ' + sinPuerta.join(', ') : true);
});
caso('cria: la incubacion va solo en ciclos (banda [1, 100000], nunca 0 ni reloj)', () => {
  const p = copia(BASE); p.incubacion.tc1 = [0, 20];
  const q = copia(BASE); q.incubacion.tc2 = [50, 40];
  return todas(/incubacion/.test(C.forma(p)) || 'cero', /incubacion/.test(C.forma(q)) || 'min>max');
});

// ---------------------------------------------------------------- invocar y adoptar: solo la persona
caso('invocar: fuera del enum de lo que un piloto puede proponer', () => {
  const acc = JSON.parse(readFileSync(new URL('../data/atlas_accion_schema.json', import.meta.url), 'utf8'));
  const enumAcc = acc.properties.accion.enum, origen = acc.properties.origen.enum;
  return todas(igual(enumAcc.includes('invocar'), false), igual(origen.includes('denso'), false));
});
caso('adoptar e invocar: solo ui.js, tras la firma de la persona; ningun modulo del laboratorio', () => {
  const sin = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"\\])\/\/.*$/gm, '$1');
  const lee = (f) => sin(readFileSync(new URL('../public/game/' + f, import.meta.url), 'utf8'));
  for (const f of ['canon.js', 'sobres.js', 'arena.js', 'mercado.js', 'narragrafo.js', 'cria.js', 'genoma.js']) {
    const c = lee(f);
    if (/\.adopta\(|\.invoca\(|Identity\.firmar|firmarTexto/.test(c)) { return f + ' adopta, invoca o firma'; }
  }
  const ui = lee('ui.js');
  return todas(ui.indexOf('window.Identity.firmar(obj)') >= 0 || 'ui sin firma humana',
               ui.indexOf('army.adopta(r.obj, r.firma)') > ui.indexOf('window.Identity.firmar(obj)') || 'adopta antes de firmar');
});

process.stdout.write(JSON.stringify(casos) + '\n');
