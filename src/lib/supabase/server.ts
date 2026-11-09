// Supabase client for server code (Server Components, Server Actions, Route Handlers).
// Session cookies are read/written through Next.js cookies().
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getEnv } from "@/lib/env";
import { toSessionCookie } from "@/lib/supabase/cookies";

export async function createClient() {
  const { supabaseUrl, supabaseKey } = getEnv();
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, toSessionCookie(options)),
          );
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // The proxy (src/proxy.ts) refreshes the session instead.
        }
      },
    },
  });
}
