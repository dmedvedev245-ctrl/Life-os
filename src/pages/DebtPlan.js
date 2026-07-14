import { store } from '../store.js';
import { toast } from '../components/Toast.js';
import { openModal, closeModal } from '../components/Modal.js';

function fmt(n) { return Math.round(Number(n || 0)).toLocaleString('ru') + ' ₽'; }

const MONTHS_SHORT = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];

function monthLabel(offset) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return `${MONTHS_SHORT[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`;
}

function getTodayStr() { return new Date().toISOString().split('T')[0]; }
function getMonthKey() { return new Date().toISOString().slice(0, 7); }

function buildItems(finance) {
  const cards = finance.cards || [];
  const debts = finance.debts || [];
  const items = [];
  cards.forEach((c, i) => {
    if (!c.debt) return;
    items.push({ key: `card-${i}`, source: 'card', idx: i, name: c.bank || 'Карта', balance: c.debt || 0, rate: c.rate || 0, min_payment: c.min_payment || 0 });
  });
  debts.forEach((d, i) => {
    if (!d.amount) return;
    items.push({ key: `debt-${i}`, source: 'debt', idx: i, name: d.creditor || 'Долг', balance: d.amount || 0, rate: d.rate || 0, min_payment: d.min_payment ?? d.monthly_payment ?? 0 });
  });
  return items;
}

function simulateAvalanche(items, budget) {
  const working = items.map(it => ({ ...it }));
  const schedule = [];
  const closedKeys = new Set();
  let totalInterest = 0;
  let freedomMonth = null;

  for (let month = 1; month <= 120; month++) {
    working.forEach(w => {
      if (w.balance > 0) {
        const interest = w.balance * (w.rate / 100 / 12);
        w.balance += interest;
        totalInterest += interest;
      }
    });

    let remaining = budget;
    const paid = {};

    working.forEach(w => {
      if (w.balance <= 0 || remaining <= 0) return;
      const pay = Math.min(w.min_payment, w.balance, remaining);
      if (pay > 0) { w.balance -= pay; remaining -= pay; paid[w.key] = (paid[w.key] || 0) + pay; }
    });

    const byRate = [...working].filter(w => w.balance > 0).sort((a, b) => b.rate - a.rate);
    for (const w of byRate) {
      if (remaining <= 0) break;
      const pay = Math.min(remaining, w.balance);
      if (pay > 0) { w.balance -= pay; remaining -= pay; paid[w.key] = (paid[w.key] || 0) + pay; }
    }

    const closedThisMonth = [];
    working.forEach(w => {
      if (w.balance <= 0.5 && !closedKeys.has(w.key)) { closedKeys.add(w.key); closedThisMonth.push(w.key); }
    });

    schedule.push({
      month,
      paid,
      totalBalance: working.reduce((s, w) => s + Math.max(0, w.balance), 0),
      closedThisMonth
    });

    if (working.every(w => w.balance <= 0.5)) { freedomMonth = month; break; }
  }

  return { schedule, totalInterest, freedomMonth };
}

export class DebtPlanPage {
  render() {
    const el = document.createElement('div');
    this.el = el;
    this.draw();
    return el;
  }

