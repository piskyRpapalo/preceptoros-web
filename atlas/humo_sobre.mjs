// La mano de `humo_feedback.py` que firma y verifica (Python de la casa no trae Ed25519; node si).
//
//   node atlas/humo_sobre.mjs sobre <reto>          -> un `atlas.lab_envio/1` de verdad, firmado con una
//                                                      identidad DESECHABLE (semilla al azar, que no se guarda)
//   echo '{"acuse":..,"envio_hash":..,"receptor_hash":..}' | node atlas/humo_sobre.mjs acuse
//                                                   -> {"ok":true} o {"ok":false,"motivo"}
//
// El sobre pasa por la misma Aduana y se construye con el mismo `canal.js` que usara la web: el humo prueba
// el camino entero, no una copia de el.
import { createRequire } from 'node:module';
import { randomBytes, createPrivateKey, createPublicKey, sign } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { verificador } from './mp_firma.mjs';

const require = createRequire(import.meta.url);
const K = require('../public/game/canon.js');
const C = require('./cuarentena/canal.js');

const [orden, arg] = process.argv.slice(2);
if (orden === 'sobre') {
  const priv = createPrivateKey({ key: Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), randomBytes(32)]),
                                  format: 'der', type: 'pkcs8' });
  const pub = createPublicKey(priv).export({ format: 'der', type: 'spki' }).subarray(12).toString('hex');
  const op = { pub, pseudonimo: 'Humo-' + pub.slice(0, 4).toUpperCase(), contenido_v: '2026-09-27.1', maquina: 'humo del rack',
               ahora: () => new Date().toISOString().slice(0, 19) + 'Z', firma: (t) => sign(null, Buffer.from(t), priv).toString('hex'),
               muestra: () => Promise.resolve(true),
               transporte: () => Promise.resolve({ status: 200, json: { reto: arg } }) };
  const s = await C.prepara(op, 'valoracion', { veredicto: 'correcta', nota: 'humo de conectividad: un sobre de verdad, sin texto de nadie' });
  process.stdout.write(JSON.stringify(s) + '\n');
} else if (orden === 'acuse') {
  const x = JSON.parse(readFileSync(0, 'utf8')), a = x.acuse || {};
  let r = { ok: true };
  if (a.esquema !== 'atlas.lab_acuse/1') { r = { ok: false, motivo: 'respuesta sin acuse' }; }
  else if (a.envio_hash !== x.envio_hash) { r = { ok: false, motivo: 'el acuse es de otro sobre' }; }
  else if (!/^ed25519:[0-9a-f]{128}$/.test(a.firma || '') || !verificador(C.mensaje(a), a.firma.slice(8), a.receptor_clave)) {
    r = { ok: false, motivo: 'el acuse no verifica' };
  } else if (!x.receptor_hash) { r = { ok: false, motivo: 'NO_DATA · sin la huella del receptor medida no se cree un acuse' }; }
  else if (K.sha('atlas.clave/1:' + a.receptor_clave).slice(0, 16) !== x.receptor_hash) { r = { ok: false, motivo: 'el acuse lo firma otro receptor' }; }
  process.stdout.write(JSON.stringify(r) + '\n');
  process.exitCode = r.ok ? 0 : 1;
} else {
  process.stdout.write(JSON.stringify({ ok: false, motivo: 'orden: sobre <reto> | acuse' }) + '\n');
  process.exitCode = 1;
}
