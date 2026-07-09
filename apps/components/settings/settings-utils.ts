"use client";

import type { User, Workspace, WorkspaceMember, WorkspaceMemberRole } from "@/lib/api/types";

export type SettingsSection =
  | "profile"
  | "appearance"
  | "notifications"
  | "media"
  | "security"
  | "sessions"
  | "workspace"
  | "sso"
  | "members"
  | "roles"
  | "audit"
  | "danger";

export interface SettingsNavGroup {
  label: string;
  items: Array<{ id: SettingsSection; label: string; description: string }>;
}

export const DEFAULT_SETTINGS_SECTION: SettingsSection = "profile";

export const settingsNavigation: SettingsNavGroup[] = [
  {
    label: "Personnel",
    items: [
      { id: "profile", label: "Profil", description: "Compte, avatar et présence" },
      { id: "appearance", label: "Apparence", description: "Thème, langue et densité" },
      { id: "notifications", label: "Notifications", description: "Préférences de réception" },
      { id: "media", label: "Audio vidéo", description: "Caméra, micro et sortie audio" },
      { id: "security", label: "Sécurité", description: "Mot de passe et vérification" },
      { id: "sessions", label: "Sessions", description: "Appareils connectés" },
    ],
  },
  {
    label: "Workspace",
    items: [
      { id: "workspace", label: "Général", description: "Nom, slug et visibilité" },
      { id: "sso", label: "SSO", description: "Authentification externe du workspace" },
      { id: "members", label: "Membres", description: "Accès et provisioning" },
      { id: "roles", label: "Rôles", description: "Permissions effectives" },
      { id: "audit", label: "Audit", description: "Journal du workspace" },
      { id: "danger", label: "Zone danger", description: "Actions destructives" },
    ],
  },
];

const validSections = new Set<SettingsSection>(settingsNavigation.flatMap((group) => group.items.map((item) => item.id)));

export function parseSettingsSection(value: string | null | undefined): SettingsSection {
  if (value && validSections.has(value as SettingsSection)) {
    return value as SettingsSection;
  }
  return DEFAULT_SETTINGS_SECTION;
}

export function buildSettingsHref(section: SettingsSection, searchParams: URLSearchParams | null): string {
  const nextParams = new URLSearchParams(searchParams?.toString() ?? "");
  nextParams.set("section", section);
  return `/settings?${nextParams.toString()}`;
}

export function getInitials(name: string | undefined, email: string | undefined): string {
  const source = (name || email || "?").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function maskIp(value: string | undefined): string {
  if (!value) {
    return "Masquée";
  }
  if (value.includes(".")) {
    const parts = value.split(".");
    return `${parts[0]}.${parts[1]}.***.***`;
  }
  if (value.includes(":")) {
    const parts = value.split(":");
    return `${parts.slice(0, 2).join(":")}:****`;
  }
  return "Masquée";
}

export function getWorkspaceMembership(user: User | null, members: WorkspaceMember[], workspace: Workspace | null): WorkspaceMember | null {
  if (!user || !workspace) {
    return null;
  }
  const membership = members.find((member) => member.userId === user.id && member.workspaceId === workspace.id);
  if (membership) {
    return membership;
  }
  if (workspace.ownerId === user.id) {
    return {
      id: `owner:${workspace.id}:${user.id}`,
      workspaceId: workspace.id,
      userId: user.id,
      role: "owner",
      joinedAt: workspace.createdAt,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
      displayName: user.displayName,
      email: user.email,
      avatarUrl: user.avatarUrl,
      status: user.status,
      presenceStatus: user.presenceStatus,
    };
  }
  return null;
}

export function canManageWorkspace(user: User | null, membership: WorkspaceMember | null): boolean {
  return Boolean(user?.permissions?.includes("workspace:write") || membership?.role === "owner" || membership?.role === "admin");
}

export function canAccessSettings(user: User | null, workspace: Workspace | null): boolean {
  if (!user) {
    return false;
  }

  return Boolean(
    user.permissions?.includes("workspace:write") ||
      user.roles?.includes("owner") ||
      user.roles?.includes("admin") ||
      workspace?.ownerId === user.id
  );
}

export function canManageMembers(user: User | null, membership: WorkspaceMember | null): boolean {
  return canManageWorkspace(user, membership);
}

export function canAssignRole(actorRole: string | undefined, targetRole: WorkspaceMemberRole): boolean {
  if (!actorRole) {
    return false;
  }
  if (targetRole === "owner") {
    return actorRole === "owner";
  }
  return actorRole === "owner" || actorRole === "admin";
}

export function canReadAuditLogs(user: User | null, membership: WorkspaceMember | null): boolean {
  return Boolean(user?.permissions?.includes("audit:read") || membership?.role === "owner" || membership?.role === "admin");
}

export function canDeleteWorkspace(user: User | null, membership: WorkspaceMember | null): boolean {
  return Boolean(user?.permissions?.includes("workspace:write") && membership?.role === "owner") || membership?.role === "owner";
}

export function describeRole(role: string): string {
  switch (role) {
    case "owner":
      return "Contrôle total du workspace et des rôles sensibles.";
    case "admin":
      return "Administration opérationnelle sans propriété finale.";
    case "member":
      return "Accès standard à la collaboration et aux réunions.";
    case "guest":
      return "Accès limité, adapté aux intervenants ponctuels.";
    default:
      return "Rôle non documenté.";
  }
}
