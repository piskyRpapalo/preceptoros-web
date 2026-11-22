import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const source = readFileSync(new URL('../public/game/visitor_play.js', import.meta.url), 'utf8');

function harness() {
  const windowListeners = new Map();
  class Element {
    constructor() { this.children = []; this.style = {}; this.dataset = {}; this.attributes = {}; this.hidden = false; }
    append(...items) { this.children.push(...items); }
    replaceChildren(...items) { this.children = items; }
    addEventListener() {}
    setAttribute(k, v) { this.attributes[k] = String(v); }
    getAttribute(k) { return this.attributes[k] || null; }
    dispatchEvent() { return true; }
    closest() { return null; }
  }
  const box = new Element();
  const document = {
    getElementById(id) { return id === 'visitor-play' ? box : null; },
    createElement() { return new Element(); },
    addEventListener() {},
    dispatchEvent() { return true; }
  };
  const accounts = [], games = [];
  const window = {
    document, CustomEvent: class { constructor(type, init = {}) { this.type = type; this.detail = init.detail; } },
    Event: class { constructor(type) { this.type = type; } },
    addEventListener(name, fn) { windowListeners.set(name, [...(windowListeners.get(name) || []), fn]); },
    AtlasVisitorAccount: { async create(consent) {
      assert.equal(consent, true);
      const account = { publicKey: String(accounts.length + 1).padStart(64, '0'), active: true,
        info() { if (!this.active) throw new Error('This visit has ended'); return { publicKey: this.publicKey, name: 'Visitor' }; },
        async proveVisit(ok) { this.info(); assert.equal(ok, true); return this.publicKey; },
        end() { this.active = false; } };
      accounts.push(account); return account;
    } },
    AtlasVisitorEggs: { async create(account) {
      const game = { ended: false,
        state() { account.info(); if (this.ended) throw new Error('Visit has ended'); return { copper: 0, light: 0, step: 0, claimed: false, echoes: 0, echoCap: 4, eggs: [], troops: [], chronicle: [], busy: false }; },
        beacon() {}, end() { this.ended = true; account.end(); } };
      games.push(game); return game;
    } },
    AtlasGacha: { TCS: {}, RAREZAS: [], odds() { return []; } }
  };
  vm.runInNewContext(source, window);
  return { window, windowListeners, accounts, games };
}

test('pagehide ends a visit; bfcache pageshow can only begin a new isolated visit', async () => {
  const h = harness();
  const first = await h.window.AtlasVisitorPlay.enter(true);
  assert.equal(first.publicKey, h.accounts[0].publicKey);
  for (const fn of h.windowListeners.get('pagehide') || []) fn({ persisted: true });
  assert.equal(h.accounts[0].active, false);
  assert.equal(h.games[0].ended, true);
  for (const fn of h.windowListeners.get('pageshow') || []) fn({ persisted: true });
  const second = await h.window.AtlasVisitorPlay.enter(true);
  assert.equal(second.publicKey, h.accounts[1].publicKey);
  assert.notEqual(second.publicKey, first.publicKey);
  assert.equal(h.accounts.length, 2);
  await assert.rejects(h.accounts[0].proveVisit(true), /ended/);
});

test('consent refusal does not generate an account or reuse prior visit authority', async () => {
  const h = harness();
  await assert.rejects(h.window.AtlasVisitorPlay.enter(false), /unavailable/);
  assert.equal(h.accounts.length, 0);
  const visit = await h.window.AtlasVisitorPlay.enter(true);
  assert.equal(visit.publicKey, h.accounts[0].publicKey);
  assert.equal(h.accounts[0].active, true);
  assert.equal(h.accounts.length, 1);
});

test('an asynchronous key created after pagehide is discarded before it can become a visit', async () => {
  const h = harness(), create = h.window.AtlasVisitorAccount.create;
  let release;
  h.window.AtlasVisitorAccount.create = consent => new Promise(resolve => { release = () => create(consent).then(resolve); });
  const pending = h.window.AtlasVisitorPlay.enter(true);
  await Promise.resolve();
  for (const fn of h.windowListeners.get('pagehide') || []) fn({ persisted: true });
  release();
  await assert.rejects(pending, /ended during initialization/);
  assert.equal(h.games.length, 0);
  assert.equal(h.accounts[0].active, false);
});

test('repeated account creation remains fresh; pagehide revokes every prior signing key', async () => {
  const accountSource = readFileSync(new URL('../public/game/visitor_account.js', import.meta.url), 'utf8');
  const listeners = [];
  const c = vm.createContext({ crypto: webcrypto, TextEncoder, Uint8Array, addEventListener(_name, fn) { listeners.push(fn); } });
  vm.runInContext(accountSource, c);
  const keys = [], accounts = [];
  for (let i = 0; i < 12; i++) {
    const account = await c.AtlasVisitorAccount.create(true);
    const info = account.info(); accounts.push(account); keys.push(info.publicKey);
    listeners.forEach(fn => fn({ persisted: true }));
    assert.throws(() => account.info(), /ended/);
  }
  assert.equal(new Set(keys).size, 12);
  const fresh = await c.AtlasVisitorAccount.create(true);
  assert.equal(keys.includes(fresh.info().publicKey), false);
  const oldRecord = { esquema: 'atlas.presente/1', seq: 1, prev: 'genesis', clave_publica: keys[0] };
  await assert.rejects(accounts[0].sign(oldRecord, true), /ended/);
});
