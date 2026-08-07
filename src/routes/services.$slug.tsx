import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { COMPANY, PHONE, PHONE_HREF, services } from "@/data/site";

export const Route = createFileRoute("/services/$slug")({
  loader: ({ params }) => {
    const service = services.find((item) => item.slug === params.slug);
    if (!service) throw notFound();
    return { service };
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Service not found" }, { name: "robots", content: "noindex" }] };
    }

    const { service } = loaderData;
    const title = `${service.title} | ${COMPANY}`;
    return {
      meta: [
        { title },
        { name: "description", content: `${service.text} Contact ${COMPANY} for a free quote.` },
        { property: "og:title", content: title },
        { property: "og:type", content: "website" },
        { property: "og:url", content: `/services/${params.slug}` },
      ],
      links: [{ rel: "canonical", href: `/services/${params.slug}` }],
    };
  },
  component: ServicePage,
  notFoundComponent: ServiceNotFound,
});

function ServicePage() {
  const { service } = Route.useLoaderData();

  return (
    <>
      <section className="relative overflow-hidden bg-secondary pt-36 pb-20">
        <div
          aria-hidden="true"
          className="absolute -right-20 -bottom-32 h-96 w-96 border-[28px] border-primary"
        />
        <div className="relative mx-auto max-w-6xl px-5">
          <Link
            to="/"
            hash="services"
            className="text-xs font-bold tracking-[0.2em] text-primary uppercase hover:underline"
          >
            ← All services
          </Link>
          <p className="mt-8 text-xs font-bold tracking-[0.2em] text-primary uppercase">
            Service {service.n}
          </p>
          <h1 className="mt-4 font-display text-4xl text-secondary-foreground uppercase sm:text-6xl">
            {service.title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-secondary-foreground/75 sm:text-lg">
            {service.text}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
        <div className="grid items-start gap-10 lg:grid-cols-[1.35fr_.65fr]">
          <div>
            {service.image ? (
              // No fixed aspect ratio here: service photos come in whatever shape
              // they were shot in. Capping the height and letting the width follow
              // keeps portrait phone photos whole instead of cropping them to a band.
              <div className="flex justify-center overflow-hidden border border-border bg-muted">
                <img
                  src={service.image}
                  alt={`${service.title} work by ${COMPANY}`}
                  className="max-h-[32rem] w-auto max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex aspect-[16/10] items-center justify-center border border-dashed border-border bg-muted p-8 text-center">
                <div>
                  <p className="font-display text-lg uppercase">Service image</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Add a photo for this service in the site data when it is ready.
                  </p>
                </div>
              </div>
            )}
            <h2 className="mt-10 font-display text-2xl uppercase">Quality work, clearly planned</h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              We discuss the job, prepare the work area and complete each stage with care. Get in
              touch to talk through your requirements and arrange a free quote.
            </p>
          </div>
          <aside className="border border-border bg-card p-7">
            <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">
              Get a free quote
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Tell us about your project and we will get back to you.
            </p>
            <a href={PHONE_HREF} className="mt-6 block font-display text-xl hover:text-primary">
              {PHONE}
            </a>
            <Link
              to="/contact"
              className="mt-6 inline-block bg-primary px-5 py-3 text-xs font-bold tracking-[0.12em] text-primary-foreground uppercase transition-colors hover:bg-primary/85"
            >
              Contact us
            </Link>
          </aside>
        </div>
      </section>
    </>
  );
}

function ServiceNotFound() {
  return (
    <section className="mx-auto max-w-3xl px-5 pt-40 pb-28 text-center">
      <h1 className="font-display text-3xl uppercase">Service not found</h1>
      <Link
        to="/"
        className="mt-8 inline-block bg-primary px-6 py-3 text-xs font-bold tracking-[0.12em] text-primary-foreground uppercase"
      >
        Back to home
      </Link>
    </section>
  );
}
