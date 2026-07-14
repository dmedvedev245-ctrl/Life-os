import webpush from "npm:web-push@3.6.7";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:dmedvedev245@gmail.com";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

function todayInMoscow(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function isLogIncomplete(log: any): boolean {
  if (!log) return true;
  return !log.sleep && !log.mood && !log.energy;
}

async function restGet(path: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`REST ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

Deno.serve(async () => {
  const today = todayInMoscow();
  const subs = await restGet("push_subscriptions?select=user_id,endpoint,keys");

  let sent = 0;
  const errors: string[] = [];

  for (const sub of subs) {
    try {
      const rows = await restGet(`user_data?user_id=eq.${sub.user_id}&select=data`);
      const data = rows[0]?.data;
      const logs = data?.health?.logs || [];
      const log = logs.find((l: any) => l.date === today);

      if (!isLogIncomplete(log)) continue;

      const payload = JSON.stringify({
        title: "🌙 Как прошёл день?",
        body: "Отметь сон, настроение и самочувствие в дневнике здоровья",
        url: "/Life-os/#/health",
        tag: `evening-${today}`,
      });

      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys },
        payload
      );
      sent++;
    } catch (e) {
      errors.push(`${sub.user_id}: ${e.message}`);
    }
  }

  return new Response(JSON.stringify({ checked: subs.length, sent, errors }), {
    headers: { "Content-Type": "application/json" },
  });
});
