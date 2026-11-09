// Turns Supabase auth cookies into browser-session cookies (no expiry), so the
// user is signed out when the browser closes (PRD: session-based auth, ADR-8).
type CookieOptions = {
  maxAge?: number;
  expires?: Date | number | string;
  [key: string]: unknown;
};

export function toSessionCookie<T extends CookieOptions | undefined>(
  options: T,
): T {
  if (!options) return options;
  // Keep deletions working: they use maxAge 0 or an expiry in the past.
  if (options.maxAge !== undefined && options.maxAge <= 0) return options;
  if (
    options.expires !== undefined &&
    new Date(options.expires).getTime() <= Date.now()
  ) {
    return options;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { maxAge, expires, ...rest } = options;
  return rest as T;
}
