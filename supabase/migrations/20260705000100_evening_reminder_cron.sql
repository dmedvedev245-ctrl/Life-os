create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select
  cron.schedule(
    'evening-reminder-job',
    '0 19 * * *',
    $$
    select net.http_post(
      url := 'https://izrvaalyhbqoyxzxncfp.supabase.co/functions/v1/evening-reminder',
      headers := '{"Content-Type": "application/json"}'::jsonb
    );
    $$
  );
