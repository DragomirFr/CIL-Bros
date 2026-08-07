import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";

import { COMPANY, EMAIL } from "@/data/site";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: "Privacy Policy | CIL Bros Construction" },
      {
        name: "description",
        content:
          "Privacy policy for CIL Bros Construction — how we collect, use and protect your personal data.",
      },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
});

function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-5 pt-32 pb-20 sm:pb-28">
      <h1 className="font-display text-3xl uppercase sm:text-4xl">Privacy Policy</h1>
      <p className="mt-3 text-sm text-muted-foreground">Last updated: 6 August 2026</p>

      <div className="prose prose-sm mt-8 max-w-none space-y-6 text-foreground [&_a]:text-primary [&_a]:underline [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:uppercase [&_h2]:tracking-wide [&_strong]:font-semibold [&_strong]:text-foreground">
        <h2>Who we are</h2>
        <p>
          {COMPANY}, is the data controller for personal data collected via
          this website. You can reach us at <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
        </p>

        <h2>What personal data we collect</h2>
        <p>
          When you contact us by phone or email, we collect the information you give us — typically
          your name, phone number, email address, your location, and details about the work you are
          enquiring about.
        </p>
        <p>
          This website does not use cookies or analytics, and we do not track you across other
          sites. We load fonts from Google Fonts; see our <Link to="/cookies">Cookie Policy</Link>{" "}
          for more detail.
        </p>

        <h2>How we use your data</h2>
        <p>We use the information you provide to:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Respond to your enquiry and provide a quote</li>
          <li>Carry out the work you have contracted us to do</li>
          <li>Send invoices and manage payments</li>
          <li>Keep records for tax, insurance and warranty purposes</li>
        </ul>
        <p>
          Our legal basis for processing is <strong>contract</strong> (to perform or enter into a
          contract with you) and <strong>legitimate interests</strong> (to run our business and
          maintain proper records).
        </p>

        <h2>Who we share your data with</h2>
        <p>
          We do not sell your data or use it for marketing. We share information only when necessary
          to complete the job or meet legal obligations:
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            Subcontractors and suppliers who need your details to carry out the work (e.g. plumbers,
            electricians, materials suppliers)
          </li>
          <li>Our accountant and business insurers, as required for tax, compliance and claims</li>
          <li>Law enforcement or regulatory authorities, if required by law</li>
        </ul>

        

        <h2>Your rights</h2>
        <p>Under UK data protection law, you have the right to:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Request a copy of the personal data we hold about you</li>
          <li>Ask us to correct inaccurate data</li>
          <li>Request deletion of your data (subject to our legal obligations)</li>
          <li>Object to processing or request restriction in certain circumstances</li>
        </ul>
        <p>
          To exercise any of these rights, contact us at <a href={`mailto:${EMAIL}`}>{EMAIL}</a>. If
          you are unhappy with our response, you can complain to the{" "}
          <a href="https://ico.org.uk/make-a-complaint/" target="_blank" rel="noopener noreferrer">
            Information Commissioner's Office
          </a>
          .
        </p>

        <h2>Changes to this policy</h2>
        <p>
          We may update this policy from time to time. When we do, we will update the "Last updated"
          date at the top of this page.
        </p>
      </div>
    </article>
  );
}
