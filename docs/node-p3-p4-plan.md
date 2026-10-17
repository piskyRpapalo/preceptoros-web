# ③ antes de ④ / plano REQUIERE_FIRMA

Base: `e6eef92cfc9bdec6b553ccc66e8ac22be004d363`.
Fuente y límites medidos: [inventario](node-p3-p4-inventory.md).
Este documento no construye módulos, contratos servidos, pruebas ni interfaces.
La autorización de publicar el plano no autoriza construirlo. La Mesa mide;
el Soberano firma cada pieza. Letras reservadas: abkd para ③, abke para ④.

## ③: enlace firmado y unicidad con alcance explícito

### Decisiones propuestas al Soberano

1. REQUIERE_FIRMA: la evidencia durable del enlace vive en la propia cédula
   firmada: admin↔nodo, ambos dentro de signedBody. La identidad de cuenta
   propuesta es la clave pública cruda del navegador en admin, sin nombre de
   persona. Los alias de juego son rótulos, no identidades ni prueba de firma.
   Fuentes: `nodos.js:48`; `node_reception_contract.js:57,81`;
   `auth.js:127`; referencia RACK `nodos.py:123`.
2. REQUIERE_FIRMA: no se promueve la cuenta maestra PROPUESTA a registro real
   ni se generaliza silenciosamente su esquema. Tampoco se llena admin:null
   en cédulas antiguas usando la sesión del navegador: haría falta emitir y
   firmar otro documento. Fuente: `cuenta.js:29` y su esquema cerrado.
3. REQUIERE_FIRMA: la web verifica unicidad solo en el conjunto de evidencias
   que realmente recibió y verificó; nunca afirma que un conjunto parcial es
   el registro mundial. Rechaza una cuenta con dos nodos, un nodo con dos
   cuentas y entradas duplicadas. No elige un ganador por orden de llegada,
   fecha ni nivel de hardware. Fuentes: `nodos.js:65`; inventario de duplicados.
4. REQUIERE_FIRMA de dirección: para unicidad durable/global, se propone un
   registro separado de admisiones en la aduana con unicidad transaccional de
   cuenta y nodo, vinculado al plan firmado. El actual node_requests se conserva
   como auditoría, sin borrar su historia. Construirlo requiere encargo propio
   del lado Worker; este plano web no autoriza tocarlo. Fuentes de la carencia:
   `aduana/schema.sql:1`; `aduana/src/index.js:79,86`.
   Hasta registro, deploy y evidencia de admisión: inscripción global NO_DATA.
   Una cédula con firma válida prueba el enlace firmado, no la reserva mundial
   ni la posesión actual de la clave admin por quien abre el fichero.

### Corte de trabajo, tras FIRMO

- REQUIERE_FIRMA, `public/game/node_bindings.js` propuesto: módulo puro que
  recibe un conjunto explícito de cédulas, conserva sus bytes y calcula ① y ②
  dentro de su propio flujo. No acepta un booleano verified suministrado por
  el fichero. Captura entradas antes de awaits; indexa admin y nodo; rechaza
  conflictos y devuelve evidencia inmutable, alcance del conjunto y causas.
  Fuente a heredar: `node_reception_contract.js:56,81`;
  `node_signature_verify.js:97`. authority:false y firma:null permanecen.
- REQUIERE_FIRMA, `public/game/nodos.js:65`: cerrar el documento de nodo
  duplicado sin retirar la puerta legada. Separar la validación del catálogo
  antiguo de la verificación criptográfica de evidencias reales. Tener
  firma_ssh o SIGNED nunca basta para el nuevo registro.
- REQUIERE_FIRMA, `public/game/node_projection.js` propuesto: proyección de
  evidencia y aparato separados. Nunca inserta aparato en la cédula ni
  recalcula su huella para simular una firma. Sin mediciones vinculadas:
  ram_mib y gen_cps quedan NO_DATA con valor:null y causa; no se copian las
  medidas de otro nodo. Reusa `nodos.js:107` para base/niebla y
  `cuenta.js:17` para actividad declarada. Firma válida no es latido LIVE.
- REQUIERE_FIRMA, consumidores `map_nodes_layer.js:4`, `reef_corals.js:37`
  y `ui-rack.js:71`: aceptar la proyección a través de un adaptador común,
  conservando el catálogo como origen legado. La cuenta maestra sigue siendo
  propuesta cuando solo existe esa evidencia. No hay sesión de servidor.
