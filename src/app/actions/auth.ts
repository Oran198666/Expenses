"use server";
// Server Actions for registration, login, logout, password change and recovery.
// Every action re-validates its input; client-side checks are only a convenience.
import { redirect, unstable_rethrow } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isValidUsername,
  normalizeUsername,
  usernameToEmail,
  USERNAME_RULE,
} from "@/lib/auth/username";
import {
  isSecurityQuestion,
  MIN_PASSWORD_LENGTH,
} from "@/lib/auth/questions";
import { hashAnswer, verifyAnswer } from "@/lib/auth/security-answer";

export type FormState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
  // Non-secret values echoed back so the form keeps them after an error.
  values?: Record<string, string>;
};

export type RecoveryState = FormState & {
  step: "username" | "answer" | "done";
  username?: string;
  question?: string;
};

const GENERIC_ERROR = "Something went wrong. Please try again.";
const PASSWORD_RULE = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function hasErrors(errors: Record<string, string>): boolean {
  return Object.keys(errors).length > 0;
}

// Supabase reports its own password rules (e.g. "weak password") in English.
function passwordErrorMessage(message: string | undefined): string {
  if (message && /password/i.test(message)) return message;
  return GENERIC_ERROR;
}

// ---------- Registration ----------

export async function register(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const rawUsername = text(formData, "username");
  const username = normalizeUsername(rawUsername);
  const password = text(formData, "password");
  const question = text(formData, "question");
  const answer = text(formData, "answer");
  const values = { username: rawUsername, question };

  const fieldErrors: Record<string, string> = {};
  if (!username) fieldErrors.username = "Please enter a username.";
  else if (!isValidUsername(username)) fieldErrors.username = USERNAME_RULE;
  if (password.length < MIN_PASSWORD_LENGTH) fieldErrors.password = PASSWORD_RULE;
  if (!isSecurityQuestion(question))
    fieldErrors.question = "Please choose a security question.";
  if (!answer.trim()) fieldErrors.answer = "Please enter an answer.";
  if (hasErrors(fieldErrors)) return { fieldErrors, values };

  try {
    const admin = createAdminClient();

    const { data: existing, error: lookupError } = await admin
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    if (lookupError) return { error: GENERIC_ERROR, values };
    if (existing) {
      return {
        fieldErrors: { username: "This username is already taken." },
        values,
      };
    }

    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email: usernameToEmail(username),
        password,
        email_confirm: true,
        user_metadata: { username },
      });
    if (createError || !created.user) {
      if (createError?.code === "email_exists") {
        return {
          fieldErrors: { username: "This username is already taken." },
          values,
        };
      }
      if (createError?.code === "weak_password") {
        return {
          fieldErrors: { password: passwordErrorMessage(createError.message) },
          values,
        };
      }
      return { error: GENERIC_ERROR, values };
    }

    const { error: profileError } = await admin.from("profiles").insert({
      id: created.user.id,
      username,
      security_question: question,
      security_answer_hash: await hashAnswer(answer),
    });
    if (profileError) {
      // Don't leave a half-registered account behind.
      await admin.auth.admin.deleteUser(created.user.id);
      return { error: GENERIC_ERROR, values };
    }

    const supabase = await createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    });
    if (signInError) {
      return {
        error: "Your account was created. Please log in.",
        values,
      };
    }
  } catch {
    return { error: GENERIC_ERROR, values };
  }

  redirect("/");
}

// ---------- Login / logout ----------

export async function login(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const rawUsername = text(formData, "username");
  const username = normalizeUsername(rawUsername);
  const password = text(formData, "password");
  const values = { username: rawUsername };

  const fieldErrors: Record<string, string> = {};
  if (!username) fieldErrors.username = "Please enter your username.";
  if (!password) fieldErrors.password = "Please enter your password.";
  if (hasErrors(fieldErrors)) return { fieldErrors, values };

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    });
    if (error) {
      const wrongCredentials =
        error.code === "invalid_credentials" || error.status === 400;
      return {
        error: wrongCredentials
          ? "Incorrect username or password. Please try again."
          : GENERIC_ERROR,
        values,
      };
    }
  } catch {
    return { error: GENERIC_ERROR, values };
  }

  redirect("/");
}

