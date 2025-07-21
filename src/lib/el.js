

const isObject = (v) => typeof v === 'object';
const isArray = (v) => Array.isArray(v);
const isString = (v) => typeof v === 'string'
const isFunction = (v) => typeof v === 'function';
/**
 * Creates a DOM element with the specified name, attributes, and children.
 * 
 * @param {string|HTMLElement} name - The name of the element or an existing HTMLElement.
 * @param {Object} [attributes] - An object containing attributes to set on the element.
 * @param {Array<string|HTMLElement>} [children] - An array of child elements or text nodes to append.
 * @returns {HTMLElement} The created or modified DOM element.
 */
export function el(name,attributes,children) {
  let element = name
  if (isString(name)) {
    if (name.length>2 && name[0] == '#') {
      element = document.getElementById(name.substring(1))
    } else {
      element = document.createElement(name);
    }
  }

  if (attributes) {
    for (const key in attributes) {
      if (attributes.hasOwnProperty(key)) {
        const value = attributes[key];
        if (key === 'style') {
          if (isObject(value)) {
            for (const valueKey in value) {
              if (value.hasOwnProperty(valueKey)) {
                element.style[valueKey] = value[valueKey]
              }
            }
          }
        } else if (key === 'classList') {
          if (isArray(value)) {
            for (const clas of value) {
              element.classList.add(clas);
            }
          } else if (isString(value)) {
            const classes = value.split(/\s+/);
            for (const clas of classes) {
              element.classList.add(clas)
            }
          }
        } else if (isFunction(value)) {
          element.addEventListener(key,value);
        } else if (key.startsWith('@')) {
          element.setAttribute('x-ev-' + key.substring(1),value);
        } else {
          element.setAttribute(key,value);
        }
      }
    }

    // can only have children if there are attributes
    if (children) {
      for (const child of children) {
        if (isString(child)) {
          element.appendChild(document.createTextNode(child));
        } else {
          element.appendChild(child)
        }
      }
    }
  }
  
  return element;
}

