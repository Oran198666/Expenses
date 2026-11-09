"use client";
// Persistent side menu for the signed-in screens. On phones it collapses into
// a top bar with a button that opens the same menu as a drawer.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  ChartPie,
  Filter,
  House,
  Info,
  KeyRound,
  LogOut,
  Menu,
  Rocket,
  Tags,
  X,
} from "lucide-react";
import { logout } from "@/app/actions/auth";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: House },
  { href: "/filters", label: "Filters", icon: Filter },
  { href: "/categories", label: "Categories", icon: Tags },
  { href: "/reports", label: "Reports", icon: ChartPie },
  { href: "/about", label: "About", icon: Info },
] as const;

function MenuContents({
  pathname,
  user,
  isDev,
  onNavigate,
}: {
  pathname: string;
  user: ReactNode;
  isDev: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <nav aria-label="Main" className="flex-1">
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="nav-link"
                aria-current={pathname === href ? "page" : undefined}
                onClick={onNavigate}
              >
                <Icon aria-hidden size={20} className="shrink-0 text-cyan" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-6 space-y-1 border-t border-violet pt-4">
        <div className="px-3.5 pb-2 text-sm">{user}</div>
        <Link
          href="/change-password"
          className="nav-link"
          onClick={onNavigate}
        >
          <KeyRound aria-hidden size={20} className="shrink-0 text-cyan" />
          Change Password
        </Link>
        <form action={logout}>
          <button type="submit" className="nav-link w-full">
            <LogOut aria-hidden size={20} className="shrink-0 text-neon-pink" />
            Log Out
          </button>
        </form>
        {isDev && (
          <p className="px-3.5 pt-2">
            <span className="tag border-amber text-amber">Development</span>
          </p>
        )}
      </div>
    </div>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <Rocket aria-hidden size={24} className="text-neon-pink" />
      <span className="glow-text font-display text-lg font-bold uppercase tracking-wider">
        Expenses
      </span>
    </Link>
  );
}

export function SideMenu({ user, isDev }: { user: ReactNode; isDev: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the drawer with the Escape key.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {/* Desktop / tablet: fixed side menu */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-violet bg-panel/80 p-4 md:flex">
        <div className="mb-8 px-2 pt-2">
          <Brand />
        </div>
        <MenuContents pathname={pathname} user={user} isDev={isDev} />
      </aside>

      {/* Phone: top bar + drawer */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-violet bg-cosmic/95 px-4 py-3 md:hidden">
        <Brand />
        <button
          type="button"
          className="btn-sm"
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen(true)}
        >
          <Menu aria-hidden size={20} />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-cosmic/80"
            onClick={() => setOpen(false)}
          />
          <div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-neon-pink bg-panel p-4 shadow-[0_0_24px_#ff66ff55]"
          >
            <div className="mb-6 flex items-center justify-between px-2 pt-1">
              <Brand />
              <button
                type="button"
                className="btn-sm"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
              >
                <X aria-hidden size={20} />
              </button>
            </div>
            <MenuContents
              pathname={pathname}
              user={user}
              isDev={isDev}
              onNavigate={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
