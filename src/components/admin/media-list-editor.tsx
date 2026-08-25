import { ArrowDown, ArrowUp, ExternalLink, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";

import {
  AdminButton,
  AdminInput,
  AdminLabel,
  AdminPanel,
  AdminTextarea,
  EmptyState,
  IconButton,
  Notice,
  PageHeader,
  SaveBar,
} from "@/components/admin/admin-ui";
import {
  AddMediaRow,
  MediaThumb,
  SingleMediaField,
  UPLOAD_LIMIT_HINT,
  type PickedMedia,
} from "@/components/admin/media-picker";
import type { MediaKind } from "@/data/site";
import type { ContentSectionId } from "@/lib/admin-access";
import { useAdminAuth } from "@/lib/admin-auth";
import {
  publishSection,
  resetSection,
  useSiteSection,
  type ContentShape,
} from "@/lib/site-content";
import { cn } from "@/lib/utils";

/** A text input shown on every item in the list. */
export interface MediaTextField {
  key: string;
  label: string;
  placeholder?: string;
  helper?: string;
  multiline?: boolean;
  /** Warn when it is left blank — used for gallery descriptions. */
  recommended?: boolean;
}

/** The list editor's working copy of an item. */
export interface EditableMedia {
  /** React key only. Never saved. */
  id: string;
  src: string;
  kind: MediaKind;
  poster: string;
  text: Record<string, string>;
}

let idCounter = 0;

export function newEditableId(): string {
  idCounter += 1;
  return `item-${idCounter}`;
}

export function makeEditable(
  picked: PickedMedia,
  text: Record<string, string> = {},
): EditableMedia {
  return { id: newEditableId(), src: picked.src, kind: picked.kind, poster: "", text };
}

interface MediaListEditorProps<K extends ContentSectionId> {
  section: K;
  title: string;
  description: string;
  affects: string;
  fields: MediaTextField[];
  toEditable: (item: ContentShape[K][number], index: number) => EditableMedia;
  fromEditable: (item: EditableMedia, index: number) => ContentShape[K][number];
  /** Turns a freshly uploaded file into a list entry. */
  fromPicked: (picked: PickedMedia, index: number) => EditableMedia;
  previewAspect?: string;
  addLabel?: string;
  /** Videos can carry a still frame. Off for sections that never show one. */
  allowPoster?: boolean;
  /** Hide add and remove for sections with a fixed number of slots. */
  fixedLength?: boolean;
  emptyTitle: string;
  emptyBody: string;
  children?: ReactNode;
}

/**
 * The shared editor behind Gallery, Recent jobs and On site videos.
 *
 * Edits are local until Save is pressed, so a half-finished change never
 * reaches the live site. If someone else saves the same section while there are
 * unsaved edits open, the incoming version is held back and flagged rather than
 * quietly overwriting what is on screen.
 */
export function MediaListEditor<K extends ContentSectionId>({
  section,
  title,
  description,
  affects,
  fields,
  toEditable,
  fromEditable,
  fromPicked,
  previewAspect = "aspect-[4/3]",
  addLabel = "Upload photos or videos",
  allowPoster = true,
  fixedLength = false,
  emptyTitle,
  emptyBody,
  children,
}: MediaListEditorProps<K>) {
  const { profile, isOwner } = useAdminAuth();
  const state = useSiteSection(section);
  const published = state.items;

  const [items, setItems] = useState<EditableMedia[]>(() => published.map(toEditable));
  const [baseline, setBaseline] = useState(() => fingerprint(published.map(toEditable)));
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState(false);

  const current = fingerprint(items);
  const dirty = current !== baseline;

  // The effect below must not clobber unsaved work, and `dirty` is derived, so
  // it is read through a ref instead of becoming a dependency.
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  useEffect(() => {
    if (dirtyRef.current) {
      setConflict(true);
      return;
    }

    const next = published.map(toEditable);
    setItems(next);
    setBaseline(fingerprint(next));
    setConflict(false);
  }, [published, toEditable]);

  const missingText = useMemo(() => {
    const recommended = fields.filter((field) => field.recommended);
    if (recommended.length === 0) return 0;

    return items.filter((item) => recommended.some((field) => !(item.text[field.key] ?? "").trim()))
      .length;
  }, [items, fields]);

  function mutate(next: EditableMedia[]) {
    setItems(next);
  }

  function updateItem(id: string, patch: Partial<EditableMedia>) {
    mutate(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function updateText(id: string, key: string, value: string) {
    mutate(
      items.map((item) =>
        item.id === id ? { ...item, text: { ...item.text, [key]: value } } : item,
      ),
    );
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    const item = items[index];
    const swap = items[target];
    if (!item || !swap) return;

    const next = [...items];
    next[index] = swap;
    next[target] = item;
    mutate(next);
  }

  function remove(id: string) {
    mutate(items.filter((item) => item.id !== id));
  }

  function add(picked: PickedMedia[]) {
    mutate([...items, ...picked.map((entry, offset) => fromPicked(entry, items.length + offset))]);
  }

  async function save() {
    if (items.some((item) => !item.src.trim()) && !fixedLength) {
      toast.error("Every entry needs a file. Remove the empty ones or choose a file for them.");
      return;
    }

    if (items.length === 0 && published.length > 0) {
      const confirmed = window.confirm(
        `This removes all ${published.length} entries from the live site. Are you sure?`,
      );
      if (!confirmed) return;
    }

    setSaving(true);
    try {
      const payload = items.map(fromEditable) as unknown as ContentShape[K];
      await publishSection(section, payload, profile?.username ?? "admin");
      setBaseline(fingerprint(items));
      setConflict(false);
      toast.success("Saved. The site is updated.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save. Check your connection and retry.",
      );
    } finally {
      setSaving(false);
    }
  }

  function discard() {
    const next = published.map(toEditable);
    setItems(next);
    setBaseline(fingerprint(next));
    setConflict(false);
  }

  async function restoreDefaults() {
    const confirmed = window.confirm(
      "This throws away the saved version and puts back what the site shipped with. Continue?",
    );
    if (!confirmed) return;

    setSaving(true);
    try {
      await resetSection(section);
      toast.success("Put back to the original content.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not reset this section.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Editing"
        title={title}
        description={description}
        affects={affects}
        actions={
          isOwner && state.source === "published" ? (
            <AdminButton size="sm" variant="ghost" onClick={() => void restoreDefaults()}>
              <RotateCcw className="h-3.5 w-3.5" />
              Original content
            </AdminButton>
          ) : null
        }
      />

      <div className="mt-6 space-y-4">
        {children}

        {state.error ? (
          <Notice tone="danger" title="Could not load the saved version">
            {state.error}
          </Notice>
        ) : null}

        {conflict ? (
          <Notice tone="warning" title="Someone else saved this section">
            You have unsaved changes, so the newer version is being held back. Press Discard to load
            it, or Save to publish yours over the top.
          </Notice>
        ) : null}

        {state.source === "bundled" && !state.loading ? (
          <Notice tone="info">
            Showing the content the site shipped with. The first save publishes your own version.
          </Notice>
        ) : null}

        {missingText > 0 ? (
          <Notice tone="warning">
            {missingText === 1 ? "One entry has" : `${missingText} entries have`} no description.
            Screen readers and Google use it, so it is worth filling in.
          </Notice>
        ) : null}

        {!fixedLength ? (
          <AdminPanel className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <AdminLabel>Add to this section</AdminLabel>
                <p className="mt-1 text-xs text-muted-foreground">{UPLOAD_LIMIT_HINT}</p>
              </div>
              <AddMediaRow folder={section} onPicked={add} uploadLabel={addLabel} />
            </div>
          </AdminPanel>
        ) : null}

        {items.length === 0 ? (
          <EmptyState title={emptyTitle}>{emptyBody}</EmptyState>
        ) : (
          <ul className="space-y-3">
            {items.map((item, index) => (
              <li key={item.id}>
                <AdminPanel className="p-3 sm:p-4">
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <div className="flex items-start gap-3 sm:w-44 sm:shrink-0">
                      <span className="w-6 shrink-0 pt-1 text-center text-[0.7rem] font-bold tracking-[0.1em] text-muted-foreground">
                        {index + 1}
                      </span>
                      <MediaThumb
                        src={item.src}
                        kind={item.kind}
                        poster={item.poster || undefined}
                        className={cn("w-full rounded-sm border border-border", previewAspect)}
                      />
                    </div>

                    <div className="min-w-0 flex-1 space-y-3">
                      {fields.map((field) => {
                        const value = item.text[field.key] ?? "";
                        const warn = field.recommended === true && !value.trim();
                        const inputId = `${item.id}-${field.key}`;

                        return (
                          <div key={field.key} className="space-y-1.5">
                            <AdminLabel htmlFor={inputId}>{field.label}</AdminLabel>
                            {field.multiline ? (
                              <AdminTextarea
                                id={inputId}
                                value={value}
                                placeholder={field.placeholder}
                                onChange={(event) =>
                                  updateText(item.id, field.key, event.target.value)
                                }
                              />
                            ) : (
                              <AdminInput
                                id={inputId}
                                value={value}
                                placeholder={field.placeholder}
                                onChange={(event) =>
                                  updateText(item.id, field.key, event.target.value)
                                }
                                className={cn(warn && "border-primary/60")}
                              />
                            )}
                            {field.helper ? (
                              <p className="text-xs text-muted-foreground">{field.helper}</p>
                            ) : null}
                          </div>
                        );
                      })}

                      {fixedLength ? (
                        <SingleMediaField
                          label="Video or photo"
                          value={item.src}
                          kind={item.kind}
                          folder={section}
                          aspect="aspect-video"
                          onChange={(picked) =>
                            updateItem(item.id, {
                              src: picked?.src ?? "",
                              kind: picked?.kind ?? item.kind,
                            })
                          }
                        />
                      ) : null}

                      {allowPoster && item.kind === "video" ? (
                        <SingleMediaField
                          label="Thumbnail (optional)"
                          helper="Shown before the video plays. Leave empty to use the first frame."
                          value={item.poster}
                          kind="image"
                          folder={`${section}-thumbnails`}
                          aspect={previewAspect}
                          onChange={(picked) => updateItem(item.id, { poster: picked?.src ?? "" })}
                        />
                      ) : null}
                    </div>

                    <div className="flex items-start gap-2 sm:flex-col">
                      <IconButton
                        label="Move up"
                        onClick={() => move(index, -1)}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </IconButton>
                      <IconButton
                        label="Move down"
                        onClick={() => move(index, 1)}
                        disabled={index === items.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </IconButton>
                      {item.src ? (
                        <a
                          href={item.src}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Open the file in a new tab"
                          title="Open the file in a new tab"
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-border bg-card text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      ) : null}
                      {!fixedLength ? (
                        <IconButton
                          label="Remove from this section"
                          onClick={() => remove(item.id)}
                          className="hover:border-destructive/50 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </IconButton>
                      ) : null}
                    </div>
                  </div>
                </AdminPanel>
              </li>
            ))}
          </ul>
        )}

        {state.updatedAt && !dirty ? (
          <p className="text-xs text-muted-foreground">
            Last saved {formatWhen(state.updatedAt)}
            {state.updatedBy ? ` by ${state.updatedBy}` : ""}.
          </p>
        ) : null}
      </div>

      <SaveBar
        dirty={dirty}
        saving={saving}
        summary={summarise(items.length, published.length)}
        onSave={() => void save()}
        onDiscard={discard}
      />
    </div>
  );
}

/** Identity of the list as saved — the local `id`s are deliberately left out. */
function fingerprint(items: EditableMedia[]): string {
  return JSON.stringify(items.map((item) => [item.src, item.kind, item.poster, item.text]));
}

function summarise(next: number, current: number): string {
  if (next > current) return `${next - current} added · unsaved`;
  if (next < current) return `${current - next} removed · unsaved`;
  return "Unsaved changes";
}

export function formatWhen(date: Date): string {
  const minutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
