/* preceptoros.org · el ambiente, y el ayudante de transiciones.
   Orbes lentos detras del cristal: sin algo que ver a traves, un panel
   translucido es solo un panel gris. Se dibuja BARATO a proposito — este
   producto corre en telefonos donde una respuesta tarda minutos, y un fondo
   bonito que le roba CPU al modelo es un fondo que estorba:
     · el lienzo se pinta a 1/10 de resolucion y lo estira el navegador;
     · ~20 fotogramas por segundo, no 60;
     · parado del todo si la pestana no se ve o si se pide menos movimiento. */
(function () {
  var quieto = window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;

  // El ayudante de transiciones vive aqui y no en chat.js, que esta a 200 bytes
  // de su limite. Si el navegador no trae la API, se ejecuta y ya: la interfaz
  // funciona igual, solo que sin morfosis.
  window.fluido = function (cambio) {
    if (quieto || !document.startViewTransition) { cambio(); return; }
    document.startViewTransition(cambio);
  };
  if (quieto) return;

  var lienzo = document.getElementById('ambient');
  if (!lienzo || !lienzo.getContext) return;
  var c = lienzo.getContext('2d');
  var ESC = 10;                      // 1/10 de resolucion: nadie lo nota tras el blur
  // Alfa .14 y no .30, y radios ceñidos. Se renderizo la composicion entera
  // para verla: a .30 el ambiente dejaba de ser una sala oscura con luz al
  // fondo y se volvia un fondo de pantalla azul, y entonces el cristal se lee
  // como un agujero en vez de como cristal. El ambiente susurra; si compite
  // con el contenido, sobra.
  // Violeta, bronce y jardin: la paleta de la casa, no un azul de terminal.
  var orbes = [
    { x: .25, y: .20, r: .37, dx:  .000045, dy:  .000032, col: '109,90,224' },
    { x: .78, y: .38, r: .31, dx: -.000038, dy:  .000047, col: '120,98,76' },
    { x: .50, y: .82, r: .34, dx:  .000029, dy: -.000041, col: '46,125,79' }
  ];
  function medir() {
    lienzo.width = Math.max(1, Math.ceil(innerWidth / ESC));
    lienzo.height = Math.max(1, Math.ceil(innerHeight / ESC));
  }
  addEventListener('resize', medir); medir();

  var previo = 0;
  function pinta(t) {
    requestAnimationFrame(pinta);
    if (document.hidden || t - previo < 50) return;   // ~20 fps
    previo = t;
    var w = lienzo.width, h = lienzo.height, m = Math.max(w, h);
    // SE LIMPIA, no se rellena. Rellenar con un color opaco tapaba el marmol
    // del body entero: un elemento fijo con z-index negativo se pinta por
    // delante del fondo de la pagina, no por detras. En el canon oscuro el
    // relleno coincidia con el fondo y el fallo no se veia; sobre marmol lo
    // borraba, y con el la legibilidad del texto.
    c.clearRect(0, 0, w, h);
    for (var i = 0; i < orbes.length; i++) {
      var o = orbes[i];
      o.x += o.dx * 50; o.y += o.dy * 50;
      if (o.x < -.3 || o.x > 1.3) o.dx = -o.dx;
      if (o.y < -.3 || o.y > 1.3) o.dy = -o.dy;
      var g = c.createRadialGradient(o.x * w, o.y * h, 0, o.x * w, o.y * h, o.r * m);
      g.addColorStop(0, 'rgba(' + o.col + ',.20)');
      g.addColorStop(1, 'rgba(' + o.col + ',0)');
      c.fillStyle = g;
      c.fillRect(0, 0, w, h);
    }
  }
  requestAnimationFrame(pinta);
})();
