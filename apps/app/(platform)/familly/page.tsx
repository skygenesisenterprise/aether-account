"use client";

import * as React from "react";
import { CircleUser, Loader2, MailCheck, Plus, Send, UserPlus, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { toast } from "@/hooks/use-toast";
import { getFamilyMembers, inviteFamilyMember } from "@/lib/api/platform";
import type { FamilyMember } from "@/lib/api/platform";

function FamilySkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

const roleLabels: Record<string, string> = {
  owner: "Propriétaire",
  admin: "Administrateur",
  member: "Membre",
  viewer: "Observateur",
};

const statusBadge: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  active: { label: "Actif", variant: "default" },
  pending: { label: "En attente", variant: "secondary" },
  suspended: { label: "Suspendu", variant: "outline" },
};

export default function FamilyPage() {
  const [members, setMembers] = React.useState<FamilyMember[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState("member");
  const [inviteRelationship, setInviteRelationship] = React.useState("");
  const [sending, setSending] = React.useState(false);


  React.useEffect(() => {
    getFamilyMembers()
      .then(setMembers)
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur de chargement"))
      .finally(() => setLoading(false));
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setSending(true);
    try {
      await inviteFamilyMember({
        email: inviteEmail,
        role: inviteRole,
        relationship: inviteRelationship || undefined,
      });
      toast({ title: "Invitation envoyée", description: `Un e-mail a été envoyé à ${inviteEmail}` });
      setInviteOpen(false);
      setInviteEmail("");
      setInviteRelationship("");
    } catch (e) {
      toast({ title: "Erreur", description: e instanceof Error ? e.message : "Impossible d'envoyer l'invitation", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  if (loading) return <FamilySkeleton />;

  if (error) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon"><Users className="size-5" /></EmptyMedia>
          <EmptyTitle>Impossible de charger les membres de la famille</EmptyTitle>
          <EmptyDescription>{error}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Famille</h1>
          <p className="text-muted-foreground text-sm">Gérez les membres de votre famille</p>
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 size-4" />Inviter un membre</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Inviter un membre de la famille</DialogTitle>
              <DialogDescription>Envoyez une invitation par e-mail à un membre de votre famille</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="inviteEmail">Adresse e-mail</Label>
                <Input id="inviteEmail" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="email@exemple.com" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="inviteRole">Rôle</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger id="inviteRole"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrateur</SelectItem>
                    <SelectItem value="member">Membre</SelectItem>
                    <SelectItem value="viewer">Observateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="inviteRelationship">Relation (optionnelle)</Label>
                <Input id="inviteRelationship" value={inviteRelationship} onChange={(e) => setInviteRelationship(e.target.value)} placeholder="Conjoint, Enfant, etc." />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={sending || !inviteEmail}>
                  {sending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}
                  Envoyer l&apos;invitation
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {members.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><UserPlus className="size-5" /></EmptyMedia>
                <EmptyTitle>Aucun membre de la famille</EmptyTitle>
                <EmptyDescription>Invitez les membres de votre famille à rejoindre votre espace.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {members.map((member) => (
            <Card key={member.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="size-10">
                    {member.avatarUrl ? (
                      <img src={member.avatarUrl} alt={member.displayName} className="size-full rounded-full object-cover" />
                    ) : (
                      <AvatarFallback>{member.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                    )}
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{member.displayName}</p>
                      <Badge variant={statusBadge[member.status]?.variant || "secondary"} className="text-[10px] px-1.5 py-0">
                        {statusBadge[member.status]?.label || member.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{member.email}</span>
                      {member.relationship && <><span>·</span><span>{member.relationship}</span></>}
                      <span>·</span><span className="capitalize">{roleLabels[member.role] || member.role}</span>
                    </div>
                  </div>
                </div>
                <span className="text-muted-foreground shrink-0 text-xs">
                  {member.joinedAt
                    ? `Membre depuis ${new Date(member.joinedAt).toLocaleDateString("fr-FR")}`
                    : `Invité le ${new Date(member.invitedAt).toLocaleDateString("fr-FR")}`}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
