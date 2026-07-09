"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, RefreshCw, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { PresenceAvatar } from "@/components/platform/presence-avatar";
import { SettingsSectionHeader } from "@/components/settings/settings-section-header";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getMe, updateMe } from "@/lib/api/me";
import { normalizePresenceStatus, resolveUserPresenceStatus, type PresenceStatus } from "@/lib/presence";
import type { User } from "@/lib/api/types";
import { getInitials } from "@/components/settings/settings-utils";

const PRESENCE_OPTIONS: Array<{ value: PresenceStatus; label: string }> = [
  { value: "online", label: "Connecté" },
  { value: "busy", label: "Occupé" },
  { value: "away", label: "Absent" },
  { value: "offline", label: "Hors ligne" },
];

const profileSchema = z.object({
  displayName: z.string().trim().min(2, "Nom trop court"),
  avatarUrl: z.string().trim().url("URL invalide").or(z.literal("")),
  status: z.enum(["online", "busy", "away", "offline"]),
  statusMessage: z.string().trim().max(180, "Message trop long"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileSettingsProps {
  user: User | null;
  onUserChange: (user: User) => void;
}

export function ProfileSettings({ user, onUserChange }: ProfileSettingsProps) {
  const [reloading, setReloading] = React.useState(false);
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName ?? "",
      avatarUrl: user?.avatarUrl ?? "",
      status: normalizePresenceStatus(user?.presenceStatus ?? user?.status) ?? "online",
      statusMessage: "",
    },
  });

  React.useEffect(() => {
    form.reset({
      displayName: user?.displayName ?? "",
      avatarUrl: user?.avatarUrl ?? "",
      status: normalizePresenceStatus(user?.presenceStatus ?? user?.status) ?? "online",
      statusMessage: "",
    });
  }, [form, user]);

  async function refreshUser() {
    setReloading(true);
    try {
      const nextUser = await getMe();
      onUserChange(nextUser);
    } catch {
      toast.error("Impossible de recharger le profil.");
    } finally {
      setReloading(false);
    }
  }

  async function onSubmit(values: ProfileFormValues) {
    const snapshot = user;
    try {
      const nextUser = await updateMe({
        displayName: values.displayName,
        avatarUrl: values.avatarUrl || undefined,
        status: values.status || undefined,
      });
      onUserChange(nextUser);
      form.reset({ ...values });
      toast.success("Profil mis à jour.");
    } catch {
      if (snapshot) {
        onUserChange(snapshot);
      }
      toast.error("Échec de la mise à jour du profil.");
    }
  }

  return (
    <div className="space-y-6">
      <SettingsSectionHeader
        eyebrow="Personnel"
        title="Profil"
        description="Modifiez les informations visibles dans Aether Meet. Le statut est persisté, le message libre sera branché lorsque l’API de présence le supportera."
        actions={
          <Button type="button" variant="outline" size="sm" onClick={() => void refreshUser()} disabled={reloading}>
            {reloading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            Actualiser
          </Button>
        }
      />

      <div className="flex flex-col gap-4 rounded-md border border-white/10 bg-black/10 p-4 sm:flex-row sm:items-center">
        <PresenceAvatar
          initials={getInitials(user?.displayName, user?.email)}
          status={user ? resolveUserPresenceStatus(user, { isAuthenticated: true, isRealtimeConnected: true, isCurrentSession: true }) : "offline"}
          className="size-16"
          fallbackClassName="text-lg"
        />
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-white">{user?.displayName ?? "Compte utilisateur"}</p>
          <p className="truncate text-sm text-zinc-400">{user?.email ?? "Adresse non disponible"}</p>
          <p className="mt-1 text-xs text-zinc-500">
            Créé le {user?.createdAt ? new Date(user.createdAt).toLocaleString("fr-FR") : "date inconnue"}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit((values) => void onSubmit(values))}>
          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom affiché</FormLabel>
                <FormControl>
                  <Input {...field} className="border-white/10 bg-[#232426]" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="avatarUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL d’avatar</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="https://…" className="border-white/10 bg-[#232426]" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Statut de présence</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="border-white/10 bg-[#232426]">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PRESENCE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="statusMessage"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Message de présence</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={3}
                    placeholder="Le backend actuel ne persiste pas encore ce champ."
                    className="border-white/10 bg-[#232426]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="md:col-span-2 flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => form.reset()} disabled={!form.formState.isDirty || form.formState.isSubmitting}>
              Réinitialiser
            </Button>
            <Button type="submit" disabled={!form.formState.isDirty || form.formState.isSubmitting}>
              {form.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Enregistrer
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
