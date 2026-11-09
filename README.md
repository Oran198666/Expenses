# Expense Tracker

A responsive web app for recording, organizing, filtering, analyzing and exporting personal expenses. Your data is stored centrally, so one account sees the same data on phone, tablet and desktop.

**Live site:** https://expenses-mauve-ten.vercel.app/

## Features
- **Accounts:** registration with a security question, login, password change, and password recovery through the security question.
- **Expenses:** add, update and delete expenses with amount, category, currency (8 currencies), date and description. Paginated list with sorting and Load More.
- **Categories:** 10 starting categories. Add, rename or delete your own (a category can't be deleted while expenses use it).
- **Filters:** built-in filters (year, month, day, max amount) and custom ones (date range, keyword). Filters combine, and you can save them by name.
- **Reports:** pie chart by category, plus yearly and monthly column charts. Each shows one currency at a time; currencies are never mixed or converted.
- **Export:** download all expenses, or only those matching the report filters, as **CSV** or **PDF**.
- **About:** app and developer information, plus a system architecture overview.

## Tech stack
| Area | Technology |
| --- | --- |
| Framework | Next.js (React) with TypeScript, Node.js |
| Styling | Tailwind CSS, Lucide icons, custom "Galactic Odyssey" theme |
| Backend | Next.js Server Actions |
| Database & auth | Supabase (PostgreSQL + Supabase Auth), Row Level Security |
| Charts | Recharts |
| Exports | papaparse (CSV), jsPDF + jspdf-autotable (PDF) |
| Hosting | Vercel, auto-deployed from GitHub |

## Architecture highlights
- **Security:** every table uses Row Level Security, so users can only read and change their own rows. Server Actions re-check the signed-in user and re-validate all input. Security answers are hashed. The secret key stays on the server only.
- **Data integrity:**
  - Database constraints enforce the amount range, the currency list and date limits.
  - A composite foreign key ties each expense's category to the same user.
- **Separate environments:**
  - Two Supabase projects: local development uses **Development**; the live site uses **Production**.
  - Database changes are SQL migrations (`supabase/migrations/`). They are tested on Development before they reach Production.
- **Currency-safe reporting:** totals are calculated per currency on the server. Exports list totals per currency and never combine them.

## How it was built
The project followed a spec-first process. The documents are in [`spec/`](spec/):
1. **[PRD](spec/PRD.md):** product requirements.
2. **[Architecture](spec/ARCHITECTURE.md):** tech stack, data model, environments, and a log of key decisions (ADRs).
3. **[Design](spec/DESIGN.md):** screens and style guide, with wireframes and mockups.
4. **[Milestones](spec/MILESTONES.md):** six milestones, each with its own plan in [`spec/plans/`](spec/plans/). Every milestone was built, verified against its Definition of Done, reviewed and approved before the next one began.

## Running locally
1. Requires Node.js and a Supabase project (see [`SETUP.md`](SETUP.md) for the full setup).
2. Copy `.env.example` to `.env` and fill in the values.
3. Install and start:
   ```bash
   npm install
   npm run dev
   ```
4. Open http://localhost:3000.

## Developer
Senior QA Engineer with over 11 years of experience in backend systems and data validation, expanding into full-stack development. See the About page on the live site.
