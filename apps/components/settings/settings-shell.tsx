"use client";

import * as React from "react";

import { Settings2 } from "lucide-react";

import { WorkspaceHeader } from "@/components/platform/workspace-header";
import { SettingsNavigation } from "@/components/settings/settings-navigation";
import type { SettingsSection } from "@/components/settings/settings-utils";
import type { Workspace } from "@/lib/api/types";

interface SettingsShellProps {
  section: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
  workspace: Workspace | null;
  children: React.ReactNode;
}

export function SettingsShell({ section, onSectionChange, workspace, children }: SettingsShellProps) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-[#232426]">
      <WorkspaceHeader
        title="Paramètres"
        description={workspace ? `Workspace actif · ${workspace.name}` : "Console de compte et d’administration"}
        icon={Settings2}
      />

      <div className="min-h-0 flex-1 overflow-auto p-4">
        <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
          <SettingsNavigation section={section} onSectionChange={onSectionChange} />
          <div className="min-w-0 rounded-md border border-white/10 bg-[#292a2c] p-4 sm:p-5">{children}</div>
        </div>
      </div>
    </div>
  );
}
