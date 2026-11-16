// Create Companion (WEB-FOUR-DOORS-01): prepares a companion's two documents on this device.
// It drafts text from the person's own answers and offers it as a download or a copy. It makes NO network request,
// sends nothing to any server, asks for no credentials, and never claims a registration: a companion counts as registered
// registered only when its pull request is accepted in the companion repository. Blank measurements stay NO_DATA with
// their cause; the house never fills a companion's figures. The companion writes its own files; this page only drafts.
(function () {
  'use strict';
  var panel = document.getElementById('fa-panel');
  if (!panel) return;
  var NAME = /^[a-z0-9][a-z0-9-]{1,39}$/;
  var $ = function (id) { return document.getElementById(id); };
  var say = $('fa-say'), out = $('fa-out'), make = $('fa-make');
  var urls = [];

  function v(id) { return ($(id).value || '').trim(); }
  // A blank field is said as NO_DATA with the cause, never as an empty line that could be mistaken for a figure.
  function or(text, cause) { return text ? text : 'NO_DATA (cause: ' + cause + ')'; }
  function today() { return new Date().toISOString().slice(0, 10); }

  function declaration(d) {
    return [
      '# DECLARATION.md — `' + d.name + '` / `' + (d.project || 'NO_DATA') + '`',
      '',
      'Drafted on this device on ' + d.day + '. Review it, then sign it yourself. It is not registered until your pull request is accepted.',
      '',
      '## What the project is', or(d.what, 'not written yet'), '',
      '## What it solves, and for whom', or(d.solves, 'not written yet'), '',
      '## Stack', or(d.stack, 'not written yet'), '',
      '## Current state', or(d.state, 'not written yet'), ''
    ].join('\n');
  }
  function state(d) {
    return [
      '# STATE.md — `' + d.name + '` / `' + (d.project || 'NO_DATA') + '`',
      '',
      'Drafted on this device on ' + d.day + '. Each figure travels with its run date and machine, and is yours to sign. Blank = NO_DATA.',
      '',
      '- Accuracy: ' + or(d.acc, 'not measured yet'),
      '- Tests: ' + or(d.tests, 'not measured yet'),
      '- Cost: ' + or(d.cost, 'not measured yet'),
      '- Run date: ' + or(d.date, 'not measured yet'),
      '- Machine: ' + or(d.machine, 'not measured yet'),
      ''
    ].join('\n');
  }
  function el(tag, text, cls) { var e = document.createElement(tag); if (text != null) e.textContent = text; if (cls) e.className = cls; return e; }
  function clear() { urls.forEach(function (u) { URL.revokeObjectURL(u); }); urls = []; out.replaceChildren(); }

  function save(name, text) {
    var u = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' }));
    urls.push(u);
    var a = el('a', 'Download ' + name, 'ta-get');
    a.href = u; a.download = name; a.type = 'text/markdown';
    return a;
  }
  function copy(text, label) {
    var b = el('button', label, 'ta-btn');
    b.type = 'button';
    b.addEventListener('click', function () {
      var ok = navigator.clipboard && navigator.clipboard.writeText
        ? navigator.clipboard.writeText(text).then(function () { return true; }, function () { return false; })
        : Promise.resolve(false);
      ok.then(function (done) { say.textContent = done ? 'Copied to your clipboard. Nothing was sent.' : 'Your browser did not allow copying here: use the download instead.'; });
    });
    return b;
  }

  // One panel at a time: Create Companion closes the download/update panel, and those buttons close this one.
  var btn = $('fa-companion'), osPanel = $('ta-panel'), osButtons = [$('ta-app'), $('ta-update')];
  function showCompanion(on) {
    panel.hidden = !on;
    btn.setAttribute('aria-expanded', String(on));
    if (on && osPanel) { osPanel.hidden = true; osButtons.forEach(function (b) { if (b) b.setAttribute('aria-expanded', 'false'); }); }
    if (on) { var first = $('fa-name'); if (first) first.focus(); }
  }
  btn.addEventListener('click', function () { showCompanion(panel.hidden); });
  // Escape closes the panel and returns focus to its button (keyboard users never get trapped).
  panel.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) { showCompanion(false); btn.focus(); } });
  osButtons.forEach(function (b) { if (b) b.addEventListener('click', function () { showCompanion(false); }); });

  make.addEventListener('click', function () {
    var name = v('fa-name').toLowerCase();
    clear();
    if (!NAME.test(name)) {
      say.textContent = 'NO_DATA (cause: companion name must be 2 to 40 lowercase letters, digits or hyphens, starting with a letter or digit). Nothing was prepared.';
      return;
    }
    var d = { name: name, project: v('fa-project'), what: v('fa-what'), solves: v('fa-solves'), stack: v('fa-stack'),
      state: v('fa-state'), acc: v('fa-acc'), tests: v('fa-tests'), cost: v('fa-cost'), date: v('fa-date'), machine: v('fa-machine'), day: today() };
    var dec = declaration(d), st = state(d);
    out.append(el('h5', 'companions/' + name + '/DECLARATION.md'));
    out.append(el('pre', dec, 'ta-sha'));
    out.append(save('DECLARATION.md', dec), copy(dec, 'Copy DECLARATION.md'));
    out.append(el('h5', 'companions/' + name + '/STATE.md'));
    out.append(el('pre', st, 'ta-sha'));
    out.append(save('STATE.md', st), copy(st, 'Copy STATE.md'));
    say.textContent = 'Prepared on this device: 2 drafts. Nothing was sent. Not registered until your pull request is accepted.';
  });
})();
