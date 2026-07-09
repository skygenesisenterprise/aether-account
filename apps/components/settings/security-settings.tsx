"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { SettingsSectionHeader } from "@/components/settings/settings-section-header";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authApi } from "@/lib/api/auth";
import type { User } from "@/lib/api/types";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mot de passe actuel requis"),
    newPassword: z.string().min(12, "12 caractères minimum"),
    confirmPassword: z.string().min(12, "Confirmation requise"),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Les mots de passe ne correspondent pas",
  });

interface SecuritySettingsProps {
  user: User | null;
}

export function SecuritySettings({ user }: SecuritySettingsProps) {
  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  async function onSubmit(values: z.infer<typeof passwordSchema>) {
    try {
      await authApi.changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword });
      form.reset();
      toast.success("Mot de passe mis à jour.");
    } catch {
      toast.error("Impossible de changer le mot de passe.");
    }
  }

  return (
    <div className="space-y-6">
      <SettingsSectionHeader
        eyebrow="Personnel"
        title="Sécurité"
        description="Le compte utilise une authentification locale Aether Meet. Les actions de vérification email restent en attente d’implémentation backend."
      />
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-md border border-white/10 bg-black/10 p-4">
          <p className="text-sm font-medium text-white">État du compte</p>
          <div className="mt-4 space-y-3 text-sm text-zinc-300">
            <div className="flex items-center justify-between gap-4">
              <span>Type d’identité</span>
              <span className="font-medium text-white">Authentification locale Aether Meet</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Email vérifié</span>
              <span className="font-medium text-white">{user?.emailVerifiedAt ? "Oui" : "Non"}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Dernier changement de mot de passe</span>
              <span className="font-medium text-white">{user?.passwordChangedAt ? new Date(user.passwordChangedAt).toLocaleString("fr-FR") : "Non disponible"}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>État du compte</span>
              <span className="font-medium text-white">{user?.disabledAt ? "Désactivé" : "Actif"}</span>
            </div>
          </div>
          <div className="mt-4 rounded-md border border-white/10 bg-[#232426] p-3 text-xs text-zinc-500">
            Le renvoi d’email de vérification n’est pas encore supporté par le backend actuel. Aucun faux succès n’est affiché.
          </div>
        </div>
        <div className="rounded-md border border-white/10 bg-black/10 p-4">
          <div className="mb-4 flex items-center gap-2 text-white">
            <ShieldCheck className="size-4 text-emerald-400" />
            <p className="text-sm font-medium">Changer le mot de passe</p>
          </div>
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit((values) => void onSubmit(values))}>
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mot de passe actuel</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" className="border-white/10 bg-[#232426]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nouveau mot de passe</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" className="border-white/10 bg-[#232426]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmation</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" className="border-white/10 bg-[#232426]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
                Mettre à jour le mot de passe
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
