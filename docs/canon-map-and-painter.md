# Canon · Map and painter (isometric law, sea, zoom, fog, camera)

> Migrated from code by D1 subject 3 (campaign FIRMO, 2026-10-16). Canon lives here with fichero:línea origin. Working memory did not migrate. The code keeps not a single comment.

Blocks migrated: 80 · canon bytes: 18625


## public/game/isometric_floor_projection.js:1

preceptoros.org · theGame · LA LEY DEL SUELO: proyeccion isometrica 2:1 (firmada por el Soberano, 2026-10-12).

   EL ROMBO ES LA LEY. Cada celda del mundo es un diamante 2:1 (ancho W, alto H = W/2):
     (col, fila) -> pantalla  x = (col - fila) * W/2 ,  y = (col + fila) * H/2
   y TODO objeto se ancla al CENTRO de su rombo, nunca a una esquina.

   LA PROFUNDIDAD SE PINTA SOLAPANDO. Orden de pintor por (col + fila): un solo eje de profundidad; lo de delante
   (suma mayor) se pinta despues y tapa lo de atras. Empate: por `col` (estable), y si sigue, por `capa` (suelo antes
   que lo que esta encima). Prohibido fingir profundidad con parallax o sombras: aqui no hay ni una.

   EL TAMANO HABLA (Escala Viva): una unidad grande ocupa mas rombos (`huella`), y se ancla al centro de su huella.

   Puro, sin DOM, sin reloj, sin azar: lo mismo en la pestana, en node y en el lab. El lab lee el VECTOR (col, fila,
   huella), no los pixeles. Es el Canvas 2D de siempre con otra proyeccion: sin assets, sin motor 3D.


## public/game/isometric_floor_projection.js:18

Centro del rombo (col, fila) en coordenadas de mundo-pantalla (sin camara).


## public/game/isometric_floor_projection.js:23

La inversa: de un punto de pantalla al rombo (fraccionario) que lo contiene. Para saber que celda toca el dedo.


## public/game/isometric_floor_projection.js:28

La celda entera que contiene el punto (redondeo al rombo mas cercano por su centro).


## public/game/isometric_floor_projection.js:33

Los cuatro vertices del rombo (arriba, derecha, abajo, izquierda) alrededor de su centro.


## public/game/isometric_floor_projection.js:38

Ancla de un objeto con huella n x n que empieza en (col, fila): el centro de toda su huella.


## public/game/isometric_floor_projection.js:43

El orden de pintor: devuelve una COPIA ordenada de atras a delante. Cada objeto: { col, fila, huella?, capa? }.
     La profundidad de un objeto grande es la de su rombo mas adelantado (col+fila+2*(n-1)).


## public/game/sea.js:1

preceptoros.org · theGame · el MAPA GLOBAL: un mundo que se arrastra hasta chocar con la niebla.

   «El mapa principal debe ser LA CASA del usuario. El mapa global tiene que ser MOVIBLE: que el user
   pueda moverse hasta chocarse con la niebla» (Soberano, 2026-10-05).
   - Al abrir, la camara se centra en TU CASA (su sitio sale de tu clave publica). Sin clave, en
     Hexelion, y se dice por que.
   - Se mueve con el dedo, el raton, las flechas y botones grandes (accion `mover`, R2c); inercia en
     `world_camera.js`; con movimiento reducido, salta.
   - LA NIEBLA ES EL LIMITE (`fog_of_war.js`): lo despejado sale de lo MEDIDO y de lo ya jugado; la
     camara no entra en lo demas: rebota y lo dice en texto.
   - El terreno: teselas de ruido entero con tramado Atkinson (`sea-floor.js`). Cero imagenes ni red.
   EL ORIGEN SE VE: Hexelion MEDIDO, nitido; un nodo sin medidas, en niebla y con su anillo NO_DATA.
   PINTA; NO DECIDE: lugares, seleccion y textos los da `ui-arena.js`; el mando es la lista de botones.


## public/game/sea.js:19

Las teselas (terreno y niebla) las pinta `sea-floor.js`: una sola fuente para el mapa y la portada.


## public/game/sea.js:21

