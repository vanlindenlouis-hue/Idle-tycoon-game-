insert into public.teams (
  id,
  name,
  color,
  income_per_minute,
  total_money,
  upgrade_count,
  last_income_update
)
values
  (1, 'Team 1', '#22c55e', 100, 0, 0, now()),
  (2, 'Team 2', '#38bdf8', 100, 0, 0, now()),
  (3, 'Team 3', '#facc15', 100, 0, 0, now()),
  (4, 'Team 4', '#fb7185', 100, 0, 0, now())
on conflict (id) do nothing;

insert into public.settings (key, value)
values ('admin_emails', '["admin@example.com"]'::jsonb)
on conflict (key) do nothing;

insert into public.settings (key, value)
values ('clock_paused', 'false'::jsonb)
on conflict (key) do nothing;
