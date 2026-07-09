"use client";

import * as React from "react";
import { Activity, FileText, HardDrive, MessageSquare, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";
import { getHomeStats } from "@/lib/api/platform";
import type { HomeStats } from "@/lib/api/platform";

function StatCard({ icon: Icon, label, value, sub }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; sub?: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg">
          <Icon className="text-muted-foreground size-5" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-muted-foreground text-sm">{label}</span>
          <span className="text-2xl font-semibold tracking-tight">{value}</span>
          {sub && <span className="text-muted-foreground text-xs">{sub}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityRow({ item }: { item: HomeStats["recentActivity"][0] }) {
  const timeAgo = formatTimeAgo(item.createdAt);
  return (
    <div className="flex items-start gap-3 py-3">
      <div className={`mt-0.5 size-2 shrink-0 rounded-full ${item.isRead ? "bg-muted-foreground/30" : "bg-primary"}`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{item.title}</p>
        <p className="text-muted-foreground text-xs truncate">{item.message}</p>
      </div>
      <span className="text-muted-foreground shrink-0 text-xs">{timeAgo}</span>
    </div>
  );
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days}j`;
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

function HomeSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="py-5">
              <div className="flex items-center gap-4">
                <Skeleton className="size-10 rounded-lg" />
                <div className="flex flex-col gap-1.5 flex-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-7 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-6 w-32" />
      <Card>
        <CardContent className="space-y-1 py-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default function HomePage() {
  const [stats, setStats] = React.useState<HomeStats | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getHomeStats()
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur de chargement"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <HomeSkeleton />;

  if (error) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Activity className="size-5" />
          </EmptyMedia>
          <EmptyTitle>Impossible de charger le tableau de bord</EmptyTitle>
          <EmptyDescription>{error}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (!stats) return null;

  const storageGb = (stats.storageUsed / 1073741824).toFixed(1);
  const storageLimitGb = (stats.storageLimit / 1073741824).toFixed(1);
  const storagePercent = stats.storageLimit > 0 ? Math.round((stats.storageUsed / stats.storageLimit) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground text-sm">Vue d&apos;ensemble de votre activité</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={Users} label="Projets" value={stats.totalProjects} />
        <StatCard icon={FileText} label="Tâches" value={`${stats.completedTasks}/${stats.totalTasks}`} sub={`${stats.totalTasks - stats.completedTasks} en cours`} />
        <StatCard icon={MessageSquare} label="Messages" value={stats.unreadMessages} sub={`${stats.totalMessages} total`} />
        <StatCard icon={HardDrive} label="Stockage" value={`${storageGb} Go`} sub={`${storagePercent}% utilisé sur ${storageLimitGb} Go`} />
        <StatCard icon={Users} label="Contacts" value={stats.totalContacts} />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Activité récente</h2>
        {stats.recentActivity.length > 0 && (
          <Badge variant="secondary">{stats.recentActivity.length} événements</Badge>
        )}
      </div>

      {stats.recentActivity.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <Empty>
              <EmptyHeader>
                <EmptyTitle>Aucune activité récente</EmptyTitle>
                <EmptyDescription>Les actions récentes apparaîtront ici.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="divide-y divide-border py-2">
            {stats.recentActivity.map((item) => (
              <ActivityRow key={item.id} item={item} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
