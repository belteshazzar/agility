

class Bound {
  static renderQueue = []
  static render() {
    if (Bound.renderQueue.length>0) {
      const start = performance.now()
      for (let f of Bound.renderQueue) {
        f()
      }
      Bound.renderQueue = []
      const end = performance.now()
      console.log(`${end-start}ms`)
    }
    requestAnimationFrame(Bound.render);
  }
  static submit(f) {
    Bound.renderQueue.push(f)
  }
  static {
    requestAnimationFrame(Bound.render);
  }  
  constructor(el) {
    this.el = el
    this.value = null
    this.listeners = []

    if (el == null) {

    } else if (Array.isArray(el)) {
      this.el = el
      this.value = []
      for (let i in el) {
        const b = bind(el[i]);
        this.value[i] = b.value
        b.listeners.push({ update: (v) => {
          this.value[i] = v
          this.notify(this.value)
        }})
      }
      this.updateHandler = (v) => {
        console.warn('update to array not implemented', v)
      }
    } else if (typeof el === 'object') {
      this.el = el
      this.value = {}
      for (let k in el) {
        const b = bind(el[k])
        this.value[k] = b.value
        b.listeners.push({ update: (v) => {
          this.value[k] = v
          this.notify(this.value)
        }})
      }
      this.updateHandler = (v) => {
        console.warn('update to object not implemented', v)
      }
    } else if (typeof el === 'function') {
      this.updateHandler = (v) => {
        this.value = this.el(v)
      }
    } else {
      console.error('non-supported element',el)
    }
  }

  _update(v) {
    this.value = v
    this.notify()
  }

  update(v) {
    this.value = v
    this.updateHandler(v)
    this.notify()
  }

  notify() {
    for (let l of this.listeners) {
      l.update(this.value)
    }
  }

  to() {
    const b = bind(...arguments)
    b.listeners.push(this)
    this.value = b.value
    this.updateHandler(this.value)
    return b
  }
}

export function bind(el) {
  if (arguments.length > 1) {
    return new Bound(Array.from(arguments))
  } else if (el instanceof Bound) {
    return el
  } else if (typeof el == 'string') {
    return bind(document.querySelectorAll(el))
  } else if (el instanceof NodeList) {
    if (el.length > 1) {
      return new Bound([...el.values()].map(e => bind(e)))
    } else {
      return new Bound(el[0])
    }
  } else {
    return new Bound(el)
  }
}
