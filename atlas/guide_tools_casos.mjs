// El guía con herramientas (public/game/guide_tools.js): el esquema sale del registro y rechaza herramienta
// desconocida, propiedades de más y valores fuera de enum; el ejecutor nunca pulsa un botón de gasto o firma; como
// mucho 3 pasos por pregunta; cada marco de la radio < 1,024 B.
// Uso: node --test atlas/guide_tools_casos.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function carga() {
  const ctx = vm.createContext({ TextEncoder, JSON, Array, Object, Number, String, Promise, Error, console });
  ctx.globalThis = ctx;
  vm.runInContext(readFileSync(new URL('../public/game/guide_tools.js', import.meta.url), 'utf8'), ctx);
  return ctx.AtlasGuideTools;
}
const G = carga();
const plano = (x) => JSON.parse(JSON.stringify(x));

// A tiny DOM: buttons that count their clicks, so a press by the guide is caught.
function dom() {
  const clicks = [], made = {};
  function btn(id, text) {
    const n = { id, tagName: 'BUTTON', textContent: text, style: {}, dataset: {}, attrs: {}, focused: false,
      setAttribute(k, v) { this.attrs[k] = v; }, removeAttribute(k) { delete this.attrs[k]; }, focus() { this.focused = true; },
      click() { clicks.push(id); }, addEventListener() {} };
    made[id] = n; return n;
  }
  ['visitor-start', 'visitor-beacon', 'visitor-summon-tc1', 'visitor-hatch-1'].forEach((id, i) => btn(id, ['Start an ephemeral visit', 'Visit the beacon · claim 100 copper once', 'Sign invocation · tc1', 'Sign adoption · egg 1 · ready'][i]));
  const box = btn('visitor-play', ''); const tabs = [];
  const doc = {
    getElementById: (id) => made[id] || (id.startsWith('tab-') ? { id } : null),
    querySelector: (q) => { const m = q.match(/^#([\w-]+)$/); if (m) { return made[m[1]] || null; } if (q.startsWith('[id^="visitor-hatch-"]')) { return made['visitor-hatch-1']; } return null; },
    querySelectorAll: (q) => q === '[data-guide-pointed]' ? Object.values(made).filter((n) => n.attrs['data-guide-pointed']) : []
  };
  const win = { AtlasTerminalTabs: { select: (id) => tabs.push(id) } };
  return { doc, win, clicks, made, tabs, box };
}
// complete() that replays a fixed list of model outputs.
const guion = (outs) => { let i = 0; return async () => outs[Math.min(i++, outs.length - 1)]; };

test('el esquema se construye del registro: un oneOf por herramienta, const, sin propiedades de más', () => {
  const s = G.schema();
  assert.deepEqual(plano(s.oneOf.map((o) => o.properties.tool.const)), plano(G.REGISTRY.map((t) => t.tool)));
  assert.deepEqual(plano(s.oneOf.map((o) => o.properties.tool.const)), ['read_screen', 'open_tab', 'walk', 'point_at', 'answer']);
  for (const o of s.oneOf) { assert.equal(o.additionalProperties, false); assert.equal(o.properties.args.additionalProperties, false); }
  const walk = s.oneOf.find((o) => o.properties.tool.const === 'walk').properties.args.properties;
  assert.equal(walk.steps.minimum, 1); assert.equal(walk.steps.maximum, 6); assert.equal(walk.dir.enum.length, 6);
  assert.equal(s.oneOf.find((o) => o.properties.tool.const === 'answer').properties.args.properties.text.maxLength, 280);
});

test('validate rechaza herramienta desconocida, propiedades de más y valores fuera de enum o de rango', () => {
  assert.ok(G.validate({ tool: 'point_at', args: { target: 'beacon' } }).ok);
  assert.ok(G.validate({ tool: 'walk', args: { dir: 'east', steps: 2 } }).ok);
  assert.ok(G.validate({ tool: 'read_screen', args: {} }).ok);
  for (const malo of [
    { tool: 'summon', args: {} }, { tool: 'click', args: { target: 'summon_reef' } },
    { tool: 'point_at', args: { target: 'beacon' }, extra: 1 }, { tool: 'point_at', args: { target: 'beacon', press: true } },
    { tool: 'open_tab', args: { tab: 'wallet' } }, { tool: 'point_at', args: { target: 'sign_everything' } },
    { tool: 'walk', args: { dir: 'up', steps: 1 } }, { tool: 'walk', args: { dir: 'east', steps: 7 } }, { tool: 'walk', args: { dir: 'east', steps: 1.5 } },
    { tool: 'answer', args: { text: 'x'.repeat(281) } }, { tool: 'answer', args: { text: '' } }, null, [], 'answer'
  ]) { assert.equal(G.validate(malo).ok, false, JSON.stringify(malo)); }
});

test('el ejecutor nunca pulsa: «invoca por mí» señala el botón y dice Needs you', async () => {
  const d = dom(); const frames = [];
  const r = await G.run('summon a wave for me', { env: d, log: (f) => frames.push(f), complete: guion(['{"tool":"point_at","args":{"target":"summon_reef"}}']) });
  assert.deepEqual(d.clicks, [], 'ningún botón pulsado');
  assert.equal(d.made['visitor-summon-tc1'].attrs['data-guide-pointed'], 'summon_reef');
  assert.match(d.made['visitor-summon-tc1'].style.outline, /dashed/, 'contorno, no sólo color');
  assert.match(r.answer, /^Needs you: press Sign invocation · tc1/);
  assert.equal(r.steps.length, 1, 'señalar cierra el turno: lo siguiente es del carbono');
  for (const t of Object.keys(G.TARGETS)) {
    const e = dom(); await G.run('x', { env: e, complete: guion([JSON.stringify({ tool: 'point_at', args: { target: t } })]) });
    assert.deepEqual(e.clicks, [], t);
  }
});

test('como mucho 3 pasos por pregunta, aunque el modelo nunca conteste', async () => {
  const d = dom(); let llamadas = 0;
  const r = await G.run('?', { env: d, complete: async () => { llamadas++; return '{"tool":"open_tab","args":{"tab":"news"}}'; } });
  assert.equal(llamadas, 3); assert.equal(r.steps.length, G.MAX_STEPS); assert.equal(G.MAX_STEPS, 3);
  assert.equal(r.answer, 'The news tab is open.');
});

test('una llamada inválida es NO_DATA con causa y no ejecuta nada', async () => {
  const d = dom();
  const r = await G.run('?', { env: d, complete: guion(['{"tool":"summon","args":{}}']) });
  assert.equal(r.steps[0].valid, false); assert.match(r.answer, /NO_DATA/); assert.deepEqual(d.clicks, []); assert.deepEqual(d.tabs, []);
});

test('cada marco de la radio cabe en menos de 1,024 B, también con la respuesta más larga', async () => {
  const d = dom(); const frames = [];
  await G.run('?', { env: d, log: (f) => frames.push(f), complete: guion([JSON.stringify({ tool: 'answer', args: { text: '\u{1F980}'.repeat(140) } })]) });
  await G.run('?', { env: d, log: (f) => frames.push(f), complete: guion(['{"tool":"open_tab","args":{"tab":"army"}}', '{"tool":"answer","args":{"text":"ok"}}']) });
  // Defensa en profundidad: aunque una herramienta devuelva 5 KiB, el marco se corta por debajo de 1,024 B.
  const largo = G.tools.read_screen; G.tools.read_screen = () => 'é'.repeat(5000);
  try { await G.run('?', { env: d, log: (f) => frames.push(f), complete: guion(['{"tool":"read_screen","args":{}}', '{"tool":"answer","args":{"text":"ok"}}']) }); }
  finally { G.tools.read_screen = largo; }
  assert.ok(frames.length >= 4);
  for (const f of frames) { assert.ok(new TextEncoder().encode(f).length < 1024, f.length); assert.match(f, /^Guide · /); }
  assert.equal(frames[1], 'Guide · open_tab army · The army tab is open.');
});

test('el prompt lista cada herramienta en una línea y lleva los hechos de la página', () => {
  const p = G.system('Facts: Move with the arrow keys.');
  for (const t of G.REGISTRY) { assert.ok(p.includes('\n- ' + t.tool + ' '), t.tool); }
  assert.match(p, /never press, spend or sign/); assert.match(p, /Facts: Move with the arrow keys/);
});

test('el ejemplo más cercano a la pregunta va primero (few-shot dinámico, determinista)', () => {
  assert.equal(G.ranked('summon a wave for me')[0][1].args.target, 'summon_reef');
  assert.equal(G.ranked('take me to the beacon')[0][1].args.target, 'beacon');
  assert.equal(G.ranked('hatch my egg')[0][1].args.target, 'hatch');
  assert.equal(G.ranked('zzz')[0][1].args.target, 'beacon', 'empate: el orden del registro');
  for (const e of G.ranked('x')) { assert.ok(G.validate(e[1]).ok, 'cada ejemplo es una llamada válida'); }
  assert.ok(G.system('', 'summon a wave').indexOf('summon_reef') < G.system('', 'summon a wave').indexOf('"beacon"'));
});
