// Checks that the configured Supabase project is reachable and accepts our key.
// Uses the Auth service health endpoint, so no database tables are needed.
import { getEnv, MissingEnvError } from "@/lib/env";

export type HealthResult = {
  ok: boolean;
  env: string | null;
  project: string | null;
  message: string;
};

function projectRef(url: string): string {
  try {
    return new URL(url).hostname.split(".")[0];
  } catch {
    return "unknown";
  }
}

export async function checkSupabase(): Promise<HealthResult> {
  let env;
  try {
    env = getEnv();
  } catch (error) {
    const message =
      error instanceof MissingEnvError ? error.message : "Invalid settings";
    return { ok: false, env: null, project: null, message };
  }

  const project = projectRef(env.supabaseUrl);
  const label = env.appEnv === "production" ? "Production" : "Development";

  try {
    const res = await fetch(`${env.supabaseUrl}/auth/v1/health`, {
      headers: { apikey: env.supabaseKey },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    if (res.ok) {
      return {
        ok: true,
        env: env.appEnv,
        project,
        message: `Connected to Supabase (${label})`,
      };
    }

    const message =
      res.status === 401 || res.status === 403
        ? "Supabase rejected the key — check NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
        : `Supabase answered with an error (${res.status}). The project may be paused.`;
    return { ok: false, env: env.appEnv, project, message };
  } catch {
    return {
      ok: false,
      env: env.appEnv,
      project,
      message:
        "Could not reach Supabase — check NEXT_PUBLIC_SUPABASE_URL and your internet connection",
    };
  }
}
