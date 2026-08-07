import { createFileRoute, Link } from "@tanstack/react-router";

import { COMPANY, EMAIL, PHONE } from "@/data/site";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => ({
    meta: [
      { title: "Terms of Service | CIL Bros Construction" },
      {
        name: "description",
        content:
          "Terms of service for the CIL Bros Construction website and the basis on which we quote and carry out building work.",
      },
    ],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
});

function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl px-5 pt-32 pb-20 sm:pb-28">
      <h1 className="font-display text-3xl uppercase sm:text-4xl">Terms of Service</h1>
      <p className="mt-3 text-sm text-muted-foreground">Last updated: 6 August 2026</p>

      <div className="prose prose-sm mt-8 max-w-none space-y-6 text-foreground [&_a]:text-primary [&_a]:underline [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:uppercase [&_h2]:tracking-wide [&_strong]:font-semibold [&_strong]:text-foreground">
        <h2>About these terms</h2>
        <p>
          This website is operated by CIL Bros Construction LTD. By using{" "}
          <strong>cilbrosconstruction.com</strong> you agree to these terms. If you do not agree
          with them, please do not use the site.
        </p>
        <p>
          These terms cover your use of the website. The building work itself is governed by the
          separate written quotation and contract we agree with you before work starts.
        </p>

        <h2>Using this website</h2>
        <p>
          You may use this site to learn about our services and to contact us. You agree not to
          misuse it — for example by attempting to gain unauthorised access, introducing malicious
          code, scraping content at scale, or using it for any unlawful purpose.
        </p>

        <h2>Quotes and estimates</h2>
        <p>
          Nothing on this website is a binding offer or a fixed price. Prices, timescales and
          service descriptions shown here are indicative only. A binding price arises only from a
          written quotation issued by us for your specific job.
        </p>
        <p>
          Unless the quotation says otherwise, quotations are valid for <strong>30 days</strong> and
          assume the site conditions we observed at the time of our visit. Where work uncovers
          conditions that could not reasonably be seen beforehand — for example unsound foundations,
          hidden services or asbestos — we will inform you and agree any variation in writing before
          continuing.
        </p>

        <h2>Building work</h2>
        <p>
          We will carry out work with reasonable care and skill, in accordance with the agreed
          specification and applicable Building Regulations. Where the job requires building control
          approval, planning permission or party wall agreement, we will tell you, but obtaining
          them remains the property owner's responsibility unless we have agreed otherwise in
          writing.
        </p>
        <p>
          Programme dates are estimates given in good faith and may be affected by weather, material
          availability, third-party inspections or variations you request.
        </p>

        <h2>Content and images</h2>
        <p>
          All text, photographs and other content on this site are owned by {COMPANY} or used with
          permission, and are protected by copyright. You may view and print pages for your own
          reference, but may not reproduce or republish them commercially without our written
          consent.
        </p>
        <p>
          Project photographs show completed work by us. Individual results vary with site
          conditions, specification and budget, and are not a guarantee of any particular outcome on
          your own project.
        </p>

        <h2>Liability</h2>
        <p>
          We do not exclude or limit our liability for death or personal injury caused by our
          negligence, for fraud, or for anything else that cannot lawfully be excluded.
        </p>
        <p>
          Subject to that, we are not liable for any loss arising from reliance on information on
          this website. The site is provided "as is" and we do not warrant that it will always be
          available or error-free. Our liability for the building work itself is set out in the
          contract for that work.
        </p>
        <p>
          If you are a consumer, these terms do not affect your statutory rights under the Consumer
          Rights Act 2015.
        </p>

        <h2>Links to other sites</h2>
        <p>
          Where we link to third-party websites, we do so for convenience only. We are not
          responsible for their content or their privacy practices.
        </p>

        <h2>Governing law</h2>
        <p>
          These terms are governed by the laws of England and Wales, and disputes are subject to the
          exclusive jurisdiction of the courts of England and Wales.
        </p>

        <h2>Changes to these terms</h2>
        <p>
          We may update these terms from time to time. The version published on this page at the
          time you use the site is the version that applies.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about these terms? Email <a href={`mailto:${EMAIL}`}>{EMAIL}</a> or call {PHONE}
          . See also our <Link to="/privacy">Privacy Policy</Link> and{" "}
          <Link to="/cookies">Cookie Policy</Link>.
        </p>
      </div>
    </article>
  );
}
