import { useCallback, useSyncExternalStore } from "react";

import type { GalleryItem, RecentJob, Service, SiteVideo } from "@/data/site";
import type { ContentSectionId } from "@/lib/admin-access";
import {
  bundledContent,
  CONTENT_TABLE,
  resolveSection,
  type ContentShape,
  type ContentSource,
} from "@/lib/content-schema";
import { isSupabaseConfigured, readRow, requireSupabase } from "@/lib/supabase";

/**
 * The live view of the site's editable content.
 *
 * Reads are public and stay open over a realtime channel, so a save in the admin
 * area reaches every open page. The shapes, the bundled fallback and the row
 * parsing all live in `content-schema.ts`, which keeps the Supabase SDK out of
 * anything that only needs to read a row (the server render, the sitemap).
 */
export { bundledContent, CONTENT_TABLE, numberLabel, slugify } from "@/lib/content-schema";
export type { ContentShape, ContentSource } from "@/lib/content-schema";

export interface SectionState<K extends ContentSectionId> {
  items: ContentShape[K];
  /** "bundled" until a saved row arrives from Supabase. */
  source: ContentSource;
  loading: boolean;
  error: string | null;
  updatedBy: string | null;
  updatedAt: Date | null;
}

// --- store -----------------------------------------------------------------

type AnyState = SectionState<ContentSectionId>;

interface StoreEntry {
  state: AnyState;
  listeners: Set<() => void>;
  stop: (() => void) | null;
}

const bundledStates = new Map<ContentSectionId, AnyState>();
const entries = new Map<ContentSectionId, StoreEntry>();

/**
 * The starting state for a section. Cached per section because
 * `useSyncExternalStore` compares snapshots by identity — handing back a fresh
 * object each call would spin forever.
 */
function bundledStateFor(id: ContentSectionId): AnyState {
  const cached = bundledStates.get(id);
  if (cached) return cached;

  const state: AnyState = {
    items: bundledContent[id],
    source: "bundled",
    loading: isSupabaseConfigured,
    error: null,
    updatedBy: null,
    updatedAt: null,
  };

  bundledStates.set(id, state);
  return state;
}

function entryFor(id: ContentSectionId): StoreEntry {
  const existing = entries.get(id);
  if (existing) return existing;

  const entry: StoreEntry = { state: bundledStateFor(id), listeners: new Set(), stop: null };
  entries.set(id, entry);
  return entry;
}

function update(id: ContentSectionId, patch: Partial<AnyState>) {
  const entry = entryFor(id);
  entry.state = { ...entry.state, ...patch };
  for (const listener of entry.listeners) listener();
}

function subscribeToSection(id: ContentSectionId, notify: () => void): () => void {
  const entry = entryFor(id);
  entry.listeners.add(notify);

  if (!entry.stop && isSupabaseConfigured && typeof window !== "undefined") {
    entry.stop = startWatching(id);
  }

  return () => {
    entry.listeners.delete(notify);

    // Last reader left. Drop the realtime channel but keep the data, so coming
    // back to the page paints the published content immediately.
    if (entry.listeners.size === 0 && entry.stop) {
      entry.stop();
      entry.stop = null;
    }
  };
}

/** Reads the row once, then follows it. */
function startWatching(id: ContentSectionId): () => void {
  const client = requireSupabase();
  let live = true;

  const applyRow = (value: unknown) => {
    const row = readRow(value);

    if (!row) {
      // No row means nobody has saved this section yet.
      update(id, {
        items: bundledContent[id],
        source: "bundled",
        loading: false,
        error: null,
        updatedBy: null,
        updatedAt: null,
      });
      return;
    }

    const { items, source } = resolveSection(id, row["items"]);

    update(id, {
      items,
      source,
      loading: false,
      error: null,
      updatedBy: typeof row["updated_by"] === "string" ? row["updated_by"] : null,
      updatedAt: readTimestamp(row["updated_at"]),
    });
  };

  const load = async () => {
    const { data, error } = await client
      .from(CONTENT_TABLE)
      .select("items, updated_by, updated_at")
      .eq("id", id)
      .maybeSingle();

    if (!live) return;

    if (error) {
      // Keep showing the bundled content — a policy or network problem should
      // never blank out a page for a visitor.
      update(id, { loading: false, error: error.message });
      return;
    }

    applyRow(data);
  };

  void load();

  const channel = client
    .channel(`site-content-${id}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: CONTENT_TABLE, filter: `id=eq.${id}` },
      (payload) => {
        if (!live) return;

        if (payload.eventType === "DELETE") {
          applyRow(null);
          return;
        }

        // An insert or update carries the whole row, `items` included, so the
        // new content lands without another round trip. Anything unexpected
        // falls back to re-reading it.
        if (readRow(payload.new)?.["items"] !== undefined) applyRow(payload.new);
        else void load();
      },
    )
    .subscribe();

  return () => {
    live = false;
    void client.removeChannel(channel);
  };
}

/** Live content for one section. Safe to call during a server render. */
export function useSiteSection<K extends ContentSectionId>(id: K): SectionState<K> {
  const subscribe = useCallback((notify: () => void) => subscribeToSection(id, notify), [id]);
  const getSnapshot = useCallback(() => entryFor(id).state, [id]);
  const getServerSnapshot = useCallback(() => bundledStateFor(id), [id]);

  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return state as unknown as SectionState<K>;
}

export function useGalleryItems(): GalleryItem[] {
  return useSiteSection("gallery").items;
}

export function useRecentJobs(): RecentJob[] {
  return useSiteSection("recentJobs").items;
}

export function useSiteVideos(): SiteVideo[] {
  return useSiteSection("siteVideos").items;
}

export function useServices(): Service[] {
  return useSiteSection("services").items;
}

/**
 * The same items outside of React, for route loaders on the client.
 *
 * Whatever the store last saw, which is the published content on any page the
 * header has rendered — and the bundled fallback before that.
 */
export function getSectionItems<K extends ContentSectionId>(id: K): ContentShape[K] {
  return entryFor(id).state.items as ContentShape[K];
}

// --- writes ----------------------------------------------------------------

/** Saves a section and makes it live for everyone. */
export async function publishSection<K extends ContentSectionId>(
  id: K,
  items: ContentShape[K],
  actor: string,
): Promise<void> {
  const payload = (items as unknown as Record<string, unknown>[]).map(stripUndefined);

  // `updated_at` is set by the trigger in `supabase/schema.sql`, so a client
  // with a wrong clock cannot post-date an edit.
  const { error } = await requireSupabase()
    .from(CONTENT_TABLE)
    .upsert({ id, items: payload, updated_by: actor }, { onConflict: "id" });

  if (error) throw error;
}

/** Deletes the saved row so the section falls back to the bundled data. */
export async function resetSection(id: ContentSectionId): Promise<void> {
  const { error } = await requireSupabase().from(CONTENT_TABLE).delete().eq("id", id);
  if (error) throw error;
}

/** Optional fields are often left blank, and `undefined` is not valid JSON. */
function stripUndefined(item: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(item)) {
    if (value !== undefined) clean[key] = value;
  }
  return clean;
}

/** Postgres timestamps arrive as ISO strings over the wire. */
function readTimestamp(value: unknown): Date | null {
  if (typeof value !== "string" || !value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
