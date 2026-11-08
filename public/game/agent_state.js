// Agent state table (E4+B5). Pure: the table arrives as data. Fail-closed: illegal step = NO_DATA, no repair.
(function (root) {
  'use strict';
  var common = typeof module === 'object' && module.exports;
  var NAMES = ['ready', 'working', 'needs-you', 'unavailable'];
  var SNAKE = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/;

  function obj(x) { return x !== null && typeof x === 'object'; }
  function has(o, k) { return obj(o) && Object.prototype.hasOwnProperty.call(o, k); }
  function isState(s) { return NAMES.indexOf(s) !== -1; }

  // valida(table) → list of failures; [] when sound.
  function valida(table) {
    var f = [];
    if (!obj(table) || !has(table, 'states') || !has(table, 'table')) { return ['table_incomplete']; }
    if (!obj(table.states) || Object.keys(table.states).sort().join('|') !== NAMES.slice().sort().join('|')) {
      f.push('states_not_exact');
    }
    if (!isState(table.start)) { f.push('start_unknown'); }
    NAMES.forEach(function (n) {
      var s = has(table.states, n) ? table.states[n] : null;
      if (!obj(s) || typeof s.shape !== 'string' || !s.shape || typeof s.text !== 'string' || !s.text) {
        f.push('shape_or_text_missing:' + n);
      }
    });
    if (!has(table.states, 'unavailable') || table.states.unavailable.cause_required !== true) {
      f.push('unavailable_no_cause_required');
    }
    if (!Array.isArray(table.causes) || table.causes.length === 0) { f.push('causes_empty'); }
    else {
      table.causes.forEach(function (c) {
        if (typeof c !== 'string' || !SNAKE.test(c)) { f.push('cause_not_snake:' + c); }
      });
    }
    if (!obj(table.table)) { f.push('table_missing'); }
    else {
      Object.keys(table.table).forEach(function (from) {
        if (!isState(from) || !obj(table.table[from])) { f.push('table_from_unknown:' + from); return; }
        Object.keys(table.table[from]).forEach(function (ev) {
          if (!isState(table.table[from][ev])) { f.push('table_to_unknown:' + from + '.' + ev); }
        });
      });
    }
    return f;
  }

  // step(table, state, event, cause) → {state, cause}, or NO_DATA. Only 'unavailable' carries a cause.
  function step(table, state, event, cause) {
    if (!has(table.table, state) || !has(table.table[state], event)) {
      return { state: 'NO_DATA', cause: 'agent_illegal_transition', from: state, event: event };
    }
    var to = table.table[state][event];
    if (to !== 'unavailable') { return { state: to, cause: '' }; }
    if (Array.isArray(table.causes) && table.causes.indexOf(cause) !== -1) { return { state: to, cause: cause }; }
    return { state: 'NO_DATA', cause: 'unavailable_without_measured_cause' };
  }

  // replay(table, events) → final state, or NO_DATA with index of the first failure.
  function replay(table, events) {
    var cur = { state: table.start, cause: '' }, i, e, r;
    for (i = 0; i < events.length; i++) {
      e = events[i] || {};
      r = step(table, cur.state, e.event, e.cause);
      if (r.state === 'NO_DATA') { return Object.assign({}, r, { index: i }); }
      cur = r;
    }
    return cur;
  }

  // view(table, result) → {shape, text, say}.
  function view(table, result) {
    var s = has(table.states, result.state) ? table.states[result.state] : null;
    if (!s) { return { shape: 'dash', text: 'NO_DATA', say: 'NO_DATA · ' + result.cause }; }
    var say = result.state === 'unavailable' ? s.text + ' · ' + result.cause : s.text;
    return { shape: s.shape, text: s.text, say: say };
  }

  // wake: an agent out of view sleeps and never calls compute.
  function wake(visible, compute) {
    return visible !== true ? { asleep: true } : { asleep: false, value: compute() };
  }

  var AtlasAgentState = { valida: valida, step: step, replay: replay, view: view, wake: wake };
  if (common) { module.exports = AtlasAgentState; }
  else { root.AtlasAgentState = AtlasAgentState; }
})(typeof globalThis === 'object' ? globalThis : this);
