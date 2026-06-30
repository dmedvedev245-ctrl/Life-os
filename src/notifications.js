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

// Запрос разрешения (вызывается из настроек)
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
