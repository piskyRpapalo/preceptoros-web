/* preceptoros.org · el CANAL hacia el laboratorio · EN CUARENTENA: compilado y probado, NO servido.

   Orden del Soberano (2026-09-28/29): firma humana en el navegador -> sobre (`atlas.lab_envio/1`) -> LLEGA
   -> se verifica en la puerta -> registro encadenado fuera de public/ -> ACUSE (`atlas.lab_acuse/1`) que la
   web verifica. Destino firmado: `api.preceptoros.org`, con gesto explicito, con el informe de la Aduana a
   la vista antes de que salga nada, y el PR al repositorio publico como respaldo mientras no haya acuse
   verificado. Vive en `atlas/cuarentena/` y no en `public/` hasta que un acuse verifique DE VERDAD (lo
   mide `humo_feedback.py`); ningun HTML lo carga y el precache no lo nombra.

   LO QUE NO HACE, y es tan contrato como lo que hace: ni una peticion al cargar (solo `envia`, y solo desde
   un gesto); un destino, fijo y visible (`DESTINO`); sin cookies ni credenciales (`credentials: 'omit'`),
   sin Authorization ajeno, sin reintento, sin cola, sin service worker ni background sync; un tope de
   tamano. Si el transporte falla, el envio es FALLIDO con su codigo y se ofrece la exportacion para el PR:
   nunca «pendiente», nunca «enviado». Sin acuse que verifique con la clave del receptor fijada en
   `/rutas-medidas.json`, FALLIDO.

   LA ADUANA va antes que todo: tacha rutas, hostnames, IPs, correos y claves de cada texto del cuerpo, y
   ENSENA a la persona lo tachado (`op.muestra(informe)` -> true para seguir). Si el informe no se puede
   ensenar, o la persona cancela, no sale nada. El sobre solo lleva CUANTO se tacho, nunca lo tachado.

   PURO en su nucleo: la firma, el reloj declarado, el transporte y la verificacion se inyectan (`op`), asi
   que se prueba en node (`atlas/canal_casos.mjs`) con la misma puerta que correra el rack. */
