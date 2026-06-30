import { store } from '../store.js';

const DAY_SHORT = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
}

export class StatsPage {
  render() {
    const el = document.createElement('div');
    const data = store.getAll();
    const last7 = getLast7Days();
    const logs = data.health?.logs || [];
    const habits = data.habits || [];
    const inbox = data.inbox || [];

    const weekData = last7.map(d => {
      const log = logs.find(l => l.date === d);
      return { date: d, mood: log?.mood || 0, sleep: log?.sleep || 0, day: DAY_SHORT[new Date(d + 'T12:00:00').getDay()] };
    });

    const habitStats = habits.map(h => {
      const done = last7.filter(d => (h.completions || []).includes(d)).length;
      return { name: h.name, emoji: h.emoji || '✅', done, pct: Math.round((done / 7) * 100) };
    }).sort((a, b) => b.pct - a.pct);

    const catCounts = { idea: 0, task: 0, buy: 0, other: 0 };
    inbox.forEach(i => { if (catCounts[i.category] !== undefined) catCounts[i.category]++; });

    const avgMood = weekData.filter(d => d.mood).reduce((s, d, _, a) => s + d.mood / a.filter(x => x.mood).length, 0) || 0;
    const avgSleep = weekData.filter(d => d.sleep).reduce((s, d, _, a) => s + d.sleep / a.filter(x => x.sleep).length, 0) || 0;

    el.innerHTML = `
      <div class="page-title" style="margin-bottom:20px;">📊 Статистика</div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px;">
        <div class="card" style="text-align:center;">
          <div class="card-title">Настроение</div>
          <div style="font-size:28px; margin:8px 0;">${avgMood > 0 ? ['😫','😕','😐','🙂','😊'][Math.round(avgMood)-1] : '—'}</div>
          <div class="text-xs text-muted">${avgMood > 0 ? avgMood.toFixed(1) + '/5 за неделю' : 'нет данных'}</div>
        </div>
        <div class="card" style="text-align:center;">
          <div class="card-title">Сон</div>
          <div style="font-size:28px; font-weight:800; margin:8px 0; color:${avgSleep >= 7 ? 'var(--success)' : avgSleep >= 5 ? 'var(--warning)' : avgSleep > 0 ? 'var(--danger)' : 'var(--text-muted)'};">${avgSleep > 0 ? avgSleep.toFixed(1) + 'ч' : '—'}</div>
          <div class="text-xs text-muted">${avgSleep > 0 ? 'среднее за неделю' : 'нет данных'}</div>
        </div>
      </div>

      <div class="card" style="margin-bottom:12px;">
        <div class="card-title" style="margin-bottom:14px;">😊 Настроение (7 дней)</div>
        <div class="stat-bar-chart">
          ${weekData.map(d => {
            const pct = d.mood ? (d.mood / 5) * 100 : 0;
            const colors = ['','#EF4444','#F97316','#EAB308','#84CC16','#22C55E'];
            const color = d.mood ? colors[d.mood] : 'var(--surface-2)';
            const emoji = d.mood ? ['😫','😕','😐','🙂','😊'][d.mood - 1] : '·';
            return `
              <div class="stat-bar-col">
                <div class="stat-bar-emoji">${emoji}</div>
                <div class="stat-bar-track">
                  <div class="stat-bar-fill" style="height:${pct}%; background:${color};"></div>
                </div>
                <div class="stat-bar-label">${d.day}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="card" style="margin-bottom:12px;">
        <div class="card-title" style="margin-bottom:14px;">😴 Сон (7 дней)</div>
        <div class="stat-bar-chart">
          ${weekData.map(d => {
            const pct = d.sleep ? Math.min((d.sleep / 10) * 100, 100) : 0;
            const color = d.sleep >= 7 ? 'var(--success)' : d.sleep >= 5 ? 'var(--warning)' : d.sleep > 0 ? 'var(--danger)' : 'var(--surface-2)';
            return `
              <div class="stat-bar-col">
                <div class="stat-bar-emoji" style="font-size:11px; font-weight:700; color:var(--text-secondary);">${d.sleep ? d.sleep + 'ч' : '·'}</div>
                <div class="stat-bar-track">
                  <div class="stat-bar-fill" style="height:${pct}%; background:${color};"></div>
                </div>
                <div class="stat-bar-label">${d.day}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      ${habitStats.length > 0 ? `
      <div class="card" style="margin-bottom:12px;">
        <div class="card-title" style="margin-bottom:14px;">✅ Привычки (неделя)</div>
        ${habitStats.map(h => `
          <div style="margin-bottom:10px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
              <span class="text-sm">${h.emoji} ${h.name}</span>
              <span class="text-sm font-bold" style="color:${h.pct >= 80 ? 'var(--success)' : h.pct >= 50 ? 'var(--warning)' : 'var(--danger)'};">${h.done}/7 · ${h.pct}%</span>
            </div>
            <div class="progress-bar" style="margin-top:0;">
              <div class="progress-fill ${h.pct >= 80 ? 'success' : h.pct >= 50 ? 'warning' : 'danger'}" style="width:${h.pct}%"></div>
            </div>
          </div>
        `).join('')}
      </div>
      ` : ''}

      <div class="card" style="margin-bottom:12px;">
        <div class="card-title" style="margin-bottom:14px;">📥 Inbox по типам</div>
        ${[
          { key: 'idea', label: '💡 Идеи', color: 'var(--accent)' },
          { key: 'task', label: '✅ Задачи', color: 'var(--success)' },
          { key: 'buy', label: '🛒 Покупки', color: 'var(--warning)' },
          { key: 'other', label: '📌 Другое', color: 'var(--text-secondary)' }
        ].map(c => {
          const total = inbox.length;
          const pct = total > 0 ? Math.round((catCounts[c.key] / total) * 100) : 0;
          return `
            <div style="margin-bottom:10px;">
              <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                <span class="text-sm">${c.label}</span>
                <span class="text-xs text-muted">${catCounts[c.key]} (${pct}%)</span>
              </div>
              <div class="progress-bar" style="margin-top:0;">
                <div class="progress-fill" style="width:${pct}%; background:${c.color};"></div>
              </div>
            </div>
          `;
        }).join('')}
        <div style="text-align:center; margin-top:4px;">
          <span class="text-xs text-muted">Всего записей в Inbox: ${inbox.length}</span>
        </div>
      </div>
    `;

    return el;
  }
}
