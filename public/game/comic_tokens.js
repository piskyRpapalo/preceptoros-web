(function (raiz) {
  'use strict';
  var AtlasSemantica = typeof module === 'object' && module.exports ? require('./tabla_semantica.js') : raiz.AtlasSemantica;
  var TABLA = AtlasSemantica.TABLA;
  var NEUTRAL = Object.freeze({ ink: '#1E1826', paper: '#F2F5F7', ocean: 'rgb(5,8,18)', cyan: '#00D2FF' });
  var STROKE = Object.freeze({ border: 3.5, borderSmall: 2.5, shadow: Object.freeze([4, 4]), shadowSmall: Object.freeze([2.5, 2.5]) });
  var SEALS = Object.freeze(Object.keys(TABLA));
  function tone(seal) {
    if (!Object.prototype.hasOwnProperty.call(TABLA, seal)) {
      return { seal: 'NO_DATA', label: 'NO_DATA', cause: 'unknown seal', bands: null };
    }
    return { seal: seal, label: seal, bands: AtlasSemantica.bandas(TABLA[seal], AtlasSemantica.SAT, AtlasSemantica.LUZ) };
  }
  var AtlasComicTokens = Object.freeze({ NEUTRAL: NEUTRAL, STROKE: STROKE, SEALS: SEALS, tone: tone });
  if (typeof module === 'object' && module.exports) { module.exports = AtlasComicTokens; }
  else { raiz.AtlasComicTokens = AtlasComicTokens; }
})(typeof module === 'object' && module.exports ? this : (this || window));
