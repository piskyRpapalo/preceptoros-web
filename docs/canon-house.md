# Canon · The house (casa, crab, terminal, radio, entry choices)

> Migrated from code by D1 subject 8 (campaign FIRMO, 2026-10-16). Canon with fichero:línea origin. The code keeps not a single comment.

Blocks migrated: 62 · canon bytes: 15866


## public/game/casa-lateral.js:1

preceptoros.org · theGame · EL RIEL LATERAL de las partes del cangrejo (U1, «el mapa unico», contrato FIRMADO).

   Las partes (los edificios de antes) DEJAN de flotar sobre el cuerpo y son BOTONES en el borde de la terminal:
   siempre en el mismo sitio y en el mismo orden (caparazon, pinzas, patas, ojos: la lista UNA de
   `casa-medidas.js`). AI-FLUENT para carbones y silicios:
   - selector estable: `#parte-<id>`, clase `.casa-lateral-parte` y `data-parte`;
   - nombre en TEXTO y su cifra MEDIDA (o NO_DATA en niebla), y un aria-label real («Shell · Core · Lv 1»);
   - un solo boton enfocable a la vez; flechas arriba/abajo (y Inicio/Fin) entre ellos, como las pestanas J10;
     Enter o el dedo abren la MISMA puerta que antes (`AtlasCasa.entra`): caparazon y pinzas, el TALLER; patas,
     la expedicion del Bosque; ojos, la camara al Faro (Hexelion).
   La puerta es `AtlasCasaLateral.monta(zona, ctx)`, ctx = { T, medidas(), entra(id) }. Sin red, sin azar.


## public/game/casa-lateral.js:18

La cifra de cada parte y su aria-label, del ESTADO del juego (lo no medido: NO_DATA, y la parte en niebla).


## public/game/casa-lateral.js:30

Foco itinerante: solo `i` es tabulable; las flechas lo mueven (sin envolver la lista: el orden es fijo).


## public/game/casa-medidas.js:1

preceptoros.org · theGame · LAS PARTES DEL CANGREJO Y SU CIFRA MEDIDA (sale de `home_buildings.js` en U0, «el
   mapa unico», 2026-10-11: la lista UNA de las partes, la que leeran la casa, el riel lateral y quien mire el DOM).

   PARTES, en su orden de siempre: caparazon (Nucleo), pinzas (Army), patas (Bosque), ojos (Faro). Cada una:
   [id, icono, a donde lleva, la cifra que la explica]. «a donde»: 'taller' (la hoja del Taller), 'faro' (la
   camara a Hexelion, accion `mover faro` del piloto: una sola lista de destinos) o '' (su DENTRO, aqui). DENTRO dice que se muda al entrar en una parte que no lleva a
   otra pestana. `medidas` es PURA: de la instantanea, el tamano del Army y los nodos medidos sale cada cifra; lo que
   no se midio es null (NO_DATA), nunca un cero inventado. Sin DOM, sin red, sin azar: corre igual en node.


## public/game/casa-medidas.js:14

s: atlas.instantanea/1 o null; army: tropas del Army o null; nodos: nodos con alguna medida MEDIDO o null.


## public/game/casa-personaliza.js:1

preceptoros.org · theGame · «CUSTOMIZE»: personalizar tu casa (sale de `home_buildings.js` en U0, «el mapa
   unico», para que la casa quepa bajo su techo de 16 KiB sin perder nada).

   Estilo del caparazon, variante del emblema, POSTURA (alianzas, comercio, formacion), BANDERA (P10) y lema. Se guarda
   en ESTE aparato por la casa y, si se comparte, viaja FIRMADO. Sin datos personales: el lema que parezca
   correo, URL, ruta, IP o telefono no entra (`forma`). Y NO DA VENTAJA. La puerta es
   `AtlasCasaPersonaliza.abre(ctx)`: ctx = { casa, opciones, T, forma, guarda, raiz }.


## public/game/crab_render_hd.js:1

