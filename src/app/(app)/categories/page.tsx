// Categories: add, rename and delete categories; view each one's expenses.
import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { Loader } from "lucide-react";
import { listCategories } from "@/app/actions/categories";
import { CategoryManager } from "@/components/categories/category-manager";
import { PageHeading } from "@/components/ui/page-heading";

export const metadata: Metadata = { title: "Categories · Expense Tracker" };

async function CategoriesData() {
  // Per-user data: always read fresh at request time.
  await connection();
  const result = await listCategories();
  return (
    <CategoryManager
      initialCategories={result.ok ? result.categories : []}
      initialError={result.ok ? null : result.error}
    />
  );
}

export default function CategoriesPage() {
  return (
    <>
      <PageHeading
        title="Categories"
        subtitle="Add, rename or delete the categories you use for expenses."
      />
      <Suspense
        fallback={
          <p className="flex items-center gap-2">
            <Loader aria-hidden size={20} className="animate-spin" />
            Loading your categories…
          </p>
        }
      >
        <CategoriesData />
      </Suspense>
    </>
  );
}
