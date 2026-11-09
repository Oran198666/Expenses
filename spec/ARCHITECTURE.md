# ARCHITECTURE.md

## 1. Selected Technology Stack

### Component Selection Table

| Component | Selected Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js (React / TypeScript) | Server-side rendering, responsive UI pages (Home, Filters, Reports, About), and robust routing[cite: 1]. |
| **Styling & UI Components** | Tailwind CSS & Lucide React | Modern, responsive utility-first styling and clean UI icons for navigation and actions. |
| **Backend / API** | Next.js API Routes / Server Actions | Handling business logic, validation, authentication workflows, and server-side operations. |
| **Database & Auth** | Supabase (PostgreSQL & Supabase Auth) | Centralized data storage for cross-device access, relational data integrity, and secure session handling[cite: 1, 2]. |
| **File Generation** | `jspdf` & `papaparse` (Client-side / Server-side utilities) | Generating downloadable PDF reports and CSV exports[cite: 1, 2]. |
| **Charting Library** | Recharts | Rendering responsive pie charts (by category) and column charts (by year and month)[cite: 1, 2]. |
| **Hosting & Deployment** | Vercel | Seamless, automated deployment via GitHub integration with support for serverless Next.js. |
| **Source Code Management** | Git & GitHub | Version control and automated build/deployment pipeline. |

---

### Key Technology Decisions & Rationale

*   **Next.js & Vercel Synergy:** Next.js provides a unified full-stack framework allowing co-location of frontend pages and backend API routes. Deploying on Vercel enables zero-configuration, automated continuous deployment straight from GitHub, ensuring fast delivery and seamless server-side capabilities.
*   **Supabase (PostgreSQL + Auth):** Fulfills the PRD requirement for centralized data storage across devices[cite: 1, 2]. Supabase offers built-in email/password authentication, robust security policies (Row Level Security), and PostgreSQL relational integrity (essential for enforcing foreign keys between expenses and custom categories/filters).
*   **Recharts:** A composable charting library built on React components, providing lightweight, customizable, and responsive SVG charts (Pie and Column charts) required for the Reports page[cite: 1, 2].
*   **Tailwind CSS:** Ensures rapid development of a clean, responsive layout across mobile, tablet, and desktop viewports without heavy component framework bloat[cite: 1, 2].

---

### Risks, Limitations, & Considerations

*   **Supabase Free Tier Limitations:** Supabase projects on the free tier may be paused after a period of inactivity, which could temporarily interrupt accessibility. Regular activity or upgrading to a paid tier resolves this. Furthermore, project limits allow a specific number of active projects, necessitating a clean separation between the Development and Production projects.
*   **Serverless Execution Timeouts:** Vercel serverless functions have execution time limits, which are more than sufficient for standard CRUD operations and exports, but heavy export generation should ideally be optimized or handled client-side/via lightweight streaming if datasets grow very large.

---

## 2. System Architecture

### Overall System Structure & Responsibilities

The application follows a modern full-stack serverless architecture:
*   **Client Layer:** Responsive Single Page Application (SPA) views built with Next.js running in the user's browser (Mobile, Tablet, Desktop)[cite: 1, 2].
*   **Application / API Layer:** Next.js Server Actions and API Routes executing server-side logic, data validation, and interacting with Supabase.
*   **Data & Services Layer:** Supabase managed PostgreSQL database and authentication provider.

---

### Logical Layers and Modules

1.  **Authentication Module:** Manages registration, login, logout, password changes, and security-question-based recovery using Supabase Auth and secure session management[cite: 1, 2].
2.  **Home / Expense Management Module:** Manages the creation, updating, deletion, validation, and paginated listing (25 items per batch) of expenses, alongside category management[cite: 1, 2].
3.  **Filters Module:** Provides independent filtering logic (built-in year/month/day/max amount and custom date-range/keyword filters) with named filter persistence[cite: 1, 2].
4.  **Reports Module:** Aggregates expenses by currency, category, year, and month to power Recharts visualizations, and triggers CSV/PDF exports[cite: 1, 2].
5.  **About Module:** Renders static developer and application metadata[cite: 1, 2].

