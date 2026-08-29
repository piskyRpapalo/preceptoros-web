/* preceptoros.org · el mismo filtro que el producto, en el navegador.
   GENERADO por herramientas/generar_sanitize.py desde `guardrails.py`. No se
   edita a mano: si la web sanea con reglas distintas a las del producto, quien
   pega el resultado confia en un filtro que no es el que se probo.

   Aqui NO hay NODE_PATH: los nombres de maquina los declara cada persona en su
   instalacion, y esta pagina no los conoce. Es un hueco declarado mas.

   El orden es el del producto: lo mas especifico primero, para que una
   politica ancha no se coma lo que otra iba a marcar mejor. */
window.SANITIZE_RULES = [
  { name: "PRIVATE_KEY", re: new RegExp("-----BEGIN(?: [A-Z]+)* PRIVATE KEY-----[\\s\\S]*?-----END(?: [A-Z]+)* PRIVATE KEY-----|-----BEGIN(?: [A-Z]+)* PRIVATE KEY-----.*", "g") },
  { name: "SSH_PUBLIC_KEY", re: new RegExp("\\b(?:ssh-(?:rsa|dss|ed25519)|ecdsa-sha2-nistp(?:256|384|521)|sk-ssh-ed25519@openssh\\.com|sk-ecdsa-sha2-nistp256@openssh\\.com)\\s+[A-Za-z0-9+/]{20,}={0,3}(?:[ \\t]+\\S+)?", "g") },
  { name: "API_KEY", re: new RegExp("(?<![A-Za-z])(?:api[_-]?key|access[_-]?token|auth[_-]?token|secret[_-]?key|bearer)(?:[_-][A-Za-z0-9]+)*\\b[\\\"'\\s:=]+[A-Za-z0-9._\\-]{16,}|\\bsk-[A-Za-z0-9_\\-]{16,}|\\bghp_[A-Za-z0-9]{16,}|\\bgithub_pat_[A-Za-z0-9_]{20,}|\\bxox[abprs]-[A-Za-z0-9\\-]{10,}|\\bAKIA[0-9A-Z]{12,}|\\bAIza[A-Za-z0-9_\\-]{20,}|\\bsk_(?:live|test)_[A-Za-z0-9]{16,}|\\brk_(?:live|test)_[A-Za-z0-9]{16,}|\\bSG\\.[A-Za-z0-9_\\-]{16,}\\.[A-Za-z0-9_\\-]{16,}|\\bSK[0-9a-f]{32}\\b|\\bAC[0-9a-f]{32}\\b|\\b(?:MT|NT|OT)[A-Za-z0-9_\\-]{22,}\\.[A-Za-z0-9_\\-]{6,}\\.[A-Za-z0-9_\\-]{25,}", "gi") },
  { name: "ASSIGNED_SECRET", re: new RegExp("(?<![A-Za-z])(?:password|passwd|pwd|passphrase|secret|credential)s?(?:[_-][A-Za-z0-9]+)*\\b(?:(?:\\s+[A-Za-z]{1,12}){0,3}[\\s\\\"']*[:=][\\s\\\"']*\\S{6,}|\\s+(?:(?=\\S{6,})\\S*(?:\\d|[^\\w\\s])\\S*|[^\\W\\d_]{12,}))|\\b[a-z][a-z0-9+.\\-]*://[^\\s/@:]*:[^\\s/@]+@|\\beyJ[A-Za-z0-9_\\-]{8,}\\.[A-Za-z0-9_\\-]{8,}\\.[A-Za-z0-9_\\-]{6,}", "gi") },
  { name: "PRIVATE_IP", re: new RegExp("\\b(?:10(?:\\.\\d{1,3}){3}|172\\.(?:1[6-9]|2\\d|3[01])(?:\\.\\d{1,3}){2}|192\\.168(?:\\.\\d{1,3}){2}|100\\.(?:6[4-9]|[7-9]\\d|1[01]\\d|12[0-7])(?:\\.\\d{1,3}){2}|169\\.254(?:\\.\\d{1,3}){2})\\b|\\bf[cd][0-9a-f]{2}:[0-9a-f:]{4,}|\\bfe80::[0-9a-f:]{2,}", "g") },
  { name: "HOME_PATH", re: new RegExp("(?<![\\w.])/(?:home|mnt|srv|opt|var|media)/[^\\s\\\"'<>|;,()\\[\\]:]+", "g") }
];
window.sanitize = function (texto) {
  var hallazgos = {};
  window.SANITIZE_RULES.forEach(function (r) {
    texto = texto.replace(r.re, function () {
      hallazgos[r.name] = (hallazgos[r.name] || 0) + 1;
      return "[REDACTED:" + r.name + "]";
    });
  });
  return { texto: texto, hallazgos: hallazgos };
};
