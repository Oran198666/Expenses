// Temporary signed-in home page (Milestone 2). Shows who is signed in, the
// Supabase connection status, and account actions. Replaced by the real Home
// screen with the side menu in Milestone 3.
import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import {
  CircleAlert,
  CircleCheck,
  KeyRound,
  Loader,
  LogOut,
  Rocket,
} from "lucide-react";
import { logout } from "@/app/actions/auth";
import { checkSupabase } from "@/lib/supabase/health";
import { createClient } from "@/lib/supabase/server";

async function Welcome() {
  // Per-user data: always render at request time.
  await connection();
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  let username: string | null = null;
  if (userData.user) {
    // Reads the user's own profile row through Row Level Security.
    const { data } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", userData.user.id)
      .maybeSingle();
    username = data?.username ?? null;
  }

  return (
    <p className="mt-4 text-lg">
      Welcome{username ? ", " : ""}
      {username && <span className="text-white">{username}</span>}!
    </p>
  );
}

async function SupabaseStatus() {
  // Check at request time so the page always shows the live status.
  await connection();
  const status = await checkSupabase();

  return (
    <div className="space-y-2">
      <p
        className={`flex items-center gap-2 font-medium ${
          status.ok ? "text-cyan" : "text-amber"
        }`}
      >
        {status.ok ? (
          <CircleCheck aria-hidden size={20} className="shrink-0" />
        ) : (
          <CircleAlert aria-hidden size={20} className="shrink-0" />
        )}
        <span className="min-w-0 [overflow-wrap:anywhere]">
          {status.message}
        </span>
      </p>
      {status.project && (
        <p className="text-sm">
          Environment: <span className="text-white">{status.env}</span> ·
          Project: <span className="text-white">{status.project}</span>
        </p>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-16">
      <header className="mb-10 text-center">
        <Rocket aria-hidden className="mx-auto mb-4 text-neon-pink" size={40} />
        <h1 className="glow-text text-3xl sm:text-5xl">Expense Tracker</h1>
        <Suspense fallback={<p className="mt-4 text-lg">Welcome!</p>}>
          <Welcome />
        </Suspense>
        <p className="mt-2">Expense tracking arrives in the next milestone.</p>
      </header>

      <section className="card mb-6 p-6">
        <h2 className="mb-4 text-neon-pink">Account</h2>
        <div className="flex flex-wrap gap-4">
          <Link href="/change-password" className="btn-primary">
            <KeyRound aria-hidden size={18} />
            Change Password
          </Link>
          <form action={logout}>
            <button type="submit" className="btn-secondary">
              <LogOut aria-hidden size={18} />
              Log Out
            </button>
          </form>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="mb-4 text-neon-pink">System Status</h2>
        <Suspense
          fallback={
            <p className="flex items-center gap-2">
              <Loader aria-hidden size={20} className="animate-spin" />
              Checking connection…
            </p>
          }
        >
          <SupabaseStatus />
        </Suspense>
      </section>
    </main>
  );
}
