// El VERIFICADOR del MERITO y del TESORO (enmienda del Soberano, 2026-09-29: «que el numero que ya estoy
// contando se pueda gastar»). Misma forma que `verifica_partida.mjs`: forma -> firmas -> invariantes.
// Determinista: sin reloj, sin red, sin LLM. Cualquiera lo corre sobre el repositorio sin pedir permiso.
//
//   node atlas/verifica_tesoro.mjs <fichero.json>   ->  {"ok":true,...}  o  {"ok":false,"motivo":"..."}
//                                                        codigo de salida 0 / 1
//
// DOS OBJETOS QUE NO SE CONFUNDEN (confundirlos es como se fabrica un casino):
// - `atlas.merito/1`, lo que se GANA: 1 merito = 1 paquete firmado Y ACEPTADO, de origen HUMANO. No se
//   transfiere, no lo acuna el silicio (piloto, modelo denso, LoRA, peer, A2A, SISIL: cero), cuenta firmas
//   y no personas, y no pasa del techo publicado para la temporada.
// - `atlas.tesoro/1`, lo que se PAGA: una bolsa fija en recursos del Bosque (los cinco del motor: no hay
//   moneda nueva). «El sistema acredita; la bolsa la abre una firma humana, con testigo que no es el
//   beneficiario.» Lo reclamado no pasa nunca de lo total, recurso a recurso, y los reclamos van
//   encadenados por hash.
// Y las PUERTAS DURAS que miran todo el arbol: ningun decimal (la tasa 20:11 se DERIVA de dos enteros, no
// se guarda como 1,1), ninguna caducidad en fecha de reloj (solo ciclos), ninguna vecindad por
// geolocalizacion (cerca = sector, temporada y saltos en el grafo firmado) y ningun merito dentro de una
// oferta o de un asiento.
//
// Dos lecturas declaradas de la nota: `hash_ficha` es un hash (64 hex), no un entero; y la bolsa va en
// CESTAS de los cinco recursos, porque una cifra unica obligaria a sumar cobre con luz.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { verificador } from './mp_firma.mjs';

const require = createRequire(import.meta.url);
const K = require('../public/game/canon.js');
const M = require('../public/game/mercado.js');

export const NO_HUMANAS = ['piloto_base', 'denso', 'lora', 'peer', 'a2a', 'sisil', 'sintetico', 'emulado', 'agente_borrador'];
const H16 = /^[0-9a-f]{16}$/, H64 = /^[0-9a-f]{64}$/, FIRMA = /^ed25519:[0-9a-f]{128}$/;
const TEMPORADA = /^\d{4}-\d{2}-\d{2}\.\d+$/, DIA = /^\d{4}-\d{2}-\d{2}$/;
const ent = (x, min = 0) => Number.isSafeInteger(x) && x >= min;
const obj = (o) => !!o && typeof o === 'object' && !Array.isArray(o);
const mismas = (o, ks) => obj(o) && Object.keys(o).sort().join() === ks.slice().sort().join();
const falla = (motivo) => ({ ok: false, motivo });

/* La huella corta de una clave publica: lo unico que el merito dice de quien lo gano. */
export const claveHash = (pub) => K.sha('atlas.clave/1:' + pub).slice(0, 16);

