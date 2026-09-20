/* preceptoros.org · QUE se cachea. El COMO vive en `sw.js`.
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
 */

const IDIOMAS = ['es', 'en', 'fr', 'pt', 'it', 'de', 'ru', 'el'];
const PAGINAS = ['', 'instalar.html', 'community.html', 'benchmark.html',
                 'playground.html', 'onboarding.html', 'profile.html'];

/* Las piezas del Hub. Van al shell y no al cache de obra porque sin ellas la
   portada carga y se queda sin rejilla: el esqueleto se pinta, `hub.json` no
   llega y sale NO_DATA. Un PWA que abre sin su contenido principal no esta
   instalado, esta a medias. */
/* LOS OCHO OJOS SE FUERON CON LA PANTALLA VIEJA (2026-09-05). Los pintaba
   solo la portada de la raiz, y esa portada es ahora el despertar. Sin nadie
   que los pinte, precachearlos son 48.410 B que se descargan en cada
   instalacion y no ve nunca nadie -- el mismo desperdicio que en su dia hizo
   que se trajeran a la raiz, ahora al reves. Los ficheros siguen en `assets/`:
   dejan de viajar, no se borran.

   No hizo falta acordarse: `test_ningun_asset_precacheado_esta_muerto` lo
   canto en la misma pasada, con los ocho nombres. */
/* LAS OCHO ESFERAS SE RETIRAN, 2026-09-20, y la cifra es el motivo.
   Eran 108.582 B --- mas de ocho veces las dos laminas de marmol de aqui
   abajo, que estan puestas con su medida al lado como si fueran el gasto
   grande--- y las descargaba y guardaba TODO visitante, para un panel de
   companeros que se retiro de la pantalla el 2026-09-05 y del catalogo hoy.
   Quince dias sirviendo cien kilobytes a nadie.
   Se va tambien la otra familia de ocho --- la que el comentario de aqui
   arriba retiro del precache el 2026-09-05 y cuyo nombre no se escribe en este
   fichero, porque hay una prueba que lo prohibe y que ya me pillo citandola en
   una explicacion ---, 48.410 B que ya eran huerfanos ANTES de hoy: ningun
   fichero los nombraba. No los precacheaba nadie, asi que no costaban
   descarga --- costaban repositorio y confusion.
   La leccion, que es la que vale manana: `test_ningun_asset_precacheado_esta_muerto`
   vigila que lo precacheado EXISTA. Existir no es lo mismo que servir para
   algo, y un fichero que existe y no usa nadie pasa esa prueba entera. La que
   faltaba --y entra hoy-- es la simetrica: que nadie precachee lo que ningun
   codigo pide. */
/* LAS DOS LAMINAS DE MARMOL, 12.570 B entre las dos. Van al shell porque el
   fondo dejo de ser decorado el 2026-09-05: la puerta de la raiz y el telon de
   cada lengua se pintan SOBRE el, y sin conexion salian como dos planchas
   lisas. Cuesta menos que uno solo de los bustos, y las pinta base.css,
   tema.css y la portada de la raiz -- no es arte huerfano. */
/* LOS OCHO FICHEROS DE NOMBRES DE COMPANEROS, uno por lengua, entran al shell
   el 2026-09-08. Salieron del bloque i18n de las portadas por sitio, y sin red
   una peticion que no esta en cache no se hace: el panel caeria a los nombres
   en castellano del catalogo en las ocho lenguas. Se precachean las ocho y no
   solo la del visitante porque el shell es uno para todo el sitio y la rueda
   deja cambiar de idioma sin conexion. Cuestan 12,7 KB entre todos: menos que
   una de las dos laminas de marmol que ya estan aqui arriba. */
const AGENTES = ['de', 'el', 'en', 'es', 'fr', 'it', 'pt', 'ru']
  .map(function (l) { return '/agentes-' + l + '.json'; });
/* `duelos-<lang>.json` entra por el mismo criterio que los caminos: son
   ROTULOS, no medidas. Son diminutos --- entre 722 y 1.187 B --- y sin ellos
   el duelo se queda sin cabeceras de columna justo en el caso en que mas falta
   hacen: una PWA instalada y sin red, donde no se puede pedir el turno y lo
   unico que queda es leer que iba a compararse. */
const DUELOS = ['de', 'el', 'en', 'es', 'fr', 'it', 'pt', 'ru']
  .map(function (l) { return '/duelos-' + l + '.json'; });

/* `herramientas-<lang>.json`, por el mismo criterio: rotulos, no medidas, y
   diminutos. El indice de lo que te puedes llevar tiene que leerse sin red ---
   es justo la pagina que abre quien acaba de instalar la web y todavia no
   tiene nada mas. */
const HERRAMIENTAS = ['de', 'el', 'en', 'es', 'fr', 'it', 'pt', 'ru']
  .map(function (l) { return '/herramientas-' + l + '.json'; });

