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

  function idioma() {
    return (document.documentElement.lang || 'es').slice(0, 2);
  }

  function paneles(raiz) {
    /* DOS FICHEROS, COMO EN EL TALLER. `paneles.json` trae los hechos --modelo,
       medida, entorno-- y `paneles-<idioma>.json` el texto. Se partieron el
       2026-09-14 por aritmetica: con las ocho lenguas dentro, el fichero de
       hechos pasaba de 22 KB contra un tope de 16.384.

       Y de paso se arreglo lo que el corte destapo: dos de los tres paneles
       --`coder-adapter` y `killswitch-apocalypse`-- solo tenian castellano, asi
       que seis y siete lenguas leian su ficha en espanol dentro de su propia
       pagina. Ahora las ocho, y el gate lo exige. */
    Promise.all([
      fetch('/paneles.json', { cache: 'no-store' }).then(function (r) { return r.json(); }),
      fetch('/paneles-' + idioma() + '.json').then(function (r) {
        return r.ok ? r.json() : null;
      }).catch(function () { return null; })
    ])
      .then(function (par) {
        var d = par[0];
        var T2 = (par[1] && par[1].paneles) || {};
        var ps = d.paneles || [];
        if (!ps.length) { return; }
        var s = el('section', 'ag-bloque');
        s.appendChild(el('h3', null, T('agPaneles', 'Los cerebros, uno a uno')));
        var ul = el('ul', 'ag-paneles');
        ps.forEach(function (p) {
          var t = T2[p.id] || {};
          var li = el('li', 'ag-panel');
          li.appendChild(el('h4', null, t.nombre || p.id));
          li.addEventListener('click', () => { abrePanel(p); });
          li.appendChild(el('code', 'ag-tag', p.modelo && p.modelo.tag));
          var med = (p.modelo || {}).medida || {};
          if (med.tok_s) {
            /* La cifra viaja con su carga base. Sin ella no es reproducible, y
               una tabla que presume de hashes no puede publicar cifras sueltas. */
            li.appendChild(el('p', 'ag-med', med.tok_s + ' tok/s · carga base ' +
              (med.carga_base === undefined ? 'NO_DATA' : med.carga_base)));
          }
          if (t.que_hace) {
            var h = el('p'); h.appendChild(el('strong', null, T('agHace', 'Hace:') + ' '));
            h.appendChild(document.createTextNode(t.que_hace)); li.appendChild(h);
          }
          if (t.que_falla) {
            var f = el('p', 'ag-falla');
            f.appendChild(el('strong', null, T('agFalla', 'Falla:') + ' '));
            f.appendChild(document.createTextNode(t.que_falla)); li.appendChild(f);
          }
          if (p.entorno && p.entorno.paquete) {
            var a2 = el('a', 'ag-fich', p.entorno.paquete);
            a2.href = '/downloads/' + p.entorno.paquete;
            var e2 = el('p', 'tenue');
            e2.textContent = T('agEntorno', 'Su entorno de estudio:') + ' ';
            e2.appendChild(a2); li.appendChild(e2);
          }
          ul.appendChild(li);
        });
        s.appendChild(ul);
        raiz.appendChild(s);
      })
      .catch(function () { /* sin paneles la portada sigue en pie */ });
  }

  /* LA PROSA VA APARTE DE LOS HECHOS, y encima de ellos.

     `agora.json` lo escribe `agora_portada.py` desde el rack y lo llena de
     castellano: causas, niveles, la politica de moderacion entera. Son treinta
     frases, y se leian en espanol en las ocho lenguas -- la mitad de esta
     pagina.

     No se traducen DENTRO de ese fichero: son 30 frases por 8 lenguas, y un
     fichero medido que ademas carga con sus propias traducciones se pasa del
     tope el primer dia. Van en `/agora-<idioma>.json`, siete ficheros --el
     castellano ya esta en los hechos, que es su idioma de origen-- y se
     SUPERPONEN por id.

     Superponer y no sustituir importa: si el fichero no esta, o llega roto, o
     el Soberano anade un nivel que todavia nadie ha traducido, se ve el
     castellano. Se degrada a la lengua de origen, que es lo que hace esta casa,
     y no a un hueco. */
  function conProsa(d, P) {
    if (!P) return d;
    (d.cerrado || []).forEach(function (x) {
      var t = (P.cerrado || {})[x.id];
      if (t) { if (t.que) x.que = t.que; if (t.causa) x.causa = t.causa; }
    });
    (d.niveles || []).forEach(function (x) {
      var t = (P.niveles || {})[x.id];
      if (!t) return;
      ['nombre', 'quien', 'causa', 'porque'].forEach(function (k) {
        if (t[k]) x[k] = t[k];
      });
    });
    if (d.moderacion && P.moderacion) {
      var m = P.moderacion;
      if (m.estado) d.moderacion.estado = m.estado;
      if (m.principio) d.moderacion.principio = m.principio;
      if (m.reglas) d.moderacion.reglas_visibles = m.reglas;
      if (m.falta) d.moderacion.falta_para_firmarla = m.falta;
    }
    if (d.actividad && P.actividad) {
      var A = d.actividad;
      if (A.paquetes_firmados && P.actividad.firmados_como) {
        A.paquetes_firmados.como = P.actividad.firmados_como;
      }
      if (A.instalaciones && P.actividad.instalaciones_causa) {
        A.instalaciones.causa = P.actividad.instalaciones_causa;
      }
    }
    if (d.indice_de_memoria && P.indice) {
      if (P.indice.que_es) d.indice_de_memoria.que_es = P.indice.que_es;
      if (P.indice.porque) d.indice_de_memoria.porque = P.indice.porque;
    }
    return d;
  }

  Promise.all([
    fetch('/agora.json', { cache: 'no-store' }).then(function (r) { return r.json(); }),
    idioma() === 'es' ? Promise.resolve(null)
      : fetch('/agora-' + idioma() + '.json').then(function (r) {
          return r.ok ? r.json() : null;
        }).catch(function () { return null; })
  ])
    .then(function (par) { return conProsa(par[0], par[1]); })
    .then(function (d) {
      raiz.innerHTML = '';

      /* --- EL MODELO DEL PERIODO -------------------------------------------
         Lo DECIDE el Arquitecto; el rack sirve. Es una decision, no una medida,
         asi que mientras no este firmada no se deduce del modelo mas usado ni
         de ningun otro proxy: se dice que falta. Rellenarlo con una heuristica
         seria presentar una eleccion nuestra como si fuera suya. */
      var m = el('section', 'ag-bloque');
      m.appendChild(el('h3', null, T('agEstrena', 'Modelo del periodo')));
      m.appendChild(el('p', 'no-data', T('agSinModelo',
        'NO_DATA · todavía no hay uno firmado. Lo elige el Arquitecto; el rack sirve lo que se le dice.')));
      raiz.appendChild(m);

      /* --- ACTIVIDAD ------------------------------------------------------- */
      var a = d.actividad || {};
      var s = el('section', 'ag-bloque');
      s.appendChild(el('h3', null, T('agActividad', 'Actividad medida')));
      var fila = el('div', 'ag-cifras');
      var des = a.descargas || {};
      fila.appendChild(cifra(des, T('agDescargas', 'descargas de la última versión'),
        des.estado === 'MEDIDO'
          ? des.version + ' · ' + T('agFicheros', '{n} ficheros · los cuenta ' +
              'GitHub, no nosotros').replace('{n}', des.ficheros)
          : null));
      var fir = a.paquetes_firmados || {};
      fila.appendChild(cifra(fir, T('agFirmados', 'paquetes firmados recibidos'),
        fir.estado === 'MEDIDO' ? fir.como : null));
      fila.appendChild(cifra(a.instalaciones, T('agEtInstala', 'instalaciones')));
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
          li.appendChild(el('span', 'no-data', T('agSinHash', 'sin sha256')));
        }
        lista.appendChild(li);
      });
      if (!lista.children.length) {
        dl.appendChild(el('p', 'no-data',
          T('agNadaPublica', 'NO_DATA · no hay nada publicado todavía.')));
      } else { dl.appendChild(lista); }
      dl.appendChild(el('p', 'tenue', T('agVerifica',
        'Comprueba el hash antes de usarlo') + ': sha256sum -c <fichero>.sha256'));
      raiz.appendChild(dl);

      /* --- LOS PANELES DE ESTUDIO ------------------------------------------
         La ficha de cada modelo. Se pinta de `/paneles.json`, que sale del
         MISMO esquema que usan los estudios internos del laboratorio: cambian
         los textos, no la forma. Los internos no llegan hasta aqui --el
         generador solo publica los de ambito `publico`-- y eso es el punto, no
         una omision.

         QUE_FALLA SE PINTA SIEMPRE Y CON EL MISMO PESO QUE QUE_HACE. El
         validador ya lo exige en el dato; aqui se exige en la vista, porque un
         defecto escondido en letra pequena esta contado y no dicho. Es la parte
         de la ficha que hace que las demas valgan algo. */
      paneles(raiz);

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

      /* --- LOS NIVELES, Y QUE FALTA PARA ABRIR EL SIGUIENTE ---------------
         Salen de `config/agora-niveles.json`, no de un texto escrito aqui: el
         dia que el Soberano cambie un `estado` de CERRADO a ABIERTO, la pagina
         lo dice sola sin desplegar una linea de codigo. Un motivo copiado a
         mano es un motivo que un dia deja de ser verdad sin que nadie se entere,
         y de eso esta llena la historia de este sitio. */
      if ((d.niveles || []).length) {
        var n = el('section', 'ag-bloque');
        n.appendChild(el('h3', null, T('agNiveles', 'Hasta dónde puedes llegar hoy')));
        var on = el('ol', 'ag-niveles');
        d.niveles.forEach(function (x) {
          var li = el('li', 'ag-nivel ' + (x.estado === 'ABIERTO' ? 'abierto' : 'cerrado'));
          li.appendChild(el('strong', null, x.nombre));
          li.appendChild(el('span', 'ag-estado', x.estado));
          li.appendChild(el('p', 'tenue', x.quien));
          /* El motivo del cierre se ENSENA. Un apartado cerrado sin causa se lee
             como un descuido, y este no lo es. */
          if (x.estado !== 'ABIERTO' && x.causa) {
            li.appendChild(el('p', 'ag-causa', x.causa));
          }
          on.appendChild(li);
        });
        n.appendChild(on);
        if (d.moderacion) {
          var mo = el('details', 'ag-moderacion');
          mo.appendChild(el('summary', null,
            T('agModera', 'Cómo se modera') + ' · ' + d.moderacion.estado));
          mo.appendChild(el('p', null, d.moderacion.principio));
          var ur = el('ul');
          (d.moderacion.reglas_visibles || []).forEach(function (r) {
            ur.appendChild(el('li', null, r));
          });
          mo.appendChild(ur);
          /* LO QUE FALTA PARA FIRMARLA, dicho en la propia pagina. Una politica
             a medias que se presenta como cerrada es peor que una declarada. */
          if ((d.moderacion.falta_para_firmarla || []).length) {
            mo.appendChild(el('p', 'no-data',
              T('agSinFirmar', 'Sin firmar todavía. Falta decidir:') + ' ' +
              d.moderacion.falta_para_firmarla.join(' · ')));
          }
          n.appendChild(mo);
        }
        raiz.appendChild(n);
      }

      /* --- DE QUE ESTA HECHA LA MEMORIA ------------------------------------
         Se dice qué índice es, con su medida. Decir «base de datos vectorial»
         sin haberlo comprobado seria la clase de palabra que suena a rigor y no
         lo es -- y aqui resulta que es al reves de lo que suena moderno. */
      var i = d.indice_de_memoria;
      if (i && i.estado === 'MEDIDO') {
        var q = el('section', 'ag-bloque');
        q.appendChild(el('h3', null, T('agMemoria', 'Cómo recuerda')));
        q.appendChild(el('p', null, i.que_es));
        q.appendChild(el('p', 'tenue', i.porque));
        raiz.appendChild(q);
      }

      var pie = el('p', 'tenue');
      pie.textContent = T('agMedido', 'Medido') + ' ' +
        (d.medido || 'NO_DATA').slice(0, 16) + ' · /agora.json';
      raiz.appendChild(pie);
    })
    .catch(function (e) {
      /* El fallo se DICE con su causa. Un hueco mudo se lee como un sitio roto. */
      raiz.innerHTML = '';
      raiz.appendChild(el('p', 'no-data',
        T('agNoLee', 'NO_DATA · no se pudo leer /agora.json —') + ' ' +
        (e && e.message ? e.message : e)));
    });
})();
