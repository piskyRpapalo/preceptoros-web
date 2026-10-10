# PARA_LA_MESA · Cosecha de M17 — la respiración del juego

Rama: claude/web-solo-juego · Worktree: preceptoros-web-juego · Cosecha: 2026-10-09
Sello: MEDIDO (git log --stat + wc -c + node --check, 2026-10-09)

| Mov | Qué hace | Ficheros | Bytes hoy | Corpus | Sello |
|---|---|---|---|---|---|
| M0 Calidad modificable | Interruptor Auto, Máxima, Media o Luz según hardware; degradación honesta en 9 lenguas | ui.js (+15) | 16172 | ideas6oct-2:804 | MEDIDO · commit b03b21a |
| M1-2 Melt + Color=Vida | Melt determinista por semilla; el color porta la vida (∇H legible por SLM) | escena.js (+9, −33) | 16359 | ideas7oct:41, ideas6oct:855, ideas6oct:1150-1152 | MEDIDO · commit b098f3d |
| M3 Respira al beat | El flash decae OSCILANDO (seno interno en fo), sin portadora 660Hz invisible a 60fps | escena.js | 16359 | ideas6oct:1975 | MEDIDO en disco · SIN COMMIT |
| M4 Mar respira | Deriva lenta determinista del fondo (offset temporal en teselas) | mar.js (+8, −1) | 15385 | ideas7oct:41 | MEDIDO · commit 1307a79 |
| M5-6 Tunables + Buffer PS1 | La fluidez es DATO (valores.js); O.buffer() niveles 0-2, dither 4x4, wobble | valores.js (+37), wave_render.js (+230) | 5409, 13275 | ideas6oct-2:785, ideas6oct:893 | MEDIDO · commit 14aa847 |
| M7 Niebla de Omen + Vignette | Vignette radial cacheado; reutiliza fog_of_war.js; apagado en quieto() y calidad 0 | mar.js (+8) | 15385 | ideas6oct:893, planes:240-246, planes:296-299 | MEDIDO · commit 5d20477 |
| M8 Sprites chunky | NPCs procedurales a offscreen 1/4 escala, cache O.sprite(), pixel gordo PS1, cero assets | mar.js (+9, −2) | 15385 | ideas6oct:1975 | MEDIDO · commit 75c7ad0 |

Notas honestas:
- escena.js 16.359 B y sintaxis VERDE (node --check). HALLAZGO: escena.js nació ROTO
  en el commit M1-2 (b098f3d) — una llave de más cerraba pinta() antes de frente().
  Los gates de test_atlas solo buscan subcadenas, nunca parsean JS: el roto pasó el
  gate. Reparado a mano en disco (pega(g,fondo,W,H) cerraba de más); M1-2 queda
  como hallazgo, no como deuda oculta. PROPUESTA al guardián: añadir node --check
  al pre-commit como sensor, no como techo.
- Gates al cosechar (test_atlas, 95 tests): desafinación VERDE tras el retoque.
  Quedan 2 rojos que son SENSORES, no techos: claves calidad_* en las 9 lenguas
  e indexedDB fuera de la incubadora (carga a demanda). Deuda registrada en
  HUELLA_TECHOS_F80.md.
- Techo 16 KiB por pieza: DEROGADO por el Soberano (F80). Techos vigentes: 8 GB
  Android, 25 MB Cloudflare, 14 MB app. Los bytes de la tabla son registro,
  no límite.
