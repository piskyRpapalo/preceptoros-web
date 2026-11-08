# N3 · Retire the dead law · informe (2026-11-08)

Rama `claude/dead-law-20261108`. Solo lectura; este fichero es el único escrito.
Ámbito: public/ (html, json, txt, md, js con texto visible; vendor excluido), llms.txt (raíz y public/, idénticos), README.md, DEPLOY.md, AGENTS.md. Patrones: 16 KiB, 16 KB, 16384, 16.384, 16,384.

## 1 · Tabla

| fichero:línea | cita exacta | CLASE |
|---|---|---|
| public/mcp-manifest.json:60 | "piece_budget": "Each piece < 16 KiB, vanilla JS, no build in public/." | VIVA (pieza) |
| public/brains.json:1 | «al llegar este fichero a 18.427 B de los 16.384 del tope» | VIVA (pieza) |
| AGENTS.md:67 | «Techo de casa: pieza < 16.384 B.» | VIVA (pieza) |
| AGENTS.md:42 | «revocado el tope de 16 KiB el 2026-10-11, firma D2» | OTRA (cita la revocación como historia) |
| README.md:75 | «(codex's old house: a stale fork of this site — 8 languages and a 16 KB» | OTRA (límite de otra casa, archivada) |
| public/game/world_feed.js:15 | `length > 16384) throw new Error('publisher response too large')` | OTRA (límite de código, no texto visible) |
| public/game/node_signature_verify.js:58 | `armor.length > 16384` | OTRA (límite de código) |
| public/game/creation_package.js:65 | `text(value, 16384, 'manifest')` | OTRA (límite de código) |

llms.txt y public/llms.txt: sin coincidencias.

## 2 · Propuestas

Ninguna: no hay filas MUERTA.

## 3 · Conteo

N muertas: 0 · N vivas: 3 · N otras: 5.

## 4 · Riesgo

- Sin MUERTA no hay resello ni cambio obligado. Pero mcp-manifest.json y brains.json están bajo public/ (sellado): normalizar «16 KiB» a «16.384 B» en mcp-manifest.json:60 sería cambio de texto público y exigiría resello; no es necesario, la línea es VIVA.
- Discrepancia con el encargo: el techo de llms.txt que se pidió citar (8.192 B) no aparece en AGENTS.md, en la misión §1 ni en el tablero; el tablero dice 1.024 B para frames y llms. llms.txt no cita tope alguno, así que no hay línea que cambiar.

## Fuera de alcance (no clasificado, revisar en la siguiente pasada)

- CONTRIBUTING.md:37 «a served piece < 16 KiB where the repo says so».
- DISAGREEMENTS.md:30 «two living ceilings (web 10 KiB served, core 16 KiB)».

## Revisión de Opus (los dos casos fuera de alcance)
- CONTRIBUTING.md:37 · «Files < 25 MiB; a served piece < 16 KiB» · VIVA: 25 MiB por fichero y 16 KiB por pieza es la ley vigente.
- DISAGREEMENTS.md:30 · RC-05 del 2026-10-18 · OTRA: registro histórico fechado; no se reescribe.
- llms.txt: su techo de 8.192 B lo hace cumplir test_web (la copia raíz es igual a public/llms.txt); no cita el tope de 16 KiB.
**Veredicto N3: el hueco se cierra como MEDIDO. 0 citas muertas en textos públicos; no hay nada que retirar.**
