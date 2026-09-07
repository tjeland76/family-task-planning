-- v0.2: push notifications (task assignment + due-today reminders).
-- See PRODUCT_SPEC_0-2.md.

create table notification_preferences (
  id uuid primary key default gen_random_uuid(),
  family_member_id uuid not null unique references family_members (id) on delete cascade,
  task_assigned_enabled boolean not null default true,
  due_today_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger notification_preferences_set_updated_at
  before update on notification_preferences
  for each row
  execute function set_updated_at();

-- A family member may have multiple devices (phone, tablet), each its own
-- subscription row, distinguished by the browser-issued endpoint URL.
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  family_member_id uuid not null references family_members (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_used_at timestamptz
);

create index push_subscriptions_family_member_id_idx on push_subscriptions (family_member_id);

create trigger push_subscriptions_set_updated_at
  before update on push_subscriptions
  for each row
  execute function set_updated_at();

create table notification_delivery_log (
  id uuid primary key default gen_random_uuid(),
  family_member_id uuid not null references family_members (id) on delete cascade,
  notification_type text not null,
  reference_date date,
  reference_id uuid,
  sent_at timestamptz not null default now()
);

create index notification_delivery_log_family_member_id_idx
  on notification_delivery_log (family_member_id);

-- Idempotency guard: at most one due-today reminder per member per day, even
-- if the scheduled job's hourly check fires more than once in a day.
create unique index notification_delivery_log_due_today_idx
  on notification_delivery_log (family_member_id, reference_date)
  where notification_type = 'due_today';

-- Backfill: every parent who joined before this migration existed needs a
-- preferences row too, not just members created from here on.
insert into notification_preferences (family_member_id)
select id from family_members where role = 'parent'
on conflict (family_member_id) do nothing;

alter table notification_preferences enable row level security;
alter table push_subscriptions enable row level security;
alter table notification_delivery_log enable row level security;

-- Personal data (device registrations, per-person preferences) -- scoped to
-- the caller's own family_member id(s), not the whole family, unlike most
-- other tables in this app.
create policy "notification_preferences: select own" on notification_preferences
  for select using (family_member_id in (select get_my_family_member_ids()));

create policy "notification_preferences: update own" on notification_preferences
  for update using (family_member_id in (select get_my_family_member_ids()));

create policy "push_subscriptions: select own" on push_subscriptions
  for select using (family_member_id in (select get_my_family_member_ids()));

create policy "push_subscriptions: insert own" on push_subscriptions
  for insert with check (family_member_id in (select get_my_family_member_ids()));

create policy "push_subscriptions: update own" on push_subscriptions
  for update using (family_member_id in (select get_my_family_member_ids()));

create policy "push_subscriptions: delete own" on push_subscriptions
  for delete using (family_member_id in (select get_my_family_member_ids()));

-- notification_delivery_log is written only by server-side code using the
-- service-role client (bypasses RLS) -- no insert/update/delete policy for
-- normal roles. Select is allowed for the record's own family member only,
-- for potential future transparency/debugging use.
create policy "notification_delivery_log: select own" on notification_delivery_log
  for select using (family_member_id in (select get_my_family_member_ids()));

-- Every parent gets default (both enabled) notification preferences from
-- the moment they create or join a family, same pattern as
-- seed_default_categories -- avoids null-handling everywhere else.
create function seed_notification_preferences(p_family_member_id uuid) returns void
language sql security definer set search_path = public as $$
  insert into notification_preferences (family_member_id) values (p_family_member_id);
$$;

create or replace function create_family(p_family_name text) returns table (family_id uuid, join_code text)
language plpgsql security definer set search_path = public as $$
declare
  v_profile_id uuid;
  v_family_id uuid;
  v_join_code text;
  v_family_member_id uuid;
begin
  select id into v_profile_id from profiles where user_id = auth.uid();
  if v_profile_id is null then
    raise exception 'no_profile_for_user';
  end if;

  if exists (select 1 from family_members where profile_id = v_profile_id) then
    raise exception 'already_in_family';
  end if;

  loop
    v_join_code := generate_join_code();
    begin
      insert into families (name, join_code) values (p_family_name, v_join_code)
        returning id into v_family_id;
      exit;
    exception when unique_violation then
      -- join_code collision (astronomically unlikely at 6 chars) -- retry.
    end;
  end loop;

  insert into family_members (family_id, profile_id, display_name, role)
    select v_family_id, v_profile_id, display_name, 'parent' from profiles where id = v_profile_id
    returning id into v_family_member_id;

  perform seed_default_categories(v_family_id);
  perform seed_notification_preferences(v_family_member_id);

  return query select v_family_id, v_join_code;
end;
$$;

create or replace function join_family_by_code(p_join_code text) returns table (family_id uuid, family_name text)
language plpgsql security definer set search_path = public as $$
declare
  v_profile_id uuid;
  v_family_id uuid;
  v_family_name text;
  v_family_member_id uuid;
begin
  select id into v_profile_id from profiles where user_id = auth.uid();
  if v_profile_id is null then
    raise exception 'no_profile_for_user';
  end if;

  if exists (select 1 from family_members where profile_id = v_profile_id) then
    raise exception 'already_in_family';
  end if;

  select id, name into v_family_id, v_family_name from families
    where join_code = upper(trim(p_join_code));

  if v_family_id is null then
    raise exception 'invalid_join_code';
  end if;

  insert into family_members (family_id, profile_id, display_name, role)
    select v_family_id, v_profile_id, display_name, 'parent' from profiles where id = v_profile_id
    returning id into v_family_member_id;

  perform seed_notification_preferences(v_family_member_id);

  return query select v_family_id, v_family_name;
end;
$$;