(function (raiz) {
  'use strict';

  var enNode = typeof module === 'object' && module.exports;
  var K = enNode ? require('../../public/game/canon.js') : raiz.AtlasCanon;
  var CUARENTENA = true;
  var DESTINO = 'https://api.preceptoros.org/api/v1/paquetes';
  var RETO = 'https://api.preceptoros.org/api/v1/reto';
  var TOPE_B = 16384;
  var TIPOS = ['valoracion', 'correccion', 'reescritura', 'paso_torre', 'duelo_loratelier', 'resena', 'opinion'];

  /* El orden importa: el correo antes que el host (un correo lleva un host dentro), la IP antes que el host. */
  var TACHA = [
    ['clave', /-----BEGIN [A-Z ]+-----[\s\S]*?-----END [A-Z ]+-----|\b[0-9a-fA-F]{64,}\b/g],
    ['correo', /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g],
    ['ip', /\b(?:\d{1,3}\.){3}\d{1,3}\b/g],
    ['ruta', /(?:~|\B)\/(?:[\w.-]+\/)+[\w.-]*|\b[A-Za-z]:\\[^\s"']+/g],
    ['host', /\b(?:[a-z0-9-]+\.)+(?:local|lan|internal|home|net|com|org|io|dev|es)\b/gi]
  ];

  /* ADUANA de un texto: { limpio, cuenta, tachado[] }. */
  function aduana(texto, cuenta, tachado) {
    cuenta = cuenta || { ruta: 0, host: 0, ip: 0, correo: 0, clave: 0 };
    tachado = tachado || [];
    var limpio = String(texto);
    TACHA.forEach(function (t) {
      limpio = limpio.replace(t[1], function (m) { cuenta[t[0]]++; tachado.push({ que: t[0], fragmento: m }); return '[' + t[0] + ']'; });
    });
    return { limpio: limpio, cuenta: cuenta, tachado: tachado };
  }
  /* ADUANA de un cuerpo: cada texto, en todo el arbol. */
  function aduanaCuerpo(c) {
    var cuenta = { ruta: 0, host: 0, ip: 0, correo: 0, clave: 0 }, tachado = [];
    function limpia(x) {
      if (typeof x === 'string') { return aduana(x, cuenta, tachado).limpio; }
      if (Array.isArray(x)) { return x.map(limpia); }
      if (x && typeof x === 'object') {
        var o = {};
        Object.keys(x).forEach(function (k) { o[k] = limpia(x[k]); });
        return o;
      }
      return x;
    }
    return { limpio: limpia(c), cuenta: cuenta, tachado: tachado };
  }

  function sin(s, campos) {
    var c = {};
    Object.keys(s).forEach(function (k) { if (campos.indexOf(k) < 0) { c[k] = s[k]; } });
    return c;
  }
  var mensaje = function (s) { return K.canon(sin(s, ['firma'])); };
  var huella = function (s) { return K.sha(K.canon(sin(s, ['hash', 'firma']))); };

  /* PREPARA un sobre: Aduana, informe a la vista, reto, firma. `op`: { pub, pseudonimo, contenido_v,
     maquina, ahora() -> 'YYYY-MM-DDTHH:MM:SSZ', firma(texto) -> Promise hex, muestra(informe) -> Promise
     bool, transporte(url, cuerpo|null) -> Promise {status, json} }. */
  function prepara(op, tipo, cuerpo) {
    if (TIPOS.indexOf(tipo) < 0) { return Promise.reject(new Error('tipo de envio desconocido')); }
    var a = aduanaCuerpo(cuerpo);
    return Promise.resolve().then(function () { return op.muestra({ cuenta: a.cuenta, tachado: a.tachado, limpio: a.limpio }); })
      .then(function (sigue) {
        if (sigue !== true) { throw new Error('cancelado: no sale nada'); }
        return op.transporte(RETO, null);
      }, function () { throw new Error('sin informe de la Aduana a la vista no sale nada'); })
      .then(function (r) {
        var reto = r && r.status === 200 && r.json && r.json.reto;
        if (!/^[0-9a-f]{32}$/.test(reto || '')) { throw new Error('sin reto: la ruta respondio ' + (r && r.status)); }
        var s = { esquema: 'atlas.lab_envio/1', tipo: tipo, contenido_v: op.contenido_v, clave_publica: op.pub,
                  pseudonimo: op.pseudonimo, firmado_el: op.ahora(), maquina_declarada: op.maquina || '', reto: reto,
                  cuerpo: a.limpio, aduana: a.cuenta };
        s.hash = huella(s);
        return Promise.resolve(op.firma(mensaje(s))).then(function (h) { s.firma = 'ed25519:' + h; return K.ordena(s); });
      });
  }

  /* ENVIA, solo desde un gesto. Devuelve { estado: 'ENTREGADO' | 'FALLIDO', motivo, acuse?, exporta? }. */
  function envia(op, s) {
    var texto = JSON.stringify(s, null, 1) + '\n', falla = function (m) { return { estado: 'FALLIDO', motivo: m, exporta: texto }; };
    if (op.gesto !== true) { return Promise.resolve(falla('sin gesto no sale nada')); }
    if (texto.length > TOPE_B) { return Promise.resolve(falla('sobre sobredimensionado')); }
    if (!/^[0-9a-f]{16}$/.test(op.receptorHash || '')) {
      return Promise.resolve(falla('NO_DATA · sin la huella del receptor medida no se puede verificar un acuse'));
    }
    return Promise.resolve(op.transporte(DESTINO, s)).then(function (r) {
      if (!r || (r.status !== 200 && r.status !== 201)) { return falla('la ruta de entrega respondio ' + (r ? r.status : 'nada')); }
      var ac = r.json && r.json.acuse;
      if (!ac || ac.esquema !== 'atlas.lab_acuse/1') { return falla('respuesta sin acuse: no consta que llegara'); }
      if (ac.envio_hash !== s.hash) { return falla('el acuse es de otro sobre'); }
      if (K.sha('atlas.clave/1:' + ac.receptor_clave).slice(0, 16) !== op.receptorHash) { return falla('el acuse lo firma otro receptor'); }
      if (!/^ed25519:[0-9a-f]{128}$/.test(ac.firma || '')) { return falla('acuse sin firma'); }
      return Promise.resolve(op.verifica(mensaje(ac), ac.firma.slice(8), ac.receptor_clave)).then(function (ok) {
        return ok === true ? { estado: 'ENTREGADO', motivo: 'acuse verificado', acuse: ac } : falla('el acuse no verifica');
      });
    }, function (e) { return falla('sin red: ' + (e && e.message)); });
  }

  var AtlasCanal = { CUARENTENA: CUARENTENA, DESTINO: DESTINO, TOPE_B: TOPE_B, TIPOS: TIPOS, aduana: aduana,
                     aduanaCuerpo: aduanaCuerpo, mensaje: mensaje, huella: huella, prepara: prepara, envia: envia };
  if (enNode) { module.exports = AtlasCanal; }
  else { raiz.AtlasCanal = AtlasCanal; }
})(this);
