/* PreceptorOS Mini · shared deterministic router (Android + opt-in browser).
 * This is NOT an LLM. Android may call its separately verified local JNI
 * model. Browser mode is opt-in, never grants rack authority or uses tools.
 * No network, credentials, remote execution, or automatic submissions.
 */
(function (root) {
  'use strict';
  const contract = 'preceptoros.offline-mini/1';
  const commands = Object.freeze({
    chat: 'tab-conversacion', documents: 'tab-documentos',
    lab: 'tab-lab', node: 'tab-ajustes',
  });
  function parse(raw) {
    // Reject BEFORE recognizing any intent. Truncating and parsing a prefix
    // can turn an oversized/untrusted message into a valid navigation.
    const text = String(raw || '').trim();
    const utf8Size = typeof TextEncoder === 'function'
      ? new TextEncoder().encode(text).byteLength : null;
    if (utf8Size === null) {
      return { source: 'rules', state: 'NO_DATA', cause: 'utf8_measurement_unavailable',
        text: 'NO_DATA(utf8_measurement_unavailable). No intent was accepted.' };
    }
    if (text.length > 600 || utf8Size > 1023) {
      return { source: 'rules', state: 'NO_DATA', cause: 'input_oversize',
        text: 'NO_DATA(mini_input_oversize). Limit: 600 characters and 1023 UTF-8 bytes. Shorten your message; nothing was executed.' };
    }
    const s = text.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const nav = /^(?:abre|abrir|ir a|ve a|open|go to|muestra|show)\s+(?:el |la |mis |my )?(chat|talk|conversacion|documents|documentos|docs|lab|laboratorio|laboratory|my node|mi nodo|nodo)\b/.exec(s);
    if (nav) {
      const word = nav[1];
      return { source: 'rules', state: 'DRAFT_ONLY', cause: 'local_navigation_only',
        action: /talk|chat|conversacion/.test(word) ? 'chat' :
          /documents|documentos|docs/.test(word) ? 'documents' :
          /lab|laboratorio|laboratory/.test(word) ? 'lab' : 'node',
        text: 'Local navigation only. No node task was run.' };
    }
    if (/^(?:hola|hello|hi|ola|buenas|hey)\b/.test(s)) {
      return { source: 'rules', state: 'DRAFT_ONLY', cause: 'local_greeting',
        text: 'Hola. Soy MINI-LOCAL, el primer router offline de PreceptorOS. Puedo abrir Chat, Documents, Lab, My node y el editor de planes. No soy todavía una IA generativa verificada.' };
    }
    if (/^(?:\/?(?:ayuda|help|comandos|commands)|que puedes hacer|what can you do)\b/.test(s)) {
      return { source: 'rules', state: 'DRAFT_ONLY', cause: 'local_help',
        text: 'Offline: «abre documentos», «abre lab», «mi nodo», «escribe un plan», «estado». Los planes se guardan solo si tú pulsas guardar. Ejecución remota, envío de nodos y memoria del rack: NO_DATA.' };
    }
    if (/^(?:\/?(?:estado|status|offline)|sin conexion|sin internet|estamos offline)\b/.test(s)) {
      return { source: 'rules', state: 'DRAFT_ONLY', cause: 'local_status',
        text: 'MINI-LOCAL · router del dispositivo disponible. No requiere internet. Modelo generativo: solo con un runtime local verificado. Rack, identidad remota y herramientas: NO_DATA(no_backend_in_mini).' };
    }
    if (/^(?:\/?plan|escribe un plan|write a plan|crear plan|crea un plan)\b/.test(s)) {
      return { source: 'rules', state: 'DRAFT_ONLY', cause: 'plan_editor_opened',
        action: 'plan',
        text: 'Editor de planes abierto en este dispositivo. No se guarda ni ejecuta nada sin tu gesto.' };
    }
    if (/^(?:mi nodo|my node|nodo local)\b/.test(s)) {
      return { source: 'rules', state: 'NO_DATA', cause: 'node_deployment_not_available',
        action: 'node',
        text: 'My node abierto. Puedes preparar declaraciones, pero esta APK no despliega ni firma nodos. NO_DATA(node_deployment_E2E).' };
    }
    if (/^(?:\/?modelos?|\/?brain|cerebro|modelo local)\b/.test(s)) {
      return { source: 'rules', state: 'NO_DATA', cause: 'model_inference_not_checked',
        text: 'El modelo no se declara listo hasta medir inferencia real. Prueba una pregunta libre; no se inventará una respuesta.' };
    }
    if (/^(?:\/?ejecuta|\/?escribe\s+@|\/?deploy|firma|grant|run command)\b/.test(s)) {
      return { source: 'rules', state: 'NO_DATA', cause: 'remote_effect_not_authorized',
        text: 'NO_DATA(remote_execution_not_available). El teléfono no ejecuta órdenes del rack ni firma concesiones.' };
    }
    return { source: 'model', state: 'NO_DATA', cause: 'on_device_model_unverified',
      text: 'NO_DATA(on_device_model_unavailable). El router local no inventa una respuesta generativa.' };
  }
  function mount() {
    const form = document.getElementById('form-chat');
    const input = document.getElementById('dicho');
    const thread = document.getElementById('hilo');
    const panel = document.getElementById('panel-conversacion');
    if (!form || !input || !thread || !panel || form.dataset.miniMounted) return;
    form.dataset.miniMounted = '1';
    const status = document.createElement('p');
    status.id = 'offline-mini-status';
    status.className = 'pie';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.dataset.state = 'DRAFT_ONLY';
    status.dataset.acho = 'DRAFT_ONLY';
    status.dataset.source = contract;
    status.textContent = 'MINI-LOCAL · deterministic router, NOT Hexelion · no remote effects · generative model: not verified';
    const native = root.PreceptorAndroidMiniModel;
    // On public/desktop browsers mini is explicit opt-in; it must never
    // silently capture a configured Chat session or the private rack.
    status.hidden = !native;
    const cabin = document.getElementById('cabina-brain');
    if (cabin && cabin.parentNode === panel) cabin.insertAdjacentElement('afterend', status);
    else panel.prepend(status);
    const append = (who, value, state, cause, source) => {
      const row = document.createElement('li');
      row.className = who === 'You' ? 'mio' : 'hilo-msg';
      row.dataset.state = state;
      row.dataset.acho = state;
      row.dataset.cause = cause;
      row.dataset.source = source;
      const name = document.createElement('strong');
      name.className = 'quien';
      name.textContent = who === 'You' ? 'You · ' : who;
      const message = document.createElement('span');
      message.textContent = value;
      row.append(name, message);
      thread.append(row);
      while (thread.childElementCount > 36) thread.firstElementChild.remove();
      thread.scrollTop = thread.scrollHeight;
    };
    form.addEventListener('submit', (event) => {
      // Android uses the on-device bridge; the browser needs an explicit
      // toggle and a personal profile. Neither state is an auth credential.
      if (!native && (root.PreceptorMiniBrowserEnabled !== true ||
          root.PreceptorProfile === 'private_rack')) return;
      event.preventDefault();
      event.stopImmediatePropagation(); // mini never reaches /api/charla
      const text = String(input.value || '').trim();
      if (!text) return;
      const result = parse(text);
      if (result.cause === 'input_oversize' || result.cause === 'utf8_measurement_unavailable') {
        // Preserve the input for correction. Never add the unbounded payload
        // to the visual/audio thread or pass it to the model.
        append('MINI-LOCAL', result.text, result.state, result.cause, contract);
        status.textContent = 'MINI-LOCAL · NO_DATA · input not accepted';
        status.dataset.state = status.dataset.acho = 'NO_DATA';
        status.dataset.cause = result.cause;
        input.focus();
        return;
      }
      input.value = '';
      append('You', text, 'DRAFT_ONLY', 'local_input', contract);
      if (result.action === 'plan') {
        const details = document.getElementById('plan-escribir');
        if (details) { details.open = true; details.querySelector('input,textarea')?.focus(); }
      } else if (result.action && commands[result.action]) {
        document.getElementById(commands[result.action])?.click();
      }
      let answer = result.text, state = result.state, source = contract, cause = result.cause;
      if (result.source === 'model' && native && typeof native.generate === 'function') {
        try {
          const generated = String(native.generate(text) || '').trim();
          if (generated && !generated.startsWith('NO_DATA(') && generated.length <= 4000) {
            answer = generated; state = 'DRAFT_ONLY';
            source = 'smollm2_135m_on_device'; cause = 'generated_unverified_facts';
          } else {
            answer = 'NO_DATA(local_model_runtime): ' + (generated || 'no output');
          }
        } catch (_) {
          answer = 'NO_DATA(local_model_runtime_error). El router sigue disponible.';
        }
      }
      append('MINI-LOCAL', answer, state, cause, source);
      status.textContent = 'MINI-LOCAL · ' + (source === contract ? 'deterministic router' : 'on-device model output') +
        ' · ' + state + ' · never a remote receipt';
      status.dataset.state = state;
      status.dataset.acho = state;
      status.dataset.cause = cause;
      input.focus();
    }, true);
  }
  const exported = Object.freeze({ schema: contract, parse, mount });
  root.PreceptorOfflineMini = exported;
  if (typeof module !== 'undefined' && module.exports) module.exports = exported;
  if (root.document) mount();
})(typeof window === 'undefined' ? globalThis : window);
