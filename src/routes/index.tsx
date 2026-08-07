import { createFileRoute, Link } from "@tanstack/react-router";

import {
  COMPANY,
  EMAIL,
  PHONE_E164,
  areas,
  galleryItems,
  isVideo,
  services,
  siteVideos,
} from "@/data/site";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "CIL Bros Construction | Builders in Northampton" },
      {
        name: "description",
        content:
          "Family-run builders near Northampton. Extensions, renovations, groundworks and brickwork across Northamptonshire. Free quotes — call today.",
      },
      { property: "og:title", content: "CIL Bros Construction | Builders in Northampton" },
      {
        property: "og:description",
        content:
          "Family-run builders near Northampton. Extensions, renovations, groundworks and brickwork across Northamptonshire. Free quotes — call today.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "GeneralContractor",
          name: COMPANY,
          description:
            "Extensions, renovations, groundworks and brickwork by a family-run team near Northampton.",
          telephone: PHONE_E164,
          email: EMAIL,
          address: {
            "@type": "PostalAddress",
            addressLocality: "Northampton",
            addressRegion: "Northamptonshire",
            addressCountry: "GB",
          },
          areaServed: areas.map((area) => ({ "@type": "City", name: area.name })),
        }),
      },
    ],
  }),
});

function Index() {
  return (
    <>
      <section className="flex min-h-screen items-center bg-secondary text-center">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center px-5 pt-24 pb-16">
          <p className="mb-6 text-xs font-bold tracking-[0.25em] text-primary uppercase">
            CIL Bros Construction Ltd
          </p>
          <h1 className="font-display text-4xl leading-[0.95] text-secondary-foreground uppercase sm:text-6xl lg:text-7xl">
            The groundwork
            <br />
            your build depends on.
          </h1>
          <p className="mt-6 max-w-2xl text-base text-secondary-foreground/75 sm:text-lg">
            Specialists in blockwork, steel beams, insulation, concrete flooring and power floating.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link
              to="/contact"
              className="bg-primary px-6 py-3 text-sm font-bold tracking-[0.12em] text-primary-foreground uppercase transition-colors hover:bg-primary/85"
            >
              Get a quote
            </Link>
            <Link
              to="/gallery"
              className="border border-secondary-foreground/40 px-6 py-3 text-sm font-bold tracking-[0.12em] text-secondary-foreground uppercase transition-colors hover:border-primary hover:text-primary"
            >
              View our work
            </Link>
          </div>
        </div>
      </section>

      <section id="services" className="bg-[#3c3732] py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="font-display text-2xl text-secondary-foreground uppercase sm:text-4xl">
            What we do
          </h2>
          <div className="mt-10 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-5">
            {services.map((service) => (
              <Link
                key={service.n}
                to="/services/$slug"
                params={{ slug: service.slug }}
                className="group bg-card p-7 transition-colors hover:bg-background sm:p-9"
              >
                <span className="font-display text-xs tracking-[0.2em] text-primary">
                  {service.n}
                </span>
                <h3 className="mt-4 font-display text-lg uppercase">{service.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{service.text}</p>
                <span className="mt-6 inline-block text-xs font-bold tracking-[0.14em] text-primary uppercase">
                  View service →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-secondary py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-2xl text-secondary-foreground uppercase sm:text-4xl">
              Recent work
            </h2>
            <Link
              to="/gallery"
              className="text-xs font-bold tracking-[0.15em] text-primary uppercase hover:underline"
            >
              View full gallery
            </Link>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {galleryItems
              .filter((item) => !isVideo(item.src))
              .slice(0, 4)
              .map((item) => (
                <Link key={item.src} to="/gallery" className="group block overflow-hidden">
                  <img
                    src={item.src}
                    alt={item.alt}
                    width={1200}
                    height={900}
                    loading="lazy"
                    className="h-64 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] sm:h-72"
                  />
                  {item.caption ? (
                    <p className="mt-3 text-xs font-bold tracking-[0.15em] text-secondary-foreground/70 uppercase group-hover:text-primary">
                      {item.caption}
                    </p>
                  ) : null}
                </Link>
              ))}
          </div>

          <div className="mt-16">
            <h3 className="font-display text-xl text-secondary-foreground uppercase sm:text-2xl">
              On site with us
            </h3>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {siteVideos.slice(0, 3).map((video) => (
                <div
                  key={video.title}
                  className="overflow-hidden border border-secondary-foreground/15"
                >
                  {video.src ? (
                    // `preload="auto"` here pulled all three files (~17 MB) on every
                    // homepage visit. `metadata` fetches only the header, and the
                    // `#t=0.1` fragment makes the browser seek that one frame so the
                    // tile still shows a still instead of an empty box.
                    <video
                      className="aspect-video w-full object-cover"
                      src={`${video.src}#t=0.1`}
                      controls
                      muted
                      controlsList="nodownload noremoteplayback novolume"
                      disablePictureInPicture
                      onVolumeChange={(event) => {
                        event.currentTarget.muted = true;
                        event.currentTarget.volume = 0;
                      }}
                      loop
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <div className="flex aspect-video items-center justify-center bg-secondary-foreground/5 px-5 text-center">
                      <div>
                        <p className="font-display text-sm text-secondary-foreground uppercase">
                          {video.title}
                        </p>
                        <p className="mt-2 text-xs text-secondary-foreground/50">
                          Add a video in site data
                        </p>
                      </div>
                    </div>
                  )}
                  <p className="border-t border-secondary-foreground/15 px-4 py-3 text-xs font-bold tracking-[0.12em] text-secondary-foreground/70 uppercase">
                    {video.title}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-secondary py-20 sm:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">
              Where we work
            </p>
            <h2 className="mt-3 font-display text-3xl text-secondary-foreground uppercase sm:text-5xl">
              Areas we cover.
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-secondary-foreground/70 sm:text-base">
              We take on work across Northamptonshire and the surrounding area. Not sure whether we
              cover your project? Send us your postcode and we will let you know.
            </p>
            <Link
              to="/contact"
              className="mt-8 inline-block border border-secondary-foreground/40 px-5 py-3 text-xs font-bold tracking-[0.12em] text-secondary-foreground uppercase transition-colors hover:border-primary hover:text-primary"
            >
              Check your area
            </Link>
          </div>

          <div
            className="relative mx-auto aspect-square w-full max-w-xl"
            aria-label="Coverage map showing the areas served"
          >
            <div
              aria-hidden="true"
              className="absolute inset-0 rounded-full border border-secondary-foreground/20"
            />
            <div
              aria-hidden="true"
              className="absolute inset-[16%] rounded-full border border-secondary-foreground/20"
            />
            <div
              aria-hidden="true"
              className="absolute inset-[32%] rounded-full border border-secondary-foreground/20"
            />
            <div
              aria-hidden="true"
              className="absolute top-1/2 right-0 left-0 border-t border-secondary-foreground/10"
            />
            <div
              aria-hidden="true"
              className="absolute top-0 bottom-0 left-1/2 border-l border-secondary-foreground/10"
            />
            <p className="absolute top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-bold tracking-[0.18em] text-primary uppercase">
              Areas we cover
            </p>
            <span className="absolute top-1/2 left-1/2 z-10 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-8 ring-primary/15" />
            <span className="absolute top-[calc(50%+1rem)] left-1/2 z-10 -translate-x-1/2 whitespace-nowrap text-xs font-bold tracking-[0.12em] text-primary uppercase">
              Northampton
            </span>
            <MapPlace name="Leicester" className="top-[10%] left-[17%]" />
            <MapPlace name="Peterborough" className="top-[18%] right-[4%]" />
            <MapPlace name="Coventry" className="top-[48%] left-[1%]" />
            <MapPlace name="Bedford" className="right-[5%] bottom-[34%]" />
            <MapPlace name="Luton" className="right-[19%] bottom-[6%]" />
            <MapPlace name="Oxford" className="bottom-[7%] left-[18%]" />
            <MapPlace name="Kettering" className="top-[24%] right-[25%]" />
            <MapPlace name="Wellingborough" className="top-[42%] right-[13%]" />
            <MapPlace name="Daventry" className="bottom-[32%] left-[12%]" />
            <MapPlace name="Towcester" className="bottom-[18%] left-[33%]" />
            <MapPlace name="Milton Keynes" className="right-[9%] bottom-[18%]" />
          </div>
        </div>
      </section>
    </>
  );
}

function MapPlace({ name, className }: { name: string; className: string }) {
  return (
    <span
      className={`absolute flex items-center gap-2 text-xs font-bold tracking-[0.1em] text-secondary-foreground/45 uppercase ${className}`}
    >
      <span className="size-1.5 shrink-0 rounded-full bg-secondary-foreground/45" />
      {name}
    </span>
  );
}
