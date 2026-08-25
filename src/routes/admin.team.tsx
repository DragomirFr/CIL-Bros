import { createFileRoute } from "@tanstack/react-router";
import { Eye, EyeOff, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { RequireOwner } from "@/components/admin/admin-guard";
import {
  AdminButton,
  AdminInput,
  AdminPanel,
  Field,
  Notice,
  PageHeader,
  Spinner,
} from "@/components/admin/admin-ui";
import { Switch } from "@/components/ui/switch";
import {
  ADMIN_SECTIONS,
  defaultStaffPermissions,
  type PermissionKey,
  type PermissionMap,
} from "@/lib/admin-access";
import { ADMIN_EMAIL_DOMAIN, normaliseUsername, useAdminAuth } from "@/lib/admin-auth";
import {
  createAdminAccount,
  deleteAdminProfile,
  describeTeamError,
  inviteAdminProfile,
  saveAdminPermissions,
  setAdminDisabled,
  subscribeAdmins,
  type AdminAccount,
} from "@/lib/admin-team";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/team")({
  component: TeamAdmin,
});

function TeamAdmin() {
  return (
    <RequireOwner label="Team">
      <TeamPage />
    </RequireOwner>
  );
}

/**
 * Where the owner decides who gets in and what they can touch.
 *
 * Every switch here writes straight to the person's row in `admins`, and the
 * admin area follows that row live — so turning something off removes it
 * from their sidebar while they are still looking at it.
 */
function TeamPage() {
  const { profile } = useAdminAuth();
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return subscribeAdmins(
      (next) => {
        setAccounts(next);
        setError(null);
        setLoading(false);
      },
      (message) => {
        setError(message);
        setLoading(false);
      },
    );
  }, []);

  const staff = accounts.filter((account) => account.role !== "owner");

  return (
    <div>
      <PageHeader
        eyebrow="Owner only"
        title="Team"
        description="Add the people who help run the website, and choose which parts each of them can change."
      />

      <div className="mt-6 space-y-4">
        {error ? (
          <Notice tone="danger" title="Could not load the team">
            {error}
          </Notice>
        ) : null}

        <Notice tone="info" title="How access works">
          Everyone signs in with a username and password. A switch that is off means the section is
          not in their sidebar and Supabase refuses their edits to it, so it is a real restriction
          rather than a hidden menu.
        </Notice>

        <AddAccountForm existing={accounts.map((account) => account.id)} />

        {loading ? <Spinner label="Loading the team…" /> : null}

        {accounts.map((account) => (
          <AccountCard key={account.id} account={account} isSelf={account.id === profile?.id} />
        ))}

        {!loading && staff.length === 0 ? (
          <Notice tone="info">
            Only your own account exists so far. Add one above for Igor and pick what he can see.
          </Notice>
        ) : null}
      </div>
    </div>
  );
}

function AddAccountForm({ existing }: { existing: string[] }) {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [permissions, setPermissions] = useState<PermissionMap>(() => defaultStaffPermissions());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const id = normaliseUsername(username);
  const taken = id.length > 0 && existing.includes(id);
  const withLogin = password.length > 0;

  function reset() {
    setUsername("");
    setPassword("");
    setPermissions(defaultStaffPermissions());
    setError(null);
    setShowPassword(false);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!id) {
      setError("Enter a username — letters and numbers only.");
      return;
    }
    if (taken) {
      setError("Someone with that username is already on the list below.");
      return;
    }

    setBusy(true);
    try {
      if (withLogin) {
        const created = await createAdminAccount({ username, password, permissions });
        toast.success(`${username} can now sign in as ${created.email}.`);
      } else {
        await inviteAdminProfile({ username, permissions });
        toast.success(`Access set up for ${username}. They still need a Supabase login.`);
      }

      reset();
      setOpen(false);
    } catch (cause) {
      setError(describeTeamError(cause));
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <AdminButton variant="primary" onClick={() => setOpen(true)}>
        <UserPlus className="h-3.5 w-3.5" />
        Add someone
      </AdminButton>
    );
  }

  return (
    <AdminPanel className="p-5">
      <form onSubmit={(event) => void submit(event)} className="space-y-4">
        <div>
          <p className="font-display text-sm uppercase">Add someone</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick a username and a password, and hand both to them.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Username"
            htmlFor="new-username"
            helper={
              id ? `They sign in as ${id}@${ADMIN_EMAIL_DOMAIN}` : "Letters and numbers, no spaces."
            }
          >
            <AdminInput
              id="new-username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Igor"
              autoCapitalize="none"
              spellCheck={false}
              className={taken ? "border-destructive" : undefined}
            />
          </Field>

          <Field
            label="Password"
            htmlFor="new-password"
            helper="At least 8 characters. Leave empty if they already have a Supabase login."
          >
            <div className="relative">
              <AdminInput
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                placeholder="••••••••"
                className="pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute top-1/2 right-2 inline-flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-primary"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
        </div>

        <div>
          <p className="text-[0.65rem] font-bold tracking-[0.18em] text-muted-foreground uppercase">
            What they can change
          </p>
          <div className="mt-3 space-y-3">
            {ADMIN_SECTIONS.map((section) => (
              <PermissionToggle
                key={section.key}
                id={`new-${section.key}`}
                label={section.label}
                description={section.description}
                checked={permissions[section.key]}
                onChange={(next) =>
                  setPermissions((current) => ({ ...current, [section.key]: next }))
                }
              />
            ))}
          </div>
        </div>

        {taken ? (
          <Notice tone="warning">
            That username already has a profile below. Change their switches there instead.
          </Notice>
        ) : null}

        {error ? <Notice tone="danger">{error}</Notice> : null}

        <div className="flex flex-wrap items-center gap-2">
          <AdminButton type="submit" variant="primary" busy={busy} disabled={taken}>
            {withLogin ? "Create the account" : "Set up access"}
          </AdminButton>
          <AdminButton
            variant="ghost"
            onClick={() => {
              reset();
              setOpen(false);
            }}
            disabled={busy}
          >
            Cancel
          </AdminButton>
        </div>
      </form>
    </AdminPanel>
  );
}

