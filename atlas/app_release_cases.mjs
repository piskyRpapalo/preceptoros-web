// G4-3 · App Release Contract — tests (odd/tasks/app-release-contract.md).
// Tests: 10 requirements for secure app installation and update.
// Sabotage mutations included to verify rejection cases.
// Usage: node --test atlas/app_release_cases.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const req = createRequire(import.meta.url);
const R = req('./puros/app_release_contract.js');

// --- FIXTURES ---

var GOOD_DIGEST = 'a'.repeat(64);
var BAD_DIGEST = 'b'.repeat(64);

function goodManifest(overrides) {
  var m = {
    schema: R.SCHEMA,
    product_id: R.PRODUCT_ID,
    version: 'v1.4',
    via: 'release',
    ref: 'v1.4',
    digest: GOOD_DIGEST,
    files: [
      { fichero: 'interface/app.css', sha256: GOOD_DIGEST, bytes: 1024 },
      { fichero: 'interface/app.js', sha256: GOOD_DIGEST, bytes: 2048 }
    ]
  };
  if (overrides) {
    for (var k in overrides) { m[k] = overrides[k]; }
  }
  return m;
}

function goodInstalled(overrides) {
  var i = {
    product_id: R.PRODUCT_ID,
    version: 'v1.3'
  };
  if (overrides) {
    for (var k in overrides) { i[k] = overrides[k]; }
  }
  return i;
}

// ======================================================================
// 1. PRODUCT IDENTITY VERIFICATION
// ======================================================================

test('1. Identity: valid manifest has correct product_id', () => {
  var m = goodManifest();
  var r = R.validateReleaseManifest(m);
  assert.equal(r.ok, true);
});

test('1. Identity: wrong product_id is rejected', () => {
  var m = goodManifest({ product_id: 'SomeOtherProduct' });
  var r = R.validateReleaseManifest(m);
  assert.equal(r.ok, false);
  assert.ok(r.cause.indexOf('product_id mismatch') >= 0);
});

test('1. Identity: preceptoros-app product_id is accepted', () => {
  var m = goodManifest({ product_id: R.PRODUCT_ID_APP });
  var r = R.validateReleaseManifest(m);
  assert.equal(r.ok, true);
});

test('1. Identity: update contract rejects wrong product', () => {
  var contract = R.createUpdateContract(goodInstalled(), goodManifest({ product_id: 'EvilApp' }), 'sig', 'key');
  assert.equal(contract.checks.identity.ok, false);
  assert.equal(contract.overall.ok, false);
});

// ======================================================================
// 2. PUBLISHED VERSION VS INSTALLED VERSION
// ======================================================================

test('2. Version: parseVersion parses v1.2.3', () => {
  var v = R.parseVersion('v1.2.3');
  assert.equal(v.major, 1);
  assert.equal(v.minor, 2);
  assert.equal(v.patch, 3);
});

test('2. Version: parseVersion parses v1.2', () => {
  var v = R.parseVersion('v1.2');
  assert.equal(v.major, 1);
  assert.equal(v.minor, 2);
  assert.equal(v.patch, 0);
});

test('2. Version: parseVersion rejects invalid format', () => {
  assert.equal(R.parseVersion('1.2.3'), null);
  assert.equal(R.parseVersion('latest'), null);
  assert.equal(R.parseVersion(''), null);
  assert.equal(R.parseVersion(null), null);
});

test('2. Version: compareVersions returns -1 when a < b', () => {
  assert.equal(R.compareVersions('v1.3', 'v1.4'), -1);
});

test('2. Version: compareVersions returns 1 when a > b', () => {
  assert.equal(R.compareVersions('v1.4', 'v1.3'), 1);
});

test('2. Version: compareVersions returns 0 when equal', () => {
  assert.equal(R.compareVersions('v1.3', 'v1.3'), 0);
});

test('2. Version: isUpdateAvailable returns true when published > installed', () => {
  var r = R.isUpdateAvailable('v1.3', 'v1.4');
  assert.equal(r.available, true);
});

test('2. Version: isUpdateAvailable returns false when already latest', () => {
  var r = R.isUpdateAvailable('v1.4', 'v1.4');
  assert.equal(r.available, false);
  assert.ok(r.cause.indexOf('already at latest') >= 0);
});

test('2. Version: isUpdateAvailable returns NO_DATA when missing info', () => {
  var r = R.isUpdateAvailable(null, 'v1.4');
  assert.equal(r.available, false);
  assert.ok(r.cause.indexOf('NO_DATA') >= 0);
});

