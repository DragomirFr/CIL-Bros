/**
 * Reading published content during a server render, over the Supabase REST API.
 *
 * The live store in `site-content.ts` is a browser thing: it opens a realtime
 * channel and pushes updates into React. A server render has no channel and
 * cannot wait for one, but two places still need the published content on the
 * server —
 *
 *   - `/services/$slug`, so a service added in the admin resolves instead of
 *     returning 404, and its title and description reach the crawler; and
 *   - `/sitemap.xml`, so the URL list matches the site.
 *
 * REST is used rather than the SDK to keep the Supabase client out of the worker.
 * Reads are public (see `supabase/schema.sql`), so the anon key is all it takes.
 * Anything that goes wrong — no project configured, a network blip, a slow
 * response, a malformed row — falls back to the bundled content, because a page
 * that renders yesterday's services beats a page that does not render.
 */
import type { ContentSectionId } from "@/lib/admin-access";
import {
  bundledContent,
  CONTENT_TABLE,
  resolveSection,
  type ContentShape,
} from "@/lib/content-schema";

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL ?? "").replace(/\/+$/, "");
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

/** Long enough for a cold read, short enough to not hold up a page. */
const TIMEOUT_MS = 2_500;

/**
 * How long a fetched section is reused within one server instance.
 *
 * Postgres is quick, but a busy page should not make a request per visitor. Ten
 * seconds keeps an edit feeling immediate while collapsing a burst of traffic
 * into one read.
 */
const CACHE_MS = 10_000;

interface CacheEntry {
  expires: number;
  value: Promise<unknown[]>;
}

const cache = new Map<ContentSectionId, CacheEntry>();

/**
 * The published items for a section, or the bundled fallback.
 *
 * Safe to call from a loader that also runs in the browser, though the client
 * has `getSectionItems` for that and will not need the round trip.
 */
export async function fetchSectionItems<K extends ContentSectionId>(
  id: K,
): Promise<ContentShape[K]> {
  if (!SUPABASE_URL || !ANON_KEY) return bundledContent[id];

  const now = Date.now();
  const cached = cache.get(id);
  if (cached && cached.expires > now) {
    return (await cached.value) as unknown as ContentShape[K];
  }

  const pending = loadSection(id);
  cache.set(id, { expires: now + CACHE_MS, value: pending });

  try {
    return (await pending) as unknown as ContentShape[K];
  } catch {
    // Never let a failed read stick around as a cached rejection.
    cache.delete(id);
    return bundledContent[id];
  }
}

async function loadSection<K extends ContentSectionId>(id: K): Promise<ContentShape[K]> {
  const url =
    `${SUPABASE_URL}/rest/v1/${CONTENT_TABLE}` +
    `?id=eq.${encodeURIComponent(id)}&select=items&limit=1`;

  try {
    const response = await fetch(url, {
      headers: {
        apikey: ANON_KEY,
        authorization: `Bearer ${ANON_KEY}`,
        accept: "application/json",
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) return bundledContent[id];

    // PostgREST answers a filtered select with an array — empty for a section
    // nobody has saved yet. `items` is jsonb, so it arrives as plain JSON and
    // needs no unwrapping before the normalisers in `content-schema.ts`.
    const body: unknown = await response.json();
    const first = Array.isArray(body) ? body[0] : null;
    const raw =
      first && typeof first === "object" ? (first as Record<string, unknown>)["items"] : null;

    const { items } = resolveSection(id, raw);
    return items;
  } catch {
    return bundledContent[id];
  }
}
