import { store } from '../store.js';
import { toast } from '../components/Toast.js';

function getWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0,0,0,0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

const QUESTIONS = [
  { key: 'wins', label: '✅ Что получилось?', placeholder: 'Главные победы недели...' },
  { key: 'useless', label: '🗑 Что было бесполезным?', placeholder: 'Что потратило время без пользы...' },
  { key: 'money', label: '💰 Что принесло деньги?', placeholder: 'Источники дохода или ключевые действия...' },
  { key: 'energy', label: '⚡ Что забрало энергию?', placeholder: 'Что истощало...' },
  { key: 'next_goal', label: '🎯 Главная цель следующей недели', placeholder: 'Одна главная задача...' },
  { key: 'stop', label: '🚫 Что нужно перестать делать?', placeholder: 'Привычки / действия которые мешают...' }
];

const RATING_EMOJIS = ['😫','😞','😐','🙂','😊','😄','🥳','💪','🔥','⭐'];

export class WeeklyPage {
  render() {
    const el = document.createElement('div');
    this.el = el;
    this.draw();
    return el;
  }

  draw() {
    const reviews = store.get('weekly') || [];
    const today = new Date();
    const weekNum = getWeekNumber(today);
    const yearWeekKey = `${today.getFullYear()}-W${weekNum}`;
    const current = reviews.find(r => r.key === yearWeekKey) || { key: yearWeekKey, rating: 0 };
    const past = reviews.filter(r => r.key !== yearWeekKey).sort((a,b)=>b.key.localeCompare(a.key));

    this.el.innerHTML = `
      <div class="page-title" style="margin-bottom:4px;">📋 Обзор недели</div>
      <div class="page-subtitle" style="margin-bottom:20px;">Неделя ${weekNum} · ${today.toLocaleDateString('ru',{month:'long',year:'numeric'})}</div>

      <div class="card" style="margin-bottom:16px;">
        ${QUESTIONS.map(q => `
          <div class="weekly-question">
            <div class="weekly-question-label">${q.label}</div>
            <textarea class="input" data-key="${q.key}" rows="2" placeholder="${q.placeholder}">${current[q.key]||''}</textarea>
          </div>
        `).join('')}

        <div class="weekly-question">
          <div class="weekly-question-label">⭐ Оценка недели (1–10)</div>
          <div class="rating-selector" id="rating-selector">
            ${[1,2,3,4,5,6,7,8,9,10].map(n => `
              <div class="rating-btn ${current.rating===n?'selected':''}" data-rating="${n}">${n}</div>
            `).join('')}
          </div>
          ${current.rating ? `<div style="margin-top:8px; font-size:24px; text-align:center;">${RATING_EMOJIS[current.rating-1]}</div>` : ''}
        </div>

        <button class="btn btn-primary btn-full" id="save-weekly-btn" style="margin-top:8px;">Сохранить обзор ✓</button>
      </div>

      ${past.length > 0 ? `
      <div class="section-title" style="margin-bottom:12px;">Прошлые обзоры</div>
      <div id="past-reviews">
        ${past.map((r, i) => `
          <div class="card" style="margin-bottom:10px;">
            <div style="display:flex; justify-content:space-between; align-items:center; cursor:pointer;" data-toggle-review="${i}">
              <div>
                <div style="font-weight:600;">${r.key}</div>
                ${r.next_goal ? `<div class="text-sm text-muted">${r.next_goal}</div>` : ''}
              </div>
              <div style="display:flex; align-items:center; gap:8px;">
                ${r.rating ? `<span style="font-size:20px;">${RATING_EMOJIS[r.rating-1]}</span><span class="badge badge-accent">${r.rating}/10</span>` : ''}
              </div>
            </div>
            <div class="review-details" id="review-${i}" style="display:none; margin-top:12px; border-top:1px solid var(--border); padding-top:12px;">
              ${QUESTIONS.filter(q=>r[q.key]).map(q=>`
                <div style="margin-bottom:10px;">
                  <div class="text-xs text-muted" style="margin-bottom:4px;">${q.label}</div>
                  <div class="text-sm" style="white-space:pre-wrap;">${r[q.key]}</div>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
      ` : ''}
    `;

    const getFormData = () => {
      const data = { ...current };
      this.el.querySelectorAll('[data-key]').forEach(ta => {
        data[ta.dataset.key] = ta.value;
      });
      return data;
    };

    this.el.querySelectorAll('[data-key]').forEach(ta => {
      ta.addEventListener('input', () => {
        clearTimeout(this._saveTimer);
        this._saveTimer = setTimeout(() => {
          const reviews = store.get('weekly') || [];
          const data = getFormData();
          const idx = reviews.findIndex(r => r.key === yearWeekKey);
          if (idx >= 0) reviews[idx] = data;
          else reviews.push(data);
          store.set('weekly', reviews);
        }, 600);
      });
    });

    this.el.querySelector('#rating-selector')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-rating]');
      if (!btn) return;
      const rating = parseInt(btn.dataset.rating);
      const reviews = store.get('weekly') || [];
      const data = { ...getFormData(), rating };
      const idx = reviews.findIndex(r => r.key === yearWeekKey);
      if (idx >= 0) reviews[idx] = data;
      else reviews.push(data);
      store.set('weekly', reviews);
      this.draw();
    });

    this.el.querySelector('#save-weekly-btn')?.addEventListener('click', () => {
      const reviews = store.get('weekly') || [];
      const data = getFormData();
      const idx = reviews.findIndex(r => r.key === yearWeekKey);
      if (idx >= 0) reviews[idx] = data;
      else reviews.push(data);
      store.set('weekly', reviews);
      toast('Обзор сохранён ✓');
    });

    this.el.querySelector('#past-reviews')?.addEventListener('click', e => {
      const toggle = e.target.closest('[data-toggle-review]');
      if (toggle) {
        const idx = toggle.dataset.toggleReview;
        const details = this.el.querySelector(`#review-${idx}`);
        if (details) details.style.display = details.style.display === 'none' ? 'block' : 'none';
      }
    });
  }
}
