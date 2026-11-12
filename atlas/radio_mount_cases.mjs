// Radio layer 2 mounted on /openworld/ (C6 · H9): the real radio log with the real frame, a deterministic DOM and a
// fake audio context. Tone is off until pressed; every line carries the frame's id; a missing tone says its cause.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const read = (p) => readFileSync(new URL('../public/' + p, import.meta.url), 'utf8');
const FRAME = ['game/semantic_table.js', 'game/bb_radio.js', 'game/radio_frame.js'];

function radio({ frame = true, audio = true, cycle = 5 } = {}) {
  const nodes = [], played = [];
  function element(tag) {
    const n = { tagName: tag, dataset: {}, children: [], style: {}, attrs: {}, events: {}, _text: '', hidden: false, title: '',
      classList: { contains() { return true; }, toggle() {} },
      setAttribute(k, v) { this.attrs[k] = String(v); }, getAttribute(k) { return this.attrs[k]; },
      addEventListener(k, f) { this.events[k] = f; }, focus() {}, contains() { return false; },
      appendChild(child) { this.children.push(child); return child; },
      get textContent() { return this._text + this.children.map((x) => x.textContent).join(''); },
      set textContent(v) { this._text = String(v); this.children = []; } };
    nodes.push(n); return n;
  }
  const context = { document: { createElement: element, addEventListener() {} }, MutationObserver: class { observe() {} },
    AtlasJuego: { instantanea: () => ({ ciclo: cycle }) } };
  if (audio) {
    context.AudioContext = class {
      constructor() { this.state = 'running'; this.destination = {}; }
      createBuffer(ch, length, sr) { const data = new Float32Array(length); return { length, sr, getChannelData: () => data }; }
      createBufferSource() { return { connect() {}, start() { played.push(this.buffer.length); } }; }
    };
  }
  vm.createContext(context);
  for (const f of frame ? FRAME : []) vm.runInContext(read(f), context);
  vm.runInContext(read('assets/radio_message_log.js'), context);
  context.AtlasRadioChat.monta(element('main'), {});
  const byId = (id) => nodes.find((n) => n.id === id);
  return { api: context.AtlasRadioChat, frame: context.AtlasRadioFrame, nodes, played, button: byId('radio-chat-tono'), note: byId('radio-chat-tono-nota') };
}
const bubbles = (r) => r.nodes.find((n) => n.id === 'radio-chat-lista').children;
let total = 0;
function check(name, run) { try { run(); total++; } catch (e) { e.message = name + ': ' + e.message; throw e; } }

check('tone is off until the visitor presses it', () => {
  const r = radio();
  assert.equal(r.button.attrs['aria-pressed'], 'false');
  assert.equal(r.button.textContent, 'Tone: off');
  assert.ok(r.button.className.includes('radio-chat-tab'));          // the 44 px tab style, no new CSS bytes
  r.api.dice({ texto: 'The reef is calm', fuente: 'state' });
  assert.equal(r.played.length, 0);
});
check('every line carries the frame id, and the four readings share it', () => {
  const r = radio();
  r.api.dice({ texto: 'The reef is calm', fuente: 'state' });
  r.api.dice({ texto: 'NO_DATA: no tide sensor', fuente: 'state' });
  const ids = bubbles(r).map((b) => b.dataset.evento);
  assert.equal(ids.length, 2);
  ids.forEach((id) => assert.match(id, /^radio\.[0-9a-f]{8}$/));
  const four = JSON.parse(JSON.stringify(r.api.lecturas()));   // another vm realm: compare plain copies
  assert.deepEqual(four.map((x) => x.id), ids);
  assert.deepEqual(four.map((x) => x.machine.seal), ['LIVE', 'NO_DATA']);
  assert.ok(four[0].ear.samples > 0 && typeof four[0].reader === 'string');
  assert.match(four[1].ear.cause, /^NO_DATA: this line is not measured/);
});
check('pressing plays a short cue of the last line, then every new line', () => {
  const r = radio();
  r.api.dice({ texto: 'The reef is calm', fuente: 'state' });
  r.button.events.click();
  assert.equal(r.button.attrs['aria-pressed'], 'true');
  assert.equal(r.button.textContent, 'Tone: on');
  assert.equal(r.played.length, 1);
  const cue = r.played[0], full = r.frame.sound({ seal: 'LIVE', source: 'state', cycle: 5, text: 'x' }).samples.length;
  assert.ok(cue > 0 && cue < full);                                     // a prefix of the full tone, never another sound
  r.api.dice({ texto: 'A crab arrived', fuente: 'state' });
  assert.equal(r.played.length, 2);
  assert.equal(r.note.hidden, true);
  r.button.events.click();
  r.api.dice({ texto: 'A crab left', fuente: 'state' });
  assert.equal(r.played.length, 2);
});
check('a line that was not measured has no tone, and says so', () => {
  const r = radio();
  r.api.tono(true);
  const out = r.api.dice({ texto: 'NO_DATA: no tide sensor', fuente: 'state' });
  assert.equal(out.sello, 'NO_DATA');
  assert.equal(r.played.length, 0);
  assert.equal(r.note.hidden, false);
  assert.match(r.note.textContent, /^NO_DATA: this line is not measured/);
  assert.equal(r.note.attrs.role, undefined);                           // visible text, not a second announcement
});
check('no audio context in this browser', () => {
  const r = radio({ audio: false });
  r.api.dice({ texto: 'The reef is calm', fuente: 'state' });
  const out = r.api.tono(true);
  assert.equal(out.played, false);
  assert.equal(out.cause, 'NO_DATA: this browser gave no audio context');
  assert.equal(r.note.textContent, out.cause);
  r.api.tono(false);
  assert.equal(r.note.hidden, true);
  assert.equal(r.note.textContent, '');
});
check('page without the frame: ids and tone say NO_DATA, nothing throws', () => {
  const r = radio({ frame: false });
  r.api.dice({ texto: 'The reef is calm', fuente: 'state' });
  assert.equal(bubbles(r)[0].dataset.evento, 'NO_DATA');
  assert.equal(r.api.lecturas().length, 0);
  assert.match(r.api.tono(true).cause, /radio frame is not loaded/);
});
check('same line, same id across two mounts', () => {
  const a = radio(), b = radio();
  a.api.dice({ texto: 'The reef is calm', fuente: 'state' }); b.api.dice({ texto: 'The reef is calm', fuente: 'state' });
  assert.equal(bubbles(a)[0].dataset.evento, bubbles(b)[0].dataset.evento);
});
check('/openworld/ loads the frame after the semantic table and before the radio log', () => {
  const html = read('openworld/index.html'), at = (s) => html.indexOf('<script src="' + s + '"></script>');
  const order = ['/game/semantic_table.js', '/game/bb_radio.js', '/game/radio_frame.js', '/assets/radio_message_log.js'].map(at);
  order.forEach((i) => assert.ok(i > 0));
  assert.deepEqual(order, order.slice().sort((x, y) => x - y));
});
console.log('radio mount cases: ' + total + '/8 OK');
