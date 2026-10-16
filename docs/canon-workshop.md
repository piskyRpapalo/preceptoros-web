# Canon · Workshop (taller, ui-taller, primer_eco)

> Migrated from code by D1 subject 5 (campaign FIRMO, 2026-10-16). Canon with fichero:línea origin. The code keeps not a single comment.

Blocks migrated: 26 · canon bytes: 6136


## public/game/taller.js:1

preceptoros.org · theGame · EL POLVO DE TALLER (P9, firmado por el Soberano el 2026-10-11).

   «Desintegrar las ondas que no quieres da RESIDUO ESTATICO (una cuadrada, unos 4 g; un leviatan fallido,
   mas); con el residuo, LIJAR aristas SUBE atributos, JAMAS anade aristas: anadir es un Summon nuevo. Un
   reciclador, no una tienda» (Soberano; corpus: «6 planes.txt»:144-155, LEEME:1155-1157).

   PURO como la gacha: ni DOM, ni red, ni reloj, ni azar. Aqui viven las reglas y el RECIBO ENCADENADO
   (`atlas.taller/1`): cada operacion apunta al sha256 de la anterior y lleva el saldo que deja. El estado
   (cuanto residuo tienes, que lijaste, que desintegraste) NO se guarda aparte: sale de recorrer la cadena,
   que se comprueba entera. Valor visible ANTES de destruir: `residuo(t)` se ensena en el boton.

   QUIEN FIRMA: la persona, con su clave (IronClaw), como al adoptar. La web pinta y pide la firma; el
   Army solo suelta una tropa con su recibo firmado (`db.js`, `retira`).

   DONDE CUENTA LO LIJADO: en la practica contra los NPC (`arena.js`, `unidades`). En los duelos entre
   personas NO, hasta que la cadena viaje dentro del sobre y el otro la pueda comprobar: sin eso, cualquiera
   podria decir que lijo lo que no lijo. Se dice en pantalla.


## public/game/taller.js:26

Las aristas de una tropa: las suyas, o MEDIDAS si es de la version anterior (sin el campo).


## public/game/taller.js:28

Gramos de residuo al desintegrar: un gramo por arista; el Leviatan (mas de 12), `leviatan_x` veces.


## public/game/taller.js:30

Lo que cuesta subir un stat al nivel `nivel` (1..max): base * nivel.


## public/game/taller.js:33

LA TROPA LIJADA: los mismos armonicos y las mismas aristas; solo suben los stats lijados.


## public/game/taller.js:40

El recibo siguiente de una cadena (sin firmar): `op` = { op: 'desintegra', tropa } o
     { op: 'lija', semilla, stat }. Lanza si la regla no lo permite.


## public/game/taller.js:56

P10 · PRISMA DE BANDERA: tenir una onda al color de tu bandera (de la paleta cerrada). Solo aspecto.


## public/game/taller.js:67

RECORRER LA CADENA: [{ recibo, firma }] -> el estado, o { error } con el primer eslabon roto.
     Comprueba el enlace (prev = sha256 del recibo anterior), la regla de cada operacion, el saldo y que la
     clave sea siempre la misma. Las FIRMAS las comprueba quien tiene el verificador (`verificaFirmas`).


## public/game/taller.js:88

Las firmas de toda la cadena, con el verificador inyectado (WebCrypto en la pestana, crypto en node).


## public/game/ui-taller.js:1

preceptoros.org · theGame · EL POLVO DE TALLER en pantalla (P9, firmado el 2026-10-11).

   La puerta es `AtlasTallerUI.monta(zona)`, en la pestana TALLER. Las reglas viven en `taller.js` (puro); aqui
   solo se pintan, se pide la FIRMA de la persona y se guarda la cadena por `db.js` (cajaWeb, la unica puerta
   de almacenamiento del juego).

   VALOR VISIBLE ANTES DE DESTRUIR: cada onda dice cuantos gramos daria. DESINTEGRAR saca la tropa del Army
   solo con su recibo firmado (`AtlasIncubadora.retira`); LIJAR sube un stat y cuesta mas en cada nivel. La
   cadena guardada se COMPRUEBA al volver (enlaces, cuentas y firmas): si un eslabon falla, se dice cual y el
   Taller no opera sobre una cadena rota. Sin red, sin azar, sin reloj.


