// APP-WEB-DOOR R2: /get-the-app/ separates OpenWorld, the PreceptorOS app and its installation, and promises nothing
// it has not measured. Offline and deterministic: it reads the page and the file on disk; no network, no credentials.
// The pure checker is `violations(html, apkBytes)`; the sabotage proves the checker rejects a fake public app link.
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
  if (!b.includes('NO_DATA(public_app_web_runtime_not_published)')) out.push('app door does not state its NO_DATA cause');
  if (/href="\/app(\.html)?\/?"/.test(b) || /href="\/app(\.html)?\/?"/.test(html)) out.push('a link to a public /app exists');
  if (/<a [^>]*>[^<]*(open the app|open preceptoros app)/i.test(html)) out.push('an open-the-app control exists');
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

test('sabotage: a fake public app link or an availability claim is rejected', () => {
  const fake = html.replace('A hosted copy on this site does not exist yet, so there is no open button here.',
    'Open the app now.');
  const bad1 = html.replace('</h3>\n<p><code>NO_DATA', '</h3>\n<p><a href="/app/">Open the app</a></p>\n<p><code>NO_DATA');
  const bad2 = html.replace('<p>The real app, with its nine panels', '<p>Available at <a href="http://127.0.0.1:8740/app">this address</a>. The real app, with its nine panels');
  assert.notEqual(fake, html, 'the sabotage must change the page');
  assert.ok(violations(bad1, apk).some((v) => /public \/app|open-the-app/.test(v)), 'fake /app link not caught');
  assert.ok(violations(bad2, apk).some((v) => /private address/.test(v)), 'private address not caught');
  assert.ok(violations(html.replace('NO_DATA(public_app_web_runtime_not_published)', 'available'), apk).length > 0, 'a missing NO_DATA cause not caught');
});
