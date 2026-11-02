// SALA-B · the log of the ecosystem room (decree ·6588150676; Mesa order of 2026-11-02). Level: ESTADO.
// Each message is an Acho frame (< 1,024 B) with seal, voice and turn, never raw prose. The log is append-only: every
// message carries the hash of the one before (`prev`), so a rewritten past breaks the chain. The register of voices
// (SALA-C) and the judge (Acho.valida) come in as arguments. Pure: no DOM, no network, no clock, no Math.random.
(function (raiz) {
  'use strict';

  var V = 'preceptoros.acho/1', RAIZ = '00000000';

  // FNV-1a over the UTF-16 code units, 32 bits, as hex: the house hash32 (docs/acho-language.md §5).
  function hash32(s) {
    var h = 0x811c9dc5;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return ('0000000' + h.toString(16)).slice(-8);
  }
  function huella(frame) { return hash32(JSON.stringify(frame)); }
  function cabeza(log) { return log.length ? huella(log[log.length - 1]) : RAIZ; }

  // mensaje(log, { voz, texto, sello }, voces) → the next frame of this log, or { error } with its cause.
  // The turn and the chain come from the log, never from the caller. A voice that may not speak is refused; a voice
  // without a benchcard has its seal forced to NO_DATA by the register's rule.
  function mensaje(log, m, voces) {
    var r = voces.regla(m && m.voz);
    if (!r.puede) { return { error: 'voice refused: ' + r.causa }; }
    var texto = String(m.texto || '').trim();
    if (!texto) { return { error: 'empty message: a message is a sentence' }; }
    var turno = log.length;
    return {
      v: V, id: 'sala-' + turno, t: turno, voz: m.voz, turno: turno, prev: cabeza(log),
      seal: r.sello || m.sello || 'NO_DATA',
      atoms: [{ k: m.voz, r: texto, i: [{ o: 'text', x: 8, y: 20, tx: m.voz, sz: 14, f: 'ink' }] }],
      bands: ['ink'], change: [texto],
      sound: 'NO_DATA: a room message declares no sound', soundCause: 'the room is text first'
    };
  }

  // asienta(log, frame, autor, voces, juez) → { ok, log, causa }. The only way to grow the log: a new array, the old
  // one untouched. Fail-closed: wrong turn, broken chain, a voice speaking for another, or a frame the judge refuses.
  function asienta(log, f, autor, voces, juez) {
    var no = function (c) { return { ok: false, log: log, causa: c }; };
    if (!f || f.error) { return no(f ? f.error : 'no frame'); }
    if (autor !== f.voz) { return no('a voice never speaks for another: ' + String(autor) + ' wrote as ' + String(f.voz)); }
    var r = voces.regla(f.voz);
    if (!r.puede) { return no('voice refused: ' + r.causa); }
    if (r.sello && f.seal !== r.sello) { return no('seal must be ' + r.sello + ' for this voice'); }
    if (f.turno !== log.length || f.t !== f.turno || f.id !== 'sala-' + f.turno) { return no('turn out of order'); }
    if (f.prev !== cabeza(log)) { return no('broken chain: prev is not the head of the thread'); }
    var j = juez(f);
    if (!j.ok) { return no('judge: ' + j.causes.join('; ')); }
    return { ok: true, log: log.concat([f]), causa: '' };
  }

  // verifica(log, voces, juez) → { ok, roto }: walks the whole log; `roto` is the first bad turn, or -1.
  function verifica(log, voces, juez) {
    var vivo = [];
    for (var i = 0; i < log.length; i++) {
      var r = asienta(vivo, log[i], log[i] && log[i].voz, voces, juez);
      if (!r.ok) { return { ok: false, roto: i, causa: r.causa }; }
      vivo = r.log;
    }
    return { ok: true, roto: -1, causa: '' };
  }

  var AtlasSalaLog = Object.freeze({ RAIZ: RAIZ, hash32: hash32, cabeza: cabeza, mensaje: mensaje, asienta: asienta, verifica: verifica });
  if (typeof module === 'object' && module.exports) { module.exports = AtlasSalaLog; } else { raiz.AtlasSalaLog = AtlasSalaLog; }
})(typeof module === 'object' && module.exports ? this : (this || window));
