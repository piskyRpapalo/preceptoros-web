import { test } from 'node:test';
import { readFileSync } from 'node:fs';

const raw = readFileSync(new URL('../mcp-manifest.json', import.meta.url), 'utf8');
const m = JSON.parse(raw);
const js = readFileSync(new URL('../public/game/deep_links.js', import.meta.url), 'utf8');

test('manifest actions match deep_links contract ids (deterministic landing)', () => {
  const ids = m.actions.map(a => a.id).sort();
  const inJs = [...js.matchAll(/'([a-z]+\.[a-z0-9]+)':/g)].map(x => x[1]).sort();
  if (JSON.stringify(ids) !== JSON.stringify(inJs)) {
    throw new Error('manifest and deep_links ids differ: ' + JSON.stringify({ ids, inJs }));
  }
});

test('deep_links.js under 16 KiB and vanilla', () => {
  if (Buffer.byteLength(js) > 16384) throw new Error('piece too big');
  if (/fetch\(|XMLHttpRequest|WebSocket|EventSource|import\s*\(/.test(js)) throw new Error('network call in deep_links');
});

test('contract visible before signing: title, what, needs, cost present for every action', () => {
  for (const a of m.actions) {
    if (!a.title || !a.what || !a.needs || !a.cost_measured) throw new Error(a.id + ' contract incomplete');
  }
});

test('manifest keeps state seals and no forbidden words in content', () => {
  const text = JSON.stringify({ ...m, global_guards: { ...m.global_guards, forbidden_words_absent: [] } }).toLowerCase();
  for (const w of ['oracle', 'notary', 'depin', 'clearing', 'magic', 'cryptocurrency']) {
    if (text.includes(w)) throw new Error('forbidden word: ' + w);
  }
  for (const a of m.actions) {
    if (a.state !== 'LIVE' && !(a.state === 'NO_DATA' && a.cause)) throw new Error(a.id + ' bad seal');
  }
});

test('sabotage: changing one id must break the match', () => {
  const broken = JSON.parse(raw);
  broken.actions[0].id = 'sabotaged.id';
  const ids = broken.actions.map(a => a.id).sort();
  const inJs = [...js.matchAll(/'([a-z]+\.[a-z0-9]+)':/g)].map(x => x[1]).sort();
  if (JSON.stringify(ids) === JSON.stringify(inJs)) throw new Error('sabotage not caught');
});
