// The guide with tools (2026-11-01). The web node brain does not only talk: it may call one of five safe tools. The
// tool REGISTRY below is the single source of the generation constraint: schema() turns it into one JSON schema (oneOf
// by the `tool` const, extra properties forbidden, enums, capped strings) that llama.cpp compiles into a grammar, so a
// small model can only emit a call to a known tool. A grammar guarantees structure, not truth: validate() checks the
// call again and the executor stays deterministic whatever the model says.
// HITL: no tool clicks, spends or signs. point_at only shows the real button and says «Needs you: press <label>».
(function (root) {
  'use strict';
  var DIRS = ['east', 'west', 'north-east', 'north-west', 'south-east', 'south-west'];
  var TABS = ['map', 'news', 'summons', 'army'];
  var TARGETS = { play_now: '#visitor-start', beacon: '#visitor-beacon', summon_reef: '#visitor-summon-tc1', hatch: '[id^="visitor-hatch-"]', skip_tutorial: '#joy button', chat: '#question' };
  // Where each target lives: point_at opens that sheet first (navigation only, never an action).
  var SHEET = { play_now: 'summons', beacon: 'summons', summon_reef: 'summons', hatch: 'summons', skip_tutorial: 'map', chat: null };
  var MAX_STEPS = 3, MAX_FRAME = 1024, MAX_ANSWER = 280;
  var REGISTRY = [
    { tool: 'read_screen', line: 'read_screen {} - read what is on the screen now', args: {} },
    { tool: 'open_tab', line: 'open_tab {tab} - open the map, news, summons or army tab', args: { tab: { type: 'string', enum: TABS } } },
    { tool: 'walk', line: 'walk {dir, steps} - walk the crab 1 to 6 steps on the map', args: { dir: { type: 'string', enum: DIRS }, steps: { type: 'integer', minimum: 1, maximum: 6 } } },
    { tool: 'point_at', line: 'point_at {target} - show the visitor the button to press: beacon (copper), summon_reef (summon or invoke a wave), hatch (eggs), play_now (start), skip_tutorial, chat', args: { target: { type: 'string', enum: Object.keys(TARGETS) } } },
    { tool: 'answer', line: 'answer {text} - the final short reply to the visitor', args: { text: { type: 'string', minLength: 1, maxLength: MAX_ANSWER } } }
  ];

  // schema() → the generation constraint, built only from REGISTRY.
  function schema() {
    return { oneOf: REGISTRY.map(function (t) {
      return { type: 'object', additionalProperties: false, required: ['tool', 'args'], properties: {
        tool: { const: t.tool }, args: { type: 'object', additionalProperties: false, required: Object.keys(t.args), properties: t.args } } };
    }) };
  }
  function bytes(s) { return new TextEncoder().encode(String(s)).length; }
  function cut(s, max) { s = String(s); while (bytes(s) > max) { s = Array.from(s).slice(0, -1).join(''); } return s; }

  // validate(call) → { ok, cause }: the same law as schema(), checked deterministically after generation.
  function validate(call) {
    if (!call || typeof call !== 'object' || Array.isArray(call)) { return { ok: false, cause: 'not an object' }; }
    var keys = Object.keys(call).sort().join(',');
    if (keys !== 'args,tool') { return { ok: false, cause: 'properties must be exactly tool and args' }; }
    var t = REGISTRY.filter(function (r) { return r.tool === call.tool; })[0];
    if (!t) { return { ok: false, cause: 'unknown tool ' + JSON.stringify(call.tool).slice(0, 40) }; }
    var a = call.args;
    if (!a || typeof a !== 'object' || Array.isArray(a)) { return { ok: false, cause: 'args must be an object' }; }
    var want = Object.keys(t.args);
    if (Object.keys(a).sort().join(',') !== want.slice().sort().join(',')) { return { ok: false, cause: 'args of ' + t.tool + ' must be exactly: ' + (want.join(', ') || 'none') }; }
    for (var i = 0; i < want.length; i++) {
      var k = want[i], spec = t.args[k], v = a[k];
      if (spec.enum && spec.enum.indexOf(v) < 0) { return { ok: false, cause: k + ' out of enum' }; }
      if (spec.type === 'integer' && (!Number.isSafeInteger(v) || v < spec.minimum || v > spec.maximum)) { return { ok: false, cause: k + ' out of range' }; }
      if (spec.type === 'string' && (typeof v !== 'string' || v.length < (spec.minLength || 0) || v.length > (spec.maxLength || 1e9))) { return { ok: false, cause: k + ' must be a string within its cap' }; }
    }
    return { ok: true, cause: '' };
  }

  // EXAMPLES: one per intent. A 135M model copies the first example it reads (measured 2026-11-01), so system() puts
  // the example whose words overlap the question most FIRST (dynamic few-shot, deterministic: ties keep this order).
  var EXAMPLES = [
    ['take me to the beacon copper', { tool: 'point_at', args: { target: 'beacon' } }],
    ['summon invoke a wave creature for me', { tool: 'point_at', args: { target: 'summon_reef' } }],
    ['hatch adopt my egg', { tool: 'point_at', args: { target: 'hatch' } }],
    ['start play now visit', { tool: 'point_at', args: { target: 'play_now' } }],
    ['skip the tutorial', { tool: 'point_at', args: { target: 'skip_tutorial' } }],
    ['walk move east go', { tool: 'walk', args: { dir: 'east', steps: 1 } }],
    ['walk move west go', { tool: 'walk', args: { dir: 'west', steps: 1 } }],
    ['open show the news army summons map tab', { tool: 'open_tab', args: { tab: 'news' } }],
    ['what is on my screen now where am i', { tool: 'read_screen', args: {} }]
  ];
  function words(t) { return String(t).toLowerCase().match(/[a-z]+/g) || []; }
  function ranked(question) {
    var q = words(question);
    return EXAMPLES.map(function (e, i) { return { e: e, i: i, n: words(e[0]).filter(function (w) { return w.length > 2 && q.indexOf(w) >= 0; }).length }; })
      .sort(function (a, b) { return b.n - a.n || a.i - b.i; }).map(function (x) { return x.e; });
  }
  // system(facts, question) → the system prompt: one line per tool, the nearest examples, then the page facts.
  function system(facts, question) {
    return 'You are the guide of the tutorial cabin on the PreceptorOS web map. Reply with ONE JSON tool call ' +
      '{"tool":...,"args":{...}}. Tools:\n' + REGISTRY.map(function (t) { return '- ' + t.line; }).join('\n') +
      '\nYou never press, spend or sign for the visitor: to summon, hatch or play, use point_at and the visitor presses. ' +
      'After a tool result, finish with answer. Examples: ' + ranked(question).slice(0, 3).map(function (e) { return '"' + e[0] + '" -> ' + JSON.stringify(e[1]); }).join('; ') +
      '. ' + String(facts || '');
  }

  function frame(name, args, said) {
    var a = args.dir ? args.dir + ' ×' + args.steps : (args.tab || args.target || '');
    return cut('Guide · ' + name + (a ? ' ' + a : '') + ' · ' + String(said).replace(/\s+/g, ' '), MAX_FRAME - 1);
  }
  function frames(n) { return new Promise(function (ok) { var i = 0; (function f() { if (++i >= n) { ok(); } else { root.requestAnimationFrame(f); } })(); }); }

  // The tools. env = { doc, win }; each returns the text the model and the radio read.
  var TOOLS = {
    read_screen: function (env) {
      if (typeof env.win.preceptorScreen === 'function') { try { return cut(JSON.stringify(env.win.preceptorScreen()), 900); } catch (e) { return 'NO_DATA: the screen frame failed: ' + e.message; } }
      var parts = ['#state', '#floor-state', '#joy .state', '#visitor-play [role="status"]'].map(function (q) { var n = env.doc.querySelector(q); return n && n.textContent.trim(); }).filter(Boolean);
      var tab = env.doc.querySelector('[role="tab"][aria-selected="true"]');
      if (!parts.length && !tab) { return 'NO_DATA: no screen frame and no state lines on this page'; }
      return cut('Screen · tab ' + (tab ? tab.textContent.trim() : 'NO_DATA') + ' · ' + parts.join(' · '), 900);
    },
    open_tab: function (env, a) {
      var T = env.win.AtlasTerminalTabs;
      if (!T || !env.doc.getElementById('tab-' + a.tab)) { return 'NO_DATA: the tabs are not on this page'; }
      T.select('tab-' + a.tab); return 'The ' + a.tab + ' tab is open.';
    },
    walk: async function (env, a) {
      var W = env.win.AtlasVisitorWalk;
      if (W && typeof W.step === 'function') { var last = ''; for (var s = 0; s < a.steps; s++) { last = String(await W.step(a.dir)); } return 'You walk ' + a.dir + ' ×' + a.steps + ' · ' + last; }
      // The arrow-key node law (colony_controls.js): an arrow chooses the neighbour, Enter walks there.
      var KEYS = { east: 'ArrowRight', west: 'ArrowLeft', 'north-east': 'ArrowUp', 'south-west': 'ArrowDown' };
      var status = env.doc.querySelector('#joy .state');
      if (!KEYS[a.dir] || !status) { return 'NO_DATA: walking ' + a.dir + ' needs the free walk, which is not on this page'; }
      var done = 0, said = '';
      for (var i = 0; i < a.steps; i++) {
        env.doc.body.dispatchEvent(new KeyboardEvent('keydown', { key: KEYS[a.dir], bubbles: true }));
        said = status.textContent.trim();
        if (/^NO_DATA/.test(said)) { break; }
        env.doc.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        done++; await frames(90); said = status.textContent.trim();
      }
      return (done ? 'You walk ' + a.dir + ' ×' + done + ' · ' : 'You stay · ') + (said || 'NO_DATA: no walk status');
    },
    point_at: function (env, a) {
      if (SHEET[a.target] && env.win.AtlasTerminalTabs) { env.win.AtlasTerminalTabs.select('tab-' + SHEET[a.target]); }
      var b = a.target === 'skip_tutorial' ? Array.prototype.filter.call(env.doc.querySelectorAll(TARGETS.skip_tutorial), function (n) { return n.textContent.trim() === 'Skip tutorial'; })[0] : env.doc.querySelector(TARGETS[a.target]);
      if (!b && a.target !== 'play_now' && env.doc.querySelector('#visitor-start')) { b = env.doc.querySelector('#visitor-start'); }
      if (!b) { return 'NO_DATA: the ' + a.target + ' button is not on the screen now'; }
      mark(env, b, a.target);
      if (typeof b.focus === 'function') { b.focus({ preventScroll: false }); }
      // The visitor panel redraws its buttons on every change: the mark is put back on the redrawn button.
      var box = env.doc.getElementById('visitor-play');
      if (box && !box.dataset.guideWatch) { box.dataset.guideWatch = '1'; box.addEventListener('visitor:render', function () { var t = box.dataset.guideTarget, n = t && TARGETS[t] && env.doc.querySelector(TARGETS[t]); if (n) { mark(env, n, t); } }); }
      var label = (b.tagName === 'INPUT' ? 'the chat box' : b.textContent.trim()).slice(0, 120);
      return 'Needs you: press ' + label;
    },
    answer: function (env, a) { return cut(a.text, MAX_ANSWER * 4); }
  };

  // mark(env, button, target): outline plus words, never colour only. Nothing is pressed.
  function mark(env, b, target) {
    env.doc.querySelectorAll('[data-guide-pointed]').forEach(function (n) { n.removeAttribute('data-guide-pointed'); n.style.outline = ''; });
    b.setAttribute('data-guide-pointed', target); b.style.outline = '4px dashed currentColor'; b.style.outlineOffset = '3px';
    var box = env.doc.getElementById('visitor-play'); if (box) { box.dataset.guideTarget = target; }
  }
  function parse(text) { try { return JSON.parse(text); } catch (e) { return null; } }

  // run(question, opts) → { answer, steps:[{tool, args, said, frame, ms, valid}] }.
  // opts = { complete(messages, schema) → Promise<text>, env, log(frame), facts, now() }. At most MAX_STEPS tool steps.
  async function run(question, opts) {
    var env = opts.env, log = opts.log || function () {}, now = opts.now || function () { return 0; };
    var messages = [{ role: 'system', content: system(opts.facts, question) }, { role: 'user', content: String(question) }];
    var steps = [], answer = null, pointed = null;
    for (var i = 0; i < MAX_STEPS && answer === null; i++) {
      var t0 = now(), raw = await opts.complete(messages, schema()), call = parse(raw), v = validate(call), ms = now() - t0;
      if (!v.ok) { var bad = frame('rejected', {}, 'NO_DATA: ' + v.cause); log(bad); steps.push({ tool: null, args: null, said: bad, frame: bad, ms: ms, valid: false }); break; }
      var said = await TOOLS[call.tool](env, call.args);
      if (call.tool === 'point_at' && /^Needs you/.test(said)) { pointed = said; }
      var f = frame(call.tool, call.args, said); log(f);
      steps.push({ tool: call.tool, args: call.args, said: said, frame: f, ms: ms, valid: true });
      // answer ends the turn; so does a pointed button: the next move is the carbon's press, not another tool.
      if (call.tool === 'answer') { answer = said; break; }
      if (pointed) { break; }
      messages.push({ role: 'assistant', content: JSON.stringify(call) }, { role: 'tool', content: cut(said, 900) });
    }
    // Deterministic close: a pointed button always ends with its «Needs you» line, whatever the model wrote.
    if (pointed && (answer === null || answer.indexOf('Needs you') < 0)) { answer = pointed + (answer ? ' · ' + answer : ''); }
    if (answer === null) { answer = steps.length && steps[steps.length - 1].valid ? steps[steps.length - 1].said : 'NO_DATA: the guide gave no valid tool call'; }
    return { answer: cut(answer, 600), steps: steps };
  }

  root.AtlasGuideTools = { REGISTRY: REGISTRY, TARGETS: TARGETS, MAX_STEPS: MAX_STEPS, MAX_FRAME: MAX_FRAME, schema: schema, validate: validate, ranked: ranked, system: system, run: run, tools: TOOLS };
})(globalThis);
