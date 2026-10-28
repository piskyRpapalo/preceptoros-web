import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const game = '../public/game/';
const gacha = require(game + 'gacha.js');
const values = require(game + 'valores.js');
const tokens = require(game + 'comic_tokens.js');
const accents = require(game + 'comic_accents.js');
const source = fs.readFileSync(new URL(game + 'wave_render.js', import.meta.url), 'utf8');

function renderer() {
  const root = { AtlasGacha: gacha, AtlasValores: values, AtlasComicTokens: tokens, AtlasComicAccents: accents };
  vm.runInNewContext(source, root, { filename: 'wave_render.js' });
  return root.AtlasOnda;
}

function context() {
  const calls = [];
  const g = {
    canvas: { width: 168, height: 168 },
    save() {}, restore() {}, beginPath() {}, moveTo() {}, lineTo() {},
    arc(...args) { calls.push(['arc', ...args]); }, fill() { calls.push(['fill', this.fillStyle]); },
    stroke() { calls.push(['stroke', this.strokeStyle]); }
  };
  return { g, calls };
}

test('Army wave portrait is a deterministic named-band character with eyes and a mouth', () => {
  const onda = renderer();
  const troop = gacha.tirada('f7b0f1c774f54b6f3efdfd51b2b6a9600380410f45449c38907e61846e4ef729', 'tc3');
  const render = () => {
    const { g, calls } = context();
    onda.dibuja(g, troop.armonicos, 84, 84, 70, { color: 'comic yellow.base', calidad: 2, respira: false, face: true });
    return calls;
  };
  const first = render();
  const second = render();
  assert.deepEqual(first, second, 'same measured wave must draw the same operations');
  assert.equal(first.filter((x) => x[0] === 'arc').length, 4, 'two outlined eyes and two pupils');
  assert(first.some((x) => x[0] === 'stroke' && x[1] === tokens.NEUTRAL.ink), 'face uses the named ink band');
  assert(first.some((x) => x[0] === 'fill' && x[1] === tokens.NEUTRAL.paper), 'eyes use the named paper band');
});

test('Army loader makes the renderer available before the portrait module', () => {
  const loader = fs.readFileSync(new URL('../public/assets/thegame.js', import.meta.url), 'utf8');
  const army = loader.match(/var ARMY = \[([\s\S]*?)\];/);
  assert(army, 'Army module list exists');
  assert(army[1].indexOf('/game/wave_render.js') >= 0, 'Army loads its renderer');
  assert(army[1].indexOf('/game/wave_render.js') < army[1].indexOf('/game/ui-ficha.js'), 'renderer loads before its consumer');
});
