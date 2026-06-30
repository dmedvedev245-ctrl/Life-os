import './style.css';
import { renderNav } from './components/Nav.js';
import { initRouter, navigate } from './router.js';
import { checkBirthdayNotifications, checkInboxReminders } from './notifications.js';
import { supabase, loadFromCloud } from './supabase.js';

const savedTheme = localStorage.getItem('life_os_theme');
if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/Life-os/sw.js').catch(() => {});
  });
}

const { data: { user } } = await supabase.auth.getUser();

if (user) {
  const cloudData = await loadFromCloud();
  if (cloudData) localStorage.setItem('life_os', JSON.stringify(cloudData));
  renderNav();
  initRouter();
  checkBirthdayNotifications();
  checkInboxReminders();
  setInterval(checkInboxReminders, 60000);
} else {
  initRouter();
  navigate('#/auth');
}

supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') {
    navigate('#/auth');
  }
});
