import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const source = readFileSync(new URL('../public/assets/descent_view.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../public/assets/descent.css', import.meta.url), 'utf8');
class Element {
  constructor(tag) { this.tagName = tag.toUpperCase(); this.children = []; this.attrs = {}; this.events = {}; this._text = ''; this.style = { setProperty() {} }; }
  get textContent() { return this._text + this.children.map(n => n.textContent).join(''); }
  set textContent(text) { this._text = String(text); this.children = []; }
  appendChild(node) { this.children.push(node); return node; }
  insertBefore(node, before) { this.children.splice(Math.max(0, this.children.indexOf(before)), 0, node); }
  setAttribute(key, value) { this.attrs[key] = String(value); }
  addEventListener(key, fn) { (this.events[key] ||= []).push(fn); }
  removeEventListener(key, fn) { this.events[key] = (this.events[key] || []).filter(f => f !== fn); }
  getContext() { return new Proxy({}, { get: (o, key) => o[key] || (() => {}), set: (o,key,v) => (o[key]=v,true) }); }
  getBoundingClientRect() { return { top: 0, height: 600 }; }
  click() { if (!this.disabled) (this.events.click || []).forEach(f => f()); }
}
const all = node => [node, ...node.children.flatMap(all)];
const hasClass = (node, name) => (node.className || '').split(' ').includes(name);
function fixture() {
  const calls = { exit: 0, identity: 0, tutorial: 0, audio: 0, sound: 0, close: 0, draw: 0, observer: 0 };
  const events = {};
  const scene = { SECTIONS: ['FIRST','LAST'], CANVAS: { w: 412, h: 515 }, TEXT: { FIRST: {}, LAST: {} },
    items() { calls.draw++; return []; }, frame(id) { return { v: 'preceptoros.bubble/1', id, atoms: [], motion: 'NO_DATA' }; } };
  const window = { document: { documentElement: { lang: 'en' }, createElement: tag => new Element(tag), createTextNode: text => { const n = new Element('text'); n.textContent = text; return n; } },
    AtlasCodexScene: scene, AtlasComicTokens: { NEUTRAL: { ink: 'ink', paper: 'paper', ocean: 'ocean', cyan: 'cyan' } },
    AtlasComicAccents: { ACCENTS: { vermilion: { bands: { base: 'vermilion.base' } }, 'comic yellow': { bands: { base: 'comic yellow.base' } } } },
    AtlasComicAtoms: { paint() {} }, AtlasBubble: { hash32() { return 1; } },
    AtlasDescentSound: { score() { return { voices: [] }; }, describe() { return 'silence'; }, play() { calls.sound++; } },
    Identity: { crear() { calls.identity++; return Promise.resolve(); } }, TheGame: { tutorial() { calls.tutorial++; } },
    AudioContext: class { constructor() { calls.audio++; } close() { calls.close++; return Promise.resolve(); } },
    IntersectionObserver: class { constructor() { calls.observer++; } observe() {} disconnect() {} },
    addEventListener(key, fn) { (events[key] ||= []).push(fn); }, removeEventListener() {}, matchMedia() { return { matches: false }; } };
  window.window = window;
  runInNewContext(source, window);
  const panel = new Element('main');
  return { window, panel, calls, events, mount() { window.AtlasDescentView.monta(panel, () => calls.exit++); } };
}
test('G1 retires chapter scrolling, animation selectors, and the duplicate language selection', () => {
  const f = fixture(); f.mount(); const nodes = all(f.panel);
  assert(!nodes.some(n => ['descent-step','descent-intro','descent-langs'].some(c => hasClass(n,c))));
  assert(!nodes.some(n => n.tagName === 'A'));
  assert.equal(f.calls.observer, 0); assert.equal(f.events.scroll?.length || 0, 0);
  assert(!nodes.some(n => (n.events.scroll || []).length));
  assert.equal(f.window.AtlasDescenso.frame(0).id, 'LAST');
  assert.deepEqual(f.window.AtlasDescenso.frame(0), f.window.AtlasDescenso.frame(12000));
  assert.equal(f.calls.draw, 1);
});
test('the approved title and explicit entry choices remain available immediately', () => {
  const f = fixture(); f.mount(); const nodes = all(f.panel);
  assert(f.panel.textContent.includes('Your own place, by your choice'));
  assert(f.panel.textContent.includes('AI Safe'));
  for (const label of ['Start the guided tutorial','Check the rift',"Create this device's key",'Questions???']) assert(nodes.some(n => n.textContent === label), label);
  assert.deepEqual([f.calls.exit,f.calls.identity,f.calls.tutorial], [0,0,0]);
  nodes.find(n => hasClass(n,'descent-skip')).click(); assert.equal(f.calls.exit,1);
  nodes.find(n => hasClass(n,'descent-account')).click(); assert.equal(f.calls.identity,1);
  const tutorial = nodes.find(n => hasClass(n,'descent-tutorial')); tutorial.click(); tutorial.click(); assert.equal(f.calls.tutorial,2);
});
test('sound starts only on a gesture and remount closes the owned context', () => {
  const f = fixture(); f.mount(); assert.equal(f.calls.audio,0); assert.equal(f.calls.sound,0);
  all(f.panel).find(n => hasClass(n,'descent-sound-toggle')).click();
  assert.equal(f.calls.audio,1); assert.equal(f.calls.sound,1);
  f.mount(); assert.equal(f.calls.close,1);
});
test('cold and invalid reads report NO_DATA with a cause', () => {
  const f=fixture(); assert.match(f.window.AtlasDescenso.frame(0).cause,/not mounted/);
  f.mount(); assert.match(f.window.AtlasDescenso.frame(NaN).cause,/finite/);
});
test('Questions keeps honest engine states and no language chooser', () => {
  const f=fixture(); f.mount();
  assert(f.panel.textContent.includes('NO_DATA')); assert(f.panel.textContent.includes('this browser offers no built-in model'));
  assert.doesNotMatch(source,/Choose your language|var LANGS|For kids|IntersectionObserver|requestAnimationFrame/);
});
test('the remaining view uses local DOM, named bands, and accessible targets', () => {
  assert.doesNotMatch(source,/innerHTML|outerHTML|insertAdjacentHTML|\beval\(|\bfetch\(|Math\.random|\bDate\b/);
  assert.doesNotMatch(source,/#[0-9a-f]{6}\b/i);
  assert(source.length < 16384); assert(Buffer.byteLength(css) < 16384);
  for (const selector of ['descent-enter','descent-account','descent-tutorial','descent-ask-open','descent-sound-toggle']) {
    assert.match(css,new RegExp('\\.'+selector+'\\s*\\{[^}]*min-height:\\s*(?:4[4-9]|[5-9]\\d)px'),selector);
  }
});
