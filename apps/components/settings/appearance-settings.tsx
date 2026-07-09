"use client";

import * as React from "react";
import { Loader2, MonitorCog, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { SettingsSectionHeader } from "@/components/settings/settings-section-header";
import { SettingRow } from "@/components/settings/setting-row";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { getPreferences, updatePreferences } from "@/lib/api/preferences";
import type { UserPreferences } from "@/lib/api/types";

const LOCAL_APPEARANCE_STORAGE_KEY = "aether.settings.appearance";

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const [preferences, setPreferences] = React.useState<UserPreferences | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const next = await getPreferences();
        if (!cancelled) {
          setPreferences(next);
        }
      } catch {
        if (!cancelled) {
          const local = window.localStorage.getItem(LOCAL_APPEARANCE_STORAGE_KEY);
          setPreferences(
            local
              ? (JSON.parse(local) as UserPreferences)
              : {
                  theme: "system",
                  language: "fr",
                  locale: "fr",
                  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                  density: "comfortable",
                  contrast: "default",
                  soundEnabled: true,
                  secureSession: true,
                }
          );
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

  async function save(next: UserPreferences) {
    setPreferences(next);
    window.localStorage.setItem(LOCAL_APPEARANCE_STORAGE_KEY, JSON.stringify(next));
    setSaving(true);
    try {
      await updatePreferences(next);
      toast.success("Préférences d’interface enregistrées.");
    } catch {
      toast.error("Préférences locales mises à jour, persistance serveur indisponible.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !preferences) {
    return (
      <div className="space-y-4">
        <SettingsSectionHeader eyebrow="Personnel" title="Apparence et langue" description="Chargement des préférences visuelles." />
        <div className="rounded-md border border-white/10 bg-black/10 p-4 text-sm text-zinc-400">Chargement…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SettingsSectionHeader
        eyebrow="Personnel"
        title="Apparence et langue"
        description="Le thème est appliqué immédiatement via `next-themes`. Les autres réglages sont conservés comme préférences utilisateur et serviront aux surfaces localisées."
        actions={saving ? <Loader2 className="size-4 animate-spin text-zinc-400" /> : null}
      />
      <div className="divide-y divide-white/10 rounded-md border border-white/10 bg-black/10 px-4">
        <SettingRow title="Thème" description="Application immédiate, sans rechargement de page.">
          <Select
            value={(preferences.theme ?? theme ?? "system") as string}
            onValueChange={(value: "light" | "dark" | "system") => {
              setTheme(value);
              void save({ ...preferences, theme: value });
            }}
          >
            <SelectTrigger className="w-44 border-white/10 bg-[#232426]">
              {preferences.theme === "light" ? <Sun className="size-4" /> : preferences.theme === "dark" ? <Moon className="size-4" /> : <MonitorCog className="size-4" />}
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Clair</SelectItem>
              <SelectItem value="dark">Sombre</SelectItem>
              <SelectItem value="system">Système</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow title="Langue préférée" description="Préférence persistée côté utilisateur. Le workspace platform reste partiellement francophone à ce stade.">
          <Select value={preferences.language} onValueChange={(value) => void save({ ...preferences, language: value, locale: value })}>
            <SelectTrigger className="w-44 border-white/10 bg-[#232426]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="de">Deutsch</SelectItem>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="ja">日本語</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow title="Densité" description="Contrôle la compacité de l’interface.">
          <Select value={preferences.density} onValueChange={(value: "comfortable" | "compact") => void save({ ...preferences, density: value })}>
            <SelectTrigger className="w-44 border-white/10 bg-[#232426]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="comfortable">Confortable</SelectItem>
              <SelectItem value="compact">Compacte</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow title="Contraste élevé" description="Préférence sauvegardée pour les surfaces qui la supportent déjà.">
          <Switch
            checked={preferences.contrast === "high"}
            onCheckedChange={(checked) => void save({ ...preferences, contrast: checked ? "high" : "default" })}
            aria-label="Contraste élevé"
          />
        </SettingRow>
      </div>
      <div className="rounded-md border border-dashed border-white/10 bg-[#232426] p-4 text-xs text-zinc-500">
        Les réglages de langue, densité et contraste sont conservés côté utilisateur et en local pour éviter toute perte si l’API n’est pas encore disponible sur un environnement donné.
      </div>
    </div>
  );
}
