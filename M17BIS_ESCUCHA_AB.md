# M17-bis 3 · escucha A/B · EN_CURSO_hasta_escucha del Soberano

El código está en el árbol, pero el sonido de siempre (`fm2`) sigue por defecto. Este movimiento **no se cierra** hasta que el Soberano escuche y decida. Nada cambia de oído mientras tanto.

## Qué se compara
- **A · `fm2`:** el sonido actual. Portadora + 1 moduladora, caída exponencial.
- **B · `fm3_adsr`:** portadora + **2** moduladoras (las dos conectadas; la joya del mockup no las conectaba) y envolvente ataque-caída-sostenido-relajación. Valores provisionales en `public/game/valores.js` → `sintesis.adsr = [0.005, 0.03, 0.55, 0.06]`, `m2 = 0.5`, `indice2 = 0.5`.
- **El pulso visual del golpe sigue la misma envolvente que suena**, en A y en B (test de coherencia en `atlas/gacha_casos.mjs`).

## Cómo escuchar (5 minutos, solo loopback)
1. Servir el worktree en local:
   `python3 -m http.server 8811 --bind 127.0.0.1 --directory ~/preceptoros-web-juego/public`
2. Abrir `http://127.0.0.1:8811/en/` y entrar en theGame (que cargue Army o Arena).
3. Con auriculares, en la consola del navegador (F12), pegar línea a línea:
   ```
   AtlasSintesis.activa(true)
   AtlasValores.sintesis.modo = 'fm2';      AtlasSintesis.suena('pop')
   AtlasValores.sintesis.modo = 'fm3_adsr'; AtlasSintesis.suena('pop')
   ```
   Repetir con `'eclosion'`, `'adopcion'` y `'huevo'` en lugar de `'pop'`.
4. Opcional, en una batalla: con el modo B puesto, mirar el anillo de cada golpe. Su grosor debe latir con el mismo ataque y la misma caída que se oyen.
5. Parar el servidor con Ctrl+C.

## La decisión (la escribe el Soberano)
- **Gana A:** se deja `modo: 'fm2'`. El código B queda dormido y probado, o se revierte entero con `git revert <commit del movimiento 3>`.
- **Gana B:** se cambia `modo: 'fm3_adsr'` en `valores.js`, se sella y el movimiento 3 se cierra en su propio commit.
- **Gana B con ajustes:** se dicen los valores (por ejemplo «ataque más lento») y se fijan como medidos por el oído.

Estado: **EN_CURSO_hasta_escucha**. La escucha y la firma son del Soberano.