preceptoros.org · theGame · REALISMO ANIME HONESTO (R1, FIRMO 2026-10-12): el cangrejo en CEL SHADING.

   Misma ecuacion, mismo vector: la onda del cangrejo (`AtlasCangrejo.onda`, k=1/6/2) dibujada en estilo toon, sin un
   parametro visual nuevo. Cero raster, cero assets, cero azar: todo sale de la onda, de su clase y de la luz declarada.
   LEY DE LA RONDA:
   1. CEL CUANTIZADO: LUZ declarada (arriba-izquierda, fija). Tres BANDAS de tono duro (brillo / base / sombra) del MISMO
      hue que su clase (mar 196 · coral 12) o que su sello (TABLA_SEMANTICA, abajo: la UNICA fuente de color de sello).
      Nada de degradados: la sombra es la media luna opuesta a la luz; el brillo, la onda menguada hacia la luz.
   2. CONTORNO GRUESO: el borde es la misma serie de Fourier, con trazo engordado (el de la gacha).
   3. MORF ARMONICO: si la onda cambia (army, pinzas), sus terminos [k, ax, ay, fase] se interpolan en MORF_MS (2 s);
      jamas un salto. Movimiento reducido: sin morf, sin parpadeo, sin vaiven.
   4. El LATIDO sigue siendo el brillo: un halo en BANDA (no un desenfoque) del ancho del latido.
   El paseo J1 no se toca: esto solo pinta donde mar-cangrejos ya lo puso. Devuelve las mismas anclas que
   `AtlasCangrejo.pinta`. Sin red, sin azar; el reloj de pantalla solo anima (proyeccion, no decision).


## public/game/crab_render_hd.js:17

La tabla de sellos de la ronda: hue por sello. Lo que no esta aqui no tiene color (NO_DATA).


## public/game/crab_render_hd.js:18

OLA 1 P1 (F305, consolidacion): la tabla vive AHORA en tabla_semantica.js — la UNICA fuente fisica. Este modulo la lee; no la duplica.


## public/game/crab_render_hd.js:25

Puro: las bandas de un tono. TODAS con el mismo hue de entrada (el sabotaje estrella cambia uno y se pone rojo).


## public/game/crab_render_hd.js:30

Puro: las bandas de un sello, de la tabla. Sello desconocido: null (no se inventa color).


## public/game/crab_render_hd.js:32

Puro: interpolar dos series [k, ax, ay, fase] termino a termino (interpolateFourierTerms del constructor).


## public/game/crab_render_hd.js:41

La onda que se ve en el instante t: si la de destino cambio, se morfea desde la que se veia.


## public/game/crab_render_hd.js:59

Parpadeo determinista: uno de cada 4 ciclos, 150 ms al empezar el segundo de pantalla.


## public/game/crab_render_hd.js:78

patas articuladas (cadera -> rodilla -> pie), fase por pata; su largo es el Bosque


## public/game/crab_render_hd.js:88

el latido: un halo en BANDA del ancho del latido (antes, un desenfoque)


## public/game/crab_render_hd.js:91

caparazon en tres bandas, recortadas a su propia onda


## public/game/crab_render_hd.js:99

ojos en antenas: blanco, contorno y pupila; parpadeo del ciclo


## public/game/crab_render_hd.js:116

La ficha del render (el inspector y el lab leen lo mismo que se ve).


## public/game/crab_render_hd.js:77

// la luz NO se espeja con el cangrejo: es del mundo


## public/game/crab_render_hd.js:96

// rim light


## public/game/crab_render_hd.js:98

// contorno grueso


## public/game/crab_state_screen.js:1

theGame · pliego-estado: un guion fijo que reubica renders del estado ya medido.
   No posee estado ni calcula cifras: AtlasCasa, AtlasCasaMedidas y atlas-piso siguen siendo las fuentes.


## public/game/crab_free_move.js:1

preceptoros.org · theGame · EL CANGREJO FUNCIONAL (B, FIRMO 2026-10-12): manejo libre ENCIMA del paseo J1.

   El paseo automatico (`AtlasCangrejo.paseo`) sigue siendo suyo e INTOCABLE: esto suma un DESPLAZAMIENTO libre a donde
   el paseo lo pone. Tocar mar vacio lo manda alli (desliza, VEL unidades por cuadro); los botones direccionales lo
   empujan PASO unidades. El control por voz sigue NO_DATA: reconocimiento local no habilitado ni medido.
   La NIEBLA es honesta: lo no medido no se pisa. Si el siguiente paso cae en niebla (>= 0,5), se para y la Radio dice
   por que (NO_DATA: no medido).

   SKILLS REALES (B2), de lo que el cangrejo HACE hoy, y de nada mas:
   - SWIM: cada LLEGADA es un evento append-only {tipo:'nado', ciclo, dist}. Nivel = floor(sqrt(llegadas)).
   - REACH: tocar una pieza A SU ALCANCE (a menos de ALCANCE del cangrejo) es un evento {tipo:'alcance', ciclo, que}.
     Nivel = floor(sqrt(alcances)). La PRIMERA vez abre el tutorial (E), si existe.
   Sin eventos: NO_DATA, nunca «nivel 0». Los eventos viven en esta pestana: persistirlos espera firma (declarado).
   Sin red, sin azar; el reloj solo mide el cuadro.


