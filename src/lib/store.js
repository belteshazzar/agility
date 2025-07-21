/**
 * ReactiveStore
 * -------------
 * A deeply reactive state container for JavaScript objects and arrays.
 * 
 * Features:
 * - Deep reactivity: Any nested property or array mutation is observable.
 * - Subscription: Subscribe to changes on any property path (including nested).
 * - Computed properties: Define computed values that automatically update and notify subscribers when their dependencies change.
 * - Array mutation tracking: Reacts to push, pop, shift, unshift, splice, sort, and reverse.
 * - Introspection: Inspect and print the tree of computed properties and their dependencies.
 * - Primitive coercion: Supports toString, valueOf, and Symbol.toPrimitive for easy debugging and display.
 * 
 * Usage:
 *   const store = new ReactiveStore({ user: { name: 'Alice' } });
 *   store.user.name.subscribe(val => console.log('Name changed:', val));
 *   store.user.name = 'Bob'; // triggers subscriber
 * 
 *   // Computed property
 *   store.user.fullName = () => `${store.user.firstName} ${store.user.lastName}`;
 *   store.user.fullName.subscribe(val => console.log('Full name:', val));
 */

const reactiveHandler = {
  get(target, prop) {

    const v = target.store._get(target.path);

    // Handle primitive coercion
    if (prop === Symbol.toPrimitive) {
      if (v === undefined) {
        return () => `Placeholder(${target.path.join('.')})`;
      } else if (v[prop]) {
        return v[prop].bind(v);
      } else {
        return undefined
      }
    }

    if (prop === 'toJSON') {
      return () => v
    }
    // Handle string conversion
    if (prop === Symbol.toStringTag || prop === 'toString' || prop === 'valueOf' || prop === 'toJSON') {
      if (v === undefined) {
        return () => `Placeholder(${target.path.join('.')})`
      } else if (v[prop]) {
        return () => v[prop]()
      } else {
        console.warn(`No ${String(prop)} method for path: ${target.path.join('.')}`);
        return undefined;
      }
    }

    // Handle array mutating methods
    if (Array.isArray(v) && typeof v[prop] === 'function' &&
      ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'].includes(prop)) {
      return (...args) => {
        const result = Array.prototype[prop].apply(v, args);
        target.store._notify(target.path);
        return result;
      };
    }

    // Reactive helpers
    if (prop === 'subscribe') {
      return (cb) => target.store._subscribe(target.path, cb);
    }

    if (prop === 'value') {
      return target.store._get(target.path);
    }

    if (prop === 'get') {
      return () => target.store._get(target.path);
    }

    if (prop === 'bind') {
      return (htmlElement, attrName) => target.store._bind(target.path, htmlElement, attrName);
    }

    // Special debug property to print computed tree and state
    if (prop === 'debug') {
      return {
        printComputedTree: () => target.store._printComputedTree(),
        printState: () => {
          // Pretty-print the real internal state
          // console.log('ReactiveStore State:', JSON.stringify(target.store.state, null, 2));
          console.log(target.store.state);
        }
      };
    }

    // Return nested proxy
    const fullPath = target.path.concat(prop);
    return new Proxy({ store: target.store, path: fullPath }, reactiveHandler);
  },

  set(target, prop, value) {
    const fullPath = target.path.concat(prop);
    if (typeof value === 'function') {
      target.store._defineComputed(fullPath, value);
    } else {
      target.store._set(fullPath, value);
    }
    return true;
  },

  deleteProperty(target, prop) {
    const fullPath = target.path.concat(prop);
    target.store._delete(fullPath);
    return true;
  },

  ownKeys(target) {
    const value = target.store._get(target.path);
    return value ? Reflect.ownKeys(value) : [];
  }
};

class ReactiveStore {
  constructor(initialState = {}) {
    this.state = initialState;
    this.listeners = new Map();
    this.computedState = {}; // Stores metadata for computed properties
    this.proxy = new Proxy({ store: this, path: [] }, reactiveHandler);

    // Batching state
    this._pendingNotifications = new Set();
    this._isBatchScheduled = false;

    return this.proxy;
  }

  _get(path) {
    return path.reduce((obj, key) => obj?.[key], this.state);
  }

