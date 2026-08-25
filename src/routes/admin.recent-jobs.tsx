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
import { isVideoItem, type RecentJob } from "@/data/site";

export const Route = createFileRoute("/admin/recent-jobs")({
  component: RecentJobsAdmin,
});

const FIELDS: MediaTextField[] = [
  {
    key: "title",
    label: "Reference",
    placeholder: "Kitchen extension, Kingsthorpe",
    helper: "Just so you can tell the tiles apart in here. Not shown on the website.",
  },
  {
    key: "alt",
    label: "Description",
    placeholder: "Video from a recent job in Kingsthorpe",
    helper: "Read out by screen readers. Used by Google too.",
    recommended: true,
  },
];

function toEditable(item: RecentJob, index: number): EditableMedia {
  return {
    id: newEditableId(),
    src: item.src,
    kind: isVideoItem(item) ? "video" : "image",
    poster: item.poster ?? "",
    text: { title: item.title || `Recent job ${index + 1}`, alt: item.alt ?? "" },
  };
}

function fromEditable(item: EditableMedia, index: number): RecentJob {
  const next: RecentJob = {
    title: (item.text["title"] ?? "").trim() || `Recent job ${index + 1}`,
    src: item.src.trim(),
    kind: item.kind,
  };

  const alt = (item.text["alt"] ?? "").trim();
  if (alt) next.alt = alt;

  const poster = item.poster.trim();
  if (poster) next.poster = poster;

  return next;
}

function fromPicked(picked: PickedMedia, index: number): EditableMedia {
  return makeEditable(picked, {
    title: picked.name ?? `Recent job ${index + 1}`,
    alt: "",
  });
}

function RecentJobsAdmin() {
  return (
    <RequirePermission permission="recentJobs" label="Recent jobs">
      <MediaListEditor
        section="recentJobs"
        title="Recent jobs"
        description="The tall tiles in the Recent Jobs strip on the home page. Phone videos suit this shape best."
        affects="The Recent Jobs section on the home page"
        fields={FIELDS}
        toEditable={toEditable}
        fromEditable={fromEditable}
        fromPicked={fromPicked}
        previewAspect="aspect-[9/16]"
        addLabel="Upload job photos or videos"
        emptyTitle="No recent jobs yet"
        emptyBody="Upload a few clips or photos from finished jobs. The section disappears from the home page while this is empty."
      >
        <Notice tone="info">
          Four tiles fit across on a desktop screen and two on a phone, so multiples of four look
          tidiest.
        </Notice>
      </MediaListEditor>
    </RequirePermission>
  );
}
