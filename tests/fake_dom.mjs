export class FakeElement {
  constructor(doc, tag, namespace = null) {
    this.ownerDocument = doc; this.tagName = tag.toUpperCase(); this.namespaceURI = namespace;
    this.children = []; this.attributes = {}; this.listeners = {}; this.style = {}; this.textContent = '';
    this.value = ''; this.type = ''; this.className = '';
  }
  get firstChild() { return this.children[0] || null; }
  appendChild(child) { child.parentNode = this; this.children.push(child); return child; }
  removeChild(child) { const i = this.children.indexOf(child); if (i >= 0) this.children.splice(i, 1); child.parentNode = null; return child; }
  setAttribute(key, value) { this.attributes[key] = String(value); }
  getAttribute(key) { return Object.hasOwn(this.attributes, key) ? this.attributes[key] : null; }
  addEventListener(key, fn) { (this.listeners[key] ||= []).push(fn); }
  removeEventListener(key, fn) { this.listeners[key] = (this.listeners[key] || []).filter(x => x !== fn); }
  querySelectorAll(selector) { return this.find(selector); }
  querySelector(selector) { return this.find(selector)[0] || null; }
  find(selector) {
    const m = /^\[([^=\]]+)(?:="([^"]*)")?\]$/.exec(selector);
    const tag = /^[a-z][a-z0-9-]*$/i.test(selector) ? selector.toUpperCase() : null;
    if (!m && !tag) return [];
    const [, name, expected] = m || [];
    const out = [];
    const visit = node => {
      if (tag ? node.tagName === tag : Object.hasOwn(node.attributes, name) && (expected === undefined || node.attributes[name] === expected)) out.push(node);
      node.children.forEach(visit);
    };
    visit(this); return out;
  }
}

export class FakeDocument {
  createElement(tag) { return new FakeElement(this, tag); }
  createElementNS(namespace, tag) { return new FakeElement(this, tag, namespace); }
}

export function host(doc) { return doc.createElement('div'); }
