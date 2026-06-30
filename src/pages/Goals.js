import { store } from '../store.js';
import { toast } from '../components/Toast.js';
import { openModal, closeModal } from '../components/Modal.js';

export class GoalsPage {
  render() {
    const el = document.createElement('div');
    this.el = el;
    this.draw();
    return el;
  }

  draw() {
    const goals = store.get('goals') || {};
    const main = goals.main || {};
    const subgoals = goals.subgoals || [];

    const daysLeft = main.deadline
      ? Math.ceil((new Date(main.deadline) - new Date()) / 86400000)
      : null;

    this.el.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
        <div class="page-title">🎯 Цели</div>
        <button class="btn btn-ghost btn-sm text-accent" id="edit-goal-btn">Изменить</button>
      </div>

      ${main.title ? `
      <div class="goal-hero">
        <div class="goal-title-large">${main.title}</div>
        ${daysLeft !== null ? `<div class="badge badge-${daysLeft < 7 ? 'danger' : daysLeft < 30 ? 'warning' : 'accent'}" style="margin-bottom:12px;">📅 ${daysLeft > 0 ? `${daysLeft} дней осталось` : 'Дедлайн прошёл'}</div>` : ''}
        <div class="goal-progress-text">
          <span>Прогресс</span>
          <span style="font-weight:700;">${main.progress || 0}%</span>
        </div>
        <div class="progress-bar" style="height:8px; margin-bottom:16px;">
          <div class="progress-fill" style="width:${main.progress || 0}%; background: linear-gradient(90deg, var(--accent), #8B5CF6);"></div>
        </div>
        <div style="display:flex; gap:8px; justify-content:center;">
          ${[10,25,50,75,90,100].map(p => `<button class="btn btn-sm ${main.progress===p?'btn-primary':'btn-secondary'}" data-pct="${p}">${p}%</button>`).join('')}
        </div>
        ${main.next_step ? `
          <div style="margin-top:16px; padding-top:16px; border-top:1px solid rgba(255,255,255,0.1); text-align:left;">
            <div class="text-xs text-muted" style="margin-bottom:4px;">СЛЕДУЮЩИЙ ШАГ</div>
            <div style="font-size:15px; color:var(--text);">→ ${main.next_step}</div>
          </div>
        ` : ''}
        ${main.motivation ? `
          <div style="margin-top:12px; font-size:13px; color:var(--text-muted); font-style:italic;">"${main.motivation}"</div>
        ` : ''}
      </div>
      ` : `
      <div class="card accent-card" style="margin-bottom:20px; text-align:center; padding:32px;">
        <div style="font-size:40px; margin-bottom:12px;">🎯</div>
        <div style="font-size:16px; font-weight:600; margin-bottom:8px;">Поставьте главную цель</div>
        <div class="text-secondary text-sm" style="margin-bottom:16px;">Одна большая цель — максимум концентрации</div>
        <button class="btn btn-primary" id="set-goal-inline-btn">Поставить цель</button>
      </div>
      `}

      <div class="section-header" style="margin-top:${main.title ? '20px' : '0'};">
        <span class="section-title">Подцели</span>
        <button class="btn btn-ghost btn-sm text-accent" id="add-subgoal-btn">+ Добавить</button>
      </div>

      <div id="subgoals-list">
        ${subgoals.length === 0 ? `
          <div class="empty-state" style="padding:24px 0;">
            <div class="empty-state-text">Разбейте большую цель на конкретные шаги</div>
          </div>
        ` : subgoals.map((s, i) => `
          <div class="list-item">
            <div class="checkbox ${s.done ? 'checked' : ''}" data-sub="${i}">${s.done ? '✓' : ''}</div>
            <div class="list-item-body">
              <div class="list-item-title ${s.done ? 'line-through text-muted' : ''}">${s.title}</div>
              ${s.deadline ? `<div class="list-item-sub">до ${new Date(s.deadline).toLocaleDateString('ru', {day:'numeric',month:'long'})}</div>` : ''}
            </div>
            <button class="btn btn-ghost btn-icon text-muted" data-del-sub="${i}">✕</button>
          </div>
        `).join('')}
      </div>
    `;

    this.el.querySelector('#edit-goal-btn')?.addEventListener('click', () => this.editGoal(main));
    this.el.querySelector('#set-goal-inline-btn')?.addEventListener('click', () => this.editGoal(main));
    this.el.querySelector('#add-subgoal-btn')?.addEventListener('click', () => this.addSubgoal());

    this.el.querySelectorAll('[data-pct]').forEach(btn => {
      btn.addEventListener('click', () => {
        store.set('goals.main.progress', parseInt(btn.dataset.pct));
        this.draw();
        toast('Прогресс обновлён ✓');
      });
    });

    this.el.querySelector('#subgoals-list')?.addEventListener('click', e => {
      const cb = e.target.closest('[data-sub]');
      if (cb) {
        const idx = parseInt(cb.dataset.sub);
        const subs = store.get('goals.subgoals') || [];
        subs[idx].done = !subs[idx].done;
        store.set('goals.subgoals', subs);
        this.draw();
      }
      const del = e.target.closest('[data-del-sub]');
      if (del) {
        const idx = parseInt(del.dataset.delSub);
        const subs = store.get('goals.subgoals') || [];
        subs.splice(idx, 1);
        store.set('goals.subgoals', subs);
        this.draw();
        toast('Подцель удалена');
      }
    });
  }

  editGoal(main) {
    const body = document.createElement('div');
    body.innerHTML = `
      <div class="input-group"><label class="input-label">Главная цель</label><input class="input" id="g-title" placeholder="Закрыть все кредиты" value="${main.title || ''}"></div>
      <div class="input-group"><label class="input-label">Дедлайн</label><input class="input" id="g-deadline" type="date" value="${main.deadline || ''}"></div>
      <div class="input-group"><label class="input-label">Следующий шаг</label><input class="input" id="g-next" placeholder="Что конкретно делаю сегодня" value="${main.next_step || ''}"></div>
      <div class="input-group"><label class="input-label">Мотивация (почему это важно)</label><textarea class="input" id="g-motiv" placeholder="Ради чего...">${main.motivation || ''}</textarea></div>
    `;
    openModal({
      title: 'Главная цель',
      content: body,
      actions: [
        { label: 'Сохранить', cls: 'btn-primary', onClick: (m) => {
          const title = m.querySelector('#g-title').value.trim();
          if (!title) return;
          store.set('goals.main', {
            title,
            deadline: m.querySelector('#g-deadline').value,
            next_step: m.querySelector('#g-next').value.trim(),
            motivation: m.querySelector('#g-motiv').value.trim(),
            progress: main.progress || 0
          });
          this.draw();
          closeModal();
          toast('Цель сохранена ✓');
        }},
        { label: 'Отмена', cls: 'btn-secondary', onClick: () => closeModal() }
      ]
    });
    setTimeout(() => body.querySelector('#g-title')?.focus(), 100);
  }

  addSubgoal() {
    const body = document.createElement('div');
    body.innerHTML = `
      <div class="input-group"><label class="input-label">Подцель</label><input class="input" id="sg-title" placeholder="Конкретный шаг"></div>
      <div class="input-group"><label class="input-label">Дедлайн (необязательно)</label><input class="input" id="sg-deadline" type="date"></div>
    `;
    openModal({
      title: 'Новая подцель',
      content: body,
      actions: [
        { label: 'Добавить', cls: 'btn-primary', onClick: (m) => {
          const title = m.querySelector('#sg-title').value.trim();
          if (!title) return;
          store.update('goals.subgoals', arr => [...(arr||[]), {
            title,
            deadline: m.querySelector('#sg-deadline').value,
            done: false
          }]);
          this.draw();
          closeModal();
          toast('Подцель добавлена ✓');
        }},
        { label: 'Отмена', cls: 'btn-secondary', onClick: () => closeModal() }
      ]
    });
    setTimeout(() => body.querySelector('#sg-title')?.focus(), 100);
  }
}
