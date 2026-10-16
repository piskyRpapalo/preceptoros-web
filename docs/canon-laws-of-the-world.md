# Canon · Laws of the world (valores, canon, gacha, core)

> Migrado del código por D1 (FIRMO del Soberano, 16-oct). El canon NO muere: vive aquí, con fichero:línea de origen y causa textual. La memoria de trabajo no migró. El código queda sin UN comentario (ley nueva; docs/INDEX_RENAMING.md).

Bloques migrados: 60 · bytes de canon: 15961


## public/game/valores.js:1

preceptoros.org · theGame · los VALORES, separados de la logica.

   ESTADO: PROVISIONAL. Todo numero de aqui es provisional y se dice en pantalla
   (Soberano, 2026-09-27: «no te preocupes por recursos, habilidades ni
   niveles; haz la estructura; los valores y los LoRAs los adherimos
   despues»). La logica (`gacha.js`, `core.js`) no lleva ni una cifra de
   equilibrio: las lee de aqui. Cambiar el juego es cambiar ESTE fichero, y
   el dia que haya valores de verdad se cambia `estado` y se versiona.

   SOLO DATOS. Ni funciones ni efectos: un paquete de valores es JSON
   declarativo, nunca codigo (doctrina de workflows de terceros). Por eso el
   dia de los mods de la comunidad, un mod sera un objeto con esta forma.


## public/game/valores.js:18

M18-B (opcion B firmada por el Soberano, 2026-10-11): la version sube porque la tirada cambia. Las
       tropas de antes (sin `aristas`) se dicen de otra version; un duelo entre versiones distintas no se
       resuelve (`arena.packSha`).


## public/game/valores.js:22

Treasure Classes. Coste en Cobre y Luz: medido con el piloto base, la
       Biomasa nunca pasa de 2. `incuba` en ciclos de juego. La rareza ya no se
       tira aparte: sale de las ARISTAS (abajo).


## public/game/valores.js:31

EL SONAR DE ARISTAS (M18-B; corpus: «6 planes.txt»:134-142, ideas6oct:1724 «rareza por aristas»).
       La rareza es COMPLEJIDAD GEOMETRICA: cada tirada saca primero cuantas aristas (lobulos) tiene su
       onda, de esta tabla ENTERA por mil y por TC: [aristas, por mil]. Meta firmada: >= 60 % con 3-4
       aristas y <= 5 % con mas de 12 (LEVIATANES, el jackpot), en TODAS las TC; las TC altas solo
       engordan la cola. Con margen de ~3 sigmas (n = 4 000): 3-4 >= 62,5 % y > 12 <= 3,5 %, para que la
       meta se cumpla tambien en lo TIRADO, no solo en la tabla (medido: con 60,0 % exacto, tc2 daba 59,3 %). PROPUESTA de Claude: la tabla exacta la fija el Soberano. Estas son las ODDS que
       se publican: las mismas que se tiran.


## public/game/valores.js:44

La rareza por aristas: hasta 4 normal, hasta 8 magico, hasta 12 raro; mas, unico (Leviatan).


## public/game/valores.js:46

La forma de la onda (no es equilibrio, es dibujo): la amplitud del armonico que pone las aristas
       sale de `a1`; los demas, de a1 / (div * j^2), con su fase ALINEADA a la del primero (todos tienen su
       cresta en el mismo angulo: por la desigualdad de Fejer-Jackson eso deja UN maximo por periodo).
       Medido el 2026-10-11 sobre 7 000 ondas de 3 a 16 aristas: div = 1 da 0 lobulos de mas (con div =
       0,75 fallan 532); con fases al azar hacia falta div = 3 y los armonicos altos salian casi todos a 0.


## public/game/valores.js:60

Base de una tropa por nivel de TC: vida = vida[0]*nivel + [0..vida[1]].


## public/game/valores.js:62

P9 · POLVO DE TALLER («6 planes.txt»:144-155; LEEME:1155). Desintegrar una onda da RESIDUO
       ESTATICO: un gramo por arista (una cuadrada, 4 g); un Leviatan fallido, `leviatan_x` veces mas.
       LIJAR sube UN stat en `paso` por nivel, hasta `max`, y cuesta base * nivel gramos: cada nivel mas
       caro. JAMAS anade aristas (eso es un Summon nuevo). Un reciclador, no una tienda: el residuo no se
       compra. PROVISIONAL, como todo este fichero.


