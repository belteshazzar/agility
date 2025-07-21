import './style.css'

import { bind } from './lib/bind.js'
import { template } from './lib/template.js'

import { setupDraggable } from './draggable.js'
import { setupHistory } from './history.js'

import './templates/x-counter.html';
import './templates/x-user-card.html';
import './templates/x-toggle.html';

import ReactiveStore from './lib/store.js'

const store = new ReactiveStore();
store.subscribe((value,path) => {
  console.log('Store updated @ ' + path, value);
})

store.inputs = []
store.inputs[0].bind(document.querySelector('input[type=range]'))

store.inputs[1].bind(document.querySelector('input[type=button]'))
store.inputs[2].bind(document.querySelector('input[type=checkbox]'))
store.inputs[3].bind(document.querySelector('input[type=color]'))
store.inputs[4].bind(document.querySelector('input[type=date]'))
store.inputs[5].bind(document.querySelector('input[type=datetime-local]'))
store.inputs[6].bind(document.querySelector('input[type=email]'))
store.inputs[7].bind(document.querySelector('input[type=file]'))
store.inputs[8].bind(document.querySelector('input[type=hidden]'))
store.inputs[9].bind(document.querySelector('input[type=image]'))
store.inputs[10].bind(document.querySelector('input[type=month]'))
store.inputs[11].bind(document.querySelector('input[type=number]'))
store.inputs[12].bind(document.querySelector('input[type=password]'))

store.inputs[13].bind(document.querySelectorAll('input[name=fav_language]'))

store.inputs[14].bind(document.querySelector('input[type=range]'))
store.inputs[15].bind(document.querySelector('input[type=reset]'))
store.inputs[16].bind(document.querySelector('input[type=search]'))
store.inputs[17].bind(document.querySelector('input[type=submit]'))
store.inputs[18].bind(document.querySelector('input[type=tel]'))
store.inputs[19].bind(document.querySelector('input[type=text]'))
store.inputs[20].bind(document.querySelector('input[type=time]'))
store.inputs[21].bind(document.querySelector('input[type=url]'))
store.inputs[22].bind(document.querySelector('input[type=week]'))

store.inputs[23].bind(document.querySelector('#cars')) // select
store.inputs[24].bind(document.querySelector('#grouped-cars')) // select with optgroups
store.inputs[25].bind(document.querySelector('#message')) // text area
store.inputs[26].bind(document.querySelector('button'))
store.inputs[27].bind(document.querySelector('#datalist-input')) // input from datalist


store.a.bind(document.querySelector('#a'))
store.b.bind(document.querySelector('#b'))
store.x = (s) => s.a*1 + s.b*1;
store.x.bind(document.querySelector('#x'))

store.a.bind(document.querySelector('input[type=range]'))

    const userCard = document.getElementById("user2");
    // Example: reactive update
    setTimeout(() => {
      userCard.data.name = 'Alice Cooper';
      userCard.data.email = 'acooper@example.com';
    }, 2000);

    // Example: attribute update
    setTimeout(() => {
      userCard.setAttribute('name','Bethany Attribute');
      userCard.setAttribute('email','battribute@example.com');
    }, 4000);

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
