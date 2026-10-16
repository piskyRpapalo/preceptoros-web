# Canon · Arena and duels (arena, duelo, juez, escuadron, battle, rating)

> Migrated from code by D1 subject 6 (campaign FIRMO, 2026-10-16). Canon with fichero:línea origin. The code keeps not a single comment.

Blocks migrated: 46 · canon bytes: 13555


## public/game/arena.js:1

preceptoros.org · theGame · multijugador · la ARENA: duelos fantasma, patrullas y rating entero.

   MODELO FANTASMA (PLAN §3): se ataca una DEFENSA FIRMADA (tu Army de cara a los demas), no a la
   persona conectada. Asi se juega entre husos horarios y con la bateria baja.
   1. El defensor publica `defensa` en su tablon: `{tc, semilla}` de cada tropa, el `pack_sha` de
      los valores con los que juega y lo que declara `en_juego`.
   2. En una sesion de duelo (`modo: 'duelo'`, los dos pares) el atacante manda su `asalto`, que
      nombra la huella de esa defensa; los dos se comprometen y revelan (`sobres.js`).
   3. `resuelve` saca la semilla del commit-reveal y juega `combate`: rondas ENTERAS, sin decimales
      ni reloj. Cualquiera lo vuelve a jugar y sale igual: el resultado no se cree, se comprueba.

   LAS CIFRAS DE UNA TROPA NO VIAJAN: se REDERIVAN con `gacha.tirada(semilla, tc)` y los valores del
   mismo `pack_sha`. Nadie se fabrica una tropa con sus numeros. Limite dicho: la semilla sale de
   una firma y Ed25519 no es un VRF; para clasificar entre personas hace falta firma (auditoria §2.8).

   `en_juego` SE DECLARA Y VIAJA, NO SE APLICA: la perdida definitiva y el saqueo esperan firma
   (PLAN §11, pregunta 3). El RATING (Elo entero y LOCAL) vive en `rating.js`.

   PURO: ni DOM, ni red, ni reloj, ni `Math.random`. A demanda, con el Army (valores + gacha).


## public/game/arena.js:40

La huella de la parte ENTERA de los valores: lo que decide una tirada y un combate. Dos
     personas con distinto `pack_sha` no juegan el mismo juego y el duelo no se resuelve.


## public/game/arena.js:50

--- formas de los cuerpos ------------------------------------------------------------------


## public/game/arena.js:84

--- el combate -----------------------------------------------------------------------------


## public/game/arena.js:88

P9: lo LIJADO cuenta aqui (practica contra NPC). Un duelo no puede traer `lija`: formaTropas solo
         acepta {tc, semilla} hasta que la cadena del Taller viaje en el sobre.


## public/game/arena.js:101

`registro`: [ronda, lado (0 defensa, 1 asalto), atacante, objetivo, dano | -1 si esquiva].


## public/game/arena.js:109

Iniciativa: la velocidad manda; un empate lo deshace un sorteo por ronda.


## public/game/arena.js:128

--- el duelo, de los sobres al resultado ----------------------------------------------------


## public/game/arena.js:153

ABANDONO: quien reclama se comprometio Y revelo; el otro se comprometio y NO revelo. El plazo
     (`combate.abandono_ciclos`) se mide en los ciclos de juego de quien espera: no hay reloj comun y
     eso se dice. La reclamacion es verificable en su forma (un compromiso sin revelacion esta a la
     vista de cualquiera); el plazo, no: es un contrato social con pruebas, no una imposicion.


## public/game/arena.js:175

Un resultado que llega de otro aparato no se cree: se vuelve a jugar y tiene que salir igual.


## public/game/arena.js:185

--- patrulla (PvE): una defensa que sale de la semilla del sector, jugable sin red ------------


## public/game/arena.js:193

Los LUGARES NPC de la Arena (`valores.patrullas`): cada uno con su semilla y su patrulla, iguales en
     todos los aparatos.


## public/game/duelo.js:1

