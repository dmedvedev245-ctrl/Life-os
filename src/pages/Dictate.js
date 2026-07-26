import { store } from '../store.js';
import { toast } from '../components/Toast.js';
import { parseDictation } from '../ai/dictation.js';

const TX_CATEGORY_LABELS = { food: '🍔 Еда', transport: '🚗 Транспорт', home: '🏠 Дом/ЖКХ', health: '💊 Здоровье', clothes: '👗 Одежда', fun: '🎭 Развлечения', phone: '📱 Связь', sport: '💪 Спорт', debt: '💳 Долг/Кредит', other: '📦 Другое' };
const INC_CATEGORY_LABELS = { salary: '💰 Зарплата', freelance: '💻 Фриланс', gift: '🎁 Подарок', invest: '📈 Инвестиции', other: '📦 Другое' };
const INBOX_CATEGORY_LABELS = { idea: '💡 Идея', task: '✅ Задача', buy: '🛒 Покупка', other: '📌 Другое' };
const HEALTH_FIELD_LABELS = { sleep: 'сон', weight: 'вес', water: 'вода', mood: 'настроение', energy: 'энергия', workout: 'тренировка', vitamins: 'витамины' };

function getTodayStr() { return new Date().toISOString().split('T')[0]; }

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = String(s ?? '');
  return div.innerHTML;
}

function describeOperation(op) {
  switch (op.target) {
    case 'finance_expense':
      return `💸 Списание ${op.amount}₽ — ${TX_CATEGORY_LABELS[op.category] || op.category}${op.comment ? ' · ' + op.comment : ''}`;
    case 'finance_income':
      return `💵 Доход ${op.amount}₽ — ${INC_CATEGORY_LABELS[op.category] || op.category}${op.comment ? ' · ' + op.comment : ''}`;
    case 'health_log': {
      const parts = Object.keys(HEALTH_FIELD_LABELS).filter(k => op[k] !== undefined).map(k => `${HEALTH_FIELD_LABELS[k]}: ${op[k]}`);
      return `🏃 Здоровье — ${parts.join(', ') || '—'}`;
    }
    case 'habit_checkin':
      return op.matched ? `✅ Привычка «${op.habit_name}» — отметить сегодня` : `⚠️ Привычка «${op.habit_name}» не найдена`;
    case 'goal_update':
      return `🎯 Цель — ${op.field}: ${op.value}`;
    case 'subgoal_add':
      return `🎯 Новая подцель: «${op.title}»${op.deadline ? ' до ' + op.deadline : ''}`;
    case 'work_update':
      return `💼 Работа — ${op.field}: ${op.value}`;
    case 'work_note':
      return `💼 Работа (${op.list}): ${op.text}`;
    case 'relation_update':
      return `❤️ Отношения — ${op.field}: ${op.value}`;
    case 'relation_list':
      return `❤️ Отношения (${op.list}): ${op.text}`;
    case 'relation_date':
      return `❤️ Важная дата: ${op.name} — ${op.date}`;
    case 'friend_contact':
      return op.matched ? `👥 Контакт с «${op.friend_name}» — отметить сегодня` : `⚠️ Друг «${op.friend_name}» не найден`;
    case 'inbox_note':
      return `📥 Инбокс (${INBOX_CATEGORY_LABELS[op.category] || op.category}): ${op.text}`;
    default:
      return `❓ Не распознано`;
  }
}

function toInboxFallback(op) {
  const text = op.text || op.comment || op.habit_name || op.friend_name || op.title || describeOperation(op);
  return { target: 'inbox_note', text: String(text), category: 'other' };
}

