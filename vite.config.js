

import { readFileSync, writeFileSync } from 'fs';
import { extname, basename, dirname, join } from 'path';
import { parse } from 'node-html-parser';




// Recursively convert parse5 nodes to el() JS code
function elementToJS(node) {

  if (node.nodeType === 3) return `'${node._rawText.trim()}'`;

  const tag = node.rawTagName;
  const attributes = node.attributes || {}
  const children = (node.childNodes || [])
    .map(elementToJS)
    .filter(Boolean); // filter out empty strings
  return `el(${JSON.stringify(tag)}, ${JSON.stringify(attributes)}, [${children.join(', ')}])`;
}

function htmlToJsPlugin(folder = 'src/templates') {
  return {
    name: 'vite-plugin-html-to-js',
    enforce: 'pre',
    load(id) {
      if (id.startsWith('\0')) return;
      if (id.includes(folder) && extname(id) === '.html') {
        console.log(`Processing HTML template: ${id}`);
        const tagName = basename(id, '.html');
        const html = readFileSync(id, 'utf-8');
        const document = parse(html);
        const template = document.childNodes.find((v) => v.rawTagName == 'template');
        if (!template || template.nodeType !== 1 || template.rawTagName !== 'template') {
          console.error(`Invalid template structure in ${id}`);
          return;
        }

        const defaultData = template.attributes || {};
        const children = template.children;
        let script = null
        let style = null
        let elements = []
        for (const child of children) {
          if (child.rawTagName === 'script') {
            if (script) {
              console.warn(`Multiple <script> tags found in ${id}. Only the first will be used.`);
            } else {
              script = child;
            }
          } else if (child.rawTagName === 'style') {
            if (style) {
              console.warn(`Multiple <style> tags found in ${id}. Only the first will be used.`);
            } else {
              style = child;
            }
          } else {
            elements.push(child);
          }
        }

        const jsCode = `
import { el } from '../lib/el.js';
import { template, TemplatedHTMLElement } from '../lib/template.js'

(function() {

  const defaultData = ${JSON.stringify(defaultData)};
  const defaultDataKeys = ${JSON.stringify(Object.keys(defaultData))};
  let template = null;

  function getTemplate() {
    if (!template) {
      template = new DocumentFragment();

      const style = document.createElement('style');
      style.textContent = ${JSON.stringify( style ? style.textContent : "")};
      template.appendChild(style);

      ${elements.map(child => `template.appendChild(${elementToJS(child)});`).join('\n')}
    }
    
    return template;
  }

  customElements.define('${tagName}', class extends TemplatedHTMLElement {

    static get observedAttributes() {
      return defaultDataKeys;
    }

    static formAssociated = true;

    constructor() {
      super(getTemplate(),defaultData,${JSON.stringify( script ? script.textContent : "")});
    }

  });

  console.log('Custom element defined:', '${tagName}');

})();`;

        // Write to a .js file with the same name
        const jsFile = join(dirname(id), basename(id, '.html') + '.js');
        writeFileSync(jsFile, jsCode, 'utf-8');

        return jsCode;
      }
    }
  }
};

export default {
  plugins: [htmlToJsPlugin('src/templates')],
};