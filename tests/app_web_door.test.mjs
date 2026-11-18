// APP-WEB-DOOR R2: /get-the-app/ separates OpenWorld, the PreceptorOS app and its installation, and promises nothing
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
const PRIVATE = /(127\.0\.0\.1|localhost|\b10\.\d+\.\d+\.\d+|\b192\.168\.\d+\.\d+|\b100\.\d+\.\d+\.\d+|\/api\/|21434)/i;

// Every rule is one sentence a visitor could be misled by. Returns the list of breaches (empty = clean).
export function violations(html, apkBytes) {
  const out = [];
  const door = (id) => { const m = html.match(new RegExp(`<article class="door" id="${id}"[\\s\\S]*?</article>`)); return m ? m[0] : ''; };
  for (const id of ['door-openworld', 'door-app', 'door-install']) if (!door(id)) out.push(`missing door ${id}`);
  const order = ['door-openworld', 'door-app', 'door-install'].map((id) => html.indexOf(`id="${id}"`));
  if (order.some((i, k) => k && i < order[k - 1])) out.push('doors out of order');
  const b = door('door-app');
  if (!b.includes('href="/app/" id="mini-app-entry"')) out.push('official /app/ MINI link missing');
  if (!b.includes('NO_DATA(external_phone_install_not_measured)')) out.push('external phone still not measured');
  if (!b.includes('Install app') || !b.includes('Add to Home screen')) out.push('honest Android PWA steps missing');
  if (!b.includes('No model is included')) out.push('unverified model implied');
  if (/\b(?:a local AI is included|node is live|registered remotely)\b/i.test(b)) out.push('public app availability claimed');
  if (b.includes('NO_DATA(public_app_web_runtime_not_published)')) out.push('stale public MINI claim');
  if (PRIVATE.test(html.replace(/<script[\s\S]*?<\/script>/g, ''))) out.push('a private address or API route is in the page');
  const a = door('door-openworld');
  if (!/does not contain the PreceptorOS app/.test(a) || !/does not contain a local model/.test(a)) out.push('OpenWorld door does not say the APK is not the app or has no model');
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

test('the page is clean: three doors, an honest app door, measured downloads, no private address', () => {
  assert.deepEqual(violations(html, apk), []);
});

test('the file on disk is the one published (size and fingerprint)', () => {
  assert.equal(statSync(APK).size, 1340742);
  assert.equal(createHash('sha256').update(apk).digest('hex'), APK_SHA);
});

test('sabotage: wrong MINI path, fake model or private link are rejected', () => {
  const fake = html.replace('No model is included', 'A local AI is included');
  const bad1 = html.replace('href="/app/" id="mini-app-entry"', 'href="/app-404/" id="mini-app-entry"');
  const bad2 = html.replace('No model is included', 'Available at <a href="http://127.0.0.1:8740/app">the private rack</a>. No model is included');
  assert.notEqual(fake, html, 'false claim sabotage must change the page');
  assert.ok(violations(fake, apk).includes('public app availability claimed'), 'model availability lie was not rejected');
  assert.notEqual(bad1, html, 'wrong MINI link sabotage must change the page');
  assert.ok(violations(bad1, apk).includes('official /app/ MINI link missing'), 'wrong /app link not caught');
  assert.notEqual(bad2, html, 'private-address sabotage must change the page');
  assert.ok(violations(bad2, apk).some((v) => /private address/.test(v)), 'private address not caught');
});
