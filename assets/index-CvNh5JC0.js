(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=`life_os`,t={dashboard:{daily_tasks:[],main_goal:``,main_risk:``},finance:{cards:[],debts:[],monthly_income:0,monthly_expenses:[],assets:[],liabilities:[]},inbox:[],goals:{main:{title:``,deadline:``,progress:0,next_step:``,motivation:``},subgoals:[]},work:{sales_today:0,profit:0,avg_check:0,conversion:0,plan:0,fact:0,ideas:[],problems:[],blockers:[],tomorrow:``},relations:{partner_name:``,last_date:``,next_date:``,next_date_desc:``,date_ideas:[],promises:[],gifts:[],important_dates:[],notes:``},friends:[],health:{logs:[]},habits:[],weekly:[]};function n(e,t){let r={...e};for(let i of Object.keys(t))t[i]&&typeof t[i]==`object`&&!Array.isArray(t[i])?r[i]=n(e[i]||{},t[i]):i in e||(r[i]=t[i]);return r}function r(){try{let r=localStorage.getItem(e);return r?n(JSON.parse(r),t):structuredClone(t)}catch{return structuredClone(t)}}function i(t){localStorage.setItem(e,JSON.stringify(t))}var a={get(e){let t=r();return e?e.split(`.`).reduce((e,t)=>e?.[t],t):t},set(e,t){let n=r(),a=e.split(`.`),o=n;for(let e=0;e<a.length-1;e++)a[e]in o||(o[a[e]]={}),o=o[a[e]];o[a[a.length-1]]=t,i(n)},update(e,t){let n=this.get(e);this.set(e,t(n))},getAll(){return r()},reset(){localStorage.removeItem(e)}};function o(e,t=2500){let n=document.getElementById(`toast-root`),r=document.createElement(`div`);r.className=`toast`,r.textContent=e,n.appendChild(r),setTimeout(()=>{r.classList.add(`out`),setTimeout(()=>r.remove(),250)},t)}var s=null;function c({title:e,content:t,actions:n=[]}){u();let r=document.getElementById(`modal-root`),i=document.createElement(`div`);i.className=`modal-overlay`;let a=document.createElement(`div`);a.className=`modal`,a.innerHTML=`
    <div class="modal-handle"></div>
    <div class="modal-title">${e}</div>
    <div class="modal-body"></div>
    <div class="modal-actions"></div>
  `;let o=a.querySelector(`.modal-body`);typeof t==`string`?o.innerHTML=t:t instanceof HTMLElement&&o.appendChild(t);let c=a.querySelector(`.modal-actions`);return n.forEach(({label:e,cls:t=`btn-secondary`,onClick:n})=>{let r=document.createElement(`button`);r.className=`btn ${t} btn-full`,r.textContent=e,r.addEventListener(`click`,()=>{n&&n(a)}),c.appendChild(r)}),i.appendChild(a),r.appendChild(i),r.style.pointerEvents=`all`,i.addEventListener(`click`,e=>{e.target===i&&u()}),document.addEventListener(`keydown`,l),s={overlay:i,modal:a},a}function l(e){e.key===`Escape`&&u()}function u(){if(!s)return;let{overlay:e,modal:t}=s;e.classList.add(`closing`),t.classList.add(`closing`),setTimeout(()=>{e.remove();let t=document.getElementById(`modal-root`);t&&(t.style.pointerEvents=`none`)},200),document.removeEventListener(`keydown`,l),s=null}var d=`life_os_ai_cache`,f=`life_os_api_key`;function p(){return localStorage.getItem(f)||``}function m(e){localStorage.setItem(f,e.trim())}function h(){return new Date().toISOString().split(`T`)[0]}function g(e){let{finance:t,work:n,health:r,goals:i,relations:a,friends:o,habits:s,inbox:c}=e,l=[...(t.cards||[]).map(e=>e.debt||0),...(t.debts||[]).map(e=>e.amount||0)].reduce((e,t)=>e+t,0),u=(t.cards||[]).filter(e=>e.grace_period_end).sort((e,t)=>new Date(e.grace_period_end)-new Date(t.grace_period_end))[0],d=(r.logs||[]).find(e=>e.date===h()),f=i?.main?.title||``,p=i?.main?.progress||0,m=(c||[]).length,g=(o||[]).filter(e=>e.last_contact?Math.floor((Date.now()-new Date(e.last_contact))/864e5)>30:!0).length;return`Данные пользователя:
- Общий долг: ${l.toLocaleString(`ru`)} руб.
${u?`- Срочная карта: ${u.bank}, льготный период до ${u.grace_period_end}`:``}
- Работа: продажи ${n.sales_today||0}, план ${n.plan||0}, факт ${n.fact||0}
- Главная цель: "${f}" (прогресс ${p}%)
- Сон: ${d?.sleep||`не указан`} ч, настроение: ${d?.mood||`не указано`}, энергия: ${d?.energy||`не указана`}/5
- Inbox: ${m} необработанных записей
- Друзей давно не видел: ${g}
- Следующее свидание: ${a.next_date||`не запланировано`}

Ответь кратко на русском языке в формате JSON:
{
  "today": "Что сделать сегодня (1 конкретное действие)",
  "important": "Что сейчас самое важное",
  "warning": "Какая проблема начинает появляться (или null если нет)",
  "improve": "Одна конкретная рекомендация по улучшению"
}`}async function _(e){let t=p();if(!t)return null;let n=JSON.parse(localStorage.getItem(d)||`{}`);if(n.date===h()&&n.result)return n.result;let r=g(e),i=await fetch(`https://api.anthropic.com/v1/messages`,{method:`POST`,headers:{"Content-Type":`application/json`,"x-api-key":t,"anthropic-version":`2023-06-01`,"anthropic-dangerous-direct-browser-access":`true`},body:JSON.stringify({model:`claude-haiku-4-5-20251001`,max_tokens:500,system:`Ты персональный советник. Анализируй данные человека и давай конкретные, поддерживающие советы. Отвечай ТОЛЬКО валидным JSON без markdown.`,messages:[{role:`user`,content:r}]})});if(!i.ok)throw Error(`API error: ${i.status}`);let a=(await i.json()).content[0].text.trim(),o=JSON.parse(a);return localStorage.setItem(d,JSON.stringify({date:h(),result:o})),o}function ee(){localStorage.removeItem(d)}function v(){return new Date().toISOString().split(`T`)[0]}function y(e){if(!e)return null;let t=new Date,n=new Date(e),r=new Date(t.getFullYear(),n.getMonth(),n.getDate());return r<t&&r.setFullYear(t.getFullYear()+1),Math.ceil((r-t)/864e5)}function b(e){if(!e)return null;let t=new Date(e),n=new Date,r=n.getFullYear()-t.getFullYear(),i=n.getMonth()-t.getMonth();return(i<0||i===0&&n.getDate()<t.getDate())&&r--,r}function x(e=7){return(a.get(`friends`)||[]).filter(e=>e.birthday).map(e=>({name:e.name,birthday:e.birthday,daysLeft:y(e.birthday),age:b(e.birthday),emoji:e.emoji||`🎂`,photo:e.photo||null})).filter(t=>t.daysLeft!==null&&t.daysLeft<=e).sort((e,t)=>e.daysLeft-t.daysLeft)}async function S(e,t,n){if(!(`Notification`in window)||Notification.permission===`denied`||(Notification.permission==="default"&&await Notification.requestPermission(),Notification.permission!==`granted`))return;let r=t===0?`🎂 Сегодня день рождения — ${e}!`:`🎂 Через ${t} ${t===1?`день`:`дня`} ДР — ${e}`,i=t===0?`Не забудь поздравить!${n===null?``:` Исполняется ${n+1} лет.`}`:`Запланируй поздравление заранее.`;new Notification(r,{body:i,icon:`/Life-os/favicon.svg`,badge:`/Life-os/favicon.svg`,tag:`birthday-${e}-${v()}`})}async function C(){let e=v();if(localStorage.getItem(`life_os_bd_checked`)===e)return;localStorage.setItem(`life_os_bd_checked`,e);let t=x(3);if(t.length){Notification.permission==="default"&&await Notification.requestPermission();for(let e of t)await S(e.name,e.daysLeft,e.age)}}async function w(){if(!(`Notification`in window)||Notification.permission!==`granted`)return;let e=JSON.parse(localStorage.getItem(`life_os`)||`{}`).inbox||[],t=new Date,n=t.toISOString().split(`T`)[0],r=t.getHours()*60+t.getMinutes(),i=`life_os_rem_${n}_${t.getHours()}_${t.getMinutes()}`;if(!localStorage.getItem(i)){localStorage.setItem(i,`1`);for(let t of e){if(!t.reminder?.date||t.reminder.date!==n)continue;let[e,i]=(t.reminder.time||`09:00`).split(`:`).map(Number),a=e*60+i;r>=a&&r<=a+2&&new Notification(`⏰ Напоминание`,{body:t.text,icon:`/Life-os/favicon.svg`,tag:`inbox-${t.created}`})}}}async function te(){return`Notification`in window?Notification.permission===`granted`?`granted`:await Notification.requestPermission():`unsupported`}function ne(){return`Notification`in window?Notification.permission:`unsupported`}function re(){let e=localStorage.getItem(`life_os`)||`{}`,t=new Blob([e],{type:`application/json`}),n=URL.createObjectURL(t),r=document.createElement(`a`);r.href=n,r.download=`life-os-${new Date().toISOString().split(`T`)[0]}.json`,document.body.appendChild(r),r.click(),document.body.removeChild(r),URL.revokeObjectURL(n)}function ie(e){return new Promise((t,n)=>{let r=new FileReader;r.onload=e=>{try{let n=JSON.parse(e.target.result);localStorage.setItem(`life_os`,JSON.stringify(n)),t()}catch{n(Error(`Неверный формат файла`))}},r.onerror=()=>n(Error(`Ошибка чтения файла`)),r.readAsText(e)})}function ae(){let e=[`Воскресенье`,`Понедельник`,`Вторник`,`Среда`,`Четверг`,`Пятница`,`Суббота`],t=[`января`,`февраля`,`марта`,`апреля`,`мая`,`июня`,`июля`,`августа`,`сентября`,`октября`,`ноября`,`декабря`],n=new Date;return`${e[n.getDay()]}, ${n.getDate()} ${t[n.getMonth()]}`}function oe(){return new Date().toISOString().split(`T`)[0]}function T(e){return e?Math.ceil((new Date(e)-new Date)/864e5):null}function E(e){return Number(e||0).toLocaleString(`ru`)+` ₽`}var D={finance:{color:`#22C55E`,bg:`rgba(34,197,94,0.06)`},work:{color:`#6366F1`,bg:`rgba(99,102,241,0.06)`},relations:{color:`#EF4444`,bg:`rgba(239,68,68,0.06)`},friends:{color:`#F97316`,bg:`rgba(249,115,22,0.06)`},health:{color:`#10B981`,bg:`rgba(16,185,129,0.06)`},energy:{color:`#8B5CF6`,bg:`rgba(139,92,246,0.06)`}};function O(e){let t=D[e];return`border-left: 3px solid ${t.color}; background: ${t.bg};`}var se=class{render(){let e=document.createElement(`div`);this.el=e;let t=a.getAll(),{finance:n,work:r,relations:i,friends:s,health:c,goals:l,dashboard:u}=t,d=oe(),f=(c.logs||[]).find(e=>e.date===d),p=f?.mood||0,m=[...(n.cards||[]).map(e=>e.debt||0),...(n.debts||[]).map(e=>e.amount||0)].reduce((e,t)=>e+t,0),h=(n.cards||[]).filter(e=>e.grace_period_end).sort((e,t)=>new Date(e.grace_period_end)-new Date(t.grace_period_end))[0],g=h?T(h.grace_period_end):null,_=i.next_date?T(i.next_date):null,v=i.last_date?Math.floor((Date.now()-new Date(i.last_date))/864e5):null,y=(s||[]).filter(e=>e.last_contact?Math.floor((Date.now()-new Date(e.last_contact))/864e5)>30:!0).length,b=u.daily_tasks||[],x=h&&g!==null&&g<=7?`⚡ Закрыть ${h.bank} через ${g} дн.`:m>0?`Общий долг: ${E(m)}`:`Долгов нет`,S=r.plan>0?Math.round(r.fact/r.plan*100):0,C=f?.energy?`<span style="color:${D.energy.color}">${`●`.repeat(f.energy)}</span><span style="color:var(--border)">${`●`.repeat(5-f.energy)}</span>`:`<span style="color:var(--text-muted)">● ● ● ● ●</span>`;return e.innerHTML=`
      <div class="dash-header">
        <div>
          <div class="page-title">Life OS</div>
          <div class="page-subtitle">${ae()}</div>
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
        ${[`😫`,`😕`,`😐`,`🙂`,`😊`].map((e,t)=>`
          <button class="dash-mood-btn ${p===t+1?`active`:``}" data-mood="${t+1}">${e}</button>
        `).join(``)}
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

        <div class="card dash-card clickable" style="${O(`finance`)}" data-nav="#/finance">
          <div class="dash-card-label" style="color:${D.finance.color}">💰 Финансы</div>
          <div class="dash-card-value">${m>0?E(m):`—`}</div>
          <div class="dash-card-sub">${x}</div>
        </div>

        <div class="card dash-card clickable" style="${O(`work`)}" data-nav="#/work">
          <div class="dash-card-label" style="color:${D.work.color}">💼 Работа</div>
          <div class="dash-card-value">${E(r.sales_today)}</div>
          <div class="dash-card-sub">${S}% от плана</div>
        </div>

        <div class="card dash-card clickable" style="${O(`relations`)}" data-nav="#/relations">
          <div class="dash-card-label" style="color:${D.relations.color}">❤️ Отношения</div>
          <div class="dash-card-value" style="font-size:16px;">${_===null?`Не запланировано`:`Через ${_} дн.`}</div>
          <div class="dash-card-sub">${v===null?`Добавьте свидание`:`Последнее: ${v} дн. назад`}</div>
        </div>

        <div class="card dash-card clickable" style="${O(`friends`)}${y>0?` border-left-color: var(--warning);`:``}" data-nav="#/friends">
          <div class="dash-card-label" style="color:${y>0?`var(--warning)`:D.friends.color}">👥 Друзья</div>
          <div class="dash-card-value" style="${y>0?`color:var(--warning)`:``}">${y}</div>
          <div class="dash-card-sub">${y>0?`Давно не писал`:`Все в норме ✓`}</div>
        </div>

        <div class="card dash-card clickable" style="${O(`health`)}" data-nav="#/health">
          <div class="dash-card-label" style="color:${D.health.color}">🏃 Здоровье</div>
          <div class="dash-card-value">${f?.sleep?`${f.sleep}ч`:`—`}</div>
          <div class="dash-card-sub">${f?.mood?[`😫`,`😕`,`😐`,`🙂`,`😊`][f.mood-1]+` настроение`:`Заполни дневник`}</div>
        </div>

        <div class="card dash-card clickable" style="${O(`energy`)}" data-nav="#/health">
          <div class="dash-card-label" style="color:${D.energy.color}">🧠 Энергия</div>
          <div class="dash-card-value" style="font-size:20px; letter-spacing:2px;">${C}</div>
          <div class="dash-card-sub">${f?.energy?`${f.energy} из 5`:`Не указана`}</div>
        </div>

        ${l.main?.title?`
        <div class="card dash-card-full clickable" data-nav="#/goals">
          <div class="dash-card-label">🎯 Главная цель</div>
          <div class="dash-goal-title">${l.main.title}</div>
          <div class="progress-row">
            <div class="progress-bar" style="flex:1"><div class="progress-fill" style="width:${l.main.progress||0}%"></div></div>
            <span class="progress-label">${l.main.progress||0}%</span>
          </div>
          ${l.main.next_step?`<div class="dash-card-sub mt-8">→ ${l.main.next_step}</div>`:``}
        </div>
        `:`
        <div class="card dash-card-full clickable" data-nav="#/goals" style="border:1px dashed var(--border); background:transparent;">
          <div class="dash-card-label">🎯 Главная цель</div>
          <div class="dash-card-sub mt-4">Поставьте главную цель жизни →</div>
        </div>
        `}

        ${u.main_risk?`
        <div class="card dash-card-full" style="border-left:3px solid var(--warning); background:rgba(245,158,11,0.06);">
          <div class="dash-card-label" style="color:var(--warning)">⚠️ Главный риск</div>
          <div style="font-size:14px; margin-top:6px; color:var(--text);">${u.main_risk}</div>
        </div>
        `:``}
      </div>

      <div class="section-header">
        <span class="section-title">Топ-3 на сегодня</span>
        <button class="btn btn-ghost btn-sm text-accent" id="add-task-btn">+ Добавить</button>
      </div>
      <div class="card" id="tasks-card">
        <div id="tasks-list">${this.renderTasks(b)}</div>
        ${b.length===0?`<div class="text-muted text-sm" style="text-align:center; padding:12px 0;">Добавьте задачи на сегодня</div>`:``}
      </div>
    `,e.querySelectorAll(`[data-nav]`).forEach(e=>{e.addEventListener(`click`,()=>Q(e.dataset.nav))}),e.querySelector(`#search-btn`).addEventListener(`click`,()=>Q(`#/search`)),e.querySelector(`#add-task-btn`).addEventListener(`click`,()=>this.addTask(e)),e.querySelector(`#ai-toggle`).addEventListener(`click`,()=>this.toggleAi(e)),e.querySelector(`#ai-refresh-btn`).addEventListener(`click`,()=>{ee(),this.loadAi(e,a.getAll())}),e.querySelector(`#settings-btn`).addEventListener(`click`,()=>this.openSettings()),e.querySelectorAll(`.dash-mood-btn`).forEach(t=>{t.addEventListener(`click`,()=>{let n=parseInt(t.dataset.mood),r=a.get(`health.logs`)||[],i=r.findIndex(e=>e.date===d);i>=0?r[i]={...r[i],mood:n}:r.push({date:d,mood:n}),a.set(`health.logs`,r),e.querySelectorAll(`.dash-mood-btn`).forEach(e=>e.classList.toggle(`active`,parseInt(e.dataset.mood)===n)),o([`😫`,`😕`,`😐`,`🙂`,`😊`][n-1])})}),e.querySelector(`#tasks-list`).addEventListener(`click`,t=>{let n=t.target.closest(`.checkbox`);n&&this.toggleTask(parseInt(n.dataset.idx),e);let r=t.target.closest(`[data-del-task]`);r&&this.deleteTask(parseInt(r.dataset.delTask),e)}),this.loadAi(e,t),e}renderBirthdayBanner(){let e=x(7);return e.length?e.map(e=>{let t=e.daysLeft===0,n=e.daysLeft===1,r=t?`Сегодня день рождения!`:n?`Завтра день рождения`:`Через ${e.daysLeft} дня день рождения`,i=e.age===null?``:` · исполняется ${e.age+1} лет`;return`
        <div class="birthday-banner ${t?`birthday-today`:``}" data-nav="#/friends">
          <span class="birthday-icon">🎂</span>
          <div class="birthday-info">
            <div class="birthday-name">${e.name}</div>
            <div class="birthday-sub">${r}${i}</div>
          </div>
          ${t?`<span class="birthday-tag">Поздравь!</span>`:``}
        </div>
      `}).join(``):``}renderTasks(e){return e.length?e.map((e,t)=>`
      <div class="task-item">
        <div class="checkbox ${e.done?`checked`:``}" data-idx="${t}">${e.done?`✓`:``}</div>
        <span class="task-text ${e.done?`done`:``}">${e.text}</span>
        <button class="btn btn-ghost btn-icon text-muted" data-del-task="${t}">✕</button>
      </div>
    `).join(``):``}toggleTask(e,t){let n=a.get(`dashboard.daily_tasks`)||[];n[e].done=!n[e].done,a.set(`dashboard.daily_tasks`,n),t.querySelector(`#tasks-list`).innerHTML=this.renderTasks(n)}deleteTask(e,t){let n=a.get(`dashboard.daily_tasks`)||[];n.splice(e,1),a.set(`dashboard.daily_tasks`,n),t.querySelector(`#tasks-list`).innerHTML=this.renderTasks(n),o(`Задача удалена`)}addTask(e){let t=a.get(`dashboard.daily_tasks`)||[];if(t.filter(e=>!e.done).length>=3){o(`Максимум 3 активные задачи`);return}let n=document.createElement(`div`);n.innerHTML=`
      <div class="input-group">
        <label class="input-label">Задача на сегодня</label>
        <input class="input" id="task-input" placeholder="Что нужно сделать?" maxlength="120">
      </div>
    `;let r=c({title:`Новая задача`,content:n,actions:[{label:`Добавить`,cls:`btn-primary`,onClick:n=>{let r=n.querySelector(`#task-input`).value.trim();r&&(t.push({text:r,done:!1,created:Date.now()}),a.set(`dashboard.daily_tasks`,t),e.querySelector(`#tasks-list`).innerHTML=this.renderTasks(t),u(),o(`Задача добавлена ✓`))}},{label:`Отмена`,cls:`btn-secondary`,onClick:()=>u()}]});setTimeout(()=>r.querySelector(`#task-input`)?.focus(),100)}openSettings(){let e=p(),t=ne(),n=localStorage.getItem(`life_os_theme`)||``,r=document.createElement(`div`);r.innerHTML=`
      <div style="margin-bottom:20px;">
        <div class="input-label" style="margin-bottom:6px;">Claude API ключ</div>
        <div style="font-size:12px; color:var(--text-secondary); margin-bottom:10px;">
          Нужен для AI-советника. Получить можно на console.anthropic.com
        </div>
        <input class="input" id="api-key-input" type="password"
          placeholder="sk-ant-..."
          value="${e?`••••••••••••`+e.slice(-4):``}">
        ${e?`<div style="font-size:11px; color:var(--success); margin-top:6px;">✓ Ключ сохранён</div>`:``}
      </div>

      <div style="margin-bottom:20px;">
        <div class="input-label" style="margin-bottom:8px;">Тема</div>
        <div style="display:flex; gap:8px;">
          <button class="btn ${n===`light`?`btn-secondary`:`btn-primary`}" id="theme-dark-btn" style="flex:1;">🌙 Тёмная</button>
          <button class="btn ${n===`light`?`btn-primary`:`btn-secondary`}" id="theme-light-btn" style="flex:1;">☀️ Светлая</button>
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
        ${t===`granted`?`<div style="font-size:13px; color:var(--success);">✓ Уведомления включены</div>`:t===`denied`?`<div style="font-size:13px; color:var(--danger);">✕ Заблокированы в настройках браузера</div>`:`<button class="btn btn-secondary btn-sm" id="enable-notif-btn">🔔 Включить уведомления</button>`}
      </div>

      <div>
        <div class="input-label" style="margin-bottom:6px;">Главный риск</div>
        <input class="input" id="risk-input" placeholder="Что может пойти не так..."
          value="${a.get(`dashboard.main_risk`)||``}">
      </div>
    `,r.querySelector(`#theme-dark-btn`)?.addEventListener(`click`,()=>{localStorage.removeItem(`life_os_theme`),document.documentElement.removeAttribute(`data-theme`),r.querySelector(`#theme-dark-btn`).className=`btn btn-primary`,r.querySelector(`#theme-dark-btn`).style.flex=`1`,r.querySelector(`#theme-light-btn`).className=`btn btn-secondary`,r.querySelector(`#theme-light-btn`).style.flex=`1`}),r.querySelector(`#theme-light-btn`)?.addEventListener(`click`,()=>{localStorage.setItem(`life_os_theme`,`light`),document.documentElement.setAttribute(`data-theme`,`light`),r.querySelector(`#theme-light-btn`).className=`btn btn-primary`,r.querySelector(`#theme-light-btn`).style.flex=`1`,r.querySelector(`#theme-dark-btn`).className=`btn btn-secondary`,r.querySelector(`#theme-dark-btn`).style.flex=`1`}),r.querySelector(`#export-btn`)?.addEventListener(`click`,()=>{re(),o(`Данные экспортированы ✓`)}),r.querySelector(`#import-file`)?.addEventListener(`change`,async e=>{let t=e.target.files[0];if(t)try{await ie(t),o(`Данные импортированы ✓`),u(),setTimeout(()=>Q(`#/dashboard`,{force:!0}),300)}catch(e){o(e.message)}}),r.querySelector(`#enable-notif-btn`)?.addEventListener(`click`,async()=>{await te()===`granted`?(o(`Уведомления включены ✓`),r.querySelector(`#enable-notif-btn`).replaceWith(Object.assign(document.createElement(`div`),{style:`font-size:13px; color:var(--success);`,textContent:`✓ Уведомления включены`}))):o(`Разрешение не дано`)}),c({title:`⚙️ Настройки`,content:r,actions:[{label:`Сохранить`,cls:`btn-primary`,onClick:e=>{let t=e.querySelector(`#api-key-input`).value.trim();t&&!t.includes(`•`)&&m(t);let n=e.querySelector(`#risk-input`).value.trim();a.set(`dashboard.main_risk`,n),u(),o(`Сохранено ✓`),Q(`#/dashboard`,{force:!0})}},{label:`Отмена`,cls:`btn-secondary`,onClick:()=>u()}]}),setTimeout(()=>{e||r.querySelector(`#api-key-input`)?.focus()},100)}toggleAi(e){let t=e.querySelector(`#ai-body`),n=e.querySelector(`#ai-toggle`),r=t.style.display===`none`;t.style.display=r?``:`none`,n.textContent=r?`скрыть`:`показать`}async loadAi(e,t){let n=e.querySelector(`#ai-body`);if(n){if(!p()){n.innerHTML=`
        <div class="ai-text text-muted">
          Нажмите ⚙️ чтобы добавить API ключ и получать ежедневные советы
        </div>
      `;return}n.innerHTML=`<div class="ai-text text-muted">Анализирую вашу жизнь...</div>`;try{let e=await _(t);if(!e){n.innerHTML=`<div class="ai-text text-muted">Нажмите ✨ чтобы получить совет</div>`;return}n.innerHTML=`
        <div style="display:flex; flex-direction:column; gap:8px;">
          <div class="ai-insight"><span class="ai-tag" style="color:#6366F1">Сегодня</span>${e.today}</div>
          <div class="ai-insight"><span class="ai-tag" style="color:#22C55E">Важно</span>${e.important}</div>
          ${e.warning?`<div class="ai-insight"><span class="ai-tag" style="color:#F59E0B">Внимание</span>${e.warning}</div>`:``}
          <div class="ai-insight"><span class="ai-tag" style="color:var(--text-secondary)">Совет</span>${e.improve}</div>
        </div>
      `}catch(e){n.innerHTML=`<div class="ai-text text-muted">Ошибка: ${e.message}</div>`}}}};function k(e){return Number(e||0).toLocaleString(`ru`)+` ₽`}function A(e){return e?Math.ceil((new Date(e)-new Date)/864e5):null}function j(e){if(!e)return`—`;let t=[`янв`,`фев`,`мар`,`апр`,`май`,`июн`,`июл`,`авг`,`сен`,`окт`,`ноя`,`дек`],n=new Date(e);return`${n.getDate()} ${t[n.getMonth()]}`}var ce=class{constructor(){this.activeTab=`cards`}render(){let e=document.createElement(`div`);return this.el=e,this.draw(),e}draw(){let e=a.get(`finance`)||{},t=e.cards||[],n=e.debts||[],r=e.monthly_income||0,i=e.monthly_expenses||[],o=e.assets||[],s=e.liabilities||[],c=t.reduce((e,t)=>e+(t.debt||0),0),l=n.reduce((e,t)=>e+(t.amount||0),0),u=i.reduce((e,t)=>e+(t.amount||0),0);o.reduce((e,t)=>e+(t.value||0),0)-s.reduce((e,t)=>e+(t.amount||0),0);let d=r-u;this.el.innerHTML=`
      <div class="page-title" style="margin-bottom:16px;">💰 Финансы</div>

      <div class="finance-summary">
        <div class="card-sub" style="margin-bottom:4px;">Общий долг</div>
        <div class="finance-total">${k(c+l)}</div>
        <div style="display:flex; gap:20px; margin-top:12px;">
          <div>
            <div class="text-xs text-muted">Доход</div>
            <div style="font-size:15px; font-weight:700; color:var(--success);">${k(r)}</div>
          </div>
          <div>
            <div class="text-xs text-muted">Расходы</div>
            <div style="font-size:15px; font-weight:700; color:var(--danger);">${k(u)}</div>
          </div>
          <div>
            <div class="text-xs text-muted">Поток</div>
            <div style="font-size:15px; font-weight:700; color:${d>=0?`var(--success)`:`var(--danger)`};">${k(d)}</div>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm text-accent" id="edit-income-btn" style="margin-top:8px;">✏️ Изменить доход</button>
      </div>

      <div class="tabs">
        <div class="tab ${this.activeTab===`cards`?`active`:``}" data-tab="cards">Карты</div>
        <div class="tab ${this.activeTab===`debts`?`active`:``}" data-tab="debts">Долги</div>
        <div class="tab ${this.activeTab===`payments`?`active`:``}" data-tab="payments">Платежи</div>
        <div class="tab ${this.activeTab===`forecast`?`active`:``}" data-tab="forecast">Прогноз</div>
        <div class="tab ${this.activeTab===`analytics`?`active`:``}" data-tab="analytics">Аналитика</div>
      </div>

      <div id="tab-content">${this.renderTab(e)}</div>
    `,this.el.querySelectorAll(`.tab`).forEach(e=>{e.addEventListener(`click`,()=>{this.activeTab=e.dataset.tab,this.el.querySelectorAll(`.tab`).forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`),this.el.querySelector(`#tab-content`).innerHTML=this.renderTab(a.get(`finance`)||{}),this.bindTabEvents(a.get(`finance`)||{})})}),this.el.querySelector(`#edit-income-btn`).addEventListener(`click`,()=>this.editIncome()),this.bindTabEvents(e)}renderTab(e){switch(this.activeTab){case`cards`:return this.renderCards(e);case`debts`:return this.renderDebts(e);case`payments`:return this.renderPayments(e);case`forecast`:return this.renderForecast(e);case`analytics`:return this.renderAnalytics(e);default:return``}}renderCards(e){let t=e.cards||[];return t.length?`
      ${t.map((e,t)=>{let n=A(e.grace_period_end),r=n!==null&&n<=3?`urgent`:n!==null&&n<=7?`warning`:``,i=e.limit?Math.round(e.debt/e.limit*100):0;return`
        <div class="credit-card-item ${r}">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
            <div>
              <div style="font-size:16px; font-weight:700;">${e.bank}</div>
              ${n===null?``:`<div class="badge ${n<=3?`badge-danger`:n<=7?`badge-warning`:`badge-muted`}" style="margin-top:4px;">⏱ Льготный: ${n} дн.</div>`}
            </div>
            <button class="btn btn-ghost btn-icon text-muted" data-del-card="${t}">✕</button>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
            <div>
              <div class="text-xs text-muted">Долг</div>
              <div style="font-size:18px; font-weight:700; color:var(--danger);">${k(e.debt)}</div>
            </div>
            <div>
              <div class="text-xs text-muted">Лимит</div>
              <div style="font-size:15px; font-weight:600;">${k(e.limit)}</div>
            </div>
            <div>
              <div class="text-xs text-muted">Мин. платёж</div>
              <div style="font-size:15px; font-weight:600;">${k(e.min_payment)}</div>
            </div>
          </div>
          <div class="progress-bar">
            <div class="progress-fill ${i>80?`danger`:i>50?`warning`:``}" style="width:${i}%"></div>
          </div>
          <div style="display:flex; justify-content:space-between; margin-top:4px;">
            <span class="text-xs text-muted">Использовано ${i}%</span>
            ${e.grace_period_end?`<span class="text-xs text-muted">До ${j(e.grace_period_end)}</span>`:``}
          </div>
        </div>
      `}).join(``)}
      <button class="btn btn-secondary btn-full" id="add-card-btn" style="margin-top:8px;">+ Добавить карту</button>
    `:`
      <div class="empty-state">
        <div class="empty-state-icon">💳</div>
        <div class="empty-state-title">Кредитных карт нет</div>
        <div class="empty-state-text">Добавьте кредитную карту чтобы отслеживать льготные периоды</div>
      </div>
      <button class="btn btn-primary btn-full" id="add-card-btn">+ Добавить карту</button>
    `}renderDebts(e){let t=e.debts||[],n=localStorage.getItem(`debt_method`)||`avalanche`,r=[...t].sort((e,t)=>n===`avalanche`?(t.rate||0)-(e.rate||0):(e.amount||0)-(t.amount||0));if(!r.length)return`
      <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <div class="empty-state-title">Долгов нет</div>
        <div class="empty-state-text">Добавьте долги чтобы видеть стратегию погашения</div>
      </div>
      <button class="btn btn-primary btn-full" id="add-debt-btn">+ Добавить долг</button>
    `;let i=r.map((e,n)=>`
      <div class="list-item">
        <div class="list-item-body">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <div class="list-item-title">${e.creditor}</div>
            ${n===0?`<span class="badge badge-accent">Приоритет #1</span>`:`<span class="badge badge-muted">#${n+1}</span>`}
          </div>
          <div style="display:flex; gap:16px; flex-wrap:wrap;">
            <div><div class="text-xs text-muted">Долг</div><div style="font-weight:700; color:var(--danger);">${k(e.amount)}</div></div>
            <div><div class="text-xs text-muted">Ставка</div><div style="font-weight:600;">${e.rate||0}%</div></div>
            <div><div class="text-xs text-muted">Платёж/мес</div><div style="font-weight:600;">${k(e.monthly_payment)}</div></div>
          </div>
          ${e.monthly_payment&&e.amount?`
            <div class="progress-bar" style="margin-top:8px;">
              <div class="progress-fill" style="width:${Math.min(100,Math.round(((e.initial_amount||e.amount)-e.amount)/(e.initial_amount||e.amount)*100))}%"></div>
            </div>
          `:``}
        </div>
        <button class="btn btn-ghost btn-icon text-muted" data-del-debt="${t.indexOf(e)}">✕</button>
      </div>
    `).join(``);return`
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <div class="text-sm text-secondary">Стратегия: <b>${n===`avalanche`?`Лавина (высокий %)`:`Снежный ком`}</b></div>
        <button class="btn btn-ghost btn-sm text-accent" id="toggle-method">Сменить</button>
      </div>
      ${i}
      <button class="btn btn-secondary btn-full" id="add-debt-btn" style="margin-top:8px;">+ Добавить долг</button>
    `}renderPayments(e){let t=e.cards||[],n=e.debts||[],r=new Date,i=[];t.forEach(e=>{e.grace_period_end&&i.push({name:e.bank,date:e.grace_period_end,amount:e.debt,type:`card`})});for(let e=0;e<2;e++)n.forEach(t=>{if(t.payment_day){let n=new Date(r.getFullYear(),r.getMonth()+e,t.payment_day);n>=r&&i.push({name:t.creditor,date:n.toISOString().split(`T`)[0],amount:t.monthly_payment,type:`debt`})}});i.sort((e,t)=>new Date(e.date)-new Date(t.date));let a=i.filter(e=>A(e.date)<=30&&A(e.date)>=-1);return a.length?a.map(e=>{let t=A(e.date),n=t<=3?`red`:t<=7?`yellow`:`green`,r=t<0?`просрочен`:t===0?`сегодня`:`через ${t} дн.`;return`
        <div class="payment-item">
          <div class="payment-dot ${n}"></div>
          <div style="flex:1; margin-left:10px;">
            <div style="font-weight:600; font-size:14px;">${e.name}</div>
            <div class="text-xs text-muted">${j(e.date)} · ${r}</div>
          </div>
          <div style="font-weight:700; color:var(--danger);">${k(e.amount)}</div>
        </div>
      `}).join(``):`
      <div class="empty-state">
        <div class="empty-state-icon">📅</div>
        <div class="empty-state-title">Нет платежей</div>
        <div class="empty-state-text">Добавьте карты и долги чтобы видеть календарь платежей</div>
      </div>
    `}renderForecast(e){let t=e.monthly_income||0,n=(e.monthly_expenses||[]).reduce((e,t)=>e+(t.amount||0),0),r=e.cards||[],i=e.debts||[],a=r.reduce((e,t)=>e+(t.min_payment||0),0)+i.reduce((e,t)=>e+(t.monthly_payment||0),0),o=t-n,s=o-a,c=r.filter(e=>e.grace_period_end).sort((e,t)=>new Date(e.grace_period_end)-new Date(t.grace_period_end))[0],l=c?A(c.grace_period_end):null,u=c?Math.max(0,c.debt-o):0,d=i.map(e=>{if(!e.monthly_payment||e.monthly_payment<=0)return null;let t=Math.ceil(e.amount/e.monthly_payment),n=new Date;return n.setMonth(n.getMonth()+t),{name:e.creditor,months:t,date:n.toLocaleDateString(`ru`,{month:`long`,year:`numeric`})}}).filter(Boolean);return`
      <div class="card" style="margin-bottom:12px;">
        <div class="card-title">📊 Денежный поток</div>
        <div style="margin-top:10px; display:flex; flex-direction:column; gap:8px;">
          <div style="display:flex; justify-content:space-between;"><span class="text-secondary">Доход</span><span style="color:var(--success); font-weight:700;">${k(t)}</span></div>
          <div style="display:flex; justify-content:space-between;"><span class="text-secondary">Расходы</span><span style="color:var(--danger); font-weight:700;">${k(n)}</span></div>
          <div class="divider" style="margin:4px 0;"></div>
          <div style="display:flex; justify-content:space-between;"><span class="text-secondary">Свободные деньги</span><span style="color:${o>=0?`var(--success)`:`var(--danger)`}; font-weight:800; font-size:18px;">${k(o)}</span></div>
          <div style="display:flex; justify-content:space-between;"><span class="text-secondary">После мин. платежей</span><span style="color:${s>=0?`var(--success)`:`var(--danger)`}; font-weight:700;">${k(s)}</span></div>
        </div>
      </div>

      ${c?`
      <div class="card warning-card" style="margin-bottom:12px;">
        <div class="card-title">⚡ Срочно</div>
        <div style="margin-top:8px;">
          <div style="font-size:15px; font-weight:600;">Сегодня главный приоритет — закрыть карту ${c.bank} ${l===null?``:`до ${j(c.grace_period_end)}`}</div>
          ${u>0?`<div class="text-secondary text-sm mt-8">Нужно дополнительно заработать: <b style="color:var(--warning);">${k(u)}</b></div>`:`<div class="text-secondary text-sm mt-8" style="color:var(--success);">Денег достаточно ✓</div>`}
        </div>
      </div>
      `:``}

      ${d.length>0?`
      <div class="card" style="margin-bottom:12px;">
        <div class="card-title">🎯 Дата свободы от долга</div>
        <div style="margin-top:10px; display:flex; flex-direction:column; gap:8px;">
          ${d.map(e=>`
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span class="text-secondary" style="font-size:14px;">${e.name}</span>
              <div style="text-align:right;">
                <div style="font-weight:600; font-size:14px;">${e.date}</div>
                <div class="text-xs text-muted">${e.months} мес.</div>
              </div>
            </div>
          `).join(``)}
        </div>
      </div>
      `:``}

      <button class="btn btn-secondary btn-full" id="add-expense-btn">+ Добавить расход</button>
    `}renderAnalytics(e){let t=e.cards||[],n=e.debts||[],r=e.assets||[],i=e.liabilities||[],a=e.monthly_expenses||[],o=e.monthly_income||0,s=[...t.map(e=>({name:e.bank,amount:e.debt||0})),...n.map(e=>({name:e.creditor,amount:e.amount||0}))].filter(e=>e.amount>0),c=s.reduce((e,t)=>e+t.amount,0),l=r.reduce((e,t)=>e+(t.value||0),0),u=i.reduce((e,t)=>e+(t.amount||0),0),d=a.reduce((e,t)=>e+(t.amount||0),0),f=l-u-c,p=[`#6366F1`,`#22C55E`,`#F59E0B`,`#EF4444`,`#8B5CF6`,`#EC4899`,`#14B8A6`],m=``;if(s.length>0){let e=0,t=s.map((t,n)=>{let r=t.amount/c*100,i=r/100*360,a=`conic-gradient(${p[n%p.length]} ${e}deg ${e+i}deg, transparent ${e+i}deg)`;return e+=i,{...t,pct:Math.round(r),color:p[n%p.length],s:a}});s.map((e,t)=>e.amount/c*360);let n=0;m=`
        <div style="display:flex; flex-direction:column; align-items:center; margin-bottom:16px;">
          <div style="width:120px; height:120px; border-radius:50%; background: conic-gradient(${s.map((e,t)=>{let r=e.amount/c*360,i=`${p[t%p.length]} ${n}deg ${n+r}deg`;return n+=r,i}).join(`,`)}); margin-bottom:16px;"></div>
          <div style="display:flex; flex-direction:column; gap:6px; width:100%;">
            ${t.map(e=>`
              <div style="display:flex; align-items:center; justify-content:space-between;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <div style="width:12px; height:12px; border-radius:50%; background:${e.color}; flex-shrink:0;"></div>
                  <span class="text-sm">${e.name}</span>
                </div>
                <div style="text-align:right;">
                  <span style="font-weight:700; font-size:14px;">${k(e.amount)}</span>
                  <span class="text-xs text-muted" style="margin-left:6px;">${e.pct}%</span>
                </div>
              </div>
            `).join(``)}
          </div>
        </div>
      `}return`
      <div class="card" style="margin-bottom:12px;">
        <div class="card-title">📊 Капитал</div>
        <div style="margin-top:10px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
            <span class="text-secondary">Активы</span>
            <span style="color:var(--success); font-weight:700;">${k(l)}</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
            <span class="text-secondary">Обязательства</span>
            <span style="color:var(--danger); font-weight:700;">${k(u+c)}</span>
          </div>
          <div class="divider" style="margin:8px 0;"></div>
          <div style="display:flex; justify-content:space-between;">
            <span style="font-weight:600;">Чистый капитал</span>
            <span style="font-weight:800; font-size:18px; color:${f>=0?`var(--success)`:`var(--danger)`};">${k(f)}</span>
          </div>
        </div>
      </div>

      ${s.length>0?`
      <div class="card" style="margin-bottom:12px;">
        <div class="card-title">Долги по кредиторам</div>
        <div style="margin-top:12px;">
          ${m}
          ${s.map(e=>`
            <div style="margin-bottom:10px;">
              <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                <span class="text-sm">${e.name}</span>
                <span class="text-sm font-bold">${k(e.amount)}</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill danger" style="width:${Math.round(e.amount/c*100)}%"></div>
              </div>
            </div>
          `).join(``)}
        </div>
      </div>
      `:`<div class="empty-state"><div class="empty-state-icon">📈</div><div class="empty-state-title">Нет данных для аналитики</div></div>`}

      ${a.length>0?`
      <div class="card" style="margin-bottom:12px;">
        <div class="card-title">💸 Расходы по статьям</div>
        <div style="margin-top:12px;">
          ${a.map(e=>{let t=d>0?Math.round(e.amount/d*100):0;return`
              <div style="margin-bottom:10px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                  <span class="text-sm">${e.name}</span>
                  <span class="text-xs text-muted">${k(e.amount)} · ${t}%</span>
                </div>
                <div class="progress-bar" style="margin-top:0;">
                  <div class="progress-fill warning" style="width:${t}%"></div>
                </div>
              </div>
            `}).join(``)}
          <div class="divider" style="margin:8px 0;"></div>
          <div style="display:flex; justify-content:space-between;">
            <span class="text-secondary">Всего расходов</span>
            <span style="font-weight:700; color:var(--danger);">${k(d)}</span>
          </div>
          ${o>0?`
          <div style="display:flex; justify-content:space-between; margin-top:6px;">
            <span class="text-secondary">% от дохода</span>
            <span style="font-weight:700; color:${d/o>.8?`var(--danger)`:d/o>.6?`var(--warning)`:`var(--success)`};">
              ${Math.round(d/o*100)}%
            </span>
          </div>
          `:``}
        </div>
      </div>
      `:``}

      <button class="btn btn-secondary btn-full" id="add-asset-btn" style="margin-top:4px;">+ Добавить актив</button>
      <button class="btn btn-secondary btn-full" id="add-liability-btn" style="margin-top:8px;">+ Добавить обязательство</button>
    `}bindTabEvents(e){let t=this.el.querySelector(`#tab-content`);t&&(t.querySelector(`#add-card-btn`)?.addEventListener(`click`,()=>this.addCard()),t.querySelector(`#add-debt-btn`)?.addEventListener(`click`,()=>this.addDebt()),t.querySelector(`#add-expense-btn`)?.addEventListener(`click`,()=>this.addExpense()),t.querySelector(`#add-asset-btn`)?.addEventListener(`click`,()=>this.addAsset()),t.querySelector(`#add-liability-btn`)?.addEventListener(`click`,()=>this.addLiability()),t.querySelector(`#toggle-method`)?.addEventListener(`click`,()=>{let e=localStorage.getItem(`debt_method`)||`avalanche`;localStorage.setItem(`debt_method`,e===`avalanche`?`snowball`:`avalanche`),this.el.querySelector(`#tab-content`).innerHTML=this.renderDebts(a.get(`finance`)||{}),this.bindTabEvents(a.get(`finance`)||{})}),t.querySelectorAll(`[data-del-card]`).forEach(e=>{e.addEventListener(`click`,()=>{let t=parseInt(e.dataset.delCard),n=a.get(`finance.cards`)||[];n.splice(t,1),a.set(`finance.cards`,n),this.draw(),o(`Карта удалена`)})}),t.querySelectorAll(`[data-del-debt]`).forEach(e=>{e.addEventListener(`click`,()=>{let t=parseInt(e.dataset.delDebt),n=a.get(`finance.debts`)||[];n.splice(t,1),a.set(`finance.debts`,n),this.draw(),o(`Долг удалён`)})}))}editIncome(){let e=a.get(`finance.monthly_income`)||0,t=document.createElement(`div`);t.innerHTML=`
      <div class="input-group">
        <label class="input-label">Месячный доход (₽)</label>
        <input class="input" id="income-input" type="number" value="${e}" placeholder="100000">
      </div>
    `,c({title:`Месячный доход`,content:t,actions:[{label:`Сохранить`,cls:`btn-primary`,onClick:e=>{let t=parseFloat(e.querySelector(`#income-input`).value)||0;a.set(`finance.monthly_income`,t),this.draw(),u(),o(`Доход обновлён ✓`)}},{label:`Отмена`,cls:`btn-secondary`,onClick:()=>u()}]})}addCard(){let e=document.createElement(`div`);e.innerHTML=`
      <div class="input-group"><label class="input-label">Банк</label><input class="input" id="c-bank" placeholder="Т-Банк"></div>
      <div class="input-group"><label class="input-label">Лимит (₽)</label><input class="input" id="c-limit" type="number" placeholder="100000"></div>
      <div class="input-group"><label class="input-label">Текущий долг (₽)</label><input class="input" id="c-debt" type="number" placeholder="50000"></div>
      <div class="input-group"><label class="input-label">Конец льготного периода</label><input class="input" id="c-grace" type="date"></div>
      <div class="input-group"><label class="input-label">Минимальный платёж (₽)</label><input class="input" id="c-min" type="number" placeholder="2500"></div>
    `,c({title:`Новая карта`,content:e,actions:[{label:`Добавить`,cls:`btn-primary`,onClick:e=>{let t={bank:e.querySelector(`#c-bank`).value.trim(),limit:parseFloat(e.querySelector(`#c-limit`).value)||0,debt:parseFloat(e.querySelector(`#c-debt`).value)||0,grace_period_end:e.querySelector(`#c-grace`).value,min_payment:parseFloat(e.querySelector(`#c-min`).value)||0};t.bank&&(a.update(`finance.cards`,e=>[...e||[],t]),this.draw(),u(),o(`Карта добавлена ✓`))}},{label:`Отмена`,cls:`btn-secondary`,onClick:()=>u()}]})}addDebt(){let e=document.createElement(`div`);e.innerHTML=`
      <div class="input-group"><label class="input-label">Кредитор</label><input class="input" id="d-cred" placeholder="Банк / человек"></div>
      <div class="input-group"><label class="input-label">Сумма (₽)</label><input class="input" id="d-amount" type="number" placeholder="200000"></div>
      <div class="input-group"><label class="input-label">Ставка (%)</label><input class="input" id="d-rate" type="number" placeholder="19.9" step="0.1"></div>
      <div class="input-group"><label class="input-label">Ежемесячный платёж (₽)</label><input class="input" id="d-payment" type="number" placeholder="5000"></div>
      <div class="input-group"><label class="input-label">День платежа (1-28)</label><input class="input" id="d-day" type="number" min="1" max="28" placeholder="15"></div>
    `,c({title:`Новый долг`,content:e,actions:[{label:`Добавить`,cls:`btn-primary`,onClick:e=>{let t={creditor:e.querySelector(`#d-cred`).value.trim(),amount:parseFloat(e.querySelector(`#d-amount`).value)||0,initial_amount:parseFloat(e.querySelector(`#d-amount`).value)||0,rate:parseFloat(e.querySelector(`#d-rate`).value)||0,monthly_payment:parseFloat(e.querySelector(`#d-payment`).value)||0,payment_day:parseInt(e.querySelector(`#d-day`).value)||null};t.creditor&&(a.update(`finance.debts`,e=>[...e||[],t]),this.draw(),u(),o(`Долг добавлен ✓`))}},{label:`Отмена`,cls:`btn-secondary`,onClick:()=>u()}]})}addExpense(){let e=document.createElement(`div`);e.innerHTML=`
      <div class="input-group"><label class="input-label">Название</label><input class="input" id="e-name" placeholder="Аренда / еда / транспорт"></div>
      <div class="input-group"><label class="input-label">Сумма в месяц (₽)</label><input class="input" id="e-amount" type="number" placeholder="20000"></div>
    `,c({title:`Регулярный расход`,content:e,actions:[{label:`Добавить`,cls:`btn-primary`,onClick:e=>{let t={name:e.querySelector(`#e-name`).value.trim(),amount:parseFloat(e.querySelector(`#e-amount`).value)||0};t.name&&(a.update(`finance.monthly_expenses`,e=>[...e||[],t]),this.draw(),u(),o(`Расход добавлен ✓`))}},{label:`Отмена`,cls:`btn-secondary`,onClick:()=>u()}]})}addAsset(){let e=document.createElement(`div`);e.innerHTML=`
      <div class="input-group"><label class="input-label">Актив</label><input class="input" id="a-name" placeholder="Автомобиль / депозит"></div>
      <div class="input-group"><label class="input-label">Стоимость (₽)</label><input class="input" id="a-value" type="number" placeholder="500000"></div>
    `,c({title:`Новый актив`,content:e,actions:[{label:`Добавить`,cls:`btn-primary`,onClick:e=>{let t={name:e.querySelector(`#a-name`).value.trim(),value:parseFloat(e.querySelector(`#a-value`).value)||0};t.name&&(a.update(`finance.assets`,e=>[...e||[],t]),this.draw(),u(),o(`Актив добавлен ✓`))}},{label:`Отмена`,cls:`btn-secondary`,onClick:()=>u()}]})}addLiability(){let e=document.createElement(`div`);e.innerHTML=`
      <div class="input-group"><label class="input-label">Обязательство</label><input class="input" id="l-name" placeholder="Ипотека / рассрочка"></div>
      <div class="input-group"><label class="input-label">Сумма (₽)</label><input class="input" id="l-amount" type="number" placeholder="1000000"></div>
    `,c({title:`Новое обязательство`,content:e,actions:[{label:`Добавить`,cls:`btn-primary`,onClick:e=>{let t={name:e.querySelector(`#l-name`).value.trim(),amount:parseFloat(e.querySelector(`#l-amount`).value)||0};t.name&&(a.update(`finance.liabilities`,e=>[...e||[],t]),this.draw(),u(),o(`Обязательство добавлено ✓`))}},{label:`Отмена`,cls:`btn-secondary`,onClick:()=>u()}]})}},M=[{key:`idea`,label:`💡 Идея`},{key:`task`,label:`✅ Задача`},{key:`buy`,label:`🛒 Покупка`},{key:`other`,label:`📌 Другое`}],le=[`all`,`idea`,`task`,`buy`,`other`],ue={all:`Все`,idea:`Идеи`,task:`Задачи`,buy:`Покупки`,other:`Другое`};function de(){return new Date().toISOString().split(`T`)[0]}var fe=class{constructor(){this.selectedCat=`other`,this.activeFilter=`all`,this.showReminder=!1}render(){let e=document.createElement(`div`);return this.el=e,this.draw(),e}draw(){let e=a.get(`inbox`)||[],t=this.activeFilter===`all`?e:e.filter(e=>e.category===this.activeFilter),n=de();this.el.innerHTML=`
      <div class="page-title" style="margin-bottom:16px;">📥 Inbox</div>

      <div class="inbox-compose">
        <textarea class="input" id="inbox-text" placeholder="Запишу мысль... (любая идея, задача, покупка)" rows="3"></textarea>
        <div class="inbox-categories" id="cat-btns">
          ${M.map(e=>`
            <button class="cat-btn ${this.selectedCat===e.key?`active`:``}" data-cat="${e.key}">${e.label}</button>
          `).join(``)}
        </div>
        <div style="display:flex; gap:8px; margin-top:12px; align-items:center;">
          <button class="btn btn-primary" style="flex:1;" id="add-inbox-btn">Добавить</button>
          <button class="btn btn-ghost btn-sm ${this.showReminder?`text-accent`:`text-muted`}" id="reminder-toggle-btn" title="Добавить напоминание">🔔</button>
        </div>
        <div id="reminder-section" style="display:${this.showReminder?`flex`:`none`}; gap:8px; margin-top:10px;">
          <input class="input" id="reminder-date" type="date" style="flex:1;" min="${n}" value="${n}">
          <input class="input" id="reminder-time" type="time" style="flex:1;" value="09:00">
        </div>
      </div>

      <div class="filter-tabs" id="filter-tabs">
        ${le.map(t=>`
          <button class="filter-tab ${this.activeFilter===t?`active`:``}" data-filter="${t}">${ue[t]} ${t===`all`?`(${e.length})`:`(${e.filter(e=>e.category===t).length})`}</button>
        `).join(``)}
      </div>

      <div id="inbox-list">
        ${t.length===0?`
          <div class="empty-state">
            <div class="empty-state-icon">🧠</div>
            <div class="empty-state-title">Inbox пуст</div>
            <div class="empty-state-text">Записывай любые мысли — вечером разберёшь по разделам</div>
          </div>
        `:t.map((t,n)=>this.renderItem(t,e.indexOf(t))).join(``)}
      </div>
    `,this.el.querySelector(`#add-inbox-btn`).addEventListener(`click`,()=>this.addItem()),this.el.querySelector(`#inbox-text`).addEventListener(`keydown`,e=>{e.key===`Enter`&&e.ctrlKey&&this.addItem()}),this.el.querySelector(`#reminder-toggle-btn`).addEventListener(`click`,()=>{this.showReminder=!this.showReminder;let e=this.el.querySelector(`#reminder-section`),t=this.el.querySelector(`#reminder-toggle-btn`);e.style.display=this.showReminder?`flex`:`none`,t.className=`btn btn-ghost btn-sm ${this.showReminder?`text-accent`:`text-muted`}`}),this.el.querySelectorAll(`[data-cat]`).forEach(e=>{e.addEventListener(`click`,()=>{this.selectedCat=e.dataset.cat,this.el.querySelectorAll(`[data-cat]`).forEach(e=>e.classList.toggle(`active`,e.dataset.cat===this.selectedCat))})}),this.el.querySelectorAll(`[data-filter]`).forEach(e=>{e.addEventListener(`click`,()=>{this.activeFilter=e.dataset.filter,this.draw()})}),this.el.querySelector(`#inbox-list`).addEventListener(`click`,e=>{let t=e.target.closest(`[data-del]`);if(t){let e=parseInt(t.dataset.del),n=a.get(`inbox`)||[];n.splice(e,1),a.set(`inbox`,n),this.draw(),o(`Запись удалена`)}})}renderItem(e,t){let n=M.find(t=>t.key===e.category)||M[3],r=new Date(e.created).toLocaleDateString(`ru`,{day:`numeric`,month:`short`,hour:`2-digit`,minute:`2-digit`}),i=e.reminder?.date,a=i?`${e.reminder.date} ${e.reminder.time||`09:00`}`:``;return`
      <div class="list-item">
        <div style="font-size:20px; padding-top:2px;">${n.label.split(` `)[0]}</div>
        <div class="list-item-body">
          <div class="list-item-title" style="white-space:pre-wrap; line-height:1.4;">${e.text}</div>
          <div class="list-item-sub">${r}${i?` · 🔔 ${a}`:``}</div>
        </div>
        <button class="btn btn-ghost btn-icon text-muted" data-del="${t}" style="flex-shrink:0;">✕</button>
      </div>
    `}addItem(){let e=this.el.querySelector(`#inbox-text`),t=e.value.trim();if(!t){o(`Введите мысль`);return}let n=this.el.querySelector(`#reminder-date`)?.value,r=this.el.querySelector(`#reminder-time`)?.value,i=this.showReminder&&n?{date:n,time:r||`09:00`}:null,s=a.get(`inbox`)||[];s.unshift({text:t,category:this.selectedCat,created:Date.now(),reminder:i}),a.set(`inbox`,s),e.value=``,o(i?`Записано ✓ · 🔔 ${i.date} ${i.time}`:`Записано ✓`),this.draw()}},pe=class{render(){let e=document.createElement(`div`);return this.el=e,this.draw(),e}draw(){let e=a.get(`goals`)||{},t=e.main||{},n=e.subgoals||[],r=t.deadline?Math.ceil((new Date(t.deadline)-new Date)/864e5):null;this.el.innerHTML=`
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
        <div class="page-title">🎯 Цели</div>
        <button class="btn btn-ghost btn-sm text-accent" id="edit-goal-btn">Изменить</button>
      </div>

      ${t.title?`
      <div class="goal-hero">
        <div class="goal-title-large">${t.title}</div>
        ${r===null?``:`<div class="badge badge-${r<7?`danger`:r<30?`warning`:`accent`}" style="margin-bottom:12px;">📅 ${r>0?`${r} дней осталось`:`Дедлайн прошёл`}</div>`}
        <div class="goal-progress-text">
          <span>Прогресс</span>
          <span style="font-weight:700;">${t.progress||0}%</span>
        </div>
        <div class="progress-bar" style="height:8px; margin-bottom:16px;">
          <div class="progress-fill" style="width:${t.progress||0}%; background: linear-gradient(90deg, var(--accent), #8B5CF6);"></div>
        </div>
        <div style="display:flex; gap:8px; justify-content:center;">
          ${[10,25,50,75,90,100].map(e=>`<button class="btn btn-sm ${t.progress===e?`btn-primary`:`btn-secondary`}" data-pct="${e}">${e}%</button>`).join(``)}
        </div>
        ${t.next_step?`
          <div style="margin-top:16px; padding-top:16px; border-top:1px solid rgba(255,255,255,0.1); text-align:left;">
            <div class="text-xs text-muted" style="margin-bottom:4px;">СЛЕДУЮЩИЙ ШАГ</div>
            <div style="font-size:15px; color:var(--text);">→ ${t.next_step}</div>
          </div>
        `:``}
        ${t.motivation?`
          <div style="margin-top:12px; font-size:13px; color:var(--text-muted); font-style:italic;">"${t.motivation}"</div>
        `:``}
      </div>
      `:`
      <div class="card accent-card" style="margin-bottom:20px; text-align:center; padding:32px;">
        <div style="font-size:40px; margin-bottom:12px;">🎯</div>
        <div style="font-size:16px; font-weight:600; margin-bottom:8px;">Поставьте главную цель</div>
        <div class="text-secondary text-sm" style="margin-bottom:16px;">Одна большая цель — максимум концентрации</div>
        <button class="btn btn-primary" id="set-goal-inline-btn">Поставить цель</button>
      </div>
      `}

      <div class="section-header" style="margin-top:${t.title?`20px`:`0`};">
        <span class="section-title">Подцели</span>
        <button class="btn btn-ghost btn-sm text-accent" id="add-subgoal-btn">+ Добавить</button>
      </div>

      <div id="subgoals-list">
        ${n.length===0?`
          <div class="empty-state" style="padding:24px 0;">
            <div class="empty-state-text">Разбейте большую цель на конкретные шаги</div>
          </div>
        `:n.map((e,t)=>`
          <div class="list-item">
            <div class="checkbox ${e.done?`checked`:``}" data-sub="${t}">${e.done?`✓`:``}</div>
            <div class="list-item-body">
              <div class="list-item-title ${e.done?`line-through text-muted`:``}">${e.title}</div>
              ${e.deadline?`<div class="list-item-sub">до ${new Date(e.deadline).toLocaleDateString(`ru`,{day:`numeric`,month:`long`})}</div>`:``}
            </div>
            <button class="btn btn-ghost btn-icon text-muted" data-del-sub="${t}">✕</button>
          </div>
        `).join(``)}
      </div>
    `,this.el.querySelector(`#edit-goal-btn`)?.addEventListener(`click`,()=>this.editGoal(t)),this.el.querySelector(`#set-goal-inline-btn`)?.addEventListener(`click`,()=>this.editGoal(t)),this.el.querySelector(`#add-subgoal-btn`)?.addEventListener(`click`,()=>this.addSubgoal()),this.el.querySelectorAll(`[data-pct]`).forEach(e=>{e.addEventListener(`click`,()=>{a.set(`goals.main.progress`,parseInt(e.dataset.pct)),this.draw(),o(`Прогресс обновлён ✓`)})}),this.el.querySelector(`#subgoals-list`)?.addEventListener(`click`,e=>{let t=e.target.closest(`[data-sub]`);if(t){let e=parseInt(t.dataset.sub),n=a.get(`goals.subgoals`)||[];n[e].done=!n[e].done,a.set(`goals.subgoals`,n),this.draw()}let n=e.target.closest(`[data-del-sub]`);if(n){let e=parseInt(n.dataset.delSub),t=a.get(`goals.subgoals`)||[];t.splice(e,1),a.set(`goals.subgoals`,t),this.draw(),o(`Подцель удалена`)}})}editGoal(e){let t=document.createElement(`div`);t.innerHTML=`
      <div class="input-group"><label class="input-label">Главная цель</label><input class="input" id="g-title" placeholder="Закрыть все кредиты" value="${e.title||``}"></div>
      <div class="input-group"><label class="input-label">Дедлайн</label><input class="input" id="g-deadline" type="date" value="${e.deadline||``}"></div>
      <div class="input-group"><label class="input-label">Следующий шаг</label><input class="input" id="g-next" placeholder="Что конкретно делаю сегодня" value="${e.next_step||``}"></div>
      <div class="input-group"><label class="input-label">Мотивация (почему это важно)</label><textarea class="input" id="g-motiv" placeholder="Ради чего...">${e.motivation||``}</textarea></div>
    `,c({title:`Главная цель`,content:t,actions:[{label:`Сохранить`,cls:`btn-primary`,onClick:t=>{let n=t.querySelector(`#g-title`).value.trim();n&&(a.set(`goals.main`,{title:n,deadline:t.querySelector(`#g-deadline`).value,next_step:t.querySelector(`#g-next`).value.trim(),motivation:t.querySelector(`#g-motiv`).value.trim(),progress:e.progress||0}),this.draw(),u(),o(`Цель сохранена ✓`))}},{label:`Отмена`,cls:`btn-secondary`,onClick:()=>u()}]}),setTimeout(()=>t.querySelector(`#g-title`)?.focus(),100)}addSubgoal(){let e=document.createElement(`div`);e.innerHTML=`
      <div class="input-group"><label class="input-label">Подцель</label><input class="input" id="sg-title" placeholder="Конкретный шаг"></div>
      <div class="input-group"><label class="input-label">Дедлайн (необязательно)</label><input class="input" id="sg-deadline" type="date"></div>
    `,c({title:`Новая подцель`,content:e,actions:[{label:`Добавить`,cls:`btn-primary`,onClick:e=>{let t=e.querySelector(`#sg-title`).value.trim();t&&(a.update(`goals.subgoals`,n=>[...n||[],{title:t,deadline:e.querySelector(`#sg-deadline`).value,done:!1}]),this.draw(),u(),o(`Подцель добавлена ✓`))}},{label:`Отмена`,cls:`btn-secondary`,onClick:()=>u()}]}),setTimeout(()=>e.querySelector(`#sg-title`)?.focus(),100)}},me=[{hash:`#/work`,icon:`💼`,title:`Работа`,desc:`Продажи и идеи`},{hash:`#/relations`,icon:`❤️`,title:`Отношения`,desc:`Свидания и планы`},{hash:`#/friends`,icon:`👥`,title:`Друзья`,desc:`Контакты и общение`},{hash:`#/health`,icon:`🏃`,title:`Здоровье`,desc:`Сон, вес, энергия`},{hash:`#/habits`,icon:`✅`,title:`Привычки`,desc:`Ежедневные ритуалы`},{hash:`#/weekly`,icon:`📋`,title:`Обзор недели`,desc:`Рефлексия и план`},{hash:`#/stats`,icon:`📊`,title:`Статистика`,desc:`Графики и тренды`}],he=class{render(){let e=document.createElement(`div`);return e.innerHTML=`
      <div class="page-title" style="margin-bottom:20px;">Все разделы</div>
      <div class="more-grid">
        ${me.map(e=>`
          <div class="more-card" data-nav="${e.hash}">
            <div class="more-card-icon">${e.icon}</div>
            <div class="more-card-title">${e.title}</div>
            <div class="text-xs text-muted">${e.desc}</div>
          </div>
        `).join(``)}
      </div>
    `,e.querySelectorAll(`[data-nav]`).forEach(e=>{e.addEventListener(`click`,()=>Q(e.dataset.nav))}),e}},N;function ge(e,t=500){clearTimeout(N),N=setTimeout(e,t)}var _e=class{render(){let e=document.createElement(`div`);return this.el=e,this.draw(),e}draw(){let e=a.get(`work`)||{},t=e.plan>0?Math.min(100,Math.round(e.fact/e.plan*100)):0,n=e=>Number(e||0).toLocaleString(`ru`)+` ₽`;this.el.innerHTML=`
      <div class="page-title" style="margin-bottom:16px;">💼 Работа</div>

      <div class="metric-grid">
        <div class="metric-card">
          <div class="metric-value">${n(e.sales_today)}</div>
          <div class="metric-label">Продажи сегодня</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${n(e.profit)}</div>
          <div class="metric-label">Прибыль</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${n(e.avg_check)}</div>
          <div class="metric-label">Средний чек</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${e.conversion||0}%</div>
          <div class="metric-label">Конверсия</div>
        </div>
      </div>

      <button class="btn btn-secondary btn-sm" id="edit-metrics-btn" style="margin-bottom:16px;">✏️ Обновить показатели</button>

      <div class="card" style="margin-bottom:16px;">
        <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
          <div>
            <div class="text-xs text-muted">ПЛАН</div>
            <div style="font-size:18px; font-weight:700;">${n(e.plan)}</div>
          </div>
          <div style="text-align:right;">
            <div class="text-xs text-muted">ФАКТ</div>
            <div style="font-size:18px; font-weight:700; color:${t>=100?`var(--success)`:t>=70?`var(--warning)`:`var(--text)`};">${n(e.fact)}</div>
          </div>
        </div>
        <div class="progress-bar" style="height:8px; margin-bottom:6px;">
          <div class="progress-fill ${t>=100?`success`:t>=50?``:`danger`}" style="width:${t}%"></div>
        </div>
        <div class="text-xs text-muted">${t}% от плана</div>
      </div>

      <div class="card" style="margin-bottom:16px;">
        <div class="section-block-title">🚀 Что увеличить завтра</div>
        <textarea class="input" id="tomorrow-input" placeholder="Конкретная идея на завтра..." rows="2">${e.tomorrow||``}</textarea>
      </div>

      <div class="section-header">
        <span class="section-title">💡 Идеи</span>
        <button class="btn btn-ghost btn-sm text-accent" data-add-list="ideas">+ Добавить</button>
      </div>
      <div id="ideas-list">${this.renderList(e.ideas||[],`ideas`)}</div>

      <div class="section-header">
        <span class="section-title">⚠️ Проблемы</span>
        <button class="btn btn-ghost btn-sm text-accent" data-add-list="problems">+ Добавить</button>
      </div>
      <div id="problems-list">${this.renderList(e.problems||[],`problems`)}</div>

      <div class="section-header">
        <span class="section-title">🚫 Что тормозит продажи</span>
        <button class="btn btn-ghost btn-sm text-accent" data-add-list="blockers">+ Добавить</button>
      </div>
      <div id="blockers-list">${this.renderList(e.blockers||[],`blockers`)}</div>
    `,this.el.querySelector(`#edit-metrics-btn`)?.addEventListener(`click`,()=>this.editMetrics(e)),this.el.querySelector(`#tomorrow-input`)?.addEventListener(`input`,e=>{ge(()=>{a.set(`work.tomorrow`,e.target.value),o(`Сохранено ✓`)})}),this.el.querySelectorAll(`[data-add-list]`).forEach(e=>{e.addEventListener(`click`,()=>this.addListItem(e.dataset.addList))}),[`ideas`,`problems`,`blockers`].forEach(e=>{this.el.querySelector(`#${e}-list`)?.addEventListener(`click`,t=>{let n=t.target.closest(`[data-del]`);if(n){let t=parseInt(n.dataset.del);a.update(`work.${e}`,e=>{let n=[...e];return n.splice(t,1),n}),this.draw(),o(`Удалено`)}})})}renderList(e,t){return e.length?e.map((e,t)=>`
      <div class="list-item">
        <div class="list-item-body">
          <div class="list-item-title">${typeof e==`string`?e:e.text}</div>
        </div>
        <button class="btn btn-ghost btn-icon text-muted" data-del="${t}">✕</button>
      </div>
    `).join(``):`<div class="text-muted text-sm" style="padding:8px 0;">Пусто</div>`}editMetrics(e){let t=e=>e||``,n=document.createElement(`div`);n.innerHTML=`
      <div class="input-group"><label class="input-label">Продажи сегодня (₽)</label><input class="input" id="m-sales" type="number" value="${t(e.sales_today)}" placeholder="0"></div>
      <div class="input-group"><label class="input-label">Прибыль (₽)</label><input class="input" id="m-profit" type="number" value="${t(e.profit)}" placeholder="0"></div>
      <div class="input-group"><label class="input-label">Средний чек (₽)</label><input class="input" id="m-check" type="number" value="${t(e.avg_check)}" placeholder="0"></div>
      <div class="input-group"><label class="input-label">Конверсия (%)</label><input class="input" id="m-conv" type="number" value="${t(e.conversion)}" placeholder="0"></div>
      <div class="input-group"><label class="input-label">План месяца (₽)</label><input class="input" id="m-plan" type="number" value="${t(e.plan)}" placeholder="0"></div>
      <div class="input-group"><label class="input-label">Факт месяца (₽)</label><input class="input" id="m-fact" type="number" value="${t(e.fact)}" placeholder="0"></div>
    `,c({title:`Показатели`,content:n,actions:[{label:`Сохранить`,cls:`btn-primary`,onClick:e=>{let t={sales_today:parseFloat(e.querySelector(`#m-sales`).value)||0,profit:parseFloat(e.querySelector(`#m-profit`).value)||0,avg_check:parseFloat(e.querySelector(`#m-check`).value)||0,conversion:parseFloat(e.querySelector(`#m-conv`).value)||0,plan:parseFloat(e.querySelector(`#m-plan`).value)||0,fact:parseFloat(e.querySelector(`#m-fact`).value)||0},n=a.get(`work`)||{};a.set(`work`,{...n,...t}),this.draw(),u(),o(`Показатели обновлены ✓`)}},{label:`Отмена`,cls:`btn-secondary`,onClick:()=>u()}]})}addListItem(e){let t={ideas:`Идея`,problems:`Проблема`,blockers:`Что тормозит`},n=document.createElement(`div`);n.innerHTML=`
      <div class="input-group">
        <label class="input-label">${t[e]||`Запись`}</label>
        <input class="input" id="list-input" placeholder="Опишите...">
      </div>
    `,c({title:`Добавить: ${t[e]}`,content:n,actions:[{label:`Добавить`,cls:`btn-primary`,onClick:t=>{let n=t.querySelector(`#list-input`).value.trim();n&&(a.update(`work.${e}`,e=>[...e||[],n]),this.draw(),u(),o(`Добавлено ✓`))}},{label:`Отмена`,cls:`btn-secondary`,onClick:()=>u()}]}),setTimeout(()=>n.querySelector(`#list-input`)?.focus(),100)}};function ve(){return new Date().toISOString().split(`T`)[0]}var P=[`😫`,`😕`,`😐`,`🙂`,`😊`],ye=class{render(){let e=document.createElement(`div`);return this.el=e,this.draw(),e}draw(){let e=a.get(`health.logs`)||[],t=ve(),n=e.find(e=>e.date===t)||{date:t};[...e].sort((e,t)=>t.date.localeCompare(e.date)).slice(0,7),this.el.innerHTML=`
      <div class="page-title" style="margin-bottom:20px;">🏃 Здоровье</div>

      <div class="card" style="margin-bottom:20px;">
        <div class="section-block-title">Дневник сегодня</div>

        <div class="input-group">
          <label class="input-label">Сон (часов)</label>
          <div style="display:flex; align-items:center; gap:12px;">
            <input type="range" class="range-input" id="sleep-range" min="0" max="12" step="0.5" value="${n.sleep||0}" style="flex:1;">
            <span id="sleep-val" style="min-width:36px; font-weight:700; font-size:16px;">${n.sleep||0}ч</span>
          </div>
        </div>

        <div class="input-group" style="margin-top:14px;">
          <label class="input-label">Вес (кг)</label>
          <input class="input" id="weight-input" type="number" step="0.1" value="${n.weight||``}" placeholder="70.5" style="max-width:120px;">
        </div>

        <div class="input-group" style="margin-top:14px;">
          <label class="input-label">Вода (стаканов из 8)</label>
          <div class="water-tracker" id="water-tracker">
            ${Array.from({length:8},(e,t)=>`
              <div class="water-glass ${(n.water||0)>t?`filled`:``}" data-glass="${t+1}">💧</div>
            `).join(``)}
          </div>
        </div>

        <div class="input-group" style="margin-top:14px;">
          <label class="input-label">Настроение</label>
          <div class="mood-selector" id="mood-selector">
            ${P.map((e,t)=>`<div class="mood-btn ${n.mood===t+1?`selected`:``}" data-mood="${t+1}">${e}</div>`).join(``)}
          </div>
        </div>

        <div class="input-group" style="margin-top:14px;">
          <label class="input-label">Энергия</label>
          <div class="energy-selector" id="energy-selector">
            ${[1,2,3,4,5].map(e=>`<div class="energy-dot e${e} ${n.energy===e?`selected`:``}" data-energy="${e}" title="${e}/5"></div>`).join(``)}
          </div>
        </div>

        <div style="display:flex; gap:16px; margin-top:14px;">
          <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
            <input type="checkbox" id="workout-cb" ${n.workout?`checked`:``} style="width:18px;height:18px;accent-color:var(--accent);">
            <span class="text-sm">🏋️ Тренировка</span>
          </label>
          <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
            <input type="checkbox" id="vitamins-cb" ${n.vitamins?`checked`:``} style="width:18px;height:18px;accent-color:var(--accent);">
            <span class="text-sm">💊 Витамины</span>
          </label>
        </div>

        <button class="btn btn-primary btn-full" id="save-health-btn" style="margin-top:16px;">Сохранить дневник</button>
      </div>

      <div class="section-title" style="margin-bottom:12px;">История (7 дней)</div>
      <div class="health-week-grid">
        ${Array.from({length:7},(n,r)=>{let i=new Date;i.setDate(i.getDate()-(6-r));let a=i.toISOString().split(`T`)[0],o=e.find(e=>e.date===a)||{},s=a===t,c=s?`Сег`:[`Вс`,`Пн`,`Вт`,`Ср`,`Чт`,`Пт`,`Сб`][i.getDay()],l=o.sleep?o.sleep>=7?`#22C55E`:o.sleep>=6?`#F59E0B`:`#EF4444`:`var(--border)`,u=o.sleep?Math.min(100,o.sleep/10*100):0;return`
            <div class="health-day-col ${s?`health-day-today`:``}">
              <div class="health-day-label">${c}</div>
              <div class="health-sleep-bar-wrap" title="${o.sleep?o.sleep+`ч сна`:`нет данных`}">
                <div class="health-sleep-bar-fill" style="height:${u}%; background:${l};"></div>
              </div>
              <div class="health-sleep-num" style="color:${l}">${o.sleep||`—`}</div>
              <div class="health-day-mood">${o.mood?P[o.mood-1]:`·`}</div>
              <div class="health-day-icons">
                <span title="Тренировка" style="opacity:${o.workout?1:.2}">🏋️</span>
                <span title="Витамины" style="opacity:${o.vitamins?1:.2}">💊</span>
              </div>
            </div>
          `}).join(``)}
      </div>
    `;let r=()=>(a.get(`health.logs`)||[]).find(e=>e.date===t)||{date:t},i=e=>{let n=a.get(`health.logs`)||[],r=n.findIndex(e=>e.date===t),i={...r>=0?n[r]:{date:t},...e};r>=0?n[r]=i:n.push(i),a.set(`health.logs`,n)},s=this.el.querySelector(`#sleep-range`),c=this.el.querySelector(`#sleep-val`);s?.addEventListener(`input`,()=>{c.textContent=s.value+`ч`,i({sleep:parseFloat(s.value)})}),this.el.querySelector(`#water-tracker`)?.addEventListener(`click`,e=>{let t=e.target.closest(`[data-glass]`);if(!t)return;let n=parseInt(t.dataset.glass);i({water:(r().water||0)===n?n-1:n}),this.draw()}),this.el.querySelector(`#mood-selector`)?.addEventListener(`click`,e=>{let t=e.target.closest(`[data-mood]`);t&&(i({mood:parseInt(t.dataset.mood)}),this.el.querySelectorAll(`.mood-btn`).forEach(e=>e.classList.toggle(`selected`,e===t)))}),this.el.querySelector(`#energy-selector`)?.addEventListener(`click`,e=>{let t=e.target.closest(`[data-energy]`);t&&(i({energy:parseInt(t.dataset.energy)}),this.el.querySelectorAll(`.energy-dot`).forEach(e=>{e.classList.toggle(`selected`,parseInt(e.dataset.energy)===parseInt(t.dataset.energy))}))}),this.el.querySelector(`#save-health-btn`)?.addEventListener(`click`,()=>{i({sleep:parseFloat(this.el.querySelector(`#sleep-range`)?.value||0),weight:parseFloat(this.el.querySelector(`#weight-input`)?.value||0)||void 0,workout:this.el.querySelector(`#workout-cb`)?.checked,vitamins:this.el.querySelector(`#vitamins-cb`)?.checked}),o(`Дневник сохранён ✓`),this.draw()})}},F=[`#6366F1`,`#22C55E`,`#F59E0B`,`#EF4444`,`#8B5CF6`,`#EC4899`,`#14B8A6`,`#F97316`],be=[`💪`,`🏃`,`📚`,`💧`,`🧘`,`🚭`,`😴`,`🥗`,`🎯`,`✍️`,`🎵`,`🧹`],xe=[`Вс`,`Пн`,`Вт`,`Ср`,`Чт`,`Пт`,`Сб`];function I(){return new Date().toISOString().split(`T`)[0]}function L(){return Array.from({length:7},(e,t)=>{let n=new Date;return n.setDate(n.getDate()-(6-t)),n.toISOString().split(`T`)[0]})}function Se(){return Array.from({length:30},(e,t)=>{let n=new Date;return n.setDate(n.getDate()-(29-t)),n.toISOString().split(`T`)[0]})}function Ce(e){if(!e?.length)return 0;let t=new Set(e),n=0,r=new Date;for(;;){let e=r.toISOString().split(`T`)[0];if(t.has(e))n++,r.setDate(r.getDate()-1);else break}return n}function we(e){let t=L().filter(t=>e?.includes(t)).length;return Math.round(t/7*100)}var Te=class{constructor(){this.view=`7d`}render(){let e=document.createElement(`div`);return this.el=e,this.draw(),e}draw(){let e=a.get(`habits`)||[],t=I(),n=L(),r=e.filter(e=>e.completions?.includes(t)).length;this.el.innerHTML=`
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
        <div class="page-title">✅ Привычки</div>
        <div style="display:flex; gap:6px;">
          ${e.length>0?`<button class="btn btn-ghost btn-sm text-accent" id="view-toggle">${this.view===`7d`?`30 дн`:`7 дн`}</button>`:``}
          <button class="btn btn-ghost btn-sm text-accent" id="add-habit-btn">+ Добавить</button>
        </div>
      </div>

      ${e.length>0?`
        <div class="habit-summary">
          <span class="habit-summary-count">${r} из ${e.length}</span>
          <span class="habit-summary-label">выполнено сегодня</span>
          <div class="habit-summary-bar">
            <div class="habit-summary-fill" style="width:${e.length>0?Math.round(r/e.length*100):0}%"></div>
          </div>
        </div>
      `:``}

      ${e.length===0?`
        <div class="empty-state">
          <div class="empty-state-icon">🔥</div>
          <div class="empty-state-title">Нет привычек</div>
          <div class="empty-state-text">Добавьте ежедневные ритуалы которые хотите закрепить</div>
          <div class="habit-suggestions">
            ${[`💪 Тренировка`,`📚 Читать`,`💧 Вода`,`😴 Спать до 23:00`,`🚭 Не курить`].map(e=>`
              <button class="habit-suggest-btn" data-suggest="${e}">${e}</button>
            `).join(``)}
          </div>
        </div>
      `:`
        <div id="habits-list">
          ${e.map((e,r)=>this.renderHabit(e,r,t,n)).join(``)}
        </div>
      `}
    `,this.el.querySelector(`#add-habit-btn`)?.addEventListener(`click`,()=>this.addHabit()),this.el.querySelector(`#view-toggle`)?.addEventListener(`click`,()=>{this.view=this.view===`7d`?`30d`:`7d`,this.draw()}),this.el.querySelectorAll(`[data-suggest]`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.suggest,n=t.split(` `)[0],r=t.split(` `).slice(1).join(` `);a.update(`habits`,e=>[...e||[],{name:r,emoji:n,completions:[],created:Date.now()}]),this.draw(),o(`${t} добавлена ✓`)})}),this.el.querySelector(`#habits-list`)?.addEventListener(`click`,e=>{let t=e.target.closest(`[data-toggle]`);if(t){this.toggleDay(parseInt(t.dataset.toggle),t.dataset.day||I());return}let n=e.target.closest(`[data-del-habit]`);if(n){let e=parseInt(n.dataset.delHabit);if(!confirm(`Удалить привычку?`))return;let t=a.get(`habits`)||[];t.splice(e,1),a.set(`habits`,t),this.draw(),o(`Удалено`)}})}renderHabit(e,t,n,r){let i=e.completions||[],a=Ce(i),o=we(i),s=i.includes(n),c=F[t%F.length],l=e.emoji||`✅`,u=o>=80?`🔥 Формируется`:o>=50?`📈 Постоянство`:`🔄 Заново`,d=o>=80?`var(--success)`:o>=50?`var(--warning)`:`var(--text-muted)`,f=this.view===`7d`?this.render7DayGrid(i,r,n,t,c):this.render30DayGrid(i,n,t,c);return`
      <div class="habit-card" style="border-left:3px solid ${c}; background:${c}0d;">
        <div class="habit-card-top">
          <button class="habit-big-check ${s?`done`:``}"
            style="${s?`background:${c}; border-color:${c};`:`border-color:${c}44;`}"
            data-toggle="${t}">
            ${s?`✓`:``}
          </button>
          <div class="habit-card-info">
            <div class="habit-card-name ${s?`done`:``}">${l} ${e.name}</div>
            <div class="habit-card-meta">
              ${a>0?`<span class="habit-streak-badge">🔥 ${a} ${a===1?`день`:a<5?`дня`:`дней`}</span>`:`<span style="color:var(--text-muted);font-size:12px;">Начни сегодня</span>`}
              <span class="habit-week-pct" style="color:${c}">${o}% нед.</span>
            </div>
          </div>
          <button class="btn btn-ghost btn-icon text-muted habit-del-btn" data-del-habit="${t}">✕</button>
        </div>

        ${f}

        <div class="habit-forecast" style="color:${d}">${u}</div>
      </div>
    `}render7DayGrid(e,t,n,r,i){return`
      <div class="habit-grid-row">
        ${t.map(t=>{let a=e.includes(t),o=t===n;return`
            <div class="habit-dot-wrap">
              <div class="habit-dot ${a?`done`:``} ${o?`is-today`:``}"
                style="${a?`background:${i}; border-color:${i};`:o?`border-color:${i};`:``}"
                data-toggle="${r}" data-day="${t}">
                ${a?`✓`:``}
              </div>
              <div class="habit-dot-label ${o?`today-label`:``}">${xe[new Date(t+`T12:00:00`).getDay()]}</div>
            </div>
          `}).join(``)}
      </div>
    `}render30DayGrid(e,t,n,r){return`
      <div class="habit-month-grid">
        ${Se().map(i=>{let a=e.includes(i),o=i===t;return`
            <div class="habit-month-dot ${a?`done`:``} ${o?`today`:``}"
              style="${a?`background:${r}; border-color:${r};`:o?`border-color:${r}; border-width:2px;`:``}"
              data-toggle="${n}" data-day="${i}" title="${i}"></div>
          `}).join(``)}
      </div>
    `}toggleDay(e,t){let n=a.get(`habits`)||[],r=n[e].completions||[],i=r.includes(t);n[e].completions=i?r.filter(e=>e!==t):[...r,t],a.set(`habits`,n),!i&&t===I()&&o(`${n[e].emoji||`✅`} ${n[e].name} ✓`),this.draw()}addHabit(){let e=document.createElement(`div`);e.innerHTML=`
      <div class="input-group">
        <label class="input-label">Эмодзи</label>
        <div class="emoji-picker">
          ${be.map(e=>`<button class="emoji-btn" data-emoji="${e}">${e}</button>`).join(``)}
        </div>
        <input type="hidden" id="habit-emoji" value="✅">
      </div>
      <div class="input-group">
        <label class="input-label">Название</label>
        <input class="input" id="habit-name" placeholder="Тренировка / Читать / Вода">
      </div>
    `,e.querySelectorAll(`.emoji-btn`).forEach(t=>{t.addEventListener(`click`,()=>{e.querySelectorAll(`.emoji-btn`).forEach(e=>e.classList.remove(`selected`)),t.classList.add(`selected`),e.querySelector(`#habit-emoji`).value=t.dataset.emoji})}),c({title:`Новая привычка`,content:e,actions:[{label:`Добавить`,cls:`btn-primary`,onClick:e=>{let t=e.querySelector(`#habit-name`).value.trim();if(!t){o(`Введите название`);return}let n=e.querySelector(`#habit-emoji`).value;a.update(`habits`,e=>[...e||[],{name:t,emoji:n,completions:[],created:Date.now()}]),this.draw(),u(),o(`${n} ${t} добавлена ✓`)}},{label:`Отмена`,cls:`btn-secondary`,onClick:()=>u()}]}),setTimeout(()=>e.querySelector(`#habit-name`)?.focus(),100)}},R;function Ee(e,t){clearTimeout(R),R=setTimeout(()=>{a.set(e,t)},400)}var De=class{render(){let e=document.createElement(`div`);return this.el=e,this.draw(),e}draw(){let e=a.get(`relations`)||{},t=e.last_date?Math.floor((Date.now()-new Date(e.last_date))/864e5):null,n=e.next_date?Math.ceil((new Date(e.next_date)-Date.now())/864e5):null;this.el.innerHTML=`
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <div class="page-title">❤️ Отношения</div>
      </div>

      <div class="card accent-card" style="margin-bottom:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <div>
            <input class="input" id="partner-name" placeholder="Имя партнёра" value="${e.partner_name||``}" style="background:transparent; border:none; font-size:20px; font-weight:700; padding:0; color:var(--text); width:100%;">
          </div>
        </div>
        <div style="display:flex; gap:20px;">
          ${t===null?``:`<div><div class="text-xs text-muted">ПОСЛЕДНЕЕ СВИДАНИЕ</div><div style="font-weight:600;">${t} дн. назад</div></div>`}
          ${n===null?``:`<div><div class="text-xs text-muted">СЛЕДУЮЩЕЕ</div><div style="font-weight:600; color:var(--accent);">${n>0?`через ${n} дн.`:`Сегодня!`}</div></div>`}
        </div>
      </div>

      <div class="section-block">
        <div class="section-block-title">📅 Свидания</div>
        <div class="input-group">
          <label class="input-label">Последнее свидание</label>
          <input class="input" id="last-date" type="date" value="${e.last_date||``}">
        </div>
        <div class="input-group">
          <label class="input-label">Следующее свидание</label>
          <input class="input" id="next-date" type="date" value="${e.next_date||``}">
        </div>
        <div class="input-group">
          <label class="input-label">Описание</label>
          <input class="input" id="next-date-desc" placeholder="Где / что планируем" value="${e.next_date_desc||``}">
        </div>
      </div>

      <div class="section-block">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <div class="section-block-title" style="margin-bottom:0;">💡 Идеи свиданий</div>
          <button class="btn btn-ghost btn-sm text-accent" id="add-date-idea">+ Добавить</button>
        </div>
        <div id="date-ideas-list">
          ${(e.date_ideas||[]).length===0?`<div class="text-muted text-sm">Нет идей</div>`:(e.date_ideas||[]).map((e,t)=>`
            <div class="list-item" style="padding:10px 14px;">
              <div class="list-item-body"><div class="list-item-title">${e}</div></div>
              <button class="btn btn-ghost btn-icon text-muted" data-del-idea="${t}">✕</button>
            </div>
          `).join(``)}
        </div>
      </div>

      <div class="section-block">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <div class="section-block-title" style="margin-bottom:0;">📝 Что обещал</div>
          <button class="btn btn-ghost btn-sm text-accent" id="add-promise">+ Добавить</button>
        </div>
        <div id="promises-list">
          ${(e.promises||[]).length===0?`<div class="text-muted text-sm">Нет обещаний</div>`:(e.promises||[]).map((e,t)=>`
            <div class="list-item" style="padding:10px 14px;">
              <div class="checkbox ${e.done?`checked`:``}" data-promise="${t}">${e.done?`✓`:``}</div>
              <div class="list-item-body"><div class="list-item-title ${e.done?`line-through text-muted`:``}">${e.text}</div></div>
              <button class="btn btn-ghost btn-icon text-muted" data-del-promise="${t}">✕</button>
            </div>
          `).join(``)}
        </div>
      </div>

      <div class="section-block">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <div class="section-block-title" style="margin-bottom:0;">🎁 Подарки</div>
          <button class="btn btn-ghost btn-sm text-accent" id="add-gift">+ Добавить</button>
        </div>
        <div id="gifts-list">
          ${(e.gifts||[]).length===0?`<div class="text-muted text-sm">Нет записей</div>`:(e.gifts||[]).map((e,t)=>`
            <div class="list-item" style="padding:10px 14px;">
              <div class="checkbox ${e.done?`checked`:``}" data-gift="${t}">${e.done?`✓`:``}</div>
              <div class="list-item-body"><div class="list-item-title ${e.done?`line-through text-muted`:``}">${e.text}</div></div>
              <button class="btn btn-ghost btn-icon text-muted" data-del-gift="${t}">✕</button>
            </div>
          `).join(``)}
        </div>
      </div>

      <div class="section-block">
        <div class="section-block-title">📌 Важные даты</div>
        <div id="imp-dates-list">
          ${(e.important_dates||[]).length===0?`<div class="text-muted text-sm">Нет дат</div>`:(e.important_dates||[]).map((e,t)=>`
            <div class="list-item" style="padding:10px 14px;">
              <div class="list-item-body">
                <div class="list-item-title">${e.name}</div>
                <div class="list-item-sub">${e.date?new Date(e.date).toLocaleDateString(`ru`,{day:`numeric`,month:`long`}):``}</div>
              </div>
              <button class="btn btn-ghost btn-icon text-muted" data-del-date="${t}">✕</button>
            </div>
          `).join(``)}
        </div>
        <button class="btn btn-ghost btn-sm text-accent" id="add-imp-date" style="margin-top:8px;">+ Добавить дату</button>
      </div>

      <div class="section-block">
        <div class="section-block-title">✏️ Заметки</div>
        <textarea class="input" id="notes-input" rows="4" placeholder="Любые заметки об отношениях...">${e.notes||``}</textarea>
      </div>
    `;let r=(e,t)=>{this.el.querySelector(`#${t}`)?.addEventListener(`input`,t=>{Ee(`relations.${e}`,t.target.value)})};r(`partner_name`,`partner-name`),r(`last_date`,`last-date`),r(`next_date`,`next-date`),r(`next_date_desc`,`next-date-desc`),r(`notes`,`notes-input`),[`last-date`,`next-date`].forEach(e=>{this.el.querySelector(`#${e}`)?.addEventListener(`change`,()=>this.draw())}),this.el.querySelector(`#add-date-idea`)?.addEventListener(`click`,()=>this.addSimple(`date_ideas`,`Идея свидания`,`Например: ужин, пикник, кино`)),this.el.querySelector(`#add-promise`)?.addEventListener(`click`,()=>this.addCheckItem(`promises`,`Обещание`,`Что обещал?`)),this.el.querySelector(`#add-gift`)?.addEventListener(`click`,()=>this.addCheckItem(`gifts`,`Подарок`,`Что подарить?`)),this.el.querySelector(`#add-imp-date`)?.addEventListener(`click`,()=>this.addImportantDate()),this.el.querySelector(`#date-ideas-list`)?.addEventListener(`click`,e=>{let t=e.target.closest(`[data-del-idea]`);t&&this.removeSimple(`date_ideas`,parseInt(t.dataset.delIdea))}),this.el.querySelector(`#promises-list`)?.addEventListener(`click`,e=>{let t=e.target.closest(`[data-promise]`);if(t){this.toggleCheck(`promises`,parseInt(t.dataset.promise));return}let n=e.target.closest(`[data-del-promise]`);n&&this.removeCheckItem(`promises`,parseInt(n.dataset.delPromise))}),this.el.querySelector(`#gifts-list`)?.addEventListener(`click`,e=>{let t=e.target.closest(`[data-gift]`);if(t){this.toggleCheck(`gifts`,parseInt(t.dataset.gift));return}let n=e.target.closest(`[data-del-gift]`);n&&this.removeCheckItem(`gifts`,parseInt(n.dataset.delGift))}),this.el.querySelector(`#imp-dates-list`)?.addEventListener(`click`,e=>{let t=e.target.closest(`[data-del-date]`);if(t){let e=a.get(`relations`)||{};(e.important_dates||[]).splice(parseInt(t.dataset.delDate),1),a.set(`relations`,e),this.draw()}})}addSimple(e,t,n){let r=document.createElement(`div`);r.innerHTML=`<div class="input-group"><label class="input-label">${t}</label><input class="input" id="si" placeholder="${n}"></div>`,c({title:t,content:r,actions:[{label:`Добавить`,cls:`btn-primary`,onClick:t=>{let n=t.querySelector(`#si`).value.trim();n&&(a.update(`relations.${e}`,e=>[...e||[],n]),this.draw(),u(),o(`Добавлено ✓`))}},{label:`Отмена`,cls:`btn-secondary`,onClick:()=>u()}]}),setTimeout(()=>r.querySelector(`#si`)?.focus(),100)}addCheckItem(e,t,n){let r=document.createElement(`div`);r.innerHTML=`<div class="input-group"><label class="input-label">${t}</label><input class="input" id="ci" placeholder="${n}"></div>`,c({title:t,content:r,actions:[{label:`Добавить`,cls:`btn-primary`,onClick:t=>{let n=t.querySelector(`#ci`).value.trim();n&&(a.update(`relations.${e}`,e=>[...e||[],{text:n,done:!1}]),this.draw(),u(),o(`Добавлено ✓`))}},{label:`Отмена`,cls:`btn-secondary`,onClick:()=>u()}]}),setTimeout(()=>r.querySelector(`#ci`)?.focus(),100)}addImportantDate(){let e=document.createElement(`div`);e.innerHTML=`
      <div class="input-group"><label class="input-label">Событие</label><input class="input" id="id-name" placeholder="День рождения / годовщина"></div>
      <div class="input-group"><label class="input-label">Дата</label><input class="input" id="id-date" type="date"></div>
    `,c({title:`Важная дата`,content:e,actions:[{label:`Добавить`,cls:`btn-primary`,onClick:e=>{let t=e.querySelector(`#id-name`).value.trim();t&&(a.update(`relations.important_dates`,n=>[...n||[],{name:t,date:e.querySelector(`#id-date`).value}]),this.draw(),u(),o(`Дата добавлена ✓`))}},{label:`Отмена`,cls:`btn-secondary`,onClick:()=>u()}]}),setTimeout(()=>e.querySelector(`#id-name`)?.focus(),100)}removeSimple(e,t){a.update(`relations.${e}`,e=>{let n=[...e];return n.splice(t,1),n}),this.draw(),o(`Удалено`)}toggleCheck(e,t){let n=a.get(`relations`)||{};n[e][t].done=!n[e][t].done,a.set(`relations`,n),this.draw()}removeCheckItem(e,t){a.update(`relations.${e}`,e=>{let n=[...e];return n.splice(t,1),n}),this.draw(),o(`Удалено`)}},z=[`#6366F1`,`#22C55E`,`#F59E0B`,`#EF4444`,`#8B5CF6`,`#EC4899`,`#14B8A6`,`#F97316`];function B(e){return e.split(` `).map(e=>e[0]).join(``).toUpperCase().slice(0,2)}function V(e){return z[(e.charCodeAt(0)||0)%z.length]}function H(e){return e?Math.floor((Date.now()-new Date(e))/864e5):null}function U(e){if(!e)return null;let t=new Date(e),n=new Date,r=n.getFullYear()-t.getFullYear(),i=n.getMonth()-t.getMonth();return(i<0||i===0&&n.getDate()<t.getDate())&&r--,r}function W(e){if(!e)return null;let t=new Date,n=new Date(e),r=new Date(t.getFullYear(),n.getMonth(),n.getDate());return r<t&&r.setFullYear(t.getFullYear()+1),Math.ceil((r-t)/864e5)}function G(e){return e===null?{text:`Нет данных`,color:`var(--text-muted)`}:e===0?{text:`Сегодня`,color:`var(--success)`}:e<7?{text:`${e} дн. назад`,color:`var(--success)`}:e<30?{text:`${e} дн. назад`,color:`var(--warning)`}:{text:`${e} дн. — давно!`,color:`var(--danger)`}}var Oe=class{render(){let e=document.createElement(`div`);return this.el=e,this.draw(),e}draw(){let e=(a.get(`friends`)||[]).map((e,t)=>({...e,_idx:t})).sort((e,t)=>(H(e.last_contact)??999)-(H(t.last_contact)??999));this.el.innerHTML=`
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
        <div class="page-title">👥 Друзья</div>
        <button class="btn btn-ghost btn-sm text-accent" id="add-friend-btn">+ Добавить</button>
      </div>

      ${e.length===0?`
        <div class="empty-state">
          <div class="empty-state-icon">👥</div>
          <div class="empty-state-title">Список пуст</div>
          <div class="empty-state-text">Добавьте друзей — следи за тем, чтобы регулярно с ними общаться</div>
        </div>
      `:`<div class="friends-grid">${e.map(e=>this.renderCard(e)).join(``)}</div>`}
    `,this.el.querySelector(`#add-friend-btn`)?.addEventListener(`click`,()=>this.openAddModal()),this.el.querySelectorAll(`[data-open-dossier]`).forEach(e=>{e.addEventListener(`click`,()=>this.openDossier(parseInt(e.dataset.openDossier)))}),this.el.querySelectorAll(`[data-contact]`).forEach(e=>{e.addEventListener(`click`,t=>{t.stopPropagation();let n=parseInt(e.dataset.contact),r=a.get(`friends`)||[];r[n].last_contact=new Date().toISOString().split(`T`)[0],a.set(`friends`,r),this.draw(),o(`Отмечено ✓`)})})}renderCard(e){let t=G(H(e.last_contact)),n=W(e.birthday),r=U(e.birthday),i=n!==null&&n<=7;return`
      <div class="friend-card" data-open-dossier="${e._idx}">
        <div class="friend-card-top">
          ${e.photo?`<img class="friend-avatar-img" src="${e.photo}" alt="${e.name}">`:`<div class="friend-avatar" style="background:${V(e.name)}">${B(e.name)}</div>`}
          ${i?`<div class="friend-bd-badge">🎂 ${n===0?`Сегодня!`:`через ${n} дн.`}</div>`:``}
        </div>
        <div class="friend-card-body">
          <div class="friend-name">${e.name}</div>
          ${r===null?``:`<div class="friend-meta">${r} лет${e.birthday?` · ${new Date(e.birthday).toLocaleDateString(`ru-RU`,{day:`numeric`,month:`long`})}`:``}</div>`}
          ${e.phone?`<div class="friend-meta">📞 ${e.phone}</div>`:``}
          <div class="friend-contact-label" style="color:${t.color}">${t.text}</div>
        </div>
        <button class="btn btn-secondary btn-sm friend-contact-btn" data-contact="${e._idx}" title="Написал сегодня">✓ Написал</button>
      </div>
    `}openDossier(e){let t=(a.get(`friends`)||[])[e];if(!t)return;let n=G(H(t.last_contact)),r=U(t.birthday),i=W(t.birthday),s=document.createElement(`div`);s.innerHTML=`
      <div class="dossier">
        <div class="dossier-header">
          <div class="dossier-avatar-wrap">
            ${t.photo?`<img class="dossier-avatar-img" src="${t.photo}" alt="${t.name}" id="dossier-preview">`:`<div class="dossier-avatar" style="background:${V(t.name)}" id="dossier-preview">${B(t.name)}</div>`}
            <label class="dossier-photo-btn" title="Сменить фото">
              📷
              <input type="file" accept="image/*" id="photo-upload" style="display:none">
            </label>
          </div>
          <div class="dossier-info">
            <div class="dossier-name">${t.name}</div>
            ${r===null?``:`<div class="dossier-age">${r} лет</div>`}
            <div class="dossier-contact-status" style="color:${n.color}">● ${n.text}</div>
          </div>
        </div>

        <div class="dossier-grid">
          <div class="dossier-field">
            <label class="input-label">Имя</label>
            <input class="input" id="d-name" value="${t.name}">
          </div>
          <div class="dossier-field">
            <label class="input-label">Дата рождения</label>
            <input class="input" id="d-birthday" type="date" value="${t.birthday||``}">
          </div>
          <div class="dossier-field">
            <label class="input-label">Телефон</label>
            <input class="input" id="d-phone" type="tel" placeholder="+7 999 123 45 67" value="${t.phone||``}">
          </div>
          <div class="dossier-field">
            <label class="input-label">Последний контакт</label>
            <input class="input" id="d-contact" type="date" value="${t.last_contact||``}">
          </div>
          <div class="dossier-field dossier-field-full">
            <label class="input-label">Заметки</label>
            <textarea class="input" id="d-notes" rows="3" placeholder="Где работает, интересы, что обсуждали...">${t.notes||``}</textarea>
          </div>
        </div>

        ${i!==null&&i<=30?`
          <div class="dossier-alert ${i<=7?`dossier-alert-warn`:``}">
            🎂 ${i===0?`Сегодня день рождения!`:`До дня рождения ${i} дн.`}
            ${r===null?``:`Исполнится ${r+1} лет.`}
          </div>
        `:``}

        <input type="hidden" id="d-photo" value="${t.photo||``}">
      </div>
    `,s.querySelector(`#photo-upload`)?.addEventListener(`change`,e=>{let t=e.target.files[0];if(!t)return;let n=new FileReader;n.onload=e=>{s.querySelector(`#d-photo`).value=e.target.result;let t=s.querySelector(`#dossier-preview`);if(t.tagName===`IMG`)t.src=e.target.result;else{let n=document.createElement(`img`);n.className=`dossier-avatar-img`,n.id=`dossier-preview`,n.src=e.target.result,t.replaceWith(n)}},n.readAsDataURL(t)}),c({title:`Досье`,content:s,actions:[{label:`Сохранить`,cls:`btn-primary`,onClick:t=>{let n=a.get(`friends`)||[];n[e]={...n[e],name:t.querySelector(`#d-name`).value.trim()||n[e].name,birthday:t.querySelector(`#d-birthday`).value||null,phone:t.querySelector(`#d-phone`).value.trim()||null,last_contact:t.querySelector(`#d-contact`).value||null,notes:t.querySelector(`#d-notes`).value.trim()||null,photo:t.querySelector(`#d-photo`).value||null},a.set(`friends`,n),this.draw(),u(),o(`Сохранено ✓`)}},{label:`Удалить`,cls:`btn-danger`,onClick:()=>{let t=a.get(`friends`)||[];t.splice(e,1),a.set(`friends`,t),this.draw(),u(),o(`Удалено`)}}]})}openAddModal(){let e=document.createElement(`div`);e.innerHTML=`
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
    `,c({title:`Новый контакт`,content:e,actions:[{label:`Добавить`,cls:`btn-primary`,onClick:e=>{let t=e.querySelector(`#f-name`).value.trim();if(!t){o(`Введите имя`);return}a.update(`friends`,n=>[...n||[],{name:t,phone:e.querySelector(`#f-phone`).value.trim()||null,birthday:e.querySelector(`#f-birthday`).value||null,last_contact:e.querySelector(`#f-contact`).value||null,notes:e.querySelector(`#f-notes`).value.trim()||null,photo:null,added:Date.now()}]),this.draw(),u(),o(`${t} добавлен ✓`)}},{label:`Отмена`,cls:`btn-secondary`,onClick:()=>u()}]}),setTimeout(()=>e.querySelector(`#f-name`)?.focus(),100)}};function ke(e){let t=new Date(e);t.setHours(0,0,0,0),t.setDate(t.getDate()+3-(t.getDay()+6)%7);let n=new Date(t.getFullYear(),0,4);return 1+Math.round(((t.getTime()-n.getTime())/864e5-3+(n.getDay()+6)%7)/7)}var K=[{key:`wins`,label:`✅ Что получилось?`,placeholder:`Главные победы недели...`},{key:`useless`,label:`🗑 Что было бесполезным?`,placeholder:`Что потратило время без пользы...`},{key:`money`,label:`💰 Что принесло деньги?`,placeholder:`Источники дохода или ключевые действия...`},{key:`energy`,label:`⚡ Что забрало энергию?`,placeholder:`Что истощало...`},{key:`next_goal`,label:`🎯 Главная цель следующей недели`,placeholder:`Одна главная задача...`},{key:`stop`,label:`🚫 Что нужно перестать делать?`,placeholder:`Привычки / действия которые мешают...`}],q=[`😫`,`😞`,`😐`,`🙂`,`😊`,`😄`,`🥳`,`💪`,`🔥`,`⭐`],Ae=class{render(){let e=document.createElement(`div`);return this.el=e,this.draw(),e}draw(){let e=a.get(`weekly`)||[],t=new Date,n=ke(t),r=`${t.getFullYear()}-W${n}`,i=e.find(e=>e.key===r)||{key:r,rating:0},s=e.filter(e=>e.key!==r).sort((e,t)=>t.key.localeCompare(e.key));this.el.innerHTML=`
      <div class="page-title" style="margin-bottom:4px;">📋 Обзор недели</div>
      <div class="page-subtitle" style="margin-bottom:20px;">Неделя ${n} · ${t.toLocaleDateString(`ru`,{month:`long`,year:`numeric`})}</div>

      <div class="card" style="margin-bottom:16px;">
        ${K.map(e=>`
          <div class="weekly-question">
            <div class="weekly-question-label">${e.label}</div>
            <textarea class="input" data-key="${e.key}" rows="2" placeholder="${e.placeholder}">${i[e.key]||``}</textarea>
          </div>
        `).join(``)}

        <div class="weekly-question">
          <div class="weekly-question-label">⭐ Оценка недели (1–10)</div>
          <div class="rating-selector" id="rating-selector">
            ${[1,2,3,4,5,6,7,8,9,10].map(e=>`
              <div class="rating-btn ${i.rating===e?`selected`:``}" data-rating="${e}">${e}</div>
            `).join(``)}
          </div>
          ${i.rating?`<div style="margin-top:8px; font-size:24px; text-align:center;">${q[i.rating-1]}</div>`:``}
        </div>

        <button class="btn btn-primary btn-full" id="save-weekly-btn" style="margin-top:8px;">Сохранить обзор ✓</button>
      </div>

      ${s.length>0?`
      <div class="section-title" style="margin-bottom:12px;">Прошлые обзоры</div>
      <div id="past-reviews">
        ${s.map((e,t)=>`
          <div class="card" style="margin-bottom:10px;">
            <div style="display:flex; justify-content:space-between; align-items:center; cursor:pointer;" data-toggle-review="${t}">
              <div>
                <div style="font-weight:600;">${e.key}</div>
                ${e.next_goal?`<div class="text-sm text-muted">${e.next_goal}</div>`:``}
              </div>
              <div style="display:flex; align-items:center; gap:8px;">
                ${e.rating?`<span style="font-size:20px;">${q[e.rating-1]}</span><span class="badge badge-accent">${e.rating}/10</span>`:``}
              </div>
            </div>
            <div class="review-details" id="review-${t}" style="display:none; margin-top:12px; border-top:1px solid var(--border); padding-top:12px;">
              ${K.filter(t=>e[t.key]).map(t=>`
                <div style="margin-bottom:10px;">
                  <div class="text-xs text-muted" style="margin-bottom:4px;">${t.label}</div>
                  <div class="text-sm" style="white-space:pre-wrap;">${e[t.key]}</div>
                </div>
              `).join(``)}
            </div>
          </div>
        `).join(``)}
      </div>
      `:``}
    `;let c=()=>{let e={...i};return this.el.querySelectorAll(`[data-key]`).forEach(t=>{e[t.dataset.key]=t.value}),e};this.el.querySelectorAll(`[data-key]`).forEach(e=>{e.addEventListener(`input`,()=>{clearTimeout(this._saveTimer),this._saveTimer=setTimeout(()=>{let e=a.get(`weekly`)||[],t=c(),n=e.findIndex(e=>e.key===r);n>=0?e[n]=t:e.push(t),a.set(`weekly`,e)},600)})}),this.el.querySelector(`#rating-selector`)?.addEventListener(`click`,e=>{let t=e.target.closest(`[data-rating]`);if(!t)return;let n=parseInt(t.dataset.rating),i=a.get(`weekly`)||[],o={...c(),rating:n},s=i.findIndex(e=>e.key===r);s>=0?i[s]=o:i.push(o),a.set(`weekly`,i),this.draw()}),this.el.querySelector(`#save-weekly-btn`)?.addEventListener(`click`,()=>{let e=a.get(`weekly`)||[],t=c(),n=e.findIndex(e=>e.key===r);n>=0?e[n]=t:e.push(t),a.set(`weekly`,e),o(`Обзор сохранён ✓`)}),this.el.querySelector(`#past-reviews`)?.addEventListener(`click`,e=>{let t=e.target.closest(`[data-toggle-review]`);if(t){let e=t.dataset.toggleReview,n=this.el.querySelector(`#review-${e}`);n&&(n.style.display=n.style.display===`none`?`block`:`none`)}})}};function J(e,t){if(!t||!e)return e||``;let n=t.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`);return String(e).replace(RegExp(`(${n})`,`gi`),`<mark>$1</mark>`)}var je=class{constructor(){this.query=``}render(){let e=document.createElement(`div`);this.el=e,e.innerHTML=`
      <div class="page-title" style="margin-bottom:16px;">🔍 Поиск</div>
      <input class="input" id="search-input" placeholder="Введите запрос..." autocomplete="off" style="margin-bottom:16px;">
      <div id="search-results"></div>
    `;let t=e.querySelector(`#search-input`),n=e.querySelector(`#search-results`);return t.addEventListener(`input`,()=>{this.query=t.value.trim(),n.innerHTML=this.renderResults(this.query),n.querySelectorAll(`[data-nav]`).forEach(e=>{e.addEventListener(`click`,()=>Q(e.dataset.nav))})}),n.innerHTML=this.renderResults(``),setTimeout(()=>t.focus(),100),e}search(e){if(!e||e.length<2)return[];let t=e.toLowerCase(),n=a.getAll(),r=[];return(n.inbox||[]).forEach(e=>{e.text?.toLowerCase().includes(t)&&r.push({section:`📥 Inbox`,text:e.text,nav:`#/inbox`})}),n.goals?.main?.title?.toLowerCase().includes(t)&&r.push({section:`🎯 Цели`,text:n.goals.main.title,nav:`#/goals`}),(n.goals?.subgoals||[]).forEach(e=>{e.text?.toLowerCase().includes(t)&&r.push({section:`🎯 Цели`,text:e.text,nav:`#/goals`})}),(n.habits||[]).forEach(e=>{e.name?.toLowerCase().includes(t)&&r.push({section:`✅ Привычки`,text:`${e.emoji||``} ${e.name}`,nav:`#/habits`})}),(n.friends||[]).forEach(e=>{(e.name?.toLowerCase().includes(t)||e.notes?.toLowerCase().includes(t))&&r.push({section:`👥 Друзья`,text:e.name,sub:e.notes||``,nav:`#/friends`})}),(n.finance?.cards||[]).forEach(e=>{e.bank?.toLowerCase().includes(t)&&r.push({section:`💳 Финансы`,text:e.bank,nav:`#/finance`})}),(n.finance?.debts||[]).forEach(e=>{e.creditor?.toLowerCase().includes(t)&&r.push({section:`💰 Финансы`,text:e.creditor,nav:`#/finance`})}),(n.work?.ideas||[]).forEach(e=>{e.text?.toLowerCase().includes(t)&&r.push({section:`💼 Работа`,text:e.text,nav:`#/work`})}),(n.dashboard?.daily_tasks||[]).forEach(e=>{e.text?.toLowerCase().includes(t)&&r.push({section:`☑️ Задачи`,text:e.text,nav:`#/dashboard`})}),r}renderResults(e){if(!e||e.length<2)return`<div class="text-muted text-sm" style="text-align:center; padding:32px 0;">Введите минимум 2 символа для поиска</div>`;let t=this.search(e);return t.length?t.map(t=>`
      <div class="list-item search-result-item" data-nav="${t.nav}" style="cursor:pointer;">
        <div class="list-item-body">
          <div class="list-item-sub" style="margin-bottom:2px;">${t.section}</div>
          <div class="list-item-title">${J(t.text,e)}</div>
          ${t.sub?`<div class="list-item-sub">${J(t.sub,e)}</div>`:``}
        </div>
        <span style="color:var(--text-muted); font-size:18px;">›</span>
      </div>
    `).join(``):`<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-title">Ничего не найдено</div><div class="empty-state-text">Попробуйте другой запрос</div></div>`}},Me=[`Вс`,`Пн`,`Вт`,`Ср`,`Чт`,`Пт`,`Сб`];function Ne(){return Array.from({length:7},(e,t)=>{let n=new Date;return n.setDate(n.getDate()-(6-t)),n.toISOString().split(`T`)[0]})}var Pe={"#/dashboard":se,"#/finance":ce,"#/inbox":fe,"#/goals":pe,"#/more":he,"#/work":_e,"#/health":ye,"#/habits":Te,"#/relations":De,"#/friends":Oe,"#/weekly":Ae,"#/search":je,"#/stats":class{render(){let e=document.createElement(`div`),t=a.getAll(),n=Ne(),r=t.health?.logs||[],i=t.habits||[],o=t.inbox||[],s=n.map(e=>{let t=r.find(t=>t.date===e);return{date:e,mood:t?.mood||0,sleep:t?.sleep||0,day:Me[new Date(e+`T12:00:00`).getDay()]}}),c=i.map(e=>{let t=n.filter(t=>(e.completions||[]).includes(t)).length;return{name:e.name,emoji:e.emoji||`✅`,done:t,pct:Math.round(t/7*100)}}).sort((e,t)=>t.pct-e.pct),l={idea:0,task:0,buy:0,other:0};o.forEach(e=>{l[e.category]!==void 0&&l[e.category]++});let u=s.filter(e=>e.mood).reduce((e,t,n,r)=>e+t.mood/r.filter(e=>e.mood).length,0)||0,d=s.filter(e=>e.sleep).reduce((e,t,n,r)=>e+t.sleep/r.filter(e=>e.sleep).length,0)||0;return e.innerHTML=`
      <div class="page-title" style="margin-bottom:20px;">📊 Статистика</div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px;">
        <div class="card" style="text-align:center;">
          <div class="card-title">Настроение</div>
          <div style="font-size:28px; margin:8px 0;">${u>0?[`😫`,`😕`,`😐`,`🙂`,`😊`][Math.round(u)-1]:`—`}</div>
          <div class="text-xs text-muted">${u>0?u.toFixed(1)+`/5 за неделю`:`нет данных`}</div>
        </div>
        <div class="card" style="text-align:center;">
          <div class="card-title">Сон</div>
          <div style="font-size:28px; font-weight:800; margin:8px 0; color:${d>=7?`var(--success)`:d>=5?`var(--warning)`:d>0?`var(--danger)`:`var(--text-muted)`};">${d>0?d.toFixed(1)+`ч`:`—`}</div>
          <div class="text-xs text-muted">${d>0?`среднее за неделю`:`нет данных`}</div>
        </div>
      </div>

      <div class="card" style="margin-bottom:12px;">
        <div class="card-title" style="margin-bottom:14px;">😊 Настроение (7 дней)</div>
        <div class="stat-bar-chart">
          ${s.map(e=>{let t=e.mood?e.mood/5*100:0,n=e.mood?[``,`#EF4444`,`#F97316`,`#EAB308`,`#84CC16`,`#22C55E`][e.mood]:`var(--surface-2)`;return`
              <div class="stat-bar-col">
                <div class="stat-bar-emoji">${e.mood?[`😫`,`😕`,`😐`,`🙂`,`😊`][e.mood-1]:`·`}</div>
                <div class="stat-bar-track">
                  <div class="stat-bar-fill" style="height:${t}%; background:${n};"></div>
                </div>
                <div class="stat-bar-label">${e.day}</div>
              </div>
            `}).join(``)}
        </div>
      </div>

      <div class="card" style="margin-bottom:12px;">
        <div class="card-title" style="margin-bottom:14px;">😴 Сон (7 дней)</div>
        <div class="stat-bar-chart">
          ${s.map(e=>{let t=e.sleep?Math.min(e.sleep/10*100,100):0,n=e.sleep>=7?`var(--success)`:e.sleep>=5?`var(--warning)`:e.sleep>0?`var(--danger)`:`var(--surface-2)`;return`
              <div class="stat-bar-col">
                <div class="stat-bar-emoji" style="font-size:11px; font-weight:700; color:var(--text-secondary);">${e.sleep?e.sleep+`ч`:`·`}</div>
                <div class="stat-bar-track">
                  <div class="stat-bar-fill" style="height:${t}%; background:${n};"></div>
                </div>
                <div class="stat-bar-label">${e.day}</div>
              </div>
            `}).join(``)}
        </div>
      </div>

      ${c.length>0?`
      <div class="card" style="margin-bottom:12px;">
        <div class="card-title" style="margin-bottom:14px;">✅ Привычки (неделя)</div>
        ${c.map(e=>`
          <div style="margin-bottom:10px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
              <span class="text-sm">${e.emoji} ${e.name}</span>
              <span class="text-sm font-bold" style="color:${e.pct>=80?`var(--success)`:e.pct>=50?`var(--warning)`:`var(--danger)`};">${e.done}/7 · ${e.pct}%</span>
            </div>
            <div class="progress-bar" style="margin-top:0;">
              <div class="progress-fill ${e.pct>=80?`success`:e.pct>=50?`warning`:`danger`}" style="width:${e.pct}%"></div>
            </div>
          </div>
        `).join(``)}
      </div>
      `:``}

      <div class="card" style="margin-bottom:12px;">
        <div class="card-title" style="margin-bottom:14px;">📥 Inbox по типам</div>
        ${[{key:`idea`,label:`💡 Идеи`,color:`var(--accent)`},{key:`task`,label:`✅ Задачи`,color:`var(--success)`},{key:`buy`,label:`🛒 Покупки`,color:`var(--warning)`},{key:`other`,label:`📌 Другое`,color:`var(--text-secondary)`}].map(e=>{let t=o.length,n=t>0?Math.round(l[e.key]/t*100):0;return`
            <div style="margin-bottom:10px;">
              <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                <span class="text-sm">${e.label}</span>
                <span class="text-xs text-muted">${l[e.key]} (${n}%)</span>
              </div>
              <div class="progress-bar" style="margin-top:0;">
                <div class="progress-fill" style="width:${n}%; background:${e.color};"></div>
              </div>
            </div>
          `}).join(``)}
        <div style="text-align:center; margin-top:4px;">
          <span class="text-xs text-muted">Всего записей в Inbox: ${o.length}</span>
        </div>
      </div>
    `,e}}},Fe=[`#/dashboard`,`#/finance`,`#/inbox`,`#/goals`,`#/more`],Y=``,X=document.getElementById(`page-container`);function Z(e){return Fe.indexOf(e)}function Q(e,t={}){if(e===Y&&!t.force)return;let n=Y;Y=e;let r=Pe[e];if(!r){Q(`#/dashboard`);return}let i=Z(n),a=Z(e),o=``;t.noAnim||(i===-1||a===-1||a>i?o=`slide-left`:a<i&&(o=`slide-right`));let s=new r().render();s.classList.add(`page`),o&&s.classList.add(o),X.innerHTML=``,X.appendChild(s),window.location.hash=e,Ie(e)}function Ie(e){document.querySelectorAll(`.nav-item`).forEach(t=>{t.classList.toggle(`active`,t.dataset.hash===e)})}function Le(){window.addEventListener(`hashchange`,()=>{let e=window.location.hash||`#/dashboard`;e!==Y&&Q(e,{noAnim:!1})}),Q(window.location.hash||`#/dashboard`,{noAnim:!0})}var Re=[{hash:`#/dashboard`,icon:`🏠`,label:`Главная`},{hash:`#/finance`,icon:`💰`,label:`Финансы`},{hash:`fab`,icon:`+`,label:``},{hash:`#/goals`,icon:`🎯`,label:`Цели`},{hash:`#/more`,icon:`☰`,label:`Ещё`}];function ze(){let e=document.getElementById(`bottom-nav`);e.innerHTML=``,Re.forEach(t=>{if(t.hash===`fab`){let t=document.createElement(`button`);t.className=`nav-fab`,t.textContent=`+`,t.setAttribute(`aria-label`,`Добавить в Inbox`),t.addEventListener(`click`,()=>Q(`#/inbox`)),e.appendChild(t)}else{let n=document.createElement(`button`);n.className=`nav-item`,n.dataset.hash=t.hash,n.innerHTML=`<span class="nav-icon">${t.icon}</span><span>${t.label}</span>`,n.addEventListener(`click`,()=>Q(t.hash)),e.appendChild(n)}});let t=window.location.hash||`#/dashboard`;document.querySelectorAll(`.nav-item`).forEach(e=>{e.classList.toggle(`active`,e.dataset.hash===t)})}var $=localStorage.getItem(`life_os_theme`);$&&document.documentElement.setAttribute(`data-theme`,$),`serviceWorker`in navigator&&window.addEventListener(`load`,()=>{navigator.serviceWorker.register(`/Life-os/sw.js`).catch(()=>{})}),ze(),Le(),C(),w(),setInterval(w,6e4);