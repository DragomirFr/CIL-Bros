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
import type { SiteVideo } from "@/data/site";

export const Route = createFileRoute("/admin/site-videos")({
  component: SiteVideosAdmin,
});

const FIELDS: MediaTextField[] = [
  {
    key: "title",
    label: "Label",
    placeholder: "Power floating a slab",
    helper: "Printed under the video on the home page, so keep it short.",
    recommended: true,
  },
];

function toEditable(item: SiteVideo, index: number): EditableMedia {
  return {
    id: newEditableId(),
    src: item.src ?? "",
    kind: "video",
    poster: item.poster ?? "",
    text: { title: item.title || `Site video ${index + 1}` },
  };
}

function fromEditable(item: EditableMedia, index: number): SiteVideo {
  const next: SiteVideo = {
    title: (item.text["title"] ?? "").trim() || `Site video ${index + 1}`,
  };

  const src = item.src.trim();
  if (src) next.src = src;

  const poster = item.poster.trim();
  if (poster) next.poster = poster;

  return next;
}

function fromPicked(picked: PickedMedia, index: number): EditableMedia {
  return makeEditable(picked, { title: picked.name ?? `Site video ${index + 1}` });
}

function SiteVideosAdmin() {
  return (
    <RequirePermission permission="siteVideos" label="On site videos">
      <MediaListEditor
        section="siteVideos"
        title="On site videos"
        description="The wide clips in the On site with us row, each with a label underneath."
        affects="The On site with us row on the home page"
        fields={FIELDS}
        toEditable={toEditable}
        fromEditable={fromEditable}
        fromPicked={fromPicked}
        previewAspect="aspect-video"
        addLabel="Upload videos"
        emptyTitle="No clips here yet"
        emptyBody="Upload landscape clips filmed on site. The first three appear on the home page."
      >
        <Notice tone="info">
          The home page shows the <strong>first three</strong> in this list. Keep extra ones further
          down and move them up when you want to swap one in.
        </Notice>
      </MediaListEditor>
    </RequirePermission>
  );
}
