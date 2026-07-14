create table if not exists public.push_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  endpoint text not null,
  keys jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

create policy "Users manage their own push subscription"
  on public.push_subscriptions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
