(function (root) {
  'use strict';
  var doc = root.document, box = doc.getElementById('visitor-play');
  if (!box) { return; }
  var game = null, account = null, waiting = false;
  var heading = doc.createElement('h2'); heading.textContent = 'Play without a node'; box.append(heading);
  var notice = doc.createElement('p'); notice.textContent = 'Your visit key stays in memory and ends with this page. Only explicitly adopted troops are saved. After leaving, you can view those records but cannot sign for them. No persistent identity is created.'; box.append(notice);
  var status = doc.createElement('p'); status.setAttribute('role', 'status'); box.append(status);
  var controls = doc.createElement('div'); box.append(controls);
  var details = doc.createElement('div'); box.append(details);
  function button(text, id, action, disabled) {
    var b = doc.createElement('button'); b.type = 'button'; b.id = id; b.textContent = text;
    b.style.minHeight = '44px'; b.style.minWidth = '44px'; b.disabled = waiting || !!disabled;
    b.addEventListener('click', async function () {
      if (waiting) { return; } waiting = true; render();
      try { await action(); status.textContent = 'Action completed in this visit.'; }
      catch (error) { status.textContent = 'NO_DATA: ' + error.message; }
      finally { waiting = false; render(); }
    }); controls.append(b); return b;
  }
  function line(text) { var p = doc.createElement('p'); p.textContent = text; details.append(p); }
  function render() {
    controls.replaceChildren(); details.replaceChildren();
    if (!game) {
      button('Start an ephemeral visit', 'visitor-start', async function () { account = await root.AtlasVisitorAccount.create(true); game = await root.AtlasVisitorEggs.create(account); });
      return;
    }
    var s; try { s = game.state(); } catch (_) { game = null; account = null; render(); return; }
    line('Copper ' + s.copper + ' · Light ' + s.light + ' · Step ' + s.step + ' · Troops ' + s.troops.length + ' · Pity NO_DATA: not approved.');
    var star = doc.createElement('p'); star.id = 'visitor-voice-star'; star.textContent = 'Voice Star ' + s.echoes + '/' + s.echoCap; controls.append(star);
    button('Visit the beacon · claim 100 copper once', 'visitor-beacon', function () { game.beacon(); }, s.claimed);
    button('Advance one game step', 'visitor-step', function () { game.advance(); });
    Object.keys(root.AtlasGacha.TCS).forEach(function (tc) {
      var cost = root.AtlasGacha.TCS[tc].coste, odds = root.AtlasGacha.odds(tc);
      line(tc + ' · ' + cost.cobre + ' copper / ' + cost.luz + ' light · odds per thousand: ' + root.AtlasGacha.RAREZAS.map(function (r, i) { return r + ' ' + odds[i]; }).join(', '));
      button('Sign invocation · ' + tc, 'visitor-summon-' + tc, function () { return game.summon(tc, true); }, s.copper < cost.cobre || s.light < cost.luz);
    });
    s.eggs.forEach(function (egg) { button('Sign adoption · egg ' + egg.seq + (egg.ready ? ' · ready' : ' · ' + egg.remaining + ' steps'), 'visitor-hatch-' + egg.seq, async function () { var after = await game.hatch(egg.seq, true); var R = root.AtlasHatchReveal; if (R) { R.show(after, function (t) { status.textContent = t; }); } }, !egg.ready); });
    s.chronicle.forEach(function (e) { line('Invocation ' + e.seq + ' · ' + e.tc + ' · seal ' + e.sello + ' · ' + e.rareza); });
    button('End this visit', 'visitor-end', function () { game.end(); box.dispatchEvent(new Event('visitor:end')); game = null; account = null; });
    box.dispatchEvent(new CustomEvent('visitor:render', { detail: { state: s, game: game, account: account, controls: controls } }));
  }
  // Free walk: each accepted step on the floor is one game step of an active visit, so walking hatches eggs.
  box.addEventListener('visitor:advance', function () { if (!game || waiting) { return; } try { game.advance(); } catch (_) { return; } render(); });
  // Voice Star: the web node brain dispatches brain:answer after each verified local answer.
  doc.addEventListener('brain:answer', async function (event) {
    var log = doc.getElementById('state'), say = function (t) { if (log) { log.textContent = t; } };
    var d = event.detail || {};
    if (!game) { say('Voice Star: NO_DATA · start a visit first'); return; }
    try { var s = await game.echo({ verified: d.verified, model: d.model, text: d.text, sha: d.sha }); render(); say('Voice Star: +25 copper for a verified answer (' + s.echoes + ' of ' + s.echoCap + ')'); }
    catch (error) {
      var capped = false; try { capped = game && game.state().echoes >= game.state().echoCap; } catch (_) {}
      say(capped ? 'Voice Star: this visit already earned its 4 echoes' : 'Voice Star: NO_DATA · ' + error.message);
    }
  });
  render();
})(globalThis);
