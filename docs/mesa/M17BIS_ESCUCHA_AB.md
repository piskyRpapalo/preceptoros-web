# M17-bis 3 · escucha A/B · EN_CURSO_hasta_escucha del Soberano

El código está en el árbol, pero el sonido de siempre (`fm2`) sigue por defecto. Este movimiento **no se cierra** hasta que el Soberano escuche y decida. Nada cambia de oído mientras tanto.

## Qué se compara
- **A · `fm2`:** el sonido actual. Portadora + 1 moduladora, caída exponencial.
- **B · `fm3_adsr`:** portadora + **2** moduladoras (las dos conectadas; la joya del mockup no las conectaba) y envolvente ataque-caída-sostenido-relajación. Valores provisionales en `public/game/valores.js` → `sintesis.adsr = [0.005, 0.03, 0.55, 0.06]`, `m2 = 0.5`, `indice2 = 0.5`.
- **El pulso visual del golpe sigue la misma envolvente que suena**, en A y en B (test de coherencia en `atlas/gacha_casos.mjs`).

## Cómo escuchar (5 minutos, solo loopback)
1. Servir el repo en local (desde su raíz; re-medido 2026-10-27, [W] O2: `/en/` ya no existe y el worktree `~/preceptoros-web-juego` tampoco):
   `python3 -m http.server 8811 --bind 127.0.0.1 --directory public`
2. Abrir `http://127.0.0.1:8811/play/` y abrir **Waves Army** o un combate (cargan `core.js`).
3. Con auriculares, en la consola del navegador (F12), pegar línea a línea:
   ```
   AtlasSintesis.activa(true)
   AtlasValores.sintesis.modo = 'fm2';      AtlasSintesis.suena('pop')
   AtlasValores.sintesis.modo = 'fm3_adsr'; AtlasSintesis.suena('pop')
   ```
   Repetir con `'eclosion'`, `'adopcion'` y `'huevo'` en lugar de `'pop'`.
4. Opcional, en una batalla: con el modo B puesto, mirar el anillo de cada golpe. Su grosor debe latir con el mismo ataque y la misma caída que se oyen.
5. Parar el servidor con Ctrl+C.

## Movimiento 4 · vibrato por urgencia (activo en A y en B)
Lo que espera firma vibra; lo firmado suena quieto:
- `eclosion` (la tropa nacida espera tu firma) vibra;
- `adopcion` (firmada) y el golpe no.

Se escucha con `AtlasSintesis.suena('eclosion')` frente a `AtlasSintesis.suena('adopcion')`. `vibrato_hz = 6` y `vibrato_prof = 0.02` son provisionales: se fijan en esta misma escucha.

## [W] O2 · la voz del duelo (2026-10-27, se oye en A y en B)
El duelo de ondas suena con la misma síntesis: cada golpe al tono del sello de quien golpea (joya 3:
`f = 220 + hue/360 · 660`, LIVE 440 Hz, SIMULATED 275 Hz, STALE 330 Hz; NO_DATA calla) y ganar resuelve en un
acorde 4:5:6 escalonado 0,1 s (joya 5, sin vibrato: lo firmado suena quieto). En la consola:
```
AtlasSintesis.activa(true)
AtlasSintesis.suenaDuelo('golpe', 'LIVE'); AtlasSintesis.suenaDuelo('golpe', 'SIMULATED')
AtlasSintesis.suenaDuelo('gana')
```
O2 **no** cambia `modo`: la escucha sigue siendo del Soberano.

## La decisión (la escribe el Soberano)
- **Gana A:** se deja `modo: 'fm2'`. El código B queda dormido y probado, o se revierte entero con `git revert <commit del movimiento 3>`.
- **Gana B:** se cambia `modo: 'fm3_adsr'` en `valores.js`, se sella y el movimiento 3 se cierra en su propio commit.
- **Gana B con ajustes:** se dicen los valores (por ejemplo «ataque más lento») y se fijan como medidos por el oído.

Estado: **EN_CURSO_hasta_escucha**. La escucha y la firma son del Soberano.