## public/game/crab_free_move.js:22

Reusa el contrato del ciclo del arrecife/NPC: entero seguro no negativo hasta 1e9.


## public/game/crab_free_move.js:40

Puro: el nivel de una skill de una lista de eventos. Sin eventos, null (NO_DATA).


## public/game/crab_free_move.js:43

Puro: un paso desde `a` hacia `b`, como mucho `v`. Devuelve [x, y, llego].


## public/game/crab_free_move.js:50

Cada cuadro, desde mar-cangrejos (solo TU cangrejo): base = donde lo pone el paseo; circ = lo despejado.


## public/game/crab_free_move.js:69

Ir a un punto del MUNDO (base = donde esta el paseo ahora).


## public/game/crab_free_move.js:77

¿Esta (x, y) al alcance del cangrejo (donde lo puso el paseo en el ultimo cuadro + off)? Si si, evento REACH.


## public/game/crab_free_move.js:88

Las skills, legibles (para su panel y para el lab).


## public/game/crab_free_move.js:103

El panel «Skills» del cajon (el menu lo descubre solo). Se repinta solo cuando llega un evento.


## public/game/gdpr-art25-ephemeral-crab.js:1

preceptoros.org · theGame · EL CANGREJO (C5/J1, firmado en el plan de ronda 2026-10-11).

   QUIEN ES. Todos juegan como cangrejos (sesion45:403): sin cuenta, CANGREJO DE MAR; con nodo, CORAL.
   Es tu presencia en el mundo, no tu identidad: no lleva nombre, ni huella del aparato, ni nada que
   salga de la pestana (GDPR art. 25, proteccion por defecto). Nace al abrir el juego, crece mientras
   juegas y muere al salir.

   UN PERSONAJE ES SU ONDA (escena.js). El cangrejo es una serie de Fourier [k, ax, ay, fase]: el
   caparazon es el armonico 1, el borde festoneado el 6 y las pinzas el 2; se rellena con el color de su
   clase (el sprite aditivo a 1/4 lo quemaba a blanco: medido en captura). Andar hacia el otro lado es el
   ESPEJO: la misma onda con la x negada, sin un byte nuevo (J10/J11).

   DATO, NO DECORACION (ideas6oct:1705):
   - TAMANO = tu army desplegada (cada tropa firmada lo agranda; tope medido para que quepa en la casa);
   - COLOR = cangrejo de mar (sin nodo) o coral (con nodo): una clase, no un adorno;
   - BRILLO = frescura del latido del nodo; sin nodo no hay latido y el brillo es NO_DATA (apagado).
   Los colores-senal del juego (sellos, vida) no se tocan: el cangrejo usa los suyos.

   PASEO DETERMINISTA. La posicion sale de (semilla, ciclo de juego) con el generador del canon: misma
   semilla, mismo paseo, en cualquier aparato. Lo unico que usa el reloj de la pantalla es el tramo
   ENTRE dos ciclos y el vaiven de las patas: proyeccion, no decision. NO toca el motor ni el combate:
   no conoce arena.js ni atlas-motor.js (un caso lo comprueba). Movimiento reducido: quieto.


## public/game/gdpr-art25-ephemeral-crab.js:30

El punto k del paseo: una fraccion del ancho, sacada del canon (RECHAZO: sin sesgo).


## public/game/gdpr-art25-ephemeral-crab.js:35

Donde esta en el ciclo c (entero) mas una fraccion f de ciclo (0..1, proyeccion).


## public/game/gdpr-art25-ephemeral-crab.js:42

La forma: tamano por army, clase por nodo, brillo por latido (null = NO_DATA).


## public/game/gdpr-art25-ephemeral-crab.js:48

EL CUERPO ES LA CASA (R2, plan «el refresco», 2026-10-11): los edificios de antes son PARTES del
     cuerpo. Caparazon = Nucleo, pinzas = Army, patas = Bosque, ojos = Faro. Cada parte va de 0 a 1 con su
     cifra MEDIDA: crece al jugar y BAJA si la cifra baja. Una cifra que falta es null (NO_DATA): esa parte
     se dibuja en niebla, nunca con un cero inventado. `m`: { nucleo, army, bosque, faro } (numero o null).


