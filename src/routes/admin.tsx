import { createFileRoute, Outlet } from "@tanstack/react-router";

import { AdminLoginScreen } from "@/components/admin/admin-login";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminButton, CenteredSpinner, Notice } from "@/components/admin/admin-ui";
import { Toaster } from "@/components/ui/sonner";
import { AdminAuthProvider, useAdminAuth } from "@/lib/admin-auth";

/**
 * Everything under /admin.
 *
 * This layout owns the session: until Supabase confirms who is signed in, no
 * child page renders. `noindex` keeps the admin out of search results, and
 * `robots.txt` disallows the path as well.
 */
export const Route = createFileRoute("/admin")({
  component: AdminLayout,
  head: () => ({
    meta: [
      { title: "Website admin | CIL Bros Construction" },
      { name: "robots", content: "noindex, nofollow, noarchive" },
    ],
  }),
});

function AdminLayout() {
  return (
    <AdminAuthProvider>
      <AdminGate />
      <Toaster position="top-center" />
    </AdminAuthProvider>
  );
}

function AdminGate() {
  const { status } = useAdminAuth();

  if (status === "loading") return <CenteredSpinner label="Checking your access…" />;

  // Signing in is the whole page when there is no session, whichever /admin
  // URL was asked for. After signing in, that URL renders as normal.
  if (status === "signed-out" || status === "unconfigured") return <AdminLoginScreen />;
  if (status === "no-access") return <NoAccessScreen />;

  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}

/** Signed in to Supabase, but not set up as an admin — or switched off. */
function NoAccessScreen() {
  const { accessMessage, signOutNow, user } = useAdminAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-5 py-16 text-secondary-foreground">
      <div className="w-full max-w-md text-center">
        <p className="text-[0.65rem] font-bold tracking-[0.28em] text-primary uppercase">
          No access
        </p>
        <h1 className="mt-3 font-display text-2xl uppercase">Not set up yet</h1>
        <Notice
          tone="warning"
          className="mt-6 border-primary/40 bg-primary/10 text-left text-secondary-foreground"
        >
          {accessMessage ?? "This account cannot open the admin area."}
        </Notice>
        {user?.email ? (
          <p className="mt-4 text-xs text-secondary-foreground/50">Signed in as {user.email}</p>
        ) : null}
        <div className="mt-6 flex justify-center gap-2">
          <AdminButton variant="primary" onClick={() => void signOutNow()}>
            Sign out
          </AdminButton>
          <a
            href="/"
            className="inline-flex items-center rounded-sm border border-secondary-foreground/25 px-4 py-2.5 text-xs font-bold tracking-[0.12em] text-secondary-foreground/70 uppercase transition-colors hover:border-primary hover:text-primary"
          >
            Back to the site
          </a>
        </div>
      </div>
    </div>
  );
}
