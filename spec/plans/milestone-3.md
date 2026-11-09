# Milestone 3 — Core Expense Management (Plan)

## Goal
A signed-in user can add, view, edit and delete expenses on the **Home** screen (with sorting and Load More), and add, rename and delete categories on the **Categories** screen. Both screens share the persistent side menu. Database changes go to **Development only**; Production gets them only at push time, with approval.

## How the spec conflicts were settled
- **Predefined categories:** MILESTONES.md lists "Food, Fuel, Leisure, Shopping, Others". The PRD lists 10, ending in "Other". The PRD wins on features, so every user starts with: Food, Fuel, Leisure, Utilities & Bills, Shopping, Transportation, Health, Education, Housing, Other.
- **Expense form fields:** DESIGN.md lists Amount, Category, Date, Description, but the PRD also requires **Currency**. The PRD wins on features, so the form has Amount, Currency, Category, Date and Description.
- **Sorting:** this isn't listed in the milestone scope, but the PRD requires sorting the Home table by date, amount and category (ascending/descending). It's included here.
- **Menu items:** DESIGN.md says: Home, Expense Filters, Categories, Reports, About. The wireframe and mockup labels are inconsistent ("Expense", "Category", "Menu"), so DESIGN.md's text is used: **Home, Filters, Categories, Reports, About**.

## Choices made where the spec is silent (you can change them)
- **Pages not built yet:** Filters, Reports and About appear in the menu and open a simple "Coming in a later milestone" page, so the menu works end to end.
- **Account actions:** **Change Password** and **Log Out** sit at the bottom of the side menu. The Change Password screen keeps its focused card layout, and its Back button returns to Home.
- **Expense table columns:** Date, Amount (with currency symbol, e.g. `₪20.00`), Category, Description, and Actions. The wireframe shows only Date/Amount/Category. Description is extra so each row can be recognized, and it's hidden on phone screens.
- **Categories screen:** the "associated expenses" table (from the wireframe) shows the expenses of the **selected** category: Date, Amount, Description. It's view-only, because editing happens on Home.
- **Default form values:** Currency = ILS (first in the PRD list), Date = today.
- **Description length:** up to 200 characters. Category names: 1–40 characters.
- **Amounts:** up to 2 decimal places for every currency, including JPY.

## Business rules (PRD)
- Category, amount and date are required.
- Amount must be > 0 and ≤ 100,000.
- Date must be today or earlier, with no time of day.
- Description is required when the category is named **Other** (case-insensitive). The rule follows the name, so renaming "Other" removes the rule.
- Currency is one of ILS, USD, EUR, GBP, CAD, AUD, JPY, CHF.
- Delete needs confirmation. Nothing is deleted if the user cancels.
- A category can't be deleted while any expense uses it. The Delete button is disabled with the explanation "Used by N expenses — move or delete them first."
- Category names are unique per user (case-insensitive) and can't be empty.
- The table shows 25 expenses first, then 25 more per **Load More**. Changing the sort returns to the first 25.
- Errors appear next to the field. Network/server failures show "Something went wrong. Please try again.", and nothing is shown as saved unless the server confirmed it.

### "Today" across time zones
The database clock is UTC, while you are in Israel (UTC+2/+3). Between midnight and 3 a.m. Israel time, UTC is still "yesterday", so a plain "not after today" check would wrongly reject today's expense.
- The browser sends its own local "today" with the form, and the server rejects dates after it.
- As a safety net, the server and database also reject any date more than 1 day after UTC today.
- This is recorded as an ADR.

## Database — `supabase/migrations/0002_categories_expenses.sql`
```sql
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 40),
  is_predefined boolean not null default false,
  created_at timestamptz not null default now(),
  unique (id, user_id)                      -- target for the composite FK below
);
create unique index categories_user_name_key on public.categories (user_id, lower(btrim(name)));

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid not null,
  description text check (description is null or char_length(description) <= 200),
  amount numeric(10,2) not null check (amount > 0 and amount <= 100000),
  currency text not null check (currency in ('ILS','USD','EUR','GBP','CAD','AUD','JPY','CHF')),
  expense_date date not null check (expense_date <= current_date + 1),
  created_at timestamptz not null default now(),
  -- The category must belong to the same user; it can't be deleted while used.
  foreign key (category_id, user_id) references public.categories (id, user_id) on delete restrict
);
create index expenses_user_date_idx on public.expenses (user_id, expense_date desc, created_at desc);
create index expenses_category_idx on public.expenses (category_id);
```
- **Row Level Security** on both tables: a signed-in user can select/insert/update/delete only rows where `user_id = auth.uid()`. `anon` gets no access.
- **Seeding the 10 categories:**
  - A trigger on `profiles` insert adds them for every new user.
  - The same migration adds them for users who already exist (`testpilot1` in Dev; `holymoses` in Prod at push time).
  - If a user later deletes all their categories, they stay deleted. Seeding happens once.
- "Other must have a description" is checked by the app, not the database, because the database can't know which category is "Other" without a join, and renaming changes it.
- **How it's applied:** as before, you paste the file into **expenses-dev → SQL Editor → Run**, and I verify the result. Production only at push time.

## Screens

### Shared app layout — route group `src/app/(app)/`
- **Desktop/tablet (≥ 768px):** a fixed left side menu with icons and labels (Home, Filters, Categories, Reports, About). The active item is highlighted with a cyan bar and dot, as in the style guide. Underneath are the signed-in username, Change Password and Log Out.
- **Phone:** a top bar with the app name and a menu button that opens the same menu as a drawer.
- Each page has a main H1 heading (PRD requirement).
- Icons come from `lucide-react`: Home, Filter, Tags, ChartPie, Info, KeyRound, LogOut.

