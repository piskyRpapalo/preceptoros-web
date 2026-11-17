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

test('installed APP stays distinct from OpenWorld APK', () => {
  assert.match(html, /APK above updates only <strong>OpenWorld<\/strong>/);
  assert.match(android, /link: \['\/get-the-app\/#update-existing-app', 'Open the PreceptorOS APP update instructions'\]/);
  assert.doesNotMatch(android.slice(android.indexOf('      update:')), /link: \[APK,/);
});

test('WEB update never claims a cross-origin update, automatic network scan or grant', () => {
  assert.match(html, /cannot inspect or silently update an APP/);
  assert.match(html, /No automatic local-network scan/);
  assert.match(android, /cannot inspect an APP on another origin/);
});

test('user must explicitly open their own trusted local origin', () => {
  assert.match(html, /href="http:\/\/127\.0\.0\.1:8742\/app"/);
  assert.match(html, /only if your own tunnel forwards this address/);
  assert.match(html, /the original APP address already installed/);
});

test('PWA update and reload must be user-driven and lossless', () => {
  assert.match(html, /Settings → This app · install and update → Check for update/);
  assert.match(html, /Reload to use the update/);
  assert.match(html, /instead of clearing app storage or identity keys/);
});

test('node proposal is not remote deployment or authority', () => {
  assert.match(html, /Create a node \(proposal\)/);
  assert.match(html, /NO_DATA\(remote_node_deployment_not_verified\)/);
});