preceptoros.org · theGame · multijugador · el DUELO entre personas, por PAQUETES firmados.

   SIN SERVIDOR (PLAN §2-§3): dos aparatos se pasan paquetes `atlas.paquete_mp/1` por el canal que la
   persona elija (Send, Copy, fichero). Cada paquete lleva sobres ya firmados (`sobres.js`) y la
   politica de su sesion. El duelo fantasma en tres idas y vueltas:
   1. DEFENSA   · B publica su defensa en su tablon (tropas `{tc, semilla}` + lo que declara en juego).
   2. DESAFIO   · A la importa, elige escuadra y manda asalto + su COMPROMISO (su `r` no sale).
   3. RESPUESTA · B acepta: se compromete y REVELA a la vez (A ya no puede cambiar su `r`).
   4. REVELACION· A revela y los dos vuelven a jugar el MISMO combate con la semilla de los dos `r`.
   Si A no revela en `combate.abandono_ciclos` ciclos de juego de B, B reclama el ABANDONO (firmado
   por el Soberano, 2026-09-28): queda como resultado y como deuda a la vista.

   IMPORTAR NO ES CREER: cada sobre se VERIFICA (firma Ed25519) y se anota en el libro de su sesion
   (`seq`, `prev`, fork, replica). Un desafio a una defensa que no es la tuya se rechaza. El resultado
   no se envia para que lo crean: cada lado lo vuelve a jugar.

   PLATAFORMA INYECTADA: `firma(texto)`, `verifica(texto, firma, clave)` (promesas), `azar()` (64 hex)
   y `azar32()` (32 hex) de `crypto.getRandomValues` en la pestana, deterministas en las pruebas;
   `ciclo()` = el ciclo de juego de este aparato. Nada se guarda: vive en la pestana (guardarlo pide
   firma). Ni DOM, ni red, ni reloj.


## public/game/duelo.js:62

Mi siguiente sobre en una sesion: el `seq` y el `prev` los lleva este aparato.


## public/game/duelo.js:79

Todas las firmas del paquete, verificadas antes de tocar nada.


## public/game/duelo.js:202

Ciclos que le quedan al otro para revelar antes del abandono (NO_DATA si no espero nada).


## public/game/juez.js:1

preceptoros.org · theGame · el JUEZ: cuando corriges o ignoras al piloto, ¿quién tenía razón?

   QUÉ HACE. Desde el estado EXACTO del momento de la sugerencia juega dos ramas con el mismo
   motor puro: lo que sugirió el piloto y lo que hiciste tú (o esperar, si no hiciste nada).
   Después, HORIZONTE ciclos con el piloto al mando en las dos, y compara Núcleo, fase,
   integridad mínima y XP, en ese orden. Como el motor es puro, el veredicto no es una opinión:
   cualquiera lo vuelve a jugar y sale igual. Eso enseña determinismo con la propia partida.

   UNA FUENTE, DOS USOS. `juzga` es puro y se exporta por `module.exports`: la Aduana del rack
   lo carga desde aquí para decidir qué correcciones entrenan al piloto. La pestaña y el rack no
   pueden discrepar porque no hay dos jueces, hay uno.

   LIMPIEZA (2026-10-12, firmada: «decide tú la solución honesta y repórtalo con causa»). La mitad de la
   pestaña se RETIRA: solo despertaba al responder a Suggest (retirado: su freno `capa.open` nunca dejaba
   actuar al piloto), y envolvía CADA función del motor para avisar a una voz que ya no existe. Queda lo
   puro, en la puerta del juego, para que cualquiera audite en su pestaña el MISMO juez que usa la Aduana.
   La voz del Preceptor vuelve por el Narrador de la Radio, contando la crónica real.


## public/game/juez.js:33

Una rama: la acción, y después `h` ciclos con el piloto decidiendo tras cada uno.


## public/game/juez.js:48

Lo que importa, en orden: el Núcleo, la fase, no romperse por el camino y la XP.


## public/game/juez.js:59

Una sugerencia que no cambia nada del estado es una alucinación: no hay rama que jugar.


## public/game/escuadron.js:1

