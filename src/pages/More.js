import { navigate } from '../router.js';

const SECTIONS = [
  { hash: '#/goals', icon: '🎯', title: 'Цели', desc: 'Главная цель и подцели' },
  { hash: '#/work', icon: '💼', title: 'Работа', desc: 'Продажи и идеи' },
  { hash: '#/relations', icon: '❤️', title: 'Отношения', desc: 'Свидания и планы' },
  { hash: '#/friends', icon: '👥', title: 'Друзья', desc: 'Контакты и общение' },
  { hash: '#/health', icon: '🏃', title: 'Здоровье', desc: 'Сон, вес, энергия' },
  { hash: '#/weekly', icon: '📋', title: 'Обзор недели', desc: 'Рефлексия и план' },
  { hash: '#/stats', icon: '📊', title: 'Статистика', desc: 'Графики и тренды' },
  { hash: '#/planner', icon: '🕐', title: 'Расписание', desc: 'Блоки по дням и времени' },
  { hash: '#/debtplan', icon: '🔥', title: 'План погашения', desc: 'Лавина: когда будешь чист' }
];

export class MorePage {
  render() {
    const el = document.createElement('div');
    el.innerHTML = `
      <div class="page-title" style="margin-bottom:20px;">Все разделы</div>
      <div class="more-grid">
        ${SECTIONS.map(s => `
          <div class="more-card" data-nav="${s.hash}">
            <div class="more-card-icon">${s.icon}</div>
            <div class="more-card-title">${s.title}</div>
            <div class="text-xs text-muted">${s.desc}</div>
          </div>
        `).join('')}
      </div>
    `;

    el.querySelectorAll('[data-nav]').forEach(card => {
      card.addEventListener('click', () => navigate(card.dataset.nav));
    });

    return el;
  }
}
