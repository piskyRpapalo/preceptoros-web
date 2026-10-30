// DE-2 · closed command judge. Model invocation stays outside this pure adapter.
(function (root) {
  'use strict';
  var common = typeof module === 'object' && module.exports;
  var M = common ? require('./decor_mover.js') : root.AtlasDecorMover;
  var VERSION = 'preceptoros.decor-command/1';

  function fail(cause) { throw new Error('decor_command: ' + cause); }
  function exact(value, names) {
    return value && typeof value === 'object' && !Array.isArray(value) &&
      Object.keys(value).sort().join(',') === names.slice().sort().join(',');
  }

  // The caller supplies a bounded natural-language order and the trusted seed.
  // This builds a prompt contract only; it performs no inference or I/O.
  function request(order, seed, props, destinations) {
    if (typeof order !== 'string' || !order.trim() || order.length > 240 || /[\r\n]/.test(order)) {
      fail('order must be one non-empty line of at most 240 characters');
    }
    if (!Number.isSafeInteger(seed) || seed < 0) { fail('trusted seed must be a non-negative safe integer'); }
    if (!Array.isArray(props) || !props.length || props.some(function (id) { return typeof id !== 'string' || !id; })) {
      fail('measured prop ids are required');
    }
    if (!Array.isArray(destinations) || !destinations.length || destinations.some(function (cell) {
      return !exact(cell, ['q', 'r']) || !Number.isSafeInteger(cell.q) || !Number.isSafeInteger(cell.r);
    })) { fail('measured destination cells are required'); }
    return {
      schema: VERSION,
      order: order.trim(),
      seed: seed,
      allowed: { props: props.slice(), destinations: destinations.map(function (cell) { return { q: cell.q, r: cell.r }; }) },
      output: { schema: VERSION, verb: 'MOVER', prop: 'one allowed prop id', destination: { q: 'integer', r: 'integer' }, seed: seed }
    };
  }

  // Only the exact closed JSON object can reach DE-1. Raw model text is never
  // echoed, persisted, or interpreted as executable content.
  function judge(raw, context) {
    if (typeof raw !== 'string' || !raw.trim()) { fail('NO_DATA: model response is empty'); }
    var command;
    try { command = JSON.parse(raw); } catch (_) { fail('response is not JSON'); }
    if (!exact(command, ['schema', 'verb', 'prop', 'destination', 'seed']) ||
        command.schema !== VERSION || command.verb !== 'MOVER' ||
        typeof command.prop !== 'string' || !exact(command.destination, ['q', 'r']) ||
        !Number.isSafeInteger(command.destination.q) || !Number.isSafeInteger(command.destination.r) ||
        !Number.isSafeInteger(command.seed) || command.seed !== context.seed) {
      fail('command does not match the closed trusted request');
    }
    var props = context.props || [];
    var prop = props.find(function (item) { return item.id === command.prop; });
    if (!prop) { fail('prop is outside the measured allowlist'); }
    var destinations = context.destinations || [];
    if (!destinations.some(function (cell) { return cell.q === command.destination.q && cell.r === command.destination.r; })) {
      fail('destination is outside the measured allowlist');
    }
    var script = M.inColony(context.nodes)(prop, command.destination, command.seed);
    return { schema: VERSION, command: command, movement: script };
  }

  var API = { VERSION: VERSION, request: request, judge: judge };
  if (common) { module.exports = API; }
  else { root.AtlasDecorCommand = API; }
})(typeof globalThis === 'object' ? globalThis : this);
