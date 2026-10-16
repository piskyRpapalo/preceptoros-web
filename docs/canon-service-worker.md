# Canon · Service worker (sw.js, sw-listas.js)

> Migrado del código por D1 (FIRMO de campaña, 16-oct). Canon con fichero:línea de origen. Los strings i18n SIN_RED de sw.js son DATO y VIVEN EN EL CÓDIGO (docs/INDEX_RENAMING.md). El código queda sin UN comentario.

Bloques migrados: 20 · bytes de canon: 7940


## public/sw.js:1

preceptoros.org · Service Worker. App Shell del Agora.
 *
 * EL QUE HABIA NO ESTABA ENCHUFADO
 * --------------------------------
 * La version anterior cacheaba cuatro URLs y respondia `caches.match() ||
 * fetch()` a TODO -- incluida la API. Un cache-first sin caducidad sobre una
 * API sirve la misma respuesta para siempre: la peor forma de mentir, porque
 * la pagina no puede notarlo. Daba igual, eso si: ninguna pagina lo
 * registraba. Era un PWA sobre el papel y cero PWA en el navegador.
 *
 * TRES REGLAS, Y NINGUNA LISTA DE DOMINIOS
 * ----------------------------------------
 * No hay ni un host escrito aqui. La frontera es el ORIGEN, que el navegador
 * ya sabe: una lista de dominios permitidos envejece en cuanto cambia el
 * tunel, y envejece en silencio.
 *
 *   1. Otro origen (la API del Agora, el CDN de WebLLM) -> pasa de largo y NO
 *      se cachea nunca. Lo que no es nuestro no lo guardamos.
 *   2. JSON del propio sitio (counters.json, anuncios.json) -> solo red.
 *      Podria cachearse y quedaria mas bonito sin conexion, y seria la misma
 *      mentira que la portada publicando 19 pruebas cuando el gate media 26:
 *      cifras viejas con cara de frescas. Si no hay red, el fetch falla y el
 *      sensor de honestidad de la pagina dice NO_DATA con su causa. Eso es lo
 *      correcto, no un fallo que haya que suavizar.
 *   3. Navegacion y estaticos -> del cache, revalidando por detras.
 *
 * SIN CONEXION no se devuelve una pagina en blanco ni el dinosaurio del
 * navegador: se sintetiza aqui mismo. Sintetizada y no un fichero suelto por
 * dos motivos -- el techo de 7 paginas del gate, y que un fichero de respaldo
 * tambien puede faltar del cache justo el dia que hace falta.


## public/sw.js:32

Subir VERSION o el cambio NO llega: ver `config/sw-huella.txt`.


## public/sw.js:37

Las listas de QUE se cachea viven en `sw-listas.js`, partidas por asunto
   el 2026-09-19 porque este fichero se quedo a 266 B del tope. El `?v=` no
   es adorno: ata la copia de las listas a esta version de cache.


## public/sw.js:48

UNA RESPUESTA REDIRIGIDA NO SE PUEDE SERVIR A UNA NAVEGACION, y esa es la
   averia que tumbo el sitio entero en Chrome el 2026-09-08. Cloudflare Pages
   sirve `/es/benchmark.html` con un 307 hacia `/es/benchmark`; `fetch` sigue el
   salto y la respuesta que vuelve trae `redirected: true`. Guardarla y luego
   devolverla desde el worker es justo lo que el navegador rechaza, y no con un
   404 sino con un ERR_FAILED seco -- por eso parecia el dominio caido y no una
   pagina rota. `/` y `/es/` se libraban por no llevar `.html`: son las unicas
   rutas que no redirigen.

   Se limpia AL ESCRIBIR, que es por donde entra, y se comprueba AL LEER,
   porque un shell de otra version puede seguir vivo en un telefono que no ha
   vuelto a instalar. El `.html` se conserva como clave: los enlaces del sitio
   lo llevan, y una clave sin extension no responderia a su peticion sin red.


## public/sw.js:67

`addAll` es todo-o-nada: una sola ruta que devuelva 404 tumba la instalacion
   entera y el sitio se queda sin PWA por un fichero. Se piden de una en una y
   se tolera la que falte -- un shell incompleto sirve; ninguno, no.


## public/sw.js:77

`skipWaiting` Y `claim`, y hacen falta los dos. Sin el primero un worker
   nuevo se queda en espera hasta que se cierran TODAS las pestanas del sitio:
   se despliega un arreglo, la persona recarga, y sigue viendo lo de ayer
   servido por el worker viejo. Con `estatico` --cache primero, refresco por
   detras-- eso son DOS recargas para ver un cambio, y la primera parece que no
   ha pasado nada. Se vio el 2026-09-05: las transparencias estaban en
   produccion y no se veian en el navegador de quien las pidio.

   El precio esta medido y se acepta: una pestana abierta puede pasar de la
   version vieja a la nueva a mitad de sesion. En un sitio estatico de siete
   paginas eso es un salto de estilos; en uno con formularios a medias seria
   otra conversacion.


