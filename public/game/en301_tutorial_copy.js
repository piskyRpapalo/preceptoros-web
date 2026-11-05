(function (raiz) {
  'use strict';
  var enNode = typeof module === 'object' && !!module.exports;
  // Textos del tutorial de /en/ (tabla COPY y la línea «Next» de la práctica verificada). Módulo aparte
  // porque en en301_tutorial_model.js no cabe bajo el techo de 16 KiB por fichero.
  var COPY = {
    puerta: {
      heading: 'Two doors',
      instruction: 'Go straight to visit cards, or start in the Fog and follow the Wave. Everything here is a local simulation.',
      next: 'Next: press "Start in the Fog" to follow the Wave, or "Go straight to visit cards" to skip to the cards.'
    },
    pulso: {
      heading: 'The Wave',
      instruction: 'A pulse rises from the Wave. Press it to see the first ring of fog around a practice beacon.',
      next: 'Next: press "Pulse the Wave" to clear the first ring of fog.'
    },
    disipa: {
      heading: 'Clear the fog',
      instruction: 'The fog clears to the first silenced building. This is a practice beacon preview, not a deployed building.',
      next: 'Next: press "Clear the fog" to reveal the practice beacon.'
    },
    arena101: {
      heading: 'Arena 101',
      instruction: 'One practice fight you can rewind, on a fixed seed. It runs in the practice area below.',
      next: 'Next: finish the practice fight below. The reward opens only after its result is verified; use "Reopen practice fight" if it closed.'
    },
    recompensa: {
      heading: 'Reward',
      instruction: 'Three practice eggs, each with its own sound: Shield, Pike and Bow. They are practice only and are not adopted.',
      next: 'Next: press "Collect 3 practice eggs" to claim them locally.'
    },
    campamento: {
      heading: 'Camp',
      instruction: 'A camp fight on a second fixed seed. It runs in the practice area below.',
      next: 'Next: finish the camp fight below. The building step opens only after its result is verified; use "Reopen camp fight" if it closed.'
    },
    primer_edificio: {
      heading: 'First building',
      instruction: 'Give your first building a title and a prompt for the local mind. Nothing is written to memory or RAG.',
      next: 'Next: press "Prepare local label", then "Place first building" to record it as a simulated local label.'
    },
    cartas: {
      heading: 'Visit cards',
      instruction: 'Visit cards need verified local signed cards. None are verified here, so Atlantis and the Risen show NO_DATA.',
      next: 'Next: press "Show crossing options" to reach the crossing step.'
    },
    salto: {
      heading: 'Cross to Node 3',
      instruction: 'Only you can open the network. In this simulation the crossing stays unavailable: no signed card or transport exists.',
      next: 'Next: press "Keep playing locally" to return to the local game. The crossing stays disabled with its cause.'
    }
  };
  var READY_NEXT = 'Next: press "Continue tutorial" in the practice fight to record its verified result.';
  var api = { COPY: COPY, READY_NEXT: READY_NEXT };
  if (enNode) { module.exports = api; } else { raiz.AtlasTutorialCopy = api; }
})(this);
