(function (root) {
  'use strict';
  var K = typeof module === 'object' && module.exports ? require('./canon.js') : root.AtlasCanon;
  var MAX_BYTES = 1024, HEX = /^[0-9a-f]{64}$/;
  var NODE = /^nodo\.[0-9]{1,6}\.[a-z0-9][a-z0-9-]{0,30}$/;
  var ARMOR = /^-----BEGIN SSH SIGNATURE-----\r?\n[A-Za-z0-9+/=\r\n]+\r?\n-----END SSH SIGNATURE-----\r?\n?$/;
  var STATES = ['solicitado', 'linkeado', 'revocado'];
  var SCOPE = ['memoria_compartida', 'conectar_ia', 'herramientas', 'aportar_datos'];
  var EXCLUDED = ['sha256', 'firma_ssh', 'firma', 'autenticidad'];
  var AUTHENTICITY = Object.freeze(['SIGNED', 'NO_DATA']);
  var MESSAGES = {
    en: { shape: 'Invalid credential fields.', size: 'The packet must be smaller than 1 KiB.', signature: 'Missing or malformed SSH signature.', authenticity: 'Unknown authenticity declaration.', integrity: 'Credential fingerprint mismatch.', pending: 'Signature verification is pending.' },
    es: { shape: 'Campos de la cédula inválidos.', size: 'El paquete debe ocupar menos de 1 KiB.', signature: 'Firma SSH ausente o mal formada.', authenticity: 'Declaración de autenticidad desconocida.', integrity: 'La huella de la cédula no coincide.', pending: 'La verificación de la firma está pendiente.' },
    fr: { shape: 'Champs du justificatif invalides.', size: 'Le paquet doit faire moins de 1 Kio.', signature: 'Signature SSH absente ou mal formée.', authenticity: 'Déclaration d’authenticité inconnue.', integrity: 'L’empreinte du justificatif ne correspond pas.', pending: 'La vérification de la signature est en attente.' },
    pt: { shape: 'Campos da cédula inválidos.', size: 'O pacote deve ocupar menos de 1 KiB.', signature: 'Assinatura SSH ausente ou malformada.', authenticity: 'Declaração de autenticidade desconhecida.', integrity: 'A impressão da cédula não corresponde.', pending: 'A verificação da assinatura está pendente.' },
    it: { shape: 'Campi della credenziale non validi.', size: 'Il pacchetto deve occupare meno di 1 KiB.', signature: 'Firma SSH assente o non valida nella forma.', authenticity: 'Dichiarazione di autenticità sconosciuta.', integrity: 'L’impronta della credenziale non corrisponde.', pending: 'La verifica della firma è in attesa.' },
    de: { shape: 'Ungültige Felder im Nachweis.', size: 'Das Paket muss kleiner als 1 KiB sein.', signature: 'SSH-Signatur fehlt oder ist falsch formatiert.', authenticity: 'Unbekannte Erklärung zur Echtheit.', integrity: 'Der Fingerabdruck des Nachweises stimmt nicht überein.', pending: 'Die Prüfung der Signatur steht noch aus.' },
    ru: { shape: 'Недопустимые поля удостоверения.', size: 'Пакет должен быть меньше 1 КиБ.', signature: 'Подпись SSH отсутствует или неверно оформлена.', authenticity: 'Неизвестное заявление о подлинности.', integrity: 'Отпечаток удостоверения не совпадает.', pending: 'Проверка подписи ещё не выполнена.' },
    el: { shape: 'Μη έγκυρα πεδία διαπιστευτηρίου.', size: 'Το πακέτο πρέπει να είναι μικρότερο από 1 KiB.', signature: 'Η υπογραφή SSH λείπει ή έχει λάθος μορφή.', authenticity: 'Άγνωστη δήλωση γνησιότητας.', integrity: 'Το αποτύπωμα του διαπιστευτηρίου δεν ταιριάζει.', pending: 'Εκκρεμεί η επαλήθευση της υπογραφής.' },
    ar: { shape: 'حقول وثيقة الهوية غير صالحة.', size: 'يجب أن يقل حجم الحزمة عن 1 KiB.', signature: 'توقيع SSH مفقود أو غير صحيح التنسيق.', authenticity: 'إقرار أصالة غير معروف.', integrity: 'بصمة وثيقة الهوية غير مطابقة.', pending: 'التحقق من التوقيع ما زال معلقاً.' }
  };
  Object.keys(MESSAGES).forEach(function (lang) { Object.freeze(MESSAGES[lang]); });
  Object.freeze(MESSAGES);

  function object(value) { return !!value && typeof value === 'object' && !Array.isArray(value); }
  function own(value, field) { return Object.prototype.hasOwnProperty.call(value, field); }
  function hex(value) { return typeof value === 'string' && value.length === 64 && HEX.test(value); }
  function keys(value, required, optional) {
    return object(value) && required.every(function (field) { return own(value, field); }) &&
      Object.keys(value).every(function (field) { return required.indexOf(field) >= 0 || optional.indexOf(field) >= 0; });
  }
  function result(code) {
    return Object.freeze({ valid: !code, code: code || 'pending', estado: code ? 'ERROR' : 'NO_DATA',
      autenticidad: 'NO_DATA', firma: null, authority: false });
  }
  function size(value) {
    try {
      var raw = JSON.stringify(value);
      return typeof raw === 'string' ? new TextEncoder().encode(raw).length : Infinity;
    } catch (error) { return Infinity; }
  }
  function declaration(value) {
    if (!object(value)) { return 'shape'; }
    if (typeof value.firma_ssh !== 'string' || !ARMOR.test(value.firma_ssh)) { return 'signature'; }
    if (own(value, 'firma') && value.firma !== null) { return 'signature'; }
    if (own(value, 'autenticidad') && AUTHENTICITY.indexOf(value.autenticidad) < 0) { return 'authenticity'; }
    return '';
  }
  function device(value) {
    if (!keys(value, ['clave', 'estado'], ['tipo', 'ambito', 'caduca']) || !hex(value.clave) || STATES.indexOf(value.estado) < 0) { return false; }
    if (!own(value, 'tipo')) { return !own(value, 'ambito') && !own(value, 'caduca'); }
    return value.tipo === 'agente' && Array.isArray(value.ambito) && value.ambito.length > 0 && value.ambito.length <= SCOPE.length &&
      value.ambito.every(function (scope, i, all) { return SCOPE.indexOf(scope) >= 0 && all.indexOf(scope) === i; }) &&
      typeof value.caduca === 'string' && value.caduca.length === 20 && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value.caduca);
  }
  function credential(value) {
    if (!keys(value, ['esquema', 'nodo', 'admin', 'dispositivos', 'plan_sha256', 'firma_ssh', 'sha256'], ['firma', 'autenticidad']) ||
        value.esquema !== 'preceptoros.cedula-nodo/1' || typeof value.nodo !== 'string' || value.nodo.trim() !== value.nodo || !NODE.test(value.nodo) ||
        !hex(value.admin) || !hex(value.plan_sha256) || !hex(value.sha256) || !Array.isArray(value.dispositivos) ||
        value.dispositivos.length > 128 || !Array.from(value.dispositivos).every(device)) { return result('shape'); }
    if (size(value) >= MAX_BYTES) { return result('size'); }
    if (new Set(value.dispositivos.map(function (item) { return item.clave; })).size !== value.dispositivos.length) { return result('shape'); }
    var error = declaration(value);
    if (error) { return result(error); }
    var body = {};
    Object.keys(value).forEach(function (field) { if (field !== 'sha256') { body[field] = value[field]; } });
    if (K.huella(body) !== value.sha256) { return result('integrity'); }
    return result('');
  }
  function packet(value) {
    if (!keys(value, ['esquema', 'pares', 'firma'], []) || value.esquema !== 'preceptoros/cedula-nodo/1' ||
        value.firma !== null || !Array.isArray(value.pares) || value.pares.length !== 1) { return result('shape'); }
    if (size(value) >= MAX_BYTES) { return result('size'); }
    return credential(value.pares[0]);
  }
  function read(raw) {
    if (typeof raw !== 'string' || !raw.length) { return result('shape'); }
    if (new TextEncoder().encode(raw).length >= MAX_BYTES) { return result('size'); }
    try { return packet(JSON.parse(raw)); } catch (error) { return result('shape'); }
  }
  function signedBody(value) {
    if (!object(value)) { return null; }
    var body = {};
    Object.keys(value).forEach(function (field) { if (EXCLUDED.indexOf(field) < 0) { body[field] = value[field]; } });
    return JSON.stringify(K.ordena(body));
  }
  function message(code, language) {
    var texts = own(MESSAGES, language) ? MESSAGES[language] : MESSAGES.en;
    return own(texts, code) ? texts[code] : texts.shape;
  }
  var api = Object.freeze({ ENDPOINT: 'https://api.preceptoros.org/api/v1/cedulas', METHOD: 'POST', MAX_BYTES: MAX_BYTES,
    AUTHENTICITY: AUTHENTICITY, credential: credential, packet: packet, read: read, declaration: declaration, signedBody: signedBody, message: message, MESSAGES: MESSAGES });
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  else { root.AtlasNodeReception = api; }
})(this);
