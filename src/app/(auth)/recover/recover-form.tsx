"use client";
// Two steps: 1) username → show its security question, 2) answer + new password.
import Link from "next/link";
import { useActionState } from "react";
import {
  completeRecovery,
  startRecovery,
  type RecoveryState,
} from "@/app/actions/auth";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/questions";
import {
  AuthCard,
  Field,
  FormMessage,
  SubmitButton,
} from "@/components/auth/form-parts";

// One action that dispatches on the current step, so the form state stays in one place.
async function recover(
  prev: RecoveryState,
  formData: FormData,
): Promise<RecoveryState> {
  return formData.get("step") === "answer"
    ? completeRecovery(prev, formData)
    : startRecovery(prev, formData);
}

export function RecoverForm() {
  const [state, action] = useActionState<RecoveryState, FormData>(recover, {
    step: "username",
  });
  const errors = state.fieldErrors ?? {};

  if (state.step === "done") {
    return (
      <AuthCard title="Recover Password">
        <div className="space-y-6">
          <FormMessage success={state.success} />
          <Link href="/login" className="btn-primary w-full">
            Go to Login
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Recover Password">
      <form action={action} className="space-y-4" noValidate>
        <input type="hidden" name="step" value={state.step} />
        <FormMessage error={state.error} />

        {state.step === "username" ? (
          <>
            <p className="text-sm">
              Enter your username to see your security question.
            </p>
            <Field
              id="username"
              label="Username"
              autoComplete="username"
              required
              defaultValue={state.values?.username}
              error={errors.username}
            />
          </>
        ) : (
          <>
            <input type="hidden" name="username" value={state.username} />
            <p className="text-sm">
              Username: <span className="text-white">{state.username}</span>
            </p>
            <div>
              <p className="label">Security Question</p>
              <p className="text-white">{state.question}</p>
            </div>
            <Field
              id="answer"
              label="Security Answer"
              autoComplete="off"
              required
              error={errors.answer}
            />
            <Field
              id="newPassword"
              label="New Password"
              type="password"
              autoComplete="new-password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              error={errors.newPassword}
            />
            <Field
              id="confirmPassword"
              label="Confirm Password"
              type="password"
              autoComplete="new-password"
              required
              error={errors.confirmPassword}
            />
          </>
        )}

        <div className="grid gap-3 pt-2 sm:grid-cols-[2fr_1fr]">
          <SubmitButton pendingText="Checking…">
            {state.step === "username" ? "Continue" : "Reset Password"}
          </SubmitButton>
          <Link href="/login" className="btn-secondary">
            Back
          </Link>
        </div>
      </form>
    </AuthCard>
  );
}
