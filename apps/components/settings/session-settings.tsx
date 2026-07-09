"use client";

import * as React from "react";
import { Laptop2, Loader2, LogOut, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { SettingsSectionHeader } from "@/components/settings/settings-section-header";
import { maskIp } from "@/components/settings/settings-utils";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { authApi } from "@/lib/api/auth";
import type { AuthSessionInfo } from "@/lib/api/types";

interface SessionSettingsProps {
  onLoggedOut: () => Promise<void>;
}

export function SessionSettings({ onLoggedOut }: SessionSettingsProps) {
  const [sessions, setSessions] = React.useState<AuthSessionInfo[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [pendingAction, setPendingAction] = React.useState<null | { type: "revoke" | "logout-others" | "logout-all"; sessionId?: string }>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const loadSessions = React.useCallback(async () => {
    setLoading(true);
    try {
      setSessions(await authApi.listSessions());
    } catch {
      toast.error("Impossible de charger les sessions.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  async function confirmAction() {
    if (!pendingAction) {
      return;
    }
    setSubmitting(true);
    try {
      if (pendingAction.type === "revoke" && pendingAction.sessionId) {
        const target = sessions.find((session) => session.id === pendingAction.sessionId);
        await authApi.revokeSession(pendingAction.sessionId);
        setSessions((current) => current.filter((session) => session.id !== pendingAction.sessionId));
        toast.success("Session révoquée.");
        if (target?.current) {
          await onLoggedOut();
        }
      } else if (pendingAction.type === "logout-others") {
        await authApi.logoutAll(true);
        toast.success("Toutes les autres sessions ont été révoquées.");
        await loadSessions();
      } else if (pendingAction.type === "logout-all") {
        await authApi.logoutAll(false);
        await onLoggedOut();
      }
    } catch {
      toast.error("Action sur les sessions impossible.");
    } finally {
      setSubmitting(false);
      setPendingAction(null);
    }
  }

  if (loading) {
    return <div className="text-sm text-zinc-400">Chargement des sessions…</div>;
  }

  return (
    <div className="space-y-6">
      <SettingsSectionHeader
        eyebrow="Personnel"
        title="Sessions"
        description="Gérez les appareils connectés au compte courant. Les IP sont masquées côté interface."
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setPendingAction({ type: "logout-others" })}>
              <ShieldAlert className="size-4" />
              Déconnecter les autres
            </Button>
            <Button size="sm" variant="destructive" onClick={() => setPendingAction({ type: "logout-all" })}>
              <LogOut className="size-4" />
              Tout déconnecter
            </Button>
          </div>
        }
      />
      {sessions.length === 0 ? (
        <Empty className="border border-white/10 bg-black/10">
          <EmptyHeader>
            <EmptyTitle>Aucune session</EmptyTitle>
            <EmptyDescription>Le compte ne remonte aucune session active.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div key={session.id} className="rounded-md border border-white/10 bg-black/10 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex items-start gap-3">
                  <span className="mt-0.5 rounded-md bg-violet-500/12 p-2 text-violet-200">
                    <Laptop2 className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium text-white">{session.userAgent || "Appareil non identifié"}</p>
                      {session.current ? <Badge className="border-emerald-400/20 bg-emerald-400/10 text-emerald-200">Session courante</Badge> : null}
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">IP {maskIp(session.ipAddress)}</p>
                    <p className="mt-2 text-xs text-zinc-400">
                      Créée le {new Date(session.createdAt).toLocaleString("fr-FR")} · dernière activité {new Date(session.lastUsedAt).toLocaleString("fr-FR")} · expiration {new Date(session.expiresAt).toLocaleString("fr-FR")}
                    </p>
                  </div>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setPendingAction({ type: "revoke", sessionId: session.id })}>
                  <Trash2 className="size-4" />
                  Révoquer
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={pendingAction !== null} onOpenChange={(open) => !open && setPendingAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer l’action</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.type === "revoke"
                ? "La session ciblée sera révoquée immédiatement."
                : pendingAction?.type === "logout-others"
                  ? "Toutes les autres sessions seront déconnectées."
                  : "Toutes les sessions du compte seront déconnectées, y compris la session courante."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmAction()} disabled={submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
