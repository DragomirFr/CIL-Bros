import { Link } from "@tanstack/react-router";
import { ArrowRight, Lock } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Notice, PageHeader } from "@/components/admin/admin-ui";
import type { AdminSection, PermissionKey } from "@/lib/admin-access";
import { useAdminAuth } from "@/lib/admin-auth";
import { cn } from "@/lib/utils";

/**
 * Guards a single admin page.
 *
 * Sections the account cannot open are already missing from the sidebar; this
 * catches someone typing the URL, and explains why rather than 404ing.
 */
export function RequirePermission({
  permission,
  label,
  children,
}: {
  permission: PermissionKey;
  label: string;
  children: React.ReactNode;
}) {
  const { can, profile } = useAdminAuth();

  if (can(permission)) return <>{children}</>;

  return (
    <div>
      <PageHeader eyebrow="No access" title={label} />
      <div className="mt-6 space-y-4">
        <Notice tone="warning" title="This section has not been shared with you">
          {profile?.username ? `${profile.username}, ` : ""}Dragomir controls who can edit each part
          of the site. Ask him to switch this one on for you.
        </Notice>
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.12em] text-primary uppercase hover:underline"
        >
          Back to the overview
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

/** Owner-only pages — currently just Team. */
export function RequireOwner({ label, children }: { label: string; children: React.ReactNode }) {
  const { isOwner } = useAdminAuth();

  if (isOwner) return <>{children}</>;

  return (
    <div>
      <PageHeader eyebrow="Owner only" title={label} />
      <div className="mt-6 space-y-4">
        <Notice tone="warning" title="Only Dragomir can open this">
          Account settings and permissions are limited to the site owner.
        </Notice>
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.12em] text-primary uppercase hover:underline"
        >
          Back to the overview
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

/** Shared card body for the dashboard tiles. */
export function SectionTile({
  to,
  label,
  description,
  icon: Icon,
  meta,
  locked = false,
}: {
  to: AdminSection["to"] | "/admin/team";
  label: string;
  description: string;
  icon: LucideIcon;
  meta?: string;
  locked?: boolean;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-sm bg-primary/10 text-primary">
          {locked ? <Lock className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
        </span>
        {!locked ? (
          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
        ) : null}
      </div>
      <p className="mt-4 font-display text-base uppercase">{label}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
      {meta ? (
        <p className="mt-3 text-[0.7rem] font-bold tracking-[0.12em] text-primary uppercase">
          {meta}
        </p>
      ) : null}
    </>
  );

  const className = cn(
    "group block h-full rounded-sm border border-border bg-card p-5 transition-colors",
    locked ? "opacity-60" : "hover:border-primary/50",
  );

  if (locked) return <div className={className}>{body}</div>;

  return (
    <Link to={to} className={className}>
      {body}
    </Link>
  );
}
