"use client";

import * as React from "react";
import { Eye, EyeOff, KeyRound, Loader2, Lock, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { authApi } from "@/lib/api";

function PasswordSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-32 rounded-lg bg-white/5" />
      <div className="grid gap-4 lg:grid-cols-[1fr_250px]">
        <div className="rounded-xl border border-white/6 bg-[#232426] p-4">
          <Skeleton className="h-4 w-36 mb-3" />
          <Skeleton className="h-3 w-48 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-white/6 bg-[#232426] p-4">
          <Skeleton className="h-4 w-32 mb-3" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PasswordPage() {
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(false);
  }, []);

  const strength = getPasswordStrength(newPassword);
  const meetsMinLength = newPassword.length >= 12;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasDigit = /\d/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPassword) { setError("Le mot de passe actuel est requis."); return; }
    if (newPassword.length < 12) { setError("Le mot de passe doit contenir au moins 12 caractères."); return; }
    if (newPassword !== confirmPassword) { setError("Les mots de passe ne correspondent pas."); return; }

    setSaving(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      toast({ title: "Mot de passe modifié", description: "Votre mot de passe a été mis à jour avec succès." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de la modification du mot de passe");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PasswordSkeleton />;

  return (
    <div className="mx-auto w-full max-w-5xl px-3 py-4 sm:px-4 sm:py-6">
      <div className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">Mot de passe</h1>
        <p className="text-xs text-zinc-400 sm:text-sm">Modifiez votre mot de passe de connexion</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_250px]">
        <div className="rounded-xl border border-white/6 bg-[#232426] p-4">
          <h2 className="text-sm font-semibold text-white mb-1">Changer le mot de passe</h2>
          <p className="text-xs text-zinc-500 mb-4">Utilisez un mot de passe fort que vous n'utilisez pas ailleurs</p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword" className="text-xs font-medium">Mot de passe actuel</Label>
              <div className="relative">
                <Input 
                  id="currentPassword" 
                  type={showCurrent ? "text" : "password"} 
                  value={currentPassword} 
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="bg-[#26272a] border-white/6 text-white placeholder:text-zinc-500 text-xs h-8"
                />
                <button type="button" className="absolute inset-y-0 right-3 flex items-center text-zinc-400" onClick={() => setShowCurrent(!showCurrent)}>
                  {showCurrent ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="newPassword" className="text-xs font-medium">Nouveau mot de passe</Label>
              <div className="relative">
                <Input 
                  id="newPassword" 
                  type={showNew ? "text" : "password"} 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-[#26272a] border-white/6 text-white placeholder:text-zinc-500 text-xs h-8"
                />
                <button type="button" className="absolute inset-y-0 right-3 flex items-center text-zinc-400" onClick={() => setShowNew(!showNew)}>
                  {showNew ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
              </div>
              {newPassword.length > 0 && (
                <div className="mt-1.5 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= strength ? "bg-[#7775ff]" : "bg-white/6"}`} />
                    ))}
                  </div>
                  <ul className="space-y-0.5 text-xs">
                    <li className={meetsMinLength ? "text-emerald-400" : "text-zinc-500"}>{meetsMinLength ? "✓" : "○"} Au moins 12 caractères</li>
                    <li className={hasUpper && hasLower ? "text-emerald-400" : "text-zinc-500"}>{hasUpper && hasLower ? "✓" : "○"} Majuscules et minuscules</li>
                    <li className={hasDigit ? "text-emerald-400" : "text-zinc-500"}>{hasDigit ? "✓" : "○"} Au moins 1 chiffre</li>
                    <li className={hasSpecial ? "text-emerald-400" : "text-zinc-500"}>{hasSpecial ? "✓" : "○"} Au moins 1 caractère spécial</li>
                  </ul>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-xs font-medium">Confirmer le nouveau mot de passe</Label>
              <Input 
                id="confirmPassword" 
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-[#26272a] border-white/6 text-white placeholder:text-zinc-500 text-xs h-8"
              />
              {confirmPassword.length > 0 && (
                <p className={`text-xs ${passwordsMatch ? "text-emerald-400" : "text-amber-400"}`}>
                  {passwordsMatch ? "✓ Les mots de passe correspondent" : "✗ Les mots de passe ne correspondent pas"}
                </p>
              )}
            </div>

            {error && (
              <div className="bg-amber-500/10 text-amber-400 rounded-lg px-3 py-2 text-xs">{error}</div>
            )}

            <div className="flex justify-end pt-1">
              <Button type="submit" disabled={saving || !passwordsMatch || !meetsMinLength} className="text-xs h-7">
                {saving ? <Loader2 className="mr-1 size-3.5 animate-spin" /> : <Lock className="mr-1 size-3.5" />}
                Modifier
              </Button>
            </div>
          </form>
        </div>

        <div className="rounded-xl border border-white/6 bg-[#232426] p-4">
          <h3 className="text-xs font-semibold text-white mb-3 flex items-center gap-1.5">
            <ShieldCheck className="size-3.5" /> Conseils de sécurité
          </h3>
          <div className="space-y-2 text-xs text-zinc-400">
            <p>✓ Utilisez un mot de passe unique pour ce compte</p>
            <p>✓ Évitez les informations personnelles</p>
            <p>✓ Activez l'authentification à deux facteurs</p>
            <p>✓ Changez votre mot de passe régulièrement</p>
            <p>✓ Ne partagez jamais votre mot de passe</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function getPasswordStrength(password: string): number {
  let score = 0;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}
