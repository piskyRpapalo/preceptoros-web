# ③–④: inventario previo / REQUIERE_FIRMA

Solo medición y propuesta; ninguna construcción de ③ o ④.
Medición: 2026-10-16, Linux x86_64, Node v22.22.1, Python 3.14.4.
Web: base exacta `e6eef92cfc9bdec6b553ccc66e8ac22be004d363`.
Sincronización ff-only antes de ramificar. `bin/sellar.py --sellar` con la
VERSION existente devuelve NADA QUE SELLAR: huella `0b9a7a221d0cb53a`,
VERSION `preceptoros-2026-17-abik`; cero cambios públicos. Las letras de los
merges y la VERSION del worker son sensores distintos: no se inventa su paridad.

App: objeto remoto `3c395961ddbc9b32481b5e3b8cb450be932cdde8`, leído mediante
la API de contenidos de GitHub sin modificar el clon atrasado del rack.
Las citas APP de abajo pertenecen a ese objeto, no al HEAD del clon local.
RACK: lectura del fichero `<private-ref>/nodos.py`, SHA-256
`e1c3fd4fcd91becccdfd55ffccae276be450866f4fa949ff2c607c1817495f07`.
No se abrió ninguna base de datos ni se ejecutó su CLI de escritura.
Referencia Worker: objeto local `fe9f07a8c90e78d81b89f3f6be257b7277958b61`;
es código leído, no prueba de despliegue. RACK y Worker permanecen intactos.

## Recorrido medido

| Tramo | Fuente fichero:línea | Lo que existe / límite |
|---|---|---|
| RACK: administración | `<private-ref>/nodos.py:82,120` | Nodo por nombre; admin público de 64 hex. Impide sustituir admin sin retirarlo, pero no impide usar el mismo admin en otro nodo. |
| RACK: exportación | `<private-ref>/nodos.py:265` | Cédula sin firma; admin público o null; dispositivos con testigos de solicitud/aceptación; hash del cuerpo. No añade aparato, plan firmado ni SSHSIG. |
| APP: firma verificada | `nodo_app.py:47,51,57,79` | Bytes firmados y namespace heredados; verifica con allowed_signers local y ssh-keygen, no con una clave de la cédula. |
| APP: nivel | `nodo_app.py:103` | Vincula dispositivo declarado; excluye delegados del cálculo del nivel humano. No certifica unicidad mundial cuenta↔nodo. |
| APP: caché de máquina | `nodo_app.py:165,170,184` | Guarda `{cedula,lectura}` en `<casa>/nodo.json`, 0600; admite resultado OK o NO_DATA. La caché no se convierte por ello en raíz de confianza. |
| APP: consola | `consola.py:521` | Lee la lectura guardada; muestra DECLARADO, nivel y autenticidad. No vuelve a certificar cada lectura. |
| APP: exportación explícita | `bin/preceptoros-pwa:409`; `nodo_export.py:24,36,42` | POST local `/api/nodo/export`; comprueba forma y autenticidad y remite `{cedula}` a `/aduana/cedulas`. |
| APP: respuesta | `nodo_export.py:70` | Comprueba forma básica de paquete; conserva solo recibo. No retiene ni entrega el paquete a la web. |
| WEB: catálogo | `public/game/nodos-cedulas.js:14` | Dos alias y dos nodos; admin:null, sin firma; aparato con datos declarados y procedencia. Es estático, no un receptor. |
| WEB: puerta ① | `public/game/node_reception_contract.js:49,56,70,76` | Contrato estricto; cédula y sobre son formas distintas. Menos de 1.024 B UTF-8; no admite aparato ni testigos de dispositivo del exportador legado. |
| WEB: puerta ② | `public/game/node_signature_verify.js:97` | Verifica forma, pins, manifiesto y SSHSIG; veredicto separado, authority:false. No instala, almacena o publica la cédula. |
| WEB: confianza | `public/game/node_trust_anchor.js:3`; `node_trust_manifest.js:3`; `docs/canon-node-trust.md:6` | Pins y manifiesto vacíos. Falta ceremonia real separada; cualquier candidata real sigue pendiente. |
| WEB: doble puerta antigua | `public/game/nodos.js:48,65` | El encabezado firmado usa R.declaration, no el verificador ②. Sigue exigiendo aparato y hash completo. SIGNED no prueba autenticidad aquí. |
| WEB: estado/cuenta maestra | `public/game/cuenta.js:17,29`; `data/preceptoros_cuenta_maestra_schema.json:8` | Actividad DECLARADA por medidas fechadas, latido NO_DATA. Cuenta maestra limitada al nodo maestro, PROPUESTA y firma:null. No hay importador de cuenta maestra firmada. |
| WEB: pesos | `public/game/nodos-pesos.js:20`; `public/game/nodos.js:107`; `atlas/nodos_casos.mjs:115` | PROPUESTA sin firma; rejilla y banda comprobables. La ausencia usa base y niebla; no inventa rendimiento. |
| WEB: mapa/corales | `public/game/fog_of_war.js:22`; `map_nodes_layer.js:4`; `reef_corals.js:37` | Leen el catálogo. Solo el nodo maestro tiene posición; importar una cédula no autoriza otras coordenadas. |
| WEB: consentimiento | `public/game/ui-nodos.js:170`; `public/game/nodos.js:200` | Clic real, casilla y segunda firma; puerta de partidas, no de importación de cédulas. |
| WEB: transporte | `public/assets/enviar.js:32,59,75` | Enviar.paquete usa reto de Agora y POST `/api/v1/paquetes`. No usa ENDPOINT de ①. |
| Worker: recepción | `aduana/src/index.js:63,73,79,93` | Espera solo `{cedula}`; verifica cédula y plan; responde 202 encolado con paquete. No es publicación ni entrega de un registro completo. |
| Worker: registro | `aduana/schema.sql:1` | Auditoría con huella de cédula única; node_id y admin_sha256 NO son únicos. Ninguna ruta de lectura del registro global en el código examinado. |

