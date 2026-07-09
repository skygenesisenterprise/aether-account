"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { SettingsSectionHeader } from "@/components/settings/settings-section-header";
import { SettingRow } from "@/components/settings/setting-row";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Switch } from "@/components/ui/switch";
import { getNotificationPreferences, updateNotificationPreferences } from "@/lib/api/notifications";
import type { NotificationPreferences } from "@/lib/api/types";

const notificationRows: Array<{ key: keyof NotificationPreferences; title: string; description: string }> = [
  { key: "directMessages", title: "Messages directs", description: "Prévenir immédiatement quand un membre vous écrit." },
  { key: "mentions", title: "Mentions", description: "Alerter lorsqu’un message vous cible explicitement." },
  { key: "channelMessages", title: "Nouveaux messages de channel", description: "Signaler l’activité récente des espaces suivis." },
  { key: "meetingReminders", title: "Rappels de réunion", description: "Notifier avant le démarrage d’une réunion." },
  { key: "incomingCalls", title: "Appels entrants", description: "Mettre en avant les appels et sonneries." },
  { key: "emailNotifications", title: "Notifications email", description: "Envoyer aussi les alertes importantes par email." },
  { key: "sounds", title: "Sons", description: "Jouer les sons de messages et d’appels." },
  { key: "desktopNotifications", title: "Notifications desktop", description: "Autoriser les notifications système du navigateur." },
];

export function NotificationSettings() {
  const [preferences, setPreferences] = React.useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [savingKey, setSavingKey] = React.useState<keyof NotificationPreferences | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setError(null);
        const next = await getNotificationPreferences();
        if (!cancelled) {
          setPreferences(next);
        }
      } catch {
        if (!cancelled) {
          setError("Impossible de charger les préférences de notification.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function togglePreference(key: keyof NotificationPreferences, value: boolean) {
    if (!preferences) {
      return;
    }
    const snapshot = preferences;
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    setSavingKey(key);
    try {
      await updateNotificationPreferences(next);
      toast.success("Préférence enregistrée.");
    } catch {
      setPreferences(snapshot);
      toast.error("La mise à jour de la préférence a échoué.");
    } finally {
      setSavingKey(null);
    }
  }

  if (loading) {
    return <div className="text-sm text-zinc-400">Chargement des notifications…</div>;
  }

  if (error || !preferences) {
    return (
      <Empty className="border border-white/10 bg-black/10">
        <EmptyHeader>
          <EmptyTitle>Notifications indisponibles</EmptyTitle>
          <EmptyDescription>{error ?? "Aucune préférence récupérée."}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-6">
      <SettingsSectionHeader
        eyebrow="Personnel"
        title="Notifications"
        description="Chaque bascule est sauvegardée immédiatement via l’API utilisateur."
      />
      <div className="divide-y divide-white/10 rounded-md border border-white/10 bg-black/10 px-4">
        {notificationRows.map((row) => (
          <SettingRow key={row.key} title={row.title} description={row.description}>
            <div className="flex items-center gap-3">
              {savingKey === row.key ? <Loader2 className="size-4 animate-spin text-zinc-500" /> : null}
              <Switch
                checked={preferences[row.key]}
                onCheckedChange={(checked) => void togglePreference(row.key, checked)}
                disabled={savingKey !== null}
                aria-label={row.title}
              />
            </div>
          </SettingRow>
        ))}
      </div>
    </div>
  );
}
