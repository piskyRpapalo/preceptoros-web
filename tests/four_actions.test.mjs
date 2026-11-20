// WEB-FOUR-DOORS-01: the homepage has exactly four main actions, each honest, offline on open, with no fake /app link.
// Offline and deterministic: reads the page and the scripts on disk; the sabotages prove the checker rejects each lie.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const APK_SHA = '9c4d227db2ba395cdb232bdd3eb6a52f83d344f3386a99bb5274d42837eebe6b';

// Returns the list of breaches (empty = clean). `html` is the homepage, `js` the scripts it loads.
export function violations(html, js) {
  const out = [];
  const row = (html.match(/<nav class="dayd-doors"[\s\S]*?<\/nav>/) || [''])[0];
  const actions = [...row.matchAll(/<a class="ta-btn" id="([a-z-]+)" href="([^"]+)"/g)].map((m) => [m[1], m[2]]);
  const expected = [['dayd-building', '/get-the-app/#building-draft'], ['dayd-download', '/get-the-app/#doors'],
    ['dayd-companion', '/get-the-app/#companion-path'], ['ta-update', '/get-the-app/#update-existing-app']];
  if (JSON.stringify(actions) !== JSON.stringify(expected)) out.push('the Day-D paths are not exactly four truthful actions: ' + JSON.stringify(actions));
  if (/href="\/app(\.html)?\/?"/.test(html) || /<a [^>]*>\s*(Open the app|Open PreceptorOS app)/i.test(html)) out.push('a link to a public /app exists');
  if (/\b(fetch|XMLHttpRequest|sendBeacon|WebSocket|navigator\.sendBeacon)\b/.test(js.companion)) out.push('Create Companion makes a network request');
  // An affirmative claim only: «is registered» / «has been registered». «Not registered until…» is the honest sentence.
  if (/\b(is|was|has been|are|now)\s+(now\s+)?(registered|registrad[oa])\b/i.test(js.companion_text || '')) out.push('Create Companion claims a registration');
  if (!js.companion.includes('Nothing was sent') || !js.companion.includes('NO_DATA')) out.push('Create Companion does not say nothing is sent or what is NO_DATA');
  if (!js.three.includes("var APK = 'https://github.com/piskyRpapalo/preceptoros-app/releases/download/android-mvp-v7-20261119/PreceptorOS-android-0.3.0-v7.apk'")) out.push('Download App does not point at the official GitHub Release');
  if (!js.companion.includes("e.key === 'Escape'")) out.push('Create Companion cannot be closed with Escape');
  if (!js.three.includes('It is not the PreceptorOS APP and has no model inside')) out.push('the OpenWorld file is not said to be not the app');
  if (js.three.split(APK_SHA).length - 1 !== 1) out.push('Android download must show its published SHA-256 exactly once');
  if (!js.three.includes("link: ['/get-the-app/#update-existing-app', 'Open the PreceptorOS APP update instructions']") ||
      !js.three.includes('never uninstall or clear data to force an upgrade') ||
      !js.three.includes('The public website cannot inspect an APP on another origin')) {
    out.push('Android APP update lacks trusted instructions or may destroy local data');
  }
  if (/hexelion/i.test(html + js.three + js.companion)) out.push('the public product promises Hexelion');
  if (/Not measured yet/.test(html)) out.push('the old "Not measured yet" block is still on the homepage');
  return out;
}

const html = read('public/index.html');
const js = { three: read('public/assets/three_actions.js'), companion: read('public/assets/create_companion.js'), companion_text: read('public/assets/create_companion.js') };

test('the homepage is clean: four actions, honest downloads, no network on open, no fake app link', () => {
  assert.deepEqual(violations(html, js), []);
});

test('the script lists are cached so the offline copy has the same panel', () => {
  assert.ok(read('public/sw-listas.js').includes("'/assets/create_companion.js'"));
});

test('sabotage: a fifth main action, a public /app link, a network call and a false registration are rejected', () => {
  const fifth = html.replace('<a class="ta-btn" id="ta-update"', '<a class="ta-btn" id="ta-extra" href="/openworld/">Extra</a>\n<a class="ta-btn" id="ta-update"');
  assert.notEqual(fifth, html, 'fifth-action sabotage must change the real Day-D navigation');
  const link = html.replace('<p class="go">', '<p class="go"><a href="/app/">Open the app</a> ');
  const net = { ...js, companion: js.companion + '\nfetch("https://example.invalid/x");' };
  const lie = js.companion.replace('Nothing was sent.', 'Nothing was sent. Your companion is registered.');
  const claim = { ...js, companion: lie, companion_text: lie };
  const wrongUpdate = { ...js, three: js.three.replace("link: ['/get-the-app/#update-existing-app', 'Open the PreceptorOS APP update instructions']", "link: [APK, 'Update OpenWorld (APK)']") };
  assert.notEqual(wrongUpdate.three, js.three, 'the update sabotage must change the route');
  assert.ok(violations(html, wrongUpdate).some((v) => /APP update lacks trusted instructions/.test(v)), 'wrong APK update route not caught');
  assert.ok(violations(fifth, js).some((v) => /four/.test(v)), 'fifth action not caught');
  assert.ok(violations(link, js).some((v) => /public \/app/.test(v)), 'public /app link not caught');
  assert.ok(violations(html, net).some((v) => /network/.test(v)), 'network call not caught');
  assert.ok(violations(html, claim).some((v) => /registration/.test(v)), 'false registration not caught');
});