## public/game/gdpr-art25-ephemeral-crab.js:62

La onda del cangrejo: caparazon ancho (k=1) + festón (k=6, o 10 con «aguja») + pinzas (k=2, delante).
     Las pinzas crecen con la army; el festón sale del estilo elegido (solo aspecto). Sin cuerpo ni estilo,
     la onda de siempre.


## public/game/gdpr-art25-ephemeral-crab.js:70

Huella de un paseo: lo que el verificador de huellas compara entre aparatos (sha de las x redondeadas).


## public/game/gdpr-art25-ephemeral-crab.js:77

Dibujar (solo en la pestana). El contorno sale de SU onda (G.punto, el mismo trazo de la gacha),
     relleno con el color de su clase: legible a pleno sol, sin el brillo aditivo que lo quemaba a blanco.
     g: contexto; x, suelo: pixeles; r: radio base; o: { forma, t, dir, dpr, quieto, cuerpo, estilo }.
     Devuelve las ANCLAS de cada parte en pixeles del lienzo: ahi pone la casa sus botones.


## public/game/gdpr-art25-ephemeral-crab.js:93

solo la media onda de arriba, cerrada en la base: plegar la de abajo anulaba el relleno


## public/game/gdpr-art25-ephemeral-crab.js:99

patas: seis, que bajan al suelo y se alternan al andar; su largo es el Bosque


## public/game/gdpr-art25-ephemeral-crab.js:106

ojos en antenas, delante; su alto es el Faro (cuantos nodos medidos ves)


## public/game/gdpr-art25-ephemeral-crab.js:26

// ciclos que tarda en ir de un punto al siguiente


## public/game/gdpr-art25-ephemeral-crab.js:27

// fraccion del ancho por la que anda


## public/game/gdpr-art25-ephemeral-crab.js:90

// EL ESPEJO: la misma onda, x negada


## public/game/aiact-art50-crab-terminal.js:1

preceptoros.org · theGame · EL TERMINAL DEL CANGREJO (J7, plan de ronda firmado 2026-10-11).

   «Dar a los usuarios en sus terminales web las variables que pueden TOCAR en sus partidas,
   principalmente como cangrejos» (el Soberano). El cangrejo no programa: elige UNA accion del enum
   cerrado `atlas.accion/1` y el MOTOR decide. Este fichero no tiene ni una regla de juego.

   UNA SOLA PUERTA. Todo pasa por `AtlasJuego.aplica`, que traduce la accion a las MISMAS llamadas que
   los botones y devuelve el evento del motor (`atlas.evento/1`, con su `resultado`). Si el motor dice
   `fallo`, el terminal lo ensena tal cual: una accion ilegal la rechaza el motor, no un texto. El enum
   es el del piloto (`atlas-piloto.js`): una lista, no dos.

   TRANSPARENCIA (AI Act art. 50, por eso el nombre): cada linea dice en texto que se pidio y que respondio
   la maquina. Lo que se puede tocar (recursos, profundidad, grieta) sale de la instantanea, no de una copia.

   LO DE LA PARTIDA VA PLEGADO AQUI (R2, plan «el refresco»: la pestana Help desaparece). `monta` recibe la
   caja de la partida (guardar/exportar, la ayuda, el pie) y la mete dentro; el contador de farmeo y opinar
   firmado se crean aqui y su codigo baja AL PULSAR (`atlas-hud.js`, `atlas-opina.js`), fuera de la puerta.

   Nada sale de la pestana: ni red, ni almacen, ni reloj, ni azar.


## public/game/aiact-art50-crab-terminal.js:27

`extra` es la banda de `bajar_a` o la direccion de `mover` (la flecha del mapa, R2c).


## public/game/aiact-art50-crab-terminal.js:34

Una linea del terminal: lo pedido y lo que contesto el motor (o NO_DATA si no hay partida).


## public/game/aiact-art50-crab-terminal.js:41

Lo tocable ahora, en texto humano desde la misma instantanea.


## public/game/aiact-art50-crab-terminal.js:55

El contador de farmeo y opinar firmado, en la caja de la partida; su guion se pide al pulsar.


## public/game/aiact-art50-state-radio.js:1