## public/game/valores.js:69

P6 · EL ESCUADRON (combate a escala): una tropa despliega round(por_aristas / aristas) unidades (tope
       `tope`), el Leviatan `coloso`; `radio` y `unidad` son dibujo, en radios de la tropa. NO es equilibrio
       (el combate sigue por tropa) y por eso no entra en `packSha`. PROVISIONAL.


## public/game/valores.js:73

P10 · PRISMA DE BANDERA («6 planes.txt»:156-163; LEEME:1159-1161): tu color de capitan, de una paleta
       CERRADA de ocho tonos bioluminiscentes (un tono hsl cada uno). Cerrada a proposito: un color libre seria
       una huella silenciosa (LEEME: «identidad visual sin huella silenciosa»). TENIR una onda a tu bandera
       gasta residuo (`taller.tinte`). Solo aspecto: no entra en el combate. Nada decide color por otro.


## public/game/valores.js:78

Solo para LEER las tropas de la version anterior (sin `aristas`): su simetria iba por rareza.


## public/game/valores.js:81

Recetas de sonido FM: Hz, segundos, indice en Hz.


## public/game/valores.js:88

M17-bis 3 (firma F-A, EN_CURSO_hasta_escucha del Soberano): ADSR + FM de tres senos (portadora y
       DOS moduladoras, ambas conectadas: la joya del mockup no las conectaba). `modo` decide; 'fm2' es el
       sonido de siempre y sigue por defecto hasta la escucha A/B. adsr = [ataque s, caida s, sostenido
       0-1, relajacion s]; m2 = moduladora2 / portadora; indice2 = fraccion del indice. PROVISIONALES:
       los fija el oido del Soberano, que es la medida que falta.


## public/game/valores.js:94

M17-bis 4 (firma F-A): VIBRATO POR URGENCIA DEL SELLO. Lo que espera firma vibra; lo firmado
         suena quieto. eclosion = la tropa nacida espera tu firma para adoptarla (ui.js:175);
         adopcion = ya firmada (ui.js:191). vibrato_hz y vibrato_prof (fraccion de la portadora) son
         PROVISIONALES: se fijan en la misma escucha que el movimiento 3.


## public/game/valores.js:102

Combate entre personas y patrullas (`arena.js`): rondas ENTERAS y todo PROVISIONAL. `ataque`
       pondera los stats de la tropa; `esquiva` va por mil por punto de sigilo, con tope; la armadura
       resta su mitad (`armadura_div`). El rating es un Elo entero LOCAL (no hay clasificacion
       central): `k` y `k_provisional` para las primeras `provisional_hasta` partidas.


## public/game/valores.js:111

Regla de ABANDONO (firmada por el Soberano, 2026-09-28): quien se compromete y no revela en
         estos ciclos de juego de quien espera, pierde el duelo por abandono y queda como deuda.


## public/game/valores.js:115

Los LUGARES NPC de la Arena: patrullas que salen de la semilla de su lugar, iguales en todos los
       aparatos, para probar el combate sin red. Mas hondo, mas duro. PROVISIONAL.


## public/game/valores.js:121

MOVIMIENTO 5 - M17: FLUIDEZ PS1 - Tunables como datos (corpus ideas6oct-2:785)
       Todos los parametros de la capa PS1 en un solo objeto declarativo.
       Nivel 0 = calidad minima (PS1 puro), 1 = media, 2 = maxima (fluida).
       PROVISIONAL - ajustar segun bench en el Beelink.


## public/game/valores.js:126

Melt de batalla (MOVIMIENTO 1): persistencia canvas offscreen


## public/game/valores.js:130

Color = Vida (MOVIMIENTO 2): Hue deriva a cobre, Lightness = escudo


## public/game/valores.js:134

M17-bis 2: L va de min (sin escudo) a base (escudo_ref); escudo_ref = armadura maxima medida.


## public/game/valores.js:137

