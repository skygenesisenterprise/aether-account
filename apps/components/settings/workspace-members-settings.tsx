"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, Search, UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { PresenceAvatar } from "@/components/platform/presence-avatar";
import { SettingsSectionHeader } from "@/components/settings/settings-section-header";
import { canAssignRole, getInitials } from "@/components/settings/settings-utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteWorkspaceMember, provisionWorkspaceUser, updateWorkspaceMember } from "@/lib/api/members";
import { resolveWorkspaceMemberPresenceStatus } from "@/lib/presence";
import type { User, Workspace, WorkspaceMember, WorkspaceMemberRole } from "@/lib/api/types";

const memberSchema = z.object({
  displayName: z.string().trim().min(2, "Nom requis"),
  email: z.string().email("Email invalide"),
  role: z.enum(["admin", "member", "guest"]),
  temporaryPassword: z.string().min(12, "12 caractères minimum"),
  confirmTemporaryPassword: z.string().min(12, "Confirmation requise"),
}).refine((values) => values.temporaryPassword === values.confirmTemporaryPassword, {
  path: ["confirmTemporaryPassword"],
  message: "Les mots de passe doivent correspondre",
});

interface WorkspaceMembersSettingsProps {
  workspace: Workspace | null;
  currentUser: User | null;
  members: WorkspaceMember[];
  actorRole: string | undefined;
  canManage: boolean;
  errorMessage?: string | null;
  onMembersChange: (members: WorkspaceMember[]) => void;
}

