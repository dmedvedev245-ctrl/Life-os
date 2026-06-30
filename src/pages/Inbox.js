import { store } from '../store.js';
import { toast } from '../components/Toast.js';

const CATEGORIES = [
  { key: 'idea', label: '💡 Идея' },
  { key: 'task', label: '✅ Задача' },
  { key: 'buy', label: '🛒 Покупка' },
  { key: 'other', label: '📌 Другое' }
];

const FILTERS = ['all', 'idea', 'task', 'buy', 'other'];
const FILTER_LABELS = { all: 'Все', idea: 'Идеи', task: 'Задачи', buy: 'Покупки', other: 'Другое' };

export class InboxPage {
  constructor() {
    this.selectedCat = 'other';
    this.activeFilter = 'all';
  }

  render() {
    const el = document.createElement('div');
    this.el = el;
    this.draw();
    return el;
  }

  draw() {
    const items = store.get('inbox') || [];
    const filtered = this.activeFilter === 'all' ? items : items.filter(i => i.category === this.activeFilter);

    this.el.innerHTML = `
      <div class="page-title" style="margin-bottom:16px;">📥 Inbox</div>

      <div class="inbox-compose">
        <textarea class="input" id="inbox-text" placeholder="Запишу мысль... (любая идея, задача, покупка)" rows="3"></textarea>
        <div class="inbox-categories" id="cat-btns">
          ${CATEGORIES.map(c => `
            <button class="cat-btn ${this.selectedCat === c.key ? 'active' : ''}" data-cat="${c.key}">${c.label}</button>
          `).join('')}
        </div>
        <button class="btn btn-primary btn-full" id="add-inbox-btn" style="margin-top:12px;">Добавить</button>
      </div>

      <div class="filter-tabs" id="filter-tabs">
        ${FILTERS.map(f => `
          <button class="filter-tab ${this.activeFilter === f ? 'active' : ''}" data-filter="${f}">${FILTER_LABELS[f]} ${f === 'all' ? `(${items.length})` : `(${items.filter(i=>i.category===f).length})`}</button>
        `).join('')}
      </div>

      <div id="inbox-list">
        ${filtered.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon">🧠</div>
            <div class="empty-state-title">Inbox пуст</div>
            <div class="empty-state-text">Записывай любые мысли — вечером разберёшь по разделам</div>
          </div>
        ` : filtered.map((item, idx) => this.renderItem(item, items.indexOf(item))).join('')}
      </div>
    `;

    this.el.querySelector('#add-inbox-btn').addEventListener('click', () => this.addItem());
    this.el.querySelector('#inbox-text').addEventListener('keydown', e => {
      if (e.key === 'Enter' && e.ctrlKey) this.addItem();
    });

    this.el.querySelectorAll('[data-cat]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedCat = btn.dataset.cat;
        this.el.querySelectorAll('[data-cat]').forEach(b => b.classList.toggle('active', b.dataset.cat === this.selectedCat));
      });
    });

    this.el.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeFilter = btn.dataset.filter;
        this.draw();
      });
    });

    this.el.querySelector('#inbox-list').addEventListener('click', e => {
      const delBtn = e.target.closest('[data-del]');
      if (delBtn) {
        const idx = parseInt(delBtn.dataset.del);
        const items = store.get('inbox') || [];
        items.splice(idx, 1);
        store.set('inbox', items);
        this.draw();
        toast('Запись удалена');
      }
    });
  }

  renderItem(item, idx) {
    const catInfo = CATEGORIES.find(c => c.key === item.category) || CATEGORIES[3];
    const date = new Date(item.created).toLocaleDateString('ru', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    return `
      <div class="list-item">
        <div style="font-size:20px; padding-top:2px;">${catInfo.label.split(' ')[0]}</div>
        <div class="list-item-body">
          <div class="list-item-title" style="white-space:pre-wrap; line-height:1.4;">${item.text}</div>
          <div class="list-item-sub">${date}</div>
        </div>
        <button class="btn btn-ghost btn-icon text-muted" data-del="${idx}" style="flex-shrink:0;">✕</button>
      </div>
    `;
  }

  addItem() {
    const textarea = this.el.querySelector('#inbox-text');
    const text = textarea.value.trim();
    if (!text) { toast('Введите мысль'); return; }

    const items = store.get('inbox') || [];
    items.unshift({ text, category: this.selectedCat, created: Date.now() });
    store.set('inbox', items);
    textarea.value = '';
    this.draw();
    toast('Записано ✓');
  }
}
