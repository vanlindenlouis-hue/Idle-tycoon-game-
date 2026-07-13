-- Adds a global game clock pause.
-- Safe to run after 001_schema.sql, 002_seed.sql and 004_production_hardening.sql.

insert into public.settings (key, value)
values ('clock_paused', 'false'::jsonb)
on conflict (key) do nothing;

create or replace function public.is_clock_paused()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select case
        when jsonb_typeof(value) = 'boolean' then (value #>> '{}')::boolean
        else false
      end
      from public.settings
      where key = 'clock_paused'
    ),
    false
  );
$$;

create or replace function public.get_clock_paused()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_clock_paused();
$$;

create or replace function public.set_clock_paused(p_paused boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  old_paused boolean;
begin
  perform public.require_admin();

  old_paused := public.is_clock_paused();

  if p_paused and not old_paused then
    perform * from public.apply_income_for_all();
  end if;

  insert into public.settings (key, value, updated_at)
  values ('clock_paused', to_jsonb(p_paused), now())
  on conflict (key) do update
  set value = excluded.value, updated_at = now();

  update public.teams
  set last_income_update = now();

  perform public.log_admin_action(
    null,
    null,
    case when p_paused then 'Klok gepauzeerd' else 'Klok hervat' end,
    jsonb_build_object('clock_paused', old_paused),
    jsonb_build_object('clock_paused', p_paused)
  );

  return p_paused;
end;
$$;

create or replace function public.apply_income_for_team(p_team_id smallint)
returns public.teams
language plpgsql
security definer
set search_path = public
as $$
declare
  current_team public.teams%rowtype;
  updated_team public.teams%rowtype;
  elapsed_seconds numeric;
  tick_count integer;
  income_delta numeric(14, 2);
  next_income_update timestamptz;
begin
  select *
  into current_team
  from public.teams
  where id = p_team_id
  for update;

  if not found then
    raise exception 'Team % bestaat niet.', p_team_id;
  end if;

  if public.is_clock_paused() then
    update public.teams
    set last_income_update = now()
    where id = current_team.id
    returning * into updated_team;

    return updated_team;
  end if;

  elapsed_seconds := greatest(0, extract(epoch from (now() - current_team.last_income_update)));
  tick_count := floor(elapsed_seconds / 30);

  if tick_count < 1 then
    return current_team;
  end if;

  income_delta := round((current_team.income_per_minute / 2) * tick_count, 2);
  next_income_update := current_team.last_income_update + (tick_count * interval '30 seconds');

  update public.teams
  set
    total_money = total_money + income_delta,
    last_income_update = next_income_update
  where id = current_team.id
  returning * into updated_team;

  insert into public.transactions (team_id, amount, balance_after, type, note)
  values (
    updated_team.id,
    income_delta,
    updated_team.total_money,
    'income',
    format('Automatisch inkomen voor %s tick(s)', tick_count)
  );

  return updated_team;
end;
$$;

grant execute on function public.get_clock_paused() to anon, authenticated;
grant execute on function public.set_clock_paused(boolean) to authenticated;
grant execute on function public.apply_income_for_team(smallint) to anon, authenticated;
grant execute on function public.apply_income_for_all() to anon, authenticated;
