export function template(tagName, htmlString, hooks = {}) {

  let template = document.createElement('template');
  template.innerHTML = htmlString.trim()
  template = template.content.firstElementChild

  const defaultData = {};
  Array.from(template.attributes).forEach(attr => {
    defaultData[attr.name] = attr.value;
  });

  class TemplateElement extends HTMLElement {

    static get observedAttributes() {
      return Object.keys(defaultData);
    }

    static formAssociated = true;

    constructor() {
      super();
      const templateContent = template.content.cloneNode(true);

      this._templateScope = {};
      const script = template.content.querySelector('script');
      if (script && script.textContent) {
        try {
          const funcDefs = new Function(script.textContent);
          funcDefs.call(this._templateScope);
        } catch (e) {
          console.error('Error evaluating template script:', e);
        }
      }

      this._internals = this.attachInternals();
      this.shadow = this.attachShadow({ mode: 'open' });
      this.shadow.appendChild(templateContent);

      this._pendingUpdate = false;
      this.data = Object.assign({}, defaultData);
      this.bindings = {
        text: [],
        html: [],
        attr: [],
        value: []
      };

      const walker = document.createTreeWalker(
        this.shadow,
        NodeFilter.SHOW_ELEMENT,
        null,
        false
      );

      while (walker.nextNode()) {
        const el = walker.currentNode;

        // Event handlers (@click, @input, etc.)
        Array.from(el.attributes).forEach(attr => {
          if (attr.name.startsWith('@')) {
            const eventType = attr.name.slice(1); // e.g., "click"
            const handlerName = attr.value;       // e.g., "handleClick"
            const handlerFn = this._templateScope?.[handlerName];
            if (typeof handlerFn === 'function') {
              el.addEventListener(eventType, handlerFn.bind(this));
            } else {
              let fn = new Function('event', handlerName)
              el.addEventListener(eventType, fn.bind(this))
            }
          } else if (attr.name.startsWith('x-')) {
            if (attr.name == 'x-text') this.bindings.text.push(el);
            else if (attr.name == 'x-html') this.bindings.html.push(el);
            else if (attr.name == 'x-value') this.bindings.value.push(el);
            else if (attr.name.startsWith('x-attr:')) this.bindings.attr.push(el);
          }
        });

      }

      if (hooks.onInit) hooks.onInit(this);
    }

    connectedCallback() {
      this.observeSlots();
      this.setupValueBindings();

      this._observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          if (mutation.type === 'attributes') {
            const name = mutation.attributeName;
            const newValue = this.getAttribute(name);
            if (this._data[name] !== newValue) {
              this._data[name] = newValue;
              this.scheduleUpdate();
              this.dispatchEvent(new CustomEvent('data-changed', {
                detail: { key: name, value: newValue },
                bubbles: true,
                composed: true
              }));
            }
          }
        });
      });
      this._observer.observe(this, { attributes: true });

      this.applyPendingBindings();
      // this.scheduleUpdate();

      if (this._internals.form) {

        const walker = document.createTreeWalker(
          this.shadow,
          NodeFilter.SHOW_ELEMENT,
          null,
          false
        );

        while (walker.nextNode()) {
          const el = walker.currentNode;
          if (el.nodeName == 'INPUT' || el.nodeName == 'SELECT' || el.nodeName == 'TEXTAREA') {
            let hidden = document.createElement('input')
            hidden.type = 'hidden';
            hidden.name = el.getAttribute('name');
            hidden.value = this.inputValue(el)
            this._internals.form.appendChild(hidden);

            el.addEventListener('input', () => {
              // does not work in Safari
              // this._internals.setFormValue('fred',this.input.checked);

              hidden.value = this.inputValue(el);
            });

          }
        }
      }

      if (this._templateScope && this._templateScope.init) {
        try {
          this._templateScope.init.call(this);
        } catch (e) {
          console.error('Error initializing template:', e);
        }
      }

      if (hooks.onConnected) hooks.onConnected(this);
    }

    inputValue(el) {
      if (el instanceof HTMLInputElement) {
        if (el.type === 'checkbox' || el.type === 'radio') {
          return el.checked;
        } else {
          return el.value;
        }
      } else if (el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
        return el.value;
      }
      return '';
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue !== newValue) {
        this._data[name] = newValue;
        this.scheduleUpdate();
        if (hooks.onAttributeChanged) {
          hooks.onAttributeChanged(this, name, oldValue, newValue);
        }
      }
    }

    set data(obj) {
      const self = this;
      this._data = new Proxy({ ...obj }, {
        set(target, key, value) {
          target[key] = value;
          self.setAttribute(key, value);
          self.scheduleUpdate();
          self.dispatchEvent(new CustomEvent('data-changed', {
            detail: { key, value },
            bubbles: true,
            composed: true
          }));
          if (hooks.onDataUpdated) hooks.onDataUpdated(self, self._data);
          return true;
        },
        get(target, key) {
          return target[key];
        }
      });

      Object.entries(obj).forEach(([key, value]) => {
        this.setAttribute(key, value);
      });

      this.scheduleUpdate();
      if (hooks.onDataUpdated) hooks.onDataUpdated(this, this._data);
    }

    get data() {
      return this._data;
    }

    scheduleUpdate() {
      if (this._pendingUpdate) return;
      this._pendingUpdate = true;
      requestAnimationFrame(() => {
        this._pendingUpdate = false;
        this.applyPendingBindings();
      });
    }

    applyPendingBindings() {
      this.bindings.text.forEach(el => {
        const key = el.getAttribute('x-text');
        el.textContent = this._data[key] || '';
      });

      this.bindings.html.forEach(el => {
        const key = el.getAttribute('x-html');
        el.innerHTML = this._data[key] || '';
      });

      this.bindings.attr.forEach(el => {
        Array.from(el.attributes).forEach(attr => {
          if (attr.name.startsWith('x-attr:')) {
            const targetAttr = attr.name.split(':')[1];
            const sourceKey = attr.value;
            el.setAttribute(targetAttr, this._data[sourceKey] || '');
          }
        });
      });

      this.bindings.value.forEach(el => {
        const key = el.getAttribute('x-value');
        if (el.value !== this._data[key]) {
          el.value = this._data[key] || '';
        }
      });
    }

    setupValueBindings() {
      this.bindings.value.forEach(el => {
        const key = el.getAttribute('x-value');
        el.addEventListener('input', () => {
          this._data[key] = el.value;
          this.setAttribute(key, el.value);
          this.scheduleUpdate();
          this.dispatchEvent(new CustomEvent('data-changed', {
            detail: { key, value: el.value },
            bubbles: true,
            composed: true
          }));
          if (hooks.onDataUpdated) hooks.onDataUpdated(this, this._data);
        });
      });
    }

    observeSlots() {
      this.shadow.querySelectorAll('slot').forEach(slot => {
        slot.addEventListener('slotchange', () => {
          this.dispatchEvent(new CustomEvent('slot-changed', {
            detail: { slot: slot.name },
            bubbles: true,
            composed: true
          }));
        });
      });
    }
  }

  customElements.define(tagName, TemplateElement);
}
