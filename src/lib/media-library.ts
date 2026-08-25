import type { MediaKind } from "@/data/site";
import { isStorageConfigured, MEDIA_BUCKET, requireSupabase } from "@/lib/supabase";

/**
 * Uploads and the media library, backed by Supabase Storage.
 *
 * Everything the admin uploads lands in the `site-media` bucket, in a folder
 * named after the section it was added from. Names get a timestamp so
 * re-uploading the same photo never overwrites the old one — which matters,
 * because the published content points at these URLs.
 */

/** Keep in step with the bucket's `file_size_limit` in `supabase/schema.sql`. */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

export const STORAGE_NOT_CONFIGURED =
  "File uploads need Supabase. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, or paste a link to a file that is already online.";

export interface MediaFile {
  /** Full path inside the bucket. Used as the id when deleting. */
  path: string;
  name: string;
  url: string;
  kind: MediaKind;
  contentType: string;
  size: number;
  updatedAt: Date | null;
  /** The section folder it was uploaded from, for grouping in the library. */
  folder: string;
}

const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|avif|gif|svg)$/i;
const VIDEO_EXTENSIONS = /\.(mp4|webm|ogv|mov|m4v)$/i;

export function kindForFile(file: { type?: string; name: string }): MediaKind | null {
  const type = file.type ?? "";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("image/")) return "image";
  if (VIDEO_EXTENSIONS.test(file.name)) return "video";
  if (IMAGE_EXTENSIONS.test(file.name)) return "image";
  return null;
}

/** Best guess for a pasted link, where there is no MIME type to go on. */
export function kindForUrl(url: string): MediaKind {
  return VIDEO_EXTENSIONS.test(stripQuery(url)) ? "video" : "image";
}

/**
 * A concrete MIME type for a file the browser gave none for — a `.mov` off a
 * phone sometimes arrives with an empty `type`.
 *
 * The bucket only accepts `image/*` and `video/*`, and Storage falls back to
 * `application/octet-stream` when the request omits a type, so guessing from the
 * extension is what stops those uploads being refused.
 */
const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
  svg: "image/svg+xml",
  mp4: "video/mp4",
  m4v: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  ogv: "video/ogg",
};

function mimeForName(name: string, kind: MediaKind): string {
  const extension = name.toLowerCase().split(".").pop() ?? "";
  return MIME_BY_EXTENSION[extension] ?? (kind === "video" ? "video/mp4" : "image/jpeg");
}

function stripQuery(url: string): string {
  const cut = url.search(/[?#]/);
  return cut === -1 ? url : url.slice(0, cut);
}

/** Lowercased, spaces and punctuation flattened, extension kept. */
export function safeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "file";
  return (
    base
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(-80) || "file"
  );
}

export interface UploadOptions {
  /** Section the file was added from — becomes the folder name. */
  folder: string;
}

export async function uploadMedia(file: File, options: UploadOptions): Promise<MediaFile> {
  if (!isStorageConfigured) throw new Error(STORAGE_NOT_CONFIGURED);

  const kind = kindForFile(file);
  if (!kind) throw new Error(`${file.name} is not an image or a video.`);
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(
      `${file.name} is ${formatBytes(file.size)} — the limit is ${formatBytes(MAX_UPLOAD_BYTES)}.`,
    );
  }

  const bucket = requireSupabase().storage.from(MEDIA_BUCKET);
  const folder = safeFileName(options.folder) || "library";
  const path = `${folder}/${Date.now()}-${safeFileName(file.name)}`;
  const contentType = file.type || mimeForName(file.name, kind);

  const { error } = await bucket.upload(path, file, {
    contentType,
    // A year, in seconds. Names are unique, so the file at a URL never changes.
    cacheControl: "31536000",
    upsert: false,
  });

  if (error) throw error;

  return {
    path,
    name: file.name,
    url: bucket.getPublicUrl(path).data.publicUrl,
    kind,
    contentType,
    size: file.size,
    updatedAt: new Date(),
    folder,
  };
}

/** Everything in the bucket, newest first. */
export async function listMedia(): Promise<MediaFile[]> {
  if (!isStorageConfigured) throw new Error(STORAGE_NOT_CONFIGURED);

  const files = await collectFiles("");

  return files.sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0));
}

/** How many entries one `list` call returns. */
const PAGE_SIZE = 100;

/**
 * Walks the section folders. Two levels deep is all the admin ever creates, but
 * the bucket is shared so the walk is bounded rather than trusting that.
 *
 * `list` returns folders and files together: a folder has no `id`, and a file
 * carries its size and MIME type inline, so there is no second request per file.
 */
async function collectFiles(prefix: string, depth = 0): Promise<MediaFile[]> {
  if (depth > 3) return [];

  const bucket = requireSupabase().storage.from(MEDIA_BUCKET);
  const files: MediaFile[] = [];
  const folders: string[] = [];

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await bucket.list(prefix, {
      limit: PAGE_SIZE,
      offset,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) throw error;
    if (!data || data.length === 0) break;

    for (const entry of data) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;

      if (!entry.id) {
        folders.push(path);
        continue;
      }

      // Left behind by creating an empty folder in the Supabase dashboard.
      if (entry.name === ".emptyFolderPlaceholder") continue;

      files.push(describe(path, entry));
    }

    if (data.length < PAGE_SIZE) break;
  }

  const nested = await Promise.all(folders.map((folder) => collectFiles(folder, depth + 1)));

  return [...files, ...nested.flat()];
}

interface StorageEntry {
  name: string;
  updated_at?: string | null;
  created_at?: string | null;
  metadata?: Record<string, unknown> | null;
}

function describe(path: string, entry: StorageEntry): MediaFile {
  const metadata = entry.metadata ?? {};
  const contentType = typeof metadata["mimetype"] === "string" ? metadata["mimetype"] : "";
  const size = typeof metadata["size"] === "number" ? metadata["size"] : 0;
  const segments = path.split("/");

  return {
    path,
    name: entry.name,
    url: requireSupabase().storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl,
    kind: kindForFile({ type: contentType, name: entry.name }) ?? "image",
    contentType,
    size,
    updatedAt: readDate(entry.updated_at ?? entry.created_at),
    folder: segments.length > 1 ? (segments[0] ?? "library") : "library",
  };
}

function readDate(value: string | null | undefined): Date | null {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function deleteMedia(path: string): Promise<void> {
  if (!isStorageConfigured) throw new Error(STORAGE_NOT_CONFIGURED);

  const { error } = await requireSupabase().storage.from(MEDIA_BUCKET).remove([path]);
  if (error) throw error;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}
