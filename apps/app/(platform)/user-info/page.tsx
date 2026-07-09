"use client";

import * as React from "react";
import { Check, Loader2, Mail, Calendar, Shield, User as UserIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { toast } from "@/hooks/use-toast";
import { getMe, updateMe } from "@/lib/api";
import type { User } from "@/lib/api/types";

function UserInfoSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-48 rounded-lg bg-white/5" />
      <div className="grid gap-4 lg:grid-cols-[1fr_250px]">
        <div className="rounded-xl border border-white/6 bg-[#232426] p-4">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-3 w-36 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-28 rounded-xl bg-white/5" />
          <Skeleton className="h-24 rounded-xl bg-white/5" />
        </div>
      </div>
    </div>
  );
}

export default function UserInfoPage() {
  const [user, setUser] = React.useState<User | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [displayName, setDisplayName] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState("");

  React.useEffect(() => {
    getMe()
      .then((u) => {
        setUser(u);
        setDisplayName(u.displayName);
        setAvatarUrl(u.avatarUrl || "");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur de chargement"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateMe({ displayName, avatarUrl: avatarUrl || undefined });
      setUser(updated);
      toast({ title: "Profil mis à jour", description: "Vos informations ont été enregistrées." });
    } catch (e) {
      toast({ title: "Erreur", description: e instanceof Error ? e.message : "Impossible de sauvegarder", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <UserInfoSkeleton />;

  if (error) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon"><UserIcon className="size-4" /></EmptyMedia>
          <EmptyTitle>Impossible de charger vos informations</EmptyTitle>
          <EmptyDescription>{error}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (!user) return null;

  const initials = (user.displayName || user.email).slice(0, 2).toUpperCase();

  return (
    <div className="mx-auto w-full max-w-5xl px-3 py-4 sm:px-4 sm:py-6">
      <div className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">Informations personnelles</h1>
        <p className="text-xs text-zinc-400 sm:text-sm">Gérez vos informations personnelles et votre profil</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_250px]">
        <div className="rounded-xl border border-white/6 bg-[#232426] p-4">
          <h2 className="text-sm font-semibold text-white mb-1">Profil</h2>
          <p className="text-xs text-zinc-500 mb-4">Ces informations sont visibles par les autres utilisateurs</p>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium">Adresse e-mail</Label>
              <Input 
                id="email" 
                value={user.email} 
                disabled 
                className="bg-[#26272a] border-white/6 text-white placeholder:text-zinc-500 text-xs"
              />
              <p className="text-xs text-zinc-600">L'adresse e-mail ne peut pas être modifiée</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="displayName" className="text-xs font-medium">Nom d'affichage</Label>
              <Input 
                id="displayName" 
                value={displayName} 
                onChange={(e) => setDisplayName(e.target.value)}
                className="bg-[#26272a] border-white/6 text-white placeholder:text-zinc-500 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="avatarUrl" className="text-xs font-medium">Photo de profil (URL)</Label>
              <Input 
                id="avatarUrl" 
                value={avatarUrl} 
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="bg-[#26272a] border-white/6 text-white placeholder:text-zinc-500 text-xs"
              />
            </div>
            <div className="flex justify-end pt-1">
              <Button onClick={handleSave} disabled={saving} className="text-xs h-7">
                {saving ? <Loader2 className="mr-1 size-3.5 animate-spin" /> : <Check className="mr-1 size-3.5" />}
                Enregistrer
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-white/6 bg-[#232426] p-4">
            <div className="flex flex-col items-center gap-3">
              <Avatar className="size-16">
                <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                <AvatarFallback className="text-base">{initials}</AvatarFallback>
              </Avatar>
              <div className="text-center">
                <p className="text-sm font-semibold text-white">{user.displayName}</p>
                <p className="text-xs text-zinc-500">{user.email}</p>
              </div>
              <Badge variant={user.status === "active" ? "default" : "secondary"} className="text-xs px-2 py-0.5">
                {user.status}
              </Badge>
            </div>
          </div>

          <div className="rounded-xl border border-white/6 bg-[#232426] p-4">
            <h3 className="text-xs font-semibold text-white mb-3">Détails du compte</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <Mail className="text-zinc-400 size-3.5" />
                <span className="text-zinc-300">E-mail {user.emailVerifiedAt ? "vérifié" : "non vérifié"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="text-zinc-400 size-3.5" />
                <span className="text-zinc-300">Inscrit le {new Date(user.createdAt).toLocaleDateString("fr-FR")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="text-zinc-400 size-3.5" />
                <span className="text-zinc-300">Mot de passe {user.passwordChangedAt ? "modifié" : "jamais modifié"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
