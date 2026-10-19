// VT9 · chat y ecos conectados: un estado, dos registros, el mismo sello de origen.
// El chat del creador (public/game/world_creator.js) deja cada respuesta como eco en RAM;
// el canal Echoes de la radio (public/assets/radio_message_log.js) pinta ESE objeto, no una copia.
//   node atlas/ecos_casos.mjs -> [{caso, ok, detalle}]
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const leer = (r) => readFileSync(new URL('../' + r, import.meta.url), 'utf8');
const CHAT = leer('public/game/world_creator.js');
const RADIO = leer('public/assets/radio_message_log.js');
const AUDIO = leer('public/game/audio_feedback_manager.js');

function element(tag) {
  return { tagName: tag, dataset: {}, children: [], style: {}, attrs: {}, events: {}, _text: '', hidden: false, id: '', className: '',
    classList: { contains() { return true; }, toggle() {} },
    setAttribute(k, v) { this.attrs[k] = String(v); }, addEventListener(k, f) { this.events[k] = f; }, focus() {}, contains() { return false; },
    appendChild(c) { this.children.push(c); return c; },
    removeChild(c) { this.children = this.children.filter((x) => x !== c); return c; },
    get firstChild() { return this.children[0] || null; },
    get textContent() { return this._text + this.children.map((x) => x.textContent).join(''); },
    set textContent(v) { this._text = String(v); this.children = []; } };
}
const busca = (n, f, out = []) => { if (f(n)) out.push(n); (n.children || []).forEach((c) => busca(c, f, out)); return out; };

function mundo({ conChat = true } = {}) {
  const context = { document: { createElement: element, addEventListener() {} }, MutationObserver: class { observe() {} } };
  vm.createContext(context);
  context.self = context;
  vm.runInContext(AUDIO, context);
  if (conChat) vm.runInContext(CHAT, context);
  vm.runInContext(RADIO, context);
  const capa = element('main');
  context.AtlasRadioChat.monta(capa, {});
  const tabs = busca(capa, (n) => n.attrs.role === 'tab');
  const ecos = busca(capa, (n) => n.id === 'radio-chat-ecos')[0];
  const nd = busca(capa, (n) => n.id === 'radio-chat-no-data')[0];
  return { context, W: context.AtlasWorldCreator, tabs, ecos, nd };
}

const casos = [];
const caso = (n, f) => { let r; try { r = f(); } catch (e) { r = 'excepcion: ' + e.message; } casos.push({ caso: n, ok: r === true, detalle: r === true ? '' : JSON.stringify(r) }); };

caso('valido: una pregunta, dos registros, el mismo sello de origen', () => {
  const m = mundo();
  const panel = m.W.panel(m.context.document);
  const input = busca(panel, (n) => n.id === 'world-chat-q')[0], form = busca(panel, (n) => n.tagName === 'form')[0];
  input.value = 'Who is the world creator?';
  form.events.submit({ preventDefault() {} });
  const e = m.W.echoes()[0];
  const sello = busca(panel, (n) => n.className === 'world-chat-stamp')[0];
  m.tabs[0].events.click();
  const li = m.ecos.children[0];
  const ok = e && e.seal === 'MEDIDO' && sello.textContent === e.seal && !m.ecos.hidden && m.nd.hidden &&
    li.dataset.sello === e.seal && li.textContent.includes(e.text) && li.textContent.includes(e.sound.texto);
  return ok || { e: e && e.seal, chat: sello && sello.textContent, eco: li && li.dataset.sello, oculto: m.ecos.hidden };
});
caso('sin preguntas no hay eco: el canal sigue en NO_DATA con su causa', () => {
  const m = mundo();
  m.tabs[0].events.click();
  return (m.ecos.hidden && !m.nd.hidden && /NO_DATA.*Echoes.*measured/.test(m.nd.textContent)) || m.nd.textContent;
});
caso('sin el chat cargado, la radio no se rompe y dice NO_DATA', () => {
  const m = mundo({ conChat: false });
  m.tabs[0].events.click();
  return (m.ecos.hidden && /NO_DATA/.test(m.nd.textContent)) || m.nd.textContent;
});
caso('un NO_DATA del chat llega al eco como NO_DATA con su causa (el eco no sube el sello)', () => {
  const m = mundo();
  const e = m.W.echo(m.W.ask('price of coffee in Lisbon'));
  m.tabs[0].events.click();
  const li = m.ecos.children[0];
  return (e.seal === 'NO_DATA' && li.dataset.sello === 'NO_DATA' && li.textContent.includes(e.cause)) || li.dataset.sello;
});
caso('el eco es el mismo objeto que respondio el chat, no una copia que pueda divergir', () => {
  const m = mundo();
  const e = m.W.echo(m.W.ask('What is the Rift?'));
  return m.W.echoes()[0] === e || 'copia';
});
caso('los ecos viven en RAM y con tope: 20 como mucho, sin almacen ni red', () => {
  const m = mundo();
  for (let i = 0; i < 25; i++) m.W.echo(m.W.ask('What is the Rift?'));
  const puro = !/localStorage|sessionStorage|indexedDB|fetch\s*\(|XMLHttpRequest|WebSocket/.test(CHAT + RADIO);
  return (m.W.echoes().length === 20 && puro) || { n: m.W.echoes().length, puro };
});
caso('el canal de ecos se oye: la voz gemela de la respuesta viaja en el eco', () => {
  const m = mundo();
  const e = m.W.echo(m.W.ask('Who is the world creator?'));
  m.tabs[0].events.click();
  return (Boolean(e.sound && e.sound.texto) && m.ecos.children[0].textContent.includes(e.sound.texto)) || 'sin voz';
});

console.log(JSON.stringify(casos, null, 1));
process.exitCode = casos.every((c) => c.ok) ? 0 : 1;
