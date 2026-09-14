/* preceptoros.org · los rotulos de FIRMAR una correccion. Uno por lengua.
 *
 * POR QUE EXISTE, medido el 2026-09-14. En SIETE de las ocho lenguas,
 * `benchmark.html` --la pagina donde se firman las correcciones-- no cargaba
 * `corregir.js`, `aprender.js` ni `elegir.js`. No es que el boton saliera sin
 * texto: la cadena de feedback entera solo existia en castellano, en la pagina
 * cuyo trabajo es justo esa cadena.
 *
 * Y las ocho traducciones llevaban meses escritas en `hub-textos.json` y
 * `nav.json`. Lo que faltaba no era traducir: era LEER. Esa pagina no carga
 * `hub.js`, que es quien las trae, y nadie habia cruzado las dos listas. Misma
 * forma que A16: el dato correcto al lado, sin leer.
 *
 * GENERADO, no escrito a mano, y con su prueba:
 * `test_los_rotulos_de_FIRMAR_dicen_lo_mismo_que_su_fuente`. Copiar texto a un
 * tercer sitio sin esa prueba es garantizar que divergen.
 *
 * `exp` ES LA EXCEPCION, Y VIENE DE VUELTA A CASA. Son las palabras de la
 * exportacion, que vivian dentro de `corregir.js` con un comentario que decia:
 * «lo normal en esta casa es hub-textos.json, y ahi deberian estar... si un dia
 * hay sitio, se mudan». Ese fichero sigue sin sitio --476 B de aire-- pero este
 * si es su casa: es texto de ESTE modulo, por lengua. Su fuente de verdad es
 * este fichero, y por eso la prueba de arriba no las compara con nadie.
 *
 * POR QUE un `.js` y no un `.json` pedido al vuelo: por lo mismo que
 * `prompts-<idioma>.js` y `enviar-<idioma>.js`, que esta medido alli -- el
 * service worker excluye los `.json` del cache salvo tres, y estos rotulos
 * tienen que estar sin red. Y se leen SINCRONOS: el boton se dibuja en cuanto
 * termina un turno, y un rotulo que llega tarde se ve llegar.
 */
window.FIRMA = {
 "corregirBoton": "Correggi questa risposta",
 "corregirQue": "Scrivi qui la risposta che ti aspettavi…",
 "corregirMotivo": "Perché era sbagliata (facoltativo)",
 "corregirFirmar": "Firma la correzione",
 "corregirNoViaja": "Si firma e si conserva sul TUO apparecchio. Non viaggia da solo: per consegnarlo, lo esporti in un file.",
 "corregirGuardado": "Firmato e conservato qui. Nulla è uscito dal tuo apparecchio.",
 "corregirFallo": "Non è stato possibile firmare",
 "idEntrar": "Crea identità",
 "idAviso": "Viene generata una chiave nel tuo browser. Non si può esportare né copiare su un altro apparecchio: se cancelli i dati del sito, questa identità si perde e non c'è modo di recuperarla. Nessuna password da dimenticare, nessun server che la conservi.",
 "idClave": "Vedi la mia impronta",
 "idFallo": "NO_DATA — non è stato possibile creare l'identità:",
 "idPerfil": "Il mio profilo",
 "idPublica": "Chiave pubblica:",
 "exp": {
  "b": "Esportare le correzioni",
  "n": "correzioni salvate",
  "q": "Si scarica sul tuo apparecchio e non si invia a nessuno. Non c'è ancora dove caricarlo: conservalo, varrà quando apre il canale.",
  "v": "Esportate",
  "e": "Impossibile esportare"
 }
};