// ======================================================================
// 3. ARTIFACT DIGEST VERIFICATION
// ======================================================================

test('3. Digest: matching digest passes', () => {
  var r = R.verifyDigest({ digest: GOOD_DIGEST }, GOOD_DIGEST);
  assert.equal(r.ok, true);
});

test('3. Digest: mismatched digest fails', () => {
  var r = R.verifyDigest({ digest: BAD_DIGEST }, GOOD_DIGEST);
  assert.equal(r.ok, false);
  assert.ok(r.cause.indexOf('digest mismatch') >= 0);
});

test('3. Digest: missing data returns NO_DATA', () => {
  var r = R.verifyDigest(null, GOOD_DIGEST);
  assert.equal(r.ok, false);
  assert.ok(r.cause.indexOf('NO_DATA') >= 0);
});

test('3. Digest: invalid digest format rejected', () => {
  var r = R.verifyDigest({ digest: GOOD_DIGEST }, 'short');
  assert.equal(r.ok, false);
  assert.ok(r.cause.indexOf('64-char') >= 0);
});

test('3. Digest: manifest with bad digest length rejected', () => {
  var m = goodManifest({ digest: 'short' });
  var r = R.validateReleaseManifest(m);
  assert.equal(r.ok, false);
  assert.ok(r.cause.indexOf('64-char') >= 0);
});

// ======================================================================
// 4. RELEASE PROVENANCE
// ======================================================================

test('4. Provenance: release channel is trusted', () => {
  var r = R.checkProvenance(goodManifest({ via: 'release' }));
  assert.equal(r.ok, true);
  assert.equal(r.channel, 'release');
});

test('4. Provenance: raw channel is trusted', () => {
  var r = R.checkProvenance(goodManifest({ via: 'raw', ref: 'a'.repeat(40) }));
  assert.equal(r.ok, true);
  assert.equal(r.channel, 'raw');
});

test('4. Provenance: no manifest returns NO_DATA', () => {
  var r = R.checkProvenance(null);
  assert.equal(r.ok, false);
  assert.ok(r.cause.indexOf('NO_DATA') >= 0);
});

test('4. Provenance: invalid manifest rejected', () => {
  var r = R.checkProvenance({ schema: 'wrong' });
  assert.equal(r.ok, false);
});

// ======================================================================
// 5. COMPATIBILITY WITH EXISTING INSTALLATION
// ======================================================================

test('5. Compatibility: same product, newer version is compatible', () => {
  var r = R.checkCompatibility(goodInstalled(), goodManifest());
  assert.equal(r.ok, true);
  assert.equal(r.downgrade, false);
});

test('5. Compatibility: downgrade is rejected', () => {
  var r = R.checkCompatibility(goodInstalled({ version: 'v2.0' }), goodManifest());
  assert.equal(r.ok, false);
  assert.equal(r.downgrade, true);
  assert.ok(r.cause.indexOf('downgrade') >= 0);
});

test('5. Compatibility: product mismatch rejected', () => {
  var r = R.checkCompatibility(
    { product_id: 'OtherApp', version: 'v1.3' },
    goodManifest()
  );
  assert.equal(r.ok, false);
  assert.ok(r.cause.indexOf('product mismatch') >= 0);
});

test('5. Compatibility: missing info returns NO_DATA', () => {
  var r = R.checkCompatibility(null, goodManifest());
  assert.equal(r.ok, false);
  assert.ok(r.cause.indexOf('NO_DATA') >= 0);
});

// ======================================================================
// 6. MEMORY AND LOCAL CONFIG PRESERVATION
// ======================================================================

test('6. Memory: clean manifest preserves memory', () => {
  var r = R.checkMemoryPreservation(goodInstalled(), goodManifest());
  assert.equal(r.ok, true);
});

test('6. Memory: manifest with memory.db is rejected', () => {
  var m = goodManifest();
  m.files.push({ fichero: 'memory.db', sha256: GOOD_DIGEST, bytes: 100 });
  var r = R.checkMemoryPreservation(goodInstalled(), m);
  assert.equal(r.ok, false);
  assert.ok(r.cause.indexOf('memory file') >= 0);
});

test('6. Memory: manifest with .preceptoros/ path is rejected', () => {
  var m = goodManifest();
  m.files.push({ fichero: '.preceptoros/estado.json', sha256: GOOD_DIGEST, bytes: 100 });
  var r = R.checkMemoryPreservation(goodInstalled(), m);
  assert.equal(r.ok, false);
  assert.ok(r.cause.indexOf('memory file') >= 0);
});

