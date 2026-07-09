"use client";

import * as React from "react";
import { Bell, BellRing, Eye, Globe, Loader2, Monitor, Moon, Palette, Save, ShieldCheck, Sun } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { getMe, getPreferences, updatePreferences, getNotificationPreferences, updateNotificationPreferences } from "@/lib/api";
import type { UserPreferences, NotificationPreferences } from "@/lib/api";

function SettingsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-32 rounded-lg bg-white/5" />
      <Skeleton className="h-8 w-64 rounded-lg bg-white/5" />
      <div className="space-y-3">
        <Skeleton className="h-28 rounded-xl bg-white/5" />
        <Skeleton className="h-32 rounded-xl bg-white/5" />
      </div>
    </div>
  );
}

function AppearanceForm({ preferences, onUpdate }: { preferences: UserPreferences; onUpdate: (p: UserPreferences) => Promise<void> }) {
  const [local, setLocal] = React.useState(preferences);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => setLocal(preferences), [preferences]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(local);
      toast({ title: "Préférences mises à jour", description: "Vos préférences d'affichage ont été enregistrées." });
    } catch (e) {
      toast({ title: "Erreur", description: "Impossible de sauvegarder les préférences", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-white/6 bg-[#232426] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Palette className="text-[#7775ff] size-4" />
        <h3 className="text-sm font-semibold text-white">Apparence</h3>
      </div>
      <p className="text-xs text-zinc-500 mb-4">Personnalisez l'apparence de votre espace de travail</p>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Thème</Label>
          <div className="flex gap-2">
            {([["light", "Clair", Sun], ["dark", "Sombre", Moon], ["system", "Système", Monitor]] as const).map(([value, label, Icon]) => (
              <Button key={value} variant={local.theme === value ? "default" : "outline"} className="flex-1 text-xs h-7" onClick={() => setLocal({ ...local, theme: value })}>
                <Icon className="mr-1.5 size-3.5" />{label}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="language" className="text-xs font-medium">Langue</Label>
          <Select value={local.language} onValueChange={(v) => setLocal({ ...local, language: v })}>
            <SelectTrigger id="language" className="text-xs bg-[#26272a] border-white/6 text-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="de">Deutsch</SelectItem>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="ja">日本語</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="locale" className="text-xs font-medium">Locale</Label>
          <Select value={local.locale} onValueChange={(v) => setLocal({ ...local, locale: v })}>
            <SelectTrigger id="locale" className="text-xs bg-[#26272a] border-white/6 text-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="fr">France</SelectItem>
              <SelectItem value="en-US">United States</SelectItem>
              <SelectItem value="en-GB">United Kingdom</SelectItem>
              <SelectItem value="de-DE">Deutschland</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="timezone" className="text-xs font-medium">Fuseau horaire</Label>
          <Input id="timezone" value={local.timezone} onChange={(e) => setLocal({ ...local, timezone: e.target.value })} className="text-xs bg-[#26272a] border-white/6 text-white h-8" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="density" className="text-xs font-medium">Densité</Label>
          <Select value={local.density} onValueChange={(v) => setLocal({ ...local, density: v as "comfortable" | "compact" })}>
            <SelectTrigger id="density" className="text-xs bg-[#26272a] border-white/6 text-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="comfortable">Confortable</SelectItem>
              <SelectItem value="compact">Compact</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Separator className="bg-white/6 my-2" />
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="contrast" className="text-xs font-medium">Contraste élevé</Label>
            <p className="text-xs text-zinc-500">Augmenter le contraste pour une meilleure lisibilité</p>
          </div>
          <Switch id="contrast" checked={local.contrast === "high"} onCheckedChange={(v) => setLocal({ ...local, contrast: v ? "high" : "default" })} />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="soundEnabled" className="text-xs font-medium">Sons</Label>
            <p className="text-xs text-zinc-500">Activer les sons de l'interface</p>
          </div>
          <Switch id="soundEnabled" checked={local.soundEnabled} onCheckedChange={(v) => setLocal({ ...local, soundEnabled: v })} />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="secureSession" className="text-xs font-medium">Session sécurisée</Label>
            <p className="text-xs text-zinc-500">Renforcer la sécurité de votre session</p>
          </div>
          <Switch id="secureSession" checked={local.secureSession} onCheckedChange={(v) => setLocal({ ...local, secureSession: v })} />
        </div>
        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={saving} className="text-xs h-7">
            {saving ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : <Save className="mr-1.5 size-3.5" />}
            Enregistrer
          </Button>
        </div>
      </div>
    </div>
  );
}

function NotificationsForm({ preferences, onUpdate }: { preferences: NotificationPreferences; onUpdate: (p: NotificationPreferences) => Promise<void> }) {
  const [local, setLocal] = React.useState(preferences);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => setLocal(preferences), [preferences]);

  const toggle = async (key: keyof NotificationPreferences, value: boolean) => {
    const prev = local[key];
    setLocal({ ...local, [key]: value });
    try {
      await onUpdate({ ...local, [key]: value });
    } catch {
      setLocal({ ...local, [key]: prev });
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await onUpdate(local);
      toast({ title: "Préférences de notification mises à jour" });
    } catch (e) {
      toast({ title: "Erreur", description: "Impossible de sauvegarder", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-white/6 bg-[#232426] p-4">
      <div className="flex items-center gap-2 mb-3">
        <BellRing className="text-[#7775ff] size-4" />
        <h3 className="text-sm font-semibold text-white">Notifications</h3>
      </div>
      <p className="text-xs text-zinc-500 mb-4">Choisissez les notifications que vous souhaitez recevoir</p>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="directMessages" className="text-xs font-medium">Messages directs</Label>
            <p className="text-xs text-zinc-500">Notifications pour les messages privés</p>
          </div>
          <Switch id="directMessages" checked={local.directMessages} onCheckedChange={(v) => toggle("directMessages", v)} />
        </div>
        <Separator className="bg-white/6" />
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="mentions" className="text-xs font-medium">Mentions</Label>
            <p className="text-xs text-zinc-500">Notifications quand vous êtes mentionné</p>
          </div>
          <Switch id="mentions" checked={local.mentions} onCheckedChange={(v) => toggle("mentions", v)} />
        </div>
        <Separator className="bg-white/6" />
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="channelMessages" className="text-xs font-medium">Messages de canal</Label>
            <p className="text-xs text-zinc-500">Notifications pour les messages dans les canaux</p>
          </div>
          <Switch id="channelMessages" checked={local.channelMessages} onCheckedChange={(v) => toggle("channelMessages", v)} />
        </div>
        <Separator className="bg-white/6" />
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="meetingReminders" className="text-xs font-medium">Rappels de réunion</Label>
            <p className="text-xs text-zinc-500">Notifications avant le début d'une réunion</p>
          </div>
          <Switch id="meetingReminders" checked={local.meetingReminders} onCheckedChange={(v) => toggle("meetingReminders", v)} />
        </div>
        <Separator className="bg-white/6" />
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="incomingCalls" className="text-xs font-medium">Appels entrants</Label>
            <p className="text-xs text-zinc-500">Notifications pour les appels entrants</p>
          </div>
          <Switch id="incomingCalls" checked={local.incomingCalls} onCheckedChange={(v) => toggle("incomingCalls", v)} />
        </div>
        <Separator className="bg-white/6" />
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="emailNotifications" className="text-xs font-medium">Notifications par e-mail</Label>
            <p className="text-xs text-zinc-500">Recevoir un résumé par e-mail</p>
          </div>
          <Switch id="emailNotifications" checked={local.emailNotifications} onCheckedChange={(v) => toggle("emailNotifications", v)} />
        </div>
        <Separator className="bg-white/6" />
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="sounds" className="text-xs font-medium">Sons</Label>
            <p className="text-xs text-zinc-500">Émettre un son pour les notifications</p>
          </div>
          <Switch id="sounds" checked={local.sounds} onCheckedChange={(v) => toggle("sounds", v)} />
        </div>
        <Separator className="bg-white/6" />
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="desktopNotifications" className="text-xs font-medium">Notifications de bureau</Label>
            <p className="text-xs text-zinc-500">Afficher les notifications sur votre bureau</p>
          </div>
          <Switch id="desktopNotifications" checked={local.desktopNotifications} onCheckedChange={(v) => toggle("desktopNotifications", v)} />
        </div>
        <div className="flex justify-end pt-2">
          <Button onClick={handleSaveAll} disabled={saving} className="text-xs h-7">
            {saving ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : <Save className="mr-1.5 size-3.5" />}
            Enregistrer
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [preferences, setPreferences] = React.useState<UserPreferences | null>(null);
  const [notificationPrefs, setNotificationPrefs] = React.useState<NotificationPreferences | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([getPreferences(), getNotificationPreferences()])
      .then(([p, n]) => {
        setPreferences(p);
        setNotificationPrefs(n);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur de chargement"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <SettingsSkeleton />;

  if (error) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon"><Globe className="size-4" /></EmptyMedia>
          <EmptyTitle>Impossible de charger les paramètres</EmptyTitle>
          <EmptyDescription>{error}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (!preferences || !notificationPrefs) return null;

  return (
    <div className="mx-auto w-full max-w-5xl px-3 py-4 sm:px-4 sm:py-6">
      <div className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">Paramètres</h1>
        <p className="text-xs text-zinc-400 sm:text-sm">Personnalisez votre expérience</p>
      </div>

      <Tabs defaultValue="appearance" className="space-y-4">
        <TabsList className="bg-[#232426] border border-white/6 rounded-xl p-1">
          <TabsTrigger value="appearance" className="text-xs data-[state=active]:bg-[#7775ff]/12 data-[state=active]:text-[#8b89ff]">
            Apparence
          </TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs data-[state=active]:bg-[#7775ff]/12 data-[state=active]:text-[#8b89ff]">
            Notifications
          </TabsTrigger>
        </TabsList>
        <TabsContent value="appearance" className="space-y-0">
          <AppearanceForm preferences={preferences} onUpdate={async (p) => { const u = await updatePreferences(p); setPreferences(u); }} />
        </TabsContent>
        <TabsContent value="notifications" className="space-y-0">
          <NotificationsForm preferences={notificationPrefs} onUpdate={async (p) => { const u = await updateNotificationPreferences(p); setNotificationPrefs(u); }} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
