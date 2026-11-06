-- Uyvo. A player can read and write only their own rows.
-- security definer functions stay in private, which is not exposed to the Data API.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;
grant usage on schema private to supabase_auth_admin;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Hero',
  avatar_id text not null default 'woman',
  onboarded_at timestamptz,
  reminders_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (
    char_length(btrim(display_name)) between 2 and 24
    and display_name = btrim(display_name)
  ),
  constraint profiles_avatar_id check (avatar_id in ('woman', 'man'))
);

create table public.wallets (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  iron_shards integer not null default 0,
  flow_points integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint wallets_nonnegative check (iron_shards >= 0 and flow_points >= 0)
);

create table public.quest_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  client_id uuid not null unique,
  local_date date not null,
  quest_key text not null,
  food_key text,
  vitamin_c_food text,
  vitamin_c boolean not null default false,
  base_iron integer not null,
  base_flow integer not null,
  iron_shards_awarded integer not null,
  flow_points_awarded integer not null,
  logged_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint quest_logs_food check (
    (quest_key = 'lunch_greens' and food_key in ('keerai', 'spinach', 'beetroot'))
    or (quest_key <> 'lunch_greens' and food_key is null)
  ),
  constraint quest_logs_vitamin check (
    vitamin_c = (vitamin_c_food is not null)
    and (vitamin_c_food is null or vitamin_c_food in ('lemon', 'guava'))
    and (
      vitamin_c = false
      or quest_key in ('morning_shot', 'midmorning_juice', 'lunch_greens')
    )
  ),
  constraint quest_logs_awards check (
    iron_shards_awarded = base_iron * (case when vitamin_c then 2 else 1 end)
    and flow_points_awarded = base_flow
  ),
  constraint quest_logs_bases check (
    (quest_key = 'morning_shot' and base_iron = 10 and base_flow = 0)
    or (quest_key = 'midmorning_juice' and base_iron = 15 and base_flow = 5)
    or (quest_key = 'lunch_greens' and base_iron = 15 and base_flow = 0)
    or (quest_key = 'water' and base_iron = 0 and base_flow = 5)
    or (quest_key = 'banana' and base_iron = 0 and base_flow = 5)
    or (quest_key = 'walk' and base_iron = 0 and base_flow = 10)
    or (quest_key = 'digest_survive' and base_iron = 5 and base_flow = 0)
  )
);

create unique index quest_logs_singleton_idx
  on public.quest_logs (user_id, local_date, quest_key)
  where quest_key <> 'water';

create index quest_logs_user_date_idx on public.quest_logs (user_id, local_date);

create table public.tea_windows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  client_id uuid not null unique,
  local_date date not null,
  started_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null,
  drank_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tea_windows_one_day unique (user_id, local_date),
  constraint tea_windows_length check (ends_at = started_at + interval '60 minutes'),
  constraint tea_windows_status check (status in ('active', 'survived', 'drank')),
  constraint tea_windows_drank check (
    (status = 'drank' and drank_at is not null)
    or (status <> 'drank' and drank_at is null)
  )
);

create index tea_windows_user_id_idx on public.tea_windows (user_id);

create table public.streaks (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_success_date date,
  updated_at timestamptz not null default now(),
  constraint streaks_bounds check (
    current_streak >= 0
    and longest_streak >= current_streak
  )
);

create table public.badges (
  user_id uuid not null references public.profiles (id) on delete cascade,
  badge_key text not null,
  earned_on date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, badge_key),
  constraint badges_key check (
    badge_key in ('capillary_creator', 'oxygen_optimizer', 'hemoglobin_master')
  )
);

create table public.tree_state (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  weeks_completed integer not null default 0,
  fruit_count integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint tree_state_fruit check (
    fruit_count = weeks_completed
    and fruit_count >= 0
  )
);

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  insert into public.wallets (user_id) values (new.id);
  insert into public.streaks (user_id) values (new.id);
  insert into public.tree_state (user_id) values (new.id);
  return new;
end;
$$;

create or replace function private.guard_quest_log()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.quest_key = 'water' then
    if (
      select count(*)
      from public.quest_logs
      where user_id = new.user_id
        and local_date = new.local_date
        and quest_key = 'water'
    ) >= 12 then
      raise exception 'water cap reached';
    end if;
  end if;

  if new.quest_key in ('morning_shot', 'midmorning_juice', 'lunch_greens') then
    if exists (
      select 1
      from public.tea_windows as tea
      where tea.user_id = new.user_id
        and new.logged_at >= tea.started_at
        and new.logged_at < tea.ends_at
        and tea.status in ('active', 'drank')
    ) then
      raise exception 'iron locked by tea window';
    end if;
  end if;

  if new.quest_key = 'digest_survive' then
    if not exists (
      select 1
      from public.tea_windows as tea
      where tea.user_id = new.user_id
        and tea.local_date = new.local_date
        and tea.status = 'survived'
    ) then
      raise exception 'digest bonus requires a survived window';
    end if;
  end if;

  return new;
end;
$$;

