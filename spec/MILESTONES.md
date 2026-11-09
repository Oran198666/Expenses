# MILESTONES.md

## Instructions for AI Developer

- Develop the Milestones in the strict sequential order defined in this document.
- After completing each Milestone, stop development immediately and present the completed deliverable along with the test results against the Definition of Done to the user.
- Do not begin developing the next Milestone without the user's explicit approval.

---

## Milestone 1: Project Setup, Environment Configuration & Dual Supabase Strategy ✅

- **Name and Purpose:** Project Initialization and Environment Setup. The objective is to initialize the Next.js and Tailwind CSS project framework, configure hosting on Vercel, and establish the dual-project Supabase strategy (Development and Production projects) with step-by-step guidance.
- **Implementation Scope:** 
  - Initialize the Next.js project structure with Tailwind CSS styling and the "Galactic Odyssey" theme configuration (`#0A1128` background, `#4C1C73` panels, `#FF66FF` and `#00FFFF` accents, Star Sans Pro typography).
  - Set up the dual Supabase projects strategy: create both a Development Supabase project and a Production Supabase project.
  - Configure environment variables (`.env.local` for development and Vercel environment variables for production).
  - Connect the project to Vercel for hosting.
- **Expected Deliverable:** A running Next.js application repository with Tailwind CSS configured, connected to Vercel, and linked to both Development and Production Supabase instances via environment variables.
- **Definition of Done:** 
  - The application builds successfully and deploys to Vercel.
  - Supabase client initialization successfully connects to the Development Supabase project.
  - Setup and configuration steps for both the Development and Production Supabase projects are documented and verified.

---

## Milestone 2: User Authentication & Security Flow

- **Name and Purpose:** User Authentication and Account Security. The objective is to implement secure user registration, login, and password management capabilities backed by Supabase Auth and PostgreSQL database schemas.
- **Implementation Scope:**
  - Setup the initial database schema on the **Development Supabase project** (Auth User entity and related profile/security questions tables).
  - Implement the **Registration** screen (`Registration`), including username, password, security question dropdown, and security answer fields, with `Register` / `Submit` and `Back` actions.
  - Implement the **Login** screen (`Login`), including credentials input, `Log In`, `Recover Password`, and registration routing.
  - Implement the **Change Password** screen (`Change Password`), allowing authenticated users to securely update their passwords.
- **Expected Deliverable:** Functional authentication workflows allowing users to register, log in, manage passwords, and securely authenticate sessions against the Development database.
- **Definition of Done:**
  - Database schema migrations for user authentication and security questions are applied and tested against the **Development Supabase project only**.
  - Users can successfully register a new account, log in with credentials, and change their password through the respective UI screens.
  - All user-facing text and controls adhere to the defined interface language and design styling.

---

## Milestone 3: Core Expense Management (Vertical Slice)

- **Name and Purpose:** Core Expense Tracking and CRUD Operations. The objective is to deliver the central expense management hub where users can create, read, update, delete, and view paginated expense records linked to categories.
- **Implementation Scope:**
  - Apply database schema migrations for the `Expense` entity (Amount, Category, Date, Currency, Description) to the **Development Supabase project**.
  - Implement the **Categories** management screen (`Categories`) to add, rename, and delete custom or predefined expense categories (Food, Fuel, Leisure, Shopping, Others).
  - Implement the **Home** screen (`Home`), featuring the persistent side navigation menu, the "New Expense" input form, and the paginated "Recent Expenses" table with row action buttons (`Update`, `Delete`) and `Load More` functionality.
- **Expected Deliverable:** A fully operational expense tracking dashboard allowing users to manage categories and perform full CRUD operations on expenses.
- **Definition of Done:**
  - Database schema changes for expenses and categories are applied and tested against the **Development Supabase project**.
  - Users can create new expenses, view them in the paginated recent expenses table, update existing records, and delete entries.
  - Users can manage category lists seamlessly.
  - The system is fully testable and functional at this stage.

---

## Milestone 4: Advanced Filtering, Search & Custom Queries

- **Name and Purpose:** Advanced Filtering and Saved Filters. The objective is to provide an independent workspace to query, filter, and save custom expense views based on built-in or custom parameters.
- **Implementation Scope:**
  - Apply database schema migrations for the `Saved Filter` entity to the **Development Supabase project**.
  - Implement the **Filters** screen (`Filters`), featuring an independent expense results table, built-in filter panels (Year, Month, Date, Max Amount), custom range controls, keyword search, and the ability to save custom filter configurations.
- **Expected Deliverable:** An advanced filtering module where users can isolate specific expense datasets using multiple criteria and save filter presets.
- **Definition of Done:**
  - Database schema updates for saved filters are applied and tested against the **Development Supabase project**.
  - Users can filter expenses by year, month, date range, and keywords, view results in an isolated table, and save/retrieve filter presets.
  - The feature operates correctly with the existing expense data model.

---

## Milestone 5: Reporting, Analytics & Data Export

- **Name and Purpose:** Financial Reports and Data Export. The objective is to deliver visual spending analytics, charts, and data export capabilities.
- **Implementation Scope:**
  - Implement the **Reports** screen (`Reports`), integrating currency and date range selectors.
  - Integrate category breakdown charts (Pie Chart) and yearly/monthly column charts powered by Recharts.
  - Implement export triggers for downloading dataset reports (`Export to CSV`, `Export to PDF`).
- **Expected Deliverable:** A comprehensive reporting dashboard displaying visual spending breakdowns with functional CSV and PDF export mechanisms.
- **Definition of Done:**
  - Reports accurately aggregate expense data across selected currencies, years, and months.
  - Charts render correctly using the design system styling.
  - CSV and PDF export functions successfully generate and download reports based on filtered or complete datasets.

---

## Milestone 6: Static Information, Architecture Overview & Final Production Deployment

- **Name and Purpose:** System Documentation View, Static Pages, and Production Deployment. The objective is to finalize the static information pages, integrate the architectural system overview, and deploy the fully validated application to the Production environment.
- **Implementation Scope:**
  - Implement the static **About** screen (`About`) displaying application metadata, developer