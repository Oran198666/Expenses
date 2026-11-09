// Returns a Supabase client acting as the signed-in user (so Row Level Security
// applies) plus the user's id. Sends the visitor to /login if the session ended.
import "server-only";
import { redirect } from "next/navigation";
import { isAuthRetryableFetchError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  // A network problem is not a signed-out user: let the caller show an error.
  if (error && isAuthRetryableFetchError(error)) throw error;
  if (!data.user) redirect("/login");
  return { supabase, userId: data.user.id };
}

export const GENERIC_ERROR = "Something went wrong. Please try again.";
