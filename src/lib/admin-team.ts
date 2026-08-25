import {
  allPermissions,
  readPermissions,
  type AdminProfile,
  type AdminRole,
  type PermissionMap,
} from "@/lib/admin-access";
import {
  ADMIN_EMAIL_DOMAIN,
  errorCode,
  normaliseUsername,
  OWNER_USERNAMES,
  usernameToEmail,
} from "@/lib/admin-auth";
import { ADMINS_TABLE, createIsolatedClient, readRow, requireSupabase } from "@/lib/supabase";

/**
 * Managing the other admin accounts. Owner only — the row-level security in
 * `supabase/schema.sql` allows writes to `admins` from an owner account and
 * nothing else, so the switches on the Team page are a real restriction and not
 * a hidden menu.
 *
 * Rows are keyed by the username rather than the Supabase user id, which is what
 * lets the owner set someone's permissions before they have ever signed in.
 */
export interface AdminAccount extends AdminProfile {
  email: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  /** True when the row was written by hand and is missing fields. */
  incomplete: boolean;
}

export function subscribeAdmins(
  onChange: (accounts: AdminAccount[]) => void,
  onError: (message: string) => void,
): () => void {
  const client = requireSupabase();
  let live = true;

  const load = async () => {
    const { data, error } = await client.from(ADMINS_TABLE).select("*");
    if (!live) return;

    if (error) {
      onError(error.message);
      return;
    }

    const accounts = (Array.isArray(data) ? data : [])
      .map(readAccount)
      .filter((account): account is AdminAccount => account !== null);

    // Owner first, then alphabetical — the list is short enough to sort here.
    accounts.sort((a, b) => {
      if (a.role !== b.role) return a.role === "owner" ? -1 : 1;
      return a.username.localeCompare(b.username);
    });

    onChange(accounts);
  };

  void load();

  // Re-read the whole table on any change rather than patching the array by
  // hand: the list is a handful of rows, and a re-read cannot drift.
  const channel = client
    .channel("admin-team")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: ADMINS_TABLE },
      () => void load(),
    )
    .subscribe((status) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        onError(
          "The list loaded but will not update on its own — Supabase realtime is not reachable for the admins table. Check the “alter publication” line in supabase/schema.sql ran, then reload.",
        );
      }
    });

  return () => {
    live = false;
    void client.removeChannel(channel);
  };
}

function readAccount(value: unknown): AdminAccount | null {
  const row = readRow(value);
  if (!row) return null;

  const id = typeof row["id"] === "string" ? row["id"] : "";
  if (!id) return null;

  const role: AdminRole = row["role"] === "owner" ? "owner" : "staff";

  return {
    id,
    username:
      typeof row["username"] === "string" && row["username"] ? row["username"] : titleCase(id),
    role,
    permissions: role === "owner" ? allPermissions() : readPermissions(row["permissions"]),
    disabled: row["disabled"] === true,
    email:
      typeof row["email"] === "string" && row["email"]
        ? row["email"]
        : `${id}@${ADMIN_EMAIL_DOMAIN}`,
    createdAt: readDate(row["created_at"]),
    updatedAt: readDate(row["updated_at"]),
    incomplete: typeof row["role"] !== "string",
  };
}

