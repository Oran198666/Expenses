"use client";
// Reports screen state: the filter bar, the three charts and the export buttons.
// Every change to a selector reloads the report for that one currency.
import { useRef, useState, useSyncExternalStore } from "react";
import { CircleAlert, Eraser, FileDown, FileText, Loader, RefreshCw } from "lucide-react";
import { getReport, type ReportSetup } from "@/app/actions/reports";
import { FieldError } from "@/components/auth/form-parts";
import { CategoryPie, ColumnChart } from "@/components/reports/charts";
import { ExportDialog } from "@/components/reports/export-dialog";
import { localToday } from "@/lib/dates";
import { CURRENCIES, formatAmount } from "@/lib/expenses/constants";
import {
  describeReport,
  monthSeries,
  validateReport,
  type ReportCriteria,
  type ReportData,
  type ReportErrors,
  type ReportInput,
} from "@/lib/expenses/reports";

const GENERIC_ERROR = "Something went wrong. Please try again.";

function noopSubscribe() {
  return () => {};
}

export function ReportManager({
  setup,
  initialReport,
  initialError,
  serverToday,
}: {
  setup: ReportSetup;
  initialReport: ReportData | null;
  initialError: string | null;
  serverToday: string;
}) {
  const today = useSyncExternalStore(noopSubscribe, localToday, () => serverToday);

  const [values, setValues] = useState<ReportInput>({
    currency: setup.defaultCurrency,
    startDate: "",
    endDate: "",
    categoryId: "",
  });
  const [errors, setErrors] = useState<ReportErrors>({});
  const [applied, setApplied] = useState<ReportCriteria>({ currency: setup.defaultCurrency });
  const [report, setReport] = useState<ReportData | null>(initialReport);
  const [error, setError] = useState<string | null>(initialError);
  const [loading, setLoading] = useState(false);
  const [pickedYear, setPickedYear] = useState<number | null>(null);
  const [exportFormat, setExportFormat] = useState<"csv" | "pdf" | null>(null);

  // Ignore answers to older requests (selectors changed quickly).
  const requestId = useRef(0);

  async function reload(criteria: ReportCriteria) {
    const id = ++requestId.current;
    setLoading(true);
    try {
      const result = await getReport(criteria);
      if (id !== requestId.current) return;
      if (result.ok) {
        setReport(result.report);
        setApplied(criteria);
        setError(null);
      } else {
        setError(result.error);
      }
    } catch {
      if (id === requestId.current) setError(GENERIC_ERROR);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }

  function update(next: ReportInput) {
    setValues(next);
    const result = validateReport(next, localToday());
    setErrors(result.errors);
    // Invalid values: keep showing the last valid report.
    if (result.value) void reload(result.value);
  }

  function change(name: keyof ReportInput, value: string) {
    update({ ...values, [name]: value });
  }

  function clear() {
    update({ currency: values.currency, startDate: "", endDate: "", categoryId: "" });
  }

  const categoryName = setup.categories.find((c) => c.id === applied.categoryId)?.name;
  const summary = describeReport(applied, categoryName);
  const currency = applied.currency;

  const years = report?.byYear.map((y) => y.year) ?? [];
  const yearsWithData = report?.byYear.filter((y) => y.amount > 0).map((y) => y.year) ?? [];
  const selectedYear =
    pickedYear !== null && years.includes(pickedYear) ? pickedYear : yearsWithData.at(-1);
  const hasData = !!report && report.count > 0;
  const filtersActive = !!(values.startDate || values.endDate || values.categoryId);

  return (
    <div className="space-y-6">
      <section aria-labelledby="report-filters-title" className="card p-4 sm:p-6">
        <h2 id="report-filters-title" className="sr-only">
          Report filters
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <label htmlFor="r-currency" className="label">
              Currency
            </label>
            <select
              id="r-currency"
              className="input"
              value={values.currency}
              onChange={(e) => change("currency", e.target.value)}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol.trim()})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="r-start" className="label">
              From
            </label>
            <input
              id="r-start"
              type="date"
              className="input"
              max={today}
              value={values.startDate}
              aria-invalid={!!errors.startDate}
              aria-describedby={errors.startDate ? "r-start-error" : undefined}
              onChange={(e) => change("startDate", e.target.value)}
            />
            <FieldError id="r-start-error" message={errors.startDate} />
          </div>
          <div>
            <label htmlFor="r-end" className="label">
              To
            </label>
            <input
              id="r-end"
              type="date"
              className="input"
              max={today}
              min={values.startDate || undefined}
              value={values.endDate}
              aria-invalid={!!errors.endDate}
              aria-describedby={errors.endDate ? "r-end-error" : undefined}
              onChange={(e) => change("endDate", e.target.value)}
            />
            <FieldError id="r-end-error" message={errors.endDate} />
          </div>
          <div>
            <label htmlFor="r-category" className="label">
              Category
            </label>
            <select
              id="r-category"
              className="input"
              value={values.categoryId}
              onChange={(e) => change("categoryId", e.target.value)}
            >
              <option value="">All categories</option>
              {setup.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <button
              type="button"
              className="btn-sm"
              onClick={clear}
              disabled={!filtersActive}
            >
              <Eraser aria-hidden size={14} />
              Clear filters
            </button>
            <p>
              <span className="text-cyan">Showing:</span> {summary}
            </p>
          </div>
          <p className="flex items-center gap-2" role="status">
            {loading && <Loader aria-hidden size={16} className="animate-spin" />}
            {report && (
              <span>
                <span className="text-cyan">Total:</span>{" "}
                <span className="text-white">{formatAmount(report.total, currency)}</span> ·{" "}
                {report.count} expense{report.count === 1 ? "" : "s"}
              </span>
            )}
          </p>
        </div>

        {error && (
          <div role="alert" className="form-error mt-4 flex flex-wrap items-center gap-3">
            <span className="flex items-start gap-2">
              <CircleAlert aria-hidden size={18} className="mt-0.5 shrink-0" />
              {error}
            </span>
            <button type="button" className="btn-sm" onClick={() => void reload(applied)}>
              <RefreshCw aria-hidden size={14} />
              Retry
            </button>
          </div>
        )}
      </section>

      {report && !hasData && (
        <section className="card flex flex-col items-center gap-3 p-8 text-center">
          <p className="text-white">No {currency} expenses match these filters.</p>
          <p className="text-sm">Try choosing another currency{filtersActive ? " or clearing the filters" : ""}.</p>
          {filtersActive && (
            <button type="button" className="btn-secondary" onClick={clear}>
              <Eraser aria-hidden size={18} />
              Clear filters
            </button>
          )}
        </section>
      )}

      {report && hasData && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section aria-labelledby="pie-title" className="card min-w-0 p-4 sm:p-6">
            <h2 id="pie-title" className="mb-4 text-lg text-neon-pink sm:text-xl">
              Expenses by Category
            </h2>
            <CategoryPie data={report.byCategory} currency={currency} total={report.total} />
          </section>

          <div className="min-w-0 space-y-6">
            <section aria-labelledby="yearly-title" className="card p-4 sm:p-6">
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h2 id="yearly-title" className="text-lg text-neon-pink sm:text-xl">
                  Yearly
                </h2>
                <span className="text-xs opacity-70">Click a year to see its months</span>
              </div>
              <ColumnChart
                data={report.byYear.map((y) => ({ label: String(y.year), amount: y.amount }))}
                currency={currency}
                color="#ff66ff"
                label={`Column chart of ${currency} spending by year`}
                selected={selectedYear !== undefined ? String(selectedYear) : undefined}
                onSelect={(label) => setPickedYear(Number(label))}
              />
            </section>

            <section aria-labelledby="monthly-title" className="card p-4 sm:p-6">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 id="monthly-title" className="text-lg text-neon-pink sm:text-xl">
                  Monthly
                </h2>
                <label className="flex items-center gap-2 text-sm">
                  <span>Year</span>
                  <select
                    className="input w-28! py-1.5!"
                    value={selectedYear ?? ""}
                    onChange={(e) => setPickedYear(Number(e.target.value))}
                  >
                    {[...years].reverse().map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {selectedYear !== undefined && (
                <ColumnChart
                  data={monthSeries(report.byMonth, selectedYear, today)}
                  currency={currency}
                  color="#00ffff"
                  label={`Column chart of ${currency} spending by month in ${selectedYear}`}
                />
              )}
            </section>
          </div>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-4">
        <button type="button" className="btn-primary" onClick={() => setExportFormat("csv")}>
          <FileDown aria-hidden size={18} />
          Export to CSV
        </button>
        <button type="button" className="btn-primary" onClick={() => setExportFormat("pdf")}>
          <FileText aria-hidden size={18} />
          Export to PDF
        </button>
      </div>

      <ExportDialog
        format={exportFormat}
        criteria={applied}
        filteredLine={summary}
        filteredCount={report?.count ?? 0}
        totalCount={setup.totalCount}
        today={today}
        onClose={() => setExportFormat(null)}
      />
    </div>
  );
}
