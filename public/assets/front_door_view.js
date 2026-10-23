(function (root) {
  'use strict';
  var SCRIPTS = ['/game/tabla_semantica.js', '/game/comic_tokens.js', '/game/comic_accents.js', '/game/comic_atoms.js',
    '/game/valores.js', '/game/gacha.js', '/game/bubble_language.js', '/game/bubble_light.js', '/game/bubble_bestiary.js',
    '/game/bubble_editor.js', '/game/bubble_paint.js', '/game/aiact-art50-state-radio.js', '/game/descent_sound.js',
    '/game/world_creator.js', '/game/front_door.js'];
  function load(loader, filter, panel, actions) {
    if (!document.querySelector('link[href="/assets/front_door.css"]')) {
      var css = document.createElement('link'); css.rel = 'stylesheet'; css.href = '/assets/front_door.css'; document.head.appendChild(css);
    }
    return loader(filter(SCRIPTS.map(function (src) { return [src]; }))).then(function () { return mount(panel, actions); });
  }
  function mount(panel, actions) {
    actions = actions || {};
    var doc = panel.ownerDocument, F = root.AtlasFrontDoor, K = root.AtlasComicTokens.FRONT_DOOR;
    var audio = null, destroyed = false, soundOn = false;
    function node(tag, name, text) { var n = doc.createElement(tag); if (name) n.className = name; if (text != null) n.textContent = text; return n; }
    function canvas(frames, name) {
      var size = frames[0].cv, c = node('canvas', name), scale = Math.max(1, Math.min(3, root.devicePixelRatio || 1));
      c.width = size[0] * scale; c.height = size[1] * scale;
      c.style.aspectRatio = size[0] + '/' + size[1]; c.setAttribute('aria-hidden', 'true');
      var ctx = c.getContext('2d'); ctx.setTransform(scale,0,0,scale,0,0);
      frames.forEach(function (frame) { root.AtlasComicAtoms.paint(ctx, F.project(frame)); });
      return c;
    }
    function stop() {
      if (audio) { Promise.resolve(audio.close()).catch(function () {}); audio = null; }
    }
    function destroy() { destroyed = true; stop(); }
    var page = node('section', 'front-door'); page.setAttribute('aria-label', F.COPY.title);
    [['ink','ink'],['paper','paper'],['green','LIVE.base'],['amber','PROPUESTA.base'],['indigo','FIRMADO.base'],['cyan','cyan'],['muted','NO_DATA.base']].forEach(function (pair) { page.style.setProperty('--front-' + pair[0], K[pair[1]]); });
    var copy = node('div', 'front-door-copy'), heading = node('header','front-door-heading');
    heading.appendChild(node('p','front-door-eyebrow','THE GAME · ON THIS DEVICE'));
    heading.appendChild(node('h1','front-door-sr',F.COPY.title));
    heading.appendChild(canvas(F.heading(),'front-door-title'));
    copy.appendChild(heading);
    var lead = node('p','front-door-lead'); lead.appendChild(node('span','front-door-sr',F.COPY.lead));
    lead.appendChild(canvas(F.paragraph('lead'),'front-door-prose')); copy.appendChild(lead);
    var buttons = node('div','front-door-actions'); buttons.setAttribute('role','group'); buttons.setAttribute('aria-label','Choose your next step');
    var questionPanel = node('section','front-door-questions'); questionPanel.id = 'front-door-questions'; questionPanel.hidden = true;
    questionPanel.setAttribute('aria-label','Questions on this device');
    var status = node('p','front-door-status',F.COPY.silent); status.setAttribute('role','status'); status.setAttribute('aria-live','polite');
    F.ACTIONS.forEach(function (action) {
      var b = node('button','front-door-action' + (action.id === 'explore' ? ' descent-skip' : ''));
      b.type = 'button'; b.setAttribute('data-front-action',action.id); b.setAttribute('aria-label',action.label);
      b.appendChild(node('span','front-door-sr',action.label)); b.appendChild(canvas(F.button(action.id),'front-door-button-art'));
      if (action.id === 'questions') { b.setAttribute('aria-expanded','false'); b.setAttribute('aria-controls',questionPanel.id); }
      b.addEventListener('click',function () {
        if (destroyed) return;
        if (action.id === 'questions') {
          questionPanel.hidden = !questionPanel.hidden; b.setAttribute('aria-expanded',String(!questionPanel.hidden));
          if (!questionPanel.hidden && !questionPanel.firstChild) {
            questionPanel.appendChild(node('h2',null,'Questions???'));
            questionPanel.appendChild(node('p',null,F.COPY.questions));
            if (root.AtlasWorldCreator) questionPanel.appendChild(root.AtlasWorldCreator.panel(doc));
            else questionPanel.appendChild(node('p',null,'NO_DATA · local lore is unavailable on this device.'));
          }
          if (!questionPanel.hidden) { var input = questionPanel.querySelector('input'); if (input) input.focus(); }
        } else if (action.id === 'key') {
          if (!root.Identity || typeof root.Identity.crear !== 'function') { status.textContent = 'NO_DATA · device key creation is unavailable.'; return; }
          b.disabled = true; status.textContent = 'Preparing the local device key.';
          Promise.resolve().then(function () { return root.Identity.crear(); }).then(function () {
            if (!destroyed) status.textContent = 'The device key is ready. Nothing was published.';
          },function () { if (!destroyed) status.textContent = 'NO_DATA · the device key was not created.'; }).finally(function () { b.disabled = false; });
        } else {
          var callback = action.id === 'tutorial' ? actions.tutorial : actions.explore;
          if (typeof callback === 'function') { destroy(); callback(); }
          else status.textContent = 'NO_DATA · this action is unavailable on this device.';
        }
      });
      buttons.appendChild(b);
    });
    copy.appendChild(buttons);
    var soundRow = node('div','front-door-sound'), label = node('label'), toggle = node('input');
    toggle.type = 'checkbox'; toggle.setAttribute('aria-label',F.COPY.sound); label.appendChild(toggle); label.appendChild(node('span',null,F.COPY.sound)); soundRow.appendChild(label);
    toggle.addEventListener('change',function () {
      soundOn = toggle.checked;
      if (!soundOn) { stop(); status.textContent = F.COPY.silent; return; }
      var C = root.AudioContext || root.webkitAudioContext;
      if (!C) { toggle.checked = false; soundOn = false; status.textContent = 'NO_DATA · this device has no local audio.'; return; }
      audio = audio || new C();
      Promise.resolve(audio.resume ? audio.resume() : null).then(function () {
        if (destroyed || !soundOn || !audio) return;
        var score = F.sonar(F.art()[0]); root.AtlasDescentSound.play(audio,score.voices,audio.currentTime);
        status.textContent = 'A low sonar pulse follows the same line drawn across the water.';
      }).catch(function () { stop(); toggle.checked = false; soundOn = false; status.textContent = 'NO_DATA · audio could not start on this device.'; });
    });
    soundRow.appendChild(status); copy.appendChild(soundRow);
    var details = node('details','front-door-details'); details.appendChild(node('summary',null,'Your choice, your device'));
    ['goal','rule','key'].forEach(function (key) { details.appendChild(node('p',null,F.COPY[key])); });
    var measured = node('details','front-door-measures'); measured.appendChild(node('summary',null,'What is drawn'));
    var lines = F.art(), list = node('ol');
    lines.forEach(function (frame) { list.appendChild(node('li',null,frame.id + ' · ' + frame.atoms[0].r + ' · STATIC · ' + new TextEncoder().encode(JSON.stringify(frame)).length + ' B')); });
    measured.appendChild(list); details.appendChild(measured); copy.appendChild(details);
    var figure = node('figure','front-door-figure'); figure.appendChild(canvas(lines,'front-door-art descent-art'));
    figure.appendChild(node('figcaption','front-door-sr',F.COPY.art));
    page.appendChild(copy); page.appendChild(figure); page.appendChild(questionPanel);
    panel.textContent = ''; panel.appendChild(page);
    return Object.freeze({ destroy: destroy, frames: function () { return F.art(); }, element: page });
  }
  root.AtlasFrontDoorView = Object.freeze({ mount: mount, load: load });
})(window);
