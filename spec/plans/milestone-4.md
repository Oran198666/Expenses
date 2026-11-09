# Milestone 4 — Advanced Filtering & Saved Filters (Plan)

## Goal
On the **Filters** screen, a signed-in user can narrow down their expenses by year / month / day, maximum amount, date range and description keyword. The results appear in a table that is separate from Home (its own sorting and Load More). The user can name and save the current filter, then pick it again later on any device. Database changes go to **Development only**; Production gets them only at push time, with approval.

## Decisions you made (2026-11-09)
- **Results table is view-only:** Date, Amount, Category, Description. The wireframe's "Update" button is left out, and editing stays on Home (PRD).
- **A saved filter keeps everything that was filled in:** year, month, day, max amount, date range and keyword. This goes a bit beyond the PRD, which mentions saving only the custom part.

## How the spec conflicts were settled
- **Table name / columns:** ARCHITECTURE.md lists `saved_filters.created_z`. That is clearly a typo, so the column is `created_at`, like every other table.
- **Built-in vs custom:** the PRD calls custom filters an "alternative", but the wireframe shows both sections in one panel. The wireframe wins on structure: one panel, and **all filled-in criteria apply together** (each one narrows the results further). Nothing in the PRD forbids combining them.

## Choices made where the spec is silent (you can change them)
- **Apply button:** results update when you press **Apply Filters**, not on every keystroke. **Clear** empties every field and shows all expenses again.
- **Before the first Apply:** the table shows all expenses (newest first), like an empty filter.
- **Year list:** from the year of your oldest expense up to the current year. No future years. If you have no expenses, only the current year is shown.
- **Month list:** enabled only after a year is chosen. In the current year, future months are hidden.
- **Day list:** enabled only after a month is chosen. Shows only real days of that month (e.g. no Feb 30), and no future days.
- **Max amount:** a number greater than 0, up to 2 decimals. It compares the number only, across all currencies (no conversion, per PRD). A short note under the field says so.
- **Date range:** From and To are each optional (From alone = "from this date on", To alone = "up to this date"). To earlier than From is an error: "The end date can't be before the start date."
- **Keyword:** searches inside the description, ignoring upper/lower case. **An empty keyword is simply ignored**, and the hint under the field says "Leave empty to ignore." Up to 100 characters.
- **No results:** "No expenses match these filters." with a Clear button.
- **Saved filters:**
  - Name: 1–40 characters, unique per user (ignoring upper/lower case). Errors: "Please enter a name for this filter." / "A saved filter with this name already exists."
  - Saving with no criteria filled in is refused: "Fill in at least one filter before saving."
  - The **Saved Filters** dropdown lists your filters by name. Choosing one fills the panel with its values and applies it straight away.
  - Deleting or renaming saved filters is not in the PRD and is not included.
- **Sorting / Load More:** same as Home: Date, Amount and Category headers, 25 rows, then 25 more per **Load More**. Applying a filter or changing the sort starts again from the first 25.

## Database — `supabase/migrations/0003_saved_filters.sql`
```sql
create table public.saved_filters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 40),
  filter_criteria jsonb not null check (jsonb_typeof(filter_criteria) = 'object'),
  created_at timestamptz not null default now()
);
create unique index saved_filters_user_name_key on public.saved_filters (user_id, lower(btrim(name)));
```
- **Row Level Security:** a signed-in user can select/insert/update/delete only rows where `user_id = auth.uid()`. `anon` gets no access.
- **`filter_criteria` format** (every key optional, empty ones left out):
  `{ "year": 2026, "month": 11, "day": 9, "maxAmount": 50, "startDate": "2026-10-01", "endDate": "2026-10-31", "keyword": "coffee" }`
  The server checks the shape before saving and again when a saved filter is loaded, so an old or broken entry can't crash the page.
- **How it's applied:** as before, you paste the file into **expenses-dev → SQL Editor → Run**, and I verify the result. Production only at push time.

## Screen — Filters (`/filters`)
Layout (wireframe): the results table on the left, the filter panel on the right. On phones and narrow screens, the panel comes first and the results below it.

