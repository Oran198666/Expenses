# Milestone 1 — Project Setup, Environment Configuration & Dual Supabase Strategy

Source: `spec/MILESTONES.md` → Milestone 1. Supporting specs: `ARCHITECTURE.md` (stack, dual Supabase, Vercel), `DESIGN.md` + `style-guide.jpg` / `mockups.jpg` (theme).

## Goal
A Next.js + Tailwind app skeleton, styled with the "Galactic Odyssey" theme, that:
- builds and runs locally,
- talks to the **Development** Supabase project (local `.env`),
- is deployed on **Vercel** from GitHub and talks to the **Production** Supabase project (Vercel env vars),
- has written, verified setup steps for both Supabase projects, GitHub and Vercel.

No database tables, no login screens, no expense features — those are Milestones 2+.

## Out of scope for this milestone
- Any SQL schema / migrations (Milestone 2 onwards). Production DB stays empty.
- Auth screens, navigation menu with working pages, middleware/route protection.
- Supabase Auth settings (email confirmation, etc.) — handled in Milestone 2.

---

## 1. Project scaffold

- Tooling available on this machine: Node 24, npm 11.
- Create the app with `create-next-app@latest` options: **TypeScript, App Router, Tailwind CSS, ESLint, `src/` directory, import alias `@/*`, npm**.
- `create-next-app` refuses a non-empty folder (we have `CLAUDE.md`, `spec/`, etc.), so: scaffold into a temp folder in the scratchpad (with `--skip-install --disable-git`), then copy the generated files into the project root.
  - Do **not** overwrite the existing `.gitignore`; only add lines it lacks (e.g. `next-env.d.ts`, `.env*.local` is already covered by `.env.*`).
  - Do not touch `CLAUDE.md`, `spec/`, `_backup/`, `_templates_unused/`, `md files/`.
- Install extra packages now (needed by the setup itself):
  - `@supabase/supabase-js`, `@supabase/ssr` — Supabase client for browser and server.
  - `lucide-react` — icons (used by the placeholder page).
- Do **not** install `recharts`, `jspdf`, `papaparse` yet — they belong to Milestone 5.
- `tsconfig.json`: make sure `_backup`, `_templates_unused`, `md files` are not compiled (they hold no code, but exclude them to be safe).

### Resulting structure (main files)
```
package.json, next.config.ts, tsconfig.json, postcss.config.mjs, eslint.config.mjs
.env.example                      # variable names, no values
.env                              # copy of .env.example — user fills Development values
SETUP.md                          # step-by-step setup guide (see §5)
src/app/layout.tsx                # fonts, <html lang="en" dir="ltr">, theme background
src/app/globals.css               # Tailwind + Galactic Odyssey theme tokens
src/app/page.tsx                  # placeholder home: title + connection status card
src/app/api/health/route.ts       # server check: is Supabase reachable?
src/lib/supabase/client.ts        # browser Supabase client
src/lib/supabase/server.ts        # server Supabase client (cookies via @supabase/ssr)
src/lib/env.ts                    # reads/validates env vars, clear error if missing
```

## 2. Galactic Odyssey theme (Tailwind)

Tailwind v4 style: theme tokens in `src/app/globals.css` under `@theme`.

| Token | Value | Use |
| --- | --- | --- |
| `--color-cosmic` | `#0A1128` | page background (Primary) |
| `--color-violet` | `#4C1C73` | panels / structure (Accent 1) |
| `--color-neon-pink` | `#FF66FF` | primary highlights, card borders (Accent 2) |
| `--color-cyan` | `#00FFFF` | interactive elements, input borders (Accent 3) |
| `--color-amber` | `#FFAA33` | warnings / alerts (Highlight 1) |
| `--color-silver` | `#C0C0C0` | neutral text (Highlight 2) |
| `--radius-card` | `8px` | containers / cards |

Plus a few reusable CSS utility classes, built once here so later milestones reuse them (based on the style guide image):
- `.card` — dark panel, thin pink/violet border, 8px radius, soft neon glow shadow.
- `.btn-primary` — pill shape, violet fill, neon border glow (like "Add Expense" / "Submit").
- `.btn-secondary` — pill shape, cyan outline (like "Next" / "Back").
- `.input` — dark field with cyan border, 16px text, padded.
- `.glow-text` — pink→cyan glow for big headings.
- Spacing follows 16px / 24px steps (Tailwind `4` / `6`).

**Typography.** "Star Sans Pro" is not available as a free web font. Default choice (can be changed by the user before the build): free Google fonts via `next/font/google` —
- **Orbitron** for H1/H2 (uppercase, geometric retro look),
- **Exo 2** for body/small text (16px body).

Headings: H1 bold uppercase; H2 24px uppercase. Language English, `dir="ltr"`, left-aligned.

The placeholder page also shows a subtle cosmic background (CSS gradient/stars, no images yet).

## 3. Environment variables & Supabase clients

