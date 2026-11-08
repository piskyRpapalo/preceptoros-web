// The visitor view: technical panels are always veiled; the button that showed them is retired (Sovereign, 2026-11-08).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const V = require('../../public/game/visitor_view.js');
const HTML = readFileSync(new URL('../../public/openworld/index.html', import.meta.url), 'utf8');
const CSS = readFileSync(new URL('../../public/assets/openworld.css', import.meta.url), 'utf8');

function fakeDoc(nTech, withButton = 0) {
  const cls = new Set(['voices']), attrs = {}, handlers = {}, speakers = {}, kids = [];
  ['Map', 'Floor', 'Walkers', 'Zoom'].forEach((s, i) => { speakers[s] = { attrs: {}, setAttribute(k, v) { this.attrs[k] = v; }, querySelector: () => (i < withButton ? {} : null) }; });
  const list = { classList: { toggle: (c, on) => (on ? cls.add(c) : cls.delete(c)), has: (c) => cls.has(c) },
    querySelector: (q) => speakers[/"([^"]+)"/.exec(q)[1]] || null,
    querySelectorAll: () => Object.values(speakers).slice(0, nTech).filter((e) => e.attrs['data-depth'] === 'tech'),
    appendChild: (n) => kids.push(n) };
  const btn = { textContent: '', setAttribute: (k, v) => (attrs[k] = v), addEventListener: (e, f) => (handlers[e] = f) };
  const li = { setAttribute() {}, appendChild() {} };
  const doc = { getElementById: (id) => (id === 'voices' ? list : null), createElement: (t) => (t === 'button' ? btn : li) };
  return { doc, cls, attrs, btn, kids, speakers, click: () => handlers.click() };
}
test('mount veils the four technical panels for good and adds no button', () => {
  const f = fakeDoc(4);
  const v = V.mount(f.doc);
  assert.equal(v.count(), 4);
  assert.ok(f.cls.has('visitor'));
  assert.equal(f.kids.length, 0, 'the «Show the technical panels» button is retired');
  assert.deepEqual(V.TECH, ['Map', 'Floor', 'Walkers', 'Zoom']);
  assert.ok(Object.values(f.speakers).every((e) => e.attrs['data-depth'] === 'tech'));
  assert.equal(V.depth, undefined); assert.equal(V.label, undefined);
  assert.match(CSS, /#voices\.visitor>\[data-depth=tech\]:not\(:has\(button\)\)\{display:none\}/);
  assert.ok(HTML.indexOf('/game/visitor_view.js') < HTML.indexOf('/game/openworld_page.js'));
});

test('a technical panel with something to press (HITL Needs you) is never veiled and not counted', () => {
  const f = fakeDoc(4, 1);
  assert.equal(V.mount(f.doc).count(), 3);
});

test('the app card is honest: installed, offered, or the browser menu', () => {
  const V = require('../../public/game/visitor_view.js');
  assert.equal(V.install({ instalada: () => true, instalable: () => true }).mode, 'installed');
  assert.equal(V.install({ instalada: () => false, instalable: () => true }).text, 'Install the app on this phone');
  assert.equal(V.install(null).mode, 'menu');
  assert.match(V.install({ instalada: () => false, instalable: () => false }).text, /Add to Home screen/);
});
