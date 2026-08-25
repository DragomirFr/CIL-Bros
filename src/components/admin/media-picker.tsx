import { FolderOpen, Link2, Play, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  AdminButton,
  AdminInput,
  AdminLabel,
  AdminTextarea,
  Field,
  Notice,
  Spinner,
} from "@/components/admin/admin-ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { MediaKind } from "@/data/site";
import {
  deleteMedia,
  formatBytes,
  kindForUrl,
  listMedia,
  MAX_UPLOAD_BYTES,
  STORAGE_NOT_CONFIGURED,
  uploadMedia,
  type MediaFile,
} from "@/lib/media-library";
import { isStorageConfigured } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export interface PickedMedia {
  src: string;
  kind: MediaKind;
  /** Original file name — used as a starting point for titles. */
  name?: string;
}

/**
 * A photo or video thumbnail.
 *
 * Videos without a poster get the same treatment as the public pages:
 * `preload="metadata"` plus a `#t=0.1` fragment, so the browser paints one
 * frame instead of pulling the whole file.
 */
export function MediaThumb({
  src,
  kind,
  poster,
  alt = "",
  className,
}: {
  src: string;
  kind: MediaKind;
  poster?: string | undefined;
  alt?: string;
  className?: string;
}) {
  if (!src) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted text-[0.65rem] font-bold tracking-[0.15em] text-muted-foreground uppercase",
          className,
        )}
      >
        No file
      </div>
    );
  }

  if (kind === "video" && !poster) {
    return (
      <div className={cn("relative overflow-hidden bg-muted", className)}>
        <video
          src={`${src}#t=0.1`}
          preload="metadata"
          muted
          playsInline
          tabIndex={-1}
          draggable={false}
          className="h-full w-full object-cover"
        />
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/70 text-secondary-foreground backdrop-blur">
            <Play className="h-3.5 w-3.5 translate-x-px" fill="currentColor" />
          </span>
        </span>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      <img
        src={kind === "video" ? poster : src}
        alt={alt}
        loading="lazy"
        draggable={false}
        className="h-full w-full object-cover"
      />
      {kind === "video" ? (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/70 text-secondary-foreground backdrop-blur">
            <Play className="h-3.5 w-3.5 translate-x-px" fill="currentColor" />
          </span>
        </span>
      ) : null}
    </div>
  );
}

interface UploadProgress {
  name: string;
  /** 1-based position in the batch. */
  index: number;
  total: number;
}

/**
 * Picks files off the device and uploads them to Storage.
 *
 * Files go up one at a time: a phone on mobile data uploading four videos at
 * once tends to stall them all.
 */
export function MediaUploadButton({
  folder,
  onPicked,
  multiple = true,
  label = "Upload files",
  variant = "primary",
  disabled = false,
}: {
  folder: string;
  onPicked: (files: PickedMedia[]) => void;
  multiple?: boolean;
  label?: string;
  variant?: "primary" | "secondary";
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<UploadProgress | null>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    const uploaded: PickedMedia[] = [];
    let failed = 0;

    for (const [index, file] of files.entries()) {
      setProgress({ name: file.name, index: index + 1, total: files.length });

      try {
        const result = await uploadMedia(file, { folder });
        uploaded.push({ src: result.url, kind: result.kind, name: result.name });
      } catch (error) {
        failed += 1;
        toast.error(error instanceof Error ? error.message : `Could not upload ${file.name}.`);
      }
    }

    setProgress(null);

    if (uploaded.length > 0) {
      onPicked(uploaded);
      toast.success(
        uploaded.length === 1
          ? "File uploaded. Remember to save."
          : `${uploaded.length} files uploaded. Remember to save.`,
      );
    }

    if (failed > 0 && uploaded.length === 0) {
      toast.error("Nothing was uploaded.");
    }
  }

  const busy = progress !== null;

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple={multiple}
        className="hidden"
        onChange={(event) => {
          void handleFiles(event.target.files).finally(() => {
            // Reset so picking the same file twice still fires a change event.
            if (inputRef.current) inputRef.current.value = "";
          });
        }}
      />
      <AdminButton
        variant={variant}
        onClick={() => inputRef.current?.click()}
        busy={busy}
        disabled={disabled || !isStorageConfigured}
        title={isStorageConfigured ? undefined : STORAGE_NOT_CONFIGURED}
      >
        {!busy ? <Upload className="h-3.5 w-3.5" /> : null}
        {busy ? "Uploading…" : label}
      </AdminButton>

      {/*
        Supabase Storage does not report how many bytes of a file have gone up,
        so the bar counts files rather than pretending to know. It pulses while
        the current one is in flight.
      */}
      {progress ? (
        <div className="min-w-48">
          <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full animate-pulse bg-primary transition-[width] duration-300"
              style={{ width: `${Math.round((progress.index / progress.total) * 100)}%` }}
            />
          </div>
          <p className="mt-1 truncate text-[0.7rem] text-muted-foreground">
            {progress.total > 1 ? `${progress.index} of ${progress.total} · ` : ""}
            {progress.name}
          </p>
        </div>
      ) : null}
    </div>
  );
}

