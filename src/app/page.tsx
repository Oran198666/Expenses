// Temporary placeholder home page (Milestone 1). It shows the theme and
// whether the app can reach its Supabase project. Replaced in later milestones.
import { Suspense } from "react";
import { connection } from "next/server";
import { CircleAlert, CircleCheck, Loader, Plus, Rocket } from "lucide-react";
import { checkSupabase } from "@/lib/supabase/health";

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
        <p className="mt-4">
          Track your expenses across all your devices. Setup in progress.
        </p>
      </header>

      <section className="card mb-6 p-6">
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

      {/* Style preview of the shared form controls (not functional yet) */}
      <section className="card p-6">
        <h2 className="mb-4 text-neon-pink">Style Preview</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="preview-amount" className="label">
              Amount
            </label>
            <input
              id="preview-amount"
              className="input"
              placeholder="0.00"
              inputMode="decimal"
            />
          </div>
          <div>
            <label htmlFor="preview-description" className="label">
              Description
            </label>
            <input
              id="preview-description"
              className="input"
              placeholder="Description"
            />
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-4">
          <button type="button" className="btn-primary">
            <Plus aria-hidden size={18} />
            Add Expense
          </button>
          <button type="button" className="btn-secondary">
            Back
          </button>
        </div>
        <p className="mt-4 text-sm text-amber">
          Preview only — expenses arrive in a later milestone.
        </p>
      </section>
    </main>
  );
}
