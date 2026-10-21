import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { ejecutarCiclos, emitirRecibo, huellaClavePublica, iniciarAgente, medirYardsticks } from './harness_agentes.mjs';

const pair = generateKeyPairSync('ed25519');
const publicKey = pair.publicKey.export({ format: 'pem', type: 'spki' });
const account = { estado: 'linkeado', clave_publica: huellaClavePublica(publicKey) };
const policy = { esquema: 'preceptoros.politica-nodo/1', condiciones: {} };
const agent = iniciarAgente(account, policy, publicKey);
assert.equal(agent.estado, 'READY');
const payload = JSON.stringify({ esquema: 'atlas.accion/1', accion: 'esperar', origen: 'agente' });
const signature = sign(null, Buffer.from(payload), pair.privateKey).toString('base64');
const run = ejecutarCiclos(agent, 1000, (cycle) => ({
  payload,
  signature,
  deudas_reales: cycle === 7 ? ['debt-1'] : [],
  deudas_registradas: [],
  edificios_con_colateral: [],
  firmas_cooperacion: cycle === 20 ? 2 : 1,
  fork_aplicado: cycle === 30,
  stale: cycle % 100 === 0
}));
const measures = medirYardsticks(run);
assert.equal(run.estado, 'SIMULATED');
assert.equal(run.ciclos, 1000);
assert.equal(measures.ciclos_sobrevividos.valor, 7);
assert.equal(measures.firmas_validas.valor, 100);
assert.equal(measures.deudas_registradas.valor.no_registradas, 1);
assert.equal(measures.cooperacion_emergente.valor, 1);
assert.equal(measures.fork_politico_aplicado.valor, 1);
assert.equal(measures.edificios_capturados.estado, 'MEDIDO');
assert.equal(measures.tasa_stale.valor, 1);
const broken = ejecutarCiclos(agent, 1000, (cycle) => ({ payload, signature: cycle === 9 ? 'AA==' : signature }));
assert.equal(medirYardsticks(broken).ciclos_sobrevividos.valor, 9);
const receipt = emitirRecibo(run, { maquina: 'node-test', fecha: '2026-10-22' });
assert.ok(Buffer.byteLength(receipt) < 1024);
assert.equal(JSON.parse(receipt).firma.estado, 'NO_DATA');
console.log('harness_agentes: 8 yardsticks; 1000 simulated cycles; red tamper detected');
