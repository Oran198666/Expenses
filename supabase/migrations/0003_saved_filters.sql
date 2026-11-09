-- Milestone 4: saved filters.
-- Apply to the Development project first; Production only after approval.

create table if not exists public.saved_filters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 40),
  filter_criteria jsonb not null check (jsonb_typeof(filter_criteria) = 'object'),
  created_at timestamptz not null default now()
);

-- Names are unique per user, ignoring case and surrounding spaces.
create unique index if not exists saved_filters_user_name_key
  on public.saved_filters (user_id, lower(btrim(name)));

-- ---------- Row Level Security: each user sees and changes only their own rows ----------
alter table public.saved_filters enable row level security;

revoke all on public.saved_filters from anon;
grant select, insert, update, delete on public.saved_filters to authenticated;

drop policy if exists "saved_filters_select_own" on public.saved_filters;
create policy "saved_filters_select_own" on public.saved_filters
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "saved_filters_insert_own" on public.saved_filters;
create policy "saved_filters_insert_own" on public.saved_filters
  for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "saved_filters_update_own" on public.saved_filters;
create policy "saved_filters_update_own" on public.saved_filters
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "saved_filters_delete_own" on public.saved_filters;
create policy "saved_filters_delete_own" on public.saved_filters
  for delete to authenticated using (user_id = (select auth.uid()));