preceptoros.org · theGame · EL ESCUADRON (P6, combate a escala; firmado por el Soberano el 2026-10-11).

   MECANICA (MDA): una tropa firmada es un ESCUADRON. Despliega N unidades segun sus ARISTAS: pocas aristas,
   muchas unidades pequenas (infanteria, «6 planes.txt»:142); un Leviatan es UN coloso. Seis tropas de una
   persona pasan de cien unidades. El combate NO cambia: `arena.combate` sigue resolviendo POR TROPA, con el
   mismo contrato (`tropas_max`, sobres, `packSha`); las unidades son la COREOGRAFIA de esa tropa.

   DINAMICA: las unidades CAEN a medida que su tropa pierde vida (vivas = ceil(N * vida / max)): el dano se
   lee a escala, sin barras. La FORMACION de tu casa (agresiva, defensiva, flanqueo) coloca las unidades;
   como en la repeticion, cambia la coreografia, nunca el registro.

   RENDIMIENTO EN UN MOVIL: cada unidad es la cara de COMBATE de su tropa (`G.lod`, 2 terminos), un camino
   (Path2D) calculado una vez por tropa y cacheado; las N unidades se juntan en UN camino por escuadron
   (`addPath` con su matriz) y se trazan de una vez: un `stroke` por escuadron, no por unidad. Sin Path2D,
   no hay escuadron (degradacion honesta: la tropa sigue). Sin azar: los sitios salen de la semilla.


## public/game/escuadron.js:24

Cuantas unidades despliega una tropa de n aristas: round(por_aristas / n), con tope; el Leviatan, 1.


## public/game/escuadron.js:26

Cuantas siguen en pie con esa vida (la ultima cae con la tropa).


## public/game/escuadron.js:29

Los sitios de las n unidades, en radios de la tropa, alrededor de su lider (la unidad 0, en el centro).
     Espiral aurea (cada unidad en su sitio, sin solaparse) con un desvio de la semilla, y la formacion:
     agresiva = cuna hacia delante; defensiva = anillo; flanqueo = dos alas. Pura y determinista.


## public/game/escuadron.js:44

El camino de la cara de combate, radio 1, cacheado por tropa (acotado a 64).


## public/game/escuadron.js:56

Dibuja el escuadron de la unidad `u` de la escena (su lider ya esta dibujado). o: { r, dpr, giro, alfa, t, quieto }.


## public/game/battle_choreography.js:1

preceptoros.org · theGame · LA COREOGRAFIA de un combate ya resuelto: el registro hecho movimiento.

   EL RESULTADO NO SE TOCA (Soberano, 2026-10-05: «como ver una partida de Age of Empires repetida»).
   `arena.combate` ya decidio cada golpe con enteros y una semilla. Aqui no se decide nada: se pone en
   el mapa a quien ya golpeo, a quien ya cayo y cuando. La vida de cada tropa se recalcula SOLO desde
   el registro, con la misma regla que el motor (`porMil`), y por eso el ganador que se VE es siempre
   el que el registro dice (`ganadorVisual`, comprobado en `atlas/replay_casos.mjs`).

   LO QUE SI SE INVENTA, SE SIEMBRA. Las rocas, las bases, las formaciones y los rodeos salen de un
   generador sembrado con la semilla de la partida: misma partida, misma coreografia, en cualquier
   aparato, y su `hash` lo demuestra. Nada de azar del sistema ni de reloj. La simulacion solo usa
   sumas, productos, divisiones y raices (IEEE exactas): el mismo numero en cualquier motor.

   EL GUION. Marcha desde las bases; cada golpe del registro es un tramo: el que ataca avanza, dispara,
   el proyectil vuela y el golpe empuja. Los heridos retroceden, los caidos se quedan, los vivos se
   reagrupan. Al final, el que gana toma el campo y el que pierde vuelve a su base.

   Puro: sin DOM, sin red. En el navegador, `window.AtlasCoreografia`; en node, `module.exports`.


## public/game/battle_choreography.js:24

El generador: mulberry32 sembrado con los primeros 32 bits de la semilla (hex).


## public/game/battle_choreography.js:42

El mapa: dos bases y unas rocas en la franja de en medio, todo sembrado.


## public/game/battle_choreography.js:52

LAS FORMACIONES del jugador (Soberano, 2026-10-05: «preajustes de estrategia y formacion que
     cambian la COREOGRAFIA… NO cambian el resultado del motor»). Solo mueven a SU bando en pantalla:
     cuanto se separa del frente, cuanto se lanza al atacar y si abre las alas.