/** Adds media that is already online, by pasting links. */
export function MediaLinkDialog({
  open,
  onOpenChange,
  onPicked,
  multiple = true,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPicked: (files: PickedMedia[]) => void;
  multiple?: boolean;
}) {
  const [value, setValue] = useState("");

  function submit() {
    const urls = value
      .split(/[\n\s]+/)
      .map((url) => url.trim())
      .filter(Boolean)
      .slice(0, multiple ? 50 : 1);

    if (urls.length === 0) {
      toast.error("Paste a link first.");
      return;
    }

    const invalid = urls.filter((url) => !/^https?:\/\//i.test(url));
    if (invalid.length > 0) {
      toast.error("Links need to start with http:// or https://");
      return;
    }

    onPicked(urls.map((url) => ({ src: url, kind: kindForUrl(url) })));
    setValue("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-sm sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display uppercase">Add by link</DialogTitle>
          <DialogDescription>
            For files that are already online. {multiple ? "One link per line." : ""}
          </DialogDescription>
        </DialogHeader>

        <Field label="Link" helper="Ends in .jpg, .png, .mp4 and so on.">
          <AdminTextarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="https://example.com/photo.jpg"
            rows={multiple ? 4 : 2}
          />
        </Field>

        <div className="flex justify-end gap-2">
          <AdminButton variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </AdminButton>
          <AdminButton variant="primary" onClick={submit}>
            Add
          </AdminButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Picks from files already uploaded to Storage. */
export function MediaLibraryDialog({
  open,
  onOpenChange,
  onPicked,
  multiple = true,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPicked: (files: PickedMedia[]) => void;
  multiple?: boolean;
}) {
  const { files, loading, error, reload } = useMediaLibrary(open);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (!open) setSelected([]);
  }, [open]);

  function toggle(path: string) {
    setSelected((current) => {
      if (current.includes(path)) return current.filter((entry) => entry !== path);
      return multiple ? [...current, path] : [path];
    });
  }

  function submit() {
    const picked = selected
      .map((path) => files.find((file) => file.path === path))
      .filter((file): file is MediaFile => Boolean(file))
      .map((file) => ({ src: file.url, kind: file.kind, name: file.name }));

    if (picked.length === 0) {
      toast.error("Choose a file first.");
      return;
    }

    onPicked(picked);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85svh] w-[min(94vw,52rem)] max-w-none overflow-hidden rounded-sm">
        <DialogHeader>
          <DialogTitle className="font-display uppercase">Media library</DialogTitle>
          <DialogDescription>Everything uploaded to this site.</DialogDescription>
        </DialogHeader>

        <div className="max-h-[52svh] overflow-y-auto pr-1">
          {loading ? <Spinner label="Loading files…" /> : null}
          {error ? <Notice tone="danger">{error}</Notice> : null}
          {!loading && !error && files.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nothing uploaded yet. Use Upload files to add some.
            </p>
          ) : null}

          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {files.map((file) => {
              const active = selected.includes(file.path);

              return (
                <li key={file.path}>
                  <button
                    type="button"
                    onClick={() => toggle(file.path)}
                    aria-pressed={active}
                    className={cn(
                      "block w-full cursor-pointer overflow-hidden rounded-sm border text-left transition-colors",
                      active
                        ? "border-primary ring-1 ring-primary"
                        : "border-border hover:border-primary/50",
                    )}
                  >
                    <MediaThumb
                      src={file.url}
                      kind={file.kind}
                      alt={file.name}
                      className="aspect-[4/3]"
                    />
                    <span className="block truncate px-2 pt-1.5 text-xs text-foreground">
                      {file.name}
                    </span>
                    <span className="block px-2 pb-1.5 text-[0.7rem] text-muted-foreground">
                      {formatBytes(file.size)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <AdminButton variant="ghost" size="sm" onClick={reload} disabled={loading}>
            Refresh
          </AdminButton>
          <div className="flex gap-2">
            <AdminButton variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </AdminButton>
            <AdminButton variant="primary" onClick={submit} disabled={selected.length === 0}>
              {selected.length > 1 ? `Add ${selected.length} files` : "Add file"}
            </AdminButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Loads the Storage listing, refreshing whenever the dialog is opened. */
export function useMediaLibrary(active = true) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!active) return;

    if (!isStorageConfigured) {
      setError(STORAGE_NOT_CONFIGURED);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    listMedia()
      .then((result) => {
        if (!cancelled) setFiles(result);
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Could not load the media library.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [active, nonce]);

  return {
    files,
    loading,
    error,
    reload: () => setNonce((value) => value + 1),
    async remove(path: string) {
      await deleteMedia(path);
      setFiles((current) => current.filter((file) => file.path !== path));
    },
  };
}

/**
 * The three ways to add media, in one row: upload from the device, pick
 * something already uploaded, or paste a link.
 */
export function AddMediaRow({
  folder,
  onPicked,
  multiple = true,
  uploadLabel = "Upload files",
  className,
}: {
  folder: string;
  onPicked: (files: PickedMedia[]) => void;
  multiple?: boolean;
  uploadLabel?: string;
  className?: string;
}) {
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);

  return (
    <div className={cn("flex flex-wrap items-start gap-2", className)}>
      <MediaUploadButton
        folder={folder}
        onPicked={onPicked}
        multiple={multiple}
        label={uploadLabel}
      />
      <AdminButton onClick={() => setLibraryOpen(true)} disabled={!isStorageConfigured}>
        <FolderOpen className="h-3.5 w-3.5" />
        From library
      </AdminButton>
      <AdminButton onClick={() => setLinkOpen(true)}>
        <Link2 className="h-3.5 w-3.5" />
        Add by link
      </AdminButton>

      <MediaLibraryDialog
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        onPicked={onPicked}
        multiple={multiple}
      />
      <MediaLinkDialog
        open={linkOpen}
        onOpenChange={setLinkOpen}
        onPicked={onPicked}
        multiple={multiple}
      />
    </div>
  );
}

/**
 * Compact single-file picker used for the optional video thumbnail and the
 * service photos, where there is one slot rather than a list.
 */
export function SingleMediaField({
  label,
  helper,
  value,
  kind,
  folder,
  onChange,
  aspect = "aspect-[4/3]",
}: {
  label: string;
  helper?: string;
  value: string;
  kind: MediaKind;
  folder: string;
  onChange: (next: PickedMedia | null) => void;
  aspect?: string;
}) {
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);

  return (
    <div className="space-y-2">
      <AdminLabel>{label}</AdminLabel>
      <div className="flex flex-wrap items-start gap-3">
        <MediaThumb
          src={value}
          kind={kind}
          alt=""
          className={cn("w-28 shrink-0 rounded-sm border border-border", aspect)}
        />
        <div className="flex min-w-40 flex-1 flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <MediaUploadButton
              folder={folder}
              multiple={false}
              variant="secondary"
              label={value ? "Replace" : "Upload"}
              onPicked={(files) => {
                const first = files[0];
                if (first) onChange(first);
              }}
            />
            <AdminButton
              size="sm"
              onClick={() => setLibraryOpen(true)}
              disabled={!isStorageConfigured}
            >
              <FolderOpen className="h-3.5 w-3.5" />
              Library
            </AdminButton>
            <AdminButton size="sm" onClick={() => setLinkOpen(true)}>
              <Link2 className="h-3.5 w-3.5" />
              Link
            </AdminButton>
            {value ? (
              <AdminButton size="sm" variant="ghost" onClick={() => onChange(null)}>
                <Trash2 className="h-3.5 w-3.5" />
                Clear
              </AdminButton>
            ) : null}
          </div>
          <AdminInput
            value={value}
            onChange={(event) =>
              onChange({ src: event.target.value.trim(), kind: kindForUrl(event.target.value) })
            }
            placeholder="No file chosen"
            spellCheck={false}
            className="text-xs"
          />
          {helper ? <p className="text-xs text-muted-foreground">{helper}</p> : null}
        </div>
      </div>

      <MediaLibraryDialog
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        multiple={false}
        onPicked={(files) => {
          const first = files[0];
          if (first) onChange(first);
        }}
      />
      <MediaLinkDialog
        open={linkOpen}
        onOpenChange={setLinkOpen}
        multiple={false}
        onPicked={(files) => {
          const first = files[0];
          if (first) onChange(first);
        }}
      />
    </div>
  );
}

export const UPLOAD_LIMIT_HINT = `Photos and videos up to ${formatBytes(MAX_UPLOAD_BYTES)} each.`;
