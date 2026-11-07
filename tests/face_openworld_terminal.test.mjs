import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const page = fs.readFileSync(path.join(root, 'public/face/basic.html'), 'utf8');
const armyPage = fs.readFileSync(path.join(root, 'public/game/army.html'), 'utf8');
const glue = fs.readFileSync(path.join(root, 'public/face/face_openworld_terminal.js'), 'utf8');
const stateFile = JSON.parse(fs.readFileSync(path.join(root, 'public/openworld/state.json'), 'utf8'));
const readState = require('../public/game/openworld_state.js');
const controls = require('../public/game/colony_controls.js');

test('Neutral terminal renders and moves only on the shared colony state', () => {
  assert.doesNotMatch(page, /face_world\.js|src="\/face\/face\.js"|id="packet"/);
  assert.match(page, /src="\/game\/openworld_state\.js"/);
  assert.match(page, /src="\/game\/colony_controls\.js"/);
  assert.match(glue, /fetch\('\/openworld\/state\.json'/);
  assert.match(glue, /OS\.leer\(data\)/);
  assert.match(glue, /CC\.move\(walker, name, colony\.nodes\)/);
  const parsed = readState.leer(stateFile);
  assert.deepEqual(parsed.colonia.nodes.map((node) => node.id), []);
  assert.ok(!stateFile.colonia.nodes.some((node) => node.id === 'cabin'), 'the tutorial cabin is retired from the served state');
  const result = controls.move({ node: 'none', q: 0, r: 0 }, 'east', parsed.colonia.nodes);
  assert.equal(result.ok, false);
  assert.match(result.cause, /NO_DATA/);
  assert.equal(stateFile.colonia.nodes.find((node) => node.id === 'beelink').seal, 'NO_DATA');
});

test('Army deep link does not render a second map or synthetic account army', () => {
  assert.match(armyPage, /NO_DATA/);
  assert.match(armyPage, /SHA-256 profile/);
  assert.match(armyPage, /href="\/openworld\/"/);
  assert.doesNotMatch(armyPage, /\/face\/basic\.html|shared map/i);
  assert.doesNotMatch(armyPage, /<svg|<canvas|synthetic seeded waves/i);
});