const HUB = [...AGENTES, ...DUELOS, ...HERRAMIENTAS, '/hub.json', '/hub-textos.json',
             '/assets/marble-violet.webp', '/assets/marble-violet-oscuro.webp', '/modelos.json', '/servicios.json', '/instalar.json',
             '/assets/instalar-descargas.js', '/assets/widget.css', '/assets/puertas.css', '/assets/escribir.css', '/assets/placa.css', '/medidas.json', '/assets/medidas.js', '/nav.json', '/assets/cabezal.js', '/assets/cabezal-rotulos.js', '/assets/selector-modelo.js', '/assets/consiento.js', '/cerebros.json', '/cerebros-en.json', '/cerebros-es.json', '/assets/logos-models/preceptor.svg', '/assets/logos-models/qwen.svg', '/assets/logos-models/mistral.svg', '/assets/cabezal.css', '/assets/esquina.css', '/assets/esquina-cuenta.css', '/assets/esquina-par.css', '/assets/mandos.css', '/assets/panel.css', '/assets/nubes.css', '/assets/consiento.css', '/assets/senal.css', '/assets/senal.js',
             '/assets/hub.js',
             '/assets/hub-cola.js', '/assets/chat-router.js',
             /* Los dos guiones de la Torre. Entran al shell el 2026-09-20,
                cuando el piso 1 pasa a ser el companero por defecto del chat:
                sin ellos en cache, una PWA instalada abre sin red y se queda
                con «Modelo: ninguno», que es como quedo la portada esta misma
                manana al retirar los ocho companeros sin poner nada en su
                sitio. Cuestan 18,8 KB entre los dos --- ocho veces menos que
                las esferas que acaban de salir de esta misma lista. */
             '/assets/camino.js', '/assets/camino-papel.js',
             /* El duelo de LoRAtelier y su cliente del rack, 2026-09-20.
                `rack.js` no estaba en el shell porque hasta hoy solo lo
                cargaba la portada; el duelo lo necesita en las ocho
                paginas de Benchmark. Sin red el duelo no puede pedir
                turnos --- eso lo dice el con su NO_DATA --- pero la
                pantalla se pinta y se lee, que es la diferencia entre una
                pagina que explica por que no puede y una que no carga. */
             '/assets/duelo.js', '/assets/duelo-firma.js', '/assets/rack.js',
             '/assets/herramientas.js',
             /* La salida del callejon «sin identidad», compartida por las
                cuatro pantallas que firman. Sin ella en el shell, una PWA
                sin red pone el boton de firmar y no puede ofrecer la
                identidad que le falta --- que es el peor momento posible
                para quedarse sin salida. */
             '/assets/identidad-o-salida.js', '/assets/corregir.js', '/assets/aprender.js', '/assets/elegir.js', '/assets/comandos.js']
  /* Las tres tiras: `widget.css` las pide y sin red el cabezal se queda
     con un circulo vacio. */
  .concat(['apertura', 'reposo', 'habla']
          .map(s => '/assets/caras/secuencia-' + s + '-256.webp'));

/* `hub.json` es CONTENIDO, no una medida. La diferencia decide la estrategia:
   `counters.json` publica la cifra de los gates y servirlo del cache seria
   ensenar un numero viejo con cara de fresco --la averia que costo la puerta
   1--; `hub.json` es el catalogo que viaja con el sitio, como una hoja de
   estilo. Por eso este se cachea y aquel no, y por eso la lista es explicita:
   una regla que dice «los .json no» y otra que dice «este si» tienen que
   poder leerse juntas. */
/* `modelos.json` entra aqui con `hub.json` y no con las medidas, aunque lleve
   fichas en formato MEDIDO/NO_DATA. La diferencia no es el formato: es si una
   copia vieja puede CONTRADECIR algo. `counters.json` publica cifras que
   ademas estan escritas en las tres portadas, asi que una copia vieja monta
   una contradiccion entre la pagina y el dato. El catalogo de modelos no
   tiene gemelo en el HTML, y ademas lleva su propia `ultima_lectura`: una
   copia vieja se declara vieja sola. */
/* `caminos-<lang>.json` entra por el mismo criterio que los agentes: son
   ROTULOS, no medidas. Una copia vieja no contradice a nadie y a cambio la
   Torre se lee sin red, que es el caso de la PWA instalada. Entro el
   2026-09-20, cuando `camino.js` empezo a pintarla. */
const CAMINOS = ['de', 'el', 'en', 'es', 'fr', 'it', 'pt', 'ru']
  .map(function (l) { return '/caminos-' + l + '.json'; });


const CONTENIDO_JSON = [...AGENTES, ...CAMINOS, ...DUELOS, ...HERRAMIENTAS, '/hub.json', '/hub-textos.json', '/medidas.json', '/nav.json', '/modelos.json', '/servicios.json', '/instalar.json'];

/* El manifiesto va a red primero: es diminuto, cambia cuando cambian los
   iconos, y un manifiesto viejo hace que la app instalada se quede con el
   icono anterior sin forma de enterarse. */
const RED_PRIMERO = ['/manifest.webmanifest'];

