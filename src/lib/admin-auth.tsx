import type { User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  allPermissions,
  canEdit,
  readPermissions,
  type AdminProfile,
  type PermissionKey,
} from "@/lib/admin-access";
import {
  ADMINS_TABLE,
  isSupabaseConfigured,
  readRow,
  rememberSession,
  requireSupabase,
} from "@/lib/supabase";

/**
 * Usernames that are allowed to be the owner.
 *
 * This list only decides what the browser offers to do. The database decides
 * whether it is allowed: `supabase/schema.sql` seeds the owner row and its
 * policies stop anyone promoting themselves.
 */
export const OWNER_USERNAMES = ["dragomir"] as const;

/**
 * Admins sign in with a username, but Supabase Auth works in emails, so
 * "Igor" becomes "igor@cilbrosconstruction.com". Anything containing an "@" is
 * treated as an email already, so a full address works too.
 */
export const ADMIN_EMAIL_DOMAIN =
  import.meta.env.VITE_ADMIN_EMAIL_DOMAIN ?? "cilbrosconstruction.com";

export function usernameToEmail(identifier: string): string {
  const trimmed = identifier.trim();
  if (trimmed.includes("@")) return trimmed.toLowerCase();
  return `${normaliseUsername(trimmed)}@${ADMIN_EMAIL_DOMAIN}`;
}

/**
 * Lowercased, everything but letters and numbers stripped. Also the `admins.id`
 * of the row — `caller_id()` in `supabase/schema.sql` does the same thing in
 * SQL, which is what ties a login to its permissions.
 */
