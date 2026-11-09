# Milestone 2 — User Authentication & Security Flow (Plan)

## Goal
Users can register (username, password, security question + answer), log in, log out, change their password, and recover a forgotten password with their security question — all against the **Development** Supabase project only.

## Decisions confirmed with the user (2026-11-09)
- **Security questions:** a standard fixed list of 5 (see "Security questions" below).
- **Password recovery:** included in this milestone, end-to-end (username → security question → new password).
- **Server-only secret key:** allowed. Used only on the server for registration and recovery; never sent to the browser.

## Approach

### 1. Usernames on top of Supabase Auth
Supabase Auth signs in with email + password, but the PRD asks for a **username**. Each username is mapped to an internal, never-shown address: `<username>@users.expenses.invalid` (`.invalid` is a reserved domain, so it can never be a real mailbox).
- Usernames: 3–30 characters, letters, digits, `.`, `_`, `-`; stored and compared in lowercase (so `Oran` and `oran` are the same account).
- Accounts are created on the server with the secret key (`auth.admin.createUser` with `email_confirm: true`), so no email confirmation is needed and no Supabase dashboard toggle has to change.
- Passwords: Supabase hashes them (bcrypt). Minimum length = Supabase's default (6). No extra rules are invented.
- If the chosen domain is rejected by Supabase's email check during the build, switch to another reserved name (e.g. `.example`) and note it in the ADR.

### 2. Session ends when the browser closes
PRD: "authentication ends when the browser session ends". Supabase normally stores long-lived cookies; we strip `maxAge` / `expires` from the auth cookies when setting them (but keep `maxAge: 0` when deleting), which turns them into **browser-session cookies**. Done in both the server client and the proxy.

### 3. Route protection — `src/proxy.ts`
Next.js 16 renamed Middleware to **Proxy** (`src/proxy.ts`). On every page request it:
- refreshes the Supabase session (official `@supabase/ssr` pattern, with the session-cookie rule above);
- sends signed-out visitors of protected pages to `/login`;
- sends signed-in visitors of `/login`, `/register`, `/recover` to `/`.
- Public paths: `/login`, `/register`, `/recover`, `/api/health`, static files.
Server Actions also re-check the user (`supabase.auth.getUser()`), since the proxy is only a first line of defense.

