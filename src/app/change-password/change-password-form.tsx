"use client";
import Link from "next/link";
import { useActionState } from "react";
import { changePassword, type FormState } from "@/app/actions/auth";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/questions";
import {
  AuthCard,
  Field,
  FormMessage,
  SubmitButton,
} from "@/components/auth/form-parts";

export function ChangePasswordForm() {
  const [state, action] = useActionState<FormState, FormData>(
    changePassword,
    {},
  );
  const errors = state.fieldErrors ?? {};

  return (
    <AuthCard title="Change Password">
      <form action={action} className="space-y-4" noValidate>
        <FormMessage error={state.error} success={state.success} />
        <Field
          id="currentPassword"
          label="Current Password"
          type="password"
          autoComplete="current-password"
          required
          error={errors.currentPassword}
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
        <div className="grid gap-3 pt-2 sm:grid-cols-[2fr_1fr]">
          <SubmitButton pendingText="Saving…">Change Password</SubmitButton>
          <Link href="/" className="btn-secondary">
            Back
          </Link>
        </div>
      </form>
    </AuthCard>
  );
}
