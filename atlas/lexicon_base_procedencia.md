# Base del lexicon · procedencia de las entradas nuevas (bb-canon, PR #399)

El gate `atlas/lexicon_gate.mjs` falla con lo nuevo. Estas tres entradas se registran en `atlas/lexicon_base.json` a sabiendas: son deuda declarada, no palabras silenciadas.

| Fichero | Palabra | Donde aparece | Por que se registra |
|---|---|---|---|
| public/game/bb_det.js | crea | nombre de la funcion de semilla (`BBDet.crea`), API publica del generador determinista | identificador de API, mismo caso que `map_zoom.js` ya en la base |
| public/game/bb_det.js | fija | comentario de la semilla de respaldo | termino tecnico del generador; mismo caso que `map_zoom.js` |
| public/game/bb_forma.js | sello | parametro `colorDe(sello)`, termino de canon (sello = estado sellado de la tabla semantica) | termino de canon, presente como deuda en 9 ficheros ya en la base (core.js, sw.js, tabla_semantica.js...) |
| public/game/bb_radio.js | sello | parametros `pulso(sello,t)`, `gemelo(sello)` | igual que bb_forma.js |

Lo que NO se hizo: no se anadio `sello` a la lista blanca global (`lexicon_permitidas.json`), porque eso resolveria 9 entradas de otros ficheros y obligaria a reescribir la base entera.
En `bb_forma.js` se reescribio en ingles un comentario que llevaba «fuera» (prosa, no deuda).

Decision pendiente del Soberano: renombrar `sello` en el canon (sustancial, afecta a todo el repo) o mantener estas entradas como deuda declarada.
