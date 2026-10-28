# Tools · decreto 2 · canal de firma externa opt-in (PROPUESTA, medida primero)

**Estado:** PROPUESTA. No hay implementación. Solo documento.
**Fecha:** 2026-10-28. **Pieza:** Tools (pestaña) sobre `main` d321842.
**Criterio de aceptación:** la prueba externa de 12 horas del Soberano.

## 1. Medido antes de proponer

Búsqueda en `origin/main` (d321842) de cualquier canal de firma externa:

    git grep -l -i -E "external.?sign|firma externa" origin/main -- public atlas bin worker
    → 0 ficheros con un canal de firma externa.

El único acierto del término «external» es `public/nexo-v1.json` (un contrato de lectura para una IA externa,
no un canal de firma). Conclusión medida: **hoy no hay ningún canal de firma externa**. Por tanto esta propuesta
no reemplaza nada; crea algo.

## 2. Lo que la regla de la casa ya fija

- La firma de valor no entra al nodo: ninguna clave privada de firma vive en `soberano`
  (CLAUDE.md, «Jamás firmas valor»). Un canal externo no puede pedirle a la web que firme con una clave del nodo.
- Opt-in: nada sale al exterior sin que la persona lo active expresamente.
- Propose-only hacia otros nodos.
- Ninguna unidad systemd ni servicio sin firma explícita.

## 3. Propuesta mínima (para decidir, no para ejecutar)

1. La persona activa el canal en Tools con un interruptor explícito (desactivado por defecto).
2. La firma se hace **en el dispositivo de la persona**, con su propia clave. La web nunca recibe ni guarda la clave.
3. Lo que sale es un sobre con el contenido firmado y la clave pública. Nada más (sin cookies, sin identificador de nodo).
4. El destino externo se declara en un único fichero versionado, con su URL explícita. Ninguna petición
   a un destino no declarado.
5. Revocar el interruptor corta el canal de inmediato y no deja nada guardado en la web.

## 4. Lo que queda abierto (NO_DATA con causa)

- Destino externo concreto: NO_DATA. No se ha indicado ningún servicio.
- Formato del sobre: NO_DATA. Se reutilizaría el de partidas/opiniones si el Soberano lo aprueba; esas piezas
  se retiraron con theGame (corte D), así que habría que volver a decidirlo.
- Sitio exacto de la clave en el dispositivo: NO_DATA.

## 5. Criterio de aceptación

La prueba externa de 12 horas del Soberano: durante 12 h, con el interruptor activado, una firma llega al destino
declarado; con el interruptor apagado, cero peticiones salientes (verificable con las herramientas del navegador).
