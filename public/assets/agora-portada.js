/* preceptoros.org · la portada de Comunidad. Lo que hay, y lo que todavia no.
 *
 * QUE PINTA, Y DE DONDE SALE
 * --------------------------
 * De `/agora.json`, que MIDE el rack --descargas, paquetes firmados, ficheros
 * disponibles con su hash-- y no lo escribe nadie a mano. Una cifra escrita a
 * mano en una pagina es una cifra que un dia deja de ser verdad sin que nadie se
 * entere: le paso a `paginas`, a `idiomas`, a `peso_sitio`, y le paso a la
 * pagina de instalar, que nego durante trece dias una descarga que funcionaba.
 *
 * LO CERRADO SE ENSENA, y esa es la decision de diseno que importa. Un apartado
 * que no existe se puede ocultar --y entonces quien lo busca cree que se le
 * escapa algo-- o se puede declarar con su causa. Aqui se declara: el foro esta
 * cerrado porque el Agora todavia no modera, no porque se nos haya olvidado.
 *
 * NO HAY CONTADOR DE VISITAS NI DE INSTALACIONES, y no es un hueco pendiente:
 * es permanente. Contarlas exigiria la telemetria que este proyecto existe para
 * no tener, y por eso `instalaciones` viaja con `permanente: true`.
 */
