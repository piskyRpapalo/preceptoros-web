import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function runRadio(voices) {
  const requests = [];
  const spoken = [];
  class Element {
    constructor(tag) { this.tagName = tag.toUpperCase(); this.children = []; this.listeners = {}; this.textContent = ''; this.className = ''; this.style = {}; this.open = false; }
    appendChild(node) { this.children.push(node); return node; }
    setAttribute(name, value) { this[name] = value; }
    addEventListener(name, fn) { this.listeners[name] = fn; }
    querySelector(selector) { return this.children.find(node => selector === '.radio-estado' && node.className.split(' ').includes('radio-estado')) || null; }
    click() { this.listeners.click?.(); }
    getBoundingClientRect() { return { width: 44, height: 44 }; }
  }
  const root = {
    document: { createElement: tag => new Element(tag) },
    speechSynthesis: { getVoices: () => voices, cancel() {}, speak: utterance => spoken.push(utterance) },
    SpeechSynthesisUtterance: class { constructor(text) { this.text = text; } },
    fetch: (...args) => requests.push(['fetch', ...args]),
    XMLHttpRequest: class { open(...args) { requests.push(['xhr', ...args]); } },
    WebSocket: class { constructor(...args) { requests.push(['websocket', ...args]); } },
    navigator: { sendBeacon: (...args) => requests.push(['beacon', ...args]) },
    AtlasJuego: { instantanea: () => null },
    setTimeout: () => 0
  };
  vm.runInNewContext(readFileSync(new URL('../public/game/aiact-art50-state-radio.js', import.meta.url), 'utf8'), root);
  const panel = new Element('section');
  root.AtlasRadio.monta(panel);
  const radio = panel.querySelector('.radio-estado');
  return { root, radio, buttons: radio.children.filter(node => node.tagName === 'BUTTON'), requests, spoken };
}

const local = runRadio([{ name: 'Local English', lang: 'en-US', localService: true }, { name: 'Remote English', lang: 'en-US', localService: false }]);
const hi = local.buttons.find(button => button.textContent === 'Say Hi');
assert.ok(hi, 'radio exposes the Say Hi handshake');
const css = readFileSync(new URL('../public/assets/thegame.css', import.meta.url), 'utf8');
assert.match(css, /\.radio-say-hi\{min-width:44px;min-height:44px\}/, 'handshake meets the 44 px target');
hi.click();
assert.equal(local.spoken.length, 1, 'handshake speaks only after a gesture');
assert.equal(local.spoken[0].voice.name, 'Local English', 'handshake selects a local English voice');
assert.match(local.radio.children.map(node => node.textContent).join(' '), /Hello from Radio Atlantis/, 'handshake greeting remains visible');
assert.deepEqual(local.requests, [], 'offline handshake makes zero network requests');

const noVoice = runRadio([]);
const noVoiceHi = noVoice.buttons.find(button => button.textContent === 'Say Hi');
assert.ok(noVoiceHi, 'handshake remains available without a local voice');
noVoiceHi.click();
assert.equal(noVoice.spoken.length, 0, 'no remote voice is used');
assert.match(noVoice.radio.children.map(node => node.textContent).join(' '), /NO_DATA: no local English voice/, 'missing local voice has a visible cause');
assert.deepEqual(noVoice.requests, [], 'no-voice path makes zero network requests');
console.log('PASS radio phase 1 local handshake, text fallback, and zero-network contract');
