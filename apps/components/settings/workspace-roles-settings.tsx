"use client";

import * as React from "react";

import { SettingsSectionHeader } from "@/components/settings/settings-section-header";
import { describeRole } from "@/components/settings/settings-utils";
import { Badge } from "@/components/ui/badge";
import type { User, WorkspaceMember } from "@/lib/api/types";

const roleDefinitions = [
  { role: "owner", permissions: ["workspace:read", "workspace:write", "meeting:read", "meeting:write", "session:read", "session:write"] },
  { role: "admin", permissions: ["workspace:read", "meeting:read", "meeting:write", "session:read", "session:write"] },
  { role: "member", permissions: ["workspace:read", "meeting:read", "meeting:write", "session:read"] },
  { role: "guest", permissions: ["workspace:read"] },
];

interface WorkspaceRolesSettingsProps {
  currentUser: User | null;
  membership: WorkspaceMember | null;
}

export function WorkspaceRolesSettings({ currentUser, membership }: WorkspaceRolesSettingsProps) {
  return (
    <div className="space-y-6">
      <SettingsSectionHeader
        eyebrow="Workspace"
        title="Rôles et permissions"
        description="Vue lecture seule basée sur les rôles et permissions réellement émis par le backend."
      />
      <div className="rounded-md border border-white/10 bg-black/10 p-4 text-sm text-zinc-300">
        <p>Votre rôle courant: <span className="font-medium text-white">{membership?.role ?? "inconnu"}</span></p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(currentUser?.permissions ?? []).map((permission) => (
            <Badge key={permission} variant="outline" className="border-white/10 text-zinc-200">{permission}</Badge>
          ))}
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {roleDefinitions.map((definition) => (
          <div key={definition.role} className="rounded-md border border-white/10 bg-black/10 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold capitalize text-white">{definition.role}</h3>
              <Badge variant="outline" className="border-white/10 text-zinc-300">{definition.permissions.length} permissions</Badge>
            </div>
            <p className="mt-2 text-sm text-zinc-400">{describeRole(definition.role)}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {definition.permissions.map((permission) => (
                <Badge key={permission} variant="outline" className="border-white/10 text-zinc-200">{permission}</Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
