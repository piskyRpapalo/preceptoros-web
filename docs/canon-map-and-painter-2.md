# Canon · Map and painter, part 2 (reef buildings, home, toon, NPC)

> Migrated from code by D1 subject 4 (campaign FIRMO, 2026-10-16). Canon with fichero:línea origin. The code keeps not a single comment.

Blocks migrated: 57 · canon bytes: 11961


## public/game/reef_buildings_layer.js:1

preceptoros.org · theGame · LOS EDIFICIOS DEL ARRECIFE, pintados en el mapa (los 9 objetos, FIRMO 2026-10-12).

   Capa aparte (como `mar-anclas.js`): `mar.js` esta a ~1 KB de su techo y solo la llama. El TIEMPO de cada
   edificio sale de `reef_building_lifecycle.js` (puro: manifiesto + tic); aqui solo se pinta y se avisa. Los textos
   viven en `atlas-arena-<lengua>.json` (la familia del mapa, a demanda).

   1 · LA BOYA DEL ESTADO: flota junto a tu casa y dice si tu mundo esta MEDIDO. Su «cuidado» es la ultima noticia
   LIVE de la Radio (el chat de abajo): sin noticias se despinta a 8 por mil cada ciclo y cae a NO_DATA justo despues
   de que el chat las marque STALE (120 ciclos). Un solo reloj. Color ∇C, tamano = vida medida (Escala Viva).
   Al cambiar de fase, PITIDO ADSR corto (J-SN-14, solo con el sonido encendido) y burbuja en el chat con su sello.

   2 · EL OBSERVATORIO: junto a tu casa. «Mirar» apunta al centro de la pantalla y CUESTA TICS: durante COSTE ciclos
   el observatorio mira y no se ve nada (fase «naciendo»). Luego despeja la niebla alli (los circulos de
   `fog_of_war.js`, los mismos que despeja lo medido) y LO VISTO ENVEJECE: el radio baja por tramos de vida
   (no en continuo: cada tramo vacia la cache de niebla una vez, no cada cuadro), STALE al gastarse, y al llegar
   a NO_DATA la niebla vuelve. Lo visto vive en esta pestana: se olvida al recargar (no se persiste sin firma).

   3 · EL ARRECIFE DE LAS LAPIDAS («lo desintegrado se recuerda», BIBLIA_THEGAME:57,60): todo edificio o mirada que cae
   a NO_DATA deja un RECIBO LEGIBLE: que era, cuando nacio y murio (en ciclos), por que, y la huella FNV-1a de su ultimo
   vector (una suma de comprobacion determinista, NO una firma). Se leen en su panel del cajon (el menu lo descubre
   solo) y se ven como piedras sobre tu casa. Como lo visto, viven en la pestana: persistirlas espera firma.

   El lab lee `vectores()` y `lapidas()`, no los pixeles. Sin red, sin azar, sin reloj de pared.


## public/game/reef_buildings_layer.js:31

FNV-1a de 32 bits sobre el texto: la misma entrada, la misma huella, en cualquier aparato.


## public/game/reef_buildings_layer.js:33

El recibo de lo que cayo: puro (manifiesto, tic de la caida, causa, ultimo vector vivo).


## public/game/reef_buildings_layer.js:41

PIEZA DE AMOR 4 (lote 3): la tropa DISUELTA en el Taller deja su lapida con el recibo `atlas.taller/1` que ya se
     firmo. La adopcion no guarda su ciclo de nacimiento (db.js no lo firma, a proposito): «born» es NO_DATA, no se inventa.


## public/game/reef_buildings_layer.js:51

El panel del cajon: lo crea una vez; el menu (terminal_menu_shell.js) lo descubre y le da su entrada.


## public/game/reef_buildings_layer.js:71

El manifiesto de la boya: anclado a tu casa (entero, determinista). Sin casa medida, no hay boya. Boya en (+100, -100) y
     observatorio en (-100, +100): en el rombo caen a la MISMA altura que la casa, a cada lado, lejos de las anclas
     (cuerpo y prisma, a +60 en pantalla). Medido en el Doogee: a (+70, -50) los rotulos se pisaban.


