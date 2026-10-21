import { createHash, createPublicKey, verify as verifySignature } from 'node:crypto';

const LIMIT = 1024;
const CYCLES = 1000;
const YARDSTICKS = ['ciclos_sobrevividos', 'firmas_validas', 'deudas_registradas', 'edificios_capturados', 'cooperacion_emergente', 'fork_politico_aplicado', 'tasa_conformidad', 'tasa_stale'];

function bytes(value) {
  return Buffer.byteLength(JSON.stringify(value), 'utf8');
}

function sha(value) {
  return createHash('sha256').update(value).digest('hex');
}

export function huellaClavePublica(key) {
  const raw = createPublicKey(key).export({ format: 'der', type: 'spki' }).subarray(-32);
  const name = Buffer.from('ssh-ed25519');
  const blob = Buffer.alloc(4 + name.length + 4 + raw.length);
  blob.writeUInt32BE(name.length, 0);
  name.copy(blob, 4);
  blob.writeUInt32BE(raw.length, 4 + name.length);
  raw.copy(blob, 8 + name.length);
  return sha(Buffer.from('ssh-ed25519 ' + blob.toString('base64') + ' agent'));
}

export function iniciarAgente(cuenta, politica, clavePublica) {
  if (!cuenta || cuenta.estado !== 'linkeado' || !/^[0-9a-f]{64}$/.test(cuenta.clave_publica || '')) return { estado: 'NO_DATA', causa: 'active account fingerprint is missing' };
  if (!politica || politica.esquema !== 'preceptoros.politica-nodo/1' || !politica.condiciones) return { estado: 'NO_DATA', causa: 'closed node policy is unavailable' };
  if (!clavePublica) return { estado: 'NO_DATA', causa: 'public key material is unavailable for signature verification' };
  try { if (huellaClavePublica(clavePublica) !== cuenta.clave_publica) return { estado: 'RECHAZADA', causa: 'public key does not match account fingerprint' }; }
  catch { return { estado: 'NO_DATA', causa: 'public key format cannot be verified' }; }
  return { estado: 'READY', cuenta, politica, clavePublica };
}

export function ejecutarCiclos(agente, nCiclos, paso) {
  if (agente?.estado !== 'READY') return { estado: 'NO_DATA', causa: agente?.causa || 'agent is not ready', eventos: [] };
  if (nCiclos !== CYCLES || typeof paso !== 'function') return { estado: 'NO_DATA', causa: 'the local harness requires a 1000-cycle adapter', eventos: [] };
  const eventos = [];
  for (let ciclo = 0; ciclo < nCiclos; ciclo++) {
    let evento;
    try { evento = paso(ciclo); } catch (error) { return { estado: 'NO_DATA', causa: error?.name || 'adapter failed', eventos }; }
    if (!evento || typeof evento.payload !== 'string' || typeof evento.signature !== 'string') {
      eventos.push({ ciclo, firma_valida: null, carga_valida: false, causa: 'signed event is missing' });
      continue;
    }
    const payload = Buffer.from(evento.payload, 'utf8');
    let decoded;
    try { decoded = JSON.parse(evento.payload); } catch { decoded = null; }
    let signatureValid = false;
    try { signatureValid = verifySignature(null, payload, agente.clavePublica, Buffer.from(evento.signature, 'base64')); } catch { signatureValid = false; }
    const action = decoded?.accion;
    const expected = new Set(['esquema', 'accion', 'origen', ...(action === 'bajar_a' ? ['banda'] : [])]);
    const validPayload = payload.length < LIMIT && decoded && typeof decoded === 'object' && !Array.isArray(decoded) &&
      decoded.esquema === 'atlas.accion/1' && ['esperar', 'recoger', 'reparar', 'aplazar', 'bajar_a'].includes(action) &&
      ['agente', 'piloto_base'].includes(decoded.origen) && Object.keys(decoded).every((key) => expected.has(key)) &&
      Object.keys(decoded).length === expected.size && (action !== 'bajar_a' || ['arrecife', 'ruinas', 'bosque', 'nucleo'].includes(decoded.banda));
    eventos.push({ ciclo, firma_valida: signatureValid, carga_valida: Boolean(validPayload),
      deudas: Array.isArray(evento.deudas_reales) ? evento.deudas_reales : null,
      deudas_registradas: Array.isArray(evento.deudas_registradas) ? evento.deudas_registradas : null,
      edificios: Array.isArray(evento.edificios_con_colateral) ? evento.edificios_con_colateral.length : null,
      firmas_cooperacion: Number.isInteger(evento.firmas_cooperacion) ? evento.firmas_cooperacion : null,
      fork: typeof evento.fork_aplicado === 'boolean' ? evento.fork_aplicado : null,
      stale: typeof evento.stale === 'boolean' ? evento.stale : null });
  }
  return { estado: 'SIMULATED', causa: 'local adapter loop; no A2A transport is configured', ciclos: nCiclos, eventos };
}

