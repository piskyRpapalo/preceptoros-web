(function () {
  var API = 'https://api.preceptoros.org/api/v1';

  function el(t, c, x) {
    var n = document.createElement(t);
    if (c) n.className = c;
    if (x !== undefined && x !== null) n.textContent = String(x);
    return n;
  }

  function T(clave, respaldo) {
    if (window.ENVT && window.ENVT[clave]) { return window.ENVT[clave]; }
    var b = document.getElementById('i18n');
    try { return JSON.parse(b.textContent)[clave] || respaldo; }
    catch (e) { return respaldo; }
  }

  function conReto(pub, quien) {
    return fetch(API + '/reto', { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var mensaje = quien + '|' + pub + '|' + d.reto;
        return window.Identity.firmarTexto
          ? window.Identity.firmarTexto(mensaje).then(function (f) {
              return { reto: d.reto, firma: f }; })
          : { reto: d.reto, firma: null };
      });
  }

  function paquete(esquema, pares) {
    return window.Identity.publica().then(function (pub) {
      return conReto(pub, window.Identity.quien()).then(function (r) {
        if (!r.firma) {

          throw new Error(T('envSinFirmaTexto',
            'la identidad de este navegador todavía no sabe firmar el reto'));
        }
        return fetch(API + '/paquetes', {
          method: 'POST', cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pseudonimo: window.Identity.quien(), clave_publica: pub,
            reto: r.reto, firma: r.firma, esquema: esquema, pares: pares })
        });
      });
    }).then(function (resp) {
      return resp.json().catch(function () { return null; }).then(function (d) {
        if (resp.ok) { return d; }
        var e = new Error(resp.status === 404 || resp.status === 405
          ? T('envSinCanal', 'el rack todavía no tiene dónde recibirlos (' + resp.status + ')')
          : 'HTTP ' + resp.status);
        e.estado = resp.status; e.datos = d;
        throw e;
      });
    });
  }

  function enviar(caja, pares) {
    caja.innerHTML = '';
    caja.appendChild(el('p', 'cola-nota', T('envEnviando', 'Pidiendo el reto…')));

    paquete('preceptoros/correcciones/1', pares).then(function (d) {
      caja.innerHTML = '';
      caja.appendChild(el('p', 'cola-nota', T('envEncolado',
        'Enviados y en cola de revisión. El rack no publica nada sin que una ' +
        'persona lo mire: ') + (d && d.recibidos !== undefined ? d.recibidos : pares.length)));
    }).catch(function (e) {
      caja.innerHTML = '';

      caja.appendChild(el('p', 'no-data', T('envFallo', 'No se pudo enviar') +
        ' — ' + (e && e.message ? e.message : e)));
      caja.appendChild(el('p', 'cola-nota', T('envRemedio',
        'Tu trabajo sigue firmado en tu aparato. Exporta el fichero desde ' +
        '«Corregir esta respuesta» y hazlo llegar como puedas.')));
    });
  }

  function montar() {
    var caja = document.getElementById('panel-ajustes');
    if (!caja || !window.Bronce || !window.Identity) return;
    if (document.getElementById('enviar-rack')) return;
    if (!window.Identity.quien()) return;

    window.Bronce.leerTodo().then(function (regs) {
      if (!regs.length) return;
      var fila = el('div', 'fila');
      fila.id = 'enviar-rack';
      var b = el('button', 'boton',
        T('envBoton', 'Enviar al rack') + ' (' + regs.length + ')');
      b.type = 'button';
      var nota = el('div');
      b.addEventListener('click', function () {
        b.disabled = true;
        window.Bronce.paraEnviar
          ? window.Bronce.paraEnviar().then(function (p) { enviar(nota, p); })
          : enviar(nota, []);
      });
      fila.appendChild(b);
      caja.appendChild(fila);
      caja.appendChild(nota);
      caja.appendChild(el('p', 'cola-nota', T('envAviso',
        'Van firmados y con tu clave pública. El rack los encola para revisión ' +
        'humana: no se publica nada automáticamente.')));
    }).catch(function () {  });
  }

  window.Enviar = {
    mandar: function (nota) {
      if (!window.Bronce || !window.Identity || !window.Identity.quien()) {
        return Promise.reject(new Error(T('envSinFirmaTexto',
          'la identidad de este navegador todavía no sabe firmar el reto')));
      }
      return (window.Bronce.paraEnviar
        ? window.Bronce.paraEnviar()
        : Promise.resolve([])).then(function (pares) {
          enviar(nota, pares);
          return pares.length;
        });
    },

    cuantas: function () {
      if (!window.Bronce) { return Promise.resolve(0); }
      return window.Bronce.leerTodo().then(function (r) { return r.length; })
        .catch(function () { return 0; });
    },
    rotulo: function (clave, respaldo) { return T(clave, respaldo); },
    paquete: paquete
  };

  document.addEventListener('preceptor:identity', montar);
  if (document.readyState !== 'loading') { montar(); }
  else { document.addEventListener('DOMContentLoaded', montar); }
})();
