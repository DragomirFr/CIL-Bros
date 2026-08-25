import { Link } from "@tanstack/react-router";
import { ExternalLink, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";

import logo from "@/assets/logo-transparent.png";
import { AdminButton } from "@/components/admin/admin-ui";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { COMPANY } from "@/data/site";
import { DASHBOARD_NAV, TEAM_NAV, visibleSections } from "@/lib/admin-access";
import { useAdminAuth } from "@/lib/admin-auth";
import { cn } from "@/lib/utils";

/**
 * Frame around every admin page: navigation on the left, the page on the right.
 *
 * The navigation only lists what the signed-in account is allowed to open, so
 * Igor's sidebar is shorter than Dragomir's. The Supabase policies enforce the
 * same thing — this is the polite version, not the security boundary.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
        <SidebarContent />
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-sidebar-border bg-sidebar px-4 py-3 text-sidebar-foreground lg:hidden">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger
              aria-label="Open admin menu"
              className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-primary"
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[17rem] border-sidebar-border bg-sidebar p-0 text-sidebar-foreground [&>button]:text-sidebar-foreground/70 [&>button]:hover:text-primary"
            >
              <SheetTitle className="sr-only">Admin menu</SheetTitle>
              <SidebarContent onNavigate={() => setMenuOpen(false)} />
            </SheetContent>
          </Sheet>

          <img
            src={logo}
            alt={COMPANY}
            width={1043}
            height={536}
            className="h-9 w-auto object-contain"
          />

          <SignOutButton compact />
        </header>

        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</div>
      </div>
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { profile, isOwner } = useAdminAuth();
  const sections = visibleSections(profile);

  const linkClass =
    "flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground";
  const activeClass = "bg-sidebar-accent text-primary";

  return (
    <>
      <div className="border-b border-sidebar-border px-5 py-5">
        <Link to="/" onClick={onNavigate} aria-label={`${COMPANY} home`}>
          <img
            src={logo}
            alt={COMPANY}
            width={1043}
            height={536}
            className="h-11 w-auto object-contain"
          />
        </Link>
        <p className="mt-3 text-[0.6rem] font-bold tracking-[0.24em] text-primary uppercase">
          Website admin
        </p>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <Link
          to={DASHBOARD_NAV.to}
          onClick={onNavigate}
          activeOptions={{ exact: true }}
          activeProps={{ className: cn(linkClass, activeClass) }}
          inactiveProps={{ className: linkClass }}
        >
          <DASHBOARD_NAV.icon className="h-4 w-4 shrink-0" />
          {DASHBOARD_NAV.label}
        </Link>

        <p className="mt-5 px-3 text-[0.6rem] font-bold tracking-[0.22em] text-sidebar-foreground/35 uppercase">
          Content
        </p>
        <div className="mt-2 space-y-1">
          {sections.map((section) => (
            <Link
              key={section.key}
              to={section.to}
              onClick={onNavigate}
              title={section.description}
              activeProps={{ className: cn(linkClass, activeClass) }}
              inactiveProps={{ className: linkClass }}
            >
              <section.icon className="h-4 w-4 shrink-0" />
              {section.label}
            </Link>
          ))}
          {sections.length === 0 ? (
            <p className="px-3 py-2 text-xs leading-relaxed text-sidebar-foreground/45">
              No sections have been shared with you yet.
            </p>
          ) : null}
        </div>

        {isOwner ? (
          <>
            <p className="mt-5 px-3 text-[0.6rem] font-bold tracking-[0.22em] text-sidebar-foreground/35 uppercase">
              Owner
            </p>
            <div className="mt-2 space-y-1">
              <Link
                to={TEAM_NAV.to}
                onClick={onNavigate}
                title={TEAM_NAV.description}
                activeProps={{ className: cn(linkClass, activeClass) }}
                inactiveProps={{ className: linkClass }}
              >
                <TEAM_NAV.icon className="h-4 w-4 shrink-0" />
                {TEAM_NAV.label}
              </Link>
            </div>
          </>
        ) : null}
      </nav>

      <div className="border-t border-sidebar-border px-3 py-4">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
          onClick={onNavigate}
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          View the website
        </a>

        <div className="mt-3 flex items-center justify-between gap-2 rounded-sm bg-sidebar-accent px-3 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">
              {profile?.username ?? "Signed in"}
            </p>
            <p className="text-[0.65rem] font-bold tracking-[0.16em] text-primary uppercase">
              {profile?.role === "owner" ? "Full access" : "Staff"}
            </p>
          </div>
          <SignOutButton />
        </div>
      </div>
    </>
  );
}

function SignOutButton({ compact = false }: { compact?: boolean }) {
  const { signOutNow } = useAdminAuth();
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      await signOutNow();
    } finally {
      setBusy(false);
    }
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => void run()}
        disabled={busy}
        aria-label="Sign out"
        className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-primary disabled:opacity-50"
      >
        <LogOut className="h-4 w-4" />
      </button>
    );
  }

  return (
    <AdminButton
      variant="ghost"
      size="sm"
      onClick={() => void run()}
      busy={busy}
      aria-label="Sign out"
      title="Sign out"
      className="text-sidebar-foreground/60 hover:bg-sidebar hover:text-primary"
    >
      <LogOut className="h-4 w-4" />
    </AdminButton>
  );
}
