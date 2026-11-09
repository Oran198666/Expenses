# Milestone 5 — Reports, Charts & Export (Plan)

## Goal
On the **Reports** screen, a signed-in user picks a currency, and optionally a date range and a category. They then see:
- a pie chart of spending by category;
- a column chart by year;
- a column chart by month.

Everything shows **only the chosen currency**. Amounts in different currencies are never added together. **Export to CSV** and **Export to PDF** download either all expenses or only the ones that match the current report filters. **No database changes** in this milestone, so there is nothing to run in Supabase.

## How the spec conflicts were settled
- **Yearly vs monthly charts:** the PRD asks for "the ability to switch between yearly and monthly detail". The wireframe and mockup show both charts at once, and the wireframe wins on structure. So:
  - Both charts are always visible.
  - The monthly chart shows the months of one selected year.
  - You switch years with the **Year** dropdown above the monthly chart, or by clicking a column in the yearly chart.
- **Category filter:** MILESTONES.md mentions only currency and date range selectors. The PRD (which wins on features) also asks for a category filter, so it's included.
- **PDF and CSV tools:** ARCHITECTURE.md names `jspdf` and `papaparse`. I'll also add `jspdf-autotable`, a small add-on for `jspdf`. It draws the PDF table with page breaks and repeated headers, which would otherwise take a lot of hand-written code. This gets an ADR.

## Choices made where the spec is silent (you can change them)
- **Starting currency:** the currency you have the most expenses in. If you have none, ILS. The dropdown always lists all 8 currencies.
- **Updates right away:** changing any selector refreshes the charts at once (no Apply button). **Clear filters** resets the date range and category, but keeps the currency.
- **Date range:** From and To are each optional. Future dates are not allowed. If To is earlier than From, you see "The end date can't be before the start date." and the charts keep the last valid result.
- **Totals line:** above the charts, e.g. "Total: ₪1,234.50 · 18 expenses". This is for the chosen currency only.
- **Pie chart:**
  - One slice per category.
  - Next to it is a legend list showing each category's amount and percentage, largest first. It's also easy to read on phones.
  - Categories with no spending are left out.
- **Yearly chart:** one column per year, from the first to the last year with spending in the current filters. Years in between with no spending show as 0.
- **Monthly chart:**
  - 12 columns (Jan–Dec) for the selected year. In the current year, only months up to now.
  - The selected year starts as the latest year that has data.
  - Months outside the date range show as 0.
- **Hovering or tapping a column or slice** shows its exact amount.
- **Chart colors:** taken from the Galactic Odyssey palette (pink, cyan, violet, amber, silver), plus a few lighter and darker shades of the same colors so 10 categories can be told apart. Labels and grid lines are silver; the chart background is the dark card.
- **No data:** "No ILS expenses match these filters." The charts are hidden, and a short hint suggests choosing another currency or clearing filters.
- **Export dialog:** clicking **Export to CSV** or **Export to PDF** opens a small dialog that asks:
  - **All expenses:** every expense, in every currency.
  - **Only expenses matching the current report filters:** a line spells out exactly what that means, e.g. "ILS only · 2026-10-01 to 2026-10-31 · Food — 7 expenses". The currency is always part of the filters, so the filtered set is never "everything".
  - **Download** and **Cancel** buttons.
- **Exported columns:** Date, Category, Description, Amount, Currency. Rows are newest first.
- **CSV:**
  - Opens correctly in Excel, including Hebrew text.
  - Amounts are plain numbers with 2 decimals, e.g. `23.71`.
  - Cells that start with `=`, `+`, `-` or `@` are made safe, so Excel can't treat a description as a formula.
- **PDF:**
  - Title "Expense Report", the creation date, a line describing what's included, the table, and a **Totals by currency** section (one line per currency, never combined). Page numbers at the bottom.
  - Amounts show the currency code (e.g. "ILS 23.71"), because the standard PDF font can't draw the ₪ sign.
- **File names:** `expenses-all-2026-11-09.csv` or `expenses-filtered-2026-11-09.pdf`.
- **Empty export:** if nothing matches, the Download button is disabled and the dialog says "There are no expenses to export."
- **Errors:** if loading or exporting fails, you see "Something went wrong. Please try again." and no file is downloaded.

