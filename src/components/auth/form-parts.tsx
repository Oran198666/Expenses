"use client";
// Small shared building blocks for the authentication forms.
import { useFormStatus } from "react-dom";
import { CircleAlert, CircleCheck } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

export function AuthCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="card w-full max-w-md p-6 sm:p-8">
      <h1 className="glow-text mb-6 text-center text-2xl sm:text-3xl">
        {title}
      </h1>
      {children}
    </section>
  );
}

type FieldProps = {
  id: string;
  label: string;
  error?: string;
} & ComponentProps<"input">;

export function Field({ id, label, error, ...inputProps }: FieldProps) {
  const errorId = `${id}-error`;
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input
        id={id}
        name={id}
        className="input"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        {...inputProps}
      />
      <FieldError id={errorId} message={error} />
    </div>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="form-error mt-1.5">
      {message}
    </p>
  );
}

export function FormMessage({
  error,
  success,
}: {
  error?: string;
  success?: string;
}) {
  if (error) {
    return (
      <p role="alert" className="form-error flex items-start gap-2">
        <CircleAlert aria-hidden size={18} className="mt-0.5 shrink-0" />
        {error}
      </p>
    );
  }
  if (success) {
    return (
      <p role="status" className="form-success flex items-start gap-2">
        <CircleCheck aria-hidden size={18} className="mt-0.5 shrink-0" />
        {success}
      </p>
    );
  }
  return null;
}

export function SubmitButton({
  children,
  pendingText,
}: {
  children: ReactNode;
  pendingText: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="btn-primary w-full"
      disabled={pending}
      aria-disabled={pending}
    >
      {pending ? pendingText : children}
    </button>
  );
}
