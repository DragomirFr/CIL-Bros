import { createFileRoute } from "@tanstack/react-router";

import { RequirePermission } from "@/components/admin/admin-guard";
import { Notice } from "@/components/admin/admin-ui";
import {
  MediaListEditor,
  makeEditable,
  newEditableId,
  type EditableMedia,
  type MediaTextField,
} from "@/components/admin/media-list-editor";
import type { PickedMedia } from "@/components/admin/media-picker";
import { isVideoItem, type GalleryItem } from "@/data/site";

export const Route = createFileRoute("/admin/gallery")({
  component: GalleryAdmin,
});

const FIELDS: MediaTextField[] = [
  {
    key: "alt",
    label: "Description",
    placeholder: "Concrete floor being power floated in Northampton",
    helper: "What is in the photo. Used by screen readers and by Google.",
    recommended: true,
  },
  {
    key: "caption",
    label: "Caption (optional)",
    placeholder: "Groundworks — Northamptonshire",
    helper: "Shown under the photo when someone opens it, and on the home page.",
  },
];

// Module scope so the identity is stable — the editor syncs on it.
function toEditable(item: GalleryItem): EditableMedia {
  return {
    id: newEditableId(),
    src: item.src,
    kind: isVideoItem(item) ? "video" : "image",
    poster: item.poster ?? "",
    text: { alt: item.alt, caption: item.caption ?? "" },
  };
}

function fromEditable(item: EditableMedia): GalleryItem {
  const next: GalleryItem = {
    src: item.src.trim(),
    alt: (item.text["alt"] ?? "").trim(),
    kind: item.kind,
  };

  const caption = (item.text["caption"] ?? "").trim();
  if (caption) next.caption = caption;

  const poster = item.poster.trim();
  if (poster) next.poster = poster;

  return next;
}

function fromPicked(picked: PickedMedia): EditableMedia {
  return makeEditable(picked, { alt: "", caption: "" });
}

function GalleryAdmin() {
  return (
    <RequirePermission permission="gallery" label="Gallery">
      <MediaListEditor
        section="gallery"
        title="Gallery"
        description="The photos and videos on the gallery page. Drag order is top to bottom — the first ones are seen most."
        affects="The /gallery page, and the Recent work grid on the home page"
        fields={FIELDS}
        toEditable={toEditable}
        fromEditable={fromEditable}
        fromPicked={fromPicked}
        addLabel="Upload photos or videos"
        emptyTitle="The gallery is empty"
        emptyBody="Upload photos or videos above. They appear on the gallery page in this order as soon as you save."
      >
        <Notice tone="info">
          The home page shows the first four <strong>photos</strong> from this list — videos are
          skipped there, but they still show in the full gallery.
        </Notice>
      </MediaListEditor>
    </RequirePermission>
  );
}
