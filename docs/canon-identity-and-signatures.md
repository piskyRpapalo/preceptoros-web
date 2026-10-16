# Canon · Identity and signatures (auth, sobres, mercado, hitl_firma)

> Migrated from code by D1 subject 7 (campaign FIRMO, 2026-10-16). Canon with fichero:línea origin. The code keeps not a single comment.

Blocks migrated: 60 · canon bytes: 15077


## public/assets/auth.js:1

preceptoros.org · identidad soberana. Sin servidor, sin contrasena.
   La clave privada se genera EN EL NAVEGADOR y se guarda NO EXTRAIBLE: vive en
   IndexedDB como objeto CryptoKey, firma cuando se le pide, y ni esta pagina
   ni ninguna otra puede leerla. Es mas fuerte que guardar los bytes.

   EL PRECIO, Y SE DICE ANTES: una clave que nadie puede leer tampoco se puede
   exportar ni copiar a otro aparato. Si borras los datos del sitio, esa
   identidad se pierde y no hay «recuperar contrasena» porque no hay
   contrasena. Es el mismo trato de una llave fisica, y quien firma tiene
   derecho a saberlo antes de firmar.

   localStorage queda fuera por doctrina: la soberania no vive ahi.


## public/assets/auth.js:20

T LLEGA TARDE, Y POR ESO EMPIEZA VACIO. Antes esta linea era
     `if (!block || !zona) return;` y ahi se acababa todo: sin bloque i18n,
     este fichero se iba sin pintar nada. Las ocho `instalar.html` no llevan
     bloque --sus textos viven en `/instalar.json`-- asi que en la pagina que
     mas gente abre primero el hueco de la cuenta se creaba y se quedaba
     VACIO. Se veia la rueda de ajustes sola en la esquina, sin su hermano.

     Irse sin rotulos era la decision correcta; irse sin BOTON no. El remedio
     no es escribir aqui seis palabras en ocho idiomas, sino leer el catalogo
     que ya existe justo para esto y que las puertas del cabezal llevan meses
     usando. Y por eso `T` deja de resolverse en esta linea: lo hace
     `rotulos()`, abajo, que devuelve una promesa.


## public/assets/auth.js:35

EL MENU DE IDENTIDAD ES UN POPOVER NATIVO. El navegador pone la capa
     superior, el cierre con Escape, el cierre al pulsar fuera y el foco. No
     habia logica manual de toggle que quitar --nunca la hubo-- y aqui no se
     escribe una: `popovertarget` en el boton y ya esta.

     Se crea en JS y no en las tres portadas por una razon medida: a
     `fr/index.html` le quedaban 533 B. Aqui cuesta CERO bytes de HTML, y
     ademas este fichero ya construye toda su interfaz asi.


## public/assets/auth.js:85

EL NOMBRE ES LA PUERTA, no un rotulo al lado de la puerta. Habia tres
         piezas apiladas --«Hola, X», «Mi perfil» y «Ver mi huella»-- y las
         tres a tamano de boton: en el Doogee eso eran tres filas del cabezal
         para decir quien eres. Ahora el pseudonimo ES el enlace, que ademas es
         donde se busca: se pulsa tu nombre para ver lo tuyo.

         `title` conserva lo que el rotulo decia, para quien pase por encima y
         para quien lea con los oidos: un nombre suelto no anuncia que lleva
         a ningun sitio.


## public/assets/auth.js:96

LA PUERTA AL PERFIL VA AQUI Y NO EN EL CABEZAL. El cabezal de la
         portada se midio en el Doogee: siete botones ocupaban tres filas, y
         se bajo a cinco. Un sexto fijo desharia esa medida para todo el
         mundo, incluido quien llega por primera vez y todavia no tiene ficha
         que mirar.

         Colgada de la identidad no cuesta una fila a nadie: aparece cuando
         aparece el pseudonimo, en las cinco paginas que cargan este fichero,
         y es ademas donde se busca -- se pulsa tu nombre para ver lo tuyo.

         `T.idPerfil` puede faltar: no todas las paginas que cargan auth.js
         tienen la clave. Sin ella no se pinta un enlace vacio, no se pinta
         nada. Y en la propia ficha tampoco, que seria un enlace a si misma.


## public/assets/auth.js:131

LA HUELLA, CUANDO EXISTE, SE ENSENA COMO NUMERO CORTO. El boton decia
           «Ver mi huella» y ocupaba una fila entera para no decir ninguna
           huella. Con los seis primeros digitos se reconoce de un vistazo y
           cabe al lado del nombre; la completa sigue estando a un toque, en el
           menu, que es donde se comprueba de verdad.

           Se pone DESPUES de exportar y no antes: si la exportacion fallara,
           el boton se queda con su rotulo en vez de con un hueco. El nombre
           accesible no cambia -- seis digitos no anuncian lo que hace.


