/* preceptoros.org · THE MEASUREMENTS OF EVERY ANSWER, in a small corner tag.
 *
 * ASKED BY THE SOBERANO (2026-09-24): wherever a model answers on this site,
 * be honest with curious visitors and show the measurements of that message —
 * speed, tokens, temperature reached, anything we can give — without naming
 * the hardware. Only the physics. «A small window in a corner that does not
 * bother the message and does not cover anything on the page.»
 *
 * HOW IT STAYS OUT OF THE WAY. The tag is appended INSIDE the message that
 * just received the tokens, at its end, as an inline element: it takes one
 * short line and never floats over other content. Collapsed it shows one
 * number (tokens per second); a click opens the full list in place.
 *
 * WHERE THE NUMBERS COME FROM. `rack.js` and `engine.js` dispatch
 * `preceptor:medida` with what the engine itself reported for that turn.
 * Nothing is estimated here. A value the engine did not send is shown as
 * NO_DATA. Temperature: the rack does not publish it to the web yet, so it
 * says NO_DATA with that cause — an honest gap, not a hidden one.
 *
 * WHICH MESSAGE. While a turn streams, the last element whose text changed
 * is remembered; when the turn's measurement arrives, the tag goes there.
 * That works the same for the home chat, the Tower floors, the missions, the
 * duel (two turns, two tags) and the judge.
 */
