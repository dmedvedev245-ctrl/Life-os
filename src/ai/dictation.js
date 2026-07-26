import { getApiKey } from './advisor.js';

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

const SYSTEM_PROMPT = `Ты парсер свободного текста для личного приложения. Пользователь надиктовывает или печатает события/факты из жизни одним куском текста — иногда несколько фактов сразу. Разбей текст на отдельные операции и верни ТОЛЬКО валидный JSON-массив без markdown-обрамления, каждый элемент — один из следующих типов:

{"target":"finance_expense","amount":number,"category":"food|transport|home|health|clothes|fun|phone|sport|debt|other","comment":string}
{"target":"finance_income","amount":number,"category":"salary|freelance|gift|invest|other","comment":string}
{"target":"health_log","sleep"?:number,"weight"?:number,"water"?:number,"mood"?:1-5,"energy"?:1-5,"workout"?:boolean,"vitamins"?:boolean}
{"target":"habit_checkin","habit_name":string,"matched":boolean}
{"target":"goal_update","field":"next_step|motivation|deadline|title|progress","value":string|number}
{"target":"subgoal_add","title":string,"deadline"?:string}
{"target":"work_update","field":"sales_today|profit|avg_check|conversion|plan|fact|tomorrow","value":number|string}
{"target":"work_note","list":"ideas|problems|blockers","text":string}
{"target":"relation_update","field":"partner_name|last_date|next_date|next_date_desc|notes","value":string}
{"target":"relation_list","list":"date_ideas|promises|gifts","text":string}
{"target":"relation_date","name":string,"date":string}
{"target":"friend_contact","friend_name":string,"matched":boolean}
{"target":"inbox_note","text":string,"category":"idea|task|buy|other"}

Правила:
- "matched" у habit_checkin/friend_contact — true только если habit_name/friend_name дословно совпадает с одним из имён, переданных в контексте ниже. Если не уверен или совпадения нет — верни matched:false, но всё равно верни лучшую догадку имени.
- Если не можешь уверенно отнести кусок текста ни к одному типу — верни его как inbox_note с category "other" и text как есть. Никогда не выдумывай данные, которых нет в тексте.
- Суммы денег — только числа без пробелов и валюты.
- Не оборачивай ответ в markdown, никаких \`\`\`.`;

function buildContext(data) {
  const habitNames = (data.habits || []).map(h => h.name).filter(Boolean);
  const friendNames = (data.friends || []).map(f => f.name).filter(Boolean);
  return `Сегодняшняя дата: ${getTodayStr()}
Существующие привычки: ${habitNames.length ? habitNames.join(', ') : 'нет'}
Существующие друзья: ${friendNames.length ? friendNames.join(', ') : 'нет'}

Текст пользователя:
"""
`;
}

export async function parseDictation(text, storeData) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('Не задан API ключ Claude (настройки на Дашборде)');

  const prompt = buildContext(storeData) + text + '\n"""';

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) throw new Error(`API error: ${response.status}`);

  const json = await response.json();
  const raw = json.content[0].text.trim();
  const ops = JSON.parse(raw);
  if (!Array.isArray(ops)) throw new Error('Неожиданный формат ответа');
  return ops;
}