## Screen — Reports (`/reports`)
Layout follows the wireframe and mockup:
1. **Filter bar** (top): Currency, From, To, Category ("All categories"), **Clear filters**, and the totals line.
2. **"Expenses by Category" card:** the pie chart with its legend.
3. **"Yearly" card:** column chart.
4. **"Monthly" card:** a Year dropdown and the column chart.
5. **Export buttons:** **Export to CSV** and **Export to PDF**, in the same pill style as the mockup.

On wide screens, the pie is on the left and the yearly and monthly charts are stacked on the right. On phones, everything is in one column.

## Code structure
**New packages:** `recharts`, `jspdf`, `jspdf-autotable`, `papaparse` (+ `@types/papaparse`).

**New**
- `src/lib/expenses/reports.ts`: the `ReportCriteria` type (currency, startDate, endDate, categoryId) and its checks, shared by browser and server. Also the summary line (e.g. "ILS only · … · Food").
- `src/app/actions/reports.ts`: Server Actions. Each checks the signed-in user and re-checks its input.
  - `getReport(criteria)`: returns the total, count, by-category, by-year and by-month amounts. It reads only matching rows (amount, date, category name) in batches of 1,000 and adds them up on the server.
  - `getExportRows(scope, criteria)`: returns the rows to export. "All" means every expense in every currency.
  - `getReportSetup()`: the user's categories and the most-used currency.
- `src/lib/expenses/export.ts` (browser): builds the CSV (`papaparse`) and the PDF (`jspdf` + `jspdf-autotable`), then starts the download. The PDF code loads only when you click Export, so the page stays fast.
- `src/components/reports/`:
  - `report-manager.tsx`: state and loading.
  - `report-filters.tsx`
  - `category-pie.tsx`, `yearly-chart.tsx`, `monthly-chart.tsx` (Recharts)
  - `export-dialog.tsx`
- `src/app/(app)/reports/page.tsx`: replaces the placeholder. It loads the setup and the first report inside `<Suspense>` with `await connection()`, as on the other pages.

**Changed**
- `spec/ARCHITECTURE.md`: the ADRs below.
- `spec/MILESTONES.md`: 🟡 at the end.

## ADRs to add
- **ADR-16:** Report totals are calculated on the server from the matching rows, one currency at a time, so currencies can't mix.
- **ADR-17:** Exports are made in the browser with `papaparse`, `jspdf` and `jspdf-autotable`. The PDF shows currency codes instead of symbols, and CSV cells are made formula-safe.
- **ADR-18:** Both the yearly and the monthly charts are always shown. The monthly chart has its own year switch.

## How I'll check it (Development only)
1. `npm run lint` and `npm run build` pass.
2. **Extra test data:** `testpilot1` only has expenses from October–November 2026. To test the yearly chart properly, I'll add about 6 "[M5 test]" expenses in 2024 and 2025, in ILS and USD, through the app's Home page. I'll list them for you at the end; nothing is deleted without asking.
3. In the built-in browser, signed in as `testpilot1`:
   - For each currency, the totals, pie, yearly and monthly numbers match a hand count of the same expenses. A currency's chart never includes another currency's amounts.
   - Date range (From only, To only, both, To before From), category filter, combined filters, and Clear filters.
   - Clicking a year column and the Year dropdown both switch the monthly chart. Future months aren't shown.
   - Empty state for a currency with no expenses.
   - The charts look right on desktop and phone sizes, with no sideways scrolling of the page.
   - **Export:**
     - Both CSV and PDF, in both "All" and "Filtered" mode. I'll check row counts, columns, currency per row, totals by currency, and that the file opens.
     - A description starting with `=` is exported safely.
     - The empty export case.

## Definition of Done (from MILESTONES.md)
- Reports correctly add up expense data for the selected currency, years and months.
- Charts display correctly in the design-system style.
- CSV and PDF exports create and download files for both filtered and complete data.

## What you'll need to do during the build
Nothing. There are no database changes and no new keys or accounts.