## public/game/reef_buildings_layer.js:79

El ultimo ciclo con una noticia LIVE (o que lo fue y ya es STALE) en la Radio. Sin ninguna: null (no se inventa).


## public/game/reef_buildings_layer.js:85

Una mirada del observatorio: nace al pulsar, madura en COSTE ciclos (lo que cuesta mirar) y se despinta.


## public/game/reef_buildings_layer.js:90

El radio de lo visto, por TRAMOS de vida: 0 mientras mira o si ya es NO_DATA; 160..280 en cuatro escalones.


## public/game/reef_buildings_layer.js:92

Los circulos que despeja lo visto en el tic t (puro: mismas vistas y tic, mismos circulos).


## public/game/reef_buildings_layer.js:115

Mirar: al centro de la pantalla, si no se esta mirando ya. Devuelve la vista o la causa por la que no.


## public/game/reef_buildings_layer.js:127

El boton, junto a las flechas del mapa; su rotulo dice cuantos ciclos le quedan a la mirada en curso.


## public/game/reef_buildings_layer.js:144

g: contexto; P(x, y) -> pixeles; o: { pub, sha, dpr, t, quieto, texto(k), cam }.


## public/game/reef_buildings_layer.js:153

paso 3: la logica corre ya; lo PINTADO va a la cola de profundidad


## public/game/reef_buildings_layer.js:167

El observatorio (una cupula) y lo que mira: la mirada en curso es una linea de trazos hasta el punto.


## public/game/reef_buildings_layer.js:190

A: los corales del rack (reef_corals.js)


## public/game/reef_buildings_layer.js:190

el cuarto: `latency_crystal.js`


## public/game/reef_buildings_layer.js:192

Las lapidas, como piedras sobre tu casa (una por recibo, hasta nueve a la vista).


## public/game/reef_buildings_paint.js:1

WEB · M1: siluetas heredadas del arrecife; solo dibujo, sin otro estado.


## public/game/reef_buildings_paint.js:19

gris fijo: las lapidas no tienen vector vivo


## public/game/reef_corals.js:1

preceptoros.org · theGame · LOS CORALES DEL RACK (A, FIRMO 2026-10-12: el mapa manda).

   «Hexelion, el primer coral» (BIBLIA_THEGAME:14): cada nodo de las cedulas del rack es un CORAL al pie de su onda.
   Decoracion con canon y que PINTA ESTADO MEDIDO, jamas adorno: su altura sale de cuantas medidas del nodo estan en
   MEDIDO (lo EMULADO no cuenta); sin ninguna, cuerpo hueco y translucido (NO_DATA, Escala Viva).
   El dibujo es el metodo firmado: 3D forzado con pares claro/oscuro (palo + circulo oscuro + circulo claro), sombra =
   silueta inferior plana, paleta unica y constante, cero raster, cero azar: la forma sale del nombre del nodo.
   Se encola en la cola de pintor (profundidad por Z-ordering). Sin red, sin azar, sin reloj.


## public/game/reef_corals.js:14

Puro: el coral de un nodo de las cedulas. medidas = cuantas en MEDIDO, de cuantas.


## public/game/reef_corals.js:22

FORMA INFANTIL (ronda 3): un manojo de burbujas redondas sobre un tallo corto. El numero de burbujas (2 a 4) y su
     altura salen del nombre del nodo: cada coral es distinto y siempre el mismo. Las burbujas van en bandas toon del
     hue del coral (AtlasBuildingsToon.disco). Con medidas, dos ojos; sin medidas (NO_DATA), contorno punteado y SIN cara:
     nada medido no sonrie. Sin rotulo dentro: el circulo-con-rotulo queda prohibido como pintado final.


## public/game/reef_corals.js:50

g, P como las demas capas; o: { dpr, pon }.


## public/game/reef_corals.js:56

sin punto en el mapa, sin coral


## public/game/reef_corals.js:61

El payload de Hexelion (hexelion_bench.js): sus cifras medidas con su fuente. Cero fetch.


## public/game/reef_corals.js:41

// cara solo con medidas: dos ojos


