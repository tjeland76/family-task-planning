-- Family Tasks: initial schema (spec section 16, plus join_code for invites).

create extension if not exists pgcrypto;

create type family_member_role as enum ('parent', 'child');
create type task_status as enum ('todo', 'done');
create type task_recurrence as enum ('never', 'daily', 'weekly', 'monthly', 'yearly');

create table families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  -- Shareable invite code so a second parent can join this family at signup.
  -- Generated in application code (with collision retry), not here, so we can
  -- control the alphabet/length and retry cleanly on a unique-violation.
  join_code text not null unique,
  created_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families (id) on delete cascade,
  -- Null for children, who have no auth.users / profiles row in v0.1.
  profile_id uuid references profiles (id) on delete cascade,
  display_name text not null,
  role family_member_role not null,
  created_at timestamptz not null default now(),
  constraint family_members_profile_unique_per_family unique (family_id, profile_id)
);

create index family_members_family_id_idx on family_members (family_id);
create index family_members_profile_id_idx on family_members (profile_id);

create table categories (
  id uuid primary key default gen_random_uuid(),
  -- Null family_id reserved for a future shared set of default categories;
  -- v0.1 seeds per-family rows from the suggested list in spec section 15.
  family_id uuid references families (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index categories_family_id_idx on categories (family_id);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families (id) on delete cascade,
  title text not null,
  description text,

  assigned_to uuid references family_members (id) on delete set null,
  created_by uuid not null references family_members (id) on delete restrict,

  category_id uuid references categories (id) on delete set null,

  due_date date,

  status task_status not null default 'todo',
  recurrence task_recurrence not null default 'never',

  reward_amount decimal(10, 2),
  requires_approval boolean not null default false,

  -- Links a recurring task's completed occurrence to the next one generated
  -- from it (spec section 14). Self-referential, so occurrences form a chain.
  parent_task_id uuid references tasks (id) on delete set null,

  completed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Today / My Tasks / Family views all filter on these.
create index tasks_family_status_due_idx on tasks (family_id, status, due_date);
create index tasks_assigned_to_idx on tasks (assigned_to);
create index tasks_parent_task_id_idx on tasks (parent_task_id);

create function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tasks_set_updated_at
  before update on tasks
  for each row
  execute function set_updated_at();

-- Auto-create a profile row whenever a new Supabase Auth user signs up, so
-- profile creation can never be skipped by a failed follow-up client call.
create function handle_new_auth_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function handle_new_auth_user();

-- Future (not built in v0.1 — spec section 17): reward_transactions ledger
-- (id, family_id, child_id -> family_members, task_id nullable, type
-- earned|paid|adjustment, amount, created_by, created_at). Balances are
-- computed by summing transactions, never stored as a mutable field.
