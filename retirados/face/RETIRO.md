# Retiro de /face · H2 · 2026-11-01

Decisión: propuesta medida de H2, aprobada por la Mesa (2026-11-01). Retirada con recibo, sin borrado directo: cada fichero
se movió aquí con `git mv` (la historia lo sigue con `git log --follow`), fuera de `public/`, así que no se sirve ni se precachea.

| Qué | Antes | Ahora |
|---|---|---|
| Terminales de prueba (`<title>Test ·`) | `public/face/{atlantis,zombie,walker}.html` | aquí; en su URL queda una lápida `noindex` que lleva al mapa |
| Sus 16 módulos (solo los cargaban atlantis y zombie) | `public/face/face*.{js,css}` | aquí |
| Generador del walker | `atlas/genera_walker_face.mjs` | aquí (escribiría encima de la lápida) |
| Piezas vivas compartidas | `public/face/{army.html,face_canon.css,face_terminal.js}` | `public/game/` |
| Se conservan | `public/face/{index,basic}.html`, `face_openworld_terminal.js` | sin cambio |

Pruebas retiradas con ellos (probaban las pieles, no lo que queda): `face_battle_browser.mjs`, `face_names_browser.mjs`,
`face_battle_screen_casos.mjs`, `face_names_casos.mjs` → aquí. La guarda nueva es `atlas/retiro_face_casos.mjs`.

Revertir: `git revert <commit de H2>`.
