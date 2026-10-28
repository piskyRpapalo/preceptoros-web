# LEXICON-GATE · el gate que automatiza la ley de nombres públicos (NORTE 8 · mandato 2)

## Objetivo
Que la ley «en lo público, nada que no sea inglés o un nombre de la casa» se cumpla sola: un gate en CI que
se pone rojo cuando una pieza servida lleva una palabra española que no está en la línea base.

## Problema y por qué
El barrido de nombres (mandato 1) es grande: 180 ficheros servidos con palabra española. Sin un gate, cada
rebanada del barrido puede reintroducir palabras en otra parte. Un gate que no puede caer no prueba nada, así
que el gate se sabotea en sus propios casos y también en el árbol real.

## Alcance
- `atlas/lexicon_gate.mjs`: escanea `public/**/*.{html,js,mjs,css}` (sin `historial/`).
- `atlas/lexicon_espanol.json`: la lista negra medida (D2, `docs/INDEX_RENAMING.md`).
- `atlas/lexicon_permitidas.json`: lista blanca de excepciones, con motivo, vacía al nacer.
- `atlas/lexicon_base.json`: deuda medida hoy, fichero a fichero. Se regenera con `--escribe-base`.
- `atlas/lexicon_gate_casos.mjs`: siete casos, entre ellos el sabotaje.
- Cableado en `.github/workflows/gate.yml`, en el bloque de gates.

## Restricciones
- Ratchet: lo nuevo falla; lo que desaparece sin bajar la base también falla. La base solo puede encogerse.
- Sin dependencias: solo la biblioteca estándar de Node.
- No es una lista blanca de inglés. Ver «Desviación declarada».

## Checklist
- [x] LX1 · escáner `escanea()` y comparador `compara()`, exportados para el test.
- [x] LX2 · base generada: 180 ficheros, medida hoy (155 con la lista del D2 + 25 de los alias de Rosetta, §Registro).
- [x] LX3 · sabotaje en casos: palabra nueva, camelCase, URL que no cuenta, excepción, base que no baja, base real.
- [x] LX4 · sabotaje en el árbol real: `public/assets/pwa.js` con `monta` → rojo (exit 1), revertido → verde.
- [x] LX5 · cableado en gate.yml (`node --test atlas/lexicon_gate_casos.mjs` y `node atlas/lexicon_gate.mjs`).
- [ ] LX6 · lista blanca completa de inglés (diccionario versionado). Pendiente de decisión del Soberano.
- [ ] LX7 · el barrido baja la base a cero (mandato 1). Pendiente: 155 ficheros.

## Evidencia
- `node --test atlas/lexicon_gate_casos.mjs` → 7/7.
- `node atlas/lexicon_gate.mjs` en el árbol real → VERDE, 180 ficheros, base 180.
- Sabotaje real: `echo "// sabotaje: monta" >> public/assets/pwa.js` → `NUEVA public/assets/pwa.js: monta`, `ROJO`, exit 1. Revertido → VERDE.

## Desviación declarada
La ley del Soberano dice «lista blanca: inglés básico + Léxico + ganadores Rosetta». Este gate aplica una **lista
negra medida** (las palabras españolas del D2) con excepciones declaradas. Una lista blanca completa de inglés
necesita un diccionario versionado en el repo, y eso lo decide el Soberano (tamaño y licencia). Hasta entonces
el gate no puede demostrar que una palabra inglesa rara sea inglesa: solo demuestra que no es una de las
palabras españolas conocidas. La Rosetta (`study/13-rosetta.md`) y la ley de colisiones (`study/10-collisions.md`) viven en el repo `study`, no aquí.
Los alias españoles de esas tablas (sello, firma, aduana, ojo, vara, Grieta, tumba…) entran en la lista negra. Sus
ganadores ingleses no requieren excepción: no contienen palabra de la lista negra.

## Registro de decisiones (modo desatendido)
- 2026-10-28 · Base `origin/main` ed76a53. Worktree `haiku/lexicon-gate-20261028`.
- 2026-10-28 · El ratchet se elige sobre un barrido de golpe: la deuda queda visible y medida, y cada rebanada la baja.
- 2026-10-28 · Rosetta: los 25 alias españoles de `study/10-collisions.md` (tablas de gobierno y segunda ola) y de `docs/lexicon.md` §C1 entran en la lista negra. Se excluyen a propósito palabras que también son inglés corrientes (`principal`, `dice`, `arena`): darlas por españolas sería un falso positivo. Efecto: la base pasa de 155 a 180 ficheros. La cifra crece porque el gate ya ve lo que la Rosetta pide renombrar; no es regresión.
- 2026-10-28 · Las lenguas de `public/atlas-*.json` no entran en el escaneo: son datos de idioma, no código servido.
  Declarado aquí; si el Soberano quiere que entren, se añaden al escaneo y la base crece.
- 2026-10-28 · Propuesta de doctrina (deber de doctrina, toca INTANGIBLE): «el lexicon se aplica por ratchet con base
  versionada» y «el gate debe demostrarse con sabotaje en el árbol real». Se propone en el PR y espera firma; no se aplica.

## Siguiente paso
Mandato 1: bajar la base rebanada a rebanada (un PR por rebanada, sello SW en cada una que toque `public/`).
