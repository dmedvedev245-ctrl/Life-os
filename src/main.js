import './style.css';
import { renderNav } from './components/Nav.js';
import { initRouter } from './router.js';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

renderNav();
initRouter();