1. **Filter panel card:**
   - **Built-in:** Year, Month, Day (dropdowns), Max Amount (number field).
   - **Custom:** Date range From / To (date pickers, no future dates), Keyword (text field).
   - Buttons: **Apply Filters** (primary) and **Clear**.
   - Errors appear under the field they belong to (amber, like other forms).
   - **Save Filter:** a name field + **Save Filter** button. A success message confirms: `Filter "October coffee" saved.`
   - **Saved Filters:** a dropdown ("Choose a saved filter").
2. **Results card ("Filtered Expenses"):**
   - A line summarising the active filters, e.g. "Showing: 2026 · November · up to 50 · keyword "coffee"".
   - The table: sortable Date, Amount, Category headers + Description (hidden on phones). No row buttons.
   - **Load More** when more rows exist, and "Showing N expenses".
   - It never touches the Home table, and Home never touches it (separate state, separate requests).

## Code structure
**New**
- `supabase/migrations/0003_saved_filters.sql`
- `src/lib/expenses/filters.ts`: the `FilterCriteria` type, `validateFilters` (shared by browser and server), `cleanCriteria` (removes empty fields), `describeFilters` (the summary line), and the year/month/day option helpers.
- `src/lib/expenses/query.ts` (server-only): one shared function that builds the expense query (filters + sort + page). Home's `listExpenses` is switched to use it too, so both tables sort and page the same way.
- `src/app/actions/filters.ts`: Server Actions `searchExpenses(criteria, sort, dir, offset)`, `listSavedFilters()`, `saveFilter(name, criteria)`, `getFilterYears()`. Each checks the signed-in user and re-validates.
- `src/app/(app)/filters/page.tsx`: replaces the placeholder. It loads the first page, saved filters and the year range inside `<Suspense>` with `await connection()`, as in Milestone 3.
- `src/components/filters/filter-manager.tsx` (state), `filter-panel.tsx` (the form).

**Changed**
- `src/components/expenses/expense-table.tsx`: row buttons become optional, so the same table is reused view-only on Filters.
- `src/app/actions/expenses.ts`: `listExpenses` uses the shared query builder (same behaviour as now).
- `spec/ARCHITECTURE.md`: ADRs below. `spec/MILESTONES.md`: 🟡 at the end. `SETUP.md`: the Milestone 4 SQL step.

**How filters become a query**
- Year / month / day → a date range on `expense_date` (e.g. November 2026 → `>= 2026-11-01` and `< 2026-12-01`).
- Max amount → `amount <= value`.
- From / To → `expense_date >= From` / `<= To`.
- Keyword → `description ilike %keyword%`. The special characters `%`, `_` and `\` are escaped, so they are searched literally.

## ADRs to add
- **ADR-14:** All filter criteria combine (AND) in one panel; a saved filter stores every filled-in field as JSON.
- **ADR-15:** One shared server-side query builder for the Home and Filters tables (same sorting and Load More rules).

## How I'll check it (Development only)
1. `npm run lint` and `npm run build` pass.
2. In the built-in browser, signed in as `testpilot1` (it already has the 30 "[M3 test]" expenses over the last month, in several categories and currencies):
   - Year, Year+Month and Year+Month+Day each return only matching dates. Future years/months/days are not offered.
   - Max amount, From/To (alone and together), and To before From (error).
   - Keyword: upper/lower case doesn't matter, an empty keyword is ignored, and `%` is searched literally.
   - Combined filters (e.g. a month + keyword) and a filter with no results (empty state).
   - Sorting in both directions and Load More on the filtered results.
   - Home's table is unchanged by anything done on Filters, and the other way round.
   - Save a filter, reload the page, pick it from Saved Filters, and the same fields and results come back. A duplicate name, an empty name, and saving with no criteria all show errors.
3. **Database checks (Dev):** one user can't see or change another user's saved filters. `anon` gets nothing. The database rejects a non-object `filter_criteria`, an empty name, and a duplicate name.
4. Any test saved filters are listed for you. Nothing is deleted without asking.

## Definition of Done (from MILESTONES.md)
- Saved-filters schema applied and tested on **Development**.
- Filter by year, month, date range and keyword, with results in an isolated table. Save and retrieve filter presets.
- Works correctly with the existing expense data model.

## What you'll need to do during the build
1. Run `supabase/migrations/0003_saved_filters.sql` in the **expenses-dev** SQL Editor (I'll tell you when).
