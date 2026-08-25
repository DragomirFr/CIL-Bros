import {
  FolderOpen,
  Hammer,
  Images,
  LayoutDashboard,
  Film,
  Clapperboard,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * Which parts of the site an admin account is allowed to change.
 *
 * These keys are the single source of truth: the sidebar, the permission
 * toggles on the Team page and the Supabase row-level security policies all key
 * off the same strings. Adding a section means adding a key here, a matching
 * route, and a row in `site_content` in `supabase/schema.sql`.
 */
export type PermissionKey = "gallery" | "recentJobs" | "siteVideos" | "services" | "media";

/** Row in the `site_content` table that a section edits. */
export type ContentSectionId = "gallery" | "recentJobs" | "siteVideos" | "services";

export type AdminRole = "owner" | "staff";

export interface AdminSection {
  key: PermissionKey;
  label: string;
  /** Shown in the sidebar tooltip and on the Team page next to each toggle. */
  description: string;
  /** Where it lives on the site, so the copy can say what it affects. */
  affects: string;
  to:
    | "/admin/gallery"
    | "/admin/recent-jobs"
    | "/admin/site-videos"
    | "/admin/services"
    | "/admin/media";
  icon: LucideIcon;
  contentRow?: ContentSectionId;
}

export const ADMIN_SECTIONS = [
  {
    key: "gallery",
    label: "Gallery",
    description: "Add, reorder and remove the photos and videos in the gallery.",
    affects: "The /gallery page and the Recent work grid on the home page",
    to: "/admin/gallery",
    icon: Images,
    contentRow: "gallery",
  },
  {
    key: "recentJobs",
    label: "Recent jobs",
    description: "Manage the Recent Jobs tiles on the home page.",
    affects: "The Recent Jobs section on the home page",
    to: "/admin/recent-jobs",
    icon: Clapperboard,
    contentRow: "recentJobs",
  },
  {
    key: "siteVideos",
    label: "On site videos",
    description: "Manage the clips shown under On site with us.",
    affects: "The On site with us row on the home page",
    to: "/admin/site-videos",
    icon: Film,
    contentRow: "siteVideos",
  },
  {
    key: "services",
    label: "Services",
    description: "Edit service names, descriptions and photos.",
    affects: "The What we do grid, every /services page, the menu and the footer",
    to: "/admin/services",
    icon: Hammer,
    contentRow: "services",
  },
  {
    key: "media",
    label: "Media library",
    description: "Upload files and delete ones the site no longer uses.",
    affects: "Storage shared by every section above",
    to: "/admin/media",
    icon: FolderOpen,
  },
] as const satisfies readonly AdminSection[];

export const PERMISSION_KEYS = ADMIN_SECTIONS.map((section) => section.key);

export const DASHBOARD_NAV = {
  label: "Overview",
  to: "/admin",
  icon: LayoutDashboard,
} as const;

export const TEAM_NAV = {
  label: "Team",
  to: "/admin/team",
  icon: Users,
  description: "Add accounts and choose what each person can see.",
} as const;

export type PermissionMap = Record<PermissionKey, boolean>;

/** Everything off — what an account gets before anyone grants it access. */
export function noPermissions(): PermissionMap {
  return { gallery: false, recentJobs: false, siteVideos: false, services: false, media: false };
}

/** Every switch on. The owner is always treated as having this. */
export function allPermissions(): PermissionMap {
  return { gallery: true, recentJobs: true, siteVideos: true, services: true, media: true };
}

/**
 * What a newly added staff account starts with: media and photo sections yes,
 * service copy no. The owner can change any of it on the Team page.
 */
export function defaultStaffPermissions(): PermissionMap {
  return { gallery: true, recentJobs: true, siteVideos: true, services: false, media: true };
}

/** Reads a permission out of an untrusted object, defaulting to off. */
export function readPermissions(raw: unknown): PermissionMap {
  const permissions = noPermissions();
  if (!raw || typeof raw !== "object") return permissions;

  for (const key of PERMISSION_KEYS) {
    permissions[key] = (raw as Record<string, unknown>)[key] === true;
  }

  return permissions;
}

export interface AdminProfile {
  /** Lowercased username. Doubles as the row id in the `admins` table. */
  id: string;
  /** As the person writes it — "Dragomir", "Igor". */
  username: string;
  role: AdminRole;
  permissions: PermissionMap;
  /** Set by the owner to switch an account off without deleting it. */
  disabled: boolean;
}

export function isOwner(profile: AdminProfile | null): boolean {
  return profile?.role === "owner";
}

/** The owner bypasses the switches; staff need the specific one. */
export function canEdit(profile: AdminProfile | null, key: PermissionKey): boolean {
  if (!profile || profile.disabled) return false;
  if (profile.role === "owner") return true;
  return profile.permissions[key];
}

/** Sections to show this account in the sidebar. */
export function visibleSections(profile: AdminProfile | null) {
  return ADMIN_SECTIONS.filter((section) => canEdit(profile, section.key));
}

/**
 * The `site_content` row a section edits, or undefined for the media library.
 *
 * `ADMIN_SECTIONS` is a const tuple so the routes stay literal-typed, which
 * means the entry without a `contentRow` has no such key at all. Going through
 * the widened interface keeps that detail out of the pages.
 */
export function contentRowFor(section: AdminSection): ContentSectionId | undefined {
  return section.contentRow;
}
