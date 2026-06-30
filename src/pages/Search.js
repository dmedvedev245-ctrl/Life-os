import { store } from '../store.js';
import { navigate } from '../router.js';

function highlight(text, query) {
  if (!query || !text) return text || '';
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return String(text).replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
}

export class SearchPage {
  constructor() { this.query = ''; }

  render() {
    const el = document.createElement('div');
    this.el = el;
    el.innerHTML = `
      <div class="page-title" style="margin-bottom:16px;">🔍 Поиск</div>
      <input class="input" id="search-input" placeholder="Введите запрос..." autocomplete="off" style="margin-bottom:16px;">
      <div id="search-results"></div>
    `;

    const input = el.querySelector('#search-input');
    const results = el.querySelector('#search-results');

    input.addEventListener('input', () => {
      this.query = input.value.trim();
      results.innerHTML = this.renderResults(this.query);
      results.querySelectorAll('[data-nav]').forEach(item => {
        item.addEventListener('click', () => navigate(item.dataset.nav));
      });
    });

    results.innerHTML = this.renderResults('');
    setTimeout(() => input.focus(), 100);
    return el;
  }

  search(q) {
    if (!q || q.length < 2) return [];
    const ql = q.toLowerCase();
    const data = store.getAll();
    const results = [];

    (data.inbox || []).forEach(item => {
      if (item.text?.toLowerCase().includes(ql))
        results.push({ section: '📥 Inbox', text: item.text, nav: '#/inbox' });
    });

    if (data.goals?.main?.title?.toLowerCase().includes(ql))
      results.push({ section: '🎯 Цели', text: data.goals.main.title, nav: '#/goals' });

    (data.goals?.subgoals || []).forEach(sg => {
      if (sg.text?.toLowerCase().includes(ql))
        results.push({ section: '🎯 Цели', text: sg.text, nav: '#/goals' });
    });

    (data.habits || []).forEach(h => {
      if (h.name?.toLowerCase().includes(ql))
        results.push({ section: '✅ Привычки', text: `${h.emoji || ''} ${h.name}`, nav: '#/habits' });
    });

    (data.friends || []).forEach(f => {
      if (f.name?.toLowerCase().includes(ql) || f.notes?.toLowerCase().includes(ql))
        results.push({ section: '👥 Друзья', text: f.name, sub: f.notes || '', nav: '#/friends' });
    });

    (data.finance?.cards || []).forEach(c => {
      if (c.bank?.toLowerCase().includes(ql))
        results.push({ section: '💳 Финансы', text: c.bank, nav: '#/finance' });
    });

    (data.finance?.debts || []).forEach(d => {
      if (d.creditor?.toLowerCase().includes(ql))
        results.push({ section: '💰 Финансы', text: d.creditor, nav: '#/finance' });
    });

    (data.work?.ideas || []).forEach(idea => {
      if (idea.text?.toLowerCase().includes(ql))
        results.push({ section: '💼 Работа', text: idea.text, nav: '#/work' });
    });

    (data.dashboard?.daily_tasks || []).forEach(t => {
      if (t.text?.toLowerCase().includes(ql))
        results.push({ section: '☑️ Задачи', text: t.text, nav: '#/dashboard' });
    });

    return results;
  }

  renderResults(q) {
    if (!q || q.length < 2) {
      return `<div class="text-muted text-sm" style="text-align:center; padding:32px 0;">Введите минимум 2 символа для поиска</div>`;
    }
    const results = this.search(q);
    if (!results.length) {
      return `<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-title">Ничего не найдено</div><div class="empty-state-text">Попробуйте другой запрос</div></div>`;
    }
    return results.map(r => `
      <div class="list-item search-result-item" data-nav="${r.nav}" style="cursor:pointer;">
        <div class="list-item-body">
          <div class="list-item-sub" style="margin-bottom:2px;">${r.section}</div>
          <div class="list-item-title">${highlight(r.text, q)}</div>
          ${r.sub ? `<div class="list-item-sub">${highlight(r.sub, q)}</div>` : ''}
        </div>
        <span style="color:var(--text-muted); font-size:18px;">›</span>
      </div>
    `).join('');
  }
}
