import { store } from '../store.js';
import { toast } from '../components/Toast.js';
import { openModal, closeModal } from '../components/Modal.js';

let debounceTimer;
function debounce(fn, ms = 500) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(fn, ms);
}

export class WorkPage {
  render() {
    const el = document.createElement('div');
    this.el = el;
    this.draw();
    return el;
  }

  draw() {
    const w = store.get('work') || {};
    const progress = w.plan > 0 ? Math.min(100, Math.round((w.fact / w.plan) * 100)) : 0;
    const fmt = n => Number(n||0).toLocaleString('ru') + ' ₽';

    this.el.innerHTML = `
      <div class="page-title" style="margin-bottom:16px;">💼 Работа</div>

      <div class="metric-grid">
        <div class="metric-card">
          <div class="metric-value">${fmt(w.sales_today)}</div>
          <div class="metric-label">Продажи сегодня</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${fmt(w.profit)}</div>
          <div class="metric-label">Прибыль</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${fmt(w.avg_check)}</div>
          <div class="metric-label">Средний чек</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${w.conversion || 0}%</div>
          <div class="metric-label">Конверсия</div>
        </div>
      </div>

      <button class="btn btn-secondary btn-sm" id="edit-metrics-btn" style="margin-bottom:16px;">✏️ Обновить показатели</button>

      <div class="card" style="margin-bottom:16px;">
        <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
          <div>
            <div class="text-xs text-muted">ПЛАН</div>
            <div style="font-size:18px; font-weight:700;">${fmt(w.plan)}</div>
          </div>
          <div style="text-align:right;">
            <div class="text-xs text-muted">ФАКТ</div>
            <div style="font-size:18px; font-weight:700; color:${progress>=100?'var(--success)':progress>=70?'var(--warning)':'var(--text)'};">${fmt(w.fact)}</div>
          </div>
        </div>
        <div class="progress-bar" style="height:8px; margin-bottom:6px;">
          <div class="progress-fill ${progress>=100?'success':progress>=50?'':'danger'}" style="width:${progress}%"></div>
        </div>
        <div class="text-xs text-muted">${progress}% от плана</div>
      </div>

      <div class="card" style="margin-bottom:16px;">
        <div class="section-block-title">🚀 Что увеличить завтра</div>
        <textarea class="input" id="tomorrow-input" placeholder="Конкретная идея на завтра..." rows="2">${w.tomorrow || ''}</textarea>
      </div>

      <div class="section-header">
        <span class="section-title">💡 Идеи</span>
        <button class="btn btn-ghost btn-sm text-accent" data-add-list="ideas">+ Добавить</button>
      </div>
      <div id="ideas-list">${this.renderList(w.ideas || [], 'ideas')}</div>

      <div class="section-header">
        <span class="section-title">⚠️ Проблемы</span>
        <button class="btn btn-ghost btn-sm text-accent" data-add-list="problems">+ Добавить</button>
      </div>
      <div id="problems-list">${this.renderList(w.problems || [], 'problems')}</div>

      <div class="section-header">
        <span class="section-title">🚫 Что тормозит продажи</span>
        <button class="btn btn-ghost btn-sm text-accent" data-add-list="blockers">+ Добавить</button>
      </div>
      <div id="blockers-list">${this.renderList(w.blockers || [], 'blockers')}</div>
    `;

    this.el.querySelector('#edit-metrics-btn')?.addEventListener('click', () => this.editMetrics(w));

    this.el.querySelector('#tomorrow-input')?.addEventListener('input', e => {
      debounce(() => {
        store.set('work.tomorrow', e.target.value);
        toast('Сохранено ✓');
      });
    });

    this.el.querySelectorAll('[data-add-list]').forEach(btn => {
      btn.addEventListener('click', () => this.addListItem(btn.dataset.addList));
    });

    ['ideas', 'problems', 'blockers'].forEach(key => {
      this.el.querySelector(`#${key}-list`)?.addEventListener('click', e => {
        const del = e.target.closest('[data-del]');
        if (del) {
          const idx = parseInt(del.dataset.del);
          store.update(`work.${key}`, arr => { const a=[...arr]; a.splice(idx,1); return a; });
          this.draw();
          toast('Удалено');
        }
      });
    });
  }

