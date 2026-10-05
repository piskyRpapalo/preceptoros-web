/* preceptoros.org · COMENTAR ESTA PAGINA, en todas las paginas de las nueve lenguas.

   EL CANAL ES EL QUE YA LLEGA AL RACK, no uno nuevo (Soberano, 2026-10-05). Medido hoy: tres lotes
   llegaron por `Enviar.paquete` -> `POST /api/v1/paquetes` con el esquema `preceptoros/correcciones/1`,
   firmado contra el reto con la identidad del navegador (el nivel 1 tambien la tiene). Este modulo
   solo arma UN par y se lo da a esa puerta: ni endpoint nuevo ni segundo camino, porque dos caminos
   divergen el dia que cambie el protocolo.

   QUE VIAJA Y QUE NO. Viaja el texto TAL CUAL se escribio (sin recortar ni normalizar), la direccion
   de la pagina, la lengua, el pseudonimo, la clave publica y las firmas. No viaja nada mas: ni
   historial, ni cookies, ni el chat. Se dice ANTES de pulsar, y el consentimiento es POR ACTO: la
   casilla nace desmarcada cada vez que se abre.

   El par lleva `tipo: 'comentario'`, asi que `ingesta.py` lo guarda como comentario y `turnos.py`
   (que filtra `tipo = 'correccion'`) no lo mete en ningun dataset. El rack no publica nada solo:
   cola de revision humana. Sin red en este fichero: la unica salida es `enviar.js`, pedido al pulsar. */