function AccountCard({ account, isSelf }: { account: AdminAccount; isSelf: boolean }) {
  const owner = account.role === "owner";
  const [busyKey, setBusyKey] = useState<string | null>(null);

  async function toggle(key: PermissionKey, next: boolean) {
    setBusyKey(key);
    try {
      await saveAdminPermissions(account.id, { ...account.permissions, [key]: next });
    } catch (cause) {
      toast.error(describeTeamError(cause));
    } finally {
      setBusyKey(null);
    }
  }

  async function toggleDisabled() {
    setBusyKey("disabled");
    try {
      await setAdminDisabled(account.id, !account.disabled);
      toast.success(
        account.disabled
          ? `${account.username} can sign in again.`
          : `${account.username} is locked out.`,
      );
    } catch (cause) {
      toast.error(describeTeamError(cause));
    } finally {
      setBusyKey(null);
    }
  }

  async function removeAccount() {
    const confirmed = window.confirm(
      `Remove ${account.username}? They lose access immediately. Their Supabase login stays until you delete it in the Supabase dashboard.`,
    );
    if (!confirmed) return;

    setBusyKey("delete");
    try {
      await deleteAdminProfile(account.id);
      toast.success(`${account.username} removed.`);
    } catch (cause) {
      toast.error(describeTeamError(cause));
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <AdminPanel className={cn("p-5", account.disabled && "border-dashed opacity-75")}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
        <div className="min-w-0">
          <p className="font-display text-base uppercase">
            {account.username}
            {isSelf ? <span className="ml-2 text-xs text-muted-foreground">(you)</span> : null}
          </p>
          <p className="mt-1 truncate text-sm text-muted-foreground">{account.email}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-sm px-2 py-1 text-[0.65rem] font-bold tracking-[0.14em] uppercase",
                owner ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
              )}
            >
              {owner ? <ShieldCheck className="h-3 w-3" /> : null}
              {owner ? "Full access" : "Staff"}
            </span>
            {account.disabled ? (
              <span className="rounded-sm bg-destructive/15 px-2 py-1 text-[0.65rem] font-bold tracking-[0.14em] text-destructive uppercase">
                Access off
              </span>
            ) : null}
          </div>
        </div>

        {!owner ? (
          <div className="flex items-center gap-2">
            <AdminButton
              size="sm"
              onClick={() => void toggleDisabled()}
              busy={busyKey === "disabled"}
            >
              {account.disabled ? "Switch access on" : "Switch access off"}
            </AdminButton>
            <AdminButton
              size="sm"
              variant="danger"
              onClick={() => void removeAccount()}
              busy={busyKey === "delete"}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </AdminButton>
          </div>
        ) : null}
      </div>

      {owner ? (
        <p className="mt-4 text-sm text-muted-foreground">
          The owner account can change everything, including this page. That cannot be switched off.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {ADMIN_SECTIONS.map((section) => (
            <PermissionToggle
              key={section.key}
              id={`${account.id}-${section.key}`}
              label={section.label}
              description={section.description}
              checked={account.permissions[section.key]}
              busy={busyKey === section.key}
              disabled={account.disabled}
              onChange={(next) => void toggle(section.key, next)}
            />
          ))}

          {account.disabled ? (
            <p className="text-xs text-muted-foreground">
              Access is off, so none of these apply until you switch it back on.
            </p>
          ) : null}
        </div>
      )}
    </AdminPanel>
  );
}

function PermissionToggle({
  id,
  label,
  description,
  checked,
  onChange,
  busy = false,
  disabled = false,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  busy?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <label htmlFor={id} className="cursor-pointer text-sm font-semibold text-foreground">
          {label}
        </label>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <Switch
        id={id}
        checked={checked}
        disabled={busy || disabled}
        onCheckedChange={onChange}
        className="mt-0.5 shrink-0 data-[state=checked]:bg-primary"
      />
    </div>
  );
}
