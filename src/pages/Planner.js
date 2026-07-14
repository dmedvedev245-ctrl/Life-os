import { store } from '../store.js';
import { toast } from '../components/Toast.js';
import { openModal, closeModal } from '../components/Modal.js';

const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const CATEGORIES = [
  { id: 'work', emoji: '💼', label: 'Работа', color: '#6366F1' },
  { id: 'english', emoji: '🇬🇧', label: 'Английский', color: '#3B82F6' },
  { id: 'partner', emoji: '❤️', label: 'Девушка', color: '#EF4444' },
  { id: 'project', emoji: '🚀', label: 'Проекты', color: '#8B5CF6' },
  { id: 'sport', emoji: '💪', label: 'Спорт', color: '#22C55E' },
  { id: 'music', emoji: '🎵', label: 'Музыка', color: '#EC4899' },
  { id: 'rest', emoji: '🌿', label: 'Отдых', color: '#14B8A6' },
  { id: 'other', emoji: '📦', label: 'Другое', color: '#9CA3AF' }
];

function getTodayIndex() { return (new Date().getDay() + 6) % 7; }

function getCatMeta(id) { return CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1]; }

function formatDuration(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) return `${h}ч${m > 0 ? ' ' + m + 'м' : ''}`;
  return `${m}м`;
}