- REQUIERE_FIRMA, política territorial: reusar `fog_of_war.js:22` SIN extender
  posiciones. Para otro nodo, ficha sin posición, causa explícita; ni coral
  ni despeje de niebla inventados. Identidad visual nueva requiere cita exacta
  ideas6oct/ideas7oct de la Mesa y FIRMO aparte. Pesos `nodos-pesos.js:20`
  permanecen PROPUESTA; no se retiran ni se firman desde la web.
- Registro persistente en navegador, réplica pública automática, cambio de
  admin, selector de combates y cuenta maestra generalizada quedan fuera:
  no están resueltos por una firma de cédula. Ninguna importación publica.

### ROJOS previstos antes de implementar

`tests/node_bindings.test.mjs` y puente en `atlas/test_atlas.py`, propuestos:
cuenta duplicada en nodos distintos; nodo con dos admins; documento duplicado;
admin virado con hash exterior recalculado; cédula legada admitida por su
puerta pero rechazada como alta verificada; armadura ficticia; veredicto
falsificado; ancla ausente; conjunto parcial presentado como global.
Después, verdes con raíces y cédulas sintéticas, idempotencia del resultado,
orden independiente, ausencia de mutación y bloqueo de autoridades.
Regresión: pesos, bandas de equilibrio, estadoNodo, mapa y corales; ninguna
coordenada nueva. Fuentes: `atlas/nodos_casos.mjs:34,115,128`.

Optimización auto-comprobable propuesta: un solo cálculo de ①/② por huella
en cada operación, compartido por ficha/estado/proyección; nada de caché global
que sobreviva a cambio de ancla. Medir antes/después invocaciones y bytes
procesados sobre el mismo conjunto fijo, con resultados idénticos. El ahorro
es NO_DATA hasta medir; no se usa una cifra de tiempo de otro dispositivo.

Cierre de ③: código web y gates pueden quedar medidos con fixtures; el enlace
real necesita la ceremonia y una cédula real medida. La garantía global no
queda cumplida por un verde local; la Mesa decide y registra esa dependencia.
Solo después del cierre de ③ por la Mesa se corta ④ desde main fresco.

## ④: selección local y preview, después de ③

### Flujo propuesto

- REQUIERE_FIRMA, `public/game/node_file_receiver.js` propuesto: selección
  exclusivamente por gesto. Primer clic abre input local; FileReader es el
  respaldo, showOpenFilePicker solo si existe y tras gesto. Segundo clic
  explícito abre la revisión del fichero elegido. Cancelar no lee otro origen
  ni altera el juego. No se pide una URL. Fuente de patrón:
  `shell_schematics.js:54`; no se copia su contrato ni su techo.
- REQUIERE_FIRMA: dos entradas explícitas, ya definidas en ①: cédula suelta
  `preceptoros.cedula-nodo/1` y sobre `preceptoros/cedula-nodo/1` de un par.
  Discriminar por esquema, sin búsqueda recursiva. Sobre: R.read; cédula:
  R.credential y comprobación de su envoltura mediante R.packet. Se mantiene
  el original; no se inventa otra firma al envolver. El caché de máquina
  `{cedula,lectura}` se identifica y rechaza con remedio explícito, no se toma
  su lectura como veredicto. Fuentes: `nodo_app.py:178` APP;
  `node_reception_contract.js:56,70,76` WEB.
- REQUIERE_FIRMA: comprobar file.size antes de leer; contar bytes UTF-8 reales
  del fichero y del sobre resultante contra MAX_BYTES de ①, sin elevarlo a 16 KiB.
  Rechazar truncamientos, JSON inválido y sobredimensión; no ejecutar HTML ni
  aceptar nombres/rutas del fichero como identidad. Si cambia el fichero
  mientras se espera cripto, descartar el resultado anterior y reiniciar
  casilla, firmas y preview. Fuente: `node_reception_contract.js:76`.
- REQUIERE_FIRMA, `public/game/node_preview.js` propuesto: solo texto seguro y
  ficha de ①+②+③; cuenta/nodo/huella, veredicto y causa traducida, estadoNodo
  desde la proyección sin hardware inventado. Sin ancla: pendiente; sin
  WebCrypto: pendiente; firma inválida: rechazo. No se muestra verificada por
  una etiqueta leída del fichero. La revisión no aplica ni guarda el nodo.
  Fuentes: `node_signature_verify.js:97`; `cuenta.js:17,29`. Antes de
  diseñar o cambiar la ficha visual, la Mesa aporta la cita exacta vigente de
  ideas6oct/ideas7oct; sin ella, diseño visual NO_DATA, no se diseña de oído.
