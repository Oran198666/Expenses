// Filters screen: the criteria shape, shared checks (browser + server), the
// summary line and the year/month/day option helpers.
import { isValidIsoDate } from "@/lib/dates";
import { MAX_AMOUNT } from "@/lib/expenses/constants";

/** A clean set of filter criteria. Every key is optional; empty ones are left out. */
export type FilterCriteria = {
  year?: number;
  month?: number; // 1-12
  day?: number; // 1-31
  maxAmount?: number;
  startDate?: string; // "YYYY-MM-DD"
  endDate?: string;
  keyword?: string;
};

/** What the filter panel holds (all strings, as typed). */
export type FilterInput = {
  year: string;
  month: string;
  day: string;
  maxAmount: string;
  startDate: string;
  endDate: string;
  keyword: string;
};

export type FilterErrors = Partial<Record<keyof FilterInput, string>>;

export const EMPTY_FILTER_INPUT: FilterInput = {
  year: "",
  month: "",
  day: "",
  maxAmount: "",
  startDate: "",
  endDate: "",
  keyword: "",
};

export const KEYWORD_MAX = 100;
export const FILTER_NAME_MAX = 40;

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const AMOUNT_FORMAT = /^(\d+(\.\d{0,2})?|\.\d{1,2})$/;
const MAX_AMOUNT_TEXT = MAX_AMOUNT.toLocaleString("en-US");

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Years from the oldest expense's year up to this year (newest first). */
export function yearOptions(oldestYear: number | null, today: string): number[] {
  const current = Number(today.slice(0, 4));
  const first = oldestYear && oldestYear < current ? oldestYear : current;
  const years: number[] = [];
  for (let y = current; y >= first; y--) years.push(y);
  return years;
}

/** Months of the chosen year, without future months. */
export function monthOptions(year: number, today: string): number[] {
  const [ty, tm] = today.split("-").map(Number);
  const last = year === ty ? tm : year > ty ? 0 : 12;
  return Array.from({ length: last }, (_, i) => i + 1);
}

/** Real days of the chosen month, without future days. */
export function dayOptions(year: number, month: number, today: string): number[] {
  const [ty, tm, td] = today.split("-").map(Number);
  let last = daysInMonth(year, month);
  if (year === ty && month === tm) last = Math.min(last, td);
  if (year > ty || (year === ty && month > tm)) last = 0;
  return Array.from({ length: last }, (_, i) => i + 1);
}

/**
 * Checks the panel's values and turns them into clean criteria.
 * @param today the latest allowed date ("YYYY-MM-DD")
 */
export function validateFilters(
  input: FilterInput,
  today: string,
): { errors: FilterErrors; value?: FilterCriteria } {
  const errors: FilterErrors = {};
  const value: FilterCriteria = {};
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const [ty, tm, td] = today.split("-").map(Number);

  const yearText = str(input?.year);
  const monthText = str(input?.month);
  const dayText = str(input?.day);
  if (yearText) {
    const year = Number(yearText);
    if (!Number.isInteger(year) || year < 1900 || year > ty) {
      errors.year = "Please choose a valid year.";
    } else {
      value.year = year;
    }
  }
  if (monthText) {
    const month = Number(monthText);
    if (!value.year && !errors.year) {
      errors.month = "Choose a year first.";
    } else if (
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12 ||
      (value.year === ty && month > tm)
    ) {
      errors.month = "Please choose a valid month.";
    } else if (value.year) {
      value.month = month;
    }
  }
  if (dayText) {
    const day = Number(dayText);
    if (!value.month && !errors.month) {
      errors.day = "Choose a month first.";
    } else if (value.year && value.month) {
      const valid =
        Number.isInteger(day) &&
        day >= 1 &&
        day <= daysInMonth(value.year, value.month) &&
        !(value.year === ty && value.month === tm && day > td);
      if (valid) value.day = day;
      else errors.day = "Please choose a valid day.";
    }
  }

  const amountText = str(input?.maxAmount).replace(/,/g, "");
  if (amountText) {
    const amount = Number(amountText);
    if (!AMOUNT_FORMAT.test(amountText) || !Number.isFinite(amount)) {
      errors.maxAmount = "Enter a number with up to 2 decimal places.";
    } else if (amount <= 0) {
      errors.maxAmount = "Max amount must be greater than 0.";
    } else if (amount > MAX_AMOUNT) {
      errors.maxAmount = `Max amount can't be more than ${MAX_AMOUNT_TEXT}.`;
    } else {
      value.maxAmount = Math.round(amount * 100) / 100;
    }
  }

  const start = str(input?.startDate);
  const end = str(input?.endDate);
  if (start) {
    if (!isValidIsoDate(start)) errors.startDate = "Please enter a valid date.";
    else if (start > today) errors.startDate = "The date can't be in the future.";
    else value.startDate = start;
  }
  if (end) {
    if (!isValidIsoDate(end)) errors.endDate = "Please enter a valid date.";
    else if (end > today) errors.endDate = "The date can't be in the future.";
    else if (value.startDate && end < value.startDate) {
      errors.endDate = "The end date can't be before the start date.";
    } else value.endDate = end;
  }

  const keyword = str(input?.keyword);
  if (keyword.length > KEYWORD_MAX) {
    errors.keyword = `Keyword can be up to ${KEYWORD_MAX} characters.`;
  } else if (keyword) {
    value.keyword = keyword;
  }

  if (Object.keys(errors).length > 0) return { errors };
  return { errors, value };
}