Respira al beat (MOVIMIENTO 3): pulso de brillo/grosor


## public/game/valores.js:140

Buffer PS1 (MOVIMIENTO 6): resoluciones por nivel


## public/game/valores.js:143

Dither PS1 (MOVIMIENTO 6): patron 4x4 ordenado


## public/game/valores.js:146

Wobble PS1 (MOVIMIENTO 6): grid para temblor de vertices


## public/game/valores.js:148

Niebla de Omen (MOVIMIENTO 7): vignette y niebla


## public/game/valores.js:151

Sprites chunky (MOVIMIENTO 8): NPCs a 1/4 escala


## public/game/valores.js:154

Estela (MOVIMIENTO 1-2): longitud maxima


## public/game/valores.js:156

Burbujas por calidad (MOVIMIENTO 4): mar respira


## public/game/valores.js:159

M17-bis 5 (firma F-A, 2026-10-10): LA TABLA DE DERIVADOS SEMANTICOS. Cada parametro visual y
       sonoro con [formula, de que sale, clase, quien lo lee]. Clases: ESTADO (sale del estado del
       juego), CALIDAD (proyeccion por el medidor de fps; jamas decide), CONSTANTE (declarada) y
       SIN_LECTOR (declarado y nadie lo lee: deuda visible, no decoracion escondida). La prueba exige
       una fila por cada clave de `fluidez` y de las recetas, y que el lector nombrado la lea de verdad.


## public/game/core.js:1

preceptoros.org · theGame v1.5 · SINTESIS: el sonido sale de ondas, no de
   ficheros.

   CERO MP3. Cada sonido son dos OscillatorNode de tipo seno: una portadora y
   una moduladora que le cambia la frecuencia (sintesis FM). La receta de cada
   sonido es una funcion PURA (`receta`) que se prueba en node; el navegador
   solo la toca.

   APAGADO POR DEFECTO y solo tras un gesto de la persona: un juego que suena
   sin pedirlo es un juego que se cierra, y el navegador ademas lo bloquea.

   EL CALOR MODULA EL SONIDO. La directiva habla de `nodeTemperature`, la
   temperatura del silicio; un navegador no la puede leer y eso es NO_DATA.
   Lo que si hay, medido por el motor, es la PRESION del Nucleo:
   calor = 1 - integridad / integridad_max. Cuanto mas sufre el Nucleo, mas
   aspero suena (indice FM mayor y portadora mas grave). Se dice lo que es.


## public/game/core.js:20

Frecuencias en Hz, duraciones en segundos. `indice` es la profundidad de
     la modulacion en Hz. Enteros y fracciones fijas: misma entrada, misma
     receta.


## public/game/core.js:37

M17-bis 3: en modo 'fm3_adsr' la receta lleva su envolvente y una SEGUNDA moduladora.


## public/game/core.js:43

M17-bis 4: la urgencia sale del SELLO del evento, no de un capricho del sonido.


## public/game/core.js:49

LA ENVOLVENTE, pura: la ganancia del sonido en el segundo t. La usa `suena` para programar el
     volumen y la usa el pulso del golpe (wave_render) para dibujarse: una curva, dos sentidos.
     Sin adsr es la rampa de siempre (gan -> 0,0001 en dur); con adsr, ataque-caida-sostenido-relajacion.


## public/game/core.js:62

El calor que si se puede medir: la presion del Nucleo en la instantanea.


## public/game/core.js:80

LA VOZ DE UNA ONDA: cada tropa suena distinta y siempre igual, y SU ESPECTRO MANDA EL TIMBRE (R6,
     plan «el refresco», 2026-10-11). Antes la portadora salia del primer armonico, que en TODAS las
     tropas es la base k = 1: medido, 500 tropas daban UNA sola portadora (205 Hz). Ahora, de su espectro:
     - las ARISTAS (n = |k2 - 1|, el armonico que las pone) dan la NOTA, en la pentatonica sobre 110 Hz
       (la de la radio): 3 aristas, 110 Hz; cada arista, un grado mas; un Leviatan suena agudo;
     - la amplitud de ese armonico (a1) da la RAZON de la moduladora (8 + a1) / 8: el color;
     - el detalle (los armonicos altos) da el INDICE: mas detalle, mas aspero;
     - el Leviatan (mas de 12 aristas) lleva una SEGUNDA moduladora: inestable, como su forma.
     Pura y entera: la misma receta la usa la voz exacta (`atlas-voz.js`), no una copia. Corto y bajo:
     identidad, no musica.