  _set(path, value) {
    let obj = this.state;
    for (let i = 0; i < path.length - 1; i++) {
      obj = obj[path[i]] ??= {};
    }
    const oldValue = obj[path.at(-1)];

    if (oldValue !== value) {
      obj[path.at(-1)] = value;
      this._notify(path);
    }
  }

  _delete(path) {
    let obj = this.state;
    for (let i = 0; i < path.length - 1; i++) {
      obj = obj?.[path[i]];
      if (!obj) return;
    }
    delete obj[path.at(-1)];
    this._notify(path);
  }

  _subscribe(path, callback) {
    const key = path.join('.');
    if (!this.listeners.has(key)) this.listeners.set(key, new Set());
    this.listeners.get(key).add(callback);
    return () => this.listeners.get(key).delete(callback);
  }

  _bind(path, htmlElement, attrName) {

    const key = path.join('.');
    if (!this.listeners.has(key)) this.listeners.set(key, new Set());
    let callback = null

    if (attrName) {
      if (htmlElement instanceof HTMLElement) {
        if (attrName == 'textContent' || attrName == 'innerHTML') {
          // console.log(attrName,htmlElement[attrName])
          //this._set(path,htmlElement[attrName])
          htmlElement[attrName] = this._get(path)
          callback = (newValue) => {
            const oldValue = htmlElement[attrName]
            if (newValue !== oldValue) {
              htmlElement[attrName] = newValue
            }
          }
          this.listeners.get(key).add(callback);
        } else {
          //this._set(path,htmlElement.getAttribute(attrName));
          htmlElement.setAttribute(attrName,this._get(path))
          const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
              if (mutation.type === 'attributes') {
                const name = mutation.attributeName;
                if (name == attrName) {
                  const newValue = htmlElement.getAttribute(name);
                  const oldValue = this._get(path)
                  if (oldValue !== newValue) {
                    this._set(path,newValue)
                  }
                }
              }
            });
          });
          observer.observe(htmlElement, { attributes: true });
          callback = (newValue) => {
            const oldValue = htmlElement.getAttribute(attrName)
            if (newValue !== oldValue) {
              htmlElement.setAttribute(attrName,newValue)
            }
          }
          this.listeners.get(key).add(callback);
        }
      } else if (htmlElement instanceof CSSStyleDeclaration) {
        callback = (newValue) => {
          htmlElement.setProperty(attrName,newValue)
        }
        this.listeners.get(key).add(callback);
      } else {
        console.warn('tried to bind attr ' + attrName + ' to unsupported element type:',htmlElement)
      }
    } else {
      if (htmlElement instanceof HTMLInputElement) {
        if (htmlElement.type == 'button' || htmlElement.type == 'image' || htmlElement.type == 'reset' || htmlElement.type == 'submit') {
          this._set(path,htmlElement.value || false)
          htmlElement.addEventListener('mousedown',() => {
            this._set(path,htmlElement.value || true)
          })
          htmlElement.addEventListener('mouseup',() => {
            this._set(path,htmlElement.value ? null : false)
          })
        } else if (htmlElement.type == 'checkbox') {
          this._set(path,htmlElement.checked)
          htmlElement.addEventListener('input',() => {
            this._set(path,htmlElement.checked)
          })
          callback = (v) => htmlElement.checked = v == true
          this.listeners.get(key).add(callback);
        } else if (htmlElement.type == 'range' || htmlElement.type == 'number') {
          this._set(path,htmlElement.value*1)
          htmlElement.addEventListener('input',(ev) => {
            this._set(path,htmlElement.value*1)
          })
          callback = (v) => htmlElement.value = `${v}`
          this.listeners.get(key).add(callback);
        } else {
          this._set(path,htmlElement.value)
          htmlElement.addEventListener('input',(ev) => {
            this._set(path,htmlElement.value)
          })
          callback = (v) => htmlElement.value = `${v}`
          this.listeners.get(key).add(callback);
        }
      } else if (htmlElement instanceof HTMLSelectElement || htmlElement instanceof HTMLTextAreaElement) {
        this._set(path,htmlElement.value)
        htmlElement.addEventListener('input',(ev) => {
          this._set(path,htmlElement.value)
        })
        callback = (v) => htmlElement.value = `${v}`
        this.listeners.get(key).add(callback);
      } else if (htmlElement instanceof HTMLButtonElement) {
        this._set(path,htmlElement.value || false)
        htmlElement.addEventListener('mousedown',(ev) => {
          this._set(path,htmlElement.value || true)
        })
        htmlElement.addEventListener('mouseup',(ev) => {
          this._set(path,htmlElement.value ? null : false)
        })
      } else if (htmlElement instanceof HTMLOutputElement) {
        callback = (v) => htmlElement.innerHTML = `${v}`
        this.listeners.get(key).add(callback);
      } else if (htmlElement instanceof NodeList) {
        const valueToElement = new Map()
        let value = null
        for (let el of htmlElement) {
          valueToElement.set(el.value,el)
          el.addEventListener('input',(ev) => {
            this._set(path,el.value)
          })
          if (el.checked) value = el.value
        }
        this._set(path,value)

        callback = (v) => {
          if (valueToElement.has(v)) valueToElement.get(v).checked = true
        }
        this.listeners.get(key).add(callback);
      } else {
        console.warn('tried to bind to unsupported element type:',htmlElement.constructor.name)
      }
    }
    return () => this.listeners.get(key).delete(callback)
  }

  _notify(path) {
    // Batch notifications for this path and all parent paths
    for (let i = path.length; i >= 0; i--) {
      const subKey = path.slice(0, i).join('.');
      this._pendingNotifications.add({ queueForPath: subKey, updatePath: path });
    }
    if (!this._isBatchScheduled) {
      this._isBatchScheduled = true;
      Promise.resolve().then(() => this._flushNotifications());
    }
  }

  _flushNotifications() {
    this._isBatchScheduled = false;
    for (const key of this._pendingNotifications) {
      if (this.listeners.has(key.queueForPath)) {
        const value = this._get(key.updatePath);
        for (const cb of this.listeners.get(key.queueForPath)) {
          cb(value, key.updatePath);
        }
      }
    }
    this._pendingNotifications.clear();
  }

  _defineComputed(path, computeFn) {
    const deps = new Set();

    // Dependency-tracking proxy handler
    const depHandler = {
      get: (target, prop, receiver) => {
        // Forward to the original reactiveHandler for all other logic
        if (typeof prop === 'symbol' || prop === 'valueOf' || prop === 'toString' || prop === 'toJSON') {
          // Record dependency path
          deps.add(target.path.join('.'));
          return Reflect.get(new Proxy({ store: target.store, path: target.path }, reactiveHandler),prop);
        } else {
          return new Proxy({ store: target.store, path: target.path.concat(prop) }, depHandler);
        }
      }
    };

    const processValue = (value,async) => {
      this._set(path, value);

      // Subscribe to dependencies
      deps.forEach(dep => {
        this._subscribe(dep.split('.'), () => this._updateComputed(path, computeFn));
      });

      // Store metadata in computedState
      let obj = this.computedState;
      for (let i = 0; i < path.length - 1; i++) {
        obj = obj[path[i]] ??= {};
      }
      obj[path.at(-1)] = {
        computeFn,
        dependencies: Array.from(deps),
        async: async
      };
    }

    // Create a proxy that tracks dependencies
    const depProxy = new Proxy({ store: this, path: [] }, depHandler);

    let result = computeFn(depProxy);

    // If the result is a promise, handle it asynchronously
    if (result && typeof result.then === 'function') {

      result.then(value => {
        processValue(value, true);
      });

    } else {
      processValue(result, false);
    }

  }

  _updateComputed(path, computeFn) {
    let result;
    let isAsync = false;
    result = computeFn(this.proxy);
    if (result && typeof result.then === 'function') {
      isAsync = true;
      result.then(value => {
        this._set(path, value);
      });
    } else {
      this._set(path, result);
    }
  }

  _printComputedTree() {
    const traverse = (node, indent = '') => {
      for (const key in node) {
        const value = node[key];
        if (value && typeof value === 'object' && 'computeFn' in value) {
          console.log(`${indent}- ${key}`);
          console.log(`${indent}  ↳ deps: [${value.dependencies.join(', ')}]`);
          console.log(`${indent}  ↳ async: ${value.async}`);
        } else if (typeof value === 'object') {
          console.log(`${indent}${key}:`);
          traverse(value, indent + '  ');
        }
      }
    };

    console.log('Computed Properties Tree:');
    traverse(this.computedState);
  }
}

export default ReactiveStore;