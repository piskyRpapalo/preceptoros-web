# Canon · La matemática única de Claude (haiku-CANON)

Destilado medido de `mente/aprendizaje/OPTIMIZACIONES.md` — el registro append-only del constructor haiku
(fusionado al monorepo del rack en su PR #70, cabeza `4ea26cc`, entradas del 13-sep al 2-nov).
Cada entrada nace de una medición y separa cuatro cosas: qué vio, la lección, qué tocó y su reversión.
Ninguna lección sin evidencia; ninguna sin camino de vuelta.

**Frontera.** Este canon no toca la matemática del dibujo: la única matemática del mapa es el canon de Acho
(`docs/canon-acho-math.md`, ley del suelo). Esto es la matemática de quienes construyen la web —
los compromisos, las guardas, las VERSIONes y el NO_DATA del oficio.

## 1 · Un compromiso publicado no se firma con una huella (2026-10-31 · BM-2)
FNV-1a es una huella rápida, no un hash criptográfico: sirve para detectar un cambio en un test,
no para resistir un adversario. Un compromiso publicado exige SHA-256 (WebCrypto, asíncrono);
hasta que exista, queda NO_DATA con su causa — el bloque «KNOWN GAP» del núcleo puro del duelo.
Reversión: borrar el bloque.

## 2 · Un núcleo puro fuera de la ruta servida no cambia nada (2026-10-31 · G4-1, BM-1, BM-2)
Un plano que pedía `public/game/` se cocinó en un directorio que no se sirve: no movió el sello.
Cada pieza se sirve en su propio módulo, con su VERSION y su cadena de sellos — así cada PR es
pequeño y reversible. Reversión: borrar la rama; ninguna está servida.

## 3 · Un sabotaje que no sale rojo invalida la prueba (2026-11-01 · JN-5, web#523)
Un `ok()` que aceptaba `{}` dio verde al primer sabotaje. Exige `=== true` y diagnostica qué
sub-condición falla antes de tocar esperas: la espera fija era síntoma, no causa (un botón viejo
en el primer diálogo). Reversión: `git revert 37f42ad`.

## 4 · La VERSION del service worker nunca baja bajo main (2026-11-01)
En una cascada de PRs, sellar «main+1» hace que el segundo en entrar baje la serie. Con N PRs en
cola, reparte VERSIONes crecientes POR ENCIMA de la mayor ya servida o reservada. Si la serie baja,
un visitante puede quedarse congelado (la avería del 25-oct). Reversión: re-sellar con `--version` explícita.

## 5 · Antes de regenerar, `--comprueba` (2026-11-01 · web#529)
El generador de las páginas de entrada ya no cuadra con la portada servida: ejecutarlo borra líneas
vivas de `public/index.html`. Un generador que no cuadra con lo servido es una trampa.

## 6 · `think:false` no apaga el pensamiento (2026-11-01)
Contra el oráculo grande, presupuesta los tokens de pensamiento o mide un parámetro que lo apague
de verdad: un `num_predict` corto devuelve vacío y parece un fallo del modelo.

## 7 · En una retirada se escanea TODO lo servido (2026-11-01 · H2, web#533)
La guarda de «nadie pide lo retirado» dio rojo por un **comentario** con una ruta muerta
(`public/game/map_stick.js:2`). Justo: un comentario con una ruta muerta es documentación que miente.
No solo se escanean etiquetas `src`.

## 8 · Una prueba que no corre en el CI no guarda nada (2026-11-01 · F0, web#535)
Ocho guardas de navegador existían y no corrían en `gate.yml`. «Verde local» se había leído como
«guardado». Toda guarda nueva entra en el CI en el mismo commit.

## 9 · Un adaptador sin su base no es un modelo (2026-11-01 · joyas)
Los «mini-modelos» propios son LoRA de 7B (adaptadores de 27,3 y 54,5 MB): pasan del bloque de
25 MiB y no caben en un navegador del visitante. «Mini-modelo en el chunk» exige un modelo **base**
pequeño servido por el mismo origen y troceado por el router. Queda como propuesta.

## 10 · Un nombre nuevo jamás coincide con el ámbito exterior (2026-11-01 · P6/P5a, web#538)
Un `var inside` dentro de una función se elevó y tapó la variable del módulo: `ask()` dejó de
funcionar. Antes de declarar, `grep -n\bx\b` en el fichero. Las guardas de navegador cazaron
lo que el lint no habría visto.

## 11 · El tren de PRs: VERSION antes, re-sello después (2026-11-01)
Con nueve PRs abiertos, cada fusión deja DIRTY a los demás. Se reserva VERSION creciente por pieza
al lanzarla, y tras cada fusión el tren se rebasa entero. El orden de fusión lo decide la Mesa,
no el orden de las letras.

## 12 · El scratchpad del enjambre es compartido (2026-11-02)
Dos constructores compartieron un mismo script y uno reescribió el sello del otro. Cada constructor
usa nombres propios (`<pieza>-sello.sh`) o su worktree, y tras sellar comprueba la VERSION servida.
El script común no se edita desde un constructor.

## 13 · La frase que describe algo vive en el módulo que lo describe (2026-11-02 · TF-1, web#580)
La página del openworld vivía a 120 B gzip de su tope; un cambio de solo texto la rompía. La
redacción crece en `CP.voz` (el módulo), no en el orquestador de la página. Y una vara que
devuelve `None` debe sustituirse por otra que mida, o la documentación la cita en falso.
Reversión: `git revert 86e8af2e`.

## 14 · NO_DATA dice qué falta: el código, la medición o el dispositivo (2026-11-02)
Se declaró ausente una capacidad que estaba servida en cuatro ficheros: solo se buscó
`node:crypto` y `ssh-keygen`. Antes de declarar ausente una capacidad, `git grep` del nombre
de la API de la plataforma (`crypto.subtle.sign`). La medición en el teléfono salió verde en un
minuto: firma de 64 B, 50 verificaciones en 29,9 ms.

## Uso
Este canon se cita por número, igual que las lecciones de `docs/canon-house-maths.md` §5.
Nueva entrada = nueva medición, nunca reescritura: el registro fuente es append-only y su casa es
el monorepo del rack; aquí vive su destilado para la web.

Agente: preceptor-orquestador-github · Model: GLM (Vibe)