## public/game/core.js:124

La segunda moduladora, CONECTADA (la joya del mockup creaba dos y no conectaba ninguna).


## public/game/core.js:141

El contexto abierto por el interruptor, para la voz exacta (`atlas-voz.js`); apagado, null.


## public/game/canon.js:1

preceptoros.org · theGame · multijugador · lo CANONICO: los mismos bytes en cualquier aparato.

   Entre personas no se comparte estado, se comparten PRUEBAS (PLAN §2). Una prueba solo vale si
   dos aparatos sacan los mismos bytes del mismo objeto. Por eso:
   - `canon(x)`: JSON con las claves ordenadas, sin espacios, SOLO ENTEROS seguros (un decimal no
     tiene la misma forma en todos los motores y aqui se rechaza) y todo lo que no es ASCII
     escapado (`\uXXXX`). Es el texto que se firma y se resume.
   - `huella(x)`: sha256 de `canon(x)`, con el SHA-256 puro de `atlas-coord.js`: el mismo en la
     pestana, en node y en el rack.
   - `generador(semilla)`: PRNG entero (mulberry32 sembrado con los 32 primeros bits de una
     semilla de 64 hex). `uniforme(n)` usa RECHAZO: sin el sesgo del modulo, las odds que se
     ensenan son exactamente los pesos enteros.
   - `loteria(pesos, g)`: la loteria entera acumulada del brief (§5): el primer cubo cuyo peso
     acumulado supera el sorteo.

   PURO: ni DOM, ni red, ni reloj, ni azar del sistema. La semilla la trae quien llama (commit-
   reveal en `sobres.js`). Lo carga quien lo necesite, a demanda; la puerta del juego no.


## public/game/canon.js:45

Copia con las claves en orden canonico: `JSON.stringify` de la copia == `canon` del original
     (para quien firme con `Identity.firmar`, que firma `JSON.stringify`).


## public/game/canon.js:68

Entero uniforme en [0, n) SIN sesgo: se descartan los sorteos del ultimo tramo incompleto.


## public/game/canon.js:78

Pesos enteros >= 0 con suma > 0 -> indice elegido.


## public/game/canon.js:91

Odds en puntos basicos (por 10 000), redondeadas hacia abajo; el resto se dice aparte para
     que la suma ensenada no mienta.


## public/game/canon.js:99

Suma saturada: un entero nunca se desborda en silencio.


## public/game/gacha.js:1

preceptoros.org · theGame v1.5 · el GACHA ARMONICO: Treasure Classes,
   afijos al estilo Diablo I/II y tropas hechas de ondas.

   PURO como el motor: ni DOM, ni red, ni reloj, ni azar del sistema. Todo lo
   que cae sale de una SEMILLA (64 hex). En la pestana la semilla es el
   sha256 de la firma Ed25519 de la invocacion; aqui solo se recibe ya hecha.

   NO ES UN VRF, y se dice. Ed25519 firma igual el mismo mensaje con la misma
   clave cuando firma la pestana, pero un firmante que maneje su clave fuera
   del navegador puede fabricar otras firmas validas y quedarse con la tirada
   que le guste. Vale para tu partida; para competir entre personas hace falta
   un VRF de verdad (ECVRF), y eso es NO_DATA hasta que se firme.

   UNA TROPA SON SUS ARMONICOS: [k, ax, ay, fase] enteros pequenos. La figura
   es x(t) = sum ax*cos(k t + f), y(t) = sum ay*sin(k t + f): circulos que giran
   dentro de circulos (Fourier). Cabe en menos de 200 B y no hay imagen.
   LAS ARISTAS PONEN LA FORMA (M18-B, firmado 2026-10-11). Primero se tira
   cuantas aristas tiene la onda (`valores.aristas`, por mil); la rareza sale
   de ahi. El armonico que pone las aristas es k = 1 - n: con la base k = 1, el
   radio |24 + a1 e^(-i n u)| tiene EXACTAMENTE n maximos (n lobulos). Los demas
   van en multiplos de n (k = 1 +/- n j), con amplitud a1 / (div j^2) y la fase
   ALINEADA con la del primero, asi que no inventan lobulos: `aristas(t)` lo
   MIDE y la prueba lo exige.


