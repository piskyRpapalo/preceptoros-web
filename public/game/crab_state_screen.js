/* theGame · pliego-estado: un guion fijo que reubica renders del estado ya medido.
   No posee estado ni calcula cifras: AtlasCasa, AtlasCasaMedidas y atlas-piso siguen siendo las fuentes. */
(function (raiz) {
  'use strict';
  var SECCIONES = [
    { id: 'who', titulo: 'state_who' },
    { id: 'body', titulo: 'state_body' },
    { id: 'core', titulo: 'state_core' },
    { id: 'budget', titulo: 'state_budget' },
    { id: 'receipts', titulo: 'state_receipts' },
    { id: 'actions', titulo: 'state_actions' }
  ];
  var FALLBACK = { state_who: 'WHO YOU ARE', state_body: 'YOUR BODY', state_core: 'CORE AND RIFT',
    state_budget: 'YOUR BUDGET', state_receipts: 'RECEIPTS', state_actions: 'WHAT YOU CAN DO', state_summon: 'Go to Summoning' };
  function guion() { return SECCIONES.map(function (s) { return { id: s.id, titulo: s.titulo }; }); }
  function el(d, tag, cls) { var n = d.createElement(tag); if (cls) { n.className = cls; } return n; }
  function monta(casa, ctx) {
    var d = raiz.document;
    if (!casa || !d || casa.querySelector('#crab-state-screen')) { return null; }
    var screen = el(d, 'div', 'crab-state-screen'); screen.id = 'crab-state-screen';
    var slots = {};
    SECCIONES.forEach(function (s) {
      var sec = el(d, 'section', 'crab-state-section'); sec.dataset.section = s.id;
      var h = el(d, 'h4', 'crab-state-title'); h.textContent = ctx.T(s.titulo) || FALLBACK[s.titulo]; sec.appendChild(h);
      var body = el(d, 'div', 'crab-state-content'); sec.appendChild(body); slots[s.id] = body; screen.appendChild(sec);
    });
    var who = casa.querySelector('.casa-identidad'), lateral = casa.querySelector('.casa-lateral');
    var core = casa.querySelector('.atlas-cab'), rift = casa.querySelector('.atlas-alerta');
    var resources = casa.querySelector('.atlas-recursos'), live = casa.querySelector('.atlas-vivo');
    if (who) { slots.who.appendChild(who); }
    if (lateral) { slots.body.appendChild(lateral); }
    if (core) { slots.core.appendChild(core); }
    if (rift) { slots.core.appendChild(rift); }
    if (resources) { slots.budget.appendChild(resources); }
    if (live) { slots.receipts.appendChild(live); }
    var saveReceipt = d.querySelector('.atlas-guardado');
    if (saveReceipt) { slots.receipts.appendChild(saveReceipt); }
    var a = el(d, 'a', 'boton-sec crab-state-summon'); a.href = '#thegame-ondas'; a.textContent = ctx.T('state_summon') || FALLBACK.state_summon;
    a.addEventListener('click', function (ev) {
      ev.preventDefault();
      if (raiz.TheGame && raiz.TheGame.ve) {
        raiz.TheGame.ve('ondas');
        Promise.resolve(raiz.TheGame.army ? raiz.TheGame.army() : null).then(function () {
          var summon = d.querySelector('.atlas-incubadora');
          if (summon) { summon.scrollIntoView({ block: 'start' }); }
        });
      }
      else { a.setAttribute('aria-disabled', 'true'); }
    });
    slots.actions.appendChild(a);
    casa.insertBefore(screen, casa.firstChild);
    return screen;
  }
  var API = { SECCIONES: SECCIONES, guion: guion, monta: monta };
  if (typeof module === 'object' && module.exports) { module.exports = API; }
  else { raiz.AtlasCrabStateScreen = API; }
})(this);
