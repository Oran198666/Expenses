// Reads the public Supabase settings. Values come from `.env` locally
// (Development project) and from Vercel Environment Variables in production.

export type AppEnv = {
  supabaseUrl: string;
  supabaseKey: string;
  appEnv: string;
};

export class MissingEnvError extends Error {}

export function getEnv(): AppEnv {
  // Each variable must be referenced literally so Next.js can inline it in browser code.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const appEnv = process.env.NEXT_PUBLIC_APP_ENV;

  const missing = [
    !supabaseUrl && "NEXT_PUBLIC_SUPABASE_URL",
    !supabaseKey && "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    !appEnv && "NEXT_PUBLIC_APP_ENV",
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new MissingEnvError(
      `Missing setting: ${missing.join(", ")} — see SETUP.md`,
    );
  }

  return {
    supabaseUrl: supabaseUrl!.replace(/\/+$/, ""),
    supabaseKey: supabaseKey!,
    appEnv: appEnv!,
  };
}