### Home (`/`)
1. **"New Expense" card:**
   - A responsive grid with Amount, Currency, Category, Date, then Description across the full width.
   - Button: **Add Expense**.
   - In edit mode, the title becomes "Edit Expense", the form fills with the row's values, and the buttons become **Save Changes** + **Cancel**. The page scrolls to the form.
2. **"Recent Expenses" card:**
   - The table has sortable column headers (Date, Amount, Category). Clicking a header toggles ascending/descending, shown with an arrow icon. The default sort is Date, newest first.
   - Each row has **Update** (cyan outline) and **Delete** (pink outline) buttons.
   - **Load More** appears only when more rows exist.
   - Empty state: "No expenses yet — add your first one above."
   - On phones, the table scrolls sideways inside its card, and the page itself never does.
3. **Delete confirmation:** a themed dialog ("Delete this expense? ₪20.00 · Food · 2026-11-09") with **Delete** and **Cancel** buttons.
4. After add, edit or delete, the table reloads from the first page, so the list always matches the database.

### Categories (`/categories`)
- **Left: the category list.** Click one to select it. Predefined categories show a small "predefined" tag, but they can still be renamed or deleted (PRD).
- **Toolbar:**
  - **Add Category** opens an inline name field with Save/Cancel.
  - **Rename** is enabled when a category is selected and opens an inline field.
  - **Delete** is enabled only when the selected category has no expenses, with confirmation. Otherwise it's disabled, with the reason shown.
- **Right:** the expenses of the selected category (Date, Amount, Description), using the same 25-row Load More.
- Changes appear immediately in the Home form's category dropdown, because it's read fresh from the database.

## Code structure
**New**
- `supabase/migrations/0002_categories_expenses.sql`
- `src/lib/expenses/constants.ts`: currencies with symbols, the predefined list, limits, page size (25).
- `src/lib/expenses/validation.ts`: shared expense and category checks (used in the browser and re-run on the server).
- `src/lib/dates.ts`: local "today" helpers and date formatting (`YYYY-MM-DD`).
- `src/app/actions/expenses.ts`: Server Actions `listExpenses(sort, dir, offset)`, `createExpense`, `updateExpense`, `deleteExpense`. Each checks the signed-in user, re-validates, and uses the user's own session, so RLS applies.
- `src/app/actions/categories.ts`: `listCategories` (with expense counts), `createCategory`, `renameCategory`, `deleteCategory`, `listCategoryExpenses`.
- `src/app/(app)/layout.tsx` + `src/components/nav/side-menu.tsx` (client, for the active item and phone drawer).
- `src/app/(app)/page.tsx` (Home) + `src/components/expenses/expense-form.tsx`, `expense-table.tsx`, `confirm-dialog.tsx`.
- `src/app/(app)/categories/page.tsx` + `src/components/categories/category-manager.tsx`.
- `src/app/(app)/filters/page.tsx`, `reports/page.tsx`, `about/page.tsx`: "Coming in a later milestone" placeholders.

**Changed / removed**
- `src/app/page.tsx` is removed and replaced by `src/app/(app)/page.tsx`. The temporary welcome and System Status cards go away. ADR-5 already called them temporary, and `/api/health` stays. A small "Development" tag in the menu footer shows which database is in use, but only in Development.
- `src/app/globals.css`: table, sortable header, small row buttons (`.btn-sm`), danger outline, dialog, side-menu active state.
- `src/app/actions/auth.ts`: nothing changes. New users get categories from the database trigger.
- `spec/ARCHITECTURE.md`: add ADRs. `spec/MILESTONES.md`: 🟡 at the end. `SETUP.md`: add the Milestone 3 SQL step.

**Data loading with Cache Components:** the per-user data is read inside `<Suspense>` with `await connection()`, which is the same fix used for the welcome line in Milestone 2. Lists then refresh through Server Actions called from client components.

## ADRs to add
- **ADR-10:** "Other" description rule enforced in the app by category name.
- **ADR-11:** "Today" uses the browser's local date, with a UTC+1 day safety limit in the server and database.
- **ADR-12:** Predefined categories seeded per user by a database trigger (once).
- **ADR-13:** Composite foreign key keeps each expense's category owned by the same user and blocks deleting used categories.

## How I'll check it (Development only)
1. `npm run lint` and `npm run build` pass.
2. In the built-in browser, signed in as `testpilot1`:
   - Check that the menu works on desktop and phone, and that the active item is highlighted.
   - **Add:** check every validation (empty, 0, 100,000.01, a future date, "Other" without description). Then add valid expenses in different currencies.
   - **Load More:** create about 30 test expenses (through the app's own Server Action in a script, on Dev only). Check that 25 show first, then the rest.
   - **Sort:** by date, amount and category, in both directions.
   - **Update:** check that the form loads values, saves, and that Cancel leaves the row untouched.
   - **Delete:** check that Cancel keeps the row and Confirm removes it.
   - **Categories:** add, rename, and try a duplicate name (error). Deleting a used category should be blocked with the reason. Deleting an unused one should work. Renamed names should appear in the Home dropdown.
3. **Database checks (Dev):**
   - One user can't read or change another user's expenses or categories.
   - The database itself rejects an invalid amount, currency or category from another user.
   - A newly registered user gets the 10 categories.
4. The test expenses and the extra test user are listed for you. Nothing is deleted without asking.

## Definition of Done (from MILESTONES.md)
- Expense and category schema applied and tested on **Development**.
- Create, view (paginated), update and delete expenses on Home.
- Manage categories (add, rename, delete) on the Categories screen.
- Fully testable and functional.

## What you'll need to do during the build
1. Run `supabase/migrations/0002_categories_expenses.sql` in the **expenses-dev** SQL Editor (I'll give you the text).
