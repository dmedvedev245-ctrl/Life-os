import { navigate } from '../router.js';

const NAV_ITEMS = [
  { hash: '#/dashboard', icon: '🏠', label: 'Главная' },
  { hash: '#/finance', icon: '💰', label: 'Финансы' },
  { hash: 'fab', icon: '+', label: '' },
  { hash: '#/goals', icon: '🎯', label: 'Цели' },
  { hash: '#/more', icon: '☰', label: 'Ещё' }
];

export function renderNav() {
  const nav = document.getElementById('bottom-nav');
  nav.innerHTML = '';

  NAV_ITEMS.forEach(item => {
    if (item.hash === 'fab') {
      const fab = document.createElement('button');
      fab.className = 'nav-fab';
      fab.textContent = '+';
      fab.setAttribute('aria-label', 'Добавить в Inbox');
      fab.addEventListener('click', () => navigate('#/inbox'));
      nav.appendChild(fab);
    } else {
      const el = document.createElement('button');
      el.className = 'nav-item';
      el.dataset.hash = item.hash;
      el.innerHTML = `<span class="nav-icon">${item.icon}</span><span>${item.label}</span>`;
      el.addEventListener('click', () => navigate(item.hash));
      nav.appendChild(el);
    }
  });

  const currentHash = window.location.hash || '#/dashboard';
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.hash === currentHash);
  });
}
