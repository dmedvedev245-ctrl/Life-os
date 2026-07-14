import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://izrvaalyhbqoyxzxncfp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6cnZhYWx5aGJxb3l4enhuY2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MjYwNjcsImV4cCI6MjA5ODQwMjA2N30.qTrkoSbRWg1eLl6NIJv6E00tG26sT8Lt-S2ARccJqSg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let syncTimer = null;

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function syncToCloud(data) {
  const user = await getCurrentUser();
  if (!user) return;
  await supabase.from('user_data').upsert(
    { user_id: user.id, data, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  );
}

export function scheduleSyncToCloud(data) {
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => syncToCloud(data), 1500);
}

export async function loadFromCloud() {
  const user = await getCurrentUser();
  if (!user) return null;
  const { data } = await supabase
    .from('user_data')
    .select('data')
    .eq('user_id', user.id)
    .single();
  return data?.data ?? null;
}

export async function savePushSubscription(subscription) {
  const user = await getCurrentUser();
  if (!user) return;
  const json = subscription.toJSON();
  await supabase.from('push_subscriptions').upsert(
    { user_id: user.id, endpoint: json.endpoint, keys: json.keys, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  );
}

export async function signOut() {
  await supabase.auth.signOut();
  localStorage.removeItem('life_os');
  localStorage.removeItem('life_os_bd_checked');
}