LAS FLECHAS SON ACCIONES DEL PILOTO (R2c): `mover <dir>` del enum `atlas.accion/1`, una lista, no dos.
     Aqui solo su vector y su icono; la lista de direcciones es la del piloto (`AtlasPiloto.DIRS`).


## public/game/sea.js:25

La flecha de la persona entra por la MISMA puerta que la de la IA: `AtlasJuego.aplica`.


## public/game/sea.js:30

Lo que ejecuta `aplica` para `mover`: un salto de la camara del mapa vivo; si choca, `fallo`.


## public/game/sea.js:37

npc_chunk es de clase CALIDAD (valores.semantica): solo cuando la calidad elegida baja de Maxima.


## public/game/sea.js:43

`f`: { lugares(), sel(), emblema(), pub(), nombre(l), texto(k), colores(), elige(l), luchados() }.


## public/game/sea.js:49

--- los mandos: flechas grandes, volver a casa y el aviso ------------------------------------


## public/game/sea.js:59

zoom del mapa (pellizco y rueda): map_zoom.js


## public/game/sea.js:71

F357: planea


## public/game/sea.js:78

Un salto por accion `mover`: devuelve true si choco con la niebla.


## public/game/sea.js:82

En rombo, la flecha es de PANTALLA (derecha se ve a la derecha): se pasa a mundo con la inversa.


## public/game/sea.js:88

--- dibujo ------------------------------------------------------------------------------------


## public/game/sea.js:111

U1: el mapa ES la pantalla (lienzo fijo); se PAUSA bajo una hoja (`con-hoja`) o con la pestana oculta.


## public/game/sea.js:118

La clave llega despues (promesa): si aun no te has movido, la camara va a tu casa en cuanto se sabe.


## public/game/sea.js:142

LEY DEL SUELO, paso 3: ORDEN DE PINTOR. Lugares, nodos, cangrejos, anclas y edificios se ENCOLAN con su sitio y se
         pintan de atras a delante por profundidad (col + fila, `IsometricFloor.ordena`): lo de delante tapa lo de detras.


## public/game/sea.js:154

MOVIMIENTO 8 - M17: Sprites chunky para NPCs


## public/game/sea.js:157

1/4 de escala y ampliado x4 sin suavizar: el pixel gordo que declara 75c7ad0 (pintaba x4).


## public/game/sea.js:167

Conquistado: ganado en ESTE aparato (FIRMO 2026-10-10).


## public/game/sea.js:176

U2: tu cangrejo (y el de los jugadores llegados, en lo despejado), donde flotaba el emblema suelto.


## public/game/sea.js:179

R7 · las anclas (`sea-anchors.js`); P10: tu prisma, del color de TU bandera.


## public/game/sea.js:185

0d


## public/game/sea.js:187

MOVIMIENTO 7 - M17: Vignette barato - gradiente radial cacheado


## public/game/sea.js:195

Lo que esta en la niebla tambien se DECLARA: su anillo vacio y su rotulo, por encima.


## public/game/sea.js:201

La postura de tu casa (home_buildings.js) se VE en el mapa: lema y alianzas cerradas. Solo aspecto.


## public/game/sea.js:206

--- el dedo: `map_pointer_input.js` (salio de aqui al migrar a la LEY DEL SUELO, 2026-10-12) ------------------


## public/game/map_zoom.js:1

preceptoros.org · theGame · EL ZOOM DEL MAPA (comunicado 13-oct, punto 1; sale de `sea.js` para caber en su techo).

   Pellizco con dos dedos (tactil) y rueda sin Ctrl (puntero). Ctrl+rueda NO se toma: el navegador hace su zoom de
   pagina (PC). El factor va de 0,6 a 3 (1 = el zoom de siempre). Cada cambio se anota en `data-zoom` del lienzo, que
   es lo que leen el lab y el medidor. Sin red, sin azar, sin reloj: el gesto solo fija un numero.


## public/game/sea-floor.js:1

