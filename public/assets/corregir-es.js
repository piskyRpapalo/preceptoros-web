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
 "corregirBoton": "Corregir esta respuesta",
 "corregirQue": "Escribe aquí la respuesta que esperabas…",
 "corregirMotivo": "Por qué estaba mal (opcional)",
 "corregirFirmar": "Firmar la corrección",
 "corregirNoViaja": "Se firma y se guarda en TU aparato. No viaja solo: si quieres entregarlo, lo exportas tú a un fichero.",
 "corregirGuardado": "Firmado y guardado aquí. Nada ha salido de tu aparato.",
 "corregirFallo": "No se pudo firmar",
 "idEntrar": "Crear identidad",
 "idAviso": "Se genera una clave en tu navegador. No se puede exportar ni copiar a otro aparato: si borras los datos del sitio, esta identidad se pierde y no hay forma de recuperarla. No hay contraseña que olvidar ni servidor que la guarde.",
 "idClave": "Ver mi huella",
 "idFallo": "NO_DATA — no se pudo crear la identidad:",
 "idPerfil": "Mi perfil",
 "idPublica": "Clave pública:",
 "exp": {
  "b": "Exportar correcciones",
  "n": "correcciones guardadas",
  "q": "Se descarga a tu aparato y no se envía a nadie. Hoy no hay dónde subirlo: guárdalo, valdrá cuando abra el canal.",
  "v": "Exportadas",
  "e": "No se pudo exportar"
 }
};
