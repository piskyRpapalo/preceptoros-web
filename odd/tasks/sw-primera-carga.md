# Pieza M · el código de hoy a la primera (service worker tras un deploy)

Orden: Mesa TF · 2026-11-03, punto 4 («hoy nace el chatbot público: cada visitante debe ver código actual a la
primera»). Sale de `PENDIENTES.md` (deploy de web#601).

## Medido
- **Doogee, primera carga tras desplegar web#601**: la caché ya era `shell-preceptoros-2026-19-mv`, pero
  `world_feed.js` llegó con `transferSize 0 / deliveryType cache-storage` y `AtlasWorldFeed.record` era undefined.
  La página corría el código de la pieza 1. Con una recarga, todo vivo.
- **Causa, en `sw.js`.** `estatico()` y `navegacion()` son cache-first a propósito (modo avión, medido el
  2026-11-01). En la visita que *trae* el deploy, el SW viejo sirve sus estáticos y la página arranca con ellos.
  Mientras tanto el SW nuevo se instala, hace `skipWaiting`, borra la caché vieja y hace `clients.claim()`, pero ya es
  tarde para esa carga.
- **A quién afecta:** solo a quien **vuelve** con un SW anterior. Una primera visita no tiene SW y carga de la red;
  lo comprueba la fase A de la prueba.

## Diseño (en `public/assets/pwa.js`, el único sitio que registra el SW; lo cargan las 10 páginas)
- La página anota al arrancar si ya la controlaba un SW (`antes`).
- En `controllerchange` (el SW nuevo hizo `claim`) **recarga una vez**, solo si se cumple todo:
  - había un SW antes: una primera visita nunca se recarga;
  - la persona **no ha tocado** la página (`pointerdown` o `keydown` en captura). Nada de lo que hizo se pierde, y
    verá la versión nueva en su próxima visita;
  - no hubo otra recarga en los últimos 30 s (`sessionStorage`). Si el almacenamiento falla, no se recarga.
- **No se toca `sw.js`.** El modo avión sigue intacto: sin red no hay SW nuevo, así que no hay `controllerchange`.

## Prueba (`atlas/sw_first_load_browser.mjs`, Chrome real; el servidor cambia la VERSION bajo la página)
| fase | qué se comprueba |
|---|---|
| A | una primera visita no se recarga; en la vuelta, `world_feed.js` ya vive en la caché A |
| B | despliegue B con el SW nuevo llegando tarde (como en el Doogee): la visita que vuelve termina con el código B **sin que la persona navegue de nuevo**, con exactamente una recarga |
| C | despliegue C después de que la persona tocó la página: ninguna recarga |

Enseñada en rojo y luego en verde:
- **sin el arreglo:** B en rojo (marca A, 1 navegación), que es exactamente lo que medí en el Doogee;
- **con el arreglo:** verde;
- **`SABOTAJE=sin-guarda`:** C en rojo (2 navegaciones).

## Pesos
`pwa.js`: 1 596 → 2 486 B en disco (1 105 B gzip), muy por debajo de 16 384 B y del tope gzip de 7 168 B. Va en el shell, así que
el sello cambia: **hace falta letra nueva de la Mesa**.
