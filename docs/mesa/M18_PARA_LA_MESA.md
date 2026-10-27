# M18-bis · campo_origen y la onda de 7 aristas · 2026-10-10 · Claude (Opus 5.5)
Sello: MEDIDO (salida pegada abajo) · commit local en claude/web-solo-juego, sin push. Sustituye el informe anterior, que describía trabajo que no estaba en el diff.
1. «7 aristas» = SIMETRÍA del único (valores.js: simetría 7, términos 6), no número de armónicos. Semilla medida sha256('m18bis-28') → único en tc4 con k = 1,-6,15,-20,29,-34: todos k ≡ 1 (mod 7).
2. gacha.js: `espectro(t)` con medido (espectro completo) y emulado (los términos 0-1 enteros, el resto se reduce a la mitad por término = niebla). Sin campo → medido (tropas de antes). Valor desconocido → lanza. `tirada` sella `campo_origen:'medido'`.
3. escena.js: los dos puntos de pintado llaman `G.espectro(...)`; figura() no se toca. 16.363 B (techo 16.384).
4. data/atlas_gacha_schema.json: `campo_origen` añadido al contrato como enum opcional (el gate lo exigió: «Additional properties are not allowed»).
5. motor_casos.mjs: el caso inventado sale; entran 8 casos (rareza, k mod 7, espectro fijado, sha256 de dos corridas, medido/emulado, rechazo). Rojo primero: 3 fallos «G.espectro is not a function»; luego verde.
6. Salida: motor 48/48 · piloto 20/20 · gacha 21/21 · opinion 7/7 · mp 49/49 · cria 12/12 · duelo 8/8 · arnes_sw 24/24 · test_web OK.
7. test_atlas: 94/95. El único rojo es `indexedDB` en ui.js, deuda conocida desde M0, que no toca esta misión.
8. Sello: VERSION preceptoros-2026-17-abcz, huella ce0d910eeba5c270; gzip_juego_b 148418 < 153600. NO corrí coherencia-publica.py (en un worktree escribiría en el árbol principal).
9. NO_DATA: la misma prueba en el Doogee ARM. El espectro queda fijado byte a byte en el test, así que la medición en ARM es correr este mismo fichero allí.
10. Restos de aider archivados fuera del repo (no-publicar) (`.aider*` ya estaba en .gitignore; eran restos sin trackear).
