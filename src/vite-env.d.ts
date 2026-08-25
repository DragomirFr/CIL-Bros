/// <reference types="vite/client" />

/**
 * Typed build-time env vars.
 *
 * Declaring them here (rather than relying on Vite's `[key: string]: any`
 * index signature) means `import.meta.env.VITE_SUPABASE_URL` type-checks under
 * `noPropertyAccessFromIndexSignature`.
 *
 * Both Supabase values are baked into the client bundle at build time. That is
 * fine — the project URL and the anon key are public by design; access is
 * controlled by the row-level security policies in `supabase/schema.sql`, not by
 * hiding these values. The `service_role` key is the one that must never appear
 * here, and nothing in this project needs it.
 */
interface ImportMetaEnv {
  /** e.g. https://abcdefghijklmnop.supabase.co */
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** Domain the admin usernames are turned into emails with. */
  readonly VITE_ADMIN_EMAIL_DOMAIN?: string;
}
