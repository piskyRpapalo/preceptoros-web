/* preceptoros.org · theGame · EL POLVO DE TALLER (P9, firmado por el Soberano el 2026-10-11).

   «Desintegrar las ondas que no quieres da RESIDUO ESTATICO (una cuadrada, unos 4 g; un leviatan fallido,
   mas); con el residuo, LIJAR aristas SUBE atributos, JAMAS anade aristas: anadir es un Summon nuevo. Un
   reciclador, no una tienda» (Soberano; corpus: «6 planes.txt»:144-155, LEEME:1155-1157).

   PURO como la gacha: ni DOM, ni red, ni reloj, ni azar. Aqui viven las reglas y el RECIBO ENCADENADO
   (`atlas.taller/1`): cada operacion apunta al sha256 de la anterior y lleva el saldo que deja. El estado
   (cuanto residuo tienes, que lijaste, que desintegraste) NO se guarda aparte: sale de recorrer la cadena,
   que se comprueba entera. Valor visible ANTES de destruir: `residuo(t)` se ensena en el boton.

   QUIEN FIRMA: la persona, con su clave (IronClaw), como al adoptar. La web pinta y pide la firma; el
   Army solo suelta una tropa con su recibo firmado (`db.js`, `retira`).

   DONDE CUENTA LO LIJADO: en la practica contra los NPC (`arena.js`, `unidades`). En los duelos entre
   personas NO, hasta que la cadena viaje dentro del sobre y el otro la pueda comprobar: sin eso, cualquiera
   podria decir que lijo lo que no lijo. Se dice en pantalla. */
