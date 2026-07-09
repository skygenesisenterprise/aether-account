"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, Loader2, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { SettingsSectionHeader } from "@/components/settings/settings-section-header";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateWorkspace } from "@/lib/api/workspaces";
import type { Workspace, WorkspaceMember } from "@/lib/api/types";

const workspaceSchema = z.object({
  name: z.string().trim().min(2, "Nom requis"),
  description: z.string().trim().max(500, "Description trop longue"),
});

interface WorkspaceGeneralSettingsProps {
  workspace: Workspace | null;
  members: WorkspaceMember[];
  canEdit: boolean;
  onWorkspaceChange: (workspace: Workspace) => void;
}

export function WorkspaceGeneralSettings({ workspace, members, canEdit, onWorkspaceChange }: WorkspaceGeneralSettingsProps) {
  const owner = React.useMemo(() => members.find((member) => member.role === "owner" && member.userId === workspace?.ownerId), [members, workspace]);
  const form = useForm<z.infer<typeof workspaceSchema>>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: { name: workspace?.name ?? "", description: workspace?.description ?? "" },
  });

  React.useEffect(() => {
    form.reset({ name: workspace?.name ?? "", description: workspace?.description ?? "" });
  }, [form, workspace]);

  async function onSubmit(values: z.infer<typeof workspaceSchema>) {
    if (!workspace) {
      return;
    }
    try {
      const next = await updateWorkspace(workspace.id, values);
      onWorkspaceChange(next);
      form.reset(values);
      toast.success("Workspace mis à jour.");
    } catch {
      toast.error("Mise à jour du workspace impossible.");
    }
  }

  return (
    <div className="space-y-6">
      <SettingsSectionHeader
        eyebrow="Workspace"
        title="Général"
        description={canEdit ? "Modifiez les propriétés principales du workspace actif." : "Vous voyez les propriétés du workspace en lecture seule. Seuls owner/admin peuvent les modifier."}
      />
      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Form {...form}>
          <form className="space-y-4 rounded-md border border-white/10 bg-black/10 p-4" onSubmit={form.handleSubmit((values) => void onSubmit(values))}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du workspace</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={!canEdit} className="border-white/10 bg-[#232426]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FormLabel>Slug</FormLabel>
                <Input value={workspace?.slug ?? ""} disabled className="mt-2 border-white/10 bg-[#232426]" />
              </div>
              <div>
                <FormLabel>Visibilité</FormLabel>
                <Input value={workspace?.visibility ?? ""} disabled className="mt-2 border-white/10 bg-[#232426]" />
              </div>
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={4} disabled={!canEdit} className="border-white/10 bg-[#232426]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {canEdit ? (
              <div className="flex justify-end">
                <Button type="submit" disabled={!form.formState.isDirty || form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  Enregistrer
                </Button>
              </div>
            ) : null}
          </form>
        </Form>
        <div className="space-y-4 rounded-md border border-white/10 bg-black/10 p-4 text-sm text-zinc-300">
          <div className="flex items-center justify-between gap-4">
            <span>Owner</span>
            <span className="font-medium text-white">{owner?.displayName ?? workspace?.ownerId ?? "Inconnu"}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span>Créé le</span>
            <span className="font-medium text-white">{workspace?.createdAt ? new Date(workspace.createdAt).toLocaleString("fr-FR") : "Inconnu"}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span>ID workspace</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto px-0 text-left font-mono text-xs text-white"
              onClick={() => {
                if (workspace?.id) {
                  void navigator.clipboard.writeText(workspace.id);
                  toast.success("ID copié.");
                }
              }}
            >
              <Copy className="size-3.5" />
              {workspace?.id ?? "N/A"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
