# Contrato de la guía de theGame · PROPUESTA (sin firmar, sin código)

Estado: propuesta del silicio, RATLAS15, 2026-09-26. Nada de esto se enchufa ni
se entrena sin la firma del Soberano. Primero la #3 limpia; después, la guía como
fase independiente.

## Separación de capas (lo que no se negocia)
- **El motor** (`atlas-motor.js`) sigue sin chat, sin red y sin dependencias. No
  conoce la guía.
- **La instantánea** (`AtlasJuego.instantanea()`, esquema `atlas.instantanea/1`)
  es la única puerta entre la partida y la guía: una copia serializable, en
  memoria, que muere con la pestaña. Ya existe en la #3; nadie la consume todavía.
- **La guía** es una capa aparte que lee la instantánea y conversa con un modelo
  **dedicado al juego**, no con el cerebro genérico de un piso de la Torre.

## Qué ve la guía (de la instantánea)
`fase`, `nivel_nucleo`, `profundidad`, `recursos` (luz, biomasa, cobre, flujo,
oxígeno), `integridad` / `integridad_max`, `grieta` (abierta, ciclos para
reabrir), `niveles` por oficio, `pendiente_ciclos` y los últimos 20 eventos
`atlas.evento/1`.

## Qué NO ve nunca
Nada fuera de la instantánea: ni la página, ni el navegador, ni la lengua del
sistema, ni identidad (tampoco el pseudónimo Ed25519), ni horas de reloj; solo
`ciclo`, que es tiempo de juego. La guía no recibe texto libre del jugador por
defecto: responde al estado.

## Cómo habla
- Pistas, no soluciones: nombra lo que falla («la grieta te quita 1 por ciclo»)
  y la acción posible, sin jugar por la persona.
- Cita cifras solo de la instantánea; si falta un dato, NO_DATA.
- Excepción, no andamiaje: la guía aparece cuando la instantánea cambia de forma
  relevante (grieta reabierta, oxígeno bajo, fase nueva), no en cada ciclo.

## De dónde sale el modelo (fase posterior, con firma)
LoRA pequeña sobre el modelo local, entrenada solo con partidas y decisiones de la
casa que la persona haya firmado (el camino de la Aduana, ver
`ESPEC_ATLAS_AUTOMEJORA`), sin salir del nodo. Hasta entonces: NO_DATA, y el juego
se explica por diseño (sello, alerta, fase, avisos en la zona viva).

## Pendiente de firma
1. Los campos de la instantánea de arriba.
2. Qué modelo base y dónde corre (rack o navegador).
3. Si la guía acepta preguntas escritas o solo responde al estado.