/* PUERTAS DURAS sobre todo el arbol, antes de mirar la forma: devuelven el primer fallo, nombrado. */
export function puertas(x, camino = '', padre = '') {
  if (typeof x === 'number' && !Number.isSafeInteger(x)) { return 'decimal guardado en ' + (camino || 'la raiz') + ' (solo enteros; la tasa se deriva)'; }
  if (Array.isArray(x)) {
    for (let i = 0; i < x.length; i++) { const m = puertas(x[i], camino + '[' + i + ']', padre); if (m) { return m; } }
    return '';
  }
  if (!obj(x)) { return ''; }
  const moviendo = /^(da|pide|bolsa_total|bolsa_reclamada|bolsa_entregada|cuerpo|asiento)$/.test(padre) || x.esquema === 'atlas.asiento/1';
  for (const k of Object.keys(x)) {
    if (moviendo && /merito/i.test(k)) { return 'merito transferido en ' + (camino ? camino + '.' : '') + k + ' (el merito no se mueve)'; }
    if (/(^|_)(caduca|expira)_el$|(^|_)(fecha|date|timestamp)$/i.test(k)) { return 'caducidad en fecha de reloj en ' + (camino ? camino + '.' : '') + k + ' (solo ciclos)'; }
    if (/^(lat|lon|lng|latitud|longitud|geo|gps|coordenadas)$/i.test(k)) { return 'vecindad por geolocalizacion en ' + (camino ? camino + '.' : '') + k + ' (cerca = sector, temporada y saltos)'; }
    const m = puertas(x[k], camino ? camino + '.' + k : k, k);
    if (m) { return m; }
  }
  return '';
}

function cesta(c) {
  return mismas(c, M.RECURSOS) && M.RECURSOS.every((r) => ent(c[r]));
}

/* EL MERITO. `techos`: { temporada: techo } publicados antes de la temporada (opcional). */
export function verificaMerito(m, techos) {
  const p = puertas(m);
  if (p) { return falla(p); }
  if (!mismas(m, ['esquema', 'clave_hash', 'temporada', 'meritos', 'por_paquete', 'techo_temporada', 'medido_el']) ||
      m.esquema !== 'atlas.merito/1') { return falla('merito: forma'); }
  if (!H16.test(m.clave_hash) || !TEMPORADA.test(m.temporada) || !DIA.test(m.medido_el)) { return falla('merito: clave, temporada o fecha'); }
  if (!ent(m.meritos) || !ent(m.techo_temporada) || !Array.isArray(m.por_paquete) || m.por_paquete.length > 10000) {
    return falla('merito: cifras');
  }
  const vistos = new Set();
  let aceptados = 0;
  for (const q of m.por_paquete) {
    if (!mismas(q, ['hash_ficha', 'aceptado', 'ciclo', 'procedencia']) || !H64.test(q.hash_ficha) ||
        typeof q.aceptado !== 'boolean' || !ent(q.ciclo)) { return falla('merito: forma de un paquete'); }
    if (NO_HUMANAS.indexOf(q.procedencia) >= 0) { return falla('merito de procedencia no humana: ' + q.procedencia); }
    if (q.procedencia !== 'humano') { return falla('merito: procedencia desconocida'); }
    if (vistos.has(q.hash_ficha)) { return falla('paquete contado dos veces: ' + q.hash_ficha.slice(0, 12)); }
    vistos.add(q.hash_ficha);
    if (q.aceptado) { aceptados++; }
  }
  if (aceptados !== m.meritos) { return falla('los meritos no cuadran con los paquetes aceptados (' + aceptados + ' != ' + m.meritos + ')'); }
  if (m.meritos > m.techo_temporada) { return falla('pasa del techo de la temporada'); }
  if (techos && techos[m.temporada] !== m.techo_temporada) {
    return falla('techo retocado: el publicado para ' + m.temporada + ' es ' + techos[m.temporada]);
  }
  return { ok: true, meritos: m.meritos, clave_hash: m.clave_hash, temporada: m.temporada };
}

const sinFirmas = (t) => { const c = { ...t }; delete c.firma_soberano; delete c.firma_testigo; return K.canon(c); };