test('6. Memory: manifest with estado.json is rejected', () => {
  var m = goodManifest();
  m.files.push({ fichero: 'interface/estado.json', sha256: GOOD_DIGEST, bytes: 100 });
  var r = R.checkMemoryPreservation(goodInstalled(), m);
  assert.equal(r.ok, false);
  assert.ok(r.cause.indexOf('memory file') >= 0);
});

test('6. Memory: missing info returns NO_DATA', () => {
  var r = R.checkMemoryPreservation(null, goodManifest());
  assert.equal(r.ok, false);
  assert.ok(r.cause.indexOf('NO_DATA') >= 0);
});

// ======================================================================
// 7. REJECTION OF TAMPERED UPDATES
// ======================================================================

test('7. Tamper: valid manifest with signature passes', () => {
  var r = R.detectTampering(goodManifest(), 'valid_signature', 'valid_key');
  assert.equal(r.ok, true);
});

test('7. Tamper: empty signature is rejected', () => {
  var r = R.detectTampering(goodManifest(), '', 'valid_key');
  assert.equal(r.ok, false);
  assert.ok(r.cause.indexOf('signature') >= 0);
});

test('7. Tamper: missing trusted key is rejected', () => {
  var r = R.detectTampering(goodManifest(), 'sig', '');
  assert.equal(r.ok, false);
  assert.ok(r.cause.indexOf('trusted key') >= 0);
});

test('7. Tamper: no manifest returns NO_DATA', () => {
  var r = R.detectTampering(null, 'sig', 'key');
  assert.equal(r.ok, false);
  assert.ok(r.cause.indexOf('NO_DATA') >= 0);
});

test('7. Tamper: invalid manifest rejected', () => {
  var r = R.detectTampering({ schema: 'wrong' }, 'sig', 'key');
  assert.equal(r.ok, false);
});

// ======================================================================
// 8. RECOVERY IF UPDATE FAILS
// ======================================================================

test('8. Recovery: installed version has recovery plan', () => {
  var r = R.checkRecoveryPlan(goodInstalled());
  assert.equal(r.ok, true);
  assert.equal(r.plan.type, 'atomic_replace');
  assert.ok(r.plan.rollback.indexOf('temp file') >= 0);
});

test('8. Recovery: no installed version returns NO_DATA', () => {
  var r = R.checkRecoveryPlan(null);
  assert.equal(r.ok, false);
  assert.ok(r.cause.indexOf('NO_DATA') >= 0);
});

test('8. Recovery: plan describes atomic replace', () => {
  var r = R.checkRecoveryPlan(goodInstalled());
  assert.ok(r.plan.description.indexOf('old version remains') >= 0);
});

// ======================================================================
// 9. ACCESSIBILITY INFORMATION FOR BLIND USERS
// ======================================================================

test('9. Accessibility: update info includes version change', () => {
  var info = R.accessibilityInfo(goodManifest(), goodInstalled());
  assert.ok(info.text.indexOf('Actualización') >= 0);
  assert.ok(info.text.indexOf('v1.3') >= 0);
  assert.ok(info.text.indexOf('v1.4') >= 0);
  assert.equal(info.file_count, 2);
});

test('9. Accessibility: no installed version shows installation', () => {
  var info = R.accessibilityInfo(goodManifest(), null);
  assert.ok(info.text.indexOf('Instalación') >= 0);
  assert.ok(info.text.indexOf('v1.4') >= 0);
});

test('9. Accessibility: same version shows already at latest', () => {
  var info = R.accessibilityInfo(goodManifest(), goodInstalled({ version: 'v1.4' }));
  assert.ok(info.text.indexOf('Ya estás') >= 0);
});

test('9. Accessibility: no manifest returns NO_DATA', () => {
  var info = R.accessibilityInfo(null, goodInstalled());
  assert.ok(info.text.indexOf('NO_DATA') >= 0);
});

test('9. Accessibility: file count is correct', () => {
  var m = goodManifest();
  m.files.push({ fichero: 'interface/app.html', sha256: GOOD_DIGEST, bytes: 512 });
  var info = R.accessibilityInfo(m, goodInstalled());
  assert.equal(info.file_count, 3);
});

// ======================================================================
// 10. NO_DATA STATE WHEN NO VERIFIED RELEASE EXISTS
// ======================================================================

