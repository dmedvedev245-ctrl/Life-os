import './style.css';
import { renderNav } from './components/Nav.js';
import { initRouter, navigate } from './router.js';
import { checkBirthdayNotifications, checkInboxReminders, checkPaymentNotifications } from './notifications.js';
import { supabase, loadFromCloud } from './supabase.js';
import { ensurePushSubscription } from './push.js';

const savedTheme = localStorage.getItem('life_os_theme');
if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);

// iOS standalone PWA reports 100vh/100dvh shorter than the real screen height,
// leaving a gap of body background below the bottom nav — use the real window height instead.
function setAppHeight() {
  document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
}
setAppHeight();
window.addEventListener('resize', setAppHeight);
window.visualViewport?.addEventListener('resize', setAppHeight);

// iOS Safari ignores viewport user-scalable=no since iOS 16 — block zoom gestures in JS instead
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('gesturechange', e => e.preventDefault());
document.addEventListener('gestureend', e => e.preventDefault());

let lastTouchEnd = 0;
document.addEventListener('touchend', e => {
  const now = Date.now();
  if (now - lastTouchEnd <= 300) e.preventDefault();
  lastTouchEnd = now;
}, { passive: false });

document.addEventListener('touchmove', e => {
  if (e.touches.length > 1) e.preventDefault();
}, { passive: false });

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/Life-os/sw.js').catch(() => {});
  });

  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
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
      ensurePushSubscription().catch(() => {});
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
