import { createFileRoute } from "@tanstack/react-router";

import { MediaGallery } from "@/components/media-gallery";
import { galleryItems } from "@/data/site";

export const Route = createFileRoute("/gallery/")({
  component: GalleryIndex,
  head: () => ({
    meta: [
      { title: "Gallery | CIL Bros Construction, Northampton" },
      {
        name: "description",
        content:
          "Photos and video of recent CIL Bros Construction projects — extensions, brickwork, kitchen renovations and groundworks across Northamptonshire.",
      },
      { property: "og:title", content: "Gallery | CIL Bros Construction" },
      {
        property: "og:description",
        content: "Recent extensions, renovations, brickwork and groundworks in Northamptonshire.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/gallery" },
    ],
    links: [{ rel: "canonical", href: "/gallery" }],
  }),
});

function GalleryIndex() {
  return (
    <section className="mx-auto max-w-6xl px-5 pt-32 pb-20 sm:pb-28">
      <p className="text-xs font-bold tracking-[0.3em] text-primary uppercase">Gallery</p>
      <h1 className="mt-5 font-display text-3xl uppercase sm:text-5xl">Our recent work</h1>
      <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
        Photos and video from jobs around Northamptonshire. Tap any one to open it, then swipe or
        use the arrows to move through the rest.
      </p>

      <MediaGallery items={galleryItems} />
    </section>
  );
}
