// Reports: charts for one currency at a time, plus CSV / PDF export.
import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { CircleAlert, Loader } from "lucide-react";
import { getReport, getReportSetup } from "@/app/actions/reports";
import { ReportManager } from "@/components/reports/report-manager";
import { PageHeading } from "@/components/ui/page-heading";
import { utcToday } from "@/lib/dates";

export const metadata: Metadata = { title: "Reports · Expense Tracker" };

async function ReportsData() {
  // Per-user data: always read fresh at request time.
  await connection();
  const setup = await getReportSetup();
  if (!setup) {
    return (
      <p role="alert" className="form-error flex items-start gap-2">
        <CircleAlert aria-hidden size={18} className="mt-0.5 shrink-0" />
        Something went wrong. Please reload the page to try again.
      </p>
    );
  }
  const report = await getReport({ currency: setup.defaultCurrency });
  return (
    <ReportManager
      setup={setup}
      initialReport={report.ok ? report.report : null}
      initialError={report.ok ? null : report.error}
      serverToday={utcToday()}
    />
  );
}

export default function ReportsPage() {
  return (
    <>
      <PageHeading title="Reports" subtitle="Charts and exports of your spending, one currency at a time." />
      <Suspense
        fallback={
          <p className="flex items-center gap-2">
            <Loader aria-hidden size={20} className="animate-spin" />
            Loading your reports…
          </p>
        }
      >
        <ReportsData />
      </Suspense>
    </>
  );
}