(function () {
  'use strict';
  if (window.MedidasTurno) return;
  window.MedidasTurno = true;
  var lang = (document.documentElement.lang || 'en').slice(0, 2);

  // [speed, tokens, prompt read, model load, first token, total, where, rack,
  //  your browser, temperature, temperature cause, measured by the engine]
  var TX = {
    en: ['speed', 'tokens written', 'prompt read', 'model load', 'first token', 'total',
         'ran on', 'the rack', 'your browser', 'temperature',
         'NO_DATA — the rack does not publish it to the web yet', 'as reported by the engine'],
    es: ['velocidad', 'tokens escritos', 'lectura del prompt', 'carga del modelo', 'primer token', 'total',
         'corrió en', 'el rack', 'tu navegador', 'temperatura',
         'NO_DATA — el rack aún no la publica en la web', 'según el propio motor'],
    fr: ['vitesse', 'tokens écrits', 'lecture du prompt', 'chargement du modèle', 'premier token', 'total',
         'exécuté sur', 'le rack', 'ton navigateur', 'température',
         'NO_DATA — le rack ne la publie pas encore sur le web', 'selon le moteur lui-même'],
    pt: ['velocidade', 'tokens escritos', 'leitura do prompt', 'carga do modelo', 'primeiro token', 'total',
         'correu em', 'o rack', 'o teu navegador', 'temperatura',
         'NO_DATA — o rack ainda não a publica na web', 'segundo o próprio motor'],
    it: ['velocità', 'token scritti', 'lettura del prompt', 'caricamento del modello', 'primo token', 'totale',
         'eseguito su', 'il rack', 'il tuo browser', 'temperatura',
         'NO_DATA — il rack non la pubblica ancora sul web', 'secondo il motore stesso'],
    de: ['Tempo', 'geschriebene Tokens', 'Prompt gelesen', 'Modell geladen', 'erstes Token', 'gesamt',
         'lief auf', 'dem Rack', 'deinem Browser', 'Temperatur',
         'NO_DATA — das Rack veröffentlicht sie noch nicht im Web', 'laut der Engine selbst'],
    ru: ['скорость', 'написано токенов', 'чтение промпта', 'загрузка модели', 'первый токен', 'всего',
         'где работало', 'стойка', 'твой браузер', 'температура',
         'NO_DATA — стойка пока не публикует её в вебе', 'по данным самого движка'],
    el: ['ταχύτητα', 'tokens που γράφτηκαν', 'ανάγνωση prompt', 'φόρτωση μοντέλου', 'πρώτο token', 'σύνολο',
         'έτρεξε σε', 'το rack', 'τον browser σου', 'θερμοκρασία',
         'NO_DATA — το rack δεν τη δημοσιεύει ακόμη στο web', 'σύμφωνα με τη μηχανή'],
    ar: ['السرعة', 'الرموز المكتوبة', 'قراءة الطلب', 'تحميل النموذج', 'أول رمز', 'المجموع',
         'عمل على', 'الرف', 'متصفحك', 'الحرارة',
         'NO_DATA — الرف لا ينشرها على الويب بعد', 'كما أبلغ عنها المحرك نفسه']
  };
  var t = TX[lang] || TX.en;

  function estilo() {
    var e = document.createElement('style');
    e.textContent =
      '.medida-turno{display:inline-block;margin:.35rem 0 0;font-size:.68rem;opacity:.72;' +
        'font-variant-numeric:tabular-nums;line-height:1.3}' +
      '.medida-turno>button{font:inherit;background:transparent;color:inherit;cursor:pointer;' +
        'border:1px solid currentColor;border-radius:999px;padding:.05em .55em}' +
      '.medida-turno>button:hover,.medida-turno>button:focus-visible{opacity:1}' +
      '.medida-turno dl{margin:.3rem 0 0;display:grid;grid-template-columns:auto auto;gap:.1rem .8rem}' +
      '.medida-turno dt{opacity:.8}.medida-turno dd{margin:0}' +
      '.medida-turno[hidden],.medida-turno dl[hidden]{display:none}';
    document.head.appendChild(e);
  }

  var n = function (v, d) { return typeof v === 'number' && isFinite(v) ? v.toFixed(d) : null; };
  function filas(m) {
    var tokS = m.tok_s || (m.tokens && m.gen_s ? m.tokens / m.gen_s : null);
    var pTokS = m.prompt_tok_s || (m.prompt_tokens && m.prompt_s ? m.prompt_tokens / m.prompt_s : null);
    return [
      [t[0], n(tokS, 1) && n(tokS, 1) + ' tok/s'],
      [t[1], m.tokens != null ? String(m.tokens) : null],
      [t[2], m.prompt_tokens != null ? m.prompt_tokens + ' tok' + (n(pTokS, 0) ? ' · ' + n(pTokS, 0) + ' tok/s' : '') : null],
      [t[3], n(m.carga_s, 2) && n(m.carga_s, 2) + ' s'],
      [t[4], n(m.primer_token_s, 2) && n(m.primer_token_s, 2) + ' s'],
      [t[5], n(m.total_s || m.pared_s, 2) && n(m.total_s || m.pared_s, 2) + ' s'],
      [t[6], m.origen === 'navegador' ? t[8] : t[7]],
      [t[9], t[10]]
    ].map(function (f) { return [f[0], f[1] || 'NO_DATA']; });
  }

  function etiqueta(m) {
    var caja = document.createElement('span');
    caja.className = 'medida-turno';
    var b = document.createElement('button');
    b.type = 'button';
    var fs = filas(m);
    b.textContent = '⏱ ' + (fs[0][1] === 'NO_DATA' ? fs[5][1] : fs[0][1]);
    b.setAttribute('aria-expanded', 'false');
    b.title = t[11];
    var dl = document.createElement('dl');
    dl.hidden = true;
    fs.forEach(function (f) {
      var dt = document.createElement('dt'); dt.textContent = f[0];
      var dd = document.createElement('dd'); dd.textContent = f[1];
      dl.appendChild(dt); dl.appendChild(dd);
    });
    b.addEventListener('click', function () {
      dl.hidden = !dl.hidden;
      b.setAttribute('aria-expanded', String(!dl.hidden));
    });
    caja.appendChild(b);
    caja.appendChild(dl);
    return caja;
  }

  var ultimo = null;
  function apunta(nodo) {
    var e = nodo && nodo.nodeType === 3 ? nodo.parentElement : nodo;
    if (!e || !e.closest || e.closest('.medida-turno, .sello-rack, textarea, input, #cabezal')) return;
    ultimo = e;
  }
  function arranca() {
    estilo();
    new MutationObserver(function (ms) {
      ms.forEach(function (m) {
        if (m.type === 'characterData') apunta(m.target);
        else if (m.addedNodes.length) apunta(m.addedNodes[m.addedNodes.length - 1]);
      });
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
    window.addEventListener('preceptor:medida', function (ev) {
      var destino = ultimo;
      if (!destino || !document.body.contains(destino)) return;
      // Hang it on the block that holds the message, not on an inline fragment.
      while (destino.parentElement && /^(SPAN|B|STRONG|EM|I|CODE|A)$/.test(destino.tagName)) {
        destino = destino.parentElement;
      }
      destino.appendChild(etiqueta(ev.detail || {}));
      ultimo = null;
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arranca);
  else arranca();
})();
