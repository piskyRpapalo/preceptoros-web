// P6 · casos del chatbot de edificio (public/game/building_chat.js). Uso: node --test atlas/building_chat_cases.mjs
// Cada tipo del catálogo (AtlasEdificios.FORMAS) y la cabaña tienen guion; cada línea es un marco < 1.024 B con texto;
// la intención desconocida es NO_DATA con la causa de chunk_router.js; mismo texto, mismo marco.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const C = require('../public/game/building_chat.js');
const E = require('../public/game/colony_buildings.js');
const F = require('../public/game/state_frames.js');
const R = require('../public/game/chunk_router.js');

// Un edificio de cada forma (el id decide la forma). La cabaña de tutorial ya no existe.
function muestras() {
  const out = [];
  for (const forma of E.FORMAS) {
    for (let i = 0; i < 200; i++) { const id = 'b-' + i; if (E.formaDe(id) === forma) { out.push({ id, node: 'n-' + i }); break; } }
  }
  return out;
}

test('cada forma del catálogo tiene guion y la cabaña de tutorial no existe', () => {
  for (const k of E.FORMAS) { assert.ok(C.KINDS.includes(k), 'sin guion: ' + k); }
  assert.ok(!C.KINDS.includes('cabin') && C.kindOf({ id: 'b-cabin', node: 'cabin' }) !== 'cabin');
  assert.equal(muestras().length, E.FORMAS.length);
  for (const b of muestras()) { assert.equal(C.opening(b).length, 3); }
});

test('todas las líneas son marcos válidos bajo 1.024 B con texto', () => {
  for (const b of muestras()) {
    const marcos = [...C.opening(b), ...C.INTENTS.map((i) => C.reply(b, i, R)), C.reply(b, 'zzz', R)];
    for (const m of marcos) {
      assert.deepEqual(F.valida(m), [], JSON.stringify(m).slice(0, 80));
      assert.ok(Buffer.byteLength(JSON.stringify(m), 'utf8') < 1024);
      assert.ok(m.atoms[0].r.trim().length > 0);
    }
  }
});

test('intención desconocida = NO_DATA con la causa del router', () => {
  const b = muestras()[0];
  const m = C.reply(b, 'tell me a poem', R);
  assert.equal(m.atoms[0].r, R.responde('tell me a poem', null).causa);
  assert.equal(m.atoms[0].r, 'NO_DATA · model_not_installed');
  assert.equal(m.seal, 'NO_DATA');
  assert.equal(C.reply(b, 'tell me a poem', null).atoms[0].r, 'NO_DATA · router_not_loaded');
  assert.equal(C.reply(b, 'help', R).seal, 'LIVE');
});

test('determinismo: mismo edificio y texto, mismo marco; sin Math.random ni Date', async () => {
  for (const b of muestras()) {
    assert.deepEqual(C.opening(b), C.opening(b));
    assert.deepEqual(C.reply(b, 'what is this', R), C.reply(b, 'what is this', R));
  }
  const fuente = (await import('node:fs')).readFileSync(new URL('../public/game/building_chat.js', import.meta.url), 'utf8');
  assert.ok(!/Math\.random|Date\b/.test(fuente));
});


