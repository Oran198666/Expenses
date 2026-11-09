"use client";
import Link from "next/link";
import { useActionState } from "react";
import { login, type FormState } from "@/app/actions/auth";
import {
  AuthCard,
  Field,
  FormMessage,
  SubmitButton,
} from "@/components/auth/form-parts";

export function LoginForm() {
  const [state, action] = useActionState<FormState, FormData>(login, {});

  return (
    <AuthCard title="Login">
      <form action={action} className="space-y-4" noValidate>
        <FormMessage error={state.error} />
        <Field
          id="username"
          label="Username"
          autoComplete="username"
          required
          defaultValue={state.values?.username}
          error={state.fieldErrors?.username}
        />
        <Field
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          error={state.fieldErrors?.password}
        />
        <div className="space-y-3 pt-2">
          <SubmitButton pendingText="Logging in…">Log In</SubmitButton>
          <Link href="/recover" className="btn-secondary w-full">
            Recover Password
          </Link>
        </div>
      </form>
      <p className="mt-6 text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-cyan underline-offset-4 hover:underline">
          Register
        </Link>
      </p>
    </AuthCard>
  );
}
