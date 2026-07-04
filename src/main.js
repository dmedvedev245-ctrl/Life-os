import './style.css';
import { renderNav } from './components/Nav.js';
import { initRouter, navigate } from './router.js';
import { checkBirthdayNotifications, checkInboxReminders, checkPaymentNotifications } from './notifications.js';
import { supabase, loadFromCloud } from './supabase.js';

const savedTheme = localStorage.getItem('life_os_theme');
if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/Life-os/sw.js').catch(() => {});
  });
}

async function init() {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      try {
        const cloudData = await loadFromCloud();
        if (cloudData) localStorage.setItem('life_os', JSON.stringify(cloudData));
      } catch (e) {
        console.warn('Cloud sync failed, using local data');
      }
      renderNav();
      initRouter();
      checkBirthdayNotifications();
      checkPaymentNotifications();
      checkInboxReminders();
      setInterval(checkInboxReminders, 60000);
    } else {
      initRouter();
      navigate('#/auth');
    }
  } catch (e) {
    console.error('Init error:', e);
    initRouter();
    navigate('#/auth');
  }

  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      navigate('#/auth');
    }
  });
}

init();
