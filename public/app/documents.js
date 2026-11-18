/* Documents panel · browser-only document management.
 *
 * Reuses companion_onboarding.js pattern: no network, no persistent storage
 * until explicit consent. Documents stay local until the user explicitly
 * shares them.
 *
 * Document states:
 *   - editing: in memory, not saved yet
 *   - saved: persistent in localStorage
 *   - published: explicit action with receipt (future, not yet functional)
 *
 * Public API
 * ----------
 * mount(document)     → wires the UI (browser only)
 */
(function (root) {
  'use strict';

  var storageKey = 'preceptoros.documents.v1';
  var maxTitle = 80;
  var maxContent = 100000; // ~100 KB per document

  /* ------------------------------------------------------------------ */
  /*  Storage                                                           */
  /* ------------------------------------------------------------------ */

  function loadDocuments() {
    try {
      var raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveDocuments(docs) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(docs));
      return true;
    } catch (e) {
      return false;
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Document operations                                               */
  /* ------------------------------------------------------------------ */

  function createDocument(title, content) {
    var safeTitle = typeof title === 'string' ? title.trim() : '';
    var safeContent = typeof content === 'string' ? content : '';
    if (!safeTitle || safeTitle.length > maxTitle || safeContent.length > maxContent) {
      return { state: 'draft', _validationError: 'invalid_document_size_or_title' };
    }
    var docs = loadDocuments();
    var doc = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title: safeTitle,
      content: safeContent,
      state: 'saved',
      created: new Date().toISOString(),
      modified: new Date().toISOString()
    };
    docs.push(doc);
    var ok = saveDocuments(docs);
    if (!ok) {
      doc.state = 'draft';
      doc._saveError = true;
    } else {
      doc.state = 'saved';
    }
    return doc;
  }

  function updateDocument(id, title, content) {
    if (typeof title !== 'string' || !title.trim() || title.trim().length > maxTitle ||
        (content !== undefined && (typeof content !== 'string' || content.length > maxContent))) {
      return { state: 'draft', _validationError: 'invalid_document_size_or_title' };
    }
    var docs = loadDocuments();
    var idx = docs.findIndex(function (d) { return d.id === id; });
    if (idx < 0) return null;
    docs[idx].title = title || docs[idx].title;
    docs[idx].content = content !== undefined ? content : docs[idx].content;
    docs[idx].modified = new Date().toISOString();
    docs[idx].state = 'saved';
    var ok = saveDocuments(docs);
    if (!ok) {
      docs[idx].state = 'draft';
      docs[idx]._saveError = true;
    } else {
      docs[idx].state = 'saved';
    }
    return docs[idx];
  }

  function deleteDocument(id) {
    var docs = loadDocuments().filter(function (d) { return d.id !== id; });
    saveDocuments(docs);
  }

  function getDocument(id) {
    return loadDocuments().find(function (d) { return d.id === id; }) || null;
  }

  /* ------------------------------------------------------------------ */
  /*  UI mounting                                                       */
  /* ------------------------------------------------------------------ */

  function mount(doc) {
    var importarBtn = doc.getElementById('documentos-importar-btn');
    var importarInput = doc.getElementById('documentos-importar');
    var nuevoBtn = doc.getElementById('documentos-nuevo-btn');
    var editor = doc.getElementById('documentos-editor');
    var editorEstado = doc.getElementById('documentos-editor-estado');
    var tituloInput = doc.getElementById('documentos-titulo');
    var contenidoInput = doc.getElementById('documentos-contenido');
    var guardarBtn = doc.getElementById('documentos-guardar');
    var descargarBtn = doc.getElementById('documentos-descargar');
    var cancelarBtn = doc.getElementById('documentos-cancelar');
    var itemsLista = doc.getElementById('documentos-items');
    var listaVacio = doc.getElementById('documentos-lista-vacio');
    var estadoGeneral = doc.getElementById('documentos-estado');

    if (!importarBtn || !nuevoBtn || !editor) return;

    var currentDocId = null;

    function renderList() {
      if (!itemsLista) return;
      itemsLista.replaceChildren();
      var docs = loadDocuments();
      if (docs.length === 0) {
        if (listaVacio) listaVacio.hidden = false;
        if (estadoGeneral) estadoGeneral.textContent = 'No documents yet. Import or create one to get started.';
        return;
      }
      if (listaVacio) listaVacio.hidden = true;
      if (estadoGeneral) estadoGeneral.textContent = docs.length + ' document(s) stored locally.';
      docs.forEach(function (d) {
        var li = doc.createElement('li');
        li.className = 'documentos-item';
        li.dataset.id = d.id;
        li.setAttribute('role', 'listitem');
        li.innerHTML =
          '<span class="documentos-item-title">' + escapeHtml(d.title) + '</span>' +
          '<span class="documentos-item-meta">' +
            'state: ' + d.state + ' · ' +
            'modified: ' + d.modified.replace('T', ' ').replace('Z', '') +
          '</span>' +
          '<div class="documentos-item-actions">' +
            '<button type="button" class="probar" data-action="open" data-id="' + d.id + '">Open</button>' +
            '<button type="button" class="probar" data-action="download" data-id="' + d.id + '">Download</button>' +
            '<button type="button" class="probar" data-action="delete" data-id="' + d.id + '">Delete</button>' +
          '</div>';
        itemsLista.appendChild(li);
      });
      // Wire up item actions
      itemsLista.querySelectorAll('[data-action]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var action = btn.dataset.action;
          var id = btn.dataset.id;
          if (action === 'open') openDocument(id);
          else if (action === 'download') downloadDocument(id);
          else if (action === 'delete') confirmDelete(id);
        });
      });
    }

    function openDocument(id) {
      var d = getDocument(id);
      if (!d) return;
      currentDocId = id;
      if (tituloInput) tituloInput.value = d.title;
      if (contenidoInput) contenidoInput.value = d.content;
      if (editor) editor.hidden = false;
      if (editorEstado) {
        editorEstado.textContent = 'Editing: ' + d.title + '. State: saved.';
        editorEstado.dataset.state = 'editing';
      }
      if (guardarBtn) guardarBtn.disabled = false;
      if (descargarBtn) descargarBtn.disabled = false;
    }

    function newDocument() {
      currentDocId = null;
      if (tituloInput) tituloInput.value = '';
      if (contenidoInput) contenidoInput.value = '';
      if (editor) editor.hidden = false;
      if (editorEstado) {
        editorEstado.textContent = 'Draft in memory. Not saved yet.';
        editorEstado.dataset.state = 'draft';
      }
      if (guardarBtn) guardarBtn.disabled = true;
      if (descargarBtn) descargarBtn.disabled = true;
      if (tituloInput) tituloInput.focus();
    }

    function saveCurrent() {
      var title = tituloInput ? tituloInput.value.trim() : '';
      var content = contenidoInput ? contenidoInput.value : '';
      if (!title) {
        if (editorEstado) editorEstado.textContent = 'Please enter a title.';
        return;
      }
      if (title.length > maxTitle) {
      if (editorEstado) editorEstado.textContent = 'Title too long. Max ' + maxTitle + ' characters.';
        return;
      }
      if (content.length > maxContent) {
      if (editorEstado) editorEstado.textContent = 'Content too long. Max ' + maxContent + ' characters.';
        return;
      }
      var result;
      if (currentDocId) {
        result = updateDocument(currentDocId, title, content);
      } else {
        result = createDocument(title, content);
        currentDocId = result.id;
      }
      if (result && result._saveError) {
        if (editorEstado) {
          editorEstado.textContent = 'Save failed: localStorage quota exceeded. Draft kept in memory. Download to preserve.';
          editorEstado.dataset.state = 'draft';
        }
        if (descargarBtn) descargarBtn.disabled = false;
        return;
      }
      if (result && result.state === 'saved') {
        if (editorEstado) {
          editorEstado.textContent = 'Saved: ' + title + '. State: saved.';
          editorEstado.dataset.state = 'saved';
        }
        if (descargarBtn) descargarBtn.disabled = false;
      }
      renderList();
    }

    function downloadDocument(id) {
      var d = getDocument(id);
      if (!d) return;
      var blob = new Blob([d.content], { type: 'text/plain;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = doc.createElement('a');
      a.href = url;
      a.download = (d.title || 'document') + '.txt';
      a.click();
      URL.revokeObjectURL(url);
    }

    function confirmDelete(id) {
      var d = getDocument(id);
      if (!d) return;
      if (confirm('Delete "' + d.title + '"? This cannot be undone.')) {
        deleteDocument(id);
        if (currentDocId === id) {
          currentDocId = null;
          if (editor) editor.hidden = true;
        }
        renderList();
      }
    }

    function cancelEdit() {
      currentDocId = null;
      if (editor) editor.hidden = true;
      if (editorEstado) {
        editorEstado.textContent = 'Draft in memory. Not saved yet.';
        editorEstado.dataset.state = 'draft';
      }
    }

    /* ---------------------------------------------------------------- */
    /*  Event listeners                                                 */
    /* ---------------------------------------------------------------- */

    if (nuevoBtn) {
      nuevoBtn.addEventListener('click', newDocument);
    }

    if (importarBtn && importarInput) {
      importarBtn.addEventListener('click', function () {
        importarInput.click();
      });
      importarInput.addEventListener('change', function (e) {
        var files = e.target.files;
        if (!files || files.length === 0) return;
        Array.from(files).forEach(function (file) {
          if (file.size > 400000 || !/\.(txt|md|json|csv|html|xml)$/i.test(file.name)) {
            if (estadoGeneral) estadoGeneral.textContent = 'Import rejected: unsupported file type or size.';
            return;
          }
          var reader = new FileReader();
          reader.onload = function (ev) {
            var text = ev.target.result;
            var d = createDocument(file.name.replace(/\.[^.]+$/, ''), text);
            if (d._validationError) {
              if (estadoGeneral) estadoGeneral.textContent = 'Import rejected for ' + file.name + ': invalid name or more than 100,000 characters.';
            } else if (d._saveError) {
              if (estadoGeneral) estadoGeneral.textContent = 'Import failed for ' + file.name + ': localStorage quota exceeded. Re-import after freeing space.';
            } else {
              if (estadoGeneral) estadoGeneral.textContent = 'Imported: ' + file.name + '. State: saved.';
            }
            renderList();
          };
          reader.readAsText(file);
        });
        importarInput.value = '';
      });
    }

    if (guardarBtn) {
      guardarBtn.addEventListener('click', saveCurrent);
    }

    if (descargarBtn) {
      descargarBtn.addEventListener('click', function () {
        if (currentDocId) downloadDocument(currentDocId);
      });
    }

    if (cancelarBtn) {
      cancelarBtn.addEventListener('click', cancelEdit);
    }

    /* Enable/disable save button based on title input */
    if (tituloInput) {
      tituloInput.addEventListener('input', function () {
        if (guardarBtn) guardarBtn.disabled = !tituloInput.value.trim();
      });
    }

    /* Refresh button */
    var refreshBtn = doc.querySelector('[data-refrescar="documentos"]');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', renderList);
    }

    /* Initial render */
    renderList();
  }

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                           */
  /* ------------------------------------------------------------------ */

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /* ------------------------------------------------------------------ */
  /*  Exports                                                           */
  /* ------------------------------------------------------------------ */

  if (typeof module === 'object' && module.exports) {
    module.exports = Object.freeze({
      createDocument: createDocument,
      updateDocument: updateDocument,
      deleteDocument: deleteDocument,
      getDocument: getDocument,
      loadDocuments: loadDocuments,
      mount: mount
    });
  } else {
    root.PreceptorDocuments = Object.freeze({
      createDocument: createDocument,
      updateDocument: updateDocument,
      deleteDocument: deleteDocument,
      getDocument: getDocument,
      loadDocuments: loadDocuments,
      mount: mount
    });
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
