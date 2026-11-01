// Estrella de la Voz: cada respuesta VERIFICADA del modelo del tutorial da +25 cobre, máximo 4 por visita.
// Uso: node --test atlas/voice_star_casos.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

globalThis.AtlasArmy = { crea: () => ({ lista: () => [] }), verificaWeb: null, cronica: () => [] };
globalThis.AtlasGacha = { TCS: {}, tirada: null };
new Function(readFileSync(new URL('../public/game/visitor_eggs.js', import.meta.url), 'utf8'))();
const cuenta = () => { let vivo = true; return { info: () => { if (!vivo) { throw new Error('ended'); } return { publicKey: 'k', name: 'v' }; }, end: () => { vivo = false; } }; };
const visita = () => globalThis.AtlasVisitorEggs.create(cuenta());
const resp = (text, extra = {}) => ({ verified: true, model: 'tutorial-model', text, sha: createHash('sha256').update(text).digest('hex'), ...extra });

test('+25 cobre por respuesta verificada y tope 4', async () => {
  const g = await visita();
  for (let i = 1; i <= 4; i++) { const s = await g.echo(resp('answer ' + i)); assert.equal(s.copper, 25 * i); assert.equal(s.echoes, i); }
  await assert.rejects(g.echo(resp('answer 5')), /4 echoes/);
  assert.equal(g.state().copper, 100);
});

test('sha que no casa con el texto se rechaza', async () => {
  const g = await visita();
  await assert.rejects(g.echo({ ...resp('real'), text: 'forged' }), /hash does not match/);
  assert.equal(g.state().copper, 0);
});

test('respuesta NO_DATA (no verificada, sin modelo o sha mal formado) no da nada', async () => {
  const g = await visita();
  await assert.rejects(g.echo(resp('NO_DATA', { verified: false })), /not verified/);
  await assert.rejects(g.echo(resp('x', { model: '' })), /not verified/);
  await assert.rejects(g.echo(resp('x', { sha: 'abc' })), /not verified/);
  await assert.rejects(g.echo(null), /not verified/);
  assert.equal(g.state().copper, 0);
});

test('visita terminada se rechaza', async () => {
  const g = await visita(); g.end();
  await assert.rejects(g.echo(resp('late')), /ended/);
});

test('determinista: misma secuencia, mismo estado', async () => {
  const run = async () => { const g = await visita(); await g.echo(resp('a')); await g.echo(resp('b')); return JSON.stringify(g.state()); };
  assert.equal(await run(), await run());
});