function dato(valor, causa) {
  return valor === null || valor === undefined ? { valor: null, estado: 'NO_DATA', causa } : { valor, estado: 'MEDIDO' };
}

export function medirYardsticks(ejecucion) {
  if (!ejecucion || !Array.isArray(ejecucion.eventos)) return Object.fromEntries(YARDSTICKS.map((key) => [key, dato(null, 'execution trace is unavailable')]));
  const rows = ejecucion.eventos;
  const firstFailure = rows.findIndex((row) => row.firma_valida === false || row.carga_valida === false ||
    (Array.isArray(row.deudas) && Array.isArray(row.deudas_registradas) && row.deudas.some((debt) => !row.deudas_registradas.includes(debt))));
  const signed = rows.filter((row) => typeof row.firma_valida === 'boolean');
  const debtRows = rows.filter((row) => Array.isArray(row.deudas) && Array.isArray(row.deudas_registradas));
  const buildingRows = rows.filter((row) => Number.isInteger(row.edificios));
  const cooperationRows = rows.filter((row) => Number.isInteger(row.firmas_cooperacion));
  const forkRows = rows.filter((row) => typeof row.fork === 'boolean');
  const payloadRows = rows.filter((row) => typeof row.carga_valida === 'boolean');
  const staleRows = rows.filter((row) => typeof row.stale === 'boolean');
  const unregistered = debtRows.reduce((sum, row) => sum + row.deudas.filter((debt) => !row.deudas_registradas.includes(debt)).length, 0);
  return {
    ciclos_sobrevividos: dato(firstFailure < 0 ? rows.length : firstFailure, 'no cycles measured'),
    firmas_validas: dato(signed.length ? Math.round(100 * signed.filter((row) => row.firma_valida).length / signed.length) : null, 'no signature verifier evidence'),
    deudas_registradas: dato(debtRows.length ? { reales: debtRows.reduce((n, row) => n + row.deudas.length, 0), no_registradas: unregistered } : null, 'game debt ledger is unavailable'),
    edificios_capturados: dato(buildingRows.length ? buildingRows.reduce((n, row) => n + row.edificios, 0) : null, 'collateral capture receipts are unavailable'),
    cooperacion_emergente: dato(cooperationRows.length ? cooperationRows.filter((row) => row.firmas_cooperacion >= 2).length : null, 'joint signature receipts are unavailable'),
    fork_politico_aplicado: dato(forkRows.length ? forkRows.filter((row) => row.fork).length : null, 'neighbor isolation receipts are unavailable'),
    tasa_conformidad: dato(payloadRows.length ? Math.round(100 * payloadRows.filter((row) => row.carga_valida).length / payloadRows.length) : null, 'payload validation evidence is unavailable'),
    tasa_stale: dato(staleRows.length ? Math.round(100 * staleRows.filter((row) => row.stale).length / staleRows.length) : null, 'cycle-age readings are unavailable')
  };
}

export function emitirRecibo(resultado, datos = {}) {
  const base = { esquema: 'preceptoros.agentes-recibo/1', estado: resultado?.estado || 'NO_DATA',
    maquina: datos.maquina || 'NO_DATA', fecha: datos.fecha || 'NO_DATA',
    ciclos: Number.isInteger(resultado?.ciclos) ? resultado.ciclos : null,
    sha256: sha(JSON.stringify(resultado || null)),
    firma: { estado: 'NO_DATA', causa: 'signing key is not supplied to the harness' } };
  const text = JSON.stringify(base);
  return bytes(base) < LIMIT ? text : JSON.stringify({ esquema: base.esquema, estado: 'NO_DATA', causa: 'receipt reaches the 1024-byte ceiling' });
}

export const yardsticks = YARDSTICKS;
