import './style.css'

import { bind } from './lib/bind.js'
import { template } from './lib/template.js'

import { setupDraggable } from './draggable.js'
import { setupHistory } from './history.js'

const templates = import.meta.glob('./templates/*.html', { query: '?raw' });

async function loadTemplate(name) {
  const path = `./templates/${name}.html`;
  const loader = templates[path];

  if (loader) {
    const content = await loader();
    return content.default; // returns the HTML string
  } else {
    throw new Error(`Template "${name}" not found`);
  }
}

// Usage:
loadTemplate('x-user-card').then(html => {
  template('x-user-card', html);
});
loadTemplate('x-counter').then(html => {
  template('x-counter', html);
});
loadTemplate('x-toggle').then(html => {
  template('x-toggle', html);
});


    const userCard = document.getElementById("user2");
    // userCard.setAttribute("name", "Steve Alonso");
    // userCard.data = {
    //   name: 'Alice',
    //   email: 'alice@example.com',
    //   profile: 'https://example.com/alice'
    // };

    // Example: reactive update
    setTimeout(() => {
      userCard.data.name = 'Alice Cooper';
      userCard.data.email = 'acooper@example.com';
    }, 2000);


setupHistory('content', {
  home: '<h2>Home Page</h2><p>Welcome to the home page.</p>',
  about: '<h2>About Page</h2><p>This is the about section.</p>',
  contact: '<h2>Contact Page</h2><p>Contact us at contact@example.com.</p>'
});

setupDraggable('draggable');

document.querySelector('#app').innerHTML = `
  <div>
    <h1>Hello Vite!</h1>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    <p class="read-the-docs">
      Click on the Vite logo to learn more
    </p>
  </div>
`

bind('#input-value').to('input','#cars','#grouped-cars','#message','button')

//bind('output').to( ([a,b]) => parseInt(a) + parseInt(b) ).to('#a','#b')
bind('output').to( ({a,b}) => parseInt(a) + parseInt(b) ).to({ a: '#a', b: '#b' })

bind(document.querySelectorAll('input[type=range]')[0]).to(document.querySelectorAll('input[type=range]')[1])

var observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    console.log(mutation)
  })
});      


let r = document.querySelector('input[type=range]')
console.log(r)
observer.observe(r,{attributes:true})
r.setAttribute('value',10)

