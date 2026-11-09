// Fixed lists and limits for expenses and categories (from spec/PRD.md).

export const CURRENCIES = [
  { code: "ILS", symbol: "₪", name: "Israeli Shekel" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CHF", symbol: "CHF ", name: "Swiss Franc" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

export const DEFAULT_CURRENCY: CurrencyCode = "ILS";

export function isCurrency(value: unknown): value is CurrencyCode {
  return CURRENCIES.some((c) => c.code === value);
}

/** e.g. 1234.5 + "ILS" -> "₪1,234.50" */
export function formatAmount(amount: number, currency: string): string {
  const symbol = CURRENCIES.find((c) => c.code === currency)?.symbol ?? `${currency} `;
  const number = amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${number}`;
}

export const MAX_AMOUNT = 100_000;
export const DESCRIPTION_MAX = 200;
export const CATEGORY_NAME_MAX = 40;
export const PAGE_SIZE = 25;

/** Categories every new user starts with (seeded by the database, ADR-12). */
export const PREDEFINED_CATEGORIES = [
  "Food",
  "Fuel",
  "Leisure",
  "Utilities & Bills",
  "Shopping",
  "Transportation",
  "Health",
  "Education",
  "Housing",
  "Other",
] as const;

/** The category whose expenses must have a description (ADR-10). */
export function isOtherCategory(name: string | undefined | null): boolean {
  return (name ?? "").trim().toLowerCase() === "other";
}

export type SortKey = "date" | "amount" | "category";
export type SortDir = "asc" | "desc";

export function isSortKey(value: unknown): value is SortKey {
  return value === "date" || value === "amount" || value === "category";
}

export function isSortDir(value: unknown): value is SortDir {
  return value === "asc" || value === "desc";
}
