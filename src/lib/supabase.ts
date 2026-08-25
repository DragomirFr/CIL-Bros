/**
 * Supabase bootstrap for the admin area and the live site content.
 *
 * Everything is lazy: nothing touches Supabase until a component actually asks
 * for it. That keeps the client out of the server render (the admin is
 * browser-only) and lets the public pages fall back to the bundled content in
 * `src/data/site.ts` when no project is configured.
 *
 * Config comes from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` — see
 * `.env.example` and `docs/ADMIN.md`.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const env = import.meta.env;

/** Trailing slashes break the REST paths built in `site-content-server.ts`. */
export const supabaseUrl = (env.VITE_SUPABASE_URL ?? "").replace(/\/+$/, "");
export const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Storage is part of the same project, so uploads need nothing beyond the two
 * values above — the bucket itself is created by `supabase/schema.sql`.
 */
export const isStorageConfigured = isSupabaseConfigured;

export const SUPABASE_NOT_CONFIGURED =
  "Supabase is not connected. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local and restart the dev server.";

/** Table holding one row per admin, keyed by username. */
export const ADMINS_TABLE = "admins";

/** Storage bucket every upload lands in. */
export const MEDIA_BUCKET = "site-media";

/** Namespaced so a session here cannot collide with anything else on the domain. */
const AUTH_STORAGE_KEY = "cilbros-admin-auth";

// --- where the session is kept ---------------------------------------------

/**
 * "Keep me signed in" decides between localStorage (survives closing the
 * browser) and sessionStorage (gone with the tab). The Supabase client picks its
 * storage once, at creation, so this adapter does the switching instead: writes
 * go to whichever store is currently preferred, and reads look in both so an
 * existing session is still found after a reload.
 */
let preferLocal = true;

export function rememberSession(remember: boolean): void {
  preferLocal = remember;
}

/** Fallback for the server render, where neither Web Storage exists. */
const memory = new Map<string, string>();

function webStorage(kind: "local" | "session"): Storage | null {
  if (typeof window === "undefined") return null;

  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    // Blocked by a privacy setting. The in-memory fallback still signs in, it
    // just does not survive a reload.
    return null;
  }
}

const authStorage = {
  getItem(key: string): string | null {
    return (
      webStorage("session")?.getItem(key) ??
      webStorage("local")?.getItem(key) ??
      memory.get(key) ??
      null
    );
  },
  setItem(key: string, value: string): void {
    const keep = webStorage(preferLocal ? "local" : "session");
    const drop = webStorage(preferLocal ? "session" : "local");

    if (keep) keep.setItem(key, value);
    else memory.set(key, value);

    drop?.removeItem(key);
  },
  removeItem(key: string): void {
    webStorage("local")?.removeItem(key);
    webStorage("session")?.removeItem(key);
    memory.delete(key);
  },
};

// --- the client -------------------------------------------------------------

let client: SupabaseClient | null = null;

/**
 * Returns the initialised client, creating it on first call.
 *
 * Throws when the env vars are missing — callers that can be reached without a
 * configured project should check `isSupabaseConfigured` first and show the
 * setup notice instead.
 */
export function requireSupabase(): SupabaseClient {
  if (!isSupabaseConfigured) throw new Error(SUPABASE_NOT_CONFIGURED);

  client ??= createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: authStorage,
      storageKey: AUTH_STORAGE_KEY,
      persistSession: true,
      autoRefreshToken: true,
      // Nothing here uses a magic link or OAuth, so there is never a token in
      // the URL to pick up.
      detectSessionInUrl: false,
    },
    realtime: {
      // The admin saves a section at a time; there is no need for a firehose.
      params: { eventsPerSecond: 5 },
    },
  });

  return client;
}

/**
 * A second client that keeps no session anywhere.
 *
 * Signing someone up signs you in as the account you just created, which would
 * kick the owner out of their own session. Doing it on a throwaway client with
 * `persistSession: false` leaves the owner's session exactly where it was.
 */
export function createIsolatedClient(): SupabaseClient {
  if (!isSupabaseConfigured) throw new Error(SUPABASE_NOT_CONFIGURED);

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

/**
 * Narrows one PostgREST row to something readable.
 *
 * There are no generated database types in this project — the two tables are
 * small and the shapes are validated in `admin-access.ts` and
 * `content-schema.ts` anyway — so rows arrive untyped and are read key by key.
 */
export function readRow(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
