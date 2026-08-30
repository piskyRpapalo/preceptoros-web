/* preceptoros.org · el Instalador. La puerta de entrada.
   No es una pagina de producto con botones: es el primer contacto, y su unico
   trabajo es que quien llega acabe con la app instalada y sabiendo que dentro
   le espera un companero especializado. La web recluta; la app es el taller. */
(function () {
  'use strict';
  var block = document.getElementById('i18n');
  if (!block) return;
  var T = JSON.parse(block.textContent);

  /* --- el hilo del Instalador ------------------------------------------- */
  // Habla al entrar y en cada seccion. No espera a que le pregunten: quien
  // llega no sabe todavia que hay alguien con quien hablar.
  var voz = document.getElementById('ob-voz');
  function dice(clave) { if (voz) voz.textContent = T[clave] || ''; }
  dice('obSaluda');

  // Dos caminos, declarados desde el principio. Quien ya sabe lo que quiere no
  // deberia tener que leerse la explicacion entera para llegar al boton.
  var atajo = document.getElementById('ob-atajo');
  if (atajo) atajo.addEventListener('click', function () {
    ir('descarga'); dice('obAtajo');
  });
  var largo = document.getElementById('ob-largo');
  if (largo) largo.addEventListener('click', function () {
    ir('privacidad'); dice('obLargo');
  });

  function ir(id) {
    var s = document.getElementById('ob-' + id);
    if (s) s.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  [].forEach.call(document.querySelectorAll('[data-ir]'), function (b) {
    b.addEventListener('click', function () { ir(b.getAttribute('data-ir')); });
  });

  // El Instalador reacciona a donde estas. Sin esto la pagina es un folleto;
  // con esto hay alguien acompanando la lectura.
  if ('IntersectionObserver' in window) {
    var ojo = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting && e.target.dataset.dice) dice(e.target.dataset.dice);
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    [].forEach.call(document.querySelectorAll('[data-dice]'), function (s) {
      ojo.observe(s);
    });
  }

  /* --- el codigo de vinculo --------------------------------------------- */
  // Alfabeto de Crockford sin las letras que se confunden al teclear en un
  // telefono: fuera I, L, O y U. Quien copia este codigo lo hace mirando una
  // pantalla y escribiendo en otra, y ahi un 0 que era una O cuesta el intento.
  var ALF = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

  function codigoDe(hexPub) {
    // SHA-256 de la clave publica -> 12 caracteres en tres grupos. Es
    // DETERMINISTA: la misma identidad da siempre el mismo codigo, en
    // cualquier aparato y sin guardar nada.
    var bytes = new Uint8Array(hexPub.length / 2);
    for (var i = 0; i < bytes.length; i++)
      bytes[i] = parseInt(hexPub.substr(i * 2, 2), 16);
    return crypto.subtle.digest('SHA-256', bytes).then(function (h) {
      var b = new Uint8Array(h), out = '';
      for (var j = 0; j < 12; j++) out += ALF[b[j] % 32];
      return out.slice(0, 4) + '-' + out.slice(4, 8) + '-' + out.slice(8, 12);
    });
  }

  var caja = document.getElementById('ob-codigo');
  var boton = document.getElementById('ob-vincular');
  if (boton && caja) boton.addEventListener('click', function () {
    if (!window.Identity || !window.Identity.quien()) {
      caja.textContent = T.obSinIdentidad;
      caja.className = 'ob-codigo nodata';
      return;
    }
    window.Identity.publica().then(codigoDe).then(function (c) {
      caja.textContent = c;
      caja.className = 'ob-codigo';
      dice('obVinculado');
    }).catch(function (e) {
      caja.textContent = T.obFalloCodigo + ' ' + (e && e.message ? e.message : e);
      caja.className = 'ob-codigo nodata';
    });
  });

  // Se expone para que el gate pueda comprobar el determinismo sin navegador
  // completo, y para que la app use la MISMA derivacion. Dos derivaciones del
  // mismo codigo en dos sitios distintos es como se rompen los vinculos.
  window.Onboarding = { codigoDe: codigoDe };
})();