export async function logout(): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Even if Supabase can't be reached, send the user to the login page.
  }
  redirect("/login");
}

// ---------- Change password (signed in) ----------

export async function changePassword(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const current = text(formData, "currentPassword");
  const next = text(formData, "newPassword");
  const confirm = text(formData, "confirmPassword");

  const fieldErrors: Record<string, string> = {};
  if (!current) fieldErrors.currentPassword = "Please enter your current password.";
  if (next.length < MIN_PASSWORD_LENGTH) fieldErrors.newPassword = PASSWORD_RULE;
  if (confirm !== next) fieldErrors.confirmPassword = "The new passwords don't match.";
  if (hasErrors(fieldErrors)) return { fieldErrors };

  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const email = userData.user?.email;
    if (!email) redirect("/login");

    // Confirm the current password before changing anything.
    const { error: checkError } = await supabase.auth.signInWithPassword({
      email,
      password: current,
    });
    if (checkError) {
      return {
        fieldErrors: { currentPassword: "Current password is incorrect." },
      };
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: next,
    });
    if (updateError) {
      return {
        fieldErrors: { newPassword: passwordErrorMessage(updateError.message) },
      };
    }
  } catch (error) {
    // redirect() works by throwing; let it through.
    unstable_rethrow(error);
    return { error: GENERIC_ERROR };
  }

  return { success: "Your password has been changed." };
}

// ---------- Password recovery (signed out) ----------

export async function startRecovery(
  _prev: RecoveryState,
  formData: FormData,
): Promise<RecoveryState> {
  const rawUsername = text(formData, "username");
  const username = normalizeUsername(rawUsername);
  const values = { username: rawUsername };

  if (!username) {
    return {
      step: "username",
      fieldErrors: { username: "Please enter your username." },
      values,
    };
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .select("security_question")
      .eq("username", username)
      .maybeSingle();
    if (error) return { step: "username", error: GENERIC_ERROR, values };
    if (!data) {
      return {
        step: "username",
        fieldErrors: { username: "No account found with this username." },
        values,
      };
    }
    return { step: "answer", username, question: data.security_question };
  } catch {
    return { step: "username", error: GENERIC_ERROR, values };
  }
}

export async function completeRecovery(
  prev: RecoveryState,
  formData: FormData,
): Promise<RecoveryState> {
  const username = normalizeUsername(text(formData, "username"));
  const answer = text(formData, "answer");
  const next = text(formData, "newPassword");
  const confirm = text(formData, "confirmPassword");
  const base: RecoveryState = {
    step: "answer",
    username: prev.username ?? username,
    question: prev.question,
  };

  const fieldErrors: Record<string, string> = {};
  if (!answer.trim()) fieldErrors.answer = "Please enter your answer.";
  if (next.length < MIN_PASSWORD_LENGTH) fieldErrors.newPassword = PASSWORD_RULE;
  if (confirm !== next) fieldErrors.confirmPassword = "The new passwords don't match.";
  if (hasErrors(fieldErrors)) return { ...base, fieldErrors };

  try {
    const admin = createAdminClient();
    const { data: profile, error } = await admin
      .from("profiles")
      .select("id, security_answer_hash")
      .eq("username", username)
      .maybeSingle();
    if (error) return { ...base, error: GENERIC_ERROR };
    if (!profile) return { step: "username", error: "No account found with this username." };

    const correct = await verifyAnswer(answer, profile.security_answer_hash);
    if (!correct) {
      return {
        ...base,
        fieldErrors: {
          answer: "That answer is incorrect. Your password was not changed.",
        },
      };
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(
      profile.id,
      { password: next },
    );
    if (updateError) {
      return {
        ...base,
        fieldErrors: { newPassword: passwordErrorMessage(updateError.message) },
      };
    }
  } catch {
    return { ...base, error: GENERIC_ERROR };
  }

  return { step: "done", success: "Your password has been reset. Please log in." };
}
