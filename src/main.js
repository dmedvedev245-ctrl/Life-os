import './style.css';
import { renderNav } from './components/Nav.js';
import { initRouter } from './router.js';
import { checkBirthdayNotifications } from './notifications.js';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/Life-os/sw.js').catch(() => {});
  });
}

renderNav();
initRouter();

// Проверяем дни рождения при каждом открытии (один раз в день)
checkBirthdayNotifications();
