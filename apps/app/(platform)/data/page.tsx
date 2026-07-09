"use client";

import * as React from "react";
import { Database, Eye, FileText, Mail, Search, Shield, ShieldCheck, Users } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { toast } from "@/hooks/use-toast";
import { getPrivacySettings, updatePrivacySettings } from "@/lib/api/platform";
import type { DataPrivacyData, PrivacySettings } from "@/lib/api/platform";

function DataPrivacySkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-40 rounded-lg bg-white/5" />
      <Skeleton className="h-32 rounded-xl bg-white/5" />
      <Skeleton className="h-28 rounded-xl bg-white/5" />
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

  const toggleSetting = async (key: keyof PrivacySettings, value: boolean) => {
    if (!data) return;
    const prev = data.settings?.[key] ?? false;
    
    // Create new settings object with updated value
    const newSettings = { ...(data.settings || {}), [key]: value };
    setData({ ...data, settings: newSettings });
    setSaving(key);
    try {
      const updated = await updatePrivacySettings({ [key]: value });
      setData((d) => d ? { ...d, settings: { ...(d.settings || {}), ...updated } } : d);
    } catch {
      setData((d) => d ? { ...d, settings: { ...(d.settings || {}), [key]: prev } } : d);
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
          <EmptyMedia variant="icon"><Shield className="size-4" /></EmptyMedia>
          <EmptyTitle>Impossible de charger les paramètres de confidentialité</EmptyTitle>
          <EmptyDescription>{error}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (!data) return null;

  // Ensure settings exist with default values
  const settings = data.settings || {
    dataProcessing: false,
    marketingEmails: false,
    analytics: false,
    publicProfile: false,
    searchable: false,
    showOnlineStatus: false,
  };

  const summary = data.summary || {
    totalFiles: 0,
    totalContacts: 0,
    totalStorage: 0,
    dataCategories: [],
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-3 py-4 sm:px-4 sm:py-6">
      <div className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">Données et confidentialité</h1>
        <p className="text-xs text-zinc-400 sm:text-sm">Gérez vos données et vos paramètres de confidentialité</p>
      </div>

      <div className="rounded-xl border border-white/6 bg-[#232426] p-4 mb-4">
        <h2 className="text-sm font-semibold text-white mb-1">Confidentialité</h2>
        <p className="text-xs text-zinc-500 mb-4">Contrôlez qui peut voir vos informations et comment vos données sont utilisées</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="dataProcessing" className="text-xs font-medium">Traitement des données</Label>
              <p className="text-xs text-zinc-500">Autoriser le traitement de vos données pour améliorer les services</p>
            </div>
            <Switch 
              id="dataProcessing" 
              checked={settings.dataProcessing} 
              onCheckedChange={(v) => toggleSetting("dataProcessing", v)}
              disabled={saving === "dataProcessing"}
            />
          </div>
          <Separator className="bg-white/6" />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="marketingEmails" className="text-xs font-medium">E-mails marketing</Label>
              <p className="text-xs text-zinc-500">Recevoir des offres et actualités par e-mail</p>
            </div>
            <Switch 
              id="marketingEmails" 
              checked={settings.marketingEmails} 
              onCheckedChange={(v) => toggleSetting("marketingEmails", v)}
              disabled={saving === "marketingEmails"}
            />
          </div>
          <Separator className="bg-white/6" />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="analytics" className="text-xs font-medium">Analytics</Label>
              <p className="text-xs text-zinc-500">Contribuer aux statistiques d'utilisation anonymes</p>
            </div>
            <Switch 
              id="analytics" 
              checked={settings.analytics} 
              onCheckedChange={(v) => toggleSetting("analytics", v)}
              disabled={saving === "analytics"}
            />
          </div>
          <Separator className="bg-white/6" />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="publicProfile" className="text-xs font-medium">Profil public</Label>
              <p className="text-xs text-zinc-500">Permettre à d'autres utilisateurs de voir votre profil</p>
            </div>
            <Switch 
              id="publicProfile" 
              checked={settings.publicProfile} 
              onCheckedChange={(v) => toggleSetting("publicProfile", v)}
              disabled={saving === "publicProfile"}
            />
          </div>
          <Separator className="bg-white/6" />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="searchable" className="text-xs font-medium">Indexation</Label>
              <p className="text-xs text-zinc-500">Permettre à d'autres utilisateurs de vous trouver par recherche</p>
            </div>
            <Switch 
              id="searchable" 
              checked={settings.searchable} 
              onCheckedChange={(v) => toggleSetting("searchable", v)}
              disabled={saving === "searchable"}
            />
          </div>
          <Separator className="bg-white/6" />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="showOnlineStatus" className="text-xs font-medium">Statut en ligne</Label>
              <p className="text-xs text-zinc-500">Afficher votre statut de présence aux autres utilisateurs</p>
            </div>
            <Switch 
              id="showOnlineStatus" 
              checked={settings.showOnlineStatus} 
              onCheckedChange={(v) => toggleSetting("showOnlineStatus", v)}
              disabled={saving === "showOnlineStatus"}
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/6 bg-[#232426] p-4">
        <h2 className="text-sm font-semibold text-white mb-1">Résumé de vos données</h2>
        <p className="text-xs text-zinc-500 mb-4">Aperçu des données associées à votre compte</p>
        <div className="grid gap-3 sm:grid-cols-3 mb-4">
          <div className="bg-white/4 flex items-center gap-2 rounded-lg p-3">
            <FileText className="text-zinc-400 size-4" />
            <div>
              <p className="text-lg font-semibold text-white">{summary.totalFiles}</p>
              <p className="text-xs text-zinc-500">Fichiers</p>
            </div>
          </div>
          <div className="bg-white/4 flex items-center gap-2 rounded-lg p-3">
            <Users className="text-zinc-400 size-4" />
            <div>
              <p className="text-lg font-semibold text-white">{summary.totalContacts}</p>
              <p className="text-xs text-zinc-500">Contacts</p>
            </div>
          </div>
          <div className="bg-white/4 flex items-center gap-2 rounded-lg p-3">
            <Database className="text-zinc-400 size-4" />
            <div>
              <p className="text-lg font-semibold text-white">{(summary.totalStorage / 1073741824).toFixed(1)} Go</p>
              <p className="text-xs text-zinc-500">Stockage utilisé</p>
            </div>
          </div>
        </div>

        {summary.dataCategories.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-white mb-2">Catégories de données</h3>
            <div className="flex flex-wrap gap-1.5">
              {summary.dataCategories.slice(0, 5).map((cat, i) => (
                <Badge key={i} variant="secondary" className="text-xs px-2 py-0.5">
                  {cat.name}: {cat.count}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
