"use client";

import * as React from "react";
import { AppWindow, ExternalLink, Puzzle, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { listApplications, deleteApplication } from "@/lib/api";
import type { Application } from "@/lib/api";

function ApplicationsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-40 rounded-lg bg-white/5" />
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-lg bg-white/5" />
        ))}
      </div>
    </div>
  );
}

export default function ApplicationsPage() {
  const [apps, setApps] = React.useState<Application[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    listApplications("default")
      .then(setApps)
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur de chargement"))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (appId: string) => {
    try {
      await deleteApplication(appId);
      setApps((prev) => prev.filter((a) => a.id !== appId));
      toast({ title: "Application déconnectée", description: "L'application a été déconnectée de votre compte." });
    } catch (e) {
      toast({ title: "Erreur", description: "Impossible de déconnecter l'application", variant: "destructive" });
    }
  };

  if (loading) return <ApplicationsSkeleton />;

  if (error) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon"><Puzzle className="size-4" /></EmptyMedia>
          <EmptyTitle>Impossible de charger les applications</EmptyTitle>
          <EmptyDescription>{error}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-3 py-4 sm:px-4 sm:py-6">
      <div className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">Applications</h1>
        <p className="text-xs text-zinc-400 sm:text-sm">Gérez les applications connectées à votre compte</p>
      </div>

      {apps.length === 0 ? (
        <div className="rounded-xl border border-white/6 bg-[#232426] px-4 py-6 text-center">
          <p className="text-xs text-zinc-500 sm:text-sm">Aucune application connectée</p>
          <p className="text-xs text-zinc-600 mt-1">Les applications que vous autoriserez apparaîtront ici.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {apps.map((app) => (
            <div key={app.id} className="flex items-center justify-between rounded-lg border border-white/6 bg-[#232426] px-3 py-2.5 transition-colors hover:border-white/12 hover:bg-[#26272a]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/4 text-zinc-300">
                  <Puzzle className="size-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium truncate text-zinc-200 sm:text-sm">{app.name}</p>
                    <Badge variant={app.status === "active" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                      {app.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-500 truncate">{app.provider}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" asChild className="text-xs">
                  <a href="#" onClick={(e) => e.preventDefault()}><ExternalLink className="mr-1 size-3" />Ouvrir</a>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-7">
                      <Trash2 className="size-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Déconnecter {app.name} ?</AlertDialogTitle>
                      <AlertDialogDescription>Cette application n&apos;aura plus accès à votre compte. Vous pourrez la reconnecter à tout moment.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(app.id)}>Déconnecter</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
