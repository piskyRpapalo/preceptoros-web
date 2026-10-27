(function (root) {
  'use strict';
  var node = typeof module === 'object' && !!module.exports;
  var P = node ? require('./en301_practice_model.js') : root.AtlasPracticeModel;
  // [W] O1b (2026-10-27): the practice is drawn by the ONE combat face, the wave duel, LIVE over the practice's own log.
  // The 16x16 silhouettes are retired; the model, its receipt and these controls are unchanged.
  var W = node ? null : root.AtlasWaveDuel;
function mount(doc, host, options) {
  if (!options || !options.seed) throw new Error('Missing seed');
  let session = P.create(options.seed);
  let closed = false;
  let finishSent = false;
  const section = doc.createElement('section');
  section.className = 'en301-arena';
  const h3 = doc.createElement('h3');
  h3.textContent = 'Arena101 local practice';
  const p1 = doc.createElement('p');
  p1.textContent = 'SIMULATED no signed result';
  const p2 = doc.createElement('p');
  p2.setAttribute('role', 'status');
  p2.setAttribute('aria-live', 'polite');
  p2.textContent = '';
  const lienzo = doc.createElement('canvas');
  lienzo.className = 'en301-duel';
  const col0 = doc.createElement('div');
  col0.className = 'en301-commander';
  const label0 = doc.createElement('p');
  label0.textContent = '';
  const hp0 = doc.createElement('p');
  hp0.textContent = '';
  col0.appendChild(label0);
  col0.appendChild(hp0);
  
  const col1 = doc.createElement('div');
  col1.className = 'en301-commander';
  const label1 = doc.createElement('p');
  label1.textContent = '';
  const hp1 = doc.createElement('p');
  hp1.textContent = '';
  col1.appendChild(label1);
  col1.appendChild(hp1);

  const actionsRow = doc.createElement('div');
  actionsRow.className = 'en301-actions';
  const shieldBtn = doc.createElement('button');
  shieldBtn.textContent = 'Shield';
  shieldBtn.className = 'en301-practice-action';
  const pikeBtn = doc.createElement('button');
  pikeBtn.textContent = 'Pike';
  pikeBtn.className = 'en301-practice-action';
  const bowBtn = doc.createElement('button');
  bowBtn.textContent = 'Bow';
  bowBtn.className = 'en301-practice-action';
  actionsRow.appendChild(shieldBtn);
  actionsRow.appendChild(pikeBtn);
  actionsRow.appendChild(bowBtn);

  const nextRoundBtn = doc.createElement('button');
  nextRoundBtn.textContent = 'Next round';
  const resolveBtn = doc.createElement('button');
  resolveBtn.textContent = 'Resolve practice';
  
  const inputDiv = doc.createElement('div');
  const input = doc.createElement('input');
  input.type = 'number';
  input.min = '1';
  input.max = '1';
  input.value = '1';
  input.setAttribute('aria-label', 'Branch before round');
  const branchBtn = doc.createElement('button');
  branchBtn.textContent = 'Branch before round';
  inputDiv.appendChild(input);
  inputDiv.appendChild(branchBtn);

  const details = doc.createElement('details');
  const summary = doc.createElement('summary');
  summary.textContent = 'Measured practice data';
  const pre = doc.createElement('pre');
  details.appendChild(summary);
  details.appendChild(pre);

  const finishBtn = doc.createElement('button');
  finishBtn.textContent = 'Continue tutorial';
  finishBtn.disabled = true;

  section.appendChild(h3);
  section.appendChild(p1);
  section.appendChild(p2);
  section.appendChild(lienzo);
  section.appendChild(col0);
  section.appendChild(col1);
  section.appendChild(actionsRow);
  section.appendChild(nextRoundBtn);
  section.appendChild(resolveBtn);
  section.appendChild(inputDiv);
  section.appendChild(details);
  section.appendChild(finishBtn);

  host.appendChild(section);

  // The live combat the wave duel reads: getters, so a step or a branch is seen on the next frame.
  let escena = null;
  const vivo = { get registro() { return session.trace(); }, get gana() { const f = session.frame(); return f.ended ? f.winner : null; } };
  // [W] O2: the practice sounds through the same duel voice; silent until the player turns audio on.
  function sonido(tipo, tropa, sello) { const S = root.AtlasSintesis; if (S && S.suenaDuelo) { S.suenaDuelo(tipo, sello, 0); } }
  function monta() {
    if (escena) { escena.para(); escena = null; }
    if (!W) { return; }
    const t = P.teams(options.seed);
    escena = W.escena(lienzo, [t.def], [t.asa], vivo, { vivo: true, semilla: options.seed, yo: 1, emulado: 0, ronda: 'Round {r}', sonido: sonido });
  }

  function render() {
    const f = session.frame();
    p2.textContent = `Round ${f.tick} | Ready at tick ${f.ready_at}`;
    
    if (f.units[0]) {
      label0.textContent = 'Commander A';
      hp0.textContent = `${f.units[0].hp}/${f.units[0].max}`;
    }

    if (f.units[1]) {
      label1.textContent = 'Commander B';
      hp1.textContent = `${f.units[1].hp}/${f.units[1].max}`;
    }

    const isEnded = !!f.ended;
    nextRoundBtn.disabled = isEnded;
    resolveBtn.disabled = isEnded;
    shieldBtn.disabled = isEnded || (f.tick + 1 < f.ready_at);
    pikeBtn.disabled = isEnded || (f.tick + 1 < f.ready_at);
    bowBtn.disabled = isEnded || (f.tick + 1 < f.ready_at);

    if (f.stance) {
      const stanceText = `Selected stance: ${f.stance}`;
      p2.textContent += ' | ' + stanceText;
    }

    input.max = f.tick + 1;
    
    const receipt = isEnded ? session.receipt() : null;
    const verified = receipt && receipt.ok && P.verify(receipt.packet).ok;
    finishBtn.disabled = closed || finishSent || !verified;
    pre.textContent = JSON.stringify({ frame: f, receipt: receipt && receipt.ok ? receipt.packet : null });
    if (options.onNarrate) { options.onNarrate(p2.textContent + '. Commander A ' + hp0.textContent + '. Commander B ' + hp1.textContent + (verified ? '. Practice replay verified. Continue tutorial is ready.' : '')); }
  }

  function handleAction(stance) {
    if (closed) { return; }
    const result = session.choose(stance);
    if (options.onNarrate && result.cause) options.onNarrate(result.cause);
    render();
  }

  shieldBtn.addEventListener('click', () => handleAction('shield'));
  pikeBtn.addEventListener('click', () => handleAction('pike'));
  bowBtn.addEventListener('click', () => handleAction('bow'));

  nextRoundBtn.addEventListener('click', () => {
    if (closed) { return; }
    const result = session.step();
    if (options.onNarrate && result.cause) options.onNarrate(result.cause);
    render();
  });

  resolveBtn.addEventListener('click', () => {
    if (closed) { return; }
    for (let i = 0; i < 40; i++) {
      const stepResult = session.step();
      if (options.onNarrate && stepResult.cause) options.onNarrate(stepResult.cause);
      render();
      if (session.frame().ended) break;
    }
  });

  branchBtn.addEventListener('click', () => {
    if (closed) { return; }
    const value = Number(input.value);
    if (Number.isSafeInteger(value)) {
      const forkResult = session.fork(value);
      if (forkResult.ok) {
        session = forkResult.session;
        monta();
        render();
        if (options.onNarrate) options.onNarrate('Branch created');
      } else {
        p2.textContent = forkResult.cause;
        if (options.onNarrate) options.onNarrate(forkResult.cause);
      }
    } else {
      p2.textContent = 'Choose a whole round from 1 to ' + (session.frame().tick + 1) + '.';
      if (options.onNarrate) options.onNarrate(p2.textContent);
    }
  });

  finishBtn.addEventListener('click', () => {
    if (closed) { return; }
    if (!finishSent && options.onFinish) {
      const receipt = session.receipt();
      if (receipt.ok && P.verify(receipt.packet).ok) {
        finishSent = true;
        finishBtn.disabled = true;
        options.onFinish(receipt.packet);
      }
    }
  });

  monta();
  render();

  return {
    destroy() {
      closed = true;
      if (escena) { escena.para(); escena = null; }
      if (section.parentNode === host) host.removeChild(section);
    },
    ready: () => {
      if (closed || finishSent) return false;
      const receipt = session.receipt();
      return !!(receipt.ok && P.verify(receipt.packet).ok);
    },
    state: () => session.frame(),
    session: () => session
  };
}
var api = { mount: mount };
if (node) { module.exports = api; } else { root.AtlasPracticeArena = api; }
})(this);
