-- Family Tasks: Row Level Security.
--
-- Every policy below scopes rows through get_my_family_ids(), a
-- SECURITY DEFINER helper. Querying family_members directly from a
-- family_members policy causes infinite recursion (the policy would need to
-- evaluate itself to evaluate itself) -- the helper function sidesteps that
-- by running as its owner, outside RLS, and returning a plain set of ids.

create function get_my_family_ids() returns setof uuid
language sql security definer stable set search_path = public as $$
  select family_id from family_members
  where profile_id = (select id from profiles where user_id = auth.uid())
$$;

create function get_my_family_member_ids() returns setof uuid
language sql security definer stable set search_path = public as $$
  select id from family_members
  where profile_id = (select id from profiles where user_id = auth.uid())
$$;

alter table families enable row level security;
alter table profiles enable row level security;
alter table family_members enable row level security;
alter table categories enable row level security;
alter table tasks enable row level security;

-- profiles: a user can only ever see/edit their own row. Other family
-- members' names are read via family_members.display_name instead, so
-- there's no need to open profiles up to the rest of the family.
create policy "profiles: select own" on profiles
  for select using (user_id = auth.uid());

create policy "profiles: update own" on profiles
  for update using (user_id = auth.uid());

-- families: visible to members; creation/joining happens only through the
-- create_family / join_family_by_code functions below (SECURITY DEFINER),
-- never a direct insert, so there is no client-facing insert policy here.
create policy "families: select own" on families
  for select using (id in (select get_my_family_ids()));

create policy "families: update own" on families
  for update using (id in (select get_my_family_ids()));

-- family_members: any member can see the rest of their family (including
-- children, who have no auth identity of their own). Direct client inserts
-- are restricted to child rows -- adding a *parent* row must go through the
-- join-code flow, so nobody can grant themselves family membership by
-- inserting a role='parent' row directly.
create policy "family_members: select own family" on family_members
  for select using (family_id in (select get_my_family_ids()));

create policy "family_members: insert child" on family_members
  for insert with check (
    family_id in (select get_my_family_ids())
    and role = 'child'
    and profile_id is null
  );

create policy "family_members: update child" on family_members
  for update using (
    family_id in (select get_my_family_ids()) and role = 'child'
  );

create policy "family_members: delete child" on family_members
  for delete using (
    family_id in (select get_my_family_ids()) and role = 'child'
  );

-- categories: family-scoped, or shared (family_id is null) for a possible
-- future default set. No update/delete policy in v0.1 -- custom category
-- management is out of scope (spec section 15).
create policy "categories: select own family or shared" on categories
  for select using (family_id is null or family_id in (select get_my_family_ids()));

create policy "categories: insert own family" on categories
  for insert with check (family_id in (select get_my_family_ids()));

-- tasks: any parent in the family can see/create/edit/delete any task in
-- that family (spec section 5 -- task management is family-wide, not
-- restricted to the assignee). created_by must be one of the caller's own
-- family_members rows so nobody can attribute a task to someone else.
create policy "tasks: select own family" on tasks
  for select using (family_id in (select get_my_family_ids()));

create policy "tasks: insert own family" on tasks
  for insert with check (
    family_id in (select get_my_family_ids())
    and created_by in (select get_my_family_member_ids())
  );

create policy "tasks: update own family" on tasks
  for update using (family_id in (select get_my_family_ids()));

create policy "tasks: delete own family" on tasks
  for delete using (family_id in (select get_my_family_ids()));

-- Default categories seeded for every new family (spec section 15).
create function seed_default_categories(p_family_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into categories (family_id, name)
  select p_family_id, name from unnest(array[
    'Home', 'Family', 'School', 'Money', 'Car', 'Pets', 'Appointments', 'Shopping', 'Other'
  ]) as name;
end;
$$;

create function generate_join_code() returns text
language plpgsql as $$
declare
  -- Excludes 0/O and 1/I to avoid ambiguity when a code is read aloud or texted.
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
begin
  code := '';
  for i in 1..6 loop
    code := code || substr(alphabet, floor(random() * length(alphabet) + 1)::int, 1);
  end loop;
  return code;
end;
$$;

-- Creates a new family, adds the calling user as its first parent, and
-- seeds default categories. SECURITY DEFINER so it can insert the first
-- family_members row before the caller has any family membership to
-- satisfy the normal RLS policies with.
create function create_family(p_family_name text) returns table (family_id uuid, join_code text)
language plpgsql security definer set search_path = public as $$
declare
  v_profile_id uuid;
  v_family_id uuid;
  v_join_code text;
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
    select v_family_id, v_profile_id, display_name, 'parent' from profiles where id = v_profile_id;

  perform seed_default_categories(v_family_id);

  return query select v_family_id, v_join_code;
end;
$$;

-- Joins an existing family by its shareable code, as a parent. SECURITY
-- DEFINER for the same reason as create_family: the caller has no family
-- membership yet, so the normal family_members insert policy (which only
-- allows adding *children*) does not apply here.
create function join_family_by_code(p_join_code text) returns table (family_id uuid, family_name text)
language plpgsql security definer set search_path = public as $$
declare
  v_profile_id uuid;
  v_family_id uuid;
  v_family_name text;
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
    select v_family_id, v_profile_id, display_name, 'parent' from profiles where id = v_profile_id;

  return query select v_family_id, v_family_name;
end;
$$;
