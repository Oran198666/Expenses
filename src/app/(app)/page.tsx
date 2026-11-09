// Home: add / edit expenses and browse the recent expenses table.
import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { Loader } from "lucide-react";
import { listCategories } from "@/app/actions/categories";
import { listExpenses } from "@/app/actions/expenses";
import { ExpenseManager } from "@/components/expenses/expense-manager";
import { PageHeading } from "@/components/ui/page-heading";

export const metadata: Metadata = { title: "Home · Expense Tracker" };

async function HomeData() {
  // Per-user data: always read fresh at request time.
  await connection();
  const [categories, expenses] = await Promise.all([
    listCategories(),
    listExpenses("date", "desc", 0),
  ]);
  return (
    <ExpenseManager
      initialCategories={categories.ok ? categories.categories : []}
      initialRows={expenses.ok ? expenses.rows : []}
      initialHasMore={expenses.ok ? expenses.hasMore : false}
      initialError={
        !categories.ok ? categories.error : !expenses.ok ? expenses.error : null
      }
    />
  );
}

export default function HomePage() {
  return (
    <>
      <PageHeading title="Home" subtitle="Record and manage your expenses." />
      <Suspense
        fallback={
          <p className="flex items-center gap-2">
            <Loader aria-hidden size={20} className="animate-spin" />
            Loading your expenses…
          </p>
        }
      >
        <HomeData />
      </Suspense>
    </>
  );
}
