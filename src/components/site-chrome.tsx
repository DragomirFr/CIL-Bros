import { Link } from "@tanstack/react-router";
import { ChevronRight, Menu, Phone } from "lucide-react";
import { useState } from "react";

import logo from "@/assets/logo-transparent.png";
import {
  COMPANY,
  EMAIL,
  PHONE,
  PHONE_HREF,
  BASE_LOCATION,
  FACEBOOK_URL,
  services,
} from "@/data/site";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

// Inline rather than from lucide-react: lucide has deprecated its brand icons
// and will remove them, and this is the actual Facebook mark, not an outline of it.
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

const nav = [
  { to: "/", label: "Home" },
  { to: "/gallery", label: "Gallery" },
  { to: "/contact", label: "Contact" },
] as const;

const legalNav = [
  { to: "/privacy", label: "Privacy" },
  { to: "/cookies", label: "Cookies" },
  { to: "/terms", label: "Terms" },
] as const;

/**
 * Hamburger menu for narrow screens. Mirrors the desktop nav but also lists the
 * service pages and legal links, so every page is one tap away.
 *
 * Client-side navigation doesn't unmount the sheet, so each link closes it.
 */
function MobileNav() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="Open menu"
        className="-mr-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-secondary-foreground/80 transition-colors hover:bg-secondary-foreground/5 hover:text-primary md:hidden"
      >
        <Menu className="h-6 w-6" />
      </SheetTrigger>
      <SheetContent
        side="right"
        className="flex h-[100dvh] max-h-[100dvh] w-full max-w-full flex-col overflow-hidden border-secondary-foreground/10 bg-secondary p-0 pb-[env(safe-area-inset-bottom)] text-secondary-foreground sm:w-[24rem] [&>button]:top-[calc(1.25rem+env(safe-area-inset-top))] [&>button]:right-5 [&>button]:text-secondary-foreground/70 [&>button]:hover:text-primary"
      >
        <div className="shrink-0 border-b border-secondary-foreground/10 px-5 pb-4 pt-[calc(3.5rem+env(safe-area-inset-top))] sm:px-6">
          <SheetTitle className="text-xs font-bold tracking-[0.2em] text-primary uppercase">
            Menu
          </SheetTitle>
          <p className="mt-1 text-sm text-secondary-foreground/60">
            Quick access to pages, services, and contact.
          </p>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-2">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={close}
                activeOptions={{ exact: n.to === "/" }}
                activeProps={{ className: "border-primary bg-primary/10 text-primary" }}
                className="flex items-center justify-between rounded-xl border border-secondary-foreground/10 bg-secondary/40 px-4 py-3 text-sm font-display tracking-[0.08em] uppercase transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
              >
                <span>{n.label}</span>
                <ChevronRight className="h-4 w-4 shrink-0 opacity-60" />
              </Link>
            ))}
          </div>

          <div>
            <p className="px-2 text-[0.65rem] font-bold tracking-[0.2em] text-primary uppercase">
              Services
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 min-[360px]:gap-2.5">
              {services.map((service) => (
                <Link
                  key={service.slug}
                  to="/services/$slug"
                  params={{ slug: service.slug }}
                  onClick={close}
                  activeProps={{ className: "border-primary bg-primary/10 text-primary" }}
                  className="flex min-h-20 flex-col justify-between rounded-xl border border-secondary-foreground/10 bg-secondary/40 p-3 text-left text-secondary-foreground/80 transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary min-[360px]:min-h-24"
                >
                  <span className="text-[0.65rem] font-bold tracking-[0.18em] text-primary uppercase">
                    {service.n}
                  </span>
                  <span className="pr-2 text-sm leading-tight">{service.title}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-secondary-foreground/10 bg-secondary/40 p-3">
            <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">Contact</p>
            <a
              href={PHONE_HREF}
              onClick={close}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold tracking-[0.12em] text-primary-foreground uppercase transition-colors hover:bg-primary/85"
            >
              <Phone className="h-4 w-4" />
              Call {PHONE}
            </a>
            <p className="mt-2 text-xs leading-relaxed text-secondary-foreground/60">
              Open the menu for services and pages, or tap to call now.
            </p>
          </div>
          </div>
        </nav>

        <div className="shrink-0 border-t border-secondary-foreground/10 px-4 py-3 sm:px-6">
          <ul className="flex items-center justify-between gap-3 text-[0.68rem] tracking-[0.12em] text-secondary-foreground/45 uppercase">
            {legalNav.map((l, index) => (
              <li key={l.to} className="flex items-center gap-3">
                <Link to={l.to} onClick={close} className="whitespace-nowrap hover:text-primary">
                  {l.label}
                </Link>
                {index < legalNav.length - 1 ? <span aria-hidden="true">•</span> : null}
              </li>
            ))}
          </ul>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function SiteHeader() {
  return (
    <header className="site-header fixed inset-x-0 top-0 z-50 border-b border-secondary-foreground/10 bg-secondary/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-2">
        <Link to="/" className="shrink-0" aria-label={`${COMPANY} home`}>
          <img
            src={logo}
            alt={COMPANY}
            width={1043}
            height={536}
            className="h-12 w-auto object-contain sm:h-14"
          />
        </Link>
        <nav className="hidden gap-7 text-xs font-semibold tracking-[0.15em] text-secondary-foreground/70 uppercase md:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.to === "/" }}
              activeProps={{ className: "text-primary" }}
              className="hover:text-primary"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <a
            href={PHONE_HREF}
            className="hidden bg-primary px-4 py-2 text-xs font-bold tracking-[0.12em] text-primary-foreground uppercase transition-colors hover:bg-primary/85 sm:inline-flex"
          >
            {PHONE}
          </a>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer border-t border-secondary-foreground/10 bg-secondary py-14">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:grid-cols-3">
        <div>
          <p className="font-display text-sm tracking-[0.18em] text-secondary-foreground uppercase">
            {COMPANY}
          </p>
          <p className="mt-3 text-sm text-secondary-foreground/60">
            Based in {BASE_LOCATION}. Family-run and fully insured.
          </p>
          <a
            href={FACEBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${COMPANY} on Facebook`}
            className="mt-5 inline-flex items-center gap-2.5 border border-secondary-foreground/20 px-4 py-2.5 text-xs font-bold tracking-[0.12em] text-secondary-foreground/70 uppercase transition-colors hover:border-primary hover:text-primary"
          >
            <FacebookIcon className="h-4 w-4" />
            Follow us
          </a>
        </div>
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">Contact</p>
          <ul className="mt-3 space-y-2 text-sm text-secondary-foreground/70">
            <li>
              <a className="hover:text-primary" href={PHONE_HREF}>
                {PHONE}
              </a>
            </li>
            <li>
              <a className="break-all hover:text-primary" href={`mailto:${EMAIL}`}>
                {EMAIL}
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">Our services</p>
          <ul className="mt-3 grid grid-cols-2 gap-2 text-sm text-secondary-foreground/70">
            {services.map((service) => (
              <li key={service.slug}>
                <Link
                  to="/services/$slug"
                  params={{ slug: service.slug }}
                  className="hover:text-primary"
                >
                  {service.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 text-xs tracking-[0.12em] text-secondary-foreground/45 uppercase">
        <p>
          © {new Date().getFullYear()} {COMPANY}. All rights reserved.
        </p>
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          {legalNav.map((l) => (
            <li key={l.to}>
              <Link to={l.to} className="hover:text-primary">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
