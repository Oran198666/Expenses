// Supabase client for code that runs in the browser (Client Components).
import { createBrowserClient } from "@supabase/ssr";
import { getEnv } from "@/lib/env";

export function createClient() {
  const { supabaseUrl, supabaseKey } = getEnv();
  return createBrowserClient(supabaseUrl, supabaseKey);
}
