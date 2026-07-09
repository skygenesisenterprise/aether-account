"use client";

import * as React from "react";

import { SettingsSectionHeader } from "@/components/settings/settings-section-header";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { listAuditLogs } from "@/lib/api/audit";
import type { AuditLog, Workspace, WorkspaceMember } from "@/lib/api/types";

interface WorkspaceAuditSettingsProps {
  workspace: Workspace | null;
  canRead: boolean;
  members: WorkspaceMember[];
  errorMessage?: string | null;
}

export function WorkspaceAuditSettings({ workspace, canRead, members, errorMessage }: WorkspaceAuditSettingsProps) {
  const [items, setItems] = React.useState<AuditLog[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!workspace || !canRead) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await listAuditLogs(workspace.id, { limit: 50 });
      setItems(response.data);
      setError(null);
    } catch {
      setError("Impossible de charger le journal d’audit.");
    } finally {
      setLoading(false);
    }
  }, [canRead, workspace]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const actorMap = React.useMemo(() => new Map(members.map((member) => [member.userId, member.displayName ?? member.email ?? member.userId])), [members]);

  if (!canRead) {
    return (
      <div className="rounded-md border border-white/10 bg-black/10 p-4 text-sm text-zinc-400">
        {errorMessage ?? "Accès réservé aux owners et admins du workspace."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SettingsSectionHeader
        eyebrow="Workspace"
        title="Audit"
        description="Historique des événements récents pour le workspace actif."
        actions={<Button size="sm" variant="outline" onClick={() => void load()}>Réessayer</Button>}
      />
      {loading ? (
        <div className="text-sm text-zinc-400">Chargement du journal…</div>
      ) : error ? (
        <div className="rounded-md border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-100">{error}</div>
      ) : items.length === 0 ? (
        <Empty className="border border-white/10 bg-black/10">
          <EmptyHeader>
            <EmptyTitle>Aucun log</EmptyTitle>
            <EmptyDescription>Aucun événement d’audit n’a encore été remonté pour ce workspace.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-md border border-white/10 bg-black/10 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{item.action}</p>
                  <p className="mt-1 text-xs text-zinc-400">
                    Acteur: {actorMap.get(item.actorId) ?? item.actorId} · ressource {item.resourceType}/{item.resourceId}
                  </p>
                </div>
                <p className="text-xs text-zinc-500">{new Date(item.createdAt).toLocaleString("fr-FR")}</p>
              </div>
              {item.metadata ? (
                <pre className="mt-3 overflow-auto rounded-md border border-white/10 bg-[#232426] p-3 text-[11px] text-zinc-300">
                  {JSON.stringify(item.metadata, null, 2)}
                </pre>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