### 4. Security answer storage
Answers are normalized (trim, collapse spaces, lowercase) and stored only as a **salted scrypt hash** (Node's built-in `crypto`, no new package). The plain answer is never stored or logged.

### 5. Recovery flow (`/recover`)
1. Enter username → server looks up the profile (secret-key client) and shows that account's question. Unknown username → "No account found with this username."
2. Enter answer + new password + confirm → server checks the hash; wrong answer → error, password unchanged; correct → `auth.admin.updateUserById(id, { password })` → redirect to `/login` with "Password updated. Please log in."

### 6. Change Password (`/change-password`, signed-in only)
Fields: Current Password, New Password, Confirm Password (DESIGN.md + mockup; the wireframe omits Confirm — DESIGN wins on layout). Server checks the current password by signing in again with it; if wrong → error, nothing changes. Otherwise `auth.updateUser({ password })` → success message. `Back` returns to `/`.

### 7. Temporary signed-in Home (`/`)
Home with the side menu is Milestone 3. For now `/` (signed-in only) shows: "Welcome, <username>", the existing System Status card, and buttons **Change Password** and **Log Out**. Log Out signs out and returns to `/login`.

### 8. Buttons where mockup and DESIGN differ
The mockups show both "Register" and "Submit" on the same card. To avoid two buttons doing the same thing: one primary button (`Register` / `Change Password`) plus `Back`, matching the wireframe and DESIGN.md's "`Register` / `Submit`" wording.

## Database (Development only)

File: `supabase/migrations/0001_profiles.sql`
```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username = lower(username) and username ~ '^[a-z0-9._-]{3,30}$'),
  security_question text not null,
  security_answer_hash text not null,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
-- A signed-in user may read only their own row. No insert/update/delete
-- policies: those are done on the server with the secret key.
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());
-- Hide the answer hash from browser/user queries entirely.
revoke select on public.profiles from anon, authenticated;
grant select (id, username, security_question, created_at) on public.profiles to authenticated;
```
- **How it's applied:** no database password or CLI is used. I give you the SQL and you paste it into **expenses-dev → SQL Editor → Run** (step-by-step instructions at build time). Production is **not** touched now; it's applied at push time, only with your approval.
- Registration writes the profile with the secret-key client; if writing the profile fails, the just-created auth user is deleted so no half-registered account remains.

## Settings / keys
- New server-only variable `SUPABASE_SECRET_KEY` (Supabase → Project Settings → API Keys → **Secret key**, `sb_secret_…`).
- Add it to `.env.example`; you add the **Development** value to `.env` yourself.
- The Production value goes into Vercel only at push time (step-by-step guide then).
- `SETUP.md` currently says "never put the secret key anywhere" — update it to: allowed **only** as `SUPABASE_SECRET_KEY` (no `NEXT_PUBLIC_` prefix), never in the browser or GitHub.

## Security questions (fixed list)
1. What was the name of your first pet?
2. In what city were you born?
3. What is your mother's maiden name?
4. What was the name of your first school?
5. What was the name of your favorite childhood friend?

The server accepts only a question from this list.

## Files

**New**
- `supabase/migrations/0001_profiles.sql` — table, RLS, column grants.
- `src/proxy.ts` — session refresh + redirects.
- `src/lib/supabase/admin.ts` — secret-key client (`import "server-only"`).
- `src/lib/supabase/cookies.ts` — helper that turns auth cookies into browser-session cookies.
- `src/lib/auth/username.ts` — username rules + username → internal email.
- `src/lib/auth/security.ts` — question list, answer normalize/hash/verify (scrypt).
- `src/lib/auth/validation.ts` — shared form checks (client + server).
- `src/app/(auth)/layout.tsx` — centered card layout for auth screens.
- `src/app/(auth)/login/page.tsx` + form component — Username, Password, `Log In`, `Recover Password`, link "Don't have an account? Register".
- `src/app/(auth)/register/page.tsx` + form — Username, Password, Security Question dropdown, Security Answer, `Register`, `Back`.
- `src/app/(auth)/recover/page.tsx` + form — two steps described above, `Back`.
- `src/app/change-password/page.tsx` + form — Current/New/Confirm, `Change Password`, `Back`.
- `src/app/actions/auth.ts` — Server Actions: `register`, `login`, `logout`, `startRecovery`, `completeRecovery`, `changePassword`.

**Changed**
- `src/lib/supabase/server.ts` — use session-cookie helper; remove "Milestone 2" TODO comment.
- `src/lib/env.ts` — server-only getter for `SUPABASE_SECRET_KEY`.
- `src/app/page.tsx` — temporary signed-in Home (welcome, status card, Change Password, Log Out).
- `src/app/globals.css` — small additions if needed (`.form-error`, `.form-success`, `.select`), reusing existing theme classes.
- `.env.example`, `SETUP.md`, `spec/ARCHITECTURE.md` (ADRs), `spec/MILESTONES.md` (🟡 at the end).

## UI rules
- English text, LTR, existing "Galactic Odyssey" classes (`.card`, `.input`, `.label`, `.btn-primary`, `.btn-secondary`, `.glow-text`).
- Titles: "Registration", "Login", "Recover Password", "Change Password" (Orbitron, glow).
- Errors shown under the related field or at the top of the card, in amber (`#FFAA33`); success in cyan.
- Buttons disabled with "…" while submitting; never show success unless the server confirmed it. Network/server failure → "Something went wrong. Please try again."
- Responsive: the card fits a 375px phone with 16px side padding.

## ADRs to add in ARCHITECTURE.md
- ADR-6: Usernames mapped to internal `.invalid` emails in Supabase Auth.
- ADR-7: Server-only secret key for account creation and password recovery.
- ADR-8: Browser-session auth cookies (no max-age).
- ADR-9: Security answers hashed with scrypt in the app; hash column hidden from clients.

## How I'll check it during the build (Development only)
1. `npm run lint` and `npm run build` pass.
2. Run the dev server and, in the built-in browser:
   - signed-out visit to `/` → goes to `/login`;
   - register a test user → lands on `/` with "Welcome, <name>";
   - duplicate username, empty fields, missing question → clear errors;
   - log out → `/login`; wrong password → error; correct → `/`;
   - change password: wrong current → error; mismatch confirm → error; valid → success; old password no longer works, new one does;
   - recover: unknown username → error; wrong answer → error and password unchanged; right answer → new password works;
   - phone width (375px) looks right.
3. Confirm in the Dev database that the `profiles` row exists and holds a hash, not the plain answer, and that a signed-in user cannot read `security_answer_hash`.
4. Test accounts created during checks are listed for you; I won't delete them without asking.

## Definition of Done (from MILESTONES.md)
- Auth/security-question schema applied and tested on **Development only**.
- Register, log in, and change password work through their screens (plus recovery and log out, as agreed).
- All text and controls follow English/LTR and the Galactic Odyssey style.

## What you'll need to do during the build
1. Paste the Development secret key into `.env` as `SUPABASE_SECRET_KEY=` (I'll show exactly where to find it).
2. Run the SQL file in the **expenses-dev** SQL Editor (I'll walk you through it).
