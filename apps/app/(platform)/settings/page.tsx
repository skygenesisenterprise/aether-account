"use client";

import * as React from "react";
import { Bell, BellRing, Eye, Globe, Loader2, Monitor, Moon, Palette, Save, ShieldCheck, Sun } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="space-y-6">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-10 w-80 rounded-lg" />
      <div className="space-y-4">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Palette className="size-4" /> Apparence</CardTitle>
        <CardDescription>Personnalisez l&apos;apparence de votre espace de travail</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label>Thème</Label>
          <div className="flex gap-2">
            {([["light", "Clair", Sun], ["dark", "Sombre", Moon], ["system", "Système", Monitor]] as const).map(([value, label, Icon]) => (
              <Button key={value} variant={local.theme === value ? "default" : "outline"} className="flex-1" onClick={() => setLocal({ ...local, theme: value })}>
                <Icon className="mr-2 size-4" />{label}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="language">Langue</Label>
          <Select value={local.language} onValueChange={(v) => setLocal({ ...local, language: v })}>
            <SelectTrigger id="language"><SelectValue /></SelectTrigger>
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
          <Label htmlFor="locale">Locale</Label>
          <Select value={local.locale} onValueChange={(v) => setLocal({ ...local, locale: v })}>
            <SelectTrigger id="locale"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="fr">France</SelectItem>
              <SelectItem value="en-US">United States</SelectItem>
              <SelectItem value="en-GB">United Kingdom</SelectItem>
              <SelectItem value="de-DE">Deutschland</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="timezone">Fuseau horaire</Label>
          <Input id="timezone" value={local.timezone} onChange={(e) => setLocal({ ...local, timezone: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="density">Densité</Label>
          <Select value={local.density} onValueChange={(v) => setLocal({ ...local, density: v as "comfortable" | "compact" })}>
            <SelectTrigger id="density"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="comfortable">Confortable</SelectItem>
              <SelectItem value="compact">Compact</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="contrast">Contraste élevé</Label>
            <p className="text-muted-foreground text-xs">Augmenter le contraste pour une meilleure lisibilité</p>
          </div>
          <Switch id="contrast" checked={local.contrast === "high"} onCheckedChange={(v) => setLocal({ ...local, contrast: v ? "high" : "default" })} />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="soundEnabled">Sons</Label>
            <p className="text-muted-foreground text-xs">Activer les sons de l&apos;interface</p>
          </div>
          <Switch id="soundEnabled" checked={local.soundEnabled} onCheckedChange={(v) => setLocal({ ...local, soundEnabled: v })} />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="secureSession">Session sécurisée</Label>
            <p className="text-muted-foreground text-xs">Renforcer la sécurité de votre session</p>
          </div>
          <Switch id="secureSession" checked={local.secureSession} onCheckedChange={(v) => setLocal({ ...local, secureSession: v })} />
        </div>
        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
            Enregistrer
          </Button>
        </div>
      </CardContent>
    </Card>
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BellRing className="size-4" /> Notifications</CardTitle>
        <CardDescription>Choisissez les notifications que vous souhaitez recevoir</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="directMessages">Messages directs</Label>
            <p className="text-muted-foreground text-xs">Notifications pour les messages privés</p>
          </div>
          <Switch id="directMessages" checked={local.directMessages} onCheckedChange={(v) => toggle("directMessages", v)} />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="mentions">Mentions</Label>
            <p className="text-muted-foreground text-xs">Notifications quand vous êtes mentionné</p>
          </div>
          <Switch id="mentions" checked={local.mentions} onCheckedChange={(v) => toggle("mentions", v)} />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="channelMessages">Messages de canal</Label>
            <p className="text-muted-foreground text-xs">Notifications pour les messages dans les canaux</p>
          </div>
          <Switch id="channelMessages" checked={local.channelMessages} onCheckedChange={(v) => toggle("channelMessages", v)} />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="meetingReminders">Rappels de réunion</Label>
            <p className="text-muted-foreground text-xs">Notifications avant le début d&apos;une réunion</p>
          </div>
          <Switch id="meetingReminders" checked={local.meetingReminders} onCheckedChange={(v) => toggle("meetingReminders", v)} />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="incomingCalls">Appels entrants</Label>
            <p className="text-muted-foreground text-xs">Notifications pour les appels entrants</p>
          </div>
          <Switch id="incomingCalls" checked={local.incomingCalls} onCheckedChange={(v) => toggle("incomingCalls", v)} />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="emailNotifications">Notifications par e-mail</Label>
            <p className="text-muted-foreground text-xs">Recevoir un résumé par e-mail</p>
          </div>
          <Switch id="emailNotifications" checked={local.emailNotifications} onCheckedChange={(v) => toggle("emailNotifications", v)} />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="sounds">Sons</Label>
            <p className="text-muted-foreground text-xs">Émettre un son pour les notifications</p>
          </div>
          <Switch id="sounds" checked={local.sounds} onCheckedChange={(v) => toggle("sounds", v)} />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="desktopNotifications">Notifications de bureau</Label>
            <p className="text-muted-foreground text-xs">Afficher les notifications sur votre bureau</p>
          </div>
          <Switch id="desktopNotifications" checked={local.desktopNotifications} onCheckedChange={(v) => toggle("desktopNotifications", v)} />
        </div>
        <div className="flex justify-end pt-2">
          <Button onClick={handleSaveAll} disabled={saving}>
            {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
            Enregistrer
          </Button>
        </div>
      </CardContent>
    </Card>
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
          <EmptyMedia variant="icon"><Globe className="size-5" /></EmptyMedia>
          <EmptyTitle>Impossible de charger les paramètres</EmptyTitle>
          <EmptyDescription>{error}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (!preferences || !notificationPrefs) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Paramètres</h1>
        <p className="text-muted-foreground text-sm">Personnalisez votre expérience</p>
      </div>

      <AppearanceForm preferences={preferences} onUpdate={async (p) => { const u = await updatePreferences(p); setPreferences(u); }} />
      <NotificationsForm preferences={notificationPrefs} onUpdate={async (p) => { const u = await updateNotificationPreferences(p); setNotificationPrefs(u); }} />
    </div>
  );
}
