// Placeholder until this screen is built in a later milestone.
import type { Metadata } from "next";
import { Hourglass } from "lucide-react";
import { PageHeading } from "@/components/ui/page-heading";

export const metadata: Metadata = { title: "About · Expense Tracker" };

export default function AboutPage() {
  return (
    <>
      <PageHeading title="About" subtitle="About this application and its developer." />
      <section className="card flex items-center gap-3 p-6">
        <Hourglass aria-hidden size={22} className="shrink-0 text-amber" />
        <p>Coming in a later milestone.</p>
      </section>
    </>
  );
}
