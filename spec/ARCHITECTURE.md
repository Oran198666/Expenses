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
