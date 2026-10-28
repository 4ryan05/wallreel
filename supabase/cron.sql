-- Run once in the Supabase SQL editor after deploying, with your site URL and CRON_SECRET filled in.
-- Calls the sync route every 10 minutes; each run refreshes the 8 least recently synced subreddits.
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'wallreel-sync',
  '*/10 * * * *',
  $$
  select net.http_get(
    url := 'https://wallreel.vercel.app/api/cron/sync',
    headers := jsonb_build_object('Authorization', 'Bearer YOUR_CRON_SECRET'),
    timeout_milliseconds := 290000
  );
  $$
);