  draw() {
    const finance = store.get('finance') || {};
    const plan = store.get('debt_plan') || { budget: 0, payments: [] };
    const items = buildItems(finance);

    if (!items.length) {
      this.el.innerHTML = `
        <div class="page-title" style="margin-bottom:16px;">🔥 План погашения</div>
        <div class="empty-state">
          <div class="empty-state-icon">🎉</div>
          <div class="empty-state-title">Долгов нет</div>
          <div class="empty-state-text">Добавьте карты или долги в разделе Финансы</div>
        </div>
      `;
      return;
    }

    const totalDebt = items.reduce((s, i) => s + i.balance, 0);
    const totalMinPayments = items.reduce((s, i) => s + i.min_payment, 0);
    const budget = plan.budget || 0;
    const insufficientBudget = budget > 0 && budget < totalMinPayments;

    const sim = simulateAvalanche(items, budget);
    const freedomLabel = sim.freedomMonth !== null ? monthLabel(sim.freedomMonth) : '> 10 лет';

    const priority = [...items].sort((a, b) => b.rate - a.rate);

    const monthKey = getMonthKey();
    const paidThisMonth = (plan.payments || []).filter(p => p.date && p.date.startsWith(monthKey)).reduce((s, p) => s + (p.amount || 0), 0);
    const progressPct = budget > 0 ? Math.min(100, Math.round((paidThisMonth / budget) * 100)) : 0;

    this.el.innerHTML = `
      <div class="page-title" style="margin-bottom:16px;">🔥 План погашения</div>

      <div class="card" style="margin-bottom:16px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <div class="text-xs text-muted">Общий долг</div>
            <div style="font-size:22px; font-weight:800; color:var(--danger);">${fmt(totalDebt)}</div>
          </div>
          <div style="text-align:right;">
            <div class="text-xs text-muted">Свободен в</div>
            <div style="font-size:18px; font-weight:700; color:var(--success);">${freedomLabel}</div>
          </div>
        </div>
        <div class="divider" style="margin:10px 0;"></div>
        <div style="display:flex; justify-content:space-between;">
          <span class="text-secondary text-sm">Переплата процентов</span>
          <span style="font-weight:700; color:var(--warning);">${fmt(sim.totalInterest)}</span>
        </div>
      </div>

      ${insufficientBudget ? `
        <div class="card warning-card" style="margin-bottom:16px;">
          ⚠️ Бюджет (${fmt(budget)}) меньше суммы минимальных платежей (${fmt(totalMinPayments)})
        </div>
      ` : ''}

      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; gap:8px;">
        <button class="btn btn-ghost btn-sm text-accent" id="set-budget-btn">💰 Бюджет: ${fmt(budget)}/мес</button>
        <button class="btn btn-ghost btn-sm text-accent" id="add-payment-btn">+ Платёж</button>
      </div>

      ${budget > 0 ? `
        <div style="margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span class="text-xs text-muted">Внесено в этом месяце</span>
            <span class="text-xs text-muted">${fmt(paidThisMonth)} / ${fmt(budget)}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width:${progressPct}%"></div>
          </div>
        </div>
      ` : ''}

      <div class="section-header"><div class="section-title">Приоритет погашения</div></div>
      <div style="margin-bottom:8px;">
        ${priority.map((it, i) => `
          <div class="list-item">
            <div class="list-item-body">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; gap:8px;">
                <div class="list-item-title">${i === 0 ? '🥇' : `#${i + 1}`} ${it.name}</div>
                ${i === 0 ? '<span class="badge badge-accent">Гасим первым</span>' : ''}
              </div>
              <div style="display:flex; gap:16px; flex-wrap:wrap;">
                <div><div class="text-xs text-muted">Остаток</div><div style="font-weight:700; color:var(--danger);">${fmt(it.balance)}</div></div>
                <div><div class="text-xs text-muted">Ставка</div><div style="font-weight:600;">${it.rate}%</div></div>
                <div><div class="text-xs text-muted">Мин. платёж</div><div style="font-weight:600;">${fmt(it.min_payment)}</div></div>
              </div>
            </div>
            <button class="btn btn-ghost btn-icon text-muted" data-edit-item="${it.key}">✏️</button>
          </div>
        `).join('')}
      </div>

      <div class="section-header"><div class="section-title">Помесячный график</div></div>
      <div style="display:flex; flex-direction:column; gap:8px;">
        ${sim.schedule.map(row => `
          <div class="card" style="padding:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <span style="font-weight:700; font-size:13px;">${monthLabel(row.month)}</span>
              <span class="text-xs text-muted">Остаток: <b style="color:var(--text-primary);">${fmt(row.totalBalance)}</b></span>
            </div>
            <div style="display:flex; flex-direction:column; gap:2px;">
              ${Object.entries(row.paid).map(([key, amount]) => {
                const it = items.find(x => x.key === key);
                return `<div style="display:flex; justify-content:space-between; font-size:12px;"><span class="text-muted">${it ? it.name : key}</span><span>${fmt(amount)}</span></div>`;
              }).join('')}
            </div>
            ${row.closedThisMonth.length ? `
              <div style="margin-top:6px; display:flex; gap:4px; flex-wrap:wrap;">
                ${row.closedThisMonth.map(key => {
                  const it = items.find(x => x.key === key);
                  return `<span class="badge badge-success">✅ ${it ? it.name : key} закрыт</span>`;
                }).join('')}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;

    this.bindEvents(items, plan);
  }

  bindEvents(items, plan) {
    this.el.querySelector('#set-budget-btn')?.addEventListener('click', () => this.setBudget(plan));
    this.el.querySelector('#add-payment-btn')?.addEventListener('click', () => this.addPayment(items));
    this.el.querySelectorAll('[data-edit-item]').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = items.find(i => i.key === btn.dataset.editItem);
        if (item) this.editItem(item);
      });
    });
  }

  setBudget(plan) {
    const body = document.createElement('div');
    body.innerHTML = `
      <div class="input-group">
        <label class="input-label">Бюджет на долги (₽/мес)</label>
        <input class="input" id="budget-input" type="number" inputmode="numeric" value="${plan.budget || ''}" placeholder="30000">
      </div>
    `;
    openModal({
      title: '💰 Бюджет на долги',
      content: body,
      actions: [
        { label: 'Сохранить', cls: 'btn-primary', onClick: (m) => {
          const value = parseFloat(m.querySelector('#budget-input').value) || 0;
          store.set('debt_plan.budget', value);
          this.draw();
          closeModal();
          toast('Бюджет обновлён ✓');
        }},
        { label: 'Отмена', cls: 'btn-secondary', onClick: () => closeModal() }
      ]
    });
    setTimeout(() => body.querySelector('#budget-input')?.focus(), 100);
  }

  editItem(item) {
    const body = document.createElement('div');
    body.innerHTML = `
      <div class="input-group"><label class="input-label">Ставка (% годовых)</label><input class="input" id="item-rate" type="number" step="0.1" value="${item.rate || ''}"></div>
      <div class="input-group"><label class="input-label">Минимальный платёж (₽/мес)</label><input class="input" id="item-min" type="number" value="${item.min_payment || ''}"></div>
    `;
    openModal({
      title: `✏️ ${item.name}`,
      content: body,
      actions: [
        { label: 'Сохранить', cls: 'btn-primary', onClick: (m) => {
          const rate = parseFloat(m.querySelector('#item-rate').value) || 0;
          const min_payment = parseFloat(m.querySelector('#item-min').value) || 0;
          const storePath = item.source === 'card' ? 'finance.cards' : 'finance.debts';
          const arr = store.get(storePath) || [];
          arr[item.idx] = { ...arr[item.idx], rate, min_payment };
          store.set(storePath, arr);
          this.draw();
          closeModal();
          toast('Обновлено ✓');
        }},
        { label: 'Отмена', cls: 'btn-secondary', onClick: () => closeModal() }
      ]
    });
  }

  addPayment(items) {
    const body = document.createElement('div');
    body.innerHTML = `
      <div class="input-group">
        <label class="input-label">Сумма (₽)</label>
        <input class="input" id="pay-amount" type="number" inputmode="numeric" placeholder="5000">
      </div>
      <div class="input-group">
        <label class="input-label">Куда</label>
        <select class="input" id="pay-target">
          ${items.map(i => `<option value="${i.key}">${i.name}</option>`).join('')}
        </select>
      </div>
    `;
    openModal({
      title: '+ Платёж',
      content: body,
      actions: [
        { label: 'Сохранить', cls: 'btn-primary', onClick: (m) => {
          const amount = parseFloat(m.querySelector('#pay-amount').value);
          if (!amount || amount <= 0) { toast('Введите сумму'); return; }
          const target = m.querySelector('#pay-target').value;
          store.update('debt_plan.payments', arr => [...(arr || []), { date: getTodayStr(), amount, target }]);
          this.draw();
          closeModal();
          toast('Платёж добавлен ✓');
        }},
        { label: 'Отмена', cls: 'btn-secondary', onClick: () => closeModal() }
      ]
    });
    setTimeout(() => body.querySelector('#pay-amount')?.focus(), 100);
  }
}
