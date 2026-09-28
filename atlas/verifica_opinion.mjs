// preceptoros.org · theGame · VERIFICA una opinion firmada (`atlas.opinion.firmada/1`).
//
//     node atlas/verifica_opinion.mjs atlas-opinion-120-veredicto.json
//
// Quien recibe una opinion (por mensajeria, correo o un PR a `opiniones/`) no tiene que creerse
// nada: aqui se mira la FORMA (el contrato `data/atlas_opinion_schema.json`, en node y sin
// dependencias), la NOTA (ni rutas, ni correos, ni enlaces, ni IPs) y la FIRMA Ed25519 sobre
// JSON.stringify(opinion), la misma cuenta que hace `Identity.firmar` en la pestana. Determinista
// y sin LLM, como la Aduana.
//
// LO QUE NO SE PUEDE COMPROBAR AQUI, dicho: `estado_sha256` es la huella del estado exacto que la
// persona veia; casarla exige la partida exportada de ese momento. Sin ella, NO_DATA.
//
// Sale con 0 y `{"ok":true,...}` si vale; con 1 y el motivo si no. Nunca calla.
import { createPublicKey, verify } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SPKI_ED25519 = Buffer.from('302a300506032b6570032100', 'hex');
// La misma guarda que la pestana y el contrato: rutas, correos, enlaces, IPs.
const PROHIBIDO = /(^|[^0-9])\/[a-z]|@|https?:|\b\d{1,3}(\.\d{1,3}){3}\b/i;
const CLAVES_OP = ['esquema', 'contenido_v', 'sobre', 'ciclo', 'estado_sha256', 'mostrado', 'eleccion', 'nota'];
const CLAVES_SOBRE = ['esquema', 'opinion', 'firma', 'algoritmo', 'pseudonimo', 'clave_publica'];

function mismas(o, claves) {
  return o && typeof o === 'object' && !Array.isArray(o) &&
    Object.keys(o).length === claves.length && claves.every((k) => k in o);
}
const cadena = (x, min, max) => typeof x === 'string' && x.length >= min && x.length <= max;

export function forma(s) {
  if (!mismas(s, CLAVES_SOBRE) || s.esquema !== 'atlas.opinion.firmada/1') { return 'forma: sobre'; }
  if (s.algoritmo !== 'Ed25519') { return 'forma: algoritmo'; }
  if (!/^ed25519:[0-9a-f]{128}$/.test(s.firma)) { return 'forma: firma'; }
  if (!/^[0-9a-f]{64}$/.test(s.clave_publica)) { return 'forma: clave_publica'; }
  if (!cadena(s.pseudonimo, 1, 64)) { return 'forma: pseudonimo'; }
  const o = s.opinion;
  if (!mismas(o, CLAVES_OP) || o.esquema !== 'atlas.opinion/1') { return 'forma: opinion'; }
  if (!cadena(o.contenido_v, 1, 40)) { return 'forma: contenido_v'; }
  if (!['sugerencia', 'veredicto', 'grieta'].includes(o.sobre)) { return 'forma: sobre que'; }
  if (!Number.isInteger(o.ciclo) || o.ciclo < 0) { return 'forma: ciclo'; }
  if (!/^[0-9a-f]{64}$/.test(o.estado_sha256)) { return 'forma: estado_sha256'; }
  if (!cadena(o.mostrado, 0, 400)) { return 'forma: mostrado'; }
  if (!['de_acuerdo', 'en_desacuerdo', 'no_se'].includes(o.eleccion)) { return 'forma: eleccion'; }
  if (!cadena(o.nota, 0, 280)) { return 'forma: nota'; }
  if (PROHIBIDO.test(o.nota)) { return 'nota: ruta, correo, enlace o IP'; }
  return '';
}

export function verificaOpinion(s) {
  const f = forma(s);
  if (f) { return { ok: false, motivo: f }; }
  let valida = false;
  try {
    const clave = createPublicKey({ key: Buffer.concat([SPKI_ED25519, Buffer.from(s.clave_publica, 'hex')]),
      format: 'der', type: 'spki' });
    valida = verify(null, Buffer.from(JSON.stringify(s.opinion)), clave, Buffer.from(s.firma.slice(8), 'hex'));
  } catch (e) { return { ok: false, motivo: 'firma: ' + e.message }; }
  if (!valida) { return { ok: false, motivo: 'firma: no verifica' }; }
  const o = s.opinion;
  return { ok: true, pseudonimo: s.pseudonimo, sobre: o.sobre, eleccion: o.eleccion, ciclo: o.ciclo,
    contenido_v: o.contenido_v, estado: 'NO_DATA · la huella del estado se casa con la partida exportada' };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const ruta = process.argv[2];
  let r;
  try { r = ruta ? verificaOpinion(JSON.parse(readFileSync(ruta, 'utf8'))) : { ok: false, motivo: 'uso: fichero' }; }
  catch (x) { r = { ok: false, motivo: 'lectura: ' + x.message }; }
  process.stdout.write(JSON.stringify(r) + '\n');
  process.exit(r.ok ? 0 : 1);
}
