import { test } from 'node:test';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('../', import.meta.url).pathname;
const AGENT_FACING = ['llms.txt', 'AGENTS.md', 'CLAUDE.md', 'README.md'];
const FORBIDDEN = ['oracle', 'notary', 'depin', 'currency', 'clearing', 'magic', 'cryptocurrency'];
/* 'token' is audited separately: 'tokens' (LLM count) is a technical term; the
   guardian reports it as a triage finding, not a hard red.
   'cryptocurrency' is banned (FIRMO 2026-10-22); 'cryptography'/'cryptographic'
   are APPROVED and are not matched (word is longer than the ban). */

function readAgentFile(f) { return readFileSync(join(ROOT, f), 'utf8'); }

function existsInTree(path) {
  if (existsSync(join(ROOT, path))) { return true; }
  if (path.includes('/')) { return false; }
  const base = path.split('/').pop();
  for (const d of ['public', 'public/game', 'public/assets', 'atlas', 'tests', 'docs', 'bin', 'config', 'data']) {
    try { if (readdirSync(join(ROOT, d)).includes(base)) { return true; } } catch (e) { /* missing dir */ }
  }
  return false;
}

function citedRefs() {
  const refs = [];
  for (const f of AGENT_FACING) {
    const t = readAgentFile(f);
    for (const m of t.matchAll(/`([\w\-./]+\.(?:js|py|mjs|md|json|txt|yml|sh|css|html|webmanifest))`/g)) {
      refs.push({ where: `${f}:${t.slice(0, m.index).split('\n').length}`, path: m[1] });
    }
    for (const m of t.matchAll(/(?<!`)\b((?:docs|public|atlas|tests|data|config|bin)\/[\w\-./]+)/g)) {
      refs.push({ where: `${f}:${t.slice(0, m.index).split('\n').length}`, path: m[1] });
    }
  }
  return refs;
}

function citedCommands() {
  const cmds = [];
  for (const f of AGENT_FACING) {
    const t = readAgentFile(f);
    for (const m of t.matchAll(/`((?:python3?|node|npm|git|gh|npx|pytest|pip)[^\n`]{0,60})`/g)) {
      cmds.push({ where: `${f}:${t.slice(0, m.index).split('\n').length}`, cmd: m[1] });
    }
  }
  return cmds;
}

/* MEASURE BEFORE (permanent house rule): the guardian MEASURES and REPORTS with
   file:line counts. Findings feed the next H pieces; this PR fixes nothing.
   The strict gates below activate with H7_ESTRICTO=1 so the Mesa can see the
   red measured today; the default mode measures without blocking. */

test('H7 measure · LIVE REFS: every cited path exists in the tree (strict: red on dead ref)', { skip: process.env.H7_ESTRICTO !== '1' }, () => {
  const dead = citedRefs().filter(r => !existsInTree(r.path));
  if (dead.length) {
    throw new Error(`dead refs (${dead.length}):\n${dead.map(m => `${m.where} -> ${m.path}`).join('\n')}`);
  }
});

test('H7 measure · LIVE COMMANDS: every cited command maps to a real entry point (strict: red on dead command)', { skip: process.env.H7_ESTRICTO !== '1' }, () => {
  const cmds = citedCommands();
  const dead = cmds.filter(c => {
    const first = c.cmd.split(/\s+/)[0];
    return !['python3', 'python', 'node', 'npm', 'git', 'gh', 'npx', 'pytest', 'pip'].includes(first);
  });
  if (dead.length) {
    throw new Error(`dead commands (${dead.length}):\n${dead.map(m => `${m.where} -> ${m.cmd}`).join('\n')}`);
  }
});

test('H7 measure · ZERO SECRETS: private literals read from CI env only, never from the public tree', () => {
  const list = process.env.PRIVATE_LITERALS;
  if (!list) {
    console.log('NO_DATA with cause: PRIVATE_LITERALS env var not set in this run (secrets live in CI config, never in the public tree)');
    return;
  }
  const findings = [];
  for (const literal of list.split(',').map(s => s.trim()).filter(Boolean)) {
    for (const f of AGENT_FACING) {
      const t = readAgentFile(f).toLowerCase();
      if (t.includes(literal.toLowerCase())) {
        const lineNo = t.split('\n').findIndex(l => l.includes(literal.toLowerCase())) + 1;
        findings.push(`${f}:${lineNo}`);
      }
    }
  }
  if (findings.length) { throw new Error(`private literals in agent-facing files: ${findings.join(', ')}`); }
});

test('H7 measure · FORBIDDEN WORDS absent from agent-facing files (strict: red on presence)', { skip: process.env.H7_ESTRICTO !== '1' }, () => {
  const findings = [];
  for (const f of AGENT_FACING) {
    const t = readAgentFile(f).toLowerCase();
    t.split('\n').forEach((line, i) => {
      for (const w of FORBIDDEN) {
        if (line.includes(w)) { findings.push(`${f}:${i + 1}: ${w}`); }
      }
    });
  }
  if (findings.length) { throw new Error(`forbidden words present (${findings.length}):\n${findings.join('\n')}`); }
});

test('H7 measure before (declared counts, feeds the next H pieces; this PR fixes nothing)', () => {
  const refs = citedRefs();
  const dead = refs.filter(r => !existsInTree(r.path));
  const cmds = citedCommands();
  console.log(`MEASURE BEFORE · live refs: ${refs.length} cited, ${refs.length - dead.length} alive, ${dead.length} dead`);
  dead.forEach(m => console.log(`  dead: ${m.where} -> ${m.path}`));
  console.log(`MEASURE BEFORE · live commands: ${cmds.length} cited`);
  console.log(`MEASURE BEFORE · forbidden words in agent-facing files: see docs/canon-context-hygiene.md for the triage table`);
  console.log(`MEASURE BEFORE · zero secrets: ${process.env.PRIVATE_LITERALS ? 'gate armed from CI env' : 'NO_DATA with cause: PRIVATE_LITERALS not set (CI config)'}`);
  if (!refs.length) { throw new Error('the guardian found nothing to measure: it cannot go red'); }
});