preceptoros.org · theGame · EL PINTOR DEL MAR: las teselas del lecho y de la niebla (J6, sacado de `sea.js`).

   Desde U1 («el mapa unico», 2026-10-11) el fondo de la portada ES el mapa global, interactivo y siempre detras:
   el lienzo de fondo propio de J6 (`monta`, `portada`) se RETIRA y queda lo que lo hacia posible, el pintor UNICO
   de teselas que pide el mapa (T0-D: sin gemelos). La deriva es UN desplazamiento global por cuadro (las teselas
   no cambian, el mar si: la respiracion que M4 horneaba mal). Ruido entero (escena.js), niebla de lo MEDIDO
   (fog_of_war.js); el reloj de pantalla solo mueve la deriva.


## public/game/sea-floor.js:11

One warm reef palette, shared with the coral painter: shaded teal through living mint, with a
     small amber sunlit edge. The bed is scenery, never a signal or a measurement.


## public/game/sea-floor.js:17

La deriva del mar en el instante t (ms de pantalla): dos senos lentos, en unidades de mundo.


## public/game/sea-floor.js:20

Soft, rounded reef beds replace the old evenly noisy floor. Each pebble is positioned and
     sized from its world cell, so adjacent cached tiles agree and the same map always repeats.


## public/game/sea-floor.js:29

Direct palette sampling keeps rounded forms readable; Atkinson error diffusion made the
     projected floor sparkle as a checkerboard. The fixed raster is still deterministic.


## public/game/sea-floor.js:44

Un pintor de teselas con sus caches acotadas (TOPE teselas de cada clase). MEDIDO en el Doogee (2026-10-13): con el
     rombo, la caja del mundo visible tiene 12x11 = 132 teselas; con un tope de 90 que se VACIABA entero, la cache se
     rehacia cada cuadro (2.277 texturas en 3 s, el mapa a 2,7 fps). Ahora: se descartan las teselas cuyo rombo no toca la
     pantalla y la cache suelta la MAS VIEJA, una a una, con sitio de sobra para lo visible.


## public/game/sea-floor.js:75

Pega las teselas visibles; (dx, dy) desplaza el terreno en unidades de mundo (la deriva). LEY DEL SUELO (2026-10-12):
       cada tesela cuadrada se dibuja como ROMBO con la matriz de la camara (`AtlasCamara.matriz`, la misma proyeccion
       que todo lo demas): mismas teselas, misma cache, misma respiracion; un pelo de solape para que no se vean costuras.


## public/game/sea-floor.js:84

El rombo de la tesela va de p hacia abajo: x en [p0 - lado, p0 + lado], y en [p1, p1 + 2 alto]. Fuera, ni se pide.


## public/game/sea-floor.js:93

Lo despejado manda en la niebla: si cambia su huella, la cache de niebla se vacia.


## public/game/sea-anchors.js:1

preceptoros.org · theGame · LAS ANCLAS DEL MAPA, dibujadas (R7; salen de `sea.js` en P10 porque `sea.js`
   estaba a 3 B de su techo: una pieza que crece se parte ANTES de crecer).

   Solo vocabulario visual: lo que anclan se construye con su propio FIRMO. El tubo de cada nodo al rack es
   una linea DOBLE teal; las anclas futuras, un rombo hueco en trazos (PROPUESTA, ideas6oct:1748:
   discontinuidad = lo que aun no es) con su nombre corto. EXCEPCION, desde P10: el PRISMA DE BANDERA ya
   existe; si la persona eligio bandera, su rombo va LLENO del color de SU bandera (lo eligio ella: nada
   decide color por otro) y se rotula como bandera. Puro de red: los datos salen de `fog_of_war.anclas`.


## public/game/sea-anchors.js:11

g: contexto; P(x, y) -> pixeles; o: { pub, sha, nodos, dpr, bandera (tono hsl o null), texto(k) }.


## public/game/sea-crabs.js:1