(function (raiz) {
  'use strict';
  var EN_NODE = typeof module === 'object' && module.exports;
  var V = EN_NODE ? require('./valores.js') : raiz.AtlasValores;
  var G = EN_NODE ? require('./gacha.js') : raiz.AtlasGacha;
  var K = EN_NODE ? require('./canon.js') : raiz.AtlasCanon;
  var TA = V.taller, LI = TA.lija, BA = V.banderas, CERO = new Array(65).join('0');

  /* Las aristas de una tropa: las suyas, o MEDIDAS si es de la version anterior (sin el campo). */
  function aristasDe(t) { return t.aristas || G.aristas(t); }
  /* Gramos de residuo al desintegrar: un gramo por arista; el Leviatan (mas de 12), `leviatan_x` veces. */
  function residuo(t) { var n = aristasDe(t); return n * TA.gramos_por_arista * (n > 12 ? TA.leviatan_x : 1); }
  /* Lo que cuesta subir un stat al nivel `nivel` (1..max): base * nivel. */
  function coste(nivel) { return LI.base * nivel; }

  /* LA TROPA LIJADA: los mismos armonicos y las mismas aristas; solo suben los stats lijados. */
  function aplica(t, lija) {
    var c = JSON.parse(JSON.stringify(t));
    Object.keys(lija || {}).forEach(function (k) { if (LI.stats.indexOf(k) >= 0) { c.stats[k] += lija[k] * LI.paso; } });
    return c;
  }

  /* El recibo siguiente de una cadena (sin firmar): `op` = { op: 'desintegra', tropa } o
     { op: 'lija', semilla, stat }. Lanza si la regla no lo permite. */
  function recibo(estado, op, clave) {
    var r = { esquema: 'atlas.taller/1', op: op.op, prev: estado.ultimo, clave_publica: clave };
    if (op.op === 'desintegra') {
      var t = op.tropa;
      if (estado.disueltas[t.semilla]) { throw new Error('ya desintegrada'); }
      r.semilla = t.semilla; r.tc = t.tc; r.aristas = aristasDe(t); r.gramos = residuo(t);
    } else if (op.op === 'lija') {
      if (LI.stats.indexOf(op.stat) < 0) { throw new Error('stat'); }
      if (estado.disueltas[op.semilla]) { throw new Error('desintegrada'); }
      var nv = ((estado.lijas[op.semilla] || {})[op.stat] || 0) + 1;
      if (nv > LI.max) { throw new Error('tope'); }
      if (estado.saldo < coste(nv)) { throw new Error('sin residuo'); }
      r.semilla = op.semilla; r.stat = op.stat; r.nivel = nv; r.gramos = -coste(nv);
    } else if (op.op === 'tinte') {
      /* P10 · PRISMA DE BANDERA: tenir una onda al color de tu bandera (de la paleta cerrada). Solo aspecto. */
      if (!(op.bandera in BA)) { throw new Error('bandera'); }
      if (estado.disueltas[op.semilla]) { throw new Error('desintegrada'); }
      if (estado.tintes[op.semilla] === op.bandera) { throw new Error('ya tenida'); }
      if (estado.saldo < TA.tinte.coste) { throw new Error('sin residuo'); }
      r.semilla = op.semilla; r.bandera = op.bandera; r.gramos = -TA.tinte.coste;
    } else { throw new Error('op'); }
    r.saldo = estado.saldo + r.gramos;
    return r;
  }

  /* RECORRER LA CADENA: [{ recibo, firma }] -> el estado, o { error } con el primer eslabon roto.
     Comprueba el enlace (prev = sha256 del recibo anterior), la regla de cada operacion, el saldo y que la
     clave sea siempre la misma. Las FIRMAS las comprueba quien tiene el verificador (`verificaFirmas`). */
  function estado(cadena) {
    var e = { saldo: 0, lijas: {}, disueltas: {}, tintes: {}, ultimo: CERO, clave: null, n: 0 };
    for (var i = 0; i < (cadena || []).length; i++) {
      var r = cadena[i] && cadena[i].recibo, esperado;
      if (!r || r.esquema !== 'atlas.taller/1' || r.prev !== e.ultimo) { return { error: 'eslabon ' + i + ': enlace' }; }
      if (e.clave && r.clave_publica !== e.clave) { return { error: 'eslabon ' + i + ': otra clave' }; }
      try {
        esperado = recibo(e, r.op === 'desintegra' ? { op: r.op, tropa: { semilla: r.semilla, tc: r.tc, aristas: r.aristas, armonicos: [] } }
          : { op: r.op, semilla: r.semilla, stat: r.stat, bandera: r.bandera }, r.clave_publica);
      } catch (x) { return { error: 'eslabon ' + i + ': ' + x.message }; }
      if (JSON.stringify(esperado) !== JSON.stringify(r)) { return { error: 'eslabon ' + i + ': cuentas' }; }
      if (r.op === 'desintegra') { e.disueltas[r.semilla] = true; }
      else if (r.op === 'tinte') { e.tintes[r.semilla] = r.bandera; }
      else { e.lijas[r.semilla] = e.lijas[r.semilla] || {}; e.lijas[r.semilla][r.stat] = r.nivel; }
      e.saldo = r.saldo; e.clave = r.clave_publica; e.ultimo = K.sha(JSON.stringify(r)); e.n++;
    }
    return e;
  }
  /* Las firmas de toda la cadena, con el verificador inyectado (WebCrypto en la pestana, crypto en node). */
  function verificaFirmas(cadena, verifica) {
    return Promise.all((cadena || []).map(function (x) {
      var m = /^ed25519:([0-9a-f]{128})$/.exec(x.firma || '');
      return m ? Promise.resolve(verifica(JSON.stringify(x.recibo), m[1], x.recibo.clave_publica)) : false;
    })).then(function (l) { return l.every(Boolean); });
  }

  var AtlasTaller = { residuo: residuo, coste: coste, aplica: aplica, recibo: recibo, estado: estado, verificaFirmas: verificaFirmas, CERO: CERO };
  if (EN_NODE) { module.exports = AtlasTaller; } else { raiz.AtlasTaller = AtlasTaller; }
})(this);
