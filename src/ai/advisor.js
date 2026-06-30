const CACHE_KEY = 'life_os_ai_cache';
const API_KEY_KEY = 'life_os_api_key';

export function getApiKey() {
  return localStorage.getItem(API_KEY_KEY) || '';
}

export function setApiKey(key) {
  localStorage.setItem(API_KEY_KEY, key.trim());
}

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

function buildContext(data) {
  const { finance, work, health, goals, relations, friends, habits, inbox } = data;

  const totalDebt = [
    ...(finance.cards || []).map(c => c.debt || 0),
    ...(finance.debts || []).map(d => d.amount || 0)
  ].reduce((a, b) => a + b, 0);

  const urgentCard = (finance.cards || [])
    .filter(c => c.grace_period_end)
    .sort((a, b) => new Date(a.grace_period_end) - new Date(b.grace_period_end))[0];

  const todayLog = (health.logs || []).find(l => l.date === getTodayStr());
  const mainGoal = goals?.main?.title || '';
  const mainProgress = goals?.main?.progress || 0;
  const inboxCount = (inbox || []).length;
  const longLostFriends = (friends || []).filter(f => {
    if (!f.last_contact) return true;
    const days = Math.floor((Date.now() - new Date(f.last_contact)) / 86400000);
    return days > 30;
  }).length;

  return `Данные пользователя:
- Общий долг: ${totalDebt.toLocaleString('ru')} руб.
${urgentCard ? `- Срочная карта: ${urgentCard.bank}, льготный период до ${urgentCard.grace_period_end}` : ''}
- Работа: продажи ${work.sales_today || 0}, план ${work.plan || 0}, факт ${work.fact || 0}
- Главная цель: "${mainGoal}" (прогресс ${mainProgress}%)
- Сон: ${todayLog?.sleep || 'не указан'} ч, настроение: ${todayLog?.mood || 'не указано'}, энергия: ${todayLog?.energy || 'не указана'}/5
- Inbox: ${inboxCount} необработанных записей
- Друзей давно не видел: ${longLostFriends}
- Следующее свидание: ${relations.next_date || 'не запланировано'}

Ответь кратко на русском языке в формате JSON:
{
  "today": "Что сделать сегодня (1 конкретное действие)",
  "important": "Что сейчас самое важное",
  "warning": "Какая проблема начинает появляться (или null если нет)",
  "improve": "Одна конкретная рекомендация по улучшению"
}`;
}

export async function analyzeLife(storeData) {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
  if (cached.date === getTodayStr() && cached.result) {
    return cached.result;
  }

  const prompt = buildContext(storeData);

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
      max_tokens: 500,
      system: 'Ты персональный советник. Анализируй данные человека и давай конкретные, поддерживающие советы. Отвечай ТОЛЬКО валидным JSON без markdown.',
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) throw new Error(`API error: ${response.status}`);

  const json = await response.json();
  const text = json.content[0].text.trim();
  const result = JSON.parse(text);

  localStorage.setItem(CACHE_KEY, JSON.stringify({ date: getTodayStr(), result }));
  return result;
}

export function clearAiCache() {
  localStorage.removeItem(CACHE_KEY);
}
