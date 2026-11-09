// About: static information about the application and its developer, plus the
// architecture overview (ADR-19). Content is fixed; it isn't edited in the app.
import type { Metadata } from "next";
import Image from "next/image";
import { ArchitectureDiagram } from "@/components/about/architecture-diagram";
import { PageHeading } from "@/components/ui/page-heading";

export const metadata: Metadata = { title: "About · Expense Tracker" };

export default function AboutPage() {
  return (
    <>
      <PageHeading title="About" subtitle="About this application and its developer." />

      <section aria-label="Application and developer" className="card p-4 sm:p-6">
        <div className="grid gap-6 md:grid-cols-[14rem_minmax(0,1fr)] md:items-start">
          <figure className="mx-auto w-full max-w-56">
            <div className="about-photo">
              <Image
                src="/dev.jpg"
                alt="Photo of the developer"
                width={441}
                height={419}
                sizes="14rem"
                priority
                className="h-full w-full object-cover object-[30%_center]"
              />
            </div>
            <figcaption className="mt-2 text-center text-sm">Developer</figcaption>
          </figure>

          <div className="space-y-6">
            <div>
              <h2 className="mb-2 text-lg text-neon-pink sm:text-xl">Application Description</h2>
              <p className="leading-relaxed">
                Expense Tracker is a responsive website for recording, organizing, filtering,
                analyzing, and exporting your personal expenses. One account works on your phone,
                tablet, and computer, and your data is stored centrally so it&apos;s the same
                everywhere. Add expenses with a category, currency, and date; manage your own
                categories; find expenses with built-in filters or your own saved filters; see
                spending by category, year, and month — one currency at a time, never mixed; and
                download your records as CSV or PDF.
              </p>
            </div>
            <div>
              <h2 className="mb-2 text-lg text-neon-pink sm:text-xl">About the Developer</h2>
              <p className="leading-relaxed">
                Senior QA Engineer with over 11 years of experience in backend systems and data
                validation. Currently expanding into full-stack development through this course,
                building on prior training in JavaScript, HTML, and CSS at John Bryce. Experienced
                with Python, REST APIs, SQL, and working across development and product teams —
                this project brought together Next.js (React), TypeScript, Node.js, Tailwind CSS,
                Supabase (PostgreSQL and authentication), and deployment on Vercel.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="architecture-title" className="card mt-6 p-4 sm:p-6">
        <h2 id="architecture-title" className="mb-6 text-lg text-neon-pink sm:text-xl">
          System Architecture
        </h2>
        <ArchitectureDiagram />
      </section>
    </>
  );
}
