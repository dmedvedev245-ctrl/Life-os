import { store } from '../store.js';
import { toast } from '../components/Toast.js';
import { openModal, closeModal } from '../components/Modal.js';
import { requestNotificationPermission, getNotificationPermission } from '../notifications.js';

function fmt(n) { return Number(n || 0).toLocaleString('ru') + ' ₽'; }
function fmtNum(n) { return Number(n || 0).toLocaleString('ru'); }

function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function getTodayStr() { return new Date().toISOString().split('T')[0]; }

function formatDateRu(dateStr) {
  if (!dateStr) return '—';
  const months = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
  const d = new Date(dateStr);
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

const TX_CATEGORIES = [
  { id: 'food',    emoji: '🍔', label: 'Еда' },
  { id: 'transport', emoji: '🚗', label: 'Транспорт' },
  { id: 'home',    emoji: '🏠', label: 'Дом/ЖКХ' },
  { id: 'health',  emoji: '💊', label: 'Здоровье' },
  { id: 'clothes', emoji: '👗', label: 'Одежда' },
  { id: 'fun',     emoji: '🎭', label: 'Развлечения' },
  { id: 'phone',   emoji: '📱', label: 'Связь' },
  { id: 'sport',   emoji: '💪', label: 'Спорт' },
  { id: 'debt',    emoji: '💳', label: 'Долг/Кредит' },
  { id: 'other',   emoji: '📦', label: 'Другое' },
];
const INC_CATEGORIES = [
  { id: 'salary',  emoji: '💰', label: 'Зарплата' },
  { id: 'freelance', emoji: '💻', label: 'Фриланс' },
  { id: 'gift',    emoji: '🎁', label: 'Подарок' },
  { id: 'invest',  emoji: '📈', label: 'Инвестиции' },
  { id: 'other',   emoji: '📦', label: 'Другое' },
];

function getCatMeta(catId, type) {
  const list = type === 'income' ? INC_CATEGORIES : TX_CATEGORIES;
  return list.find(c => c.id === catId) || { emoji: '📦', label: catId || 'Другое' };
}

export class FinancePage {
  constructor() {
    this.activeTab = 'cards';
    this.journalMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  }

  render() {
    const el = document.createElement('div');
    this.el = el;
    this.draw();
    return el;
  }

  draw() {
    const data = store.get('finance') || {};
    const cards = data.cards || [];
    const debts = data.debts || [];
    const income = data.monthly_income || 0;
    const expenses = data.monthly_expenses || [];
    const accounts = data.accounts || [];

    const totalCardDebt = cards.reduce((s, c) => s + (c.debt || 0), 0);
    const totalDebt = debts.reduce((s, d) => s + (d.amount || 0), 0);
    const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);
    const cashflow = income - totalExpenses;

    const accountChips = accounts.map(a => `
      <button class="btn btn-ghost" data-edit-account="${a.id}"
        style="display:flex; align-items:center; gap:4px; padding:4px 8px; border-radius:16px; border:1px solid var(--border); font-size:12px; background:var(--surface-2);">
        <span>${a.icon || '🏦'}</span>
        <span style="color:var(--text-secondary);">${a.name}</span>
        <span style="font-weight:700;">${fmt(a.balance)}</span>
      </button>
    `).join('');

    this.el.innerHTML = `
      <div class="page-title" style="margin-bottom:16px;">💰 Финансы</div>

      <div class="finance-summary">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <div class="card-sub" style="margin-bottom:4px;">Общий долг</div>
            <div class="finance-total">${fmt(totalCardDebt + totalDebt)}</div>
          </div>
          <div style="text-align:right;">
            <div class="text-xs text-muted">На счетах</div>
            <div style="font-size:18px; font-weight:800; color:var(--success);">${fmt(totalBalance)}</div>
          </div>
        </div>

        <div style="display:flex; gap:16px; margin-top:12px; flex-wrap:wrap;">
          <div>
            <div class="text-xs text-muted">Доход</div>
            <div style="font-size:15px; font-weight:700; color:var(--success);">${fmt(income)}</div>
          </div>
          <div>
            <div class="text-xs text-muted">Расходы</div>
            <div style="font-size:15px; font-weight:700; color:var(--danger);">${fmt(totalExpenses)}</div>
          </div>
          <div>
            <div class="text-xs text-muted">Поток</div>
            <div style="font-size:15px; font-weight:700; color:${cashflow >= 0 ? 'var(--success)' : 'var(--danger)'};">${fmt(cashflow)}</div>
          </div>
        </div>

        <div style="margin-top:10px; display:flex; flex-wrap:wrap; gap:6px; align-items:center;">
          ${accountChips}
          <button class="btn btn-ghost" id="add-account-btn"
            style="padding:4px 8px; border-radius:16px; border:1px dashed var(--border); font-size:12px; color:var(--accent);">
            + Счёт
          </button>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
          <button class="btn btn-ghost btn-sm text-accent" id="edit-income-btn">✏️ Изменить доход</button>
          <button class="btn btn-ghost btn-sm" id="toggle-notif-btn" style="color:${getNotificationPermission()==='granted'?'var(--success)':'var(--text-muted)'};">
            ${getNotificationPermission()==='granted' ? '🔔 Уведомления вкл.' : '🔕 Включить уведомления'}
          </button>
        </div>
      </div>

      <div class="tabs">
        <div class="tab ${this.activeTab==='journal'?'active':''}" data-tab="journal">Журнал</div>
        <div class="tab ${this.activeTab==='budget'?'active':''}" data-tab="budget">Бюджет</div>
        <div class="tab ${this.activeTab==='cards'?'active':''}" data-tab="cards">Карты</div>
        <div class="tab ${this.activeTab==='debts'?'active':''}" data-tab="debts">Долги</div>
        <div class="tab ${this.activeTab==='payments'?'active':''}" data-tab="payments">Платежи</div>
        <div class="tab ${this.activeTab==='forecast'?'active':''}" data-tab="forecast">Прогноз</div>
        <div class="tab ${this.activeTab==='analytics'?'active':''}" data-tab="analytics">Аналитика</div>
      </div>

      <div id="tab-content">${this.renderTab(data)}</div>
    `;

    this.el.querySelectorAll('.tab').forEach(t => {
      t.addEventListener('click', () => {
        this.activeTab = t.dataset.tab;
        this.el.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        this.el.querySelector('#tab-content').innerHTML = this.renderTab(store.get('finance') || {});
        this.bindTabEvents(store.get('finance') || {});
      });
    });

    this.el.querySelector('#edit-income-btn').addEventListener('click', () => this.editIncome());
    this.el.querySelector('#toggle-notif-btn').addEventListener('click', async () => {
      if (getNotificationPermission() === 'granted') {
        toast('Уведомления уже включены. Отключите в настройках браузера.');
        return;
      }
      const result = await requestNotificationPermission();
      if (result === 'granted') {
        toast('🔔 Уведомления включены — будем напоминать о платежах');
        this.draw();
      } else {
        toast('Уведомления заблокированы в браузере');
      }
    });
    this.el.querySelector('#add-account-btn').addEventListener('click', () => this.addAccount());
    this.el.querySelectorAll('[data-edit-account]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = Number(btn.dataset.editAccount);
        const acc = (store.get('finance.accounts') || []).find(a => a.id === id);
        if (acc) this.editAccount(acc);
      });
    });

    this.bindTabEvents(data);
  }

  renderTab(data) {
    switch(this.activeTab) {
      case 'journal': return this.renderJournal(data);
      case 'budget': return this.renderBudget(data);
      case 'cards': return this.renderCards(data);
      case 'debts': return this.renderDebts(data);
      case 'payments': return this.renderPayments(data);
      case 'forecast': return this.renderForecast(data);
      case 'analytics': return this.renderAnalytics(data);
      default: return '';
    }
  }

  renderJournal(data) {
    const transactions = (data.transactions || []).filter(t => t.date && t.date.startsWith(this.journalMonth));
    const [year, mon] = this.journalMonth.split('-').map(Number);
    const prevMonth = new Date(year, mon - 2, 1).toISOString().slice(0, 7);
    const nextMonth = new Date(year, mon, 1).toISOString().slice(0, 7);
    const isCurrentMonth = this.journalMonth === new Date().toISOString().slice(0, 7);
    const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
    const monthLabel = `${monthNames[mon - 1]} ${year}`;

    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const balance = totalIncome - totalExpense;

    // group by day descending
    const byDay = {};
    transactions.forEach(t => {
      byDay[t.date] = byDay[t.date] || [];
      byDay[t.date].push(t);
    });
    const sortedDays = Object.keys(byDay).sort((a, b) => b.localeCompare(a));

    // category breakdown (expenses only)
    const catTotals = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
    });
    const topCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const daysHtml = sortedDays.map(day => {
      const dayTxs = byDay[day];
      const dayTotal = dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const txHtml = dayTxs.map(t => {
        const cat = getCatMeta(t.category, t.type);
        const sign = t.type === 'income' ? '+' : '−';
        const color = t.type === 'income' ? 'var(--success)' : 'var(--text-primary)';
        return `
          <div class="tx-item" style="display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px solid var(--border);">
            <div style="width:36px; height:36px; border-radius:10px; background:var(--surface-2); display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0;">${cat.emoji}</div>
            <div style="flex:1; min-width:0;">
              <div style="font-size:14px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${t.comment || cat.label}</div>
              <div class="text-xs text-muted">${cat.label}</div>
            </div>
            <div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
              <div style="text-align:right;">
                <div style="font-weight:700; color:${color};">${sign}${fmt(t.amount)}</div>
              </div>
              <button class="btn btn-ghost btn-icon" data-edit-tx="${t.id}" style="font-size:15px; color:var(--text-secondary);">✏️</button>
              <button class="btn btn-ghost btn-icon" data-del-tx="${t.id}" style="font-size:15px; color:var(--danger);">✕</button>
            </div>
          </div>
        `;
      }).join('');
      return `
        <div style="margin-bottom:4px;">
          <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; margin-top:8px;">
            <div style="font-size:13px; font-weight:700; color:var(--text-secondary);">${formatDateRu(day)}</div>
            ${dayTotal > 0 ? `<div class="text-xs text-muted">${fmt(dayTotal)}</div>` : ''}
          </div>
          ${txHtml}
        </div>
      `;
    }).join('');

    return `
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
        <button class="btn btn-ghost btn-icon" id="journal-prev">‹</button>
        <div style="font-weight:700; font-size:15px;">${monthLabel}</div>
        <button class="btn btn-ghost btn-icon" id="journal-next" ${isCurrentMonth ? 'disabled style="opacity:0.3"' : ''}>›</button>
      </div>

      <div style="display:flex; gap:8px; margin-bottom:16px;">
        <div style="flex:1; background:var(--surface-2); border-radius:12px; padding:10px 12px; text-align:center;">
          <div class="text-xs text-muted">Доходы</div>
          <div style="font-weight:700; font-size:15px; color:var(--success); margin-top:2px;">+${fmt(totalIncome)}</div>
        </div>
        <div style="flex:1; background:var(--surface-2); border-radius:12px; padding:10px 12px; text-align:center;">
          <div class="text-xs text-muted">Расходы</div>
          <div style="font-weight:700; font-size:15px; color:var(--danger); margin-top:2px;">−${fmt(totalExpense)}</div>
        </div>
        <div style="flex:1; background:var(--surface-2); border-radius:12px; padding:10px 12px; text-align:center;">
          <div class="text-xs text-muted">Баланс</div>
          <div style="font-weight:700; font-size:15px; color:${balance>=0?'var(--success)':'var(--danger)'}; margin-top:2px;">${balance>=0?'+':''}${fmt(balance)}</div>
        </div>
      </div>

      ${topCats.length > 0 ? `
      <div style="background:var(--surface-2); border-radius:12px; padding:12px; margin-bottom:16px;">
        <div style="font-size:13px; font-weight:700; color:var(--text-secondary); margin-bottom:10px;">Топ расходов</div>
        ${topCats.map(([catId, amount]) => {
          const cat = getCatMeta(catId, 'expense');
          const pct = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
          return `
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
              <span style="font-size:16px;">${cat.emoji}</span>
              <div style="flex:1;">
                <div style="display:flex; justify-content:space-between; margin-bottom:3px;">
                  <span style="font-size:13px;">${cat.label}</span>
                  <span style="font-size:13px; font-weight:700;">${fmt(amount)}</span>
                </div>
                <div class="progress-bar" style="height:4px; margin-top:0;">
                  <div class="progress-fill" style="width:${pct}%; background:var(--accent);"></div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
      ` : ''}

      ${sortedDays.length > 0 ? daysHtml : `
        <div class="empty-state">
          <div class="empty-state-icon">📒</div>
          <div class="empty-state-title">Транзакций нет</div>
          <div class="empty-state-text">Добавьте первую трату или доход</div>
        </div>
      `}

      <div style="display:flex; gap:8px; margin-top:16px;">
        <button class="btn btn-primary" id="add-expense-tx-btn" style="flex:1;">− Расход</button>
        <button class="btn btn-secondary" id="add-income-tx-btn" style="flex:1;">+ Доход</button>
      </div>
    `;
  }

  renderBudget(data) {
    const budgets = data.budgets || {};
    const month = new Date().toISOString().slice(0, 7);
    const txs = (data.transactions || []).filter(t => t.type === 'expense' && t.date && t.date.startsWith(month));

    const spent = {};
    txs.forEach(t => { spent[t.category] = (spent[t.category] || 0) + t.amount; });

    const totalBudget = TX_CATEGORIES.reduce((s, c) => s + (budgets[c.id] || 0), 0);
    const totalSpent = Object.values(spent).reduce((s, v) => s + v, 0);
    const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
    const monthLabel = monthNames[new Date().getMonth()];

    const rows = TX_CATEGORIES.map(cat => {
      const limit = budgets[cat.id] || 0;
      const fact = spent[cat.id] || 0;
      const pct = limit > 0 ? Math.min(100, Math.round((fact / limit) * 100)) : 0;
      const over = limit > 0 && fact > limit;
      const barColor = over ? 'var(--danger)' : pct > 79 ? 'var(--warning)' : 'var(--success)';
      return `
        <div style="padding:10px 0; border-bottom:1px solid var(--border);">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:20px;">${cat.emoji}</span>
              <span style="font-size:14px; font-weight:600;">${cat.label}</span>
              ${over ? `<span class="badge badge-danger" style="font-size:10px;">Превышен</span>` : ''}
            </div>
            <button class="btn btn-ghost btn-sm text-accent" data-set-budget="${cat.id}" style="font-size:12px; padding:2px 8px;">
              ${limit > 0 ? fmt(limit) : '+ Лимит'}
            </button>
          </div>
          ${limit > 0 ? `
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
              <span class="text-xs text-muted">Потрачено: <b style="color:${over?'var(--danger)':'var(--text-primary)'};">${fmt(fact)}</b></span>
              <span class="text-xs text-muted">Осталось: <b>${fmt(Math.max(0, limit - fact))}</b></span>
            </div>
            <div class="progress-bar" style="height:6px; margin-top:0;">
              <div style="height:100%; width:${pct}%; background:${barColor}; border-radius:3px; transition:width 0.3s;"></div>
            </div>
          ` : fact > 0 ? `<div class="text-xs text-muted">Потрачено: ${fmt(fact)} · лимит не задан</div>` : ''}
        </div>
      `;
    }).join('');

    return `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
        <div style="font-size:15px; font-weight:700;">${monthLabel}</div>
        ${totalBudget > 0 ? `
          <div style="text-align:right;">
            <div class="text-xs text-muted">Бюджет: ${fmt(totalBudget)}</div>
            <div class="text-xs" style="color:${totalSpent > totalBudget ? 'var(--danger)' : 'var(--success)'}; font-weight:700;">
              Потрачено: ${fmt(totalSpent)}
            </div>
          </div>
        ` : ''}
      </div>

      ${totalBudget > 0 ? `
        <div class="progress-bar" style="height:8px; margin-bottom:16px;">
          <div style="height:100%; width:${Math.min(100, Math.round((totalSpent/totalBudget)*100))}%;
            background:${totalSpent > totalBudget ? 'var(--danger)' : 'var(--accent)'}; border-radius:4px; transition:width 0.3s;"></div>
        </div>
      ` : '<div class="text-xs text-muted" style="margin-bottom:16px;">Задайте лимиты по категориям чтобы контролировать расходы</div>'}

      ${rows}
    `;
  }

  renderCards(data) {
    const cards = data.cards || [];
    if (!cards.length) return `
      <div class="empty-state">
        <div class="empty-state-icon">💳</div>
        <div class="empty-state-title">Кредитных карт нет</div>
        <div class="empty-state-text">Добавьте кредитную карту чтобы отслеживать льготные периоды</div>
      </div>
      <button class="btn btn-primary btn-full" id="add-card-btn">+ Добавить карту</button>
    `;

    const list = cards.map((c, i) => {
      const days = daysUntil(c.grace_period_end);
      const urgency = days !== null && days <= 3 ? 'urgent' : days !== null && days <= 7 ? 'warning' : '';
      const usedPct = c.limit ? Math.round((c.debt / c.limit) * 100) : 0;
      return `
        <div class="credit-card-item ${urgency}">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
            <div>
              <div style="font-size:16px; font-weight:700;">${c.bank}</div>
              ${days !== null ? `<div class="badge ${days <= 3 ? 'badge-danger' : days <= 7 ? 'badge-warning' : 'badge-muted'}" style="margin-top:4px;">⏱ Льготный: ${days} дн.</div>` : ''}
            </div>
            <div style="display:flex; gap:4px;">
              <button class="btn btn-ghost btn-icon text-muted" data-edit-card="${i}">✏️</button>
              <button class="btn btn-ghost btn-icon text-muted" data-del-card="${i}">✕</button>
            </div>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
            <div>
              <div class="text-xs text-muted">Долг</div>
              <div style="font-size:18px; font-weight:700; color:var(--danger);">${fmt(c.debt)}</div>
            </div>
            <div>
              <div class="text-xs text-muted">Лимит</div>
              <div style="font-size:15px; font-weight:600;">${fmt(c.limit)}</div>
            </div>
            <div>
              <div class="text-xs text-muted">Мин. платёж</div>
              <div style="font-size:15px; font-weight:600;">${fmt(c.min_payment)}</div>
            </div>
          </div>
          <div class="progress-bar">
            <div class="progress-fill ${usedPct > 80 ? 'danger' : usedPct > 50 ? 'warning' : ''}" style="width:${usedPct}%"></div>
          </div>
          <div style="display:flex; justify-content:space-between; margin-top:4px;">
            <span class="text-xs text-muted">Использовано ${usedPct}%</span>
            ${c.grace_period_end ? `<span class="text-xs text-muted">До ${formatDateRu(c.grace_period_end)}</span>` : ''}
          </div>
        </div>
      `;
    }).join('');

    return `
      ${list}
      <button class="btn btn-secondary btn-full" id="add-card-btn" style="margin-top:8px;">+ Добавить карту</button>
    `;
  }

  renderDebts(data) {
    const debts = data.debts || [];
    const method = localStorage.getItem('debt_method') || 'avalanche';

    const sorted = [...debts].sort((a, b) =>
      method === 'avalanche' ? (b.rate || 0) - (a.rate || 0) : (a.amount || 0) - (b.amount || 0)
    );

    if (!sorted.length) return `
      <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <div class="empty-state-title">Долгов нет</div>
        <div class="empty-state-text">Добавьте долги чтобы видеть стратегию погашения</div>
      </div>
      <button class="btn btn-primary btn-full" id="add-debt-btn">+ Добавить долг</button>
    `;

    const list = sorted.map((d, i) => `
      <div class="list-item">
        <div class="list-item-body">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <div class="list-item-title">${d.creditor}</div>
            ${i === 0 ? `<span class="badge badge-accent">Приоритет #1</span>` : `<span class="badge badge-muted">#${i+1}</span>`}
          </div>
          <div style="display:flex; gap:16px; flex-wrap:wrap;">
            <div><div class="text-xs text-muted">Долг</div><div style="font-weight:700; color:var(--danger);">${fmt(d.amount)}</div></div>
            <div><div class="text-xs text-muted">Ставка</div><div style="font-weight:600;">${d.rate || 0}%</div></div>
            <div><div class="text-xs text-muted">Платёж/мес</div><div style="font-weight:600;">${fmt(d.monthly_payment)}</div></div>
          </div>
          ${d.monthly_payment && d.amount ? `
            <div class="progress-bar" style="margin-top:8px;">
              <div class="progress-fill" style="width:${Math.min(100, Math.round(((d.initial_amount||d.amount) - d.amount) / (d.initial_amount||d.amount) * 100))}%"></div>
            </div>
          ` : ''}
        </div>
        <div style="display:flex; flex-direction:column; gap:4px;">
          <button class="btn btn-ghost btn-icon text-muted" data-edit-debt="${debts.indexOf(d)}">✏️</button>
          <button class="btn btn-ghost btn-icon text-muted" data-del-debt="${debts.indexOf(d)}">✕</button>
        </div>
      </div>
    `).join('');

    return `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <div class="text-sm text-secondary">Стратегия: <b>${method === 'avalanche' ? 'Лавина (высокий %)' : 'Снежный ком'}</b></div>
        <button class="btn btn-ghost btn-sm text-accent" id="toggle-method">Сменить</button>
      </div>
      ${list}
      <button class="btn btn-secondary btn-full" id="add-debt-btn" style="margin-top:8px;">+ Добавить долг</button>
    `;
  }

  renderPayments(data) {
    const cards = data.cards || [];
    const debts = data.debts || [];
    const today = new Date();
    const payments = [];

    cards.forEach(c => {
      if (c.grace_period_end) {
        payments.push({ name: c.bank, date: c.grace_period_end, amount: c.debt, type: 'card' });
      }
    });

    for (let i = 0; i < 2; i++) {
      debts.forEach(d => {
        if (d.payment_day) {
          const payDate = new Date(today.getFullYear(), today.getMonth() + i, d.payment_day);
          if (payDate >= today) {
            payments.push({ name: d.creditor, date: payDate.toISOString().split('T')[0], amount: d.monthly_payment, type: 'debt' });
          }
        }
      });
    }

    payments.sort((a, b) => new Date(a.date) - new Date(b.date));
    const upcoming = payments.filter(p => daysUntil(p.date) <= 30 && daysUntil(p.date) >= -1);

    if (!upcoming.length) return `
      <div class="empty-state">
        <div class="empty-state-icon">📅</div>
        <div class="empty-state-title">Нет платежей</div>
        <div class="empty-state-text">Добавьте карты и долги чтобы видеть календарь платежей</div>
      </div>
    `;

    const notifGranted = getNotificationPermission() === 'granted';

    return upcoming.map(p => {
      const days = daysUntil(p.date);
      const dotClass = days <= 3 ? 'red' : days <= 7 ? 'yellow' : 'green';
      const label = days < 0 ? 'просрочен' : days === 0 ? 'сегодня' : `через ${days} дн.`;
      const willNotify = notifGranted && days !== null && days >= 0 && days <= 3;
      return `
        <div class="payment-item">
          <div class="payment-dot ${dotClass}"></div>
          <div style="flex:1; margin-left:10px;">
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="font-weight:600; font-size:14px;">${p.name}</span>
              ${willNotify ? `<span title="Уведомление придёт" style="font-size:13px;">🔔</span>` : ''}
            </div>
            <div class="text-xs text-muted">${formatDateRu(p.date)} · ${label}</div>
          </div>
          <div style="font-weight:700; color:var(--danger);">${fmt(p.amount)}</div>
        </div>
      `;
    }).join('');
  }

  renderForecast(data) {
    const income = data.monthly_income || 0;
    const expenses = (data.monthly_expenses || []).reduce((s, e) => s + (e.amount || 0), 0);
    const cards = data.cards || [];
    const debts = data.debts || [];
    const accounts = data.accounts || [];
    const salaryDay = data.salary_day || null;

    // daily limit widget
    const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);
    let daysToSalary = null;
    let dailyLimit = null;
    if (salaryDay) {
      const today = new Date();
      const todayNum = today.getDate();
      let salaryDate = new Date(today.getFullYear(), today.getMonth(), salaryDay);
      if (salaryDate <= today) salaryDate = new Date(today.getFullYear(), today.getMonth() + 1, salaryDay);
      daysToSalary = Math.ceil((salaryDate - today) / 86400000);
      if (daysToSalary > 0) dailyLimit = Math.floor(totalBalance / daysToSalary);
    }

    const minPayments = cards.reduce((s, c) => s + (c.min_payment || 0), 0)
      + debts.reduce((s, d) => s + (d.monthly_payment || 0), 0);

    const cashflow = income - expenses;
    const afterMinPayments = cashflow - minPayments;

    const urgentCard = cards.filter(c => c.grace_period_end).sort((a,b) => new Date(a.grace_period_end)-new Date(b.grace_period_end))[0];
    const urgentDays = urgentCard ? daysUntil(urgentCard.grace_period_end) : null;
    const needToEarn = urgentCard ? Math.max(0, urgentCard.debt - cashflow) : 0;

    const debtFreeEstimates = debts.map(d => {
      if (!d.monthly_payment || d.monthly_payment <= 0) return null;
      const months = Math.ceil(d.amount / d.monthly_payment);
      const date = new Date();
      date.setMonth(date.getMonth() + months);
      return { name: d.creditor, months, date: date.toLocaleDateString('ru', { month: 'long', year: 'numeric' }) };
    }).filter(Boolean);

    return `
      <div class="card" style="margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div class="card-title">📅 Сколько тратить в день</div>
          <button class="btn btn-ghost btn-sm text-accent" id="set-salary-day-btn">${salaryDay ? `${salaryDay}-е` : 'Задать зарплату'}</button>
        </div>
        ${salaryDay && accounts.length > 0 ? `
          <div style="margin-top:10px; text-align:center;">
            <div style="font-size:32px; font-weight:800; color:${dailyLimit > 0 ? 'var(--success)' : 'var(--danger)'};">${dailyLimit !== null ? fmt(dailyLimit) : '—'}</div>
            <div class="text-xs text-muted" style="margin-top:4px;">в день · до зарплаты ${daysToSalary} дн.</div>
          </div>
          <div style="display:flex; justify-content:space-between; margin-top:10px;">
            <span class="text-secondary text-sm">На счетах</span>
            <span style="font-weight:700;">${fmt(totalBalance)}</span>
          </div>
        ` : `
          <div class="text-xs text-muted" style="margin-top:8px;">${!salaryDay ? 'Укажите день получения зарплаты' : 'Добавьте счета в хедере страницы'}</div>
        `}
      </div>

      <div class="card" style="margin-bottom:12px;">
        <div class="card-title">📊 Денежный поток</div>
        <div style="margin-top:10px; display:flex; flex-direction:column; gap:8px;">
          <div style="display:flex; justify-content:space-between;"><span class="text-secondary">Доход</span><span style="color:var(--success); font-weight:700;">${fmt(income)}</span></div>
          <div style="display:flex; justify-content:space-between;"><span class="text-secondary">Расходы</span><span style="color:var(--danger); font-weight:700;">${fmt(expenses)}</span></div>
          <div class="divider" style="margin:4px 0;"></div>
          <div style="display:flex; justify-content:space-between;"><span class="text-secondary">Свободные деньги</span><span style="color:${cashflow>=0?'var(--success)':'var(--danger)'}; font-weight:800; font-size:18px;">${fmt(cashflow)}</span></div>
          <div style="display:flex; justify-content:space-between;"><span class="text-secondary">После мин. платежей</span><span style="color:${afterMinPayments>=0?'var(--success)':'var(--danger)'}; font-weight:700;">${fmt(afterMinPayments)}</span></div>
        </div>
      </div>

      ${urgentCard ? `
      <div class="card warning-card" style="margin-bottom:12px;">
        <div class="card-title">⚡ Срочно</div>
        <div style="margin-top:8px;">
          <div style="font-size:15px; font-weight:600;">Сегодня главный приоритет — закрыть карту ${urgentCard.bank} ${urgentDays !== null ? `до ${formatDateRu(urgentCard.grace_period_end)}` : ''}</div>
          ${needToEarn > 0 ? `<div class="text-secondary text-sm mt-8">Нужно дополнительно заработать: <b style="color:var(--warning);">${fmt(needToEarn)}</b></div>` : `<div class="text-secondary text-sm mt-8" style="color:var(--success);">Денег достаточно ✓</div>`}
        </div>
      </div>
      ` : ''}

      ${debtFreeEstimates.length > 0 ? `
      <div class="card" style="margin-bottom:12px;">
        <div class="card-title">🎯 Дата свободы от долга</div>
        <div style="margin-top:10px; display:flex; flex-direction:column; gap:8px;">
          ${debtFreeEstimates.map(d => `
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span class="text-secondary" style="font-size:14px;">${d.name}</span>
              <div style="text-align:right;">
                <div style="font-weight:600; font-size:14px;">${d.date}</div>
                <div class="text-xs text-muted">${d.months} мес.</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}

      <button class="btn btn-secondary btn-full" id="add-expense-btn">+ Добавить расход</button>
    `;
  }

  renderAnalytics(data) {
    const cards = data.cards || [];
    const debts = data.debts || [];
    const assets = data.assets || [];
    const liabilities = data.liabilities || [];
    const expenses = data.monthly_expenses || [];
    const income = data.monthly_income || 0;

    const allDebts = [
      ...cards.map(c => ({ name: c.bank, amount: c.debt || 0 })),
      ...debts.map(d => ({ name: d.creditor, amount: d.amount || 0 }))
    ].filter(d => d.amount > 0);

    const totalDebt = allDebts.reduce((s, d) => s + d.amount, 0);
    const totalAssets = assets.reduce((s, a) => s + (a.value || 0), 0);
    const totalLiabilities = liabilities.reduce((s, l) => s + (l.amount || 0), 0);
    const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const capital = totalAssets - totalLiabilities - totalDebt;

    const colors = ['#6366F1','#22C55E','#F59E0B','#EF4444','#8B5CF6','#EC4899','#14B8A6'];

    let pieHtml = '';
    if (allDebts.length > 0) {
      let rotation = 0;
      const segments = allDebts.map((d, i) => {
        const pct = (d.amount / totalDebt) * 100;
        const deg = (pct / 100) * 360;
        const s = `conic-gradient(${colors[i % colors.length]} ${rotation}deg ${rotation+deg}deg, transparent ${rotation+deg}deg)`;
        rotation += deg;
        return { ...d, pct: Math.round(pct), color: colors[i % colors.length], s };
      });

      const gradStops = allDebts.map((d, i) => {
        const pct = (d.amount / totalDebt) * 360;
        return pct;
      });
      let cumulative = 0;
      const stops = allDebts.map((d, i) => {
        const deg = (d.amount / totalDebt) * 360;
        const s = `${colors[i % colors.length]} ${cumulative}deg ${cumulative + deg}deg`;
        cumulative += deg;
        return s;
      });

      pieHtml = `
        <div style="display:flex; flex-direction:column; align-items:center; margin-bottom:16px;">
          <div style="width:120px; height:120px; border-radius:50%; background: conic-gradient(${stops.join(',')}); margin-bottom:16px;"></div>
          <div style="display:flex; flex-direction:column; gap:6px; width:100%;">
            ${segments.map(s => `
              <div style="display:flex; align-items:center; justify-content:space-between;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <div style="width:12px; height:12px; border-radius:50%; background:${s.color}; flex-shrink:0;"></div>
                  <span class="text-sm">${s.name}</span>
                </div>
                <div style="text-align:right;">
                  <span style="font-weight:700; font-size:14px;">${fmt(s.amount)}</span>
                  <span class="text-xs text-muted" style="margin-left:6px;">${s.pct}%</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    return `
      <div class="card" style="margin-bottom:12px;">
        <div class="card-title">📊 Капитал</div>
        <div style="margin-top:10px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
            <span class="text-secondary">Активы</span>
            <span style="color:var(--success); font-weight:700;">${fmt(totalAssets)}</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
            <span class="text-secondary">Обязательства</span>
            <span style="color:var(--danger); font-weight:700;">${fmt(totalLiabilities + totalDebt)}</span>
          </div>
          <div class="divider" style="margin:8px 0;"></div>
          <div style="display:flex; justify-content:space-between;">
            <span style="font-weight:600;">Чистый капитал</span>
            <span style="font-weight:800; font-size:18px; color:${capital>=0?'var(--success)':'var(--danger)'};">${fmt(capital)}</span>
          </div>
        </div>
      </div>

      ${allDebts.length > 0 ? `
      <div class="card" style="margin-bottom:12px;">
        <div class="card-title">Долги по кредиторам</div>
        <div style="margin-top:12px;">
          ${pieHtml}
          ${allDebts.map(d => `
            <div style="margin-bottom:10px;">
              <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                <span class="text-sm">${d.name}</span>
                <span class="text-sm font-bold">${fmt(d.amount)}</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill danger" style="width:${Math.round((d.amount/totalDebt)*100)}%"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      ` : '<div class="empty-state"><div class="empty-state-icon">📈</div><div class="empty-state-title">Нет данных для аналитики</div></div>'}

      ${expenses.length > 0 ? `
      <div class="card" style="margin-bottom:12px;">
        <div class="card-title">💸 Расходы по статьям</div>
        <div style="margin-top:12px;">
          ${expenses.map(e => {
            const pct = totalExpenses > 0 ? Math.round((e.amount / totalExpenses) * 100) : 0;
            return `
              <div style="margin-bottom:10px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                  <span class="text-sm">${e.name}</span>
                  <span class="text-xs text-muted">${fmt(e.amount)} · ${pct}%</span>
                </div>
                <div class="progress-bar" style="margin-top:0;">
                  <div class="progress-fill warning" style="width:${pct}%"></div>
                </div>
              </div>
            `;
          }).join('')}
          <div class="divider" style="margin:8px 0;"></div>
          <div style="display:flex; justify-content:space-between;">
            <span class="text-secondary">Всего расходов</span>
            <span style="font-weight:700; color:var(--danger);">${fmt(totalExpenses)}</span>
          </div>
          ${income > 0 ? `
          <div style="display:flex; justify-content:space-between; margin-top:6px;">
            <span class="text-secondary">% от дохода</span>
            <span style="font-weight:700; color:${totalExpenses/income > 0.8 ? 'var(--danger)' : totalExpenses/income > 0.6 ? 'var(--warning)' : 'var(--success)'};">
              ${Math.round((totalExpenses/income)*100)}%
            </span>
          </div>
          ` : ''}
        </div>
      </div>
      ` : ''}

      <button class="btn btn-secondary btn-full" id="add-asset-btn" style="margin-top:4px;">+ Добавить актив</button>
      <button class="btn btn-secondary btn-full" id="add-liability-btn" style="margin-top:8px;">+ Добавить обязательство</button>
    `;
  }

  bindTabEvents(data) {
    const tc = this.el.querySelector('#tab-content');
    if (!tc) return;

    // journal
    // budget
    tc.querySelectorAll('[data-set-budget]').forEach(btn => {
      btn.addEventListener('click', () => this.setBudget(btn.dataset.setBudget));
    });

    // salary day
    tc.querySelector('#set-salary-day-btn')?.addEventListener('click', () => this.setSalaryDay());

    // journal
    tc.querySelector('#add-expense-tx-btn')?.addEventListener('click', () => this.addTransaction('expense'));
    tc.querySelector('#add-income-tx-btn')?.addEventListener('click', () => this.addTransaction('income'));
    tc.querySelector('#journal-prev')?.addEventListener('click', () => {
      const [y, m] = this.journalMonth.split('-').map(Number);
      this.journalMonth = new Date(y, m - 2, 1).toISOString().slice(0, 7);
      tc.innerHTML = this.renderJournal(store.get('finance') || {});
      this.bindTabEvents(store.get('finance') || {});
    });
    tc.querySelector('#journal-next')?.addEventListener('click', () => {
      const [y, m] = this.journalMonth.split('-').map(Number);
      const next = new Date(y, m, 1).toISOString().slice(0, 7);
      if (next <= new Date().toISOString().slice(0, 7)) {
        this.journalMonth = next;
        tc.innerHTML = this.renderJournal(store.get('finance') || {});
        this.bindTabEvents(store.get('finance') || {});
      }
    });
    tc.querySelectorAll('[data-edit-tx]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = Number(btn.dataset.editTx);
        const txs = store.get('finance.transactions') || [];
        const tx = txs.find(t => t.id === id);
        if (tx) this.editTransaction(tx);
      });
    });

    tc.querySelectorAll('[data-del-tx]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = Number(btn.dataset.delTx);
        const txs = store.get('finance.transactions') || [];
        store.set('finance.transactions', txs.filter(t => t.id !== id));
        tc.innerHTML = this.renderJournal(store.get('finance') || {});
        this.bindTabEvents(store.get('finance') || {});
        toast('Удалено');
      });
    });

    tc.querySelector('#add-card-btn')?.addEventListener('click', () => this.addCard());
    tc.querySelector('#add-debt-btn')?.addEventListener('click', () => this.addDebt());
    tc.querySelector('#add-expense-btn')?.addEventListener('click', () => this.addExpense());
    tc.querySelector('#add-asset-btn')?.addEventListener('click', () => this.addAsset());
    tc.querySelector('#add-liability-btn')?.addEventListener('click', () => this.addLiability());
    tc.querySelector('#toggle-method')?.addEventListener('click', () => {
      const current = localStorage.getItem('debt_method') || 'avalanche';
      localStorage.setItem('debt_method', current === 'avalanche' ? 'snowball' : 'avalanche');
      this.el.querySelector('#tab-content').innerHTML = this.renderDebts(store.get('finance') || {});
      this.bindTabEvents(store.get('finance') || {});
    });

    tc.querySelectorAll('[data-edit-card]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.editCard);
        const cards = store.get('finance.cards') || [];
        if (cards[idx]) this.editCard(idx, cards[idx]);
      });
    });

    tc.querySelectorAll('[data-edit-debt]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.editDebt);
        const debts = store.get('finance.debts') || [];
        if (debts[idx]) this.editDebt(idx, debts[idx]);
      });
    });

    tc.querySelectorAll('[data-del-card]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.delCard);
        const cards = store.get('finance.cards') || [];
        cards.splice(idx, 1);
        store.set('finance.cards', cards);
        this.draw();
        toast('Карта удалена');
      });
    });

    tc.querySelectorAll('[data-del-debt]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.delDebt);
        const debts = store.get('finance.debts') || [];
        debts.splice(idx, 1);
        store.set('finance.debts', debts);
        this.draw();
        toast('Долг удалён');
      });
    });
  }

  addTransaction(type) {
    const cats = type === 'income' ? INC_CATEGORIES : TX_CATEGORIES;
    const title = type === 'income' ? '➕ Доход' : '➖ Расход';
    const body = document.createElement('div');
    body.innerHTML = `
      <div class="input-group">
        <label class="input-label">Сумма (₽)</label>
        <input class="input" id="tx-amount" type="number" inputmode="numeric" placeholder="1500" autofocus>
      </div>
      <div class="input-group">
        <label class="input-label">Категория</label>
        <div id="tx-cats" style="display:flex; flex-wrap:wrap; gap:6px; margin-top:4px;">
          ${cats.map((c, i) => `
            <button type="button" class="cat-btn ${i===0?'selected':''}" data-cat="${c.id}"
              style="display:flex; align-items:center; gap:4px; padding:6px 10px; border-radius:20px; border:1.5px solid ${i===0?'var(--accent)':'var(--border)'}; background:${i===0?'var(--accent-glow)':'var(--surface-2)'}; font-size:13px; cursor:pointer; color:var(--text-primary);">
              ${c.emoji} ${c.label}
            </button>
          `).join('')}
        </div>
      </div>
      <div class="input-group">
        <label class="input-label">Комментарий (необязательно)</label>
        <input class="input" id="tx-comment" type="text" placeholder="Кофе, аренда...">
      </div>
      <div class="input-group">
        <label class="input-label">Дата</label>
        <input class="input" id="tx-date" type="date" value="${getTodayStr()}">
      </div>
    `;

    let selectedCat = cats[0].id;
    body.querySelectorAll('.cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedCat = btn.dataset.cat;
        body.querySelectorAll('.cat-btn').forEach(b => {
          b.style.border = '1.5px solid var(--border)';
          b.style.background = 'var(--surface-2)';
        });
        btn.style.border = '1.5px solid var(--accent)';
        btn.style.background = 'var(--accent-glow)';
      });
    });

    openModal({
      title,
      content: body,
      actions: [
        { label: 'Сохранить', cls: 'btn-primary', onClick: (m) => {
          const amount = parseFloat(m.querySelector('#tx-amount').value);
          if (!amount || amount <= 0) return;
          const tx = {
            id: Date.now(),
            date: m.querySelector('#tx-date').value || getTodayStr(),
            amount,
            type,
            category: selectedCat,
            comment: m.querySelector('#tx-comment').value.trim()
          };
          store.update('finance.transactions', arr => [...(arr||[]), tx]);
          this.activeTab = 'journal';
          this.draw();
          closeModal();
          toast(type === 'income' ? 'Доход добавлен ✓' : 'Расход добавлен ✓');
        }},
        { label: 'Отмена', cls: 'btn-secondary', onClick: () => closeModal() }
      ]
    });
    setTimeout(() => body.querySelector('#tx-amount')?.focus(), 100);
  }

  editTransaction(tx) {
    const cats = tx.type === 'income' ? INC_CATEGORIES : TX_CATEGORIES;
    const title = tx.type === 'income' ? '✏️ Редактировать доход' : '✏️ Редактировать расход';
    const body = document.createElement('div');
    body.innerHTML = `
      <div class="input-group">
        <label class="input-label">Сумма (₽)</label>
        <input class="input" id="tx-amount" type="number" inputmode="numeric" value="${tx.amount}">
      </div>
      <div class="input-group">
        <label class="input-label">Категория</label>
        <div id="tx-cats" style="display:flex; flex-wrap:wrap; gap:6px; margin-top:4px;">
          ${cats.map(c => {
            const sel = c.id === tx.category;
            return `<button type="button" class="cat-btn ${sel?'selected':''}" data-cat="${c.id}"
              style="display:flex; align-items:center; gap:4px; padding:6px 10px; border-radius:20px; border:1.5px solid ${sel?'var(--accent)':'var(--border)'}; background:${sel?'var(--accent-glow)':'var(--surface-2)'}; font-size:13px; cursor:pointer; color:var(--text-primary);">
              ${c.emoji} ${c.label}
            </button>`;
          }).join('')}
        </div>
      </div>
      <div class="input-group">
        <label class="input-label">Комментарий</label>
        <input class="input" id="tx-comment" type="text" value="${tx.comment || ''}" placeholder="Кофе, аренда...">
      </div>
      <div class="input-group">
        <label class="input-label">Дата</label>
        <input class="input" id="tx-date" type="date" value="${tx.date}">
      </div>
    `;

    let selectedCat = tx.category;
    body.querySelectorAll('.cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedCat = btn.dataset.cat;
        body.querySelectorAll('.cat-btn').forEach(b => {
          b.style.border = '1.5px solid var(--border)';
          b.style.background = 'var(--surface-2)';
        });
        btn.style.border = '1.5px solid var(--accent)';
        btn.style.background = 'var(--accent-glow)';
      });
    });

    openModal({
      title,
      content: body,
      actions: [
        { label: 'Сохранить', cls: 'btn-primary', onClick: (m) => {
          const amount = parseFloat(m.querySelector('#tx-amount').value);
          if (!amount || amount <= 0) return;
          const txs = store.get('finance.transactions') || [];
          const idx = txs.findIndex(t => t.id === tx.id);
          if (idx !== -1) {
            txs[idx] = {
              ...txs[idx],
              amount,
              category: selectedCat,
              comment: m.querySelector('#tx-comment').value.trim(),
              date: m.querySelector('#tx-date').value || tx.date
            };
            store.set('finance.transactions', txs);
          }
          this.draw();
          closeModal();
          toast('Транзакция обновлена ✓');
        }},
        { label: 'Отмена', cls: 'btn-secondary', onClick: () => closeModal() }
      ]
    });
  }

  editCard(idx, card) {
    const body = document.createElement('div');
    body.innerHTML = `
      <div class="input-group"><label class="input-label">Банк</label><input class="input" id="c-bank" value="${card.bank || ''}"></div>
      <div class="input-group"><label class="input-label">Лимит (₽)</label><input class="input" id="c-limit" type="number" value="${card.limit || ''}"></div>
      <div class="input-group"><label class="input-label">Текущий долг (₽)</label><input class="input" id="c-debt" type="number" value="${card.debt || ''}"></div>
      <div class="input-group"><label class="input-label">Конец льготного периода</label><input class="input" id="c-grace" type="date" value="${card.grace_period_end || ''}"></div>
      <div class="input-group"><label class="input-label">Минимальный платёж (₽)</label><input class="input" id="c-min" type="number" value="${card.min_payment || ''}"></div>
    `;
    openModal({
      title: '✏️ Редактировать карту',
      content: body,
      actions: [
        { label: 'Сохранить', cls: 'btn-primary', onClick: (m) => {
          const bank = m.querySelector('#c-bank').value.trim();
          if (!bank) return;
          const cards = store.get('finance.cards') || [];
          cards[idx] = {
            ...cards[idx],
            bank,
            limit: parseFloat(m.querySelector('#c-limit').value) || 0,
            debt: parseFloat(m.querySelector('#c-debt').value) || 0,
            grace_period_end: m.querySelector('#c-grace').value,
            min_payment: parseFloat(m.querySelector('#c-min').value) || 0
          };
          store.set('finance.cards', cards);
          this.draw();
          closeModal();
          toast('Карта обновлена ✓');
        }},
        { label: 'Отмена', cls: 'btn-secondary', onClick: () => closeModal() }
      ]
    });
  }

  editDebt(idx, debt) {
    const body = document.createElement('div');
    body.innerHTML = `
      <div class="input-group"><label class="input-label">Кредитор</label><input class="input" id="d-cred" value="${debt.creditor || ''}"></div>
      <div class="input-group"><label class="input-label">Текущая сумма (₽)</label><input class="input" id="d-amount" type="number" value="${debt.amount || ''}"></div>
      <div class="input-group"><label class="input-label">Ставка (%)</label><input class="input" id="d-rate" type="number" step="0.1" value="${debt.rate || ''}"></div>
      <div class="input-group"><label class="input-label">Ежемесячный платёж (₽)</label><input class="input" id="d-payment" type="number" value="${debt.monthly_payment || ''}"></div>
      <div class="input-group"><label class="input-label">День платежа (1–28)</label><input class="input" id="d-day" type="number" min="1" max="28" value="${debt.payment_day || ''}"></div>
    `;
    openModal({
      title: '✏️ Редактировать долг',
      content: body,
      actions: [
        { label: 'Сохранить', cls: 'btn-primary', onClick: (m) => {
          const creditor = m.querySelector('#d-cred').value.trim();
          if (!creditor) return;
          const debts = store.get('finance.debts') || [];
          debts[idx] = {
            ...debts[idx],
            creditor,
            amount: parseFloat(m.querySelector('#d-amount').value) || 0,
            rate: parseFloat(m.querySelector('#d-rate').value) || 0,
            monthly_payment: parseFloat(m.querySelector('#d-payment').value) || 0,
            payment_day: parseInt(m.querySelector('#d-day').value) || null
          };
          store.set('finance.debts', debts);
          this.draw();
          closeModal();
          toast('Долг обновлён ✓');
        }},
        { label: 'Отмена', cls: 'btn-secondary', onClick: () => closeModal() }
      ]
    });
  }

  addAccount() {
    const icons = ['💵','🏦','💳','📱','💰','🪙'];
    const body = document.createElement('div');
    body.innerHTML = `
      <div class="input-group">
        <label class="input-label">Название</label>
        <input class="input" id="acc-name" placeholder="Наличные / Т-Банк / Сбер">
      </div>
      <div class="input-group">
        <label class="input-label">Остаток (₽)</label>
        <input class="input" id="acc-balance" type="number" inputmode="numeric" placeholder="10000">
      </div>
      <div class="input-group">
        <label class="input-label">Иконка</label>
        <div style="display:flex; gap:8px; margin-top:4px;">
          ${icons.map((ic, i) => `
            <button type="button" class="acc-icon-btn ${i===0?'selected':''}" data-icon="${ic}"
              style="font-size:22px; width:40px; height:40px; border-radius:10px; border:2px solid ${i===0?'var(--accent)':'var(--border)'}; background:var(--surface-2); cursor:pointer;">
              ${ic}
            </button>
          `).join('')}
        </div>
      </div>
    `;
    let selectedIcon = icons[0];
    body.querySelectorAll('.acc-icon-btn').forEach(b => {
      b.addEventListener('click', () => {
        selectedIcon = b.dataset.icon;
        body.querySelectorAll('.acc-icon-btn').forEach(x => x.style.border = '2px solid var(--border)');
        b.style.border = '2px solid var(--accent)';
      });
    });
    openModal({
      title: '🏦 Новый счёт',
      content: body,
      actions: [
        { label: 'Добавить', cls: 'btn-primary', onClick: (m) => {
          const name = m.querySelector('#acc-name').value.trim();
          if (!name) return;
          const acc = { id: Date.now(), name, balance: parseFloat(m.querySelector('#acc-balance').value) || 0, icon: selectedIcon };
          store.update('finance.accounts', arr => [...(arr||[]), acc]);
          this.draw();
          closeModal();
          toast('Счёт добавлен ✓');
        }},
        { label: 'Отмена', cls: 'btn-secondary', onClick: () => closeModal() }
      ]
    });
  }

  editAccount(acc) {
    const icons = ['💵','🏦','💳','📱','💰','🪙'];
    const body = document.createElement('div');
    body.innerHTML = `
      <div class="input-group">
        <label class="input-label">Название</label>
        <input class="input" id="acc-name" value="${acc.name}">
      </div>
      <div class="input-group">
        <label class="input-label">Остаток (₽)</label>
        <input class="input" id="acc-balance" type="number" inputmode="numeric" value="${acc.balance || 0}">
      </div>
      <div class="input-group">
        <label class="input-label">Иконка</label>
        <div style="display:flex; gap:8px; margin-top:4px;">
          ${icons.map(ic => `
            <button type="button" class="acc-icon-btn" data-icon="${ic}"
              style="font-size:22px; width:40px; height:40px; border-radius:10px; border:2px solid ${ic===acc.icon?'var(--accent)':'var(--border)'}; background:var(--surface-2); cursor:pointer;">
              ${ic}
            </button>
          `).join('')}
        </div>
      </div>
    `;
    let selectedIcon = acc.icon || icons[0];
    body.querySelectorAll('.acc-icon-btn').forEach(b => {
      b.addEventListener('click', () => {
        selectedIcon = b.dataset.icon;
        body.querySelectorAll('.acc-icon-btn').forEach(x => x.style.border = '2px solid var(--border)');
        b.style.border = '2px solid var(--accent)';
      });
    });
    openModal({
      title: '✏️ Редактировать счёт',
      content: body,
      actions: [
        { label: 'Сохранить', cls: 'btn-primary', onClick: (m) => {
          const name = m.querySelector('#acc-name').value.trim();
          if (!name) return;
          const accounts = store.get('finance.accounts') || [];
          const idx = accounts.findIndex(a => a.id === acc.id);
          if (idx !== -1) {
            accounts[idx] = { ...accounts[idx], name, balance: parseFloat(m.querySelector('#acc-balance').value) || 0, icon: selectedIcon };
            store.set('finance.accounts', accounts);
          }
          this.draw();
          closeModal();
          toast('Счёт обновлён ✓');
        }},
        { label: 'Удалить', cls: 'btn-secondary', onClick: () => {
          const accounts = store.get('finance.accounts') || [];
          store.set('finance.accounts', accounts.filter(a => a.id !== acc.id));
          this.draw();
          closeModal();
          toast('Счёт удалён');
        }},
        { label: 'Отмена', cls: 'btn-ghost', onClick: () => closeModal() }
      ]
    });
  }

  setBudget(catId) {
    const cat = TX_CATEGORIES.find(c => c.id === catId);
    const current = (store.get('finance.budgets') || {})[catId] || '';
    const body = document.createElement('div');
    body.innerHTML = `
      <div style="text-align:center; font-size:32px; margin-bottom:8px;">${cat?.emoji}</div>
      <div class="input-group">
        <label class="input-label">Лимит на месяц (₽)</label>
        <input class="input" id="budget-input" type="number" inputmode="numeric" value="${current}" placeholder="15000">
      </div>
      <div class="text-xs text-muted" style="text-align:center;">Оставьте 0 чтобы убрать лимит</div>
    `;
    openModal({
      title: `Бюджет: ${cat?.label}`,
      content: body,
      actions: [
        { label: 'Сохранить', cls: 'btn-primary', onClick: (m) => {
          const val = parseFloat(m.querySelector('#budget-input').value) || 0;
          const budgets = store.get('finance.budgets') || {};
          if (val > 0) budgets[catId] = val; else delete budgets[catId];
          store.set('finance.budgets', budgets);
          const tc = this.el.querySelector('#tab-content');
          tc.innerHTML = this.renderBudget(store.get('finance') || {});
          this.bindTabEvents(store.get('finance') || {});
          closeModal();
          toast(val > 0 ? 'Лимит установлен ✓' : 'Лимит убран');
        }},
        { label: 'Отмена', cls: 'btn-secondary', onClick: () => closeModal() }
      ]
    });
    setTimeout(() => body.querySelector('#budget-input')?.focus(), 100);
  }

  setSalaryDay() {
    const current = store.get('finance.salary_day') || '';
    const body = document.createElement('div');
    body.innerHTML = `
      <div class="input-group">
        <label class="input-label">День получения зарплаты</label>
        <input class="input" id="salary-day-input" type="number" inputmode="numeric" min="1" max="28" value="${current}" placeholder="15">
      </div>
      <div class="text-xs text-muted">Число месяца (1–28). Используется для расчёта дневного лимита.</div>
    `;
    openModal({
      title: '📅 День зарплаты',
      content: body,
      actions: [
        { label: 'Сохранить', cls: 'btn-primary', onClick: (m) => {
          const val = parseInt(m.querySelector('#salary-day-input').value);
          if (val >= 1 && val <= 28) {
            store.set('finance.salary_day', val);
            const tc = this.el.querySelector('#tab-content');
            tc.innerHTML = this.renderForecast(store.get('finance') || {});
            this.bindTabEvents(store.get('finance') || {});
            closeModal();
            toast('День зарплаты сохранён ✓');
          }
        }},
        { label: 'Отмена', cls: 'btn-secondary', onClick: () => closeModal() }
      ]
    });
    setTimeout(() => body.querySelector('#salary-day-input')?.focus(), 100);
  }

  editIncome() {
    const income = store.get('finance.monthly_income') || 0;
    const body = document.createElement('div');
    body.innerHTML = `
      <div class="input-group">
        <label class="input-label">Месячный доход (₽)</label>
        <input class="input" id="income-input" type="number" value="${income}" placeholder="100000">
      </div>
    `;
    openModal({
      title: 'Месячный доход',
      content: body,
      actions: [
        { label: 'Сохранить', cls: 'btn-primary', onClick: (m) => {
          const val = parseFloat(m.querySelector('#income-input').value) || 0;
          store.set('finance.monthly_income', val);
          this.draw();
          closeModal();
          toast('Доход обновлён ✓');
        }},
        { label: 'Отмена', cls: 'btn-secondary', onClick: () => closeModal() }
      ]
    });
  }

  addCard() {
    const body = document.createElement('div');
    body.innerHTML = `
      <div class="input-group"><label class="input-label">Банк</label><input class="input" id="c-bank" placeholder="Т-Банк"></div>
      <div class="input-group"><label class="input-label">Лимит (₽)</label><input class="input" id="c-limit" type="number" placeholder="100000"></div>
      <div class="input-group"><label class="input-label">Текущий долг (₽)</label><input class="input" id="c-debt" type="number" placeholder="50000"></div>
      <div class="input-group"><label class="input-label">Конец льготного периода</label><input class="input" id="c-grace" type="date"></div>
      <div class="input-group"><label class="input-label">Минимальный платёж (₽)</label><input class="input" id="c-min" type="number" placeholder="2500"></div>
    `;
    openModal({
      title: 'Новая карта',
      content: body,
      actions: [
        { label: 'Добавить', cls: 'btn-primary', onClick: (m) => {
          const card = {
            bank: m.querySelector('#c-bank').value.trim(),
            limit: parseFloat(m.querySelector('#c-limit').value) || 0,
            debt: parseFloat(m.querySelector('#c-debt').value) || 0,
            grace_period_end: m.querySelector('#c-grace').value,
            min_payment: parseFloat(m.querySelector('#c-min').value) || 0
          };
          if (!card.bank) return;
          store.update('finance.cards', arr => [...(arr||[]), card]);
          this.draw();
          closeModal();
          toast('Карта добавлена ✓');
        }},
        { label: 'Отмена', cls: 'btn-secondary', onClick: () => closeModal() }
      ]
    });
  }

  addDebt() {
    const body = document.createElement('div');
    body.innerHTML = `
      <div class="input-group"><label class="input-label">Кредитор</label><input class="input" id="d-cred" placeholder="Банк / человек"></div>
      <div class="input-group"><label class="input-label">Сумма (₽)</label><input class="input" id="d-amount" type="number" placeholder="200000"></div>
      <div class="input-group"><label class="input-label">Ставка (%)</label><input class="input" id="d-rate" type="number" placeholder="19.9" step="0.1"></div>
      <div class="input-group"><label class="input-label">Ежемесячный платёж (₽)</label><input class="input" id="d-payment" type="number" placeholder="5000"></div>
      <div class="input-group"><label class="input-label">День платежа (1-28)</label><input class="input" id="d-day" type="number" min="1" max="28" placeholder="15"></div>
    `;
    openModal({
      title: 'Новый долг',
      content: body,
      actions: [
        { label: 'Добавить', cls: 'btn-primary', onClick: (m) => {
          const debt = {
            creditor: m.querySelector('#d-cred').value.trim(),
            amount: parseFloat(m.querySelector('#d-amount').value) || 0,
            initial_amount: parseFloat(m.querySelector('#d-amount').value) || 0,
            rate: parseFloat(m.querySelector('#d-rate').value) || 0,
            monthly_payment: parseFloat(m.querySelector('#d-payment').value) || 0,
            payment_day: parseInt(m.querySelector('#d-day').value) || null
          };
          if (!debt.creditor) return;
          store.update('finance.debts', arr => [...(arr||[]), debt]);
          this.draw();
          closeModal();
          toast('Долг добавлен ✓');
        }},
        { label: 'Отмена', cls: 'btn-secondary', onClick: () => closeModal() }
      ]
    });
  }

  addExpense() {
    const body = document.createElement('div');
    body.innerHTML = `
      <div class="input-group"><label class="input-label">Название</label><input class="input" id="e-name" placeholder="Аренда / еда / транспорт"></div>
      <div class="input-group"><label class="input-label">Сумма в месяц (₽)</label><input class="input" id="e-amount" type="number" placeholder="20000"></div>
    `;
    openModal({
      title: 'Регулярный расход',
      content: body,
      actions: [
        { label: 'Добавить', cls: 'btn-primary', onClick: (m) => {
          const exp = {
            name: m.querySelector('#e-name').value.trim(),
            amount: parseFloat(m.querySelector('#e-amount').value) || 0
          };
          if (!exp.name) return;
          store.update('finance.monthly_expenses', arr => [...(arr||[]), exp]);
          this.draw();
          closeModal();
          toast('Расход добавлен ✓');
        }},
        { label: 'Отмена', cls: 'btn-secondary', onClick: () => closeModal() }
      ]
    });
  }

  addAsset() {
    const body = document.createElement('div');
    body.innerHTML = `
      <div class="input-group"><label class="input-label">Актив</label><input class="input" id="a-name" placeholder="Автомобиль / депозит"></div>
      <div class="input-group"><label class="input-label">Стоимость (₽)</label><input class="input" id="a-value" type="number" placeholder="500000"></div>
    `;
    openModal({
      title: 'Новый актив',
      content: body,
      actions: [
        { label: 'Добавить', cls: 'btn-primary', onClick: (m) => {
          const asset = { name: m.querySelector('#a-name').value.trim(), value: parseFloat(m.querySelector('#a-value').value)||0 };
          if (!asset.name) return;
          store.update('finance.assets', arr => [...(arr||[]), asset]);
          this.draw();
          closeModal();
          toast('Актив добавлен ✓');
        }},
        { label: 'Отмена', cls: 'btn-secondary', onClick: () => closeModal() }
      ]
    });
  }

  addLiability() {
    const body = document.createElement('div');
    body.innerHTML = `
      <div class="input-group"><label class="input-label">Обязательство</label><input class="input" id="l-name" placeholder="Ипотека / рассрочка"></div>
      <div class="input-group"><label class="input-label">Сумма (₽)</label><input class="input" id="l-amount" type="number" placeholder="1000000"></div>
    `;
    openModal({
      title: 'Новое обязательство',
      content: body,
      actions: [
        { label: 'Добавить', cls: 'btn-primary', onClick: (m) => {
          const li = { name: m.querySelector('#l-name').value.trim(), amount: parseFloat(m.querySelector('#l-amount').value)||0 };
          if (!li.name) return;
          store.update('finance.liabilities', arr => [...(arr||[]), li]);
          this.draw();
          closeModal();
          toast('Обязательство добавлено ✓');
        }},
        { label: 'Отмена', cls: 'btn-secondary', onClick: () => closeModal() }
      ]
    });
  }
}
