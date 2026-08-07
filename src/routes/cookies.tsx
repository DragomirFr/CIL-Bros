import { createFileRoute, Link } from "@tanstack/react-router";

import { COMPANY, EMAIL } from "@/data/site";

export const Route = createFileRoute("/cookies")({
  component: CookiesPage,
  head: () => ({
    meta: [
      { title: "Cookie Policy | CIL Bros Construction" },
      {
        name: "description",
        content:
          "Cookie policy for CIL Bros Construction — what cookies this website uses and how to manage them.",
      },
    ],
    links: [{ rel: "canonical", href: "/cookies" }],
  }),
});

function CookiesPage() {
  return (
    <article className="mx-auto max-w-3xl px-5 pt-32 pb-20 sm:pb-28">
      <h1 className="font-display text-3xl uppercase sm:text-4xl">Cookie Policy</h1>
      <p className="mt-3 text-sm text-muted-foreground">Last updated: 6 August 2026</p>

      <div className="prose prose-sm mt-8 max-w-none space-y-6 text-foreground [&_a]:text-primary [&_a]:underline [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:uppercase [&_h2]:tracking-wide [&_strong]:font-semibold [&_strong]:text-foreground">
        <h2>What cookies are</h2>
        <p>
          Cookies are small text files that a website stores on your device. They are commonly used
          to remember preferences, keep you signed in, or measure how a site is used.
        </p>

        <h2>Cookies this website uses</h2>
        <p>
          <strong>This website does not set any cookies.</strong> We do not use analytics,
          advertising or tracking cookies, and we do not build a profile of your visit or track you
          across other websites.
        </p>
        <p>
          Because we set no non-essential cookies, there is no cookie banner to accept or reject. If
          we add anything in future that does set cookies — for example website analytics — we will
          update this page and ask for your consent first.
        </p>

        <h2>Third-party services</h2>
        <p>
          We load our website fonts from <strong>Google Fonts</strong>. When a page loads, your
          browser requests the font files from Google's servers, which means Google receives your IP
          address and basic request information. Google Fonts does not set cookies when serving
          fonts. You can read{" "}
          <a
            href="https://developers.google.com/fonts/faq/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google's Fonts privacy information
          </a>{" "}
          for details.
        </p>
        <p>
          Our website is served through a hosting provider that may keep short-lived server logs
          (including IP addresses) for security and reliability. These are not cookies and are not
          used to identify you.
        </p>

        <h2>Managing cookies in your browser</h2>
        <p>
          Even though this site sets no cookies, you can control cookies for any website through
          your browser settings — usually under Settings, then Privacy or Cookies. There you can
          block cookies, delete existing ones, or set the browser to warn you before one is stored.
        </p>
        <p>
          Blocking cookies will not affect how this website works, since it does not rely on them.
        </p>

        <h2>Changes to this policy</h2>
        <p>
          If we start using cookies, we will update this page and the "Last updated" date, and put a
          consent mechanism in place before any non-essential cookie is set.
        </p>

        <h2>Questions</h2>
        <p>
          If you have any questions about this policy, email us at{" "}
          <a href={`mailto:${EMAIL}`}>{EMAIL}</a>. See also our{" "}
          <Link to="/privacy">Privacy Policy</Link> for how {COMPANY} handles personal data.
        </p>
      </div>
    </article>
  );
}
