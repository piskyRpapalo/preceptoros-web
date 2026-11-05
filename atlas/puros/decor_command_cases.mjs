import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const C = require('./decor_command.js');
const nodes = [{ id: 'n0', q: 0, r: 0 }, { id: 'n1', q: 1, r: 0 }];
const props = [{ id: 'prop-a', q: 0, r: 0 }];
const destinations = [{ q: 0, r: 0 }, { q: 1, r: 0 }];
const context = { seed: 29, props, destinations, nodes };
const response = () => JSON.stringify({ schema: C.VERSION, verb: 'MOVER', prop: 'prop-a', destination: { q: 1, r: 0 }, seed: 29 });

test('prompt contract is deterministic and carries only supplied order, seed and allowlists', () => {
  const first = C.request('move the prop east', 29, ['prop-a'], destinations);
  const second = C.request('move the prop east', 29, ['prop-a'], destinations);
  assert.equal(JSON.stringify(first), JSON.stringify(second));
  assert.equal(first.output.seed, 29);
  assert.deepEqual(first.allowed.destinations, destinations);
});

test('judge maps one exact command to the existing deterministic MOVER verb', () => {
  const first = C.judge(response(), context);
  const second = C.judge(response(), context);
  assert.equal(JSON.stringify(first), JSON.stringify(second));
  assert.equal(first.movement.schema, 'preceptoros.decor-move/1');
  assert.deepEqual(first.movement.moves[0].to, { q: 1, r: 0 });
});

test('empty response remains caused NO_DATA and malformed JSON is rejected', () => {
  assert.throws(() => C.judge('', context), /NO_DATA: model response is empty/);
  assert.throws(() => C.judge('not json', context), /not JSON/);
});

test('extra fields, wrong verb, untrusted seed, unknown prop and destination are refused', () => {
  const mutations = [
    command => { command.extra = true; },
    command => { command.verb = 'RUN'; },
    command => { command.seed = 30; },
    command => { command.prop = 'unknown'; },
    command => { command.destination.q = 9; }
  ];
  for (const mutate of mutations) {
    const command = JSON.parse(response());
    mutate(command);
    assert.throws(() => C.judge(JSON.stringify(command), context));
  }
});

test('request and judge have no model, network, random, clock or filesystem path', () => {
  assert.throws(() => C.request('x\ny', 1, ['prop-a'], destinations), /one non-empty line/);
  const source = readFileSync(new URL('./decor_command.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /Math\.random|Date\.now|new Date|performance\.now|fetch\(|XMLHttpRequest|child_process|require\(['"]fs/);
});
