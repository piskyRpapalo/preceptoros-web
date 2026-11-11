// Radio layer 2 (C6 · H9): one radio line, four readings, one id. Run: node --test atlas/puros/radio_frame_cases.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const F = require('../../public/game/radio_frame.js');
const R = require('../../public/game/bb_radio.js');
const S = require('../../public/game/semantic_table.js');
const SOURCE = new URL('../../public/game/radio_frame.js', import.meta.url);
const SEALS = ['LIVE', 'PROPUESTA', 'FIRMADO', 'ERROR', 'NO_DATA', 'SIMULATED', 'STALE'];
const sha = (f32) => createHash('sha256').update(Buffer.from(f32.buffer, f32.byteOffset, f32.byteLength)).digest('hex');
const line = (sello, extra) => Object.assign({ who: 'Map', seal: sello, source: 'map', cycle: 7, text: 'The reef is calm.' }, extra);

test('the frame of a seal carries exactly the terms its visual form is drawn from', () => {
  for (const s of SEALS) {
    const terms = S.visual(s).fourierTerms.map((t) => [t.k, t.a, t.phi]);
    assert.deepEqual(F.frameOf(s), { sello: s, terminos: terms }, s);
  }
});

test('the tone is the one bb_radio makes from that same frame (no second synth)', () => {
  for (const s of SEALS) { assert.equal(sha(F.sound(line(s)).samples), sha(R.pcm(F.frameOf(s))), s); }
});

test('two identical runs give the same id and the same tone, byte for byte', () => {
  const a = F.sound(line('LIVE')), b = F.sound(line('LIVE'));
  assert.equal(a.id, b.id);
  assert.equal(sha(a.samples), sha(b.samples));
  assert.equal(JSON.stringify(F.readings(line('ERROR'))), JSON.stringify(F.readings(line('ERROR'))));
});

test('the six measured seals each sound, and no two sound alike', () => {
  const heard = SEALS.filter((s) => s !== 'NO_DATA').map((s) => {
    const x = F.sound(line(s));
    assert.ok(x.samples.length > 0, s); assert.equal(x.cause, '', s);
    assert.equal(x.ms, Math.round(x.samples.length * 1000 / R.SR), s);
    return sha(x.samples);
  });
  assert.equal(new Set(heard).size, 6);
});

test('NO_DATA is silent and says why; silence never comes without a cause', () => {
  const x = F.sound(line('NO_DATA'));
  assert.equal(x.samples.length, 0);
  assert.match(x.cause, /^NO_DATA: /);
});

test('an unknown seal (EMULADO, empty, invented) gets no tone and a cause naming it', () => {
  for (const s of ['EMULADO', '', 'INVENTED']) {
    const x = F.sound(line(s));
    assert.equal(x.samples.length, 0, s);
    assert.match(x.cause, /^NO_DATA: seal .* is not in the semantic table/, s);
  }
  assert.equal(F.frameOf('INVENTED'), null);
  assert.match(F.sound(undefined).cause, /^NO_DATA: /);
});

test('a short cue is a prefix of the full tone, cut on a note boundary', () => {
  const full = F.sound(line('FIRMADO')).samples, cue = F.sound(line('FIRMADO'), 3).samples;
  assert.equal(cue.length, 3 * R.NOTA_TICKS * R.MUESTRAS_TICK);
  assert.equal(sha(cue), sha(full.slice(0, cue.length)));
  for (const bad of [0, -1, 1.5, 'x', 999]) { assert.equal(F.sound(line('FIRMADO'), bad).samples.length, full.length, String(bad)); }
});

test('the id changes with the words, the seal, the source and the cycle, and with nothing else', () => {
  const base = F.eventId(line('LIVE'));
  assert.match(base, /^radio\.[0-9a-f]{8}$/);
  assert.equal(F.eventId(line('LIVE', { who: 'Someone else' })), base);
  for (const other of [{ text: 'The reef is loud.' }, { source: 'chat' }, { cycle: 8 }, { seal: 'STALE' }]) {
    assert.notEqual(F.eventId(line('LIVE', other)), base, JSON.stringify(other));
  }
  assert.equal(F.eventId(line('LIVE', { cycle: null })), F.eventId(line('LIVE', { cycle: -3 })));
});

test('the four readings share one id and one seal, and agree with the static twin', () => {
  for (const s of SEALS) {
    const r = F.readings(line(s)), twin = R.gemelo(s);
    assert.equal(r.id, F.eventId(line(s)), s);
    assert.equal(r.seal, s); assert.equal(r.machine.seal, s);
    assert.deepEqual(r.eye, { text: twin.texto, shape: twin.forma, motion: twin.movimiento }, s);
    assert.equal(r.reader, twin.texto + ' · The reef is calm.', s);
    assert.deepEqual(r.machine, { seal: s, source: 'map', cycle: 7 }, s);
    if (s === 'NO_DATA') { assert.match(r.ear.cause, /^NO_DATA: /); } else { assert.ok(r.ear.samples > 0 && r.ear.ms > 0, s); }
  }
});

test('a missing reading carries its cause instead of an empty value', () => {
  const unknown = F.readings(line('EMULADO'));
  assert.match(unknown.eye.cause, /^NO_DATA: /); assert.match(unknown.reader.cause, /^NO_DATA: /); assert.match(unknown.ear.cause, /^NO_DATA: /);
  assert.match(F.readings(line('LIVE', { text: '  ' })).reader.cause, /no words/);
  assert.equal(F.readings(line('LIVE', { cycle: undefined })).machine.cycle, 'NO_DATA');
});

function fakeContext(log) {
  return {
    destination: 'out',
    createBuffer(channels, length, rate) {
      const data = new Float32Array(length); log.push(['buffer', channels, length, rate]);
      return { getChannelData: () => data, data };
    },
    createBufferSource() {
      const src = { connect(d) { log.push(['connect', d]); }, start() { log.push(['start', sha(src.buffer.data)]); } };
      return src;
    }
  };
}

test('play hands the same samples to the audio context: one mono buffer at the radio rate, started once', () => {
  const log = [], s = F.sound(line('LIVE'), 2), out = F.play(fakeContext(log), line('LIVE'), 2);
  assert.deepEqual(out, { id: s.id, seal: 'LIVE', played: true, ms: s.ms, cause: '' });
  assert.deepEqual(log, [['buffer', 1, s.samples.length, R.SR], ['connect', 'out'], ['start', sha(s.samples)]]);
});

test('play never claims a sound it did not make: no context, a refusing browser, a silent seal', () => {
  assert.deepEqual(F.play(null, line('LIVE')), { id: F.eventId(line('LIVE')), seal: 'LIVE', played: false, ms: 0, cause: 'NO_DATA: this browser gave no audio context' });
  const refusing = fakeContext([]); refusing.createBufferSource = () => { throw new Error('blocked'); };
  const refused = F.play(refusing, line('LIVE'));
  assert.equal(refused.played, false); assert.match(refused.cause, /refused/);
  const log = [], silent = F.play(fakeContext(log), line('NO_DATA'));
  assert.equal(silent.played, false); assert.match(silent.cause, /^NO_DATA: /); assert.deepEqual(log, []);
});

test('the piece has no clock, no random numbers and no network, and stays small', () => {
  const text = readFileSync(SOURCE, 'utf8');
  assert.equal(/Math\.random|Date\.now|new Date|performance\.now|fetch\(|XMLHttpRequest|WebSocket/.test(text), false);
  assert.ok(Buffer.byteLength(text) < 16384);
});
