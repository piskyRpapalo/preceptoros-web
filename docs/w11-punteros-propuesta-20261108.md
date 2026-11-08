# W-11 · PROPUESTA: punteros firmados a BABEL y COMPANION en llms.txt

Misión W-11 (ideas-8nov, L0). El juez mide; el sello lo aplica la mano con runtime (la batería del sello no corre desde el juez).

## Por qué (medido 8-nov)

- llms.txt en web main (301b977d) NO lleva puntero a preceptoros-babel ni a preceptoros-companion: quien aterriza en la web no ve las puertas del diccionario ni del hilo de misiones.
- BABEL main: cda20968 (O-02 Apache-2.0 aterrizado 10:48Z, medido).
- COMPANION main: 8bd43cf2 (índice de misiones + grafo como dato, medido).

## Líneas propuestas para llms.txt (y su copia en public/llms.txt)

Bajo la sección de ecosistema, tras RACK.md:

- [BABEL: preceptoros-babel](https://github.com/piskyRpapalo/babel): the word house of the retired languages. Live at cda20968 (measured 2026-11-08); content depth NO_DATA from the judge: not read.
- [COMPANION: preceptoros-companion](https://github.com/piskyRpapalo/preceptoros-companion): the rack and the mission thread. hilo/tasks/ holds the mission index and the graph as data (grafo-misiones-20261108.json). Live at 8bd43cf2 (measured 2026-11-08).

## Ceremonia de sello (medida con #747 y #754 como patrón)

Tocar llms.txt exige la batería completa: llms.txt raíz + public/llms.txt + config/sw-huella.txt (re-sello, hoy en version preceptoros-2026-25-ge) + public/counters.json + entrada historial/counters-FECHA.json + public/sw.js + tests/llms_txt.test.mjs. Quien aplique: re-sellar con el runtime de la casa y presentar HITL como siempre.

Agente: juez de integración (GLM) · decreto del Soberano del 8-nov («all in»).