- REQUIERE_FIRMA: si hay firma válida, la identidad activa debe probar posesión
  de la clave admin antes de despachar como esa cuenta; diferencia de clave
  bloquea, no se reescribe admin. No se mezcla firma SSH soberana con firma
  de consentimiento del navegador. Fuente: `auth.js:127`; `ui-nodos.js:170`.
- REQUIERE_FIRMA: envío siempre aparte: clic real, casilla explícita y segunda
  firma que vincule huella exacta, destino y acción. Revalidar que nada cambió
  antes de llamar la única puerta Enviar.paquete. Cancelación o fallo de firma
  produce cero llamadas de red. Fuente: `ui-nodos.js:170`; `nodos.js:200`.

### Costura de transporte que debe quedar dirimida antes de construir ④

REQUIERE_FIRMA: extender la puerta única Enviar.paquete para el esquema de
cédulas y ENDPOINT de ①, dejando intactos el reto y las rutas de Agora para
sus cargas actuales. No cambiar globalmente API ni enviar cédulas a
`/api/v1/paquetes`. Fuentes: `enviar.js:32,75`; contrato ① `:91`.

El Worker actual solo acepta `{cedula}` (`aduana/src/index.js:73`): no recibe
el consentimiento de segunda firma del patrón de partidas. Se propone que
el contrato de despacho conserve esa prueba vinculada a la huella; NO se
enviará un sobre incompatible ni se descartará esa firma en silencio.
La forma de entrega de esa prueba debe venir de un contrato receptor aprobado
por la Mesa y el Soberano, con cada sector bajo el techo de ①; no se infla el
paquete para meterla. Hasta dirimirlo, despacho pendiente con causa y cero
peticiones. Si exige cambios de Worker, son encargo aparte, no parte de este PR.

Sin deploy y habilitación explícita firmada: canal NO_DATA con causa, envío
deshabilitado. No se hace un ping al cargar para descubrirlo. Al habilitarlo,
solo el gesto de envío puede intentar red. Un 202 encolado no equivale a nodo
publicado ni a unicidad global confirmada. El preview local no depende de red.

### ROJOS previstos antes de implementar

`tests/node_file_receiver.test.mjs` y pruebas del transporte propuestas:
fichero truncado; byte virado con hash exterior recalculado; tamaño igual
a MAX_BYTES y mayor; UTF-8 multibyte; fichero sustituido durante verificación;
etiqueta SIGNED con armadura ficticia; preview pendiente sin veredicto fingido;
clic sintético; casilla ausente; segunda firma ausente/rechazada o de otra
cuenta; consentimiento de otra huella o destino; error de Worker; 202 tratado
falsamente como publicación; montaje/selección/preview que intentan red.
Todos con fixtures sintéticos, nunca claves humanas. Medir llamadas a Enviar
y a la red: cero en cada sabotaje de permiso, al cargar y al previsualizar.

Optimización propuesta: rechazo por file.size antes de leer y compartir el
buffer validado con el preview, sin una segunda lectura. Corpus fijo con
casos válidos, inválidos y multibyte; contar lecturas/bytes antes y después
y exigir el mismo rechazo/veredicto. El ahorro sigue NO_DATA hasta medirse.

## Gates y entrega futura, una pieza cada vez

REQUIERE_FIRMA en cada pieza. Rama nueva desde origin/main vigente, PR borrador
propio; ③ termina antes de empezar ④. Abkd/abke los asigna la Mesa, no el agente.
Satélites M1 para responsabilidades puras y mensajes; cada bloque <16.384 B.
No se agranda ui-nodos.js (hoy 15.379 B) para esconder el receptor dentro.
Fuente de pesos actuales: inventario medido; ningún tamaño futuro se inventa.

Tras rojos dirigidos sobre la base exacta, implementar y ejecutar dos tandas:
`python3 test_web.py`, `python3 atlas/test_atlas.py`, `node arnes_sw.mjs`
(vara actual 22/22), `node --test tests/*.test.mjs`, además de dirigidas nuevas.
Conteos, fallos y omisiones por suite, sin sumar casos anidados. También
T3/M0/phase, nueve lenguas bajo techo, paridad llms, siete sellos, privacidad
por conteo y ruta, huella convergida y cero peticiones externas al cargar.
Los módulos servidos nuevos tendrán identificadores ingleses y cero comentarios;
traducciones completas en nueve lenguas como datos, sin texto crudo de ausencia.
N0/lector real y DOOGEE: NO_DATA hasta medición del rack.

No se toca el rack, app o Worker; no se despliega, firma o fusiona. La excepción
de publicación de esta ronda permite solo el inventario y el plano. Ninguna
decisión de este documento queda aprobada por el hecho de abrir su PR.
