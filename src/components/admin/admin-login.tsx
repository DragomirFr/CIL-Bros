import { Eye, EyeOff, Lock, ShieldCheck, User } from "lucide-react";
import { useState } from "react";

import { AdminButton, AdminInput, AdminLabel, Notice } from "@/components/admin/admin-ui";
import logo from "@/assets/logo-transparent.png";
import { COMPANY } from "@/data/site";
import {
  ADMIN_EMAIL_DOMAIN,
  describeAuthError,
  useAdminAuth,
  usernameToEmail,
} from "@/lib/admin-auth";
import { isSupabaseConfigured } from "@/lib/supabase";

/**
 * The admin sign-in screen.
 *
 * Accounts live in Supabase Authentication. People sign in with a username
 * ("Dragomir", "Igor") which is turned into the email Supabase expects — see
 * `usernameToEmail`. A full email address works too.
 */
export function AdminLoginScreen() {
  const { signIn } = useAdminAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError("Enter your username and password.");
      return;
    }

    setBusy(true);
    try {
      await signIn(username, password, remember);
    } catch (cause) {
      setError(describeAuthError(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-5 py-16 text-secondary-foreground">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <img
            src={logo}
            alt={COMPANY}
            width={1043}
            height={536}
            className="mx-auto h-16 w-auto object-contain"
          />
          <p className="mt-6 text-[0.65rem] font-bold tracking-[0.28em] text-primary uppercase">
            Staff only
          </p>
          <h1 className="mt-2 font-display text-2xl uppercase">Admin sign in</h1>
          <p className="mt-2 text-sm text-secondary-foreground/60">
            Manage the photos, videos and services on the website.
          </p>
        </div>

        {!isSupabaseConfigured ? (
          <Notice
            tone="warning"
            title="Supabase is not connected yet"
            className="mt-6 border-primary/40 bg-primary/10 text-secondary-foreground"
          >
            Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to{" "}
            <code>.env.local</code> and restart the dev server. The steps are in{" "}
            <code>docs/ADMIN.md</code>.
          </Notice>
        ) : null}

        <form onSubmit={(event) => void submit(event)} className="mt-8 space-y-4">
          <div className="space-y-1.5">
            <AdminLabel htmlFor="admin-username" className="text-secondary-foreground/60">
              Username
            </AdminLabel>
            <div className="relative">
              <User className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-secondary-foreground/40" />
              <AdminInput
                id="admin-username"
                name="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="username"
                required
                className="border-secondary-foreground/20 bg-secondary-foreground/5 pl-9 text-secondary-foreground placeholder:text-secondary-foreground/30"
              />
            </div>
            {username.trim() && !username.includes("@") ? (
              <p className="text-xs text-secondary-foreground/40">
                Signing in as {usernameToEmail(username)}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <AdminLabel htmlFor="admin-password" className="text-secondary-foreground/60">
              Password
            </AdminLabel>
            <div className="relative">
              <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-secondary-foreground/40" />
              <AdminInput
                id="admin-password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                required
                className="border-secondary-foreground/20 bg-secondary-foreground/5 pr-11 pl-9 text-secondary-foreground placeholder:text-secondary-foreground/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute top-1/2 right-2 inline-flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-sm text-secondary-foreground/40 transition-colors hover:text-primary"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-xs text-secondary-foreground/60">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="h-4 w-4 cursor-pointer accent-[oklch(0.474_0.132_38)]"
            />
            Keep me signed in on this device
          </label>

          {error ? (
            <Notice
              tone="danger"
              className="border-destructive/50 bg-destructive/15 text-secondary-foreground"
            >
              {error}
            </Notice>
          ) : null}

          <AdminButton
            type="submit"
            variant="primary"
            busy={busy}
            disabled={!isSupabaseConfigured}
            className="w-full py-3"
          >
            {busy ? "Signing in…" : "Sign in"}
          </AdminButton>
        </form>

        <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-secondary-foreground/40">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Accounts are created by Dragomir on the Team page. Usernames become{" "}
            <span className="whitespace-nowrap">name@{ADMIN_EMAIL_DOMAIN}</span> addresses.
          </span>
        </p>

        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-xs font-bold tracking-[0.14em] text-secondary-foreground/50 uppercase transition-colors hover:text-primary"
          >
            ← Back to the website
          </a>
        </div>
      </div>
    </div>
  );
}
