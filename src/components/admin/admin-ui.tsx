import { Loader2 } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Shared bits of the admin interface.
 *
 * The public pages style raw elements with Tailwind rather than wrapping
 * everything in components, so these follow the same approach — the brand
 * squared corners, uppercase labels and rust accent, in a form that is
 * comfortable to work in for a while.
 */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/85 disabled:hover:bg-primary",
  secondary:
    "border border-border bg-card text-foreground hover:border-primary/50 hover:text-primary disabled:hover:border-border disabled:hover:text-foreground",
  ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
  danger:
    "border border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground",
};

export function AdminButton({
  variant = "secondary",
  size = "md",
  busy = false,
  className,
  children,
  disabled,
  ...props
}: ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: "sm" | "md";
  busy?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled === true || busy}
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-sm text-xs font-bold tracking-[0.12em] uppercase transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" ? "px-3 py-2" : "px-4 py-2.5",
        buttonVariants[variant],
        className,
      )}
      {...props}
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
      {children}
    </button>
  );
}

/** Square icon-only button, for the reorder and remove controls. */
export function IconButton({
  label,
  className,
  children,
  ...props
}: ComponentProps<"button"> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-sm border border-border bg-card text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function AdminLabel({ className, children, ...props }: ComponentProps<"label">) {
  return (
    <label
      className={cn(
        "block text-[0.65rem] font-bold tracking-[0.18em] text-muted-foreground uppercase",
        className,
      )}
      {...props}
    >
      {children}
    </label>
  );
}

const fieldStyles =
  "w-full rounded-sm border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60";

export function AdminInput({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(fieldStyles, className)} {...props} />;
}

export function AdminTextarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(fieldStyles, "min-h-20 resize-y leading-relaxed", className)}
      {...props}
    />
  );
}

/** Label above a control, with optional helper text below it. */
export function Field({
  label,
  helper,
  htmlFor,
  children,
  className,
}: {
  label: string;
  helper?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <AdminLabel htmlFor={htmlFor}>{label}</AdminLabel>
      {children}
      {helper ? <p className="text-xs leading-relaxed text-muted-foreground">{helper}</p> : null}
    </div>
  );
}

export function AdminPanel({ className, children, ...props }: ComponentProps<"div">) {
  return (
    <div className={cn("rounded-sm border border-border bg-card", className)} {...props}>
      {children}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  affects,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  affects?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[0.65rem] font-bold tracking-[0.22em] text-primary uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 font-display text-2xl uppercase sm:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
        {affects ? (
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground/80">
            <span className="font-bold tracking-[0.1em] uppercase">Shows up on:</span> {affects}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Spinner({ className, label }: { className?: string; label?: string | undefined }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className={cn("h-4 w-4 animate-spin", className)} />
      {label ? <span>{label}</span> : null}
    </span>
  );
}

export function CenteredSpinner({ label }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner label={label} />
    </div>
  );
}

export function Notice({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: "info" | "warning" | "danger" | "success";
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  const tones: Record<string, string> = {
    info: "border-border bg-muted/60 text-foreground",
    warning: "border-primary/40 bg-primary/10 text-foreground",
    danger: "border-destructive/40 bg-destructive/10 text-foreground",
    success: "border-emerald-600/40 bg-emerald-600/10 text-foreground",
  };

  return (
    <div
      className={cn("rounded-sm border px-4 py-3 text-sm leading-relaxed", tones[tone], className)}
    >
      {title ? <p className="font-bold tracking-[0.06em]">{title}</p> : null}
      {children ? <div className={cn(title && "mt-1")}>{children}</div> : null}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-sm border border-dashed border-border bg-card/50 px-6 py-12 text-center">
      <p className="font-display text-sm uppercase">{title}</p>
      {children ? (
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          {children}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Sticky bar that appears once there is something to save. Sits above the
 * mobile browser chrome, so it stays reachable on a phone.
 */
export function SaveBar({
  dirty,
  saving,
  summary,
  onSave,
  onDiscard,
  saveLabel = "Save and publish",
}: {
  dirty: boolean;
  saving: boolean;
  summary: string;
  onSave: () => void;
  onDiscard: () => void;
  saveLabel?: string;
}) {
  if (!dirty) return null;

  return (
    <div className="sticky bottom-0 z-30 -mx-4 mt-8 border-t border-border bg-card/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:-mx-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-bold tracking-[0.12em] text-primary uppercase">{summary}</p>
        <div className="flex items-center gap-2">
          <AdminButton variant="ghost" size="sm" onClick={onDiscard} disabled={saving}>
            Discard
          </AdminButton>
          <AdminButton variant="primary" onClick={onSave} busy={saving}>
            {saveLabel}
          </AdminButton>
        </div>
      </div>
    </div>
  );
}
