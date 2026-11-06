import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const scope = {};
runInNewContext(readFileSync(new URL('../public/game/web_node_brain.js', import.meta.url), 'utf8'), scope);

test('movement answers use current page controls even when the model invents obsolete controls', () => {
  const stale = scope.AtlasWebNodeBrain.groundAnswer('How do I move my character?', 'Use arrow keys to move or press the joystick.');
  assert.equal(stale.source, 'page-controls');
  assert.equal(stale.text, 'Tap a hex to walk, or open Welcome and choose a node place; press Enter on a focused place to go in. The view joystick pans the map; its arrow keys work only while it has focus.');
  assert.doesNotMatch(stale.text, /arrow keys to move|joystick to walk/i);
  assert.doesNotMatch(stale.text, /Map panel/i, 'the guide must name the final Welcome control');
});

test('other answers remain model answers and keep their source distinct', () => {
  const answer = scope.AtlasWebNodeBrain.groundAnswer('What is this cabin?', 'A tutorial cabin.');
  assert.equal(answer.text, 'A tutorial cabin.');
  assert.equal(answer.source, 'model');
});