## public/assets/auth.js:144

SIN SESION, UN ICONO DE PERSONA Y NADA MAS (2026-09-05, firmado).
         Decia «Crear identidad» con todas sus letras, y en frances y en aleman
         eso es la pieza mas ancha del cabezal para ofrecer algo que la mayoria
         no va a hacer en su primera visita. El dibujo de una persona lo dice
         en las ocho lenguas y ocupa lo que un dedo necesita.

         EL ROTULO NO DESAPARECE, cambia de sitio: va al nombre accesible y al
         `title`, asi que quien lee con los oidos y quien pasa el cursor
         reciben la frase entera. Un icono sin nombre accesible es un boton
         mudo, y eso no es simplificar: es esconder.

         Y el panel que abre sigue siendo el mismo popover con el aviso de que
         la clave no se recupera. Lo que se ha encogido es la puerta, no lo que
         hay detras.


## public/assets/auth.js:165

EL AVISO VA ANTES, NO DESPUES. Hasta hoy la clave se generaba al
         pulsar y el «esto no se puede exportar ni recuperar» aparecia cuando
         ya existia. Una identidad irreversible se acepta informado o no se
         acepta: el popover es la unica pantalla entre el boton y la clave.


## public/assets/auth.js:204

CREAR, desde fuera de este fichero y sin salirse de su dueno. La clave
       sigue naciendo aqui --`auth.js` es el unico que abre la base
       `preceptoros`, y una segunda pieza con su propia idea de la version es
       como se rompen las bases de datos-- pero ahora se puede PEDIR.

       Hace falta porque el callejon sin salida estaba medido: se escribe una
       correccion entera, se pulsa Firmar, y la pagina contesta «sin identidad»
       sin decir donde se consigue una.


## public/assets/auth.js:220

OLVIDAR LA CLAVE. Vive AQUI y no en la pagina que lo ofrece, por la
       misma razon por la que vive aqui generarla: `auth.js` es el unico dueno
       de la base `preceptoros`. Una segunda pieza abriendo ese almacen con su
       propia idea de la version es como se rompen las bases de datos
       --leccion de `bronce.js`-- y aqui el dato que se rompe no se regenera.

       NO ES «CERRAR SESION» Y NO HAY VUELTA. La privada se genero no
       extraible: no existe copia en ningun sitio. Borrar el registro es
       perder la unica prueba de autoria de todo lo que ya se firmo con ella.
       Lo firmado sigue existiendo; lo que desaparece es que fuera tuyo. Quien
       llama a esto tiene que haber avisado ANTES y con todas sus letras
       --`profile.html` exige escribir una palabra-- porque aqui ya es tarde.

       Se avisa con el MISMO evento que al crearla, y con `apodo: null`. Un
       evento propio de despedida obligaria a cada oyente a escuchar dos cosas
       para enterarse de una sola: que la identidad de la pagina cambio.


## public/assets/auth.js:255

FIRMAR UNA CADENA, no un objeto. El reto del Agora se firma sobre
       `pseudonimo|clave_publica|reto`, que es texto plano: pasarlo por
       `JSON.stringify` le anadiria comillas y el servidor verificaria otros
       bytes. Son dos firmas distintas y por eso son dos funciones distintas --
       una sola con un `if` dentro es donde un dia se firma lo que no era.


## public/assets/auth.js:290

El bloque propio manda; el catalogo es el respaldo, no al reves. Cuando la
     pagina trae su i18n se usa ese y no se pide nada a la red: es la misma
     palabra, y una peticion que no hace falta es una peticion que puede
     fallar. `nav.json` se genera desde el bloque de la portada (`nav.py`), asi
     que las dos ramas dicen literalmente lo mismo.


## public/assets/auth.js:301

bloque roto: se sigue al catalogo


## public/assets/auth.js:303

Sin bloque (nav.json cayo en b3): rotulos en ingles. A1B8: con {} se pintaba «undefined», el aviso incluido.


## public/assets/auth.js:15

// 64 bytes de firma Ed25519 -> 128 caracteres hex. Es la longitud del


## public/assets/auth.js:16

// algoritmo, no una preferencia: si sale otra cosa, algo se rompio.


## public/assets/auth.js:70

// El pseudonimo sale del hash de la clave publica: corto, legible y


## public/assets/auth.js:71

// derivado, no elegido. Nadie puede pedir un nombre que ya sea de otro.


## public/assets/auth.js:117

// En la propia ficha el nombre no enlaza a si misma: se dice y ya.