---

### Data Model & Database Design

The relational schema hosted on Supabase PostgreSQL consists of the following primary tables:

*   **`profiles`**: Extends Supabase auth users to store security questions and answers.
    *   `id` (UUID, Primary Key, references `auth.users`)
    *   `username` (Text, Unique)
    *   `security_question` (Text)
    *   `security_answer_hash` (Text)
    *   `created_at` (Timestamp)
*   **`categories`**: Stores user-specific or predefined expense categories[cite: 1, 2].
    *   `id` (UUID, Primary Key)
    *   `user_id` (UUID, references `profiles.id`)
    *   `name` (Text)
    *   `is_predefined` (Boolean)
*   **`expenses`**: Stores individual expense records[cite: 1, 2].
    *   `id` (UUID, Primary Key)
    *   `user_id` (UUID, references `profiles.id`)
    *   `category_id` (UUID, references `categories.id`)
    *   `description` (Text, nullable unless category is "Other")[cite: 1, 2]
    *   `amount` (Numeric(10,2), check `amount > 0` and `amount <= 100000`)[cite: 1, 2]
    *   `currency` (Text, fixed ENUM format: ILS, USD, EUR, GBP, CAD, AUD, JPY, CHF)[cite: 1, 2]
    *   `expense_date` (Date, check `<= current_date`)[cite: 1, 2]
    *   `created_at` (Timestamp)
*   **`saved_filters`**: Stores saved custom filter configurations[cite: 1, 2].
    *   `id` (UUID, Primary Key)
    *   `user_id` (UUID, references `profiles.id`)
    *   `name` (Text)
    *   `filter_criteria` (JSONB)
    *   `created_z` (Timestamp)

---

### APIs and Communication

*   Internal client-server communication is handled via Next.js Server Actions and secure API endpoints using JSON payloads over HTTPS[cite: 1, 2].
*   Database calls communicate securely with Supabase via the official Supabase JavaScript client utilizing JWT-based authorization headers.

---

### Data Flow

1.  **User Action:** The user submits an action (e.g., adding an expense on the Home page)[cite: 1, 2].
2.  **Client Validation:** Form inputs are validated on the client against business rules (amount > 0, <= 100,000, description required if category is "Other", date not in the future)[cite: 1, 2].
3.  **Server Action:** A Next.js Server Action securely receives the request, validates the active session, and re-validates constraints.
4.  **Database Persistence:** The Server Action executes an authenticated query against Supabase PostgreSQL.
5.  **State Update:** The UI receives the updated dataset or confirmation, re-renders the relevant table or chart, and presents feedback to the user.

---

### Authentication, Authorization, Security, & Privacy

*   **Authentication:** Managed via Supabase Auth[cite: 1, 2]. Sessions are bound to the browser session lifecycle[cite: 1, 2].
*   **Authorization:** Enforced via Supabase Row Level Security (RLS) policies on PostgreSQL tables, ensuring users can only read, update, or delete their own data (`user_id = auth.uid()`).
*   **Security:** Passwords are securely hashed by Supabase Auth (utilizing bcrypt)[cite: 1, 2]. All traffic is encrypted over HTTPS[cite: 1, 2].

---

### Infrastructure, Hosting, Deployment, & Environment Strategy

#### Hosting and Deployment
*   The application source code is hosted in a Git repository on **GitHub**.
*   **Vercel** is connected directly to the GitHub repository for automatic continuous deployment upon pushing changes to production branches.

#### Dual Supabase Project Strategy (Development & Production)
To maintain stability without requiring local Docker environments, configure **two separate Supabase projects**:
1.  **Development Project (`SUPABASE_DEV_*`):** Used exclusively for development, testing, and verifying database migrations.
2.  **Production Project (`SUPABASE_PROD_*`):** Used for the live site and real user data[cite: 1, 2].

#### Credential Storage
*   **Local Development Environment:** Connects exclusively to the Development project using environment variables stored in a local `.env.local` file (excluded from Git).
*   **Production Environment:** Production credentials are stored securely solely within Vercel's Environment Variables settings.

