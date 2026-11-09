// Supabase client with the secret key (see ADR-7). Server only — never import
// this from a Client Component. Used for creating accounts and password recovery.
import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getEnv } from "@/lib/env";

export function createAdminClient() {
  const { supabaseUrl } = getEnv();
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing setting: SUPABASE_SECRET_KEY — see SETUP.md");
  }
  return createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