(function () {
  'use strict';
  if (window.PageComment) { return; }

  var L = (document.documentElement.lang || 'en').slice(0, 2);
  var TX = {
    en: ['Comment', 'Comment on this page', 'Write here. It is sent exactly as you write it.',
      'What is sent: your text as written, this page ({p}), the language, your pseudonym, your public key and a signature. Nothing else leaves this device. A person reviews it on the rack; nothing is published automatically.',
      'I agree to send this comment', 'Send', 'Create my key and send', 'Close', 'Sending…',
      'Sent and queued for human review.', 'Could not send: {m}. Your text is still here; copy it if you want.', 'Copy text', 'Write something first.', 'Tick the box to send.'],
    es: ['Comentar', 'Comentar esta página', 'Escribe aquí. Se envía tal cual lo escribes.',
      'Qué se envía: tu texto tal cual, esta página ({p}), la lengua, tu seudónimo, tu clave pública y una firma. Nada más sale de este aparato. Una persona lo revisa en el rack; nada se publica solo.',
      'Acepto enviar este comentario', 'Enviar', 'Crear mi clave y enviar', 'Cerrar', 'Enviando…',
      'Enviado y en cola de revisión humana.', 'No se pudo enviar: {m}. Tu texto sigue aquí; cópialo si quieres.', 'Copiar texto', 'Escribe algo primero.', 'Marca la casilla para enviar.'],
    fr: ['Commenter', 'Commenter cette page', 'Écrivez ici. Le texte est envoyé tel quel.',
      'Ce qui est envoyé : votre texte tel quel, cette page ({p}), la langue, votre pseudonyme, votre clé publique et une signature. Rien d’autre ne quitte cet appareil. Une personne le relit ; rien n’est publié automatiquement.',
      'J’accepte d’envoyer ce commentaire', 'Envoyer', 'Créer ma clé et envoyer', 'Fermer', 'Envoi…',
      'Envoyé, en attente de relecture humaine.', 'Échec de l’envoi : {m}. Votre texte reste ici ; copiez-le si vous voulez.', 'Copier le texte', 'Écrivez d’abord quelque chose.', 'Cochez la case pour envoyer.'],
    de: ['Kommentieren', 'Diese Seite kommentieren', 'Hier schreiben. Es wird genau so gesendet.',
      'Gesendet wird: dein Text wie geschrieben, diese Seite ({p}), die Sprache, dein Pseudonym, dein öffentlicher Schlüssel und eine Signatur. Sonst verlässt nichts dieses Gerät. Ein Mensch prüft es; nichts wird automatisch veröffentlicht.',
      'Ich stimme zu, diesen Kommentar zu senden', 'Senden', 'Schlüssel erstellen und senden', 'Schließen', 'Wird gesendet…',
      'Gesendet, wartet auf menschliche Prüfung.', 'Senden fehlgeschlagen: {m}. Dein Text bleibt hier; kopiere ihn bei Bedarf.', 'Text kopieren', 'Schreib zuerst etwas.', 'Kreuze das Kästchen an.'],
    it: ['Commenta', 'Commenta questa pagina', 'Scrivi qui. Viene inviato così come lo scrivi.',
      'Cosa viene inviato: il tuo testo così com’è, questa pagina ({p}), la lingua, il tuo pseudonimo, la tua chiave pubblica e una firma. Nient’altro lascia questo dispositivo. Una persona lo rivede; nulla viene pubblicato da solo.',
      'Accetto di inviare questo commento', 'Invia', 'Crea la mia chiave e invia', 'Chiudi', 'Invio…',
      'Inviato, in coda per la revisione umana.', 'Invio non riuscito: {m}. Il testo resta qui; copialo se vuoi.', 'Copia testo', 'Scrivi prima qualcosa.', 'Spunta la casella per inviare.'],
    pt: ['Comentar', 'Comentar esta página', 'Escreve aqui. É enviado tal como escreves.',
      'O que é enviado: o teu texto tal como está, esta página ({p}), a língua, o teu pseudónimo, a tua chave pública e uma assinatura. Nada mais sai deste aparelho. Uma pessoa revê; nada é publicado sozinho.',
      'Aceito enviar este comentário', 'Enviar', 'Criar a minha chave e enviar', 'Fechar', 'A enviar…',
      'Enviado, na fila de revisão humana.', 'Não foi possível enviar: {m}. O texto continua aqui; copia-o se quiseres.', 'Copiar texto', 'Escreve algo primeiro.', 'Marca a caixa para enviar.'],
    ru: ['Комментарий', 'Комментировать страницу', 'Пишите здесь. Текст уйдёт ровно так, как написан.',
      'Что отправляется: ваш текст как есть, эта страница ({p}), язык, псевдоним, открытый ключ и подпись. Больше ничего не покидает устройство. Человек проверит; ничего не публикуется само.',
      'Согласен отправить этот комментарий', 'Отправить', 'Создать ключ и отправить', 'Закрыть', 'Отправка…',
      'Отправлено, ждёт проверки человеком.', 'Не удалось отправить: {m}. Текст остался здесь; скопируйте при желании.', 'Копировать текст', 'Сначала напишите что-нибудь.', 'Отметьте флажок.'],
    el: ['Σχόλιο', 'Σχολιάστε τη σελίδα', 'Γράψτε εδώ. Αποστέλλεται ακριβώς όπως το γράφετε.',
      'Τι αποστέλλεται: το κείμενό σας όπως είναι, αυτή η σελίδα ({p}), η γλώσσα, το ψευδώνυμο, το δημόσιο κλειδί και μια υπογραφή. Τίποτε άλλο δεν φεύγει από τη συσκευή. Ένας άνθρωπος το ελέγχει· τίποτα δεν δημοσιεύεται αυτόματα.',
      'Συμφωνώ να σταλεί αυτό το σχόλιο', 'Αποστολή', 'Δημιουργία κλειδιού και αποστολή', 'Κλείσιμο', 'Αποστολή…',
      'Στάλθηκε, σε αναμονή ανθρώπινου ελέγχου.', 'Η αποστολή απέτυχε: {m}. Το κείμενο μένει εδώ· αντιγράψτε το αν θέλετε.', 'Αντιγραφή', 'Γράψτε κάτι πρώτα.', 'Τσεκάρετε το κουτί.'],
    ar: ['تعليق', 'علّق على هذه الصفحة', 'اكتب هنا. يُرسل كما كتبته تمامًا.',
      'ما يُرسل: نصك كما هو، هذه الصفحة ({p})، اللغة، اسمك المستعار، مفتاحك العام وتوقيع. لا يغادر هذا الجهاز شيء آخر. يراجعه إنسان؛ لا يُنشر شيء تلقائيًا.',
      'أوافق على إرسال هذا التعليق', 'إرسال', 'أنشئ مفتاحي وأرسل', 'إغلاق', 'جارٍ الإرسال…',
      'أُرسل، في انتظار مراجعة بشرية.', 'تعذّر الإرسال: {m}. نصك ما زال هنا؛ انسخه إن شئت.', 'نسخ النص', 'اكتب شيئًا أولًا.', 'ضع علامة في المربع للإرسال.']
  };
  var K = ['boton', 'titulo', 'pista', 'que', 'acepto', 'enviar', 'crear', 'cerrar', 'enviando', 'hecho', 'fallo', 'copiar', 'vacio', 'casilla'];
  function tx(k) { var t = TX[L] || TX.en; return t[K.indexOf(k)]; }
  function el(tag, clase, texto) {
    var n = document.createElement(tag);
    if (clase) { n.className = clase; }
    if (texto != null) { n.textContent = texto; }
    return n;
  }
  var dlg = null, R = {};

  /* La puerta de salida, pedida al pulsar: el mismo `enviar.js` que usan las correcciones. */
  function puerta() {
    if (window.Enviar && window.Enviar.paquete) { return Promise.resolve(window.Enviar); }
    return new Promise(function (ok, mal) {
      var s = document.createElement('script'); s.src = '/assets/enviar.js';
      s.onload = function () { if (window.Enviar && window.Enviar.paquete) { ok(window.Enviar); } else { mal(new Error('enviar.js')); } };
      s.onerror = function () { mal(new Error('enviar.js')); };
      document.head.appendChild(s);
    });
  }
  function identidad() {
    var I = window.Identity;
    if (!I) { return Promise.reject(new Error('NO_DATA · auth.js')); }
    return I.quien && I.quien() ? Promise.resolve(I) : I.crear().then(function () { return I; });
  }
  /* El par, con los nombres de `corregir.js` y el orden de `ingesta.py` (CAMPOS): el orden es parte
     de los bytes firmados. El texto va SIN tocar. */
  function par(texto) {
    return { prompt: location.pathname, respuesta: '', correccion: texto, corregido: new Date().toISOString(),
             idioma: L, motivo: 'comentario de pagina', tarea: 'comentar-web', consent: 1, origen: 'page-comment', tipo: 'comentario' };
  }
  function envia() {
    var texto = R.texto.value;
    if (!texto.replace(/\s/g, '')) { R.estado.textContent = tx('vacio'); return; }
    if (!R.casilla.checked) { R.estado.textContent = tx('casilla'); return; }
    R.enviar.disabled = true; R.estado.textContent = tx('enviando'); R.copiar.hidden = true;
    identidad().then(function (I) {
      var p = par(texto);
      return Promise.all([I.firmar(p), I.publica(), puerta()]).then(function (r) {
        var reg = { par: p, canonico: JSON.stringify(p), firma: r[0].firma, autor: r[0].autor, algoritmo: r[0].algoritmo, publica: r[1] };
        return r[2].paquete('preceptoros/correcciones/1', [reg]);
      });
    }).then(function () {
      R.estado.textContent = tx('hecho'); R.texto.value = ''; R.casilla.checked = false;
    }, function (e) {
      R.estado.textContent = tx('fallo').replace('{m}', (e && e.message) || String(e)); R.copiar.hidden = false;
    }).then(function () { R.enviar.disabled = false; pinta(); });
  }
  function pinta() {
    var I = window.Identity;
    R.enviar.textContent = I && I.quien && I.quien() ? tx('enviar') : tx('crear');
  }
  function construye() {
    dlg = el('dialog', 'pc-dlg'); dlg.setAttribute('aria-labelledby', 'pc-t');
    var f = el('form', 'pc-form'); f.method = 'dialog';
    var h = el('h2', 'pc-t', tx('titulo')); h.id = 'pc-t'; f.appendChild(h);
    R.texto = el('textarea', 'pc-texto'); R.texto.rows = 5; R.texto.maxLength = 4000;
    R.texto.setAttribute('aria-label', tx('pista')); R.texto.placeholder = tx('pista'); f.appendChild(R.texto);
    R.que = el('p', 'pc-que'); f.appendChild(R.que);
    var lab = el('label', 'pc-acepto'); R.casilla = el('input'); R.casilla.type = 'checkbox';
    lab.appendChild(R.casilla); lab.appendChild(document.createTextNode(' ' + tx('acepto'))); f.appendChild(lab);
    var fila = el('div', 'pc-fila');
    R.enviar = el('button', 'pc-enviar'); R.enviar.type = 'button'; R.enviar.addEventListener('click', envia);
    R.copiar = el('button', 'pc-sec', tx('copiar')); R.copiar.type = 'button'; R.copiar.hidden = true;
    R.copiar.addEventListener('click', function () { if (navigator.clipboard) { navigator.clipboard.writeText(R.texto.value); } });
    var x = el('button', 'pc-sec', tx('cerrar')); x.value = 'cerrar';
    fila.appendChild(R.enviar); fila.appendChild(R.copiar); fila.appendChild(x); f.appendChild(fila);
    R.estado = el('p', 'pc-estado'); R.estado.setAttribute('role', 'status'); f.appendChild(R.estado);
    dlg.appendChild(f); document.body.appendChild(dlg);
  }
  function abre() {
    if (!dlg) { construye(); }
    R.que.textContent = tx('que').replace('{p}', location.pathname);
    R.casilla.checked = false; R.estado.textContent = ''; pinta();
    if (!dlg.open) { dlg.showModal(); }
    R.texto.focus();
  }
  function monta() {
    if (document.getElementById('pc-boton')) { return; }
    var b = el('button', 'pc-boton', '✎ ' + tx('boton')); b.id = 'pc-boton'; b.type = 'button';
    b.setAttribute('aria-haspopup', 'dialog');
    b.addEventListener('click', abre);
    document.body.appendChild(b);
    if (!document.getElementById('pc-hoja')) {
      var h = document.createElement('link'); h.id = 'pc-hoja'; h.rel = 'stylesheet'; h.href = '/assets/page-comment.css';
      document.head.appendChild(h);
    }
  }
  window.PageComment = { abre: abre, par: par };
  if (document.readyState !== 'loading') { monta(); } else { document.addEventListener('DOMContentLoaded', monta); }
})();
