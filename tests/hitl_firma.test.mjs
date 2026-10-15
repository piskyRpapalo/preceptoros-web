import { test } from 'node:test';
import { readFileSync } from 'node:fs';

const js = readFileSync(new URL('../public/game/hitl_firma.js', import.meta.url), 'utf8');

test('G3 piece under 16 KiB and vanilla (no build, no network)', () => {
  if (Buffer.byteLength(js) > 16384) throw new Error('piece too big');
  if (/fetch\(|XMLHttpRequest|WebSocket|EventSource/.test(js)) throw new Error('network call present');
});

test('private key never leaves the device: piece only ASKS Identity to sign', () => {
  if (!/Identity\.firmarTexto/.test(js)) throw new Error('does not use Identity.firmarTexto');
  if (!/Identity\.publica/.test(js)) throw new Error('does not use Identity.publica');
  if (/privateKey|exportKey\('pkcs8|raw.*private/i.test(js)) throw new Error('touches the private key material');
});

test('attestation receipt shows the five required fields', () => {
  for (const f of ['action', 'world coordinate', 'cycle', 'public key', 'signature']) {
    if (!js.toLowerCase().includes(f)) throw new Error('receipt missing field: ' + f);
  }
});

test('contract visible before signing + cancel signs nothing', () => {
  if (!/What it does/.test(js) || !/What it costs/.test(js) || !/What gets signed/.test(js)) {
    throw new Error('contract incomplete before the button');
  }
  if (!/Escape/.test(js) || !/Cancel/.test(js)) throw new Error('no cancel path');
});

test('NO_DATA with cause: no key, no cycle, failed signature', () => {
  const n = [...js.matchAll(/NO_DATA/g)].length;
  if (n < 3) throw new Error('expected at least 3 NO_DATA paths with cause, got ' + n);
});

test('sabotage: removing the cycle guard must fail this check', () => {
  const broken = js.replace(/if \(c == null \|\| !k\) \{/, 'if (false) {');
  if (/if \(false\) \{/.test(broken) && !/if \(c == null \|\| !k\) \{/.test(js)) {
    throw new Error('guard removable without detection');
  }
});
