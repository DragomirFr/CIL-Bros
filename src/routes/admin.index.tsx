import { createFileRoute } from "@tanstack/react-router";
import { KeyRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { SectionTile } from "@/components/admin/admin-guard";
import {
  AdminButton,
  AdminInput,
  AdminPanel,
  Field,
  Notice,
  PageHeader,
} from "@/components/admin/admin-ui";
import { formatWhen } from "@/components/admin/media-list-editor";
import {
  ADMIN_SECTIONS,
  TEAM_NAV,
  contentRowFor,
  type AdminSection,
  type ContentSectionId,
} from "@/lib/admin-access";
import { describeAuthError, useAdminAuth } from "@/lib/admin-auth";
import { useSiteSection } from "@/lib/site-content";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { profile, isOwner, can } = useAdminAuth();
  const allowed = ADMIN_SECTIONS.filter((section) => can(section.key));

  return (
    <div>
      <PageHeader
        eyebrow="Overview"
        title={profile?.username ? `Hi ${titleCase(profile.username)}` : "Website admin"}
        description={
          isOwner
            ? "Everything on the site that can be changed from here. Edits go live as soon as you save."
            : "The parts of the site you can change. Edits go live as soon as you save."
        }
      />

      <div className="mt-6 space-y-6">
        {allowed.length === 0 ? (
          <Notice tone="warning" title="Nothing shared with you yet">
            Dragomir decides which parts of the site each person can edit. Ask him to switch some
            sections on for you, then reload this page.
          </Notice>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {allowed.map((section) => {
              const contentRow = contentRowFor(section);

              return contentRow ? (
                <ContentTile key={section.key} section={section} contentRow={contentRow} />
              ) : (
                <SectionTile
                  key={section.key}
                  to={section.to}
                  label={section.label}
                  description={section.description}
                  icon={section.icon}
                />
              );
            })}

            {isOwner ? (
              <SectionTile
                to={TEAM_NAV.to}
                label={TEAM_NAV.label}
                description={TEAM_NAV.description}
                icon={TEAM_NAV.icon}
                meta="Owner only"
              />
            ) : null}
          </div>
        )}

        <AccountPanel />
      </div>
    </div>
  );
}

/** A tile for a section backed by a content row, so it can show a count. */
function ContentTile({
  section,
  contentRow,
}: {
  section: AdminSection;
  contentRow: ContentSectionId;
}) {
  const state = useSiteSection(contentRow);
  const count = state.items.length;

  const parts = [`${count} ${count === 1 ? "entry" : "entries"}`];
  if (state.updatedAt) parts.push(`saved ${formatWhen(state.updatedAt)}`);

  return (
    <SectionTile
      to={section.to}
      label={section.label}
      description={section.description}
      icon={section.icon}
      meta={state.loading ? "Loading…" : parts.join(" · ")}
    />
  );
}

/** Change your own password without going into the Supabase dashboard. */
function AccountPanel() {
  const { user, profile, changePassword } = useAdminAuth();
  const [open, setOpen] = useState(false);
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (next.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (next !== confirm) {
      setError("The two passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      await changePassword(next);
      toast.success("Password changed. Use the new one next time you sign in.");
      setNext("");
      setConfirm("");
      setOpen(false);
    } catch (cause) {
      setError(describeAuthError(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminPanel className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-sm uppercase">Your account</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {profile?.username ? titleCase(profile.username) : "Signed in"}
            {user?.email ? ` · ${user.email}` : ""}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {profile?.role === "owner"
              ? "Full access to every section, and to the team settings."
              : "Access to the sections Dragomir has shared with you."}
          </p>
        </div>
        <AdminButton size="sm" onClick={() => setOpen((value) => !value)}>
          <KeyRound className="h-3.5 w-3.5" />
          {open ? "Cancel" : "Change password"}
        </AdminButton>
      </div>

      {open ? (
        <form
          onSubmit={(event) => void submit(event)}
          className="mt-5 space-y-3 border-t border-border pt-5"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="New password" htmlFor="new-password">
              <AdminInput
                id="new-password"
                type="password"
                value={next}
                onChange={(event) => setNext(event.target.value)}
                autoComplete="new-password"
                required
              />
            </Field>
            <Field label="Type it again" htmlFor="confirm-password">
              <AdminInput
                id="confirm-password"
                type="password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                autoComplete="new-password"
                required
              />
            </Field>
          </div>

          {error ? <Notice tone="danger">{error}</Notice> : null}

          <div className="flex items-center gap-2">
            <AdminButton type="submit" variant="primary" size="sm" busy={busy}>
              Save password
            </AdminButton>
            <p className="text-xs text-muted-foreground">You stay signed in on this device.</p>
          </div>
        </form>
      ) : null}
    </AdminPanel>
  );
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
