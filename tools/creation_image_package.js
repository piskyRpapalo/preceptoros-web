(function (root) {
  'use strict';
  const SCHEMA = 'preceptoros.creation.image/1';
  const PACKAGE_MAX = 25 * 1024 * 1024;
  const IMAGE_MAX = 8 * 1024 * 1024;
  const AUDIO_MAX = 8 * 1024 * 1024;
  const WIDTH_MAX = 2048;
  const HEIGHT_MAX = 2048;
  const PIXELS_MAX = 4 * 1024 * 1024;
  const FILES = ['image.png', 'declaration.wav'];
  const enc = new TextEncoder();
  const dec = new TextDecoder('utf-8', { fatal: true });
  const PNG = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function fail(cause) { throw new Error('NO_DATA · ' + cause); }
  function exact(value, keys, label) {
    if (!value || typeof value !== 'object' || Array.isArray(value) ||
        Object.keys(value).sort().join('|') !== keys.slice().sort().join('|')) fail(label + ' fields');
  }
  function text(value, max, label) {
    if (typeof value !== 'string' || !value.trim() || enc.encode(value).length > max) fail(label + ' text');
    return value;
  }
  function bytes(value) { return typeof value === 'string' ? enc.encode(value) : new Uint8Array(value); }
  function hex(value, length, label) {
    if (typeof value !== 'string' || value.length !== length || !/^[0-9a-f]+$/.test(value)) fail(label + ' hex');
  }
  function encode(value) {
    let out = ''; const data = bytes(value);
    for (let i = 0; i < data.length; i += 8192) out += String.fromCharCode(...data.subarray(i, i + 8192));
    return btoa(out);
  }
  function decode(value) {
    if (typeof value !== 'string' || value.length > PACKAGE_MAX || value.length % 4 ||
        !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) fail('base64 encoding');
    const out = Uint8Array.from(atob(value), c => c.charCodeAt(0));
    if (encode(out) !== value) fail('base64 padding');
    return out;
  }
  async function sha256(value) {
    const digest = await crypto.subtle.digest('SHA-256', bytes(value));
    return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
  }
  function pngHeader(value) {
    const data = bytes(value);
    if (data.length < 33 || data.length > IMAGE_MAX || !PNG.every((b, i) => data[i] === b) ||
        String.fromCharCode(...data.subarray(12, 16)) !== 'IHDR') fail('PNG signature or IHDR');
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    const width = view.getUint32(16, false), height = view.getUint32(20, false);
    if (view.getUint32(8, false) !== 13 || !width || !height || width > WIDTH_MAX || height > HEIGHT_MAX ||
        width * height > PIXELS_MAX || ![0, 2, 3, 4, 6].includes(data[25]) ||
        ![1, 2, 4, 8, 16].includes(data[24]) || data[26] !== 0 || data[27] !== 0 || data[28] > 1) {
      fail('PNG dimensions or encoding');
    }
    return { width, height };
  }
  function wav(value) {
    const data = bytes(value);
    if (data.length < 46 || data.length > AUDIO_MAX) fail('WAV length');
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    const tag = n => String.fromCharCode(...data.subarray(n, n + 4));
    const rate = view.getUint32(24, true), size = view.getUint32(40, true);
    if (tag(0) !== 'RIFF' || tag(8) !== 'WAVE' || tag(12) !== 'fmt ' || tag(36) !== 'data' ||
        view.getUint32(4, true) !== data.length - 8 || view.getUint32(16, true) !== 16 ||
        view.getUint16(20, true) !== 1 || view.getUint16(22, true) !== 1 || rate < 8000 || rate > 96000 ||
        view.getUint32(28, true) !== rate * 2 || view.getUint16(32, true) !== 2 ||
        view.getUint16(34, true) !== 16 || size !== data.length - 44 || size < 2 || size % 2) fail('WAV PCM16 mono format');
    return data;
  }
  function provenance(value) {
    exact(value, ['model_sha256', 'prompt_sha256', 'parameters', 'seed'], 'provenance');
    hex(value.model_sha256, 64, 'model digest');
    hex(value.prompt_sha256, 64, 'prompt digest');
    if (!value.parameters || typeof value.parameters !== 'object' || Array.isArray(value.parameters) ||
        enc.encode(JSON.stringify(value.parameters)).length > 4096) fail('generation parameters');
    if (value.seed !== null && !(typeof value.seed === 'string' && value.seed.length <= 128) &&
        !(Number.isSafeInteger(value.seed) && value.seed >= 0)) fail('generation seed');
  }
  function manifest(raw) {
    text(raw, 16384, 'manifest');
    const m = JSON.parse(raw);
    exact(m, ['schema', 'author', 'description', 'voice_profile', 'provenance', 'files'], 'manifest');
    if (m.schema !== SCHEMA) fail('manifest schema');
    text(m.author, 256, 'author'); text(m.description, 4096, 'description');
    hex(m.voice_profile, 64, 'voice profile'); provenance(m.provenance);
    if (!Array.isArray(m.files) || m.files.length !== FILES.length) fail('file inventory');
    m.files.forEach((f, i) => {
      exact(f, ['name', 'size', 'sha256'], 'file');
      const limit = i === 0 ? IMAGE_MAX : AUDIO_MAX;
      if (f.name !== FILES[i] || !Number.isSafeInteger(f.size) || f.size < 1 || f.size > limit) fail('file descriptor');
      hex(f.sha256, 64, 'file digest');
    });
    return m;
  }
  async function verify(raw) {
    if (typeof raw !== 'string') raw = dec.decode(bytes(raw));
    if (enc.encode(raw).length > PACKAGE_MAX) fail('package byte limit');
    const p = JSON.parse(raw);
    exact(p, ['schema', 'manifest', 'public_key', 'signature', 'files'], 'package');
    if (p.schema !== SCHEMA) fail('package schema');
    const m = manifest(p.manifest); exact(p.files, FILES, 'files');
    hex(p.public_key, 64, 'public key'); hex(p.signature, 128, 'signature');
    const payloads = FILES.map(n => decode(p.files[n]));
    for (let i = 0; i < payloads.length; i++) {
      if (payloads[i].length !== m.files[i].size || await sha256(payloads[i]) !== m.files[i].sha256) fail('file hash or size');
    }
    const dimensions = pngHeader(payloads[0]); wav(payloads[1]);
    if (typeof createImageBitmap !== 'function' || typeof Blob !== 'function') fail('PNG decoder unavailable');
    let bitmap;
    try {
      bitmap = await createImageBitmap(new Blob([payloads[0]], { type: 'image/png' }));
      if (bitmap.width !== dimensions.width || bitmap.height !== dimensions.height) fail('PNG decoded dimensions');
    } catch (error) {
      if (error && /^NO_DATA/.test(error.message || '')) throw error;
      fail('PNG decode');
    } finally { if (bitmap && typeof bitmap.close === 'function') bitmap.close(); }
    const key = await crypto.subtle.importKey('raw', Uint8Array.from(p.public_key.match(/../g), h => parseInt(h, 16)), 'Ed25519', false, ['verify']);
    const signature = Uint8Array.from(p.signature.match(/../g), h => parseInt(h, 16));
    if (!await crypto.subtle.verify('Ed25519', key, signature, enc.encode(p.manifest))) fail('author signature');
    return { id: await sha256(p.manifest), manifest: m, image: payloads[0], audio: payloads[1], dimensions, package: p };
  }
  async function prepare(input) {
    const image = bytes(input.image), audio = wav(input.audio), dimensions = pngHeader(image);
    if (typeof createImageBitmap !== 'function' || typeof Blob !== 'function') fail('PNG decoder unavailable');
    let bitmap;
    try {
      bitmap = await createImageBitmap(new Blob([image], { type: 'image/png' }));
      if (bitmap.width !== dimensions.width || bitmap.height !== dimensions.height) fail('PNG decoded dimensions');
    } catch (error) {
      if (error && /^NO_DATA/.test(error.message || '')) throw error;
      fail('PNG decode');
    } finally { if (bitmap && typeof bitmap.close === 'function') bitmap.close(); }
    provenance(input.provenance);
    const payloads = [image, audio], files = {}, entries = [];
    for (let i = 0; i < FILES.length; i++) {
      files[FILES[i]] = encode(payloads[i]);
      entries.push({ name: FILES[i], size: payloads[i].length, sha256: await sha256(payloads[i]) });
    }
    const raw = JSON.stringify({ schema: SCHEMA, author: input.author, description: input.description,
      voice_profile: input.voice_profile, provenance: input.provenance, files: entries });
    manifest(raw);
    const envelope = { schema: SCHEMA, manifest: raw, public_key: '0'.repeat(64), signature: '0'.repeat(128), files };
    if (enc.encode(JSON.stringify(envelope)).length > PACKAGE_MAX) fail('package byte limit');
    return { manifest: raw, files };
  }
  async function finish(prepared, publicKey, signature) {
    const packed = { schema: SCHEMA, manifest: prepared.manifest, public_key: publicKey, signature, files: prepared.files };
    await verify(JSON.stringify(packed));
    return packed;
  }
  const api = Object.freeze({ SCHEMA, PACKAGE_MAX, IMAGE_MAX, AUDIO_MAX, WIDTH_MAX, HEIGHT_MAX, PIXELS_MAX,
    prepare, finish, verify, sha256, encode, decode, pngHeader, wav, manifest, bytes });
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CreationImagePackage = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
