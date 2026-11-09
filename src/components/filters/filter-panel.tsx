"use client";
// The Filters screen's side panel: built-in and custom criteria, Apply / Clear,
// saving the current filter and choosing a saved one. State lives in FilterManager.
import type { FormEvent } from "react";
import { Eraser, Filter, Save } from "lucide-react";
import type { SavedFilter } from "@/app/actions/filters";
import { FieldError, FormMessage } from "@/components/auth/form-parts";
import {
  dayOptions,
  FILTER_NAME_MAX,
  KEYWORD_MAX,
  MONTH_NAMES,
  monthOptions,
  type FilterErrors,
  type FilterInput,
} from "@/lib/expenses/filters";

function Hint({ id, children }: { id: string; children: string }) {
  return (
    <p id={id} className="mt-1 text-xs text-silver/70">
      {children}
    </p>
  );
}

export function FilterPanel({
  values,
  errors,
  years,
  today,
  busy,
  onChange,
  onApply,
  onClear,
  saveName,
  nameError,
  saveError,
  saveNotice,
  saving,
  onSaveNameChange,
  onSave,
  savedFilters,
  savedFiltersError,
  selectedSavedId,
  onPickSaved,
}: {
  values: FilterInput;
  errors: FilterErrors;
  years: number[];
  today: string;
  busy: boolean;
  onChange: (name: keyof FilterInput, value: string) => void;
  onApply: () => void;
  onClear: () => void;
  saveName: string;
  nameError?: string;
  saveError: string | null;
  saveNotice: string | null;
  saving: boolean;
  onSaveNameChange: (value: string) => void;
  onSave: () => void;
  savedFilters: SavedFilter[];
  savedFiltersError: string | null;
  selectedSavedId: string;
  onPickSaved: (id: string) => void;
}) {
  const year = Number(values.year);
  const month = Number(values.month);
  const months = values.year ? monthOptions(year, today) : [];
  const days = values.year && values.month ? dayOptions(year, month, today) : [];

  const describedBy = (name: keyof FilterInput, hint?: string) =>
    [errors[name] ? `${name}-error` : "", hint ?? ""].filter(Boolean).join(" ") ||
    undefined;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onApply();
  }

  function submitSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={submit} noValidate className="space-y-5">
        <fieldset className="space-y-3">
          <legend className="mb-2 text-lg text-cyan">Built-in</legend>

          <div>
            <label htmlFor="year" className="label">
              Year
            </label>
            <select
              id="year"
              className="input"
              value={values.year}
              onChange={(e) => onChange("year", e.target.value)}
              aria-invalid={Boolean(errors.year)}
              aria-describedby={describedBy("year")}
            >
              <option value="">Any year</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <FieldError id="year-error" message={errors.year} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="month" className="label">
                Month
              </label>
              <select
                id="month"
                className="input"
                value={values.month}
                disabled={!values.year}
                onChange={(e) => onChange("month", e.target.value)}
                aria-invalid={Boolean(errors.month)}
                aria-describedby={describedBy("month")}
              >
                <option value="">Any month</option>
                {months.map((m) => (
                  <option key={m} value={m}>
                    {MONTH_NAMES[m - 1]}
                  </option>
                ))}
              </select>
              <FieldError id="month-error" message={errors.month} />
            </div>
            <div>
              <label htmlFor="day" className="label">
                Day
              </label>
              <select
                id="day"
                className="input"
                value={values.day}
                disabled={!values.month}
                onChange={(e) => onChange("day", e.target.value)}
                aria-invalid={Boolean(errors.day)}
                aria-describedby={describedBy("day")}
              >
                <option value="">Any day</option>
                {days.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <FieldError id="day-error" message={errors.day} />
            </div>
          </div>

          <div>
            <label htmlFor="maxAmount" className="label">
              Max Amount
            </label>
            <input
              id="maxAmount"
              className="input"
              inputMode="decimal"
              autoComplete="off"
              placeholder="e.g. 50"
              value={values.maxAmount}
              onChange={(e) => onChange("maxAmount", e.target.value)}
              aria-invalid={Boolean(errors.maxAmount)}
              aria-describedby={describedBy("maxAmount", "maxAmount-hint")}
            />
            <FieldError id="maxAmount-error" message={errors.maxAmount} />
            <Hint id="maxAmount-hint">Compares the number only, in any currency.</Hint>
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="mb-2 text-lg text-cyan">Custom</legend>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="startDate" className="label">
                From
              </label>
              <input
                id="startDate"
                type="date"
                className="input"
                max={values.endDate || today}
                value={values.startDate}
                onChange={(e) => onChange("startDate", e.target.value)}
                aria-invalid={Boolean(errors.startDate)}
                aria-describedby={describedBy("startDate")}
              />
              <FieldError id="startDate-error" message={errors.startDate} />
            </div>
            <div>
              <label htmlFor="endDate" className="label">
                To
              </label>
              <input
                id="endDate"
                type="date"
                className="input"
                min={values.startDate || undefined}
                max={today}
                value={values.endDate}
                onChange={(e) => onChange("endDate", e.target.value)}
                aria-invalid={Boolean(errors.endDate)}
                aria-describedby={describedBy("endDate")}
              />
              <FieldError id="endDate-error" message={errors.endDate} />
            </div>
          </div>

          <div>
            <label htmlFor="keyword" className="label">
              Keyword
            </label>
            <input
              id="keyword"
              type="search"
              className="input"
              autoComplete="off"
              maxLength={KEYWORD_MAX}
              placeholder="Search descriptions"
              value={values.keyword}
              onChange={(e) => onChange("keyword", e.target.value)}
              aria-invalid={Boolean(errors.keyword)}
              aria-describedby={describedBy("keyword", "keyword-hint")}
            />
            <FieldError id="keyword-error" message={errors.keyword} />
            <Hint id="keyword-hint">Searches the description. Leave empty to ignore.</Hint>
          </div>
        </fieldset>

        <div className="flex flex-wrap gap-3">
          <button type="submit" className="btn-primary" disabled={busy}>
            <Filter aria-hidden size={18} />
            Apply Filters
          </button>
          <button type="button" className="btn-secondary" onClick={onClear} disabled={busy}>
            <Eraser aria-hidden size={18} />
            Clear
          </button>
        </div>
      </form>

      <form
        onSubmit={submitSave}
        noValidate
        className="space-y-3 border-t border-cyan/20 pt-5"
      >
        <label htmlFor="filterName" className="label">
          Save Filter Name
        </label>
        <FormMessage error={saveError ?? undefined} success={saveNotice ?? undefined} />
        <div className="flex flex-wrap gap-3">
          <div className="min-w-0 flex-1 basis-40">
            <input
              id="filterName"
              className="input"
              autoComplete="off"
              maxLength={FILTER_NAME_MAX}
              placeholder="e.g. October coffee"
              value={saveName}
              onChange={(e) => onSaveNameChange(e.target.value)}
              aria-invalid={Boolean(nameError)}
              aria-describedby={nameError ? "filterName-error" : "filterName-hint"}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={saving} aria-busy={saving}>
            <Save aria-hidden size={18} />
            {saving ? "Saving…" : "Save Filter"}
          </button>
        </div>
        <FieldError id="filterName-error" message={nameError} />
        <Hint id="filterName-hint">Saves the fields filled in above.</Hint>
      </form>

      <div className="border-t border-cyan/20 pt-5">
        <label htmlFor="savedFilters" className="label">
          Saved Filters
        </label>
        <select
          id="savedFilters"
          className="input"
          value={selectedSavedId}
          onChange={(e) => onPickSaved(e.target.value)}
          disabled={savedFilters.length === 0}
          aria-describedby={savedFiltersError ? "savedFilters-error" : "savedFilters-hint"}
        >
          <option value="">
            {savedFilters.length === 0 ? "No saved filters yet" : "Choose a saved filter"}
          </option>
          {savedFilters.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <FieldError id="savedFilters-error" message={savedFiltersError ?? undefined} />
        {!savedFiltersError && (
          <Hint id="savedFilters-hint">Choosing one fills in the fields and applies it.</Hint>
        )}
      </div>
    </div>
  );
}