## public/assets/auth.js:122

// La huella completa, para quien quiera comprobar que su firma es suya.


## public/assets/auth.js:123

// Va al menu y no al hueco: pulsando dos veces, la version anterior


## public/assets/auth.js:124

// apilaba un parrafo mas cada vez.


## public/assets/auth.js:182

// Devuelve promesa: quien la llama desde fuera necesita saber CUANDO hay


## public/assets/auth.js:183

// identidad para reintentar la firma.


## public/assets/auth.js:184

// Solo para el fallo: el aviso ya se leyo en el menu, antes de pulsar.


## public/assets/auth.js:213

// La clave PUBLICA en hex. La privada sigue siendo no extraible: esto no


## public/assets/auth.js:214

// afloja nada, solo expone lo que ya es publico por definicion. Hace falta


## public/assets/auth.js:215

// para derivar el codigo de vinculo web<->app del onboarding.


## public/assets/auth.js:245

// Se firma el JSON canonico del objeto: mismo objeto, misma firma.


## public/assets/auth.js:246

//


## public/assets/auth.js:247

// LA FIRMA VA ENTERA. Hasta el 2026-08-30 esto devolvia los 16 primeros


## public/assets/auth.js:248

// caracteres y unos puntos suspensivos: `ed25519:a3f9…`. Calculaba los 64


## public/assets/auth.js:249

// bytes y tiraba 48. Se veia bien --parecia una firma-- y no lo era: con


## public/assets/auth.js:250

// 16 nibbles no se puede verificar nada, ni aqui ni en el Agora. Una


## public/assets/auth.js:251

// firma recortada es un adorno con nombre de garantia.


## public/assets/auth.js:252

//


## public/assets/auth.js:253

// Si hace falta acortarla para ENSENARLA, se acorta al pintar, que es


## public/assets/auth.js:254

// donde el recorte no destruye nada. Aqui no.


## public/assets/auth.js:277

// Ed25519 firma siempre en 64 bytes: 128 caracteres hexadecimales,


## public/assets/auth.js:278

// ni uno mas ni uno menos. Se comprueba en vez de confiarlo -- un


## public/assets/auth.js:279

// dia alguien cambia de curva y aqui nadie se entera.


## public/game/sobres.js:1

preceptoros.org · theGame · multijugador · los SOBRES firmados y la SEMILLA que nadie elige a solas.

   SIN SERVIDOR (PLAN §2): entre dos aparatos viajan sobres `atlas.sobre/1`, cada uno firmado con la
   identidad Ed25519 de quien lo manda. La firma cubre `mensaje(s)`: el JSON canonico del sobre sin
   su campo `firma` (`canon.js`). En la pestana se firma con `Identity.firmarTexto(mensaje(s))`.

   EL LIBRO DE UNA SESION (`libro` / `anota`) acepta un sobre solo si:
   - su forma es exacta y la sesion es la suya (un sobre de otra sesion es una REPLICA);
   - quien lo manda es par de la sesion;
   - su `seq` es el siguiente y su `prev` enlaza con la huella del anterior del mismo autor;
   - no lo habia visto ya y no pasa de los bytes ni de las operaciones de la politica.
   Dos sobres del mismo autor con el mismo `seq` y distinto cuerpo son una PRUEBA DE FRAUDE (doble
   gasto): se guardan las dos huellas, que cualquiera puede verificar, y ese autor queda fuera.
   La firma la verifica quien llama ANTES de anotar (`verifica`, con la plataforma que haya:
   WebCrypto en la pestana, `crypto` en node). Este fichero no elige plataforma.

   COMMIT-REVEAL (brief §5; sustituye a la semilla del PLAN §3, que era sha256 de dos firmas y la
   podia moldear quien firmaba el ultimo). Cada par elige `r` al azar en su aparato, publica
   `compromiso(r, clave, sesion)` y, cuando todos se han comprometido, revela `r`. La revelacion
   ATESTIGUA el conjunto de compromisos que vio: un compromiso tardio, hecho despues de ver una
   revelacion, invalida la semilla en vez de elegirla. Limite dicho: el ultimo en revelar puede
   ABORTAR (no revelar), no ELEGIR; su compromiso sin revelacion queda a la vista como deuda.

   PURO: ni DOM, ni red, ni reloj, ni azar (el `r` lo pone quien llama). Nada se guarda.


## public/game/sobres.js:31

tipo del sobre -> esquema de su cuerpo.


## public/game/sobres.js:40

La misma guarda que las opiniones: ni rutas, ni correos, ni enlaces, ni IPs, ni etiquetas.


## public/game/sobres.js:50

--- la politica de sesion (`atlas.mp_sesion/1`); su huella ES la sesion -----------------------