preceptoros.org · theGame · LOS CANGREJOS EN EL MAPA (U2, «el mapa unico», contrato FIRMADO 2026-10-11).

   Tu cangrejo deja la escena lateral (retirada en U1) y vive EN el mapa, junto a tu casa: el emblema suelto que
   flotaba encima se retira, porque el cuerpo ya dice quien eres. MISMA FUNCION, MISMOS DATOS:
   - el paseo es `AtlasCangrejo.paseo()` (J1, intocable) proyectado a una linea bajo la casa:
     x = casa.x + (paseo.x - 0.5) * 2 * R, con R = 140 unidades del mundo;
   - el cuerpo, la talla, la clase y el estilo salen de `AtlasCasa.cangrejo()` (la fuente UNA);
   - movimiento reducido: quieto en su punto del ciclo.

   EL ESTADO ES LA SENAL (projectM, adherido por el Soberano el 2026-10-11: «aqui el PCM es el estado»). El
   cangrejo VIBRA al compas de su radio: la nota que suena en `AtlasRadio.guion(instantanea)` marca la frecuencia
   del temblor. Sin guion (NO_DATA), no hay musica y no hay baile: quieto. Es proyeccion de pantalla; no decide.

   LOS OTROS, CON LO QUE SE SABE DE ELLOS. Los jugadores que han llegado por sobre firmado se pintan con la misma
   funcion y SU semilla, en su casa, solo dentro de la niebla despejada. Su ciclo y su cuerpo no se miden aqui: van
   QUIETOS (ciclo 0) y con todas las partes en niebla (sin cifra), nunca con un cuerpo inventado.

   SIN CLAVE TAMBIEN SE ES CANGREJO (el contrato: «siempre visible»). El visitante no tiene casa: anda por el MAR
   ABIERTO, bajo el Faro (Hexelion), donde ya se centra la camara; no se rotula como casa, porque no lo es.

   Sombra plana bajo cada uno (una elipse, sin desenfoque). Sin red, sin azar, sin reloj con autoridad.


## public/game/sea-crabs.js:26

Donde va un cangrejo en el mundo, de su casa y de su paseo (fraccion 0..1). Pura.


## public/game/sea-crabs.js:28

El temblor (-1..1) en el instante ms: la nota que suena (una cada PASO_MS, como la radio) fija la frecuencia.
     Sin guion, 0: lo que no suena no mueve. Pura.


## public/game/sea-crabs.js:39

--- en la pestana -------------------------------------------------------------------------------------


## public/game/sea-crabs.js:48

B: el manejo libre, ENCIMA del paseo J1


## public/game/sea-crabs.js:52

R1 (FIRMO 2026-10-12): el cangrejo en CEL SHADING (crab_render_hd.js), con la misma firma; sin el, el trazo de siempre.


## public/game/sea-crabs.js:58

o: { pub, sha, t, dpr, quieto, circ, otros: [{ de, n }] }. Devuelve el punto de pantalla de TU cangrejo.


## public/game/sea-crabs.js:62

paso 3: con cola, cada cangrejo se pinta a su profundidad


## public/game/map_nodes_layer.js:1

preceptoros.org · theGame · LOS NODOS DEL RACK EN EL MAPA (chunk 1: split de sea.js, FIRMO 2026-10-13).

   Sale de `sea.js` para que el mapa tenga margen (su techo es 16 KiB). Mismo comportamiento: `casas()` da las casas
   de las cedulas que tienen punto en el mapa (hoy solo Hexelion, FIRMO 2026-10-12), y `pinta()` dibuja cada una con
   su emblema y su estado de medida (MEDIDO en dorado; el resto, en niebla y desafinado). Sin red, sin azar, sin reloj.
   `sea.js` la llama con su cola de pintor (`pon`), asi que el orden de profundidad no cambia.


## public/game/map_nodes_layer.js:10

Las casas de las cedulas, con el estado de cada medida tal cual.


## public/game/map_nodes_layer.js:21

o: { H0 (las casas), col (colores del mapa), t (tiempo), dpr, pon (cola de pintor de sea.js) }.


## public/game/map_pointer_input.js:1

preceptoros.org · theGame · EL DEDO EN EL MAPA: arrastrar, tocar un lugar y las teclas (sacado de `sea.js`, 2026-10-12).

   Se separa ANTES de migrar el mapa a la LEY DEL SUELO (isometrico 2:1): `sea.js` estaba a 198 B de su techo, y el
   dedo es justo lo que cambia con el rombo. Arrastrar convierte el movimiento de PANTALLA en movimiento de MUNDO con
   la inversa de la proyeccion (`AtlasCamara.aMundoDelta`); tocar elige el lugar mas cercano EN PANTALLA (lo que ve
   el dedo). Nada teletransporta: arrastrar mueve la camara con su inercia, y soltar deja que planee.

   `monta(ctx)`: ctx = { c (lienzo), C (AtlasCamara), dpr, z() (pixeles por unidad), cam(), circ(), quieto(), choca(),
   marca() (el mapa ya se movio), lugares(), sitio(l), elige(l), flecha(d) }. Sin red, sin azar, sin reloj.


