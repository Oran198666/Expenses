// Shared expense and category checks. Run in the browser for quick feedback
// and again on the server, which is the one that counts.
import { isValidIsoDate } from "@/lib/dates";
import {
  CATEGORY_NAME_MAX,
  CURRENCIES,
  DESCRIPTION_MAX,
  isCurrency,
  isOtherCategory,
  MAX_AMOUNT,
  type CurrencyCode,
} from "@/lib/expenses/constants";

/** What the expense form sends (all strings, as typed). */
export type ExpenseInput = {
  amount: string;
  currency: string;
  categoryId: string;
  date: string;
  description: string;
};

export type CleanExpense = {
  amount: number;
  currency: CurrencyCode;
  categoryId: string;
  date: string;
  description: string | null;
};

export type FieldErrors = Partial<Record<keyof ExpenseInput, string>>;

const AMOUNT_FORMAT = /^(\d+(\.\d{0,2})?|\.\d{1,2})$/;
const MAX_AMOUNT_TEXT = MAX_AMOUNT.toLocaleString("en-US");

/**
 * Checks an expense against the PRD rules.
 * @param today the latest allowed date ("YYYY-MM-DD", the user's local today)
 * @param categoryName the selected category's name (undefined if not found)
 */
export function validateExpense(
  input: ExpenseInput,
  today: string,
  categoryName: string | undefined,
): { errors: FieldErrors; value?: CleanExpense } {
  const errors: FieldErrors = {};

  const amountText = (input.amount ?? "").trim().replace(/,/g, "");
  const amount = Number(amountText);
  if (!amountText) {
    errors.amount = "Please enter an amount.";
  } else if (!AMOUNT_FORMAT.test(amountText) || !Number.isFinite(amount)) {
    errors.amount = "Enter a number with up to 2 decimal places.";
  } else if (amount <= 0) {
    errors.amount = "Amount must be greater than 0.";
  } else if (amount > MAX_AMOUNT) {
    errors.amount = `Amount can't be more than ${MAX_AMOUNT_TEXT}.`;
  }

  if (!isCurrency(input.currency)) {
    errors.currency = `Please choose a currency (${CURRENCIES.map((c) => c.code).join(", ")}).`;
  }

  if (!input.categoryId || categoryName === undefined) {
    errors.categoryId = "Please choose a category.";
  }

  if (!input.date) {
    errors.date = "Please choose a date.";
  } else if (!isValidIsoDate(input.date)) {
    errors.date = "Please enter a valid date.";
  } else if (input.date > today) {
    errors.date = "The date can't be in the future.";
  }

  const description = (input.description ?? "").trim();
  if (description.length > DESCRIPTION_MAX) {
    errors.description = `Description can be up to ${DESCRIPTION_MAX} characters.`;
  } else if (!description && isOtherCategory(categoryName)) {
    errors.description = 'A description is required for the "Other" category.';
  }

  if (Object.keys(errors).length > 0) return { errors };
  return {
    errors,
    value: {
      amount: Math.round(amount * 100) / 100,
      currency: input.currency as CurrencyCode,
      categoryId: input.categoryId,
      date: input.date,
      description: description || null,
    },
  };
}

/** Returns an error message, or null if the category name is fine. */
export function validateCategoryName(
  name: string,
  otherNames: string[],
): string | null {
  const clean = name.trim();
  if (!clean) return "Please enter a category name.";
  if (clean.length > CATEGORY_NAME_MAX) {
    return `Category names can be up to ${CATEGORY_NAME_MAX} characters.`;
  }
  const lower = clean.toLowerCase();
  if (otherNames.some((n) => n.trim().toLowerCase() === lower)) {
    return "A category with this name already exists.";
  }
  return null;
}