## public/game/reef_building_lifecycle.js:1

preceptoros.org · theGame · EL CICLO DE VIDA DE UN EDIFICIO DEL ARRECIFE (los 9 objetos, FIRMO 2026-10-12).

   «Los 9 objetos nacen con TIEMPO y COMBATE adheridos de nacimiento». Este modulo es la parte de TIEMPO, comun a los nueve:
   el estado de un edificio es una FUNCION PURA de (su manifiesto, el tic de la partida). Nada se guarda aparte, nada usa el
   reloj de pared: el mismo tic da el mismo edificio en cualquier aparato (replay-safe).

   - EDAD en tics desde `nace_tic`. FASE: naciendo (los primeros `madura_tics`) -> vivo -> gastado -> NO_DATA.
   - DESGASTE: lo desatendido se DESPINTA. Crece con los tics desde el ultimo cuidado (`cuidado_tic`), a `desgaste_por_tic`
     por mil; al llegar a mil, el edificio es NO_DATA con su causa («unattended N cycles»). Lo caducado (`caduca_tic`) tambien:
     «expired», nunca «0». La degradacion es el dato, no el bug. Las causas van en INGLES: el juego las ensena tal cual.
   - COLOR ∇C (la telemetria, no la decoracion): Hue = vida/recurso (vida alta: verde; baja: rojo), Saturation = carga de
     computo (lo que el edificio esta haciendo, por mil), Lightness = escudo (su defensa declarada, por mil). El lab lee el
     VECTOR (`vector()`), no los pixeles.
   - COMBATE adherido: el manifiesto DECLARA su defensa (`escudo`) y si admite emboscada; el combate ondulatorio lo lee de aqui.

   Manifiesto (`preceptoros.edificio/1`): { esquema, id, tipo, col, fila, huella, nace_tic, madura_tics, desgaste_por_tic,
   cuidado_tic?, caduca_tic?, carga?, escudo?, emboscable? }. Enteros. Sin red, sin azar, sin reloj.


## public/game/reef_building_lifecycle.js:24

La forma del manifiesto, o la causa por la que no vale (NO_DATA con causa, nunca un edificio a medias).


## public/game/reef_building_lifecycle.js:38

El estado en el tic t. Devuelve { fase, edad, desgaste (por mil), vida (por mil), causa? }.


## public/game/reef_building_lifecycle.js:51

∇C: el color ES la telemetria. Hue 0 (rojo) .. 130 (verde) por la vida; Saturation por la carga; Lightness por el escudo.
     Lo NO_DATA no tiene color: gris y translucido (se pinta como niebla, no como dato).


## public/game/reef_building_lifecycle.js:59

El VECTOR que lee el lab: compacto, entero, sin texto libre (salvo la causa de un NO_DATA).


## public/game/reef_building_lifecycle.js:66

Cuidar (una accion del jugador, que se firma fuera): devuelve un manifiesto NUEVO con el cuidado en el tic t. Puro.


## public/game/home_buildings.js:1

preceptoros.org · theGame · TU CASA ES TU CANGREJO, y su estado vive en la TERMINAL (U1, «el mapa unico»).

   Desde U1 la pantalla es el MAPA GLOBAL y HOME deja de ser un lugar: la escena lateral de la casa (2026-10-05) y
   las partes flotando sobre el cuerpo se RETIRAN. Aqui se monta el pliego «Estado» de la terminal: la fila de
   identidad (tu nombre y tu bandera, y «Customize»), el RIEL de las partes (`casa-lateral.js`), la tira de estado
   del juego y, dentro de las patas, la expedicion del Bosque (MUDADA con sus referencias vivas: no se rehace la
   logica, se le da sitio). Las partes y su cifra: `casa-medidas.js` (la lista UNA).

   PERSONALIZAR (estilo del caparazon, variante del emblema, POSTURA de la casa, BANDERA y lema) se guarda en ESTE
   aparato (IndexedDB `atlas-casa`) y, si se comparte, viaja FIRMADO. Sin datos personales: el lema rechaza lo que
   parezca correo, URL, ruta, IP o telefono. Y NO DA VENTAJA: nada de esto entra en `arena.combate`.


