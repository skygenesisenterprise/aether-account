"use client";

import * as React from "react";
import { Globe, Laptop, LogIn, Monitor, Shield, ShieldCheck, Smartphone, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { getSecurityInfo } from "@/lib/api/platform";
import { authApi } from "@/lib/api";
import type { SecurityInfo, Device, LoginHistory } from "@/lib/api/platform";

function SecuritySkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 rounded-xl" />
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}

function DeviceIcon({ type }: { type: string }) {
  if (type === "mobile" || type === "tablet") return <Smartphone className="size-4" />;
  if (type === "desktop") return <Monitor className="size-4" />;
  return <Laptop className="size-4" />;
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
          <EmptyMedia variant="icon"><Shield className="size-5" /></EmptyMedia>
          <EmptyTitle>Impossible de charger les informations de sécurité</EmptyTitle>
          <EmptyDescription>{error}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sécurité et connexion</h1>
        <p className="text-muted-foreground text-sm">Gérez vos sessions actives et appareils connectés</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Authentification à deux facteurs</CardTitle>
              <CardDescription>Ajoutez une couche de sécurité supplémentaire à votre compte</CardDescription>
            </div>
            <ShieldCheck className={`size-8 ${data.twoFaEnabled ? "text-primary" : "text-muted-foreground"}`} />
          </div>
        </CardHeader>
        <CardContent>
          <Badge variant={data.twoFaEnabled ? "default" : "secondary"}>
            {data.twoFaEnabled ? "Activée" : "Désactivée"}
          </Badge>
        </CardContent>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Sessions actives ({data.sessions.length})</h2>
          {data.sessions.length > 1 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm"><Trash2 className="mr-2 size-4" />Déconnecter les autres</Button>
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
          <Card>
            <CardContent className="py-6">
              <p className="text-muted-foreground text-center text-sm">Aucune session active</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {data.sessions.map((session) => (
              <Card key={session.id}>
                <CardContent className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
                      <Monitor className="text-muted-foreground size-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{session.userAgent?.split(" ").slice(0, 2).join(" ") || "Navigateur inconnu"}</p>
                        {session.current && <Badge variant="default" className="text-[10px] px-1.5 py-0">Actuelle</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {maskIp(session.ipAddress)} · Dernière activité : {new Date(session.lastUsedAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                  {!session.current && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">Révoquer</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Révoquer cette session ?</AlertDialogTitle>
                          <AlertDialogDescription>L&apos;appareil sera déconnecté immédiatement.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleRevoke(session.id)}>Révoquer</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Appareils ({data.devices.length})</h2>
        {data.devices.length === 0 ? (
          <Card>
            <CardContent className="py-6">
              <p className="text-muted-foreground text-center text-sm">Aucun appareil enregistré</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {data.devices.map((device: Device) => (
              <Card key={device.id}>
                <CardContent className="flex items-center gap-3 py-3">
                  <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
                    <DeviceIcon type={device.type} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{device.os}{device.browser ? ` · ${device.browser}` : ""}</p>
                      {device.isCurrent && <Badge variant="default" className="text-[10px] px-1.5 py-0">Actuel</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {maskIp(device.ipAddress)}{device.location ? ` · ${device.location}` : ""}
                    </p>
                  </div>
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {new Date(device.lastActive).toLocaleDateString("fr-FR")}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Historique de connexion</h2>
        {data.loginHistory.length === 0 ? (
          <Card>
            <CardContent className="py-6">
              <p className="text-muted-foreground text-center text-sm">Aucun historique de connexion</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="divide-y divide-border py-2">
              {data.loginHistory.map((entry: LoginHistory) => (
                <div key={entry.id} className="flex items-center gap-3 py-3">
                  <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
                    <LogIn className="text-muted-foreground size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium capitalize">{entry.status}</p>
                      <Badge variant={entry.status === "success" ? "default" : "destructive"} className="text-[10px] px-1.5 py-0">
                        {entry.status === "success" ? "Succès" : entry.status === "failed" ? "Échec" : entry.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {entry.deviceType} · {maskIp(entry.ipAddress)}{entry.location ? ` · ${entry.location}` : ""}
                      {entry.twoFaUsed ? " · 2FA" : ""}
                    </p>
                  </div>
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {new Date(entry.timestamp).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
