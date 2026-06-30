import { store } from '../store.js';
import { toast } from '../components/Toast.js';
import { openModal, closeModal } from '../components/Modal.js';

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

export class FinancePage {
  constructor() { this.activeTab = 'cards'; }

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
    const assets = data.assets || [];
    const liabilities = data.liabilities || [];

    const totalCardDebt = cards.reduce((s, c) => s + (c.debt || 0), 0);
    const totalDebt = debts.reduce((s, d) => s + (d.amount || 0), 0);
    const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const totalAssets = assets.reduce((s, a) => s + (a.value || 0), 0);
    const totalLiabilities = liabilities.reduce((s, l) => s + (l.amount || 0), 0);
    const capital = totalAssets - totalLiabilities;
    const cashflow = income - totalExpenses;

    this.el.innerHTML = `
      <div class="page-title" style="margin-bottom:16px;">💰 Финансы</div>

      <div class="finance-summary">
        <div class="card-sub" style="margin-bottom:4px;">Общий долг</div>
        <div class="finance-total">${fmt(totalCardDebt + totalDebt)}</div>
        <div style="display:flex; gap:20px; margin-top:12px;">
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
        <button class="btn btn-ghost btn-sm text-accent" id="edit-income-btn" style="margin-top:8px;">✏️ Изменить доход</button>
      </div>

      <div class="tabs">
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

    this.bindTabEvents(data);
  }

  renderTab(data) {
    switch(this.activeTab) {
      case 'cards': return this.renderCards(data);
      case 'debts': return this.renderDebts(data);
      case 'payments': return this.renderPayments(data);
      case 'forecast': return this.renderForecast(data);
      case 'analytics': return this.renderAnalytics(data);
      default: return '';
    }
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
            <button class="btn btn-ghost btn-icon text-muted" data-del-card="${i}">✕</button>
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
        <button class="btn btn-ghost btn-icon text-muted" data-del-debt="${debts.indexOf(d)}">✕</button>
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

    return upcoming.map(p => {
      const days = daysUntil(p.date);
      const dotClass = days <= 3 ? 'red' : days <= 7 ? 'yellow' : 'green';
      const label = days < 0 ? 'просрочен' : days === 0 ? 'сегодня' : `через ${days} дн.`;
      return `
        <div class="payment-item">
          <div class="payment-dot ${dotClass}"></div>
          <div style="flex:1; margin-left:10px;">
            <div style="font-weight:600; font-size:14px;">${p.name}</div>
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
