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

    // Introspection helpers
    if (prop === 'meta') {
      return target.store._getComputedMeta(target.path) ?? null;
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
    this.currentComputation = null;
    this.computedState = {}; // Stores metadata for computed properties
    this.proxy = new Proxy({ store: this, path: [] }, reactiveHandler);

    // Batching state
    this._pendingNotifications = new Set();
    this._isBatchScheduled = false;

    return this.proxy;
  }

  _get(path) {
    if (this.currentComputation) {
      this.currentComputation.add(path.join('.'));
    }
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

  _notify(path) {

    console.log(`🔔 Notifying changes for path: ${path.join('.')}`);

    // Batch notifications for this path and all parent paths
    for (let i = path.length; i >= 0; i--) {
      const subKey = path.slice(0, i).join('.');
      this._pendingNotifications.add({ queueForPath: subKey, updatePath: path });
      console.log(`🔔 Queued notification for queueForPath: ${subKey}, updatePath: ${path.join('.')}`);
    }
    if (!this._isBatchScheduled) {
      this._isBatchScheduled = true;
      Promise.resolve().then(() => this._flushNotifications());
    }
  }

  _flushNotifications() {
    this._isBatchScheduled = false;
    const notified = new Set();
    for (const key of this._pendingNotifications) {
      console.log(`🔔 Processing notification for: ${key.queueForPath} on change path [${key.updatePath}]`);
      if (this.listeners.has(key.queueForPath)) {
        const value = this._get(key.updatePath);
        for (const cb of this.listeners.get(key.queueForPath)) {
          // Prevent duplicate notifications for the same callback in the same batch
          const cbKey = key + cb.toString();
          if (!notified.has(cbKey)) {
            console.log(`🔔 Notifying callback for: [${key.queueForPath}] with value: ${value}, updatePath: [${key.updatePath}]`);
            cb(value, key.updatePath);
            notified.add(cbKey);
          }
        }
      }
    }
    this._pendingNotifications.clear();
  }

  _defineComputed(path, computeFn) {
    const deps = new Set();

    const compute = () => {
      this.currentComputation = deps;
      const value = computeFn(this.proxy);
      this.currentComputation = null;

      this._set(path, value);

      // Store metadata in computedState
      let obj = this.computedState;
      for (let i = 0; i < path.length - 1; i++) {
        obj = obj[path[i]] ??= {};
      }
      obj[path.at(-1)] = {
        computeFn,
        dependencies: Array.from(deps),
        lastValue: value
      };
    };

    compute();

    deps.forEach(dep => {
      this._subscribe(dep.split('.'), compute);
    });
  }

  _getComputedMeta(path) {
    let obj = this.computedState;
    for (let i = 0; i < path.length; i++) {
      obj = obj?.[path[i]];
      if (!obj) return null;
    }
    return obj?.computeFn ? obj : null;
  }

  inspectComputed() {
    const results = [];

    const traverse = (node, path = []) => {
      for (const key in node) {
        const value = node[key];
        const currentPath = path.concat(key);
        if (value && typeof value === 'object' && 'computeFn' in value) {
          results.push({
            path: currentPath.join('.'),
            dependencies: value.dependencies,
            lastValue: value.lastValue
          });
        } else if (typeof value === 'object') {
          traverse(value, currentPath);
        }
      }
    };

    traverse(this.computedState);
    return results;
  }

  printComputedTree() {
    const traverse = (node, indent = '') => {
      for (const key in node) {
        const value = node[key];
        if (value && typeof value === 'object' && 'computeFn' in value) {
          console.log(`${indent}- ${key}`);
          console.log(`${indent}  ↳ deps: [${value.dependencies.join(', ')}]`);
          console.log(`${indent}  ↳ lastValue: ${JSON.stringify(value.lastValue)}`);
        } else if (typeof value === 'object') {
          console.log(`${indent}${key}:`);
          traverse(value, indent + '  ');
        }
      }
    };

    console.log('🧠 Computed Properties Tree:');
    traverse(this.computedState);
  }
}

export default ReactiveStore;