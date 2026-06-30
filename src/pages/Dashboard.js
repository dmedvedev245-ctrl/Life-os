import { store } from '../store.js';
import { navigate } from '../router.js';
import { toast } from '../components/Toast.js';
import { openModal, closeModal } from '../components/Modal.js';
import { analyzeLife, getApiKey, setApiKey, clearAiCache } from '../ai/advisor.js';
import { getUpcomingBirthdays, requestNotificationPermission, getNotificationPermission } from '../notifications.js';
import { exportData, importData } from '../backup.js';
import { signOut, getCurrentUser } from '../supabase.js';

function formatDate() {
  const days = ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];
  const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  const d = new Date();
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
}

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

function getDaysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
}

function formatMoney(n) {
  return Number(n || 0).toLocaleString('ru') + ' ₽';
}

const CARD_ACCENTS = {
  finance:   { color: '#22C55E', bg: 'rgba(34,197,94,0.06)' },
  work:      { color: '#6366F1', bg: 'rgba(99,102,241,0.06)' },
  relations: { color: '#EF4444', bg: 'rgba(239,68,68,0.06)' },
  friends:   { color: '#F97316', bg: 'rgba(249,115,22,0.06)' },
  health:    { color: '#10B981', bg: 'rgba(16,185,129,0.06)' },
  energy:    { color: '#8B5CF6', bg: 'rgba(139,92,246,0.06)' },
};

function accentStyle(key) {
  const a = CARD_ACCENTS[key];
  return `border-left: 3px solid ${a.color}; background: ${a.bg};`;
}

