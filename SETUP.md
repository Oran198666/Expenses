# Setup Guide

Step-by-step setup for the Expense Tracker: two Supabase projects (Development and Production), the local settings file, GitHub, and Vercel.

**Status (2026-11-09):** all steps verified — local app → `expenses-dev` (`tgbnylfwtmxkggbrqgkv`), live site → `expenses-prod` (`wzdfqgpqieendryuxwzo`).

**The idea in one line:** your computer always uses the **Development** database; the live website on Vercel always uses the **Production** database. Both use the same setting names, just with different values.

| Setting name | What it is | On your computer (`.env`) | On Vercel |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Address of the Supabase project | Development project URL | Production project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public key of the project | Development publishable key | Production publishable key |
| `NEXT_PUBLIC_APP_ENV` | Label shown on the status card | `development` | `production` |
| `SUPABASE_SECRET_KEY` | **Server-only** key for creating accounts and password recovery | Development secret key | Production secret key |

> The **secret** key (`sb_secret_…`) is allowed **only** under the name `SUPABASE_SECRET_KEY` (no `NEXT_PUBLIC_` in front), only in `.env` and in Vercel. Never paste it anywhere else, never share it, and never put it in GitHub. The `NEXT_PUBLIC_` prefix would send it to the browser — don't use it for this key.

---

## 1. Create the two Supabase projects
- [x] Go to https://supabase.com and sign in (or sign up — free plan is fine).
- [x] Click **New project**. Name: `expenses-dev`. Choose a strong database password (save it in your password manager) and the region closest to you. Click **Create new project** and wait ~2 minutes.
- [x] Do the same again with the name `expenses-prod`.

> Free projects are **paused after about a week without use**. If the site says it can't reach Supabase, open the project in supabase.com and click **Restore / Resume**.

## 2. Put the Development values in `.env`
- [x] In supabase.com open **expenses-dev**.
- [x] Click **Connect** (top of the page) or go to **Project Settings → API Keys / Data API**.
- [x] Copy the **Project URL** (looks like `https://abcd1234.supabase.co`).
- [x] Copy the **Publishable key** (starts with `sb_publishable_…`). If you only see "anon public" — that one works too.
- [x] Open the file `.env` in the project folder and fill it in:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://<your-dev-project>.supabase.co
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<dev publishable key>
  NEXT_PUBLIC_APP_ENV=development
  ```
- [x] Save the file. (`.env` is never uploaded to GitHub.)

## 3. Run it on your computer
- [x] Ask Claude: "Run it so I can check" — or run `npm install` then `npm run dev` yourself.
- [x] Open http://localhost:3000.
- [x] The **System Status** card should say ✅ **Connected to Supabase (Development)** and show your dev project's ID.

## 4. GitHub
- [x] Repository: https://github.com/Oran198666/Expenses (already connected).
- [x] Claude uploads ("pushes") the code only after you approve.

## 5. Vercel (the live website)
- [x] Go to https://vercel.com and **Sign up / Log in with GitHub**.
- [x] Click **Add New… → Project**, find **Expenses** and click **Import**. (If it isn't listed, click "Adjust GitHub App Permissions" and allow the Expenses repo.)
- [x] Framework should show **Next.js** automatically. Leave build settings as they are.
- [x] Open **Environment Variables** and add the three settings with the **Production** values (from `expenses-prod`, same place as in step 2):
  - `NEXT_PUBLIC_SUPABASE_URL` = prod Project URL
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = prod publishable key
  - `NEXT_PUBLIC_APP_ENV` = `production`
- [x] Click **Deploy** and wait for "Congratulations".
- [x] From now on, every push to GitHub updates the live site automatically.

> Changed a setting on Vercel later? Go to **Deployments → ⋯ → Redeploy**, because these settings are baked in when the site is built.

## 6. Check the live site
- [x] Open the live site: https://expenses-mauve-ten.vercel.app/
- [x] The **System Status** card should say ✅ **Connected to Supabase (Production)** with the **prod** project ID (different from the dev one).

---

## 7. Milestone 2 — login and accounts
- [x] **Development secret key:** supabase.com → **expenses-dev** → **Project Settings → API Keys** → under **Secret keys** click the copy icon (starts with `sb_secret_…`). In `.env` add a new line: `SUPABASE_SECRET_KEY=<the key>`. Save. (If the app is running, restart it.)
- [x] **Development database table:** supabase.com → **expenses-dev** → **SQL Editor** → **New query** → paste the whole file `supabase/migrations/0001_profiles.sql` → **Run**. You should see "Success. No rows returned".
- [x] **Production (only at push time, after approval):** run the same SQL in **expenses-prod**, and add `SUPABASE_SECRET_KEY` with the **prod** secret key in Vercel → Project → **Settings → Environment Variables**, then redeploy.

## Rules going forward
- Database changes (new tables etc.) are always tried on **Development** first.
- They go to **Production** only after your approval, and before the matching code goes live.
- Settings that aren't part of the database itself (login options, email templates, etc.) must be set **by hand in both** Supabase projects.

## Troubleshooting
| What you see | What to do |
| --- | --- |
| "Missing setting: …" | A line in `.env` (or on Vercel) is empty. Fill it in, then restart the app / redeploy. |
| "Supabase rejected the key" | The key was copied wrong or belongs to the other project. Copy it again. |
| "Could not reach Supabase" | Check the URL, your internet, and whether the project is paused. |
| Live site shows "Development" | The Vercel setting `NEXT_PUBLIC_APP_ENV` isn't `production`, or you copied the dev values to Vercel. Fix and redeploy. |
