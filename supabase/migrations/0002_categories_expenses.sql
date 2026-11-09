-- Milestone 3: categories and expenses.
-- Apply to the Development project first; Production only after approval.

-- ---------- Categories ----------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 40),
  is_predefined boolean not null default false,
  created_at timestamptz not null default now(),
  -- Target for the composite foreign key in expenses (see ADR-13).
  unique (id, user_id)
);

-- Names are unique per user, ignoring case and surrounding spaces.
create unique index if not exists categories_user_name_key
  on public.categories (user_id, lower(btrim(name)));

-- ---------- Expenses ----------
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category_id uuid not null,
  description text check (description is null or char_length(description) <= 200),
  amount numeric(10, 2) not null check (amount > 0 and amount <= 100000),
  currency text not null
    check (currency in ('ILS', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF')),
  -- The app checks against the user's local "today"; this is a safety net (ADR-11).
  expense_date date not null check (expense_date <= current_date + 1),
  created_at timestamptz not null default now(),
  -- The category must belong to the same user and can't be deleted while used.
  constraint expenses_category_fkey foreign key (category_id, user_id)
    references public.categories (id, user_id) on delete restrict
);

create index if not exists expenses_user_date_idx
  on public.expenses (user_id, expense_date desc, created_at desc);
create index if not exists expenses_category_idx
  on public.expenses (category_id);

-- ---------- Row Level Security: each user sees and changes only their own rows ----------
alter table public.categories enable row level security;
alter table public.expenses enable row level security;

revoke all on public.categories from anon;
revoke all on public.expenses from anon;
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.expenses to authenticated;

drop policy if exists "categories_select_own" on public.categories;
create policy "categories_select_own" on public.categories
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "categories_insert_own" on public.categories;
create policy "categories_insert_own" on public.categories
  for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "categories_update_own" on public.categories;
create policy "categories_update_own" on public.categories
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "categories_delete_own" on public.categories;
create policy "categories_delete_own" on public.categories
  for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists "expenses_select_own" on public.expenses;
create policy "expenses_select_own" on public.expenses
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "expenses_insert_own" on public.expenses;
create policy "expenses_insert_own" on public.expenses
  for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "expenses_update_own" on public.expenses;
create policy "expenses_update_own" on public.expenses
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "expenses_delete_own" on public.expenses;
create policy "expenses_delete_own" on public.expenses
  for delete to authenticated using (user_id = (select auth.uid()));

-- ---------- Predefined categories (ADR-12) ----------
-- Adds the 10 PRD categories for one user. created_at is staggered by 1 ms so
-- the list keeps the PRD order when sorted by creation time.
create or replace function public.seed_default_categories(target_user uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.categories (user_id, name, is_predefined, created_at)
  select target_user, d.name, true, now() + (d.ord * interval '1 millisecond')
  from unnest(array[
    'Food', 'Fuel', 'Leisure', 'Utilities & Bills', 'Shopping',
    'Transportation', 'Health', 'Education', 'Housing', 'Other'
  ]) with ordinality as d(name, ord)
  on conflict do nothing;
$$;

revoke all on function public.seed_default_categories(uuid) from public, anon, authenticated;

create or replace function public.on_profile_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.seed_default_categories(new.id);
  return new;
end;
$$;

revoke all on function public.on_profile_created() from public, anon, authenticated;

drop trigger if exists profiles_seed_categories on public.profiles;
create trigger profiles_seed_categories
  after insert on public.profiles
  for each row execute function public.on_profile_created();

-- Users who registered before this migration get the categories once now.
select public.seed_default_categories(p.id)
from public.profiles p
where not exists (select 1 from public.categories c where c.user_id = p.id);