## Duplicados, residuos y dictamen

- Catálogo y cédula firmada no son intercambiables. Añadir aparato al original
  cambia sus bytes; ① rechaza ese campo. Se conservará el original íntegro y
  se propone una proyección separada. No se elimina el catálogo legado.
- El admin de RACK es la clave pública cruda del navegador
  (`nodos.py:123`; WEB `public/assets/auth.js:127`). No es la clave SSH del
  firmante soberano. En el Worker, el nombre `admin_sha256` no demuestra otra
  derivación: `index.js:79` compara directamente con cedula.admin. Esa
  ambigüedad nominal debe declararse, no convertirse en una transformación.
- Los alias casa-* del catálogo no vienen firmados dentro de la cédula.
  La cuenta maestra tampoco aporta hoy evidencia firmada de enlace universal:
  su constructor y su esquema solo producen una propuesta para el nodo maestro.
- El aparato del catálogo no lo exporta la app. Autenticidad, actividad,
  hardware, pertenencia y publicación son ejes distintos; no se promueven juntos.
- `ui-nodos.js:104` elige las primeras dos cuentas. Ampliar el selector queda
  fuera de estas piezas; no se anuncia combate general entre más cuentas.
- Patrón de fichero existente: `public/game/shell_schematics.js:54` ofrece
  selección local y preview sin aplicar. Es referencia de gesto, no el
  contrato de cédula. No se hereda su techo de 16 KiB para un paquete de ①.

## Sondas de comportamiento de esta ronda

Una ejecución de funciones existentes con objetos sintéticos en memoria;
armadura deliberadamente ficticia, sin clave humana y sin prueba criptográfica.
No se añadieron tests ni se modificaron módulos para obtener estos resultados.

| Sonda | Resultado medido |
|---|---|
| Catálogo legado | validaCedulas acepta. |
| Alias de cuenta repetido | Rechaza por forma de cuenta. |
| Dos cuentas para un nodo | Rechaza por invariante 1:1. |
| Documento de nodo repetido | Acepta: falta detectar nodo duplicado en la lista. |
| Cédula de forma ① sin aparato | R.credential acepta forma; nodos.js rechaza por aparato. |
| Añadir aparato y recalcular hash | R.credential rechaza por campos; no es solución de compatibilidad. |
| estadoNodo sin aparato | medidas:0, activo:NO_DATA, desde:null, latido:NO_DATA. |
| cuentaMaestra | Sigue PROPUESTA; no prueba de cuenta firmada. |

## NO_DATA que no se cierran

③: falta ancla real; cédula real compatible y firmada; conjunto completo de
enlaces y regla de unicidad duradera; evidencia de posesión de la cuenta
navegador; política de sustitución/revocación. No se ha leído una cuenta real,
un registro privado ni una firma humana. El exportador legado y ① difieren
en campos: no se podan testigos silenciosamente después de firmar.

④: falta receptor de cédulas; contrato de despacho con segunda firma compatible
con el Worker; retención/entrega del paquete desde la app. Enviar.paquete no
es todavía el transporte de ①. Deploy, D1 vivo, CORS y endpoint operativo:
NO_DATA con causa, no se consultaron. DOOGEE y lector real: NO_DATA, los mide
el rack. No se asignan nuevas posiciones ni se cierra frescura mediante fechas.

## Yardsticks de la base, no pruebas de las piezas futuras

Dos tandas sobre e6eef92: test_web 78 descubiertas, 77 pasan y 1 omitida;
test_atlas 181/181; arnes_sw 22/22; suite Node completa 135 descubiertas,
130 pasan y 5 omitidas. Mismos conteos en ambas; cero fallos. No se suman
casos anidados entre suites. Omisiones: paneles aún no publicados (test_web),
tres comprobaciones estrictas H7 y dos D1/D2 no activadas (Node).
Los rojos de ③ y ④ son previstos hasta recibir FIRMO para construir.