export function WorkspaceMembersSettings({
  workspace,
  currentUser,
  members,
  actorRole,
  canManage,
  errorMessage,
  onMembersChange,
}: WorkspaceMembersSettingsProps) {
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("all");
  const [open, setOpen] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [pendingRemoval, setPendingRemoval] = React.useState<WorkspaceMember | null>(null);
  const form = useForm<z.infer<typeof memberSchema>>({
    resolver: zodResolver(memberSchema),
    defaultValues: { displayName: "", email: "", role: "member", temporaryPassword: "", confirmTemporaryPassword: "" },
  });

  React.useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [form, open]);

  const filteredMembers = React.useMemo(() => {
    return members.filter((member) => {
      const matchesSearch = [member.displayName, member.email, member.role].join(" ").toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "all" || member.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [members, roleFilter, search]);

  async function submitMember(values: z.infer<typeof memberSchema>) {
    if (!workspace) {
      return;
    }
    try {
      const created = await provisionWorkspaceUser(workspace.id, {
        email: values.email,
        displayName: values.displayName,
        role: values.role,
        temporaryPassword: values.temporaryPassword,
      });
      onMembersChange([...members, created]);
      form.reset();
      setOpen(false);
      toast.success("Membre ajouté au workspace.");
    } catch {
      toast.error("Impossible de créer ce membre.");
    }
  }

  function generateTemporaryPassword() {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
    const password = Array.from({ length: 16 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
    form.setValue("temporaryPassword", password, { shouldDirty: true, shouldValidate: true });
    form.setValue("confirmTemporaryPassword", password, { shouldDirty: true, shouldValidate: true });
  }

  async function handleRoleChange(member: WorkspaceMember, role: WorkspaceMemberRole) {
    if (!workspace) {
      return;
    }
    const snapshot = members;
    onMembersChange(members.map((item) => (item.userId === member.userId ? { ...item, role } : item)));
    try {
      const updated = await updateWorkspaceMember(workspace.id, member.userId, { role });
      onMembersChange(snapshot.map((item) => (item.userId === updated.userId ? updated : item)));
      toast.success("Rôle mis à jour.");
    } catch {
      onMembersChange(snapshot);
      toast.error("Mise à jour du rôle impossible.");
    }
  }

  async function confirmRemoval() {
    if (!workspace || !pendingRemoval) {
      return;
    }
    try {
      await deleteWorkspaceMember(workspace.id, pendingRemoval.userId);
      onMembersChange(members.filter((member) => member.userId !== pendingRemoval.userId));
      toast.success("Membre retiré.");
    } catch {
      toast.error("Suppression du membre impossible.");
    } finally {
      setPendingRemoval(null);
    }
  }

  return (
    <div className="space-y-6">
      <SettingsSectionHeader
        eyebrow="Workspace"
        title="Membres"
        description={canManage ? "Créez un nouveau membre directement rattaché au workspace actif." : "Liste des membres du workspace en lecture seule."}
        actions={
          canManage ? (
            <Button size="sm" onClick={() => setOpen(true)}>
              <UserPlus className="size-4" />
              Ajouter un membre
            </Button>
          ) : null
        }
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-white/12 bg-[#27282b] text-zinc-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="size-4" />
              Ajouter un membre
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Le compte sera créé et rattaché automatiquement au workspace actif.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit((values) => void submitMember(values))}>
              <FormField control={form.control} name="displayName" render={({ field }) => (
                <FormItem><FormLabel>Nom affiché</FormLabel><FormControl><Input {...field} placeholder="Nom visible dans la plateforme" className="border-white/10 bg-[#232426]" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email de connexion</FormLabel><FormControl><Input {...field} type="email" placeholder="membre@aether.local" className="border-white/10 bg-[#232426]" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem><FormLabel>Rôle</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger className="border-white/10 bg-[#232426]"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="member">Member</SelectItem><SelectItem value="guest">Guest</SelectItem></SelectContent></Select><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="temporaryPassword" render={({ field }) => (
                <FormItem><FormLabel>Mot de passe temporaire</FormLabel><FormControl><div className="relative"><Input {...field} type={showPassword ? "text" : "password"} placeholder="12 caractères minimum" className="border-white/10 bg-[#232426] pr-10" /><button type="button" onClick={() => setShowPassword((c) => !c)} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200" tabIndex={-1} aria-label={showPassword ? "Masquer" : "Afficher"}>{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="confirmTemporaryPassword" render={({ field }) => (
                <FormItem><FormLabel>Confirmation du mot de passe</FormLabel><FormControl><div className="relative"><Input {...field} type={showPassword ? "text" : "password"} placeholder="Répéter le mot de passe temporaire" className="border-white/10 bg-[#232426] pr-10" /></div></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter className="flex-wrap gap-2 sm:justify-between">
                <Button type="button" variant="outline" className="gap-1" onClick={generateTemporaryPassword}>
                  Générer un mot de passe
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
                  Créer le membre
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      {errorMessage ? (
        <div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
          {errorMessage}
        </div>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un membre" className="border-white/10 bg-black/10 pl-9" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full border-white/10 bg-black/10 sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les rôles</SelectItem>
            <SelectItem value="owner">Owner</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="member">Member</SelectItem>
            <SelectItem value="guest">Guest</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-md border border-white/10 bg-black/10">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10">
              <TableHead>Membre</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Ajouté le</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.map((member) => (
              <TableRow key={member.userId} className="border-white/10">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <PresenceAvatar initials={getInitials(member.displayName, member.email)} status={resolveWorkspaceMemberPresenceStatus(member)} />
                    <div>
                      <p className="text-sm font-medium text-white">{member.displayName ?? member.userId}</p>
                      <p className="text-xs text-zinc-500">{member.email ?? "Email non disponible"}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {canManage && member.userId !== currentUser?.id ? (
                    <Select value={member.role} onValueChange={(value: WorkspaceMemberRole) => void handleRoleChange(member, value)}>
                      <SelectTrigger className="w-32 border-white/10 bg-[#232426]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(["owner", "admin", "member", "guest"] as WorkspaceMemberRole[]).map((role) => (
                          <SelectItem key={role} value={role} disabled={!canAssignRole(actorRole, role)}>{role}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="outline" className="border-white/10 text-zinc-200">{member.role}</Badge>
                  )}
                </TableCell>
                <TableCell><Badge variant="outline" className="border-white/10 text-zinc-300">{member.status ?? "active"}</Badge></TableCell>
                <TableCell className="text-xs text-zinc-400">{new Date(member.joinedAt).toLocaleString("fr-FR")}</TableCell>
                <TableCell className="text-right">
                  {canManage && member.userId !== currentUser?.id ? (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setPendingRemoval(member)}>Retirer</Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
            {!filteredMembers.length ? (
              <TableRow className="border-white/10">
                <TableCell colSpan={5} className="py-8 text-center text-sm text-zinc-500">
                  {errorMessage ? "Les membres ne peuvent pas être affichés pour ce compte." : "Aucun membre à afficher."}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
      <AlertDialog open={pendingRemoval !== null} onOpenChange={(open) => !open && setPendingRemoval(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer ce membre ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action supprimera son accès au workspace actif.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmRemoval()}>Confirmer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
