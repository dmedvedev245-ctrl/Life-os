import { store } from './store.js';

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

function daysUntilBirthday(birthdayStr) {
  if (!birthdayStr) return null;
  const today = new Date();
  const bd = new Date(birthdayStr);
  const next = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
  if (next < today) next.setFullYear(today.getFullYear() + 1);
  return Math.ceil((next - today) / 86400000);
}

function getAge(birthdayStr) {
  if (!birthdayStr) return null;
  const bd = new Date(birthdayStr);
  const today = new Date();
  let age = today.getFullYear() - bd.getFullYear();
  const m = today.getMonth() - bd.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
  return age;
}

// Возвращает список именинников на ближайшие N дней
export function getUpcomingBirthdays(days = 7) {
  const friends = store.get('friends') || [];
  return friends
    .filter(f => f.birthday)
    .map(f => ({
      name: f.name,
      birthday: f.birthday,
      daysLeft: daysUntilBirthday(f.birthday),
      age: getAge(f.birthday),
      emoji: f.emoji || '🎂',
      photo: f.photo || null,
    }))
    .filter(f => f.daysLeft !== null && f.daysLeft <= days)
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

// Запрашивает разрешение и показывает браузерное уведомление
async function sendBrowserNotification(name, daysLeft, age) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'denied') return;

  if (Notification.permission === 'default') {
    await Notification.requestPermission();
  }

  if (Notification.permission !== 'granted') return;

  const title = daysLeft === 0
    ? `🎂 Сегодня день рождения — ${name}!`
    : `🎂 Через ${daysLeft} ${daysLeft === 1 ? 'день' : 'дня'} ДР — ${name}`;

  const body = daysLeft === 0
    ? `Не забудь поздравить!${age !== null ? ` Исполняется ${age + 1} лет.` : ''}`
    : `Запланируй поздравление заранее.`;

  new Notification(title, {
    body,
    icon: '/Life-os/favicon.svg',
    badge: '/Life-os/favicon.svg',
    tag: `birthday-${name}-${getTodayStr()}`,
  });
}

// Главная функция — вызывается при старте приложения
export async function checkBirthdayNotifications() {
  const today = getTodayStr();
  const lastChecked = localStorage.getItem('life_os_bd_checked');

  // Проверяем один раз в день
  if (lastChecked === today) return;
  localStorage.setItem('life_os_bd_checked', today);

  const upcoming = getUpcomingBirthdays(3); // уведомляем за 3 дня
  if (!upcoming.length) return;

  // Запрашиваем разрешение при первом дне рождения
  if (Notification.permission === 'default') {
    await Notification.requestPermission();
  }

  for (const f of upcoming) {
    await sendBrowserNotification(f.name, f.daysLeft, f.age);
  }
}

export async function checkInboxReminders() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const items = JSON.parse(localStorage.getItem('life_os') || '{}').inbox || [];
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const checkKey = `life_os_rem_${todayStr}_${now.getHours()}_${now.getMinutes()}`;
  if (localStorage.getItem(checkKey)) return;
  localStorage.setItem(checkKey, '1');

  for (const item of items) {
    if (!item.reminder?.date || item.reminder.date !== todayStr) continue;
    const [h, m] = (item.reminder.time || '09:00').split(':').map(Number);
    const remMin = h * 60 + m;
    if (currentMinutes >= remMin && currentMinutes <= remMin + 2) {
      new Notification('⏰ Напоминание', {
        body: item.text,
        icon: '/Life-os/favicon.svg',
        tag: `inbox-${item.created}`,
      });
    }
  }
}

function daysUntilDate(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
}

function fmtAmount(n) { return Number(n || 0).toLocaleString('ru') + ' ₽'; }

export async function checkPaymentNotifications() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const today = getTodayStr();
  const lastChecked = localStorage.getItem('life_os_pay_checked');
  if (lastChecked === today) return;
  localStorage.setItem('life_os_pay_checked', today);

  const data = store.get('finance') || {};
  const cards = data.cards || [];
  const debts = data.debts || [];
  const todayNum = new Date().getDate();

  const alerts = [];

  cards.forEach(c => {
    if (!c.grace_period_end || !c.debt) return;
    const days = daysUntilDate(c.grace_period_end);
    if (days !== null && days >= 0 && days <= 3) {
      alerts.push({ name: c.bank, days, amount: c.debt, tag: `pay-card-${c.bank}-${today}` });
    }
  });

  debts.forEach(d => {
    if (!d.payment_day || !d.monthly_payment) return;
    let diff = d.payment_day - todayNum;
    if (diff < 0) diff += new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    if (diff <= 2) {
      alerts.push({ name: d.creditor, days: diff, amount: d.monthly_payment, tag: `pay-debt-${d.creditor}-${today}` });
    }
  });

  for (const p of alerts) {
    const title = p.days === 0
      ? `⚠️ Сегодня платёж — ${p.name}`
      : `💳 Платёж через ${p.days} ${p.days === 1 ? 'день' : 'дня'} — ${p.name}`;
    new Notification(title, {
      body: `Сумма: ${fmtAmount(p.amount)}`,
      icon: '/Life-os/favicon.svg',
      badge: '/Life-os/favicon.svg',
      tag: p.tag,
    });
  }
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  const result = await Notification.requestPermission();
  return result;
}

export function getNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}
