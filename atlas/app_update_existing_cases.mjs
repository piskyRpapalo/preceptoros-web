// Public WEB update guidance must not misidentify OpenWorld APK as the installed nine-panel APP.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(repo, 'public/get-the-app/index.html'), 'utf8');
const js = fs.readFileSync(process.env.UPDATE_TEST_JS_SOURCE || path.join(repo, 'public/assets/three_actions.js'), 'utf8');
const landing = fs.readFileSync(path.join(repo, 'public/index.html'), 'utf8');
const androidStart = js.indexOf('    android: {');
const ubuntuStart = js.indexOf('    ubuntu: {');
const android = js.slice(androidStart, ubuntuStart);

test('WEB offers update instructions as an ordinary accessible link', () => {
  assert.match(html, /id="update-existing-app"/);
  assert.match(html, /href="#update-existing-app"/);
  assert.match(html, /aria-labelledby="update-existing-h"/);
  assert.match(landing, /id="ta-update"/);
});

test('native APP download stays distinct from the legacy OpenWorld TWA', () => {
  assert.match(html, /The native Android v16 APK in door A has package <code>org.preceptoros.app<\/code>/);
  assert.match(html, /id="door-openworld"/);
  assert.match(html, /Historical OpenWorld TWA/);
  assert.match(html, /not a current APP download/);
  assert.doesNotMatch(html, /href="\/get-the-app\/PreceptorOS-android-1\.0\.1\.apk"/);
  assert.match(android, /Download PreceptorOS APP \(APK, 122 MB\)/);
  assert.match(android, /link: \['\/get-the-app\/#update-existing-app', 'Open the PreceptorOS APP update instructions'\]/);
  assert.doesNotMatch(android.slice(android.indexOf('      update:')), /link: \[APK,/);
});

test('WEB update never claims a cross-origin update, automatic network scan or grant', () => {
  assert.match(html, /cannot inspect or silently update an APP/);
  assert.match(html, /No automatic local-network scan/);
  assert.match(android, /cannot inspect an APP on another origin/);
});

test('user must explicitly open their own trusted origin, with no public private-address link', () => {
  assert.match(html, /open the PreceptorOS APP from the original address saved on your own device/);
  assert.match(html, /This public website cannot discover your local APP address/);
  assert.doesNotMatch(html, /href="http:\/\/(?:127\.0\.0\.1|localhost|192\.168\.[0-9.]+|10\.[0-9.]+)[^\"]*"/);
  const injected = html.replace('This public website cannot discover your local APP address',
    '<a href="http://127.0.0.1:8742/app">Open another private node</a>');
  assert.notEqual(injected, html, 'the private-address sabotage must change the page');
  assert.match(injected, /href="http:\/\/127\.0\.0\.1:8742\/app"/, 'the injected private link must be detectable');
});

test('PWA update and reload must be user-driven and lossless', () => {
  assert.match(html, /Settings → This app · install and update → Check for update/);
  assert.match(html, /Reload to use the update/);
  assert.match(html, /instead of clearing app storage or identity keys/);
});

test('node proposal is not remote deployment or authority', () => {
  assert.match(html, /My node → Node identity/);
  assert.match(html, /NO_DATA\(production_admission_endpoint_not_verified\)/);
  assert.match(html, /No automatic local-network scan/);
  assert.match(html, /without fresh heartbeat/);
});