## public/game/map_pointer_input.js:43

B: tocar MAR VACIO (ni lugar ni pieza) manda a tu cangrejo alli: pantalla -> mundo con la inversa del rombo.


## public/game/fog_of_war.js:1

preceptoros.org · theGame · LA NIEBLA DE GUERRA: lo que se ve es lo MEDIDO.

   El Soberano (2026-10-05): «el mapa global tiene que ser MOVIBLE: que el user pueda moverse hasta
   chocarse con la niebla». La niebla NO sale del azar: sale de lo que hay medido o aceptado.
   - Hexelion (o cualquier nodo de la casa con medidas MEDIDO) despeja un circulo que crece con
     cuantas medidas tiene. EN EL MAPA SOLO QUEDA HEXELION (FIRMO del Soberano, 2026-10-12): el punto del Doogee se
     eliminó; un nodo sin punto en el mapa no despeja, no ancla y no se pinta (sus cedulas siguen fuera del mapa).
   - Tu casa despeja su circulo, donde la pone tu clave publica (misma cuenta, mismo sitio).
   - Cada lugar donde ya luchaste, y cada persona cuya defensa firmada aceptaste, despeja el suyo.
   Mismas entradas, misma niebla. Puro: sin DOM, sin red, sin reloj. En node, `module.exports`.


## public/game/fog_of_war.js:14

La geometria del mundo, en unidades de mundo. Hexelion en el origen.


## public/game/fog_of_war.js:19

Donde esta cada cosa. `sha` es la sha256 hex de `canon.js` (se pasa para que esto siga puro).


## public/game/fog_of_war.js:34

solo Hexelion tiene punto en el mapa


## public/game/fog_of_war.js:36

Los circulos despejados. `e`: { pub, sha, nodos (cedulas.nodos), lugares, luchados {clave: true},
     personas [lugar] }. Devuelve [{x, y, r, que}] en orden estable.


## public/game/fog_of_war.js:52

Cuanta niebla hay en un punto: 0 despejado, 1 niebla cerrada, con un borde suave de 90.


## public/game/fog_of_war.js:63

LAS ANCLAS DE LO QUE VIENE (R7, plan «el refresco»): SOLO vocabulario y sitio, nada se construye aqui.
     Cada nodo de las cedulas lleva su TUBO AL RACK (enlace-rack, hacia Hexelion, que es el rack); tu casa
     ancla las PARTES DEL CUERPO (la pipeline de edificios -> mapa) y el PRISMA DE BANDERA (P10, propuesta);
     la boya de Hexelion ancla los ECOS DE SUPERFICIE (EV_SURFACE_ECHO, «6 planes.txt»:175-207; esta ronda
     NO envia). FIRMADO por el Soberano (2026-10-11): cuando se construya sera telemetria DECLARADA, jamas
     camuflada; el corpus («camuflado como telemetria») queda corregido aqui: gana la doctrina. Puras: { id, clase, x, y, a } con `a` = hacia donde.


## public/game/world_camera.js:1

preceptoros.org · theGame · LA CAMARA del mapa global: se arrastra, tiene inercia y CHOCA con la niebla.

   La camara es un punto del mundo (su centro) y una velocidad. Moverla es sumar; soltarla deja que la
   inercia la lleve y la frene. Su centro solo puede estar en lo DESPEJADO (`fog_of_war.js`): si un
   paso la saca, vuelve al borde mas cercano, su velocidad rebota hacia dentro y se avisa del choque.
   Con movimiento reducido no hay inercia: saltos. Puro y determinista: mismo estado y mismos pasos,
   misma vista (`atlas/camara_casos.mjs`). Sin DOM, sin reloj; el `dt` lo pone quien llama.


