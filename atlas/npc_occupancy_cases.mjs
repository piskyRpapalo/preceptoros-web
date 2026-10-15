// Q6 sabotage: capture, message and upkeep must be signed, bounded and cycle-driven.
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
const require = createRequire(import.meta.url);
const O = require('../public/game/npc_occupancy.js');
const pub = 'a'.repeat(64), other = 'b'.repeat(64), records = {};
const store = { lee: async () => records.value || null, pon: async (v) => { records.value = v; } };
const firma = async (body) => {
  const h = createHash('sha256').update(JSON.stringify(body)).digest('hex');
  return { firma: 'ed25519:' + h + h };
};
const verifica = async (texto, sig) => sig === createHash('sha256').update(texto).digest('hex').repeat(2);
const o = O.crea({ ids: ['arrecife'], ciclos: 900, almacen: store, publica: async () => pub, firma, verifica });
const fallos = [];
await o.cargar();
let r = await o.captura('arrecife', 10);
if (!r.ok || o.estado('arrecife', 910, pub).fase !== 'sostenido') fallos.push('signed capture did not sustain its NPC site');
r = await o.escribe('arrecife', 'A quiet harbor.', 910, pub);
if (!r.ok || o.mural('arrecife', 910, pub) !== 'A quiet harbor.') fallos.push('signed wall message did not appear');
const once = await o.escribe('arrecife', 'A replacement message.', 910, pub);
if (once.ok || o.mural('arrecife', 910, pub) !== 'A quiet harbor.') fallos.push('one-message-per-account rule was bypassed');
if (O.saneaMensaje('x'.repeat(161)).ok) fallos.push('message limit sabotage passed');
if (O.saneaMensaje('<script>alert(1)</script>').ok) fallos.push('markup sabotage passed');
if (o.estado('arrecife', 911, pub).fase !== 'aviso') fallos.push('missed upkeep produced no warning');
r = await o.sostener('arrecife', 911, pub);
if (!r.ok || o.estado('arrecife', 1811, pub).fase !== 'sostenido') fallos.push('signed upkeep did not reset cycle decay');
if (o.estado('arrecife', 2711, pub).fase !== 'niebla' || o.mural('arrecife', 2711, pub) !== null) fallos.push('abandoned wall did not return to fog');
if (o.estado('arrecife', 911, other).fase !== 'niebla') fallos.push('another account inherited the local occupation');
records.value.registros[0].firma = 'ed25519:' + '0'.repeat(128);
const tampered = O.crea({ ids: ['arrecife'], ciclos: 900, almacen: store, publica: async () => pub, firma, verifica });
await tampered.cargar();
if (tampered.estado('arrecife', 911, pub).fase !== 'niebla') fallos.push('tampered stored receipt was trusted');
// D67: dependency failures must remain local; every public result has a safe cause.
const privateError = () => new Error('PRIVATE_SENTINEL /private/house/storage.js');
let privacyCases = 0;
async function safeFailure(label, action) {
  privacyCases++;
  try {
    const value = await action();
    if (value.ok !== false || !/^NO_DATA \(.*\)$/.test(value.causa || '') ||
        /PRIVATE_SENTINEL|storage\.js|db\.js|\/private\//.test(JSON.stringify(value))) {
      fallos.push('D67 ' + label + ': unsafe public failure');
    }
  } catch (_) { fallos.push('D67 ' + label + ': dependency exception escaped'); }
}
const options = () => ({ ids: ['arrecife'], ciclos: 900,
  almacen: { lee: async () => null, pon: async () => {} },
  publica: async () => pub, firma, verifica });
await safeFailure('missing reader', () => O.crea({}).cargar());
for (const sync of [false, true]) {
  const fail = sync ? () => { throw privateError(); } : async () => { throw privateError(); };
  let opt = options(); opt.almacen.lee = fail;
  await safeFailure('read ' + sync, () => O.crea(opt).cargar());
  for (const field of ['publica', 'firma', 'verifica']) {
    opt = options(); opt[field] = fail;
    await safeFailure('capture ' + field + sync, () => O.crea(opt).captura('arrecife', 10));
  }
  opt = options(); const subject = O.crea(opt);
  await subject.captura('arrecife', 10); opt.almacen.pon = fail;
  await safeFailure('upkeep write ' + sync, () => subject.sostener('arrecife', 11, pub));
  for (const field of ['firma', 'verifica']) {
    opt = options(); let broken = false; const original = opt[field];
    opt[field] = (...args) => broken ? fail() : original(...args);
    const subject = O.crea(opt); await subject.captura('arrecife', 10); broken = true;
    await safeFailure('upkeep ' + field + sync, () => subject.sostener('arrecife', 11, pub));
  }
  opt = options(); opt.almacen.pon = fail;
  await safeFailure('capture write ' + sync, () => O.crea(opt).captura('arrecife', 10));
}
console.log(JSON.stringify({ privacy_cases: privacyCases, ciclos_mantenimiento: O.CICLOS, firma_red: 'red-first', fallos, ok: !fallos.length }));
process.exitCode = fallos.length ? 1 : 0;
