create extension if not exists pgcrypto;

create table if not exists public.teams (
  id smallint primary key check (id between 1 and 4),
  name text not null check (char_length(name) between 1 and 40),
  color text not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
  income_per_minute numeric(12, 2) not null default 100 check (income_per_minute >= 0),
  total_money numeric(14, 2) not null default 0 check (total_money >= 0),
  upgrade_count integer not null default 0 check (upgrade_count >= 0),
  last_income_update timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  team_id smallint not null references public.teams(id) on delete cascade,
  amount numeric(14, 2) not null,
  balance_after numeric(14, 2) not null check (balance_after >= 0),
  type text not null check (
    type in (
      'income',
      'money_added',
      'money_removed',
      'upgrade_purchase',
      'income_adjusted',
      'profile_updated',
      'team_reset',
      'activity_reset'
    )
  ),
  note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  team_id smallint references public.teams(id) on delete set null,
  team_name text,
  action text not null,
  old_value jsonb,
  new_value jsonb,
  created_by uuid,
  created_by_email text,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists transactions_team_time_idx
  on public.transactions (team_id, created_at desc);

create index if not exists admin_logs_time_idx
  on public.admin_logs (created_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists teams_touch_updated_at on public.teams;
create trigger teams_touch_updated_at
before update on public.teams
for each row execute function public.touch_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    exists (
      select 1
      from public.settings s
      cross join lateral jsonb_array_elements_text(s.value) email(value)
      where s.key = 'admin_emails'
        and lower(email.value) = lower(coalesce(auth.jwt() ->> 'email', ''))
    ),
    false
  );
$$;

create or replace function public.require_admin()
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Alleen admins mogen deze actie uitvoeren.';
  end if;
end;
$$;

create or replace function public.log_admin_action(
  p_team_id smallint,
  p_team_name text,
  p_action text,
  p_old_value jsonb,
  p_new_value jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.admin_logs (
    team_id,
    team_name,
    action,
    old_value,
    new_value,
    created_by,
    created_by_email
  )
  values (
    p_team_id,
    p_team_name,
    p_action,
    p_old_value,
    p_new_value,
    auth.uid(),
    auth.jwt() ->> 'email'
  );
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

create or replace function public.apply_income_for_all()
returns setof public.teams
language plpgsql
security definer
set search_path = public
as $$
declare
  team_record record;
begin
  for team_record in select id from public.teams order by id loop
    perform public.apply_income_for_team(team_record.id);
  end loop;

  return query
  select *
  from public.teams
  order by id;
end;
$$;

create or replace function public.add_team_money(
  p_team_id smallint,
  p_amount numeric,
  p_note text default 'Geld toegevoegd'
)
returns public.teams
language plpgsql
security definer
set search_path = public
as $$
declare
  current_team public.teams%rowtype;
  updated_team public.teams%rowtype;
begin
  perform public.require_admin();

  if p_amount <= 0 then
    raise exception 'Bedrag moet groter zijn dan 0.';
  end if;

  perform public.apply_income_for_team(p_team_id);

  select * into current_team from public.teams where id = p_team_id for update;

  update public.teams
  set total_money = total_money + p_amount
  where id = p_team_id
  returning * into updated_team;

  insert into public.transactions (team_id, amount, balance_after, type, note)
  values (p_team_id, p_amount, updated_team.total_money, 'money_added', p_note);

  perform public.log_admin_action(
    p_team_id,
    current_team.name,
    'Geld toegevoegd',
    jsonb_build_object('total_money', current_team.total_money),
    jsonb_build_object('total_money', updated_team.total_money, 'amount', p_amount)
  );

  return updated_team;
end;
$$;

create or replace function public.subtract_team_money(
  p_team_id smallint,
  p_amount numeric,
  p_note text default 'Geld afgetrokken'
)
returns public.teams
language plpgsql
security definer
set search_path = public
as $$
declare
  current_team public.teams%rowtype;
  updated_team public.teams%rowtype;
  actual_amount numeric(14, 2);
begin
  perform public.require_admin();

  if p_amount <= 0 then
    raise exception 'Bedrag moet groter zijn dan 0.';
  end if;

  perform public.apply_income_for_team(p_team_id);

  select * into current_team from public.teams where id = p_team_id for update;
  actual_amount := least(p_amount, current_team.total_money);

  update public.teams
  set total_money = greatest(0, total_money - actual_amount)
  where id = p_team_id
  returning * into updated_team;

  insert into public.transactions (team_id, amount, balance_after, type, note)
  values (p_team_id, -actual_amount, updated_team.total_money, 'money_removed', p_note);

  perform public.log_admin_action(
    p_team_id,
    current_team.name,
    'Geld afgetrokken',
    jsonb_build_object('total_money', current_team.total_money),
    jsonb_build_object('total_money', updated_team.total_money, 'amount', actual_amount)
  );

  return updated_team;
end;
$$;

create or replace function public.increase_team_income(
  p_team_id smallint,
  p_delta numeric,
  p_note text default 'Inkomen verhoogd'
)
returns public.teams
language plpgsql
security definer
set search_path = public
as $$
declare
  current_team public.teams%rowtype;
  updated_team public.teams%rowtype;
begin
  perform public.require_admin();

  if p_delta <= 0 then
    raise exception 'Inkomensverhoging moet groter zijn dan 0.';
  end if;

  perform public.apply_income_for_team(p_team_id);

  select * into current_team from public.teams where id = p_team_id for update;

  update public.teams
  set
    income_per_minute = income_per_minute + p_delta,
    upgrade_count = upgrade_count + 1
  where id = p_team_id
  returning * into updated_team;

  insert into public.transactions (team_id, amount, balance_after, type, note)
  values (p_team_id, 0, updated_team.total_money, 'income_adjusted', p_note);

  perform public.log_admin_action(
    p_team_id,
    current_team.name,
    'Inkomen verhoogd',
    jsonb_build_object(
      'income_per_minute', current_team.income_per_minute,
      'upgrade_count', current_team.upgrade_count
    ),
    jsonb_build_object(
      'income_per_minute', updated_team.income_per_minute,
      'upgrade_count', updated_team.upgrade_count,
      'delta', p_delta
    )
  );

  return updated_team;
end;
$$;

create or replace function public.set_team_income(
  p_team_id smallint,
  p_income numeric
)
returns public.teams
language plpgsql
security definer
set search_path = public
as $$
declare
  current_team public.teams%rowtype;
  updated_team public.teams%rowtype;
begin
  perform public.require_admin();

  if p_income < 0 then
    raise exception 'Inkomen mag niet negatief zijn.';
  end if;

  perform public.apply_income_for_team(p_team_id);

  select * into current_team from public.teams where id = p_team_id for update;

  update public.teams
  set income_per_minute = p_income
  where id = p_team_id
  returning * into updated_team;

  insert into public.transactions (team_id, amount, balance_after, type, note)
  values (p_team_id, 0, updated_team.total_money, 'income_adjusted', 'Inkomen handmatig gezet');

  perform public.log_admin_action(
    p_team_id,
    current_team.name,
    'Inkomen aangepast',
    jsonb_build_object('income_per_minute', current_team.income_per_minute),
    jsonb_build_object('income_per_minute', updated_team.income_per_minute)
  );

  return updated_team;
end;
$$;

create or replace function public.update_team_profile(
  p_team_id smallint,
  p_name text,
  p_color text
)
returns public.teams
language plpgsql
security definer
set search_path = public
as $$
declare
  current_team public.teams%rowtype;
  updated_team public.teams%rowtype;
begin
  perform public.require_admin();

  if char_length(trim(p_name)) < 1 or char_length(trim(p_name)) > 40 then
    raise exception 'Teamnaam moet tussen 1 en 40 tekens zijn.';
  end if;

  if p_color !~ '^#[0-9A-Fa-f]{6}$' then
    raise exception 'Teamkleur moet een geldige hex-kleur zijn.';
  end if;

  perform public.apply_income_for_team(p_team_id);

  select * into current_team from public.teams where id = p_team_id for update;

  update public.teams
  set name = trim(p_name), color = p_color
  where id = p_team_id
  returning * into updated_team;

  insert into public.transactions (team_id, amount, balance_after, type, note)
  values (p_team_id, 0, updated_team.total_money, 'profile_updated', 'Teamprofiel aangepast');

  perform public.log_admin_action(
    p_team_id,
    current_team.name,
    'Team aangepast',
    jsonb_build_object('name', current_team.name, 'color', current_team.color),
    jsonb_build_object('name', updated_team.name, 'color', updated_team.color)
  );

  return updated_team;
end;
$$;

create or replace function public.reset_team(p_team_id smallint)
returns public.teams
language plpgsql
security definer
set search_path = public
as $$
declare
  current_team public.teams%rowtype;
  updated_team public.teams%rowtype;
begin
  perform public.require_admin();

  select * into current_team from public.teams where id = p_team_id for update;

  if not found then
    raise exception 'Team % bestaat niet.', p_team_id;
  end if;

  update public.teams
  set
    total_money = 0,
    upgrade_count = 0,
    income_per_minute = 100,
    last_income_update = now()
  where id = p_team_id
  returning * into updated_team;

  insert into public.transactions (team_id, amount, balance_after, type, note)
  values (p_team_id, -current_team.total_money, 0, 'team_reset', 'Team reset');

  perform public.log_admin_action(
    p_team_id,
    current_team.name,
    'Team reset',
    jsonb_build_object(
      'total_money', current_team.total_money,
      'income_per_minute', current_team.income_per_minute,
      'upgrade_count', current_team.upgrade_count
    ),
    jsonb_build_object('total_money', 0, 'income_per_minute', 100, 'upgrade_count', 0)
  );

  return updated_team;
end;
$$;

create or replace function public.reset_activity()
returns setof public.teams
language plpgsql
security definer
set search_path = public
as $$
declare
  old_state jsonb;
begin
  perform public.require_admin();

  select jsonb_agg(
    jsonb_build_object(
      'id', id,
      'name', name,
      'total_money', total_money,
      'income_per_minute', income_per_minute,
      'upgrade_count', upgrade_count
    )
    order by id
  )
  into old_state
  from public.teams;

  insert into public.transactions (team_id, amount, balance_after, type, note)
  select id, -total_money, 0, 'activity_reset', 'Volledige activiteit reset'
  from public.teams;

  update public.teams
  set
    total_money = 0,
    upgrade_count = 0,
    income_per_minute = 100,
    last_income_update = now();

  perform public.log_admin_action(
    null,
    null,
    'Volledige activiteit reset',
    jsonb_build_object('teams', old_state),
    jsonb_build_object('total_money', 0, 'income_per_minute', 100, 'upgrade_count', 0)
  );

  return query select * from public.teams order by id;
end;
$$;

create or replace function public.purchase_game_upgrade(
  p_team_id smallint,
  p_upgrade_key text
)
returns public.teams
language plpgsql
security definer
set search_path = public
as $$
declare
  current_team public.teams%rowtype;
  updated_team public.teams%rowtype;
  upgrade_name text;
  upgrade_cost numeric(14, 2);
  upgrade_income numeric(12, 2);
begin
  perform public.require_admin();
  perform public.apply_income_for_team(p_team_id);

  upgrade_name := case p_upgrade_key
    when 'extra_cashier' then 'Extra kassier'
    when 'new_shelves' then 'Nieuwe rekken'
    when 'marketing_campaign' then 'Marketingcampagne'
    when 'self_scan' then 'Zelfscan'
    when 'warehouse_expansion' then 'Magazijnuitbreiding'
    else null
  end;

  upgrade_cost := case p_upgrade_key
    when 'extra_cashier' then 500
    when 'new_shelves' then 1000
    when 'marketing_campaign' then 2500
    when 'self_scan' then 5000
    when 'warehouse_expansion' then 10000
    else null
  end;

  upgrade_income := case p_upgrade_key
    when 'extra_cashier' then 25
    when 'new_shelves' then 50
    when 'marketing_campaign' then 150
    when 'self_scan' then 300
    when 'warehouse_expansion' then 600
    else null
  end;

  if upgrade_name is null then
    raise exception 'Onbekende upgrade.';
  end if;

  select * into current_team from public.teams where id = p_team_id for update;

  if current_team.total_money < upgrade_cost then
    raise exception '% heeft niet genoeg geld voor %.', current_team.name, upgrade_name;
  end if;

  update public.teams
  set
    total_money = total_money - upgrade_cost,
    income_per_minute = income_per_minute + upgrade_income,
    upgrade_count = upgrade_count + 1
  where id = p_team_id
  returning * into updated_team;

  insert into public.transactions (team_id, amount, balance_after, type, note)
  values (
    p_team_id,
    -upgrade_cost,
    updated_team.total_money,
    'upgrade_purchase',
    upgrade_name
  );

  perform public.log_admin_action(
    p_team_id,
    current_team.name,
    'Upgrade gekocht',
    jsonb_build_object(
      'total_money', current_team.total_money,
      'income_per_minute', current_team.income_per_minute,
      'upgrade_count', current_team.upgrade_count
    ),
    jsonb_build_object(
      'upgrade', upgrade_name,
      'cost', upgrade_cost,
      'income_per_minute', updated_team.income_per_minute,
      'total_money', updated_team.total_money,
      'upgrade_count', updated_team.upgrade_count
    )
  );

  return updated_team;
end;
$$;

alter table public.teams enable row level security;
alter table public.transactions enable row level security;
alter table public.admin_logs enable row level security;
alter table public.settings enable row level security;

drop policy if exists "Public can read teams" on public.teams;
create policy "Public can read teams"
on public.teams for select
to anon, authenticated
using (true);

drop policy if exists "Public can read transactions" on public.transactions;
create policy "Public can read transactions"
on public.transactions for select
to anon, authenticated
using (true);

drop policy if exists "Admins can read logs" on public.admin_logs;
create policy "Admins can read logs"
on public.admin_logs for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can read settings" on public.settings;
create policy "Admins can read settings"
on public.settings for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can update settings" on public.settings;
create policy "Admins can update settings"
on public.settings for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant usage on schema public to anon, authenticated;
grant select on public.teams to anon, authenticated;
grant select on public.transactions to anon, authenticated;
grant select on public.admin_logs to authenticated;
grant select, update on public.settings to authenticated;

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
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'teams'
  ) then
    alter publication supabase_realtime add table public.teams;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'transactions'
  ) then
    alter publication supabase_realtime add table public.transactions;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'admin_logs'
  ) then
    alter publication supabase_realtime add table public.admin_logs;
  end if;
end;
$$;