export class DashboardPage {
  render() {
    const el = document.createElement('div');
    this.el = el;
    const data = store.getAll();
    const { finance, work, relations, friends, health, goals, dashboard } = data;

    const todayStr = getTodayStr();
    const todayLog = (health.logs || []).find(l => l.date === todayStr);
    const todayMood = todayLog?.mood || 0;

    const totalDebt = [
      ...(finance.cards || []).map(c => c.debt || 0),
      ...(finance.debts || []).map(d => d.amount || 0)
    ].reduce((a, b) => a + b, 0);

    const urgentCard = (finance.cards || [])
      .filter(c => c.grace_period_end)
      .sort((a, b) => new Date(a.grace_period_end) - new Date(b.grace_period_end))[0];
    const urgentDays = urgentCard ? getDaysUntil(urgentCard.grace_period_end) : null;

    const nextDateDays = relations.next_date ? getDaysUntil(relations.next_date) : null;
    const lastDateDays = relations.last_date
      ? Math.floor((Date.now() - new Date(relations.last_date)) / 86400000)
      : null;

    const longLostFriends = (friends || []).filter(f => {
      if (!f.last_contact) return true;
      return Math.floor((Date.now() - new Date(f.last_contact)) / 86400000) > 30;
    }).length;

    const tasks = dashboard.daily_tasks || [];

    const financeSubtext = urgentCard && urgentDays !== null && urgentDays <= 7
      ? `⚡ Закрыть ${urgentCard.bank} через ${urgentDays} дн.`
      : totalDebt > 0
        ? `Общий долг: ${formatMoney(totalDebt)}`
        : 'Долгов нет';

    const workPct = work.plan > 0 ? Math.round((work.fact / work.plan) * 100) : 0;
    const energyDots = todayLog?.energy
      ? `<span style="color:${CARD_ACCENTS.energy.color}">${'●'.repeat(todayLog.energy)}</span><span style="color:var(--border)">${'●'.repeat(5 - todayLog.energy)}</span>`
      : '<span style="color:var(--text-muted)">● ● ● ● ●</span>';

    el.innerHTML = `
      <div class="dash-header">
        <div>
          <div class="page-title">Life OS</div>
          <div class="page-subtitle">${formatDate()}</div>
        </div>
        <div style="display:flex; gap:6px; align-items:center;">
          <button class="icon-btn" id="search-btn" title="Поиск">🔍</button>
          <button class="icon-btn" id="ai-refresh-btn" title="Обновить совет ИИ">✨</button>
          <button class="icon-btn" id="settings-btn" title="Настройки">⚙️</button>
        </div>
      </div>

      ${this.renderBirthdayBanner()}

      <div class="quick-mood-bar">
        <span class="quick-mood-label">Настроение:</span>
        ${['😫','😕','😐','🙂','😊'].map((e, i) => `
          <button class="dash-mood-btn ${todayMood === i + 1 ? 'active' : ''}" data-mood="${i + 1}">${e}</button>
        `).join('')}
      </div>

      <div class="ai-card" id="ai-card">
        <div class="ai-card-header">
          <span class="ai-label">✦ AI Советник</span>
          <button class="btn btn-ghost btn-sm text-accent" id="ai-toggle">скрыть</button>
        </div>
        <div id="ai-body">
          <div class="ai-text text-muted">Загрузка совета...</div>
        </div>
      </div>

      <div class="grid-2" style="margin-bottom:12px;">

        <div class="card dash-card clickable" style="${accentStyle('finance')}" data-nav="#/finance">
          <div class="dash-card-label" style="color:${CARD_ACCENTS.finance.color}">💰 Финансы</div>
          <div class="dash-card-value">${totalDebt > 0 ? formatMoney(totalDebt) : '—'}</div>
          <div class="dash-card-sub">${financeSubtext}</div>
        </div>

        <div class="card dash-card clickable" style="${accentStyle('work')}" data-nav="#/work">
          <div class="dash-card-label" style="color:${CARD_ACCENTS.work.color}">💼 Работа</div>
          <div class="dash-card-value">${formatMoney(work.sales_today)}</div>
          <div class="dash-card-sub">${workPct}% от плана</div>
        </div>

        <div class="card dash-card clickable" style="${accentStyle('relations')}" data-nav="#/relations">
          <div class="dash-card-label" style="color:${CARD_ACCENTS.relations.color}">❤️ Отношения</div>
          <div class="dash-card-value" style="font-size:16px;">${nextDateDays !== null ? `Через ${nextDateDays} дн.` : 'Не запланировано'}</div>
          <div class="dash-card-sub">${lastDateDays !== null ? `Последнее: ${lastDateDays} дн. назад` : 'Добавьте свидание'}</div>
        </div>

        <div class="card dash-card clickable" style="${accentStyle('friends')}${longLostFriends > 0 ? ' border-left-color: var(--warning);' : ''}" data-nav="#/friends">
          <div class="dash-card-label" style="color:${longLostFriends > 0 ? 'var(--warning)' : CARD_ACCENTS.friends.color}">👥 Друзья</div>
          <div class="dash-card-value" style="${longLostFriends > 0 ? 'color:var(--warning)' : ''}">${longLostFriends}</div>
          <div class="dash-card-sub">${longLostFriends > 0 ? 'Давно не писал' : 'Все в норме ✓'}</div>
        </div>

        <div class="card dash-card clickable" style="${accentStyle('health')}" data-nav="#/health">
          <div class="dash-card-label" style="color:${CARD_ACCENTS.health.color}">🏃 Здоровье</div>
          <div class="dash-card-value">${todayLog?.sleep ? `${todayLog.sleep}ч` : '—'}</div>
          <div class="dash-card-sub">${todayLog?.mood ? ['😫','😕','😐','🙂','😊'][todayLog.mood - 1] + ' настроение' : 'Заполни дневник'}</div>
        </div>

        <div class="card dash-card clickable" style="${accentStyle('energy')}" data-nav="#/health">
          <div class="dash-card-label" style="color:${CARD_ACCENTS.energy.color}">🧠 Энергия</div>
          <div class="dash-card-value" style="font-size:20px; letter-spacing:2px;">${energyDots}</div>
          <div class="dash-card-sub">${todayLog?.energy ? `${todayLog.energy} из 5` : 'Не указана'}</div>
        </div>

        ${goals.main?.title ? `
        <div class="card dash-card-full clickable" data-nav="#/goals">
          <div class="dash-card-label">🎯 Главная цель</div>
          <div class="dash-goal-title">${goals.main.title}</div>
          <div class="progress-row">
            <div class="progress-bar" style="flex:1"><div class="progress-fill" style="width:${goals.main.progress || 0}%"></div></div>
            <span class="progress-label">${goals.main.progress || 0}%</span>
          </div>
          ${goals.main.next_step ? `<div class="dash-card-sub mt-8">→ ${goals.main.next_step}</div>` : ''}
        </div>
        ` : `
        <div class="card dash-card-full clickable" data-nav="#/goals" style="border:1px dashed var(--border); background:transparent;">
          <div class="dash-card-label">🎯 Главная цель</div>
          <div class="dash-card-sub mt-4">Поставьте главную цель жизни →</div>
        </div>
        `}

        ${dashboard.main_risk ? `
        <div class="card dash-card-full" style="border-left:3px solid var(--warning); background:rgba(245,158,11,0.06);">
          <div class="dash-card-label" style="color:var(--warning)">⚠️ Главный риск</div>
          <div style="font-size:14px; margin-top:6px; color:var(--text);">${dashboard.main_risk}</div>
        </div>
        ` : ''}
      </div>

      <div class="section-header">
        <span class="section-title">Топ-3 на сегодня</span>
        <button class="btn btn-ghost btn-sm text-accent" id="add-task-btn">+ Добавить</button>
      </div>
      <div class="card" id="tasks-card">
        <div id="tasks-list">${this.renderTasks(tasks)}</div>
        ${tasks.length === 0 ? '<div class="text-muted text-sm" style="text-align:center; padding:12px 0;">Добавьте задачи на сегодня</div>' : ''}
      </div>
    `;

    el.querySelectorAll('[data-nav]').forEach(card => {
      card.addEventListener('click', () => navigate(card.dataset.nav));
    });

    el.querySelector('#search-btn').addEventListener('click', () => navigate('#/search'));
    el.querySelector('#add-task-btn').addEventListener('click', () => this.addTask(el));
    el.querySelector('#ai-toggle').addEventListener('click', () => this.toggleAi(el));
    el.querySelector('#ai-refresh-btn').addEventListener('click', () => {
      clearAiCache();
      this.loadAi(el, store.getAll());
    });
    el.querySelector('#settings-btn').addEventListener('click', () => this.openSettings());

    el.querySelectorAll('.dash-mood-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mood = parseInt(btn.dataset.mood);
        const logs = store.get('health.logs') || [];
        const idx = logs.findIndex(l => l.date === todayStr);
        if (idx >= 0) logs[idx] = { ...logs[idx], mood };
        else logs.push({ date: todayStr, mood });
        store.set('health.logs', logs);
        el.querySelectorAll('.dash-mood-btn').forEach(b =>
          b.classList.toggle('active', parseInt(b.dataset.mood) === mood)
        );
        toast(['😫','😕','😐','🙂','😊'][mood - 1]);
      });
    });

    el.querySelector('#tasks-list').addEventListener('click', e => {
      const cb = e.target.closest('.checkbox');
      if (cb) this.toggleTask(parseInt(cb.dataset.idx), el);
      const del = e.target.closest('[data-del-task]');
      if (del) this.deleteTask(parseInt(del.dataset.delTask), el);
    });

    this.loadAi(el, data);
    return el;
  }

  renderBirthdayBanner() {
    const upcoming = getUpcomingBirthdays(7);
    if (!upcoming.length) return '';

    return upcoming.map(f => {
      const isToday = f.daysLeft === 0;
      const isTomorrow = f.daysLeft === 1;
      const label = isToday
        ? `Сегодня день рождения!`
        : isTomorrow
          ? `Завтра день рождения`
          : `Через ${f.daysLeft} дня день рождения`;
      const age = f.age !== null ? ` · исполняется ${f.age + 1} лет` : '';
      return `
        <div class="birthday-banner ${isToday ? 'birthday-today' : ''}" data-nav="#/friends">
          <span class="birthday-icon">🎂</span>
          <div class="birthday-info">
            <div class="birthday-name">${f.name}</div>
            <div class="birthday-sub">${label}${age}</div>
          </div>
          ${isToday ? '<span class="birthday-tag">Поздравь!</span>' : ''}
        </div>
      `;
    }).join('');
  }

  renderTasks(tasks) {
    if (!tasks.length) return '';
    return tasks.map((t, i) => `
      <div class="task-item">
        <div class="checkbox ${t.done ? 'checked' : ''}" data-idx="${i}">${t.done ? '✓' : ''}</div>
        <span class="task-text ${t.done ? 'done' : ''}">${t.text}</span>
        <button class="btn btn-ghost btn-icon text-muted" data-del-task="${i}">✕</button>
      </div>
    `).join('');
  }

  toggleTask(idx, el) {
    const tasks = store.get('dashboard.daily_tasks') || [];
    tasks[idx].done = !tasks[idx].done;
    store.set('dashboard.daily_tasks', tasks);
    el.querySelector('#tasks-list').innerHTML = this.renderTasks(tasks);
  }

  deleteTask(idx, el) {
    const tasks = store.get('dashboard.daily_tasks') || [];
    tasks.splice(idx, 1);
    store.set('dashboard.daily_tasks', tasks);
    el.querySelector('#tasks-list').innerHTML = this.renderTasks(tasks);
    toast('Задача удалена');
  }

  addTask(el) {
    const tasks = store.get('dashboard.daily_tasks') || [];
    if (tasks.filter(t => !t.done).length >= 3) {
      toast('Максимум 3 активные задачи');
      return;
    }
    const body = document.createElement('div');
    body.innerHTML = `
      <div class="input-group">
        <label class="input-label">Задача на сегодня</label>
        <input class="input" id="task-input" placeholder="Что нужно сделать?" maxlength="120">
      </div>
    `;
    const modal = openModal({
      title: 'Новая задача',
      content: body,
      actions: [
        { label: 'Добавить', cls: 'btn-primary', onClick: (m) => {
          const text = m.querySelector('#task-input').value.trim();
          if (!text) return;
          tasks.push({ text, done: false, created: Date.now() });
          store.set('dashboard.daily_tasks', tasks);
          el.querySelector('#tasks-list').innerHTML = this.renderTasks(tasks);
          closeModal();
          toast('Задача добавлена ✓');
        }},
        { label: 'Отмена', cls: 'btn-secondary', onClick: () => closeModal() }
      ]
    });
    setTimeout(() => modal.querySelector('#task-input')?.focus(), 100);
  }

  openSettings() {
    const currentKey = getApiKey();
    const notifPerm = getNotificationPermission();
    const currentTheme = localStorage.getItem('life_os_theme') || '';

    const body = document.createElement('div');
    body.innerHTML = `
      <div style="margin-bottom:20px;">
        <div class="input-label" style="margin-bottom:6px;">Claude API ключ</div>
        <div style="font-size:12px; color:var(--text-secondary); margin-bottom:10px;">
          Нужен для AI-советника. Получить можно на console.anthropic.com
        </div>
        <input class="input" id="api-key-input" type="password"
          placeholder="sk-ant-..."
          value="${currentKey ? '••••••••••••' + currentKey.slice(-4) : ''}">
        ${currentKey ? `<div style="font-size:11px; color:var(--success); margin-top:6px;">✓ Ключ сохранён</div>` : ''}
      </div>

      <div style="margin-bottom:20px;">
        <div class="input-label" style="margin-bottom:8px;">Тема</div>
        <div style="display:flex; gap:8px;">
          <button class="btn ${currentTheme !== 'light' ? 'btn-primary' : 'btn-secondary'}" id="theme-dark-btn" style="flex:1;">🌙 Тёмная</button>
          <button class="btn ${currentTheme === 'light' ? 'btn-primary' : 'btn-secondary'}" id="theme-light-btn" style="flex:1;">☀️ Светлая</button>
        </div>
      </div>

      <div style="margin-bottom:20px;">
        <div class="input-label" style="margin-bottom:8px;">Данные</div>
        <div style="display:flex; gap:8px;">
          <button class="btn btn-secondary" style="flex:1;" id="export-btn">📤 Экспорт</button>
          <label class="btn btn-secondary" style="flex:1; cursor:pointer; justify-content:center;">
            📥 Импорт
            <input type="file" id="import-file" accept=".json" style="display:none;">
          </label>
        </div>
      </div>

      <div style="margin-bottom:20px;">
        <div class="input-label" style="margin-bottom:6px;">Уведомления о ДР</div>
        <div style="font-size:12px; color:var(--text-secondary); margin-bottom:10px;">
          Браузер уведомит о днях рождения друзей за 3 дня
        </div>
        ${notifPerm === 'granted'
          ? `<div style="font-size:13px; color:var(--success);">✓ Уведомления включены</div>`
          : notifPerm === 'denied'
            ? `<div style="font-size:13px; color:var(--danger);">✕ Заблокированы в настройках браузера</div>`
            : `<button class="btn btn-secondary btn-sm" id="enable-notif-btn">🔔 Включить уведомления</button>`
        }
      </div>

      <div style="margin-bottom:20px;">
        <div class="input-label" style="margin-bottom:6px;">Главный риск</div>
        <input class="input" id="risk-input" placeholder="Что может пойти не так..."
          value="${store.get('dashboard.main_risk') || ''}">
      </div>

      <div>
        <div class="input-label" style="margin-bottom:8px;">Аккаунт</div>
        <div style="font-size:12px; color:var(--text-secondary); margin-bottom:10px;" id="user-email-label">
          Загрузка...
        </div>
        <button class="btn btn-secondary btn-sm" id="logout-btn" style="color:var(--danger); border-color:var(--danger)40;">
          Выйти из аккаунта
        </button>
      </div>
    `;

    body.querySelector('#theme-dark-btn')?.addEventListener('click', () => {
      localStorage.removeItem('life_os_theme');
      document.documentElement.removeAttribute('data-theme');
      body.querySelector('#theme-dark-btn').className = 'btn btn-primary';
      body.querySelector('#theme-dark-btn').style.flex = '1';
      body.querySelector('#theme-light-btn').className = 'btn btn-secondary';
      body.querySelector('#theme-light-btn').style.flex = '1';
    });

    body.querySelector('#theme-light-btn')?.addEventListener('click', () => {
      localStorage.setItem('life_os_theme', 'light');
      document.documentElement.setAttribute('data-theme', 'light');
      body.querySelector('#theme-light-btn').className = 'btn btn-primary';
      body.querySelector('#theme-light-btn').style.flex = '1';
      body.querySelector('#theme-dark-btn').className = 'btn btn-secondary';
      body.querySelector('#theme-dark-btn').style.flex = '1';
    });

    body.querySelector('#export-btn')?.addEventListener('click', () => {
      exportData();
      toast('Данные экспортированы ✓');
    });

    body.querySelector('#import-file')?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        await importData(file);
        toast('Данные импортированы ✓');
        closeModal();
        setTimeout(() => navigate('#/dashboard', { force: true }), 300);
      } catch (err) {
        toast(err.message);
      }
    });

    getCurrentUser().then(user => {
      const label = body.querySelector('#user-email-label');
      if (label) label.textContent = user?.email || 'Гость';
    });

    body.querySelector('#logout-btn')?.addEventListener('click', async () => {
      if (!confirm('Выйти из аккаунта?')) return;
      await signOut();
      closeModal();
      navigate('#/auth');
    });

    body.querySelector('#enable-notif-btn')?.addEventListener('click', async () => {
      const result = await requestNotificationPermission();
      if (result === 'granted') {
        toast('Уведомления включены ✓');
        body.querySelector('#enable-notif-btn').replaceWith(
          Object.assign(document.createElement('div'), {
            style: 'font-size:13px; color:var(--success);',
            textContent: '✓ Уведомления включены'
          })
        );
      } else {
        toast('Разрешение не дано');
      }
    });

    openModal({
      title: '⚙️ Настройки',
      content: body,
      actions: [
        { label: 'Сохранить', cls: 'btn-primary', onClick: (m) => {
          const key = m.querySelector('#api-key-input').value.trim();
          if (key && !key.includes('•')) setApiKey(key);
          const risk = m.querySelector('#risk-input').value.trim();
          store.set('dashboard.main_risk', risk);
          closeModal();
          toast('Сохранено ✓');
          navigate('#/dashboard', { force: true });
        }},
        { label: 'Отмена', cls: 'btn-secondary', onClick: () => closeModal() }
      ]
    });
    setTimeout(() => {
      if (!currentKey) body.querySelector('#api-key-input')?.focus();
    }, 100);
  }

  toggleAi(el) {
    const body = el.querySelector('#ai-body');
    const btn = el.querySelector('#ai-toggle');
    const hidden = body.style.display === 'none';
    body.style.display = hidden ? '' : 'none';
    btn.textContent = hidden ? 'скрыть' : 'показать';
  }

  async loadAi(el, data) {
    const aiBody = el.querySelector('#ai-body');
    if (!aiBody) return;

    if (!getApiKey()) {
      aiBody.innerHTML = `
        <div class="ai-text text-muted">
          Нажмите ⚙️ чтобы добавить API ключ и получать ежедневные советы
        </div>
      `;
      return;
    }

    aiBody.innerHTML = '<div class="ai-text text-muted">Анализирую вашу жизнь...</div>';

    try {
      const result = await analyzeLife(data);
      if (!result) {
        aiBody.innerHTML = '<div class="ai-text text-muted">Нажмите ✨ чтобы получить совет</div>';
        return;
      }
      aiBody.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:8px;">
          <div class="ai-insight"><span class="ai-tag" style="color:#6366F1">Сегодня</span>${result.today}</div>
          <div class="ai-insight"><span class="ai-tag" style="color:#22C55E">Важно</span>${result.important}</div>
          ${result.warning ? `<div class="ai-insight"><span class="ai-tag" style="color:#F59E0B">Внимание</span>${result.warning}</div>` : ''}
          <div class="ai-insight"><span class="ai-tag" style="color:var(--text-secondary)">Совет</span>${result.improve}</div>
        </div>
      `;
    } catch (err) {
      aiBody.innerHTML = `<div class="ai-text text-muted">Ошибка: ${err.message}</div>`;
    }
  }
}
