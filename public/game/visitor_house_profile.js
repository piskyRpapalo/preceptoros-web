// First-house profile: a visit-local card, never arbitrary HTML or a public account.
// The map remains authoritative for ownership. This module creates no building, visit, network call or storage.
(function (root) {
  'use strict';
  var SCHEMA = 'preceptoros.visitor-house/1', LIMIT = 1024;
  var HOSTS = ['github.com', 'gitlab.com', 'codeberg.org', 'linkedin.com', 'x.com', 'twitter.com',
    'bsky.app', 'mastodon.social', 'threads.net', 'instagram.com', 'facebook.com', 'youtube.com',
    'youtu.be', 'dev.to'];
  function bytes(s) { return new TextEncoder().encode(s).byteLength; }
  function clean(value, max) {
    if (typeof value !== 'string') { return null; }
    var s = value.replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, '')
      .replace(/\s+/g, ' ').trim();
    return bytes(s) <= max ? s : null;
  }
  function safeUrl(value) {
    if (typeof value !== 'string' || value.length > 260 || /[\u0000-\u0020\\]/.test(value)) { return null; }
    try {
      var u = new URL(value);
      var host = u.hostname.toLowerCase();
      if (u.protocol !== 'https:' || u.username || u.password || u.port || u.search || u.hash ||
          !HOSTS.some(function (h) { return host === h || host.endsWith('.' + h); })) { return null; }
      return u.href;
    } catch (_) { return null; }
  }
  function normalize(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) { return { ok: false, cause: 'invalid_card' }; }
    var title = clean(input.title, 96), bio = clean(input.bio || '', 384), raw = input.links || [];
    if (!title || title.length < 2 || bio === null || !Array.isArray(raw) || raw.length > 3) {
      return { ok: false, cause: 'invalid_text_or_link_count' };
    }
    var seen = Object.create(null), links = [];
    for (var i = 0; i < raw.length; i++) {
      var row = raw[i], label = row && clean(row.label, 48), url = row && safeUrl(row.url);
      if (!label || !url || seen[url]) { return { ok: false, cause: 'invalid_or_duplicate_link' }; }
      seen[url] = true; links.push({ label: label, url: url });
    }
    var card = { esquema: SCHEMA, title: title, bio: bio, links: links };
    if (bytes(JSON.stringify(card)) >= LIMIT) { return { ok: false, cause: 'card_exceeds_1024_bytes' }; }
    return { ok: true, card: card };
  }
  function preview(doc, card) {
    var section = doc.createElement('section'), title = doc.createElement('h3'), about = doc.createElement('p');
    section.className = 'visitor-house-preview'; title.textContent = card.title; about.textContent = card.bio;
    section.append(title, about);
    if (card.links.length) {
      var list = doc.createElement('ul');
      card.links.forEach(function (link) {
        var li = doc.createElement('li'), a = doc.createElement('a');
        a.textContent = link.label; a.href = link.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
        li.appendChild(a); list.appendChild(li);
      });
      section.appendChild(list);
    }
    return section;
  }
  function mount(doc, win) {
    var active = false, cards = Object.create(null), current = null;
    var sheet = doc.getElementById('building-sheet'), surface = doc.getElementById('surface');
    if (!sheet || !surface) { return false; }
    function clear() {
      active = false; current = null; cards = Object.create(null);
      var old = sheet.querySelector('.visitor-house-editor'); if (old) { old.remove(); }
    }
    function mark() {
      var MP = win.AtlasMapPainter, view = MP && MP.view && MP.view();
      var m = view && view.world && view.world.marks && view.world.marks[surface.dataset.sel];
      return m && m.id === 'visitor-house' && (m.won === true || m.visitorBuilt === true) ? m : null;
    }
    function open(id) {
      var old = sheet.querySelector('.visitor-house-editor'); if (old) { old.remove(); }
      if (id !== 'visitor-house' || !active) { return; }
      var m = mark(); if (!m) { return; }
      var key = 'b:visitor-house:' + m.q + ',' + m.r, card = cards[key]; current = key;
      var box = doc.createElement('section'); box.className = 'visitor-house-editor';
      box.setAttribute('aria-label', 'Your temporary house');
      var intro = doc.createElement('p'); intro.textContent = 'This house and its links stay in this visit only. Nothing is published.';
      var form = doc.createElement('form'), fields = doc.createElement('div'), note = doc.createElement('p');
      note.setAttribute('role', 'status'); note.setAttribute('aria-live', 'polite');
      function input(label, value, max) {
        var lab = doc.createElement('label'), field = doc.createElement('input');
        lab.textContent = label; field.type = 'text'; field.maxLength = max; field.value = value || '';
        lab.append(field); fields.append(lab); return field;
      }
      var title = input('House title', card && card.title, 96);
      var bio = input('Short introduction', card && card.bio, 384);
      var rows = [];
      for (var i = 0; i < 3; i++) {
        var val = card && card.links[i];
        rows.push({ label: input('Link ' + (i + 1) + ' name (optional)', val && val.label, 48),
          url: input('Link ' + (i + 1) + ' HTTPS URL (optional)', val && val.url, 260) });
      }
      var save = doc.createElement('button'); save.type = 'submit'; save.textContent = 'Keep in this visit';
      save.style.minHeight = '44px'; form.append(fields, save);
      function show(c) { var prior = box.querySelector('.visitor-house-preview'); if (prior) { prior.remove(); } box.appendChild(preview(doc, c)); }
      if (card) { show(card); }
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        if (!active || current !== key || mark() !== m) { note.textContent = 'NO_DATA: the visit no longer owns this house.'; return; }
        var links = [], bad = false;
        rows.forEach(function (row) {
          var label = row.label.value.trim(), url = row.url.value.trim();
          if (label && url) { links.push({ label: label, url: url }); }
          else if (label || url) { bad = true; }
        });
        var result = bad ? { ok: false, cause: 'incomplete_link' } : normalize({ title: title.value, bio: bio.value, links: links });
        if (!result.ok) { note.textContent = 'NO_DATA: ' + result.cause; return; }
        cards[key] = result.card; show(result.card); note.textContent = 'Saved in this visit. Not published online.';
        if (win.CustomEvent) { doc.dispatchEvent(new win.CustomEvent('visitor-house:profile', {
          detail: { place: key, card: result.card, publication: 'local-only' }
        })); }
      });
      box.append(intro, form, note); sheet.appendChild(box);
    }
    doc.addEventListener('building:enter', function (event) { open(event.detail && event.detail.id); });
    var play = doc.getElementById('visitor-play');
    if (play) {
      play.addEventListener('visitor:render', function (event) { if (event.detail && event.detail.account) { active = true; } });
      play.addEventListener('visitor:end', clear);
    }
    win.addEventListener('pagehide', clear);
    return true;
  }
  var API = Object.freeze({ normalize: normalize, safeUrl: safeUrl, preview: preview, mount: mount, schema: SCHEMA });
  if (typeof module === 'object' && module.exports) { module.exports = API; }
  root.AtlasVisitorHouseProfile = API;
  if (root.document && root.addEventListener) { mount(root.document, root); }
})(typeof window !== 'undefined' ? window : globalThis);