(function () {
  var raiz = document.getElementById('agora-portada');
  if (!raiz) return;

  function T(clave, respaldo) {
    var b = document.getElementById('i18n');
    try { return (JSON.parse(b.textContent)[clave]) || respaldo; }
    catch (e) { return respaldo; }
  }
  function el(tag, clase, texto) {
    var n = document.createElement(tag);
    if (clase) n.className = clase;
    if (texto !== undefined && texto !== null) n.textContent = String(texto);
    return n;
  }
  /* Los bytes se leen, no se cuentan. «27281120 B» no dice nada a nadie. */
  function peso(b) {
    if (b >= 1048576) return (b / 1048576).toFixed(1) + ' MB';
    if (b >= 1024) return (b / 1024).toFixed(1) + ' KB';
    return b + ' B';
  }
  /* Una cifra sin su procedencia no es un dato. Cuando el estado no es MEDIDO
     se pinta la CAUSA, nunca un cero de relleno. */
  function cifra(m, etiqueta, nota) {
    var c = el('div', 'ag-cifra');
    if (!m || m.estado !== 'MEDIDO') {
      c.appendChild(el('strong', 'no-data', 'NO_DATA'));
      c.appendChild(el('span', 'ag-et', etiqueta));
      if (m && m.causa) c.appendChild(el('p', 'tenue', m.causa));
      return c;
    }
    c.appendChild(el('strong', 'dato', m.valor));
    c.appendChild(el('span', 'ag-et', etiqueta));
    if (nota) c.appendChild(el('p', 'tenue', nota));
    return c;
  }

  fetch('/agora.json', { cache: 'no-store' })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      raiz.innerHTML = '';

      /* --- EL MODELO DEL PERIODO -------------------------------------------
         Lo DECIDE el Soberano; el rack sirve. Es una decision, no una medida,
         asi que mientras no este firmada no se deduce del modelo mas usado ni
         de ningun otro proxy: se dice que falta. Rellenarlo con una heuristica
         seria presentar una eleccion nuestra como si fuera suya. */
      var m = el('section', 'ag-bloque');
      m.appendChild(el('h3', null, T('agEstrena', 'Modelo del periodo')));
      m.appendChild(el('p', 'no-data',
        'NO_DATA · todavía no hay uno firmado. Lo elige el Soberano; el rack ' +
        'sirve lo que se le dice. Mientras tanto, los cerebros disponibles ' +
        'están abajo, cada uno con lo que hace y lo que falla.'));
      raiz.appendChild(m);

      /* --- ACTIVIDAD ------------------------------------------------------- */
      var a = d.actividad || {};
      var s = el('section', 'ag-bloque');
      s.appendChild(el('h3', null, T('agActividad', 'Actividad medida')));
      var fila = el('div', 'ag-cifras');
      var des = a.descargas || {};
      fila.appendChild(cifra(des, T('agDescargas', 'descargas de la última versión'),
        des.estado === 'MEDIDO'
          ? des.version + ' · ' + des.ficheros + ' ficheros · los cuenta ' +
            'GitHub, no nosotros'
          : null));
      var fir = a.paquetes_firmados || {};
      fila.appendChild(cifra(fir, T('agFirmados', 'paquetes firmados recibidos'),
        fir.estado === 'MEDIDO' ? fir.como : null));
      fila.appendChild(cifra(a.instalaciones, 'instalaciones'));
      s.appendChild(fila);
      raiz.appendChild(s);

      /* --- LO QUE PUEDES LLEVARTE ------------------------------------------ */
      var dl = el('section', 'ag-bloque');
      dl.appendChild(el('h3', null, T('agTitulo', 'Lo que puedes llevarte hoy')));
      dl.appendChild(el('p', 'tenue', T('agSinCaja',
        'No hay caja negra: lo que el modelo sabe está en ficheros que puedes leer.')));
      var lista = el('ul', 'ag-descargas');
      (d.descargable || []).forEach(function (f) {
        var li = el('li');
        var a2 = el('a', 'ag-fich', f.fichero);
        a2.href = '/downloads/' + f.fichero;
        li.appendChild(a2);
        li.appendChild(el('span', 'ag-peso', peso(f.bytes)));
        /* EL HASH, O SU AUSENCIA DICHA. Dos ficheros con el mismo nombre no son
           el mismo fichero; una descarga que no se puede verificar es una en la
           que hay que confiar, y aqui no se pide confianza. */
        if (f.sha256) {
          li.appendChild(el('code', 'hash', f.sha256.slice(0, 16) + '…'));
        } else {
          li.appendChild(el('span', 'no-data', 'sin sha256'));
        }
        lista.appendChild(li);
      });
      if (!lista.children.length) {
        dl.appendChild(el('p', 'no-data', 'NO_DATA · no hay nada publicado todavía.'));
      } else { dl.appendChild(lista); }
      dl.appendChild(el('p', 'tenue', T('agVerifica',
        'Comprueba el hash antes de usarlo') + ': sha256sum -c <fichero>.sha256'));
      raiz.appendChild(dl);

      /* --- LO DECLARADO Y CERRADO ------------------------------------------ */
      if ((d.cerrado || []).length) {
        var c = el('section', 'ag-bloque');
        c.appendChild(el('h3', null, T('agPendiente', 'Declarado y todavía cerrado')));
        var ul = el('ul', 'ag-cerrado');
        d.cerrado.forEach(function (x) {
          var li = el('li');
          li.appendChild(el('strong', null, x.que));
          li.appendChild(el('p', 'tenue', x.causa));
          ul.appendChild(li);
        });
        c.appendChild(ul);
        raiz.appendChild(c);
      }

      /* --- DE QUE ESTA HECHA LA MEMORIA ------------------------------------
         Se dice qué índice es, con su medida. Decir «base de datos vectorial»
         sin haberlo comprobado seria la clase de palabra que suena a rigor y no
         lo es -- y aqui resulta que es al reves de lo que suena moderno. */
      var i = d.indice_de_memoria;
      if (i && i.estado === 'MEDIDO') {
        var q = el('section', 'ag-bloque');
        q.appendChild(el('h3', null, 'Cómo recuerda'));
        q.appendChild(el('p', null, i.que_es));
        q.appendChild(el('p', 'tenue', i.porque));
        raiz.appendChild(q);
      }

      var pie = el('p', 'tenue');
      pie.textContent = 'Medido ' + (d.medido || 'NO_DATA').slice(0, 16) +
        ' · fuente: /agora.json';
      raiz.appendChild(pie);
    })
    .catch(function (e) {
      /* El fallo se DICE con su causa. Un hueco mudo se lee como un sitio roto. */
      raiz.innerHTML = '';
      raiz.appendChild(el('p', 'no-data',
        'NO_DATA · no se pudo leer /agora.json — ' + (e && e.message ? e.message : e)));
    });
})();
