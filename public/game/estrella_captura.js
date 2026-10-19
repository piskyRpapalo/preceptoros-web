(function (raiz) {
  'use strict';

  // J1 · Estrella Hexelion capturable. Una estrella es una entrada de dictionary.json; se captura en su edificio enlazado,
  // una sola vez, con semiotica medida. PURO: ni DOM, ni red, ni reloj.
  // Lo no medido es NO_DATA con causa: una entrada sin semiotica, una retirada (withheld_ids) o un edificio sin entrada no se capturan.

  var enNode = typeof module === 'object' && module.exports;

  // Enlace edificio -> entrada del diccionario. D67 (frontera) no es entrada en dictionary.json: queda NO_DATA.
  var ENLACES = { mesa_de_firma: 'D33', puerta_frontera: 'D67' };

  function nd(c) { return 'NO_DATA (' + c + ')'; }

  function entrada(dic, id) {
    var lista = dic && Array.isArray(dic.entries) ? dic.entries : [];
    for (var i = 0; i < lista.length; i++) { if (lista[i].id_interno === id) { return lista[i]; } }
    return null;
  }

  // st: { capturadas: [id] } · dic: dictionary.json · estrella: id_interno · edificio: clave de ENLACES
  function captura(st, dic, estrella, edificio) {
    var capturadas = (st && st.capturadas) || [];
    if (!ENLACES.hasOwnProperty(edificio)) { return { ok: false, motivo: 'edificio sin enlace: ' + edificio }; }
    if (ENLACES[edificio] !== estrella) { return { ok: false, motivo: 'la estrella ' + estrella + ' no se captura en ' + edificio + ' (su enlace es ' + ENLACES[edificio] + ')' }; }
    if (dic && Array.isArray(dic.withheld_ids) && dic.withheld_ids.indexOf(estrella) >= 0) { return { ok: false, motivo: nd('estrella retirada del anexo publico: ' + estrella) }; }
    var e = entrada(dic, estrella);
    if (!e) { return { ok: false, motivo: nd('sin entrada en dictionary.json para ' + estrella) }; }
    if (!e.semiotica || typeof e.semiotica.color !== 'string') { return { ok: false, motivo: nd('estrella ' + estrella + ' sin semiotica medida') }; }
    if (capturadas.indexOf(estrella) >= 0) { return { ok: false, motivo: 'la estrella ' + estrella + ' ya esta capturada' }; }
    return { ok: true, estado: { capturadas: capturadas.concat([estrella]) } };
  }

  // Constelacion visible en el Faro: solo las capturadas, con su color medido.
  function constelacion(st, dic) {
    return ((st && st.capturadas) || []).map(function (id) {
      var e = entrada(dic, id);
      return { id: id, nombre: e ? e.nombre_juego : nd('sin entrada'), color: e && e.semiotica ? e.semiotica.color : nd('sin color medido') };
    });
  }

  var AtlasEstrellaCaptura = { ENLACES: ENLACES, captura: captura, constelacion: constelacion };
  if (enNode) { module.exports = AtlasEstrellaCaptura; }
  else { raiz.AtlasEstrellaCaptura = AtlasEstrellaCaptura; }
})(this);
