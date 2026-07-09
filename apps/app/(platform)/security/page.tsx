"use client";

import * as React from "react";
import { Globe, Laptop, LogIn, Monitor, Shield, ShieldCheck, Smartphone, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { getSecurityInfo } from "@/lib/api/platform";
import { authApi } from "@/lib/api";
import type { SecurityInfo, Device, LoginHistory } from "@/lib/api/platform";

function SecuritySkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-36 rounded-lg bg-white/5" />
      <Skeleton className="h-20 rounded-xl bg-white/5" />
      <Skeleton className="h-5 w-32 rounded-lg bg-white/5" />
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-lg bg-white/5" />
        ))}
      </div>
      <Skeleton className="h-5 w-32 rounded-lg bg-white/5" />
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-lg bg-white/5" />
        ))}
      </div>
    </div>
  );
}

function DeviceIcon({ type }: { type: string }) {
  if (type === "mobile" || type === "tablet") return <Smartphone className="size-3.5" />;
  if (type === "desktop") return <Monitor className="size-3.5" />;
  return <Laptop className="size-3.5" />;
}

function maskIp(ip?: string): string {
  if (!ip) return "";
  if (ip.includes(":")) return ip.split(":").slice(0, 2).join(":") + ":...";
  return ip.replace(/\.\d+$/, ".xxx");
}

export default function SecurityPage() {
  const [data, setData] = React.useState<SecurityInfo | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getSecurityInfo()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur de chargement"))
      .finally(() => setLoading(false));
  }, []);

  const handleRevoke = async (sessionId: string) => {
    try {
      await authApi.revokeSession(sessionId);
      setData((prev) => prev ? { ...prev, sessions: prev.sessions.filter((s) => s.id !== sessionId) } : prev);
      toast({ title: "Session révoquée", description: "Cette session a été déconnectée." });
    } catch (e) {
      toast({ title: "Erreur", description: "Impossible de révoquer la session", variant: "destructive" });
    }
  };

  const handleLogoutAll = async () => {
    try {
      await authApi.logoutAll(true);
      toast({ title: "Déconnexion réussie", description: "Toutes les autres sessions ont été déconnectées." });
    } catch (e) {
      toast({ title: "Erreur", description: "Impossible de déconnecter les autres sessions", variant: "destructive" });
    }
  };

  if (loading) return <SecuritySkeleton />;

  if (error) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon"><Shield className="size-4" /></EmptyMedia>
          <EmptyTitle>Impossible de charger les informations de sécurité</EmptyTitle>
          <EmptyDescription>{error}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (!data) return null;

  return (
    <div className="mx-auto w-full max-w-5xl px-3 py-4 sm:px-4 sm:py-6">
      <div className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">Sécurité</h1>
        <p className="text-xs text-zinc-400 sm:text-sm">Gérez vos sessions actives et appareils connectés</p>
      </div>

      <div className="rounded-xl border border-white/6 bg-[#232426] p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-white">Authentification à deux facteurs</h2>
            <p className="text-xs text-zinc-500">Ajoutez une couche de sécurité supplémentaire à votre compte</p>
          </div>
          <ShieldCheck className={`size-6 ${data.twoFaEnabled ? "text-[#7775ff]" : "text-zinc-400"}`} />
        </div>
        <Badge variant={data.twoFaEnabled ? "default" : "secondary"} className="text-xs px-2 py-0.5">
          {data.twoFaEnabled ? "Activée" : "Désactivée"}
        </Badge>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white">Sessions actives ({data.sessions.length})</h2>
          {data.sessions.length > 1 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs h-7"><Trash2 className="mr-1.5 size-3.5" />Autres</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Déconnecter les autres sessions ?</AlertDialogTitle>
                  <AlertDialogDescription>Vous serez déconnecté de toutes vos autres sessions. Votre session actuelle restera active.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLogoutAll}>Déconnecter</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {data.sessions.length === 0 ? (
          <div className="rounded-xl border border-white/6 bg-[#232426] px-4 py-6 text-center mb-4">
            <p className="text-xs text-zinc-500">Aucune session active</p>
          </div>
        ) : (
          <div className="space-y-2 mb-4">
            {data.sessions.slice(0, 5).map((session) => (
              <div key={session.id} className="flex items-center justify-between rounded-lg border border-white/6 bg-[#232426] px-3 py-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/4 text-zinc-300">
                    <Monitor className="size-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium truncate text-zinc-200">{session.userAgent?.split(" ").slice(0, 2).join(" ") || "Navigateur inconnu"}</p>
                      {session.current && <Badge variant="default" className="text-[10px] px-1.5 py-0">Actuelle</Badge>}
                    </div>
                    <p className="text-xs text-zinc-500">
                      {maskIp(session.ipAddress)} · Dernière activité : {new Date(session.lastUsedAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
                {!session.current && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-xs h-6">Révoquer</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Révoquer cette session ?</AlertDialogTitle>
                        <AlertDialogDescription>L'appareil sera déconnecté immédiatement.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleRevoke(session.id)}>Révoquer</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-white mb-3">Appareils ({data.devices.length})</h2>
        {data.devices.length === 0 ? (
          <div className="rounded-xl border border-white/6 bg-[#232426] px-4 py-6 text-center mb-4">
            <p className="text-xs text-zinc-500">Aucun appareil enregistré</p>
          </div>
        ) : (
          <div className="space-y-2 mb-4">
            {data.devices.slice(0, 5).map((device: Device) => (
              <div key={device.id} className="flex items-center gap-3 rounded-lg border border-white/6 bg-[#232426] px-3 py-2.5">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/4 text-zinc-300">
                  <DeviceIcon type={device.type} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium text-zinc-200">{device.os}{device.browser ? ` · ${device.browser}` : ""}</p>
                    {device.isCurrent && <Badge variant="default" className="text-[10px] px-1.5 py-0">Actuel</Badge>}
                  </div>
                  <p className="text-xs text-zinc-500">
                    {maskIp(device.ipAddress)}{device.location ? ` · ${device.location}` : ""}
                  </p>
                </div>
                <span className="text-xs text-zinc-500 shrink-0">
                  {new Date(device.lastActive).toLocaleDateString("fr-FR")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-white mb-3">Historique de connexion</h2>
        {data.loginHistory.length === 0 ? (
          <div className="rounded-xl border border-white/6 bg-[#232426] px-4 py-6 text-center">
            <p className="text-xs text-zinc-500">Aucun historique de connexion</p>
          </div>
        ) : (
          <div className="rounded-xl border border-white/6 bg-[#232426]">
            <div className="divide-y divide-white/6 py-1">
              {data.loginHistory.slice(0, 5).map((entry: LoginHistory) => (
                <div key={entry.id} className="flex items-center gap-3 py-2.5 px-3">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/4 text-zinc-300">
                    <LogIn className="size-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium text-zinc-200 capitalize">{entry.status}</p>
                      <Badge variant={entry.status === "success" ? "default" : "destructive"} className="text-[10px] px-1.5 py-0">
                        {entry.status === "success" ? "Succès" : entry.status === "failed" ? "Échec" : entry.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-500">
                      {entry.deviceType} · {maskIp(entry.ipAddress)}{entry.location ? ` · ${entry.location}` : ""}
                      {entry.twoFaUsed ? " · 2FA" : ""}
                    </p>
                  </div>
                  <span className="text-xs text-zinc-500 shrink-0">
                    {new Date(entry.timestamp).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
