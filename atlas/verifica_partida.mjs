// preceptoros.org · theGame · VERIFICA una partida exportada y firmada.
//
//     node atlas/verifica_partida.mjs atlas-partida-1234.json
//
// Es la pieza que la Aduana del rack va a llamar antes de dejar entrar una
// partida en bronze. DETERMINISTA Y SIN LLM: un modelo decidiendo que partida
// entra es justo el fallo que la Aduana existe para impedir.
//
// Tres puertas, en este orden, y la primera que falla para con su motivo:
//   1. forma: sobre `atlas.partida.firmada/1` y partida `atlas.partida/1`
//      completa (el esquema entero lo vigila `atlas/test_atlas.py`);
//   2. firma: Ed25519 sobre JSON.stringify(partida), con la clave publica que
//      trae el sobre --la misma cuenta que `Identity.firmar` en la pestana--;
//   3. reproduccion: se vuelve a jugar con el motor y el final tiene que
//      salir IGUAL. Una partida truncada no se puede reproducir y se rechaza
//      diciendolo.
//
// Sale con 0 y `{"ok":true}` si entra; con 1 y el motivo si no. Nunca calla.
import { createRequire } from 'node:module';
import { createPublicKey, verify } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const M = require(join(RAIZ, 'public/assets/atlas-motor.js'));
const Pa = require(join(RAIZ, 'public/assets/atlas-partida.js'));

// Cabecera DER de una clave publica Ed25519 (SPKI): 12 bytes fijos + 32 de clave.
const SPKI_ED25519 = Buffer.from('302a300506032b6570032100', 'hex');

function igual(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

export function verifica(sobre) {
  if (!sobre || sobre.esquema !== 'atlas.partida.firmada/1') { return { ok: false, motivo: 'forma: sobre' }; }
  const p = sobre.partida;
  if (!p || p.esquema !== 'atlas.partida/1' || !Array.isArray(p.pasos) || !p.ley || !p.final) {
    return { ok: false, motivo: 'forma: partida' };
  }
  if (!/^[0-9a-f]{64}$/.test(sobre.clave_publica || '')) { return { ok: false, motivo: 'forma: clave_publica' }; }
  const m = /^ed25519:([0-9a-f]{128})$/.exec(sobre.firma || '');
  if (!m) { return { ok: false, motivo: 'forma: firma' }; }

  let valida = false;
  try {
    const clave = createPublicKey({
      key: Buffer.concat([SPKI_ED25519, Buffer.from(sobre.clave_publica, 'hex')]),
      format: 'der', type: 'spki'
    });
    valida = verify(null, Buffer.from(JSON.stringify(p)), clave, Buffer.from(m[1], 'hex'));
  } catch (e) { return { ok: false, motivo: 'firma: ' + e.message }; }
  if (!valida) { return { ok: false, motivo: 'firma: no verifica' }; }

  if (p.truncada) { return { ok: false, motivo: 'reproduccion: partida truncada' }; }
  // Una partida se juega con SU version del contenido. Si el motor cambio de
  // reglas, se dice cual y cual, en vez de un «final no coincide» sin causa.
  if (p.contenido_v !== M.CATALOGO.contenido_v) {
    return { ok: false, motivo: `reproduccion: contenido_v distinto (motor ${M.CATALOGO.contenido_v}, partida ${p.contenido_v})` };
  }
  let e;
  try { e = Pa.reproduce(p, M); } catch (x) { return { ok: false, motivo: 'reproduccion: ' + x.message }; }
  const f = Pa.final(e, M);
  if (!igual(f, p.final)) { return { ok: false, motivo: 'reproduccion: el final no coincide' }; }
  return { ok: true, pasos: p.pasos.length, ciclo: f.ciclo, fase: f.fase };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const ruta = process.argv[2];
  let r;
  try { r = ruta ? verifica(JSON.parse(readFileSync(ruta, 'utf8'))) : { ok: false, motivo: 'uso: fichero' }; }
  catch (x) { r = { ok: false, motivo: 'lectura: ' + x.message }; }
  process.stdout.write(JSON.stringify(r) + '\n');
  process.exit(r.ok ? 0 : 1);
}
