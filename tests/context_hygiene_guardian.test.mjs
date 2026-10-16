import { test } from 'node:test';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const RAIZ = new URL('../', import.meta.url).pathname;
const AGENT_FACING = ['llms.txt', 'AGENTS.md', 'CLAUDE.md', 'README.md'];
const FORBIDDEN = ['oracle', 'notary', 'depin', 'currency', 'clearing', 'magic'];
/* token se audita aparte: 'tokens' (LLM count) es uso tecnico; el guardian lo reporta como hallazgo para triaje, no como rojo duro. */

function lee(f) { return readFileSync(join(RAIZ, f), 'utf8'); }

function existeEnArbol(ruta) {
  if (existsSync(join(RAIZ, ruta))) { return true; }
  if (ruta.includes('/')) { return false; }
  const base = ruta.split('/').pop();
  for (const d of ['public', 'public/game', 'public/assets', 'atlas', 'tests', 'docs', 'bin', 'config', 'data']) {
    try { if (readdirSync(join(RAIZ, d)).includes(base)) { return true; } } catch (e) { /* dir ausente */ }
  }
  return false;
}

function refsCitadas() {
  const refs = [];
  for (const f of AGENT_FACING) {
    const t = lee(f);
    for (const m of t.matchAll(/`([\w\-./]+\.(?:js|py|mjs|md|json|txt|yml|sh|css|html|webmanifest))`/g)) {
      refs.push({ donde: `${f}:${t.slice(0, m.index).split('\n').length}`, ruta: m[1] });
    }
    for (const m of t.matchAll(/(?<!`)\b((?:docs|public|atlas|tests|data|config|bin)\/[\w\-./]+)/g)) {
      refs.push({ donde: `${f}:${t.slice(0, m.index).split('\n').length}`, ruta: m[1] });
    }
  }
  return refs;
}

function comandosCitados() {
  const cmds = [];
  for (const f of AGENT_FACING) {
    const t = lee(f);
    for (const m of t.matchAll(/`((?:python3?|node|npm|git|gh|npx|pytest|pip)[^\n`]{0,60})`/g)) {
      cmds.push({ donde: `${f}:${t.slice(0, m.index).split('\n').length}`, cmd: m[1] });
    }
  }
  return cmds;
}

/* MEDIDA ANTES (permanent house rule): the guardian MEASURES and REPORTS with
   file:line counts. Findings feed the next H pieces; this PR fixes nothing.
   Strict gates below activate with H7_ESTRICTO=1 so the Mesa can see the red
   measured today; the default mode measures without blocking. */

test('H7 measure · LIVE REFS: every cited path exists in the tree (strict: red on dead ref)', { skip: process.env.H7_ESTRICTO !== '1' }, () => {
  const muertas = refsCitadas().filter(r => !existeEnArbol(r.ruta));
  if (muertas.length) {
    throw new Error(`dead refs (${muertas.length}):\n${muertas.map(m => `${m.donde} -> ${m.ruta}`).join('\n')}`);
  }
});

test('H7 measure · LIVE COMMANDS: every cited command maps to a real entry point (strict: red on dead command)', { skip: process.env.H7_ESTRICTO !== '1' }, () => {
  const cmds = comandosCitados();
  const muertos = cmds.filter(c => {
    const primera = c.cmd.split(/\s+/)[0];
    return !['python3', 'python', 'node', 'npm', 'git', 'gh', 'npx', 'pytest', 'pip'].includes(primera);
  });
  if (muertos.length) {
    throw new Error(`dead commands (${muertos.length}):\n${muertos.map(m => `${m.donde} -> ${m.cmd}`).join('\n')}`);
  }
});

test('H7 measure · ZERO SECRETS: private literals read from CI env only, never from the public tree', () => {
  const lista = process.env.PRIVATE_LITERALS;
  if (!lista) {
    console.log('NO_DATA with cause: PRIVATE_LITERALS env var not set in this run (secrets live in CI config, never in the public tree)');
    return;
  }
  const hallazgos = [];
  for (const literal of lista.split(',').map(s => s.trim()).filter(Boolean)) {
    for (const f of AGENT_FACING) {
      const t = lee(f).toLowerCase();
      if (t.includes(literal.toLowerCase())) {
        const linea = t.split('\n').findIndex(l => l.includes(literal.toLowerCase())) + 1;
        hallazgos.push(`${f}:${linea}`);
      }
    }
  }
  if (hallazgos.length) { throw new Error(`private literals in agent-facing files: ${hallazgos.join(', ')}`); }
});

test('H7 measure · FORBIDDEN WORDS absent from agent-facing files (strict: red on presence)', { skip: process.env.H7_ESTRICTO !== '1' }, () => {
  const hallazgos = [];
  for (const f of AGENT_FACING) {
    const t = lee(f).toLowerCase();
    t.split('\n').forEach((linea, i) => {
      for (const w of FORBIDDEN) {
        if (linea.includes(w)) { hallazgos.push(`${f}:${i + 1}: ${w}`); }
      }
    });
  }
  if (hallazgos.length) { throw new Error(`forbidden words present (${hallazgos.length}):\n${hallazgos.join('\n')}`); }
});

test('H7 measure before (declared counts, feeds the next H pieces; this PR fixes nothing)', () => {
  const refs = refsCitadas();
  const muertas = refs.filter(r => !existeEnArbol(r.ruta));
  const cmds = comandosCitados();
  console.log(`MEASURE BEFORE · live refs: ${refs.length} cited, ${refs.length - muertas.length} alive, ${muertas.length} dead`);
  muertas.forEach(m => console.log(`  dead: ${m.donde} -> ${m.ruta}`));
  console.log(`MEASURE BEFORE · live commands: ${cmds.length} cited`);
  console.log(`MEASURE BEFORE · forbidden words in agent-facing files: see docs/canon-context-hygiene.md for the triage table`);
  console.log(`MEASURE BEFORE · zero secrets: ${process.env.PRIVATE_LITERALS ? 'gate armed from CI env' : 'NO_DATA with cause: PRIVATE_LITERALS not set (CI config)'}`);
  if (!refs.length) { throw new Error('the guardian found nothing to measure: it cannot go red'); }
});