preceptoros.org · theGame · LA RADIO DEL ESTADO (J2 + J9, plan de ronda firmado 2026-10-11).

   LA MELODIA ES EL ESTADO. Cinco notas sin semitonos (pentatonica mayor: 0, 2, 4, 7 y 9 semitonos
   sobre 220 Hz): cualquier combinacion suena bien, asi que el estado puede sonar tal cual es. Cada nota
   sale de una cifra de la instantanea (integridad, cobre, biomasa, luz, oxigeno, fase, nucleo, grieta):
   misma partida, misma melodia, y su huella lo prueba. Suena por la MISMA sintesis FM de core.js
   (`AtlasSintesis.suena` con una receta): ni un fichero de audio, ni una red.

   EL LOCUTOR (J9) ES UN PERSONAJE: lee un boletin hecho SOLO con la instantanea (lo que lee la guia,
   GUIA_CONTRATO.md), sin inventar: un dato que falta es NO_DATA. Narra; nunca decide ni propone. Habla
   solo con voces LOCALES del sistema (`localService`); si no hay ninguna, lo dice y el boletin queda en
   texto. Grave y despacio, como la radio de los anos 40, hecho con codigo.

   EL AUDIO NUNCA ES IMPRESCINDIBLE: el boletin se lee siempre en texto, y nada suena hasta el gesto de
   la persona (el interruptor de siempre). AI Act art. 50 en el nombre: transparencia, el estado dicho
   tal cual. Sin red, sin almacen, sin azar; el reloj solo separa las notas.


## public/game/aiact-art50-state-radio.js:26

Una nota discreta para feedback opt-in; usa la misma receta local que la Radio.


## public/game/aiact-art50-state-radio.js:56

El guion sonoro de una instantanea: ocho notas, cada una de una cifra. Puro.


## public/game/aiact-art50-state-radio.js:63

El boletin: solo lo que dice la instantanea. Lo que falta, NO_DATA. Puro.


## public/game/aiact-art50-state-radio.js:76

Tocar: el interruptor de siempre (S.activa) y una nota cada PASO_MS por la sintesis FM de core.js.


## public/game/aiact-art50-state-radio.js:86

El locutor: solo voces locales; sin ninguna, NO_DATA con su causa y el boletin queda en texto.


## public/game/aiact-art50-state-radio.js:95

SIMULADO (rectificacion firmada 2026-10-12): es la voz del NAVEGADOR, no los vectores de voz del rack (camino
       canonico, EN_CURSO). Jamas LIVE falso.


## public/game/gdpr-art7-entry-choice.js:1

preceptoros.org · theGame · LA ENTRADA: elegir zona o nodo, y ver sus reglas antes de jugar (J8).

   FIRMADO como base de diseno (joya de PLAN_THEGAME_ESTRUCTURA, 2026-10-11): todos juegan como
   cangrejos; al entrar se elige el MAR ABIERTO (una zona sin nodo) o un NODO, y al elegirlo se acatan
   sus reglas, que se VEN antes (texto, no solo color). «Sin aceptacion, un visitante puede proponer,
   pero no asentar» (ideas6oct:1357): elegir un nodo no te da nada de el; te dice que reglas rigen.

   LAS REGLAS SALEN DE LO MEDIDO, no se escriben a mano: el admin, los dispositivos y lo que cada nodo
   midio vienen de las cedulas (`AtlasNodosCedulas`). Sin admin, nadie puede aceptarte: se dice. Una
   cifra sin medir no entra como numero: NO_DATA (ley de nodos.js).

   SIN VENTAJA (sabotaje en atlas/test_atlas.py): la eleccion no toca el motor ni el combate; solo
   colorea la casa y dice donde estas. Se guarda en ESTE aparato por db.js (la unica puerta). Elegir es
   un gesto (GDPR art. 7: consentimiento explicito); cambiar de opinion, un boton.


## public/game/gdpr-art7-entry-choice.js:19

Las reglas de un territorio, en texto llano: lo que puedes hacer y lo que no. Pura.


## public/game/gdpr-art7-entry-choice.js:28

El sello en palabras llanas para quien llega (MEDIDO -> la cifra; EMULADO -> emulated; NO_DATA ->
       not measured): el mismo dato, sin jerga en la primera visita. Una cifra sin medir no es un numero.


## public/game/gdpr-art7-entry-choice.js:43

Monta la tarjeta de entrada (si no hay eleccion) o la ficha de donde estas, al principio del panel.