function addMinutesToTime(start, dur) {
  const [h, m] = start.split(':').map(Number);
  const total = (h * 60 + m + dur) % 1440;
  const eh = Math.floor(total / 60);
  const em = total % 60;
  return `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
}

export class PlannerPage {
  constructor() { this.selectedDay = getTodayIndex(); }

  render() {
    const el = document.createElement('div');
    this.el = el;
    this.draw();
    return el;
  }

  draw() {
    const blocks = store.get('planner.blocks') || [];
    const todayIndex = getTodayIndex();

    const catMinutes = {};
    blocks.forEach(b => { catMinutes[b.cat] = (catMinutes[b.cat] || 0) + (b.dur || 0); });
    const totalMinutes = Object.values(catMinutes).reduce((s, v) => s + v, 0);
    const usedCats = CATEGORIES.filter(c => catMinutes[c.id]);

    const dayBlocks = blocks
      .filter(b => b.day === this.selectedDay)
      .sort((a, b) => a.start.localeCompare(b.start));

    this.el.innerHTML = `
      <div class="page-title" style="margin-bottom:16px;">🕐 Расписание</div>

      ${totalMinutes > 0 ? `
        <div style="display:flex; height:10px; border-radius:6px; overflow:hidden; margin-bottom:10px;">
          ${usedCats.map(c => `<div style="width:${(catMinutes[c.id] / totalMinutes * 100).toFixed(2)}%; background:${c.color};"></div>`).join('')}
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:16px;">
          ${usedCats.map(c => `
            <div style="display:flex; align-items:center; gap:4px; font-size:12px;">
              <div style="width:8px; height:8px; border-radius:50%; background:${c.color}; flex-shrink:0;"></div>
              <span class="text-muted">${c.emoji} ${c.label}</span>
              <span style="font-weight:600;">${formatDuration(catMinutes[c.id])}</span>
            </div>
          `).join('')}
        </div>
      ` : `<div class="text-xs text-muted" style="margin-bottom:16px;">Добавьте блоки, чтобы увидеть баланс недели</div>`}

      <div class="tabs">
        ${DAY_LABELS.map((d, i) => `
          <div class="tab ${this.selectedDay === i ? 'active' : ''}" data-day="${i}">
            ${d}${i === todayIndex ? '<span style="display:inline-block;width:5px;height:5px;border-radius:50%;background:var(--accent);margin-left:3px;"></span>' : ''}
          </div>
        `).join('')}
      </div>

      <div style="margin-top:12px;">
        ${dayBlocks.length ? dayBlocks.map(b => this.renderBlock(b)).join('') : `
          <div class="empty-state">
            <div class="empty-state-icon">🕐</div>
            <div class="empty-state-title">Блоков нет</div>
            <div class="empty-state-text">Добавьте первый блок расписания на этот день</div>
          </div>
        `}
      </div>

      <button class="btn btn-secondary btn-full" id="add-block-btn" style="margin-top:12px;">+ Добавить блок</button>
    `;

    this.bindEvents();
  }

  renderBlock(b) {
    const cat = getCatMeta(b.cat);
    const end = addMinutesToTime(b.start, b.dur || 0);
    return `
      <div class="list-item" style="border-left:3px solid ${cat.color};">
        <div class="list-item-body">
          <div style="display:flex; align-items:center; gap:6px; margin-bottom:2px;">
            <span style="font-weight:700; font-size:13px;">${b.start}–${end}</span>
            <span class="text-xs text-muted">${formatDuration(b.dur || 0)}</span>
          </div>
          <div class="list-item-title">${cat.emoji} ${b.title}</div>
          ${b.note ? `<div class="text-xs text-muted" style="margin-top:2px;">${b.note}</div>` : ''}
        </div>
        <div style="display:flex; flex-direction:column; gap:4px;">
          <button class="btn btn-ghost btn-icon text-muted" data-edit-block="${b.id}">✏️</button>
          <button class="btn btn-ghost btn-icon text-muted" data-del-block="${b.id}">✕</button>
        </div>
      </div>
    `;
  }

  bindEvents() {
    this.el.querySelectorAll('[data-day]').forEach(tab => {
      tab.addEventListener('click', () => {
        this.selectedDay = parseInt(tab.dataset.day);
        this.draw();
      });
    });

    this.el.querySelector('#add-block-btn')?.addEventListener('click', () => this.openBlockModal());

    this.el.querySelectorAll('[data-edit-block]').forEach(btn => {
      btn.addEventListener('click', () => {
        const blocks = store.get('planner.blocks') || [];
        const block = blocks.find(b => b.id === btn.dataset.editBlock);
        if (block) this.openBlockModal(block);
      });
    });

    this.el.querySelectorAll('[data-del-block]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!confirm('Удалить блок?')) return;
        const blocks = store.get('planner.blocks') || [];
        store.set('planner.blocks', blocks.filter(b => b.id !== btn.dataset.delBlock));
        this.draw();
        toast('Удалено');
      });
    });
  }

  openBlockModal(existing = null) {
    const isEdit = !!existing;
    let selectedCat = existing?.cat || CATEGORIES[0].id;
    const selectedDays = new Set(isEdit ? [existing.day] : [this.selectedDay]);

    const body = document.createElement('div');
    body.innerHTML = `
      <div class="input-group">
        <label class="input-label">Категория</label>
        <div id="cat-picker" style="display:flex; flex-wrap:wrap; gap:6px;">
          ${CATEGORIES.map(c => `
            <button type="button" class="cat-btn" data-cat="${c.id}"
              style="display:flex; align-items:center; gap:4px; padding:6px 10px; border-radius:20px; font-size:13px; cursor:pointer;
              border:1.5px solid ${c.id === selectedCat ? c.color : 'var(--border)'};
              background:${c.id === selectedCat ? c.color + '22' : 'var(--surface-2)'}; color:var(--text-primary);">
              ${c.emoji} ${c.label}
            </button>
          `).join('')}
        </div>
      </div>
      <div style="display:flex; gap:10px;">
        <div class="input-group" style="flex:1;">
          <label class="input-label">Начало</label>
          <input class="input" id="block-start" type="time" value="${existing?.start || '09:00'}">
        </div>
        <div class="input-group" style="flex:1;">
          <label class="input-label">Длительность (мин)</label>
          <input class="input" id="block-dur" type="number" min="5" step="5" value="${existing?.dur || 60}">
        </div>
      </div>
      <div class="input-group">
        <label class="input-label">Название</label>
        <input class="input" id="block-title" placeholder="Созвон, тренировка..." value="${existing?.title || ''}">
      </div>
      <div class="input-group">
        <label class="input-label">Заметка (необязательно)</label>
        <input class="input" id="block-note" value="${existing?.note || ''}">
      </div>
      ${!isEdit ? `
        <div class="input-group">
          <label class="input-label">Повторить в дни</label>
          <div id="day-picker" style="display:flex; flex-wrap:wrap; gap:6px;">
            ${DAY_LABELS.map((d, i) => `
              <button type="button" class="day-pick-btn" data-day="${i}"
                style="padding:6px 10px; border-radius:8px; font-size:13px; cursor:pointer;
                border:1.5px solid ${selectedDays.has(i) ? 'var(--accent)' : 'var(--border)'};
                background:${selectedDays.has(i) ? 'var(--accent-glow)' : 'var(--surface-2)'}; color:var(--text-primary);">
                ${d}
              </button>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;

    body.querySelectorAll('.cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedCat = btn.dataset.cat;
        body.querySelectorAll('.cat-btn').forEach(b => {
          const meta = getCatMeta(b.dataset.cat);
          const active = b.dataset.cat === selectedCat;
          b.style.border = `1.5px solid ${active ? meta.color : 'var(--border)'}`;
          b.style.background = active ? meta.color + '22' : 'var(--surface-2)';
        });
      });
    });

    body.querySelectorAll('.day-pick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const day = parseInt(btn.dataset.day);
        if (selectedDays.has(day)) selectedDays.delete(day); else selectedDays.add(day);
        const active = selectedDays.has(day);
        btn.style.border = `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`;
        btn.style.background = active ? 'var(--accent-glow)' : 'var(--surface-2)';
      });
    });

    openModal({
      title: isEdit ? '✏️ Редактировать блок' : '+ Новый блок',
      content: body,
      actions: [
        { label: 'Сохранить', cls: 'btn-primary', onClick: (m) => {
          const start = m.querySelector('#block-start').value;
          const dur = parseInt(m.querySelector('#block-dur').value) || 0;
          const title = m.querySelector('#block-title').value.trim();
          const note = m.querySelector('#block-note').value.trim();
          if (!title) { toast('Введите название'); return; }
          if (!start || dur <= 0) { toast('Укажите время и длительность'); return; }

          if (isEdit) {
            const blocks = store.get('planner.blocks') || [];
            const idx = blocks.findIndex(b => b.id === existing.id);
            if (idx !== -1) {
              blocks[idx] = { ...blocks[idx], start, dur, cat: selectedCat, title, note };
              store.set('planner.blocks', blocks);
            }
            toast('Блок обновлён ✓');
          } else {
            if (!selectedDays.size) { toast('Выберите хотя бы один день'); return; }
            const newBlocks = [...selectedDays].map(day => ({
              id: `${Date.now()}-${day}-${Math.random().toString(36).slice(2, 7)}`,
              day, start, dur, cat: selectedCat, title, note
            }));
            store.update('planner.blocks', arr => [...(arr || []), ...newBlocks]);
            toast('Блок добавлен ✓');
          }
          this.draw();
          closeModal();
        }},
        { label: 'Отмена', cls: 'btn-secondary', onClick: () => closeModal() }
      ]
    });
    setTimeout(() => body.querySelector('#block-title')?.focus(), 100);
  }
}
