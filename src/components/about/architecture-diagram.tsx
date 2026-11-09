// Static architecture overview for the About page (ADR-19): the database
// schema and the hosting infrastructure, drawn as neon boxes and arrows.
import { ArrowDown, ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

function Box({ children, tone }: { children: ReactNode; tone: "cyan" | "pink" }) {
  return <div className={`diagram-box diagram-box-${tone}`}>{children}</div>;
}

/** Arrow that points down on phones and right from the `sm` size up. */
function FlowArrow() {
  return (
    <span aria-hidden className="diagram-arrow">
      <ArrowDown size={22} className="sm:hidden" />
      <ArrowRight size={22} className="hidden sm:block" />
    </span>
  );
}

function DownArrow() {
  return (
    <span aria-hidden className="diagram-arrow">
      <ArrowDown size={22} />
    </span>
  );
}

export function ArchitectureDiagram() {
  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,3fr)_auto_minmax(0,2fr)]">
      <figure className="min-w-0">
        <h3 className="diagram-title">Database Schema</h3>
        <ol
          className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center"
          aria-label="Auth User, then Expense, then Saved Filter"
        >
          <li className="sm:flex-1">
            <Box tone="cyan">Auth User</Box>
          </li>
          <li className="flex justify-center">
            <FlowArrow />
          </li>
          <li className="sm:flex-[1.4]">
            <Box tone="pink">
              Expense
              <span className="block text-sm font-normal text-silver">
                (Category, Amount, Date, Currency)
              </span>
            </Box>
          </li>
          <li className="flex justify-center">
            <FlowArrow />
          </li>
          <li className="sm:flex-1">
            <Box tone="cyan">Saved Filter</Box>
          </li>
        </ol>
        <figcaption className="mt-4 text-sm">
          Each user&apos;s expenses (with their categories) and saved filters belong to their own
          account.
        </figcaption>
      </figure>

      <div aria-hidden className="diagram-divider" />

      <figure className="min-w-0">
        <h3 className="diagram-title">Architecture Diagram</h3>
        <ol
          className="mx-auto flex max-w-xs flex-col items-stretch gap-2"
          aria-label="Centralized Supabase Data Store, then Vercel Backend"
        >
          <li>
            <Box tone="pink">Centralized Supabase Data Store</Box>
          </li>
          <li className="flex justify-center">
            <DownArrow />
          </li>
          <li>
            <Box tone="cyan">Vercel Backend</Box>
          </li>
        </ol>
        <figcaption className="mt-4 text-sm">
          The website runs on Vercel and keeps all data in Supabase, so it&apos;s the same on every
          device.
        </figcaption>
      </figure>
    </div>
  );
}
