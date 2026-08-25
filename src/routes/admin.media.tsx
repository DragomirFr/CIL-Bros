import { createFileRoute } from "@tanstack/react-router";
import { Copy, ExternalLink, RefreshCw, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { RequirePermission } from "@/components/admin/admin-guard";
import {
  AdminButton,
  AdminPanel,
  EmptyState,
  Notice,
  PageHeader,
  Spinner,
} from "@/components/admin/admin-ui";
import {
  MediaThumb,
  MediaUploadButton,
  UPLOAD_LIMIT_HINT,
  useMediaLibrary,
} from "@/components/admin/media-picker";
import { formatBytes, type MediaFile } from "@/lib/media-library";
import { useSiteSection } from "@/lib/site-content";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/media")({
  component: MediaAdmin,
});

function MediaAdmin() {
  return (
    <RequirePermission permission="media" label="Media library">
      <MediaLibraryPage />
    </RequirePermission>
  );
}

type Filter = "all" | "image" | "video";

function MediaLibraryPage() {
  const { files, loading, error, reload, remove } = useMediaLibrary(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [busyPath, setBusyPath] = useState<string | null>(null);
  const inUse = useFilesInUse();

  const shown = filter === "all" ? files : files.filter((file) => file.kind === filter);
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  async function handleDelete(file: MediaFile) {
    const used = inUse.has(file.url);
    const message = used
      ? `${file.name} is being used on the website right now. Deleting it leaves a blank space there. Delete anyway?`
      : `Delete ${file.name}? This cannot be undone.`;

    if (!window.confirm(message)) return;

    setBusyPath(file.path);
    try {
      await remove(file.path);
      toast.success("File deleted.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not delete that file.");
    } finally {
      setBusyPath(null);
    }
  }

  async function copyLink(file: MediaFile) {
    try {
      await navigator.clipboard.writeText(file.url);
      toast.success("Link copied.");
    } catch {
      toast.error("Could not copy. Open the file and copy the address from the bar.");
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Files"
        title="Media library"
        description="Every photo and video uploaded to the site. Upload here, or straight from the section you are editing."
        affects="Shared by the gallery, recent jobs, on site videos and services"
        actions={
          <AdminButton size="sm" variant="ghost" onClick={reload} disabled={loading}>
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Refresh
          </AdminButton>
        }
      />

      <div className="mt-6 space-y-4">
        {error ? (
          <Notice tone="danger" title="Could not load the files">
            {error}
          </Notice>
        ) : null}

        <AdminPanel className="flex flex-wrap items-start justify-between gap-3 p-4">
          <div>
            <p className="font-display text-sm uppercase">Upload</p>
            <p className="mt-1 text-xs text-muted-foreground">{UPLOAD_LIMIT_HINT}</p>
            {files.length > 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {files.length} file{files.length === 1 ? "" : "s"} · {formatBytes(totalSize)} in
                total
              </p>
            ) : null}
          </div>
          <MediaUploadButton
            folder="library"
            label="Upload files"
            onPicked={() => {
              reload();
            }}
          />
        </AdminPanel>

        <Notice tone="info">
          Uploading here only puts the file in storage. To show it on the website, open the section
          you want it in and choose <strong>From library</strong>.
        </Notice>

        <div className="flex flex-wrap items-center gap-2">
          {(["all", "image", "video"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={cn(
                "cursor-pointer rounded-sm border px-3 py-1.5 text-xs font-bold tracking-[0.12em] uppercase transition-colors",
                filter === value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
              )}
            >
              {value === "all" ? "Everything" : value === "image" ? "Photos" : "Videos"}
            </button>
          ))}
        </div>

        {loading && files.length === 0 ? <Spinner label="Loading files…" /> : null}

        {!loading && files.length === 0 && !error ? (
          <EmptyState title="Nothing uploaded yet">
            Files you upload from any section end up here too, so this fills up as you go.
          </EmptyState>
        ) : null}

        {shown.length === 0 && files.length > 0 ? (
          <EmptyState title="Nothing matches that filter">
            Switch back to Everything to see all {files.length} files.
          </EmptyState>
        ) : null}

        {shown.length > 0 ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {shown.map((file) => {
              const used = inUse.has(file.url);

              return (
                <li key={file.path}>
                  <AdminPanel className="flex h-full flex-col overflow-hidden">
                    <MediaThumb
                      src={file.url}
                      kind={file.kind}
                      alt={file.name}
                      className="aspect-[4/3] border-b border-border"
                    />
                    <div className="flex flex-1 flex-col gap-1 p-3">
                      <p
                        className="truncate text-xs font-semibold text-foreground"
                        title={file.name}
                      >
                        {file.name}
                      </p>
                      <p className="text-[0.7rem] text-muted-foreground">
                        {formatBytes(file.size)}
                        {file.folder ? ` · ${file.folder}` : ""}
                      </p>
                      {used ? (
                        <p className="text-[0.7rem] font-bold tracking-[0.1em] text-primary uppercase">
                          In use
                        </p>
                      ) : null}

                      <div className="mt-auto flex items-center gap-1 pt-2">
                        <button
                          type="button"
                          onClick={() => void copyLink(file)}
                          aria-label="Copy the link"
                          title="Copy the link"
                          className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Open in a new tab"
                          title="Open in a new tab"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => void handleDelete(file)}
                          disabled={busyPath === file.path}
                          aria-label="Delete this file"
                          title="Delete this file"
                          className="ml-auto inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </AdminPanel>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Every URL the live site currently points at, so the grid can warn before
 * deleting something that is on a page.
 */
function useFilesInUse(): Set<string> {
  const gallery = useSiteSection("gallery").items;
  const jobs = useSiteSection("recentJobs").items;
  const videos = useSiteSection("siteVideos").items;
  const services = useSiteSection("services").items;

  return useMemo(() => {
    const used = new Set<string>();
    const add = (value: string | undefined) => {
      if (value) used.add(value);
    };

    for (const item of gallery) {
      add(item.src);
      add(item.poster);
    }
    for (const item of jobs) {
      add(item.src);
      add(item.poster);
    }
    for (const item of videos) {
      add(item.src);
      add(item.poster);
    }
    for (const item of services) {
      add(item.image);
    }

    return used;
  }, [gallery, jobs, videos, services]);
}
