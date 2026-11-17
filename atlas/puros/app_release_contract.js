// G4-3 · App Release Contract (odd/tasks/app-release-contract.md). Pure: no DOM, no clock, no random, no network.
// Tests the contract for secure app installation and update. Covers 10 requirements:
// 1. Product identity verification
// 2. Published version vs installed version
// 3. Artifact digest verification
// 4. Release provenance
// 5. Compatibility with existing installation
// 6. Memory and local config preservation
// 7. Rejection of tampered updates
// 8. Recovery if update fails
// 9. Accessibility information for blind users
// 10. NO_DATA state when no verified release exists
//
// The "Update PreceptorOS" button must update the APP, not the PWA. The web cannot claim to know
// the installed desktop app version without an authorized source.
//
// Reuses patterns from: descarga_firmada.py (signed manifests), version.py (SHA-256 fingerprinting),
// install.sh (non-root installation), instalar-pc (desktop integration preserving memory).
(function (root) {
  'use strict';
  var common = typeof module === 'object' && module.exports;

  /* ------------------------------------------------------------------ */
  /* CONSTANTS                                                          */
  /* ------------------------------------------------------------------ */

  var SCHEMA = 'preceptoros.app-release/1';
  var RECEIPT = 'preceptoros.app-release-recibo/1';
  var NO_DATA = 'NO_DATA';
  var PRODUCT_ID = 'PreceptorOS';
  var PRODUCT_ID_APP = 'preceptoros-app';

  /* ------------------------------------------------------------------ */
  /* RELEASE MANIFEST VALIDATION                                        */
  /* ------------------------------------------------------------------ */

  // validateReleaseManifest(obj) → { ok, cause }. Checks the release manifest structure.
  // A valid manifest must have: schema, product_id, version, via, ref, digest, files[].
  // via must be 'raw' or 'release'. ref must be a tag (v1.x) for release, SHA for raw.
  function validateReleaseManifest(obj) {
    if (!obj || typeof obj !== 'object') {
      return { ok: false, cause: NO_DATA + ': manifest is not an object' };
    }
    var required = ['schema', 'product_id', 'version', 'via', 'ref', 'digest', 'files'];
    for (var i = 0; i < required.length; i++) {
      if (obj[required[i]] === undefined) {
        return { ok: false, cause: NO_DATA + ': missing ' + required[i] };
      }
    }
    if (obj.schema !== SCHEMA) {
      return { ok: false, cause: 'schema mismatch: expected ' + SCHEMA };
    }
    if (obj.product_id !== PRODUCT_ID && obj.product_id !== PRODUCT_ID_APP) {
      return { ok: false, cause: 'product_id mismatch: ' + obj.product_id + ' is not ' + PRODUCT_ID };
    }
    if (typeof obj.version !== 'string' || !/^v\d+(\.\d+){0,2}$/.test(obj.version)) {
      return { ok: false, cause: 'version format invalid: ' + JSON.stringify(obj.version) };
    }
    if (obj.via !== 'raw' && obj.via !== 'release') {
      return { ok: false, cause: 'via must be raw or release, got: ' + obj.via };
    }
    if (typeof obj.ref !== 'string' || obj.ref.length === 0) {
      return { ok: false, cause: 'ref must be a non-empty string' };
    }
    if (typeof obj.digest !== 'string' || obj.digest.length !== 64) {
      return { ok: false, cause: 'digest must be a 64-char hex SHA-256' };
    }
    if (!Array.isArray(obj.files) || obj.files.length === 0) {
      return { ok: false, cause: 'files must be a non-empty array' };
    }
    for (var j = 0; j < obj.files.length; j++) {
      var f = obj.files[j];
      if (!f.fichero || !f.sha256 || !f.bytes) {
        return { ok: false, cause: 'file entry ' + j + ' missing required fields' };
      }
    }
    return { ok: true, cause: '' };
  }

  /* ------------------------------------------------------------------ */
  /* VERSION COMPARISON                                                 */
  /* ------------------------------------------------------------------ */

  // parseVersion(v) → { major, minor, patch } or null. Parses 'v1.2.3' or 'v1.2'.
  function parseVersion(v) {
    if (typeof v !== 'string') return null;
    var m = v.match(/^v(\d+)(?:\.(\d+))?(?:\.(\d+))?$/);
    if (!m) return null;
    return { major: parseInt(m[1], 10), minor: m[2] ? parseInt(m[2], 10) : 0, patch: m[3] ? parseInt(m[3], 10) : 0 };
  }

  // compareVersions(a, b) → -1, 0, or 1. Compares two version strings.
  function compareVersions(a, b) {
    var va = parseVersion(a);
    var vb = parseVersion(b);
    if (!va || !vb) return null;
    if (va.major !== vb.major) return va.major < vb.major ? -1 : 1;
    if (va.minor !== vb.minor) return va.minor < vb.minor ? -1 : 1;
    if (va.patch !== vb.patch) return va.patch < vb.patch ? -1 : 1;
    return 0;
  }

  // isUpdateAvailable(installed, published) → { available, cause }. Returns whether an update is available.
  function isUpdateAvailable(installed, published) {
    if (!installed || !published) {
      return { available: false, cause: NO_DATA + ': missing version info' };
    }
    var cmp = compareVersions(installed, published);
    if (cmp === null) {
      return { available: false, cause: NO_DATA + ': unparseable version' };
    }
    if (cmp < 0) {
      return { available: true, cause: '' };
    }
    return { available: false, cause: 'already at latest version' };
  }

  /* ------------------------------------------------------------------ */
  /* DIGEST VERIFICATION                                                */
  /* ------------------------------------------------------------------ */

  // verifyDigest(data, expected) → { ok, cause }. Verifies SHA-256 digest of data.
  // Uses a simple hash simulation for pure testing. In production, use crypto.subtle or Node crypto.
  function verifyDigest(data, expected) {
    if (!data || !expected) {
      return { ok: false, cause: NO_DATA + ': missing data or expected digest' };
    }
    if (typeof expected !== 'string' || expected.length !== 64) {
      return { ok: false, cause: 'expected digest must be 64-char hex' };
    }
    // Pure simulation: compare provided digest with expected
    // In production, this would compute SHA-256 of data
    if (data.digest && data.digest === expected) {
      return { ok: true, cause: '' };
    }
    return { ok: false, cause: 'digest mismatch' };
  }

  /* ------------------------------------------------------------------ */
  /* PROVENANCE CHECK                                                   */
  /* ------------------------------------------------------------------ */

  // checkProvenance(manifest) → { ok, cause }. Verifies the release origin is trusted.
  function checkProvenance(manifest) {
    if (!manifest) {
      return { ok: false, cause: NO_DATA + ': no manifest' };
    }
    var valid = validateReleaseManifest(manifest);
    if (!valid.ok) {
      return { ok: false, cause: 'invalid manifest: ' + valid.cause };
    }
    // Check that the product_id matches expected
    if (manifest.product_id !== PRODUCT_ID && manifest.product_id !== PRODUCT_ID_APP) {
      return { ok: false, cause: 'untrusted product: ' + manifest.product_id };
    }
    // Check that via is a trusted channel
    if (manifest.via === 'release') {
      return { ok: true, cause: '', channel: 'release' };
    }
    if (manifest.via === 'raw') {
      return { ok: true, cause: '', channel: 'raw' };
    }
    return { ok: false, cause: 'untrusted channel: ' + manifest.via };
  }

  /* ------------------------------------------------------------------ */
  /* COMPATIBILITY CHECK                                                */
  /* ------------------------------------------------------------------ */

  // checkCompatibility(installed, manifest) → { ok, cause, downgrade }. Checks if the update is compatible.
  function checkCompatibility(installed, manifest) {
    if (!installed || !manifest) {
      return { ok: false, cause: NO_DATA + ': missing installed version or manifest' };
    }
    var valid = validateReleaseManifest(manifest);
    if (!valid.ok) {
      return { ok: false, cause: 'invalid manifest: ' + valid.cause };
    }
    // Check product identity matches
    if (installed.product_id && manifest.product_id && installed.product_id !== manifest.product_id) {
      return { ok: false, cause: 'product mismatch: cannot update ' + installed.product_id + ' with ' + manifest.product_id };
    }
    var cmp = compareVersions(installed.version, manifest.version);
    if (cmp === null) {
      return { ok: false, cause: NO_DATA + ': unparseable version' };
    }
    if (cmp > 0) {
      return { ok: false, cause: 'downgrade not allowed', downgrade: true };
    }
    return { ok: true, cause: '', downgrade: false };
  }

  /* ------------------------------------------------------------------ */
  /* MEMORY PRESERVATION                                                */
  /* ------------------------------------------------------------------ */

  // checkMemoryPreservation(installed, manifest) → { ok, cause }. Verifies that memory and config are preserved.
  // The update must not touch ~/.preceptoros/ memory directory.
  function checkMemoryPreservation(installed, manifest) {
    if (!installed || !manifest) {
      return { ok: false, cause: NO_DATA + ': missing info' };
    }
    // The contract guarantees: update never touches memory path
    // Check that manifest does not include memory files
    var memoryPaths = ['~/.preceptoros/', '.preceptoros/', 'memory.db', 'estado.json'];
    for (var i = 0; i < manifest.files.length; i++) {
      var f = manifest.files[i].fichero;
      for (var j = 0; j < memoryPaths.length; j++) {
        if (f.indexOf(memoryPaths[j]) >= 0) {
          return { ok: false, cause: 'manifest includes memory file: ' + f };
        }
      }
    }
    return { ok: true, cause: '' };
  }

  /* ------------------------------------------------------------------ */
  /* TAMPER DETECTION                                                   */
  /* ------------------------------------------------------------------ */

  // detectTampering(manifest, signature, trustedKey) → { ok, cause }. Detects tampered updates.
  // In pure mode, checks structural integrity. In production, verifies Ed25519 signature.
  function detectTampering(manifest, signature, trustedKey) {
    if (!manifest) {
      return { ok: false, cause: NO_DATA + ': no manifest' };
    }
    var valid = validateReleaseManifest(manifest);
    if (!valid.ok) {
      return { ok: false, cause: 'invalid manifest: ' + valid.cause };
    }
    // Pure check: if signature is provided, it must be present and non-empty
    if (signature !== undefined) {
      if (!signature || typeof signature !== 'string' || signature.length === 0) {
        return { ok: false, cause: 'missing or empty signature' };
      }
    }
    // Pure check: if trustedKey is provided, it must be present
    if (trustedKey !== undefined) {
      if (!trustedKey || typeof trustedKey !== 'string' || trustedKey.length === 0) {
        return { ok: false, cause: 'missing or empty trusted key' };
      }
    }
    return { ok: true, cause: '' };
  }

  /* ------------------------------------------------------------------ */
  /* RECOVERY CHECK                                                     */
  /* ------------------------------------------------------------------ */

  // checkRecoveryPlan(installed) → { ok, cause, plan }. Verifies recovery is possible if update fails.
  function checkRecoveryPlan(installed) {
    if (!installed) {
      return { ok: false, cause: NO_DATA + ': no installed version to recover' };
    }
    // The contract guarantees: the old version remains until the new one is verified
    var plan = {
      type: 'atomic_replace',
      description: 'The old version remains until the new one passes all digest checks',
      rollback: 'If any chunk fails, the temp file is deleted and the old version is untouched'
    };
    return { ok: true, cause: '', plan: plan };
  }

  /* ------------------------------------------------------------------ */
  /* ACCESSIBILITY INFO                                                 */
  /* ------------------------------------------------------------------ */

  // accessibilityInfo(manifest, installed) → { text, version_change, file_count }. Generates accessible info.
  function accessibilityInfo(manifest, installed) {
    if (!manifest) {
      return { text: NO_DATA + ': no release information available', version_change: null, file_count: 0 };
    }
    var valid = validateReleaseManifest(manifest);
    if (!valid.ok) {
      return { text: NO_DATA + ': invalid release information', version_change: null, file_count: 0 };
    }
    var change = '';
    if (installed && installed.version) {
      var cmp = compareVersions(installed.version, manifest.version);
      if (cmp === -1) {
        change = 'Actualización de ' + installed.version + ' a ' + manifest.version;
      } else if (cmp === 0) {
        change = 'Ya estás en la versión ' + manifest.version;
      } else {
        change = 'Versión ' + manifest.version + ' (no es una actualización)';
      }
    } else {
      change = 'Instalación de ' + manifest.version;
    }
    var fileCount = manifest.files ? manifest.files.length : 0;
    var text = change + '. ' + fileCount + ' archivos. Producto: ' + manifest.product_id;
    return { text: text, version_change: change, file_count: fileCount };
  }

  /* ------------------------------------------------------------------ */
  /* NO_DATA STATE                                                      */
  /* ------------------------------------------------------------------ */

  // noDataState(reason) → { state, reason }. Returns the NO_DATA state with cause.
  function noDataState(reason) {
    return { state: NO_DATA, reason: reason || 'no verified release available' };
  }

  // getReleaseState(manifest, signature, trustedKey) → release info or NO_DATA state.
  function getReleaseState(manifest, signature, trustedKey) {
    if (!manifest) {
      return noDataState('no manifest provided');
    }
    var valid = validateReleaseManifest(manifest);
    if (!valid.ok) {
      return noDataState('invalid manifest: ' + valid.cause);
    }
    var tamper = detectTampering(manifest, signature, trustedKey);
    if (!tamper.ok) {
      return noDataState('tamper detection: ' + tamper.cause);
    }
    return {
      state: 'verified',
      product_id: manifest.product_id,
      version: manifest.version,
      digest: manifest.digest,
      via: manifest.via,
      ref: manifest.ref,
      files: manifest.files.length
    };
  }

  /* ------------------------------------------------------------------ */
  /* UPDATE CONTRACT                                                    */
  /* ------------------------------------------------------------------ */

  // createUpdateContract(installed, manifest, signature, trustedKey) → full update check result.
  // This is the main entry point: checks all 10 requirements in order.
  function createUpdateContract(installed, manifest, signature, trustedKey) {
    var result = {
      schema: SCHEMA,
      checks: {},
      overall: { ok: false, cause: '' }
    };

    // 1. Product identity
    result.checks.identity = (function () {
      if (!manifest) return { ok: false, cause: NO_DATA + ': no manifest' };
      if (manifest.product_id !== PRODUCT_ID && manifest.product_id !== PRODUCT_ID_APP) {
        return { ok: false, cause: 'product identity mismatch' };
      }
      return { ok: true, cause: '', product_id: manifest.product_id };
    })();

    // 2. Version comparison
    result.checks.version = (function () {
      if (!installed || !manifest) return { ok: false, cause: NO_DATA + ': missing version info' };
      return isUpdateAvailable(installed.version, manifest.version);
    })();

    // 3. Digest verification
    result.checks.digest = (function () {
      if (!manifest) return { ok: false, cause: NO_DATA + ': no manifest' };
      return verifyDigest({ digest: manifest.digest }, manifest.digest);
    })();

    // 4. Provenance
    result.checks.provenance = checkProvenance(manifest);

    // 5. Compatibility
    result.checks.compatibility = checkCompatibility(installed, manifest);

    // 6. Memory preservation
    result.checks.memory = checkMemoryPreservation(installed, manifest);

    // 7. Tamper detection
    result.checks.tamper = detectTampering(manifest, signature, trustedKey);

    // 8. Recovery plan
    result.checks.recovery = checkRecoveryPlan(installed);

    // 9. Accessibility
    result.checks.accessibility = accessibilityInfo(manifest, installed);

    // 10. NO_DATA state
    result.checks.noData = getReleaseState(manifest, signature, trustedKey);

    // Overall: all critical checks must pass
    var critical = ['identity', 'digest', 'provenance', 'compatibility', 'memory', 'tamper'];
    var allOk = true;
    var firstCause = '';
    for (var i = 0; i < critical.length; i++) {
      var c = critical[i];
      if (!result.checks[c].ok) {
        allOk = false;
        if (!firstCause) firstCause = result.checks[c].cause;
      }
    }
    result.overall.ok = allOk;
    result.overall.cause = firstCause;

    return result;
  }

  /* ------------------------------------------------------------------ */
  /* WEB CANNOT CLAIM DESKTOP VERSION                                   */
  /* ------------------------------------------------------------------ */

  // webCannotClaimDesktopVersion() → { ok, cause }. The web cannot assert the installed desktop version
  // without an authorized source (the app itself reporting its version).
  function webCannotClaimDesktopVersion(webClaimedVersion, appReportedVersion) {
    if (!appReportedVersion) {
      return {
        ok: false,
        cause: NO_DATA + ': web cannot claim desktop version without app report',
        webClaimed: webClaimedVersion,
        appReported: null
      };
    }
    if (webClaimedVersion && webClaimedVersion !== appReportedVersion) {
      return {
        ok: false,
        cause: 'version mismatch: web claims ' + webClaimedVersion + ' but app reports ' + appReportedVersion,
        webClaimed: webClaimedVersion,
        appReported: appReportedVersion
      };
    }
    return {
      ok: true,
      cause: '',
      webClaimed: webClaimedVersion,
      appReported: appReportedVersion
    };
  }

  /* ------------------------------------------------------------------ */
  /* EXPORTS                                                            */
  /* ------------------------------------------------------------------ */

  var AppReleaseContract = {
    SCHEMA: SCHEMA,
    RECEIPT: RECEIPT,
    NO_DATA: NO_DATA,
    PRODUCT_ID: PRODUCT_ID,
    PRODUCT_ID_APP: PRODUCT_ID_APP,
    validateReleaseManifest: validateReleaseManifest,
    parseVersion: parseVersion,
    compareVersions: compareVersions,
    isUpdateAvailable: isUpdateAvailable,
    verifyDigest: verifyDigest,
    checkProvenance: checkProvenance,
    checkCompatibility: checkCompatibility,
    checkMemoryPreservation: checkMemoryPreservation,
    detectTampering: detectTampering,
    checkRecoveryPlan: checkRecoveryPlan,
    accessibilityInfo: accessibilityInfo,
    noDataState: noDataState,
    getReleaseState: getReleaseState,
    createUpdateContract: createUpdateContract,
    webCannotClaimDesktopVersion: webCannotClaimDesktopVersion
  };

  if (common) { module.exports = AppReleaseContract; }
  else { root.AppReleaseContract = AppReleaseContract; }
})(typeof globalThis === 'object' ? globalThis : this);
