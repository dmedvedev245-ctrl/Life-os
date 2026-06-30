import { store } from '../store.js';
import { toast } from '../components/Toast.js';

function getTodayStr() { return new Date().toISOString().split('T')[0]; }

const MOODS = ['😫', '😕', '😐', '🙂', '😊'];

export class HealthPage {
  render() {
    const el = document.createElement('div');
    this.el = el;
    this.draw();
    return el;
  }

  draw() {
    const logs = store.get('health.logs') || [];
    const today = getTodayStr();
    const todayLog = logs.find(l => l.date === today) || { date: today };
    const recent = [...logs].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,7);

    this.el.innerHTML = `
      <div class="page-title" style="margin-bottom:20px;">🏃 Здоровье</div>

      <div class="card" style="margin-bottom:20px;">
        <div class="section-block-title">Дневник сегодня</div>

        <div class="input-group">
          <label class="input-label">Сон (часов)</label>
          <div style="display:flex; align-items:center; gap:12px;">
            <input type="range" class="range-input" id="sleep-range" min="0" max="12" step="0.5" value="${todayLog.sleep||0}" style="flex:1;">
            <span id="sleep-val" style="min-width:36px; font-weight:700; font-size:16px;">${todayLog.sleep||0}ч</span>
          </div>
        </div>

        <div class="input-group" style="margin-top:14px;">
          <label class="input-label">Вес (кг)</label>
          <input class="input" id="weight-input" type="number" step="0.1" value="${todayLog.weight||''}" placeholder="70.5" style="max-width:120px;">
        </div>

        <div class="input-group" style="margin-top:14px;">
          <label class="input-label">Вода (стаканов из 8)</label>
          <div class="water-tracker" id="water-tracker">
            ${Array.from({length:8},(_,i) => `
              <div class="water-glass ${(todayLog.water||0) > i ? 'filled' : ''}" data-glass="${i+1}">💧</div>
            `).join('')}
          </div>
        </div>

        <div class="input-group" style="margin-top:14px;">
          <label class="input-label">Настроение</label>
          <div class="mood-selector" id="mood-selector">
            ${MOODS.map((m, i) => `<div class="mood-btn ${todayLog.mood === i+1 ? 'selected' : ''}" data-mood="${i+1}">${m}</div>`).join('')}
          </div>
        </div>

        <div class="input-group" style="margin-top:14px;">
          <label class="input-label">Энергия</label>
          <div class="energy-selector" id="energy-selector">
            ${[1,2,3,4,5].map(n => `<div class="energy-dot e${n} ${todayLog.energy===n?'selected':''}" data-energy="${n}" title="${n}/5"></div>`).join('')}
          </div>
        </div>

        <div style="display:flex; gap:16px; margin-top:14px;">
          <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
            <input type="checkbox" id="workout-cb" ${todayLog.workout?'checked':''} style="width:18px;height:18px;accent-color:var(--accent);">
            <span class="text-sm">🏋️ Тренировка</span>
          </label>
          <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
            <input type="checkbox" id="vitamins-cb" ${todayLog.vitamins?'checked':''} style="width:18px;height:18px;accent-color:var(--accent);">
            <span class="text-sm">💊 Витамины</span>
          </label>
        </div>

        <button class="btn btn-primary btn-full" id="save-health-btn" style="margin-top:16px;">Сохранить дневник</button>
      </div>

      <div class="section-title" style="margin-bottom:12px;">История (7 дней)</div>
      <div class="health-week-grid">
        ${Array.from({length:7},(_,i)=>{
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          const dateStr = d.toISOString().split('T')[0];
          const log = logs.find(l => l.date === dateStr) || {};
          const isToday = dateStr === today;
          const DAY_SHORT = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
          const dayLabel = isToday ? 'Сег' : DAY_SHORT[d.getDay()];
          const sleepColor = !log.sleep ? 'var(--border)'
            : log.sleep >= 7 ? '#22C55E'
            : log.sleep >= 6 ? '#F59E0B'
            : '#EF4444';
          const maxSleep = 10;
          const sleepPct = log.sleep ? Math.min(100, (log.sleep / maxSleep) * 100) : 0;
          return `
            <div class="health-day-col ${isToday ? 'health-day-today' : ''}">
              <div class="health-day-label">${dayLabel}</div>
              <div class="health-sleep-bar-wrap" title="${log.sleep ? log.sleep+'ч сна' : 'нет данных'}">
                <div class="health-sleep-bar-fill" style="height:${sleepPct}%; background:${sleepColor};"></div>
              </div>
              <div class="health-sleep-num" style="color:${sleepColor}">${log.sleep || '—'}</div>
              <div class="health-day-mood">${log.mood ? MOODS[log.mood-1] : '·'}</div>
              <div class="health-day-icons">
                <span title="Тренировка" style="opacity:${log.workout?1:0.2}">🏋️</span>
                <span title="Витамины" style="opacity:${log.vitamins?1:0.2}">💊</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    const getLog = () => {
      const logs = store.get('health.logs') || [];
      return logs.find(l => l.date === today) || { date: today };
    };

    const saveLog = (updates) => {
      const logs = store.get('health.logs') || [];
      const idx = logs.findIndex(l => l.date === today);
      const current = idx >= 0 ? logs[idx] : { date: today };
      const updated = { ...current, ...updates };
      if (idx >= 0) logs[idx] = updated;
      else logs.push(updated);
      store.set('health.logs', logs);
    };

    const sleepRange = this.el.querySelector('#sleep-range');
    const sleepVal = this.el.querySelector('#sleep-val');
    sleepRange?.addEventListener('input', () => {
      sleepVal.textContent = sleepRange.value + 'ч';
      saveLog({ sleep: parseFloat(sleepRange.value) });
    });

    this.el.querySelector('#water-tracker')?.addEventListener('click', e => {
      const glass = e.target.closest('[data-glass]');
      if (!glass) return;
      const n = parseInt(glass.dataset.glass);
      const current = getLog().water || 0;
      saveLog({ water: current === n ? n-1 : n });
      this.draw();
    });

    this.el.querySelector('#mood-selector')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-mood]');
      if (!btn) return;
      saveLog({ mood: parseInt(btn.dataset.mood) });
      this.el.querySelectorAll('.mood-btn').forEach(b => b.classList.toggle('selected', b===btn));
    });

    this.el.querySelector('#energy-selector')?.addEventListener('click', e => {
      const dot = e.target.closest('[data-energy]');
      if (!dot) return;
      saveLog({ energy: parseInt(dot.dataset.energy) });
      this.el.querySelectorAll('.energy-dot').forEach(d => {
        d.classList.toggle('selected', parseInt(d.dataset.energy) === parseInt(dot.dataset.energy));
      });
    });

    this.el.querySelector('#save-health-btn')?.addEventListener('click', () => {
      saveLog({
        sleep: parseFloat(this.el.querySelector('#sleep-range')?.value||0),
        weight: parseFloat(this.el.querySelector('#weight-input')?.value||0)||undefined,
        workout: this.el.querySelector('#workout-cb')?.checked,
        vitamins: this.el.querySelector('#vitamins-cb')?.checked
      });
      toast('Дневник сохранён ✓');
      this.draw();
    });
  }
}
