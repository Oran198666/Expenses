// Placeholder until this screen is built in a later milestone.
import type { Metadata } from "next";
import { Hourglass } from "lucide-react";
import { PageHeading } from "@/components/ui/page-heading";

export const metadata: Metadata = { title: "Filters · Expense Tracker" };

export default function FiltersPage() {
  return (
    <>
      <PageHeading title="Filters" subtitle="Search, filter and save custom views of your expenses." />
      <section className="card flex items-center gap-3 p-6">
        <Hourglass aria-hidden size={22} className="shrink-0 text-amber" />
        <p>Coming in a later milestone.</p>
      </section>
    </>
  );
}