test('10. NO_DATA: no manifest returns NO_DATA state', () => {
  var s = R.getReleaseState(null, 'sig', 'key');
  assert.equal(s.state, 'NO_DATA');
  assert.ok(s.reason.indexOf('no manifest') >= 0);
});

test('10. NO_DATA: invalid manifest returns NO_DATA state', () => {
  var s = R.getReleaseState({ schema: 'wrong' }, 'sig', 'key');
  assert.equal(s.state, 'NO_DATA');
});

test('10. NO_DATA: tampered manifest returns NO_DATA state', () => {
  var s = R.getReleaseState(goodManifest(), '', 'key');
  assert.equal(s.state, 'NO_DATA');
  assert.ok(s.reason.indexOf('tamper') >= 0);
});

test('10. NO_DATA: valid manifest returns verified state', () => {
  var s = R.getReleaseState(goodManifest(), 'sig', 'key');
  assert.equal(s.state, 'verified');
  assert.equal(s.product_id, R.PRODUCT_ID);
  assert.equal(s.version, 'v1.4');
  assert.equal(s.digest, GOOD_DIGEST);
});

test('10. NO_DATA: noDataState helper returns correct format', () => {
  var s = R.noDataState('custom reason');
  assert.equal(s.state, 'NO_DATA');
  assert.equal(s.reason, 'custom reason');
});

test('10. NO_DATA: default reason when none provided', () => {
  var s = R.noDataState();
  assert.equal(s.state, 'NO_DATA');
  assert.ok(s.reason.indexOf('verified release') >= 0);
});

// ======================================================================
// WEB CANNOT CLAIM DESKTOP VERSION
// ======================================================================

test('Web cannot claim: no app report returns NO_DATA', () => {
  var r = R.webCannotClaimDesktopVersion('v1.4', null);
  assert.equal(r.ok, false);
  assert.ok(r.cause.indexOf('NO_DATA') >= 0);
  assert.ok(r.cause.indexOf('web cannot claim') >= 0);
});

test('Web cannot claim: version mismatch detected', () => {
  var r = R.webCannotClaimDesktopVersion('v1.4', 'v1.3');
  assert.equal(r.ok, false);
  assert.ok(r.cause.indexOf('version mismatch') >= 0);
});

test('Web cannot claim: matching versions pass', () => {
  var r = R.webCannotClaimDesktopVersion('v1.3', 'v1.3');
  assert.equal(r.ok, true);
});

test('Web cannot claim: web has no claim, app reports version', () => {
  var r = R.webCannotClaimDesktopVersion(null, 'v1.3');
  assert.equal(r.ok, true);
});

// ======================================================================
// FULL UPDATE CONTRACT — INTEGRATION
// ======================================================================

test('Contract: full valid update passes all checks', () => {
  var contract = R.createUpdateContract(goodInstalled(), goodManifest(), 'sig', 'key');
  assert.equal(contract.schema, R.SCHEMA);
  assert.equal(contract.overall.ok, true);
  assert.equal(contract.checks.identity.ok, true);
  assert.equal(contract.checks.digest.ok, true);
  assert.equal(contract.checks.provenance.ok, true);
  assert.equal(contract.checks.compatibility.ok, true);
  assert.equal(contract.checks.memory.ok, true);
  assert.equal(contract.checks.tamper.ok, true);
  assert.equal(contract.checks.recovery.ok, true);
  assert.ok(contract.checks.accessibility.text.indexOf('Actualización') >= 0);
  assert.equal(contract.checks.noData.state, 'verified');
});

test('Contract: no manifest fails overall', () => {
  var contract = R.createUpdateContract(goodInstalled(), null, 'sig', 'key');
  assert.equal(contract.overall.ok, false);
});

test('Contract: tampered update fails overall', () => {
  var contract = R.createUpdateContract(goodInstalled(), goodManifest(), '', 'key');
  assert.equal(contract.overall.ok, false);
  assert.equal(contract.checks.tamper.ok, false);
});

test('Contract: downgrade fails overall', () => {
  var contract = R.createUpdateContract(
    goodInstalled({ version: 'v2.0' }),
    goodManifest(),
    'sig', 'key'
  );
  assert.equal(contract.overall.ok, false);
  assert.equal(contract.checks.compatibility.ok, false);
});

test('Contract: memory file in manifest fails overall', () => {
  var m = goodManifest();
  m.files.push({ fichero: 'memory.db', sha256: GOOD_DIGEST, bytes: 100 });
  var contract = R.createUpdateContract(goodInstalled(), m, 'sig', 'key');
  assert.equal(contract.overall.ok, false);
  assert.equal(contract.checks.memory.ok, false);
});

