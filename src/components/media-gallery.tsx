import { useState } from "react";
import { Play } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { isVideo, type GalleryItem } from "@/data/site";

/**
 * Gallery grid. Tapping a tile opens a full-screen viewer that can be swiped
 * on touch, dragged with a mouse, or stepped through with the arrow keys.
 */
export function MediaGallery({ items }: { items: GalleryItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <ul className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {items.map((item, index) => {
          const video = isVideo(item.src);

          return (
            <li key={`${item.src}-${index}`}>
              <button
                type="button"
                onClick={() => setOpenIndex(index)}
                aria-label={`Open ${item.alt}`}
                className="group relative block w-full cursor-pointer overflow-hidden border border-border bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <span className="block aspect-[4/3]">
                  {video && !item.poster ? (
                    // No poster given, so let the browser paint the first frame.
                    <video
                      src={item.src}
                      preload="auto"
                      muted
                      playsInline
                      tabIndex={-1}
                      draggable={false}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <img
                      src={video ? item.poster : item.src}
                      alt=""
                      loading="lazy"
                      draggable={false}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  )}
                </span>
                {video ? (
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/70 text-secondary-foreground backdrop-blur">
                      <Play className="h-5 w-5 translate-x-px" fill="currentColor" />
                    </span>
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>

      <Lightbox items={items} openIndex={openIndex} onClose={() => setOpenIndex(null)} />
    </>
  );
}

function Lightbox({
  items,
  openIndex,
  onClose,
}: {
  items: GalleryItem[];
  openIndex: number | null;
  onClose: () => void;
}) {
  const item = openIndex === null ? null : items[openIndex];

  return (
    <Dialog
      open={openIndex !== null}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="w-[min(92vw,56rem)] max-w-none overflow-hidden rounded-2xl border border-border bg-secondary p-4 text-secondary-foreground shadow-2xl sm:p-6">
        <DialogTitle className="sr-only">Gallery</DialogTitle>
        {item ? (
          <figure className="flex flex-col items-center justify-center gap-4 sm:gap-5">
            {isVideo(item.src) ? (
              <video
                src={item.src}
                poster={item.poster}
                controls
                muted
                controlsList="nodownload noremoteplayback novolume"
                disablePictureInPicture
                onVolumeChange={(event) => {
                  event.currentTarget.muted = true;
                  event.currentTarget.volume = 0;
                }}
                playsInline
                preload="auto"
                draggable={false}
                className="gallery-media max-h-[72svh] w-auto max-w-full object-contain"
              />
            ) : (
              <img
                src={item.src}
                alt={item.alt}
                draggable={false}
                className="gallery-media max-h-[72svh] w-auto max-w-full object-contain"
              />
            )}

            {item.caption ? (
              <figcaption className="text-center text-xs tracking-[0.18em] text-secondary-foreground/55 uppercase">
                {item.caption}
              </figcaption>
            ) : null}
          </figure>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