/** Criteria back into panel values (for loading a saved filter). */
export function criteriaToInput(c: FilterCriteria): FilterInput {
  const s = (v: number | string | undefined) => (v === undefined ? "" : String(v));
  return {
    year: s(c.year),
    month: s(c.month),
    day: s(c.day),
    maxAmount: s(c.maxAmount),
    startDate: s(c.startDate),
    endDate: s(c.endDate),
    keyword: s(c.keyword),
  };
}

/**
 * Re-checks criteria that came from outside (a request or a stored saved filter).
 * Returns null if they are not a valid criteria object.
 */
export function parseCriteria(raw: unknown, today: string): FilterCriteria | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  const field = (v: unknown) =>
    typeof v === "number" || typeof v === "string" ? String(v) : "";
  const { value } = validateFilters(
    {
      year: field(r.year),
      month: field(r.month),
      day: field(r.day),
      maxAmount: field(r.maxAmount),
      startDate: field(r.startDate),
      endDate: field(r.endDate),
      keyword: field(r.keyword),
    },
    today,
  );
  return value ?? null;
}

export function isEmptyCriteria(c: FilterCriteria): boolean {
  return Object.keys(c).length === 0;
}

/** e.g. "2026 · November · up to 50 · keyword "coffee"" */
export function describeFilters(c: FilterCriteria): string {
  const parts: string[] = [];
  if (c.year && c.month && c.day) {
    parts.push(`${c.year}-${pad(c.month)}-${pad(c.day)}`);
  } else {
    if (c.year) parts.push(String(c.year));
    if (c.month) parts.push(MONTH_NAMES[c.month - 1]);
  }
  if (c.maxAmount !== undefined) {
    parts.push(`up to ${c.maxAmount.toLocaleString("en-US", { maximumFractionDigits: 2 })}`);
  }
  if (c.startDate && c.endDate) parts.push(`${c.startDate} to ${c.endDate}`);
  else if (c.startDate) parts.push(`from ${c.startDate}`);
  else if (c.endDate) parts.push(`until ${c.endDate}`);
  if (c.keyword) parts.push(`keyword "${c.keyword}"`);
  return parts.length ? parts.join(" · ") : "All expenses";
}

/** The date range a year / month / day selection covers: [from, before). */
export function builtInDateRange(
  c: FilterCriteria,
): { from: string; before: string } | null {
  if (!c.year) return null;
  if (c.month && c.day) {
    const next = new Date(Date.UTC(c.year, c.month - 1, c.day + 1));
    return {
      from: `${c.year}-${pad(c.month)}-${pad(c.day)}`,
      before: next.toISOString().slice(0, 10),
    };
  }
  if (c.month) {
    const nextYear = c.month === 12 ? c.year + 1 : c.year;
    const nextMonth = c.month === 12 ? 1 : c.month + 1;
    return {
      from: `${c.year}-${pad(c.month)}-01`,
      before: `${nextYear}-${pad(nextMonth)}-01`,
    };
  }
  return { from: `${c.year}-01-01`, before: `${c.year + 1}-01-01` };
}