// P0 Node0: reuse the existing session-only thread; no persistent memory or new endpoint.
test('Node 0 conversation remembers settled turns only within its building visit', async () => {
  const { runInNewContext } = await import('node:vm');
  const { readFileSync } = await import('node:fs');
  const W = require('../public/game/thread_window.js');
  const wait = () => new Promise((done) => setImmediate(done));
  function sandbox(withThread = true) {
    const requests = [], log = [], created = [], pending = [];
    const visitorAccount = { info: () => ({ seed: 'a'.repeat(64) }) };
    const visitorPanel = {
      account: visitorAccount,
      listeners: {},
      addEventListener(name, cb) { this.listeners[name] = cb; },
      dispatchEvent(event) {
        if (event.type === 'visitor:tick' && this.listeners['visitor:render']) {
          this.listeners['visitor:render']({ detail: { account: this.account } });
        }
      }
    };
    const root = {
      AtlasEdificios: { formaDe: () => 'hex-prism' },
      AtlasThreadWindow: withThread ? W : null,
      // A building must not silently create a new visitor key; this factory is a tripwire.
      AtlasVisitorAccount: { create() { throw new Error('building_minted_unapproved_identity'); } },
      Event: class Event { constructor(type) { this.type = type; } },
      AtlasTerminalPanel: {
        mounted: { show() {} },
        decir(doc, list, id, text) { list.push({ id, text }); }
      },
      AtlasRadioChat: { canal() {} },
      fetch: async () => {}
    };
    root.AtlasAulaChat = {
      plain: (cause) => 'NO_DATA · ' + cause,
      turn: async (fetcher, seed, text, chain, page) => {
        requests.push({ seed, text, chain, page });
        if (root.delayed) return new Promise((resolve) => { pending.push(resolve); });
        if (root.failure) return { ok: false, cause: 'nodo_dormido', chain };
        return { ok: true, text: 'Node answer ' + requests.length,
          chain: { tic: requests.length, hash: 'b'.repeat(64), sello: {} } };
      }
    };
    runInNewContext(readFileSync(new URL('../public/game/building_chat.js', import.meta.url), 'utf8'), root);
    const doc = {
      defaultView: root,
      getElementById(id) { return id === 'chat-h' ? { textContent: '' } : id === 'log' ? log : id === 'visitor-play' ? visitorPanel : null; },
      createElement(tag) {
        const item = { tag, style: {}, hidden: false, listeners: {},
          addEventListener(name, cb) { this.listeners[name] = cb; } };
        created.push(item); return item;
      },
      addEventListener() {}, head: { appendChild() {} }
    };
    const page = { doc, entry: { before() {} }, state: { textContent: '' },
      line(kind, text) { log.push({ kind, text }); } };
    return { C: root.AtlasBuildingChat, root, requests, pending, created, log, page, visitorPanel, visitorAccount };
  }
  const b = { id: 'observatorio-primer-ancla' }, app = sandbox();
  app.C.open(b, app.page);
  app.C.ask('The keyword is cedar');
  await wait(); await wait();
  app.C.ask('Recall the keyword please');
  await wait(); await wait();
  assert.equal(app.requests.length, 2);
  assert.equal(app.requests[0].text, 'The keyword is cedar');
  assert.ok(app.requests[1].text.includes('The keyword is cedar'));
  assert.ok(app.requests[1].text.includes('Node answer 1'));
  assert.ok(app.requests[1].text.endsWith('Visitor: Recall the keyword please'));
  assert.ok(new TextEncoder().encode(app.requests[1].text).length <= 600);

  const n = app.requests.length;
  app.C.ask('🦀'.repeat(151)); await wait();
  assert.equal(app.requests.length, n, 'oversized payload must not reach gateway');

  app.C.open({ id: 'another-building' }, app.page);
  app.C.ask('Recall the keyword please'); await wait(); await wait();
  assert.equal(app.requests.length, 3);
  assert.ok(!app.requests[2].text.includes('cedar'), 'old building history must not leak');

  const bad = sandbox(); bad.C.open(b, bad.page);
  bad.root.failure = true; bad.C.ask('Tell me something'); await wait(); await wait();
  bad.root.failure = false; bad.C.ask('Recall my message please'); await wait(); await wait();
  assert.equal(bad.requests[1].text, 'Recall my message please', 'failed turns are not remembered');

  const pending = sandbox(); pending.C.open(b, pending.page); pending.root.delayed = true;
  pending.C.ask('Tell me a story'); await wait(); await wait();
  const close = pending.created.find((x) => x.textContent === 'Leave building');
  assert.ok(close); close.listeners.click();
  const lengthBefore = pending.log.length;
  pending.pending[0]({ ok: true, text: 'Late answer', chain: { tic: 1 } });
  await wait(); await wait();
  assert.equal(pending.log.length, lengthBefore, 'late responses must not re-enter ended visits');

  const ended = sandbox(); ended.C.open(b, ended.page);
  ended.C.ask('The secret is ocean'); await wait(); await wait();
  assert.equal(ended.requests.length, 1);
  ended.visitorPanel.listeners['visitor:end']();
  ended.C.open(b, ended.page);
  ended.C.ask('Recall my secret'); await wait(); await wait();
  assert.equal(ended.requests.length, 2);
  assert.ok(!ended.requests[1].text.includes('ocean'), 'new visit must not inherit prior history');

  const noVisitor = sandbox(); noVisitor.visitorPanel.dispatchEvent = function () {};
  noVisitor.C.open(b, noVisitor.page);
  noVisitor.C.ask('Explain electricity without a visit'); await wait(); await wait();
  assert.equal(noVisitor.requests.length, 0, 'no visitor account means no chat request');
  assert.ok(noVisitor.log.some((x) => /visit_not_started/.test(x.text)),
    'missing account gives visible NO_DATA, not silent success');
  const swapped = sandbox(); swapped.C.open(b, swapped.page);
  swapped.C.ask('The code is lighthouse'); await wait(); await wait();
  swapped.visitorPanel.account = { info: () => ({ seed: 'c'.repeat(64) }) };
  swapped.visitorPanel.listeners['visitor:render']({ detail: { account: swapped.visitorPanel.account } });
  swapped.C.open(b, swapped.page);
  swapped.C.ask('Remember the code'); await wait(); await wait();
  assert.equal(swapped.requests.length, 2);
  assert.equal(swapped.requests[1].seed, 'c'.repeat(64));
  assert.ok(!swapped.requests[1].text.includes('lighthouse'), 'new identity cannot inherit old memory');

  const noThread = sandbox(false); noThread.C.open(b, noThread.page);
  noThread.C.ask('Explain electricity'); await wait();
  assert.equal(noThread.requests.length, 0);
  assert.ok(noThread.log.some((x) => /thread_window_unavailable/.test(x.text)));
});
