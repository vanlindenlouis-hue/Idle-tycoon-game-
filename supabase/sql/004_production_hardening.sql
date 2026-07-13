-- Safe to run after 001_schema.sql and 002_seed.sql.
-- This script does not reset money, income, team names, colors, or upgrades.

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

revoke execute on function public.log_admin_action(
  smallint,
  text,
  text,
  jsonb,
  jsonb
) from public, anon, authenticated;

revoke execute on function public.require_admin() from public, anon;

grant execute on function public.get_clock_paused() to anon, authenticated;
grant execute on function public.set_clock_paused(boolean) to authenticated;
grant execute on function public.apply_income_for_team(smallint) to anon, authenticated;
grant execute on function public.apply_income_for_all() to anon, authenticated;
grant execute on function public.add_team_money(smallint, numeric, text) to authenticated;
grant execute on function public.subtract_team_money(smallint, numeric, text) to authenticated;
grant execute on function public.increase_team_income(smallint, numeric, text) to authenticated;
grant execute on function public.set_team_income(smallint, numeric) to authenticated;
grant execute on function public.update_team_profile(smallint, text, text) to authenticated;
grant execute on function public.reset_team(smallint) to authenticated;
grant execute on function public.reset_activity() to authenticated;
grant execute on function public.purchase_game_upgrade(smallint, text) to authenticated;

do $$
declare
  team_count integer;
begin
  select count(*) into team_count from public.teams;

  if team_count <> 4 then
    raise exception 'Expected exactly 4 teams, found %.', team_count;
  end if;
end;
$$;