## public/game/battle_choreography.js:62

`tropas`: [[{max, vel}...] defensa, [...] asalto]. `registro`: el de `arena.combate`.
     `pre` (opcional): { lado, formacion } -- la formacion elegida para el bando `lado`.


## public/game/battle_choreography.js:77

Los tramos: cuando sale el tiro y cuando llega.


## public/game/battle_choreography.js:164

Lo que se VE al final: vivos y vida por bando, con la regla del motor (porMil).


## public/game/battle_choreography.js:175

El centro de cada bando (vivos) en un fotograma: para comprobar quien toma el campo.


## public/game/battle_replay.js:1

preceptoros.org · theGame · LA REPETICION de una batalla, como una partida de estrategia vista otra vez.

   El Soberano (2026-10-05): «busco unidades en movimiento por el mapa, como ver una partida de Age of
   Empires repetida. No solo el combate por turnos». Las tropas salen de sus bases, cruzan el terreno
   en formacion, rodean las rocas, chocan en el frente, disparan, retroceden, caen y se reagrupan.
   La camara sigue la accion. Mandos grandes: play/pausa, x1/x2/x4, una linea de tiempo que se
   arrastra y la formacion de tu bando.

   NADA DE ESTO DECIDE. El resultado y cada golpe salen de `arena.combate`; `battle_choreography.js`
   los pone en el mapa con un generador sembrado con la semilla de la partida, y este fichero solo los
   pinta. La formacion cambia la coreografia, nunca el registro. Misma partida, misma repeticion.

   LA ESTETICA MEDIDA SE QUEDA: el dano DESAFINA la figura, el color de cada onda es su VELOCIDAD, y el
   bando se distingue por la FORMA de su marca (circulo el tuyo, rombo el otro), no solo por el color.
   Con movimiento reducido: cuatro fotogramas clave quietos y el resumen en texto. El lienzo lleva
   `role=img` y los momentos clave se narran en una region viva. Sin azar, sin red, sin reloj.


## public/game/battle_replay.js:58

--- los mandos ----------------------------------------------------------------------------------


## public/game/battle_replay.js:68

Degradacion honesta (B.6.1, ideas6oct:804): si el automatico baja la calidad tras MEDIR fps, se dice,
       y volver a Maxima es un toque. Lo que el jugador elige manda sobre el automatico.


## public/game/battle_replay.js:95

--- la camara: encuadra a los vivos, suavizada sobre varios fotogramas (pura) ----------------


## public/game/battle_replay.js:115

--- un fotograma, en un rectangulo del lienzo (los cuatro clave lo usan con movimiento reducido) --


## public/game/battle_replay.js:132

La estela: por donde paso en los ultimos fotogramas.


## public/game/battle_replay.js:146

P6: su ESCUADRON alrededor (escuadron.js), que cae con su vida. Solo coreografia: no decide.


## public/game/battle_replay.js:154

Los disparos en vuelo, y su impacto.


## public/game/rating.js:1

preceptoros.org · theGame · multijugador · el RATING: un Elo ENTERO y LOCAL.

   Cada aparato lo calcula de los resultados verificados que tiene (`arena.compruebaResultado`): no hay
   clasificacion central. Por defecto solo cuentan los duelos `humano`; los `sintetico` (patrullas,
   pruebas) se etiquetan y no puntuan. Sin un solo decimal en ejecucion: la esperanza sale de una
   tabla precalculada y el redondeo es simetrico (lo que gana uno lo pierde el otro, exacto).
   PURO: ni DOM, ni red, ni reloj. Se separo de `arena.js` por tamano (se parte, no se recorta).


## public/game/rating.js:14

Esperanza por mil de un Elo, 1000 / (1 + 10^(-d/400)), en tramos de 25 puntos de 0 a 800,
     precalculada y escrita en enteros: en ejecucion no hay ni un decimal.


## public/game/rating.js:23

`resultado` en milesimas para A: 1000 gana, 500 empate, 0 pierde. Redondeo simetrico: lo que
     gana uno lo pierde el otro, exacto.


## public/game/rating.js:32

La tabla LOCAL: resultados verificados, en orden canonico (su huella), solo de las procedencias
     que se cuentan (por defecto, `humano`).
