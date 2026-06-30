import { store } from '../store.js';
import { toast } from '../components/Toast.js';
import { openModal, closeModal } from '../components/Modal.js';

let saveTimer;
function autoSave(key, value) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    store.set(key, value);
  }, 400);
}

export class RelationsPage {
  render() {
    const el = document.createElement('div');
    this.el = el;
    this.draw();
    return el;
  }

  draw() {
    const r = store.get('relations') || {};
    const lastDays = r.last_date ? Math.floor((Date.now()-new Date(r.last_date))/86400000) : null;
    const nextDays = r.next_date ? Math.ceil((new Date(r.next_date)-Date.now())/86400000) : null;

    this.el.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <div class="page-title">❤️ Отношения</div>
      </div>

      <div class="card accent-card" style="margin-bottom:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <div>
            <input class="input" id="partner-name" placeholder="Имя партнёра" value="${r.partner_name||''}" style="background:transparent; border:none; font-size:20px; font-weight:700; padding:0; color:var(--text); width:100%;">
          </div>
        </div>
        <div style="display:flex; gap:20px;">
          ${lastDays !== null ? `<div><div class="text-xs text-muted">ПОСЛЕДНЕЕ СВИДАНИЕ</div><div style="font-weight:600;">${lastDays} дн. назад</div></div>` : ''}
          ${nextDays !== null ? `<div><div class="text-xs text-muted">СЛЕДУЮЩЕЕ</div><div style="font-weight:600; color:var(--accent);">${nextDays > 0 ? `через ${nextDays} дн.` : 'Сегодня!'}</div></div>` : ''}
        </div>
      </div>

      <div class="section-block">
        <div class="section-block-title">📅 Свидания</div>
        <div class="input-group">
          <label class="input-label">Последнее свидание</label>
          <input class="input" id="last-date" type="date" value="${r.last_date||''}">
        </div>
        <div class="input-group">
          <label class="input-label">Следующее свидание</label>
          <input class="input" id="next-date" type="date" value="${r.next_date||''}">
        </div>
        <div class="input-group">
          <label class="input-label">Описание</label>
          <input class="input" id="next-date-desc" placeholder="Где / что планируем" value="${r.next_date_desc||''}">
        </div>
      </div>

      <div class="section-block">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <div class="section-block-title" style="margin-bottom:0;">💡 Идеи свиданий</div>
          <button class="btn btn-ghost btn-sm text-accent" id="add-date-idea">+ Добавить</button>
        </div>
        <div id="date-ideas-list">
          ${(r.date_ideas||[]).length === 0 ? '<div class="text-muted text-sm">Нет идей</div>' : (r.date_ideas||[]).map((idea,i)=>`
            <div class="list-item" style="padding:10px 14px;">
              <div class="list-item-body"><div class="list-item-title">${idea}</div></div>
              <button class="btn btn-ghost btn-icon text-muted" data-del-idea="${i}">✕</button>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="section-block">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <div class="section-block-title" style="margin-bottom:0;">📝 Что обещал</div>
          <button class="btn btn-ghost btn-sm text-accent" id="add-promise">+ Добавить</button>
        </div>
        <div id="promises-list">
          ${(r.promises||[]).length === 0 ? '<div class="text-muted text-sm">Нет обещаний</div>' : (r.promises||[]).map((p,i)=>`
            <div class="list-item" style="padding:10px 14px;">
              <div class="checkbox ${p.done?'checked':''}" data-promise="${i}">${p.done?'✓':''}</div>
              <div class="list-item-body"><div class="list-item-title ${p.done?'line-through text-muted':''}">${p.text}</div></div>
              <button class="btn btn-ghost btn-icon text-muted" data-del-promise="${i}">✕</button>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="section-block">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <div class="section-block-title" style="margin-bottom:0;">🎁 Подарки</div>
          <button class="btn btn-ghost btn-sm text-accent" id="add-gift">+ Добавить</button>
        </div>
        <div id="gifts-list">
          ${(r.gifts||[]).length === 0 ? '<div class="text-muted text-sm">Нет записей</div>' : (r.gifts||[]).map((g,i)=>`
            <div class="list-item" style="padding:10px 14px;">
              <div class="checkbox ${g.done?'checked':''}" data-gift="${i}">${g.done?'✓':''}</div>
              <div class="list-item-body"><div class="list-item-title ${g.done?'line-through text-muted':''}">${g.text}</div></div>
              <button class="btn btn-ghost btn-icon text-muted" data-del-gift="${i}">✕</button>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="section-block">
        <div class="section-block-title">📌 Важные даты</div>
        <div id="imp-dates-list">
          ${(r.important_dates||[]).length === 0 ? '<div class="text-muted text-sm">Нет дат</div>' : (r.important_dates||[]).map((d,i)=>`
            <div class="list-item" style="padding:10px 14px;">
              <div class="list-item-body">
                <div class="list-item-title">${d.name}</div>
                <div class="list-item-sub">${d.date ? new Date(d.date).toLocaleDateString('ru',{day:'numeric',month:'long'}) : ''}</div>
              </div>
              <button class="btn btn-ghost btn-icon text-muted" data-del-date="${i}">✕</button>
            </div>
          `).join('')}
        </div>
        <button class="btn btn-ghost btn-sm text-accent" id="add-imp-date" style="margin-top:8px;">+ Добавить дату</button>
      </div>

      <div class="section-block">
        <div class="section-block-title">✏️ Заметки</div>
        <textarea class="input" id="notes-input" rows="4" placeholder="Любые заметки об отношениях...">${r.notes||''}</textarea>
      </div>
    `;

    const saveField = (key, id) => {
      this.el.querySelector(`#${id}`)?.addEventListener('input', e => {
        autoSave(`relations.${key}`, e.target.value);
      });
    };

    saveField('partner_name', 'partner-name');
    saveField('last_date', 'last-date');
    saveField('next_date', 'next-date');
    saveField('next_date_desc', 'next-date-desc');
    saveField('notes', 'notes-input');

    ['last-date', 'next-date'].forEach(id => {
      this.el.querySelector(`#${id}`)?.addEventListener('change', () => this.draw());
    });

    this.el.querySelector('#add-date-idea')?.addEventListener('click', () => this.addSimple('date_ideas', 'Идея свидания', 'Например: ужин, пикник, кино'));
    this.el.querySelector('#add-promise')?.addEventListener('click', () => this.addCheckItem('promises', 'Обещание', 'Что обещал?'));
    this.el.querySelector('#add-gift')?.addEventListener('click', () => this.addCheckItem('gifts', 'Подарок', 'Что подарить?'));
    this.el.querySelector('#add-imp-date')?.addEventListener('click', () => this.addImportantDate());

    this.el.querySelector('#date-ideas-list')?.addEventListener('click', e => {
      const del = e.target.closest('[data-del-idea]');
      if (del) { this.removeSimple('date_ideas', parseInt(del.dataset.delIdea)); }
    });

    this.el.querySelector('#promises-list')?.addEventListener('click', e => {
      const cb = e.target.closest('[data-promise]');
      if (cb) { this.toggleCheck('promises', parseInt(cb.dataset.promise)); return; }
      const del = e.target.closest('[data-del-promise]');
      if (del) { this.removeCheckItem('promises', parseInt(del.dataset.delPromise)); }
    });

    this.el.querySelector('#gifts-list')?.addEventListener('click', e => {
      const cb = e.target.closest('[data-gift]');
      if (cb) { this.toggleCheck('gifts', parseInt(cb.dataset.gift)); return; }
      const del = e.target.closest('[data-del-gift]');
      if (del) { this.removeCheckItem('gifts', parseInt(del.dataset.delGift)); }
    });

    this.el.querySelector('#imp-dates-list')?.addEventListener('click', e => {
      const del = e.target.closest('[data-del-date]');
      if (del) {
        const r = store.get('relations') || {};
        (r.important_dates||[]).splice(parseInt(del.dataset.delDate), 1);
        store.set('relations', r);
        this.draw();
      }
    });
  }

  addSimple(key, title, placeholder) {
    const body = document.createElement('div');
    body.innerHTML = `<div class="input-group"><label class="input-label">${title}</label><input class="input" id="si" placeholder="${placeholder}"></div>`;
    openModal({
      title,
      content: body,
      actions: [
        { label: 'Добавить', cls: 'btn-primary', onClick: (m) => {
          const v = m.querySelector('#si').value.trim();
          if (!v) return;
          store.update(`relations.${key}`, arr => [...(arr||[]), v]);
          this.draw(); closeModal(); toast('Добавлено ✓');
        }},
        { label: 'Отмена', cls: 'btn-secondary', onClick: () => closeModal() }
      ]
    });
    setTimeout(() => body.querySelector('#si')?.focus(), 100);
  }

  addCheckItem(key, title, placeholder) {
    const body = document.createElement('div');
    body.innerHTML = `<div class="input-group"><label class="input-label">${title}</label><input class="input" id="ci" placeholder="${placeholder}"></div>`;
    openModal({
      title,
      content: body,
      actions: [
        { label: 'Добавить', cls: 'btn-primary', onClick: (m) => {
          const text = m.querySelector('#ci').value.trim();
          if (!text) return;
          store.update(`relations.${key}`, arr => [...(arr||[]), { text, done: false }]);
          this.draw(); closeModal(); toast('Добавлено ✓');
        }},
        { label: 'Отмена', cls: 'btn-secondary', onClick: () => closeModal() }
      ]
    });
    setTimeout(() => body.querySelector('#ci')?.focus(), 100);
  }

  addImportantDate() {
    const body = document.createElement('div');
    body.innerHTML = `
      <div class="input-group"><label class="input-label">Событие</label><input class="input" id="id-name" placeholder="День рождения / годовщина"></div>
      <div class="input-group"><label class="input-label">Дата</label><input class="input" id="id-date" type="date"></div>
    `;
    openModal({
      title: 'Важная дата',
      content: body,
      actions: [
        { label: 'Добавить', cls: 'btn-primary', onClick: (m) => {
          const name = m.querySelector('#id-name').value.trim();
          if (!name) return;
          store.update('relations.important_dates', arr => [...(arr||[]), { name, date: m.querySelector('#id-date').value }]);
          this.draw(); closeModal(); toast('Дата добавлена ✓');
        }},
        { label: 'Отмена', cls: 'btn-secondary', onClick: () => closeModal() }
      ]
    });
    setTimeout(() => body.querySelector('#id-name')?.focus(), 100);
  }

  removeSimple(key, idx) {
    store.update(`relations.${key}`, arr => { const a=[...arr]; a.splice(idx,1); return a; });
    this.draw(); toast('Удалено');
  }

  toggleCheck(key, idx) {
    const r = store.get('relations') || {};
    r[key][idx].done = !r[key][idx].done;
    store.set('relations', r);
    this.draw();
  }

  removeCheckItem(key, idx) {
    store.update(`relations.${key}`, arr => { const a=[...arr]; a.splice(idx,1); return a; });
    this.draw(); toast('Удалено');
  }
}