function applyOperation(op) {
  const today = getTodayStr();
  switch (op.target) {
    case 'finance_expense':
    case 'finance_income': {
      const tx = {
        id: Date.now() + Math.random(),
        date: today,
        amount: Number(op.amount) || 0,
        type: op.target === 'finance_income' ? 'income' : 'expense',
        category: op.category || 'other',
        comment: op.comment || ''
      };
      store.update('finance.transactions', arr => [...(arr || []), tx]);
      return true;
    }
    case 'health_log': {
      const logs = store.get('health.logs') || [];
      const idx = logs.findIndex(l => l.date === today);
      const current = idx >= 0 ? logs[idx] : { date: today };
      const updates = {};
      Object.keys(HEALTH_FIELD_LABELS).forEach(k => { if (op[k] !== undefined) updates[k] = op[k]; });
      const updated = { ...current, ...updates };
      if (idx >= 0) logs[idx] = updated; else logs.push(updated);
      store.set('health.logs', logs);
      return true;
    }
    case 'habit_checkin': {
      const habits = store.get('habits') || [];
      const idx = habits.findIndex(h => h.name === op.habit_name);
      if (idx === -1) return false;
      const completions = habits[idx].completions || [];
      if (!completions.includes(today)) habits[idx].completions = [...completions, today];
      store.set('habits', habits);
      return true;
    }
    case 'goal_update': {
      if (!['next_step', 'motivation', 'deadline', 'title', 'progress'].includes(op.field)) return false;
      const value = op.field === 'progress' ? parseInt(op.value) || 0 : op.value;
      store.set('goals.main.' + op.field, value);
      return true;
    }
    case 'subgoal_add': {
      if (!op.title) return false;
      store.update('goals.subgoals', arr => [...(arr || []), { title: op.title, deadline: op.deadline || '', done: false }]);
      return true;
    }
    case 'work_update': {
      const numericFields = ['sales_today', 'profit', 'avg_check', 'conversion', 'plan', 'fact'];
      if (!numericFields.includes(op.field) && op.field !== 'tomorrow') return false;
      const value = numericFields.includes(op.field) ? Number(op.value) || 0 : op.value;
      store.set('work.' + op.field, value);
      return true;
    }
    case 'work_note': {
      if (!['ideas', 'problems', 'blockers'].includes(op.list)) return false;
      store.update('work.' + op.list, arr => [...(arr || []), op.text]);
      return true;
    }
    case 'relation_update': {
      if (!['partner_name', 'last_date', 'next_date', 'next_date_desc', 'notes'].includes(op.field)) return false;
      store.set('relations.' + op.field, op.value);
      return true;
    }
    case 'relation_list': {
      if (!['date_ideas', 'promises', 'gifts'].includes(op.list)) return false;
      const entry = op.list === 'date_ideas' ? op.text : { text: op.text, done: false };
      store.update('relations.' + op.list, arr => [...(arr || []), entry]);
      return true;
    }
    case 'relation_date': {
      if (!op.name || !op.date) return false;
      store.update('relations.important_dates', arr => [...(arr || []), { name: op.name, date: op.date }]);
      return true;
    }
    case 'friend_contact': {
      const friends = store.get('friends') || [];
      const idx = friends.findIndex(f => f.name === op.friend_name);
      if (idx === -1) return false;
      friends[idx].last_contact = today;
      store.set('friends', friends);
      return true;
    }
    case 'inbox_note': {
      const items = store.get('inbox') || [];
      items.unshift({ text: op.text || '', category: op.category || 'other', created: Date.now(), reminder: null });
      store.set('inbox', items);
      return true;
    }
    default:
      return false;
  }
}

export class DictatePage {
  constructor() {
    this.ops = null;
    this.recognizing = false;
  }

