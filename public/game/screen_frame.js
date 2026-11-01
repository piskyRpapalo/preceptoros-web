// The screen in one bubble (preceptoros.bubble/1): what the carbon sees on /openworld/ right now, read from the page's
// own text and safe globals, in a frame under 1,024 UTF-8 bytes (measured with TextEncoder). A mini orchestrator on the
// radio can read it like a screenshot. Lore: the retired face had window.preceptorFace.state() (the retired face skins);
// the D4 proposal (CANAL NORTE): one state, three projections — visual, maths under 1,024 B, radio.
// Every atom degrades to NO_DATA with its cause; nothing is undefined. When the frame would pass 1,023 B, atoms are
// dropped in a fixed order and the frame says how many (a smaller limit can be asked; never a larger one). No Math.random, no clock, no network.
(function (root) {
  'use strict';
  var SCHEMA = 'preceptoros.bubble/1', LIMIT = 1023;
  var DROP_ORDER = ['log', 'buttons', 'nodata', 'crab', 'colony', 'visit', 'state', 'area'];
  var enc = typeof TextEncoder === 'function' ? new TextEncoder() : null;

  function bytes(s) {
    if (enc) { return enc.encode(s).length; }
    var n = 0; for (var i = 0; i < s.length; i++) { var c = s.charCodeAt(i); n += c < 128 ? 1 : c < 2048 ? 2 : (c >= 0xd800 && c < 0xdc00) ? (i++, 4) : 3; }
    return n;
  }
  function clean(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); }
  // Cut to a byte budget, never in the middle of a surrogate pair; a cut ends with «…».
  function cut(s, max) {
    s = clean(s);
    if (bytes(s) <= max) { return s; }
    var chars = Array.from(s), out = '';
    for (var i = 0; i < chars.length; i++) { if (bytes(out + chars[i]) > max - 3) { break; } out += chars[i]; }
    return out + '…';
  }
  function nd(cause) { return 'NO_DATA: ' + cause; }
  function byId(doc, id) { try { return doc && doc.getElementById ? doc.getElementById(id) : null; } catch (e) { return null; } }
  function all(scope, sel) { try { return scope && scope.querySelectorAll ? Array.prototype.slice.call(scope.querySelectorAll(sel)) : []; } catch (e) { return []; } }
  function text(n) { return n ? clean(n.textContent) : ''; }
  function hiddenUp(n) { for (var k = n, i = 0; k && i < 40; k = k.parentNode, i++) { if (k.hidden) { return true; } } return false; }
  function visible(n) { return !hiddenUp(n) && n.offsetParent !== null; }

  function page(doc) { var l = doc && (doc.location || (doc.defaultView || {}).location); return l && l.pathname ? cut(l.pathname, 40) : nd('no location'); }
  function tab(doc) { var t = all(doc, '[role="tab"][aria-selected="true"]').filter(function (x) { return !hiddenUp(x) && !(x.closest && x.closest('.radio-chat')); }); return t.length ? cut(t.map(function (x) { return cut(text(x), 24); }).join(' + '), 60) : nd('no selected tab'); }
  function sheet(doc) {
    var s = all(doc, '.sheet').filter(function (x) { return !x.hidden; })[0];
    if (s) { var h = s.querySelector ? s.querySelector('h2') : null; return cut(text(h) || s.id || 'sheet', 40); }
    return all(doc, '.sheet').length ? 'none: the map is visible' : nd('no sheets on this page');
  }
  function area(doc, env) {
    var m = /around area ([^\s.]+)/.exec(text(byId(doc, 'floor-state')));
    if (m) { return cut(m[1], 24); }
    try { var W = env && env.AtlasMapPainter && env.AtlasMapPainter.world(); if (W && W.key) { return cut(W.key, 24); } } catch (e) { /* NO_DATA below */ }
    return nd('map chunks not loaded');
  }
  function crab(doc) {
    var joy = byId(doc, 'joy'), live = joy && joy.querySelector ? joy.querySelector('[aria-live]') : null, t = text(live);
    var w = text(byId(doc, 'walkers-state'));
    if (!t && !w) { return nd('no walker position on screen'); }
    return cut([t, w].filter(Boolean).join(' · '), 90);
  }
  function colony(env) {
    try {
      var v = env && typeof env.AtlasOpenworldView === 'function' ? env.AtlasOpenworldView() : null, c = v && v.colony;
      if (!c) { return nd('colony not read'); }
      var n = function (x) { return Array.isArray(x) ? x.length : 0; };
      return 'nodes ' + n(c.nodes) + ' · buildings ' + n(c.buildings) + ' · units ' + n(c.units);
    } catch (e) { return nd('colony view failed'); }
  }
  function visit(doc) {
    var box = byId(doc, 'visitor-play'), t = text(box);
    var m = /Copper (\d+) · Light (\d+) · Step (\d+)/.exec(t);
    if (!m) { return nd(box ? 'no visit started' : 'no visitor panel'); }
    var eggs = all(box, 'button').filter(function (b) { return /^visitor-hatch-/.test(b.id || ''); }).length;
    return 'copper ' + m[1] + ' · light ' + m[2] + ' · eggs ' + eggs + ' · step ' + m[3];
  }
  function buttons(doc) {
    var b = all(doc, 'button').filter(visible).map(function (x) { return cut((x.getAttribute && x.getAttribute('aria-label')) || text(x), 20); }).filter(Boolean);
    if (!b.length) { return nd('no visible buttons'); }
    var shown = b.slice(0, 10).join(' | ');
    return b.length > 10 ? shown + ' | +' + (b.length - 10) + ' more' : shown;
  }
  function log(doc) {
    var li = all(doc, '#radio-chat-lista .radio-msg-texto');
    if (!li.length) { li = all(doc, '#log li'); }
    var last = li.slice(-2).map(function (x) { return cut(text(x), 80); }).filter(Boolean);
    return last.length ? last.join(' / ') : nd('no chat or radio lines');
  }
  function state(doc) { var t = text(byId(doc, 'state')); return t ? cut(t, 90) : nd('no state line'); }
  function nodata(doc) {
    var seen = [];
    all(doc, '[aria-live],.state,[role="status"]').forEach(function (n) {
      if (hiddenUp(n)) { return; }
      var m = /NO_DATA[:·\s]*([^.]*)/.exec(text(n));
      if (m) { var c = cut(m[1] || 'no cause given', 50); if (seen.indexOf(c) < 0) { seen.push(c); } }
    });
    return seen.length ? seen.slice(0, 3).join(' | ') + (seen.length > 3 ? ' | +' + (seen.length - 3) + ' more' : '') : 'none on screen';
  }
  function sentence(a) {
    var where = a.sheet.indexOf('none') === 0 ? a.tab + ' tab' : a.tab + ' tab, sheet ' + a.sheet;
    var parts = ['Screen · ' + a.page + ' · ' + where, 'area ' + a.area, a.state];
    if (a.visit.indexOf('NO_DATA') !== 0) { parts.push('visit ' + a.visit); }
    return cut(parts.join(' · '), 240);
  }
  function serialise(f) { return JSON.stringify(f); }
  function seal(f) {
    f.bytes = 0; var n = bytes(serialise(f));
    for (var i = 0; i < 3; i++) { f.bytes = n; n = bytes(serialise(f)); }
    f.bytes = n; return f;
  }

  function read(doc, env, limit) {
    var max = Number.isSafeInteger(limit) && limit > 0 && limit < LIMIT ? limit : LIMIT;
    env = env || (doc && doc.defaultView) || (typeof root.document !== 'undefined' && doc === root.document ? root : null);
    var a = { page: page(doc), tab: tab(doc), sheet: sheet(doc), area: area(doc, env), crab: crab(doc), colony: colony(env),
      visit: visit(doc), state: state(doc), buttons: buttons(doc), log: log(doc), nodata: nodata(doc) };
    var f = { schema: SCHEMA, sentence: sentence(a), atoms: a, dropped: 0, bytes: 0 };
    for (var i = 0; bytes(serialise(seal(f))) > max && i < DROP_ORDER.length; i++) { delete a[DROP_ORDER[i]]; f.dropped = i + 1; }
    seal(f);
    try { if (doc && typeof doc.dispatchEvent === 'function' && typeof root.CustomEvent === 'function') { doc.dispatchEvent(new root.CustomEvent('screen:frame', { detail: f })); } } catch (e) { /* the frame stands without its event */ }
    return f;
  }

  var api = { SCHEMA: SCHEMA, LIMIT: LIMIT, DROP_ORDER: DROP_ORDER.slice(), read: read, bytes: bytes, cut: cut };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  else {
    root.AtlasScreenFrame = api;
    root.preceptorScreen = function () { return api.read(root.document, root); };
  }
})(this);
