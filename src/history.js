
export function setupHistory(id, routes) {

  const container = document.getElementById(id);

  function renderContent() {
    const hash = window.location.hash.slice(1) || 'home'; // default to 'home'
    container.innerHTML = routes[hash] || '<h2>404</h2><p>Page not found.</p>';
  }

  // Render on hash change and initial load
  window.addEventListener('hashchange', renderContent);
  window.addEventListener('DOMContentLoaded', renderContent);

}
