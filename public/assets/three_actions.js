// Four actions (WEB-FOUR-DOORS-01): PWA · Download App (Android / Ubuntu / Windows) · Update App · Create Companion
// (create_companion.js, its own panel). Only the four ids below exist in #four-actions.
// Every sentence is what was measured, with its date; what was not is NO_DATA with its cause. This page never says it
// sees an installed app: a browser cannot prove that (except this web, installed as a PWA: display-mode standalone).
// Nothing downloads or installs without the person's click. Reuses PreceptorPwa (pwa.js) for the browser's offer.
(function () {
  'use strict';
  var box = document.getElementById('four-actions');
  if (!box) return;
  var REL = 'https://github.com/piskyRpapalo/PreceptorOS/releases/download/v1.3/';
  var APK = 'https://github.com/piskyRpapalo/preceptoros-app/releases/download/android-mvp-v22-20261125/PreceptorOS-android-0.3.1-v22.apk';
  var P = {
    android: {
      name: 'Android',
      get: { lines: ['PreceptorOS Native Android 0.3.1 v22 (APK, 124 MB): six panels, the crab and a bundled experimental small local model.',
        'The old OpenWorld 1.0.1 TWA (1.34 MB) is a separate legacy web wrapper. It is not the PreceptorOS APP and has no model inside.',
        'Node joining requires your consent and Sovereign approval; installing alone is not LIVE.'],
        link: [APK, 'Download PreceptorOS APP (APK, 124 MB)'], sha: 'd29482b6247f95f2003ffa9ad6285affcac54ed1d7395a7f5807ef131196529d', download: true },
      update: { lines: ['The native v22 APK updates a compatible Android org.preceptoros.app installation after Android checks the existing signing certificate. VersionCode 22 is higher than v7 and every earlier version.',
        'The public website cannot inspect an APP on another origin. It cannot read local identity or silently install updates; never uninstall or clear data to force an upgrade.',
        'Browser-only APP installations use their original trusted origin and separate update controls.'],
        link: ['/get-the-app/#update-existing-app', 'Open the PreceptorOS APP update instructions'] }
    },
    ubuntu: {
      name: 'Ubuntu',
      get: { lines: ['The PreceptorOS APP for Ubuntu (Command, Talk, Lab, Notebook, Harness, Boundary): install.sh 1.3. No administrator password; it adds PreceptorOS to your app menu.',
        'Tested end to end on 2026-11-16 in a clean Ubuntu 24.04: install, menu entry, all nine panels, data kept across update and uninstall. Choosing your own model in the app: in development (NO_DATA).'],
        link: [REL + 'install.sh', 'Download the APP installer (install.sh)'], sha: '2bd8666979a67ea1ec8b01a01aac240acfc2cef6165b93e558d0b836d3df6e74', run: 'bash install.sh' },
      update: { lines: ['Run the same installer again. It only moves forward (it refuses rewritten history) and does not touch your data in ~/.preceptoros: tested 2026-11-16.',
        'Not signed yet: the update trusts HTTPS and GitHub. A signed update is NO_DATA.'],
        link: [REL + 'install.sh', 'Download the APP installer (install.sh)'], sha: '2bd8666979a67ea1ec8b01a01aac240acfc2cef6165b93e558d0b836d3df6e74', run: 'bash install.sh' }
    },
    windows: {
      name: 'Windows',
      get: { lines: ['The PreceptorOS APP for Windows: install.ps1 1.3. NOT TESTED: nobody has run it on Windows yet (NO_DATA).',
        'If you try it, the exact error message is useful. An acceptance kit for testers is prepared and waits for its release.'],
        link: [REL + 'install.ps1', 'Download the APP installer (install.ps1)'], sha: 'b10d7b8ade7ea0f301fd325336ae97dba6fd954786956703a3c1c6a80641f19b' },
      update: { lines: ['No update is offered for Windows: NO_DATA until the first external test passes.'] }
    }
  };
  var mode = null, os = null;
  var panel = document.getElementById('ta-panel'), out = document.getElementById('ta-out'), legend = document.getElementById('ta-legend');
  var btn = { app: document.getElementById('ta-app'), update: document.getElementById('ta-update') };
  var pwa = document.getElementById('ta-pwa'), pwaSay = document.getElementById('ta-pwa-say');

  function el(tag, text, cls) { var e = document.createElement(tag); if (text) e.textContent = text; if (cls) e.className = cls; return e; }
  function paint() {
    out.replaceChildren();
    if (!os) { out.append(el('p', 'Choose your system.')); return; }
    var c = P[os][mode];
    out.append(el('h3', P[os].name + (mode === 'update' ? ' · update' : ' · get the app')));
    c.lines.forEach(function (l) { out.append(el('p', l)); });
    if (c.link) {
      var a = el('a', c.link[1], 'ta-get'); a.href = c.link[0];
      if (c.download) { a.setAttribute('download', ''); a.type = 'application/vnd.android.package-archive'; }
      out.append(el('p')); out.lastChild.append(a);
    }
    if (c.sha) { var s = el('p', 'SHA-256 ', 'ta-sha'); s.append(el('code', c.sha)); out.append(s); }
    if (c.run) { var r = el('p', 'Then run: '); r.append(el('code', c.run)); out.append(r); }
  }
  // open('get' | 'update'): the same button again closes the panel; the other switches it.
  function open(m) {
    mode = mode === m && !panel.hidden ? null : m;
    panel.hidden = !mode;
    btn.app.setAttribute('aria-expanded', String(mode === 'get'));
    btn.update.setAttribute('aria-expanded', String(mode === 'update'));
    if (!mode) return;
    legend.textContent = mode === 'get' ? 'App for which system?' : 'Update the app on which system?';
    paint();
    var first = panel.querySelector('input:checked') || panel.querySelector('input');
    if (first) first.focus();
  }
  btn.app.addEventListener('click', function () { open('get'); });
  btn.update.addEventListener('click', function () { open('update'); });
  panel.addEventListener('change', function (e) { if (e.target && e.target.name === 'ta-os') { os = e.target.value; paint(); } });

  function pwaState() {
    var W = window.PreceptorPwa;
    if (W && W.instalada()) { pwa.disabled = true; pwaSay.textContent = 'You are using it installed now.'; return; }
    if (W && W.instalable()) { pwa.disabled = false; pwaSay.textContent = 'Your browser offers to install it. Nothing installs until you confirm.'; return; }
    pwa.disabled = true;
    pwaSay.textContent = navigator.standalone === false
      ? 'On iPhone or iPad: Share › Add to Home Screen.'
      : 'Your browser has not offered to install it here (NO_DATA). Its menu may have “Install app”.';
  }
  pwa.addEventListener('click', function () {
    if (!window.PreceptorPwa) return;
    window.PreceptorPwa.instala().then(function (ok) { pwaSay.textContent = ok ? 'Installed by your browser.' : 'Not installed: you said no, or the browser did not ask.'; });
  });
  addEventListener('pwa-oferta', pwaState);
  pwaState();
  box.hidden = false;
})();
