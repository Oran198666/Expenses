-- Milestone 2: user profiles (username + security question for password recovery).
-- Apply to the Development project first; Production only after approval.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique
    check (username = lower(username) and username ~ '^[a-z0-9._-]{3,30}$'),
  security_question text not null,
  security_answer_hash text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- A signed-in user may read only their own row. Inserts/updates/deletes are
-- done only on the server with the secret key, so no policies exist for them.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

-- Browser-side keys must never see the security answer hash.
revoke all on public.profiles from anon, authenticated;
grant select (id, username, security_question, created_at)
  on public.profiles to authenticated;
