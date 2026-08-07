import { createFileRoute, Link } from "@tanstack/react-router";

import { BASE_LOCATION, COMPANY, EMAIL, PHONE, PHONE_HREF, areas } from "@/data/site";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  head: () => ({
    meta: [
      { title: "Contact | CIL Bros Construction, Northampton" },
      {
        name: "description",
        content:
          "Contact CIL Bros Construction near Northampton for a free, no-obligation quote on extensions, renovations, groundworks and brickwork.",
      },
      { property: "og:title", content: "Contact CIL Bros Construction" },
      {
        property: "og:description",
        content: "Call or email for a free quote on building work across Northamptonshire.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ContactPage",
          name: `Contact ${COMPANY}`,
          mainEntity: {
            "@type": "GeneralContractor",
            name: COMPANY,
            telephone: PHONE,
            email: EMAIL,
            address: {
              "@type": "PostalAddress",
              addressLocality: "Northampton",
              addressRegion: "Northamptonshire",
              addressCountry: "GB",
            },
          },
        }),
      },
    ],
  }),
});

function ContactPage() {
  return (
    <section className="mx-auto max-w-6xl px-5 pt-32 pb-20 sm:pb-28">
      <p className="text-xs font-bold tracking-[0.3em] text-primary uppercase">Contact</p>
      <h1 className="mt-5 font-display text-3xl uppercase sm:text-5xl">Get a free quote</h1>
      <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
        Tell us about the job and we'll come out, take a look and give you a straight price. No
        obligation, no pressure.
      </p>

      <div className="mt-12 grid gap-px border border-border bg-border sm:grid-cols-2">
        <div className="bg-card p-8">
          <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">Phone</p>
          <a href={PHONE_HREF} className="mt-3 block font-display text-2xl hover:text-primary">
            {PHONE}
          </a>
          <p className="mt-3 text-sm text-muted-foreground">
            Quickest way to reach us. Monday – Saturday, 7am – 6pm.
          </p>
        </div>
        <div className="bg-card p-8">
          <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">Email</p>
          <a
            href={`mailto:${EMAIL}`}
            className="mt-3 block font-display text-xl break-all hover:text-primary"
          >
            {EMAIL}
          </a>
          <p className="mt-3 text-sm text-muted-foreground">
            Send over photos, drawings or plans and we'll come back to you.
          </p>
        </div>
        <div className="bg-card p-8">
          <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">Based in</p>
          <p className="mt-3 font-display text-xl">{BASE_LOCATION}</p>
          <p className="mt-3 text-sm text-muted-foreground">
            Site visits across the county and just beyond.
          </p>
        </div>
        <div className="bg-card p-8">
          <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">Areas covered</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {areas.map((a) => (
              <li
                key={a.slug}
                className="border border-border px-3 py-1.5 text-xs font-bold tracking-[0.1em] uppercase"
              >
                {a.name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
