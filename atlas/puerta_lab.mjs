// La PUERTA del laboratorio: donde LLEGA un `atlas.lab_envio/1` (Soberano, 2026-09-28/29). La puede llamar la
// API del rack en `POST /api/v1/paquetes` (como la Aduana llama a `verifica_partida.mjs`) y el workflow
// `envios` sobre los PR de respaldo. Determinista: sin LLM y sin red. Nunca publica: todo entra en
// CUARENTENA hasta que se firme la lista de editores (N claves por persona, sin recuperacion, con altas).
//
//   node atlas/puerta_lab.mjs verifica <sobre.json>                          forma, firma, hash, Aduana
//   node atlas/puerta_lab.mjs recibe <sobre.json> --registro R.jsonl --semilla S.hex [--retos RETOS.txt]
//        -> el ACUSE firmado por stdout (codigo 0) o {"ok":false,"motivo"} (codigo 1)
//   node atlas/puerta_lab.mjs lista --registro R.jsonl                        lo que ha llegado, por dia
//
// EL REGISTRO vive FUERA de public/ (en el rack, o donde diga quien llama) y va ENCADENADO: cada fila lleva
// el hash de la anterior, asi que borrar o tocar una rompe la cadena y `lista` lo dice. Cuenta FIRMAS, no
// personas, ni instalaciones, ni visitas: eso no es una carencia, es el producto.
import { createRequire } from 'node:module';
import { readFileSync, appendFileSync, existsSync } from 'node:fs';
import { createPrivateKey, createPublicKey, sign } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { verificador } from './mp_firma.mjs';

const require = createRequire(import.meta.url);
const K = require('../public/game/canon.js');
const C = require('./cuarentena/canal.js');

export const CONTENIDOS = ['2026-09-27.1'];
const CLAVES = ['esquema', 'tipo', 'contenido_v', 'clave_publica', 'pseudonimo', 'firmado_el', 'maquina_declarada', 'reto',
                'cuerpo', 'aduana', 'hash', 'firma'];
const UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
const falla = (motivo) => ({ ok: false, motivo });

/* La clave del receptor, desde una semilla de 32 bytes en hexadecimal (la guarda el rack, nunca el repo). */
export function receptorDeSemilla(hex) {
  const priv = createPrivateKey({ key: Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), Buffer.from(hex.trim(), 'hex')]),
                                  format: 'der', type: 'pkcs8' });
  const pub = createPublicKey(priv).export({ format: 'der', type: 'spki' }).subarray(12).toString('hex');
  return { pub, firma: (t) => sign(null, Buffer.from(t), priv).toString('hex') };
}

/* VERIFICA un sobre: forma cerrada, tamano, contenido, hash, firma y la Aduana otra vez. */
export function verificaEnvio(s, contenidos = CONTENIDOS) {
  if (!s || typeof s !== 'object' || Array.isArray(s) || Object.keys(s).sort().join() !== CLAVES.slice().sort().join() ||
      s.esquema !== 'atlas.lab_envio/1') { return falla('sobre: forma (campo que falta o que sobra)'); }
  let texto;
  try { texto = K.canon(s); } catch (e) { return falla('sobre: ' + e.message); }
  if (texto.length > C.TOPE_B) { return falla('sobre sobredimensionado'); }
  if (C.TIPOS.indexOf(s.tipo) < 0) { return falla('sobre: tipo'); }
  if (contenidos.indexOf(s.contenido_v) < 0) { return falla('contenido_v de otra version: ' + s.contenido_v); }
  if (!/^[0-9a-f]{64}$/.test(s.clave_publica) || !/^[0-9a-f]{32}$/.test(s.reto) || !UTC.test(s.firmado_el) ||
      typeof s.pseudonimo !== 'string' || !s.pseudonimo || /[<>/@]/.test(s.pseudonimo) ||
      typeof s.maquina_declarada !== 'string' || s.maquina_declarada.length > 60 || /[<>/@:]/.test(s.maquina_declarada)) {
    return falla('sobre: clave, reto, fecha, seudonimo o maquina');
  }
  if (!/^ed25519:[0-9a-f]{128}$/.test(s.firma || '')) { return falla('sobre sin firmar'); }
  if (C.huella(s) !== s.hash) { return falla('el hash no casa: alterado despues de firmar'); }
  if (!verificador(C.mensaje(s), s.firma.slice(8), s.clave_publica)) { return falla('la firma no verifica'); }
  const quedan = C.aduanaCuerpo(s.cuerpo).cuenta;
  const sucio = Object.keys(quedan).filter((k) => quedan[k] > 0);
  if (sucio.length) { return falla('la Aduana no tacho: ' + sucio.join(', ')); }
  return { ok: true, hash: s.hash };
}