## public/game/home_buildings.js:16

U1: la PALETA del agua de la escena lateral se retira con ella (seria un boton muerto).


## public/game/home_buildings.js:20

P10: la bandera, de la paleta cerrada de `valores.banderas` (null = sin bandera).


## public/game/home_buildings.js:24

Una casa guardada antes de P10 no tiene bandera: entra con null (sin bandera); la de antes de U1 suelta su
     paleta (ya no hay agua que pintar). No se pierde.


## public/game/home_buildings.js:30

La forma de una casa: '' si vale, o la causa. Pura: la usan la web y los casos de node.


## public/game/home_buildings.js:43

Las partes y sus puertas: UNA lista, en `casa-medidas.js` (U0).


## public/game/home_buildings.js:50

--- guardar en este aparato ------------------------------------------------------------------


## public/game/home_buildings.js:72

EL CANGREJO (J1): tu semilla (tu clave publica; sin ella, la del visitante), el ciclo de juego,
     tu army y si un nodo te tiene LINKEADO en su cedula (coral) o no (cangrejo de mar). El latido del
     nodo no llega a la web: el brillo es NO_DATA (null), nunca un numero inventado.


## public/game/home_buildings.js:84

La cifra de cada parte: se recoge aqui (la pestana) y se calcula en `casa-medidas.js` (puro).


## public/game/home_buildings.js:91

--- dentro de una parte -----------------------------------------------------------------------


## public/game/home_buildings.js:107

--- personalizar ------------------------------------------------------------------------------


## public/game/home_buildings.js:108

«Customize» vive en `casa-personaliza.js` (U0): aqui solo se le pasa la casa y como guardarla.


## public/game/home_buildings.js:113

--- montar ------------------------------------------------------------------------------------


## public/game/home_buildings.js:123

La fila de identidad: tu nombre (el pseudonimo de tu clave, o visitante) y el color de TU bandera.


## public/game/home_buildings.js:162

Cambiar UNA opcion desde fuera (la formacion, desde la repeticion de la batalla).


## public/game/home_buildings.js:164

Los textos de la familia de la casa (`atlas-casa-<l>.json`): tambien los del Taller y del Primer Eco, que
     viajan con ella para no engordar la puerta del juego (P9-P11). '' si aun no han llegado.


## public/game/buildings_toon.js:1

preceptoros.org · theGame · LOS EDIFICIOS EN TOON (RONDA 2 · chunk 3, FIRMO 13-oct): el mismo lenguaje del cangrejo.

   Cel cuantizado: tres BANDAS duras del MISMO hue (AtlasToon.bandas): sombra (disco entero), base (desplazado hacia
   la luz) y brillo (una mancha pequena hacia la luz), con contorno. La luz es la del cangrejo (AtlasToon.LUZ), la
   misma para todo. El hue llega del vector del propio edificio (su ∇C, o la escala de niveles del Cristal): NADA
   inventado. Sin AtlasToon cargado, un relleno plano de siempre. Sin red, sin azar, sin reloj.


## public/game/buildings_toon.js:9

g: contexto; x, y, r en pixeles; c: { h, s, l } del vector; dpr; a: alfa del cuerpo (1 = presente).


## public/game/buildings_toon.js:23

FORMAS INFANTILES (ronda 3): cada edificio tiene su silueta. El relleno son las mismas tres bandas del hue del
     vector (sombra, base desplazada a la luz, brillo) recortadas a la silueta, y el contorno es la misma silueta.


## public/game/buildings_toon.js:32

g, x, y, r en pixeles; kind: boya | observatorio | cristal | lapidas; c: { h, s, l }; a: alfa.


## public/game/buildings_toon.js:44

detalles de la silueta: lo que la hace reconocible


## public/game/npc_territory_map.js:1

Q6 · NPC occupation projection on the existing world map.


## public/game/npc_walls.js:1

Q6 · Signed local NPC occupation controls for the honest place inspector.


## public/game/npc_occupancy.js:1

Q6 · NPC occupancy: signed local owner, one wall message, upkeep and fog by game cycle.
