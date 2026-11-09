// Usernames are mapped onto Supabase Auth's email field (see ADR-6).
// `.invalid` is a reserved top-level domain, so these can never be real mailboxes.

export const USERNAME_PATTERN = "[A-Za-z0-9._\\-]{3,30}";
const USERNAME_REGEX = /^[a-z0-9._-]{3,30}$/;
const INTERNAL_EMAIL_DOMAIN = "users.expenses.invalid";

export const USERNAME_RULE =
  "Use 3–30 letters, numbers, dots, dashes or underscores.";

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidUsername(username: string): boolean {
  return USERNAME_REGEX.test(username);
}

export function usernameToEmail(username: string): string {
  return `${username}@${INTERNAL_EMAIL_DOMAIN}`;
}