function filas(ruta) {
  if (!existsSync(ruta)) { return []; }
  return readFileSync(ruta, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
}
const filaHash = (f) => K.sha(K.canon({ n: f.n, prev: f.prev, envio_hash: f.envio_hash, recibido_el: f.recibido_el }));

/* La cadena del registro: '' si enlaza entera; si no, donde se rompe. */
export function compruebaRegistro(fs) {
  let prev = 'genesis';
  for (let i = 0; i < fs.length; i++) {
    const f = fs[i];
    if (f.n !== i + 1 || f.prev !== prev || f.hash !== filaHash(f) || f.envio_hash !== f.sobre.hash) { return 'registro roto en la fila ' + (i + 1); }
    prev = f.hash;
  }
  return '';
}

/* RECIBE: verifica, comprueba el reto (de un solo uso y, si hay lista, emitido), encadena y ACUSA. */
export function recibe(s, { registro, receptor, recibidoEl, retos = null, contenidos = CONTENIDOS, escribe = true }) {
  const v = verificaEnvio(s, contenidos);
  if (!v.ok) { return v; }
  const fs = Array.isArray(registro) ? registro : filas(registro);
  const roto = compruebaRegistro(fs);
  if (roto) { return falla(roto); }
  if (retos && retos.indexOf(s.reto) < 0) { return falla('reto que la puerta no emitio'); }
  if (fs.some((f) => f.sobre.reto === s.reto)) { return falla('reto repetido: reproducido o de otra sesion'); }
  const prev = fs.length ? fs[fs.length - 1].hash : 'genesis';
  const fila = { n: fs.length + 1, prev, envio_hash: s.hash, recibido_el: recibidoEl };
  fila.hash = filaHash(fila); fila.sobre = s;
  if (Array.isArray(registro)) { registro.push(fila); } else if (escribe) { appendFileSync(registro, JSON.stringify(fila) + '\n'); }
  const acuse = { esquema: 'atlas.lab_acuse/1', envio_hash: s.hash, recibido_el: recibidoEl, registro_n: fila.n,
                  registro_prev: prev, registro_hash: fila.hash, estado: 'cuarentena', receptor_clave: receptor.pub };
  acuse.firma = 'ed25519:' + receptor.firma(C.mensaje(acuse));
  return { ok: true, acuse: K.ordena(acuse) };
}

/* LISTA para el arquitecto, sin abrir la web: por dia, firmas llegadas, re-verificadas y lo que tacho la Aduana. */
export function lista(fs) {
  const dias = {};
  fs.forEach((f) => {
    const d = f.recibido_el.slice(0, 10), x = dias[d] || (dias[d] = { firmas: 0, verificadas: 0, tachado: 0, tipos: {} });
    x.firmas++;
    if (verificaEnvio(f.sobre, [f.sobre.contenido_v]).ok) { x.verificadas++; }
    x.tachado += Object.values(f.sobre.aduana).reduce((a, b) => a + b, 0);
    x.tipos[f.sobre.tipo] = (x.tipos[f.sobre.tipo] || 0) + 1;
  });
  return { cadena: compruebaRegistro(fs) || 'enlazada', firmas: fs.length, por_dia: dias,
           nota: 'Se cuentan FIRMAS, no personas. Estado: cuarentena (nada se da por bueno ni se publica).' };
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const [orden, fichero] = process.argv.slice(2), arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null; };
  let r;
  try {
    if (orden === 'verifica') { r = verificaEnvio(JSON.parse(readFileSync(fichero, 'utf8'))); }
    else if (orden === 'recibe') {
      const retos = arg('--retos') ? readFileSync(arg('--retos'), 'utf8').split(/\s+/).filter(Boolean) : null;
      r = recibe(JSON.parse(readFileSync(fichero, 'utf8')), { registro: arg('--registro'), receptor: receptorDeSemilla(readFileSync(arg('--semilla'), 'utf8')),
                                                             recibidoEl: new Date().toISOString().slice(0, 19) + 'Z', retos });
      if (r.ok) { r = r.acuse; r.ok = undefined; }
    } else if (orden === 'lista') { r = lista(filas(arg('--registro'))); }
    else { r = falla('orden: verifica | recibe | lista'); }
  } catch (e) { r = falla(e.message); }
  process.stdout.write(JSON.stringify(r, null, orden === 'lista' ? 1 : 0) + '\n');
  process.exitCode = r.ok === false ? 1 : 0;
}
