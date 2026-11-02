# RETIRO · el pseudo-joystick del mapa y las hojas de pestañas (2026-11-02)

Orden: el Soberano p0, buzon#30 (·6572069590), 2026-11-02. Nada se retira en silencio: este recibo dice qué sale,
por qué, adónde va y qué lo sustituye. Append-only.

## 2026-11-02 · el pseudo-joystick (pad de flechas/palanca sobre el mapa)

- **Qué era.** Un `div role="application"` de 168 px dibujado sobre el mapa en el móvil (abajo a la izquierda), creado
  por `mount()` en `public/game/colony_controls.js`; arrastrar dentro elegía un vecino por ángulo
  (`AtlasMapStick.direction`) y soltar caminaba.
- **Por qué sale.** Inválido a ojos del Soberano: tapaba el dibujo y duplicaba lo que ya hacen tocar un nodo y las flechas.
- **Qué sale.**
  - El pad y sus manejadores de `colony_controls.js` (sin fichero propio: se quitan las líneas).
  - `public/game/map_stick.js` → `git mv` a `retirados/joystick/map_stick.js`. Ya no se sirve ni se precachea (nunca
    estuvo en `sw-listas.js`). Su prueba de paridad con la cara retirada (`atlas/map_stick_casos.mjs`) sigue verde
    leyendo la nueva ruta: la matemática se conserva como referencia.
  - La fila F0 `stick` sale de `atlas/f0_funciones.json` y queda anotada en su lista `retiradas`.
- **Qué lo sustituye (ley que sigue).** Las flechas eligen vecino y Enter camina (`colony_controls.js`, intacto). En el
  teléfono se camina **tocando un nodo del mapa** (tap-to-walk, W-3). La caminata libre (PR #548) no está en `main`
  hoy, así que tocar un nodo es el camino táctil. Guarda nueva: «a phone user cannot walk without the stick pad» en
  `atlas/openworld_browser.mjs` (a 390 px, sin pad, tocar la cabaña entra en ella).
- **Cómo se revierte.** `git mv retirados/joystick/map_stick.js public/game/map_stick.js`, devolver el bloque `H1: the
  stick` a `mount()` y la fila F0 `stick`.

## 2026-11-02 · las hojas de pestañas (Map · News · Summons · Army)

- **Qué era.** `public/game/terminal_tabs.js`: una barra de pestañas ARIA cuyas hojas tapaban el mapa.
- **Por qué sale.** La terminal se compacta por capas: TODO lo que la página dice va en UN panel (el chat). Las hojas
  fragmentaban el mismo mensaje en cuatro sitios.
- **Qué sale.** `public/game/terminal_tabs.js` → `git mv` a `retirados/terminal/terminal_tabs.js`; su entrada del shell
  la ocupa `/game/terminal_panel.js` (114 entradas / 113 distintas, sin cambio de recuento).
- **Adónde va cada cosa.** News → voz *Radio* (Listen, Check live nodes, More). Summons → voz *House* (la visita y sus
  botones). Army → voz *Army* (tropas o NO_DATA y el enlace a `/game/army.html`). `#state` → voz *Map*;
  `#floor-state` → *Floor*; «Next:» → *Guide*; estado del joystick → *Tutorial*; caminantes → *Walkers*; nivel de
  zoom → *Zoom*.
- **Guardas movidas, no debilitadas.** La de pestañas pasa a «the compact terminal is fragmented or a voice has no
  speaker»; el ojo de carbono comprueba la voz Army y el orden mapa → panel; su sabotaje S3b devuelve un pad al mapa.
