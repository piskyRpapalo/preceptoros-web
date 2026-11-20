/* preceptoros.org · theGame · THREAD WINDOW for Node 0 (Hexelion)
   Grok surgical piece 2026-11-20 · pure · no DOM · no network.
   Session-only chat turns so Node 0 follows the thread instead of re-asking.
   Ephemeral: never claimed as durable identity memory.
   Contract: append after each settled turn; snapshot() for AtlasAulaChat.turn payload.
*/
(function (root) {
  'use strict';
  var MAX_TURNS = 12;
  var MAX_CHARS_PER = 400;
  var MAX_TOTAL = 2400;

  function clip(s, n) {
    s = String(s || '').replace(/\s+/g, ' ').trim();
    if (s.length <= n) return s;
    return s.slice(0, n - 1) + '…';
  }

  function create(opts) {
    var maxTurns = (opts && opts.maxTurns) || MAX_TURNS;
    var maxPer = (opts && opts.maxPer) || MAX_CHARS_PER;
    var maxTotal = (opts && opts.maxTotal) || MAX_TOTAL;
    var turns = [];

    function append(role, text) {
      var r = role === 'you' || role === 'You' ? 'you' : role === 'node0' || role === 'hexelion' || role === 'Node 0' ? 'node0' : 'other';
      turns.push({ role: r, text: clip(text, maxPer) });
      while (turns.length > maxTurns) turns.shift();
      var total = 0;
      for (var i = 0; i < turns.length; i++) total += turns[i].text.length;
      while (total > maxTotal && turns.length > 1) {
        total -= turns[0].text.length;
        turns.shift();
      }
      return turns.length;
    }

    function snapshot() {
      return turns.map(function (t) {
        return { role: t.role, text: t.text };
      });
    }

    function asPromptBlock() {
      if (!turns.length) return '';
      return turns
        .map(function (t) {
          return (t.role === 'you' ? 'Visitor' : 'Node0') + ': ' + t.text;
        })
        .join('\n');
    }

    function clear() {
      turns = [];
    }

    function size() {
      return turns.length;
    }

    return { append: append, snapshot: snapshot, asPromptBlock: asPromptBlock, clear: clear, size: size };
  }

  var api = { create: create, MAX_TURNS: MAX_TURNS, MAX_CHARS_PER: MAX_CHARS_PER, MAX_TOTAL: MAX_TOTAL };
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
    return;
  }
  root.AtlasThreadWindow = api;
})(typeof window !== 'undefined' ? window : globalThis);
