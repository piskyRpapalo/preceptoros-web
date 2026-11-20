// APP-WEB-DOOR R3: /get-the-app/ separates native Android v7, legacy OpenWorld and browser-only MINI; promises nothing
// it has not measured. Offline and deterministic: it reads the page and the file on disk; no network, no credentials.
// The pure checker is `violations(html, apkBytes)`; negative tests reject fake MINI availability and private transport.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGE = path.join(ROOT, 'public/get-the-app/index.html');
const APK = path.join(ROOT, 'public/get-the-app/PreceptorOS-android-1.0.1.apk');
const INSTALL_SH = '2bd8666979a67ea1ec8b01a01aac240acfc2cef6165b93e558d0b836d3df6e74';
const APK_SHA = '8db3176a20ed973dab1f28642972bb97ab1ccd70ddbc7cf95f7a44affc7c4d8b';
const NATIVE_URL = 'https://github.com/piskyRpapalo/preceptoros-app/releases/download/android-mvp-v7-20261119/PreceptorOS-android-0.3.0-v7.apk';
const NATIVE_SHA = '9c4d227db2ba395cdb232bdd3eb6a52f83d344f3386a99bb5274d42837eebe6b';
const RELEASE = JSON.parse(readFileSync(path.join(ROOT, 'public/release.json'), 'utf8'));
const PRIVATE = /(127\.0\.0\.1|localhost|\b10\.\d+\.\d+\.\d+|\b192\.168\.\d+\.\d+|\b100\.\d+\.\d+\.\d+|\/api\/|21434)/i;

// Every rule is one sentence a visitor could be misled by. Returns the list of breaches (empty = clean).
export function violations(html, apkBytes) {
  const out = [];
  const door = (id) => { const m = html.match(new RegExp(`<article class="door" id="${id}"[\\s\\S]*?</article>`)); return m ? m[0] : ''; };
  for (const id of ['door-native', 'door-openworld', 'door-app', 'door-install']) {
    if (!door(id)) out.push(`missing door ${id}`);
  }
  const order = ['door-native', 'door-openworld', 'door-app', 'door-install']
    .map((id) => html.indexOf(`id="${id}"`));
  if (order.some((i, k) => k && i < order[k - 1])) out.push('doors out of order');
  const native = door('door-native');
  if (!native.includes('href="' + NATIVE_URL + '"')) {
    out.push('official native Android v7 link missing');
  }
  if (!native.includes('data-asset="native-v7-apk">9c4d227db2ba395cdb232bdd3eb6a52f83d344f3386a99bb5274d42837eebe6b')) {
    out.push('native APK fingerprint not measured');
  }
  if (!native.includes('Node registration requires explicit consent and human approval') ||
      !native.includes('NO_DATA(node_admission_and_live_not_verified)')) {
    out.push('false native node admission or LIVE claim');
  }
  const b = door('door-app');
  if (!b.includes('href="/app/"') || b.includes('app_route_http_404')) out.push('browser MINI route is wrong');
  if (!b.includes('does not include the Android Mini Orchestrator or model')) out.push('browser MINI falsely includes model');
  if (/\b(?:a local AI is included|node is live|registered remotely)\b/i.test(b)) out.push('public MINI availability claimed');
  if (PRIVATE.test(html.replace(/<script[\s\S]*?<\/script>/g, ''))) out.push('a private address or API route is in the page');
  const a = door('door-openworld');
  if (!a.includes('archived') || !a.includes('It contains no local model')) {
    out.push('legacy OpenWorld door incorrectly describes APK or local model');
  }
  const sh = html.match(/data-asset="install\.sh"[^>]*>([0-9a-f]{64})/);
  if (!sh || sh[1] !== INSTALL_SH) out.push('install.sh fingerprint is not the published one');
  const ap = html.match(/data-asset="PreceptorOS-android-1\.0\.1\.apk"[^>]*>([0-9a-f]{64})/);
  if (!ap || ap[1] !== APK_SHA) out.push('apk fingerprint is not the published one');
  if (apkBytes != null) {
    const got = createHash('sha256').update(apkBytes).digest('hex');
    if (got !== APK_SHA) out.push('the apk on disk does not match its published fingerprint');
  }
  const c = door('door-install');
  if (!/NO_DATA/.test(c.split('Windows')[1] || '')) out.push('Windows is described without its NO_DATA acceptance');
  if (/Tested|tested/.test(c.split('Windows')[1] || '') && !/NOT been accepted/.test(c)) out.push('Windows described as tested');
  if (/Android[^<]*(installs|install) the PreceptorOS app/i.test(c) && !/nothing installs/i.test(c)) out.push('Android described as installing the app');
  return out;
}

const html = readFileSync(PAGE, 'utf8');
const apk = readFileSync(APK);

test('four truthful doors: native first, legacy TWA, deterministic MINI and desktop with no private address', () => {
  assert.deepEqual(violations(html, apk), []);
  assert.equal(RELEASE.native.url, NATIVE_URL, 'Release manifest and native CTA must agree');
  assert.equal(RELEASE.native.sha256, NATIVE_SHA, 'Release manifest and native SHA must agree');
  assert.equal(RELEASE.native.bytes, 155998639, 'native v7 byte count must be measured');
  assert.equal(RELEASE.native.package, 'org.preceptoros.app');
});

test('the file on disk is the one published (size and fingerprint)', () => {
  assert.equal(statSync(APK).size, 1340742);
  assert.equal(createHash('sha256').update(apk).digest('hex'), APK_SHA);
});

test('sabotage: wrong native APK path, false LIVE claim and private link are rejected', () => {
  const fake = html.replace('Node registration requires explicit consent and human approval',
    'Node is live and approved automatically');
  const bad1 = html.replace('id="native-android-download" class="get-app" href="' + NATIVE_URL + '"',
    'id="native-android-download" class="get-app" href="/get-the-app/not-an-app.apk"');
  const bad2 = html.replace('href="/app/"',
    'href="http://127.0.0.1:8740/app"');
  assert.notEqual(fake, html, 'false LIVE sabotage must change the page');
  assert.ok(violations(fake, apk).includes('false native node admission or LIVE claim'), 'false LIVE not rejected');
  assert.notEqual(bad1, html, 'wrong native link sabotage must change the page');
  assert.ok(violations(bad1, apk).includes('official native Android v7 link missing'), 'wrong native path not rejected');
  assert.notEqual(bad2, html, 'private-address sabotage must change the page');
  assert.ok(violations(bad2, apk).some((v) => /private address/.test(v)), 'private address not caught');
});
