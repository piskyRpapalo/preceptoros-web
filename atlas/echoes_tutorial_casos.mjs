// The existing radio renders at most one tutorial echo, from measured walk progress.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const TW = require('../public/game/tutorial_walk.js');
const source = readFileSync(new URL('../public/assets/radio_message_log.js', import.meta.url), 'utf8');
function setup(log, seals) {
  const nodes = [];
  function element(tag) {
    const n = { tagName: tag, dataset: {}, children: [], attrs: {}, events: {}, _text: '', hidden: false,
      classList: { contains() { return true; }, toggle() {} },
      setAttribute(k, v) { this.attrs[k] = String(v); }, addEventListener(k, f) { this.events[k] = f; }, focus() {}, contains() { return false; },
      appendChild(c) { this.children.push(c); return c; },
      get textContent() { return this._text + this.children.map(c => c.textContent).join(''); },
      set textContent(v) { this._text = String(v); this.children = []; } };
    nodes.push(n); return n;
  }
  const ctx = { document: { createElement: element, addEventListener() {} }, MutationObserver: class { observe() {} },
    AtlasTutorialWalk: TW, AtlasOpenworldView: () => ({ controls: { tutorial: () => ({ log, seals }) } }) };
  vm.runInNewContext(source, ctx); ctx.AtlasRadioChat.monta(element('main'), {});
  nodes.find(n => n.attrs.role === 'tab' && n.textContent === 'Echoes').events.click();
  return { list: nodes.find(n => n.id === 'radio-chat-ecos'), nd: nodes.find(n => n.id === 'radio-chat-no-data') };
}
test('before the first step no mission is invented', () => {
  const x = setup([], { cabin: 'LIVE' }); assert.equal(x.list.children.length, 0); assert.match(x.nd.textContent, /NO_DATA/);
});
test('after the key there is one echo with an honest missing beacon', () => {
  const x = setup([{step:'key',outcome:'played'}], { cabin:'LIVE' });
  assert.equal(x.list.children.length, 1); assert.equal(x.list.children[0].dataset.sello, 'NO_DATA'); assert.match(x.list.textContent, /beelink/);
});
test('a live beacon yields one deterministic mission; no mission remains after completion', () => {
  const log = [{step:'key',outcome:'played'}], seals = {cabin:'LIVE',beelink:'LIVE'};
  const a=setup(log,seals), b=setup(log,seals); assert.equal(a.list.children.length, 1); assert.equal(a.list.textContent,b.list.textContent); assert.equal(a.list.children[0].dataset.sello,'LIVE');
  const done=setup([...log,{step:'beacon',outcome:'played'},{step:'node',outcome:'played'}],seals); assert.equal(done.list.children.length,0);
});