/** Postgres timestamps arrive as ISO strings over the wire. */
function readDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function titleCase(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Creates the Supabase login *and* the permission profile in one go.
 *
 * The profile is written first, with the owner's own credentials, because that
 * is the half row-level security can refuse — better to find out before an
 * account exists. `signUp` then creates the login on a throwaway client that
 * stores no session, so the owner stays signed in as themselves; if it fails,
 * the profile is rolled back so the Team page does not show a person who cannot
 * sign in.
 */
export async function createAdminAccount(input: {
  username: string;
  password: string;
  permissions: PermissionMap;
}): Promise<{ id: string; email: string }> {
  const id = normaliseUsername(input.username);
  if (!id) throw new Error("Enter a username — letters and numbers only.");
  if (input.password.length < 8) throw new Error("Use a password of at least 8 characters.");

  const email = usernameToEmail(id);
  const client = requireSupabase();

  // insert, not upsert: an existing row means this is the wrong action, and a
  // rollback below must never be able to delete someone's real profile.
  const { error: profileError } = await client.from(ADMINS_TABLE).insert({
    id,
    username: titleCase(input.username.trim()) || titleCase(id),
    email,
    role: "staff",
    permissions: input.permissions,
    disabled: false,
  });

  if (profileError) throw profileError;

  try {
    const isolated = createIsolatedClient();
    const { error: signUpError } = await isolated.auth.signUp({ email, password: input.password });
    if (signUpError) throw signUpError;

    // Nothing was persisted, but drop the in-memory session anyway so the
    // throwaway client leaves with no credentials on it.
    await isolated.auth.signOut({ scope: "local" }).catch(() => undefined);
  } catch (cause) {
    await client.from(ADMINS_TABLE).delete().eq("id", id);
    throw cause;
  }

  return { id, email };
}

/**
 * Writes the profile without creating a login — for someone whose Supabase
 * account already exists, or to set up their access before they are given one.
 */
export async function inviteAdminProfile(input: {
  username: string;
  permissions: PermissionMap;
}): Promise<string> {
  const id = normaliseUsername(input.username);
  if (!id) throw new Error("Enter a username — letters and numbers only.");

  const { error } = await requireSupabase()
    .from(ADMINS_TABLE)
    // Columns left out of the payload keep whatever they already hold, so this
    // sets up access without wiping a row that is already there.
    .upsert(
      {
        id,
        username: titleCase(input.username.trim()) || titleCase(id),
        email: usernameToEmail(id),
        role: "staff",
        permissions: input.permissions,
        disabled: false,
      },
      { onConflict: "id" },
    );

  if (error) throw error;

  return id;
}

export async function saveAdminPermissions(id: string, permissions: PermissionMap): Promise<void> {
  const result = await requireSupabase()
    .from(ADMINS_TABLE)
    .update({ permissions })
    .eq("id", id)
    .select("id");

  expectOneRow(result);
}

export async function setAdminDisabled(id: string, disabled: boolean): Promise<void> {
  const result = await requireSupabase()
    .from(ADMINS_TABLE)
    .update({ disabled })
    .eq("id", id)
    .select("id");

  expectOneRow(result);
}

/**
 * Removes all access. The Supabase login itself survives — deleting that needs
 * the Supabase dashboard — but with no profile it can no longer open anything.
 */
export async function deleteAdminProfile(id: string): Promise<void> {
  if ((OWNER_USERNAMES as readonly string[]).includes(id)) {
    throw new Error("The owner account cannot be removed.");
  }

  const result = await requireSupabase().from(ADMINS_TABLE).delete().eq("id", id).select("id");

  expectOneRow(result);
}

/**
 * Insists a change to one row actually hit something.
 *
 * A row the policies hide is simply not matched, so an update or delete that
 * ought to have been refused comes back as a success with nothing changed.
 * Asking for the affected rows is what turns that into an error worth showing.
 */
function expectOneRow(result: { data: unknown; error: { message: string } | null }): void {
  if (result.error) throw result.error;

  if (!Array.isArray(result.data) || result.data.length === 0) {
    throw new Error(
      "Nothing was changed. Reload the page — either that person has been removed, or you are not signed in as the owner.",
    );
  }
}

/** Explains the Supabase error codes this page can produce. */
export function describeTeamError(error: unknown): string {
  switch (errorCode(error)) {
    case "user_already_exists":
    case "email_exists":
      return "There is already a login with that username. Leave the password empty and use “Set up access” instead.";
    case "weak_password":
      return "That password is too short — use at least eight characters.";
    case "email_address_invalid":
    case "validation_failed":
      return "That username cannot be turned into an email address. Use letters and numbers.";
    case "signup_disabled":
      return "Turn on “Allow new users to sign up” in Supabase → Authentication → Sign In / Providers first.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Too many accounts created in a row. Wait a minute and try again.";
    // 23505 — unique_violation.
    case "23505":
      return "There is already a profile with that username. Change their switches below instead.";
    // 42501 — insufficient_privilege, which is how row-level security refuses.
    case "42501":
      return "Supabase refused that change. Check you are signed in as the owner and that supabase/schema.sql has been run.";
    // PGRST116 — the request matched no rows.
    case "PGRST116":
      return "That profile no longer exists. Reload the page.";
    default:
      break;
  }

  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong. Try again.";
}
