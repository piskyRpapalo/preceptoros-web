// SALA-C · the register of voices of the ecosystem room (decree ·6588150676; Mesa order of 2026-11-02). Level: LEY.
// One Acho card per voice: who speaks, with what measured brain, and what a voice may do without a benchcard.
// Only measured fields; the rest is NO_DATA with its cause. Pure: no DOM, no network, no clock, no Math.random.
(function (raiz) {
  'use strict';

  var V = 'preceptoros.acho/1';
  // estado: VIVA (speaks, seal of its own message) · SIN_BENCHCARD (speaks, every message sealed NO_DATA)
  //         VACANTE (seat empty: refused) · PRIVADA (outside GitHub by decree: refused, nothing about it here)
  //         NO_DATA (not measured yet: refused until its census)
  var VOCES = [
    { id: 'soberano', rol: 'the Sovereign: speaks from the panel; quoted by a Mesa, the words are a signature', estado: 'VIVA', cerebro: 'carbon' },
    { id: 'mesa', rol: 'the orchestrators: acts, signatures and coordination', estado: 'VIVA', cerebro: 'NO_DATA: one per train, model not fixed' },
    { id: 'codex', rol: 'Conde Codex, the Codex preceptor', estado: 'VIVA', cerebro: 'NO_DATA: model not measured in this register' },
    { id: 'claude-acho', rol: 'the Claude preceptor of the Acho train', estado: 'VIVA', cerebro: 'claude (frontier)' },
    { id: 'claude-tf', rol: 'the Claude preceptor of the Terminal Familia train', estado: 'VIVA', cerebro: 'claude (frontier)' },
    { id: 'escriba', rol: 'the writer of the organism', estado: 'VIVA', cerebro: 'Nemotron-30B', medida: '67.05 tok/s · 19 GB · ·6587300702' },
    { id: 'oraculo', rol: 'the oracle', estado: 'VIVA', cerebro: 'gpt-oss:120b', medida: '34.05 tok/s · ctx 65536 · containment PARTIAL' },
    { id: 'tentaculo', rol: 'the tentacle, with a judge', estado: 'VIVA', cerebro: 'Kimi-48B', medida: '64.78 tok/s' },
    { id: 'sabio', rol: 'the sage', estado: 'VACANTE', causa: 'candidate discarded by benchcard: it fabricated its identity (·6588111541)' },
    { id: 'hexelion-estacion', rol: 'the station model of the fleet: the interim voice of Hexelion while its bodies forge', estado: 'SIN_BENCHCARD', cerebro: 'NO_DATA: 70B class; model name pending the census' },
    { id: 'privada-1', rol: 'NO_DATA', estado: 'PRIVADA', causa: 'private by decree' },
    { id: 'nodo-sdr', rol: 'a fleet node', estado: 'NO_DATA', causa: 'device voice not measured until the census (H6)' },
    { id: 'nodo-git', rol: 'a fleet node', estado: 'NO_DATA', causa: 'device voice not measured until the census (H6)' },
    { id: 'nodo-movil', rol: 'a fleet node (1B/3B minis)', estado: 'NO_DATA', causa: 'device voice not measured until the census (H6)' }
  ];
  var SELLO_ESTADO = { VIVA: 'LIVE', SIN_BENCHCARD: 'NO_DATA', VACANTE: 'NO_DATA', PRIVADA: 'NO_DATA', NO_DATA: 'NO_DATA' };

  function busca(id) { for (var i = 0; i < VOCES.length; i++) { if (VOCES[i].id === id) { return VOCES[i]; } } return null; }

  // regla(id) → what the room does with a message of that voice: { puede, sello, causa }.
  // A voice without a benchcard speaks, but its message is sealed NO_DATA; empty, private or unmeasured seats are refused.
  function regla(id) {
    var v = busca(id);
    if (!v) { return { puede: false, sello: 'NO_DATA', causa: 'unknown voice: ' + String(id) }; }
    if (v.estado === 'VIVA') { return { puede: true, sello: null, causa: '' }; }
    if (v.estado === 'SIN_BENCHCARD') { return { puede: true, sello: 'NO_DATA', causa: 'no benchcard: its words are not measured' }; }
    return { puede: false, sello: 'NO_DATA', causa: v.causa || v.estado };
  }

  // ficha(id) → the voice's Acho card (under 1,024 B). Colour only by named band; the sentence says the state.
  function ficha(id) {
    var v = busca(id);
    if (!v) { return null; }
    var frase = v.id + ': ' + v.rol + '. State ' + v.estado + (v.cerebro ? '. Brain ' + v.cerebro : '') +
      (v.medida ? ' (' + v.medida + ')' : '') + (v.causa ? '. Cause: ' + v.causa : '') + '.';
    return {
      v: V, id: 'voz-' + v.id, t: 0, seal: SELLO_ESTADO[v.estado],
      atoms: [{ k: v.id, r: frase, i: [{ o: 'text', x: 8, y: 20, tx: v.id, sz: 14, f: 'ink' }] }],
      bands: ['ink'], change: [frase],
      sound: 'NO_DATA: a voice card declares no sound', soundCause: 'the register is text; the voice sounds in the room'
    };
  }

  var AtlasSalaVoces = Object.freeze({ VOCES: VOCES, regla: regla, ficha: ficha, ids: function () { return VOCES.map(function (v) { return v.id; }); } });
  if (typeof module === 'object' && module.exports) { module.exports = AtlasSalaVoces; } else { raiz.AtlasSalaVoces = AtlasSalaVoces; }
})(typeof module === 'object' && module.exports ? this : (this || window));