  renderList(items, key) {
    if (!items.length) return `<div class="text-muted text-sm" style="padding:8px 0;">Пусто</div>`;
    return items.map((item, i) => `
      <div class="list-item">
        <div class="list-item-body">
          <div class="list-item-title">${typeof item === 'string' ? item : item.text}</div>
        </div>
        <button class="btn btn-ghost btn-icon text-muted" data-del="${i}">✕</button>
      </div>
    `).join('');
  }

  editMetrics(w) {
    const fmt = n => n || '';
    const body = document.createElement('div');
    body.innerHTML = `
      <div class="input-group"><label class="input-label">Продажи сегодня (₽)</label><input class="input" id="m-sales" type="number" value="${fmt(w.sales_today)}" placeholder="0"></div>
      <div class="input-group"><label class="input-label">Прибыль (₽)</label><input class="input" id="m-profit" type="number" value="${fmt(w.profit)}" placeholder="0"></div>
      <div class="input-group"><label class="input-label">Средний чек (₽)</label><input class="input" id="m-check" type="number" value="${fmt(w.avg_check)}" placeholder="0"></div>
      <div class="input-group"><label class="input-label">Конверсия (%)</label><input class="input" id="m-conv" type="number" value="${fmt(w.conversion)}" placeholder="0"></div>
      <div class="input-group"><label class="input-label">План месяца (₽)</label><input class="input" id="m-plan" type="number" value="${fmt(w.plan)}" placeholder="0"></div>
      <div class="input-group"><label class="input-label">Факт месяца (₽)</label><input class="input" id="m-fact" type="number" value="${fmt(w.fact)}" placeholder="0"></div>
    `;
    openModal({
      title: 'Показатели',
      content: body,
      actions: [
        { label: 'Сохранить', cls: 'btn-primary', onClick: (m) => {
          const updates = {
            sales_today: parseFloat(m.querySelector('#m-sales').value)||0,
            profit: parseFloat(m.querySelector('#m-profit').value)||0,
            avg_check: parseFloat(m.querySelector('#m-check').value)||0,
            conversion: parseFloat(m.querySelector('#m-conv').value)||0,
            plan: parseFloat(m.querySelector('#m-plan').value)||0,
            fact: parseFloat(m.querySelector('#m-fact').value)||0
          };
          const work = store.get('work') || {};
          store.set('work', { ...work, ...updates });
          this.draw();
          closeModal();
          toast('Показатели обновлены ✓');
        }},
        { label: 'Отмена', cls: 'btn-secondary', onClick: () => closeModal() }
      ]
    });
  }

  addListItem(key) {
    const labels = { ideas: 'Идея', problems: 'Проблема', blockers: 'Что тормозит' };
    const body = document.createElement('div');
    body.innerHTML = `
      <div class="input-group">
        <label class="input-label">${labels[key] || 'Запись'}</label>
        <input class="input" id="list-input" placeholder="Опишите...">
      </div>
    `;
    openModal({
      title: `Добавить: ${labels[key]}`,
      content: body,
      actions: [
        { label: 'Добавить', cls: 'btn-primary', onClick: (m) => {
          const text = m.querySelector('#list-input').value.trim();
          if (!text) return;
          store.update(`work.${key}`, arr => [...(arr||[]), text]);
          this.draw();
          closeModal();
          toast('Добавлено ✓');
        }},
        { label: 'Отмена', cls: 'btn-secondary', onClick: () => closeModal() }
      ]
    });
    setTimeout(() => body.querySelector('#list-input')?.focus(), 100);
  }
}
