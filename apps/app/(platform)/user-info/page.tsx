"use client";

import * as React from "react";
import { Check, Loader2, Mail, Calendar, Shield, User as UserIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Card>
        <CardHeader><Skeleton className="h-5 w-32" /><Skeleton className="h-4 w-48" /></CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
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
          <EmptyMedia variant="icon"><UserIcon className="size-5" /></EmptyMedia>
          <EmptyTitle>Impossible de charger vos informations</EmptyTitle>
          <EmptyDescription>{error}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (!user) return null;

  const initials = (user.displayName || user.email).slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Informations personnelles</h1>
        <p className="text-muted-foreground text-sm">Gérez vos informations personnelles et votre profil</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <Card>
          <CardHeader>
            <CardTitle>Profil</CardTitle>
            <CardDescription>Ces informations sont visibles par les autres utilisateurs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Adresse e-mail</Label>
              <Input id="email" value={user.email} disabled />
              <p className="text-muted-foreground text-xs">L&apos;adresse e-mail ne peut pas être modifiée</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="displayName">Nom d&apos;affichage</Label>
              <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="avatarUrl">Photo de profil (URL)</Label>
              <Input id="avatarUrl" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://example.com/avatar.jpg" />
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Check className="mr-2 size-4" />}
                Enregistrer
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-6">
              <Avatar className="size-20">
                <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="text-center">
                <p className="font-semibold">{user.displayName}</p>
                <p className="text-muted-foreground text-sm">{user.email}</p>
              </div>
              <Badge variant={user.status === "active" ? "default" : "secondary"}>{user.status}</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Détails du compte</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="text-muted-foreground size-4" />
                <span>E-mail {user.emailVerifiedAt ? "vérifié" : "non vérifié"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="text-muted-foreground size-4" />
                <span>Inscrit le {new Date(user.createdAt).toLocaleDateString("fr-FR")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="text-muted-foreground size-4" />
                <span>Mot de passe {user.passwordChangedAt ? "modifié" : "jamais modifié"}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