test('Contract: wrong product fails overall', () => {
  var contract = R.createUpdateContract(
    goodInstalled(),
    goodManifest({ product_id: 'EvilApp' }),
    'sig', 'key'
  );
  assert.equal(contract.overall.ok, false);
  assert.equal(contract.checks.identity.ok, false);
});

// ======================================================================
// MANIFEST VALIDATION EDGE CASES
// ======================================================================

test('Manifest: missing schema rejected', () => {
  var m = goodManifest();
  delete m.schema;
  var r = R.validateReleaseManifest(m);
  assert.equal(r.ok, false);
  assert.ok(r.cause.indexOf('missing schema') >= 0);
});

test('Manifest: missing files rejected', () => {
  var m = goodManifest();
  delete m.files;
  var r = R.validateReleaseManifest(m);
  assert.equal(r.ok, false);
  assert.ok(r.cause.indexOf('missing files') >= 0);
});

test('Manifest: empty files array rejected', () => {
  var m = goodManifest({ files: [] });
  var r = R.validateReleaseManifest(m);
  assert.equal(r.ok, false);
  assert.ok(r.cause.indexOf('non-empty') >= 0);
});

test('Manifest: invalid version format rejected', () => {
  var m = goodManifest({ version: 'latest' });
  var r = R.validateReleaseManifest(m);
  assert.equal(r.ok, false);
  assert.ok(r.cause.indexOf('version format') >= 0);
});

test('Manifest: invalid via rejected', () => {
  var m = goodManifest({ via: 'edge' });
  var r = R.validateReleaseManifest(m);
  assert.equal(r.ok, false);
  assert.ok(r.cause.indexOf('raw or release') >= 0);
});

test('Manifest: file entry missing fields rejected', () => {
  var m = goodManifest();
  m.files.push({ fichero: 'interface/x.css' }); // missing sha256, bytes
  var r = R.validateReleaseManifest(m);
  assert.equal(r.ok, false);
  assert.ok(r.cause.indexOf('required fields') >= 0);
});

test('Manifest: null input returns NO_DATA', () => {
  var r = R.validateReleaseManifest(null);
  assert.equal(r.ok, false);
  assert.ok(r.cause.indexOf('NO_DATA') >= 0);
});

test('Manifest: non-object input returns NO_DATA', () => {
  var r = R.validateReleaseManifest('string');
  assert.equal(r.ok, false);
  assert.ok(r.cause.indexOf('NO_DATA') >= 0);
});

// ======================================================================
// SABOTAGE MUTATIONS — verify rejection
// ======================================================================

test('SABOTAGE: manifest with extra keys still validates (schema check is strict on required)', () => {
  var m = goodManifest();
  m.extra = 'injected';
  var r = R.validateReleaseManifest(m);
  // Extra keys are allowed in the manifest structure — only required fields are checked
  assert.equal(r.ok, true);
});

test('SABOTAGE: digest changed in manifest is caught by verifyDigest', () => {
  var m = goodManifest({ digest: BAD_DIGEST });
  var r = R.verifyDigest({ digest: GOOD_DIGEST }, m.digest);
  assert.equal(r.ok, false);
});

test('SABOTAGE: version downgrade attempt caught', () => {
  var contract = R.createUpdateContract(
    goodInstalled({ version: 'v9.9' }),
    goodManifest(),
    'sig', 'key'
  );
  assert.equal(contract.overall.ok, false);
});

test('SABOTAGE: memory file injection caught', () => {
  var m = goodManifest();
  m.files = [{ fichero: '~/.preceptoros/memory.db', sha256: GOOD_DIGEST, bytes: 100 }];
  var contract = R.createUpdateContract(goodInstalled(), m, 'sig', 'key');
  assert.equal(contract.overall.ok, false);
  assert.equal(contract.checks.memory.ok, false);
});

test('SABOTAGE: product identity swap caught', () => {
  var contract = R.createUpdateContract(
    goodInstalled(),
    goodManifest({ product_id: 'MalwareOS' }),
    'sig', 'key'
  );
  assert.equal(contract.overall.ok, false);
  assert.equal(contract.checks.identity.ok, false);
});

test('SABOTAGE: missing signature caught when signature expected', () => {
  var contract = R.createUpdateContract(
    goodInstalled(),
    goodManifest(),
    '',
    'key'
  );
  assert.equal(contract.overall.ok, false);
  assert.equal(contract.checks.tamper.ok, false);
});
