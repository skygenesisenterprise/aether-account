"use client";

import * as React from "react";

import { toast } from "sonner";

import { SettingsSectionHeader } from "@/components/settings/settings-section-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteWorkspace } from "@/lib/api/workspaces";
import type { Workspace } from "@/lib/api/types";

interface WorkspaceDangerSettingsProps {
  workspace: Workspace | null;
  canDelete: boolean;
  onWorkspaceDeleted: () => void;
}

export function WorkspaceDangerSettings({ workspace, canDelete, onWorkspaceDeleted }: WorkspaceDangerSettingsProps) {
  const [confirmation, setConfirmation] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  async function handleDelete() {
    if (!workspace) {
      return;
    }
    setSubmitting(true);
    try {
      await deleteWorkspace(workspace.id);
      toast.success("Workspace archivé.");
      onWorkspaceDeleted();
    } catch {
      toast.error("Suppression du workspace impossible.");
    } finally {
      setSubmitting(false);
      setOpen(false);
      setConfirmation("");
    }
  }

  return (
    <div className="space-y-6">
      <SettingsSectionHeader
        eyebrow="Workspace"
        title="Zone danger"
        description="Les actions ci-dessous modifient durablement l’accès ou l’existence du workspace."
      />
      <div className="space-y-4 rounded-md border border-rose-500/20 bg-rose-500/10 p-4">
        <div className="rounded-md border border-white/10 bg-black/10 p-4 text-sm text-zinc-300">
          <p className="font-medium text-white">Quitter le workspace</p>
          <p className="mt-1 text-zinc-400">Non supporté par le backend actuel. La règle de dernier owner doit être implémentée côté API avant exposition.</p>
        </div>
        <div className="rounded-md border border-white/10 bg-black/10 p-4 text-sm text-zinc-300">
          <p className="font-medium text-white">Transférer la propriété</p>
          <p className="mt-1 text-zinc-400">Non exposé dans cette version. Les rôles sensibles restent gérés par les owners actuels.</p>
        </div>
        <div className="rounded-md border border-white/10 bg-black/10 p-4 text-sm text-zinc-300">
          <p className="font-medium text-white">Supprimer le workspace</p>
          <p className="mt-1 text-zinc-400">Archive le workspace actif. Réservé à l’owner.</p>
          {canDelete ? (
            <Button type="button" variant="destructive" className="mt-3" onClick={() => setOpen(true)}>
              Supprimer {workspace?.name}
            </Button>
          ) : (
            <p className="mt-3 text-xs text-zinc-500">Seul l’owner peut supprimer ce workspace.</p>
          )}
        </div>
      </div>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le workspace</AlertDialogTitle>
            <AlertDialogDescription>Retapez le nom exact du workspace pour confirmer son archivage.</AlertDialogDescription>
          </AlertDialogHeader>
          <Input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder={workspace?.name} />
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDelete()} disabled={confirmation !== workspace?.name || submitting}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
