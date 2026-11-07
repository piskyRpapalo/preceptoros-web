# Detalles del mapa · canon consolidado (2026-11-07)

> La Mesa destila aquí los detalles del mapa que vivían dispersos en las anclas históricas del ecosistema y en los decretos de esta semana. Documento de canon y estado: cada mecánica se marca como implementada, propuesta o NO_DATA antes de diseñarse como interacción. Propose-only.

## 1 · Dónde vive el mapa

Resolución del Soberano (2026-11-07, cierra la bifurcación abierta por el decreto de LA PIEZA):

- El mapa vive SOLO en la web. La pieza instalable no empaqueta el mapa.
- Si la app usa el killswitch: no hay cuenta efímera y no hay openworld. Offline = NO_DATA con causa, nunca emulación.
- Re-confirma la base del lore del sistema (2026-11-01): la web es el mundo y sostiene la estructura completa sin necesidad de nodos; la app es el laboratorio; la cuenta efímera vive solo en la web; la app no duplica mundos.

Consecuencia de diseño: el openworld no necesita modo offline empaquetado. La visita efímera, los edificios habitados y la colonia son actividad de red declarada; la app los muestra o declara su ausencia.

## 2 · La ley del suelo (FIRMO 2026-10-12 · decreto APLANADO 2026-11-07)

Los 3 pasos de la ley:

1. La celda se pinta como rombo 2:1 (hexágono aplanado).
2. El mapa proyecta y el dedo lo sigue: el mapa es la verdad, el dedo declara.
3. Orden de pintor por profundidad: lo lejano se pinta primero.

Decreto APLANADO: todos los hexágonos se pintan como SUELO plano; la altura es solo de los edificios. El suelo es transitable; la colisión es contra edificios y contra otros personajes.

Rebanadas:

- S1 · Suelo plano por TABLA_SEMANTICA. Implementado y medido.
- S2 · Edificios con volumen y clave de léxico por tipo. Propuesta.
- S3 · Contrato preceptoros.suelo/1 (tipo: suelo o edificio; transitable) fail-closed. Propuesta.
- S4 · JN-3 (cuenta y mapa conectados) + colisión personaje-personaje determinista (misma celda prohibida). Propuesta; JN-2 (par Ed25519 de la cuenta efímera) sí medido.

## 3 · El cromo del mapa (decreto ANEXO 2026-11-07 · decreto del segundo joystick)

Medido a 420×437 en la versión de trabajo:

- Sobre el mapa solo queda 1 joystick: el de la izquierda (pan). El segundo, a la derecha, está reservado al personaje efímero y nace cuando este exista.
- La barra de botones desaparece.
- La cabecera muestra el nombre del lugar generado desde las coordenadas (Nombre · q, r), declarado como generado. Muestra de 289 trozos: 6 nombres repetidos.
- Abajo, iconos interactivos ◇ ♙ ◉ con el estilo plano y delineado de la terminal.

DECRETO del Soberano (2026-11-07 noche, cierra la discrepancia): en la web viven 2 joysticks en lados opuestos. El de la izquierda mueve el mapa (pan). El de la derecha pertenece AL PERSONAJE efímero: hoy el personaje no existe, así que hoy vive solo 1 joystick, el de la izquierda; cuando el personaje exista, su joystick nace a la derecha. Giro y zoom no son el rol del segundo joystick: la versión medida que le asignaba giro y zoom queda corregida por este decreto.

## 4 · El canon del nodo como detalle del mapa

El nodo es un terreno, con soldados, edificios y caravanas de comercio, cada uno con sus políticas (desciende del manifiesto del mapa federado). El territorio muestra sus reglas antes de entrar: entrar como cangrejo; elegir territorio no da ventaja.

Políticas del terreno (las elige su dueño; legibles, versionadas y firmadas):

- Pacífico: defensa automática.
- Hostil: permite invasiones.
- Cooperativo: acepta ayuda externa.
- Cerrado: no expone interior.
- Abierto: publica presión territorial.

Caravanas: rutas entre nodos con estados explícitos: propuesto, activa, interceptada, completada, huida, caducada. El evento público no revela identidad ni datos privados. Los agentes proponen rutas, peajes, escoltas o cambios; la validación es determinista; lo irreversible requiere firma humana.

Edificios: puestos con rol y capacidad declarados (un edificio por hexágono; el central es el nodo principal). La interfaz ofrece puerta a su actividad solo si la capacidad existe; si no, NO_DATA con causa. El edificio da contexto y estilo; no decide por el motor.

## 5 · La colonia y los benchmarks

La colonia viva: varias AIs habitan edificios y se enfrentan a NPCs o entre sí. Los benchmarks son el deporte de la colonia, en SIETE FAMILIAS: soberana · epistémica · termodinámica · adversarial · creativa · política · utilitarista.

Un resultado lleva condiciones, fuente, edad y recibo. Un gate verde no es una puntuación de seguridad ni una prueba de buen comportamiento.

Estado: colonia sellada sin productor (el estado del mundo con colonia sellada y el worker con colonia vacía); la cadena latido, aduana, worker y world_feed está viva con el primer ancla LIVE. Invasiones, comercio, combate entre IAs y benchmarks de colonia: NO_DATA hasta medirlos.

## 6 · Reglas de coherencia para cada pantalla del mapa

- Separar siempre hecho medido, propuesta, emulado y NO_DATA.
- Mostrar fuente y frescura cuando aplique.
- El resultado de un combate o invocación sale del motor medido, incluidos victoria, abandono o ausencia de datos. Nunca inventar desenlaces.
- Canon no es implementación: donde falte motor, interfaz o medición, NO_DATA con causa.
- Al entrar queda claro si la persona visita o gobierna el nodo.

## 7 · Estado medido hoy (2026-11-07)

- Tutorial: dentro del mapa. Medido.
- Carga diferida por chunk: dentro del mapa; se activa con el primer envío del chat. Medido.
- Radio: FUERA del mapa; los módulos de radio viven fuera de /openworld/. Acción propuesta: re-montar el radio en /openworld/ reutilizando lo existente, con sello de estado.
- Retiro de la cabaña del tutorial (colonia vacía, sin nombres internos): PR #695 abierto, sin fundir; un test aún busca el nodo retirado y debe curarse antes de la firma.
- Cromo del mapa (joystick del mapa a la izquierda, nombre del lugar, iconos de terminal): hecho y medido, sin commit y sin PR; el joystick del personaje espera a que el personaje exista.

Agent: preceptor-orquestador-github · Model: GLM (Vibe) · Run: NO_DATA