## public/game/sobres.js:70

--- el sobre -------------------------------------------------------------------------------


## public/game/sobres.js:96

Lo que se firma: el sobre sin su firma, canonico.


## public/game/sobres.js:98

El nombre del sobre: su huella con la firma dentro.


## public/game/sobres.js:100

`v(texto, firmaHex, claveHex) -> bool | Promise<bool>`.


## public/game/sobres.js:106

--- el libro de la sesion ------------------------------------------------------------------


## public/game/sobres.js:135

El orden de llegada no importa: se ordena por (autor, seq, huella) y se anota en ese orden.


## public/game/sobres.js:148

--- commit-reveal --------------------------------------------------------------------------


## public/game/sobres.js:153

El conjunto de compromisos que hay en el libro, en orden de clave: lo que atestigua una revelacion.


## public/game/mercado.js:1

preceptoros.org · theGame · multijugador · el MERCADO entre personas (y, mañana, entre agentes).

   UNA OFERTA NO ES FINAL HASTA QUE FIRMA EL CARBONO (IronClaw). Viajan tres sobres:
   - `oferta` (o `contraoferta`): quien da, que da y que pide, en RECURSOS DEL MOTOR (luz, biomasa,
     cobre, flujo, oxigeno); nunca dinero real ni cripto ni una moneda nueva (addendum §2.6). Caduca
     por CICLO de juego (`expira_ciclo`), nunca por reloj. `para` nombra a una persona o a
     «cualquiera». Un borrador de agente (`procedencia: 'agente_borrador'`) no se liquida: la
     persona tiene que firmarlo como suyo.
   - `aceptacion`: la otra parte, con su ciclo.
   - `liquida` las casa y escribe un ASIENTO encadenado por hash (`atlas.asiento/1`): nonce no
     reutilizado, sin doble liquidacion, sin aceptar lo propio, dentro de plazo.

   EL ASIENTO REGISTRA LA OBLIGACION FIRMADA POR LAS DOS PARTES; NO MUEVE RECURSOS. El motor no
   tiene una accion de transferencia y anadirla es un parche de motor que pide firma (auditoria
   §2.7). Sin pagos automaticos, sin agencia economica desatendida.

   PURO: ni DOM, ni red, ni reloj. El libro vive en memoria; guardarlo pide firma.


## public/game/mercado.js:27

Defensa en profundidad: las formas son cerradas, y aun asi un nombre de valor real se rechaza.


## public/game/mercado.js:77

Las dos firmas ya verificadas por quien llama (`sobres.verifica`).


## public/game/mercado.js:101

La cadena de asientos se comprueba sola: numeros seguidos y cada `prev`, la huella del anterior.


## public/game/hitl_firma.js:1

preceptoros.org · theGame · G3 ONE-CLICK CRYPTOGRAPHIC HITL (PROPUESTA mistral/g3).
   WHAT. One click signs the current action and shows the ATTESTATION RECEIPT:
   action id, world coordinate, public key, Ed25519 signature, game cycle.
   The private key NEVER leaves the device: `Identity` (assets/auth.js) is the
   only owner of the key store; this piece only ASKS it to sign.
   VOCABULARY (canon ideas13oct). This is a Cryptographic HITL (EU AI Act
   Art. 14, CELEX 32024R1689; IETF RFC 8032 Ed25519). The receipt is an
   Attestation Receipt. Zero Retention with Attestation Receipt: nothing is
   sent anywhere; zero new network requests (cero red nueva).
   CONTRACT BEFORE SIGNATURE. The dialog shows what it does, what it costs and
   what exactly gets signed, before the button does anything. Cancel and
   Escape sign nothing.
   DETERMINISM. Same state + same action = same signed message, except the
   game cycle field which is read at click time and shown in the receipt.
   A11Y. Mouse, keyboard, touch; Escape cancels; role=dialog aria-modal;
   focus moved and restored; buttons >= 44 px (home.css budget).
   FIRMOs OPEN (NOT decided here): receipt date UTC vs game cycles; receipt
   push identity (receipts branch only, never main, never jetson); stamp cost.


## public/game/hitl_firma.js:73

FIRMO del Soberano (15-oct): hora UTC dentro del JSON del recibo (matasellos declarativo, SIN autoridad) + ciclos de juego en la vista. El ciclo sigue siendo la única vara temporal con autoridad sobre el juego.


## public/game/hitl_firma.js:91

ENTRY POINT (declared, decision (a)): deliberate until G4 — no manifest action opens
     this panel today; the receipt wiring lands with G4. Until then the receipt UI is
     NO_DATA with cause: waiting G4 wiring.