export function normaliseUsername(username: string): string {
  return username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/** "dragomir@example.com" -> "dragomir". */
export function usernameFromEmail(email: string | null): string {
  if (!email) return "";
  const [local] = email.split("@");
  return normaliseUsername(local ?? "");
}

function titleCase(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export type AuthStatus =
  /** Waiting on Supabase to say whether there is a session. */
  | "loading"
  /** No `VITE_SUPABASE_*` values, so there is nothing to sign in to. */
  | "unconfigured"
  | "signed-out"
  /** Signed in, but the account has no admin row or has been switched off. */
  | "no-access"
  | "ready";

interface AdminAuthValue {
  status: AuthStatus;
  user: User | null;
  profile: AdminProfile | null;
  /** Explains a "no-access" status in words the person can act on. */
  accessMessage: string | null;
  isOwner: boolean;
  can: (key: PermissionKey) => boolean;
  signIn: (identifier: string, password: string, remember: boolean) => Promise<void>;
  signOutNow: () => Promise<void>;
  changePassword: (next: string) => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(
    isSupabaseConfigured ? "loading" : "unconfigured",
  );
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [accessMessage, setAccessMessage] = useState<string | null>(null);

  // Watch the session. Runs in the browser only — the server render always
  // shows the loading state, which is what the client starts with too, so
  // hydration matches.
  //
  // The callback stays synchronous on purpose: awaiting another Supabase call
  // inside it can deadlock the auth lock. Reading the profile is a separate
  // effect below.
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    // `onAuthStateChange` fires an INITIAL_SESSION event as soon as it has
    // looked in storage, so there is no separate first read to do.
    const { data } = requireSupabase().auth.onAuthStateChange((_event, session) => {
      const next = session?.user ?? null;
      setUser(next);

      if (!next) {
        setProfile(null);
        setAccessMessage(null);
        setStatus("signed-out");
      } else {
        setStatus((current) => (current === "ready" ? current : "loading"));
      }
    });

    return () => data.subscription.unsubscribe();
  }, []);

  // Keyed on the email rather than the user object: a token refresh hands back a
  // new object for the same person, and that should not refetch anything.
  const accountEmail = user?.email ?? null;

  // Follow the row rather than reading it once, so that when the owner changes
  // what this account can see it takes effect in the open tab.
  useEffect(() => {
    if (!accountEmail) return;

    const client = requireSupabase();
    const id = usernameFromEmail(accountEmail);

    if (!id) {
      setProfile(null);
      setAccessMessage(
        "That account has no username, so it cannot be matched to an admin profile.",
      );
      setStatus("no-access");
      return;
    }

    let live = true;

    const load = async () => {
      const { data, error } = await client
        .from(ADMINS_TABLE)
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (!live) return;

      if (error) {
        setProfile(null);
        setAccessMessage(
          `Could not read your admin profile: ${error.message}. Check that supabase/schema.sql has been run.`,
        );
        setStatus("no-access");
        return;
      }

      const row = readRow(data);

      if (!row) {
        setProfile(null);
        setAccessMessage(
          (OWNER_USERNAMES as readonly string[]).includes(id)
            ? `The admins table has no row for "${id}". Run supabase/schema.sql in the Supabase SQL editor — it creates the owner row.`
            : "This account is not set up as an admin yet. Ask Dragomir to add you on the Team page.",
        );
        setStatus("no-access");
        return;
      }

      const role = row["role"] === "owner" ? "owner" : "staff";
      const next: AdminProfile = {
        id,
        username:
          typeof row["username"] === "string" && row["username"] ? row["username"] : titleCase(id),
        role,
        permissions: role === "owner" ? allPermissions() : readPermissions(row["permissions"]),
        disabled: row["disabled"] === true,
      };

      setProfile(next);

      if (next.disabled) {
        setAccessMessage("Your access has been turned off. Ask Dragomir to switch it back on.");
        setStatus("no-access");
        return;
      }

      setAccessMessage(null);
      setStatus("ready");
    };

    void load();

    const channel = client
      .channel(`admin-profile-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: ADMINS_TABLE, filter: `id=eq.${id}` },
        () => void load(),
      )
      .subscribe();

    return () => {
      live = false;
      void client.removeChannel(channel);
    };
  }, [accountEmail]);

  const signIn = useCallback(async (identifier: string, password: string, remember: boolean) => {
    const client = requireSupabase();

    // Decide where the session is kept before signing in, so it is written to
    // the right place first time.
    rememberSession(remember);

    const { error } = await client.auth.signInWithPassword({
      email: usernameToEmail(identifier),
      password,
    });

    if (error) throw error;
  }, []);

  const signOutNow = useCallback(async () => {
    const { error } = await requireSupabase().auth.signOut();
    if (error) throw error;
  }, []);

  const changePassword = useCallback(async (next: string) => {
    const { error } = await requireSupabase().auth.updateUser({ password: next });
    if (error) throw error;
  }, []);

  const value = useMemo<AdminAuthValue>(
    () => ({
      status,
      user,
      profile,
      accessMessage,
      isOwner: profile?.role === "owner",
      can: (key: PermissionKey) => canEdit(profile, key),
      signIn,
      signOutNow,
      changePassword,
    }),
    [status, user, profile, accessMessage, signIn, signOutNow, changePassword],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthValue {
  const value = useContext(AdminAuthContext);
  if (!value) throw new Error("useAdminAuth must be used inside <AdminAuthProvider>.");
  return value;
}

/** Turns a Supabase auth error into something worth showing a person. */
export function describeAuthError(error: unknown): string {
  const code = errorCode(error);

  switch (code) {
    case "invalid_credentials":
    case "invalid_grant":
      return "Wrong username or password.";
    case "email_address_invalid":
    case "validation_failed":
      return "That username is not valid.";
    case "email_not_confirmed":
      return "That login has not been confirmed. Switch off “Confirm email” in Supabase → Authentication → Sign In / Providers, or confirm the account in the dashboard.";
    case "user_banned":
      return "That account has been banned in Supabase.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Too many attempts. Wait a minute and try again.";
    case "signup_disabled":
      return "Sign-ups are switched off in the Supabase dashboard.";
    case "weak_password":
      return "That password is too short — use at least eight characters.";
    case "same_password":
      return "That is already your password. Choose a different one.";
    case "session_not_found":
    case "refresh_token_not_found":
      return "Your session has expired. Sign in again.";
    default:
      break;
  }

  if (error instanceof Error) {
    if (/fetch|network/i.test(error.message)) {
      return "No connection to Supabase. Check your internet and try again.";
    }
    if (error.message) return error.message;
  }

  return "Something went wrong. Try again.";
}

/** Supabase errors carry a machine-readable `code`; PostgREST ones do too. */
export function errorCode(error: unknown): string {
  if (typeof error !== "object" || error === null) return "";
  const code = Reflect.get(error, "code");
  return typeof code === "string" ? code : "";
}
