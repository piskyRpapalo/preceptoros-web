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
 "corregirBoton": "Διόρθωσε αυτή την απάντηση",
 "corregirQue": "Γράψε εδώ την απάντηση που περίμενες…",
 "corregirMotivo": "Γιατί ήταν λάθος (προαιρετικό)",
 "corregirFirmar": "Υπόγραψε τη διόρθωση",
 "corregirNoViaja": "Υπογράφεται και φυλάσσεται στη ΔΙΚΗ ΣΟΥ συσκευή. Δεν ταξιδεύει μόνη: για να τη δώσεις, την εξάγεις σε αρχείο.",
 "corregirGuardado": "Υπογράφηκε και φυλάχτηκε εδώ. Τίποτα δεν έφυγε από τη συσκευή σου.",
 "corregirFallo": "Δεν ήταν δυνατή η υπογραφή",
 "idEntrar": "Δημιουργία ταυτότητας",
 "idAviso": "Δημιουργείται ένα κλειδί στον περιηγητή σου. Δεν εξάγεται ούτε αντιγράφεται σε άλλη συσκευή: αν σβήσεις τα δεδομένα του ιστότοπου, αυτή η ταυτότητα χάνεται και δεν ανακτάται. Κανένας κωδικός να ξεχάσεις, κανένας διακομιστής να τον φυλάει.",
 "idClave": "Δες το αποτύπωμά μου",
 "idFallo": "NO_DATA — δεν ήταν δυνατή η δημιουργία της ταυτότητας:",
 "idPerfil": "Το προφίλ μου",
 "idPublica": "Δημόσιο κλειδί:",
 "exp": {
  "b": "Εξαγωγή διορθώσεων",
  "n": "αποθηκευμένες διορθώσεις",
  "q": "Κατεβαίνει στη συσκευή σου και δεν στέλνεται πουθενά. Δεν υπάρχει ακόμη πού να ανέβει: κράτησέ το, θα μετρήσει.",
  "v": "Εξήχθησαν",
  "e": "Αδύνατη η εξαγωγή"
 }
};
