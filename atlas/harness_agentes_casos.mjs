import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { ejecutarCiclos, emitirRecibo, huellaClavePublica, iniciarAgente, medirYardsticks, cargarAiIndex, medirRedTeam, redTeamYardsticks, allYardsticks } from './harness_agentes.mjs';

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
assert.equal(redTeamYardsticks.length, 6);
assert.equal(allYardsticks.length, 14);

const rawIndex = JSON.stringify({
  esquema: 'preceptoros.ai-index/1',
  version: '1.0.0',
  budget_words: { L0: 700, L1: 3000, L2: 6000, L3: 20000, L4: 1024 },
  entries: [
    { path: 'README.md', depth: 0, words: 100, bytes: 500, sha256: 'a'.repeat(64), class: 'doc', one_liner: 'readme' },
    { path: 'AGENTS.md', depth: 1, words: 800, bytes: 4000, sha256: 'b'.repeat(64), class: 'doc', one_liner: 'agents' },
  ],
  decoys: [{ path: 'docs/fake.md', sha256: '0'.repeat(64), reason: 'decoy' }],
  canaries: [{ path: 'README.md', depth: 99, reason: 'canary' }],
});
const loaded = cargarAiIndex(rawIndex);
assert.equal(loaded.estado, 'LIVE');

const cleanNav = { leidos: ['AGENTS.md'], declared_depth: 2, utc: '2026-10-22T00:00:00Z' };
const cleanRt = medirRedTeam(cleanNav, loaded);
assert.equal(cleanRt.indice_conformidad.valor, 100);
assert.equal(cleanRt.decoys_citados.valor, 0);
assert.equal(cleanRt.canaries_leidos.valor, 0);
assert.equal(cleanRt.relecturas_detectadas.valor, 0);
assert.equal(cleanRt.words_vs_budget.valor.dentro, true);

const dirtyNav = {
  leidos: ['README.md', 'docs/fake.md', 'AGENTS.md', 'AGENTS.md', 'AGENTS.md', 'AGENTS.md', 'AGENTS.md'],
  declared_depth: 0,
  utc: '2026-10-22T00:00:00Z',
};
const dirtyRt = medirRedTeam(dirtyNav, loaded);
assert.equal(dirtyRt.decoys_citados.valor, 1);
assert.equal(dirtyRt.canaries_leidos.valor, 1);
assert.equal(dirtyRt.relecturas_detectadas.valor, 1);
assert.equal(dirtyRt.indice_conformidad.valor, 14);
assert.ok(dirtyRt.words_vs_budget.valor.leidos > dirtyRt.words_vs_budget.valor.budget);

const noIndex = medirRedTeam(cleanNav, null);
assert.equal(noIndex.decoys_citados.estado, 'NO_DATA');

assert.equal(cargarAiIndex(null).estado, 'NO_DATA');
assert.equal(cargarAiIndex('not json').estado, 'NO_DATA');
assert.equal(cargarAiIndex('{"esquema":"wrong/1"}').estado, 'NO_DATA');

console.log('harness_agentes: 14 yardsticks (8 original + 6 red team); 1000 simulated cycles; red tamper detected; ai-index consumer LIVE');
