/**
 * The shape of the editable content, plus the code that reads a saved row back
 * safely.
 *
 * Deliberately kept apart from `site-content.ts`: nothing here touches Supabase,
 * so the server render and the sitemap can normalise a row without pulling the
 * SDK into the worker bundle. Anything published by the admin area has been
 * through here before a page renders it.
 */
import {
  galleryItems,
  recentJobs as bundledRecentJobs,
  services as bundledServices,
  siteVideos as bundledSiteVideos,
  type GalleryItem,
  type MediaKind,
  type RecentJob,
  type Service,
  type SiteVideo,
} from "@/data/site";
import type { ContentSectionId } from "@/lib/admin-access";

/**
 * Each section is one row in this table, which is what makes per-person
 * permissions possible: an account with the `gallery` switch on can write the
 * row whose id is `gallery` and nothing else.
 */
export const CONTENT_TABLE = "site_content";

export interface ContentShape {
  gallery: GalleryItem[];
  recentJobs: RecentJob[];
  siteVideos: SiteVideo[];
  services: Service[];
}

/**
 * What the pages show until someone saves a section in the admin area — and
 * what they fall back to if Supabase is unreachable or unconfigured. The site
 * therefore never renders empty, and search engines always get real content.
 */
export const bundledContent: ContentShape = {
  gallery: galleryItems,
  recentJobs: bundledRecentJobs,
  siteVideos: bundledSiteVideos,
  services: bundledServices,
};

/**
 * Services drive the navigation, the footer and the sitemap, so an empty row is
 * treated as "nothing published" rather than "no services". The media sections
 * are allowed to be empty — that is a real thing to want.
 */
export const KEEP_BUNDLED_WHEN_EMPTY: Record<ContentSectionId, boolean> = {
  gallery: false,
  recentJobs: false,
  siteVideos: false,
  services: true,
};

export type ContentSource = "bundled" | "published";

/** Reads the `items` array out of an untrusted row. */
export function normaliseSection<K extends ContentSectionId>(id: K, raw: unknown): ContentShape[K] {
  return normalisers[id](raw);
}

/**
 * The items a page should render for a section, given the raw `items` column of
 * a saved row. Shared by the live store and the server-side fetch so both make
 * the same call about an empty or malformed row.
 */
export function resolveSection<K extends ContentSectionId>(
  id: K,
  raw: unknown,
): { items: ContentShape[K]; source: ContentSource } {
  const items = normaliseSection(id, raw);

  if (items.length === 0 && KEEP_BUNDLED_WHEN_EMPTY[id]) {
    return { items: bundledContent[id], source: "bundled" };
  }

  return { items, source: "published" };
}

const normalisers: { [K in ContentSectionId]: (raw: unknown) => ContentShape[K] } = {
  gallery: normaliseGallery,
  recentJobs: normaliseRecentJobs,
  siteVideos: normaliseSiteVideos,
  services: normaliseServices,
};

function readString(entry: unknown, key: string): string {
  if (!entry || typeof entry !== "object") return "";
  const value = (entry as Record<string, unknown>)[key];
  return typeof value === "string" ? value.trim() : "";
}

function readKind(entry: unknown): MediaKind | null {
  const value = readString(entry, "kind");
  return value === "image" || value === "video" ? value : null;
}

function normaliseGallery(raw: unknown): GalleryItem[] {
  if (!Array.isArray(raw)) return [];

  const items: GalleryItem[] = [];
  for (const entry of raw) {
    const src = readString(entry, "src");
    if (!src) continue;

    const item: GalleryItem = { src, alt: readString(entry, "alt") };
    const caption = readString(entry, "caption");
    if (caption) item.caption = caption;
    const poster = readString(entry, "poster");
    if (poster) item.poster = poster;
    const kind = readKind(entry);
    if (kind) item.kind = kind;

    items.push(item);
  }

  return items;
}

function normaliseRecentJobs(raw: unknown): RecentJob[] {
  if (!Array.isArray(raw)) return [];

  const items: RecentJob[] = [];
  raw.forEach((entry, index) => {
    const src = readString(entry, "src");
    if (!src) return;

    const item: RecentJob = { title: readString(entry, "title") || `Recent job ${index + 1}`, src };
    const alt = readString(entry, "alt");
    if (alt) item.alt = alt;
    const poster = readString(entry, "poster");
    if (poster) item.poster = poster;
    const kind = readKind(entry);
    if (kind) item.kind = kind;

    items.push(item);
  });

  return items;
}

function normaliseSiteVideos(raw: unknown): SiteVideo[] {
  if (!Array.isArray(raw)) return [];

  const items: SiteVideo[] = [];
  raw.forEach((entry, index) => {
    const item: SiteVideo = { title: readString(entry, "title") || `Site video ${index + 1}` };
    const src = readString(entry, "src");
    if (src) item.src = src;
    const poster = readString(entry, "poster");
    if (poster) item.poster = poster;

    items.push(item);
  });

  return items;
}

function normaliseServices(raw: unknown): Service[] {
  if (!Array.isArray(raw)) return [];

  const items: Service[] = [];
  const seen = new Set<string>();

  raw.forEach((entry, index) => {
    const slug = slugify(readString(entry, "slug"));
    const title = readString(entry, "title");
    // A duplicate slug would give two services the same URL.
    if (!slug || !title || seen.has(slug)) return;
    seen.add(slug);

    const item: Service = {
      n: readString(entry, "n") || numberLabel(index),
      slug,
      title,
      text: readString(entry, "text"),
    };
    const image = readString(entry, "image");
    if (image) item.image = image;

    items.push(item);
  });

  return items;
}

/** "01", "02", ... — the label shown above each service tile. */
export function numberLabel(index: number): string {
  return String(index + 1).padStart(2, "0");
}

/** Turns a service title into the URL segment it will be served under. */
export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
