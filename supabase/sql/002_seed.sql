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
on conflict (id) do update
set
  name = excluded.name,
  color = excluded.color,
  income_per_minute = excluded.income_per_minute,
  total_money = excluded.total_money,
  upgrade_count = excluded.upgrade_count,
  last_income_update = excluded.last_income_update;

insert into public.settings (key, value)
values ('admin_emails', '["admin@example.com"]'::jsonb)
on conflict (key) do update
set value = excluded.value, updated_at = now();