#### Database Migration Procedure
1.  Schema modifications (e.g., adding tables or columns) are written as SQL migration scripts.
2.  Migrations are first applied and thoroughly tested against the **Development** Supabase project.
3.  Upon user approval, the migration is applied to the **Production** Supabase project before deploying the corresponding frontend/backend code update via Vercel.
4.  *Note:* Settings such as Auth providers, email templates, file storage policies, and secrets are not carried over by SQL migrations and must be manually mirrored across both Supabase projects.
---

## Key decisions (ADRs)

### ADR-1: Same environment variable names for Development and Production
**Context:** The app needs to talk to the Development Supabase project locally and to the Production project on Vercel.
**Decision:** Use one set of names (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_APP_ENV`). The local `.env` holds the Development values; Vercel's Environment Variables hold the Production values. The `SUPABASE_DEV_*` / `SUPABASE_PROD_*` names above are labels for the two projects, not variable names.
**Consequences:** Production keys never exist on the developer machine; code has no Dev/Prod branching. `NEXT_PUBLIC_APP_ENV` makes the active project visible on the status card.

### ADR-2: `.env` instead of `.env.local`
**Context:** This document mentions `.env.local`; the project rules (CLAUDE.md) use `.env` copied from `.env.example`.
**Decision:** Use `.env`. Next.js loads both files and both are git-ignored.
**Consequences:** One local settings file; `.env.example` lists the names without values.

### ADR-3: Free fonts instead of "Star Sans Pro"
**Context:** The style guide's font "Star Sans Pro" is not available as a free web font.
**Decision:** Use Google Fonts via `next/font`: **Orbitron** for H1/H2 headings and **Exo 2** for body text.
**Consequences:** Similar geometric/retro look, no licensing cost, fonts are self-hosted by Next.js. Can be swapped later in `src/app/layout.tsx`.

### ADR-4: Tailwind v4 theme tokens in CSS
**Context:** The project uses Tailwind CSS v4 (from `create-next-app`, Next.js 16).
**Decision:** Theme colors, radius and fonts are defined with `@theme` in `src/app/globals.css`, plus shared component classes (`.card`, `.btn-primary`, `.btn-secondary`, `.input`, `.label`, `.glow-text`). No `tailwind.config` file.
**Consequences:** One place to change the "Galactic Odyssey" look; later screens reuse the same classes.

### ADR-5: Supabase connection check via the Auth health endpoint
**Context:** Milestone 1 must prove the Supabase connection before any tables exist.
**Decision:** `GET /api/health` and the home status card call `{SUPABASE_URL}/auth/v1/health` with the publishable key.
**Consequences:** Verifies both the address and the key without a database schema. The status card is temporary and will be replaced by the real Home screen.

### ADR-6: Usernames mapped to internal emails in Supabase Auth
**Context:** The PRD asks for username + password login, but Supabase Auth signs in with an email (or phone).
**Decision:** Each username (3–30 characters: letters, digits, `.`, `_`, `-`; stored lowercase) becomes the internal address `<username>@users.expenses.invalid`. `.invalid` is a reserved domain, so it can never be a real mailbox. The user never sees it. The username is also stored in `profiles.username` (unique).
**Consequences:** Supabase Auth handles password hashing and sessions unchanged. No emails are ever sent; password recovery uses the security question instead of email.

### ADR-7: Server-only secret key for account creation and password recovery
**Context:** Password recovery must set a new password without the old one, which needs admin rights in Supabase Auth. Creating accounts with admin rights also avoids the email-confirmation step.
**Decision:** A server-only variable `SUPABASE_SECRET_KEY` (no `NEXT_PUBLIC_` prefix) is used only in `src/lib/supabase/admin.ts`, which is marked `server-only`. Registration uses `auth.admin.createUser` (email pre-confirmed), recovery uses `auth.admin.updateUserById`.
**Consequences:** The key must be set in `.env` (Development) and in Vercel (Production). It never reaches the browser. Supabase's "Confirm email" setting doesn't affect this app.

### ADR-8: Browser-session auth cookies
**Context:** The PRD requires that authentication ends when the browser session ends.
**Decision:** Supabase auth cookies are written without `maxAge` / `expires` (helper `toSessionCookie` in `src/lib/supabase/cookies.ts`, used by the server client and `src/proxy.ts`). `src/proxy.ts` (Next.js 16's name for Middleware) refreshes the session and redirects signed-out visitors to `/login`.
**Consequences:** Closing the browser signs the user out. Some browsers that "continue where you left off" may restore session cookies; that is browser behavior outside the app's control.

### ADR-9: Security answers hashed with scrypt; hash hidden from clients
**Context:** Security answers are secrets and must not be stored in plain text.
**Decision:** Answers are normalized (trimmed, spaces collapsed, lowercase) and stored as a salted scrypt hash using Node's built-in `crypto`. In the database, `anon`/`authenticated` roles can read only `id, username, security_question, created_at` of their own row; the hash is read only on the server with the secret key.
**Consequences:** No extra packages. Answers are case-insensitive. The security question list is fixed in `src/lib/auth/questions.ts`.

### ADR-10: "Other" description rule enforced in the app by category name
**Context:** The PRD requires a description when the category is **Other**, and categories can be renamed.
**Decision:** The rule follows the category's current name ("other", case-insensitive, trimmed). It is checked in the browser and again in the Server Action, which looks up the category's name. The database doesn't enforce it, because a check constraint can't read another table.
**Consequences:** Renaming "Other" removes the rule; naming a category "Other" adds it. The database still enforces amount, currency, date and description length.

### ADR-11: "Today" is the browser's local date, with a UTC+1 day safety limit
**Context:** The database clock is UTC, but the user lives in Israel (UTC+2/+3). Between midnight and ~3 a.m. local time, UTC is still "yesterday", so a plain `expense_date <= current_date` check would reject today's expenses.
**Decision:** The browser sends its local "today" with each save; the server rejects dates after it (accepting the browser's date only if it is within one day of UTC today). The database check is `expense_date <= current_date + 1` as a safety net. The form's Date defaults to the browser's today.
**Consequences:** Correct in every time zone; at most one day of tolerance at the database level. This differs from the `<= current_date` written in the data model above.

### ADR-12: Predefined categories seeded per user by a database trigger (once)
**Context:** Every user must start with the 10 PRD categories, and they can be renamed or deleted like any other.
**Decision:** A trigger on `profiles` insert calls `seed_default_categories`, which inserts the 10 names (`is_predefined = true`) with `created_at` staggered by 1 ms to keep the PRD order. The migration also seeds users that already existed.
**Consequences:** No app code needed at registration. Seeding happens once: deleted predefined categories stay deleted. Lists are ordered by creation time, so new categories appear at the end.

### ADR-13: Composite foreign key ties each expense's category to the same user
**Context:** RLS stops users from reading other users' categories, but a plain foreign key would still let an expense point at another user's category id. Categories in use must not be deletable.
**Decision:** `expenses (category_id, user_id)` references `categories (id, user_id)` with `on delete restrict`.
**Consequences:** The database itself rejects cross-user categories and deleting a used category. The app checks the count first to show a friendly reason ("Used by N expenses — move or delete them first.").

### ADR-14: Filter criteria combine (AND) in one panel; saved filters store every filled-in field as JSON
**Context:** The PRD describes built-in filters (year / month / day / max amount) and custom filters (date range + keyword) and calls custom filters an "alternative", but the wireframe shows both in one panel. The PRD only mentions saving custom filters.
**Decision:** One panel; every filled-in criterion narrows the results further (AND). A saved filter stores all filled-in fields in `saved_filters.filter_criteria` (JSONB object: `year, month, day, maxAmount, startDate, endDate, keyword`, empty ones left out). The server re-validates criteria on every search and when loading saved filters; broken entries are skipped. Saved filter names are 1–40 characters, unique per user ignoring case (database index). The data model's `created_z` column is implemented as `created_at`. Keyword search is a case-insensitive literal match done with an escaped regular expression (`imatch`), because the database API turns `*` into a wildcard in LIKE patterns.
**Consequences:** Users can mix built-in and custom criteria freely. Max amount compares the number only, across currencies (no conversion). Renaming or deleting saved filters is not available (not in the PRD).

### ADR-15: One shared server-side query builder for the Home and Filters tables
**Context:** Both tables need the same sorting (date, amount, category; both directions), the same tie-breaking and the same 25-row Load More, but must stay independent.
**Decision:** `src/lib/expenses/query.ts` (`fetchExpensePage`) builds the query for both. Home calls it with no criteria; Filters passes its criteria. Each screen keeps its own state and requests.
**Consequences:** Sorting and paging behave identically on both screens and are changed in one place.

### ADR-16: Report totals are calculated on the server, one currency at a time
**Context:** The PRD forbids adding amounts from different currencies together, and the Reports charts need totals by category, year and month for the chosen currency, date range and category.
**Decision:** The `getReport` Server Action reads only the matching rows (always filtered by one currency) in batches of 1,000 and adds them up on the server in cents, skipping any row in another currency as a safety net. The yearly series fills gaps between the first and last year with 0; monthly totals are returned only for months with spending and the browser fills the 12 months of the selected year (future months left out). The starting currency is the one the user has the most expenses in (ILS if none).
**Consequences:** No database changes or SQL functions are needed and currencies can never mix. Every selector change sends one request; fine for a personal expense list, but very large histories would be slower than a database-side sum.

### ADR-17: Exports are built in the browser with papaparse, jspdf and jspdf-autotable
**Context:** ARCHITECTURE.md names `jspdf` and `papaparse`. A PDF table with page breaks and repeated headers is a lot of hand-written code with plain `jspdf`.
**Decision:** A Server Action (`getExportRows`) returns the rows (all expenses, or those matching the report filters); the browser builds the file and starts the download. CSV: UTF-8 with a BOM (so Excel reads it correctly), amounts as plain numbers with 2 decimals, and text cells starting with `=`, `+`, `-`, `@` prefixed with `'` so spreadsheets can't run them as formulas. PDF: `jspdf` + `jspdf-autotable` (loaded only when a PDF is requested), with a title, creation date, scope line, the table, totals per currency (never combined) and page numbers. Amounts in the PDF use the currency code (e.g. "ILS 23.71") because the built-in PDF font can't draw symbols like ₪.
**Consequences:** One extra small package (`jspdf-autotable`). The built-in PDF font only covers Latin text, so descriptions written in Hebrew or other non-Latin scripts won't display correctly in the PDF (the CSV is fine); fixing that would mean embedding a font file.

### ADR-18: Yearly and monthly charts are both always shown
**Context:** The PRD asks for "the ability to switch between yearly and monthly detail"; the wireframe and mockup show both charts at once (the wireframe wins on structure).
**Decision:** Both charts are always visible. The monthly chart shows the 12 months of one selected year, chosen with its own Year dropdown or by clicking a column in the yearly chart; it starts on the latest year with spending.
**Consequences:** Matches the wireframe while still letting the user move between yearly and monthly detail.

### ADR-19: Architecture Diagram lives on the About page, built from HTML/CSS boxes
**Context:** DESIGN.md lists an "Architecture Diagram" screen, but the PRD's navigation has only the four main pages (plus Categories). The diagram is static documentation.
**Decision:** The diagram is a "System Architecture" section at the bottom of the About page, drawn with neon-outlined HTML boxes and icon arrows (no image file, no new package). It follows the wireframe: Auth User → Expense (Category, Amount, Date, Currency) → Saved Filter, and Centralized Supabase Data Store → Vercel Backend. Side by side on wide screens, stacked with downward arrows on phones. The developer photo is a static file in `public/` (`dev.jpg`).
**Consequences:** The menu stays as the PRD describes; the diagram text stays sharp and readable at any size. Changing the diagram or About content means editing the code (the PRD excludes editing it in the app).
