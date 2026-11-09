"use client";
import Link from "next/link";
import { useActionState } from "react";
import { register, type FormState } from "@/app/actions/auth";
import { SECURITY_QUESTIONS, MIN_PASSWORD_LENGTH } from "@/lib/auth/questions";
import { USERNAME_RULE } from "@/lib/auth/username";
import {
  AuthCard,
  Field,
  FieldError,
  FormMessage,
  SubmitButton,
} from "@/components/auth/form-parts";

export function RegisterForm() {
  const [state, action] = useActionState<FormState, FormData>(register, {});
  const errors = state.fieldErrors ?? {};

  return (
    <AuthCard title="Registration">
      <form action={action} className="space-y-4" noValidate>
        <FormMessage error={state.error} />
        <Field
          id="username"
          label="Username"
          autoComplete="username"
          required
          defaultValue={state.values?.username}
          error={errors.username}
          placeholder="e.g. galaxy_traveler"
        />
        {!errors.username && (
          <p className="-mt-2 text-xs text-silver/80">{USERNAME_RULE}</p>
        )}
        <Field
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          error={errors.password}
        />
        <div>
          <label htmlFor="question" className="label">
            Security Question
          </label>
          <select
            id="question"
            name="question"
            className="input"
            required
            // key resets the select when the server echoes a value back.
            key={state.values?.question ?? ""}
            defaultValue={state.values?.question ?? ""}
            aria-invalid={Boolean(errors.question)}
            aria-describedby={errors.question ? "question-error" : undefined}
          >
            <option value="" disabled>
              Choose a security question
            </option>
            {SECURITY_QUESTIONS.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
          <FieldError id="question-error" message={errors.question} />
        </div>
        <Field
          id="answer"
          label="Security Answer"
          autoComplete="off"
          required
          error={errors.answer}
        />
        <div className="grid gap-3 pt-2 sm:grid-cols-[2fr_1fr]">
          <SubmitButton pendingText="Registering…">Register</SubmitButton>
          <Link href="/login" className="btn-secondary">
            Back
          </Link>
        </div>
      </form>
    </AuthCard>
  );
}