## public/sw.js:103

--- la pagina de sin conexion ----------------------------------------


## public/sw.js:140

R-WIDGET rige tambien aqui: el texto va dentro de un panel con su fondo y su
   color declarados. Una pagina de error es justo donde se cae la disciplina, y
   es la que se lee con peor luz y peor animo.


## public/sw.js:173

--- estrategias -------------------------------------------------------


## public/sw.js:175

Stale-while-revalidate: se sirve lo que hay al instante --que es lo que
   mide el LCP-- y se refresca por detras para la proxima visita.


## public/sw.js:196

Red primero, cache como red de seguridad. Lo contrario de `estatico`.


## public/sw-listas.js:1

preceptoros.org · QUE se cachea. El COMO vive en `sw.js`.
 *
 * POR QUE ESTAN SEPARADOS, medido el 2026-09-19. `sw.js` llego a 16.118 B de
 * los 16.384 que deja el gate: 266 libres. Meter en el precache los tres
 * registros nuevos (`caminos`, `duelos`, `herramientas`) y sus 24 ficheros por
 * lengua cuesta 298 B contados uno a uno --- 110 de los registros en las dos
 * listas, 162 del bucle sobre IDIOMAS y 26 de las referencias ---. No cabia
 * por 32 B, y retirando las tres paginas que mueren quedaba un margen de 22 B,
 * que en un fichero cuya regla es «jamas se recorta un comentario» no es
 * margen: es la trampa de la siguiente sesion.
 *
 * Asi que se parte POR ASUNTO, como ya se hizo siete veces en este arbol: aqui
 * los datos --- que lenguas, que paginas, que assets --- y alli la logica de
 * instalar, servir y refrescar. Los comentarios viajan CON su asunto; no se ha
 * recortado ninguno.
 *
 * Se carga con `importScripts` desde `sw.js`, que lo trae con `?v=VERSION`
 * pegado: sin ese sufijo un navegador puede servir una copia vieja de este
 * fichero mientras `sw.js` ya es nuevo, y las listas mandan sobre lo que se
 * guarda. Seria la misma averia que la version de cache sin subir, una capa
 * mas abajo.
 *
 * `const` en un guion traido por `importScripts` entra en el ambito global del
 * worker, asi que `sw.js` ve estas listas sin exportar nada.


## public/sw-listas.js:28

LA WEB ES SOLO EL JUEGO (mudanza firmada, bloque 3, 2026-10-11). Cada lengua tiene UNA pagina, su
   portada, y la portada es el juego. Las paginas del hub (instalar, comunidad, benchmark, playground,
   onboarding, perfil) cayeron con su lista y su sha256 en no-publicar/; sus familias de JSON y sus
   piezas, tambien. Lo que queda en el shell es lo que la portada PIDE, medido recorriendola.


## public/sw-listas.js:34

EL JUEGO, AL PRECACHE (mudanza firmada, bloque 2, firma D7 del 2026-10-11). Hasta hoy theGame iba
   FUERA del precache (firma del 2026-09-26: la puerta no pesaba en la primera visita). La mudanza lo
   invierte porque la portada YA ES el juego: sin el en el shell, sin red no se juega. La lista es TODO
   lo que `thegame.js` carga (sus listas y lo que pide a demanda); `atlas/test_atlas.py` la compara con
   la puerta, asi que no puede quedarse atras. Lo que es MEDIDA (`atlas-mundo.json`, `atlas-record.json`)
   sigue fuera: sin red, NO_DATA, nunca una cifra vieja. Los textos del juego (atlas-*.json, tambien los
   de la casa) van en CONTENIDO_JSON, abajo.


## public/sw-listas.js:57

LA PORTADA, ademas del juego: la identidad (auth.js), el canal para comentar y firmar (enviar,
   consiento, page-comment), la PWA, y las tres hojas con sus variables (base, canon con el contraste
   R-WIDGET, soberano). Los textos del canal van en las nueve lenguas: la portada de cada una pide el suyo.


## public/sw-listas.js:64

Lo que viaja en el shell: la portada y el juego. (Antes se llamaba HUB; el nombre se queda en sw.js
   para no tocar su logica de instalar, servir y refrescar, que es la que sobrevivio al 2026-09-08.)


## public/sw-listas.js:68

Los TEXTOS del juego son contenido (se sirven del cache); `atlas-mundo.json` y `atlas-record.json`
   son MEDIDAS y siguen fuera: sin red, NO_DATA, nunca una cifra vieja con cara de fresca.


## public/sw-listas.js:72

Y los textos de opinar firmado (su guion se carga al pulsar), por el mismo criterio.


## public/sw-listas.js:74

Y los de la Arena (2026-09-28): rotulos, no medidas; sin ellos la Arena no abre sin red.


## public/sw-listas.js:76

D7: los textos de la casa faltaban; sin ellos la casa abria sin rotulos sin red.
