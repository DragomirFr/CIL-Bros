import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { AdminButton, AdminPanel, PageHeader } from "@/components/admin/admin-ui";
import { useAdminAuth } from "@/lib/admin-auth";

/**
 * A memorable address to send people to.
 *
 * Signed out, the /admin gate shows the sign-in screen over the top of this, so
 * this component is only ever seen by someone who is already in.
 */
export const Route = createFileRoute("/admin/login")({
  component: LoginRoute,
});

function LoginRoute() {
  const { profile, user, signOutNow } = useAdminAuth();

  return (
    <div>
      <PageHeader
        eyebrow="Sign in"
        title="You are already signed in"
        description="Nothing to do here — head to the overview to start editing."
      />

      <AdminPanel className="mt-6 p-5">
        <p className="text-sm text-muted-foreground">
          Signed in as{" "}
          <strong className="text-foreground">{profile?.username ?? "an admin"}</strong>
          {user?.email ? ` (${user.email})` : ""}.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2.5 text-xs font-bold tracking-[0.12em] text-primary-foreground uppercase transition-colors hover:bg-primary/85"
          >
            Go to the overview
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <AdminButton onClick={() => void signOutNow()}>Sign in as someone else</AdminButton>
        </div>
      </AdminPanel>
    </div>
  );
}