## public/game/gacha.js:27

LOS VALORES VIVEN EN `valores.js` (estado PROVISIONAL): aqui solo la logica.
     En node se piden con require; en la pestana los carga la puerta antes.


## public/game/gacha.js:35

Una variante de sfc32 sembrada con los 128 primeros bits de la semilla. Enteros de 32
     bits y nada mas: da lo mismo en cualquier navegador y en node.


## public/game/gacha.js:59

La onda de n aristas: base, el armonico de las aristas y los de detalle en multiplos de n, con su
     fase alineada (la cresta de todos en el mismo angulo: la del primero).


## public/game/gacha.js:69

Cuantas aristas salen de un sorteo por mil `q` en una TC (la tabla, en orden).


## public/game/gacha.js:76

LAS ARISTAS MEDIDAS: los maximos locales del radio de la figura, sobre 720 puntos de `punto`. Pura;
     es la misma medida de la propuesta M18. La tirada promete n y esto comprueba que se dibuja n.


## public/game/gacha.js:85

LA TIRADA: TC + semilla -> tropa. Primero las ARISTAS (por mil, de su TC) y de ahi la rareza; magico
     lleva prefijo O sufijo (a veces los dos), raro los dos y una tirada mas, unico (el Leviatan, mas de 12
     aristas) es el Atlante Legendario con los dos afijos fijos.


## public/game/gacha.js:117

CAMPO_ORIGEN (M18-bis): de donde salio el espectro que se pinta. 'medido' = lo tiro el motor con
     su semilla, se dibuja entero. 'emulado' = prestado o regenerado sin motor: se dibujan enteros solo
     los dos primeros terminos y los altos se desvanecen (cada uno a la mitad del anterior), que es la
     niebla honesta: se ve que esa onda no tiene detalle medido. Una tropa sin el campo es de antes de
     M18 y salio de `tirada`, asi que es medida. Un valor que no esta aqui no se adivina: lanza.


## public/game/gacha.js:132

LAS DOS CARAS DE LA ONDA (punto 5 del plan «el refresco»): la tropa guarda SIEMPRE su espectro; en
     COMBATE se dibuja la cara sencilla (la base y el armonico de las aristas: los mismos n lobulos, legible
     a escala) y en el TALLER la cara total. Es un LOD de los MISMOS datos: la de combate es un prefijo.


## public/game/gacha.js:137

El huevo tambien es una onda: un ovalo con un latido.


## public/game/gacha.js:140

MORFISMO: mezcla lineal de dos figuras, termino a termino. Las listas se
     igualan con terminos de amplitud cero, asi que el huevo se abre en la
     tropa sin saltos. `t` va de 0 a 1.


## public/game/gacha.js:153

Un punto de la figura en el angulo `u` (radianes). Unidades: las de los
     armonicos (el ovalo del huevo mide 16 x 22).


## public/game/gacha.js:164

La huella compacta de la tropa, para medir que cabe en 200 B.


## public/game/gacha.js:169

EL CARACTER DE UNA ONDA, leido de sus armonicos (que salen de la semilla firmada): color,
     pulso y una tendencia. Es un SESGO que se dice, no un destino que se programa: la onda no
     juega distinto por su caracter. Sin azar: misma tropa, mismo caracter en cada carga.


## public/game/gacha.js:178

LAS ODDS QUE SE ENSENAN SON LAS QUE SE TIRAN (addendum de la cria: sin odds ocultas). Por mil y en
     el orden de `RAREZAS` (normal, magico, raro, unico), sumadas de la MISMA tabla de aristas que usa
     `tirada`; `oddsAristas` da la tabla entera. El sorteo por mil (`sig() % 1000`) lleva un sesgo de
     modulo medido de 296/2^32 por resultado, unos 7e-8: se dice aqui.
