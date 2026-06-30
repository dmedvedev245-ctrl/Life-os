import { store } from '../store.js';
import { toast } from '../components/Toast.js';
import { openModal, closeModal } from '../components/Modal.js';

const HABIT_COLORS = ['#6366F1','#22C55E','#F59E0B','#EF4444','#8B5CF6','#EC4899','#14B8A6','#F97316'];
const HABIT_EMOJIS = ['💪','🏃','📚','💧','🧘','🚭','😴','🥗','🎯','✍️','🎵','🧹'];
const DAY_LABELS = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];

function getTodayStr() { return new Date().toISOString().split('T')[0]; }

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
}

function getLast30Days() {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split('T')[0];
  });
}

function calcStreak(completions) {
  if (!completions?.length) return 0;
  const set = new Set(completions);
  let streak = 0;
  const d = new Date();
  while (true) {
    const str = d.toISOString().split('T')[0];
    if (set.has(str)) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return streak;
}

function weekPercent(completions) {
  const last7 = getLast7Days();
  const done = last7.filter(d => completions?.includes(d)).length;
  return Math.round((done / 7) * 100);
}

export class HabitsPage {
  constructor() { this.view = '7d'; }

  render() {
    const el = document.createElement('div');
    this.el = el;
    this.draw();
    return el;
  }

  draw() {
    const habits = store.get('habits') || [];
    const today = getTodayStr();
    const last7 = getLast7Days();
    const doneTodayCount = habits.filter(h => h.completions?.includes(today)).length;

    this.el.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
        <div class="page-title">✅ Привычки</div>
        <div style="display:flex; gap:6px;">
          ${habits.length > 0 ? `<button class="btn btn-ghost btn-sm text-accent" id="view-toggle">${this.view === '7d' ? '30 дн' : '7 дн'}</button>` : ''}
          <button class="btn btn-ghost btn-sm text-accent" id="add-habit-btn">+ Добавить</button>
        </div>
      </div>

      ${habits.length > 0 ? `
        <div class="habit-summary">
          <span class="habit-summary-count">${doneTodayCount} из ${habits.length}</span>
          <span class="habit-summary-label">выполнено сегодня</span>
          <div class="habit-summary-bar">
            <div class="habit-summary-fill" style="width:${habits.length > 0 ? Math.round(doneTodayCount/habits.length*100) : 0}%"></div>
          </div>
        </div>
      ` : ''}

      ${habits.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">🔥</div>
          <div class="empty-state-title">Нет привычек</div>
          <div class="empty-state-text">Добавьте ежедневные ритуалы которые хотите закрепить</div>
          <div class="habit-suggestions">
            ${['💪 Тренировка','📚 Читать','💧 Вода','😴 Спать до 23:00','🚭 Не курить'].map(s => `
              <button class="habit-suggest-btn" data-suggest="${s}">${s}</button>
            `).join('')}
          </div>
        </div>
      ` : `
        <div id="habits-list">
          ${habits.map((h, i) => this.renderHabit(h, i, today, last7)).join('')}
        </div>
      `}
    `;

    this.el.querySelector('#add-habit-btn')?.addEventListener('click', () => this.addHabit());

    this.el.querySelector('#view-toggle')?.addEventListener('click', () => {
      this.view = this.view === '7d' ? '30d' : '7d';
      this.draw();
    });

    this.el.querySelectorAll('[data-suggest]').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.dataset.suggest;
        const emoji = val.split(' ')[0];
        const name = val.split(' ').slice(1).join(' ');
        store.update('habits', arr => [...(arr||[]), { name, emoji, completions: [], created: Date.now() }]);
        this.draw();
        toast(`${val} добавлена ✓`);
      });
    });

    this.el.querySelector('#habits-list')?.addEventListener('click', e => {
      const toggle = e.target.closest('[data-toggle]');
      if (toggle) { this.toggleDay(parseInt(toggle.dataset.toggle), toggle.dataset.day || getTodayStr()); return; }
      const del = e.target.closest('[data-del-habit]');
      if (del) {
        const idx = parseInt(del.dataset.delHabit);
        if (!confirm('Удалить привычку?')) return;
        const habits = store.get('habits') || [];
        habits.splice(idx, 1);
        store.set('habits', habits);
        this.draw();
        toast('Удалено');
      }
    });
  }

  renderHabit(h, i, today, last7) {
    const completions = h.completions || [];
    const streak = calcStreak(completions);
    const pct = weekPercent(completions);
    const todayDone = completions.includes(today);
    const color = HABIT_COLORS[i % HABIT_COLORS.length];
    const emoji = h.emoji || '✅';

    const forecastText = pct >= 80 ? '🔥 Формируется' : pct >= 50 ? '📈 Постоянство' : '🔄 Заново';
    const forecastColor = pct >= 80 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--text-muted)';

    const gridHtml = this.view === '7d'
      ? this.render7DayGrid(completions, last7, today, i, color)
      : this.render30DayGrid(completions, today, i, color);

    return `
      <div class="habit-card" style="border-left:3px solid ${color}; background:${color}0d;">
        <div class="habit-card-top">
          <button class="habit-big-check ${todayDone ? 'done' : ''}"
            style="${todayDone ? `background:${color}; border-color:${color};` : `border-color:${color}44;`}"
            data-toggle="${i}">
            ${todayDone ? '✓' : ''}
          </button>
          <div class="habit-card-info">
            <div class="habit-card-name ${todayDone ? 'done' : ''}">${emoji} ${h.name}</div>
            <div class="habit-card-meta">
              ${streak > 0 ? `<span class="habit-streak-badge">🔥 ${streak} ${streak === 1 ? 'день' : streak < 5 ? 'дня' : 'дней'}</span>` : '<span style="color:var(--text-muted);font-size:12px;">Начни сегодня</span>'}
              <span class="habit-week-pct" style="color:${color}">${pct}% нед.</span>
            </div>
          </div>
          <button class="btn btn-ghost btn-icon text-muted habit-del-btn" data-del-habit="${i}">✕</button>
        </div>

        ${gridHtml}

        <div class="habit-forecast" style="color:${forecastColor}">${forecastText}</div>
      </div>
    `;
  }

  render7DayGrid(completions, last7, today, idx, color) {
    return `
      <div class="habit-grid-row">
        ${last7.map(d => {
          const done = completions.includes(d);
          const isToday = d === today;
          return `
            <div class="habit-dot-wrap">
              <div class="habit-dot ${done ? 'done' : ''} ${isToday ? 'is-today' : ''}"
                style="${done ? `background:${color}; border-color:${color};` : isToday ? `border-color:${color};` : ''}"
                data-toggle="${idx}" data-day="${d}">
                ${done ? '✓' : ''}
              </div>
              <div class="habit-dot-label ${isToday ? 'today-label' : ''}">${DAY_LABELS[new Date(d + 'T12:00:00').getDay()]}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  render30DayGrid(completions, today, idx, color) {
    const last30 = getLast30Days();
    return `
      <div class="habit-month-grid">
        ${last30.map(d => {
          const done = completions.includes(d);
          const isToday = d === today;
          return `
            <div class="habit-month-dot ${done ? 'done' : ''} ${isToday ? 'today' : ''}"
              style="${done ? `background:${color}; border-color:${color};` : isToday ? `border-color:${color}; border-width:2px;` : ''}"
              data-toggle="${idx}" data-day="${d}" title="${d}"></div>
          `;
        }).join('')}
      </div>
    `;
  }

  toggleDay(idx, day) {
    const habits = store.get('habits') || [];
    const completions = habits[idx].completions || [];
    const wasDone = completions.includes(day);
    habits[idx].completions = wasDone
      ? completions.filter(d => d !== day)
      : [...completions, day];
    store.set('habits', habits);
    if (!wasDone && day === getTodayStr()) toast(`${habits[idx].emoji || '✅'} ${habits[idx].name} ✓`);
    this.draw();
  }

  addHabit() {
    const body = document.createElement('div');
    body.innerHTML = `
      <div class="input-group">
        <label class="input-label">Эмодзи</label>
        <div class="emoji-picker">
          ${HABIT_EMOJIS.map(e => `<button class="emoji-btn" data-emoji="${e}">${e}</button>`).join('')}
        </div>
        <input type="hidden" id="habit-emoji" value="✅">
      </div>
      <div class="input-group">
        <label class="input-label">Название</label>
        <input class="input" id="habit-name" placeholder="Тренировка / Читать / Вода">
      </div>
    `;

    body.querySelectorAll('.emoji-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        body.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        body.querySelector('#habit-emoji').value = btn.dataset.emoji;
      });
    });

    openModal({
      title: 'Новая привычка',
      content: body,
      actions: [
        { label: 'Добавить', cls: 'btn-primary', onClick: (m) => {
          const name = m.querySelector('#habit-name').value.trim();
          if (!name) { toast('Введите название'); return; }
          const emoji = m.querySelector('#habit-emoji').value;
          store.update('habits', arr => [...(arr||[]), { name, emoji, completions: [], created: Date.now() }]);
          this.draw();
          closeModal();
          toast(`${emoji} ${name} добавлена ✓`);
        }},
        { label: 'Отмена', cls: 'btn-secondary', onClick: () => closeModal() }
      ]
    });
    setTimeout(() => body.querySelector('#habit-name')?.focus(), 100);
  }
}
