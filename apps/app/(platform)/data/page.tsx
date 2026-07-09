"use client";

import * as React from "react";
import { Database, Eye, FileText, Mail, Search, Shield, ShieldCheck, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { toast } from "@/hooks/use-toast";
import { getPrivacySettings, updatePrivacySettings } from "@/lib/api/platform";
import type { DataPrivacyData } from "@/lib/api/platform";

function DataPrivacySkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}

export default function DataPrivacyPage() {
  const [data, setData] = React.useState<DataPrivacyData | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState<string | null>(null);


  React.useEffect(() => {
    getPrivacySettings()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur de chargement"))
      .finally(() => setLoading(false));
  }, []);

  const toggleSetting = async (key: keyof DataPrivacyData["settings"], value: boolean) => {
    if (!data) return;
    const prev = data.settings[key];
    setData({ ...data, settings: { ...data.settings, [key]: value } });
    setSaving(key);
    try {
      const updated = await updatePrivacySettings({ [key]: value });
      setData((d) => d ? { ...d, settings: { ...d.settings, ...updated } } : d);
    } catch {
      setData((d) => d ? { ...d, settings: { ...d.settings, [key]: prev } } : d);
      toast({ title: "Erreur", description: "Impossible de mettre à jour le paramètre", variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <DataPrivacySkeleton />;

  if (error) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon"><Shield className="size-5" /></EmptyMedia>
          <EmptyTitle>Impossible de charger les paramètres de confidentialité</EmptyTitle>
          <EmptyDescription>{error}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (!data) return null;

  const { settings, summary } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Données et confidentialité</h1>
        <p className="text-muted-foreground text-sm">Gérez vos données et vos paramètres de confidentialité</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Confidentialité</CardTitle>
          <CardDescription>Contrôlez qui peut voir vos informations et comment vos données sont utilisées</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="dataProcessing" className="font-medium">Traitement des données</Label>
              <p className="text-muted-foreground text-sm">Autoriser le traitement de vos données pour améliorer les services</p>
            </div>
            <Switch id="dataProcessing" checked={settings.dataProcessing} onCheckedChange={(v) => toggleSetting("dataProcessing", v)} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="marketingEmails" className="font-medium">E-mails marketing</Label>
              <p className="text-muted-foreground text-sm">Recevoir des offres et actualités par e-mail</p>
            </div>
            <Switch id="marketingEmails" checked={settings.marketingEmails} onCheckedChange={(v) => toggleSetting("marketingEmails", v)} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="analytics" className="font-medium">Analytics</Label>
              <p className="text-muted-foreground text-sm">Contribuer aux statistiques d&apos;utilisation anonymes</p>
            </div>
            <Switch id="analytics" checked={settings.analytics} onCheckedChange={(v) => toggleSetting("analytics", v)} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="publicProfile" className="font-medium">Profil public</Label>
              <p className="text-muted-foreground text-sm">Permettre à d&apos;autres utilisateurs de voir votre profil</p>
            </div>
            <Switch id="publicProfile" checked={settings.publicProfile} onCheckedChange={(v) => toggleSetting("publicProfile", v)} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="searchable" className="font-medium">Indexation</Label>
              <p className="text-muted-foreground text-sm">Permettre à d&apos;autres utilisateurs de vous trouver par recherche</p>
            </div>
            <Switch id="searchable" checked={settings.searchable} onCheckedChange={(v) => toggleSetting("searchable", v)} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="showOnlineStatus" className="font-medium">Statut en ligne</Label>
              <p className="text-muted-foreground text-sm">Afficher votre statut de présence aux autres utilisateurs</p>
            </div>
            <Switch id="showOnlineStatus" checked={settings.showOnlineStatus} onCheckedChange={(v) => toggleSetting("showOnlineStatus", v)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Résumé de vos données</CardTitle>
          <CardDescription>Aperçu des données associées à votre compte</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
            <div className="bg-muted flex items-center gap-3 rounded-lg p-4">
              <FileText className="text-muted-foreground size-5" />
              <div>
                <p className="text-2xl font-semibold">{summary.totalFiles}</p>
                <p className="text-muted-foreground text-xs">Fichiers</p>
              </div>
            </div>
            <div className="bg-muted flex items-center gap-3 rounded-lg p-4">
              <Users className="text-muted-foreground size-5" />
              <div>
                <p className="text-2xl font-semibold">{summary.totalContacts}</p>
                <p className="text-muted-foreground text-xs">Contacts</p>
              </div>
            </div>
            <div className="bg-muted flex items-center gap-3 rounded-lg p-4">
              <Database className="text-muted-foreground size-5" />
              <div>
                <p className="text-2xl font-semibold">{(summary.totalStorage / 1073741824).toFixed(1)} Go</p>
                <p className="text-muted-foreground text-xs">Stockage utilisé</p>
              </div>
            </div>
          </div>

          {summary.dataCategories.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Catégories de données</h3>
              <div className="flex flex-wrap gap-2">
                {summary.dataCategories.map((cat, i) => (
                  <Badge key={i} variant="secondary">{cat.name}: {cat.count}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
