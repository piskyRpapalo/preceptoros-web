(function (root) {
  'use strict';
  var doc = root.document, box = doc.getElementById('visitor-play');
  if (!box) { return; }
  var game = null, account = null, waiting = false, hatching = {};
  var mapHeading = doc.getElementById('map-h'), mapSurface = doc.getElementById('surface'), visitName = null;
  function updateMapHeading() {
    var view = root.AtlasOpenworldView && root.AtlasOpenworldView(), controls = view && view.controls;
    var p = controls && controls.walker ? controls.walker() : null;
    if (mapHeading) { root.AtlasPlaceName.mark(mapHeading, p, visitName ? visitName + ' \u00B7 ' : ''); }
  }
  if (mapHeading && mapSurface) {
    box.addEventListener('visitor:render', function (event) {
      try { visitName = event.detail && event.detail.account ? event.detail.account.info().name : null; }
      catch (_) { visitName = null; }
      updateMapHeading();
    });
    box.addEventListener('visitor:end', function () { visitName = null; updateMapHeading(); });
    mapSurface.addEventListener('visitor:draw', updateMapHeading);
  }
  var heading = doc.createElement('h2'); heading.textContent = 'Play without a node'; box.append(heading);
  var notice = doc.createElement('p'); notice.textContent = 'Your visit key stays in memory and ends with this page. Hatched waves go straight to your army and are saved on this device. After leaving, you can view those records but cannot sign for them. No persistent identity is created.'; box.append(notice);
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
  function place(tc) { var B = root.AtlasVisitorBattle, p = B ? B.places().filter(function (x) { return x.troops[0] && x.troops[0].tc === tc; })[0] : null; return p ? p.name : 'House'; }
  function line(text) { var p = doc.createElement('p'); p.textContent = text; details.append(p); }
  // Plug&play (2026-11-01): ONE next-step sentence, the Guide voice of the panel (compact terminal, 2026-11-02), computed from the visit state only.
  var nextText = doc.getElementById('next-text'), playNow = doc.getElementById('play-now');
  function next(s) {
    var t = !s ? 'Press Play now.' : s.copper >= 50 ? 'Summon a wave: press Summon at the Reef below.' :
      (s.eggs.filter(function (e) { return !e.ready; })[0] ? 'Walk ' + s.eggs.filter(function (e) { return !e.ready; })[0].remaining + ' steps to hatch.' : 'Ask the guide in the chat.');
    if (nextText && nextText.textContent !== t) { nextText.textContent = t; }
    if (playNow) { playNow.hidden = !!s; }
  }
  async function start() { account = await root.AtlasVisitorAccount.create(true); game = await root.AtlasVisitorEggs.create(account); }
  if (playNow) {
    playNow.addEventListener('click', async function () {
      if (waiting || game) { return; } waiting = true; playNow.disabled = true;
      try { await start(); status.textContent = 'Action completed in this visit.'; } catch (error) { status.textContent = 'NO_DATA: ' + error.message; }
      finally { waiting = false; playNow.disabled = false; render(); }
    });
  }
  function render() {
    controls.replaceChildren(); details.replaceChildren();
    if (!game) {
      next(null);
      button('Start an ephemeral visit', 'visitor-start', start);
      return;
    }
    var s; try { s = game.state(); } catch (_) { game = null; account = null; render(); return; }
    next(s);
    line('Copper ' + s.copper + ' · Light ' + s.light + ' · Step ' + s.step + ' · Troops ' + s.troops.length + ' · Pity NO_DATA: not approved.');
    var star = doc.createElement('p'); star.id = 'visitor-voice-star'; star.textContent = 'Voice Star ' + s.echoes + '/' + s.echoCap; controls.append(star);
    button('Visit the beacon · claim 100 copper once', 'visitor-beacon', function () { game.beacon(); }, s.claimed);
    // Steps are walked, not pressed (Sovereign, 2026-11-08): every hex the crab walks dispatches visitor:advance.
    var hint = doc.createElement('p'); hint.id = 'visitor-step'; hint.className = 'walk-hint'; hint.textContent = 'Walk your crab: every hex is one step.'; controls.append(hint);
    Object.keys(root.AtlasGacha.TCS).forEach(function (tc) {
      var cost = root.AtlasGacha.TCS[tc].coste, odds = root.AtlasGacha.odds(tc);
      line(tc + ' · ' + cost.cobre + ' copper / ' + cost.luz + ' light · odds per thousand: ' + root.AtlasGacha.RAREZAS.map(function (r, i) { return r + ' ' + odds[i]; }).join(', '));
      // Human labels (Doogee review, 2026-11-02): the place of the tier from the house's own patrol table, its cost, and what is
      // missing said in words when the button is off — never colour alone. The ids stay visitor-summon-tc1..4.
      var lack = [cost.cobre - s.copper > 0 ? (cost.cobre - s.copper) + ' more copper' : '', cost.luz - s.light > 0 ? (cost.luz - s.light) + ' more light' : ''].filter(Boolean);
      button('Summon at the ' + place(tc) + ' · ' + cost.cobre + ' copper' + (cost.luz ? ' + ' + cost.luz + ' light' : '') + (lack.length ? ' · needs ' + lack.join(', ') : ''), 'visitor-summon-' + tc, async function () { var after = await game.summon(tc, true), e = after.eggs[after.eggs.length - 1] || {}; doc.dispatchEvent(new CustomEvent('invocation:signed', { detail: { tc: tc, copper: cost.cobre, seq: e.seq, step: after.step } })); }, s.copper < cost.cobre || s.light < cost.luz);
    });
    // Q-06 (Sovereign, 2026-11-08): no «sign for adoption» step. The call was the consent: a ready egg hatches by itself and its
    // wave goes straight to the army (still signed with the visit key in visitor_eggs.js, so the chain stays verifiable).
    s.eggs.forEach(function (egg) {
      line('Egg ' + egg.seq + (egg.ready ? ' · hatching into your army' : ' · hatches in ' + egg.remaining + ' steps'));
      if (egg.ready && !hatching[egg.seq]) { hatching[egg.seq] = true; game.hatch(egg.seq, true).then(function (after) { var R = root.AtlasHatchReveal; if (R) { R.show(after, function (t) { status.textContent = t; }); } if (!waiting) { render(); } }, function (e) { hatching[egg.seq] = false; status.textContent = 'NO_DATA: ' + e.message; }); }
    });
    s.chronicle.forEach(function (e) { line('Invocation ' + e.seq + ' · ' + e.tc + ' · seal ' + e.sello + ' · ' + e.rareza); });
    button('End this visit', 'visitor-end', function () { game.end(); box.dispatchEvent(new Event('visitor:end')); game = null; account = null; });
    box.dispatchEvent(new CustomEvent('visitor:render', { detail: { state: s, game: game, account: account, controls: controls } }));
  }
  // Buildings feed the quests: entering one and using its action count in this visit (building_sheet.js events).
  doc.addEventListener('building:enter', function (e) { if (game) { try { game.entered(e.detail.id); } catch (_) { /* visit ended */ } } });
  doc.addEventListener('building:act', function () { if (game) { try { game.acted(); } catch (_) { /* visit ended */ } } });
  // Free walk: each accepted step on the floor is one game step of an active visit, so walking hatches eggs.
  box.addEventListener('visitor:advance', function () { if (!game || waiting) { return; } try { game.advance(); } catch (_) { return; } render(); });
  // Voice Star rewards model answers, never the page-grounded controls response.
  doc.addEventListener('brain:answer', async function (event) {
    var log = doc.getElementById('state'), say = function (t) { if (log) { log.textContent = t; } };
    var d = event.detail || {};
    if (!game) { say('Voice Star: NO_DATA · start a visit first'); return; }
    if (d.source !== 'model') { say('Voice Star: NO_DATA · page-grounded guide facts are not a model answer'); return; }
    try { var s = await game.echo({ verified: d.verified, model: d.model, text: d.text, sha: d.sha }); render(); doc.dispatchEvent(new CustomEvent('voicestar:granted', { detail: { copper: 25, sha: d.sha, echoes: s.echoes } })); say('Voice Star: +25 copper for a verified answer (' + s.echoes + ' of ' + s.echoCap + ')'); }
    catch (error) {
      var capped = false; try { capped = game && game.state().echoes >= game.state().echoCap; } catch (_) {}
      say(capped ? 'Voice Star: this visit already earned its 4 echoes' : 'Voice Star: NO_DATA · ' + error.message);
    }
  });
  render();
})(globalThis);