create or replace function private.guard_tea_window()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.status <> 'active' or new.drank_at is not null then
      raise exception 'new window must be active';
    end if;
    if new.ends_at <> new.started_at + interval '60 minutes' then
      raise exception 'digest window must be 60 minutes';
    end if;
    if not exists (
      select 1
      from public.quest_logs
      where user_id = new.user_id
        and local_date = new.local_date
        and quest_key = 'lunch_greens'
    ) then
      raise exception 'lunch required before digest';
    end if;
    return new;
  end if;

  if new.user_id <> old.user_id
    or new.local_date <> old.local_date
    or new.started_at <> old.started_at
    or new.ends_at <> old.ends_at
    or new.client_id <> old.client_id
    or new.id <> old.id then
    raise exception 'tea window bounds are fixed';
  end if;

  if old.status = 'active' and new.status = 'survived' and new.drank_at is null then
    return new;
  end if;
  if old.status = 'active' and new.status = 'drank' and new.drank_at is not null then
    return new;
  end if;
  if old.status = new.status and old.drank_at is not distinct from new.drank_at then
    return new;
  end if;
  raise exception 'illegal tea transition';
end;
$$;

create or replace function private.apply_quest_reward()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.wallets (user_id, iron_shards, flow_points)
  values (new.user_id, new.iron_shards_awarded, new.flow_points_awarded)
  on conflict (user_id) do update
    set iron_shards = public.wallets.iron_shards + excluded.iron_shards,
        flow_points = public.wallets.flow_points + excluded.flow_points,
        updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch
  before update on public.profiles
  for each row execute function private.touch_updated_at();

create trigger tea_windows_touch
  before update on public.tea_windows
  for each row execute function private.touch_updated_at();

create trigger streaks_touch
  before update on public.streaks
  for each row execute function private.touch_updated_at();

create trigger tree_state_touch
  before update on public.tree_state
  for each row execute function private.touch_updated_at();

create trigger quest_logs_guard
  before insert on public.quest_logs
  for each row execute function private.guard_quest_log();

create trigger quest_logs_reward
  after insert on public.quest_logs
  for each row execute function private.apply_quest_reward();

create trigger tea_windows_guard
  before insert or update on public.tea_windows
  for each row execute function private.guard_tea_window();

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

revoke all on function private.touch_updated_at() from public;
revoke all on function private.handle_new_user() from public;
revoke all on function private.guard_quest_log() from public;
revoke all on function private.guard_tea_window() from public;
revoke all on function private.apply_quest_reward() from public;

grant execute on function private.touch_updated_at() to authenticated;
grant execute on function private.guard_quest_log() to authenticated;
grant execute on function private.guard_tea_window() to authenticated;
grant execute on function private.apply_quest_reward() to authenticated;
grant execute on function private.handle_new_user() to supabase_auth_admin;

alter table public.profiles enable row level security;
alter table public.profiles force row level security;
alter table public.wallets enable row level security;
alter table public.wallets force row level security;
alter table public.quest_logs enable row level security;
alter table public.quest_logs force row level security;
alter table public.tea_windows enable row level security;
alter table public.tea_windows force row level security;
alter table public.streaks enable row level security;
alter table public.streaks force row level security;
alter table public.badges enable row level security;
alter table public.badges force row level security;
alter table public.tree_state enable row level security;
alter table public.tree_state force row level security;

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));
create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check (id = (select auth.uid()));
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy wallets_select_own on public.wallets
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy quest_logs_select_own on public.quest_logs
  for select to authenticated
  using (user_id = (select auth.uid()));
create policy quest_logs_insert_own on public.quest_logs
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy tea_windows_select_own on public.tea_windows
  for select to authenticated
  using (user_id = (select auth.uid()));
create policy tea_windows_insert_own on public.tea_windows
  for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy tea_windows_update_own on public.tea_windows
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy streaks_select_own on public.streaks
  for select to authenticated
  using (user_id = (select auth.uid()));
create policy streaks_update_own on public.streaks
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy badges_select_own on public.badges
  for select to authenticated
  using (user_id = (select auth.uid()));
create policy badges_insert_own on public.badges
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy tree_state_select_own on public.tree_state
  for select to authenticated
  using (user_id = (select auth.uid()));
create policy tree_state_update_own on public.tree_state
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke all on table public.profiles from anon, authenticated, public;
revoke all on table public.wallets from anon, authenticated, public;
revoke all on table public.quest_logs from anon, authenticated, public;
revoke all on table public.tea_windows from anon, authenticated, public;
revoke all on table public.streaks from anon, authenticated, public;
revoke all on table public.badges from anon, authenticated, public;
revoke all on table public.tree_state from anon, authenticated, public;

grant select, insert, update on table public.profiles to authenticated;
grant select on table public.wallets to authenticated;
grant select, insert on table public.quest_logs to authenticated;
grant select, insert, update on table public.tea_windows to authenticated;
grant select, update on table public.streaks to authenticated;
grant select, insert on table public.badges to authenticated;
grant select, update on table public.tree_state to authenticated;
