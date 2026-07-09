"use client";

import * as React from "react";
import { AppWindow, ExternalLink, Puzzle, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { listApplications, deleteApplication } from "@/lib/api";
import type { Application } from "@/lib/api";

function ApplicationsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-56" />
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
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
          <EmptyMedia variant="icon"><Puzzle className="size-5" /></EmptyMedia>
          <EmptyTitle>Impossible de charger les applications</EmptyTitle>
          <EmptyDescription>{error}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Applications associées</h1>
        <p className="text-muted-foreground text-sm">Gérez les applications connectées à votre compte</p>
      </div>

      {apps.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><AppWindow className="size-5" /></EmptyMedia>
                <EmptyTitle>Aucune application connectée</EmptyTitle>
                <EmptyDescription>Les applications que vous autoriserez apparaîtront ici.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => (
            <Card key={app.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg">
                    <Puzzle className="text-muted-foreground size-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{app.name}</p>
                      <Badge variant={app.status === "active" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                        {app.status}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm truncate">{app.provider}</p>
                    <p className="text-muted-foreground text-xs">Connectée le {new Date(app.createdAt).toLocaleDateString("fr-FR")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="outline" size="sm" asChild>
                    <a href="#" onClick={(e) => e.preventDefault()}><ExternalLink className="mr-2 size-3" />Ouvrir</a>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon"><Trash2 className="size-4" /></Button>
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
