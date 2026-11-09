"use client";
// "New Expense" / "Edit Expense" form. Checks the PRD rules in the browser
// first, then saves through a Server Action that checks them again.
import {
  useState,
  useSyncExternalStore,
  type FormEvent,
  type RefObject,
} from "react";
import { CircleAlert, CircleCheck, Plus, Save, X } from "lucide-react";
import type { Category } from "@/app/actions/categories";
import {
  createExpense,
  updateExpense,
  type ExpenseRow,
} from "@/app/actions/expenses";
import { FieldError } from "@/components/auth/form-parts";
import { localToday } from "@/lib/dates";
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  DESCRIPTION_MAX,
  isOtherCategory,
} from "@/lib/expenses/constants";
import {
  validateExpense,
  type ExpenseInput,
  type FieldErrors,
} from "@/lib/expenses/validation";

const GENERIC_ERROR = "Something went wrong. Please try again.";

function noopSubscribe() {
  return () => {};
}

function initialValues(editing: ExpenseRow | null): ExpenseInput {
  if (editing) {
    return {
      amount: editing.amount.toFixed(2),
      currency: editing.currency,
      categoryId: editing.categoryId,
      date: editing.date,
      description: editing.description ?? "",
    };
  }
  return {
    amount: "",
    currency: DEFAULT_CURRENCY,
    categoryId: "",
    // Empty means "today" in the user's time zone (known only in the browser).
    date: "",
    description: "",
  };
}

export function ExpenseForm({
  categories,
  editing,
  notice,
  amountRef,
  onSaved,
  onCancelEdit,
}: {
  categories: Category[];
  editing: ExpenseRow | null;
  notice: string | null;
  amountRef?: RefObject<HTMLInputElement | null>;
  onSaved: (message: string) => void;
  onCancelEdit: () => void;
}) {
  const [values, setValues] = useState<ExpenseInput>(() => initialValues(editing));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  // The browser's local date; null while rendering on the server.
  const today = useSyncExternalStore(noopSubscribe, localToday, () => null);

  const selected = categories.find((c) => c.id === values.categoryId);
  const descriptionRequired = isOtherCategory(selected?.name);

  function set<K extends keyof ExpenseInput>(name: K, value: string) {
    setValues((v) => ({ ...v, [name]: value }));
    // Clear the field's message as soon as the user changes it.
    setErrors((e) => {
      if (!e[name] && !(name === "categoryId" && e.description)) return e;
      const next = { ...e };
      delete next[name];
      if (name === "categoryId") delete next.description;
      return next;
    });
    setFormError(null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const clientToday = localToday();
    const input = { ...values, date: values.date || clientToday };
    const check = validateExpense(input, clientToday, selected?.name);
    setErrors(check.errors);
    setFormError(null);
    if (!check.value) return;

    setPending(true);
    try {
      const result = editing
        ? await updateExpense(editing.id, input, clientToday)
        : await createExpense(input, clientToday);
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.error ?? null);
        return;
      }
      if (editing) {
        onSaved("Expense updated.");
      } else {
        // Keep currency, category and date for quick entry of the next one.
        setValues((v) => ({ ...v, amount: "", description: "" }));
        setErrors({});
        onSaved("Expense added.");
      }
    } catch {
      setFormError(GENERIC_ERROR);
    } finally {
      setPending(false);
    }
  }

  const invalid = (name: keyof ExpenseInput) => Boolean(errors[name]);
  const describedBy = (name: keyof ExpenseInput) =>
    errors[name] ? `${name}-error` : undefined;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {formError ? (
        <p role="alert" className="form-error flex items-start gap-2">
          <CircleAlert aria-hidden size={18} className="mt-0.5 shrink-0" />
          {formError}
        </p>
      ) : (
        notice && (
          <p role="status" className="form-success flex items-start gap-2">
            <CircleCheck aria-hidden size={18} className="mt-0.5 shrink-0" />
            {notice}
          </p>
        )
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="amount" className="label">
            Amount *
          </label>
          <input
            ref={amountRef}
            id="amount"
            name="amount"
            className="input"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            value={values.amount}
            onChange={(e) => set("amount", e.target.value)}
            aria-required
            aria-invalid={invalid("amount")}
            aria-describedby={describedBy("amount")}
          />
          <FieldError id="amount-error" message={errors.amount} />
        </div>

        <div>
          <label htmlFor="currency" className="label">
            Currency *
          </label>
          <select
            id="currency"
            name="currency"
            className="input"
            value={values.currency}
            onChange={(e) => set("currency", e.target.value)}
            aria-required
            aria-invalid={invalid("currency")}
            aria-describedby={describedBy("currency")}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} ({c.symbol.trim()})
              </option>
            ))}
          </select>
          <FieldError id="currency-error" message={errors.currency} />
        </div>

        <div>
          <label htmlFor="categoryId" className="label">
            Category *
          </label>
          <select
            id="categoryId"
            name="categoryId"
            className="input"
            value={values.categoryId}
            onChange={(e) => set("categoryId", e.target.value)}
            aria-required
            aria-invalid={invalid("categoryId")}
            aria-describedby={describedBy("categoryId")}
          >
            <option value="">Choose a category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <FieldError id="categoryId-error" message={errors.categoryId} />
        </div>

        <div>
          <label htmlFor="date" className="label">
            Date *
          </label>
          <input
            id="date"
            name="date"
            type="date"
            className="input"
            max={today ?? undefined}
            value={values.date || today || ""}
            onChange={(e) => set("date", e.target.value)}
            aria-required
            aria-invalid={invalid("date")}
            aria-describedby={describedBy("date")}
          />
          <FieldError id="date-error" message={errors.date} />
        </div>

        <div className="sm:col-span-2 lg:col-span-4">
          <label htmlFor="description" className="label">
            Description{descriptionRequired ? " *" : " (optional)"}
          </label>
          <input
            id="description"
            name="description"
            className="input"
            autoComplete="off"
            maxLength={DESCRIPTION_MAX}
            placeholder={
              descriptionRequired
                ? 'Required for the "Other" category'
                : "What was it for?"
            }
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
            aria-required={descriptionRequired}
            aria-invalid={invalid("description")}
            aria-describedby={describedBy("description")}
          />
          <FieldError id="description-error" message={errors.description} />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          className="btn-primary"
          disabled={pending}
          aria-busy={pending}
        >
          {editing ? (
            <Save aria-hidden size={18} />
          ) : (
            <Plus aria-hidden size={18} />
          )}
          {pending ? "Saving…" : editing ? "Save Changes" : "Add Expense"}
        </button>
        {editing && (
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancelEdit}
            disabled={pending}
          >
            <X aria-hidden size={18} />
            Cancel
          </button>
        )}
      </div>
      <p className="text-xs text-silver/70">* Required</p>
    </form>
  );
}