  render() {
    const el = document.createElement('div');
    this.el = el;
    const log = (store.get('dictation_log') || []).slice(0, 5);

    el.innerHTML = `
      <div class="page-title" style="margin-bottom:16px;">🎙️ Надиктовка</div>
      <textarea class="input" id="dictate-text" rows="4" placeholder="Например: потратил 500 на такси, вес сегодня 82"></textarea>
      <div style="display:flex; gap:8px; margin-top:10px;">
        <button class="btn btn-secondary" id="mic-btn" style="display:none;">🎤 Говорить</button>
        <button class="btn btn-primary" id="parse-btn" style="flex:1;">Разобрать</button>
      </div>
      <div id="ops-list" style="margin-top:20px;"></div>
      <div id="apply-all-wrap"></div>
      ${log.length ? `
        <div class="page-title" style="font-size:14px; margin-top:28px; margin-bottom:10px;">Последние записи</div>
        <div>
          ${log.map(l => `
            <div class="card" style="margin-bottom:8px; padding:10px 14px;">
              <div class="text-xs text-muted">${new Date(l.date).toLocaleString('ru')}</div>
              <div style="font-size:13px; margin-top:2px;">${escapeHtml(l.raw)}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;

    this.bindMic();
    el.querySelector('#parse-btn').addEventListener('click', () => this.parse());

    return el;
  }

  bindMic() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const micBtn = this.el.querySelector('#mic-btn');
    if (!SR) return;

    micBtn.style.display = '';
    const recognition = new SR();
    recognition.lang = 'ru-RU';
    recognition.continuous = true;
    recognition.interimResults = true;

    const textarea = this.el.querySelector('#dictate-text');
    let baseText = '';

    recognition.onresult = (e) => {
      let transcript = '';
      for (let i = 0; i < e.results.length; i++) transcript += e.results[i][0].transcript;
      textarea.value = (baseText ? baseText + ' ' : '') + transcript;
    };
    const stopUi = () => {
      this.recognizing = false;
      micBtn.textContent = '🎤 Говорить';
      micBtn.classList.remove('btn-danger');
    };
    recognition.onerror = () => { toast('Не удалось распознать речь'); stopUi(); };
    recognition.onend = stopUi;

    micBtn.addEventListener('click', () => {
      if (this.recognizing) { recognition.stop(); return; }
      baseText = textarea.value.trim();
      this.recognizing = true;
      micBtn.textContent = '⏹ Стоп';
      micBtn.classList.add('btn-danger');
      try { recognition.start(); } catch { /* already running */ }
    });
  }

  async parse() {
    const textarea = this.el.querySelector('#dictate-text');
    const text = textarea.value.trim();
    if (!text) { toast('Сначала введите текст'); return; }

    const btn = this.el.querySelector('#parse-btn');
    btn.disabled = true;
    btn.textContent = 'Разбираю...';
    try {
      const ops = await parseDictation(text, store.getAll());
      this.ops = ops.map(op => ({ op, status: 'pending' }));
      this.renderOps();
    } catch (e) {
      toast('Ошибка: ' + e.message);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Разобрать';
    }
  }

  renderOps() {
    const wrap = this.el.querySelector('#ops-list');
    const applyAllWrap = this.el.querySelector('#apply-all-wrap');
    if (!this.ops || !this.ops.length) { wrap.innerHTML = ''; applyAllWrap.innerHTML = ''; return; }

    wrap.innerHTML = this.ops.map((item, i) => {
      if (item.status === 'applied') {
        return `<div class="card" style="margin-bottom:8px; padding:10px 14px; opacity:0.6;">✓ ${escapeHtml(describeOperation(item.op))}</div>`;
      }
      if (item.status === 'rejected') return '';
      const needsAttention = (item.op.target === 'habit_checkin' || item.op.target === 'friend_contact') && item.op.matched === false;
      return `
        <div class="card" style="margin-bottom:8px; padding:10px 14px; ${needsAttention ? 'border-color:var(--warning);' : ''}">
          <div style="font-size:14px; margin-bottom:8px;">${escapeHtml(describeOperation(item.op))}</div>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-primary btn-sm" data-act="apply" data-i="${i}" style="flex:1;">Применить</button>
            <button class="btn btn-secondary btn-sm" data-act="inbox" data-i="${i}" style="flex:1;">В Инбокс</button>
            <button class="btn btn-ghost btn-sm" data-act="reject" data-i="${i}">✕</button>
          </div>
        </div>
      `;
    }).join('');

    const pendingCount = this.ops.filter(o => o.status === 'pending').length;
    applyAllWrap.innerHTML = pendingCount > 1
      ? `<button class="btn btn-primary btn-full" id="apply-all-btn">Применить все (${pendingCount})</button>`
      : '';

    wrap.querySelectorAll('[data-act]').forEach(btn => {
      const i = parseInt(btn.dataset.i);
      btn.addEventListener('click', () => {
        const act = btn.dataset.act;
        if (act === 'apply') this.applyOne(i);
        else if (act === 'inbox') this.toInbox(i);
        else if (act === 'reject') { this.ops[i].status = 'rejected'; this.renderOps(); }
      });
    });

    applyAllWrap.querySelector('#apply-all-btn')?.addEventListener('click', () => this.applyAll());
  }

  applyOne(i) {
    const item = this.ops[i];
    const ok = applyOperation(item.op);
    item.status = ok ? 'applied' : 'rejected';
    if (!ok) toast('Не удалось применить — попробуйте «В Инбокс»');
    else this.logApplied([item.op]);
    this.renderOps();
  }

  toInbox(i) {
    const item = this.ops[i];
    const fallback = toInboxFallback(item.op);
    applyOperation(fallback);
    item.status = 'applied';
    this.logApplied([fallback]);
    this.renderOps();
  }

  applyAll() {
    const applied = [];
    this.ops.forEach(item => {
      if (item.status !== 'pending') return;
      const ok = applyOperation(item.op);
      item.status = ok ? 'applied' : 'rejected';
      if (ok) applied.push(item.op);
    });
    this.logApplied(applied);
    toast(`Записано: ${applied.length}`);
    this.renderOps();
  }

  logApplied(ops) {
    if (!ops.length) return;
    const raw = this.el.querySelector('#dictate-text')?.value.trim() || '';
    store.update('dictation_log', arr => [{ date: Date.now(), raw, ops }, ...(arr || [])].slice(0, 20));
  }
}
