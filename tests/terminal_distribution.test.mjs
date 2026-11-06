import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const terminal = require('../public/game/terminal_panel.js');

test('OpenWorld has three leaves, with Tools opened from Welcome', () => {
  assert.deepEqual(terminal.CATS.map((leaf) => leaf.name), ['Welcome', 'Profile', 'Communication', 'Tools']);
  assert.deepEqual(terminal.CATS.filter((leaf) => leaf.button).map((leaf) => leaf.name), ['Welcome', 'Profile', 'Communication']);
  assert.equal(terminal.CATS.find((leaf) => leaf.name === 'Tools').button, false);
  assert.equal(terminal.CATS.find((leaf) => leaf.name === 'Profile').visit, true);
});

test('all seven former content groups map into the agreed leaves', () => {
  for (const speaker of ['Welcome', 'Guide', 'Map', 'Floor', 'Walkers', 'Zoom', 'Tutorial']) {
    assert.equal(terminal.categoryOf(speaker), 'Welcome', speaker);
  }
  assert.equal(terminal.categoryOf('House'), 'Profile');
  assert.equal(terminal.categoryOf('Army'), 'Profile');
  assert.equal(terminal.categoryOf('Radio'), 'Communication');
  assert.equal(terminal.categoryOf('Models'), 'Tools');
});
