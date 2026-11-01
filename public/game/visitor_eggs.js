(function (root) {
  'use strict';
  var ECHO_CAP = 4, ECHO_COPPER = 25, encode = new TextEncoder();
  async function sha256(text) { return Array.from(new Uint8Array(await root.crypto.subtle.digest('SHA-256', encode.encode(text))), function (v) { return v.toString(16).padStart(2, '0'); }).join(''); }
  async function create(account) {
    var A = root.AtlasArmy, G = root.AtlasGacha, info = account.info();
    var copper = 0, light = 0, claimed = false, echoes = 0, step = 0, chain = [], pending = [], busy = false, ended = false;
    var army = A.crea(A.verificaWeb);
    function alive() { account.info(); if (ended) { throw new Error('Visit has ended'); } }
    function state() { alive(); return { copper: copper, light: light, step: step, claimed: claimed, echoes: echoes, echoCap: ECHO_CAP, eggs: pending.map(function (e) { return { seq: e.seq, tc: e.tc, ready: e.until <= step, remaining: Math.max(0, e.until - step) }; }), troops: army.lista(), chronicle: A.cronica(chain, G.tirada), busy: busy }; }
    return Object.freeze({
      state: state,
      beacon: function () { alive(); if (claimed) { throw new Error('Beacon already claimed in this visit'); } claimed = true; copper += 100; return state(); },
      // Voice Star: a verified model answer earns copper; the visit chain holds signed invocations only, so no receipt is added.
      echo: async function (answer) {
        alive(); if (echoes >= ECHO_CAP) { throw new Error('This visit already earned its ' + ECHO_CAP + ' echoes'); }
        if (!answer || answer.verified !== true || typeof answer.model !== 'string' || !answer.model || typeof answer.text !== 'string' || typeof answer.sha !== 'string' || !/^[a-f0-9]{64}$/.test(answer.sha)) { throw new Error('Answer is not verified'); }
        var sha = await sha256(answer.text); alive();
        if (sha !== answer.sha) { throw new Error('Answer hash does not match its text'); }
        if (echoes >= ECHO_CAP) { throw new Error('This visit already earned its ' + ECHO_CAP + ' echoes'); }
        echoes++; copper += ECHO_COPPER; return state();
      },
      advance: function () { alive(); step++; return state(); },
      summon: async function (tc, consent) {
        alive(); if (busy || consent !== true) { throw new Error('One explicit invocation at a time'); }
        if (!Object.prototype.hasOwnProperty.call(G.TCS, tc)) { throw new Error('Unknown egg class'); }
        var cost = G.TCS[tc].coste;
        if (copper < cost.cobre || light < cost.luz) { throw new Error('Insufficient copper or light'); }
        busy = true;
        try {
          var record = A.eslabon(chain, tc, info.publicKey), signature = await account.sign(record, true);
          var seed = await A.semillaWeb(signature); alive();
          chain = A.anexa(chain, record, signature, seed, step, step + G.TCS[tc].incuba);
          pending.push({ seq: record.seq, tc: tc, seed: seed, until: step + G.TCS[tc].incuba });
          copper -= cost.cobre; light -= cost.luz; return state();
        } finally { busy = false; }
      },
      hatch: async function (seq, consent) {
        alive(); if (busy || consent !== true) { throw new Error('Explicit adoption consent is required'); }
        var egg = pending.find(function (e) { return e.seq === seq; });
        if (!egg || egg.until > step) { throw new Error('Egg is not ready'); }
        busy = true;
        try {
          var troop = G.tirada(egg.seed, egg.tc), adoption = A.adopcion(troop, info.name, info.publicKey);
          var signature = await account.sign(adoption, true); alive();
          var candidate = A.crea(A.verificaWeb);
          await candidate.adopta(adoption, signature);
          // Existing records remain evidence; a fresh visit never restores their signing authority.
          await A.appendAdoption({ adopcion: adoption, firma: signature });
          alive(); await army.adopta(adoption, signature);
          pending = pending.filter(function (e) { return e !== egg; }); chain = A.abre(chain, seq);
          var out = state(); out.hatched = troop; return out;   // H1b: the new troop, for the egg-opening reveal
        } finally { busy = false; }
      },
      end: function () { ended = true; pending = []; chain = []; account.end(); }
    });
  }
  root.AtlasVisitorEggs = Object.freeze({ create: create });
})(globalThis);
