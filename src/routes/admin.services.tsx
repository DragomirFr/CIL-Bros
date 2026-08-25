import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { RequirePermission } from "@/components/admin/admin-guard";
import {
  AdminButton,
  AdminInput,
  AdminPanel,
  AdminTextarea,
  EmptyState,
  Field,
  IconButton,
  Notice,
  PageHeader,
  SaveBar,
} from "@/components/admin/admin-ui";
import { formatWhen } from "@/components/admin/media-list-editor";
import { SingleMediaField } from "@/components/admin/media-picker";
import type { Service } from "@/data/site";
import { useAdminAuth } from "@/lib/admin-auth";
import {
  numberLabel,
  publishSection,
  resetSection,
  slugify,
  useSiteSection,
} from "@/lib/site-content";

export const Route = createFileRoute("/admin/services")({
  component: ServicesAdmin,
});

interface EditableService {
  /** React key only. Never saved. */
  id: string;
  slug: string;
  title: string;
  text: string;
  image: string;
  /** The slug this service was published under. Empty for a new one. */
  originalSlug: string;
}

let idCounter = 0;

function nextId(): string {
  idCounter += 1;
  return `service-${idCounter}`;
}

function toEditable(service: Service): EditableService {
  return {
    id: nextId(),
    slug: service.slug,
    title: service.title,
    text: service.text,
    image: service.image ?? "",
    originalSlug: service.slug,
  };
}

function fromEditable(service: EditableService, index: number): Service {
  const next: Service = {
    // The 01 / 02 labels come from the position, so reordering renumbers them.
    n: numberLabel(index),
    slug: slugify(service.slug || service.title),
    title: service.title.trim(),
    text: service.text.trim(),
  };

  const image = service.image.trim();
  if (image) next.image = image;

  return next;
}

function fingerprint(items: EditableService[]): string {
  return JSON.stringify(items.map((item) => [item.slug, item.title, item.text, item.image]));
}

function ServicesAdmin() {
  return (
    <RequirePermission permission="services" label="Services">
      <ServicesEditor />
    </RequirePermission>
  );
}

/**
 * Services are the one section that is more than media: each one owns a page at
 * /services/<slug>, plus an entry in the menu, the footer and the sitemap. So
 * this editor is stricter than the gallery — no duplicate slugs, nothing
 * untitled, and never zero services.
 */
