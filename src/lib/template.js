
import ReactiveStore from './store.js'

export class TemplatedHTMLElement extends HTMLElement {

  constructor(template,defaultData,scriptSrc) {
    super();

    const templateContent = template.cloneNode(true);

    this._internals = this.attachInternals();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.shadow.appendChild(templateContent);

    this._pendingUpdate = false;
    this.defaultData = Object.assign({},defaultData)
    this.data = new ReactiveStore(this.defaultData);
    // this.data.debug.printState();


    if (scriptSrc) {
      try {
        const funcDefs = new Function(scriptSrc);
        funcDefs.call(this);
      } catch (e) {
        console.error('Error evaluating template script:', e);
      }
    }

    // for (let n of this.getAttributeNames()) {
    //   this.data[n] = this.getAttribute(n)
    // }





    if (this.onInit) this.onInit(this);
  }

  connectedCallback() {
    // this.observeSlots();
    // this.setupValueBindings();

    // console.log('connected, attribute names',this.getAttributeNames())

//     this._observer = new MutationObserver(mutations => {
//       mutations.forEach(mutation => {
//         if (mutation.type === 'attributes') {
//           const name = mutation.attributeName;
//           const newValue = this.getAttribute(name);

// console.log('attribute mutation',name,newValue)

//           if (this._data[name] !== newValue) {
//             this._data[name] = newValue;
//             this.scheduleUpdate();
//             this.dispatchEvent(new CustomEvent('data-changed', {
//               detail: { key: name, value: newValue },
//               bubbles: true,
//               composed: true
//             }));
//           }
//         }
//       });
//     });

//     this._observer.observe(this, { attributes: true });

    // this.applyPendingBindings();
    // this.scheduleUpdate();

    for (let attr in this.defaultData) {
      this.data[attr].bind(this,attr)
    }


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
        if (attr.name.startsWith('x-ev-')) {
          const eventType = attr.name.slice(5); // e.g., "click"
          const handlerName = attr.value;       // e.g., "handleClick"
          const handlerFn = this[handlerName];

          if (typeof handlerFn === 'function') {
            el.addEventListener(eventType, handlerFn.bind(this));
          } else {
            let fn = new Function('event', handlerName)
            el.addEventListener(eventType, fn.bind(this))
          }

          // this.bindings.event.push({element: el, event: eventType})
        } else if (attr.name.startsWith('x-')) {
          if (attr.name == 'x-text') {
            // this.bindings.attr.push({element: el, attribute: 'textContent', property: attr.value});
            this.data[attr.value].bind(el,'textContent')
          } else if (attr.name == 'x-html') {
            // this.bindings.attr.push({element: el, attribute: 'innerHTML', property: attr.value});
            this.data[attr.value].bind(el,'innerHTML')
          }else if (attr.name == 'x-value') {
            //this.bindings.input.push({element: el, property: attr.value});
            // console.log('bind: ' + attr.value,el)
            this.data[attr.value].bind(el)
          } else if (attr.name.startsWith('x-bind:')) {
            // this.bindings.attr.push({element: el, attribute: attr.name.substring(7), property: attr.value});
            this.data[attr.value].bind(el,attr.name.substring(7))
          }
        }
      });

    }

    // console.log('detected bindings:',this.bindings)





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

    if (this.onConnected) this.onConnected(this);
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

//    if (oldValue !== newValue) {
     this.data[name] = newValue;

      // this.data.debug.printState();
      // this.scheduleUpdate();
      // if (hooks.onAttributeChanged) {
      //   hooks.onAttributeChanged(this, name, oldValue, newValue);
      // }
 //   }
  }

  // set data(obj) {
  //   const self = this;
  //   this._data = new Proxy({ ...obj }, {
  //     set(target, key, value) {
  //       target[key] = value;
  //       self.setAttribute(key, value);
  //       self.scheduleUpdate();
  //       self.dispatchEvent(new CustomEvent('data-changed', {
  //         detail: { key, value },
  //         bubbles: true,
  //         composed: true
  //       }));
  //       // if (hooks.onDataUpdated) hooks.onDataUpdated(self, self._data);
  //       return true;
  //     },
  //     get(target, key) {
  //       return target[key];
  //     }
  //   });

  //   Object.entries(obj).forEach(([key, value]) => {
  //     this.setAttribute(key, value);
  //   });

  //   // this.scheduleUpdate();
  //   // if (hooks.onDataUpdated) hooks.onDataUpdated(this, this._data);
  // }

  // get data() {
  //   return this._data;
  // }

  // scheduleUpdate() {
  //   if (this._pendingUpdate) return;
  //   this._pendingUpdate = true;
  //   requestAnimationFrame(() => {
  //     this._pendingUpdate = false;
  //     this.applyPendingBindings();
  //   });
  // }

  // applyPendingBindings() {
  //   this.bindings.text.forEach(el => {
  //     const key = el.getAttribute('x-text');
  //     el.textContent = this._data[key] || '';
  //   });

  //   this.bindings.html.forEach(el => {
  //     const key = el.getAttribute('x-html');
  //     el.innerHTML = this._data[key] || '';
  //   });

  //   this.bindings.attr.forEach(el => {
  //     Array.from(el.attributes).forEach(attr => {
  //       if (attr.name.startsWith('x-attr:')) {
  //         const targetAttr = attr.name.split(':')[1];
  //         const sourceKey = attr.value;
  //         el.setAttribute(targetAttr, this._data[sourceKey] || '');
  //       }
  //     });
  //   });

  //   this.bindings.value.forEach(el => {
  //     const key = el.getAttribute('x-value');
  //     if (el.value !== this._data[key]) {
  //       el.value = this._data[key] || '';
  //     }
  //   });
  // }

  // setupValueBindings() {
  //   this.bindings.value.forEach(el => {
  //     const key = el.getAttribute('x-value');
  //     el.addEventListener('input', () => {
  //       this._data[key] = el.value;
  //       this.setAttribute(key, el.value);
  //       this.scheduleUpdate();
  //       this.dispatchEvent(new CustomEvent('data-changed', {
  //         detail: { key, value: el.value },
  //         bubbles: true,
  //         composed: true
  //       }));
  //       // if (hooks.onDataUpdated) hooks.onDataUpdated(this, this._data);
  //     });
  //   });
  // }

  // observeSlots() {
  //   this.shadow.querySelectorAll('slot').forEach(slot => {
  //     slot.addEventListener('slotchange', () => {
  //       this.dispatchEvent(new CustomEvent('slot-changed', {
  //         detail: { slot: slot.name },
  //         bubbles: true,
  //         composed: true
  //       }));
  //     });
  //   });
  // }
}


export function template(tagName, htmlString, hooks = {}) {

  let template = document.createElement('template');
  template.innerHTML = htmlString.trim()
  template = template.content.firstElementChild

  const defaultData = {};
  Array.from(template.attributes).forEach(attr => {
    defaultData[attr.name] = attr.value;
  });

  class AnonTemplatedHTMLElement extends TemplatedHTMLElement {

    static get observedAttributes() {
      return Object.keys(defaultData);
    }

    constructor() {
      super(template,defaultData);
    }
  }

  customElements.define(tagName, AnonTemplatedHTMLElement);
}
