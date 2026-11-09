// Fixed list of security questions offered at registration (approved by the user).
export const SECURITY_QUESTIONS = [
  "What was the name of your first pet?",
  "In what city were you born?",
  "What is your mother's maiden name?",
  "What was the name of your first school?",
  "What was the name of your favorite childhood friend?",
] as const;

export function isSecurityQuestion(value: string): boolean {
  return (SECURITY_QUESTIONS as readonly string[]).includes(value);
}

// Supabase's default minimum password length; no stricter rule is specified.
export const MIN_PASSWORD_LENGTH = 6;