function ServicesEditor() {
  const { profile, isOwner } = useAdminAuth();
  const state = useSiteSection("services");
  const published = state.items;

  const [items, setItems] = useState<EditableService[]>(() => published.map(toEditable));
  const [baseline, setBaseline] = useState(() => fingerprint(published.map(toEditable)));
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState(false);

  const dirty = fingerprint(items) !== baseline;
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
  }, [published]);

  const slugCounts = new Map<string, number>();
  for (const item of items) {
    const slug = slugify(item.slug || item.title);
    slugCounts.set(slug, (slugCounts.get(slug) ?? 0) + 1);
  }

  function update(id: string, patch: Partial<EditableService>) {
    setItems(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  /** Keeps the slug following the title until someone edits the slug itself. */
  function updateTitle(item: EditableService, title: string) {
    const followed = item.slug === slugify(item.title) || item.slug === "";
    update(item.id, followed ? { title, slug: slugify(title) } : { title });
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    const item = items[index];
    const swap = items[target];
    if (!item || !swap) return;

    const next = [...items];
    next[index] = swap;
    next[target] = item;
    setItems(next);
  }

  function remove(item: EditableService) {
    if (items.length === 1) {
      toast.error("Keep at least one service — the menu and the footer are built from this list.");
      return;
    }

    const label = item.title.trim() || "this service";
    const confirmed = window.confirm(
      `Remove ${label}? Its page at /services/${slugify(item.slug || item.title) || "…"} will stop working.`,
    );
    if (!confirmed) return;

    setItems(items.filter((entry) => entry.id !== item.id));
  }

  function add() {
    setItems([
      ...items,
      { id: nextId(), slug: "", title: "", text: "", image: "", originalSlug: "" },
    ]);
  }

  async function save() {
    const untitled = items.filter((item) => !item.title.trim()).length;
    if (untitled > 0) {
      toast.error("Every service needs a name.");
      return;
    }

    const duplicates = [...slugCounts.entries()].filter(([, count]) => count > 1);
    if (duplicates.length > 0) {
      toast.error(
        "Two services cannot share the same web address. Change one of the highlighted ones.",
      );
      return;
    }

    if (items.some((item) => !slugify(item.slug || item.title))) {
      toast.error("A service name needs at least one letter or number.");
      return;
    }

    if (items.length === 0) {
      toast.error("Add at least one service before saving.");
      return;
    }

    setSaving(true);
    try {
      await publishSection("services", items.map(fromEditable), profile?.username ?? "admin");
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
      "This throws away the saved version and puts back the services the site shipped with. Continue?",
    );
    if (!confirmed) return;

    setSaving(true);
    try {
      await resetSection("services");
      toast.success("Put back to the original services.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not reset this section.");
    } finally {
      setSaving(false);
    }
  }

  // Only flags services that were already live — a brand new one is not a rename.
  const renamed = items.filter(
    (item) => item.originalSlug && slugify(item.slug || item.title) !== item.originalSlug,
  );

  return (
    <div>
      <PageHeader
        eyebrow="Editing"
        title="Services"
        description="The tiles under What we do, and the page behind each one."
        affects="The What we do grid, every /services page, the menu and the footer"
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
            Showing the services the site shipped with. The first save publishes your own version.
          </Notice>
        ) : null}

        {renamed.length > 0 ? (
          <Notice tone="warning" title="Web addresses are changing">
            {renamed.length === 1 ? "One service gets" : `${renamed.length} services get`} a new
            address when you save. Old links to the previous address will stop working, so only do
            this if you mean to.
          </Notice>
        ) : null}

        {items.length === 0 ? (
          <EmptyState title="No services">
            The What we do grid, the menu and the footer are built from this list. Add at least one.
          </EmptyState>
        ) : (
          <ul className="space-y-3">
            {items.map((item, index) => {
              const slug = slugify(item.slug || item.title);
              const duplicate = (slugCounts.get(slug) ?? 0) > 1;

              return (
                <li key={item.id}>
                  <AdminPanel className="p-4">
                    <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
                      <p className="font-display text-sm uppercase">
                        <span className="text-primary">{numberLabel(index)}</span>{" "}
                        {item.title.trim() || "New service"}
                      </p>
                      <div className="flex items-center gap-2">
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
                        <IconButton
                          label="Remove this service"
                          onClick={() => remove(item)}
                          className="hover:border-destructive/50 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </IconButton>
                      </div>
                    </div>

                    <div className="mt-4 space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Name" htmlFor={`${item.id}-title`}>
                          <AdminInput
                            id={`${item.id}-title`}
                            value={item.title}
                            placeholder="Power floating"
                            onChange={(event) => updateTitle(item, event.target.value)}
                          />
                        </Field>

                        <Field
                          label="Web address"
                          htmlFor={`${item.id}-slug`}
                          helper={
                            slug
                              ? `cilbrosconstruction.com/services/${slug}`
                              : "Filled in from the name."
                          }
                        >
                          <AdminInput
                            id={`${item.id}-slug`}
                            value={item.slug}
                            placeholder="power-floating"
                            spellCheck={false}
                            onChange={(event) => update(item.id, { slug: event.target.value })}
                            className={duplicate ? "border-destructive" : undefined}
                          />
                        </Field>
                      </div>

                      {duplicate ? (
                        <Notice tone="danger">
                          Another service already uses this address. Give one of them a different
                          name or address.
                        </Notice>
                      ) : null}

                      <Field
                        label="Description"
                        htmlFor={`${item.id}-text`}
                        helper="One or two sentences. Shown on the tile and at the top of the service page."
                      >
                        <AdminTextarea
                          id={`${item.id}-text`}
                          value={item.text}
                          placeholder="Beams set and levelled to specification for solid structural support."
                          onChange={(event) => update(item.id, { text: event.target.value })}
                        />
                      </Field>

                      <SingleMediaField
                        label="Photo"
                        helper="Shown on the service page. A wide photo of this kind of work suits it best."
                        value={item.image}
                        kind="image"
                        folder="services"
                        onChange={(picked) => update(item.id, { image: picked?.src ?? "" })}
                      />
                    </div>
                  </AdminPanel>
                </li>
              );
            })}
          </ul>
        )}

        <AdminButton onClick={add}>
          <Plus className="h-3.5 w-3.5" />
          Add a service
        </AdminButton>

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
        summary={
          items.length === published.length
            ? "Unsaved changes"
            : `${items.length} service${items.length === 1 ? "" : "s"} · unsaved`
        }
        onSave={() => void save()}
        onDiscard={discard}
      />
    </div>
  );
}
