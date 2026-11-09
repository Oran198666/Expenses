import type { Metadata } from "next";
import { ChangePasswordForm } from "./change-password-form";

export const metadata: Metadata = { title: "Change Password · Expense Tracker" };

// Signed-in only: the proxy sends signed-out visitors to /login,
// and the Server Action checks the user again.
export default function ChangePasswordPage() {
  return (
    <main className="flex w-full flex-1 items-center justify-center px-4 py-10">
      <ChangePasswordForm />
    </main>
  );
}