## public/game/world_camera.js:10

LA LEY DEL SUELO (firmada 2026-10-12): la camara proyecta en ROMBO 2:1 con la MISMA formula que el suelo
     (`isometric_floor_projection.js`, sin gemelos). Una unidad de mundo es una «celda» de ancho sqrt(2)*z pixeles:
     asi la escala en pantalla no cambia de golpe al pasar del cuadrado al rombo.


## public/game/world_camera.js:19

El punto despejado mas cercano a (x, y): dentro de algun circulo (menos el margen).


## public/game/world_camera.js:38

Arrastre: el dedo mueve la camara en sentido contrario (se arrastra el mundo).


## public/game/world_camera.js:44

Un salto (flechas o botones): con inercia, empuja; sin ella, se mueve de golpe.


## public/game/world_camera.js:50

PLANEA hasta un punto (F357, firmado: «NADA teletransporta, la camara GLIDE»). Con la MISMA fisica del arrastre:
     con frenado geometrico, un empujon de d recorre exactamente d y se para (medido: 999,91 de 1000 en 88 pasos de
     16 ms). Con movimiento reducido, inmediato: la excepcion de accesibilidad (WCAG 2.3.3), declarada.


## public/game/world_camera.js:54

Un paso de tiempo: la inercia lleva y frena. `k` = dt / 16.


## public/game/world_camera.js:61

Lo que se ve: el rectangulo de mundo para un lienzo de W x H con `z` pixeles por unidad.


## public/game/world_camera.js:62

Del mundo a la pantalla y vuelta, en rombo. `aMundoDelta`: un movimiento de PANTALLA (el dedo, una flecha) en mundo.


## public/game/world_camera.js:66

Lo que se ve: la caja de MUNDO que contiene las cuatro esquinas del lienzo (en rombo, la vista es un rombo).


## public/game/world_camera.js:72

La matriz del rombo (pixeles por unidad de mundo): para dibujar una tesela cuadrada como rombo con setTransform.


## public/game/onda_profunda.js:1

preceptoros.org · theGame · PIEZA (b) FIRMADA (PR #106, Ola 0) · PROFUNDIDAD DE ONDAS
   SOBRE LA LEY DEL SUELO. ideas13oct:306: «"3D" SIMULADO sobre la ley del suelo
   isométrica». Nada de parallax, nada de sombras (prohibido,
   isometric_floor_projection.js:8-9): la profundidad legítima es el EJE que ya
   existe — orden de pintor estricto por (col+fila) — más ESCALA VIVA (la
   huella manda; F304: «el tamaño habla»).
   QUÉ HACE. Expone `AtlasOndaProfunda.planifica(lugares, sitio)`: para cada
   lugar del mapa devuelve su ANCLA (centro de su huella, IsometricFloor.ancla)
   y su PROFUNDIDAD (IsometricFloor.profundidad), para que el mar encole las
   ondas de combate como encola lugares y cangrejos: de atrás hacia delante.
   La onda delante tapa a la de atrás porque el ORDEN lo dice, no porque un
   truco lo finja. La proyección JAMÁS toca la decisión (gate maestro F305).
   ESCALA VIVA: el radio de la onda se modula por su profundidad relativa al
   plano (diferencia contra el centro visible), una función pura del orden:
   misma semilla e input = misma onda en calidad 0 y 2.
   Puro, sin DOM propio, sin assets, sin red, sin reloj: solo reutiliza la
   ley firmada el 2026-10-12.


## public/game/onda_profunda.js:23

El plan de una onda: ancla del rombo (o del centro de su huella), profundidad
     del pintor y el radio con escala viva. Todo función pura del lugar.


## public/game/onda_profunda.js:30

ESCALA VIVA sin perspectiva: el radio crece LINEALMENTE con la profundidad
       relativa al plano (0 en el centro visible), clamp para no romper la retícula.
       Es una función del eje (col+fila), no de un punto de fuga: cero faked 3D.


## public/game/onda_profunda.js:39

Encola una onda en la cola del pintor del mar, con su ficha. Igual que `pon`
     de sea.js pero con la profundidad de la ley (huella incluida).