## public/game/ui-taller.js:22

Firma de la persona sobre el recibo tal cual (la cadena compara el JSON exacto).


## public/game/ui-taller.js:41

La suelta de la eclosion: MISMO recibo `atlas.taller/1`, MISMO residuo y MISMO mensaje que desintegrar, pero
     sin `retira` (la tropa nunca entro al Army). `panel` (la eleccion) se cierra solo si el recibo queda firmado.


## public/game/ui-taller.js:54

Al cerrarse la revelacion de una eclosion, el foco y la vista van a la eleccion (quedarse / soltar).


## public/game/ui-taller.js:62

amor 4: su lapida


## public/game/ui-taller.js:67

P10 · tenir una onda al color de TU bandera (la de «Customize»).


## public/game/ui-taller.js:85

El Army como casilleros: cada tropa con su ficha (dibujada, sin imagen) y su nombre. Elegir una marca el
     casillero y pinta su detalle (abajo, en esta misma hoja). Sustituye al pintado antiguo de ui.js.


## public/game/ui-taller.js:112

El detalle: su ficha grande y TODAS sus stats (las de la tropa, sin lijar; el saldo sale arriba).


## public/game/ui-taller.js:162

Lo lijado de cada tropa, para la escuadra de PRACTICA (ui-arena.js). Una cadena rota no presta nada.


## public/game/ui-taller.js:164

P10: el tono de la bandera a la que se tino una onda, o null (nunca un color decidido por otro).


## public/game/ui-taller.js:167

Q1: lee el mismo recibo verificado y el Army compartido; no guarda otra copia de la tropa.


## public/game/primer_eco.js:1

preceptoros.org · theGame · CAPITULO 1.5: EL PRIMER ECO (P11, firmado por el Soberano el 2026-10-11).

   Corpus («6 planes.txt»:165-174): «Has lanzado la boya. Ahora escuchas el oceano. Es ruidoso. El tutorial te
   obliga a lanzar un Ping. Obtienes 3 ondas sucias. El Navegante (tu IA) te dice que son inestables; te ensena
   a Desintegrar la peor, a Pulir tu favorita con ese Residuo y a Pintarla con tu frecuencia. Sales con tu
   Insignia.» Despues, el mar abierto.

   UN SIMULACRO CON LAS REGLAS DE VERDAD. Las tres ondas salen de TU clave (o del visitante), son de niebla
   (`campo_origen: 'emulado'`: se ven sucias, sin detalle medido) y nunca entran en el Army. Desintegrar,
   lijar y tenir usan `taller.js` tal cual (mismos gramos, mismos costes), sobre una cadena de ensayo que no
   se firma ni se guarda: aqui se APRENDE la regla, no se gana valor. Lo unico real que deja: tu BANDERA (la
   eliges tu, se guarda en tu casa) y tu INSIGNIA, un distintivo (no una tropa: una tropa gratis romperia la
   economia firmada; se declara en la mesa).

   OBLIGATORIO: el primer paso es el ping y no hay boton de saltar; el capitulo se abre solo en el TALLER hasta
   que tienes Insignia. No bloquea el resto del juego. EL NAVEGANTE habla con el retrato del guia (la onda del
   emblema, `AtlasDialogo.retrato`): la IA del taller con su nombre propio. Sin red, sin azar, sin reloj.


## public/game/primer_eco.js:26

Las tres ondas sucias de una semilla de cuenta: deterministas, de niebla, y con al menos 6 aristas cada una
     (asi la regla real alcanza para pulir y pintar con el residuo de una sola).


## public/game/primer_eco.js:36

El estado del capitulo es puro: { paso, ondas, cadena (de ensayo), elegida, insignia }.


## public/game/primer_eco.js:43

Un paso: lanza si no toca (el orden es obligatorio). Devuelve el estado nuevo (copia).


## public/game/primer_eco.js:63

--- en la pestana ---------------------------------------------------------------------------------


## public/game/primer_eco.js:129

sin retrato: queda el nombre
