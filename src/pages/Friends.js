import { store } from '../store.js';
import { toast } from '../components/Toast.js';
import { openModal, closeModal } from '../components/Modal.js';

const AVATAR_COLORS = ['#6366F1','#22C55E','#F59E0B','#EF4444','#8B5CF6','#EC4899','#14B8A6','#F97316'];

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function avatarColor(name) {
  return AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];
}

function daysSince(dateStr) {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr)) / 86400000);
}

function getAge(birthdayStr) {
  if (!birthdayStr) return null;
  const bd = new Date(birthdayStr);
  const today = new Date();
  let age = today.getFullYear() - bd.getFullYear();
  const m = today.getMonth() - bd.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
  return age;
}

function daysUntilBirthday(birthdayStr) {
  if (!birthdayStr) return null;
  const today = new Date();
  const bd = new Date(birthdayStr);
  const next = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
  if (next < today) next.setFullYear(today.getFullYear() + 1);
  return Math.ceil((next - today) / 86400000);
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function contactLabel(days) {
  if (days === null) return { text: 'Нет данных', color: 'var(--text-muted)' };
  if (days === 0)    return { text: 'Сегодня', color: 'var(--success)' };
  if (days < 7)     return { text: `${days} дн. назад`, color: 'var(--success)' };
  if (days < 30)    return { text: `${days} дн. назад`, color: 'var(--warning)' };
  return { text: `${days} дн. — давно!`, color: 'var(--danger)' };
}

export class FriendsPage {
  render() {
    const el = document.createElement('div');
    this.el = el;
    this.draw();
    return el;
  }

  draw() {
    const friends = store.get('friends') || [];
    const sorted = friends
      .map((f, i) => ({ ...f, _idx: i }))
      .sort((a, b) => (daysSince(a.last_contact) ?? 999) - (daysSince(b.last_contact) ?? 999));

    this.el.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
        <div class="page-title">👥 Друзья</div>
        <button class="btn btn-ghost btn-sm text-accent" id="add-friend-btn">+ Добавить</button>
      </div>

      ${sorted.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">👥</div>
          <div class="empty-state-title">Список пуст</div>
          <div class="empty-state-text">Добавьте друзей — следи за тем, чтобы регулярно с ними общаться</div>
        </div>
      ` : `<div class="friends-grid">${sorted.map(f => this.renderCard(f)).join('')}</div>`}
    `;

    this.el.querySelector('#add-friend-btn')?.addEventListener('click', () => this.openAddModal());
    this.el.querySelectorAll('[data-open-dossier]').forEach(btn => {
      btn.addEventListener('click', () => this.openDossier(parseInt(btn.dataset.openDossier)));
    });
    this.el.querySelectorAll('[data-contact]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.contact);
        const all = store.get('friends') || [];
        all[idx].last_contact = new Date().toISOString().split('T')[0];
        store.set('friends', all);
        this.draw();
        toast(`Отмечено ✓`);
      });
    });
  }

  renderCard(f) {
    const days = daysSince(f.last_contact);
    const cl = contactLabel(days);
    const bdDays = daysUntilBirthday(f.birthday);
    const age = getAge(f.birthday);
    const isBirthdaySoon = bdDays !== null && bdDays <= 7;

    return `
      <div class="friend-card" data-open-dossier="${f._idx}">
        <div class="friend-card-top">
          ${f.photo
            ? `<img class="friend-avatar-img" src="${f.photo}" alt="${f.name}">`
            : `<div class="friend-avatar" style="background:${avatarColor(f.name)}">${getInitials(f.name)}</div>`
          }
          ${isBirthdaySoon ? `<div class="friend-bd-badge">🎂 ${bdDays === 0 ? 'Сегодня!' : `через ${bdDays} дн.`}</div>` : ''}
        </div>
        <div class="friend-card-body">
          <div class="friend-name">${f.name}</div>
          ${age !== null ? `<div class="friend-meta">${age} лет${f.birthday ? ` · ${new Date(f.birthday).toLocaleDateString('ru-RU', {day:'numeric',month:'long'})}` : ''}</div>` : ''}
          ${f.phone ? `<div class="friend-meta">📞 ${f.phone}</div>` : ''}
          <div class="friend-contact-label" style="color:${cl.color}">${cl.text}</div>
        </div>
        <button class="btn btn-secondary btn-sm friend-contact-btn" data-contact="${f._idx}" title="Написал сегодня">✓ Написал</button>
      </div>
    `;
  }

  openDossier(idx) {
    const all = store.get('friends') || [];
    const f = all[idx];
    if (!f) return;

    const days = daysSince(f.last_contact);
    const cl = contactLabel(days);
    const age = getAge(f.birthday);
    const bdDays = daysUntilBirthday(f.birthday);

    const body = document.createElement('div');
    body.innerHTML = `
      <div class="dossier">
        <div class="dossier-header">
          <div class="dossier-avatar-wrap">
            ${f.photo
              ? `<img class="dossier-avatar-img" src="${f.photo}" alt="${f.name}" id="dossier-preview">`
              : `<div class="dossier-avatar" style="background:${avatarColor(f.name)}" id="dossier-preview">${getInitials(f.name)}</div>`
            }
            <label class="dossier-photo-btn" title="Сменить фото">
              📷
              <input type="file" accept="image/*" id="photo-upload" style="display:none">
            </label>
          </div>
          <div class="dossier-info">
            <div class="dossier-name">${f.name}</div>
            ${age !== null ? `<div class="dossier-age">${age} лет</div>` : ''}
            <div class="dossier-contact-status" style="color:${cl.color}">● ${cl.text}</div>
          </div>
        </div>

        <div class="dossier-grid">
          <div class="dossier-field">
            <label class="input-label">Имя</label>
            <input class="input" id="d-name" value="${f.name}">
          </div>
          <div class="dossier-field">
            <label class="input-label">Дата рождения</label>
            <input class="input" id="d-birthday" type="date" value="${f.birthday || ''}">
          </div>
          <div class="dossier-field">
            <label class="input-label">Телефон</label>
            <input class="input" id="d-phone" type="tel" placeholder="+7 999 123 45 67" value="${f.phone || ''}">
          </div>
          <div class="dossier-field">
            <label class="input-label">Последний контакт</label>
            <input class="input" id="d-contact" type="date" value="${f.last_contact || ''}">
          </div>
          <div class="dossier-field dossier-field-full">
            <label class="input-label">Заметки</label>
            <textarea class="input" id="d-notes" rows="3" placeholder="Где работает, интересы, что обсуждали...">${f.notes || ''}</textarea>
          </div>
        </div>

        ${bdDays !== null && bdDays <= 30 ? `
          <div class="dossier-alert ${bdDays <= 7 ? 'dossier-alert-warn' : ''}">
            🎂 ${bdDays === 0 ? 'Сегодня день рождения!' : `До дня рождения ${bdDays} дн.`}
            ${age !== null ? `Исполнится ${age + 1} лет.` : ''}
          </div>
        ` : ''}

        <input type="hidden" id="d-photo" value="${f.photo || ''}">
      </div>
    `;

    body.querySelector('#photo-upload')?.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        body.querySelector('#d-photo').value = ev.target.result;
        const preview = body.querySelector('#dossier-preview');
        if (preview.tagName === 'IMG') {
          preview.src = ev.target.result;
        } else {
          const img = document.createElement('img');
          img.className = 'dossier-avatar-img';
          img.id = 'dossier-preview';
          img.src = ev.target.result;
          preview.replaceWith(img);
        }
      };
      reader.readAsDataURL(file);
    });

    openModal({
      title: 'Досье',
      content: body,
      actions: [
        { label: 'Сохранить', cls: 'btn-primary', onClick: (m) => {
          const all2 = store.get('friends') || [];
          all2[idx] = {
            ...all2[idx],
            name: m.querySelector('#d-name').value.trim() || all2[idx].name,
            birthday: m.querySelector('#d-birthday').value || null,
            phone: m.querySelector('#d-phone').value.trim() || null,
            last_contact: m.querySelector('#d-contact').value || null,
            notes: m.querySelector('#d-notes').value.trim() || null,
            photo: m.querySelector('#d-photo').value || null,
          };
          store.set('friends', all2);
          this.draw();
          closeModal();
          toast('Сохранено ✓');
        }},
        { label: 'Удалить', cls: 'btn-danger', onClick: () => {
          const all2 = store.get('friends') || [];
          all2.splice(idx, 1);
          store.set('friends', all2);
          this.draw();
          closeModal();
          toast('Удалено');
        }},
      ]
    });
  }

  openAddModal() {
    const body = document.createElement('div');
    body.innerHTML = `
      <div class="dossier-grid">
        <div class="dossier-field dossier-field-full">
          <label class="input-label">Имя *</label>
          <input class="input" id="f-name" placeholder="Алексей Иванов">
        </div>
        <div class="dossier-field">
          <label class="input-label">Телефон</label>
          <input class="input" id="f-phone" type="tel" placeholder="+7 999 123 45 67">
        </div>
        <div class="dossier-field">
          <label class="input-label">Дата рождения</label>
          <input class="input" id="f-birthday" type="date">
        </div>
        <div class="dossier-field">
          <label class="input-label">Последний контакт</label>
          <input class="input" id="f-contact" type="date">
        </div>
        <div class="dossier-field dossier-field-full">
          <label class="input-label">Заметка</label>
          <input class="input" id="f-notes" placeholder="Где работает, как познакомились...">
        </div>
      </div>
    `;
    openModal({
      title: 'Новый контакт',
      content: body,
      actions: [
        { label: 'Добавить', cls: 'btn-primary', onClick: (m) => {
          const name = m.querySelector('#f-name').value.trim();
          if (!name) { toast('Введите имя'); return; }
          store.update('friends', arr => [...(arr || []), {
            name,
            phone: m.querySelector('#f-phone').value.trim() || null,
            birthday: m.querySelector('#f-birthday').value || null,
            last_contact: m.querySelector('#f-contact').value || null,
            notes: m.querySelector('#f-notes').value.trim() || null,
            photo: null,
            added: Date.now()
          }]);
          this.draw();
          closeModal();
          toast(`${name} добавлен ✓`);
        }},
        { label: 'Отмена', cls: 'btn-secondary', onClick: () => closeModal() }
      ]
    });
    setTimeout(() => body.querySelector('#f-name')?.focus(), 100);
  }
}
