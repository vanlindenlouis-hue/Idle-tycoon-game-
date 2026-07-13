create extension if not exists pg_net;
create extension if not exists pg_cron;

select cron.unschedule('supermarket-income-tick')
where exists (
  select 1
  from cron.job
  where jobname = 'supermarket-income-tick'
);

select cron.schedule(
  'supermarket-income-tick',
  '* * * * *',
  $$
  select
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/income-tick',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object('source', 'pg_cron')
    );
  $$
);