/* EL TESORO. `meritos`: { clave_hash: meritos verificados } de la temporada (opcional). */
export function verificaTesoro(t, meritos, verifica = verificador) {
  const p = puertas(t);
  if (p) { return falla(p); }
  if (!mismas(t, ['esquema', 'temporada', 'bolsa_total', 'bolsa_reclamada', 'reclamos', 'clave_soberano', 'clave_testigo',
                  'firma_soberano', 'firma_testigo']) || t.esquema !== 'atlas.tesoro/1') { return falla('tesoro: forma'); }
  if (!TEMPORADA.test(t.temporada) || !cesta(t.bolsa_total) || !cesta(t.bolsa_reclamada) || !Array.isArray(t.reclamos) ||
      !H64.test(t.clave_soberano) || !H64.test(t.clave_testigo)) { return falla('tesoro: temporada, bolsas o claves'); }
  if (t.clave_testigo === t.clave_soberano) { return falla('el testigo no puede ser el Soberano'); }
  const testigo = claveHash(t.clave_testigo), suma = Object.fromEntries(M.RECURSOS.map((r) => [r, 0]));
  let prev = 'genesis', ciclo = 0;
  for (const r of t.reclamos) {
    if (!mismas(r, ['clave_hash', 'meritos_presentados', 'bolsa_entregada', 'ciclo', 'prev_hash']) || !H16.test(r.clave_hash) ||
        !ent(r.meritos_presentados, 1) || !cesta(r.bolsa_entregada) || !ent(r.ciclo)) { return falla('reclamo: forma'); }
    if (r.clave_hash === testigo) { return falla('pago con testigo igual al beneficiario'); }
    if (r.prev_hash !== prev) { return falla('reclamo: la cadena no enlaza'); }
    if (r.ciclo < ciclo) { return falla('reclamos fuera de orden'); }
    if (meritos && !(r.clave_hash in meritos)) { return falla('reclamo sin merito verificado: ' + r.clave_hash); }
    if (meritos && r.meritos_presentados > meritos[r.clave_hash]) { return falla('presenta mas meritos de los que tiene: ' + r.clave_hash); }
    M.RECURSOS.forEach((x) => { suma[x] += r.bolsa_entregada[x]; });
    prev = K.sha(K.canon(r)); ciclo = r.ciclo;
  }
  for (const x of M.RECURSOS) {
    if (suma[x] !== t.bolsa_reclamada[x]) { return falla('bolsa reclamada no cuadra con los reclamos en ' + x); }
    if (t.bolsa_reclamada[x] > t.bolsa_total[x]) { return falla('bolsa reclamada pasa de la total en ' + x); }
  }
  const msg = sinFirmas(t);
  if (!FIRMA.test(t.firma_soberano || '') || !verifica(msg, t.firma_soberano.slice(8), t.clave_soberano)) { return falla('pago sin firma del Soberano'); }
  if (!FIRMA.test(t.firma_testigo || '') || !verifica(msg, t.firma_testigo.slice(8), t.clave_testigo)) { return falla('la firma del testigo no verifica'); }
  return { ok: true, reclamos: t.reclamos.length, cabeza: prev };
}

/* Una OFERTA entre personas: puertas duras + la forma cerrada de `mercado.js`. */
export function verificaOferta(o) {
  const p = puertas(o);
  if (p) { return falla(p); }
  const m = M.formaOferta(o);
  return m ? falla(m) : { ok: true };
}

/* Lo que se firma: el tesoro sin sus dos firmas. Exportado para quien lo prepara (y para los casos). */
export const mensajeTesoro = sinFirmas;

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  let x, r;
  try { x = JSON.parse(readFileSync(process.argv[2] === '-' ? 0 : process.argv[2], 'utf8')); }
  catch (e) { r = falla('no se puede leer: ' + e.message); }
  if (!r) {
    r = x && x.esquema === 'atlas.merito/1' ? verificaMerito(x)
      : x && x.esquema === 'atlas.tesoro/1' ? verificaTesoro(x)
      : x && x.esquema === 'atlas.oferta/1' ? verificaOferta(x) : falla('esquema desconocido');
  }
  process.stdout.write(JSON.stringify(r) + '\n');
  process.exitCode = r.ok ? 0 : 1;
}