### Variables (`.env.example`)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_APP_ENV=
```
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — from the Supabase project's API settings (the "publishable"/anon public key; safe in the browser because data is protected by RLS from Milestone 2).
- `NEXT_PUBLIC_APP_ENV` — `development` locally, `production` on Vercel; shown on the status card so it's obvious which project the site is using.
- **Same variable names in both places**: local `.env` holds the Development values; Vercel's Environment Variables hold the Production values. (ARCHITECTURE mentions `SUPABASE_DEV_*` / `SUPABASE_PROD_*` as labels for the two projects; using one set of names with different values per place is the simplest way to keep Production keys out of the local machine.)
- **File name:** CLAUDE.md says `.env` (copied once from `.env.example`); ARCHITECTURE says `.env.local`. Next.js reads both and both are git-ignored. Plan: follow CLAUDE.md and use `.env`. Record as ADR-2.
- No secret/service-role key in this milestone (not needed). If a later milestone needs one, it will be added to `.env.example` then.
- Claude never reads `.env`; the user fills it in.

### Clients
- `src/lib/supabase/client.ts` — `createBrowserClient(url, key)` from `@supabase/ssr`.
- `src/lib/supabase/server.ts` — `createServerClient(url, key, { cookies })` using `next/headers` cookies (standard @supabase/ssr pattern, ready for Milestone 2 auth).
- `src/lib/env.ts` — returns the three values; if one is missing, throws a readable message: "Missing NEXT_PUBLIC_SUPABASE_URL — see SETUP.md".

## 4. Connection check (proves the DoD)

- `GET /api/health` (server route):
  1. creates the server Supabase client,
  2. makes a real network call to the Supabase project that needs no tables — the Auth service health/settings endpoint (`{URL}/auth/v1/health` with the `apikey` header), or `supabase.auth.getSession()` plus that call,
  3. returns JSON `{ ok: true|false, env: "development"|"production", project: "<project ref from URL>", message }`. Never returns keys.
- `src/app/page.tsx` (temporary placeholder home, replaced in Milestone 2/3):
  - Big H1 "EXPENSE TRACKER" (glow style), short line of text.
  - A `.card` "System Status" that calls the check and shows: ✅ "Connected to Supabase (Development)" in cyan, or ⚠ an amber error message with a hint.
  - Shows the project ref (e.g. `abcd…xyz`) so Dev vs Prod can be told apart, and a sample of the themed button/input styles.

## 5. `SETUP.md` — guide for the user (plain language, numbered steps)

1. **Create two Supabase projects** at supabase.com: e.g. `expenses-dev` and `expenses-prod` (free tier; note: free projects pause after inactivity — how to un-pause).
2. **Copy Development keys into `.env`**: where to find Project URL and publishable key; set `NEXT_PUBLIC_APP_ENV=development`.
3. **Run locally**: `npm install`, `npm run dev`, open http://localhost:3000, expect "Connected to Supabase (Development)".
4. **GitHub repository**: create an empty repo on GitHub (no README), give Claude the address. Claude connects and pushes — only after the user approves the push.
5. **Vercel**: sign in with GitHub → "Add New Project" → import the repo → framework auto-detected (Next.js) → add the three Environment Variables with **Production** values (`NEXT_PUBLIC_APP_ENV=production`) → Deploy.
6. **Verify Production**: open the Vercel URL, expect "Connected to Supabase (Production)" with the prod project ref.
7. **Rules going forward** (short): schema changes go to Development first; Production only after approval, before deploying the matching code (per ARCHITECTURE's migration procedure); Auth settings / email templates must be mirrored by hand in both projects.
8. Troubleshooting: missing variable message, project paused, wrong key.

Each step gets a ✔ box that is ticked when verified during the build.

## 6. Git, GitHub & deployment notes

- The Expenses folder currently sits inside a larger git repo (`C:\Users\Bigdaddy\Documents\Code`, which also contains other projects with staged files). For this project we need its **own** repo: at push time run `git init` inside `Expenses/` (per CLAUDE.md "Push"), connect the GitHub address the user gives, and push only this project. Nothing is committed during the build.
- Deployment to Vercel requires a push to GitHub → per CLAUDE.md the build stops and asks for push approval at that point. The "deploys to Vercel" DoD item is completed only after that approval and the user's Vercel setup.
- Add `.vercel/` (already in `.gitignore`) — no change needed. Add `next-env.d.ts` to `.gitignore` if the scaffold expects it.

## 7. Other updates

- `CLAUDE.md` → **Run commands**: `Run (dev): npm run dev`, `Test: npm run build && npm run lint` (no test suite yet).
- `ARCHITECTURE.md` → add `## Key decisions (ADRs)` at the end:
  - **ADR-1: Same env variable names for Dev and Prod** — values differ per place (local `.env` = Dev, Vercel = Prod).
  - **ADR-2: `.env` instead of `.env.local`** — follows project rules; Next.js loads both.
  - **ADR-3: Font substitution** — Orbitron + Exo 2 instead of Star Sans Pro (unless the user supplies the font).
  - **ADR-4: Tailwind v4 theme tokens in CSS** (`@theme` in `globals.css`) instead of a `tailwind.config` file.
- `MILESTONES.md` → 🟡 next to Milestone 1 title after the build.

## 8. Build-time verification (Claude, before marking 🟡)

1. `npm run lint` and `npm run build` succeed with no errors.
2. `npm run dev`, then check `/api/health` and the home page in the browser:
   - with `.env` empty → readable "missing variable" message, no crash;
   - once the user has filled `.env` → "Connected to Supabase (Development)".
3. Visual check against the style guide: dark navy background, neon card border, cyan input, pill buttons, fonts loaded; also at phone width (375px).
4. Stop the dev server when done.
5. After push approval + user's Vercel setup: open the Vercel URL → "Connected to Supabase (Production)".

## 9. Definition of Done — how each item is met

| DoD item | How it's checked |
| --- | --- |
| App builds and deploys to Vercel | `npm run build` passes locally; Vercel deployment succeeds and the live URL loads the themed page. |
| Supabase client connects to the Development project | Local home page / `/api/health` shows "Connected… (Development)" with the dev project ref. |
| Dev & Prod setup documented and verified | `SETUP.md` written; local run verified against Dev; live Vercel site verified against Prod (status card shows Production + prod ref). |

## What the user needs to do (Claude will stop and ask at each)
1. Create the two Supabase projects and fill in `.env` with the **Development** values.
2. Create an empty GitHub repo and send its address; approve the first push.
3. Connect Vercel to the repo and enter the **Production** values there.
